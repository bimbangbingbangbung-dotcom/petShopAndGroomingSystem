// Auto-save plugin
// Commits every change and pushes it to GitHub shortly after each OpenCode
// turn finishes (when a session goes idle). Files are never left unsaved.

interface GitResult {
  code: number
  out: string
}

interface AutosaveEvent {
  type?: string
  status?: { type?: string }
}

interface AutosaveContext {
  location: { directory: string }
  event?: {
    subscribe(options: { signal: AbortSignal }): AsyncIterable<AutosaveEvent>
  }
}

const DEBOUNCE_MS = 2000
const GIT_TIMEOUT_MS = 60_000

export default {
  id: "autosave",
  async setup(raw: unknown) {
    const ctx = raw as AutosaveContext
    const subscribe = ctx.event?.subscribe
    if (typeof subscribe !== "function" || !ctx.location?.directory) return

    const cwd = ctx.location.directory
    let timer: ReturnType<typeof setTimeout> | undefined
    let queue: Promise<void> = Promise.resolve()

    const git = async (...args: string[]): Promise<GitResult> => {
      const proc = Bun.spawn(["git", ...args], {
        cwd,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: "0",
          GCM_INTERACTIVE: "Never",
        },
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

    const log = (message: string, error?: boolean) => {
      const line = `[autosave] ${message}`
      if (error) console.error(line)
      else console.log(line)
    }

    const sync = async () => {
      const add = await git("add", "-A")
      if (add.code !== 0) return log(`git add failed: ${add.out}`, true)

      let staged = false
      const diff = await git("diff", "--cached", "--quiet")
      if (diff.code === 1) staged = true
      else if (diff.code !== 0) return log(`git diff failed: ${diff.out}`, true)

      if (staged) {
        const stamp = new Date().toISOString().slice(0, 19).replace("T", " ")
        const commit = await git("commit", "-m", `chore: auto-save ${stamp} UTC`)
        if (commit.code !== 0) return log(`git commit failed: ${commit.out}`, true)
        log(`committed changes (${stamp} UTC)`)
      }

      const remote = await git("remote", "get-url", "origin")
      if (remote.code !== 0) return // no remote configured, nothing to push

      const push = await git("push")
      if (push.code !== 0) return log(`push failed: ${push.out}`, true)
      if (staged) log("pushed to GitHub")
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        queue = queue.then(() =>
          sync().catch((error) => log(error instanceof Error ? error.message : String(error), true)),
        )
      }, DEBOUNCE_MS)
    }

    const controller = new AbortController()
    void (async () => {
      for await (const event of subscribe({ signal: controller.signal })) {
        const idle =
          event.type === "session.idle" ||
          (event.type === "session.status" && event.status?.type === "idle")
        if (idle) schedule()
      }
    })().catch((error) => log(`event stream ended: ${String(error)}`, true))

    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  },
}
