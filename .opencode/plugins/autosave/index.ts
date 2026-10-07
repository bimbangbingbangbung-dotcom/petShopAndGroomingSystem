// Auto-save plugin
// Commits and pushes every change to GitHub shortly after work quiets down.
// Two triggers so a single API mismatch can't silently disable saving:
//   1. session idle events  (agent finished a turn)
//   2. tool execute-after    (any file-changing tool call, debounced)
// Diagnostics are written to .opencode/state.json (gitignored).

import { writeFile, mkdir } from "node:fs/promises"
import * as path from "node:path"

interface GitResult {
  code: number
  out: string
}

interface AutosaveContext {
  location?: { directory?: string }
  event?: {
    subscribe(options: { signal: AbortSignal }): AsyncIterable<unknown>
  }
  tool?: {
    hook(
      name: string,
      callback: (event: unknown) => void | Promise<void>,
    ): Promise<{ dispose(): Promise<void> }>
  }
}

const IDLE_DEBOUNCE_MS = 1500
const TOOL_DEBOUNCE_MS = 4000
const GIT_TIMEOUT_MS = 60_000

type State = {
  setupAt: string
  directory: string
  eventSubscribed: boolean
  toolHookRegistered: boolean
  setupError: string
  eventsSeen: string[]
  lastRun: {
    at: string
    trigger: string
    outcome: string
  } | null
}

export default {
  id: "autosave",
  async setup(raw: unknown) {
    const ctx = raw as AutosaveContext
    const cwd = ctx.location?.directory
    if (!cwd) return

    const statePath = path.join(cwd, ".opencode", "state.json")
    const state: State = {
      setupAt: new Date().toISOString(),
      directory: cwd,
      eventSubscribed: false,
      toolHookRegistered: false,
      setupError: "",
      eventsSeen: [],
      lastRun: null,
    }

    const flush = async () => {
      try {
        await mkdir(path.dirname(statePath), { recursive: true })
        await writeFile(statePath, JSON.stringify(state, null, 2))
      } catch {
        // diagnostics only — never fail the plugin over them
      }
    }

    let queue: Promise<void> = Promise.resolve()
    let timer: ReturnType<typeof setTimeout> | undefined

    const git = async (...args: string[]): Promise<GitResult> => {
      const proc = Bun.spawn(["git", ...args], {
        cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" },
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore",
      })
      const kill = setTimeout(() => proc.kill(), GIT_TIMEOUT_MS)
      const [stdout, stderr, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      clearTimeout(kill)
      return { code, out: `${stdout}${stderr}`.trim() }
    }

    const sync = async (trigger: string) => {
      // One cheap call: working-tree changes + ahead/behind of the upstream.
      const status = await git("status", "--porcelain=v1", "--branch")
      if (status.code !== 0) {
        state.lastRun = { at: new Date().toISOString(), trigger, outcome: `git status failed: ${status.out}` }
        await flush()
        return
      }
      const lines = status.out.split("\n").filter(Boolean)
      const branch = lines.find((l) => l.startsWith("## ")) ?? ""
      const changed = lines.filter((l) => !l.startsWith("## "))
      const ahead = /\[ahead (\d+)\]/.exec(branch)?.[1]

      if (changed.length === 0 && !ahead) {
        state.lastRun = { at: new Date().toISOString(), trigger, outcome: "clean — nothing to do" }
        await flush()
        return
      }

      if (changed.length > 0) {
        const add = await git("add", "-A")
        if (add.code !== 0) {
          state.lastRun = { at: new Date().toISOString(), trigger, outcome: `git add failed: ${add.out}` }
          await flush()
          return
        }
        const stamp = new Date().toISOString().slice(0, 19).replace("T", " ")
        const commit = await git("commit", "-m", `chore: auto-save ${stamp} UTC`)
        if (commit.code !== 0) {
          state.lastRun = { at: new Date().toISOString(), trigger, outcome: `git commit failed: ${commit.out}` }
          await flush()
          return
        }
        console.log(`[autosave] committed ${changed.length} path(s) (${stamp} UTC)`)
      }

      const remote = await git("remote", "get-url", "origin")
      if (remote.code !== 0) {
        state.lastRun = { at: new Date().toISOString(), trigger, outcome: "committed, no remote configured" }
        await flush()
        return
      }
      const push = await git("push")
      const outcome =
        push.code === 0
          ? "pushed to GitHub"
          : `push failed: ${push.out.slice(0, 300)}`
      if (push.code !== 0) console.error(`[autosave] ${outcome}`)
      state.lastRun = { at: new Date().toISOString(), trigger, outcome }
      await flush()
    }

    const schedule = (trigger: string, delay: number) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        queue = queue.then(() =>
          sync(trigger).catch((error) => {
            console.error(`[autosave] ${String(error)}`)
            state.lastRun = {
              at: new Date().toISOString(),
              trigger,
              outcome: `error: ${error instanceof Error ? error.message : String(error)}`,
            }
            return flush()
          }),
        )
      }, delay)
    }

    // --- trigger 1: event stream (session idle) ---
    const controller = new AbortController()
    try {
      if (ctx.event && typeof ctx.event.subscribe === "function") {
        const iterator = ctx.event.subscribe.call(ctx.event, { signal: controller.signal })
        state.eventSubscribed = true
        void (async () => {
          for await (const event of iterator as AsyncIterable<Record<string, unknown>>) {
            const type = String(event?.type ?? "unknown")
            if (state.eventsSeen.length < 12 && !state.eventsSeen.includes(type)) {
              state.eventsSeen.push(type)
              await flush()
            }
            const status = event?.status as { type?: string } | undefined
            if (type === "session.idle" || (type === "session.status" && status?.type === "idle")) {
              schedule("session-idle", IDLE_DEBOUNCE_MS)
            }
          }
        })().catch((error) => {
          state.setupError = `event stream: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    } catch (error) {
      state.setupError = `event subscribe: ${error instanceof Error ? error.message : String(error)}`
    }

    // --- trigger 2: after any tool executes (covers file edits directly) ---
    try {
      if (ctx.tool && typeof ctx.tool.hook === "function") {
        await ctx.tool.hook.call(ctx.tool, "execute.after", () => {
          schedule("tool-executed", TOOL_DEBOUNCE_MS)
        })
        state.toolHookRegistered = true
      }
    } catch (error) {
      state.setupError += ` | tool hook: ${error instanceof Error ? error.message : String(error)}`
    }

    await flush()
    console.log(
      `[autosave] active (events=${state.eventSubscribed}, toolHook=${state.toolHookRegistered})`,
    )

    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  },
}
