/// <reference lib="dom" />

import getCallsites, { CallSite } from "callsites"
import { cpus } from 'os'
import * as path from "path"
import { fileURLToPath } from "url";
import {
  ImplementationExport,
  ThreadsWorkerOptions,
  WorkerImplementation
} from "../types/master"

declare const __non_webpack_require__: typeof require

type TsRuntime = "tsx" | "ts-node"
let detectedTsRuntime: TsRuntime | null | undefined

export const defaultPoolSize = cpus().length

/**
 * Detects an available TypeScript runtime so `.ts`/`.tsx` worker files can be
 * spawned directly during development. Prefers `tsx`, falls back to `ts-node`.
 */
function detectTsRuntime(): TsRuntime | null {
  if (typeof __non_webpack_require__ === "function") {
    // Webpack build: => No TS runtime required or possible
    return null
  }
  if (detectedTsRuntime !== undefined) {
    return detectedTsRuntime
  }

  detectedTsRuntime = null
  for (const candidate of ["tsx", "ts-node"] as TsRuntime[]) {
    try {
      eval("require").resolve(candidate)
      detectedTsRuntime = candidate
      break
    } catch (error) {
      if (error && (error as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
        continue
      }
      // Re-throw
      throw error
    }
  }
  return detectedTsRuntime
}

function createTsRuntimeModule(scriptPath: string, runtime: TsRuntime) {
  const register = runtime === "tsx"
    ? `require("tsx/cjs");`
    : `require("ts-node/register/transpile-only");`
  const content = `
    ${register}
    require(${JSON.stringify(scriptPath)});
  `
  return content
}

function rebaseScriptPath(scriptPath: string, ignoreRegex: RegExp) {
  const parentCallSite = getCallsites().find((callsite: CallSite) => {
    const filename = callsite.getFileName()
    return Boolean(
      filename &&
      !filename.match(ignoreRegex) &&
      !filename.match(/[/\\]master[/\\]implementation/) &&
      !filename.match(/^internal\/process/)
    )
  })

  const rawCallerPath = parentCallSite ? parentCallSite.getFileName() : null
  let callerPath = rawCallerPath ? rawCallerPath : null;
  if (callerPath && callerPath.startsWith('file:')) {
    callerPath = fileURLToPath(callerPath);
  }
  const rebasedScriptPath = callerPath ? path.join(path.dirname(callerPath), scriptPath) : scriptPath

  return rebasedScriptPath
}

function resolveScriptPath(scriptPath: string, baseURL?: string | undefined) {
  const makeRelative = (filePath: string) => {
    // eval() hack is also webpack-related
    return path.isAbsolute(filePath) ? filePath : path.join(baseURL || eval("__dirname"), filePath)
  }

  const workerFilePath = typeof __non_webpack_require__ === "function"
    ? __non_webpack_require__.resolve(makeRelative(scriptPath))
    : eval("require").resolve(makeRelative(rebaseScriptPath(scriptPath, /[/\\]worker_threads[/\\]/)))

  return workerFilePath
}

function initWorkerThreadsWorker(): ImplementationExport {
  // Webpack hack
  const NativeWorker = typeof __non_webpack_require__ === "function"
    ? __non_webpack_require__("worker_threads").Worker
    : eval("require")("worker_threads").Worker

  let allWorkers: Array<typeof NativeWorker> = []

  class Worker extends NativeWorker {
    private mappedEventListeners: WeakMap<EventListener, EventListener>

    constructor(scriptPath: string | URL, options?: ThreadsWorkerOptions & { fromSource: boolean }) {
      // Bundlers like webpack 5 pass a `URL` (from `new Worker(new URL(...))`)
      // pointing at the emitted worker chunk.
      const normalizedScriptPath = scriptPath instanceof URL ? fileURLToPath(scriptPath) : scriptPath

      const resolvedScriptPath = options && options.fromSource
        ? null
        : resolveScriptPath(normalizedScriptPath, (options || {})._baseURL)

      const tsRuntime = resolvedScriptPath && /\.tsx?$/i.test(resolvedScriptPath) ? detectTsRuntime() : null

      if (!resolvedScriptPath) {
        // `options.fromSource` is true
        const sourceCode = scriptPath
        super(sourceCode, { ...options, eval: true })
      } else if (tsRuntime) {
        super(createTsRuntimeModule(resolvedScriptPath, tsRuntime), { ...options, eval: true })
      } else if (resolvedScriptPath.match(/\.asar[/\\]/)) {
        // See <https://github.com/andywer/threads-plugin/issues/17>
        super(resolvedScriptPath.replace(/\.asar([/\\])/, ".asar.unpacked$1"), options)
      } else {
        super(resolvedScriptPath, options)
      }

      this.mappedEventListeners = new WeakMap()
      allWorkers.push(this)
    }

    public addEventListener(eventName: string, rawListener: EventListener) {
      const listener = (message: any) => {
        rawListener({ data: message } as any)
      }
      this.mappedEventListeners.set(rawListener, listener)
      this.on(eventName, listener)
    }

    public removeEventListener(eventName: string, rawListener: EventListener) {
      const listener = this.mappedEventListeners.get(rawListener) || rawListener
      this.off(eventName, listener)
    }
  }

  const terminateWorkersAndMaster = () => {
    // we should terminate all workers and then gracefully shutdown self process
    Promise.all(allWorkers.map(worker => worker.terminate())).then(
      () => process.exit(0),
      () => process.exit(1),
    )
    allWorkers = []
  }

  // Take care to not leave orphaned processes behind. See #147.
  process.on("SIGINT", () => terminateWorkersAndMaster())
  process.on("SIGTERM", () => terminateWorkersAndMaster())

  class BlobWorker extends Worker {
    constructor(blob: Uint8Array, options?: ThreadsWorkerOptions) {
      super(Buffer.from(blob).toString("utf-8"), { ...options, fromSource: true })
    }

    public static fromText(source: string, options?: ThreadsWorkerOptions): WorkerImplementation {
      return new Worker(source, { ...options, fromSource: true }) as any
    }
  }

  return {
    blob: BlobWorker as any,
    default: Worker as any
  }
}

let implementation: ImplementationExport

function selectWorkerImplementation(): ImplementationExport {
  return initWorkerThreadsWorker()
}

export function getWorkerImplementation(): ImplementationExport {
  if (!implementation) {
    implementation = selectWorkerImplementation()
  }
  return implementation
}

export function isWorkerRuntime() {
  // Webpack hack
  const isMainThread = typeof __non_webpack_require__ === "function"
    ? __non_webpack_require__("worker_threads").isMainThread
    : eval("require")("worker_threads").isMainThread
  return !isMainThread
}
