import { execFile, ExecFileOptions } from "child_process"

export interface ExecResult {
  exitCode: number
  stdout: string
  stderr: string
}

/**
 * Runs a command and resolves with its exit code and captured output. Never
 * rejects — a non-zero exit is reported via `exitCode` — so callers assert on
 * the result directly. Replaces `execa` in the test suites with Node built-ins.
 */
export function run(command: string, args: string[], options: ExecFileOptions = {}): Promise<ExecResult> {
  return new Promise(resolve => {
    execFile(command, args, { encoding: "utf8", ...options }, (error, stdout, stderr) => {
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
