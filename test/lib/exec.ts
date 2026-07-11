import { execFile, ExecFileOptions } from "child_process"

export interface ExecResult {
  exitCode: number
  stdout: string
  stderr: string
}

// On Windows the locally-installed binaries (e.g. `tsc`) are `.cmd` shims, which
// `execFile` cannot launch without a shell. Run through the shell there — and
// quote arguments so paths containing spaces survive — mirroring what execa did.
const isWindows = process.platform === "win32"

function quoteForShell(arg: string): string {
  return /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg
}

/**
 * Runs a command and resolves with its exit code and captured output. Never
 * rejects — a non-zero exit is reported via `exitCode` — so callers assert on
 * the result directly. Replaces `execa` in the test suites with Node built-ins.
 */
export function run(command: string, args: string[], options: ExecFileOptions = {}): Promise<ExecResult> {
  const useShell = isWindows
  const runArgs = useShell ? args.map(quoteForShell) : args
  return new Promise(resolve => {
    execFile(command, runArgs, { encoding: "utf8", shell: useShell, ...options }, (error, stdout, stderr) => {
      const code = error && typeof (error as NodeJS.ErrnoException & { code?: unknown }).code === "number"
        ? Number((error as unknown as { code: number }).code)
        : error ? 1 : 0
      resolve({
        exitCode: code,
        stdout: typeof stdout === "string" ? stdout : stdout.toString(),
        stderr: typeof stderr === "string" ? stderr : stderr.toString()
      })
    })
  })
}
