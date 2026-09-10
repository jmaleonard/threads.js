"use strict";
(() => {
  // ../../dist-esm/serializers.js
  var DefaultErrorSerializer = {
    deserialize(message) {
      return Object.assign(Error(message.message), {
        name: message.name,
        stack: message.stack
      });
    },
    serialize(error) {
      return {
        __error_marker: "$$error",
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }
  };
  var isSerializedError = (thing) => thing && typeof thing === "object" && "__error_marker" in thing && thing.__error_marker === "$$error";
  var DefaultSerializer = {
    deserialize(message) {
      if (isSerializedError(message)) {
        return DefaultErrorSerializer.deserialize(message);
      } else {
        return message;
      }
    },
    serialize(input) {
      if (input instanceof Error) {
        return DefaultErrorSerializer.serialize(input);
      } else {
        return input;
      }
    }
  };

  // ../../dist-esm/common.js
  var registeredSerializer = DefaultSerializer;
  function deserialize(message) {
    return registeredSerializer.deserialize(message);
  }
  function serialize(input) {
    return registeredSerializer.serialize(input);
  }

  // ../../dist-esm/types/messages.js
  var MasterMessageType;
  (function(MasterMessageType2) {
    MasterMessageType2["bye"] = "bye";
    MasterMessageType2["cancel"] = "cancel";
    MasterMessageType2["run"] = "run";
  })(MasterMessageType || (MasterMessageType = {}));
  var WorkerMessageType;
  (function(WorkerMessageType2) {
    WorkerMessageType2["broadcast"] = "broadcast";
    WorkerMessageType2["error"] = "error";
    WorkerMessageType2["init"] = "init";
    WorkerMessageType2["result"] = "result";
    WorkerMessageType2["running"] = "running";
    WorkerMessageType2["uncaughtError"] = "uncaughtError";
  })(WorkerMessageType || (WorkerMessageType = {}));

  // ../../dist-esm/symbols.js
  var $broadcasts = Symbol("thread.broadcasts");
  var $errors = Symbol("thread.errors");
  var $events = Symbol("thread.events");
  var $terminate = Symbol("thread.terminate");
  var $transferable = Symbol("thread.transferable");
  var $worker = Symbol("thread.worker");

  // ../../dist-esm/transferable.js
  function isTransferDescriptor(thing) {
    return thing && typeof thing === "object" && thing[$transferable];
  }

  // ../../dist-esm/worker/connection.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var isMasterJobCancelMessage = (thing) => thing && thing.type === MasterMessageType.cancel;
  var isMasterJobRunMessage = (thing) => thing && thing.type === MasterMessageType.run;
  function isInteropObservable(thing) {
    if (!thing) {
      return false;
    }
    const observableSymbol = Symbol.observable;
    if (typeof observableSymbol === "symbol" && typeof thing[observableSymbol] === "function") {
      return thing === thing[observableSymbol]();
    }
    if (typeof thing["@@observable"] === "function") {
      return thing === thing["@@observable"]();
    }
    return false;
  }
  var isObservable = (thing) => isInteropObservable(thing) || isZenObservable(thing);
  function isZenObservable(thing) {
    return thing && typeof thing === "object" && typeof thing.subscribe === "function";
  }
  function deconstructTransfer(thing) {
    return isTransferDescriptor(thing) ? { payload: thing.send, transferables: thing.transferables } : { payload: thing, transferables: void 0 };
  }
  function createInitMessage(exposed) {
    if (typeof exposed === "function") {
      return {
        type: WorkerMessageType.init,
        exposed: {
          type: "function"
        }
      };
    }
    const methodNames = Object.keys(exposed).filter((key) => typeof exposed[key] === "function");
    return {
      type: WorkerMessageType.init,
      exposed: {
        type: "module",
        methods: methodNames
      }
    };
  }
  function createConnection(exposed, post) {
    const activeSubscriptions = /* @__PURE__ */ new Map();
    function postJobErrorMessage(uid, rawError) {
      const { payload: error, transferables } = deconstructTransfer(rawError);
      const errorMessage = {
        type: WorkerMessageType.error,
        uid,
        error: serialize(error)
      };
      post(errorMessage, transferables);
    }
    function postJobResultMessage(uid, completed, resultValue) {
      const { payload, transferables } = deconstructTransfer(resultValue);
      const resultMessage = {
        type: WorkerMessageType.result,
        uid,
        complete: completed ? true : void 0,
        payload
      };
      post(resultMessage, transferables);
    }
    function postJobStartMessage(uid, resultType) {
      const startMessage = {
        type: WorkerMessageType.running,
        uid,
        resultType
      };
      post(startMessage);
    }
    function runFunction(jobUID, fn, args) {
      return __awaiter(this, void 0, void 0, function* () {
        let syncResult;
        try {
          syncResult = fn(...args);
        } catch (error) {
          return postJobErrorMessage(jobUID, error);
        }
        const resultType = isObservable(syncResult) ? "observable" : "promise";
        postJobStartMessage(jobUID, resultType);
        if (isObservable(syncResult)) {
          const subscription = syncResult.subscribe((value) => postJobResultMessage(jobUID, false, serialize(value)), (error) => {
            postJobErrorMessage(jobUID, serialize(error));
            activeSubscriptions.delete(jobUID);
          }, () => {
            postJobResultMessage(jobUID, true);
            activeSubscriptions.delete(jobUID);
          });
          activeSubscriptions.set(jobUID, subscription);
        } else {
          try {
            const result = yield syncResult;
            postJobResultMessage(jobUID, true, serialize(result));
          } catch (error) {
            postJobErrorMessage(jobUID, serialize(error));
          }
        }
      });
    }
    function handleMessage(messageData) {
      if (isMasterJobRunMessage(messageData)) {
        if (typeof exposed === "function") {
          if (!messageData.method) {
            runFunction(messageData.uid, exposed, messageData.args.map(deserialize));
          }
        } else if (messageData.method) {
          runFunction(messageData.uid, exposed[messageData.method], messageData.args.map(deserialize));
        }
      } else if (isMasterJobCancelMessage(messageData)) {
        const subscription = activeSubscriptions.get(messageData.uid);
        if (subscription) {
          subscription.unsubscribe();
          activeSubscriptions.delete(messageData.uid);
        }
      }
    }
    function dispose() {
      for (const subscription of activeSubscriptions.values()) {
        subscription.unsubscribe();
      }
      activeSubscriptions.clear();
    }
    return { handleMessage, dispose };
  }

  // ../../dist-esm/worker/implementation.browser.js
  var isWorkerRuntime = function isWorkerRuntime2() {
    const isWindowContext = typeof self !== "undefined" && typeof Window !== "undefined" && self instanceof Window;
    return typeof self !== "undefined" && typeof self.postMessage === "function" && !isWindowContext;
  };
  var postMessageToMaster = function postMessageToMaster2(data, transferList) {
    self.postMessage(data, transferList);
  };
  var subscribeToMasterMessages = function subscribeToMasterMessages2(onMessage) {
    const messageHandler = (messageEvent) => {
      onMessage(messageEvent.data);
    };
    const unsubscribe = () => {
      self.removeEventListener("message", messageHandler);
    };
    self.addEventListener("message", messageHandler);
    return unsubscribe;
  };
  var implementation_browser_default = {
    isWorkerRuntime,
    postMessageToMaster,
    subscribeToMasterMessages
  };

  // ../../dist-esm/worker/expose-shared.js
  var isByeMessage = (data) => data && data.type === MasterMessageType.bye;
  function isSharedWorkerScope() {
    return typeof self !== "undefined" && "onconnect" in self;
  }
  function isDedicatedWorkerScope() {
    const isWindowContext = typeof self !== "undefined" && typeof Window !== "undefined" && self instanceof Window;
    return typeof self !== "undefined" && typeof self.postMessage === "function" && !isWindowContext;
  }
  var exposeSharedCalled = false;
  function exposeShared(exposed) {
    if (exposeSharedCalled) {
      throw Error("exposeShared() called more than once. Pass an object to exposeShared() if you want to expose multiple functions.");
    }
    if (typeof exposed !== "function" && (typeof exposed !== "object" || !exposed)) {
      throw Error(`Invalid argument passed to exposeShared(). Expected a function or an object, got: ${exposed}`);
    }
    if (isSharedWorkerScope()) {
      exposeSharedCalled = true;
      return exposeInSharedScope(exposed);
    }
    if (isDedicatedWorkerScope()) {
      exposeSharedCalled = true;
      return exposeInDedicatedScope(exposed);
    }
    throw Error("exposeShared() must be called inside a SharedWorker or Worker. It was called in the master thread or in a non-worker environment (Node has no SharedWorker support).");
  }
  function exposeInSharedScope(exposed) {
    const ports = /* @__PURE__ */ new Set();
    const initMessage = createInitMessage(exposed);
    self.addEventListener("connect", (event) => {
      const port = event.ports[0];
      const connection = createConnection(exposed, (message) => port.postMessage(message));
      port.addEventListener("message", (messageEvent) => {
        if (isByeMessage(messageEvent.data)) {
          connection.dispose();
          ports.delete(port);
          port.close();
          return;
        }
        connection.handleMessage(messageEvent.data);
      });
      port.start();
      ports.add(port);
      port.postMessage(initMessage);
    });
    return {
      broadcast(value) {
        const message = { type: WorkerMessageType.broadcast, payload: serialize(value) };
        for (const port of ports) {
          port.postMessage(message);
        }
      },
      connectionCount() {
        return ports.size;
      }
    };
  }
  function exposeInDedicatedScope(exposed) {
    const scope = self;
    const connection = createConnection(exposed, (message, transferList) => scope.postMessage(message, transferList));
    scope.addEventListener("message", (messageEvent) => {
      connection.handleMessage(messageEvent.data);
    });
    scope.postMessage(createInitMessage(exposed));
    return {
      broadcast(value) {
        scope.postMessage({ type: WorkerMessageType.broadcast, payload: serialize(value) });
      },
      connectionCount() {
        return 1;
      }
    };
  }

  // ../../dist-esm/worker/index.js
  var isWorkerRuntime3 = implementation_browser_default.isWorkerRuntime;
  function postUncaughtErrorMessage(error) {
    try {
      const errorMessage = {
        type: WorkerMessageType.uncaughtError,
        error: serialize(error)
      };
      implementation_browser_default.postMessageToMaster(errorMessage);
    } catch (subError) {
      console.error("Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:", subError, "\nOriginal error:", error);
    }
  }
  if (typeof self !== "undefined" && typeof self.addEventListener === "function" && implementation_browser_default.isWorkerRuntime()) {
    self.addEventListener("error", (event) => {
      setTimeout(() => postUncaughtErrorMessage(event.error || event), 250);
    });
    self.addEventListener("unhandledrejection", (event) => {
      const error = event.reason;
      if (error && typeof error.message === "string") {
        setTimeout(() => postUncaughtErrorMessage(error), 250);
      }
    });
  }
  if (typeof process !== "undefined" && typeof process.on === "function" && implementation_browser_default.isWorkerRuntime()) {
    process.on("uncaughtException", (error) => {
      setTimeout(() => postUncaughtErrorMessage(error), 250);
    });
    process.on("unhandledRejection", (error) => {
      if (error && typeof error.message === "string") {
        setTimeout(() => postUncaughtErrorMessage(error), 250);
      }
    });
  }

  // counter.worker.mjs
  var count = 0;
  var startedAt = (/* @__PURE__ */ new Date()).toISOString();
  var { broadcast, connectionCount } = exposeShared({
    increment() {
      count += 1;
      broadcast({ count, tabs: connectionCount() });
      return count;
    },
    getState() {
      return { count, startedAt, tabs: connectionCount() };
    }
  });
})();
