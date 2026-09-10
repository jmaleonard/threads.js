"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/ms/index.js
  var require_ms = __commonJS({
    "../../node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // ../../node_modules/debug/src/common.js
  var require_common = __commonJS({
    "../../node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
          for (const ns of split) {
            if (ns[0] === "-") {
              createDebug.skips.push(ns.slice(1));
            } else {
              createDebug.names.push(ns);
            }
          }
        }
        function matchesTemplate(search, template) {
          let searchIndex = 0;
          let templateIndex = 0;
          let starIndex = -1;
          let matchIndex = 0;
          while (searchIndex < search.length) {
            if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
              if (template[templateIndex] === "*") {
                starIndex = templateIndex;
                matchIndex = searchIndex;
                templateIndex++;
              } else {
                searchIndex++;
                templateIndex++;
              }
            } else if (starIndex !== -1) {
              templateIndex = starIndex + 1;
              matchIndex++;
              searchIndex = matchIndex;
            } else {
              return false;
            }
          }
          while (templateIndex < template.length && template[templateIndex] === "*") {
            templateIndex++;
          }
          return templateIndex === template.length;
        }
        function disable() {
          const namespaces = [
            ...createDebug.names,
            ...createDebug.skips.map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          for (const skip of createDebug.skips) {
            if (matchesTemplate(name, skip)) {
              return false;
            }
          }
          for (const ns of createDebug.names) {
            if (matchesTemplate(name, ns)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // ../../node_modules/debug/src/browser.js
  var require_browser = __commonJS({
    "../../node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        let m;
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

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

  // ../../dist-esm/errors.js
  var ThreadCloneError = class _ThreadCloneError extends Error {
    constructor(message, cause) {
      super(message);
      this.name = "ThreadCloneError";
      this.cause = cause;
      Object.setPrototypeOf(this, _ThreadCloneError.prototype);
    }
  };
  var SharedWorkerLeaderLostError = class _SharedWorkerLeaderLostError extends Error {
    constructor(message = "The tab hosting the shared worker closed. The worker was restarted; retry the call.") {
      super(message);
      this.name = "SharedWorkerLeaderLostError";
      Object.setPrototypeOf(this, _SharedWorkerLeaderLostError.prototype);
    }
  };
  function isDataCloneError(error) {
    return Boolean(error && typeof error === "object" && error.name === "DataCloneError");
  }

  // ../../dist-esm/master/get-bundle-url.browser.js
  var bundleURL;
  function getBundleURLCached() {
    if (!bundleURL) {
      bundleURL = getBundleURL();
    }
    return bundleURL;
  }
  function getBundleURL() {
    try {
      throw new Error();
    } catch (err) {
      const matches = ("" + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
      if (matches) {
        return getBaseURL(matches[0]);
      }
    }
    return "/";
  }
  function getBaseURL(url) {
    return ("" + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, "$1") + "/";
  }

  // ../../dist-esm/master/implementation.browser.js
  var defaultPoolSize = typeof navigator !== "undefined" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  var isAbsoluteURL = (value) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
  function createSourceBlobURL(code) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
  }
  function selectWorkerImplementation() {
    if (typeof Worker === "undefined") {
      return class NoWebWorker {
        constructor() {
          throw Error("No web worker implementation available. You might have tried to spawn a worker within a worker in a browser that doesn't support workers in workers.");
        }
      };
    }
    class WebWorker extends Worker {
      constructor(url, options) {
        var _a2, _b;
        if (typeof url === "string" && options && options._baseURL) {
          url = new URL(url, options._baseURL);
        } else if (typeof url === "string" && !isAbsoluteURL(url) && getBundleURLCached().match(/^file:\/\//i)) {
          url = new URL(url, getBundleURLCached().replace(/\/[^/]+$/, "/"));
          if ((_a2 = options === null || options === void 0 ? void 0 : options.CORSWorkaround) !== null && _a2 !== void 0 ? _a2 : true) {
            url = createSourceBlobURL(`importScripts(${JSON.stringify(url)});`);
          }
        }
        if (typeof url === "string" && isAbsoluteURL(url)) {
          if ((_b = options === null || options === void 0 ? void 0 : options.CORSWorkaround) !== null && _b !== void 0 ? _b : true) {
            url = createSourceBlobURL(`importScripts(${JSON.stringify(url)});`);
          }
        }
        super(url, options);
      }
    }
    class BlobWorker2 extends WebWorker {
      constructor(blob, options) {
        const url = window.URL.createObjectURL(blob);
        super(url, options);
      }
      static fromText(source, options) {
        const blob = new window.Blob([source], { type: "text/javascript" });
        return new BlobWorker2(blob, options);
      }
    }
    return {
      blob: BlobWorker2,
      default: WebWorker
    };
  }
  var implementation;
  function getWorkerImplementation() {
    if (!implementation) {
      implementation = selectWorkerImplementation();
    }
    return implementation;
  }

  // ../../node_modules/observable-fns/dist.esm/_symbols.js
  var hasSymbols = () => typeof Symbol === "function";
  var hasSymbol = (name) => hasSymbols() && Boolean(Symbol[name]);
  var getSymbol = (name) => hasSymbol(name) ? Symbol[name] : "@@" + name;
  if (!hasSymbol("asyncIterator")) {
    Symbol.asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
  }

  // ../../node_modules/observable-fns/dist.esm/observable.js
  var SymbolIterator = getSymbol("iterator");
  var SymbolObservable = getSymbol("observable");
  var SymbolSpecies = getSymbol("species");
  function getMethod(obj, key) {
    const value = obj[key];
    if (value == null) {
      return void 0;
    }
    if (typeof value !== "function") {
      throw new TypeError(value + " is not a function");
    }
    return value;
  }
  function getSpecies(obj) {
    let ctor = obj.constructor;
    if (ctor !== void 0) {
      ctor = ctor[SymbolSpecies];
      if (ctor === null) {
        ctor = void 0;
      }
    }
    return ctor !== void 0 ? ctor : Observable;
  }
  function isObservable(x) {
    return x instanceof Observable;
  }
  function hostReportError(error) {
    if (hostReportError.log) {
      hostReportError.log(error);
    } else {
      setTimeout(() => {
        throw error;
      }, 0);
    }
  }
  function enqueue(fn) {
    Promise.resolve().then(() => {
      try {
        fn();
      } catch (e) {
        hostReportError(e);
      }
    });
  }
  function cleanupSubscription(subscription) {
    const cleanup = subscription._cleanup;
    if (cleanup === void 0) {
      return;
    }
    subscription._cleanup = void 0;
    if (!cleanup) {
      return;
    }
    try {
      if (typeof cleanup === "function") {
        cleanup();
      } else {
        const unsubscribe2 = getMethod(cleanup, "unsubscribe");
        if (unsubscribe2) {
          unsubscribe2.call(cleanup);
        }
      }
    } catch (e) {
      hostReportError(e);
    }
  }
  function closeSubscription(subscription) {
    subscription._observer = void 0;
    subscription._queue = void 0;
    subscription._state = "closed";
  }
  function flushSubscription(subscription) {
    const queue = subscription._queue;
    if (!queue) {
      return;
    }
    subscription._queue = void 0;
    subscription._state = "ready";
    for (const item of queue) {
      notifySubscription(subscription, item.type, item.value);
      if (subscription._state === "closed") {
        break;
      }
    }
  }
  function notifySubscription(subscription, type, value) {
    subscription._state = "running";
    const observer = subscription._observer;
    try {
      const m = observer ? getMethod(observer, type) : void 0;
      switch (type) {
        case "next":
          if (m)
            m.call(observer, value);
          break;
        case "error":
          closeSubscription(subscription);
          if (m)
            m.call(observer, value);
          else
            throw value;
          break;
        case "complete":
          closeSubscription(subscription);
          if (m)
            m.call(observer);
          break;
      }
    } catch (e) {
      hostReportError(e);
    }
    if (subscription._state === "closed") {
      cleanupSubscription(subscription);
    } else if (subscription._state === "running") {
      subscription._state = "ready";
    }
  }
  function onNotify(subscription, type, value) {
    if (subscription._state === "closed") {
      return;
    }
    if (subscription._state === "buffering") {
      subscription._queue = subscription._queue || [];
      subscription._queue.push({ type, value });
      return;
    }
    if (subscription._state !== "ready") {
      subscription._state = "buffering";
      subscription._queue = [{ type, value }];
      enqueue(() => flushSubscription(subscription));
      return;
    }
    notifySubscription(subscription, type, value);
  }
  var Subscription = class {
    constructor(observer, subscriber) {
      this._cleanup = void 0;
      this._observer = observer;
      this._queue = void 0;
      this._state = "initializing";
      const subscriptionObserver = new SubscriptionObserver(this);
      try {
        this._cleanup = subscriber.call(void 0, subscriptionObserver);
      } catch (e) {
        subscriptionObserver.error(e);
      }
      if (this._state === "initializing") {
        this._state = "ready";
      }
    }
    get closed() {
      return this._state === "closed";
    }
    unsubscribe() {
      if (this._state !== "closed") {
        closeSubscription(this);
        cleanupSubscription(this);
      }
    }
  };
  var SubscriptionObserver = class {
    constructor(subscription) {
      this._subscription = subscription;
    }
    get closed() {
      return this._subscription._state === "closed";
    }
    next(value) {
      onNotify(this._subscription, "next", value);
    }
    error(value) {
      onNotify(this._subscription, "error", value);
    }
    complete() {
      onNotify(this._subscription, "complete");
    }
  };
  var Observable = class _Observable {
    constructor(subscriber) {
      if (!(this instanceof _Observable)) {
        throw new TypeError("Observable cannot be called as a function");
      }
      if (typeof subscriber !== "function") {
        throw new TypeError("Observable initializer must be a function");
      }
      this._subscriber = subscriber;
    }
    subscribe(nextOrObserver, onError, onComplete) {
      if (typeof nextOrObserver !== "object" || nextOrObserver === null) {
        nextOrObserver = {
          next: nextOrObserver,
          error: onError,
          complete: onComplete
        };
      }
      return new Subscription(nextOrObserver, this._subscriber);
    }
    pipe(first, ...mappers) {
      let intermediate = this;
      for (const mapper of [first, ...mappers]) {
        intermediate = mapper(intermediate);
      }
      return intermediate;
    }
    tap(nextOrObserver, onError, onComplete) {
      const tapObserver = typeof nextOrObserver !== "object" || nextOrObserver === null ? {
        next: nextOrObserver,
        error: onError,
        complete: onComplete
      } : nextOrObserver;
      return new _Observable((observer) => {
        return this.subscribe({
          next(value) {
            tapObserver.next && tapObserver.next(value);
            observer.next(value);
          },
          error(error) {
            tapObserver.error && tapObserver.error(error);
            observer.error(error);
          },
          complete() {
            tapObserver.complete && tapObserver.complete();
            observer.complete();
          },
          start(subscription) {
            tapObserver.start && tapObserver.start(subscription);
          }
        });
      });
    }
    forEach(fn) {
      return new Promise((resolve, reject) => {
        if (typeof fn !== "function") {
          reject(new TypeError(fn + " is not a function"));
          return;
        }
        function done() {
          subscription.unsubscribe();
          resolve(void 0);
        }
        const subscription = this.subscribe({
          next(value) {
            try {
              fn(value, done);
            } catch (e) {
              reject(e);
              subscription.unsubscribe();
            }
          },
          error(error) {
            reject(error);
          },
          complete() {
            resolve(void 0);
          }
        });
      });
    }
    map(fn) {
      if (typeof fn !== "function") {
        throw new TypeError(fn + " is not a function");
      }
      const C = getSpecies(this);
      return new C((observer) => this.subscribe({
        next(value) {
          let propagatedValue = value;
          try {
            propagatedValue = fn(value);
          } catch (e) {
            return observer.error(e);
          }
          observer.next(propagatedValue);
        },
        error(e) {
          observer.error(e);
        },
        complete() {
          observer.complete();
        }
      }));
    }
    filter(fn) {
      if (typeof fn !== "function") {
        throw new TypeError(fn + " is not a function");
      }
      const C = getSpecies(this);
      return new C((observer) => this.subscribe({
        next(value) {
          try {
            if (!fn(value))
              return;
          } catch (e) {
            return observer.error(e);
          }
          observer.next(value);
        },
        error(e) {
          observer.error(e);
        },
        complete() {
          observer.complete();
        }
      }));
    }
    reduce(fn, seed) {
      if (typeof fn !== "function") {
        throw new TypeError(fn + " is not a function");
      }
      const C = getSpecies(this);
      const hasSeed = arguments.length > 1;
      let hasValue = false;
      let acc = seed;
      return new C((observer) => this.subscribe({
        next(value) {
          const first = !hasValue;
          hasValue = true;
          if (!first || hasSeed) {
            try {
              acc = fn(acc, value);
            } catch (e) {
              return observer.error(e);
            }
          } else {
            acc = value;
          }
        },
        error(e) {
          observer.error(e);
        },
        complete() {
          if (!hasValue && !hasSeed) {
            return observer.error(new TypeError("Cannot reduce an empty sequence"));
          }
          observer.next(acc);
          observer.complete();
        }
      }));
    }
    concat(...sources) {
      const C = getSpecies(this);
      return new C((observer) => {
        let subscription;
        let index = 0;
        function startNext(next) {
          subscription = next.subscribe({
            next(v) {
              observer.next(v);
            },
            error(e) {
              observer.error(e);
            },
            complete() {
              if (index === sources.length) {
                subscription = void 0;
                observer.complete();
              } else {
                startNext(C.from(sources[index++]));
              }
            }
          });
        }
        startNext(this);
        return () => {
          if (subscription) {
            subscription.unsubscribe();
            subscription = void 0;
          }
        };
      });
    }
    flatMap(fn) {
      if (typeof fn !== "function") {
        throw new TypeError(fn + " is not a function");
      }
      const C = getSpecies(this);
      return new C((observer) => {
        const subscriptions = [];
        const outer = this.subscribe({
          next(value) {
            let normalizedValue;
            if (fn) {
              try {
                normalizedValue = fn(value);
              } catch (e) {
                return observer.error(e);
              }
            } else {
              normalizedValue = value;
            }
            const inner = C.from(normalizedValue).subscribe({
              next(innerValue) {
                observer.next(innerValue);
              },
              error(e) {
                observer.error(e);
              },
              complete() {
                const i = subscriptions.indexOf(inner);
                if (i >= 0)
                  subscriptions.splice(i, 1);
                completeIfDone();
              }
            });
            subscriptions.push(inner);
          },
          error(e) {
            observer.error(e);
          },
          complete() {
            completeIfDone();
          }
        });
        function completeIfDone() {
          if (outer.closed && subscriptions.length === 0) {
            observer.complete();
          }
        }
        return () => {
          subscriptions.forEach((s) => s.unsubscribe());
          outer.unsubscribe();
        };
      });
    }
    [(Symbol.observable, SymbolObservable)]() {
      return this;
    }
    static from(x) {
      const C = typeof this === "function" ? this : _Observable;
      if (x == null) {
        throw new TypeError(x + " is not an object");
      }
      const observableMethod = getMethod(x, SymbolObservable);
      if (observableMethod) {
        const observable = observableMethod.call(x);
        if (Object(observable) !== observable) {
          throw new TypeError(observable + " is not an object");
        }
        if (isObservable(observable) && observable.constructor === C) {
          return observable;
        }
        return new C((observer) => observable.subscribe(observer));
      }
      if (hasSymbol("iterator")) {
        const iteratorMethod = getMethod(x, SymbolIterator);
        if (iteratorMethod) {
          return new C((observer) => {
            enqueue(() => {
              if (observer.closed)
                return;
              for (const item of iteratorMethod.call(x)) {
                observer.next(item);
                if (observer.closed)
                  return;
              }
              observer.complete();
            });
          });
        }
      }
      if (Array.isArray(x)) {
        return new C((observer) => {
          enqueue(() => {
            if (observer.closed)
              return;
            for (const item of x) {
              observer.next(item);
              if (observer.closed)
                return;
            }
            observer.complete();
          });
        });
      }
      throw new TypeError(x + " is not observable");
    }
    static of(...items) {
      const C = typeof this === "function" ? this : _Observable;
      return new C((observer) => {
        enqueue(() => {
          if (observer.closed)
            return;
          for (const item of items) {
            observer.next(item);
            if (observer.closed)
              return;
          }
          observer.complete();
        });
      });
    }
    static get [SymbolSpecies]() {
      return this;
    }
  };
  if (hasSymbols()) {
    Object.defineProperty(Observable, Symbol("extensions"), {
      value: {
        symbol: SymbolObservable,
        hostReportError
      },
      configurable: true
    });
  }
  var observable_default = Observable;

  // ../../node_modules/observable-fns/dist.esm/unsubscribe.js
  function unsubscribe(subscription) {
    if (typeof subscription === "function") {
      subscription();
    } else if (subscription && typeof subscription.unsubscribe === "function") {
      subscription.unsubscribe();
    }
  }
  var unsubscribe_default = unsubscribe;

  // ../../node_modules/observable-fns/dist.esm/subject.js
  var MulticastSubject = class extends observable_default {
    constructor() {
      super((observer) => {
        this._observers.add(observer);
        return () => this._observers.delete(observer);
      });
      this._observers = /* @__PURE__ */ new Set();
    }
    next(value) {
      for (const observer of this._observers) {
        observer.next(value);
      }
    }
    error(error) {
      for (const observer of this._observers) {
        observer.error(error);
      }
    }
    complete() {
      for (const observer of this._observers) {
        observer.complete();
      }
    }
  };
  var subject_default = MulticastSubject;

  // ../../node_modules/observable-fns/dist.esm/multicast.js
  function multicast(coldObservable) {
    const subject = new subject_default();
    let sourceSubscription;
    let subscriberCount = 0;
    return new observable_default((observer) => {
      if (!sourceSubscription) {
        sourceSubscription = coldObservable.subscribe(subject);
      }
      const subscription = subject.subscribe(observer);
      subscriberCount++;
      return () => {
        subscriberCount--;
        subscription.unsubscribe();
        if (subscriberCount === 0) {
          unsubscribe_default(sourceSubscription);
          sourceSubscription = void 0;
        }
      };
    });
  }
  var multicast_default = multicast;

  // ../../dist-esm/symbols.js
  var $broadcasts = Symbol("thread.broadcasts");
  var $errors = Symbol("thread.errors");
  var $events = Symbol("thread.events");
  var $terminate = Symbol("thread.terminate");
  var $transferable = Symbol("thread.transferable");
  var $worker = Symbol("thread.worker");

  // ../../dist-esm/master/thread.js
  function fail(message) {
    throw Error(message);
  }
  var Thread = {
    /** Return an observable that can be used to subscribe to all errors happening in the thread. */
    errors(thread) {
      return thread[$errors] || fail("Error observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
    },
    /** Return an observable that can be used to subscribe to internal events happening in the thread. Useful for debugging. */
    events(thread) {
      return thread[$events] || fail("Events observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
    },
    /** Return an observable of worker-initiated broadcast events. Only available on threads returned by spawnShared(). */
    broadcasts(thread) {
      return thread[$broadcasts] || fail("Broadcasts observable not found. It is only available on threads returned by spawnShared().");
    },
    /** Terminate a thread. Remember to terminate every thread when you are done using it. */
    terminate(thread) {
      return thread[$terminate]();
    }
  };

  // ../../dist-esm/master/spawn.js
  var import_debug2 = __toESM(require_browser());

  // ../../dist-esm/promise.js
  var doNothing = () => void 0;
  function createPromiseWithResolver() {
    let alreadyResolved = false;
    let resolvedTo;
    let resolver = doNothing;
    const promise = new Promise((resolve) => {
      if (alreadyResolved) {
        resolve(resolvedTo);
      } else {
        resolver = resolve;
      }
    });
    const exposedResolver = (value) => {
      alreadyResolved = true;
      resolvedTo = value;
      resolver(resolvedTo);
    };
    return [promise, exposedResolver];
  }

  // ../../dist-esm/types/master.js
  var WorkerEventType;
  (function(WorkerEventType2) {
    WorkerEventType2["internalError"] = "internalError";
    WorkerEventType2["message"] = "message";
    WorkerEventType2["termination"] = "termination";
  })(WorkerEventType || (WorkerEventType = {}));

  // ../../dist-esm/master/invocation-proxy.js
  var import_debug = __toESM(require_browser());

  // ../../dist-esm/observable-promise.js
  var _a;
  var doNothing2 = () => void 0;
  var returnInput = (input) => input;
  var runDeferred = (fn) => Promise.resolve().then(fn);
  function fail2(error) {
    throw error;
  }
  function isThenable(thing) {
    return thing && typeof thing.then === "function";
  }
  var ObservablePromise = class _ObservablePromise extends observable_default {
    constructor(init) {
      super((originalObserver) => {
        const self2 = this;
        const observer = Object.assign(Object.assign({}, originalObserver), {
          complete() {
            originalObserver.complete();
            self2.onCompletion();
          },
          error(error) {
            originalObserver.error(error);
            self2.onError(error);
          },
          next(value) {
            originalObserver.next(value);
            self2.onNext(value);
          }
        });
        try {
          this.initHasRun = true;
          return init(observer);
        } catch (error) {
          observer.error(error);
        }
      });
      this.initHasRun = false;
      this.fulfillmentCallbacks = [];
      this.rejectionCallbacks = [];
      this.firstValueSet = false;
      this.state = "pending";
      this[_a] = "[object ObservablePromise]";
    }
    onNext(value) {
      if (!this.firstValueSet) {
        this.firstValue = value;
        this.firstValueSet = true;
      }
    }
    onError(error) {
      this.state = "rejected";
      this.rejection = error;
      for (const onRejected of this.rejectionCallbacks) {
        runDeferred(() => onRejected(error));
      }
    }
    onCompletion() {
      this.state = "fulfilled";
      for (const onFulfilled of this.fulfillmentCallbacks) {
        runDeferred(() => onFulfilled(this.firstValue));
      }
    }
    then(onFulfilledRaw, onRejectedRaw) {
      const onFulfilled = onFulfilledRaw || returnInput;
      const onRejected = onRejectedRaw || fail2;
      let onRejectedCalled = false;
      return new Promise((resolve, reject) => {
        const rejectionCallback = (error) => {
          if (onRejectedCalled)
            return;
          onRejectedCalled = true;
          try {
            resolve(onRejected(error));
          } catch (anotherError) {
            reject(anotherError);
          }
        };
        const fulfillmentCallback = (value) => {
          try {
            resolve(onFulfilled(value));
          } catch (error) {
            rejectionCallback(error);
          }
        };
        if (!this.initHasRun) {
          this.subscribe({ error: rejectionCallback });
        }
        if (this.state === "fulfilled") {
          return resolve(onFulfilled(this.firstValue));
        }
        if (this.state === "rejected") {
          onRejectedCalled = true;
          return resolve(onRejected(this.rejection));
        }
        this.fulfillmentCallbacks.push(fulfillmentCallback);
        this.rejectionCallbacks.push(rejectionCallback);
      });
    }
    catch(onRejected) {
      return this.then(void 0, onRejected);
    }
    finally(onCompleted) {
      const handler = onCompleted || doNothing2;
      return this.then((value) => {
        handler();
        return value;
      }, () => handler());
    }
    static from(thing) {
      if (isThenable(thing)) {
        return new _ObservablePromise((observer) => {
          const onFulfilled = (value) => {
            observer.next(value);
            observer.complete();
          };
          const onRejected = (error) => {
            observer.error(error);
          };
          thing.then(onFulfilled, onRejected);
        });
      } else {
        return super.from(thing);
      }
    }
  };
  _a = Symbol.toStringTag;

  // ../../dist-esm/transferable.js
  function isTransferDescriptor(thing) {
    return thing && typeof thing === "object" && thing[$transferable];
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

  // ../../dist-esm/master/invocation-proxy.js
  var debugMessages = (0, import_debug.default)("threads:master:messages");
  var nextJobUID = 1;
  var dedupe = (array) => Array.from(new Set(array));
  var isJobErrorMessage = (data) => data && data.type === WorkerMessageType.error;
  var isJobResultMessage = (data) => data && data.type === WorkerMessageType.result;
  var isJobStartMessage = (data) => data && data.type === WorkerMessageType.running;
  function createObservableForJob(worker, jobUID) {
    return new observable_default((observer) => {
      let asyncType;
      let settled = false;
      const cleanup = () => {
        worker.removeEventListener("message", messageHandler);
        worker.removeEventListener("error", errorHandler);
        worker.removeEventListener("exit", exitHandler);
      };
      const messageHandler = ((event) => {
        debugMessages("Message from worker:", event.data);
        if (!event.data || event.data.uid !== jobUID)
          return;
        if (isJobStartMessage(event.data)) {
          asyncType = event.data.resultType;
        } else if (isJobResultMessage(event.data)) {
          if (asyncType === "promise") {
            if (typeof event.data.payload !== "undefined") {
              observer.next(deserialize(event.data.payload));
            }
            settled = true;
            observer.complete();
            cleanup();
          } else {
            if (typeof event.data.payload !== "undefined") {
              observer.next(deserialize(event.data.payload));
            }
            if (event.data.complete) {
              settled = true;
              observer.complete();
              cleanup();
            }
          }
        } else if (isJobErrorMessage(event.data)) {
          const error = deserialize(event.data.error);
          settled = true;
          observer.error(error);
          cleanup();
        }
      });
      const errorHandler = ((event) => {
        if (settled)
          return;
        settled = true;
        const error = event && event.data instanceof Error ? event.data : Error(String(event && event.data || "Worker errored before the job completed."));
        observer.error(error);
        cleanup();
      });
      const exitHandler = ((event) => {
        if (settled)
          return;
        settled = true;
        const exitCode = event ? event.data : void 0;
        observer.error(Error(`Worker terminated before the job completed (exit code: ${exitCode}).`));
        cleanup();
      });
      worker.addEventListener("message", messageHandler);
      worker.addEventListener("error", errorHandler);
      worker.addEventListener("exit", exitHandler);
      return () => {
        if (asyncType === "observable" || !asyncType) {
          const cancelMessage = {
            type: MasterMessageType.cancel,
            uid: jobUID
          };
          worker.postMessage(cancelMessage);
        }
        cleanup();
      };
    });
  }
  function prepareArguments(rawArgs) {
    if (rawArgs.length === 0) {
      return {
        args: [],
        transferables: []
      };
    }
    const args = [];
    const transferables = [];
    for (const arg of rawArgs) {
      if (isTransferDescriptor(arg)) {
        args.push(serialize(arg.send));
        transferables.push(...arg.transferables);
      } else {
        args.push(serialize(arg));
      }
    }
    return {
      args,
      transferables: transferables.length === 0 ? transferables : dedupe(transferables)
    };
  }
  function createProxyFunction(worker, method) {
    return ((...rawArgs) => {
      const uid = nextJobUID++;
      const { args, transferables } = prepareArguments(rawArgs);
      const runMessage = {
        type: MasterMessageType.run,
        uid,
        method,
        args
      };
      debugMessages("Sending command to run function to worker:", runMessage);
      try {
        worker.postMessage(runMessage, transferables);
      } catch (error) {
        if (isDataCloneError(error)) {
          const cloneError = new ThreadCloneError(`Cannot send arguments to the worker thread: a value is not structured-cloneable. Functions, class instances and other non-serializable values cannot be passed to a thread. Original error: ${error.message}`, error);
          return ObservablePromise.from(Promise.reject(cloneError));
        }
        return ObservablePromise.from(Promise.reject(error));
      }
      return ObservablePromise.from(multicast_default(createObservableForJob(worker, uid)));
    });
  }
  function createProxyModule(worker, methodNames) {
    const proxy = {};
    for (const methodName of methodNames) {
      proxy[methodName] = createProxyFunction(worker, methodName);
    }
    return proxy;
  }

  // ../../dist-esm/master/spawn.js
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
  var debugMessages2 = (0, import_debug2.default)("threads:master:messages");
  var debugSpawn = (0, import_debug2.default)("threads:master:spawn");
  var debugThreadUtils = (0, import_debug2.default)("threads:master:thread-utils");
  var isInitMessage = (data) => data && data.type === "init";
  var isUncaughtErrorMessage = (data) => data && data.type === "uncaughtError";
  var initMessageTimeout = typeof process !== "undefined" && typeof process.env !== "undefined" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
  function withTimeout(promise, timeoutInMs, errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
      let timeoutHandle;
      const timeout = new Promise((resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(Error(errorMessage)), timeoutInMs);
      });
      try {
        return yield Promise.race([
          promise,
          timeout
        ]);
      } finally {
        clearTimeout(timeoutHandle);
      }
    });
  }
  function receiveInitMessage(worker) {
    return new Promise((resolve, reject) => {
      const messageHandler = ((event) => {
        debugMessages2("Message from worker before finishing initialization:", event.data);
        if (isInitMessage(event.data)) {
          worker.removeEventListener("message", messageHandler);
          resolve(event.data);
        } else if (isUncaughtErrorMessage(event.data)) {
          worker.removeEventListener("message", messageHandler);
          reject(deserialize(event.data.error));
        }
      });
      worker.addEventListener("message", messageHandler);
    });
  }
  function createEventObservable(worker, workerTermination) {
    return new observable_default((observer) => {
      const messageHandler = ((messageEvent) => {
        const workerEvent = {
          type: WorkerEventType.message,
          data: messageEvent.data
        };
        observer.next(workerEvent);
      });
      const rejectionHandler = ((errorEvent) => {
        debugThreadUtils("Unhandled promise rejection event in thread:", errorEvent);
        const workerEvent = {
          type: WorkerEventType.internalError,
          error: Error(errorEvent.reason)
        };
        observer.next(workerEvent);
      });
      let finished = false;
      const removeListeners = () => {
        worker.removeEventListener("message", messageHandler);
        worker.removeEventListener("unhandledrejection", rejectionHandler);
        worker.removeEventListener("exit", exitHandler);
      };
      const finish = () => {
        if (finished)
          return;
        finished = true;
        const terminationEvent = {
          type: WorkerEventType.termination
        };
        removeListeners();
        observer.next(terminationEvent);
        observer.complete();
      };
      const exitHandler = (() => finish());
      worker.addEventListener("message", messageHandler);
      worker.addEventListener("unhandledrejection", rejectionHandler);
      worker.addEventListener("exit", exitHandler);
      workerTermination.then(finish);
      return removeListeners;
    });
  }
  function createTerminator(worker) {
    const [termination, resolver] = createPromiseWithResolver();
    const terminate = () => __awaiter(this, void 0, void 0, function* () {
      debugThreadUtils("Terminating worker");
      yield worker.terminate();
      resolver();
    });
    return { terminate, termination };
  }
  function setPrivateThreadProps(raw, worker, workerEvents, terminate) {
    const workerErrors = workerEvents.filter((event) => event.type === WorkerEventType.internalError).map((errorEvent) => errorEvent.error);
    return Object.assign(raw, {
      [$errors]: workerErrors,
      [$events]: workerEvents,
      [$terminate]: terminate,
      [$worker]: worker
    });
  }
  function spawn(worker, options) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a2, _b, _c, _d;
      debugSpawn("Initializing new thread");
      const timeout = options && options.timeout ? options.timeout : initMessageTimeout;
      let initMessage;
      try {
        initMessage = yield withTimeout(receiveInitMessage(worker), timeout, `Timeout: Did not receive an init message from worker after ${timeout}ms. Make sure the worker calls expose().`);
      } catch (error) {
        yield Promise.resolve((_b = (_a2 = worker).terminate) === null || _b === void 0 ? void 0 : _b.call(_a2)).catch(() => void 0);
        throw error;
      }
      const exposed = initMessage.exposed;
      const { termination, terminate } = createTerminator(worker);
      const events = createEventObservable(worker, termination);
      if (exposed.type === "function") {
        const proxy = createProxyFunction(worker);
        return setPrivateThreadProps(proxy, worker, events, terminate);
      } else if (exposed.type === "module") {
        const proxy = createProxyModule(worker, exposed.methods);
        return setPrivateThreadProps(proxy, worker, events, terminate);
      } else {
        const type = exposed.type;
        yield Promise.resolve((_d = (_c = worker).terminate) === null || _d === void 0 ? void 0 : _d.call(_c)).catch(() => void 0);
        throw Error(`Worker init message states unexpected type of expose(): ${type}`);
      }
    });
  }

  // ../../dist-esm/master/shared/bus.js
  var channelName = (name) => `threadsx:shared:${name}`;
  var lockName = (name) => `threadsx:shared-leader:${name}`;
  var busRegistry = /* @__PURE__ */ new Map();
  function acquireSharedBus(name) {
    const existing = busRegistry.get(name);
    if (existing) {
      existing.users++;
      return existing.bus;
    }
    const channel = new BroadcastChannel(channelName(name));
    const listeners = /* @__PURE__ */ new Set();
    const deliver = (envelope) => {
      for (const listener of [...listeners]) {
        listener(envelope);
      }
    };
    channel.addEventListener("message", (event) => deliver(event.data));
    const bus = {
      post(envelope) {
        channel.postMessage(envelope);
        queueMicrotask(() => deliver(envelope));
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      release() {
        const entry = busRegistry.get(name);
        if (!entry)
          return;
        entry.users--;
        if (entry.users <= 0) {
          busRegistry.delete(name);
          channel.close();
          listeners.clear();
        }
      }
    };
    busRegistry.set(name, { bus, users: 1 });
    return bus;
  }

  // ../../dist-esm/master/shared/bus-adapter.js
  var HELLO_RETRY_INTERVAL = 400;
  var BusClientAdapter = class {
    constructor(bus) {
      this.clientId = Math.random().toString(36).slice(2);
      this.listeners = /* @__PURE__ */ new Map();
      this.servingLeaderId = null;
      this.closed = false;
      this.bus = bus;
      this.unsubscribeBus = bus.subscribe((envelope) => this.handleEnvelope(envelope));
      this.hello();
      this.helloTimer = setInterval(() => this.hello(), HELLO_RETRY_INTERVAL);
      const onPagehide = () => this.sayBye();
      if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
        ;
        self.addEventListener("pagehide", onPagehide);
        this.detachPagehide = () => self.removeEventListener("pagehide", onPagehide);
      } else {
        this.detachPagehide = () => void 0;
      }
    }
    hello() {
      this.bus.post({ kind: "hello", clientId: this.clientId });
    }
    sayBye() {
      if (this.closed)
        return;
      this.bus.post({ kind: "c2s", clientId: this.clientId, msg: { type: MasterMessageType.bye } });
    }
    emit(type, event) {
      const set = this.listeners.get(type);
      if (!set)
        return;
      for (const listener of [...set]) {
        listener(event);
      }
    }
    handleEnvelope(envelope) {
      if (this.closed)
        return;
      if (envelope.kind === "s2c" && envelope.clientId === this.clientId) {
        if (envelope.msg && envelope.msg.type === WorkerMessageType.init) {
          clearInterval(this.helloTimer);
          this.servingLeaderId = envelope.leaderId;
        }
        this.emit("message", { data: envelope.msg });
        return;
      }
      if (envelope.kind === "s2c-all") {
        this.emit("message", { data: envelope.msg });
        return;
      }
      if (envelope.kind === "worker-error") {
        this.emit("error", { data: Error(envelope.message) });
        return;
      }
      if (envelope.kind === "leader-online") {
        if (this.servingLeaderId !== null && envelope.leaderId !== this.servingLeaderId) {
          this.servingLeaderId = envelope.leaderId;
          this.emit("error", { data: new SharedWorkerLeaderLostError() });
        }
        return;
      }
    }
    postMessage(value, transferList) {
      if (transferList && transferList.length > 0) {
        throw Error("Transfer() is not supported on the BroadcastChannel fallback path. Values sent to a shared worker without native SharedWorker support are structured-cloned, not transferred.");
      }
      this.bus.post({ kind: "c2s", clientId: this.clientId, msg: value });
    }
    addEventListener(type, listener) {
      let set = this.listeners.get(type);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.listeners.set(type, set);
      }
      set.add(listener);
    }
    removeEventListener(type, listener) {
      var _a2;
      (_a2 = this.listeners.get(type)) === null || _a2 === void 0 ? void 0 : _a2.delete(listener);
    }
    dispatchEvent() {
      return false;
    }
    terminate() {
      this.sayBye();
      this.closed = true;
      clearInterval(this.helloTimer);
      this.detachPagehide();
      this.unsubscribeBus();
      this.listeners.clear();
      this.bus.release();
    }
  };

  // ../../dist-esm/master/shared/leader.js
  var electionsStarted = /* @__PURE__ */ new Set();
  function startLeaderElection(name, bus, factory) {
    if (electionsStarted.has(name))
      return;
    electionsStarted.add(name);
    navigator.locks.request(lockName(name), { mode: "exclusive" }, () => {
      runAsLeader(bus, factory);
      return new Promise(() => void 0);
    }).catch(() => {
      electionsStarted.delete(name);
    });
  }
  function runAsLeader(bus, factory) {
    const worker = factory({ shared: false });
    const leaderId = Math.random().toString(36).slice(2);
    let nextLeaderUid = 1;
    const routesByLeaderUid = /* @__PURE__ */ new Map();
    const leaderUidByClientJob = /* @__PURE__ */ new Map();
    const clientJobKey = (clientId, clientUid) => `${clientId}:${clientUid}`;
    let initMessage = null;
    const pendingHellos = /* @__PURE__ */ new Set();
    const replyToClient = (clientId, msg) => bus.post({ kind: "s2c", clientId, msg, leaderId });
    worker.addEventListener("message", ((event) => {
      const msg = event.data;
      if (!msg)
        return;
      if (msg.type === WorkerMessageType.init) {
        initMessage = msg;
        for (const clientId of pendingHellos) {
          replyToClient(clientId, initMessage);
        }
        pendingHellos.clear();
        bus.post({ kind: "leader-online", leaderId });
        return;
      }
      if (msg.type === WorkerMessageType.broadcast || msg.type === WorkerMessageType.uncaughtError) {
        bus.post({ kind: "s2c-all", msg });
        return;
      }
      if (typeof msg.uid === "number") {
        const route = routesByLeaderUid.get(msg.uid);
        if (!route)
          return;
        const jobEnded = msg.type === WorkerMessageType.error || msg.type === WorkerMessageType.result && msg.complete;
        if (jobEnded) {
          routesByLeaderUid.delete(msg.uid);
          leaderUidByClientJob.delete(clientJobKey(route.clientId, route.clientUid));
        }
        replyToClient(route.clientId, Object.assign(Object.assign({}, msg), { uid: route.clientUid }));
      }
    }));
    worker.addEventListener("error", ((event) => {
      const message = event && event.data && event.data.message ? String(event.data.message) : "The shared worker errored.";
      bus.post({ kind: "worker-error", message });
    }));
    const dropClientJobs = (clientId) => {
      for (const [leaderUid, route] of routesByLeaderUid) {
        if (route.clientId !== clientId)
          continue;
        worker.postMessage({ type: MasterMessageType.cancel, uid: leaderUid });
        routesByLeaderUid.delete(leaderUid);
        leaderUidByClientJob.delete(clientJobKey(route.clientId, route.clientUid));
      }
    };
    bus.subscribe((envelope) => {
      if (envelope.kind === "hello") {
        if (initMessage) {
          replyToClient(envelope.clientId, initMessage);
        } else {
          pendingHellos.add(envelope.clientId);
        }
        return;
      }
      if (envelope.kind !== "c2s")
        return;
      if (!initMessage)
        return;
      const { clientId, msg } = envelope;
      if (msg.type === MasterMessageType.run) {
        const leaderUid = nextLeaderUid++;
        routesByLeaderUid.set(leaderUid, { clientId, clientUid: msg.uid });
        leaderUidByClientJob.set(clientJobKey(clientId, msg.uid), leaderUid);
        worker.postMessage(Object.assign(Object.assign({}, msg), { uid: leaderUid }));
      } else if (msg.type === MasterMessageType.cancel) {
        const leaderUid = leaderUidByClientJob.get(clientJobKey(clientId, msg.uid));
        if (typeof leaderUid === "number") {
          routesByLeaderUid.delete(leaderUid);
          leaderUidByClientJob.delete(clientJobKey(clientId, msg.uid));
          worker.postMessage({ type: MasterMessageType.cancel, uid: leaderUid });
        }
      } else if (msg.type === MasterMessageType.bye) {
        dropClientJobs(clientId);
      }
    });
  }

  // ../../dist-esm/master/shared/port-adapter.js
  var SharedWorkerPortAdapter = class {
    constructor(sharedWorker) {
      this.closed = false;
      this.port = sharedWorker.port;
      this.port.start();
      const onPagehide = () => this.sayBye();
      if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
        ;
        self.addEventListener("pagehide", onPagehide);
        this.detachPagehide = () => self.removeEventListener("pagehide", onPagehide);
      } else {
        this.detachPagehide = () => void 0;
      }
    }
    sayBye() {
      if (this.closed)
        return;
      try {
        this.port.postMessage({ type: MasterMessageType.bye });
      } catch (_a2) {
      }
    }
    postMessage(value, transferList) {
      this.port.postMessage(value, transferList);
    }
    addEventListener(type, listener) {
      this.port.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
      this.port.removeEventListener(type, listener);
    }
    dispatchEvent() {
      return false;
    }
    terminate() {
      this.sayBye();
      this.closed = true;
      this.detachPagehide();
      this.port.close();
    }
  };

  // ../../dist-esm/master/shared/spawn-shared.js
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
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
  var globalObject = typeof globalThis !== "undefined" ? globalThis : void 0;
  function hasNativeSharedWorker() {
    return typeof (globalObject === null || globalObject === void 0 ? void 0 : globalObject.SharedWorker) === "function";
  }
  function hasFallbackPrerequisites() {
    var _a2, _b;
    return typeof (globalObject === null || globalObject === void 0 ? void 0 : globalObject.BroadcastChannel) === "function" && typeof ((_b = (_a2 = globalObject === null || globalObject === void 0 ? void 0 : globalObject.navigator) === null || _a2 === void 0 ? void 0 : _a2.locks) === null || _b === void 0 ? void 0 : _b.request) === "function";
  }
  function spawnShared(factory, options) {
    return __awaiter2(this, void 0, void 0, function* () {
      if (!options || !options.name) {
        throw Error("spawnShared() requires options.name \u2014 it identifies the shared worker across tabs.");
      }
      if (!hasNativeSharedWorker() && !hasFallbackPrerequisites()) {
        throw Error("spawnShared() is only available in browsers: it needs SharedWorker, or BroadcastChannel plus the Web Locks API for the fallback. In Node.js, use spawn() with a regular worker instead.");
      }
      let worker;
      if (hasNativeSharedWorker() && !options.forceFallback) {
        const sharedWorker = factory({ shared: true });
        if (!sharedWorker || !sharedWorker.port) {
          throw Error("The factory passed to spawnShared() must return a SharedWorker when called with { shared: true }.");
        }
        worker = new SharedWorkerPortAdapter(sharedWorker);
      } else {
        if (!hasFallbackPrerequisites()) {
          throw Error("spawnShared() fallback requires BroadcastChannel and the Web Locks API.");
        }
        const bus = acquireSharedBus(options.name);
        startLeaderElection(options.name, bus, factory);
        worker = new BusClientAdapter(bus);
      }
      const broadcasts = multicast_default(new observable_default((observer) => {
        const handler = (event) => {
          if (event.data && event.data.type === WorkerMessageType.broadcast) {
            observer.next(deserialize(event.data.payload));
          }
        };
        worker.addEventListener("message", handler);
        return () => worker.removeEventListener("message", handler);
      }));
      const thread = yield spawn(worker, { timeout: options.timeout });
      thread[$broadcasts] = broadcasts;
      return thread;
    });
  }

  // ../../dist-esm/master/index.js
  var BlobWorker = getWorkerImplementation().blob;
  var Worker2 = getWorkerImplementation().default;

  // main.mjs
  var countEl = document.getElementById("count");
  var statusEl = document.getElementById("status");
  var incrementBtn = document.getElementById("increment");
  var connectBtn = document.getElementById("connect");
  var fallbackCheckbox = document.getElementById("force-fallback");
  connectBtn.addEventListener("click", async () => {
    connectBtn.disabled = true;
    fallbackCheckbox.disabled = true;
    const counter = await spawnShared(
      // The factory contains the literal constructor calls so bundlers can
      // detect the worker. The leader tab runs it with { shared: false } on
      // the fallback path.
      ({ shared }) => shared ? new SharedWorker("./counter.worker.js", { name: "shared-counter" }) : new Worker("./counter.worker.js"),
      { name: "shared-counter", forceFallback: fallbackCheckbox.checked }
    );
    const state = await counter.getState();
    countEl.textContent = state.count;
    statusEl.textContent = `Connected (worker started ${state.startedAt}, ${state.tabs} tab(s))`;
    Thread.broadcasts(counter).subscribe(({ count, tabs }) => {
      countEl.textContent = count;
      statusEl.textContent = `Connected (${tabs} tab(s))`;
    });
    incrementBtn.disabled = false;
    incrementBtn.addEventListener("click", async () => {
      await counter.increment();
    });
  });
})();
