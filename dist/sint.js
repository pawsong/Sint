(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

require("core-js/shim");

require("regenerator-runtime/runtime");

require("core-js/fn/regexp/escape");

if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;

var DEFINE_PROPERTY = "defineProperty";
function define(O, key, value) {
  O[key] || Object[DEFINE_PROPERTY](O, key, {
    writable: true,
    configurable: true,
    value: value
  });
}

define(String.prototype, "padLeft", "".padStart);
define(String.prototype, "padRight", "".padEnd);

"pop,reverse,shift,keys,values,entries,indexOf,every,some,forEach,map,filter,find,findIndex,includes,join,slice,concat,push,splice,unshift,sort,lastIndexOf,reduce,reduceRight,copyWithin,fill".split(",").forEach(function (key) {
  [][key] && define(Array, key, Function.call.bind([][key]));
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"core-js/fn/regexp/escape":3,"core-js/shim":328,"regenerator-runtime/runtime":2}],2:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof global.process === "object" && global.process.domain) {
      invoke = global.process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
require('../../modules/core.regexp.escape');
module.exports = require('../../modules/_core').RegExp.escape;

},{"../../modules/_core":24,"../../modules/core.regexp.escape":131}],4:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],5:[function(require,module,exports){
var cof = require('./_cof');
module.exports = function (it, msg) {
  if (typeof it != 'number' && cof(it) != 'Number') throw TypeError(msg);
  return +it;
};

},{"./_cof":19}],6:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"./_hide":43,"./_wks":129}],7:[function(require,module,exports){
module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

},{}],8:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":52}],9:[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';
var toObject = require('./_to-object');
var toAbsoluteIndex = require('./_to-absolute-index');
var toLength = require('./_to-length');

module.exports = [].copyWithin || function copyWithin(target /* = 0 */, start /* = 0, end = @length */) {
  var O = toObject(this);
  var len = toLength(O.length);
  var to = toAbsoluteIndex(target, len);
  var from = toAbsoluteIndex(start, len);
  var end = arguments.length > 2 ? arguments[2] : undefined;
  var count = Math.min((end === undefined ? len : toAbsoluteIndex(end, len)) - from, len - to);
  var inc = 1;
  if (from < to && to < from + count) {
    inc = -1;
    from += count - 1;
    to += count - 1;
  }
  while (count-- > 0) {
    if (from in O) O[to] = O[from];
    else delete O[to];
    to += inc;
    from += inc;
  } return O;
};

},{"./_to-absolute-index":115,"./_to-length":119,"./_to-object":120}],10:[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';
var toObject = require('./_to-object');
var toAbsoluteIndex = require('./_to-absolute-index');
var toLength = require('./_to-length');
module.exports = function fill(value /* , start = 0, end = @length */) {
  var O = toObject(this);
  var length = toLength(O.length);
  var aLen = arguments.length;
  var index = toAbsoluteIndex(aLen > 1 ? arguments[1] : undefined, length);
  var end = aLen > 2 ? arguments[2] : undefined;
  var endPos = end === undefined ? length : toAbsoluteIndex(end, length);
  while (endPos > index) O[index++] = value;
  return O;
};

},{"./_to-absolute-index":115,"./_to-length":119,"./_to-object":120}],11:[function(require,module,exports){
var forOf = require('./_for-of');

module.exports = function (iter, ITERATOR) {
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};

},{"./_for-of":40}],12:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":115,"./_to-iobject":118,"./_to-length":119}],13:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = require('./_ctx');
var IObject = require('./_iobject');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var asc = require('./_array-species-create');
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};

},{"./_array-species-create":16,"./_ctx":26,"./_iobject":48,"./_to-length":119,"./_to-object":120}],14:[function(require,module,exports){
var aFunction = require('./_a-function');
var toObject = require('./_to-object');
var IObject = require('./_iobject');
var toLength = require('./_to-length');

module.exports = function (that, callbackfn, aLen, memo, isRight) {
  aFunction(callbackfn);
  var O = toObject(that);
  var self = IObject(O);
  var length = toLength(O.length);
  var index = isRight ? length - 1 : 0;
  var i = isRight ? -1 : 1;
  if (aLen < 2) for (;;) {
    if (index in self) {
      memo = self[index];
      index += i;
      break;
    }
    index += i;
    if (isRight ? index < 0 : length <= index) {
      throw TypeError('Reduce of empty array with no initial value');
    }
  }
  for (;isRight ? index >= 0 : length > index; index += i) if (index in self) {
    memo = callbackfn(memo, self[index], index, O);
  }
  return memo;
};

},{"./_a-function":4,"./_iobject":48,"./_to-length":119,"./_to-object":120}],15:[function(require,module,exports){
var isObject = require('./_is-object');
var isArray = require('./_is-array');
var SPECIES = require('./_wks')('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};

},{"./_is-array":50,"./_is-object":52,"./_wks":129}],16:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};

},{"./_array-species-constructor":15}],17:[function(require,module,exports){
'use strict';
var aFunction = require('./_a-function');
var isObject = require('./_is-object');
var invoke = require('./_invoke');
var arraySlice = [].slice;
var factories = {};

var construct = function (F, len, args) {
  if (!(len in factories)) {
    for (var n = [], i = 0; i < len; i++) n[i] = 'a[' + i + ']';
    // eslint-disable-next-line no-new-func
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  } return factories[len](F, args);
};

module.exports = Function.bind || function bind(that /* , ...args */) {
  var fn = aFunction(this);
  var partArgs = arraySlice.call(arguments, 1);
  var bound = function (/* args... */) {
    var args = partArgs.concat(arraySlice.call(arguments));
    return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
  };
  if (isObject(fn.prototype)) bound.prototype = fn.prototype;
  return bound;
};

},{"./_a-function":4,"./_invoke":47,"./_is-object":52}],18:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":19,"./_wks":129}],19:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],20:[function(require,module,exports){
'use strict';
var dP = require('./_object-dp').f;
var create = require('./_object-create');
var redefineAll = require('./_redefine-all');
var ctx = require('./_ctx');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var $iterDefine = require('./_iter-define');
var step = require('./_iter-step');
var setSpecies = require('./_set-species');
var DESCRIPTORS = require('./_descriptors');
var fastKey = require('./_meta').fastKey;
var validate = require('./_validate-collection');
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};

},{"./_an-instance":7,"./_ctx":26,"./_descriptors":30,"./_for-of":40,"./_iter-define":56,"./_iter-step":58,"./_meta":67,"./_object-create":72,"./_object-dp":73,"./_redefine-all":94,"./_set-species":101,"./_validate-collection":126}],21:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var classof = require('./_classof');
var from = require('./_array-from-iterable');
module.exports = function (NAME) {
  return function toJSON() {
    if (classof(this) != NAME) throw TypeError(NAME + "#toJSON isn't generic");
    return from(this);
  };
};

},{"./_array-from-iterable":11,"./_classof":18}],22:[function(require,module,exports){
'use strict';
var redefineAll = require('./_redefine-all');
var getWeak = require('./_meta').getWeak;
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var createArrayMethod = require('./_array-methods');
var $has = require('./_has');
var validate = require('./_validate-collection');
var arrayFind = createArrayMethod(5);
var arrayFindIndex = createArrayMethod(6);
var id = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function (that) {
  return that._l || (that._l = new UncaughtFrozenStore());
};
var UncaughtFrozenStore = function () {
  this.a = [];
};
var findUncaughtFrozen = function (store, key) {
  return arrayFind(store.a, function (it) {
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function (key) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) return entry[1];
  },
  has: function (key) {
    return !!findUncaughtFrozen(this, key);
  },
  set: function (key, value) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function (key) {
    var index = arrayFindIndex(this.a, function (it) {
      return it[0] === key;
    });
    if (~index) this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;      // collection type
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function (key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME))['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME)).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var data = getWeak(anObject(key), true);
    if (data === true) uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};

},{"./_an-instance":7,"./_an-object":8,"./_array-methods":13,"./_for-of":40,"./_has":42,"./_is-object":52,"./_meta":67,"./_redefine-all":94,"./_validate-collection":126}],23:[function(require,module,exports){
'use strict';
var global = require('./_global');
var $export = require('./_export');
var redefine = require('./_redefine');
var redefineAll = require('./_redefine-all');
var meta = require('./_meta');
var forOf = require('./_for-of');
var anInstance = require('./_an-instance');
var isObject = require('./_is-object');
var fails = require('./_fails');
var $iterDetect = require('./_iter-detect');
var setToStringTag = require('./_set-to-string-tag');
var inheritIfRequired = require('./_inherit-if-required');

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};

},{"./_an-instance":7,"./_export":34,"./_fails":36,"./_for-of":40,"./_global":41,"./_inherit-if-required":46,"./_is-object":52,"./_iter-detect":57,"./_meta":67,"./_redefine":95,"./_redefine-all":94,"./_set-to-string-tag":102}],24:[function(require,module,exports){
var core = module.exports = { version: '2.5.0' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],25:[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp');
var createDesc = require('./_property-desc');

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};

},{"./_object-dp":73,"./_property-desc":93}],26:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":4}],27:[function(require,module,exports){
'use strict';
// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
var fails = require('./_fails');
var getTime = Date.prototype.getTime;
var $toISOString = Date.prototype.toISOString;

var lz = function (num) {
  return num > 9 ? num : '0' + num;
};

// PhantomJS / old WebKit has a broken implementations
module.exports = (fails(function () {
  return $toISOString.call(new Date(-5e13 - 1)) != '0385-07-25T07:06:39.999Z';
}) || !fails(function () {
  $toISOString.call(new Date(NaN));
})) ? function toISOString() {
  if (!isFinite(getTime.call(this))) throw RangeError('Invalid time value');
  var d = this;
  var y = d.getUTCFullYear();
  var m = d.getUTCMilliseconds();
  var s = y < 0 ? '-' : y > 9999 ? '+' : '';
  return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) +
    '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) +
    'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) +
    ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
} : $toISOString;

},{"./_fails":36}],28:[function(require,module,exports){
'use strict';
var anObject = require('./_an-object');
var toPrimitive = require('./_to-primitive');
var NUMBER = 'number';

module.exports = function (hint) {
  if (hint !== 'string' && hint !== NUMBER && hint !== 'default') throw TypeError('Incorrect hint');
  return toPrimitive(anObject(this), hint != NUMBER);
};

},{"./_an-object":8,"./_to-primitive":121}],29:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],30:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":36}],31:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":41,"./_is-object":52}],32:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],33:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"./_object-gops":79,"./_object-keys":82,"./_object-pie":83}],34:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var hide = require('./_hide');
var redefine = require('./_redefine');
var ctx = require('./_ctx');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":24,"./_ctx":26,"./_global":41,"./_hide":43,"./_redefine":95}],35:[function(require,module,exports){
var MATCH = require('./_wks')('match');
module.exports = function (KEY) {
  var re = /./;
  try {
    '/./'[KEY](re);
  } catch (e) {
    try {
      re[MATCH] = false;
      return !'/./'[KEY](re);
    } catch (f) { /* empty */ }
  } return true;
};

},{"./_wks":129}],36:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],37:[function(require,module,exports){
'use strict';
var hide = require('./_hide');
var redefine = require('./_redefine');
var fails = require('./_fails');
var defined = require('./_defined');
var wks = require('./_wks');

module.exports = function (KEY, length, exec) {
  var SYMBOL = wks(KEY);
  var fns = exec(defined, SYMBOL, ''[KEY]);
  var strfn = fns[0];
  var rxfn = fns[1];
  if (fails(function () {
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  })) {
    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return rxfn.call(string, this); }
    );
  }
};

},{"./_defined":29,"./_fails":36,"./_hide":43,"./_redefine":95,"./_wks":129}],38:[function(require,module,exports){
'use strict';
// 21.2.5.3 get RegExp.prototype.flags
var anObject = require('./_an-object');
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

},{"./_an-object":8}],39:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
var isArray = require('./_is-array');
var isObject = require('./_is-object');
var toLength = require('./_to-length');
var ctx = require('./_ctx');
var IS_CONCAT_SPREADABLE = require('./_wks')('isConcatSpreadable');

function flattenIntoArray(target, original, source, sourceLen, start, depth, mapper, thisArg) {
  var targetIndex = start;
  var sourceIndex = 0;
  var mapFn = mapper ? ctx(mapper, thisArg, 3) : false;
  var element, spreadable;

  while (sourceIndex < sourceLen) {
    if (sourceIndex in source) {
      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

      spreadable = false;
      if (isObject(element)) {
        spreadable = element[IS_CONCAT_SPREADABLE];
        spreadable = spreadable !== undefined ? !!spreadable : isArray(element);
      }

      if (spreadable && depth > 0) {
        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
      } else {
        if (targetIndex >= 0x1fffffffffffff) throw TypeError();
        target[targetIndex] = element;
      }

      targetIndex++;
    }
    sourceIndex++;
  }
  return targetIndex;
}

module.exports = flattenIntoArray;

},{"./_ctx":26,"./_is-array":50,"./_is-object":52,"./_to-length":119,"./_wks":129}],40:[function(require,module,exports){
var ctx = require('./_ctx');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var anObject = require('./_an-object');
var toLength = require('./_to-length');
var getIterFn = require('./core.get-iterator-method');
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;

},{"./_an-object":8,"./_ctx":26,"./_is-array-iter":49,"./_iter-call":54,"./_to-length":119,"./core.get-iterator-method":130}],41:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],42:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],43:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":30,"./_object-dp":73,"./_property-desc":93}],44:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":41}],45:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":30,"./_dom-create":31,"./_fails":36}],46:[function(require,module,exports){
var isObject = require('./_is-object');
var setPrototypeOf = require('./_set-proto').set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};

},{"./_is-object":52,"./_set-proto":100}],47:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};

},{}],48:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":19}],49:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./_iterators');
var ITERATOR = require('./_wks')('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":59,"./_wks":129}],50:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":19}],51:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = require('./_is-object');
var floor = Math.floor;
module.exports = function isInteger(it) {
  return !isObject(it) && isFinite(it) && floor(it) === it;
};

},{"./_is-object":52}],52:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],53:[function(require,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = require('./_is-object');
var cof = require('./_cof');
var MATCH = require('./_wks')('match');
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};

},{"./_cof":19,"./_is-object":52,"./_wks":129}],54:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":8}],55:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":43,"./_object-create":72,"./_property-desc":93,"./_set-to-string-tag":102,"./_wks":129}],56:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var has = require('./_has');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":34,"./_has":42,"./_hide":43,"./_iter-create":55,"./_iterators":59,"./_library":61,"./_object-gpo":80,"./_redefine":95,"./_set-to-string-tag":102,"./_wks":129}],57:[function(require,module,exports){
var ITERATOR = require('./_wks')('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

},{"./_wks":129}],58:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],59:[function(require,module,exports){
module.exports = {};

},{}],60:[function(require,module,exports){
var getKeys = require('./_object-keys');
var toIObject = require('./_to-iobject');
module.exports = function (object, el) {
  var O = toIObject(object);
  var keys = getKeys(O);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) if (O[key = keys[index++]] === el) return key;
};

},{"./_object-keys":82,"./_to-iobject":118}],61:[function(require,module,exports){
module.exports = false;

},{}],62:[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $expm1 = Math.expm1;
module.exports = (!$expm1
  // Old FF bug
  || $expm1(10) > 22025.465794806719 || $expm1(10) < 22025.4657948067165168
  // Tor Browser bug
  || $expm1(-2e-17) != -2e-17
) ? function expm1(x) {
  return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : Math.exp(x) - 1;
} : $expm1;

},{}],63:[function(require,module,exports){
// 20.2.2.16 Math.fround(x)
var sign = require('./_math-sign');
var pow = Math.pow;
var EPSILON = pow(2, -52);
var EPSILON32 = pow(2, -23);
var MAX32 = pow(2, 127) * (2 - EPSILON32);
var MIN32 = pow(2, -126);

var roundTiesToEven = function (n) {
  return n + 1 / EPSILON - 1 / EPSILON;
};

module.exports = Math.fround || function fround(x) {
  var $abs = Math.abs(x);
  var $sign = sign(x);
  var a, result;
  if ($abs < MIN32) return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;
  a = (1 + EPSILON32 / EPSILON) * $abs;
  result = a - (a - $abs);
  // eslint-disable-next-line no-self-compare
  if (result > MAX32 || result != result) return $sign * Infinity;
  return $sign * result;
};

},{"./_math-sign":66}],64:[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
module.exports = Math.log1p || function log1p(x) {
  return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : Math.log(1 + x);
};

},{}],65:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
module.exports = Math.scale || function scale(x, inLow, inHigh, outLow, outHigh) {
  if (
    arguments.length === 0
      // eslint-disable-next-line no-self-compare
      || x != x
      // eslint-disable-next-line no-self-compare
      || inLow != inLow
      // eslint-disable-next-line no-self-compare
      || inHigh != inHigh
      // eslint-disable-next-line no-self-compare
      || outLow != outLow
      // eslint-disable-next-line no-self-compare
      || outHigh != outHigh
  ) return NaN;
  if (x === Infinity || x === -Infinity) return x;
  return (x - inLow) * (outHigh - outLow) / (inHigh - inLow) + outLow;
};

},{}],66:[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
module.exports = Math.sign || function sign(x) {
  // eslint-disable-next-line no-self-compare
  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};

},{}],67:[function(require,module,exports){
var META = require('./_uid')('meta');
var isObject = require('./_is-object');
var has = require('./_has');
var setDesc = require('./_object-dp').f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !require('./_fails')(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"./_fails":36,"./_has":42,"./_is-object":52,"./_object-dp":73,"./_uid":125}],68:[function(require,module,exports){
var Map = require('./es6.map');
var $export = require('./_export');
var shared = require('./_shared')('metadata');
var store = shared.store || (shared.store = new (require('./es6.weak-map'))());

var getOrCreateMetadataMap = function (target, targetKey, create) {
  var targetMetadata = store.get(target);
  if (!targetMetadata) {
    if (!create) return undefined;
    store.set(target, targetMetadata = new Map());
  }
  var keyMetadata = targetMetadata.get(targetKey);
  if (!keyMetadata) {
    if (!create) return undefined;
    targetMetadata.set(targetKey, keyMetadata = new Map());
  } return keyMetadata;
};
var ordinaryHasOwnMetadata = function (MetadataKey, O, P) {
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? false : metadataMap.has(MetadataKey);
};
var ordinaryGetOwnMetadata = function (MetadataKey, O, P) {
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? undefined : metadataMap.get(MetadataKey);
};
var ordinaryDefineOwnMetadata = function (MetadataKey, MetadataValue, O, P) {
  getOrCreateMetadataMap(O, P, true).set(MetadataKey, MetadataValue);
};
var ordinaryOwnMetadataKeys = function (target, targetKey) {
  var metadataMap = getOrCreateMetadataMap(target, targetKey, false);
  var keys = [];
  if (metadataMap) metadataMap.forEach(function (_, key) { keys.push(key); });
  return keys;
};
var toMetaKey = function (it) {
  return it === undefined || typeof it == 'symbol' ? it : String(it);
};
var exp = function (O) {
  $export($export.S, 'Reflect', O);
};

module.exports = {
  store: store,
  map: getOrCreateMetadataMap,
  has: ordinaryHasOwnMetadata,
  get: ordinaryGetOwnMetadata,
  set: ordinaryDefineOwnMetadata,
  keys: ordinaryOwnMetadataKeys,
  key: toMetaKey,
  exp: exp
};

},{"./_export":34,"./_shared":104,"./es6.map":161,"./es6.weak-map":267}],69:[function(require,module,exports){
var global = require('./_global');
var macrotask = require('./_task').set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = require('./_cof')(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if (Observer) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    var promise = Promise.resolve();
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};

},{"./_cof":19,"./_global":41,"./_task":114}],70:[function(require,module,exports){
'use strict';
// 25.4.1.5 NewPromiseCapability(C)
var aFunction = require('./_a-function');

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"./_a-function":4}],71:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
var toObject = require('./_to-object');
var IObject = require('./_iobject');
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;

},{"./_fails":36,"./_iobject":48,"./_object-gops":79,"./_object-keys":82,"./_object-pie":83,"./_to-object":120}],72:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":8,"./_dom-create":31,"./_enum-bug-keys":32,"./_html":44,"./_object-dps":74,"./_shared-key":103}],73:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":8,"./_descriptors":30,"./_ie8-dom-define":45,"./_to-primitive":121}],74:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":8,"./_descriptors":30,"./_object-dp":73,"./_object-keys":82}],75:[function(require,module,exports){
'use strict';
// Forced replacement prototype accessors methods
module.exports = require('./_library') || !require('./_fails')(function () {
  var K = Math.random();
  // In FF throws only define methods
  // eslint-disable-next-line no-undef, no-useless-call
  __defineSetter__.call(null, K, function () { /* empty */ });
  delete require('./_global')[K];
});

},{"./_fails":36,"./_global":41,"./_library":61}],76:[function(require,module,exports){
var pIE = require('./_object-pie');
var createDesc = require('./_property-desc');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var has = require('./_has');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"./_descriptors":30,"./_has":42,"./_ie8-dom-define":45,"./_object-pie":83,"./_property-desc":93,"./_to-iobject":118,"./_to-primitive":121}],77:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject');
var gOPN = require('./_object-gopn').f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":78,"./_to-iobject":118}],78:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = require('./_object-keys-internal');
var hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"./_enum-bug-keys":32,"./_object-keys-internal":81}],79:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],80:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":42,"./_shared-key":103,"./_to-object":120}],81:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":12,"./_has":42,"./_shared-key":103,"./_to-iobject":118}],82:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":32,"./_object-keys-internal":81}],83:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],84:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export');
var core = require('./_core');
var fails = require('./_fails');
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};

},{"./_core":24,"./_export":34,"./_fails":36}],85:[function(require,module,exports){
var getKeys = require('./_object-keys');
var toIObject = require('./_to-iobject');
var isEnum = require('./_object-pie').f;
module.exports = function (isEntries) {
  return function (it) {
    var O = toIObject(it);
    var keys = getKeys(O);
    var length = keys.length;
    var i = 0;
    var result = [];
    var key;
    while (length > i) if (isEnum.call(O, key = keys[i++])) {
      result.push(isEntries ? [key, O[key]] : O[key]);
    } return result;
  };
};

},{"./_object-keys":82,"./_object-pie":83,"./_to-iobject":118}],86:[function(require,module,exports){
// all object keys, includes non-enumerable and symbols
var gOPN = require('./_object-gopn');
var gOPS = require('./_object-gops');
var anObject = require('./_an-object');
var Reflect = require('./_global').Reflect;
module.exports = Reflect && Reflect.ownKeys || function ownKeys(it) {
  var keys = gOPN.f(anObject(it));
  var getSymbols = gOPS.f;
  return getSymbols ? keys.concat(getSymbols(it)) : keys;
};

},{"./_an-object":8,"./_global":41,"./_object-gopn":78,"./_object-gops":79}],87:[function(require,module,exports){
var $parseFloat = require('./_global').parseFloat;
var $trim = require('./_string-trim').trim;

module.exports = 1 / $parseFloat(require('./_string-ws') + '-0') !== -Infinity ? function parseFloat(str) {
  var string = $trim(String(str), 3);
  var result = $parseFloat(string);
  return result === 0 && string.charAt(0) == '-' ? -0 : result;
} : $parseFloat;

},{"./_global":41,"./_string-trim":112,"./_string-ws":113}],88:[function(require,module,exports){
var $parseInt = require('./_global').parseInt;
var $trim = require('./_string-trim').trim;
var ws = require('./_string-ws');
var hex = /^[-+]?0[xX]/;

module.exports = $parseInt(ws + '08') !== 8 || $parseInt(ws + '0x16') !== 22 ? function parseInt(str, radix) {
  var string = $trim(String(str), 3);
  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
} : $parseInt;

},{"./_global":41,"./_string-trim":112,"./_string-ws":113}],89:[function(require,module,exports){
'use strict';
var path = require('./_path');
var invoke = require('./_invoke');
var aFunction = require('./_a-function');
module.exports = function (/* ...pargs */) {
  var fn = aFunction(this);
  var length = arguments.length;
  var pargs = Array(length);
  var i = 0;
  var _ = path._;
  var holder = false;
  while (length > i) if ((pargs[i] = arguments[i++]) === _) holder = true;
  return function (/* ...args */) {
    var that = this;
    var aLen = arguments.length;
    var j = 0;
    var k = 0;
    var args;
    if (!holder && !aLen) return invoke(fn, pargs, that);
    args = pargs.slice();
    if (holder) for (;length > j; j++) if (args[j] === _) args[j] = arguments[k++];
    while (aLen > k) args.push(arguments[k++]);
    return invoke(fn, args, that);
  };
};

},{"./_a-function":4,"./_invoke":47,"./_path":90}],90:[function(require,module,exports){
module.exports = require('./_global');

},{"./_global":41}],91:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};

},{}],92:[function(require,module,exports){
var newPromiseCapability = require('./_new-promise-capability');

module.exports = function (C, x) {
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"./_new-promise-capability":70}],93:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],94:[function(require,module,exports){
var redefine = require('./_redefine');
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};

},{"./_redefine":95}],95:[function(require,module,exports){
var global = require('./_global');
var hide = require('./_hide');
var has = require('./_has');
var SRC = require('./_uid')('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"./_core":24,"./_global":41,"./_has":42,"./_hide":43,"./_uid":125}],96:[function(require,module,exports){
module.exports = function (regExp, replace) {
  var replacer = replace === Object(replace) ? function (part) {
    return replace[part];
  } : replace;
  return function (it) {
    return String(it).replace(regExp, replacer);
  };
};

},{}],97:[function(require,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y) {
  // eslint-disable-next-line no-self-compare
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};

},{}],98:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');
var aFunction = require('./_a-function');
var ctx = require('./_ctx');
var forOf = require('./_for-of');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { from: function from(source /* , mapFn, thisArg */) {
    var mapFn = arguments[1];
    var mapping, A, n, cb;
    aFunction(this);
    mapping = mapFn !== undefined;
    if (mapping) aFunction(mapFn);
    if (source == undefined) return new this();
    A = [];
    if (mapping) {
      n = 0;
      cb = ctx(mapFn, arguments[2], 2);
      forOf(source, false, function (nextItem) {
        A.push(cb(nextItem, n++));
      });
    } else {
      forOf(source, false, A.push, A);
    }
    return new this(A);
  } });
};

},{"./_a-function":4,"./_ctx":26,"./_export":34,"./_for-of":40}],99:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { of: function of() {
    var length = arguments.length;
    var A = Array(length);
    while (length--) A[length] = arguments[length];
    return new this(A);
  } });
};

},{"./_export":34}],100:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = require('./_is-object');
var anObject = require('./_an-object');
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = require('./_ctx')(Function.call, require('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

},{"./_an-object":8,"./_ctx":26,"./_is-object":52,"./_object-gopd":76}],101:[function(require,module,exports){
'use strict';
var global = require('./_global');
var dP = require('./_object-dp');
var DESCRIPTORS = require('./_descriptors');
var SPECIES = require('./_wks')('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

},{"./_descriptors":30,"./_global":41,"./_object-dp":73,"./_wks":129}],102:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":42,"./_object-dp":73,"./_wks":129}],103:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":104,"./_uid":125}],104:[function(require,module,exports){
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":41}],105:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = require('./_an-object');
var aFunction = require('./_a-function');
var SPECIES = require('./_wks')('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};

},{"./_a-function":4,"./_an-object":8,"./_wks":129}],106:[function(require,module,exports){
'use strict';
var fails = require('./_fails');

module.exports = function (method, arg) {
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call
    arg ? method.call(null, function () { /* empty */ }, 1) : method.call(null);
  });
};

},{"./_fails":36}],107:[function(require,module,exports){
var toInteger = require('./_to-integer');
var defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":29,"./_to-integer":117}],108:[function(require,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = require('./_is-regexp');
var defined = require('./_defined');

module.exports = function (that, searchString, NAME) {
  if (isRegExp(searchString)) throw TypeError('String#' + NAME + " doesn't accept regex!");
  return String(defined(that));
};

},{"./_defined":29,"./_is-regexp":53}],109:[function(require,module,exports){
var $export = require('./_export');
var fails = require('./_fails');
var defined = require('./_defined');
var quot = /"/g;
// B.2.3.2.1 CreateHTML(string, tag, attribute, value)
var createHTML = function (string, tag, attribute, value) {
  var S = String(defined(string));
  var p1 = '<' + tag;
  if (attribute !== '') p1 += ' ' + attribute + '="' + String(value).replace(quot, '&quot;') + '"';
  return p1 + '>' + S + '</' + tag + '>';
};
module.exports = function (NAME, exec) {
  var O = {};
  O[NAME] = exec(createHTML);
  $export($export.P + $export.F * fails(function () {
    var test = ''[NAME]('"');
    return test !== test.toLowerCase() || test.split('"').length > 3;
  }), 'String', O);
};

},{"./_defined":29,"./_export":34,"./_fails":36}],110:[function(require,module,exports){
// https://github.com/tc39/proposal-string-pad-start-end
var toLength = require('./_to-length');
var repeat = require('./_string-repeat');
var defined = require('./_defined');

module.exports = function (that, maxLength, fillString, left) {
  var S = String(defined(that));
  var stringLength = S.length;
  var fillStr = fillString === undefined ? ' ' : String(fillString);
  var intMaxLength = toLength(maxLength);
  if (intMaxLength <= stringLength || fillStr == '') return S;
  var fillLen = intMaxLength - stringLength;
  var stringFiller = repeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
  if (stringFiller.length > fillLen) stringFiller = stringFiller.slice(0, fillLen);
  return left ? stringFiller + S : S + stringFiller;
};

},{"./_defined":29,"./_string-repeat":111,"./_to-length":119}],111:[function(require,module,exports){
'use strict';
var toInteger = require('./_to-integer');
var defined = require('./_defined');

module.exports = function repeat(count) {
  var str = String(defined(this));
  var res = '';
  var n = toInteger(count);
  if (n < 0 || n == Infinity) throw RangeError("Count can't be negative");
  for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) res += str;
  return res;
};

},{"./_defined":29,"./_to-integer":117}],112:[function(require,module,exports){
var $export = require('./_export');
var defined = require('./_defined');
var fails = require('./_fails');
var spaces = require('./_string-ws');
var space = '[' + spaces + ']';
var non = '\u200b\u0085';
var ltrim = RegExp('^' + space + space + '*');
var rtrim = RegExp(space + space + '*$');

var exporter = function (KEY, exec, ALIAS) {
  var exp = {};
  var FORCE = fails(function () {
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if (ALIAS) exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function (string, TYPE) {
  string = String(defined(string));
  if (TYPE & 1) string = string.replace(ltrim, '');
  if (TYPE & 2) string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;

},{"./_defined":29,"./_export":34,"./_fails":36,"./_string-ws":113}],113:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

},{}],114:[function(require,module,exports){
var ctx = require('./_ctx');
var invoke = require('./_invoke');
var html = require('./_html');
var cel = require('./_dom-create');
var global = require('./_global');
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (require('./_cof')(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};

},{"./_cof":19,"./_ctx":26,"./_dom-create":31,"./_global":41,"./_html":44,"./_invoke":47}],115:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":117}],116:[function(require,module,exports){
// https://tc39.github.io/ecma262/#sec-toindex
var toInteger = require('./_to-integer');
var toLength = require('./_to-length');
module.exports = function (it) {
  if (it === undefined) return 0;
  var number = toInteger(it);
  var length = toLength(number);
  if (number !== length) throw RangeError('Wrong length!');
  return length;
};

},{"./_to-integer":117,"./_to-length":119}],117:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],118:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":29,"./_iobject":48}],119:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":117}],120:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":29}],121:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":52}],122:[function(require,module,exports){
'use strict';
if (require('./_descriptors')) {
  var LIBRARY = require('./_library');
  var global = require('./_global');
  var fails = require('./_fails');
  var $export = require('./_export');
  var $typed = require('./_typed');
  var $buffer = require('./_typed-buffer');
  var ctx = require('./_ctx');
  var anInstance = require('./_an-instance');
  var propertyDesc = require('./_property-desc');
  var hide = require('./_hide');
  var redefineAll = require('./_redefine-all');
  var toInteger = require('./_to-integer');
  var toLength = require('./_to-length');
  var toIndex = require('./_to-index');
  var toAbsoluteIndex = require('./_to-absolute-index');
  var toPrimitive = require('./_to-primitive');
  var has = require('./_has');
  var classof = require('./_classof');
  var isObject = require('./_is-object');
  var toObject = require('./_to-object');
  var isArrayIter = require('./_is-array-iter');
  var create = require('./_object-create');
  var getPrototypeOf = require('./_object-gpo');
  var gOPN = require('./_object-gopn').f;
  var getIterFn = require('./core.get-iterator-method');
  var uid = require('./_uid');
  var wks = require('./_wks');
  var createArrayMethod = require('./_array-methods');
  var createArrayIncludes = require('./_array-includes');
  var speciesConstructor = require('./_species-constructor');
  var ArrayIterators = require('./es6.array.iterator');
  var Iterators = require('./_iterators');
  var $iterDetect = require('./_iter-detect');
  var setSpecies = require('./_set-species');
  var arrayFill = require('./_array-fill');
  var arrayCopyWithin = require('./_array-copy-within');
  var $DP = require('./_object-dp');
  var $GOPD = require('./_object-gopd');
  var dP = $DP.f;
  var gOPD = $GOPD.f;
  var RangeError = global.RangeError;
  var TypeError = global.TypeError;
  var Uint8Array = global.Uint8Array;
  var ARRAY_BUFFER = 'ArrayBuffer';
  var SHARED_BUFFER = 'Shared' + ARRAY_BUFFER;
  var BYTES_PER_ELEMENT = 'BYTES_PER_ELEMENT';
  var PROTOTYPE = 'prototype';
  var ArrayProto = Array[PROTOTYPE];
  var $ArrayBuffer = $buffer.ArrayBuffer;
  var $DataView = $buffer.DataView;
  var arrayForEach = createArrayMethod(0);
  var arrayFilter = createArrayMethod(2);
  var arraySome = createArrayMethod(3);
  var arrayEvery = createArrayMethod(4);
  var arrayFind = createArrayMethod(5);
  var arrayFindIndex = createArrayMethod(6);
  var arrayIncludes = createArrayIncludes(true);
  var arrayIndexOf = createArrayIncludes(false);
  var arrayValues = ArrayIterators.values;
  var arrayKeys = ArrayIterators.keys;
  var arrayEntries = ArrayIterators.entries;
  var arrayLastIndexOf = ArrayProto.lastIndexOf;
  var arrayReduce = ArrayProto.reduce;
  var arrayReduceRight = ArrayProto.reduceRight;
  var arrayJoin = ArrayProto.join;
  var arraySort = ArrayProto.sort;
  var arraySlice = ArrayProto.slice;
  var arrayToString = ArrayProto.toString;
  var arrayToLocaleString = ArrayProto.toLocaleString;
  var ITERATOR = wks('iterator');
  var TAG = wks('toStringTag');
  var TYPED_CONSTRUCTOR = uid('typed_constructor');
  var DEF_CONSTRUCTOR = uid('def_constructor');
  var ALL_CONSTRUCTORS = $typed.CONSTR;
  var TYPED_ARRAY = $typed.TYPED;
  var VIEW = $typed.VIEW;
  var WRONG_LENGTH = 'Wrong length!';

  var $map = createArrayMethod(1, function (O, length) {
    return allocate(speciesConstructor(O, O[DEF_CONSTRUCTOR]), length);
  });

  var LITTLE_ENDIAN = fails(function () {
    // eslint-disable-next-line no-undef
    return new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  });

  var FORCED_SET = !!Uint8Array && !!Uint8Array[PROTOTYPE].set && fails(function () {
    new Uint8Array(1).set({});
  });

  var toOffset = function (it, BYTES) {
    var offset = toInteger(it);
    if (offset < 0 || offset % BYTES) throw RangeError('Wrong offset!');
    return offset;
  };

  var validate = function (it) {
    if (isObject(it) && TYPED_ARRAY in it) return it;
    throw TypeError(it + ' is not a typed array!');
  };

  var allocate = function (C, length) {
    if (!(isObject(C) && TYPED_CONSTRUCTOR in C)) {
      throw TypeError('It is not a typed array constructor!');
    } return new C(length);
  };

  var speciesFromList = function (O, list) {
    return fromList(speciesConstructor(O, O[DEF_CONSTRUCTOR]), list);
  };

  var fromList = function (C, list) {
    var index = 0;
    var length = list.length;
    var result = allocate(C, length);
    while (length > index) result[index] = list[index++];
    return result;
  };

  var addGetter = function (it, key, internal) {
    dP(it, key, { get: function () { return this._d[internal]; } });
  };

  var $from = function from(source /* , mapfn, thisArg */) {
    var O = toObject(source);
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var iterFn = getIterFn(O);
    var i, length, values, result, step, iterator;
    if (iterFn != undefined && !isArrayIter(iterFn)) {
      for (iterator = iterFn.call(O), values = [], i = 0; !(step = iterator.next()).done; i++) {
        values.push(step.value);
      } O = values;
    }
    if (mapping && aLen > 2) mapfn = ctx(mapfn, arguments[2], 2);
    for (i = 0, length = toLength(O.length), result = allocate(this, length); length > i; i++) {
      result[i] = mapping ? mapfn(O[i], i) : O[i];
    }
    return result;
  };

  var $of = function of(/* ...items */) {
    var index = 0;
    var length = arguments.length;
    var result = allocate(this, length);
    while (length > index) result[index] = arguments[index++];
    return result;
  };

  // iOS Safari 6.x fails here
  var TO_LOCALE_BUG = !!Uint8Array && fails(function () { arrayToLocaleString.call(new Uint8Array(1)); });

  var $toLocaleString = function toLocaleString() {
    return arrayToLocaleString.apply(TO_LOCALE_BUG ? arraySlice.call(validate(this)) : validate(this), arguments);
  };

  var proto = {
    copyWithin: function copyWithin(target, start /* , end */) {
      return arrayCopyWithin.call(validate(this), target, start, arguments.length > 2 ? arguments[2] : undefined);
    },
    every: function every(callbackfn /* , thisArg */) {
      return arrayEvery(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    fill: function fill(value /* , start, end */) { // eslint-disable-line no-unused-vars
      return arrayFill.apply(validate(this), arguments);
    },
    filter: function filter(callbackfn /* , thisArg */) {
      return speciesFromList(this, arrayFilter(validate(this), callbackfn,
        arguments.length > 1 ? arguments[1] : undefined));
    },
    find: function find(predicate /* , thisArg */) {
      return arrayFind(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    findIndex: function findIndex(predicate /* , thisArg */) {
      return arrayFindIndex(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    forEach: function forEach(callbackfn /* , thisArg */) {
      arrayForEach(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    indexOf: function indexOf(searchElement /* , fromIndex */) {
      return arrayIndexOf(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    includes: function includes(searchElement /* , fromIndex */) {
      return arrayIncludes(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    join: function join(separator) { // eslint-disable-line no-unused-vars
      return arrayJoin.apply(validate(this), arguments);
    },
    lastIndexOf: function lastIndexOf(searchElement /* , fromIndex */) { // eslint-disable-line no-unused-vars
      return arrayLastIndexOf.apply(validate(this), arguments);
    },
    map: function map(mapfn /* , thisArg */) {
      return $map(validate(this), mapfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    reduce: function reduce(callbackfn /* , initialValue */) { // eslint-disable-line no-unused-vars
      return arrayReduce.apply(validate(this), arguments);
    },
    reduceRight: function reduceRight(callbackfn /* , initialValue */) { // eslint-disable-line no-unused-vars
      return arrayReduceRight.apply(validate(this), arguments);
    },
    reverse: function reverse() {
      var that = this;
      var length = validate(that).length;
      var middle = Math.floor(length / 2);
      var index = 0;
      var value;
      while (index < middle) {
        value = that[index];
        that[index++] = that[--length];
        that[length] = value;
      } return that;
    },
    some: function some(callbackfn /* , thisArg */) {
      return arraySome(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    sort: function sort(comparefn) {
      return arraySort.call(validate(this), comparefn);
    },
    subarray: function subarray(begin, end) {
      var O = validate(this);
      var length = O.length;
      var $begin = toAbsoluteIndex(begin, length);
      return new (speciesConstructor(O, O[DEF_CONSTRUCTOR]))(
        O.buffer,
        O.byteOffset + $begin * O.BYTES_PER_ELEMENT,
        toLength((end === undefined ? length : toAbsoluteIndex(end, length)) - $begin)
      );
    }
  };

  var $slice = function slice(start, end) {
    return speciesFromList(this, arraySlice.call(validate(this), start, end));
  };

  var $set = function set(arrayLike /* , offset */) {
    validate(this);
    var offset = toOffset(arguments[1], 1);
    var length = this.length;
    var src = toObject(arrayLike);
    var len = toLength(src.length);
    var index = 0;
    if (len + offset > length) throw RangeError(WRONG_LENGTH);
    while (index < len) this[offset + index] = src[index++];
  };

  var $iterators = {
    entries: function entries() {
      return arrayEntries.call(validate(this));
    },
    keys: function keys() {
      return arrayKeys.call(validate(this));
    },
    values: function values() {
      return arrayValues.call(validate(this));
    }
  };

  var isTAIndex = function (target, key) {
    return isObject(target)
      && target[TYPED_ARRAY]
      && typeof key != 'symbol'
      && key in target
      && String(+key) == String(key);
  };
  var $getDesc = function getOwnPropertyDescriptor(target, key) {
    return isTAIndex(target, key = toPrimitive(key, true))
      ? propertyDesc(2, target[key])
      : gOPD(target, key);
  };
  var $setDesc = function defineProperty(target, key, desc) {
    if (isTAIndex(target, key = toPrimitive(key, true))
      && isObject(desc)
      && has(desc, 'value')
      && !has(desc, 'get')
      && !has(desc, 'set')
      // TODO: add validation descriptor w/o calling accessors
      && !desc.configurable
      && (!has(desc, 'writable') || desc.writable)
      && (!has(desc, 'enumerable') || desc.enumerable)
    ) {
      target[key] = desc.value;
      return target;
    } return dP(target, key, desc);
  };

  if (!ALL_CONSTRUCTORS) {
    $GOPD.f = $getDesc;
    $DP.f = $setDesc;
  }

  $export($export.S + $export.F * !ALL_CONSTRUCTORS, 'Object', {
    getOwnPropertyDescriptor: $getDesc,
    defineProperty: $setDesc
  });

  if (fails(function () { arrayToString.call({}); })) {
    arrayToString = arrayToLocaleString = function toString() {
      return arrayJoin.call(this);
    };
  }

  var $TypedArrayPrototype$ = redefineAll({}, proto);
  redefineAll($TypedArrayPrototype$, $iterators);
  hide($TypedArrayPrototype$, ITERATOR, $iterators.values);
  redefineAll($TypedArrayPrototype$, {
    slice: $slice,
    set: $set,
    constructor: function () { /* noop */ },
    toString: arrayToString,
    toLocaleString: $toLocaleString
  });
  addGetter($TypedArrayPrototype$, 'buffer', 'b');
  addGetter($TypedArrayPrototype$, 'byteOffset', 'o');
  addGetter($TypedArrayPrototype$, 'byteLength', 'l');
  addGetter($TypedArrayPrototype$, 'length', 'e');
  dP($TypedArrayPrototype$, TAG, {
    get: function () { return this[TYPED_ARRAY]; }
  });

  // eslint-disable-next-line max-statements
  module.exports = function (KEY, BYTES, wrapper, CLAMPED) {
    CLAMPED = !!CLAMPED;
    var NAME = KEY + (CLAMPED ? 'Clamped' : '') + 'Array';
    var GETTER = 'get' + KEY;
    var SETTER = 'set' + KEY;
    var TypedArray = global[NAME];
    var Base = TypedArray || {};
    var TAC = TypedArray && getPrototypeOf(TypedArray);
    var FORCED = !TypedArray || !$typed.ABV;
    var O = {};
    var TypedArrayPrototype = TypedArray && TypedArray[PROTOTYPE];
    var getter = function (that, index) {
      var data = that._d;
      return data.v[GETTER](index * BYTES + data.o, LITTLE_ENDIAN);
    };
    var setter = function (that, index, value) {
      var data = that._d;
      if (CLAMPED) value = (value = Math.round(value)) < 0 ? 0 : value > 0xff ? 0xff : value & 0xff;
      data.v[SETTER](index * BYTES + data.o, value, LITTLE_ENDIAN);
    };
    var addElement = function (that, index) {
      dP(that, index, {
        get: function () {
          return getter(this, index);
        },
        set: function (value) {
          return setter(this, index, value);
        },
        enumerable: true
      });
    };
    if (FORCED) {
      TypedArray = wrapper(function (that, data, $offset, $length) {
        anInstance(that, TypedArray, NAME, '_d');
        var index = 0;
        var offset = 0;
        var buffer, byteLength, length, klass;
        if (!isObject(data)) {
          length = toIndex(data);
          byteLength = length * BYTES;
          buffer = new $ArrayBuffer(byteLength);
        } else if (data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER) {
          buffer = data;
          offset = toOffset($offset, BYTES);
          var $len = data.byteLength;
          if ($length === undefined) {
            if ($len % BYTES) throw RangeError(WRONG_LENGTH);
            byteLength = $len - offset;
            if (byteLength < 0) throw RangeError(WRONG_LENGTH);
          } else {
            byteLength = toLength($length) * BYTES;
            if (byteLength + offset > $len) throw RangeError(WRONG_LENGTH);
          }
          length = byteLength / BYTES;
        } else if (TYPED_ARRAY in data) {
          return fromList(TypedArray, data);
        } else {
          return $from.call(TypedArray, data);
        }
        hide(that, '_d', {
          b: buffer,
          o: offset,
          l: byteLength,
          e: length,
          v: new $DataView(buffer)
        });
        while (index < length) addElement(that, index++);
      });
      TypedArrayPrototype = TypedArray[PROTOTYPE] = create($TypedArrayPrototype$);
      hide(TypedArrayPrototype, 'constructor', TypedArray);
    } else if (!fails(function () {
      TypedArray(1);
    }) || !fails(function () {
      new TypedArray(-1); // eslint-disable-line no-new
    }) || !$iterDetect(function (iter) {
      new TypedArray(); // eslint-disable-line no-new
      new TypedArray(null); // eslint-disable-line no-new
      new TypedArray(1.5); // eslint-disable-line no-new
      new TypedArray(iter); // eslint-disable-line no-new
    }, true)) {
      TypedArray = wrapper(function (that, data, $offset, $length) {
        anInstance(that, TypedArray, NAME);
        var klass;
        // `ws` module bug, temporarily remove validation length for Uint8Array
        // https://github.com/websockets/ws/pull/645
        if (!isObject(data)) return new Base(toIndex(data));
        if (data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER) {
          return $length !== undefined
            ? new Base(data, toOffset($offset, BYTES), $length)
            : $offset !== undefined
              ? new Base(data, toOffset($offset, BYTES))
              : new Base(data);
        }
        if (TYPED_ARRAY in data) return fromList(TypedArray, data);
        return $from.call(TypedArray, data);
      });
      arrayForEach(TAC !== Function.prototype ? gOPN(Base).concat(gOPN(TAC)) : gOPN(Base), function (key) {
        if (!(key in TypedArray)) hide(TypedArray, key, Base[key]);
      });
      TypedArray[PROTOTYPE] = TypedArrayPrototype;
      if (!LIBRARY) TypedArrayPrototype.constructor = TypedArray;
    }
    var $nativeIterator = TypedArrayPrototype[ITERATOR];
    var CORRECT_ITER_NAME = !!$nativeIterator
      && ($nativeIterator.name == 'values' || $nativeIterator.name == undefined);
    var $iterator = $iterators.values;
    hide(TypedArray, TYPED_CONSTRUCTOR, true);
    hide(TypedArrayPrototype, TYPED_ARRAY, NAME);
    hide(TypedArrayPrototype, VIEW, true);
    hide(TypedArrayPrototype, DEF_CONSTRUCTOR, TypedArray);

    if (CLAMPED ? new TypedArray(1)[TAG] != NAME : !(TAG in TypedArrayPrototype)) {
      dP(TypedArrayPrototype, TAG, {
        get: function () { return NAME; }
      });
    }

    O[NAME] = TypedArray;

    $export($export.G + $export.W + $export.F * (TypedArray != Base), O);

    $export($export.S, NAME, {
      BYTES_PER_ELEMENT: BYTES
    });

    $export($export.S + $export.F * fails(function () { Base.of.call(TypedArray, 1); }), NAME, {
      from: $from,
      of: $of
    });

    if (!(BYTES_PER_ELEMENT in TypedArrayPrototype)) hide(TypedArrayPrototype, BYTES_PER_ELEMENT, BYTES);

    $export($export.P, NAME, proto);

    setSpecies(NAME);

    $export($export.P + $export.F * FORCED_SET, NAME, { set: $set });

    $export($export.P + $export.F * !CORRECT_ITER_NAME, NAME, $iterators);

    if (!LIBRARY && TypedArrayPrototype.toString != arrayToString) TypedArrayPrototype.toString = arrayToString;

    $export($export.P + $export.F * fails(function () {
      new TypedArray(1).slice();
    }), NAME, { slice: $slice });

    $export($export.P + $export.F * (fails(function () {
      return [1, 2].toLocaleString() != new TypedArray([1, 2]).toLocaleString();
    }) || !fails(function () {
      TypedArrayPrototype.toLocaleString.call([1, 2]);
    })), NAME, { toLocaleString: $toLocaleString });

    Iterators[NAME] = CORRECT_ITER_NAME ? $nativeIterator : $iterator;
    if (!LIBRARY && !CORRECT_ITER_NAME) hide(TypedArrayPrototype, ITERATOR, $iterator);
  };
} else module.exports = function () { /* empty */ };

},{"./_an-instance":7,"./_array-copy-within":9,"./_array-fill":10,"./_array-includes":12,"./_array-methods":13,"./_classof":18,"./_ctx":26,"./_descriptors":30,"./_export":34,"./_fails":36,"./_global":41,"./_has":42,"./_hide":43,"./_is-array-iter":49,"./_is-object":52,"./_iter-detect":57,"./_iterators":59,"./_library":61,"./_object-create":72,"./_object-dp":73,"./_object-gopd":76,"./_object-gopn":78,"./_object-gpo":80,"./_property-desc":93,"./_redefine-all":94,"./_set-species":101,"./_species-constructor":105,"./_to-absolute-index":115,"./_to-index":116,"./_to-integer":117,"./_to-length":119,"./_to-object":120,"./_to-primitive":121,"./_typed":124,"./_typed-buffer":123,"./_uid":125,"./_wks":129,"./core.get-iterator-method":130,"./es6.array.iterator":142}],123:[function(require,module,exports){
'use strict';
var global = require('./_global');
var DESCRIPTORS = require('./_descriptors');
var LIBRARY = require('./_library');
var $typed = require('./_typed');
var hide = require('./_hide');
var redefineAll = require('./_redefine-all');
var fails = require('./_fails');
var anInstance = require('./_an-instance');
var toInteger = require('./_to-integer');
var toLength = require('./_to-length');
var toIndex = require('./_to-index');
var gOPN = require('./_object-gopn').f;
var dP = require('./_object-dp').f;
var arrayFill = require('./_array-fill');
var setToStringTag = require('./_set-to-string-tag');
var ARRAY_BUFFER = 'ArrayBuffer';
var DATA_VIEW = 'DataView';
var PROTOTYPE = 'prototype';
var WRONG_LENGTH = 'Wrong length!';
var WRONG_INDEX = 'Wrong index!';
var $ArrayBuffer = global[ARRAY_BUFFER];
var $DataView = global[DATA_VIEW];
var Math = global.Math;
var RangeError = global.RangeError;
// eslint-disable-next-line no-shadow-restricted-names
var Infinity = global.Infinity;
var BaseBuffer = $ArrayBuffer;
var abs = Math.abs;
var pow = Math.pow;
var floor = Math.floor;
var log = Math.log;
var LN2 = Math.LN2;
var BUFFER = 'buffer';
var BYTE_LENGTH = 'byteLength';
var BYTE_OFFSET = 'byteOffset';
var $BUFFER = DESCRIPTORS ? '_b' : BUFFER;
var $LENGTH = DESCRIPTORS ? '_l' : BYTE_LENGTH;
var $OFFSET = DESCRIPTORS ? '_o' : BYTE_OFFSET;

// IEEE754 conversions based on https://github.com/feross/ieee754
function packIEEE754(value, mLen, nBytes) {
  var buffer = Array(nBytes);
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? pow(2, -24) - pow(2, -77) : 0;
  var i = 0;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  var e, m, c;
  value = abs(value);
  // eslint-disable-next-line no-self-compare
  if (value != value || value === Infinity) {
    // eslint-disable-next-line no-self-compare
    m = value != value ? 1 : 0;
    e = eMax;
  } else {
    e = floor(log(value) / LN2);
    if (value * (c = pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * pow(2, eBias - 1) * pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer[i++] = m & 255, m /= 256, mLen -= 8);
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer[i++] = e & 255, e /= 256, eLen -= 8);
  buffer[--i] |= s * 128;
  return buffer;
}
function unpackIEEE754(buffer, mLen, nBytes) {
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = eLen - 7;
  var i = nBytes - 1;
  var s = buffer[i--];
  var e = s & 127;
  var m;
  s >>= 7;
  for (; nBits > 0; e = e * 256 + buffer[i], i--, nBits -= 8);
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[i], i--, nBits -= 8);
  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : s ? -Infinity : Infinity;
  } else {
    m = m + pow(2, mLen);
    e = e - eBias;
  } return (s ? -1 : 1) * m * pow(2, e - mLen);
}

function unpackI32(bytes) {
  return bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
}
function packI8(it) {
  return [it & 0xff];
}
function packI16(it) {
  return [it & 0xff, it >> 8 & 0xff];
}
function packI32(it) {
  return [it & 0xff, it >> 8 & 0xff, it >> 16 & 0xff, it >> 24 & 0xff];
}
function packF64(it) {
  return packIEEE754(it, 52, 8);
}
function packF32(it) {
  return packIEEE754(it, 23, 4);
}

function addGetter(C, key, internal) {
  dP(C[PROTOTYPE], key, { get: function () { return this[internal]; } });
}

function get(view, bytes, index, isLittleEndian) {
  var numIndex = +index;
  var intIndex = toIndex(numIndex);
  if (intIndex + bytes > view[$LENGTH]) throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b;
  var start = intIndex + view[$OFFSET];
  var pack = store.slice(start, start + bytes);
  return isLittleEndian ? pack : pack.reverse();
}
function set(view, bytes, index, conversion, value, isLittleEndian) {
  var numIndex = +index;
  var intIndex = toIndex(numIndex);
  if (intIndex + bytes > view[$LENGTH]) throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b;
  var start = intIndex + view[$OFFSET];
  var pack = conversion(+value);
  for (var i = 0; i < bytes; i++) store[start + i] = pack[isLittleEndian ? i : bytes - i - 1];
}

if (!$typed.ABV) {
  $ArrayBuffer = function ArrayBuffer(length) {
    anInstance(this, $ArrayBuffer, ARRAY_BUFFER);
    var byteLength = toIndex(length);
    this._b = arrayFill.call(Array(byteLength), 0);
    this[$LENGTH] = byteLength;
  };

  $DataView = function DataView(buffer, byteOffset, byteLength) {
    anInstance(this, $DataView, DATA_VIEW);
    anInstance(buffer, $ArrayBuffer, DATA_VIEW);
    var bufferLength = buffer[$LENGTH];
    var offset = toInteger(byteOffset);
    if (offset < 0 || offset > bufferLength) throw RangeError('Wrong offset!');
    byteLength = byteLength === undefined ? bufferLength - offset : toLength(byteLength);
    if (offset + byteLength > bufferLength) throw RangeError(WRONG_LENGTH);
    this[$BUFFER] = buffer;
    this[$OFFSET] = offset;
    this[$LENGTH] = byteLength;
  };

  if (DESCRIPTORS) {
    addGetter($ArrayBuffer, BYTE_LENGTH, '_l');
    addGetter($DataView, BUFFER, '_b');
    addGetter($DataView, BYTE_LENGTH, '_l');
    addGetter($DataView, BYTE_OFFSET, '_o');
  }

  redefineAll($DataView[PROTOTYPE], {
    getInt8: function getInt8(byteOffset) {
      return get(this, 1, byteOffset)[0] << 24 >> 24;
    },
    getUint8: function getUint8(byteOffset) {
      return get(this, 1, byteOffset)[0];
    },
    getInt16: function getInt16(byteOffset /* , littleEndian */) {
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return (bytes[1] << 8 | bytes[0]) << 16 >> 16;
    },
    getUint16: function getUint16(byteOffset /* , littleEndian */) {
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return bytes[1] << 8 | bytes[0];
    },
    getInt32: function getInt32(byteOffset /* , littleEndian */) {
      return unpackI32(get(this, 4, byteOffset, arguments[1]));
    },
    getUint32: function getUint32(byteOffset /* , littleEndian */) {
      return unpackI32(get(this, 4, byteOffset, arguments[1])) >>> 0;
    },
    getFloat32: function getFloat32(byteOffset /* , littleEndian */) {
      return unpackIEEE754(get(this, 4, byteOffset, arguments[1]), 23, 4);
    },
    getFloat64: function getFloat64(byteOffset /* , littleEndian */) {
      return unpackIEEE754(get(this, 8, byteOffset, arguments[1]), 52, 8);
    },
    setInt8: function setInt8(byteOffset, value) {
      set(this, 1, byteOffset, packI8, value);
    },
    setUint8: function setUint8(byteOffset, value) {
      set(this, 1, byteOffset, packI8, value);
    },
    setInt16: function setInt16(byteOffset, value /* , littleEndian */) {
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setUint16: function setUint16(byteOffset, value /* , littleEndian */) {
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setInt32: function setInt32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setUint32: function setUint32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setFloat32: function setFloat32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packF32, value, arguments[2]);
    },
    setFloat64: function setFloat64(byteOffset, value /* , littleEndian */) {
      set(this, 8, byteOffset, packF64, value, arguments[2]);
    }
  });
} else {
  if (!fails(function () {
    $ArrayBuffer(1);
  }) || !fails(function () {
    new $ArrayBuffer(-1); // eslint-disable-line no-new
  }) || fails(function () {
    new $ArrayBuffer(); // eslint-disable-line no-new
    new $ArrayBuffer(1.5); // eslint-disable-line no-new
    new $ArrayBuffer(NaN); // eslint-disable-line no-new
    return $ArrayBuffer.name != ARRAY_BUFFER;
  })) {
    $ArrayBuffer = function ArrayBuffer(length) {
      anInstance(this, $ArrayBuffer);
      return new BaseBuffer(toIndex(length));
    };
    var ArrayBufferProto = $ArrayBuffer[PROTOTYPE] = BaseBuffer[PROTOTYPE];
    for (var keys = gOPN(BaseBuffer), j = 0, key; keys.length > j;) {
      if (!((key = keys[j++]) in $ArrayBuffer)) hide($ArrayBuffer, key, BaseBuffer[key]);
    }
    if (!LIBRARY) ArrayBufferProto.constructor = $ArrayBuffer;
  }
  // iOS Safari 7.x bug
  var view = new $DataView(new $ArrayBuffer(2));
  var $setInt8 = $DataView[PROTOTYPE].setInt8;
  view.setInt8(0, 2147483648);
  view.setInt8(1, 2147483649);
  if (view.getInt8(0) || !view.getInt8(1)) redefineAll($DataView[PROTOTYPE], {
    setInt8: function setInt8(byteOffset, value) {
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    },
    setUint8: function setUint8(byteOffset, value) {
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    }
  }, true);
}
setToStringTag($ArrayBuffer, ARRAY_BUFFER);
setToStringTag($DataView, DATA_VIEW);
hide($DataView[PROTOTYPE], $typed.VIEW, true);
exports[ARRAY_BUFFER] = $ArrayBuffer;
exports[DATA_VIEW] = $DataView;

},{"./_an-instance":7,"./_array-fill":10,"./_descriptors":30,"./_fails":36,"./_global":41,"./_hide":43,"./_library":61,"./_object-dp":73,"./_object-gopn":78,"./_redefine-all":94,"./_set-to-string-tag":102,"./_to-index":116,"./_to-integer":117,"./_to-length":119,"./_typed":124}],124:[function(require,module,exports){
var global = require('./_global');
var hide = require('./_hide');
var uid = require('./_uid');
var TYPED = uid('typed_array');
var VIEW = uid('view');
var ABV = !!(global.ArrayBuffer && global.DataView);
var CONSTR = ABV;
var i = 0;
var l = 9;
var Typed;

var TypedArrayConstructors = (
  'Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array'
).split(',');

while (i < l) {
  if (Typed = global[TypedArrayConstructors[i++]]) {
    hide(Typed.prototype, TYPED, true);
    hide(Typed.prototype, VIEW, true);
  } else CONSTR = false;
}

module.exports = {
  ABV: ABV,
  CONSTR: CONSTR,
  TYPED: TYPED,
  VIEW: VIEW
};

},{"./_global":41,"./_hide":43,"./_uid":125}],125:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],126:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};

},{"./_is-object":52}],127:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var LIBRARY = require('./_library');
var wksExt = require('./_wks-ext');
var defineProperty = require('./_object-dp').f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"./_core":24,"./_global":41,"./_library":61,"./_object-dp":73,"./_wks-ext":128}],128:[function(require,module,exports){
exports.f = require('./_wks');

},{"./_wks":129}],129:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":41,"./_shared":104,"./_uid":125}],130:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":18,"./_core":24,"./_iterators":59,"./_wks":129}],131:[function(require,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $export = require('./_export');
var $re = require('./_replacer')(/[\\^$*+?.()|[\]{}]/g, '\\$&');

$export($export.S, 'RegExp', { escape: function escape(it) { return $re(it); } });

},{"./_export":34,"./_replacer":96}],132:[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', { copyWithin: require('./_array-copy-within') });

require('./_add-to-unscopables')('copyWithin');

},{"./_add-to-unscopables":6,"./_array-copy-within":9,"./_export":34}],133:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $every = require('./_array-methods')(4);

$export($export.P + $export.F * !require('./_strict-method')([].every, true), 'Array', {
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: function every(callbackfn /* , thisArg */) {
    return $every(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":13,"./_export":34,"./_strict-method":106}],134:[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', { fill: require('./_array-fill') });

require('./_add-to-unscopables')('fill');

},{"./_add-to-unscopables":6,"./_array-fill":10,"./_export":34}],135:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $filter = require('./_array-methods')(2);

$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":13,"./_export":34,"./_strict-method":106}],136:[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var $export = require('./_export');
var $find = require('./_array-methods')(6);
var KEY = 'findIndex';
var forced = true;
// Shouldn't skip holes
if (KEY in []) Array(1)[KEY](function () { forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);

},{"./_add-to-unscopables":6,"./_array-methods":13,"./_export":34}],137:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = require('./_export');
var $find = require('./_array-methods')(5);
var KEY = 'find';
var forced = true;
// Shouldn't skip holes
if (KEY in []) Array(1)[KEY](function () { forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);

},{"./_add-to-unscopables":6,"./_array-methods":13,"./_export":34}],138:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $forEach = require('./_array-methods')(0);
var STRICT = require('./_strict-method')([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */) {
    return $forEach(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":13,"./_export":34,"./_strict-method":106}],139:[function(require,module,exports){
'use strict';
var ctx = require('./_ctx');
var $export = require('./_export');
var toObject = require('./_to-object');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var toLength = require('./_to-length');
var createProperty = require('./_create-property');
var getIterFn = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":25,"./_ctx":26,"./_export":34,"./_is-array-iter":49,"./_iter-call":54,"./_iter-detect":57,"./_to-length":119,"./_to-object":120,"./core.get-iterator-method":130}],140:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $indexOf = require('./_array-includes')(false);
var $native = [].indexOf;
var NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? $native.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments[1]);
  }
});

},{"./_array-includes":12,"./_export":34,"./_strict-method":106}],141:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', { isArray: require('./_is-array') });

},{"./_export":34,"./_is-array":50}],142:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":6,"./_iter-define":56,"./_iter-step":58,"./_iterators":59,"./_to-iobject":118}],143:[function(require,module,exports){
'use strict';
// 22.1.3.13 Array.prototype.join(separator)
var $export = require('./_export');
var toIObject = require('./_to-iobject');
var arrayJoin = [].join;

// fallback for not array-like strings
$export($export.P + $export.F * (require('./_iobject') != Object || !require('./_strict-method')(arrayJoin)), 'Array', {
  join: function join(separator) {
    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
  }
});

},{"./_export":34,"./_iobject":48,"./_strict-method":106,"./_to-iobject":118}],144:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toIObject = require('./_to-iobject');
var toInteger = require('./_to-integer');
var toLength = require('./_to-length');
var $native = [].lastIndexOf;
var NEGATIVE_ZERO = !!$native && 1 / [1].lastIndexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
    // convert -0 to +0
    if (NEGATIVE_ZERO) return $native.apply(this, arguments) || 0;
    var O = toIObject(this);
    var length = toLength(O.length);
    var index = length - 1;
    if (arguments.length > 1) index = Math.min(index, toInteger(arguments[1]));
    if (index < 0) index = length + index;
    for (;index >= 0; index--) if (index in O) if (O[index] === searchElement) return index || 0;
    return -1;
  }
});

},{"./_export":34,"./_strict-method":106,"./_to-integer":117,"./_to-iobject":118,"./_to-length":119}],145:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $map = require('./_array-methods')(1);

$export($export.P + $export.F * !require('./_strict-method')([].map, true), 'Array', {
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":13,"./_export":34,"./_strict-method":106}],146:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var createProperty = require('./_create-property');

// WebKit Array.of isn't generic
$export($export.S + $export.F * require('./_fails')(function () {
  function F() { /* empty */ }
  return !(Array.of.call(F) instanceof F);
}), 'Array', {
  // 22.1.2.3 Array.of( ...items)
  of: function of(/* ...args */) {
    var index = 0;
    var aLen = arguments.length;
    var result = new (typeof this == 'function' ? this : Array)(aLen);
    while (aLen > index) createProperty(result, index, arguments[index++]);
    result.length = aLen;
    return result;
  }
});

},{"./_create-property":25,"./_export":34,"./_fails":36}],147:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduceRight, true), 'Array', {
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: function reduceRight(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
  }
});

},{"./_array-reduce":14,"./_export":34,"./_strict-method":106}],148:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduce, true), 'Array', {
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }
});

},{"./_array-reduce":14,"./_export":34,"./_strict-method":106}],149:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var html = require('./_html');
var cof = require('./_cof');
var toAbsoluteIndex = require('./_to-absolute-index');
var toLength = require('./_to-length');
var arraySlice = [].slice;

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * require('./_fails')(function () {
  if (html) arraySlice.call(html);
}), 'Array', {
  slice: function slice(begin, end) {
    var len = toLength(this.length);
    var klass = cof(this);
    end = end === undefined ? len : end;
    if (klass == 'Array') return arraySlice.call(this, begin, end);
    var start = toAbsoluteIndex(begin, len);
    var upTo = toAbsoluteIndex(end, len);
    var size = toLength(upTo - start);
    var cloned = Array(size);
    var i = 0;
    for (; i < size; i++) cloned[i] = klass == 'String'
      ? this.charAt(start + i)
      : this[start + i];
    return cloned;
  }
});

},{"./_cof":19,"./_export":34,"./_fails":36,"./_html":44,"./_to-absolute-index":115,"./_to-length":119}],150:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $some = require('./_array-methods')(3);

$export($export.P + $export.F * !require('./_strict-method')([].some, true), 'Array', {
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: function some(callbackfn /* , thisArg */) {
    return $some(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":13,"./_export":34,"./_strict-method":106}],151:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var aFunction = require('./_a-function');
var toObject = require('./_to-object');
var fails = require('./_fails');
var $sort = [].sort;
var test = [1, 2, 3];

$export($export.P + $export.F * (fails(function () {
  // IE8-
  test.sort(undefined);
}) || !fails(function () {
  // V8 bug
  test.sort(null);
  // Old WebKit
}) || !require('./_strict-method')($sort)), 'Array', {
  // 22.1.3.25 Array.prototype.sort(comparefn)
  sort: function sort(comparefn) {
    return comparefn === undefined
      ? $sort.call(toObject(this))
      : $sort.call(toObject(this), aFunction(comparefn));
  }
});

},{"./_a-function":4,"./_export":34,"./_fails":36,"./_strict-method":106,"./_to-object":120}],152:[function(require,module,exports){
require('./_set-species')('Array');

},{"./_set-species":101}],153:[function(require,module,exports){
// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = require('./_export');

$export($export.S, 'Date', { now: function () { return new Date().getTime(); } });

},{"./_export":34}],154:[function(require,module,exports){
// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
var $export = require('./_export');
var toISOString = require('./_date-to-iso-string');

// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (Date.prototype.toISOString !== toISOString), 'Date', {
  toISOString: toISOString
});

},{"./_date-to-iso-string":27,"./_export":34}],155:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var toPrimitive = require('./_to-primitive');

$export($export.P + $export.F * require('./_fails')(function () {
  return new Date(NaN).toJSON() !== null
    || Date.prototype.toJSON.call({ toISOString: function () { return 1; } }) !== 1;
}), 'Date', {
  // eslint-disable-next-line no-unused-vars
  toJSON: function toJSON(key) {
    var O = toObject(this);
    var pv = toPrimitive(O);
    return typeof pv == 'number' && !isFinite(pv) ? null : O.toISOString();
  }
});

},{"./_export":34,"./_fails":36,"./_to-object":120,"./_to-primitive":121}],156:[function(require,module,exports){
var TO_PRIMITIVE = require('./_wks')('toPrimitive');
var proto = Date.prototype;

if (!(TO_PRIMITIVE in proto)) require('./_hide')(proto, TO_PRIMITIVE, require('./_date-to-primitive'));

},{"./_date-to-primitive":28,"./_hide":43,"./_wks":129}],157:[function(require,module,exports){
var DateProto = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var $toString = DateProto[TO_STRING];
var getTime = DateProto.getTime;
if (new Date(NaN) + '' != INVALID_DATE) {
  require('./_redefine')(DateProto, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}

},{"./_redefine":95}],158:[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', { bind: require('./_bind') });

},{"./_bind":17,"./_export":34}],159:[function(require,module,exports){
'use strict';
var isObject = require('./_is-object');
var getPrototypeOf = require('./_object-gpo');
var HAS_INSTANCE = require('./_wks')('hasInstance');
var FunctionProto = Function.prototype;
// 19.2.3.6 Function.prototype[@@hasInstance](V)
if (!(HAS_INSTANCE in FunctionProto)) require('./_object-dp').f(FunctionProto, HAS_INSTANCE, { value: function (O) {
  if (typeof this != 'function' || !isObject(O)) return false;
  if (!isObject(this.prototype)) return O instanceof this;
  // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
  while (O = getPrototypeOf(O)) if (this.prototype === O) return true;
  return false;
} });

},{"./_is-object":52,"./_object-dp":73,"./_object-gpo":80,"./_wks":129}],160:[function(require,module,exports){
var dP = require('./_object-dp').f;
var FProto = Function.prototype;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// 19.2.4.2 name
NAME in FProto || require('./_descriptors') && dP(FProto, NAME, {
  configurable: true,
  get: function () {
    try {
      return ('' + this).match(nameRE)[1];
    } catch (e) {
      return '';
    }
  }
});

},{"./_descriptors":30,"./_object-dp":73}],161:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var MAP = 'Map';

// 23.1 Map Objects
module.exports = require('./_collection')(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);

},{"./_collection":23,"./_collection-strong":20,"./_validate-collection":126}],162:[function(require,module,exports){
// 20.2.2.3 Math.acosh(x)
var $export = require('./_export');
var log1p = require('./_math-log1p');
var sqrt = Math.sqrt;
var $acosh = Math.acosh;

$export($export.S + $export.F * !($acosh
  // V8 bug: https://code.google.com/p/v8/issues/detail?id=3509
  && Math.floor($acosh(Number.MAX_VALUE)) == 710
  // Tor Browser bug: Math.acosh(Infinity) -> NaN
  && $acosh(Infinity) == Infinity
), 'Math', {
  acosh: function acosh(x) {
    return (x = +x) < 1 ? NaN : x > 94906265.62425156
      ? Math.log(x) + Math.LN2
      : log1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));
  }
});

},{"./_export":34,"./_math-log1p":64}],163:[function(require,module,exports){
// 20.2.2.5 Math.asinh(x)
var $export = require('./_export');
var $asinh = Math.asinh;

function asinh(x) {
  return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : Math.log(x + Math.sqrt(x * x + 1));
}

// Tor Browser bug: Math.asinh(0) -> -0
$export($export.S + $export.F * !($asinh && 1 / $asinh(0) > 0), 'Math', { asinh: asinh });

},{"./_export":34}],164:[function(require,module,exports){
// 20.2.2.7 Math.atanh(x)
var $export = require('./_export');
var $atanh = Math.atanh;

// Tor Browser bug: Math.atanh(-0) -> 0
$export($export.S + $export.F * !($atanh && 1 / $atanh(-0) < 0), 'Math', {
  atanh: function atanh(x) {
    return (x = +x) == 0 ? x : Math.log((1 + x) / (1 - x)) / 2;
  }
});

},{"./_export":34}],165:[function(require,module,exports){
// 20.2.2.9 Math.cbrt(x)
var $export = require('./_export');
var sign = require('./_math-sign');

$export($export.S, 'Math', {
  cbrt: function cbrt(x) {
    return sign(x = +x) * Math.pow(Math.abs(x), 1 / 3);
  }
});

},{"./_export":34,"./_math-sign":66}],166:[function(require,module,exports){
// 20.2.2.11 Math.clz32(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  clz32: function clz32(x) {
    return (x >>>= 0) ? 31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E) : 32;
  }
});

},{"./_export":34}],167:[function(require,module,exports){
// 20.2.2.12 Math.cosh(x)
var $export = require('./_export');
var exp = Math.exp;

$export($export.S, 'Math', {
  cosh: function cosh(x) {
    return (exp(x = +x) + exp(-x)) / 2;
  }
});

},{"./_export":34}],168:[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $export = require('./_export');
var $expm1 = require('./_math-expm1');

$export($export.S + $export.F * ($expm1 != Math.expm1), 'Math', { expm1: $expm1 });

},{"./_export":34,"./_math-expm1":62}],169:[function(require,module,exports){
// 20.2.2.16 Math.fround(x)
var $export = require('./_export');

$export($export.S, 'Math', { fround: require('./_math-fround') });

},{"./_export":34,"./_math-fround":63}],170:[function(require,module,exports){
// 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
var $export = require('./_export');
var abs = Math.abs;

$export($export.S, 'Math', {
  hypot: function hypot(value1, value2) { // eslint-disable-line no-unused-vars
    var sum = 0;
    var i = 0;
    var aLen = arguments.length;
    var larg = 0;
    var arg, div;
    while (i < aLen) {
      arg = abs(arguments[i++]);
      if (larg < arg) {
        div = larg / arg;
        sum = sum * div * div + 1;
        larg = arg;
      } else if (arg > 0) {
        div = arg / larg;
        sum += div * div;
      } else sum += arg;
    }
    return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
  }
});

},{"./_export":34}],171:[function(require,module,exports){
// 20.2.2.18 Math.imul(x, y)
var $export = require('./_export');
var $imul = Math.imul;

// some WebKit versions fails with big numbers, some has wrong arity
$export($export.S + $export.F * require('./_fails')(function () {
  return $imul(0xffffffff, 5) != -5 || $imul.length != 2;
}), 'Math', {
  imul: function imul(x, y) {
    var UINT16 = 0xffff;
    var xn = +x;
    var yn = +y;
    var xl = UINT16 & xn;
    var yl = UINT16 & yn;
    return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);
  }
});

},{"./_export":34,"./_fails":36}],172:[function(require,module,exports){
// 20.2.2.21 Math.log10(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log10: function log10(x) {
    return Math.log(x) * Math.LOG10E;
  }
});

},{"./_export":34}],173:[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
var $export = require('./_export');

$export($export.S, 'Math', { log1p: require('./_math-log1p') });

},{"./_export":34,"./_math-log1p":64}],174:[function(require,module,exports){
// 20.2.2.22 Math.log2(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log2: function log2(x) {
    return Math.log(x) / Math.LN2;
  }
});

},{"./_export":34}],175:[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
var $export = require('./_export');

$export($export.S, 'Math', { sign: require('./_math-sign') });

},{"./_export":34,"./_math-sign":66}],176:[function(require,module,exports){
// 20.2.2.30 Math.sinh(x)
var $export = require('./_export');
var expm1 = require('./_math-expm1');
var exp = Math.exp;

// V8 near Chromium 38 has a problem with very small numbers
$export($export.S + $export.F * require('./_fails')(function () {
  return !Math.sinh(-2e-17) != -2e-17;
}), 'Math', {
  sinh: function sinh(x) {
    return Math.abs(x = +x) < 1
      ? (expm1(x) - expm1(-x)) / 2
      : (exp(x - 1) - exp(-x - 1)) * (Math.E / 2);
  }
});

},{"./_export":34,"./_fails":36,"./_math-expm1":62}],177:[function(require,module,exports){
// 20.2.2.33 Math.tanh(x)
var $export = require('./_export');
var expm1 = require('./_math-expm1');
var exp = Math.exp;

$export($export.S, 'Math', {
  tanh: function tanh(x) {
    var a = expm1(x = +x);
    var b = expm1(-x);
    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
  }
});

},{"./_export":34,"./_math-expm1":62}],178:[function(require,module,exports){
// 20.2.2.34 Math.trunc(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  trunc: function trunc(it) {
    return (it > 0 ? Math.floor : Math.ceil)(it);
  }
});

},{"./_export":34}],179:[function(require,module,exports){
'use strict';
var global = require('./_global');
var has = require('./_has');
var cof = require('./_cof');
var inheritIfRequired = require('./_inherit-if-required');
var toPrimitive = require('./_to-primitive');
var fails = require('./_fails');
var gOPN = require('./_object-gopn').f;
var gOPD = require('./_object-gopd').f;
var dP = require('./_object-dp').f;
var $trim = require('./_string-trim').trim;
var NUMBER = 'Number';
var $Number = global[NUMBER];
var Base = $Number;
var proto = $Number.prototype;
// Opera ~12 has broken Object#toString
var BROKEN_COF = cof(require('./_object-create')(proto)) == NUMBER;
var TRIM = 'trim' in String.prototype;

// 7.1.3 ToNumber(argument)
var toNumber = function (argument) {
  var it = toPrimitive(argument, false);
  if (typeof it == 'string' && it.length > 2) {
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0);
    var third, radix, maxCode;
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal /^0o[0-7]+$/i
        default: return +it;
      }
      for (var digits = it.slice(2), i = 0, l = digits.length, code; i < l; i++) {
        code = digits.charCodeAt(i);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

if (!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')) {
  $Number = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var that = this;
    return that instanceof $Number
      // check on 1..constructor(foo) case
      && (BROKEN_COF ? fails(function () { proto.valueOf.call(that); }) : cof(that) != NUMBER)
        ? inheritIfRequired(new Base(toNumber(it)), that, $Number) : toNumber(it);
  };
  for (var keys = require('./_descriptors') ? gOPN(Base) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES6 (in case, if modules with ES6 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys.length > j; j++) {
    if (has(Base, key = keys[j]) && !has($Number, key)) {
      dP($Number, key, gOPD(Base, key));
    }
  }
  $Number.prototype = proto;
  proto.constructor = $Number;
  require('./_redefine')(global, NUMBER, $Number);
}

},{"./_cof":19,"./_descriptors":30,"./_fails":36,"./_global":41,"./_has":42,"./_inherit-if-required":46,"./_object-create":72,"./_object-dp":73,"./_object-gopd":76,"./_object-gopn":78,"./_redefine":95,"./_string-trim":112,"./_to-primitive":121}],180:[function(require,module,exports){
// 20.1.2.1 Number.EPSILON
var $export = require('./_export');

$export($export.S, 'Number', { EPSILON: Math.pow(2, -52) });

},{"./_export":34}],181:[function(require,module,exports){
// 20.1.2.2 Number.isFinite(number)
var $export = require('./_export');
var _isFinite = require('./_global').isFinite;

$export($export.S, 'Number', {
  isFinite: function isFinite(it) {
    return typeof it == 'number' && _isFinite(it);
  }
});

},{"./_export":34,"./_global":41}],182:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var $export = require('./_export');

$export($export.S, 'Number', { isInteger: require('./_is-integer') });

},{"./_export":34,"./_is-integer":51}],183:[function(require,module,exports){
// 20.1.2.4 Number.isNaN(number)
var $export = require('./_export');

$export($export.S, 'Number', {
  isNaN: function isNaN(number) {
    // eslint-disable-next-line no-self-compare
    return number != number;
  }
});

},{"./_export":34}],184:[function(require,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export = require('./_export');
var isInteger = require('./_is-integer');
var abs = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number) {
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});

},{"./_export":34,"./_is-integer":51}],185:[function(require,module,exports){
// 20.1.2.6 Number.MAX_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', { MAX_SAFE_INTEGER: 0x1fffffffffffff });

},{"./_export":34}],186:[function(require,module,exports){
// 20.1.2.10 Number.MIN_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', { MIN_SAFE_INTEGER: -0x1fffffffffffff });

},{"./_export":34}],187:[function(require,module,exports){
var $export = require('./_export');
var $parseFloat = require('./_parse-float');
// 20.1.2.12 Number.parseFloat(string)
$export($export.S + $export.F * (Number.parseFloat != $parseFloat), 'Number', { parseFloat: $parseFloat });

},{"./_export":34,"./_parse-float":87}],188:[function(require,module,exports){
var $export = require('./_export');
var $parseInt = require('./_parse-int');
// 20.1.2.13 Number.parseInt(string, radix)
$export($export.S + $export.F * (Number.parseInt != $parseInt), 'Number', { parseInt: $parseInt });

},{"./_export":34,"./_parse-int":88}],189:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toInteger = require('./_to-integer');
var aNumberValue = require('./_a-number-value');
var repeat = require('./_string-repeat');
var $toFixed = 1.0.toFixed;
var floor = Math.floor;
var data = [0, 0, 0, 0, 0, 0];
var ERROR = 'Number.toFixed: incorrect invocation!';
var ZERO = '0';

var multiply = function (n, c) {
  var i = -1;
  var c2 = c;
  while (++i < 6) {
    c2 += n * data[i];
    data[i] = c2 % 1e7;
    c2 = floor(c2 / 1e7);
  }
};
var divide = function (n) {
  var i = 6;
  var c = 0;
  while (--i >= 0) {
    c += data[i];
    data[i] = floor(c / n);
    c = (c % n) * 1e7;
  }
};
var numToString = function () {
  var i = 6;
  var s = '';
  while (--i >= 0) {
    if (s !== '' || i === 0 || data[i] !== 0) {
      var t = String(data[i]);
      s = s === '' ? t : s + repeat.call(ZERO, 7 - t.length) + t;
    }
  } return s;
};
var pow = function (x, n, acc) {
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};
var log = function (x) {
  var n = 0;
  var x2 = x;
  while (x2 >= 4096) {
    n += 12;
    x2 /= 4096;
  }
  while (x2 >= 2) {
    n += 1;
    x2 /= 2;
  } return n;
};

$export($export.P + $export.F * (!!$toFixed && (
  0.00008.toFixed(3) !== '0.000' ||
  0.9.toFixed(0) !== '1' ||
  1.255.toFixed(2) !== '1.25' ||
  1000000000000000128.0.toFixed(0) !== '1000000000000000128'
) || !require('./_fails')(function () {
  // V8 ~ Android 4.3-
  $toFixed.call({});
})), 'Number', {
  toFixed: function toFixed(fractionDigits) {
    var x = aNumberValue(this, ERROR);
    var f = toInteger(fractionDigits);
    var s = '';
    var m = ZERO;
    var e, z, j, k;
    if (f < 0 || f > 20) throw RangeError(ERROR);
    // eslint-disable-next-line no-self-compare
    if (x != x) return 'NaN';
    if (x <= -1e21 || x >= 1e21) return String(x);
    if (x < 0) {
      s = '-';
      x = -x;
    }
    if (x > 1e-21) {
      e = log(x * pow(2, 69, 1)) - 69;
      z = e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;
      if (e > 0) {
        multiply(0, z);
        j = f;
        while (j >= 7) {
          multiply(1e7, 0);
          j -= 7;
        }
        multiply(pow(10, j, 1), 0);
        j = e - 1;
        while (j >= 23) {
          divide(1 << 23);
          j -= 23;
        }
        divide(1 << j);
        multiply(1, 1);
        divide(2);
        m = numToString();
      } else {
        multiply(0, z);
        multiply(1 << -e, 0);
        m = numToString() + repeat.call(ZERO, f);
      }
    }
    if (f > 0) {
      k = m.length;
      m = s + (k <= f ? '0.' + repeat.call(ZERO, f - k) + m : m.slice(0, k - f) + '.' + m.slice(k - f));
    } else {
      m = s + m;
    } return m;
  }
});

},{"./_a-number-value":5,"./_export":34,"./_fails":36,"./_string-repeat":111,"./_to-integer":117}],190:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $fails = require('./_fails');
var aNumberValue = require('./_a-number-value');
var $toPrecision = 1.0.toPrecision;

$export($export.P + $export.F * ($fails(function () {
  // IE7-
  return $toPrecision.call(1, undefined) !== '1';
}) || !$fails(function () {
  // V8 ~ Android 4.3-
  $toPrecision.call({});
})), 'Number', {
  toPrecision: function toPrecision(precision) {
    var that = aNumberValue(this, 'Number#toPrecision: incorrect invocation!');
    return precision === undefined ? $toPrecision.call(that) : $toPrecision.call(that, precision);
  }
});

},{"./_a-number-value":5,"./_export":34,"./_fails":36}],191:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', { assign: require('./_object-assign') });

},{"./_export":34,"./_object-assign":71}],192:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: require('./_object-create') });

},{"./_export":34,"./_object-create":72}],193:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', { defineProperties: require('./_object-dps') });

},{"./_descriptors":30,"./_export":34,"./_object-dps":74}],194:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', { defineProperty: require('./_object-dp').f });

},{"./_descriptors":30,"./_export":34,"./_object-dp":73}],195:[function(require,module,exports){
// 19.1.2.5 Object.freeze(O)
var isObject = require('./_is-object');
var meta = require('./_meta').onFreeze;

require('./_object-sap')('freeze', function ($freeze) {
  return function freeze(it) {
    return $freeze && isObject(it) ? $freeze(meta(it)) : it;
  };
});

},{"./_is-object":52,"./_meta":67,"./_object-sap":84}],196:[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject = require('./_to-iobject');
var $getOwnPropertyDescriptor = require('./_object-gopd').f;

require('./_object-sap')('getOwnPropertyDescriptor', function () {
  return function getOwnPropertyDescriptor(it, key) {
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});

},{"./_object-gopd":76,"./_object-sap":84,"./_to-iobject":118}],197:[function(require,module,exports){
// 19.1.2.7 Object.getOwnPropertyNames(O)
require('./_object-sap')('getOwnPropertyNames', function () {
  return require('./_object-gopn-ext').f;
});

},{"./_object-gopn-ext":77,"./_object-sap":84}],198:[function(require,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject = require('./_to-object');
var $getPrototypeOf = require('./_object-gpo');

require('./_object-sap')('getPrototypeOf', function () {
  return function getPrototypeOf(it) {
    return $getPrototypeOf(toObject(it));
  };
});

},{"./_object-gpo":80,"./_object-sap":84,"./_to-object":120}],199:[function(require,module,exports){
// 19.1.2.11 Object.isExtensible(O)
var isObject = require('./_is-object');

require('./_object-sap')('isExtensible', function ($isExtensible) {
  return function isExtensible(it) {
    return isObject(it) ? $isExtensible ? $isExtensible(it) : true : false;
  };
});

},{"./_is-object":52,"./_object-sap":84}],200:[function(require,module,exports){
// 19.1.2.12 Object.isFrozen(O)
var isObject = require('./_is-object');

require('./_object-sap')('isFrozen', function ($isFrozen) {
  return function isFrozen(it) {
    return isObject(it) ? $isFrozen ? $isFrozen(it) : false : true;
  };
});

},{"./_is-object":52,"./_object-sap":84}],201:[function(require,module,exports){
// 19.1.2.13 Object.isSealed(O)
var isObject = require('./_is-object');

require('./_object-sap')('isSealed', function ($isSealed) {
  return function isSealed(it) {
    return isObject(it) ? $isSealed ? $isSealed(it) : false : true;
  };
});

},{"./_is-object":52,"./_object-sap":84}],202:[function(require,module,exports){
// 19.1.3.10 Object.is(value1, value2)
var $export = require('./_export');
$export($export.S, 'Object', { is: require('./_same-value') });

},{"./_export":34,"./_same-value":97}],203:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object');
var $keys = require('./_object-keys');

require('./_object-sap')('keys', function () {
  return function keys(it) {
    return $keys(toObject(it));
  };
});

},{"./_object-keys":82,"./_object-sap":84,"./_to-object":120}],204:[function(require,module,exports){
// 19.1.2.15 Object.preventExtensions(O)
var isObject = require('./_is-object');
var meta = require('./_meta').onFreeze;

require('./_object-sap')('preventExtensions', function ($preventExtensions) {
  return function preventExtensions(it) {
    return $preventExtensions && isObject(it) ? $preventExtensions(meta(it)) : it;
  };
});

},{"./_is-object":52,"./_meta":67,"./_object-sap":84}],205:[function(require,module,exports){
// 19.1.2.17 Object.seal(O)
var isObject = require('./_is-object');
var meta = require('./_meta').onFreeze;

require('./_object-sap')('seal', function ($seal) {
  return function seal(it) {
    return $seal && isObject(it) ? $seal(meta(it)) : it;
  };
});

},{"./_is-object":52,"./_meta":67,"./_object-sap":84}],206:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./_export');
$export($export.S, 'Object', { setPrototypeOf: require('./_set-proto').set });

},{"./_export":34,"./_set-proto":100}],207:[function(require,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var classof = require('./_classof');
var test = {};
test[require('./_wks')('toStringTag')] = 'z';
if (test + '' != '[object z]') {
  require('./_redefine')(Object.prototype, 'toString', function toString() {
    return '[object ' + classof(this) + ']';
  }, true);
}

},{"./_classof":18,"./_redefine":95,"./_wks":129}],208:[function(require,module,exports){
var $export = require('./_export');
var $parseFloat = require('./_parse-float');
// 18.2.4 parseFloat(string)
$export($export.G + $export.F * (parseFloat != $parseFloat), { parseFloat: $parseFloat });

},{"./_export":34,"./_parse-float":87}],209:[function(require,module,exports){
var $export = require('./_export');
var $parseInt = require('./_parse-int');
// 18.2.5 parseInt(string, radix)
$export($export.G + $export.F * (parseInt != $parseInt), { parseInt: $parseInt });

},{"./_export":34,"./_parse-int":88}],210:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var global = require('./_global');
var ctx = require('./_ctx');
var classof = require('./_classof');
var $export = require('./_export');
var isObject = require('./_is-object');
var aFunction = require('./_a-function');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var speciesConstructor = require('./_species-constructor');
var task = require('./_task').set;
var microtask = require('./_microtask')();
var newPromiseCapabilityModule = require('./_new-promise-capability');
var perform = require('./_perform');
var promiseResolve = require('./_promise-resolve');
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch (e) { /* empty */ }
}();

// helpers
var sameConstructor = LIBRARY ? function (a, b) {
  // with library wrapper special case
  return a === b || a === $Promise && b === Wrapper;
} : function (a, b) {
  return a === b;
};
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value);
            if (domain) domain.exit();
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  if (promise._h == 1) return false;
  var chain = promise._a || promise._c;
  var i = 0;
  var reaction;
  while (chain.length > i) {
    reaction = chain[i++];
    if (reaction.fail || !isUnhandled(reaction.promise)) return false;
  } return true;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = require('./_redefine-all')($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return sameConstructor($Promise, C)
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
require('./_set-to-string-tag')($Promise, PROMISE);
require('./_set-species')(PROMISE);
Wrapper = require('./_core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if (x instanceof $Promise && sameConstructor(x.constructor, this)) return x;
    return promiseResolve(this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});

},{"./_a-function":4,"./_an-instance":7,"./_classof":18,"./_core":24,"./_ctx":26,"./_export":34,"./_for-of":40,"./_global":41,"./_is-object":52,"./_iter-detect":57,"./_library":61,"./_microtask":69,"./_new-promise-capability":70,"./_perform":91,"./_promise-resolve":92,"./_redefine-all":94,"./_set-species":101,"./_set-to-string-tag":102,"./_species-constructor":105,"./_task":114,"./_wks":129}],211:[function(require,module,exports){
// 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
var $export = require('./_export');
var aFunction = require('./_a-function');
var anObject = require('./_an-object');
var rApply = (require('./_global').Reflect || {}).apply;
var fApply = Function.apply;
// MS Edge argumentsList argument is optional
$export($export.S + $export.F * !require('./_fails')(function () {
  rApply(function () { /* empty */ });
}), 'Reflect', {
  apply: function apply(target, thisArgument, argumentsList) {
    var T = aFunction(target);
    var L = anObject(argumentsList);
    return rApply ? rApply(T, thisArgument, L) : fApply.call(T, thisArgument, L);
  }
});

},{"./_a-function":4,"./_an-object":8,"./_export":34,"./_fails":36,"./_global":41}],212:[function(require,module,exports){
// 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
var $export = require('./_export');
var create = require('./_object-create');
var aFunction = require('./_a-function');
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var fails = require('./_fails');
var bind = require('./_bind');
var rConstruct = (require('./_global').Reflect || {}).construct;

// MS Edge supports only 2 arguments and argumentsList argument is optional
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
var NEW_TARGET_BUG = fails(function () {
  function F() { /* empty */ }
  return !(rConstruct(function () { /* empty */ }, [], F) instanceof F);
});
var ARGS_BUG = !fails(function () {
  rConstruct(function () { /* empty */ });
});

$export($export.S + $export.F * (NEW_TARGET_BUG || ARGS_BUG), 'Reflect', {
  construct: function construct(Target, args /* , newTarget */) {
    aFunction(Target);
    anObject(args);
    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    if (ARGS_BUG && !NEW_TARGET_BUG) return rConstruct(Target, args, newTarget);
    if (Target == newTarget) {
      // w/o altered newTarget, optimization for 0-4 arguments
      switch (args.length) {
        case 0: return new Target();
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      $args.push.apply($args, args);
      return new (bind.apply(Target, $args))();
    }
    // with altered newTarget, not support built-in constructors
    var proto = newTarget.prototype;
    var instance = create(isObject(proto) ? proto : Object.prototype);
    var result = Function.apply.call(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});

},{"./_a-function":4,"./_an-object":8,"./_bind":17,"./_export":34,"./_fails":36,"./_global":41,"./_is-object":52,"./_object-create":72}],213:[function(require,module,exports){
// 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
var dP = require('./_object-dp');
var $export = require('./_export');
var anObject = require('./_an-object');
var toPrimitive = require('./_to-primitive');

// MS Edge has broken Reflect.defineProperty - throwing instead of returning false
$export($export.S + $export.F * require('./_fails')(function () {
  // eslint-disable-next-line no-undef
  Reflect.defineProperty(dP.f({}, 1, { value: 1 }), 1, { value: 2 });
}), 'Reflect', {
  defineProperty: function defineProperty(target, propertyKey, attributes) {
    anObject(target);
    propertyKey = toPrimitive(propertyKey, true);
    anObject(attributes);
    try {
      dP.f(target, propertyKey, attributes);
      return true;
    } catch (e) {
      return false;
    }
  }
});

},{"./_an-object":8,"./_export":34,"./_fails":36,"./_object-dp":73,"./_to-primitive":121}],214:[function(require,module,exports){
// 26.1.4 Reflect.deleteProperty(target, propertyKey)
var $export = require('./_export');
var gOPD = require('./_object-gopd').f;
var anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  deleteProperty: function deleteProperty(target, propertyKey) {
    var desc = gOPD(anObject(target), propertyKey);
    return desc && !desc.configurable ? false : delete target[propertyKey];
  }
});

},{"./_an-object":8,"./_export":34,"./_object-gopd":76}],215:[function(require,module,exports){
'use strict';
// 26.1.5 Reflect.enumerate(target)
var $export = require('./_export');
var anObject = require('./_an-object');
var Enumerate = function (iterated) {
  this._t = anObject(iterated); // target
  this._i = 0;                  // next index
  var keys = this._k = [];      // keys
  var key;
  for (key in iterated) keys.push(key);
};
require('./_iter-create')(Enumerate, 'Object', function () {
  var that = this;
  var keys = that._k;
  var key;
  do {
    if (that._i >= keys.length) return { value: undefined, done: true };
  } while (!((key = keys[that._i++]) in that._t));
  return { value: key, done: false };
});

$export($export.S, 'Reflect', {
  enumerate: function enumerate(target) {
    return new Enumerate(target);
  }
});

},{"./_an-object":8,"./_export":34,"./_iter-create":55}],216:[function(require,module,exports){
// 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
var gOPD = require('./_object-gopd');
var $export = require('./_export');
var anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, propertyKey) {
    return gOPD.f(anObject(target), propertyKey);
  }
});

},{"./_an-object":8,"./_export":34,"./_object-gopd":76}],217:[function(require,module,exports){
// 26.1.8 Reflect.getPrototypeOf(target)
var $export = require('./_export');
var getProto = require('./_object-gpo');
var anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getPrototypeOf: function getPrototypeOf(target) {
    return getProto(anObject(target));
  }
});

},{"./_an-object":8,"./_export":34,"./_object-gpo":80}],218:[function(require,module,exports){
// 26.1.6 Reflect.get(target, propertyKey [, receiver])
var gOPD = require('./_object-gopd');
var getPrototypeOf = require('./_object-gpo');
var has = require('./_has');
var $export = require('./_export');
var isObject = require('./_is-object');
var anObject = require('./_an-object');

function get(target, propertyKey /* , receiver */) {
  var receiver = arguments.length < 3 ? target : arguments[2];
  var desc, proto;
  if (anObject(target) === receiver) return target[propertyKey];
  if (desc = gOPD.f(target, propertyKey)) return has(desc, 'value')
    ? desc.value
    : desc.get !== undefined
      ? desc.get.call(receiver)
      : undefined;
  if (isObject(proto = getPrototypeOf(target))) return get(proto, propertyKey, receiver);
}

$export($export.S, 'Reflect', { get: get });

},{"./_an-object":8,"./_export":34,"./_has":42,"./_is-object":52,"./_object-gopd":76,"./_object-gpo":80}],219:[function(require,module,exports){
// 26.1.9 Reflect.has(target, propertyKey)
var $export = require('./_export');

$export($export.S, 'Reflect', {
  has: function has(target, propertyKey) {
    return propertyKey in target;
  }
});

},{"./_export":34}],220:[function(require,module,exports){
// 26.1.10 Reflect.isExtensible(target)
var $export = require('./_export');
var anObject = require('./_an-object');
var $isExtensible = Object.isExtensible;

$export($export.S, 'Reflect', {
  isExtensible: function isExtensible(target) {
    anObject(target);
    return $isExtensible ? $isExtensible(target) : true;
  }
});

},{"./_an-object":8,"./_export":34}],221:[function(require,module,exports){
// 26.1.11 Reflect.ownKeys(target)
var $export = require('./_export');

$export($export.S, 'Reflect', { ownKeys: require('./_own-keys') });

},{"./_export":34,"./_own-keys":86}],222:[function(require,module,exports){
// 26.1.12 Reflect.preventExtensions(target)
var $export = require('./_export');
var anObject = require('./_an-object');
var $preventExtensions = Object.preventExtensions;

$export($export.S, 'Reflect', {
  preventExtensions: function preventExtensions(target) {
    anObject(target);
    try {
      if ($preventExtensions) $preventExtensions(target);
      return true;
    } catch (e) {
      return false;
    }
  }
});

},{"./_an-object":8,"./_export":34}],223:[function(require,module,exports){
// 26.1.14 Reflect.setPrototypeOf(target, proto)
var $export = require('./_export');
var setProto = require('./_set-proto');

if (setProto) $export($export.S, 'Reflect', {
  setPrototypeOf: function setPrototypeOf(target, proto) {
    setProto.check(target, proto);
    try {
      setProto.set(target, proto);
      return true;
    } catch (e) {
      return false;
    }
  }
});

},{"./_export":34,"./_set-proto":100}],224:[function(require,module,exports){
// 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
var dP = require('./_object-dp');
var gOPD = require('./_object-gopd');
var getPrototypeOf = require('./_object-gpo');
var has = require('./_has');
var $export = require('./_export');
var createDesc = require('./_property-desc');
var anObject = require('./_an-object');
var isObject = require('./_is-object');

function set(target, propertyKey, V /* , receiver */) {
  var receiver = arguments.length < 4 ? target : arguments[3];
  var ownDesc = gOPD.f(anObject(target), propertyKey);
  var existingDescriptor, proto;
  if (!ownDesc) {
    if (isObject(proto = getPrototypeOf(target))) {
      return set(proto, propertyKey, V, receiver);
    }
    ownDesc = createDesc(0);
  }
  if (has(ownDesc, 'value')) {
    if (ownDesc.writable === false || !isObject(receiver)) return false;
    existingDescriptor = gOPD.f(receiver, propertyKey) || createDesc(0);
    existingDescriptor.value = V;
    dP.f(receiver, propertyKey, existingDescriptor);
    return true;
  }
  return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
}

$export($export.S, 'Reflect', { set: set });

},{"./_an-object":8,"./_export":34,"./_has":42,"./_is-object":52,"./_object-dp":73,"./_object-gopd":76,"./_object-gpo":80,"./_property-desc":93}],225:[function(require,module,exports){
var global = require('./_global');
var inheritIfRequired = require('./_inherit-if-required');
var dP = require('./_object-dp').f;
var gOPN = require('./_object-gopn').f;
var isRegExp = require('./_is-regexp');
var $flags = require('./_flags');
var $RegExp = global.RegExp;
var Base = $RegExp;
var proto = $RegExp.prototype;
var re1 = /a/g;
var re2 = /a/g;
// "new" creates a new object, old webkit buggy here
var CORRECT_NEW = new $RegExp(re1) !== re1;

if (require('./_descriptors') && (!CORRECT_NEW || require('./_fails')(function () {
  re2[require('./_wks')('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))) {
  $RegExp = function RegExp(p, f) {
    var tiRE = this instanceof $RegExp;
    var piRE = isRegExp(p);
    var fiU = f === undefined;
    return !tiRE && piRE && p.constructor === $RegExp && fiU ? p
      : inheritIfRequired(CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? $flags.call(p) : f)
      , tiRE ? this : proto, $RegExp);
  };
  var proxy = function (key) {
    key in $RegExp || dP($RegExp, key, {
      configurable: true,
      get: function () { return Base[key]; },
      set: function (it) { Base[key] = it; }
    });
  };
  for (var keys = gOPN(Base), i = 0; keys.length > i;) proxy(keys[i++]);
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  require('./_redefine')(global, 'RegExp', $RegExp);
}

require('./_set-species')('RegExp');

},{"./_descriptors":30,"./_fails":36,"./_flags":38,"./_global":41,"./_inherit-if-required":46,"./_is-regexp":53,"./_object-dp":73,"./_object-gopn":78,"./_redefine":95,"./_set-species":101,"./_wks":129}],226:[function(require,module,exports){
// 21.2.5.3 get RegExp.prototype.flags()
if (require('./_descriptors') && /./g.flags != 'g') require('./_object-dp').f(RegExp.prototype, 'flags', {
  configurable: true,
  get: require('./_flags')
});

},{"./_descriptors":30,"./_flags":38,"./_object-dp":73}],227:[function(require,module,exports){
// @@match logic
require('./_fix-re-wks')('match', 1, function (defined, MATCH, $match) {
  // 21.1.3.11 String.prototype.match(regexp)
  return [function match(regexp) {
    'use strict';
    var O = defined(this);
    var fn = regexp == undefined ? undefined : regexp[MATCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
  }, $match];
});

},{"./_fix-re-wks":37}],228:[function(require,module,exports){
// @@replace logic
require('./_fix-re-wks')('replace', 2, function (defined, REPLACE, $replace) {
  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
  return [function replace(searchValue, replaceValue) {
    'use strict';
    var O = defined(this);
    var fn = searchValue == undefined ? undefined : searchValue[REPLACE];
    return fn !== undefined
      ? fn.call(searchValue, O, replaceValue)
      : $replace.call(String(O), searchValue, replaceValue);
  }, $replace];
});

},{"./_fix-re-wks":37}],229:[function(require,module,exports){
// @@search logic
require('./_fix-re-wks')('search', 1, function (defined, SEARCH, $search) {
  // 21.1.3.15 String.prototype.search(regexp)
  return [function search(regexp) {
    'use strict';
    var O = defined(this);
    var fn = regexp == undefined ? undefined : regexp[SEARCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
  }, $search];
});

},{"./_fix-re-wks":37}],230:[function(require,module,exports){
// @@split logic
require('./_fix-re-wks')('split', 2, function (defined, SPLIT, $split) {
  'use strict';
  var isRegExp = require('./_is-regexp');
  var _split = $split;
  var $push = [].push;
  var $SPLIT = 'split';
  var LENGTH = 'length';
  var LAST_INDEX = 'lastIndex';
  if (
    'abbc'[$SPLIT](/(b)*/)[1] == 'c' ||
    'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 ||
    'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 ||
    '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 ||
    '.'[$SPLIT](/()()/)[LENGTH] > 1 ||
    ''[$SPLIT](/.?/)[LENGTH]
  ) {
    var NPCG = /()??/.exec('')[1] === undefined; // nonparticipating capturing group
    // based on es5-shim implementation, need to rework it
    $split = function (separator, limit) {
      var string = String(this);
      if (separator === undefined && limit === 0) return [];
      // If `separator` is not a regex, use native split
      if (!isRegExp(separator)) return _split.call(string, separator, limit);
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      var splitLimit = limit === undefined ? 4294967295 : limit >>> 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var separator2, match, lastIndex, lastLength, i;
      // Doesn't need flags gy, but they don't hurt
      if (!NPCG) separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
      while (match = separatorCopy.exec(string)) {
        // `separatorCopy.lastIndex` is not reliable cross-browser
        lastIndex = match.index + match[0][LENGTH];
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          // Fix browsers whose `exec` methods don't consistently return `undefined` for NPCG
          // eslint-disable-next-line no-loop-func
          if (!NPCG && match[LENGTH] > 1) match[0].replace(separator2, function () {
            for (i = 1; i < arguments[LENGTH] - 2; i++) if (arguments[i] === undefined) match[i] = undefined;
          });
          if (match[LENGTH] > 1 && match.index < string[LENGTH]) $push.apply(output, match.slice(1));
          lastLength = match[0][LENGTH];
          lastLastIndex = lastIndex;
          if (output[LENGTH] >= splitLimit) break;
        }
        if (separatorCopy[LAST_INDEX] === match.index) separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
      }
      if (lastLastIndex === string[LENGTH]) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
    };
  // Chakra, V8
  } else if ('0'[$SPLIT](undefined, 0)[LENGTH]) {
    $split = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : _split.call(this, separator, limit);
    };
  }
  // 21.1.3.17 String.prototype.split(separator, limit)
  return [function split(separator, limit) {
    var O = defined(this);
    var fn = separator == undefined ? undefined : separator[SPLIT];
    return fn !== undefined ? fn.call(separator, O, limit) : $split.call(String(O), separator, limit);
  }, $split];
});

},{"./_fix-re-wks":37,"./_is-regexp":53}],231:[function(require,module,exports){
'use strict';
require('./es6.regexp.flags');
var anObject = require('./_an-object');
var $flags = require('./_flags');
var DESCRIPTORS = require('./_descriptors');
var TO_STRING = 'toString';
var $toString = /./[TO_STRING];

var define = function (fn) {
  require('./_redefine')(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if (require('./_fails')(function () { return $toString.call({ source: 'a', flags: 'b' }) != '/a/b'; })) {
  define(function toString() {
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if ($toString.name != TO_STRING) {
  define(function toString() {
    return $toString.call(this);
  });
}

},{"./_an-object":8,"./_descriptors":30,"./_fails":36,"./_flags":38,"./_redefine":95,"./es6.regexp.flags":226}],232:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var SET = 'Set';

// 23.2 Set Objects
module.exports = require('./_collection')(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);

},{"./_collection":23,"./_collection-strong":20,"./_validate-collection":126}],233:[function(require,module,exports){
'use strict';
// B.2.3.2 String.prototype.anchor(name)
require('./_string-html')('anchor', function (createHTML) {
  return function anchor(name) {
    return createHTML(this, 'a', 'name', name);
  };
});

},{"./_string-html":109}],234:[function(require,module,exports){
'use strict';
// B.2.3.3 String.prototype.big()
require('./_string-html')('big', function (createHTML) {
  return function big() {
    return createHTML(this, 'big', '', '');
  };
});

},{"./_string-html":109}],235:[function(require,module,exports){
'use strict';
// B.2.3.4 String.prototype.blink()
require('./_string-html')('blink', function (createHTML) {
  return function blink() {
    return createHTML(this, 'blink', '', '');
  };
});

},{"./_string-html":109}],236:[function(require,module,exports){
'use strict';
// B.2.3.5 String.prototype.bold()
require('./_string-html')('bold', function (createHTML) {
  return function bold() {
    return createHTML(this, 'b', '', '');
  };
});

},{"./_string-html":109}],237:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $at = require('./_string-at')(false);
$export($export.P, 'String', {
  // 21.1.3.3 String.prototype.codePointAt(pos)
  codePointAt: function codePointAt(pos) {
    return $at(this, pos);
  }
});

},{"./_export":34,"./_string-at":107}],238:[function(require,module,exports){
// 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
'use strict';
var $export = require('./_export');
var toLength = require('./_to-length');
var context = require('./_string-context');
var ENDS_WITH = 'endsWith';
var $endsWith = ''[ENDS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(ENDS_WITH), 'String', {
  endsWith: function endsWith(searchString /* , endPosition = @length */) {
    var that = context(this, searchString, ENDS_WITH);
    var endPosition = arguments.length > 1 ? arguments[1] : undefined;
    var len = toLength(that.length);
    var end = endPosition === undefined ? len : Math.min(toLength(endPosition), len);
    var search = String(searchString);
    return $endsWith
      ? $endsWith.call(that, search, end)
      : that.slice(end - search.length, end) === search;
  }
});

},{"./_export":34,"./_fails-is-regexp":35,"./_string-context":108,"./_to-length":119}],239:[function(require,module,exports){
'use strict';
// B.2.3.6 String.prototype.fixed()
require('./_string-html')('fixed', function (createHTML) {
  return function fixed() {
    return createHTML(this, 'tt', '', '');
  };
});

},{"./_string-html":109}],240:[function(require,module,exports){
'use strict';
// B.2.3.7 String.prototype.fontcolor(color)
require('./_string-html')('fontcolor', function (createHTML) {
  return function fontcolor(color) {
    return createHTML(this, 'font', 'color', color);
  };
});

},{"./_string-html":109}],241:[function(require,module,exports){
'use strict';
// B.2.3.8 String.prototype.fontsize(size)
require('./_string-html')('fontsize', function (createHTML) {
  return function fontsize(size) {
    return createHTML(this, 'font', 'size', size);
  };
});

},{"./_string-html":109}],242:[function(require,module,exports){
var $export = require('./_export');
var toAbsoluteIndex = require('./_to-absolute-index');
var fromCharCode = String.fromCharCode;
var $fromCodePoint = String.fromCodePoint;

// length should be 1, old FF problem
$export($export.S + $export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
  // 21.1.2.2 String.fromCodePoint(...codePoints)
  fromCodePoint: function fromCodePoint(x) { // eslint-disable-line no-unused-vars
    var res = [];
    var aLen = arguments.length;
    var i = 0;
    var code;
    while (aLen > i) {
      code = +arguments[i++];
      if (toAbsoluteIndex(code, 0x10ffff) !== code) throw RangeError(code + ' is not a valid code point');
      res.push(code < 0x10000
        ? fromCharCode(code)
        : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
      );
    } return res.join('');
  }
});

},{"./_export":34,"./_to-absolute-index":115}],243:[function(require,module,exports){
// 21.1.3.7 String.prototype.includes(searchString, position = 0)
'use strict';
var $export = require('./_export');
var context = require('./_string-context');
var INCLUDES = 'includes';

$export($export.P + $export.F * require('./_fails-is-regexp')(INCLUDES), 'String', {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~context(this, searchString, INCLUDES)
      .indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
  }
});

},{"./_export":34,"./_fails-is-regexp":35,"./_string-context":108}],244:[function(require,module,exports){
'use strict';
// B.2.3.9 String.prototype.italics()
require('./_string-html')('italics', function (createHTML) {
  return function italics() {
    return createHTML(this, 'i', '', '');
  };
});

},{"./_string-html":109}],245:[function(require,module,exports){
'use strict';
var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":56,"./_string-at":107}],246:[function(require,module,exports){
'use strict';
// B.2.3.10 String.prototype.link(url)
require('./_string-html')('link', function (createHTML) {
  return function link(url) {
    return createHTML(this, 'a', 'href', url);
  };
});

},{"./_string-html":109}],247:[function(require,module,exports){
var $export = require('./_export');
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');

$export($export.S, 'String', {
  // 21.1.2.4 String.raw(callSite, ...substitutions)
  raw: function raw(callSite) {
    var tpl = toIObject(callSite.raw);
    var len = toLength(tpl.length);
    var aLen = arguments.length;
    var res = [];
    var i = 0;
    while (len > i) {
      res.push(String(tpl[i++]));
      if (i < aLen) res.push(String(arguments[i]));
    } return res.join('');
  }
});

},{"./_export":34,"./_to-iobject":118,"./_to-length":119}],248:[function(require,module,exports){
var $export = require('./_export');

$export($export.P, 'String', {
  // 21.1.3.13 String.prototype.repeat(count)
  repeat: require('./_string-repeat')
});

},{"./_export":34,"./_string-repeat":111}],249:[function(require,module,exports){
'use strict';
// B.2.3.11 String.prototype.small()
require('./_string-html')('small', function (createHTML) {
  return function small() {
    return createHTML(this, 'small', '', '');
  };
});

},{"./_string-html":109}],250:[function(require,module,exports){
// 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';
var $export = require('./_export');
var toLength = require('./_to-length');
var context = require('./_string-context');
var STARTS_WITH = 'startsWith';
var $startsWith = ''[STARTS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(STARTS_WITH), 'String', {
  startsWith: function startsWith(searchString /* , position = 0 */) {
    var that = context(this, searchString, STARTS_WITH);
    var index = toLength(Math.min(arguments.length > 1 ? arguments[1] : undefined, that.length));
    var search = String(searchString);
    return $startsWith
      ? $startsWith.call(that, search, index)
      : that.slice(index, index + search.length) === search;
  }
});

},{"./_export":34,"./_fails-is-regexp":35,"./_string-context":108,"./_to-length":119}],251:[function(require,module,exports){
'use strict';
// B.2.3.12 String.prototype.strike()
require('./_string-html')('strike', function (createHTML) {
  return function strike() {
    return createHTML(this, 'strike', '', '');
  };
});

},{"./_string-html":109}],252:[function(require,module,exports){
'use strict';
// B.2.3.13 String.prototype.sub()
require('./_string-html')('sub', function (createHTML) {
  return function sub() {
    return createHTML(this, 'sub', '', '');
  };
});

},{"./_string-html":109}],253:[function(require,module,exports){
'use strict';
// B.2.3.14 String.prototype.sup()
require('./_string-html')('sup', function (createHTML) {
  return function sup() {
    return createHTML(this, 'sup', '', '');
  };
});

},{"./_string-html":109}],254:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function ($trim) {
  return function trim() {
    return $trim(this, 3);
  };
});

},{"./_string-trim":112}],255:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = require('./_global');
var has = require('./_has');
var DESCRIPTORS = require('./_descriptors');
var $export = require('./_export');
var redefine = require('./_redefine');
var META = require('./_meta').KEY;
var $fails = require('./_fails');
var shared = require('./_shared');
var setToStringTag = require('./_set-to-string-tag');
var uid = require('./_uid');
var wks = require('./_wks');
var wksExt = require('./_wks-ext');
var wksDefine = require('./_wks-define');
var keyOf = require('./_keyof');
var enumKeys = require('./_enum-keys');
var isArray = require('./_is-array');
var anObject = require('./_an-object');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var createDesc = require('./_property-desc');
var _create = require('./_object-create');
var gOPNExt = require('./_object-gopn-ext');
var $GOPD = require('./_object-gopd');
var $DP = require('./_object-dp');
var $keys = require('./_object-keys');
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !require('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key) {
    if (isSymbol(key)) return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    if (it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    replacer = args[1];
    if (typeof replacer == 'function') $replacer = replacer;
    if ($replacer || !isArray(replacer)) replacer = function (key, value) {
      if ($replacer) value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"./_an-object":8,"./_descriptors":30,"./_enum-keys":33,"./_export":34,"./_fails":36,"./_global":41,"./_has":42,"./_hide":43,"./_is-array":50,"./_keyof":60,"./_library":61,"./_meta":67,"./_object-create":72,"./_object-dp":73,"./_object-gopd":76,"./_object-gopn":78,"./_object-gopn-ext":77,"./_object-gops":79,"./_object-keys":82,"./_object-pie":83,"./_property-desc":93,"./_redefine":95,"./_set-to-string-tag":102,"./_shared":104,"./_to-iobject":118,"./_to-primitive":121,"./_uid":125,"./_wks":129,"./_wks-define":127,"./_wks-ext":128}],256:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var $typed = require('./_typed');
var buffer = require('./_typed-buffer');
var anObject = require('./_an-object');
var toAbsoluteIndex = require('./_to-absolute-index');
var toLength = require('./_to-length');
var isObject = require('./_is-object');
var ArrayBuffer = require('./_global').ArrayBuffer;
var speciesConstructor = require('./_species-constructor');
var $ArrayBuffer = buffer.ArrayBuffer;
var $DataView = buffer.DataView;
var $isView = $typed.ABV && ArrayBuffer.isView;
var $slice = $ArrayBuffer.prototype.slice;
var VIEW = $typed.VIEW;
var ARRAY_BUFFER = 'ArrayBuffer';

$export($export.G + $export.W + $export.F * (ArrayBuffer !== $ArrayBuffer), { ArrayBuffer: $ArrayBuffer });

$export($export.S + $export.F * !$typed.CONSTR, ARRAY_BUFFER, {
  // 24.1.3.1 ArrayBuffer.isView(arg)
  isView: function isView(it) {
    return $isView && $isView(it) || isObject(it) && VIEW in it;
  }
});

$export($export.P + $export.U + $export.F * require('./_fails')(function () {
  return !new $ArrayBuffer(2).slice(1, undefined).byteLength;
}), ARRAY_BUFFER, {
  // 24.1.4.3 ArrayBuffer.prototype.slice(start, end)
  slice: function slice(start, end) {
    if ($slice !== undefined && end === undefined) return $slice.call(anObject(this), start); // FF fix
    var len = anObject(this).byteLength;
    var first = toAbsoluteIndex(start, len);
    var final = toAbsoluteIndex(end === undefined ? len : end, len);
    var result = new (speciesConstructor(this, $ArrayBuffer))(toLength(final - first));
    var viewS = new $DataView(this);
    var viewT = new $DataView(result);
    var index = 0;
    while (first < final) {
      viewT.setUint8(index++, viewS.getUint8(first++));
    } return result;
  }
});

require('./_set-species')(ARRAY_BUFFER);

},{"./_an-object":8,"./_export":34,"./_fails":36,"./_global":41,"./_is-object":52,"./_set-species":101,"./_species-constructor":105,"./_to-absolute-index":115,"./_to-length":119,"./_typed":124,"./_typed-buffer":123}],257:[function(require,module,exports){
var $export = require('./_export');
$export($export.G + $export.W + $export.F * !require('./_typed').ABV, {
  DataView: require('./_typed-buffer').DataView
});

},{"./_export":34,"./_typed":124,"./_typed-buffer":123}],258:[function(require,module,exports){
require('./_typed-array')('Float32', 4, function (init) {
  return function Float32Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],259:[function(require,module,exports){
require('./_typed-array')('Float64', 8, function (init) {
  return function Float64Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],260:[function(require,module,exports){
require('./_typed-array')('Int16', 2, function (init) {
  return function Int16Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],261:[function(require,module,exports){
require('./_typed-array')('Int32', 4, function (init) {
  return function Int32Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],262:[function(require,module,exports){
require('./_typed-array')('Int8', 1, function (init) {
  return function Int8Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],263:[function(require,module,exports){
require('./_typed-array')('Uint16', 2, function (init) {
  return function Uint16Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],264:[function(require,module,exports){
require('./_typed-array')('Uint32', 4, function (init) {
  return function Uint32Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],265:[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function (init) {
  return function Uint8Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});

},{"./_typed-array":122}],266:[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function (init) {
  return function Uint8ClampedArray(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
}, true);

},{"./_typed-array":122}],267:[function(require,module,exports){
'use strict';
var each = require('./_array-methods')(0);
var redefine = require('./_redefine');
var meta = require('./_meta');
var assign = require('./_object-assign');
var weak = require('./_collection-weak');
var isObject = require('./_is-object');
var fails = require('./_fails');
var validate = require('./_validate-collection');
var WEAK_MAP = 'WeakMap';
var getWeak = meta.getWeak;
var isExtensible = Object.isExtensible;
var uncaughtFrozenStore = weak.ufstore;
var tmp = {};
var InternalMap;

var wrapper = function (get) {
  return function WeakMap() {
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key) {
    if (isObject(key)) {
      var data = getWeak(key);
      if (data === true) return uncaughtFrozenStore(validate(this, WEAK_MAP)).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value) {
    return weak.def(validate(this, WEAK_MAP), key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = require('./_collection')(WEAK_MAP, wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if (fails(function () { return new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7; })) {
  InternalMap = weak.getConstructor(wrapper, WEAK_MAP);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function (key) {
    var proto = $WeakMap.prototype;
    var method = proto[key];
    redefine(proto, key, function (a, b) {
      // store frozen objects on internal weakmap shim
      if (isObject(a) && !isExtensible(a)) {
        if (!this._f) this._f = new InternalMap();
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}

},{"./_array-methods":13,"./_collection":23,"./_collection-weak":22,"./_fails":36,"./_is-object":52,"./_meta":67,"./_object-assign":71,"./_redefine":95,"./_validate-collection":126}],268:[function(require,module,exports){
'use strict';
var weak = require('./_collection-weak');
var validate = require('./_validate-collection');
var WEAK_SET = 'WeakSet';

// 23.4 WeakSet Objects
require('./_collection')(WEAK_SET, function (get) {
  return function WeakSet() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.4.3.1 WeakSet.prototype.add(value)
  add: function add(value) {
    return weak.def(validate(this, WEAK_SET), value, true);
  }
}, weak, false, true);

},{"./_collection":23,"./_collection-weak":22,"./_validate-collection":126}],269:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-flatMap/#sec-Array.prototype.flatMap
var $export = require('./_export');
var flattenIntoArray = require('./_flatten-into-array');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var aFunction = require('./_a-function');
var arraySpeciesCreate = require('./_array-species-create');

$export($export.P, 'Array', {
  flatMap: function flatMap(callbackfn /* , thisArg */) {
    var O = toObject(this);
    var sourceLen, A;
    aFunction(callbackfn);
    sourceLen = toLength(O.length);
    A = arraySpeciesCreate(O, 0);
    flattenIntoArray(A, O, O, sourceLen, 0, 1, callbackfn, arguments[1]);
    return A;
  }
});

require('./_add-to-unscopables')('flatMap');

},{"./_a-function":4,"./_add-to-unscopables":6,"./_array-species-create":16,"./_export":34,"./_flatten-into-array":39,"./_to-length":119,"./_to-object":120}],270:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-flatMap/#sec-Array.prototype.flatten
var $export = require('./_export');
var flattenIntoArray = require('./_flatten-into-array');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var toInteger = require('./_to-integer');
var arraySpeciesCreate = require('./_array-species-create');

$export($export.P, 'Array', {
  flatten: function flatten(/* depthArg = 1 */) {
    var depthArg = arguments[0];
    var O = toObject(this);
    var sourceLen = toLength(O.length);
    var A = arraySpeciesCreate(O, 0);
    flattenIntoArray(A, O, O, sourceLen, 0, depthArg === undefined ? 1 : toInteger(depthArg));
    return A;
  }
});

require('./_add-to-unscopables')('flatten');

},{"./_add-to-unscopables":6,"./_array-species-create":16,"./_export":34,"./_flatten-into-array":39,"./_to-integer":117,"./_to-length":119,"./_to-object":120}],271:[function(require,module,exports){
'use strict';
// https://github.com/tc39/Array.prototype.includes
var $export = require('./_export');
var $includes = require('./_array-includes')(true);

$export($export.P, 'Array', {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

require('./_add-to-unscopables')('includes');

},{"./_add-to-unscopables":6,"./_array-includes":12,"./_export":34}],272:[function(require,module,exports){
// https://github.com/rwaldron/tc39-notes/blob/master/es6/2014-09/sept-25.md#510-globalasap-for-enqueuing-a-microtask
var $export = require('./_export');
var microtask = require('./_microtask')();
var process = require('./_global').process;
var isNode = require('./_cof')(process) == 'process';

$export($export.G, {
  asap: function asap(fn) {
    var domain = isNode && process.domain;
    microtask(domain ? domain.bind(fn) : fn);
  }
});

},{"./_cof":19,"./_export":34,"./_global":41,"./_microtask":69}],273:[function(require,module,exports){
// https://github.com/ljharb/proposal-is-error
var $export = require('./_export');
var cof = require('./_cof');

$export($export.S, 'Error', {
  isError: function isError(it) {
    return cof(it) === 'Error';
  }
});

},{"./_cof":19,"./_export":34}],274:[function(require,module,exports){
// https://github.com/tc39/proposal-global
var $export = require('./_export');

$export($export.G, { global: require('./_global') });

},{"./_export":34,"./_global":41}],275:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-map.from
require('./_set-collection-from')('Map');

},{"./_set-collection-from":98}],276:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-map.of
require('./_set-collection-of')('Map');

},{"./_set-collection-of":99}],277:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export = require('./_export');

$export($export.P + $export.R, 'Map', { toJSON: require('./_collection-to-json')('Map') });

},{"./_collection-to-json":21,"./_export":34}],278:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');

$export($export.S, 'Math', {
  clamp: function clamp(x, lower, upper) {
    return Math.min(upper, Math.max(lower, x));
  }
});

},{"./_export":34}],279:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');

$export($export.S, 'Math', { DEG_PER_RAD: Math.PI / 180 });

},{"./_export":34}],280:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');
var RAD_PER_DEG = 180 / Math.PI;

$export($export.S, 'Math', {
  degrees: function degrees(radians) {
    return radians * RAD_PER_DEG;
  }
});

},{"./_export":34}],281:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');
var scale = require('./_math-scale');
var fround = require('./_math-fround');

$export($export.S, 'Math', {
  fscale: function fscale(x, inLow, inHigh, outLow, outHigh) {
    return fround(scale(x, inLow, inHigh, outLow, outHigh));
  }
});

},{"./_export":34,"./_math-fround":63,"./_math-scale":65}],282:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  iaddh: function iaddh(x0, x1, y0, y1) {
    var $x0 = x0 >>> 0;
    var $x1 = x1 >>> 0;
    var $y0 = y0 >>> 0;
    return $x1 + (y1 >>> 0) + (($x0 & $y0 | ($x0 | $y0) & ~($x0 + $y0 >>> 0)) >>> 31) | 0;
  }
});

},{"./_export":34}],283:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  imulh: function imulh(u, v) {
    var UINT16 = 0xffff;
    var $u = +u;
    var $v = +v;
    var u0 = $u & UINT16;
    var v0 = $v & UINT16;
    var u1 = $u >> 16;
    var v1 = $v >> 16;
    var t = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >> 16);
  }
});

},{"./_export":34}],284:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  isubh: function isubh(x0, x1, y0, y1) {
    var $x0 = x0 >>> 0;
    var $x1 = x1 >>> 0;
    var $y0 = y0 >>> 0;
    return $x1 - (y1 >>> 0) - ((~$x0 & $y0 | ~($x0 ^ $y0) & $x0 - $y0 >>> 0) >>> 31) | 0;
  }
});

},{"./_export":34}],285:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');

$export($export.S, 'Math', { RAD_PER_DEG: 180 / Math.PI });

},{"./_export":34}],286:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');
var DEG_PER_RAD = Math.PI / 180;

$export($export.S, 'Math', {
  radians: function radians(degrees) {
    return degrees * DEG_PER_RAD;
  }
});

},{"./_export":34}],287:[function(require,module,exports){
// https://rwaldron.github.io/proposal-math-extensions/
var $export = require('./_export');

$export($export.S, 'Math', { scale: require('./_math-scale') });

},{"./_export":34,"./_math-scale":65}],288:[function(require,module,exports){
// http://jfbastien.github.io/papers/Math.signbit.html
var $export = require('./_export');

$export($export.S, 'Math', { signbit: function signbit(x) {
  // eslint-disable-next-line no-self-compare
  return (x = +x) != x ? x : x == 0 ? 1 / x == Infinity : x > 0;
} });

},{"./_export":34}],289:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  umulh: function umulh(u, v) {
    var UINT16 = 0xffff;
    var $u = +u;
    var $v = +v;
    var u0 = $u & UINT16;
    var v0 = $v & UINT16;
    var u1 = $u >>> 16;
    var v1 = $v >>> 16;
    var t = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >>> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >>> 16);
  }
});

},{"./_export":34}],290:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var aFunction = require('./_a-function');
var $defineProperty = require('./_object-dp');

// B.2.2.2 Object.prototype.__defineGetter__(P, getter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineGetter__: function __defineGetter__(P, getter) {
    $defineProperty.f(toObject(this), P, { get: aFunction(getter), enumerable: true, configurable: true });
  }
});

},{"./_a-function":4,"./_descriptors":30,"./_export":34,"./_object-dp":73,"./_object-forced-pam":75,"./_to-object":120}],291:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var aFunction = require('./_a-function');
var $defineProperty = require('./_object-dp');

// B.2.2.3 Object.prototype.__defineSetter__(P, setter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineSetter__: function __defineSetter__(P, setter) {
    $defineProperty.f(toObject(this), P, { set: aFunction(setter), enumerable: true, configurable: true });
  }
});

},{"./_a-function":4,"./_descriptors":30,"./_export":34,"./_object-dp":73,"./_object-forced-pam":75,"./_to-object":120}],292:[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export = require('./_export');
var $entries = require('./_object-to-array')(true);

$export($export.S, 'Object', {
  entries: function entries(it) {
    return $entries(it);
  }
});

},{"./_export":34,"./_object-to-array":85}],293:[function(require,module,exports){
// https://github.com/tc39/proposal-object-getownpropertydescriptors
var $export = require('./_export');
var ownKeys = require('./_own-keys');
var toIObject = require('./_to-iobject');
var gOPD = require('./_object-gopd');
var createProperty = require('./_create-property');

$export($export.S, 'Object', {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    var O = toIObject(object);
    var getDesc = gOPD.f;
    var keys = ownKeys(O);
    var result = {};
    var i = 0;
    var key, desc;
    while (keys.length > i) {
      desc = getDesc(O, key = keys[i++]);
      if (desc !== undefined) createProperty(result, key, desc);
    }
    return result;
  }
});

},{"./_create-property":25,"./_export":34,"./_object-gopd":76,"./_own-keys":86,"./_to-iobject":118}],294:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var toPrimitive = require('./_to-primitive');
var getPrototypeOf = require('./_object-gpo');
var getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.4 Object.prototype.__lookupGetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupGetter__: function __lookupGetter__(P) {
    var O = toObject(this);
    var K = toPrimitive(P, true);
    var D;
    do {
      if (D = getOwnPropertyDescriptor(O, K)) return D.get;
    } while (O = getPrototypeOf(O));
  }
});

},{"./_descriptors":30,"./_export":34,"./_object-forced-pam":75,"./_object-gopd":76,"./_object-gpo":80,"./_to-object":120,"./_to-primitive":121}],295:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var toPrimitive = require('./_to-primitive');
var getPrototypeOf = require('./_object-gpo');
var getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.5 Object.prototype.__lookupSetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupSetter__: function __lookupSetter__(P) {
    var O = toObject(this);
    var K = toPrimitive(P, true);
    var D;
    do {
      if (D = getOwnPropertyDescriptor(O, K)) return D.set;
    } while (O = getPrototypeOf(O));
  }
});

},{"./_descriptors":30,"./_export":34,"./_object-forced-pam":75,"./_object-gopd":76,"./_object-gpo":80,"./_to-object":120,"./_to-primitive":121}],296:[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export = require('./_export');
var $values = require('./_object-to-array')(false);

$export($export.S, 'Object', {
  values: function values(it) {
    return $values(it);
  }
});

},{"./_export":34,"./_object-to-array":85}],297:[function(require,module,exports){
'use strict';
// https://github.com/zenparsing/es-observable
var $export = require('./_export');
var global = require('./_global');
var core = require('./_core');
var microtask = require('./_microtask')();
var OBSERVABLE = require('./_wks')('observable');
var aFunction = require('./_a-function');
var anObject = require('./_an-object');
var anInstance = require('./_an-instance');
var redefineAll = require('./_redefine-all');
var hide = require('./_hide');
var forOf = require('./_for-of');
var RETURN = forOf.RETURN;

var getMethod = function (fn) {
  return fn == null ? undefined : aFunction(fn);
};

var cleanupSubscription = function (subscription) {
  var cleanup = subscription._c;
  if (cleanup) {
    subscription._c = undefined;
    cleanup();
  }
};

var subscriptionClosed = function (subscription) {
  return subscription._o === undefined;
};

var closeSubscription = function (subscription) {
  if (!subscriptionClosed(subscription)) {
    subscription._o = undefined;
    cleanupSubscription(subscription);
  }
};

var Subscription = function (observer, subscriber) {
  anObject(observer);
  this._c = undefined;
  this._o = observer;
  observer = new SubscriptionObserver(this);
  try {
    var cleanup = subscriber(observer);
    var subscription = cleanup;
    if (cleanup != null) {
      if (typeof cleanup.unsubscribe === 'function') cleanup = function () { subscription.unsubscribe(); };
      else aFunction(cleanup);
      this._c = cleanup;
    }
  } catch (e) {
    observer.error(e);
    return;
  } if (subscriptionClosed(this)) cleanupSubscription(this);
};

Subscription.prototype = redefineAll({}, {
  unsubscribe: function unsubscribe() { closeSubscription(this); }
});

var SubscriptionObserver = function (subscription) {
  this._s = subscription;
};

SubscriptionObserver.prototype = redefineAll({}, {
  next: function next(value) {
    var subscription = this._s;
    if (!subscriptionClosed(subscription)) {
      var observer = subscription._o;
      try {
        var m = getMethod(observer.next);
        if (m) return m.call(observer, value);
      } catch (e) {
        try {
          closeSubscription(subscription);
        } finally {
          throw e;
        }
      }
    }
  },
  error: function error(value) {
    var subscription = this._s;
    if (subscriptionClosed(subscription)) throw value;
    var observer = subscription._o;
    subscription._o = undefined;
    try {
      var m = getMethod(observer.error);
      if (!m) throw value;
      value = m.call(observer, value);
    } catch (e) {
      try {
        cleanupSubscription(subscription);
      } finally {
        throw e;
      }
    } cleanupSubscription(subscription);
    return value;
  },
  complete: function complete(value) {
    var subscription = this._s;
    if (!subscriptionClosed(subscription)) {
      var observer = subscription._o;
      subscription._o = undefined;
      try {
        var m = getMethod(observer.complete);
        value = m ? m.call(observer, value) : undefined;
      } catch (e) {
        try {
          cleanupSubscription(subscription);
        } finally {
          throw e;
        }
      } cleanupSubscription(subscription);
      return value;
    }
  }
});

var $Observable = function Observable(subscriber) {
  anInstance(this, $Observable, 'Observable', '_f')._f = aFunction(subscriber);
};

redefineAll($Observable.prototype, {
  subscribe: function subscribe(observer) {
    return new Subscription(observer, this._f);
  },
  forEach: function forEach(fn) {
    var that = this;
    return new (core.Promise || global.Promise)(function (resolve, reject) {
      aFunction(fn);
      var subscription = that.subscribe({
        next: function (value) {
          try {
            return fn(value);
          } catch (e) {
            reject(e);
            subscription.unsubscribe();
          }
        },
        error: reject,
        complete: resolve
      });
    });
  }
});

redefineAll($Observable, {
  from: function from(x) {
    var C = typeof this === 'function' ? this : $Observable;
    var method = getMethod(anObject(x)[OBSERVABLE]);
    if (method) {
      var observable = anObject(method.call(x));
      return observable.constructor === C ? observable : new C(function (observer) {
        return observable.subscribe(observer);
      });
    }
    return new C(function (observer) {
      var done = false;
      microtask(function () {
        if (!done) {
          try {
            if (forOf(x, false, function (it) {
              observer.next(it);
              if (done) return RETURN;
            }) === RETURN) return;
          } catch (e) {
            if (done) throw e;
            observer.error(e);
            return;
          } observer.complete();
        }
      });
      return function () { done = true; };
    });
  },
  of: function of() {
    for (var i = 0, l = arguments.length, items = Array(l); i < l;) items[i] = arguments[i++];
    return new (typeof this === 'function' ? this : $Observable)(function (observer) {
      var done = false;
      microtask(function () {
        if (!done) {
          for (var j = 0; j < items.length; ++j) {
            observer.next(items[j]);
            if (done) return;
          } observer.complete();
        }
      });
      return function () { done = true; };
    });
  }
});

hide($Observable.prototype, OBSERVABLE, function () { return this; });

$export($export.G, { Observable: $Observable });

require('./_set-species')('Observable');

},{"./_a-function":4,"./_an-instance":7,"./_an-object":8,"./_core":24,"./_export":34,"./_for-of":40,"./_global":41,"./_hide":43,"./_microtask":69,"./_redefine-all":94,"./_set-species":101,"./_wks":129}],298:[function(require,module,exports){
// https://github.com/tc39/proposal-promise-finally
'use strict';
var $export = require('./_export');
var core = require('./_core');
var global = require('./_global');
var speciesConstructor = require('./_species-constructor');
var promiseResolve = require('./_promise-resolve');

$export($export.P + $export.R, 'Promise', { 'finally': function (onFinally) {
  var C = speciesConstructor(this, core.Promise || global.Promise);
  var isFunction = typeof onFinally == 'function';
  return this.then(
    isFunction ? function (x) {
      return promiseResolve(C, onFinally()).then(function () { return x; });
    } : onFinally,
    isFunction ? function (e) {
      return promiseResolve(C, onFinally()).then(function () { throw e; });
    } : onFinally
  );
} });

},{"./_core":24,"./_export":34,"./_global":41,"./_promise-resolve":92,"./_species-constructor":105}],299:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-promise-try
var $export = require('./_export');
var newPromiseCapability = require('./_new-promise-capability');
var perform = require('./_perform');

$export($export.S, 'Promise', { 'try': function (callbackfn) {
  var promiseCapability = newPromiseCapability.f(this);
  var result = perform(callbackfn);
  (result.e ? promiseCapability.reject : promiseCapability.resolve)(result.v);
  return promiseCapability.promise;
} });

},{"./_export":34,"./_new-promise-capability":70,"./_perform":91}],300:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var toMetaKey = metadata.key;
var ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({ defineMetadata: function defineMetadata(metadataKey, metadataValue, target, targetKey) {
  ordinaryDefineOwnMetadata(metadataKey, metadataValue, anObject(target), toMetaKey(targetKey));
} });

},{"./_an-object":8,"./_metadata":68}],301:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var toMetaKey = metadata.key;
var getOrCreateMetadataMap = metadata.map;
var store = metadata.store;

metadata.exp({ deleteMetadata: function deleteMetadata(metadataKey, target /* , targetKey */) {
  var targetKey = arguments.length < 3 ? undefined : toMetaKey(arguments[2]);
  var metadataMap = getOrCreateMetadataMap(anObject(target), targetKey, false);
  if (metadataMap === undefined || !metadataMap['delete'](metadataKey)) return false;
  if (metadataMap.size) return true;
  var targetMetadata = store.get(target);
  targetMetadata['delete'](targetKey);
  return !!targetMetadata.size || store['delete'](target);
} });

},{"./_an-object":8,"./_metadata":68}],302:[function(require,module,exports){
var Set = require('./es6.set');
var from = require('./_array-from-iterable');
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var getPrototypeOf = require('./_object-gpo');
var ordinaryOwnMetadataKeys = metadata.keys;
var toMetaKey = metadata.key;

var ordinaryMetadataKeys = function (O, P) {
  var oKeys = ordinaryOwnMetadataKeys(O, P);
  var parent = getPrototypeOf(O);
  if (parent === null) return oKeys;
  var pKeys = ordinaryMetadataKeys(parent, P);
  return pKeys.length ? oKeys.length ? from(new Set(oKeys.concat(pKeys))) : pKeys : oKeys;
};

metadata.exp({ getMetadataKeys: function getMetadataKeys(target /* , targetKey */) {
  return ordinaryMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
} });

},{"./_an-object":8,"./_array-from-iterable":11,"./_metadata":68,"./_object-gpo":80,"./es6.set":232}],303:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var getPrototypeOf = require('./_object-gpo');
var ordinaryHasOwnMetadata = metadata.has;
var ordinaryGetOwnMetadata = metadata.get;
var toMetaKey = metadata.key;

var ordinaryGetMetadata = function (MetadataKey, O, P) {
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if (hasOwn) return ordinaryGetOwnMetadata(MetadataKey, O, P);
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryGetMetadata(MetadataKey, parent, P) : undefined;
};

metadata.exp({ getMetadata: function getMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryGetMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });

},{"./_an-object":8,"./_metadata":68,"./_object-gpo":80}],304:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var ordinaryOwnMetadataKeys = metadata.keys;
var toMetaKey = metadata.key;

metadata.exp({ getOwnMetadataKeys: function getOwnMetadataKeys(target /* , targetKey */) {
  return ordinaryOwnMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
} });

},{"./_an-object":8,"./_metadata":68}],305:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var ordinaryGetOwnMetadata = metadata.get;
var toMetaKey = metadata.key;

metadata.exp({ getOwnMetadata: function getOwnMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryGetOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });

},{"./_an-object":8,"./_metadata":68}],306:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var getPrototypeOf = require('./_object-gpo');
var ordinaryHasOwnMetadata = metadata.has;
var toMetaKey = metadata.key;

var ordinaryHasMetadata = function (MetadataKey, O, P) {
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if (hasOwn) return true;
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryHasMetadata(MetadataKey, parent, P) : false;
};

metadata.exp({ hasMetadata: function hasMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryHasMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });

},{"./_an-object":8,"./_metadata":68,"./_object-gpo":80}],307:[function(require,module,exports){
var metadata = require('./_metadata');
var anObject = require('./_an-object');
var ordinaryHasOwnMetadata = metadata.has;
var toMetaKey = metadata.key;

metadata.exp({ hasOwnMetadata: function hasOwnMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryHasOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });

},{"./_an-object":8,"./_metadata":68}],308:[function(require,module,exports){
var $metadata = require('./_metadata');
var anObject = require('./_an-object');
var aFunction = require('./_a-function');
var toMetaKey = $metadata.key;
var ordinaryDefineOwnMetadata = $metadata.set;

$metadata.exp({ metadata: function metadata(metadataKey, metadataValue) {
  return function decorator(target, targetKey) {
    ordinaryDefineOwnMetadata(
      metadataKey, metadataValue,
      (targetKey !== undefined ? anObject : aFunction)(target),
      toMetaKey(targetKey)
    );
  };
} });

},{"./_a-function":4,"./_an-object":8,"./_metadata":68}],309:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.from
require('./_set-collection-from')('Set');

},{"./_set-collection-from":98}],310:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.of
require('./_set-collection-of')('Set');

},{"./_set-collection-of":99}],311:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export = require('./_export');

$export($export.P + $export.R, 'Set', { toJSON: require('./_collection-to-json')('Set') });

},{"./_collection-to-json":21,"./_export":34}],312:[function(require,module,exports){
'use strict';
// https://github.com/mathiasbynens/String.prototype.at
var $export = require('./_export');
var $at = require('./_string-at')(true);

$export($export.P, 'String', {
  at: function at(pos) {
    return $at(this, pos);
  }
});

},{"./_export":34,"./_string-at":107}],313:[function(require,module,exports){
'use strict';
// https://tc39.github.io/String.prototype.matchAll/
var $export = require('./_export');
var defined = require('./_defined');
var toLength = require('./_to-length');
var isRegExp = require('./_is-regexp');
var getFlags = require('./_flags');
var RegExpProto = RegExp.prototype;

var $RegExpStringIterator = function (regexp, string) {
  this._r = regexp;
  this._s = string;
};

require('./_iter-create')($RegExpStringIterator, 'RegExp String', function next() {
  var match = this._r.exec(this._s);
  return { value: match, done: match === null };
});

$export($export.P, 'String', {
  matchAll: function matchAll(regexp) {
    defined(this);
    if (!isRegExp(regexp)) throw TypeError(regexp + ' is not a regexp!');
    var S = String(this);
    var flags = 'flags' in RegExpProto ? String(regexp.flags) : getFlags.call(regexp);
    var rx = new RegExp(regexp.source, ~flags.indexOf('g') ? flags : 'g' + flags);
    rx.lastIndex = toLength(regexp.lastIndex);
    return new $RegExpStringIterator(rx, S);
  }
});

},{"./_defined":29,"./_export":34,"./_flags":38,"./_is-regexp":53,"./_iter-create":55,"./_to-length":119}],314:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export');
var $pad = require('./_string-pad');

$export($export.P, 'String', {
  padEnd: function padEnd(maxLength /* , fillString = ' ' */) {
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
  }
});

},{"./_export":34,"./_string-pad":110}],315:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export');
var $pad = require('./_string-pad');

$export($export.P, 'String', {
  padStart: function padStart(maxLength /* , fillString = ' ' */) {
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
  }
});

},{"./_export":34,"./_string-pad":110}],316:[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimLeft', function ($trim) {
  return function trimLeft() {
    return $trim(this, 1);
  };
}, 'trimStart');

},{"./_string-trim":112}],317:[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimRight', function ($trim) {
  return function trimRight() {
    return $trim(this, 2);
  };
}, 'trimEnd');

},{"./_string-trim":112}],318:[function(require,module,exports){
require('./_wks-define')('asyncIterator');

},{"./_wks-define":127}],319:[function(require,module,exports){
require('./_wks-define')('observable');

},{"./_wks-define":127}],320:[function(require,module,exports){
// https://github.com/tc39/proposal-global
var $export = require('./_export');

$export($export.S, 'System', { global: require('./_global') });

},{"./_export":34,"./_global":41}],321:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakmap.from
require('./_set-collection-from')('WeakMap');

},{"./_set-collection-from":98}],322:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakmap.of
require('./_set-collection-of')('WeakMap');

},{"./_set-collection-of":99}],323:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakset.from
require('./_set-collection-from')('WeakSet');

},{"./_set-collection-from":98}],324:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakset.of
require('./_set-collection-of')('WeakSet');

},{"./_set-collection-of":99}],325:[function(require,module,exports){
var $iterators = require('./es6.array.iterator');
var getKeys = require('./_object-keys');
var redefine = require('./_redefine');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var wks = require('./_wks');
var ITERATOR = wks('iterator');
var TO_STRING_TAG = wks('toStringTag');
var ArrayValues = Iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
  var NAME = collections[i];
  var explicit = DOMIterables[NAME];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  var key;
  if (proto) {
    if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
    if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
  }
}

},{"./_global":41,"./_hide":43,"./_iterators":59,"./_object-keys":82,"./_redefine":95,"./_wks":129,"./es6.array.iterator":142}],326:[function(require,module,exports){
var $export = require('./_export');
var $task = require('./_task');
$export($export.G + $export.B, {
  setImmediate: $task.set,
  clearImmediate: $task.clear
});

},{"./_export":34,"./_task":114}],327:[function(require,module,exports){
// ie9- setTimeout & setInterval additional parameters fix
var global = require('./_global');
var $export = require('./_export');
var invoke = require('./_invoke');
var partial = require('./_partial');
var navigator = global.navigator;
var MSIE = !!navigator && /MSIE .\./.test(navigator.userAgent); // <- dirty ie9- check
var wrap = function (set) {
  return MSIE ? function (fn, time /* , ...args */) {
    return set(invoke(
      partial,
      [].slice.call(arguments, 2),
      // eslint-disable-next-line no-new-func
      typeof fn == 'function' ? fn : Function(fn)
    ), time);
  } : set;
};
$export($export.G + $export.B + $export.F * MSIE, {
  setTimeout: wrap(global.setTimeout),
  setInterval: wrap(global.setInterval)
});

},{"./_export":34,"./_global":41,"./_invoke":47,"./_partial":89}],328:[function(require,module,exports){
require('./modules/es6.symbol');
require('./modules/es6.object.create');
require('./modules/es6.object.define-property');
require('./modules/es6.object.define-properties');
require('./modules/es6.object.get-own-property-descriptor');
require('./modules/es6.object.get-prototype-of');
require('./modules/es6.object.keys');
require('./modules/es6.object.get-own-property-names');
require('./modules/es6.object.freeze');
require('./modules/es6.object.seal');
require('./modules/es6.object.prevent-extensions');
require('./modules/es6.object.is-frozen');
require('./modules/es6.object.is-sealed');
require('./modules/es6.object.is-extensible');
require('./modules/es6.object.assign');
require('./modules/es6.object.is');
require('./modules/es6.object.set-prototype-of');
require('./modules/es6.object.to-string');
require('./modules/es6.function.bind');
require('./modules/es6.function.name');
require('./modules/es6.function.has-instance');
require('./modules/es6.parse-int');
require('./modules/es6.parse-float');
require('./modules/es6.number.constructor');
require('./modules/es6.number.to-fixed');
require('./modules/es6.number.to-precision');
require('./modules/es6.number.epsilon');
require('./modules/es6.number.is-finite');
require('./modules/es6.number.is-integer');
require('./modules/es6.number.is-nan');
require('./modules/es6.number.is-safe-integer');
require('./modules/es6.number.max-safe-integer');
require('./modules/es6.number.min-safe-integer');
require('./modules/es6.number.parse-float');
require('./modules/es6.number.parse-int');
require('./modules/es6.math.acosh');
require('./modules/es6.math.asinh');
require('./modules/es6.math.atanh');
require('./modules/es6.math.cbrt');
require('./modules/es6.math.clz32');
require('./modules/es6.math.cosh');
require('./modules/es6.math.expm1');
require('./modules/es6.math.fround');
require('./modules/es6.math.hypot');
require('./modules/es6.math.imul');
require('./modules/es6.math.log10');
require('./modules/es6.math.log1p');
require('./modules/es6.math.log2');
require('./modules/es6.math.sign');
require('./modules/es6.math.sinh');
require('./modules/es6.math.tanh');
require('./modules/es6.math.trunc');
require('./modules/es6.string.from-code-point');
require('./modules/es6.string.raw');
require('./modules/es6.string.trim');
require('./modules/es6.string.iterator');
require('./modules/es6.string.code-point-at');
require('./modules/es6.string.ends-with');
require('./modules/es6.string.includes');
require('./modules/es6.string.repeat');
require('./modules/es6.string.starts-with');
require('./modules/es6.string.anchor');
require('./modules/es6.string.big');
require('./modules/es6.string.blink');
require('./modules/es6.string.bold');
require('./modules/es6.string.fixed');
require('./modules/es6.string.fontcolor');
require('./modules/es6.string.fontsize');
require('./modules/es6.string.italics');
require('./modules/es6.string.link');
require('./modules/es6.string.small');
require('./modules/es6.string.strike');
require('./modules/es6.string.sub');
require('./modules/es6.string.sup');
require('./modules/es6.date.now');
require('./modules/es6.date.to-json');
require('./modules/es6.date.to-iso-string');
require('./modules/es6.date.to-string');
require('./modules/es6.date.to-primitive');
require('./modules/es6.array.is-array');
require('./modules/es6.array.from');
require('./modules/es6.array.of');
require('./modules/es6.array.join');
require('./modules/es6.array.slice');
require('./modules/es6.array.sort');
require('./modules/es6.array.for-each');
require('./modules/es6.array.map');
require('./modules/es6.array.filter');
require('./modules/es6.array.some');
require('./modules/es6.array.every');
require('./modules/es6.array.reduce');
require('./modules/es6.array.reduce-right');
require('./modules/es6.array.index-of');
require('./modules/es6.array.last-index-of');
require('./modules/es6.array.copy-within');
require('./modules/es6.array.fill');
require('./modules/es6.array.find');
require('./modules/es6.array.find-index');
require('./modules/es6.array.species');
require('./modules/es6.array.iterator');
require('./modules/es6.regexp.constructor');
require('./modules/es6.regexp.to-string');
require('./modules/es6.regexp.flags');
require('./modules/es6.regexp.match');
require('./modules/es6.regexp.replace');
require('./modules/es6.regexp.search');
require('./modules/es6.regexp.split');
require('./modules/es6.promise');
require('./modules/es6.map');
require('./modules/es6.set');
require('./modules/es6.weak-map');
require('./modules/es6.weak-set');
require('./modules/es6.typed.array-buffer');
require('./modules/es6.typed.data-view');
require('./modules/es6.typed.int8-array');
require('./modules/es6.typed.uint8-array');
require('./modules/es6.typed.uint8-clamped-array');
require('./modules/es6.typed.int16-array');
require('./modules/es6.typed.uint16-array');
require('./modules/es6.typed.int32-array');
require('./modules/es6.typed.uint32-array');
require('./modules/es6.typed.float32-array');
require('./modules/es6.typed.float64-array');
require('./modules/es6.reflect.apply');
require('./modules/es6.reflect.construct');
require('./modules/es6.reflect.define-property');
require('./modules/es6.reflect.delete-property');
require('./modules/es6.reflect.enumerate');
require('./modules/es6.reflect.get');
require('./modules/es6.reflect.get-own-property-descriptor');
require('./modules/es6.reflect.get-prototype-of');
require('./modules/es6.reflect.has');
require('./modules/es6.reflect.is-extensible');
require('./modules/es6.reflect.own-keys');
require('./modules/es6.reflect.prevent-extensions');
require('./modules/es6.reflect.set');
require('./modules/es6.reflect.set-prototype-of');
require('./modules/es7.array.includes');
require('./modules/es7.array.flat-map');
require('./modules/es7.array.flatten');
require('./modules/es7.string.at');
require('./modules/es7.string.pad-start');
require('./modules/es7.string.pad-end');
require('./modules/es7.string.trim-left');
require('./modules/es7.string.trim-right');
require('./modules/es7.string.match-all');
require('./modules/es7.symbol.async-iterator');
require('./modules/es7.symbol.observable');
require('./modules/es7.object.get-own-property-descriptors');
require('./modules/es7.object.values');
require('./modules/es7.object.entries');
require('./modules/es7.object.define-getter');
require('./modules/es7.object.define-setter');
require('./modules/es7.object.lookup-getter');
require('./modules/es7.object.lookup-setter');
require('./modules/es7.map.to-json');
require('./modules/es7.set.to-json');
require('./modules/es7.map.of');
require('./modules/es7.set.of');
require('./modules/es7.weak-map.of');
require('./modules/es7.weak-set.of');
require('./modules/es7.map.from');
require('./modules/es7.set.from');
require('./modules/es7.weak-map.from');
require('./modules/es7.weak-set.from');
require('./modules/es7.global');
require('./modules/es7.system.global');
require('./modules/es7.error.is-error');
require('./modules/es7.math.clamp');
require('./modules/es7.math.deg-per-rad');
require('./modules/es7.math.degrees');
require('./modules/es7.math.fscale');
require('./modules/es7.math.iaddh');
require('./modules/es7.math.isubh');
require('./modules/es7.math.imulh');
require('./modules/es7.math.rad-per-deg');
require('./modules/es7.math.radians');
require('./modules/es7.math.scale');
require('./modules/es7.math.umulh');
require('./modules/es7.math.signbit');
require('./modules/es7.promise.finally');
require('./modules/es7.promise.try');
require('./modules/es7.reflect.define-metadata');
require('./modules/es7.reflect.delete-metadata');
require('./modules/es7.reflect.get-metadata');
require('./modules/es7.reflect.get-metadata-keys');
require('./modules/es7.reflect.get-own-metadata');
require('./modules/es7.reflect.get-own-metadata-keys');
require('./modules/es7.reflect.has-metadata');
require('./modules/es7.reflect.has-own-metadata');
require('./modules/es7.reflect.metadata');
require('./modules/es7.asap');
require('./modules/es7.observable');
require('./modules/web.timers');
require('./modules/web.immediate');
require('./modules/web.dom.iterable');
module.exports = require('./modules/_core');

},{"./modules/_core":24,"./modules/es6.array.copy-within":132,"./modules/es6.array.every":133,"./modules/es6.array.fill":134,"./modules/es6.array.filter":135,"./modules/es6.array.find":137,"./modules/es6.array.find-index":136,"./modules/es6.array.for-each":138,"./modules/es6.array.from":139,"./modules/es6.array.index-of":140,"./modules/es6.array.is-array":141,"./modules/es6.array.iterator":142,"./modules/es6.array.join":143,"./modules/es6.array.last-index-of":144,"./modules/es6.array.map":145,"./modules/es6.array.of":146,"./modules/es6.array.reduce":148,"./modules/es6.array.reduce-right":147,"./modules/es6.array.slice":149,"./modules/es6.array.some":150,"./modules/es6.array.sort":151,"./modules/es6.array.species":152,"./modules/es6.date.now":153,"./modules/es6.date.to-iso-string":154,"./modules/es6.date.to-json":155,"./modules/es6.date.to-primitive":156,"./modules/es6.date.to-string":157,"./modules/es6.function.bind":158,"./modules/es6.function.has-instance":159,"./modules/es6.function.name":160,"./modules/es6.map":161,"./modules/es6.math.acosh":162,"./modules/es6.math.asinh":163,"./modules/es6.math.atanh":164,"./modules/es6.math.cbrt":165,"./modules/es6.math.clz32":166,"./modules/es6.math.cosh":167,"./modules/es6.math.expm1":168,"./modules/es6.math.fround":169,"./modules/es6.math.hypot":170,"./modules/es6.math.imul":171,"./modules/es6.math.log10":172,"./modules/es6.math.log1p":173,"./modules/es6.math.log2":174,"./modules/es6.math.sign":175,"./modules/es6.math.sinh":176,"./modules/es6.math.tanh":177,"./modules/es6.math.trunc":178,"./modules/es6.number.constructor":179,"./modules/es6.number.epsilon":180,"./modules/es6.number.is-finite":181,"./modules/es6.number.is-integer":182,"./modules/es6.number.is-nan":183,"./modules/es6.number.is-safe-integer":184,"./modules/es6.number.max-safe-integer":185,"./modules/es6.number.min-safe-integer":186,"./modules/es6.number.parse-float":187,"./modules/es6.number.parse-int":188,"./modules/es6.number.to-fixed":189,"./modules/es6.number.to-precision":190,"./modules/es6.object.assign":191,"./modules/es6.object.create":192,"./modules/es6.object.define-properties":193,"./modules/es6.object.define-property":194,"./modules/es6.object.freeze":195,"./modules/es6.object.get-own-property-descriptor":196,"./modules/es6.object.get-own-property-names":197,"./modules/es6.object.get-prototype-of":198,"./modules/es6.object.is":202,"./modules/es6.object.is-extensible":199,"./modules/es6.object.is-frozen":200,"./modules/es6.object.is-sealed":201,"./modules/es6.object.keys":203,"./modules/es6.object.prevent-extensions":204,"./modules/es6.object.seal":205,"./modules/es6.object.set-prototype-of":206,"./modules/es6.object.to-string":207,"./modules/es6.parse-float":208,"./modules/es6.parse-int":209,"./modules/es6.promise":210,"./modules/es6.reflect.apply":211,"./modules/es6.reflect.construct":212,"./modules/es6.reflect.define-property":213,"./modules/es6.reflect.delete-property":214,"./modules/es6.reflect.enumerate":215,"./modules/es6.reflect.get":218,"./modules/es6.reflect.get-own-property-descriptor":216,"./modules/es6.reflect.get-prototype-of":217,"./modules/es6.reflect.has":219,"./modules/es6.reflect.is-extensible":220,"./modules/es6.reflect.own-keys":221,"./modules/es6.reflect.prevent-extensions":222,"./modules/es6.reflect.set":224,"./modules/es6.reflect.set-prototype-of":223,"./modules/es6.regexp.constructor":225,"./modules/es6.regexp.flags":226,"./modules/es6.regexp.match":227,"./modules/es6.regexp.replace":228,"./modules/es6.regexp.search":229,"./modules/es6.regexp.split":230,"./modules/es6.regexp.to-string":231,"./modules/es6.set":232,"./modules/es6.string.anchor":233,"./modules/es6.string.big":234,"./modules/es6.string.blink":235,"./modules/es6.string.bold":236,"./modules/es6.string.code-point-at":237,"./modules/es6.string.ends-with":238,"./modules/es6.string.fixed":239,"./modules/es6.string.fontcolor":240,"./modules/es6.string.fontsize":241,"./modules/es6.string.from-code-point":242,"./modules/es6.string.includes":243,"./modules/es6.string.italics":244,"./modules/es6.string.iterator":245,"./modules/es6.string.link":246,"./modules/es6.string.raw":247,"./modules/es6.string.repeat":248,"./modules/es6.string.small":249,"./modules/es6.string.starts-with":250,"./modules/es6.string.strike":251,"./modules/es6.string.sub":252,"./modules/es6.string.sup":253,"./modules/es6.string.trim":254,"./modules/es6.symbol":255,"./modules/es6.typed.array-buffer":256,"./modules/es6.typed.data-view":257,"./modules/es6.typed.float32-array":258,"./modules/es6.typed.float64-array":259,"./modules/es6.typed.int16-array":260,"./modules/es6.typed.int32-array":261,"./modules/es6.typed.int8-array":262,"./modules/es6.typed.uint16-array":263,"./modules/es6.typed.uint32-array":264,"./modules/es6.typed.uint8-array":265,"./modules/es6.typed.uint8-clamped-array":266,"./modules/es6.weak-map":267,"./modules/es6.weak-set":268,"./modules/es7.array.flat-map":269,"./modules/es7.array.flatten":270,"./modules/es7.array.includes":271,"./modules/es7.asap":272,"./modules/es7.error.is-error":273,"./modules/es7.global":274,"./modules/es7.map.from":275,"./modules/es7.map.of":276,"./modules/es7.map.to-json":277,"./modules/es7.math.clamp":278,"./modules/es7.math.deg-per-rad":279,"./modules/es7.math.degrees":280,"./modules/es7.math.fscale":281,"./modules/es7.math.iaddh":282,"./modules/es7.math.imulh":283,"./modules/es7.math.isubh":284,"./modules/es7.math.rad-per-deg":285,"./modules/es7.math.radians":286,"./modules/es7.math.scale":287,"./modules/es7.math.signbit":288,"./modules/es7.math.umulh":289,"./modules/es7.object.define-getter":290,"./modules/es7.object.define-setter":291,"./modules/es7.object.entries":292,"./modules/es7.object.get-own-property-descriptors":293,"./modules/es7.object.lookup-getter":294,"./modules/es7.object.lookup-setter":295,"./modules/es7.object.values":296,"./modules/es7.observable":297,"./modules/es7.promise.finally":298,"./modules/es7.promise.try":299,"./modules/es7.reflect.define-metadata":300,"./modules/es7.reflect.delete-metadata":301,"./modules/es7.reflect.get-metadata":303,"./modules/es7.reflect.get-metadata-keys":302,"./modules/es7.reflect.get-own-metadata":305,"./modules/es7.reflect.get-own-metadata-keys":304,"./modules/es7.reflect.has-metadata":306,"./modules/es7.reflect.has-own-metadata":307,"./modules/es7.reflect.metadata":308,"./modules/es7.set.from":309,"./modules/es7.set.of":310,"./modules/es7.set.to-json":311,"./modules/es7.string.at":312,"./modules/es7.string.match-all":313,"./modules/es7.string.pad-end":314,"./modules/es7.string.pad-start":315,"./modules/es7.string.trim-left":316,"./modules/es7.string.trim-right":317,"./modules/es7.symbol.async-iterator":318,"./modules/es7.symbol.observable":319,"./modules/es7.system.global":320,"./modules/es7.weak-map.from":321,"./modules/es7.weak-map.of":322,"./modules/es7.weak-set.from":323,"./modules/es7.weak-set.of":324,"./modules/web.dom.iterable":325,"./modules/web.immediate":326,"./modules/web.timers":327}],329:[function(require,module,exports){
'use strict';

var keys = require('object-keys');
var foreach = require('foreach');
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

var toStr = Object.prototype.toString;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
        /* eslint-disable no-unused-vars, no-restricted-syntax */
        for (var _ in obj) { return false; }
        /* eslint-enable no-unused-vars, no-restricted-syntax */
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		Object.defineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = props.concat(Object.getOwnPropertySymbols(map));
	}
	foreach(props, function (name) {
		defineProperty(object, name, map[name], predicates[name]);
	});
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

module.exports = defineProperties;

},{"foreach":343,"object-keys":357}],330:[function(require,module,exports){
'use strict';

var has = require('has');

var toStr = Object.prototype.toString;
var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';
var symbolToStr = hasSymbols ? Symbol.prototype.toString : toStr;

var $isNaN = require('./helpers/isNaN');
var $isFinite = require('./helpers/isFinite');
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

var assign = require('./helpers/assign');
var sign = require('./helpers/sign');
var mod = require('./helpers/mod');
var isPrimitive = require('./helpers/isPrimitive');
var toPrimitive = require('es-to-primitive/es6');
var parseInteger = parseInt;
var bind = require('function-bind');
var arraySlice = bind.call(Function.call, Array.prototype.slice);
var strSlice = bind.call(Function.call, String.prototype.slice);
var isBinary = bind.call(Function.call, RegExp.prototype.test, /^0b[01]+$/i);
var isOctal = bind.call(Function.call, RegExp.prototype.test, /^0o[0-7]+$/i);
var regexExec = bind.call(Function.call, RegExp.prototype.exec);
var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex = new RegExp('[' + nonWS + ']', 'g');
var hasNonWS = bind.call(Function.call, RegExp.prototype.test, nonWSregex);
var invalidHexLiteral = /^[-+]0x[0-9a-f]+$/i;
var isInvalidHexLiteral = bind.call(Function.call, RegExp.prototype.test, invalidHexLiteral);

// whitespace from: http://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
var replace = bind.call(Function.call, String.prototype.replace);
var trim = function (value) {
	return replace(value, trimRegex, '');
};

var ES5 = require('./es5');

var hasRegExpMatcher = require('is-regex');

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-abstract-operations
var ES6 = assign(assign({}, ES5), {

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-call-f-v-args
	Call: function Call(F, V) {
		var args = arguments.length > 2 ? arguments[2] : [];
		if (!this.IsCallable(F)) {
			throw new TypeError(F + ' is not a function');
		}
		return F.apply(V, args);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toprimitive
	ToPrimitive: toPrimitive,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toboolean
	// ToBoolean: ES5.ToBoolean,

	// http://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
	ToNumber: function ToNumber(argument) {
		var value = isPrimitive(argument) ? argument : toPrimitive(argument, 'number');
		if (typeof value === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a number');
		}
		if (typeof value === 'string') {
			if (isBinary(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 2));
			} else if (isOctal(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 8));
			} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
				return NaN;
			} else {
				var trimmed = trim(value);
				if (trimmed !== value) {
					return this.ToNumber(trimmed);
				}
			}
		}
		return Number(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tointeger
	// ToInteger: ES5.ToNumber,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint32
	// ToInt32: ES5.ToInt32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
	// ToUint32: ES5.ToUint32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint16
	ToInt16: function ToInt16(argument) {
		var int16bit = this.ToUint16(argument);
		return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint16
	// ToUint16: ES5.ToUint16,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint8
	ToInt8: function ToInt8(argument) {
		var int8bit = this.ToUint8(argument);
		return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8
	ToUint8: function ToUint8(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
		var posInt = sign(number) * Math.floor(Math.abs(number));
		return mod(posInt, 0x100);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8clamp
	ToUint8Clamp: function ToUint8Clamp(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number <= 0) { return 0; }
		if (number >= 0xFF) { return 0xFF; }
		var f = Math.floor(argument);
		if (f + 0.5 < number) { return f + 1; }
		if (number < f + 0.5) { return f; }
		if (f % 2 !== 0) { return f + 1; }
		return f;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tostring
	ToString: function ToString(argument) {
		if (typeof argument === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a string');
		}
		return String(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toobject
	ToObject: function ToObject(value) {
		this.RequireObjectCoercible(value);
		return Object(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
	ToPropertyKey: function ToPropertyKey(argument) {
		var key = this.ToPrimitive(argument, String);
		return typeof key === 'symbol' ? symbolToStr.call(key) : this.ToString(key);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
	ToLength: function ToLength(argument) {
		var len = this.ToInteger(argument);
		if (len <= 0) { return 0; } // includes converting -0 to +0
		if (len > MAX_SAFE_INTEGER) { return MAX_SAFE_INTEGER; }
		return len;
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring
	CanonicalNumericIndexString: function CanonicalNumericIndexString(argument) {
		if (toStr.call(argument) !== '[object String]') {
			throw new TypeError('must be a string');
		}
		if (argument === '-0') { return -0; }
		var n = this.ToNumber(argument);
		if (this.SameValue(this.ToString(n), argument)) { return n; }
		return void 0;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-requireobjectcoercible
	RequireObjectCoercible: ES5.CheckObjectCoercible,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
	IsArray: Array.isArray || function IsArray(argument) {
		return toStr.call(argument) === '[object Array]';
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
	// IsCallable: ES5.IsCallable,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
	IsConstructor: function IsConstructor(argument) {
		return typeof argument === 'function' && !!argument.prototype; // unfortunately there's no way to truly check this without try/catch `new argument`
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isextensible-o
	IsExtensible: function IsExtensible(obj) {
		if (!Object.preventExtensions) { return true; }
		if (isPrimitive(obj)) {
			return false;
		}
		return Object.isExtensible(obj);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isinteger
	IsInteger: function IsInteger(argument) {
		if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
			return false;
		}
		var abs = Math.abs(argument);
		return Math.floor(abs) === abs;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispropertykey
	IsPropertyKey: function IsPropertyKey(argument) {
		return typeof argument === 'string' || typeof argument === 'symbol';
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-isregexp
	IsRegExp: function IsRegExp(argument) {
		if (!argument || typeof argument !== 'object') {
			return false;
		}
		if (hasSymbols) {
			var isRegExp = argument[Symbol.match];
			if (typeof isRegExp !== 'undefined') {
				return ES5.ToBoolean(isRegExp);
			}
		}
		return hasRegExpMatcher(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
	// SameValue: ES5.SameValue,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
	SameValueZero: function SameValueZero(x, y) {
		return (x === y) || ($isNaN(x) && $isNaN(y));
	},

	/**
	 * 7.3.2 GetV (V, P)
	 * 1. Assert: IsPropertyKey(P) is true.
	 * 2. Let O be ToObject(V).
	 * 3. ReturnIfAbrupt(O).
	 * 4. Return O.[[Get]](P, V).
	 */
	GetV: function GetV(V, P) {
		// 7.3.2.1
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
		}

		// 7.3.2.2-3
		var O = this.ToObject(V);

		// 7.3.2.4
		return O[P];
	},

	/**
	 * 7.3.9 - http://www.ecma-international.org/ecma-262/6.0/#sec-getmethod
	 * 1. Assert: IsPropertyKey(P) is true.
	 * 2. Let func be GetV(O, P).
	 * 3. ReturnIfAbrupt(func).
	 * 4. If func is either undefined or null, return undefined.
	 * 5. If IsCallable(func) is false, throw a TypeError exception.
	 * 6. Return func.
	 */
	GetMethod: function GetMethod(O, P) {
		// 7.3.9.1
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
		}

		// 7.3.9.2
		var func = this.GetV(O, P);

		// 7.3.9.4
		if (func == null) {
			return undefined;
		}

		// 7.3.9.5
		if (!this.IsCallable(func)) {
			throw new TypeError(P + 'is not a function');
		}

		// 7.3.9.6
		return func;
	},

	/**
	 * 7.3.1 Get (O, P) - http://www.ecma-international.org/ecma-262/6.0/#sec-get-o-p
	 * 1. Assert: Type(O) is Object.
	 * 2. Assert: IsPropertyKey(P) is true.
	 * 3. Return O.[[Get]](P, O).
	 */
	Get: function Get(O, P) {
		// 7.3.1.1
		if (this.Type(O) !== 'Object') {
			throw new TypeError('Assertion failed: Type(O) is not Object');
		}
		// 7.3.1.2
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
		}
		// 7.3.1.3
		return O[P];
	},

	Type: function Type(x) {
		if (typeof x === 'symbol') {
			return 'Symbol';
		}
		return ES5.Type(x);
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-speciesconstructor
	SpeciesConstructor: function SpeciesConstructor(O, defaultConstructor) {
		if (this.Type(O) !== 'Object') {
			throw new TypeError('Assertion failed: Type(O) is not Object');
		}
		var C = O.constructor;
		if (typeof C === 'undefined') {
			return defaultConstructor;
		}
		if (this.Type(C) !== 'Object') {
			throw new TypeError('O.constructor is not an Object');
		}
		var S = hasSymbols && Symbol.species ? C[Symbol.species] : undefined;
		if (S == null) {
			return defaultConstructor;
		}
		if (this.IsConstructor(S)) {
			return S;
		}
		throw new TypeError('no constructor found');
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor
	CompletePropertyDescriptor: function CompletePropertyDescriptor(Desc) {
		if (!this.IsPropertyDescriptor(Desc)) {
			throw new TypeError('Desc must be a Property Descriptor');
		}

		if (this.IsGenericDescriptor(Desc) || this.IsDataDescriptor(Desc)) {
			if (!has(Desc, '[[Value]]')) {
				Desc['[[Value]]'] = void 0;
			}
			if (!has(Desc, '[[Writable]]')) {
				Desc['[[Writable]]'] = false;
			}
		} else {
			if (!has(Desc, '[[Get]]')) {
				Desc['[[Get]]'] = void 0;
			}
			if (!has(Desc, '[[Set]]')) {
				Desc['[[Set]]'] = void 0;
			}
		}
		if (!has(Desc, '[[Enumerable]]')) {
			Desc['[[Enumerable]]'] = false;
		}
		if (!has(Desc, '[[Configurable]]')) {
			Desc['[[Configurable]]'] = false;
		}
		return Desc;
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw
	Set: function Set(O, P, V, Throw) {
		if (this.Type(O) !== 'Object') {
			throw new TypeError('O must be an Object');
		}
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('P must be a Property Key');
		}
		if (this.Type(Throw) !== 'Boolean') {
			throw new TypeError('Throw must be a Boolean');
		}
		if (Throw) {
			O[P] = V;
			return true;
		} else {
			try {
				O[P] = V;
			} catch (e) {
				return false;
			}
		}
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-hasownproperty
	HasOwnProperty: function HasOwnProperty(O, P) {
		if (this.Type(O) !== 'Object') {
			throw new TypeError('O must be an Object');
		}
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('P must be a Property Key');
		}
		return has(O, P);
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-hasproperty
	HasProperty: function HasProperty(O, P) {
		if (this.Type(O) !== 'Object') {
			throw new TypeError('O must be an Object');
		}
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('P must be a Property Key');
		}
		return P in O;
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable
	IsConcatSpreadable: function IsConcatSpreadable(O) {
		if (this.Type(O) !== 'Object') {
			return false;
		}
		if (hasSymbols && typeof Symbol.isConcatSpreadable === 'symbol') {
			var spreadable = this.Get(O, Symbol.isConcatSpreadable);
			if (typeof spreadable !== 'undefined') {
				return this.ToBoolean(spreadable);
			}
		}
		return this.IsArray(O);
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-invoke
	Invoke: function Invoke(O, P) {
		if (!this.IsPropertyKey(P)) {
			throw new TypeError('P must be a Property Key');
		}
		var argumentsList = arraySlice(arguments, 2);
		var func = this.GetV(O, P);
		return this.Call(func, O, argumentsList);
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject
	CreateIterResultObject: function CreateIterResultObject(value, done) {
		if (this.Type(done) !== 'Boolean') {
			throw new TypeError('Assertion failed: Type(done) is not Boolean');
		}
		return {
			value: value,
			done: done
		};
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-regexpexec
	RegExpExec: function RegExpExec(R, S) {
		if (this.Type(R) !== 'Object') {
			throw new TypeError('R must be an Object');
		}
		if (this.Type(S) !== 'String') {
			throw new TypeError('S must be a String');
		}
		var exec = this.Get(R, 'exec');
		if (this.IsCallable(exec)) {
			var result = this.Call(exec, R, [S]);
			if (result === null || this.Type(result) === 'Object') {
				return result;
			}
			throw new TypeError('"exec" method must return `null` or an Object');
		}
		return regexExec(R, S);
	}
});

delete ES6.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible

module.exports = ES6;

},{"./es5":332,"./helpers/assign":334,"./helpers/isFinite":335,"./helpers/isNaN":336,"./helpers/isPrimitive":337,"./helpers/mod":338,"./helpers/sign":339,"es-to-primitive/es6":341,"function-bind":348,"has":349,"is-regex":352}],331:[function(require,module,exports){
'use strict';

var ES2015 = require('./es2015');
var assign = require('./helpers/assign');

var ES2016 = assign(assign({}, ES2015), {
	// https://github.com/tc39/ecma262/pull/60
	SameValueNonNumber: function SameValueNonNumber(x, y) {
		if (typeof x === 'number' || typeof x !== typeof y) {
			throw new TypeError('SameValueNonNumber requires two non-number values of the same type.');
		}
		return this.SameValue(x, y);
	}
});

module.exports = ES2016;

},{"./es2015":330,"./helpers/assign":334}],332:[function(require,module,exports){
'use strict';

var $isNaN = require('./helpers/isNaN');
var $isFinite = require('./helpers/isFinite');

var sign = require('./helpers/sign');
var mod = require('./helpers/mod');

var IsCallable = require('is-callable');
var toPrimitive = require('es-to-primitive/es5');

var has = require('has');

// https://es5.github.io/#x9
var ES5 = {
	ToPrimitive: toPrimitive,

	ToBoolean: function ToBoolean(value) {
		return !!value;
	},
	ToNumber: function ToNumber(value) {
		return Number(value);
	},
	ToInteger: function ToInteger(value) {
		var number = this.ToNumber(value);
		if ($isNaN(number)) { return 0; }
		if (number === 0 || !$isFinite(number)) { return number; }
		return sign(number) * Math.floor(Math.abs(number));
	},
	ToInt32: function ToInt32(x) {
		return this.ToNumber(x) >> 0;
	},
	ToUint32: function ToUint32(x) {
		return this.ToNumber(x) >>> 0;
	},
	ToUint16: function ToUint16(value) {
		var number = this.ToNumber(value);
		if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
		var posInt = sign(number) * Math.floor(Math.abs(number));
		return mod(posInt, 0x10000);
	},
	ToString: function ToString(value) {
		return String(value);
	},
	ToObject: function ToObject(value) {
		this.CheckObjectCoercible(value);
		return Object(value);
	},
	CheckObjectCoercible: function CheckObjectCoercible(value, optMessage) {
		/* jshint eqnull:true */
		if (value == null) {
			throw new TypeError(optMessage || 'Cannot call method on ' + value);
		}
		return value;
	},
	IsCallable: IsCallable,
	SameValue: function SameValue(x, y) {
		if (x === y) { // 0 === -0, but they are not identical.
			if (x === 0) { return 1 / x === 1 / y; }
			return true;
		}
		return $isNaN(x) && $isNaN(y);
	},

	// http://www.ecma-international.org/ecma-262/5.1/#sec-8
	Type: function Type(x) {
		if (x === null) {
			return 'Null';
		}
		if (typeof x === 'undefined') {
			return 'Undefined';
		}
		if (typeof x === 'function' || typeof x === 'object') {
			return 'Object';
		}
		if (typeof x === 'number') {
			return 'Number';
		}
		if (typeof x === 'boolean') {
			return 'Boolean';
		}
		if (typeof x === 'string') {
			return 'String';
		}
	},

	// http://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type
	IsPropertyDescriptor: function IsPropertyDescriptor(Desc) {
		if (this.Type(Desc) !== 'Object') {
			return false;
		}
		var allowed = {
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Get]]': true,
			'[[Set]]': true,
			'[[Value]]': true,
			'[[Writable]]': true
		};
		// jscs:disable
		for (var key in Desc) { // eslint-disable-line
			if (has(Desc, key) && !allowed[key]) {
				return false;
			}
		}
		// jscs:enable
		var isData = has(Desc, '[[Value]]');
		var IsAccessor = has(Desc, '[[Get]]') || has(Desc, '[[Set]]');
		if (isData && IsAccessor) {
			throw new TypeError('Property Descriptors may not be both accessor and data descriptors');
		}
		return true;
	},

	// http://ecma-international.org/ecma-262/5.1/#sec-8.10.1
	IsAccessorDescriptor: function IsAccessorDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return false;
		}

		if (!this.IsPropertyDescriptor(Desc)) {
			throw new TypeError('Desc must be a Property Descriptor');
		}

		if (!has(Desc, '[[Get]]') && !has(Desc, '[[Set]]')) {
			return false;
		}

		return true;
	},

	// http://ecma-international.org/ecma-262/5.1/#sec-8.10.2
	IsDataDescriptor: function IsDataDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return false;
		}

		if (!this.IsPropertyDescriptor(Desc)) {
			throw new TypeError('Desc must be a Property Descriptor');
		}

		if (!has(Desc, '[[Value]]') && !has(Desc, '[[Writable]]')) {
			return false;
		}

		return true;
	},

	// http://ecma-international.org/ecma-262/5.1/#sec-8.10.3
	IsGenericDescriptor: function IsGenericDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return false;
		}

		if (!this.IsPropertyDescriptor(Desc)) {
			throw new TypeError('Desc must be a Property Descriptor');
		}

		if (!this.IsAccessorDescriptor(Desc) && !this.IsDataDescriptor(Desc)) {
			return true;
		}

		return false;
	},

	// http://ecma-international.org/ecma-262/5.1/#sec-8.10.4
	FromPropertyDescriptor: function FromPropertyDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return Desc;
		}

		if (!this.IsPropertyDescriptor(Desc)) {
			throw new TypeError('Desc must be a Property Descriptor');
		}

		if (this.IsDataDescriptor(Desc)) {
			return {
				value: Desc['[[Value]]'],
				writable: !!Desc['[[Writable]]'],
				enumerable: !!Desc['[[Enumerable]]'],
				configurable: !!Desc['[[Configurable]]']
			};
		} else if (this.IsAccessorDescriptor(Desc)) {
			return {
				get: Desc['[[Get]]'],
				set: Desc['[[Set]]'],
				enumerable: !!Desc['[[Enumerable]]'],
				configurable: !!Desc['[[Configurable]]']
			};
		} else {
			throw new TypeError('FromPropertyDescriptor must be called with a fully populated Property Descriptor');
		}
	},

	// http://ecma-international.org/ecma-262/5.1/#sec-8.10.5
	ToPropertyDescriptor: function ToPropertyDescriptor(Obj) {
		if (this.Type(Obj) !== 'Object') {
			throw new TypeError('ToPropertyDescriptor requires an object');
		}

		var desc = {};
		if (has(Obj, 'enumerable')) {
			desc['[[Enumerable]]'] = this.ToBoolean(Obj.enumerable);
		}
		if (has(Obj, 'configurable')) {
			desc['[[Configurable]]'] = this.ToBoolean(Obj.configurable);
		}
		if (has(Obj, 'value')) {
			desc['[[Value]]'] = Obj.value;
		}
		if (has(Obj, 'writable')) {
			desc['[[Writable]]'] = this.ToBoolean(Obj.writable);
		}
		if (has(Obj, 'get')) {
			var getter = Obj.get;
			if (typeof getter !== 'undefined' && !this.IsCallable(getter)) {
				throw new TypeError('getter must be a function');
			}
			desc['[[Get]]'] = getter;
		}
		if (has(Obj, 'set')) {
			var setter = Obj.set;
			if (typeof setter !== 'undefined' && !this.IsCallable(setter)) {
				throw new TypeError('setter must be a function');
			}
			desc['[[Set]]'] = setter;
		}

		if ((has(desc, '[[Get]]') || has(desc, '[[Set]]')) && (has(desc, '[[Value]]') || has(desc, '[[Writable]]'))) {
			throw new TypeError('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
		}
		return desc;
	}
};

module.exports = ES5;

},{"./helpers/isFinite":335,"./helpers/isNaN":336,"./helpers/mod":338,"./helpers/sign":339,"es-to-primitive/es5":340,"has":349,"is-callable":350}],333:[function(require,module,exports){
'use strict';

module.exports = require('./es2016');

},{"./es2016":331}],334:[function(require,module,exports){
var has = Object.prototype.hasOwnProperty;
module.exports = function assign(target, source) {
	if (Object.assign) {
		return Object.assign(target, source);
	}
	for (var key in source) {
		if (has.call(source, key)) {
			target[key] = source[key];
		}
	}
	return target;
};

},{}],335:[function(require,module,exports){
var $isNaN = Number.isNaN || function (a) { return a !== a; };

module.exports = Number.isFinite || function (x) { return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity; };

},{}],336:[function(require,module,exports){
module.exports = Number.isNaN || function isNaN(a) {
	return a !== a;
};

},{}],337:[function(require,module,exports){
module.exports = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

},{}],338:[function(require,module,exports){
module.exports = function mod(number, modulo) {
	var remain = number % modulo;
	return Math.floor(remain >= 0 ? remain : remain + modulo);
};

},{}],339:[function(require,module,exports){
module.exports = function sign(number) {
	return number >= 0 ? 1 : -1;
};

},{}],340:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

var isPrimitive = require('./helpers/isPrimitive');

var isCallable = require('is-callable');

// https://es5.github.io/#x8.12
var ES5internalSlots = {
	'[[DefaultValue]]': function (O, hint) {
		var actualHint = hint || (toStr.call(O) === '[object Date]' ? String : Number);

		if (actualHint === String || actualHint === Number) {
			var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
			var value, i;
			for (i = 0; i < methods.length; ++i) {
				if (isCallable(O[methods[i]])) {
					value = O[methods[i]]();
					if (isPrimitive(value)) {
						return value;
					}
				}
			}
			throw new TypeError('No default value');
		}
		throw new TypeError('invalid [[DefaultValue]] hint supplied');
	}
};

// https://es5.github.io/#x9
module.exports = function ToPrimitive(input, PreferredType) {
	if (isPrimitive(input)) {
		return input;
	}
	return ES5internalSlots['[[DefaultValue]]'](input, PreferredType);
};

},{"./helpers/isPrimitive":342,"is-callable":350}],341:[function(require,module,exports){
'use strict';

var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';

var isPrimitive = require('./helpers/isPrimitive');
var isCallable = require('is-callable');
var isDate = require('is-date-object');
var isSymbol = require('is-symbol');

var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
	if (typeof O === 'undefined' || O === null) {
		throw new TypeError('Cannot call method on ' + O);
	}
	if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
		throw new TypeError('hint must be "string" or "number"');
	}
	var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
	var method, result, i;
	for (i = 0; i < methodNames.length; ++i) {
		method = O[methodNames[i]];
		if (isCallable(method)) {
			result = method.call(O);
			if (isPrimitive(result)) {
				return result;
			}
		}
	}
	throw new TypeError('No default value');
};

var GetMethod = function GetMethod(O, P) {
	var func = O[P];
	if (func !== null && typeof func !== 'undefined') {
		if (!isCallable(func)) {
			throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
		}
		return func;
	}
};

// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
module.exports = function ToPrimitive(input, PreferredType) {
	if (isPrimitive(input)) {
		return input;
	}
	var hint = 'default';
	if (arguments.length > 1) {
		if (PreferredType === String) {
			hint = 'string';
		} else if (PreferredType === Number) {
			hint = 'number';
		}
	}

	var exoticToPrim;
	if (hasSymbols) {
		if (Symbol.toPrimitive) {
			exoticToPrim = GetMethod(input, Symbol.toPrimitive);
		} else if (isSymbol(input)) {
			exoticToPrim = Symbol.prototype.valueOf;
		}
	}
	if (typeof exoticToPrim !== 'undefined') {
		var result = exoticToPrim.call(input, hint);
		if (isPrimitive(result)) {
			return result;
		}
		throw new TypeError('unable to convert exotic object to primitive');
	}
	if (hint === 'default' && (isDate(input) || isSymbol(input))) {
		hint = 'string';
	}
	return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
};

},{"./helpers/isPrimitive":342,"is-callable":350,"is-date-object":351,"is-symbol":353}],342:[function(require,module,exports){
arguments[4][337][0].apply(exports,arguments)
},{"dup":337}],343:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],344:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("numeric"), require("numeral"), require("jStat"));
	else if(typeof define === 'function' && define.amd)
		define(["numeric", "numeral", "jStat"], factory);
	else if(typeof exports === 'object')
		exports["formulajs"] = factory(require("numeric"), require("numeral"), require("jStat"));
	else
		root["formulajs"] = factory(root["numeric"], root["numeral"], root["jStat"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_9__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var categories = [
	  __webpack_require__(1),
	  __webpack_require__(15),
	  __webpack_require__(12),
	  __webpack_require__(16),
	  __webpack_require__(2),
	  __webpack_require__(7),
	  __webpack_require__(14),
	  __webpack_require__(17),
	  __webpack_require__(11),
	  __webpack_require__(18),
	  __webpack_require__(6),
	  __webpack_require__(10)
	];

	for (var c in categories) {
	  var category = categories[c];
	  for (var f in category) {
	    exports[f] = exports[f] || category[f];
	  }
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var mathTrig = __webpack_require__(2);
	var statistical = __webpack_require__(6);
	var engineering = __webpack_require__(12);
	var dateTime = __webpack_require__(14);

	function set(fn, root) {
	  if (root) {
	    for (var i in root) {
	      fn[i] = root[i];
	    }
	  }
	  return fn;
	}

	exports.BETADIST = statistical.BETA.DIST;
	exports.BETAINV = statistical.BETA.INV;
	exports.BINOMDIST = statistical.BINOM.DIST;
	exports.CEILING = exports.ISOCEILING = set(mathTrig.CEILING.MATH, mathTrig.CEILING);
	exports.CEILINGMATH = mathTrig.CEILING.MATH;
	exports.CEILINGPRECISE = mathTrig.CEILING.PRECISE;
	exports.CHIDIST = statistical.CHISQ.DIST;
	exports.CHIDISTRT = statistical.CHISQ.DIST.RT;
	exports.CHIINV = statistical.CHISQ.INV;
	exports.CHIINVRT = statistical.CHISQ.INV.RT;
	exports.CHITEST = statistical.CHISQ.TEST;
	exports.CONFIDENCE = set(statistical.CONFIDENCE.NORM, statistical.CONFIDENCE);
	exports.COVAR = statistical.COVARIANCE.P;
	exports.COVARIANCEP = statistical.COVARIANCE.P;
	exports.COVARIANCES = statistical.COVARIANCE.S;
	exports.CRITBINOM = statistical.BINOM.INV;
	exports.EXPONDIST = statistical.EXPON.DIST;
	exports.ERFCPRECISE = engineering.ERFC.PRECISE;
	exports.ERFPRECISE = engineering.ERF.PRECISE;
	exports.FDIST = statistical.F.DIST;
	exports.FDISTRT = statistical.F.DIST.RT;
	exports.FINVRT = statistical.F.INV.RT;
	exports.FINV = statistical.F.INV;
	exports.FLOOR = set(mathTrig.FLOOR.MATH, mathTrig.FLOOR);
	exports.FLOORMATH = mathTrig.FLOOR.MATH;
	exports.FLOORPRECISE = mathTrig.FLOOR.PRECISE;
	exports.FTEST = statistical.F.TEST;
	exports.GAMMADIST = statistical.GAMMA.DIST;
	exports.GAMMAINV = statistical.GAMMA.INV;
	exports.GAMMALNPRECISE = statistical.GAMMALN.PRECISE;
	exports.HYPGEOMDIST = statistical.HYPGEOM.DIST;
	exports.LOGINV = statistical.LOGNORM.INV;
	exports.LOGNORMINV = statistical.LOGNORM.INV;
	exports.LOGNORMDIST = statistical.LOGNORM.DIST;
	exports.MODE = set(statistical.MODE.SNGL, statistical.MODE);
	exports.MODEMULT = statistical.MODE.MULT;
	exports.MODESNGL = statistical.MODE.SNGL;
	exports.NEGBINOMDIST = statistical.NEGBINOM.DIST;
	exports.NETWORKDAYSINTL = dateTime.NETWORKDAYS.INTL;
	exports.NORMDIST = statistical.NORM.DIST;
	exports.NORMINV = statistical.NORM.INV;
	exports.NORMSDIST = statistical.NORM.S.DIST;
	exports.NORMSINV = statistical.NORM.S.INV;
	exports.PERCENTILE = set(statistical.PERCENTILE.EXC, statistical.PERCENTILE);
	exports.PERCENTILEEXC = statistical.PERCENTILE.EXC;
	exports.PERCENTILEINC = statistical.PERCENTILE.INC;
	exports.PERCENTRANK = set(statistical.PERCENTRANK.INC, statistical.PERCENTRANK);
	exports.PERCENTRANKEXC = statistical.PERCENTRANK.EXC;
	exports.PERCENTRANKINC = statistical.PERCENTRANK.INC;
	exports.POISSON = set(statistical.POISSON.DIST, statistical.POISSON);
	exports.POISSONDIST = statistical.POISSON.DIST;
	exports.QUARTILE = set(statistical.QUARTILE.INC, statistical.QUARTILE);
	exports.QUARTILEEXC = statistical.QUARTILE.EXC;
	exports.QUARTILEINC = statistical.QUARTILE.INC;
	exports.RANK = set(statistical.RANK.EQ, statistical.RANK);
	exports.RANKAVG = statistical.RANK.AVG;
	exports.RANKEQ = statistical.RANK.EQ;
	exports.SKEWP = statistical.SKEW.P;
	exports.STDEV = set(statistical.STDEV.S, statistical.STDEV);
	exports.STDEVP = statistical.STDEV.P;
	exports.STDEVS = statistical.STDEV.S;
	exports.TDIST = statistical.T.DIST;
	exports.TDISTRT = statistical.T.DIST.RT;
	exports.TINV = statistical.T.INV;
	exports.TTEST = statistical.T.TEST;
	exports.VAR = set(statistical.VAR.S, statistical.VAR);
	exports.VARP = statistical.VAR.P;
	exports.VARS = statistical.VAR.S;
	exports.WEIBULL = set(statistical.WEIBULL.DIST, statistical.WEIBULL);
	exports.WEIBULLDIST = statistical.WEIBULL.DIST;
	exports.WORKDAYINTL = dateTime.WORKDAY.INTL;
	exports.ZTEST = statistical.Z.TEST;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var numeric = __webpack_require__(3);
	var utils = __webpack_require__(4);
	var error = __webpack_require__(5);
	var statistical = __webpack_require__(6);
	var information = __webpack_require__(11);

	exports.ABS = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.abs(utils.parseNumber(number));
	};

	exports.ACOS = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.acos(number);
	};

	exports.ACOSH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.log(number + Math.sqrt(number * number - 1));
	};

	exports.ACOT = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.atan(1 / number);
	};

	exports.ACOTH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 0.5 * Math.log((number + 1) / (number - 1));
	};

	//TODO: use options
	exports.AGGREGATE = function(function_num, options, ref1, ref2) {
	  function_num = utils.parseNumber(function_num);
	  options = utils.parseNumber(function_num);
	  if (utils.anyIsError(function_num, options)) {
	    return error.value;
	  }
	  switch (function_num) {
	    case 1:
	      return statistical.AVERAGE(ref1);
	    case 2:
	      return statistical.COUNT(ref1);
	    case 3:
	      return statistical.COUNTA(ref1);
	    case 4:
	      return statistical.MAX(ref1);
	    case 5:
	      return statistical.MIN(ref1);
	    case 6:
	      return exports.PRODUCT(ref1);
	    case 7:
	      return statistical.STDEV.S(ref1);
	    case 8:
	      return statistical.STDEV.P(ref1);
	    case 9:
	      return exports.SUM(ref1);
	    case 10:
	      return statistical.VAR.S(ref1);
	    case 11:
	      return statistical.VAR.P(ref1);
	    case 12:
	      return statistical.MEDIAN(ref1);
	    case 13:
	      return statistical.MODE.SNGL(ref1);
	    case 14:
	      return statistical.LARGE(ref1, ref2);
	    case 15:
	      return statistical.SMALL(ref1, ref2);
	    case 16:
	      return statistical.PERCENTILE.INC(ref1, ref2);
	    case 17:
	      return statistical.QUARTILE.INC(ref1, ref2);
	    case 18:
	      return statistical.PERCENTILE.EXC(ref1, ref2);
	    case 19:
	      return statistical.QUARTILE.EXC(ref1, ref2);
	  }
	};

	exports.ARABIC = function(text) {
	  // Credits: Rafa? Kukawski
	  if (!/^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/.test(text)) {
	    return error.value;
	  }
	  var r = 0;
	  text.replace(/[MDLV]|C[MD]?|X[CL]?|I[XV]?/g, function(i) {
	    r += {
	      M: 1000,
	      CM: 900,
	      D: 500,
	      CD: 400,
	      C: 100,
	      XC: 90,
	      L: 50,
	      XL: 40,
	      X: 10,
	      IX: 9,
	      V: 5,
	      IV: 4,
	      I: 1
	    }[i];
	  });
	  return r;
	};

	exports.ASIN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.asin(number);
	};

	exports.ASINH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.log(number + Math.sqrt(number * number + 1));
	};

	exports.ATAN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.atan(number);
	};

	exports.ATAN2 = function(number_x, number_y) {
	  number_x = utils.parseNumber(number_x);
	  number_y = utils.parseNumber(number_y);
	  if (utils.anyIsError(number_x, number_y)) {
	    return error.value;
	  }
	  return Math.atan2(number_x, number_y);
	};

	exports.ATANH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.log((1 + number) / (1 - number)) / 2;
	};

	exports.BASE = function(number, radix, min_length) {
	  min_length = min_length || 0;

	  number = utils.parseNumber(number);
	  radix = utils.parseNumber(radix);
	  min_length = utils.parseNumber(min_length);
	  if (utils.anyIsError(number, radix, min_length)) {
	    return error.value;
	  }
	  min_length = (min_length === undefined) ? 0 : min_length;
	  var result = number.toString(radix);
	  return new Array(Math.max(min_length + 1 - result.length, 0)).join('0') + result;
	};

	exports.CEILING = function(number, significance, mode) {
	  significance = (significance === undefined) ? 1 : Math.abs(significance);
	  mode = mode || 0;

	  number = utils.parseNumber(number);
	  significance = utils.parseNumber(significance);
	  mode = utils.parseNumber(mode);
	  if (utils.anyIsError(number, significance, mode)) {
	    return error.value;
	  }
	  if (significance === 0) {
	    return 0;
	  }
	  var precision = -Math.floor(Math.log(significance) / Math.log(10));
	  if (number >= 0) {
	    return exports.ROUND(Math.ceil(number / significance) * significance, precision);
	  } else {
	    if (mode === 0) {
	      return -exports.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
	    } else {
	      return -exports.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
	    }
	  }
	};

	exports.CEILING.MATH = exports.CEILING;

	exports.CEILING.PRECISE = exports.CEILING;

	exports.COMBIN = function(number, number_chosen) {
	  number = utils.parseNumber(number);
	  number_chosen = utils.parseNumber(number_chosen);
	  if (utils.anyIsError(number, number_chosen)) {
	    return error.value;
	  }
	  return exports.FACT(number) / (exports.FACT(number_chosen) * exports.FACT(number - number_chosen));
	};

	exports.COMBINA = function(number, number_chosen) {
	  number = utils.parseNumber(number);
	  number_chosen = utils.parseNumber(number_chosen);
	  if (utils.anyIsError(number, number_chosen)) {
	    return error.value;
	  }
	  return (number === 0 && number_chosen === 0) ? 1 : exports.COMBIN(number + number_chosen - 1, number - 1);
	};

	exports.COS = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.cos(number);
	};

	exports.COSH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return (Math.exp(number) + Math.exp(-number)) / 2;
	};

	exports.COT = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 1 / Math.tan(number);
	};

	exports.COTH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  var e2 = Math.exp(2 * number);
	  return (e2 + 1) / (e2 - 1);
	};

	exports.CSC = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 1 / Math.sin(number);
	};

	exports.CSCH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 2 / (Math.exp(number) - Math.exp(-number));
	};

	exports.DECIMAL = function(number, radix) {
	  if (arguments.length < 1) {
	    return error.value;
	  }


	  return parseInt(number, radix);
	};

	exports.DEGREES = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return number * 180 / Math.PI;
	};

	exports.EVEN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return exports.CEILING(number, -2, -1);
	};

	exports.EXP = Math.exp;

	var MEMOIZED_FACT = [];
	exports.FACT = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  var n = Math.floor(number);
	  if (n === 0 || n === 1) {
	    return 1;
	  } else if (MEMOIZED_FACT[n] > 0) {
	    return MEMOIZED_FACT[n];
	  } else {
	    MEMOIZED_FACT[n] = exports.FACT(n - 1) * n;
	    return MEMOIZED_FACT[n];
	  }
	};

	exports.FACTDOUBLE = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  var n = Math.floor(number);
	  if (n <= 0) {
	    return 1;
	  } else {
	    return n * exports.FACTDOUBLE(n - 2);
	  }
	};

	exports.FLOOR = function(number, significance) {
	  number = utils.parseNumber(number);
	  significance = utils.parseNumber(significance);
	  if (utils.anyIsError(number, significance)) {
	    return error.value;
	  }
	  if (significance === 0) {
	    return 0;
	  }

	  if (!(number > 0 && significance > 0) && !(number < 0 && significance < 0)) {
	    return error.num;
	  }

	  significance = Math.abs(significance);
	  var precision = -Math.floor(Math.log(significance) / Math.log(10));
	  if (number >= 0) {
	    return exports.ROUND(Math.floor(number / significance) * significance, precision);
	  } else {
	    return -exports.ROUND(Math.ceil(Math.abs(number) / significance), precision);
	  }
	};

	//TODO: Verify
	exports.FLOOR.MATH = function(number, significance, mode) {
	  significance = (significance === undefined) ? 1 : significance;
	  mode = (mode === undefined) ? 0 : mode;

	  number = utils.parseNumber(number);
	  significance = utils.parseNumber(significance);
	  mode = utils.parseNumber(mode);
	  if (utils.anyIsError(number, significance, mode)) {
	    return error.value;
	  }
	  if (significance === 0) {
	    return 0;
	  }

	  significance = significance ? Math.abs(significance) : 1;
	  var precision = -Math.floor(Math.log(significance) / Math.log(10));
	  if (number >= 0) {
	    return exports.ROUND(Math.floor(number / significance) * significance, precision);
	  } else if (mode === 0 || mode === undefined) {
	    return -exports.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
	  }
	  return -exports.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
	};

	// Deprecated
	exports.FLOOR.PRECISE = exports.FLOOR.MATH;

	// adapted http://rosettacode.org/wiki/Greatest_common_divisor#JavaScript
	exports.GCD = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var n = range.length;
	  var r0 = range[0];
	  var x = r0 < 0 ? -r0 : r0;
	  for (var i = 1; i < n; i++) {
	    var ri = range[i];
	    var y = ri < 0 ? -ri : ri;
	    while (x && y) {
	      if (x > y) {
	        x %= y;
	      } else {
	        y %= x;
	      }
	    }
	    x += y;
	  }
	  return x;
	};


	exports.INT = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.floor(number);
	};

	//TODO: verify
	exports.ISO = {
	  CEILING: exports.CEILING
	};

	exports.LCM = function() {
	  // Credits: Jonas Raoni Soares Silva
	  var o = utils.parseNumberArray(utils.flatten(arguments));
	  if (o instanceof Error) {
	    return o;
	  }
	  for (var i, j, n, d, r = 1;
	    (n = o.pop()) !== undefined;) {
	    while (n > 1) {
	      if (n % 2) {
	        for (i = 3, j = Math.floor(Math.sqrt(n)); i <= j && n % i; i += 2) {
	          //empty
	        }
	        d = (i <= j) ? i : n;
	      } else {
	        d = 2;
	      }
	      for (n /= d, r *= d, i = o.length; i;
	        (o[--i] % d) === 0 && (o[i] /= d) === 1 && o.splice(i, 1)) {
	        //empty
	      }
	    }
	  }
	  return r;
	};

	exports.LN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.log(number);
	};

	exports.LOG = function(number, base) {
	  number = utils.parseNumber(number);
	  base = utils.parseNumber(base);
	  if (utils.anyIsError(number, base)) {
	    return error.value;
	  }
	  base = (base === undefined) ? 10 : base;
	  return Math.log(number) / Math.log(base);
	};

	exports.LOG10 = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.log(number) / Math.log(10);
	};

	exports.MDETERM = function(matrix) {
	  matrix = utils.parseMatrix(matrix);
	  if (matrix instanceof Error) {
	    return matrix;
	  }
	  return numeric.det(matrix);
	};

	exports.MINVERSE = function(matrix) {
	  matrix = utils.parseMatrix(matrix);
	  if (matrix instanceof Error) {
	    return matrix;
	  }
	  return numeric.inv(matrix);
	};

	exports.MMULT = function(matrix1, matrix2) {
	  matrix1 = utils.parseMatrix(matrix1);
	  matrix2 = utils.parseMatrix(matrix2);
	  if (utils.anyIsError(matrix1, matrix2)) {
	    return error.value;
	  }
	  return numeric.dot(matrix1, matrix2);
	};

	exports.MOD = function(dividend, divisor) {
	  dividend = utils.parseNumber(dividend);
	  divisor = utils.parseNumber(divisor);
	  if (utils.anyIsError(dividend, divisor)) {
	    return error.value;
	  }
	  if (divisor === 0) {
	    return error.div0;
	  }
	  var modulus = Math.abs(dividend % divisor);
	  return (divisor > 0) ? modulus : -modulus;
	};

	  exports.MROUND = function(number, multiple) {
	  number = utils.parseNumber(number);
	  multiple = utils.parseNumber(multiple);
	  if (utils.anyIsError(number, multiple)) {
	    return error.value;
	  }
	  if (number * multiple < 0) {
	    return error.num;
	  }

	  return Math.round(number / multiple) * multiple;
	};

	exports.MULTINOMIAL = function() {
	  var args = utils.parseNumberArray(utils.flatten(arguments));
	  if (args instanceof Error) {
	    return args;
	  }
	  var sum = 0;
	  var divisor = 1;
	  for (var i = 0; i < args.length; i++) {
	    sum += args[i];
	    divisor *= exports.FACT(args[i]);
	  }
	  return exports.FACT(sum) / divisor;
	};

	exports.MUNIT = function(dimension) {
	  dimension = utils.parseNumber(dimension);
	  if (dimension instanceof Error) {
	    return dimension;
	  }
	  return numeric.identity(dimension);
	};

	exports.ODD = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  var temp = Math.ceil(Math.abs(number));
	  temp = (temp & 1) ? temp : temp + 1;
	  return (number > 0) ? temp : -temp;
	};

	exports.PI = function() {
	  return Math.PI;
	};

	exports.POWER = function(number, power) {
	  number = utils.parseNumber(number);
	  power = utils.parseNumber(power);
	  if (utils.anyIsError(number, power)) {
	    return error.value;
	  }
	  var result = Math.pow(number, power);
	  if (isNaN(result)) {
	    return error.num;
	  }

	  return result;
	};

	exports.PRODUCT = function() {
	  var args = utils.parseNumberArray(utils.flatten(arguments));
	  if (args instanceof Error) {
	    return args;
	  }
	  var result = 1;
	  for (var i = 0; i < args.length; i++) {
	    result *= args[i];
	  }
	  return result;
	};

	exports.QUOTIENT = function(numerator, denominator) {
	  numerator = utils.parseNumber(numerator);
	  denominator = utils.parseNumber(denominator);
	  if (utils.anyIsError(numerator, denominator)) {
	    return error.value;
	  }
	  return parseInt(numerator / denominator, 10);
	};

	exports.RADIANS = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return number * Math.PI / 180;
	};

	exports.RAND = function() {
	  return Math.random();
	};

	exports.RANDBETWEEN = function(bottom, top) {
	  bottom = utils.parseNumber(bottom);
	  top = utils.parseNumber(top);
	  if (utils.anyIsError(bottom, top)) {
	    return error.value;
	  }
	  // Creative Commons Attribution 3.0 License
	  // Copyright (c) 2012 eqcode
	  return bottom + Math.ceil((top - bottom + 1) * Math.random()) - 1;
	};

	// TODO
	exports.ROMAN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  // The MIT License
	  // Copyright (c) 2008 Steven Levithan
	  var digits = String(number).split('');
	  var key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM', '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
	  var roman = '';
	  var i = 3;
	  while (i--) {
	    roman = (key[+digits.pop() + (i * 10)] || '') + roman;
	  }
	  return new Array(+digits.join('') + 1).join('M') + roman;
	};

	exports.ROUND = function(number, digits) {
	  number = utils.parseNumber(number);
	  digits = utils.parseNumber(digits);
	  if (utils.anyIsError(number, digits)) {
	    return error.value;
	  }
	  return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
	};

	exports.ROUNDDOWN = function(number, digits) {
	  number = utils.parseNumber(number);
	  digits = utils.parseNumber(digits);
	  if (utils.anyIsError(number, digits)) {
	    return error.value;
	  }
	  var sign = (number > 0) ? 1 : -1;
	  return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
	};

	exports.ROUNDUP = function(number, digits) {
	  number = utils.parseNumber(number);
	  digits = utils.parseNumber(digits);
	  if (utils.anyIsError(number, digits)) {
	    return error.value;
	  }
	  var sign = (number > 0) ? 1 : -1;
	  return sign * (Math.ceil(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
	};

	exports.SEC = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 1 / Math.cos(number);
	};

	exports.SECH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return 2 / (Math.exp(number) + Math.exp(-number));
	};

	exports.SERIESSUM = function(x, n, m, coefficients) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  m = utils.parseNumber(m);
	  coefficients = utils.parseNumberArray(coefficients);
	  if (utils.anyIsError(x, n, m, coefficients)) {
	    return error.value;
	  }
	  var result = coefficients[0] * Math.pow(x, n);
	  for (var i = 1; i < coefficients.length; i++) {
	    result += coefficients[i] * Math.pow(x, n + i * m);
	  }
	  return result;
	};

	exports.SIGN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  if (number < 0) {
	    return -1;
	  } else if (number === 0) {
	    return 0;
	  } else {
	    return 1;
	  }
	};

	exports.SIN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.sin(number);
	};

	  exports.SINH = function(number) {
	    number = utils.parseNumber(number);
	    if (number instanceof Error) {
	      return number;
	    }
	    return (Math.exp(number) - Math.exp(-number)) / 2;
	  };

	  exports.SQRT = function(number) {
	    number = utils.parseNumber(number);
	    if (number instanceof Error) {
	      return number;
	    }
	    if (number < 0) {
	      return error.num;
	    }
	    return Math.sqrt(number);
	  };

	  exports.SQRTPI = function(number) {
	    number = utils.parseNumber(number);
	    if (number instanceof Error) {
	      return number;
	    }
	    return Math.sqrt(number * Math.PI);
	  };

	exports.SUBTOTAL = function(function_code, ref1) {
	  function_code = utils.parseNumber(function_code);
	  if (function_code instanceof Error) {
	    return function_code;
	  }
	  switch (function_code) {
	    case 1:
	      return statistical.AVERAGE(ref1);
	    case 2:
	      return statistical.COUNT(ref1);
	    case 3:
	      return statistical.COUNTA(ref1);
	    case 4:
	      return statistical.MAX(ref1);
	    case 5:
	      return statistical.MIN(ref1);
	    case 6:
	      return exports.PRODUCT(ref1);
	    case 7:
	      return statistical.STDEV.S(ref1);
	    case 8:
	      return statistical.STDEV.P(ref1);
	    case 9:
	      return exports.SUM(ref1);
	    case 10:
	      return statistical.VAR.S(ref1);
	    case 11:
	      return statistical.VAR.P(ref1);
	      // no hidden values for us
	    case 101:
	      return statistical.AVERAGE(ref1);
	    case 102:
	      return statistical.COUNT(ref1);
	    case 103:
	      return statistical.COUNTA(ref1);
	    case 104:
	      return statistical.MAX(ref1);
	    case 105:
	      return statistical.MIN(ref1);
	    case 106:
	      return exports.PRODUCT(ref1);
	    case 107:
	      return statistical.STDEV.S(ref1);
	    case 108:
	      return statistical.STDEV.P(ref1);
	    case 109:
	      return exports.SUM(ref1);
	    case 110:
	      return statistical.VAR.S(ref1);
	    case 111:
	      return statistical.VAR.P(ref1);

	  }
	};

	exports.ADD = function (num1, num2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  num1 = utils.parseNumber(num1);
	  num2 = utils.parseNumber(num2);
	  if (utils.anyIsError(num1, num2)) {
	    return error.value;
	  }

	  return num1 + num2;
	};

	exports.MINUS = function (num1, num2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  num1 = utils.parseNumber(num1);
	  num2 = utils.parseNumber(num2);
	  if (utils.anyIsError(num1, num2)) {
	    return error.value;
	  }

	  return num1 - num2;
	};

	exports.DIVIDE = function (dividend, divisor) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  dividend = utils.parseNumber(dividend);
	  divisor = utils.parseNumber(divisor);
	  if (utils.anyIsError(dividend, divisor)) {
	    return error.value;
	  }

	  if (divisor === 0) {
	    return error.div0;
	  }

	  return dividend / divisor;
	};

	exports.MULTIPLY = function (factor1, factor2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  factor1 = utils.parseNumber(factor1);
	  factor2 = utils.parseNumber(factor2);
	  if (utils.anyIsError(factor1, factor2)) {
	    return error.value;
	  }

	  return factor1 * factor2;
	};

	exports.GTE = function (num1, num2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  num1 = utils.parseNumber(num1);
	  num2 = utils.parseNumber(num2);
	  if (utils.anyIsError(num1, num2)) {
	    return error.error;
	  }

	  return num1 >= num2;
	};

	exports.LT = function (num1, num2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  num1 = utils.parseNumber(num1);
	  num2 = utils.parseNumber(num2);
	  if (utils.anyIsError(num1, num2)) {
	    return error.error;
	  }

	  return num1 < num2;
	};


	exports.LTE = function (num1, num2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  num1 = utils.parseNumber(num1);
	  num2 = utils.parseNumber(num2);
	  if (utils.anyIsError(num1, num2)) {
	    return error.error;
	  }

	  return num1 <= num2;
	};

	exports.EQ = function (value1, value2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  return value1 === value2;
	};

	exports.NE = function (value1, value2) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  return value1 !== value2;
	};

	exports.POW = function (base, exponent) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  base = utils.parseNumber(base);
	  exponent = utils.parseNumber(exponent);
	  if (utils.anyIsError(base, exponent)) {
	    return error.error;
	  }

	  return exports.POWER(base, exponent);
	};

	exports.SUM = function() {
	  var result = 0;
	  var argsKeys = Object.keys(arguments);
	  for (var i = 0; i < argsKeys.length; ++i) {
	    var elt = arguments[argsKeys[i]];
	    if (typeof elt === 'number') {
	      result += elt;
	    } else if (typeof elt === 'string') {
	      var parsed = parseFloat(elt);
	      !isNaN(parsed) && (result += parsed);
	    } else if (Array.isArray(elt)) {
	      result += exports.SUM.apply(null, elt);
	    }
	  }
	  return result;
	};

	exports.SUMIF = function(range, criteria) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  if (range instanceof Error) {
	    return range;
	  }
	  var result = 0;
	  for (var i = 0; i < range.length; i++) {
	    result += (eval(range[i] + criteria)) ? range[i] : 0; // jshint ignore:line
	  }
	  return result;
	};

	exports.SUMIFS = function() {
	  var args = utils.argsToArray(arguments);
	  var range = utils.parseNumberArray(utils.flatten(args.shift()));
	  if (range instanceof Error) {
	    return range;
	  }
	  var criteria = args;

	  var n_range_elements = range.length;
	  var n_criterias = criteria.length;

	  var result = 0;
	  for (var i = 0; i < n_range_elements; i++) {
	    var el = range[i];
	    var condition = '';
	    for (var c = 0; c < n_criterias; c++) {
	      condition += el + criteria[c];
	      if (c !== n_criterias - 1) {
	        condition += '&&';
	      }
	    }
	    if (eval(condition)) { // jshint ignore:line
	      result += el;
	    }
	  }
	  return result;
	};

	exports.SUMPRODUCT = function() {
	  if (!arguments || arguments.length === 0) {
	    return error.value;
	  }
	  var arrays = arguments.length + 1;
	  var result = 0;
	  var product;
	  var k;
	  var _i;
	  var _ij;
	  for (var i = 0; i < arguments[0].length; i++) {
	    if (!(arguments[0][i] instanceof Array)) {
	      product = 1;
	      for (k = 1; k < arrays; k++) {
	        _i = utils.parseNumber(arguments[k - 1][i]);
	        if (_i instanceof Error) {
	          return _i;
	        }
	        product *= _i;
	      }
	      result += product;
	    } else {
	      for (var j = 0; j < arguments[0][i].length; j++) {
	        product = 1;
	        for (k = 1; k < arrays; k++) {
	          _ij = utils.parseNumber(arguments[k - 1][i][j]);
	          if (_ij instanceof Error) {
	            return _ij;
	          }
	          product *= _ij;
	        }
	        result += product;
	      }
	    }
	  }
	  return result;
	};

	exports.SUMSQ = function() {
	  var numbers = utils.parseNumberArray(utils.flatten(arguments));
	  if (numbers instanceof Error) {
	    return numbers;
	  }
	  var result = 0;
	  var length = numbers.length;
	  for (var i = 0; i < length; i++) {
	    result += (information.ISNUMBER(numbers[i])) ? numbers[i] * numbers[i] : 0;
	  }
	  return result;
	};

	exports.SUMX2MY2 = function(array_x, array_y) {
	  array_x = utils.parseNumberArray(utils.flatten(array_x));
	  array_y = utils.parseNumberArray(utils.flatten(array_y));
	  if (utils.anyIsError(array_x, array_y)) {
	    return error.value;
	  }
	  var result = 0;
	  for (var i = 0; i < array_x.length; i++) {
	    result += array_x[i] * array_x[i] - array_y[i] * array_y[i];
	  }
	  return result;
	};

	exports.SUMX2PY2 = function(array_x, array_y) {
	  array_x = utils.parseNumberArray(utils.flatten(array_x));
	  array_y = utils.parseNumberArray(utils.flatten(array_y));
	  if (utils.anyIsError(array_x, array_y)) {
	    return error.value;
	  }
	  var result = 0;
	  array_x = utils.parseNumberArray(utils.flatten(array_x));
	  array_y = utils.parseNumberArray(utils.flatten(array_y));
	  for (var i = 0; i < array_x.length; i++) {
	    result += array_x[i] * array_x[i] + array_y[i] * array_y[i];
	  }
	  return result;
	};

	exports.SUMXMY2 = function(array_x, array_y) {
	  array_x = utils.parseNumberArray(utils.flatten(array_x));
	  array_y = utils.parseNumberArray(utils.flatten(array_y));
	  if (utils.anyIsError(array_x, array_y)) {
	    return error.value;
	  }
	  var result = 0;
	  array_x = utils.flatten(array_x);
	  array_y = utils.flatten(array_y);
	  for (var i = 0; i < array_x.length; i++) {
	    result += Math.pow(array_x[i] - array_y[i], 2);
	  }
	  return result;
	};

	exports.TAN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return Math.tan(number);
	};

	exports.TANH = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  var e2 = Math.exp(2 * number);
	  return (e2 - 1) / (e2 + 1);
	};

	exports.TRUNC = function(number, digits) {
	  digits = (digits === undefined) ? 0 : digits;
	  number = utils.parseNumber(number);
	  digits = utils.parseNumber(digits);
	  if (utils.anyIsError(number, digits)) {
	    return error.value;
	  }
	  var sign = (number > 0) ? 1 : -1;
	  return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);

	function flattenShallow(array) {
	  if (!array || !array.reduce) { return array; }
	  return array.reduce(function(a, b) {
	    var aIsArray = Array.isArray(a);
	    var bIsArray = Array.isArray(b);
	    if (aIsArray && bIsArray ) {
	      return a.concat(b);
	    }
	    if (aIsArray) {
	      a.push(b);
	      return a;
	    }
	    if (bIsArray) {
	      return [a].concat(b);
	    }
	    return [a, b];
	  });
	}

	function isFlat(array) {
	  if (!array) { return false; }
	  for (var i = 0; i < array.length; ++i) {
	    if (Array.isArray(array[i])) {
	      return false;
	    }
	  }
	  return true;
	}

	exports.flatten = function() {
	  var result = exports.argsToArray.apply(null, arguments);
	  while (!isFlat(result)) {
	    result = flattenShallow(result);
	  }
	  return result;
	};

	exports.argsToArray = function(args) {
	  return Array.prototype.slice.call(args, 0);
	};

	exports.numbers = function() {
	  var possibleNumbers = this.flatten.apply(null, arguments);
	  return possibleNumbers.filter(function(el) {
	    return typeof el === 'number';
	  });
	};

	exports.cleanFloat = function(number) {
	  var power = 1e14;
	  return Math.round(number * power) / power;
	};

	exports.parseBool = function(bool) {
	  if (typeof bool === 'boolean') {
	    return bool;
	  }

	  if (bool instanceof Error) {
	    return bool;
	  }

	  if (typeof bool === 'number') {
	    return bool !== 0;
	  }

	  if (typeof bool === 'string') {
	    var up = bool.toUpperCase();
	    if (up === 'TRUE') {
	      return true;
	    }

	    if (up === 'FALSE') {
	      return false;
	    }
	  }

	  if (bool instanceof Date && !isNaN(bool)) {
	    return true;
	  }

	  return error.value;
	};

	exports.parseNumber = function(string) {
	  if (string === undefined || string === '') {
	    return error.value;
	  }
	  if (!isNaN(string)) {
	    return parseFloat(string);
	  }
	  return error.value;
	};

	exports.parseNumberArray = function(arr) {
	  var len;
	  if (!arr || (len = arr.length) === 0) {
	    return error.value;
	  }
	  var parsed;
	  while (len--) {
	    parsed = exports.parseNumber(arr[len]);
	    if (parsed === error.value) {
	      return parsed;
	    }
	    arr[len] = parsed;
	  }
	  return arr;
	};

	exports.parseMatrix = function(matrix) {
	  var n;
	  if (!matrix || (n = matrix.length) === 0) {
	    return error.value;
	  }
	  var pnarr;
	  for (var i = 0; i < matrix.length; i++) {
	    pnarr = exports.parseNumberArray(matrix[i]);
	    matrix[i] = pnarr;
	    if (pnarr instanceof Error) {
	      return pnarr;
	    }
	  }
	  return matrix;
	};

	var d1900 = new Date(1900, 0, 1);
	exports.parseDate = function(date) {
	  if (!isNaN(date)) {
	    if (date instanceof Date) {
	      return new Date(date);
	    }
	    var d = parseInt(date, 10);
	    if (d < 0) {
	      return error.num;
	    }
	    if (d <= 60) {
	      return new Date(d1900.getTime() + (d - 1) * 86400000);
	    }
	    return new Date(d1900.getTime() + (d - 2) * 86400000);
	  }
	  if (typeof date === 'string') {
	    date = new Date(date);
	    if (!isNaN(date)) {
	      return date;
	    }
	  }
	  return error.value;
	};

	exports.parseDateArray = function(arr) {
	  var len = arr.length;
	  var parsed;
	  while (len--) {
	    parsed = this.parseDate(arr[len]);
	    if (parsed === error.value) {
	      return parsed;
	    }
	    arr[len] = parsed;
	  }
	  return arr;
	};

	exports.anyIsError = function() {
	  var n = arguments.length;
	  while (n--) {
	    if (arguments[n] instanceof Error) {
	      return true;
	    }
	  }
	  return false;
	};

	exports.arrayValuesToNumbers = function(arr) {
	  var n = arr.length;
	  var el;
	  while (n--) {
	    el = arr[n];
	    if (typeof el === 'number') {
	      continue;
	    }
	    if (el === true) {
	      arr[n] = 1;
	      continue;
	    }
	    if (el === false) {
	      arr[n] = 0;
	      continue;
	    }
	    if (typeof el === 'string') {
	      var number = this.parseNumber(el);
	      if (number instanceof Error) {
	        arr[n] = 0;
	      } else {
	        arr[n] = number;
	      }
	    }
	  }
	  return arr;
	};

	exports.rest = function(array, idx) {
	  idx = idx || 1;
	  if (!array || typeof array.slice !== 'function') {
	    return array;
	  }
	  return array.slice(idx);
	};

	exports.initial = function(array, idx) {
	  idx = idx || 1;
	  if (!array || typeof array.slice !== 'function') {
	    return array;
	  }
	  return array.slice(0, array.length - idx);
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	exports.nil = new Error('#NULL!');
	exports.div0 = new Error('#DIV/0!');
	exports.value = new Error('#VALUE?');
	exports.ref = new Error('#REF!');
	exports.name = new Error('#NAME?');
	exports.num = new Error('#NUM!');
	exports.na = new Error('#N/A');
	exports.error = new Error('#ERROR!');
	exports.data = new Error('#GETTING_DATA');


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var mathTrig = __webpack_require__(2);
	var text = __webpack_require__(7);
	var jStat = __webpack_require__(9).jStat;
	var utils = __webpack_require__(4);
	var error = __webpack_require__(5);
	var misc = __webpack_require__(10);

	var SQRT2PI = 2.5066282746310002;

	exports.AVEDEV = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  return jStat.sum(jStat(range).subtract(jStat.mean(range)).abs()[0]) / range.length;
	};

	exports.AVERAGE = function() {
	  var range = utils.numbers(utils.flatten(arguments));
	  var n = range.length;
	  var sum = 0;
	  var count = 0;
	  for (var i = 0; i < n; i++) {
	    sum += range[i];
	    count += 1;
	  }
	  return sum / count;
	};

	exports.AVERAGEA = function() {
	  var range = utils.flatten(arguments);
	  var n = range.length;
	  var sum = 0;
	  var count = 0;
	  for (var i = 0; i < n; i++) {
	    var el = range[i];
	    if (typeof el === 'number') {
	      sum += el;
	    }
	    if (el === true) {
	      sum++;
	    }
	    if (el !== null) {
	      count++;
	    }
	  }
	  return sum / count;
	};

	exports.AVERAGEIF = function(range, criteria, average_range) {
	  average_range = average_range || range;
	  range = utils.flatten(range);
	  average_range = utils.parseNumberArray(utils.flatten(average_range));
	  if (average_range instanceof Error) {
	    return average_range;
	  }
	  var average_count = 0;
	  var result = 0;
	  for (var i = 0; i < range.length; i++) {
	    if (eval(range[i] + criteria)) { // jshint ignore:line
	      result += average_range[i];
	      average_count++;
	    }
	  }
	  return result / average_count;
	};

	exports.AVERAGEIFS = function() {
	  // Does not work with multi dimensional ranges yet!
	  //http://office.microsoft.com/en-001/excel-help/averageifs-function-HA010047493.aspx
	  var args = utils.argsToArray(arguments);
	  var criteria = (args.length - 1) / 2;
	  var range = utils.flatten(args[0]);
	  var count = 0;
	  var result = 0;
	  for (var i = 0; i < range.length; i++) {
	    var condition = '';
	    for (var j = 0; j < criteria; j++) {
	      condition += args[2 * j + 1][i] + args[2 * j + 2];
	      if (j !== criteria - 1) {
	        condition += '&&';
	      }
	    }
	    if (eval(condition)) { // jshint ignore:line
	      result += range[i];
	      count++;
	    }
	  }

	  var average = result / count;
	  if (isNaN(average)) {
	    return 0;
	  } else {
	    return average;
	  }
	};

	exports.BETA = {};

	exports.BETA.DIST = function(x, alpha, beta, cumulative, A, B) {
	  if (arguments.length < 4) {
	    return error.value;
	  }

	  A = (A === undefined) ? 0 : A;
	  B = (B === undefined) ? 1 : B;

	  x = utils.parseNumber(x);
	  alpha = utils.parseNumber(alpha);
	  beta = utils.parseNumber(beta);
	  A = utils.parseNumber(A);
	  B = utils.parseNumber(B);
	  if (utils.anyIsError(x, alpha, beta, A, B)) {
	    return error.value;
	  }

	  x = (x - A) / (B - A);
	  return (cumulative) ? jStat.beta.cdf(x, alpha, beta) : jStat.beta.pdf(x, alpha, beta);
	};

	exports.BETA.INV = function(probability, alpha, beta, A, B) {
	  A = (A === undefined) ? 0 : A;
	  B = (B === undefined) ? 1 : B;

	  probability = utils.parseNumber(probability);
	  alpha = utils.parseNumber(alpha);
	  beta = utils.parseNumber(beta);
	  A = utils.parseNumber(A);
	  B = utils.parseNumber(B);
	  if (utils.anyIsError(probability, alpha, beta, A, B)) {
	    return error.value;
	  }

	  return jStat.beta.inv(probability, alpha, beta) * (B - A) + A;
	};

	exports.BINOM = {};

	exports.BINOM.DIST = function(successes, trials, probability, cumulative) {
	  successes = utils.parseNumber(successes);
	  trials = utils.parseNumber(trials);
	  probability = utils.parseNumber(probability);
	  cumulative = utils.parseNumber(cumulative);
	  if (utils.anyIsError(successes, trials, probability, cumulative)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.binomial.cdf(successes, trials, probability) : jStat.binomial.pdf(successes, trials, probability);
	};

	exports.BINOM.DIST.RANGE = function(trials, probability, successes, successes2) {
	  successes2 = (successes2 === undefined) ? successes : successes2;

	  trials = utils.parseNumber(trials);
	  probability = utils.parseNumber(probability);
	  successes = utils.parseNumber(successes);
	  successes2 = utils.parseNumber(successes2);
	  if (utils.anyIsError(trials, probability, successes, successes2)) {
	    return error.value;
	  }

	  var result = 0;
	  for (var i = successes; i <= successes2; i++) {
	    result += mathTrig.COMBIN(trials, i) * Math.pow(probability, i) * Math.pow(1 - probability, trials - i);
	  }
	  return result;
	};

	exports.BINOM.INV = function(trials, probability, alpha) {
	  trials = utils.parseNumber(trials);
	  probability = utils.parseNumber(probability);
	  alpha = utils.parseNumber(alpha);
	  if (utils.anyIsError(trials, probability, alpha)) {
	    return error.value;
	  }

	  var x = 0;
	  while (x <= trials) {
	    if (jStat.binomial.cdf(x, trials, probability) >= alpha) {
	      return x;
	    }
	    x++;
	  }
	};

	exports.CHISQ = {};

	exports.CHISQ.DIST = function(x, k, cumulative) {
	  x = utils.parseNumber(x);
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(x, k)) {
	    return error.value;
	  }

	  return (cumulative) ? jStat.chisquare.cdf(x, k) : jStat.chisquare.pdf(x, k);
	};

	exports.CHISQ.DIST.RT = function(x, k) {
	  if (!x | !k) {
	    return error.na;
	  }

	  if (x < 1 || k > Math.pow(10, 10)) {
	    return error.num;
	  }

	  if ((typeof x !== 'number') || (typeof k !== 'number')) {
	    return error.value;
	  }

	  return 1 -  jStat.chisquare.cdf(x, k);
	};

	exports.CHISQ.INV = function(probability, k) {
	  probability = utils.parseNumber(probability);
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(probability, k)) {
	    return error.value;
	  }
	  return jStat.chisquare.inv(probability, k);
	};

	exports.CHISQ.INV.RT = function(p, k) {
	  if (!p | !k) {
	    return error.na;
	  }

	  if (p < 0 || p > 1 || k < 1 || k > Math.pow(10, 10)) {
	    return error.num;
	  }

	  if ((typeof p !== 'number') || (typeof k !== 'number')) {
	    return error.value;
	  }

	  return jStat.chisquare.inv(1.0 - p, k);
	};

	exports.CHISQ.TEST = function(observed, expected) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  if ((!(observed instanceof Array)) || (!(expected instanceof Array))) {
	    return error.value;
	  }

	  if (observed.length !== expected.length) {
	    return error.value;
	  }

	  if (observed[0] && expected[0] &&
	      observed[0].length !== expected[0].length) {
	    return error.value;
	  }

	  var row = observed.length;
	  var tmp, i, j;

	  // Convert single-dimension array into two-dimension array
	  for (i = 0; i < row; i ++) {
	    if (!(observed[i] instanceof Array)) {
	      tmp = observed[i];
	      observed[i] = [];
	      observed[i].push(tmp);
	    }
	    if (!(expected[i] instanceof Array)) {
	      tmp = expected[i];
	      expected[i] = [];
	      expected[i].push(tmp);
	    }
	  }

	  var col = observed[0].length;
	  var dof = (col === 1) ? row-1 : (row-1)*(col-1);
	  var xsqr = 0;
	  var Pi =Math.PI;

	  for (i = 0; i < row; i ++) {
	    for (j = 0; j < col; j ++) {
	      xsqr += Math.pow((observed[i][j] - expected[i][j]), 2) / expected[i][j];
	    }
	  }

	  // Get independency by X square and its degree of freedom
	  function ChiSq(xsqr, dof) {
	    var p = Math.exp(-0.5 * xsqr);
	    if((dof%2) === 1) {
	      p = p * Math.sqrt(2 * xsqr/Pi);
	    }
	    var k = dof;
	    while(k >= 2) {
	      p = p * xsqr/k;
	      k = k - 2;
	    }
	    var t = p;
	    var a = dof;
	    while (t > 0.0000000001*p) {
	      a = a + 2;
	      t = t * xsqr/a;
	      p = p + t;
	    }
	    return 1-p;
	  }

	  return Math.round(ChiSq(xsqr, dof) * 1000000) / 1000000;
	};

	exports.COLUMN = function(matrix, index) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  if (index < 0) {
	    return error.num;
	  }

	  if (!(matrix instanceof Array) || (typeof index !== 'number')) {
	    return error.value;
	  }

	  if (matrix.length === 0) {
	    return undefined;
	  }

	  return jStat.col(matrix, index);
	};

	exports.COLUMNS = function(matrix) {
	  if (arguments.length !== 1) {
	    return error.na;
	  }

	  if (!(matrix instanceof Array)) {
	    return error.value;
	  }

	  if (matrix.length === 0) {
	    return 0;
	  }

	  return jStat.cols(matrix);
	};

	exports.CONFIDENCE = {};

	exports.CONFIDENCE.NORM = function(alpha, sd, n) {
	  alpha = utils.parseNumber(alpha);
	  sd = utils.parseNumber(sd);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(alpha, sd, n)) {
	    return error.value;
	  }
	  return jStat.normalci(1, alpha, sd, n)[1] - 1;
	};

	exports.CONFIDENCE.T = function(alpha, sd, n) {
	  alpha = utils.parseNumber(alpha);
	  sd = utils.parseNumber(sd);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(alpha, sd, n)) {
	    return error.value;
	  }
	  return jStat.tci(1, alpha, sd, n)[1] - 1;
	};

	exports.CORREL = function(array1, array2) {
	  array1 = utils.parseNumberArray(utils.flatten(array1));
	  array2 = utils.parseNumberArray(utils.flatten(array2));
	  if (utils.anyIsError(array1, array2)) {
	    return error.value;
	  }
	  return jStat.corrcoeff(array1, array2);
	};

	exports.COUNT = function() {
	  return utils.numbers(utils.flatten(arguments)).length;
	};

	exports.COUNTA = function() {
	  var range = utils.flatten(arguments);
	  return range.length - exports.COUNTBLANK(range);
	};

	exports.COUNTIN = function (range, value) {
	  var result = 0;
	  for (var i = 0; i < range.length; i++) {
	    if (range[i] === value) {
	      result++;
	    }
	  }
	  return result;
	};


	exports.COUNTBLANK = function() {
	  var range = utils.flatten(arguments);
	  var blanks = 0;
	  var element;
	  for (var i = 0; i < range.length; i++) {
	    element = range[i];
	    if (element === null || element === '') {
	      blanks++;
	    }
	  }
	  return blanks;
	};

	exports.COUNTIF = function(range, criteria) {
	  range = utils.flatten(range);
	  if (!/[<>=!]/.test(criteria)) {
	    criteria = '=="' + criteria + '"';
	  }
	  var matches = 0;
	  for (var i = 0; i < range.length; i++) {
	    if (typeof range[i] !== 'string') {
	      if (eval(range[i] + criteria)) { // jshint ignore:line
	        matches++;
	      }
	    } else {
	      if (eval('"' + range[i] + '"' + criteria)) { // jshint ignore:line
	        matches++;
	      }
	    }
	  }
	  return matches;
	};

	exports.COUNTIFS = function() {
	  var args = utils.argsToArray(arguments);
	  var results = new Array(utils.flatten(args[0]).length);
	  for (var i = 0; i < results.length; i++) {
	    results[i] = true;
	  }
	  for (i = 0; i < args.length; i += 2) {
	    var range = utils.flatten(args[i]);
	    var criteria = args[i + 1];
	    if (!/[<>=!]/.test(criteria)) {
	      criteria = '=="' + criteria + '"';
	    }
	    for (var j = 0; j < range.length; j++) {
	      if (typeof range[j] !== 'string') {
	        results[j] = results[j] && eval(range[j] + criteria); // jshint ignore:line
	      } else {
	        results[j] = results[j] && eval('"' + range[j] + '"' + criteria); // jshint ignore:line
	      }
	    }
	  }
	  var result = 0;
	  for (i = 0; i < results.length; i++) {
	    if (results[i]) {
	      result++;
	    }
	  }
	  return result;
	};

	exports.COUNTUNIQUE = function () {
	  return misc.UNIQUE.apply(null, utils.flatten(arguments)).length;
	};

	exports.COVARIANCE = {};

	exports.COVARIANCE.P = function(array1, array2) {
	  array1 = utils.parseNumberArray(utils.flatten(array1));
	  array2 = utils.parseNumberArray(utils.flatten(array2));
	  if (utils.anyIsError(array1, array2)) {
	    return error.value;
	  }
	  var mean1 = jStat.mean(array1);
	  var mean2 = jStat.mean(array2);
	  var result = 0;
	  var n = array1.length;
	  for (var i = 0; i < n; i++) {
	    result += (array1[i] - mean1) * (array2[i] - mean2);
	  }
	  return result / n;
	};

	exports.COVARIANCE.S = function(array1, array2) {
	  array1 = utils.parseNumberArray(utils.flatten(array1));
	  array2 = utils.parseNumberArray(utils.flatten(array2));
	  if (utils.anyIsError(array1, array2)) {
	    return error.value;
	  }
	  return jStat.covariance(array1, array2);
	};

	exports.DEVSQ = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var mean = jStat.mean(range);
	  var result = 0;
	  for (var i = 0; i < range.length; i++) {
	    result += Math.pow((range[i] - mean), 2);
	  }
	  return result;
	};

	exports.EXPON = {};

	exports.EXPON.DIST = function(x, lambda, cumulative) {
	  x = utils.parseNumber(x);
	  lambda = utils.parseNumber(lambda);
	  if (utils.anyIsError(x, lambda)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.exponential.cdf(x, lambda) : jStat.exponential.pdf(x, lambda);
	};

	exports.F = {};

	exports.F.DIST = function(x, d1, d2, cumulative) {
	  x = utils.parseNumber(x);
	  d1 = utils.parseNumber(d1);
	  d2 = utils.parseNumber(d2);
	  if (utils.anyIsError(x, d1, d2)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.centralF.cdf(x, d1, d2) : jStat.centralF.pdf(x, d1, d2);
	};

	exports.F.DIST.RT = function(x, d1, d2) {
	  if (arguments.length !== 3) {
	    return error.na;
	  }

	  if (x < 0 || d1 < 1 || d2 < 1) {
	    return error.num;
	  }

	  if ((typeof x !== 'number') || (typeof d1 !== 'number') || (typeof d2 !== 'number')) {
	    return error.value;
	  }

	  return 1 - jStat.centralF.cdf(x, d1, d2);
	};

	exports.F.INV = function(probability, d1, d2) {
	  probability = utils.parseNumber(probability);
	  d1 = utils.parseNumber(d1);
	  d2 = utils.parseNumber(d2);
	  if (utils.anyIsError(probability, d1, d2)) {
	    return error.value;
	  }
	  if (probability <= 0.0 || probability > 1.0) {
	    return error.num;
	  }

	  return jStat.centralF.inv(probability, d1, d2);
	};

	exports.F.INV.RT = function(p, d1, d2) {
	  if (arguments.length !== 3) {
	    return error.na;
	  }

	  if (p < 0 || p > 1 || d1 < 1 || d1 > Math.pow(10, 10) || d2 < 1 || d2 > Math.pow(10, 10)) {
	    return error.num;
	  }

	  if ((typeof p !== 'number') || (typeof d1 !== 'number') || (typeof d2 !== 'number')) {
	    return error.value;
	  }

	  return jStat.centralF.inv(1.0 - p, d1, d2);
	};

	exports.F.TEST = function(array1, array2) {
	  if (!array1 || !array2) {
	    return error.na;
	  }

	  if (!(array1 instanceof Array) || !(array2 instanceof Array)) {
	    return error.na;
	  }

	  if (array1.length < 2 || array2.length < 2) {
	    return error.div0;
	  }

	  var sumOfSquares = function(values, x1) {
	    var sum = 0;
	    for (var i = 0; i < values.length; i++) {
	      sum +=Math.pow((values[i] - x1), 2);
	    }
	    return sum;
	  };

	  var x1 = mathTrig.SUM(array1) / array1.length;
	  var x2 = mathTrig.SUM(array2) / array2.length;
	  var sum1 = sumOfSquares(array1, x1) / (array1.length - 1);
	  var sum2 = sumOfSquares(array2, x2) / (array2.length - 1);

	  return sum1 / sum2;
	};

	exports.FISHER = function(x) {
	  x = utils.parseNumber(x);
	  if (x instanceof Error) {
	    return x;
	  }
	  return Math.log((1 + x) / (1 - x)) / 2;
	};

	exports.FISHERINV = function(y) {
	  y = utils.parseNumber(y);
	  if (y instanceof Error) {
	    return y;
	  }
	  var e2y = Math.exp(2 * y);
	  return (e2y - 1) / (e2y + 1);
	};

	exports.FORECAST = function(x, data_y, data_x) {
	  x = utils.parseNumber(x);
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(x, data_y, data_x)) {
	    return error.value;
	  }
	  var xmean = jStat.mean(data_x);
	  var ymean = jStat.mean(data_y);
	  var n = data_x.length;
	  var num = 0;
	  var den = 0;
	  for (var i = 0; i < n; i++) {
	    num += (data_x[i] - xmean) * (data_y[i] - ymean);
	    den += Math.pow(data_x[i] - xmean, 2);
	  }
	  var b = num / den;
	  var a = ymean - b * xmean;
	  return a + b * x;
	};

	exports.FREQUENCY = function(data, bins) {
	  data = utils.parseNumberArray(utils.flatten(data));
	  bins = utils.parseNumberArray(utils.flatten(bins));
	  if (utils.anyIsError(data, bins)) {
	    return error.value;
	  }
	  var n = data.length;
	  var b = bins.length;
	  var r = [];
	  for (var i = 0; i <= b; i++) {
	    r[i] = 0;
	    for (var j = 0; j < n; j++) {
	      if (i === 0) {
	        if (data[j] <= bins[0]) {
	          r[0] += 1;
	        }
	      } else if (i < b) {
	        if (data[j] > bins[i - 1] && data[j] <= bins[i]) {
	          r[i] += 1;
	        }
	      } else if (i === b) {
	        if (data[j] > bins[b - 1]) {
	          r[b] += 1;
	        }
	      }
	    }
	  }
	  return r;
	};


	exports.GAMMA = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }

	  if (number === 0) {
	    return error.num;
	  }

	  if (parseInt(number, 10) === number && number < 0) {
	    return error.num;
	  }

	  return jStat.gammafn(number);
	};

	exports.GAMMA.DIST = function(value, alpha, beta, cumulative) {
	  if (arguments.length !== 4) {
	    return error.na;
	  }

	  if (value < 0 || alpha <= 0 || beta <= 0) {
	    return error.value;
	  }

	  if ((typeof value !== 'number') || (typeof alpha !== 'number') || (typeof beta !== 'number')) {
	    return error.value;
	  }

	  return cumulative ? jStat.gamma.cdf(value, alpha, beta, true) : jStat.gamma.pdf(value, alpha, beta, false);
	};

	exports.GAMMA.INV = function(probability, alpha, beta) {
	  if (arguments.length !== 3) {
	    return error.na;
	  }

	  if (probability < 0 || probability > 1 || alpha <= 0 || beta <= 0) {
	    return error.num;
	  }

	  if ((typeof probability !== 'number') || (typeof alpha !== 'number') || (typeof beta !== 'number')) {
	    return error.value;
	  }

	  return jStat.gamma.inv(probability, alpha, beta);
	};

	exports.GAMMALN = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return jStat.gammaln(number);
	};

	exports.GAMMALN.PRECISE = function(x) {
	  if (arguments.length !== 1) {
	    return error.na;
	  }

	  if (x <= 0) {
	    return error.num;
	  }

	  if (typeof x !== 'number') {
	    return error.value;
	  }

	  return jStat.gammaln(x);
	};

	exports.GAUSS = function(z) {
	  z = utils.parseNumber(z);
	  if (z instanceof Error) {
	    return z;
	  }
	  return jStat.normal.cdf(z, 0, 1) - 0.5;
	};

	exports.GEOMEAN = function() {
	  var args = utils.parseNumberArray(utils.flatten(arguments));
	  if (args instanceof Error) {
	    return args;
	  }
	  return jStat.geomean(args);
	};

	exports.GROWTH = function(known_y, known_x, new_x, use_const) {
	  // Credits: Ilmari Karonen (http://stackoverflow.com/questions/14161990/how-to-implement-growth-function-in-javascript)

	  known_y = utils.parseNumberArray(known_y);
	  if (known_y instanceof Error) {
	    return known_y;
	  }

	  // Default values for optional parameters:
	  var i;
	  if (known_x === undefined) {
	    known_x = [];
	    for (i = 1; i <= known_y.length; i++) {
	      known_x.push(i);
	    }
	  }
	  if (new_x === undefined) {
	    new_x = [];
	    for (i = 1; i <= known_y.length; i++) {
	      new_x.push(i);
	    }
	  }

	  known_x = utils.parseNumberArray(known_x);
	  new_x = utils.parseNumberArray(new_x);
	  if (utils.anyIsError(known_x, new_x)) {
	    return error.value;
	  }


	  if (use_const === undefined) {
	    use_const = true;
	  }

	  // Calculate sums over the data:
	  var n = known_y.length;
	  var avg_x = 0;
	  var avg_y = 0;
	  var avg_xy = 0;
	  var avg_xx = 0;
	  for (i = 0; i < n; i++) {
	    var x = known_x[i];
	    var y = Math.log(known_y[i]);
	    avg_x += x;
	    avg_y += y;
	    avg_xy += x * y;
	    avg_xx += x * x;
	  }
	  avg_x /= n;
	  avg_y /= n;
	  avg_xy /= n;
	  avg_xx /= n;

	  // Compute linear regression coefficients:
	  var beta;
	  var alpha;
	  if (use_const) {
	    beta = (avg_xy - avg_x * avg_y) / (avg_xx - avg_x * avg_x);
	    alpha = avg_y - beta * avg_x;
	  } else {
	    beta = avg_xy / avg_xx;
	    alpha = 0;
	  }

	  // Compute and return result array:
	  var new_y = [];
	  for (i = 0; i < new_x.length; i++) {
	    new_y.push(Math.exp(alpha + beta * new_x[i]));
	  }
	  return new_y;
	};

	exports.HARMEAN = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var n = range.length;
	  var den = 0;
	  for (var i = 0; i < n; i++) {
	    den += 1 / range[i];
	  }
	  return n / den;
	};

	exports.HYPGEOM = {};

	exports.HYPGEOM.DIST = function(x, n, M, N, cumulative) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  M = utils.parseNumber(M);
	  N = utils.parseNumber(N);
	  if (utils.anyIsError(x, n, M, N)) {
	    return error.value;
	  }

	  function pdf(x, n, M, N) {
	    return mathTrig.COMBIN(M, x) * mathTrig.COMBIN(N - M, n - x) / mathTrig.COMBIN(N, n);
	  }

	  function cdf(x, n, M, N) {
	    var result = 0;
	    for (var i = 0; i <= x; i++) {
	      result += pdf(i, n, M, N);
	    }
	    return result;
	  }

	  return (cumulative) ? cdf(x, n, M, N) : pdf(x, n, M, N);
	};

	exports.INTERCEPT = function(known_y, known_x) {
	  known_y = utils.parseNumberArray(known_y);
	  known_x = utils.parseNumberArray(known_x);
	  if (utils.anyIsError(known_y, known_x)) {
	    return error.value;
	  }
	  if (known_y.length !== known_x.length) {
	    return error.na;
	  }
	  return exports.FORECAST(0, known_y, known_x);
	};

	exports.KURT = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var mean = jStat.mean(range);
	  var n = range.length;
	  var sigma = 0;
	  for (var i = 0; i < n; i++) {
	    sigma += Math.pow(range[i] - mean, 4);
	  }
	  sigma = sigma / Math.pow(jStat.stdev(range, true), 4);
	  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sigma - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
	};

	exports.LARGE = function(range, k) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(range, k)) {
	    return range;
	  }
	  return range.sort(function(a, b) {
	    return b - a;
	  })[k - 1];
	};

	exports.LINEST = function(data_y, data_x) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(data_y, data_x)) {
	    return error.value;
	  }
	  var ymean = jStat.mean(data_y);
	  var xmean = jStat.mean(data_x);
	  var n = data_x.length;
	  var num = 0;
	  var den = 0;
	  for (var i = 0; i < n; i++) {
	    num += (data_x[i] - xmean) * (data_y[i] - ymean);
	    den += Math.pow(data_x[i] - xmean, 2);
	  }
	  var m = num / den;
	  var b = ymean - m * xmean;
	  return [m, b];
	};

	// According to Microsoft:
	// http://office.microsoft.com/en-us/starter-help/logest-function-HP010342665.aspx
	// LOGEST returns are based on the following linear model:
	// ln y = x1 ln m1 + ... + xn ln mn + ln b
	exports.LOGEST = function(data_y, data_x) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(data_y, data_x)) {
	    return error.value;
	  }
	  for (var i = 0; i < data_y.length; i ++) {
	    data_y[i] = Math.log(data_y[i]);
	  }

	  var result = exports.LINEST(data_y, data_x);
	  result[0] = Math.round(Math.exp(result[0])*1000000)/1000000;
	  result[1] = Math.round(Math.exp(result[1])*1000000)/1000000;
	  return result;
	};

	exports.LOGNORM = {};

	exports.LOGNORM.DIST = function(x, mean, sd, cumulative) {
	  x = utils.parseNumber(x);
	  mean = utils.parseNumber(mean);
	  sd = utils.parseNumber(sd);
	  if (utils.anyIsError(x, mean, sd)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.lognormal.cdf(x, mean, sd) : jStat.lognormal.pdf(x, mean, sd);
	};

	exports.LOGNORM.INV = function(probability, mean, sd) {
	  probability = utils.parseNumber(probability);
	  mean = utils.parseNumber(mean);
	  sd = utils.parseNumber(sd);
	  if (utils.anyIsError(probability, mean, sd)) {
	    return error.value;
	  }
	  return jStat.lognormal.inv(probability, mean, sd);
	};

	exports.MAX = function() {
	  var range = utils.numbers(utils.flatten(arguments));
	  return (range.length === 0) ? 0 : Math.max.apply(Math, range);
	};

	exports.MAXA = function() {
	  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
	  return (range.length === 0) ? 0 : Math.max.apply(Math, range);
	};

	exports.MEDIAN = function() {
	  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
	  return jStat.median(range);
	};

	exports.MIN = function() {
	  var range = utils.numbers(utils.flatten(arguments));
	  return (range.length === 0) ? 0 : Math.min.apply(Math, range);
	};

	exports.MINA = function() {
	  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
	  return (range.length === 0) ? 0 : Math.min.apply(Math, range);
	};

	exports.MODE = {};

	exports.MODE.MULT = function() {
	  // Credits: Roönaän
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var n = range.length;
	  var count = {};
	  var maxItems = [];
	  var max = 0;
	  var currentItem;

	  for (var i = 0; i < n; i++) {
	    currentItem = range[i];
	    count[currentItem] = count[currentItem] ? count[currentItem] + 1 : 1;
	    if (count[currentItem] > max) {
	      max = count[currentItem];
	      maxItems = [];
	    }
	    if (count[currentItem] === max) {
	      maxItems[maxItems.length] = currentItem;
	    }
	  }
	  return maxItems;
	};

	exports.MODE.SNGL = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  return exports.MODE.MULT(range).sort(function(a, b) {
	    return a - b;
	  })[0];
	};

	exports.NEGBINOM = {};

	exports.NEGBINOM.DIST = function(k, r, p, cumulative) {
	  k = utils.parseNumber(k);
	  r = utils.parseNumber(r);
	  p = utils.parseNumber(p);
	  if (utils.anyIsError(k, r, p)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.negbin.cdf(k, r, p) : jStat.negbin.pdf(k, r, p);
	};

	exports.NORM = {};

	exports.NORM.DIST = function(x, mean, sd, cumulative) {
	  x = utils.parseNumber(x);
	  mean = utils.parseNumber(mean);
	  sd = utils.parseNumber(sd);
	  if (utils.anyIsError(x, mean, sd)) {
	    return error.value;
	  }
	  if (sd <= 0) {
	    return error.num;
	  }

	  // Return normal distribution computed by jStat [http://jstat.org]
	  return (cumulative) ? jStat.normal.cdf(x, mean, sd) : jStat.normal.pdf(x, mean, sd);
	};

	exports.NORM.INV = function(probability, mean, sd) {
	  probability = utils.parseNumber(probability);
	  mean = utils.parseNumber(mean);
	  sd = utils.parseNumber(sd);
	  if (utils.anyIsError(probability, mean, sd)) {
	    return error.value;
	  }
	  return jStat.normal.inv(probability, mean, sd);
	};

	exports.NORM.S = {};

	exports.NORM.S.DIST = function(z, cumulative) {
	  z = utils.parseNumber(z);
	  if (z instanceof Error) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.normal.cdf(z, 0, 1) : jStat.normal.pdf(z, 0, 1);
	};

	exports.NORM.S.INV = function(probability) {
	  probability = utils.parseNumber(probability);
	  if (probability instanceof Error) {
	    return error.value;
	  }
	  return jStat.normal.inv(probability, 0, 1);
	};

	exports.PEARSON = function(data_x, data_y) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(data_y, data_x)) {
	    return error.value;
	  }
	  var xmean = jStat.mean(data_x);
	  var ymean = jStat.mean(data_y);
	  var n = data_x.length;
	  var num = 0;
	  var den1 = 0;
	  var den2 = 0;
	  for (var i = 0; i < n; i++) {
	    num += (data_x[i] - xmean) * (data_y[i] - ymean);
	    den1 += Math.pow(data_x[i] - xmean, 2);
	    den2 += Math.pow(data_y[i] - ymean, 2);
	  }
	  return num / Math.sqrt(den1 * den2);
	};

	exports.PERCENTILE = {};

	exports.PERCENTILE.EXC = function(array, k) {
	  array = utils.parseNumberArray(utils.flatten(array));
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(array, k)) {
	    return error.value;
	  }
	  array = array.sort(function(a, b) {
	    {
	      return a - b;
	    }
	  });
	  var n = array.length;
	  if (k < 1 / (n + 1) || k > 1 - 1 / (n + 1)) {
	    return error.num;
	  }
	  var l = k * (n + 1) - 1;
	  var fl = Math.floor(l);
	  return utils.cleanFloat((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
	};

	exports.PERCENTILE.INC = function(array, k) {
	  array = utils.parseNumberArray(utils.flatten(array));
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(array, k)) {
	    return error.value;
	  }
	  array = array.sort(function(a, b) {
	    return a - b;
	  });
	  var n = array.length;
	  var l = k * (n - 1);
	  var fl = Math.floor(l);
	  return utils.cleanFloat((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
	};

	exports.PERCENTRANK = {};

	exports.PERCENTRANK.EXC = function(array, x, significance) {
	  significance = (significance === undefined) ? 3 : significance;
	  array = utils.parseNumberArray(utils.flatten(array));
	  x = utils.parseNumber(x);
	  significance = utils.parseNumber(significance);
	  if (utils.anyIsError(array, x, significance)) {
	    return error.value;
	  }
	  array = array.sort(function(a, b) {
	    return a - b;
	  });
	  var uniques = misc.UNIQUE.apply(null, array);
	  var n = array.length;
	  var m = uniques.length;
	  var power = Math.pow(10, significance);
	  var result = 0;
	  var match = false;
	  var i = 0;
	  while (!match && i < m) {
	    if (x === uniques[i]) {
	      result = (array.indexOf(uniques[i]) + 1) / (n + 1);
	      match = true;
	    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
	      result = (array.indexOf(uniques[i]) + 1 + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n + 1);
	      match = true;
	    }
	    i++;
	  }
	  return Math.floor(result * power) / power;
	};

	exports.PERCENTRANK.INC = function(array, x, significance) {
	  significance = (significance === undefined) ? 3 : significance;
	  array = utils.parseNumberArray(utils.flatten(array));
	  x = utils.parseNumber(x);
	  significance = utils.parseNumber(significance);
	  if (utils.anyIsError(array, x, significance)) {
	    return error.value;
	  }
	  array = array.sort(function(a, b) {
	    return a - b;
	  });
	  var uniques = misc.UNIQUE.apply(null, array);
	  var n = array.length;
	  var m = uniques.length;
	  var power = Math.pow(10, significance);
	  var result = 0;
	  var match = false;
	  var i = 0;
	  while (!match && i < m) {
	    if (x === uniques[i]) {
	      result = array.indexOf(uniques[i]) / (n - 1);
	      match = true;
	    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
	      result = (array.indexOf(uniques[i]) + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n - 1);
	      match = true;
	    }
	    i++;
	  }
	  return Math.floor(result * power) / power;
	};

	exports.PERMUT = function(number, number_chosen) {
	  number = utils.parseNumber(number);
	  number_chosen = utils.parseNumber(number_chosen);
	  if (utils.anyIsError(number, number_chosen)) {
	    return error.value;
	  }
	  return mathTrig.FACT(number) / mathTrig.FACT(number - number_chosen);
	};

	exports.PERMUTATIONA = function(number, number_chosen) {
	  number = utils.parseNumber(number);
	  number_chosen = utils.parseNumber(number_chosen);
	  if (utils.anyIsError(number, number_chosen)) {
	    return error.value;
	  }
	  return Math.pow(number, number_chosen);
	};

	exports.PHI = function(x) {
	  x = utils.parseNumber(x);
	  if (x instanceof Error) {
	    return error.value;
	  }
	  return Math.exp(-0.5 * x * x) / SQRT2PI;
	};

	exports.POISSON = {};

	exports.POISSON.DIST = function(x, mean, cumulative) {
	  x = utils.parseNumber(x);
	  mean = utils.parseNumber(mean);
	  if (utils.anyIsError(x, mean)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.poisson.cdf(x, mean) : jStat.poisson.pdf(x, mean);
	};

	exports.PROB = function(range, probability, lower, upper) {
	  if (lower === undefined) {
	    return 0;
	  }
	  upper = (upper === undefined) ? lower : upper;

	  range = utils.parseNumberArray(utils.flatten(range));
	  probability = utils.parseNumberArray(utils.flatten(probability));
	  lower = utils.parseNumber(lower);
	  upper = utils.parseNumber(upper);
	  if (utils.anyIsError(range, probability, lower, upper)) {
	    return error.value;
	  }

	  if (lower === upper) {
	    return (range.indexOf(lower) >= 0) ? probability[range.indexOf(lower)] : 0;
	  }

	  var sorted = range.sort(function(a, b) {
	    return a - b;
	  });
	  var n = sorted.length;
	  var result = 0;
	  for (var i = 0; i < n; i++) {
	    if (sorted[i] >= lower && sorted[i] <= upper) {
	      result += probability[range.indexOf(sorted[i])];
	    }
	  }
	  return result;
	};

	exports.QUARTILE = {};

	exports.QUARTILE.EXC = function(range, quart) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  quart = utils.parseNumber(quart);
	  if (utils.anyIsError(range, quart)) {
	    return error.value;
	  }
	  switch (quart) {
	    case 1:
	      return exports.PERCENTILE.EXC(range, 0.25);
	    case 2:
	      return exports.PERCENTILE.EXC(range, 0.5);
	    case 3:
	      return exports.PERCENTILE.EXC(range, 0.75);
	    default:
	      return error.num;
	  }
	};

	exports.QUARTILE.INC = function(range, quart) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  quart = utils.parseNumber(quart);
	  if (utils.anyIsError(range, quart)) {
	    return error.value;
	  }
	  switch (quart) {
	    case 1:
	      return exports.PERCENTILE.INC(range, 0.25);
	    case 2:
	      return exports.PERCENTILE.INC(range, 0.5);
	    case 3:
	      return exports.PERCENTILE.INC(range, 0.75);
	    default:
	      return error.num;
	  }
	};

	exports.RANK = {};

	exports.RANK.AVG = function(number, range, order) {
	  number = utils.parseNumber(number);
	  range = utils.parseNumberArray(utils.flatten(range));
	  if (utils.anyIsError(number, range)) {
	    return error.value;
	  }
	  range = utils.flatten(range);
	  order = order || false;
	  var sort = (order) ? function(a, b) {
	    return a - b;
	  } : function(a, b) {
	    return b - a;
	  };
	  range = range.sort(sort);

	  var length = range.length;
	  var count = 0;
	  for (var i = 0; i < length; i++) {
	    if (range[i] === number) {
	      count++;
	    }
	  }

	  return (count > 1) ? (2 * range.indexOf(number) + count + 1) / 2 : range.indexOf(number) + 1;
	};

	exports.RANK.EQ = function(number, range, order) {
	  number = utils.parseNumber(number);
	  range = utils.parseNumberArray(utils.flatten(range));
	  if (utils.anyIsError(number, range)) {
	    return error.value;
	  }
	  order = order || false;
	  var sort = (order) ? function(a, b) {
	    return a - b;
	  } : function(a, b) {
	    return b - a;
	  };
	  range = range.sort(sort);
	  return range.indexOf(number) + 1;
	};

	exports.ROW = function(matrix, index) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  if (index < 0) {
	    return error.num;
	  }

	  if (!(matrix instanceof Array) || (typeof index !== 'number')) {
	    return error.value;
	  }

	  if (matrix.length === 0) {
	    return undefined;
	  }

	  return jStat.row(matrix, index);
	};

	exports.ROWS = function(matrix) {
	  if (arguments.length !== 1) {
	    return error.na;
	  }

	  if (!(matrix instanceof Array)) {
	    return error.value;
	  }

	  if (matrix.length === 0) {
	    return 0;
	  }

	  return jStat.rows(matrix);
	};

	exports.RSQ = function(data_x, data_y) { // no need to flatten here, PEARSON will take care of that
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  if (utils.anyIsError(data_x, data_y)) {
	    return error.value;
	  }
	  return Math.pow(exports.PEARSON(data_x, data_y), 2);
	};

	exports.SKEW = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var mean = jStat.mean(range);
	  var n = range.length;
	  var sigma = 0;
	  for (var i = 0; i < n; i++) {
	    sigma += Math.pow(range[i] - mean, 3);
	  }
	  return n * sigma / ((n - 1) * (n - 2) * Math.pow(jStat.stdev(range, true), 3));
	};

	exports.SKEW.P = function() {
	  var range = utils.parseNumberArray(utils.flatten(arguments));
	  if (range instanceof Error) {
	    return range;
	  }
	  var mean = jStat.mean(range);
	  var n = range.length;
	  var m2 = 0;
	  var m3 = 0;
	  for (var i = 0; i < n; i++) {
	    m3 += Math.pow(range[i] - mean, 3);
	    m2 += Math.pow(range[i] - mean, 2);
	  }
	  m3 = m3 / n;
	  m2 = m2 / n;
	  return m3 / Math.pow(m2, 3 / 2);
	};

	exports.SLOPE = function(data_y, data_x) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(data_y, data_x)) {
	    return error.value;
	  }
	  var xmean = jStat.mean(data_x);
	  var ymean = jStat.mean(data_y);
	  var n = data_x.length;
	  var num = 0;
	  var den = 0;
	  for (var i = 0; i < n; i++) {
	    num += (data_x[i] - xmean) * (data_y[i] - ymean);
	    den += Math.pow(data_x[i] - xmean, 2);
	  }
	  return num / den;
	};

	exports.SMALL = function(range, k) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  k = utils.parseNumber(k);
	  if (utils.anyIsError(range, k)) {
	    return range;
	  }
	  return range.sort(function(a, b) {
	    return a - b;
	  })[k - 1];
	};

	exports.STANDARDIZE = function(x, mean, sd) {
	  x = utils.parseNumber(x);
	  mean = utils.parseNumber(mean);
	  sd = utils.parseNumber(sd);
	  if (utils.anyIsError(x, mean, sd)) {
	    return error.value;
	  }
	  return (x - mean) / sd;
	};

	exports.STDEV = {};

	exports.STDEV.P = function() {
	  var v = exports.VAR.P.apply(this, arguments);
	  return Math.sqrt(v);
	};

	exports.STDEV.S = function() {
	  var v = exports.VAR.S.apply(this, arguments);
	  return Math.sqrt(v);
	};

	exports.STDEVA = function() {
	  var v = exports.VARA.apply(this, arguments);
	  return Math.sqrt(v);
	};

	exports.STDEVPA = function() {
	  var v = exports.VARPA.apply(this, arguments);
	  return Math.sqrt(v);
	};


	exports.STEYX = function(data_y, data_x) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  if (utils.anyIsError(data_y, data_x)) {
	    return error.value;
	  }
	  var xmean = jStat.mean(data_x);
	  var ymean = jStat.mean(data_y);
	  var n = data_x.length;
	  var lft = 0;
	  var num = 0;
	  var den = 0;
	  for (var i = 0; i < n; i++) {
	    lft += Math.pow(data_y[i] - ymean, 2);
	    num += (data_x[i] - xmean) * (data_y[i] - ymean);
	    den += Math.pow(data_x[i] - xmean, 2);
	  }
	  return Math.sqrt((lft - num * num / den) / (n - 2));
	};

	exports.TRANSPOSE = function(matrix) {
	  if (!matrix) {
	    return error.na;
	  }
	  return jStat.transpose(matrix);
	};

	exports.T = text.T;

	exports.T.DIST = function(x, df, cumulative) {
	  x = utils.parseNumber(x);
	  df = utils.parseNumber(df);
	  if (utils.anyIsError(x, df)) {
	    return error.value;
	  }
	  return (cumulative) ? jStat.studentt.cdf(x, df) : jStat.studentt.pdf(x, df);
	};

	exports.T.DIST['2T'] = function(x, df) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  if (x < 0 || df < 1) {
	    return error.num;
	  }

	  if ((typeof x !== 'number') || (typeof df !== 'number')) {
	    return error.value;
	  }

	  return (1 - jStat.studentt.cdf(x , df)) * 2;
	};

	exports.T.DIST.RT = function(x, df) {
	  if (arguments.length !== 2) {
	    return error.na;
	  }

	  if (x < 0 || df < 1) {
	    return error.num;
	  }

	  if ((typeof x !== 'number') || (typeof df !== 'number')) {
	    return error.value;
	  }

	  return 1 - jStat.studentt.cdf(x , df);
	};

	exports.T.INV = function(probability, df) {
	  probability = utils.parseNumber(probability);
	  df = utils.parseNumber(df);
	  if (utils.anyIsError(probability, df)) {
	    return error.value;
	  }
	  return jStat.studentt.inv(probability, df);
	};

	exports.T.INV['2T'] = function(probability, df) {
	  probability = utils.parseNumber(probability);
	  df = utils.parseNumber(df);
	  if (probability <= 0 || probability > 1 || df < 1) {
	    return error.num;
	  }
	  if (utils.anyIsError(probability, df)) {
	    return error.value;
	  }
	  return Math.abs(jStat.studentt.inv(probability/2, df));
	};

	// The algorithm can be found here:
	// http://www.chem.uoa.gr/applets/AppletTtest/Appl_Ttest2.html
	exports.T.TEST = function(data_x, data_y) {
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  if (utils.anyIsError(data_x, data_y)) {
	    return error.value;
	  }

	  var mean_x = jStat.mean(data_x);
	  var mean_y = jStat.mean(data_y);
	  var s_x = 0;
	  var s_y = 0;
	  var i;

	  for (i = 0; i < data_x.length; i++) {
	    s_x += Math.pow(data_x[i] - mean_x, 2);
	  }
	  for (i = 0; i < data_y.length; i++) {
	    s_y += Math.pow(data_y[i] - mean_y, 2);
	  }

	  s_x = s_x / (data_x.length-1);
	  s_y = s_y / (data_y.length-1);

	  var t = Math.abs(mean_x - mean_y) / Math.sqrt(s_x/data_x.length + s_y/data_y.length);

	  return exports.T.DIST['2T'](t, data_x.length+data_y.length-2);
	};

	exports.TREND = function(data_y, data_x, new_data_x) {
	  data_y = utils.parseNumberArray(utils.flatten(data_y));
	  data_x = utils.parseNumberArray(utils.flatten(data_x));
	  new_data_x = utils.parseNumberArray(utils.flatten(new_data_x));
	  if (utils.anyIsError(data_y, data_x, new_data_x)) {
	    return error.value;
	  }
	  var linest = exports.LINEST(data_y, data_x);
	  var m = linest[0];
	  var b = linest[1];
	  var result = [];

	  new_data_x.forEach(function(x) {
	    result.push(m * x + b);
	  });

	  return result;
	};

	exports.TRIMMEAN = function(range, percent) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  percent = utils.parseNumber(percent);
	  if (utils.anyIsError(range, percent)) {
	    return error.value;
	  }
	  var trim = mathTrig.FLOOR(range.length * percent, 2) / 2;
	  return jStat.mean(utils.initial(utils.rest(range.sort(function(a, b) {
	    return a - b;
	  }), trim), trim));
	};

	exports.VAR = {};

	exports.VAR.P = function() {
	  var range = utils.numbers(utils.flatten(arguments));
	  var n = range.length;
	  var sigma = 0;
	  var mean = exports.AVERAGE(range);
	  for (var i = 0; i < n; i++) {
	    sigma += Math.pow(range[i] - mean, 2);
	  }
	  return sigma / n;
	};

	exports.VAR.S = function() {
	  var range = utils.numbers(utils.flatten(arguments));
	  var n = range.length;
	  var sigma = 0;
	  var mean = exports.AVERAGE(range);
	  for (var i = 0; i < n; i++) {
	    sigma += Math.pow(range[i] - mean, 2);
	  }
	  return sigma / (n - 1);
	};

	exports.VARA = function() {
	  var range = utils.flatten(arguments);
	  var n = range.length;
	  var sigma = 0;
	  var count = 0;
	  var mean = exports.AVERAGEA(range);
	  for (var i = 0; i < n; i++) {
	    var el = range[i];
	    if (typeof el === 'number') {
	      sigma += Math.pow(el - mean, 2);
	    } else if (el === true) {
	      sigma += Math.pow(1 - mean, 2);
	    } else {
	      sigma += Math.pow(0 - mean, 2);
	    }

	    if (el !== null) {
	      count++;
	    }
	  }
	  return sigma / (count - 1);
	};

	exports.VARPA = function() {
	  var range = utils.flatten(arguments);
	  var n = range.length;
	  var sigma = 0;
	  var count = 0;
	  var mean = exports.AVERAGEA(range);
	  for (var i = 0; i < n; i++) {
	    var el = range[i];
	    if (typeof el === 'number') {
	      sigma += Math.pow(el - mean, 2);
	    } else if (el === true) {
	      sigma += Math.pow(1 - mean, 2);
	    } else {
	      sigma += Math.pow(0 - mean, 2);
	    }

	    if (el !== null) {
	      count++;
	    }
	  }
	  return sigma / count;
	};

	exports.WEIBULL = {};

	exports.WEIBULL.DIST = function(x, alpha, beta, cumulative) {
	  x = utils.parseNumber(x);
	  alpha = utils.parseNumber(alpha);
	  beta = utils.parseNumber(beta);
	  if (utils.anyIsError(x, alpha, beta)) {
	    return error.value;
	  }
	  return (cumulative) ? 1 - Math.exp(-Math.pow(x / beta, alpha)) : Math.pow(x, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha)) * alpha / Math.pow(beta, alpha);
	};

	exports.Z = {};

	exports.Z.TEST = function(range, x, sd) {
	  range = utils.parseNumberArray(utils.flatten(range));
	  x = utils.parseNumber(x);
	  if (utils.anyIsError(range, x)) {
	    return error.value;
	  }

	  sd = sd || exports.STDEV.S(range);
	  var n = range.length;
	  return 1 - exports.NORM.S.DIST((exports.AVERAGE(range) - x) / (sd / Math.sqrt(n)), true);
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(4);
	var error = __webpack_require__(5);
	var numeral = __webpack_require__(8);

	//TODO
	exports.ASC = function() {
	 throw new Error('ASC is not implemented');
	};

	//TODO
	exports.BAHTTEXT = function() {
	 throw new Error('BAHTTEXT is not implemented');
	};

	exports.CHAR = function(number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return String.fromCharCode(number);
	};

	exports.CLEAN = function(text) {
	  text = text || '';
	  var re = /[\0-\x1F]/g;
	  return text.replace(re, "");
	};

	exports.CODE = function(text) {
	  text = text || '';
	  return text.charCodeAt(0);
	};

	exports.CONCATENATE = function() {
	  var args = utils.flatten(arguments);

	  var trueFound = 0;
	  while ((trueFound = args.indexOf(true)) > -1) {
	    args[trueFound] = 'TRUE';
	  }

	  var falseFound = 0;
	  while ((falseFound = args.indexOf(false)) > -1) {
	    args[falseFound] = 'FALSE';
	  }

	  return args.join('');
	};

	//TODO
	exports.DBCS = function() {
	 throw new Error('DBCS is not implemented');
	};

	exports.DOLLAR = function(number, decimals) {
	  decimals = (decimals === undefined) ? 2 : decimals;

	  number = utils.parseNumber(number);
	  decimals = utils.parseNumber(decimals);
	  if (utils.anyIsError(number, decimals)) {
	    return error.value;
	  }
	  var format = '';
	  if (decimals <= 0) {
	    number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
	    format = '($0,0)';
	  } else if (decimals > 0) {
	    format = '($0,0.' + new Array(decimals + 1).join('0') + ')';
	  }
	  return numeral(number).format(format);
	};

	exports.EXACT = function(text1, text2) {
	  return text1 === text2;
	};

	exports.FIND = function(find_text, within_text, position) {
	  position = (position === undefined) ? 0 : position;
	  return within_text ? within_text.indexOf(find_text, position - 1) + 1 : null;
	};

	exports.FIXED = function(number, decimals, no_commas) {
	  decimals = (decimals === undefined) ? 2 : decimals;
	  no_commas = (no_commas === undefined) ? false : no_commas;

	  number = utils.parseNumber(number);
	  decimals = utils.parseNumber(decimals);
	  if (utils.anyIsError(number, decimals)) {
	    return error.value;
	  }

	  var format = no_commas ? '0' : '0,0';
	  if (decimals <= 0) {
	    number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
	  } else if (decimals > 0) {
	    format += '.' + new Array(decimals + 1).join('0');
	  }
	  return numeral(number).format(format);
	};

	exports.HTML2TEXT = function (value) {
	  var result = '';

	  if (value) {
	    if (value instanceof Array) {
	      value.forEach(function (line) {
	        if (result !== '') {
	          result += '\n';
	        }
	        result += (line.replace(/<(?:.|\n)*?>/gm, ''));
	      });
	    } else {
	      result = value.replace(/<(?:.|\n)*?>/gm, '');
	    }
	  }

	  return result;
	};

	exports.LEFT = function(text, number) {
	  number = (number === undefined) ? 1 : number;
	  number = utils.parseNumber(number);
	  if (number instanceof Error || typeof text !== 'string') {
	    return error.value;
	  }
	  return text ? text.substring(0, number) : null;
	};

	exports.LEN = function(text) {
	  if (arguments.length === 0) {
	    return error.error;
	  }

	  if (typeof text === 'string') {
	    return text ? text.length : 0;
	  }

	  if (text.length) {
	    return text.length;
	  }

	  return error.value;
	};

	exports.LOWER = function(text) {
	  if (typeof text !== 'string') {
	    return error.value;
	  }
	  return text ? text.toLowerCase() : text;
	};

	exports.MID = function(text, start, number) {
	  start = utils.parseNumber(start);
	  number = utils.parseNumber(number);
	  if (utils.anyIsError(start, number) || typeof text !== 'string') {
	    return number;
	  }

	  var begin = start - 1;
	  var end = begin + number;

	  return text.substring(begin, end);
	};

	// TODO
	exports.NUMBERVALUE = function (text, decimal_separator, group_separator)  {
	  decimal_separator = (typeof decimal_separator === 'undefined') ? '.' : decimal_separator;
	  group_separator = (typeof group_separator === 'undefined') ? ',' : group_separator;
	  return Number(text.replace(decimal_separator, '.').replace(group_separator, ''));
	};

	// TODO
	exports.PRONETIC = function() {
	 throw new Error('PRONETIC is not implemented');
	};

	exports.PROPER = function(text) {
	  if (text === undefined || text.length === 0) {
	    return error.value;
	  }
	  if (text === true) {
	    text = 'TRUE';
	  }
	  if (text === false) {
	    text = 'FALSE';
	  }
	  if (isNaN(text) && typeof text === 'number') {
	    return error.value;
	  }
	  if (typeof text === 'number') {
	    text = '' + text;
	  }

	  return text.replace(/\w\S*/g, function(txt) {
	    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	  });
	};

	exports.REGEXEXTRACT = function (text, regular_expression) {
	  var match = text.match(new RegExp(regular_expression));
	  return match ? (match[match.length > 1 ? match.length - 1 : 0]) : null;
	};

	exports.REGEXMATCH = function (text, regular_expression, full) {
	  var match = text.match(new RegExp(regular_expression));
	  return full ? match : !!match;
	};

	exports.REGEXREPLACE = function (text, regular_expression, replacement) {
	  return text.replace(new RegExp(regular_expression), replacement);
	};

	exports.REPLACE = function(text, position, length, new_text) {
	  position = utils.parseNumber(position);
	  length = utils.parseNumber(length);
	  if (utils.anyIsError(position, length) ||
	    typeof text !== 'string' ||
	    typeof new_text !== 'string') {
	    return error.value;
	  }
	  return text.substr(0, position - 1) + new_text + text.substr(position - 1 + length);
	};

	exports.REPT = function(text, number) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return new Array(number + 1).join(text);
	};

	exports.RIGHT = function(text, number) {
	  number = (number === undefined) ? 1 : number;
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }
	  return text ? text.substring(text.length - number) : null;
	};

	exports.SEARCH = function(find_text, within_text, position) {
	  var foundAt;
	  if (typeof find_text !== 'string' || typeof within_text !== 'string') {
	    return error.value;
	  }
	  position = (position === undefined) ? 0 : position;
	  foundAt = within_text.toLowerCase().indexOf(find_text.toLowerCase(), position - 1)+1;
	  return (foundAt === 0)?error.value:foundAt;
	};

	exports.SPLIT = function (text, separator) {
	  return text.split(separator);
	};

	exports.SUBSTITUTE = function(text, old_text, new_text, occurrence) {
	  if (!text || !old_text || !new_text) {
	    return text;
	  } else if (occurrence === undefined) {
	    return text.replace(new RegExp(old_text, 'g'), new_text);
	  } else {
	    var index = 0;
	    var i = 0;
	    while (text.indexOf(old_text, index) > 0) {
	      index = text.indexOf(old_text, index + 1);
	      i++;
	      if (i === occurrence) {
	        return text.substring(0, index) + new_text + text.substring(index + old_text.length);
	      }
	    }
	  }
	};

	exports.T = function(value) {
	  return (typeof value === "string") ? value : '';
	};

	// TODO incomplete implementation
	exports.TEXT = function(value, format) {
	  value = utils.parseNumber(value);
	  if (utils.anyIsError(value)) {
	    return error.na;
	  }

	  return numeral(value).format(format);
	};

	exports.TRIM = function(text) {
	  if (typeof text !== 'string') {
	    return error.value;
	  }
	  return text.replace(/ +/g, ' ').trim();
	};

	exports.UNICHAR = this.CHAR;

	exports.UNICODE = this.CODE;

	exports.UPPER = function(text) {
	  if (typeof text !== 'string') {
	    return error.value;
	  }
	  return text.toUpperCase();
	};

	exports.VALUE = function(text) {
	  if (typeof text !== 'string') {
	    return error.value;
	  }
	  return numeral().unformat(text);
	};


/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var utils   = __webpack_require__(4);
	var numeral = __webpack_require__(8);

	exports.UNIQUE = function () {
	  var result = [];
	  for (var i = 0; i < arguments.length; ++i) {
	    var hasElement = false;
	    var element    = arguments[i];

	    // Check if we've already seen this element.
	    for (var j = 0; j < result.length; ++j) {
	      hasElement = result[j] === element;
	      if (hasElement) { break; }
	    }

	    // If we did not find it, add it to the result.
	    if (!hasElement) {
	      result.push(element);
	    }
	  }
	  return result;
	};

	exports.FLATTEN = utils.flatten;

	exports.ARGS2ARRAY = function () {
	  return Array.prototype.slice.call(arguments, 0);
	};

	exports.REFERENCE = function (context, reference) {
	  try {
	    var path = reference.split('.');
	    var result = context;
	    for (var i = 0; i < path.length; ++i) {
	      var step = path[i];
	      if (step[step.length - 1] === ']') {
	        var opening = step.indexOf('[');
	        var index = step.substring(opening + 1, step.length - 1);
	        result = result[step.substring(0, opening)][index];
	      } else {
	        result = result[step];
	      }
	    }
	    return result;
	  } catch (error) {}
	};

	exports.JOIN = function (array, separator) {
	  return array.join(separator);
	};

	exports.NUMBERS = function () {
	  var possibleNumbers = utils.flatten(arguments);
	  return possibleNumbers.filter(function (el) {
	    return typeof el === 'number';
	  });
	};

	exports.NUMERAL = function (number, format) {
	  return numeral(number).format(format);
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);

	// TODO
	exports.CELL = function() {
	 throw new Error('CELL is not implemented');
	};

	exports.ERROR = {};
	exports.ERROR.TYPE = function(error_val) {
	  switch (error_val) {
	    case error.nil: return 1;
	    case error.div0: return 2;
	    case error.value: return 3;
	    case error.ref: return 4;
	    case error.name: return 5;
	    case error.num: return 6;
	    case error.na: return 7;
	    case error.data: return 8;
	  }
	  return error.na;
	};

	// TODO
	exports.INFO = function() {
	 throw new Error('INFO is not implemented');
	};

	exports.ISBLANK = function(value) {
	  return value === null;
	};

	exports.ISBINARY = function (number) {
	  return (/^[01]{1,10}$/).test(number);
	};

	exports.ISERR = function(value) {
	  return ([error.value, error.ref, error.div0, error.num, error.name, error.nil]).indexOf(value) >= 0 ||
	    (typeof value === 'number' && (isNaN(value) || !isFinite(value)));
	};

	exports.ISERROR = function(value) {
	  return exports.ISERR(value) || value === error.na;
	};

	exports.ISEVEN = function(number) {
	  return (Math.floor(Math.abs(number)) & 1) ? false : true;
	};

	// TODO
	exports.ISFORMULA = function() {
	  throw new Error('ISFORMULA is not implemented');
	};

	exports.ISLOGICAL = function(value) {
	  return value === true || value === false;
	};

	exports.ISNA = function(value) {
	  return value === error.na;
	};

	exports.ISNONTEXT = function(value) {
	  return typeof(value) !== 'string';
	};

	exports.ISNUMBER = function(value) {
	  return typeof(value) === 'number' && !isNaN(value) && isFinite(value);
	};

	exports.ISODD = function(number) {
	  return (Math.floor(Math.abs(number)) & 1) ? true : false;
	};

	// TODO
	exports.ISREF = function() {
	  throw new Error('ISREF is not implemented');
	};

	exports.ISTEXT = function(value) {
	  return typeof(value) === 'string';
	};

	exports.N = function(value) {
	  if (this.ISNUMBER(value)) {
	    return value;
	  }
	  if (value instanceof Date) {
	    return value.getTime();
	  }
	  if (value === true) {
	    return 1;
	  }
	  if (value === false) {
	    return 0;
	  }
	  if (this.ISERROR(value)) {
	    return value;
	  }
	  return 0;
	};

	exports.NA = function() {
	  return error.na;
	};


	// TODO
	exports.SHEET = function() {
	  throw new Error('SHEET is not implemented');
	};

	// TODO
	exports.SHEETS = function() {
	  throw new Error('SHEETS is not implemented');
	};

	exports.TYPE = function(value) {
	  if (this.ISNUMBER(value)) {
	    return 1;
	  }
	  if (this.ISTEXT(value)) {
	    return 2;
	  }
	  if (this.ISLOGICAL(value)) {
	    return 4;
	  }
	  if (this.ISERROR(value)) {
	    return 16;
	  }
	  if (Array.isArray(value)) {
	    return 64;
	  }
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);
	var jStat = __webpack_require__(9).jStat;
	var text = __webpack_require__(7);
	var utils = __webpack_require__(4);
	var bessel = __webpack_require__(13);

	function isValidBinaryNumber(number) {
	  return (/^[01]{1,10}$/).test(number);
	}

	exports.BESSELI = function(x, n) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(x, n)) {
	    return error.value;
	  }
	  return bessel.besseli(x, n);
	};

	exports.BESSELJ = function(x, n) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(x, n)) {
	    return error.value;
	  }
	  return bessel.besselj(x, n);
	};

	exports.BESSELK = function(x, n) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(x, n)) {
	    return error.value;
	  }
	  return bessel.besselk(x, n);
	};

	exports.BESSELY = function(x, n) {
	  x = utils.parseNumber(x);
	  n = utils.parseNumber(n);
	  if (utils.anyIsError(x, n)) {
	    return error.value;
	  }
	  return bessel.bessely(x, n);
	};

	exports.BIN2DEC = function(number) {
	  // Return error if number is not binary or contains more than 10 characters (10 digits)
	  if (!isValidBinaryNumber(number)) {
	    return error.num;
	  }

	  // Convert binary number to decimal
	  var result = parseInt(number, 2);

	  // Handle negative numbers
	  var stringified = number.toString();
	  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
	    return parseInt(stringified.substring(1), 2) - 512;
	  } else {
	    return result;
	  }
	};


	exports.BIN2HEX = function(number, places) {
	  // Return error if number is not binary or contains more than 10 characters (10 digits)
	  if (!isValidBinaryNumber(number)) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character hexadecimal number if number is negative
	  var stringified = number.toString();
	  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
	    return (1099511627264 + parseInt(stringified.substring(1), 2)).toString(16);
	  }

	  // Convert binary number to hexadecimal
	  var result = parseInt(number, 2).toString(16);

	  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
	  if (places === undefined) {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.BIN2OCT = function(number, places) {
	  // Return error if number is not binary or contains more than 10 characters (10 digits)
	  if (!isValidBinaryNumber(number)) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character octal number if number is negative
	  var stringified = number.toString();
	  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
	    return (1073741312 + parseInt(stringified.substring(1), 2)).toString(8);
	  }

	  // Convert binary number to octal
	  var result = parseInt(number, 2).toString(8);

	  // Return octal number using the minimum number of characters necessary if places is undefined
	  if (places === undefined) {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.BITAND = function(number1, number2) {
	  // Return error if either number is a non-numeric value
	  number1 = utils.parseNumber(number1);
	  number2 = utils.parseNumber(number2);
	  if (utils.anyIsError(number1, number2)) {
	    return error.value;
	  }

	  // Return error if either number is less than 0
	  if (number1 < 0 || number2 < 0) {
	    return error.num;
	  }

	  // Return error if either number is a non-integer
	  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
	    return error.num;
	  }

	  // Return error if either number is greater than (2^48)-1
	  if (number1 > 281474976710655 || number2 > 281474976710655) {
	    return error.num;
	  }

	  // Return bitwise AND of two numbers
	  return number1 & number2;
	};

	exports.BITLSHIFT = function(number, shift) {
	  number = utils.parseNumber(number);
	  shift = utils.parseNumber(shift);
	  if (utils.anyIsError(number, shift)) {
	    return error.value;
	  }

	  // Return error if number is less than 0
	  if (number < 0) {
	    return error.num;
	  }

	  // Return error if number is a non-integer
	  if (Math.floor(number) !== number) {
	    return error.num;
	  }

	  // Return error if number is greater than (2^48)-1
	  if (number > 281474976710655) {
	    return error.num;
	  }

	  // Return error if the absolute value of shift is greater than 53
	  if (Math.abs(shift) > 53) {
	    return error.num;
	  }

	  // Return number shifted by shift bits to the left or to the right if shift is negative
	  return (shift >= 0) ? number << shift : number >> -shift;
	};

	exports.BITOR = function(number1, number2) {
	  number1 = utils.parseNumber(number1);
	  number2 = utils.parseNumber(number2);
	  if (utils.anyIsError(number1, number2)) {
	    return error.value;
	  }

	  // Return error if either number is less than 0
	  if (number1 < 0 || number2 < 0) {
	    return error.num;
	  }

	  // Return error if either number is a non-integer
	  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
	    return error.num;
	  }

	  // Return error if either number is greater than (2^48)-1
	  if (number1 > 281474976710655 || number2 > 281474976710655) {
	    return error.num;
	  }

	  // Return bitwise OR of two numbers
	  return number1 | number2;
	};

	exports.BITRSHIFT = function(number, shift) {
	  number = utils.parseNumber(number);
	  shift = utils.parseNumber(shift);
	  if (utils.anyIsError(number, shift)) {
	    return error.value;
	  }

	  // Return error if number is less than 0
	  if (number < 0) {
	    return error.num;
	  }

	  // Return error if number is a non-integer
	  if (Math.floor(number) !== number) {
	    return error.num;
	  }

	  // Return error if number is greater than (2^48)-1
	  if (number > 281474976710655) {
	    return error.num;
	  }

	  // Return error if the absolute value of shift is greater than 53
	  if (Math.abs(shift) > 53) {
	    return error.num;
	  }

	  // Return number shifted by shift bits to the right or to the left if shift is negative
	  return (shift >= 0) ? number >> shift : number << -shift;
	};

	exports.BITXOR = function(number1, number2) {
	  number1 = utils.parseNumber(number1);
	  number2 = utils.parseNumber(number2);
	  if (utils.anyIsError(number1, number2)) {
	    return error.value;
	  }

	  // Return error if either number is less than 0
	  if (number1 < 0 || number2 < 0) {
	    return error.num;
	  }

	  // Return error if either number is a non-integer
	  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
	    return error.num;
	  }

	  // Return error if either number is greater than (2^48)-1
	  if (number1 > 281474976710655 || number2 > 281474976710655) {
	    return error.num;
	  }

	  // Return bitwise XOR of two numbers
	  return number1 ^ number2;
	};

	exports.COMPLEX = function(real, imaginary, suffix) {
	  real = utils.parseNumber(real);
	  imaginary = utils.parseNumber(imaginary);
	  if (utils.anyIsError(real, imaginary)) {
	    return real;
	  }

	  // Set suffix
	  suffix = (suffix === undefined) ? 'i' : suffix;

	  // Return error if suffix is neither "i" nor "j"
	  if (suffix !== 'i' && suffix !== 'j') {
	    return error.value;
	  }

	  // Return complex number
	  if (real === 0 && imaginary === 0) {
	    return 0;
	  } else if (real === 0) {
	    return (imaginary === 1) ? suffix : imaginary.toString() + suffix;
	  } else if (imaginary === 0) {
	    return real.toString();
	  } else {
	    var sign = (imaginary > 0) ? '+' : '';
	    return real.toString() + sign + ((imaginary === 1) ? suffix : imaginary.toString() + suffix);
	  }
	};

	exports.CONVERT = function(number, from_unit, to_unit) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }

	  // List of units supported by CONVERT and units defined by the International System of Units
	  // [Name, Symbol, Alternate symbols, Quantity, ISU, CONVERT, Conversion ratio]
	  var units = [
	    ["a.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
	    ["a.u. of charge", "e", null, "electric_charge", false, false, 1.60217653141414e-19],
	    ["a.u. of energy", "Eh", null, "energy", false, false, 4.35974417757576e-18],
	    ["a.u. of length", "a?", null, "length", false, false, 5.29177210818182e-11],
	    ["a.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
	    ["a.u. of time", "?/Eh", null, "time", false, false, 2.41888432650516e-17],
	    ["admiralty knot", "admkn", null, "speed", false, true, 0.514773333],
	    ["ampere", "A", null, "electric_current", true, false, 1],
	    ["ampere per meter", "A/m", null, "magnetic_field_intensity", true, false, 1],
	    ["ångström", "Å", ["ang"], "length", false, true, 1e-10],
	    ["are", "ar", null, "area", false, true, 100],
	    ["astronomical unit", "ua", null, "length", false, false, 1.49597870691667e-11],
	    ["bar", "bar", null, "pressure", false, false, 100000],
	    ["barn", "b", null, "area", false, false, 1e-28],
	    ["becquerel", "Bq", null, "radioactivity", true, false, 1],
	    ["bit", "bit", ["b"], "information", false, true, 1],
	    ["btu", "BTU", ["btu"], "energy", false, true, 1055.05585262],
	    ["byte", "byte", null, "information", false, true, 8],
	    ["candela", "cd", null, "luminous_intensity", true, false, 1],
	    ["candela per square metre", "cd/m?", null, "luminance", true, false, 1],
	    ["coulomb", "C", null, "electric_charge", true, false, 1],
	    ["cubic ångström", "ang3", ["ang^3"], "volume", false, true, 1e-30],
	    ["cubic foot", "ft3", ["ft^3"], "volume", false, true, 0.028316846592],
	    ["cubic inch", "in3", ["in^3"], "volume", false, true, 0.000016387064],
	    ["cubic light-year", "ly3", ["ly^3"], "volume", false, true, 8.46786664623715e-47],
	    ["cubic metre", "m?", null, "volume", true, true, 1],
	    ["cubic mile", "mi3", ["mi^3"], "volume", false, true, 4168181825.44058],
	    ["cubic nautical mile", "Nmi3", ["Nmi^3"], "volume", false, true, 6352182208],
	    ["cubic Pica", "Pica3", ["Picapt3", "Pica^3", "Picapt^3"], "volume", false, true, 7.58660370370369e-8],
	    ["cubic yard", "yd3", ["yd^3"], "volume", false, true, 0.764554857984],
	    ["cup", "cup", null, "volume", false, true, 0.0002365882365],
	    ["dalton", "Da", ["u"], "mass", false, false, 1.66053886282828e-27],
	    ["day", "d", ["day"], "time", false, true, 86400],
	    ["degree", "°", null, "angle", false, false, 0.0174532925199433],
	    ["degrees Rankine", "Rank", null, "temperature", false, true, 0.555555555555556],
	    ["dyne", "dyn", ["dy"], "force", false, true, 0.00001],
	    ["electronvolt", "eV", ["ev"], "energy", false, true, 1.60217656514141],
	    ["ell", "ell", null, "length", false, true, 1.143],
	    ["erg", "erg", ["e"], "energy", false, true, 1e-7],
	    ["farad", "F", null, "electric_capacitance", true, false, 1],
	    ["fluid ounce", "oz", null, "volume", false, true, 0.0000295735295625],
	    ["foot", "ft", null, "length", false, true, 0.3048],
	    ["foot-pound", "flb", null, "energy", false, true, 1.3558179483314],
	    ["gal", "Gal", null, "acceleration", false, false, 0.01],
	    ["gallon", "gal", null, "volume", false, true, 0.003785411784],
	    ["gauss", "G", ["ga"], "magnetic_flux_density", false, true, 1],
	    ["grain", "grain", null, "mass", false, true, 0.0000647989],
	    ["gram", "g", null, "mass", false, true, 0.001],
	    ["gray", "Gy", null, "absorbed_dose", true, false, 1],
	    ["gross registered ton", "GRT", ["regton"], "volume", false, true, 2.8316846592],
	    ["hectare", "ha", null, "area", false, true, 10000],
	    ["henry", "H", null, "inductance", true, false, 1],
	    ["hertz", "Hz", null, "frequency", true, false, 1],
	    ["horsepower", "HP", ["h"], "power", false, true, 745.69987158227],
	    ["horsepower-hour", "HPh", ["hh", "hph"], "energy", false, true, 2684519.538],
	    ["hour", "h", ["hr"], "time", false, true, 3600],
	    ["imperial gallon (U.K.)", "uk_gal", null, "volume", false, true, 0.00454609],
	    ["imperial hundredweight", "lcwt", ["uk_cwt", "hweight"], "mass", false, true, 50.802345],
	    ["imperial quart (U.K)", "uk_qt", null, "volume", false, true, 0.0011365225],
	    ["imperial ton", "brton", ["uk_ton", "LTON"], "mass", false, true, 1016.046909],
	    ["inch", "in", null, "length", false, true, 0.0254],
	    ["international acre", "uk_acre", null, "area", false, true, 4046.8564224],
	    ["IT calorie", "cal", null, "energy", false, true, 4.1868],
	    ["joule", "J", null, "energy", true, true, 1],
	    ["katal", "kat", null, "catalytic_activity", true, false, 1],
	    ["kelvin", "K", ["kel"], "temperature", true, true, 1],
	    ["kilogram", "kg", null, "mass", true, true, 1],
	    ["knot", "kn", null, "speed", false, true, 0.514444444444444],
	    ["light-year", "ly", null, "length", false, true, 9460730472580800],
	    ["litre", "L", ["l", "lt"], "volume", false, true, 0.001],
	    ["lumen", "lm", null, "luminous_flux", true, false, 1],
	    ["lux", "lx", null, "illuminance", true, false, 1],
	    ["maxwell", "Mx", null, "magnetic_flux", false, false, 1e-18],
	    ["measurement ton", "MTON", null, "volume", false, true, 1.13267386368],
	    ["meter per hour", "m/h", ["m/hr"], "speed", false, true, 0.00027777777777778],
	    ["meter per second", "m/s", ["m/sec"], "speed", true, true, 1],
	    ["meter per second squared", "m?s??", null, "acceleration", true, false, 1],
	    ["parsec", "pc", ["parsec"], "length", false, true, 30856775814671900],
	    ["meter squared per second", "m?/s", null, "kinematic_viscosity", true, false, 1],
	    ["metre", "m", null, "length", true, true, 1],
	    ["miles per hour", "mph", null, "speed", false, true, 0.44704],
	    ["millimetre of mercury", "mmHg", null, "pressure", false, false, 133.322],
	    ["minute", "?", null, "angle", false, false, 0.000290888208665722],
	    ["minute", "min", ["mn"], "time", false, true, 60],
	    ["modern teaspoon", "tspm", null, "volume", false, true, 0.000005],
	    ["mole", "mol", null, "amount_of_substance", true, false, 1],
	    ["morgen", "Morgen", null, "area", false, true, 2500],
	    ["n.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
	    ["n.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
	    ["n.u. of speed", "c?", null, "speed", false, false, 299792458],
	    ["n.u. of time", "?/(me?c??)", null, "time", false, false, 1.28808866778687e-21],
	    ["nautical mile", "M", ["Nmi"], "length", false, true, 1852],
	    ["newton", "N", null, "force", true, true, 1],
	    ["œrsted", "Oe ", null, "magnetic_field_intensity", false, false, 79.5774715459477],
	    ["ohm", "Ω", null, "electric_resistance", true, false, 1],
	    ["ounce mass", "ozm", null, "mass", false, true, 0.028349523125],
	    ["pascal", "Pa", null, "pressure", true, false, 1],
	    ["pascal second", "Pa?s", null, "dynamic_viscosity", true, false, 1],
	    ["pferdestärke", "PS", null, "power", false, true, 735.49875],
	    ["phot", "ph", null, "illuminance", false, false, 0.0001],
	    ["pica (1/6 inch)", "pica", null, "length", false, true, 0.00035277777777778],
	    ["pica (1/72 inch)", "Pica", ["Picapt"], "length", false, true, 0.00423333333333333],
	    ["poise", "P", null, "dynamic_viscosity", false, false, 0.1],
	    ["pond", "pond", null, "force", false, true, 0.00980665],
	    ["pound force", "lbf", null, "force", false, true, 4.4482216152605],
	    ["pound mass", "lbm", null, "mass", false, true, 0.45359237],
	    ["quart", "qt", null, "volume", false, true, 0.000946352946],
	    ["radian", "rad", null, "angle", true, false, 1],
	    ["second", "?", null, "angle", false, false, 0.00000484813681109536],
	    ["second", "s", ["sec"], "time", true, true, 1],
	    ["short hundredweight", "cwt", ["shweight"], "mass", false, true, 45.359237],
	    ["siemens", "S", null, "electrical_conductance", true, false, 1],
	    ["sievert", "Sv", null, "equivalent_dose", true, false, 1],
	    ["slug", "sg", null, "mass", false, true, 14.59390294],
	    ["square ångström", "ang2", ["ang^2"], "area", false, true, 1e-20],
	    ["square foot", "ft2", ["ft^2"], "area", false, true, 0.09290304],
	    ["square inch", "in2", ["in^2"], "area", false, true, 0.00064516],
	    ["square light-year", "ly2", ["ly^2"], "area", false, true, 8.95054210748189e+31],
	    ["square meter", "m?", null, "area", true, true, 1],
	    ["square mile", "mi2", ["mi^2"], "area", false, true, 2589988.110336],
	    ["square nautical mile", "Nmi2", ["Nmi^2"], "area", false, true, 3429904],
	    ["square Pica", "Pica2", ["Picapt2", "Pica^2", "Picapt^2"], "area", false, true, 0.00001792111111111],
	    ["square yard", "yd2", ["yd^2"], "area", false, true, 0.83612736],
	    ["statute mile", "mi", null, "length", false, true, 1609.344],
	    ["steradian", "sr", null, "solid_angle", true, false, 1],
	    ["stilb", "sb", null, "luminance", false, false, 0.0001],
	    ["stokes", "St", null, "kinematic_viscosity", false, false, 0.0001],
	    ["stone", "stone", null, "mass", false, true, 6.35029318],
	    ["tablespoon", "tbs", null, "volume", false, true, 0.0000147868],
	    ["teaspoon", "tsp", null, "volume", false, true, 0.00000492892],
	    ["tesla", "T", null, "magnetic_flux_density", true, true, 1],
	    ["thermodynamic calorie", "c", null, "energy", false, true, 4.184],
	    ["ton", "ton", null, "mass", false, true, 907.18474],
	    ["tonne", "t", null, "mass", false, false, 1000],
	    ["U.K. pint", "uk_pt", null, "volume", false, true, 0.00056826125],
	    ["U.S. bushel", "bushel", null, "volume", false, true, 0.03523907],
	    ["U.S. oil barrel", "barrel", null, "volume", false, true, 0.158987295],
	    ["U.S. pint", "pt", ["us_pt"], "volume", false, true, 0.000473176473],
	    ["U.S. survey mile", "survey_mi", null, "length", false, true, 1609.347219],
	    ["U.S. survey/statute acre", "us_acre", null, "area", false, true, 4046.87261],
	    ["volt", "V", null, "voltage", true, false, 1],
	    ["watt", "W", null, "power", true, true, 1],
	    ["watt-hour", "Wh", ["wh"], "energy", false, true, 3600],
	    ["weber", "Wb", null, "magnetic_flux", true, false, 1],
	    ["yard", "yd", null, "length", false, true, 0.9144],
	    ["year", "yr", null, "time", false, true, 31557600]
	  ];

	  // Binary prefixes
	  // [Name, Prefix power of 2 value, Previx value, Abbreviation, Derived from]
	  var binary_prefixes = {
	    Yi: ["yobi", 80, 1208925819614629174706176, "Yi", "yotta"],
	    Zi: ["zebi", 70, 1180591620717411303424, "Zi", "zetta"],
	    Ei: ["exbi", 60, 1152921504606846976, "Ei", "exa"],
	    Pi: ["pebi", 50, 1125899906842624, "Pi", "peta"],
	    Ti: ["tebi", 40, 1099511627776, "Ti", "tera"],
	    Gi: ["gibi", 30, 1073741824, "Gi", "giga"],
	    Mi: ["mebi", 20, 1048576, "Mi", "mega"],
	    ki: ["kibi", 10, 1024, "ki", "kilo"]
	  };

	  // Unit prefixes
	  // [Name, Multiplier, Abbreviation]
	  var unit_prefixes = {
	    Y: ["yotta", 1e+24, "Y"],
	    Z: ["zetta", 1e+21, "Z"],
	    E: ["exa", 1e+18, "E"],
	    P: ["peta", 1e+15, "P"],
	    T: ["tera", 1e+12, "T"],
	    G: ["giga", 1e+09, "G"],
	    M: ["mega", 1e+06, "M"],
	    k: ["kilo", 1e+03, "k"],
	    h: ["hecto", 1e+02, "h"],
	    e: ["dekao", 1e+01, "e"],
	    d: ["deci", 1e-01, "d"],
	    c: ["centi", 1e-02, "c"],
	    m: ["milli", 1e-03, "m"],
	    u: ["micro", 1e-06, "u"],
	    n: ["nano", 1e-09, "n"],
	    p: ["pico", 1e-12, "p"],
	    f: ["femto", 1e-15, "f"],
	    a: ["atto", 1e-18, "a"],
	    z: ["zepto", 1e-21, "z"],
	    y: ["yocto", 1e-24, "y"]
	  };

	  // Initialize units and multipliers
	  var from = null;
	  var to = null;
	  var base_from_unit = from_unit;
	  var base_to_unit = to_unit;
	  var from_multiplier = 1;
	  var to_multiplier = 1;
	  var alt;

	  // Lookup from and to units
	  for (var i = 0; i < units.length; i++) {
	    alt = (units[i][2] === null) ? [] : units[i][2];
	    if (units[i][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
	      from = units[i];
	    }
	    if (units[i][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
	      to = units[i];
	    }
	  }

	  // Lookup from prefix
	  if (from === null) {
	    var from_binary_prefix = binary_prefixes[from_unit.substring(0, 2)];
	    var from_unit_prefix = unit_prefixes[from_unit.substring(0, 1)];

	    // Handle dekao unit prefix (only unit prefix with two characters)
	    if (from_unit.substring(0, 2) === 'da') {
	      from_unit_prefix = ["dekao", 1e+01, "da"];
	    }

	    // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
	    if (from_binary_prefix) {
	      from_multiplier = from_binary_prefix[2];
	      base_from_unit = from_unit.substring(2);
	    } else if (from_unit_prefix) {
	      from_multiplier = from_unit_prefix[1];
	      base_from_unit = from_unit.substring(from_unit_prefix[2].length);
	    }

	    // Lookup from unit
	    for (var j = 0; j < units.length; j++) {
	      alt = (units[j][2] === null) ? [] : units[j][2];
	      if (units[j][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
	        from = units[j];
	      }
	    }
	  }

	  // Lookup to prefix
	  if (to === null) {
	    var to_binary_prefix = binary_prefixes[to_unit.substring(0, 2)];
	    var to_unit_prefix = unit_prefixes[to_unit.substring(0, 1)];

	    // Handle dekao unit prefix (only unit prefix with two characters)
	    if (to_unit.substring(0, 2) === 'da') {
	      to_unit_prefix = ["dekao", 1e+01, "da"];
	    }

	    // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
	    if (to_binary_prefix) {
	      to_multiplier = to_binary_prefix[2];
	      base_to_unit = to_unit.substring(2);
	    } else if (to_unit_prefix) {
	      to_multiplier = to_unit_prefix[1];
	      base_to_unit = to_unit.substring(to_unit_prefix[2].length);
	    }

	    // Lookup to unit
	    for (var k = 0; k < units.length; k++) {
	      alt = (units[k][2] === null) ? [] : units[k][2];
	      if (units[k][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
	        to = units[k];
	      }
	    }
	  }

	  // Return error if a unit does not exist
	  if (from === null || to === null) {
	    return error.na;
	  }

	  // Return error if units represent different quantities
	  if (from[3] !== to[3]) {
	    return error.na;
	  }

	  // Return converted number
	  return number * from[6] * from_multiplier / (to[6] * to_multiplier);
	};

	exports.DEC2BIN = function(number, places) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }

	  // Return error if number is not decimal, is lower than -512, or is greater than 511
	  if (!/^-?[0-9]{1,3}$/.test(number) || number < -512 || number > 511) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character binary number if number is negative
	  if (number < 0) {
	    return '1' + text.REPT('0', 9 - (512 + number).toString(2).length) + (512 + number).toString(2);
	  }

	  // Convert decimal number to binary
	  var result = parseInt(number, 10).toString(2);

	  // Return binary number using the minimum number of characters necessary if places is undefined
	  if (typeof places === 'undefined') {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.DEC2HEX = function(number, places) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }

	  // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
	  if (!/^-?[0-9]{1,12}$/.test(number) || number < -549755813888 || number > 549755813887) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character hexadecimal number if number is negative
	  if (number < 0) {
	    return (1099511627776 + number).toString(16);
	  }

	  // Convert decimal number to hexadecimal
	  var result = parseInt(number, 10).toString(16);

	  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
	  if (typeof places === 'undefined') {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.DEC2OCT = function(number, places) {
	  number = utils.parseNumber(number);
	  if (number instanceof Error) {
	    return number;
	  }

	  // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
	  if (!/^-?[0-9]{1,9}$/.test(number) || number < -536870912 || number > 536870911) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character octal number if number is negative
	  if (number < 0) {
	    return (1073741824 + number).toString(8);
	  }

	  // Convert decimal number to octal
	  var result = parseInt(number, 10).toString(8);

	  // Return octal number using the minimum number of characters necessary if places is undefined
	  if (typeof places === 'undefined') {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.DELTA = function(number1, number2) {
	  // Set number2 to zero if undefined
	  number2 = (number2 === undefined) ? 0 : number2;
	  number1 = utils.parseNumber(number1);
	  number2 = utils.parseNumber(number2);
	  if (utils.anyIsError(number1, number2)) {
	    return error.value;
	  }

	  // Return delta
	  return (number1 === number2) ? 1 : 0;
	};

	// TODO: why is upper_bound not used ? The excel documentation has no examples with upper_bound
	exports.ERF = function(lower_bound, upper_bound) {
	  // Set number2 to zero if undefined
	  upper_bound = (upper_bound === undefined) ? 0 : upper_bound;

	  lower_bound = utils.parseNumber(lower_bound);
	  upper_bound = utils.parseNumber(upper_bound);
	  if (utils.anyIsError(lower_bound, upper_bound)) {
	    return error.value;
	  }

	  return jStat.erf(lower_bound);
	};

	// TODO
	exports.ERF.PRECISE = function() {
	 throw new Error('ERF.PRECISE is not implemented');
	};

	exports.ERFC = function(x) {
	  // Return error if x is not a number
	  if (isNaN(x)) {
	    return error.value;
	  }

	  return jStat.erfc(x);
	};

	// TODO
	exports.ERFC.PRECISE = function() {
	 throw new Error('ERFC.PRECISE is not implemented');
	};

	exports.GESTEP = function(number, step) {
	  step = step || 0;
	  number = utils.parseNumber(number);
	  if (utils.anyIsError(step, number)) {
	    return number;
	  }

	  // Return delta
	  return (number >= step) ? 1 : 0;
	};

	exports.HEX2BIN = function(number, places) {
	  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
	  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Check if number is negative
	  var negative = (number.length === 10 && number.substring(0, 1).toLowerCase() === 'f') ? true : false;

	  // Convert hexadecimal number to decimal
	  var decimal = (negative) ? parseInt(number, 16) - 1099511627776 : parseInt(number, 16);

	  // Return error if number is lower than -512 or greater than 511
	  if (decimal < -512 || decimal > 511) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character binary number if number is negative
	  if (negative) {
	    return '1' + text.REPT('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
	  }

	  // Convert decimal number to binary
	  var result = decimal.toString(2);

	  // Return binary number using the minimum number of characters necessary if places is undefined
	  if (places === undefined) {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.HEX2DEC = function(number) {
	  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
	  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Convert hexadecimal number to decimal
	  var decimal = parseInt(number, 16);

	  // Return decimal number
	  return (decimal >= 549755813888) ? decimal - 1099511627776 : decimal;
	};

	exports.HEX2OCT = function(number, places) {
	  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
	  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Convert hexadecimal number to decimal
	  var decimal = parseInt(number, 16);

	  // Return error if number is positive and greater than 0x1fffffff (536870911)
	  if (decimal > 536870911 && decimal < 1098974756864) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character octal number if number is negative
	  if (decimal >= 1098974756864) {
	    return (decimal - 1098437885952).toString(8);
	  }

	  // Convert decimal number to octal
	  var result = decimal.toString(8);

	  // Return octal number using the minimum number of characters necessary if places is undefined
	  if (places === undefined) {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.IMABS = function(inumber) {
	  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  // Return error if either coefficient is not a number
	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return absolute value of complex number
	  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	};

	exports.IMAGINARY = function(inumber) {
	  if (inumber === undefined || inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Return 0 if inumber is equal to 0
	  if (inumber === 0 || inumber === '0') {
	    return 0;
	  }

	  // Handle special cases
	  if (['i', 'j'].indexOf(inumber) >= 0) {
	    return 1;
	  }

	  // Normalize imaginary coefficient
	  inumber = inumber.replace('+i', '+1i').replace('-i', '-1i').replace('+j', '+1j').replace('-j', '-1j');

	  // Lookup sign
	  var plus = inumber.indexOf('+');
	  var minus = inumber.indexOf('-');
	  if (plus === 0) {
	    plus = inumber.indexOf('+', 1);
	  }

	  if (minus === 0) {
	    minus = inumber.indexOf('-', 1);
	  }

	  // Lookup imaginary unit
	  var last = inumber.substring(inumber.length - 1, inumber.length);
	  var unit = (last === 'i' || last === 'j');

	  if (plus >= 0 || minus >= 0) {
	    // Return error if imaginary unit is neither i nor j
	    if (!unit) {
	      return error.num;
	    }

	    // Return imaginary coefficient of complex number
	    if (plus >= 0) {
	      return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
	        error.num :
	        Number(inumber.substring(plus + 1, inumber.length - 1));
	    } else {
	      return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
	        error.num :
	        -Number(inumber.substring(minus + 1, inumber.length - 1));
	    }
	  } else {
	    if (unit) {
	      return (isNaN(inumber.substring(0, inumber.length - 1))) ? error.num : inumber.substring(0, inumber.length - 1);
	    } else {
	      return (isNaN(inumber)) ? error.num : 0;
	    }
	  }
	};

	exports.IMARGUMENT = function(inumber) {
	  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  // Return error if either coefficient is not a number
	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return error if inumber is equal to zero
	  if (x === 0 && y === 0) {
	    return error.div0;
	  }

	  // Return PI/2 if x is equal to zero and y is positive
	  if (x === 0 && y > 0) {
	    return Math.PI / 2;
	  }

	  // Return -PI/2 if x is equal to zero and y is negative
	  if (x === 0 && y < 0) {
	    return -Math.PI / 2;
	  }

	  // Return zero if x is negative and y is equal to zero
	  if (y === 0 && x > 0) {
	    return 0;
	  }

	  // Return zero if x is negative and y is equal to zero
	  if (y === 0 && x < 0) {
	    return -Math.PI;
	  }

	  // Return argument of complex number
	  if (x > 0) {
	    return Math.atan(y / x);
	  } else if (x < 0 && y >= 0) {
	    return Math.atan(y / x) + Math.PI;
	  } else {
	    return Math.atan(y / x) - Math.PI;
	  }
	};

	exports.IMCONJUGATE = function(inumber) {
	  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return conjugate of complex number
	  return (y !== 0) ? exports.COMPLEX(x, -y, unit) : inumber;
	};

	exports.IMCOS = function(inumber) {
	  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return cosine of complex number
	  return exports.COMPLEX(Math.cos(x) * (Math.exp(y) + Math.exp(-y)) / 2, -Math.sin(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
	};

	exports.IMCOSH = function(inumber) {
	  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return hyperbolic cosine of complex number
	  return exports.COMPLEX(Math.cos(y) * (Math.exp(x) + Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) - Math.exp(-x)) / 2, unit);
	};

	exports.IMCOT = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return cotangent of complex number
	  return exports.IMDIV(exports.IMCOS(inumber), exports.IMSIN(inumber));
	};

	exports.IMDIV = function(inumber1, inumber2) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var a = exports.IMREAL(inumber1);
	  var b = exports.IMAGINARY(inumber1);
	  var c = exports.IMREAL(inumber2);
	  var d = exports.IMAGINARY(inumber2);

	  if (utils.anyIsError(a, b, c, d)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit1 = inumber1.substring(inumber1.length - 1);
	  var unit2 = inumber2.substring(inumber2.length - 1);
	  var unit = 'i';
	  if (unit1 === 'j') {
	    unit = 'j';
	  } else if (unit2 === 'j') {
	    unit = 'j';
	  }

	  // Return error if inumber2 is null
	  if (c === 0 && d === 0) {
	    return error.num;
	  }

	  // Return exponential of complex number
	  var den = c * c + d * d;
	  return exports.COMPLEX((a * c + b * d) / den, (b * c - a * d) / den, unit);
	};

	exports.IMEXP = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return exponential of complex number
	  var e = Math.exp(x);
	  return exports.COMPLEX(e * Math.cos(y), e * Math.sin(y), unit);
	};

	exports.IMLN = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return exponential of complex number
	  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)), Math.atan(y / x), unit);
	};

	exports.IMLOG10 = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return exponential of complex number
	  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(10), Math.atan(y / x) / Math.log(10), unit);
	};

	exports.IMLOG2 = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return exponential of complex number
	  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(2), Math.atan(y / x) / Math.log(2), unit);
	};

	exports.IMPOWER = function(inumber, number) {
	  number = utils.parseNumber(number);
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);
	  if (utils.anyIsError(number, x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Calculate power of modulus
	  var p = Math.pow(exports.IMABS(inumber), number);

	  // Calculate argument
	  var t = exports.IMARGUMENT(inumber);

	  // Return exponential of complex number
	  return exports.COMPLEX(p * Math.cos(number * t), p * Math.sin(number * t), unit);
	};

	exports.IMPRODUCT = function() {
	  // Initialize result
	  var result = arguments[0];

	  // Loop on all numbers
	  for (var i = 1; i < arguments.length; i++) {
	    // Lookup coefficients of two complex numbers
	    var a = exports.IMREAL(result);
	    var b = exports.IMAGINARY(result);
	    var c = exports.IMREAL(arguments[i]);
	    var d = exports.IMAGINARY(arguments[i]);

	    if (utils.anyIsError(a, b, c, d)) {
	      return error.value;
	    }

	    // Complute product of two complex numbers
	    result = exports.COMPLEX(a * c - b * d, a * d + b * c);
	  }

	  // Return product of complex numbers
	  return result;
	};

	exports.IMREAL = function(inumber) {
	  if (inumber === undefined || inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Return 0 if inumber is equal to 0
	  if (inumber === 0 || inumber === '0') {
	    return 0;
	  }

	  // Handle special cases
	  if (['i', '+i', '1i', '+1i', '-i', '-1i', 'j', '+j', '1j', '+1j', '-j', '-1j'].indexOf(inumber) >= 0) {
	    return 0;
	  }

	  // Lookup sign
	  var plus = inumber.indexOf('+');
	  var minus = inumber.indexOf('-');
	  if (plus === 0) {
	    plus = inumber.indexOf('+', 1);
	  }
	  if (minus === 0) {
	    minus = inumber.indexOf('-', 1);
	  }

	  // Lookup imaginary unit
	  var last = inumber.substring(inumber.length - 1, inumber.length);
	  var unit = (last === 'i' || last === 'j');

	  if (plus >= 0 || minus >= 0) {
	    // Return error if imaginary unit is neither i nor j
	    if (!unit) {
	      return error.num;
	    }

	    // Return real coefficient of complex number
	    if (plus >= 0) {
	      return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
	        error.num :
	        Number(inumber.substring(0, plus));
	    } else {
	      return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
	        error.num :
	        Number(inumber.substring(0, minus));
	    }
	  } else {
	    if (unit) {
	      return (isNaN(inumber.substring(0, inumber.length - 1))) ? error.num : 0;
	    } else {
	      return (isNaN(inumber)) ? error.num : inumber;
	    }
	  }
	};

	exports.IMSEC = function(inumber) {
	  // Return error if inumber is a logical value
	  if (inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return secant of complex number
	  return exports.IMDIV('1', exports.IMCOS(inumber));
	};

	exports.IMSECH = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return hyperbolic secant of complex number
	  return exports.IMDIV('1', exports.IMCOSH(inumber));
	};

	exports.IMSIN = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return sine of complex number
	  return exports.COMPLEX(Math.sin(x) * (Math.exp(y) + Math.exp(-y)) / 2, Math.cos(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
	};

	exports.IMSINH = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Return hyperbolic sine of complex number
	  return exports.COMPLEX(Math.cos(y) * (Math.exp(x) - Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) + Math.exp(-x)) / 2, unit);
	};

	exports.IMSQRT = function(inumber) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit = inumber.substring(inumber.length - 1);
	  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

	  // Calculate power of modulus
	  var s = Math.sqrt(exports.IMABS(inumber));

	  // Calculate argument
	  var t = exports.IMARGUMENT(inumber);

	  // Return exponential of complex number
	  return exports.COMPLEX(s * Math.cos(t / 2), s * Math.sin(t / 2), unit);
	};

	exports.IMCSC = function (inumber) {
	  // Return error if inumber is a logical value
	  if (inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  // Return error if either coefficient is not a number
	  if (utils.anyIsError(x, y)) {
	    return error.num;
	  }

	  // Return cosecant of complex number
	  return exports.IMDIV('1', exports.IMSIN(inumber));
	};

	exports.IMCSCH = function (inumber) {
	  // Return error if inumber is a logical value
	  if (inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  // Return error if either coefficient is not a number
	  if (utils.anyIsError(x, y)) {
	    return error.num;
	  }

	  // Return hyperbolic cosecant of complex number
	  return exports.IMDIV('1', exports.IMSINH(inumber));
	};

	exports.IMSUB = function(inumber1, inumber2) {
	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var a = this.IMREAL(inumber1);
	  var b = this.IMAGINARY(inumber1);
	  var c = this.IMREAL(inumber2);
	  var d = this.IMAGINARY(inumber2);

	  if (utils.anyIsError(a, b, c, d)) {
	    return error.value;
	  }

	  // Lookup imaginary unit
	  var unit1 = inumber1.substring(inumber1.length - 1);
	  var unit2 = inumber2.substring(inumber2.length - 1);
	  var unit = 'i';
	  if (unit1 === 'j') {
	    unit = 'j';
	  } else if (unit2 === 'j') {
	    unit = 'j';
	  }

	  // Return _ of two complex numbers
	  return this.COMPLEX(a - c, b - d, unit);
	};

	exports.IMSUM = function() {
	  var args = utils.flatten(arguments);

	  // Initialize result
	  var result = args[0];

	  // Loop on all numbers
	  for (var i = 1; i < args.length; i++) {
	    // Lookup coefficients of two complex numbers
	    var a = this.IMREAL(result);
	    var b = this.IMAGINARY(result);
	    var c = this.IMREAL(args[i]);
	    var d = this.IMAGINARY(args[i]);

	    if (utils.anyIsError(a, b, c, d)) {
	      return error.value;
	    }

	    // Complute product of two complex numbers
	    result = this.COMPLEX(a + c, b + d);
	  }

	  // Return sum of complex numbers
	  return result;
	};

	exports.IMTAN = function(inumber) {
	  // Return error if inumber is a logical value
	  if (inumber === true || inumber === false) {
	    return error.value;
	  }

	  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
	  var x = exports.IMREAL(inumber);
	  var y = exports.IMAGINARY(inumber);

	  if (utils.anyIsError(x, y)) {
	    return error.value;
	  }

	  // Return tangent of complex number
	  return this.IMDIV(this.IMSIN(inumber), this.IMCOS(inumber));
	};

	exports.OCT2BIN = function(number, places) {
	  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
	  if (!/^[0-7]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Check if number is negative
	  var negative = (number.length === 10 && number.substring(0, 1) === '7') ? true : false;

	  // Convert octal number to decimal
	  var decimal = (negative) ? parseInt(number, 8) - 1073741824 : parseInt(number, 8);

	  // Return error if number is lower than -512 or greater than 511
	  if (decimal < -512 || decimal > 511) {
	    return error.num;
	  }

	  // Ignore places and return a 10-character binary number if number is negative
	  if (negative) {
	    return '1' + text.REPT('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
	  }

	  // Convert decimal number to binary
	  var result = decimal.toString(2);

	  // Return binary number using the minimum number of characters necessary if places is undefined
	  if (typeof places === 'undefined') {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

	exports.OCT2DEC = function(number) {
	  // Return error if number is not octal or contains more than ten characters (10 digits)
	  if (!/^[0-7]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Convert octal number to decimal
	  var decimal = parseInt(number, 8);

	  // Return decimal number
	  return (decimal >= 536870912) ? decimal - 1073741824 : decimal;
	};

	exports.OCT2HEX = function(number, places) {
	  // Return error if number is not octal or contains more than ten characters (10 digits)
	  if (!/^[0-7]{1,10}$/.test(number)) {
	    return error.num;
	  }

	  // Convert octal number to decimal
	  var decimal = parseInt(number, 8);

	  // Ignore places and return a 10-character octal number if number is negative
	  if (decimal >= 536870912) {
	    return 'ff' + (decimal + 3221225472).toString(16);
	  }

	  // Convert decimal number to hexadecimal
	  var result = decimal.toString(16);

	  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
	  if (places === undefined) {
	    return result;
	  } else {
	    // Return error if places is nonnumeric
	    if (isNaN(places)) {
	      return error.value;
	    }

	    // Return error if places is negative
	    if (places < 0) {
	      return error.num;
	    }

	    // Truncate places in case it is not an integer
	    places = Math.floor(places);

	    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
	    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
	  }
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var M = Math;
	function _horner(arr, v) { return arr.reduce(function(z,w){return v * z + w;},0); };
	function _bessel_iter(x, n, f0, f1, sign) {
	  if(!sign) sign = -1;
	  var tdx = 2 / x, f2;
	  if(n === 0) return f0;
	  if(n === 1) return f1;
	  for(var o = 1; o != n; ++o) {
	    f2 = f1 * o * tdx + sign * f0;
	    f0 = f1; f1 = f2;
	  }
	  return f1;
	}
	function _bessel_wrap(bessel0, bessel1, name, nonzero, sign) {
	  return function bessel(x,n) {
	    if(n === 0) return bessel0(x);
	    if(n === 1) return bessel1(x);
	    if(n < 0) throw name + ': Order (' + n + ') must be nonnegative';
	    if(nonzero == 1 && x === 0) throw name + ': Undefined when x == 0';
	    if(nonzero == 2 && x <= 0) throw name + ': Undefined when x <= 0';
	    var b0 = bessel0(x), b1 = bessel1(x);
	    return _bessel_iter(x, n, b0, b1, sign);
	  };
	}
	var besselj = (function() {
	  var b0_a1a = [57568490574.0,-13362590354.0,651619640.7,-11214424.18,77392.33017,-184.9052456].reverse();
	  var b0_a2a = [57568490411.0,1029532985.0,9494680.718,59272.64853,267.8532712,1.0].reverse();
	  var b0_a1b = [1.0, -0.1098628627e-2, 0.2734510407e-4, -0.2073370639e-5, 0.2093887211e-6].reverse();
	  var b0_a2b = [-0.1562499995e-1, 0.1430488765e-3, -0.6911147651e-5, 0.7621095161e-6, -0.934935152e-7].reverse();
	  var W = 0.636619772; // 2 / Math.PI

	  function bessel0(x) {
	    var a, a1, a2, y = x * x, xx = M.abs(x) - 0.785398164;
	    if(M.abs(x) < 8) {
	      a1 = _horner(b0_a1a, y);
	      a2 = _horner(b0_a2a, y);
	      a = a1/a2;
	    }
	    else {
	      y = 64 / y;
	      a1 = _horner(b0_a1b, y);
	      a2 = _horner(b0_a2b, y);
	      a = M.sqrt(W/M.abs(x))*(M.cos(xx)*a1-M.sin(xx)*a2*8/M.abs(x));
	    }
	    return a;
	  }
	  var b1_a1a = [72362614232.0,-7895059235.0,242396853.1,-2972611.439, 15704.48260, -30.16036606].reverse();
	  var b1_a2a = [144725228442.0, 2300535178.0, 18583304.74, 99447.43394, 376.9991397, 1.0].reverse();
	  var b1_a1b = [1.0, 0.183105e-2, -0.3516396496e-4, 0.2457520174e-5, -0.240337019e-6].reverse();
	  var b1_a2b = [0.04687499995, -0.2002690873e-3, 0.8449199096e-5, -0.88228987e-6, 0.105787412e-6].reverse();
	  function bessel1(x) {
	    var a, a1, a2, y = x*x, xx = M.abs(x) - 2.356194491;
	    if(Math.abs(x)< 8) {
	      a1 = x*_horner(b1_a1a, y);
	      a2 = _horner(b1_a2a, y);
	      a = a1 / a2;
	    } else {
	      y = 64 / y;
	      a1=_horner(b1_a1b, y);
	      a2=_horner(b1_a2b, y);
	      a=M.sqrt(W/M.abs(x))*(M.cos(xx)*a1-M.sin(xx)*a2*8/M.abs(x));
	      if(x < 0) a = -a;
	    }
	    return a;
	  }
	  return function besselj(x, n) {
	    n = Math.round(n);
	    if(n === 0) return bessel0(M.abs(x));
	    if(n === 1) return bessel1(M.abs(x));
	    if(n < 0) throw 'BESSELJ: Order (' + n + ') must be nonnegative';
	    if(M.abs(x) === 0) return 0;

	    var ret, j, tox = 2 / M.abs(x), m, jsum, sum, bjp, bj, bjm;
	    if(M.abs(x) > n) {
	      ret = _bessel_iter(x, n, bessel0(M.abs(x)), bessel1(M.abs(x)),-1);
	    } else {
	      m=2*M.floor((n+M.floor(M.sqrt(40*n)))/2);
	      jsum=0;
	      bjp=ret=sum=0.0;
	      bj=1.0;
	      for (j=m;j>0;j--) {
	        bjm=j*tox*bj-bjp;
	        bjp=bj;
	        bj=bjm;
	        if (M.abs(bj) > 1E10) {
	          bj *= 1E-10;
	          bjp *= 1E-10;
	          ret *= 1E-10;
	          sum *= 1E-10;
	        }
	        if (jsum) sum += bj;
	        jsum=!jsum;
	        if (j == n) ret=bjp;
	      }
	      sum=2.0*sum-bj;
	      ret /= sum;
	    }
	    return x < 0 && (n%2) ? -ret : ret;
	  };
	})();
	var bessely = (function() {
	  var b0_a1a = [-2957821389.0, 7062834065.0, -512359803.6, 10879881.29, -86327.92757, 228.4622733].reverse();
	  var b0_a2a = [40076544269.0, 745249964.8, 7189466.438, 47447.26470, 226.1030244, 1.0].reverse();
	  var b0_a1b = [1.0, -0.1098628627e-2, 0.2734510407e-4, -0.2073370639e-5, 0.2093887211e-6].reverse();
	  var b0_a2b = [-0.1562499995e-1, 0.1430488765e-3, -0.6911147651e-5, 0.7621095161e-6, -0.934945152e-7].reverse();

	  var W = 0.636619772;
	  function bessel0(x) {
	    var a, a1, a2, y = x * x, xx = x - 0.785398164;
	    if(x < 8) {
	      a1 = _horner(b0_a1a, y);
	      a2 = _horner(b0_a2a, y);
	      a = a1/a2 + W * besselj(x,0) * M.log(x);
	    } else {
	      y = 64 / y;
	      a1 = _horner(b0_a1b, y);
	      a2 = _horner(b0_a2b, y);
	      a = M.sqrt(W/x)*(M.sin(xx)*a1+M.cos(xx)*a2*8/x);
	    }
	    return a;
	  }

	  var b1_a1a = [-0.4900604943e13, 0.1275274390e13, -0.5153438139e11, 0.7349264551e9, -0.4237922726e7, 0.8511937935e4].reverse();
	  var b1_a2a = [0.2499580570e14, 0.4244419664e12, 0.3733650367e10, 0.2245904002e8, 0.1020426050e6, 0.3549632885e3, 1].reverse();
	  var b1_a1b = [1.0, 0.183105e-2, -0.3516396496e-4, 0.2457520174e-5, -0.240337019e-6].reverse();
	  var b1_a2b = [0.04687499995, -0.2002690873e-3, 0.8449199096e-5, -0.88228987e-6, 0.105787412e-6].reverse();
	  function bessel1(x) {
	    var a, a1, a2, y = x*x, xx = x - 2.356194491;
	    if(x < 8) {
	      a1 = x*_horner(b1_a1a, y);
	      a2 = _horner(b1_a2a, y);
	      a = a1/a2 + W * (besselj(x,1) * M.log(x) - 1 / x);
	    } else {
	      y = 64 / y;
	      a1=_horner(b1_a1b, y);
	      a2=_horner(b1_a2b, y);
	      a=M.sqrt(W/x)*(M.sin(xx)*a1+M.cos(xx)*a2*8/x);
	    }
	    return a;
	  }

	  return _bessel_wrap(bessel0, bessel1, 'BESSELY', 1, -1);
	})();
	var besseli = (function() {
	  var b0_a = [1.0, 3.5156229, 3.0899424, 1.2067492, 0.2659732, 0.360768e-1, 0.45813e-2].reverse();
	  var b0_b = [0.39894228, 0.1328592e-1, 0.225319e-2, -0.157565e-2, 0.916281e-2, -0.2057706e-1, 0.2635537e-1, -0.1647633e-1, 0.392377e-2].reverse();
	  function bessel0(x) {
	    if(x <= 3.75) return _horner(b0_a, x*x/(3.75*3.75));
	    return M.exp(M.abs(x))/M.sqrt(M.abs(x))*_horner(b0_b, 3.75/M.abs(x));
	  }

	  var b1_a = [0.5, 0.87890594, 0.51498869, 0.15084934, 0.2658733e-1, 0.301532e-2, 0.32411e-3].reverse();
	  var b1_b = [0.39894228, -0.3988024e-1, -0.362018e-2, 0.163801e-2, -0.1031555e-1, 0.2282967e-1, -0.2895312e-1, 0.1787654e-1, -0.420059e-2].reverse();
	  function bessel1(x) {
	    if(x < 3.75) return x * _horner(b1_a, x*x/(3.75*3.75));
	    return (x < 0 ? -1 : 1) * M.exp(M.abs(x))/M.sqrt(M.abs(x))*_horner(b1_b, 3.75/M.abs(x));
	  }

	  return function besseli(x, n) {
	    n = Math.round(n);
	    if(n === 0) return bessel0(x);
	    if(n == 1) return bessel1(x);
	    if(n < 0) throw 'BESSELI Order (' + n + ') must be nonnegative';
	    if(M.abs(x) === 0) return 0;

	    var ret, j, tox = 2 / M.abs(x), m, bip, bi, bim;
	    m=2*M.round((n+M.round(M.sqrt(40*n)))/2);
	    bip=ret=0.0;
	    bi=1.0;
	    for (j=m;j>0;j--) {
	      bim=j*tox*bi + bip;
	      bip=bi; bi=bim;
	      if (M.abs(bi) > 1E10) {
	        bi *= 1E-10;
	        bip *= 1E-10;
	        ret *= 1E-10;
	      }
	      if(j == n) ret = bip;
	    }
	    ret *= besseli(x, 0) / bi;
	    return x < 0 && (n%2) ? -ret : ret;
	  };

	})();

	var besselk = (function() {
	  var b0_a = [-0.57721566, 0.42278420, 0.23069756, 0.3488590e-1, 0.262698e-2, 0.10750e-3, 0.74e-5].reverse();
	  var b0_b = [1.25331414, -0.7832358e-1, 0.2189568e-1, -0.1062446e-1, 0.587872e-2, -0.251540e-2, 0.53208e-3].reverse();
	  function bessel0(x) {
	    if(x <= 2) return -M.log(x/2)*besseli(x,0) + _horner(b0_a, x*x/4);
	    return M.exp(-x)/M.sqrt(x)*_horner(b0_b, 2/x);
	  }

	  var b1_a = [1.0, 0.15443144, -0.67278579, -0.18156897, -0.1919402e-1, -0.110404e-2, -0.4686e-4].reverse();
	  var b1_b = [1.25331414, 0.23498619, -0.3655620e-1, 0.1504268e-1, -0.780353e-2, 0.325614e-2, -0.68245e-3].reverse();
	  function bessel1(x) {
	    if(x <= 2) return M.log(x/2)*besseli(x,1) + (1/x)*_horner(b1_a, x*x/4);
	    return M.exp(-x)/M.sqrt(x)*_horner(b1_b, 2/x);
	  }

	  return _bessel_wrap(bessel0, bessel1, 'BESSELK', 2, 1);
	})();
	if(true) {
	  exports.besselj = besselj;
	  exports.bessely = bessely;
	  exports.besseli = besseli;
	  exports.besselk = besselk;
	}



/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);
	var utils = __webpack_require__(4);

	var d1900 = new Date(1900, 0, 1);
	var WEEK_STARTS = [
	  undefined,
	  0,
	  1,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  undefined,
	  1,
	  2,
	  3,
	  4,
	  5,
	  6,
	  0
	];
	var WEEK_TYPES = [
	  [],
	  [1, 2, 3, 4, 5, 6, 7],
	  [7, 1, 2, 3, 4, 5, 6],
	  [6, 0, 1, 2, 3, 4, 5],
	  [],
	  [],
	  [],
	  [],
	  [],
	  [],
	  [],
	  [7, 1, 2, 3, 4, 5, 6],
	  [6, 7, 1, 2, 3, 4, 5],
	  [5, 6, 7, 1, 2, 3, 4],
	  [4, 5, 6, 7, 1, 2, 3],
	  [3, 4, 5, 6, 7, 1, 2],
	  [2, 3, 4, 5, 6, 7, 1],
	  [1, 2, 3, 4, 5, 6, 7]
	];
	var WEEKEND_TYPES = [
	  [],
	  [6, 0],
	  [0, 1],
	  [1, 2],
	  [2, 3],
	  [3, 4],
	  [4, 5],
	  [5, 6],
	  undefined,
	  undefined,
	  undefined, [0, 0],
	  [1, 1],
	  [2, 2],
	  [3, 3],
	  [4, 4],
	  [5, 5],
	  [6, 6]
	];

	exports.DATE = function(year, month, day) {
	  year = utils.parseNumber(year);
	  month = utils.parseNumber(month);
	  day = utils.parseNumber(day);
	  if (utils.anyIsError(year, month, day)) {
	    return error.value;
	  }
	  if (year < 0 || month < 0 || day < 0) {
	    return error.num;
	  }
	  var date = new Date(year, month - 1, day);
	  return date;
	};

	exports.DATEVALUE = function(date_text) {
	  if (typeof date_text !== 'string') {
	    return error.value;
	  }
	  var date = Date.parse(date_text);
	  if (isNaN(date)) {
	    return error.value;
	  }
	  if (date <= -2203891200000) {
	    return (date - d1900) / 86400000 + 1;
	  }
	  return (date - d1900) / 86400000 + 2;
	};

	exports.DAY = function(serial_number) {
	  var date = utils.parseDate(serial_number);
	  if (date instanceof Error) {
	    return date;
	  }
	  return date.getDate();
	};

	exports.DAYS = function(end_date, start_date) {
	  end_date = utils.parseDate(end_date);
	  start_date = utils.parseDate(start_date);
	  if (end_date instanceof Error) {
	    return end_date;
	  }
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  return serial(end_date) - serial(start_date);
	};

	exports.DAYS360 = function(start_date, end_date, method) {
	  method = utils.parseBool(method);
	  start_date = utils.parseDate(start_date);
	  end_date = utils.parseDate(end_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  if (end_date instanceof Error) {
	    return end_date;
	  }
	  if (method instanceof Error) {
	    return method;
	  }
	  var sm = start_date.getMonth();
	  var em = end_date.getMonth();
	  var sd, ed;
	  if (method) {
	    sd = start_date.getDate() === 31 ? 30 : start_date.getDate();
	    ed = end_date.getDate() === 31 ? 30 : end_date.getDate();
	  } else {
	    var smd = new Date(start_date.getFullYear(), sm + 1, 0).getDate();
	    var emd = new Date(end_date.getFullYear(), em + 1, 0).getDate();
	    sd = start_date.getDate() === smd ? 30 : start_date.getDate();
	    if (end_date.getDate() === emd) {
	      if (sd < 30) {
	        em++;
	        ed = 1;
	      } else {
	        ed = 30;
	      }
	    } else {
	      ed = end_date.getDate();
	    }
	  }
	  return 360 * (end_date.getFullYear() - start_date.getFullYear()) +
	    30 * (em - sm) + (ed - sd);
	};

	exports.EDATE = function(start_date, months) {
	  start_date = utils.parseDate(start_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  if (isNaN(months)) {
	    return error.value;
	  }
	  months = parseInt(months, 10);
	  start_date.setMonth(start_date.getMonth() + months);
	  return serial(start_date);
	};

	exports.EOMONTH = function(start_date, months) {
	  start_date = utils.parseDate(start_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  if (isNaN(months)) {
	    return error.value;
	  }
	  months = parseInt(months, 10);
	  return serial(new Date(start_date.getFullYear(), start_date.getMonth() + months + 1, 0));
	};

	exports.HOUR = function(serial_number) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  return serial_number.getHours();
	};

	exports.INTERVAL = function (second) {
	  if (typeof second !== 'number' && typeof second !== 'string') {
	    return error.value;
	  } else {
	    second = parseInt(second, 10);
	  }

	  var year  = Math.floor(second/946080000);
	  second    = second%946080000;
	  var month = Math.floor(second/2592000);
	  second    = second%2592000;
	  var day   = Math.floor(second/86400);
	  second    = second%86400;

	  var hour  = Math.floor(second/3600);
	  second    = second%3600;
	  var min   = Math.floor(second/60);
	  second    = second%60;
	  var sec   = second;

	  year  = (year  > 0) ? year  + 'Y' : '';
	  month = (month > 0) ? month + 'M' : '';
	  day   = (day   > 0) ? day   + 'D' : '';
	  hour  = (hour  > 0) ? hour  + 'H' : '';
	  min   = (min   > 0) ? min   + 'M' : '';
	  sec   = (sec   > 0) ? sec   + 'S' : '';

	  return 'P' + year + month + day +
	  'T' + hour + min + sec;
	};

	exports.ISOWEEKNUM = function(date) {
	  date = utils.parseDate(date);
	  if (date instanceof Error) {
	    return date;
	  }

	  date.setHours(0, 0, 0);
	  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
	  var yearStart = new Date(date.getFullYear(), 0, 1);
	  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
	};

	exports.MINUTE = function(serial_number) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  return serial_number.getMinutes();
	};

	exports.MONTH = function(serial_number) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  return serial_number.getMonth() + 1;
	};

	exports.NETWORKDAYS = function(start_date, end_date, holidays) {
	  return this.NETWORKDAYS.INTL(start_date, end_date, 1, holidays);
	};

	exports.NETWORKDAYS.INTL = function(start_date, end_date, weekend, holidays) {
	  start_date = utils.parseDate(start_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  end_date = utils.parseDate(end_date);
	  if (end_date instanceof Error) {
	    return end_date;
	  }
	  if (weekend === undefined) {
	    weekend = WEEKEND_TYPES[1];
	  } else {
	    weekend = WEEKEND_TYPES[weekend];
	  }
	  if (!(weekend instanceof Array)) {
	    return error.value;
	  }
	  if (holidays === undefined) {
	    holidays = [];
	  } else if (!(holidays instanceof Array)) {
	    holidays = [holidays];
	  }
	  for (var i = 0; i < holidays.length; i++) {
	    var h = utils.parseDate(holidays[i]);
	    if (h instanceof Error) {
	      return h;
	    }
	    holidays[i] = h;
	  }
	  var days = (end_date - start_date) / (1000 * 60 * 60 * 24) + 1;
	  var total = days;
	  var day = start_date;
	  for (i = 0; i < days; i++) {
	    var d = (new Date().getTimezoneOffset() > 0) ? day.getUTCDay() : day.getDay();
	    var dec = false;
	    if (d === weekend[0] || d === weekend[1]) {
	      dec = true;
	    }
	    for (var j = 0; j < holidays.length; j++) {
	      var holiday = holidays[j];
	      if (holiday.getDate() === day.getDate() &&
	        holiday.getMonth() === day.getMonth() &&
	        holiday.getFullYear() === day.getFullYear()) {
	        dec = true;
	        break;
	      }
	    }
	    if (dec) {
	      total--;
	    }
	    day.setDate(day.getDate() + 1);
	  }
	  return total;
	};

	exports.NOW = function() {
	  return new Date();
	};

	exports.SECOND = function(serial_number) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  return serial_number.getSeconds();
	};

	exports.TIME = function(hour, minute, second) {
	  hour = utils.parseNumber(hour);
	  minute = utils.parseNumber(minute);
	  second = utils.parseNumber(second);
	  if (utils.anyIsError(hour, minute, second)) {
	    return error.value;
	  }
	  if (hour < 0 || minute < 0 || second < 0) {
	    return error.num;
	  }
	  return (3600 * hour + 60 * minute + second) / 86400;
	};

	exports.TIMEVALUE = function(time_text) {
	  time_text = utils.parseDate(time_text);
	  if (time_text instanceof Error) {
	    return time_text;
	  }
	  return (3600 * time_text.getHours() +
	    60 * time_text.getMinutes() +
	    time_text.getSeconds()) / 86400;
	};

	exports.TODAY = function() {
	  return new Date();
	};

	exports.WEEKDAY = function(serial_number, return_type) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  if (return_type === undefined) {
	    return_type = 1;
	  }
	  var day = serial_number.getDay();
	  return WEEK_TYPES[return_type][day];
	};

	exports.WEEKNUM = function(serial_number, return_type) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  if (return_type === undefined) {
	    return_type = 1;
	  }
	  if (return_type === 21) {
	    return this.ISOWEEKNUM(serial_number);
	  }
	  var week_start = WEEK_STARTS[return_type];
	  var jan = new Date(serial_number.getFullYear(), 0, 1);
	  var inc = jan.getDay() < week_start ? 1 : 0;
	  jan -= Math.abs(jan.getDay() - week_start) * 24 * 60 * 60 * 1000;
	  return Math.floor(((serial_number - jan) / (1000 * 60 * 60 * 24)) / 7 + 1) + inc;
	};

	exports.WORKDAY = function(start_date, days, holidays) {
	  return this.WORKDAY.INTL(start_date, days, 1, holidays);
	};

	exports.WORKDAY.INTL = function(start_date, days, weekend, holidays) {
	  start_date = utils.parseDate(start_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  days = utils.parseNumber(days);
	  if (days instanceof Error) {
	    return days;
	  }
	  if (days < 0) {
	    return error.num;
	  }
	  if (weekend === undefined) {
	    weekend = WEEKEND_TYPES[1];
	  } else {
	    weekend = WEEKEND_TYPES[weekend];
	  }
	  if (!(weekend instanceof Array)) {
	    return error.value;
	  }
	  if (holidays === undefined) {
	    holidays = [];
	  } else if (!(holidays instanceof Array)) {
	    holidays = [holidays];
	  }
	  for (var i = 0; i < holidays.length; i++) {
	    var h = utils.parseDate(holidays[i]);
	    if (h instanceof Error) {
	      return h;
	    }
	    holidays[i] = h;
	  }
	  var d = 0;
	  while (d < days) {
	    start_date.setDate(start_date.getDate() + 1);
	    var day = start_date.getDay();
	    if (day === weekend[0] || day === weekend[1]) {
	      continue;
	    }
	    for (var j = 0; j < holidays.length; j++) {
	      var holiday = holidays[j];
	      if (holiday.getDate() === start_date.getDate() &&
	        holiday.getMonth() === start_date.getMonth() &&
	        holiday.getFullYear() === start_date.getFullYear()) {
	        d--;
	        break;
	      }
	    }
	    d++;
	  }
	  return start_date;
	};

	exports.YEAR = function(serial_number) {
	  serial_number = utils.parseDate(serial_number);
	  if (serial_number instanceof Error) {
	    return serial_number;
	  }
	  return serial_number.getFullYear();
	};

	function isLeapYear(year) {
	  return new Date(year, 1, 29).getMonth() === 1;
	}

	// TODO : Use DAYS ?
	function daysBetween(start_date, end_date) {
	  return Math.ceil((end_date - start_date) / 1000 / 60 / 60 / 24);
	}

	exports.YEARFRAC = function(start_date, end_date, basis) {
	  start_date = utils.parseDate(start_date);
	  if (start_date instanceof Error) {
	    return start_date;
	  }
	  end_date = utils.parseDate(end_date);
	  if (end_date instanceof Error) {
	    return end_date;
	  }

	  basis = basis || 0;
	  var sd = start_date.getDate();
	  var sm = start_date.getMonth() + 1;
	  var sy = start_date.getFullYear();
	  var ed = end_date.getDate();
	  var em = end_date.getMonth() + 1;
	  var ey = end_date.getFullYear();

	  switch (basis) {
	    case 0:
	      // US (NASD) 30/360
	      if (sd === 31 && ed === 31) {
	        sd = 30;
	        ed = 30;
	      } else if (sd === 31) {
	        sd = 30;
	      } else if (sd === 30 && ed === 31) {
	        ed = 30;
	      }
	      return ((ed + em * 30 + ey * 360) - (sd + sm * 30 + sy * 360)) / 360;
	    case 1:
	      // Actual/actual
	      var feb29Between = function(date1, date2) {
	        var year1 = date1.getFullYear();
	        var mar1year1 = new Date(year1, 2, 1);
	        if (isLeapYear(year1) && date1 < mar1year1 && date2 >= mar1year1) {
	          return true;
	        }
	        var year2 = date2.getFullYear();
	        var mar1year2 = new Date(year2, 2, 1);
	        return (isLeapYear(year2) && date2 >= mar1year2 && date1 < mar1year2);
	      };
	      var ylength = 365;
	      if (sy === ey || ((sy + 1) === ey) && ((sm > em) || ((sm === em) && (sd >= ed)))) {
	        if ((sy === ey && isLeapYear(sy)) ||
	            feb29Between(start_date, end_date) ||
	            (em === 1 && ed === 29)) {
	          ylength = 366;
	        }
	        return daysBetween(start_date, end_date) / ylength;
	      }
	      var years = (ey - sy) + 1;
	      var days = (new Date(ey + 1, 0, 1) - new Date(sy, 0, 1)) / 1000 / 60 / 60 / 24;
	      var average = days / years;
	      return daysBetween(start_date, end_date) / average;
	    case 2:
	      // Actual/360
	      return daysBetween(start_date, end_date) / 360;
	    case 3:
	      // Actual/365
	      return daysBetween(start_date, end_date) / 365;
	    case 4:
	      // European 30/360
	      return ((ed + em * 30 + ey * 360) - (sd + sm * 30 + sy * 360)) / 360;
	  }
	};

	function serial(date) {
	  var addOn = (date > -2203891200000)?2:1;
	  return (date - d1900) / 86400000 + addOn;
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);
	var stats = __webpack_require__(6);
	var maths = __webpack_require__(2);
	var utils = __webpack_require__(4);

	function compact(array) {
	  if (!array) { return array; }
	  var result = [];
	  for (var i = 0; i < array.length; ++i) {
	    if (!array[i]) { continue; }
	    result.push(array[i]);
	  }
	  return result;
	}

	exports.FINDFIELD = function(database, title) {
	  var index = null;
	  for (var i = 0; i < database.length; i++) {
	    if (database[i][0] === title) {
	      index = i;
	      break;
	    }
	  }

	  // Return error if the input field title is incorrect
	  if (index == null) {
	    return error.value;
	  }
	  return index;
	};

	function findResultIndex(database, criterias) {
	  var matches = {};
	  for (var i = 1; i < database[0].length; ++i) {
	    matches[i] = true;
	  }
	  var maxCriteriaLength = criterias[0].length;
	  for (i = 1; i < criterias.length; ++i) {
	    if (criterias[i].length > maxCriteriaLength) {
	      maxCriteriaLength = criterias[i].length;
	    }
	  }

	  for (var k = 1; k < database.length; ++k) {
	    for (var l = 1; l < database[k].length; ++l) {
	      var currentCriteriaResult = false;
	      var hasMatchingCriteria   = false;
	      for (var j = 0; j < criterias.length; ++j) {
	        var criteria = criterias[j];
	        if (criteria.length < maxCriteriaLength) {
	          continue;
	        }

	        var criteriaField = criteria[0];
	        if (database[k][0] !== criteriaField) {
	          continue;
	        }
	        hasMatchingCriteria = true;
	        for (var p = 1; p < criteria.length; ++p) {
	          currentCriteriaResult = currentCriteriaResult || eval(database[k][l] + criteria[p]);  // jshint ignore:line
	        }
	      }
	      if (hasMatchingCriteria) {
	        matches[l] = matches[l] && currentCriteriaResult;
	      }
	    }
	  }

	  var result = [];
	  for (var n = 0; n < database[0].length; ++n) {
	    if (matches[n]) {
	      result.push(n - 1);
	    }
	  }
	  return result;
	}

	// Database functions
	exports.DAVERAGE = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var sum = 0;
	  for (var i = 0; i < resultIndexes.length; i++) {
	    sum += targetFields[resultIndexes[i]];
	  }
	  return resultIndexes.length === 0 ? error.div0 : sum / resultIndexes.length;
	};

	exports.DCOUNT = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  return stats.COUNT(targetValues);
	};

	exports.DCOUNTA = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  return stats.COUNTA(targetValues);
	};

	exports.DGET = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  // Return error if no record meets the criteria
	  if (resultIndexes.length === 0) {
	    return error.value;
	  }
	  // Returns the #NUM! error value because more than one record meets the
	  // criteria
	  if (resultIndexes.length > 1) {
	    return error.num;
	  }

	  return targetFields[resultIndexes[0]];
	};

	exports.DMAX = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var maxValue = targetFields[resultIndexes[0]];
	  for (var i = 1; i < resultIndexes.length; i++) {
	    if (maxValue < targetFields[resultIndexes[i]]) {
	      maxValue = targetFields[resultIndexes[i]];
	    }
	  }
	  return maxValue;
	};

	exports.DMIN = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var minValue = targetFields[resultIndexes[0]];
	  for (var i = 1; i < resultIndexes.length; i++) {
	    if (minValue > targetFields[resultIndexes[i]]) {
	      minValue = targetFields[resultIndexes[i]];
	    }
	  }
	  return minValue;
	};

	exports.DPRODUCT = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  targetValues = compact(targetValues);
	  var result = 1;
	  for (i = 0; i < targetValues.length; i++) {
	    result *= targetValues[i];
	  }
	  return result;
	};

	exports.DSTDEV = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  targetValues = compact(targetValues);
	  return stats.STDEV.S(targetValues);
	};

	exports.DSTDEVP = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  targetValues = compact(targetValues);
	  return stats.STDEV.P(targetValues);
	};

	exports.DSUM = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  return maths.SUM(targetValues);
	};

	exports.DVAR = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  return stats.VAR.S(targetValues);
	};

	exports.DVARP = function(database, field, criteria) {
	  // Return error if field is not a number and not a string
	  if (isNaN(field) && (typeof field !== "string")) {
	    return error.value;
	  }
	  var resultIndexes = findResultIndex(database, criteria);
	  var targetFields = [];
	  if (typeof field === "string") {
	    var index = exports.FINDFIELD(database, field);
	    targetFields = utils.rest(database[index]);
	  } else {
	    targetFields = utils.rest(database[field]);
	  }
	  var targetValues = [];
	  for (var i = 0; i < resultIndexes.length; i++) {
	    targetValues[i] = targetFields[resultIndexes[i]];
	  }
	  return stats.VAR.P(targetValues);
	};


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);
	var utils = __webpack_require__(4);
	var information = __webpack_require__(11);

	exports.AND = function() {
	  var args = utils.flatten(arguments);
	  var result = true;
	  for (var i = 0; i < args.length; i++) {
	    if (!args[i]) {
	      result = false;
	    }
	  }
	  return result;
	};

	exports.CHOOSE = function() {
	  if (arguments.length < 2) {
	    return error.na;
	  }

	  var index = arguments[0];
	  if (index < 1 || index > 254) {
	    return error.value;
	  }

	  if (arguments.length < index + 1) {
	    return error.value;
	  }

	  return arguments[index];
	};

	exports.FALSE = function() {
	  return false;
	};

	exports.IF = function(test, then_value, otherwise_value) {
	  return test ? then_value : otherwise_value;
	};

	exports.IFERROR = function(value, valueIfError) {
	  if (information.ISERROR(value)) {
	    return valueIfError;
	  }
	  return value;
	};

	exports.IFNA = function(value, value_if_na) {
	  return value === error.na ? value_if_na : value;
	};

	exports.NOT = function(logical) {
	  return !logical;
	};

	exports.OR = function() {
	  var args = utils.flatten(arguments);
	  var result = false;
	  for (var i = 0; i < args.length; i++) {
	    if (args[i]) {
	      result = true;
	    }
	  }
	  return result;
	};

	exports.TRUE = function() {
	  return true;
	};

	exports.XOR = function() {
	  var args = utils.flatten(arguments);
	  var result = 0;
	  for (var i = 0; i < args.length; i++) {
	    if (args[i]) {
	      result++;
	    }
	  }
	  return (Math.floor(Math.abs(result)) & 1) ? true : false;
	};

	exports.SWITCH = function () {
	  var result;
	  if (arguments.length > 0)  {
	    var targetValue = arguments[0];
	    var argc = arguments.length - 1;
	    var switchCount = Math.floor(argc / 2);
	    var switchSatisfied = false;
	    var defaultClause = argc % 2 === 0 ? null : arguments[arguments.length - 1];

	    if (switchCount) {
	      for (var index = 0; index < switchCount; index++) {
	        if (targetValue === arguments[index * 2 + 1]) {
	          result = arguments[index * 2 + 2];
	          switchSatisfied = true;
	          break;
	        }
	      }
	    }

	    if (!switchSatisfied && defaultClause) {
	      result = defaultClause;
	    }
	  }

	  return result;
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);
	var dateTime = __webpack_require__(14);
	var utils = __webpack_require__(4);

	function validDate(d) {
	  return d && d.getTime && !isNaN(d.getTime());
	}

	function ensureDate(d) {
	  return (d instanceof Date)?d:new Date(d);
	}

	exports.ACCRINT = function(issue, first, settlement, rate, par, frequency, basis) {
	  // Return error if either date is invalid
	  issue      = ensureDate(issue);
	  first      = ensureDate(first);
	  settlement = ensureDate(settlement);
	  if (!validDate(issue) || !validDate(first) || !validDate(settlement)) {
	    return '#VALUE!';
	  }

	  // Return error if either rate or par are lower than or equal to zero
	  if (rate <= 0 || par <= 0) {
	    return '#NUM!';
	  }

	  // Return error if frequency is neither 1, 2, or 4
	  if ([1, 2, 4].indexOf(frequency) === -1) {
	    return '#NUM!';
	  }

	  // Return error if basis is neither 0, 1, 2, 3, or 4
	  if ([0, 1, 2, 3, 4].indexOf(basis) === -1) {
	    return '#NUM!';
	  }

	  // Return error if settlement is before or equal to issue
	  if (settlement <= issue) {
	    return '#NUM!';
	  }

	  // Set default values
	  par   = par   || 0;
	  basis = basis || 0;

	  // Compute accrued interest
	  return par * rate * dateTime.YEARFRAC(issue, settlement, basis);
	};

	// TODO
	exports.ACCRINTM = function() {
	 throw new Error('ACCRINTM is not implemented');
	};

	// TODO
	exports.AMORDEGRC = function() {
	 throw new Error('AMORDEGRC is not implemented');
	};

	// TODO
	exports.AMORLINC = function() {
	 throw new Error('AMORLINC is not implemented');
	};

	// TODO
	exports.COUPDAYBS = function() {
	 throw new Error('COUPDAYBS is not implemented');
	};

	// TODO
	exports.COUPDAYS = function() {
	 throw new Error('COUPDAYS is not implemented');
	};

	// TODO
	exports.COUPDAYSNC = function() {
	 throw new Error('COUPDAYSNC is not implemented');
	};

	// TODO
	exports.COUPNCD = function() {
	 throw new Error('COUPNCD is not implemented');
	};

	// TODO
	exports.COUPNUM = function() {
	 throw new Error('COUPNUM is not implemented');
	};

	// TODO
	exports.COUPPCD = function() {
	 throw new Error('COUPPCD is not implemented');
	};

	exports.CUMIPMT = function(rate, periods, value, start, end, type) {
	  // Credits: algorithm inspired by Apache OpenOffice
	  // Credits: Hannes Stiebitzhofer for the translations of function and variable names
	  // Requires exports.FV() and exports.PMT() from exports.js [http://stoic.com/exports/]

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  value = utils.parseNumber(value);
	  if (utils.anyIsError(rate, periods, value)) {
	    return error.value;
	  }

	  // Return error if either rate, periods, or value are lower than or equal to zero
	  if (rate <= 0 || periods <= 0 || value <= 0) {
	    return error.num;
	  }

	  // Return error if start < 1, end < 1, or start > end
	  if (start < 1 || end < 1 || start > end) {
	    return error.num;
	  }

	  // Return error if type is neither 0 nor 1
	  if (type !== 0 && type !== 1) {
	    return error.num;
	  }

	  // Compute cumulative interest
	  var payment = exports.PMT(rate, periods, value, 0, type);
	  var interest = 0;

	  if (start === 1) {
	    if (type === 0) {
	      interest = -value;
	      start++;
	    }
	  }

	  for (var i = start; i <= end; i++) {
	    if (type === 1) {
	      interest += exports.FV(rate, i - 2, payment, value, 1) - payment;
	    } else {
	      interest += exports.FV(rate, i - 1, payment, value, 0);
	    }
	  }
	  interest *= rate;

	  // Return cumulative interest
	  return interest;
	};

	exports.CUMPRINC = function(rate, periods, value, start, end, type) {
	  // Credits: algorithm inspired by Apache OpenOffice
	  // Credits: Hannes Stiebitzhofer for the translations of function and variable names

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  value = utils.parseNumber(value);
	  if (utils.anyIsError(rate, periods, value)) {
	    return error.value;
	  }

	  // Return error if either rate, periods, or value are lower than or equal to zero
	  if (rate <= 0 || periods <= 0 || value <= 0) {
	    return error.num;
	  }

	  // Return error if start < 1, end < 1, or start > end
	  if (start < 1 || end < 1 || start > end) {
	    return error.num;
	  }

	  // Return error if type is neither 0 nor 1
	  if (type !== 0 && type !== 1) {
	    return error.num;
	  }

	  // Compute cumulative principal
	  var payment = exports.PMT(rate, periods, value, 0, type);
	  var principal = 0;
	  if (start === 1) {
	    if (type === 0) {
	      principal = payment + value * rate;
	    } else {
	      principal = payment;
	    }
	    start++;
	  }
	  for (var i = start; i <= end; i++) {
	    if (type > 0) {
	      principal += payment - (exports.FV(rate, i - 2, payment, value, 1) - payment) * rate;
	    } else {
	      principal += payment - exports.FV(rate, i - 1, payment, value, 0) * rate;
	    }
	  }

	  // Return cumulative principal
	  return principal;
	};

	exports.DB = function(cost, salvage, life, period, month) {
	  // Initialize month
	  month = (month === undefined) ? 12 : month;

	  cost = utils.parseNumber(cost);
	  salvage = utils.parseNumber(salvage);
	  life = utils.parseNumber(life);
	  period = utils.parseNumber(period);
	  month = utils.parseNumber(month);
	  if (utils.anyIsError(cost, salvage, life, period, month)) {
	    return error.value;
	  }

	  // Return error if any of the parameters is negative
	  if (cost < 0 || salvage < 0 || life < 0 || period < 0) {
	    return error.num;
	  }

	  // Return error if month is not an integer between 1 and 12
	  if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(month) === -1) {
	    return error.num;
	  }

	  // Return error if period is greater than life
	  if (period > life) {
	    return error.num;
	  }

	  // Return 0 (zero) if salvage is greater than or equal to cost
	  if (salvage >= cost) {
	    return 0;
	  }

	  // Rate is rounded to three decimals places
	  var rate = (1 - Math.pow(salvage / cost, 1 / life)).toFixed(3);

	  // Compute initial depreciation
	  var initial = cost * rate * month / 12;

	  // Compute total depreciation
	  var total = initial;
	  var current = 0;
	  var ceiling = (period === life) ? life - 1 : period;
	  for (var i = 2; i <= ceiling; i++) {
	    current = (cost - total) * rate;
	    total += current;
	  }

	  // Depreciation for the first and last periods are special cases
	  if (period === 1) {
	    // First period
	    return initial;
	  } else if (period === life) {
	    // Last period
	    return (cost - total) * rate;
	  } else {
	    return current;
	  }
	};

	exports.DDB = function(cost, salvage, life, period, factor) {
	  // Initialize factor
	  factor = (factor === undefined) ? 2 : factor;

	  cost = utils.parseNumber(cost);
	  salvage = utils.parseNumber(salvage);
	  life = utils.parseNumber(life);
	  period = utils.parseNumber(period);
	  factor = utils.parseNumber(factor);
	  if (utils.anyIsError(cost, salvage, life, period, factor)) {
	    return error.value;
	  }

	  // Return error if any of the parameters is negative or if factor is null
	  if (cost < 0 || salvage < 0 || life < 0 || period < 0 || factor <= 0) {
	    return error.num;
	  }

	  // Return error if period is greater than life
	  if (period > life) {
	    return error.num;
	  }

	  // Return 0 (zero) if salvage is greater than or equal to cost
	  if (salvage >= cost) {
	    return 0;
	  }

	  // Compute depreciation
	  var total = 0;
	  var current = 0;
	  for (var i = 1; i <= period; i++) {
	    current = Math.min((cost - total) * (factor / life), (cost - salvage - total));
	    total += current;
	  }

	  // Return depreciation
	  return current;
	};

	// TODO
	exports.DISC = function() {
	 throw new Error('DISC is not implemented');
	};

	exports.DOLLARDE = function(dollar, fraction) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  dollar = utils.parseNumber(dollar);
	  fraction = utils.parseNumber(fraction);
	  if (utils.anyIsError(dollar, fraction)) {
	    return error.value;
	  }

	  // Return error if fraction is negative
	  if (fraction < 0) {
	    return error.num;
	  }

	  // Return error if fraction is greater than or equal to 0 and less than 1
	  if (fraction >= 0 && fraction < 1) {
	    return error.div0;
	  }

	  // Truncate fraction if it is not an integer
	  fraction = parseInt(fraction, 10);

	  // Compute integer part
	  var result = parseInt(dollar, 10);

	  // Add decimal part
	  result += (dollar % 1) * Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN10)) / fraction;

	  // Round result
	  var power = Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN2) + 1);
	  result = Math.round(result * power) / power;

	  // Return converted dollar price
	  return result;
	};

	exports.DOLLARFR = function(dollar, fraction) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  dollar = utils.parseNumber(dollar);
	  fraction = utils.parseNumber(fraction);
	  if (utils.anyIsError(dollar, fraction)) {
	    return error.value;
	  }

	  // Return error if fraction is negative
	  if (fraction < 0) {
	    return error.num;
	  }

	  // Return error if fraction is greater than or equal to 0 and less than 1
	  if (fraction >= 0 && fraction < 1) {
	    return error.div0;
	  }

	  // Truncate fraction if it is not an integer
	  fraction = parseInt(fraction, 10);

	  // Compute integer part
	  var result = parseInt(dollar, 10);

	  // Add decimal part
	  result += (dollar % 1) * Math.pow(10, -Math.ceil(Math.log(fraction) / Math.LN10)) * fraction;

	  // Return converted dollar price
	  return result;
	};

	// TODO
	exports.DURATION = function() {
	 throw new Error('DURATION is not implemented');
	};

	exports.EFFECT = function(rate, periods) {
	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  if (utils.anyIsError(rate, periods)) {
	    return error.value;
	  }

	  // Return error if rate <=0 or periods < 1
	  if (rate <= 0 || periods < 1) {
	    return error.num;
	  }

	  // Truncate periods if it is not an integer
	  periods = parseInt(periods, 10);

	  // Return effective annual interest rate
	  return Math.pow(1 + rate / periods, periods) - 1;
	};

	exports.FV = function(rate, periods, payment, value, type) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  value = value || 0;
	  type = type || 0;

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  payment = utils.parseNumber(payment);
	  value = utils.parseNumber(value);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, periods, payment, value, type)) {
	    return error.value;
	  }

	  // Return future value
	  var result;
	  if (rate === 0) {
	    result = value + payment * periods;
	  } else {
	    var term = Math.pow(1 + rate, periods);
	    if (type === 1) {
	      result = value * term + payment * (1 + rate) * (term - 1) / rate;
	    } else {
	      result = value * term + payment * (term - 1) / rate;
	    }
	  }
	  return -result;
	};

	exports.FVSCHEDULE = function(principal, schedule) {
	  principal = utils.parseNumber(principal);
	  schedule = utils.parseNumberArray(utils.flatten(schedule));
	  if (utils.anyIsError(principal, schedule)) {
	    return error.value;
	  }

	  var n = schedule.length;
	  var future = principal;

	  // Apply all interests in schedule
	  for (var i = 0; i < n; i++) {
	    // Apply scheduled interest
	    future *= 1 + schedule[i];
	  }

	  // Return future value
	  return future;
	};

	// TODO
	exports.INTRATE = function() {
	 throw new Error('INTRATE is not implemented');
	};

	exports.IPMT = function(rate, period, periods, present, future, type) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  future = future || 0;
	  type = type || 0;

	  rate = utils.parseNumber(rate);
	  period = utils.parseNumber(period);
	  periods = utils.parseNumber(periods);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, period, periods, present, future, type)) {
	    return error.value;
	  }

	  // Compute payment
	  var payment = exports.PMT(rate, periods, present, future, type);

	  // Compute interest
	  var interest;
	  if (period === 1) {
	    if (type === 1) {
	      interest = 0;
	    } else {
	      interest = -present;
	    }
	  } else {
	    if (type === 1) {
	      interest = exports.FV(rate, period - 2, payment, present, 1) - payment;
	    } else {
	      interest = exports.FV(rate, period - 1, payment, present, 0);
	    }
	  }

	  // Return interest
	  return interest * rate;
	};

	exports.IRR = function(values, guess) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  guess = guess || 0;

	  values = utils.parseNumberArray(utils.flatten(values));
	  guess = utils.parseNumber(guess);
	  if (utils.anyIsError(values, guess)) {
	    return error.value;
	  }

	  // Calculates the resulting amount
	  var irrResult = function(values, dates, rate) {
	    var r = rate + 1;
	    var result = values[0];
	    for (var i = 1; i < values.length; i++) {
	      result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
	    }
	    return result;
	  };

	  // Calculates the first derivation
	  var irrResultDeriv = function(values, dates, rate) {
	    var r = rate + 1;
	    var result = 0;
	    for (var i = 1; i < values.length; i++) {
	      var frac = (dates[i] - dates[0]) / 365;
	      result -= frac * values[i] / Math.pow(r, frac + 1);
	    }
	    return result;
	  };

	  // Initialize dates and check that values contains at least one positive value and one negative value
	  var dates = [];
	  var positive = false;
	  var negative = false;
	  for (var i = 0; i < values.length; i++) {
	    dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
	    if (values[i] > 0) {
	      positive = true;
	    }
	    if (values[i] < 0) {
	      negative = true;
	    }
	  }

	  // Return error if values does not contain at least one positive value and one negative value
	  if (!positive || !negative) {
	    return error.num;
	  }

	  // Initialize guess and resultRate
	  guess = (guess === undefined) ? 0.1 : guess;
	  var resultRate = guess;

	  // Set maximum epsilon for end of iteration
	  var epsMax = 1e-10;

	  // Implement Newton's method
	  var newRate, epsRate, resultValue;
	  var contLoop = true;
	  do {
	    resultValue = irrResult(values, dates, resultRate);
	    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
	    epsRate = Math.abs(newRate - resultRate);
	    resultRate = newRate;
	    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
	  } while (contLoop);

	  // Return internal rate of return
	  return resultRate;
	};

	exports.ISPMT = function(rate, period, periods, value) {
	  rate = utils.parseNumber(rate);
	  period = utils.parseNumber(period);
	  periods = utils.parseNumber(periods);
	  value = utils.parseNumber(value);
	  if (utils.anyIsError(rate, period, periods, value)) {
	    return error.value;
	  }

	  // Return interest
	  return value * rate * (period / periods - 1);
	};

	// TODO
	exports.MDURATION = function() {
	 throw new Error('MDURATION is not implemented');
	};

	exports.MIRR = function(values, finance_rate, reinvest_rate) {
	  values = utils.parseNumberArray(utils.flatten(values));
	  finance_rate = utils.parseNumber(finance_rate);
	  reinvest_rate = utils.parseNumber(reinvest_rate);
	  if (utils.anyIsError(values, finance_rate, reinvest_rate)) {
	    return error.value;
	  }

	  // Initialize number of values
	  var n = values.length;

	  // Lookup payments (negative values) and incomes (positive values)
	  var payments = [];
	  var incomes = [];
	  for (var i = 0; i < n; i++) {
	    if (values[i] < 0) {
	      payments.push(values[i]);
	    } else {
	      incomes.push(values[i]);
	    }
	  }

	  // Return modified internal rate of return
	  var num = -exports.NPV(reinvest_rate, incomes) * Math.pow(1 + reinvest_rate, n - 1);
	  var den = exports.NPV(finance_rate, payments) * (1 + finance_rate);
	  return Math.pow(num / den, 1 / (n - 1)) - 1;
	};

	exports.NOMINAL = function(rate, periods) {
	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  if (utils.anyIsError(rate, periods)) {
	    return error.value;
	  }

	  // Return error if rate <=0 or periods < 1
	  if (rate <= 0 || periods < 1) {
	    return error.num;
	  }

	  // Truncate periods if it is not an integer
	  periods = parseInt(periods, 10);

	  // Return nominal annual interest rate
	  return (Math.pow(rate + 1, 1 / periods) - 1) * periods;
	};

	exports.NPER = function(rate, payment, present, future, type) {
	  type = (type === undefined) ? 0 : type;
	  future = (future === undefined) ? 0 : future;

	  rate = utils.parseNumber(rate);
	  payment = utils.parseNumber(payment);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, payment, present, future, type)) {
	    return error.value;
	  }

	  // Return number of periods
	  var num = payment * (1 + rate * type) - future * rate;
	  var den = (present * rate + payment * (1 + rate * type));
	  return Math.log(num / den) / Math.log(1 + rate);
	};

	exports.NPV = function() {
	  var args = utils.parseNumberArray(utils.flatten(arguments));
	  if (args instanceof Error) {
	    return args;
	  }

	  // Lookup rate
	  var rate = args[0];

	  // Initialize net present value
	  var value = 0;

	  // Loop on all values
	  for (var j = 1; j < args.length; j++) {
	    value += args[j] / Math.pow(1 + rate, j);
	  }

	  // Return net present value
	  return value;
	};

	// TODO
	exports.ODDFPRICE = function() {
	 throw new Error('ODDFPRICE is not implemented');
	};

	// TODO
	exports.ODDFYIELD = function() {
	 throw new Error('ODDFYIELD is not implemented');
	};

	// TODO
	exports.ODDLPRICE = function() {
	 throw new Error('ODDLPRICE is not implemented');
	};

	// TODO
	exports.ODDLYIELD = function() {
	 throw new Error('ODDLYIELD is not implemented');
	};

	exports.PDURATION = function(rate, present, future) {
	  rate = utils.parseNumber(rate);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  if (utils.anyIsError(rate, present, future)) {
	    return error.value;
	  }

	  // Return error if rate <=0
	  if (rate <= 0) {
	    return error.num;
	  }

	  // Return number of periods
	  return (Math.log(future) - Math.log(present)) / Math.log(1 + rate);
	};

	exports.PMT = function(rate, periods, present, future, type) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  future = future || 0;
	  type = type || 0;

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, periods, present, future, type)) {
	    return error.value;
	  }

	  // Return payment
	  var result;
	  if (rate === 0) {
	    result = (present + future) / periods;
	  } else {
	    var term = Math.pow(1 + rate, periods);
	    if (type === 1) {
	      result = (future * rate / (term - 1) + present * rate / (1 - 1 / term)) / (1 + rate);
	    } else {
	      result = future * rate / (term - 1) + present * rate / (1 - 1 / term);
	    }
	  }
	  return -result;
	};

	exports.PPMT = function(rate, period, periods, present, future, type) {
	  future = future || 0;
	  type = type || 0;

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, periods, present, future, type)) {
	    return error.value;
	  }

	  return exports.PMT(rate, periods, present, future, type) - exports.IPMT(rate, period, periods, present, future, type);
	};

	// TODO
	exports.PRICE = function() {
	 throw new Error('PRICE is not implemented');
	};

	// TODO
	exports.PRICEDISC = function() {
	 throw new Error('PRICEDISC is not implemented');
	};

	// TODO
	exports.PRICEMAT = function() {
	 throw new Error('PRICEMAT is not implemented');
	};

	exports.PV = function(rate, periods, payment, future, type) {
	  future = future || 0;
	  type = type || 0;

	  rate = utils.parseNumber(rate);
	  periods = utils.parseNumber(periods);
	  payment = utils.parseNumber(payment);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  if (utils.anyIsError(rate, periods, payment, future, type)) {
	    return error.value;
	  }

	  // Return present value
	  if (rate === 0) {
	    return -payment * periods - future;
	  } else {
	    return (((1 - Math.pow(1 + rate, periods)) / rate) * payment * (1 + rate * type) - future) / Math.pow(1 + rate, periods);
	  }
	};

	exports.RATE = function(periods, payment, present, future, type, guess) {
	  // Credits: rabugento

	  guess = (guess === undefined) ? 0.01 : guess;
	  future = (future === undefined) ? 0 : future;
	  type = (type === undefined) ? 0 : type;

	  periods = utils.parseNumber(periods);
	  payment = utils.parseNumber(payment);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  type = utils.parseNumber(type);
	  guess = utils.parseNumber(guess);
	  if (utils.anyIsError(periods, payment, present, future, type, guess)) {
	    return error.value;
	  }

	  // Set maximum epsilon for end of iteration
	  var epsMax = 1e-6;

	  // Set maximum number of iterations
	  var iterMax = 100;
	  var iter = 0;
	  var close = false;
	  var rate = guess;

	  while (iter < iterMax && !close) {
	    var t1 = Math.pow(rate + 1, periods);
	    var t2 = Math.pow(rate + 1, periods - 1);

	    var f1 = future + t1 * present + payment * (t1 - 1) * (rate * type + 1) / rate;
	    var f2 = periods * t2 * present - payment * (t1 - 1) *(rate * type + 1) / Math.pow(rate,2);
	    var f3 = periods * payment * t2 * (rate * type + 1) / rate + payment * (t1 - 1) * type / rate;

	    var newRate = rate - f1 / (f2 + f3);

	    if (Math.abs(newRate - rate) < epsMax) close = true;
	    iter++
	    rate = newRate;
	  }

	  if (!close) return Number.NaN + rate;
	  return rate;
	};

	// TODO
	exports.RECEIVED = function() {
	 throw new Error('RECEIVED is not implemented');
	};

	exports.RRI = function(periods, present, future) {
	  periods = utils.parseNumber(periods);
	  present = utils.parseNumber(present);
	  future = utils.parseNumber(future);
	  if (utils.anyIsError(periods, present, future)) {
	    return error.value;
	  }

	  // Return error if periods or present is equal to 0 (zero)
	  if (periods === 0 || present === 0) {
	    return error.num;
	  }

	  // Return equivalent interest rate
	  return Math.pow(future / present, 1 / periods) - 1;
	};

	exports.SLN = function(cost, salvage, life) {
	  cost = utils.parseNumber(cost);
	  salvage = utils.parseNumber(salvage);
	  life = utils.parseNumber(life);
	  if (utils.anyIsError(cost, salvage, life)) {
	    return error.value;
	  }

	  // Return error if life equal to 0 (zero)
	  if (life === 0) {
	    return error.num;
	  }

	  // Return straight-line depreciation
	  return (cost - salvage) / life;
	};

	exports.SYD = function(cost, salvage, life, period) {
	  // Return error if any of the parameters is not a number
	  cost = utils.parseNumber(cost);
	  salvage = utils.parseNumber(salvage);
	  life = utils.parseNumber(life);
	  period = utils.parseNumber(period);
	  if (utils.anyIsError(cost, salvage, life, period)) {
	    return error.value;
	  }

	  // Return error if life equal to 0 (zero)
	  if (life === 0) {
	    return error.num;
	  }

	  // Return error if period is lower than 1 or greater than life
	  if (period < 1 || period > life) {
	    return error.num;
	  }

	  // Truncate period if it is not an integer
	  period = parseInt(period, 10);

	  // Return straight-line depreciation
	  return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1));
	};

	exports.TBILLEQ = function(settlement, maturity, discount) {
	  settlement = utils.parseDate(settlement);
	  maturity = utils.parseDate(maturity);
	  discount = utils.parseNumber(discount);
	  if (utils.anyIsError(settlement, maturity, discount)) {
	    return error.value;
	  }

	  // Return error if discount is lower than or equal to zero
	  if (discount <= 0) {
	    return error.num;
	  }

	  // Return error if settlement is greater than maturity
	  if (settlement > maturity) {
	    return error.num;
	  }

	  // Return error if maturity is more than one year after settlement
	  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
	    return error.num;
	  }

	  // Return bond-equivalent yield
	  return (365 * discount) / (360 - discount * dateTime.DAYS360(settlement, maturity, false));
	};

	exports.TBILLPRICE = function(settlement, maturity, discount) {
	  settlement = utils.parseDate(settlement);
	  maturity = utils.parseDate(maturity);
	  discount = utils.parseNumber(discount);
	  if (utils.anyIsError(settlement, maturity, discount)) {
	    return error.value;
	  }

	  // Return error if discount is lower than or equal to zero
	  if (discount <= 0) {
	    return error.num;
	  }

	  // Return error if settlement is greater than maturity
	  if (settlement > maturity) {
	    return error.num;
	  }

	  // Return error if maturity is more than one year after settlement
	  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
	    return error.num;
	  }

	  // Return bond-equivalent yield
	  return 100 * (1 - discount * dateTime.DAYS360(settlement, maturity, false) / 360);
	};

	exports.TBILLYIELD = function(settlement, maturity, price) {
	  settlement = utils.parseDate(settlement);
	  maturity = utils.parseDate(maturity);
	  price = utils.parseNumber(price);
	  if (utils.anyIsError(settlement, maturity, price)) {
	    return error.value;
	  }

	  // Return error if price is lower than or equal to zero
	  if (price <= 0) {
	    return error.num;
	  }

	  // Return error if settlement is greater than maturity
	  if (settlement > maturity) {
	    return error.num;
	  }

	  // Return error if maturity is more than one year after settlement
	  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
	    return error.num;
	  }

	  // Return bond-equivalent yield
	  return (100 - price) * 360 / (price * dateTime.DAYS360(settlement, maturity, false));
	};

	// TODO
	exports.VDB = function() {
	 throw new Error('VDB is not implemented');
	};


	exports.XIRR = function(values, dates, guess) {
	  // Credits: algorithm inspired by Apache OpenOffice

	  values = utils.parseNumberArray(utils.flatten(values));
	  dates = utils.parseDateArray(utils.flatten(dates));
	  guess = utils.parseNumber(guess);
	  if (utils.anyIsError(values, dates, guess)) {
	    return error.value;
	  }

	  // Calculates the resulting amount
	  var irrResult = function(values, dates, rate) {
	    var r = rate + 1;
	    var result = values[0];
	    for (var i = 1; i < values.length; i++) {
	      result += values[i] / Math.pow(r, dateTime.DAYS(dates[i], dates[0]) / 365);
	    }
	    return result;
	  };

	  // Calculates the first derivation
	  var irrResultDeriv = function(values, dates, rate) {
	    var r = rate + 1;
	    var result = 0;
	    for (var i = 1; i < values.length; i++) {
	      var frac = dateTime.DAYS(dates[i], dates[0]) / 365;
	      result -= frac * values[i] / Math.pow(r, frac + 1);
	    }
	    return result;
	  };

	  // Check that values contains at least one positive value and one negative value
	  var positive = false;
	  var negative = false;
	  for (var i = 0; i < values.length; i++) {
	    if (values[i] > 0) {
	      positive = true;
	    }
	    if (values[i] < 0) {
	      negative = true;
	    }
	  }

	  // Return error if values does not contain at least one positive value and one negative value
	  if (!positive || !negative) {
	    return error.num;
	  }

	  // Initialize guess and resultRate
	  guess = guess || 0.1;
	  var resultRate = guess;

	  // Set maximum epsilon for end of iteration
	  var epsMax = 1e-10;

	  // Implement Newton's method
	  var newRate, epsRate, resultValue;
	  var contLoop = true;
	  do {
	    resultValue = irrResult(values, dates, resultRate);
	    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
	    epsRate = Math.abs(newRate - resultRate);
	    resultRate = newRate;
	    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
	  } while (contLoop);

	  // Return internal rate of return
	  return resultRate;
	};

	exports.XNPV = function(rate, values, dates) {
	  rate = utils.parseNumber(rate);
	  values = utils.parseNumberArray(utils.flatten(values));
	  dates = utils.parseDateArray(utils.flatten(dates));
	  if (utils.anyIsError(rate, values, dates)) {
	    return error.value;
	  }

	  var result = 0;
	  for (var i = 0; i < values.length; i++) {
	    result += values[i] / Math.pow(1 + rate, dateTime.DAYS(dates[i], dates[0]) / 365);
	  }
	  return result;
	};

	// TODO
	exports.YIELD = function() {
	 throw new Error('YIELD is not implemented');
	};

	// TODO
	exports.YIELDDISC = function() {
	 throw new Error('YIELDDISC is not implemented');
	};

	// TODO
	exports.YIELDMAT = function() {
	 throw new Error('YIELDMAT is not implemented');
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(5);

	exports.MATCH = function(lookupValue, lookupArray, matchType) {
	  if (!lookupValue && !lookupArray) {
	    return error.na;
	  }

	  if (arguments.length === 2) {
	    matchType = 1;
	  }
	  if (!(lookupArray instanceof Array)) {
	    return error.na;
	  }

	  if (matchType !== -1 && matchType !== 0 && matchType !== 1) {
	    return error.na;
	  }
	  var index;
	  var indexValue;
	  for (var idx = 0; idx < lookupArray.length; idx++) {
	    if (matchType === 1) {
	      if (lookupArray[idx] === lookupValue) {
	        return idx + 1;
	      } else if (lookupArray[idx] < lookupValue) {
	        if (!indexValue) {
	          index = idx + 1;
	          indexValue = lookupArray[idx];
	        } else if (lookupArray[idx] > indexValue) {
	          index = idx + 1;
	          indexValue = lookupArray[idx];
	        }
	      }
	    } else if (matchType === 0) {
	      if (typeof lookupValue === 'string') {
	        lookupValue = lookupValue.replace(/\?/g, '.');
	        if (lookupArray[idx].toLowerCase().match(lookupValue.toLowerCase())) {
	          return idx + 1;
	        }
	      } else {
	        if (lookupArray[idx] === lookupValue) {
	          return idx + 1;
	        }
	      }
	    } else if (matchType === -1) {
	      if (lookupArray[idx] === lookupValue) {
	        return idx + 1;
	      } else if (lookupArray[idx] > lookupValue) {
	        if (!indexValue) {
	          index = idx + 1;
	          indexValue = lookupArray[idx];
	        } else if (lookupArray[idx] < indexValue) {
	          index = idx + 1;
	          indexValue = lookupArray[idx];
	        }
	      }
	    }
	  }

	  return index ? index : error.na;
	};

/***/ }
/******/ ])
});
;
},{"jStat":354,"numeral":355,"numeric":356}],345:[function(require,module,exports){
exports.nil = new Error('#NULL!');
exports.div0 = new Error('#DIV/0!');
exports.value = new Error('#VALUE?');
exports.ref = new Error('#REF!');
exports.name = new Error('#NAME?');
exports.num = new Error('#NUM!');
exports.na = new Error('#N/A');
exports.error = new Error('#ERROR!');
exports.data = new Error('#GETTING_DATA');

},{}],346:[function(require,module,exports){
var error = require('./error');

function flattenShallow(array) {
  if (!array || !array.reduce) { return array; }
  return array.reduce(function(a, b) {
    var aIsArray = Array.isArray(a);
    var bIsArray = Array.isArray(b);
    if (aIsArray && bIsArray ) {
      return a.concat(b);
    }
    if (aIsArray) {
      a.push(b);
      return a;
    }
    if (bIsArray) {
      return [a].concat(b);
    }
    return [a, b];
  });
}

function isFlat(array) {
  if (!array) { return false; }
  for (var i = 0; i < array.length; ++i) {
    if (Array.isArray(array[i])) {
      return false;
    }
  }
  return true;
}

exports.flatten = function() {
  var result = exports.argsToArray.apply(null, arguments);
  while (!isFlat(result)) {
    result = flattenShallow(result);
  }
  return result;
};

exports.argsToArray = function(args) {
  return Array.prototype.slice.call(args, 0);
};

exports.numbers = function() {
  var possibleNumbers = this.flatten.apply(null, arguments);
  return possibleNumbers.filter(function(el) {
    return typeof el === 'number';
  });
};

exports.cleanFloat = function(number) {
  var power = 1e14;
  return Math.round(number * power) / power;
};

exports.parseBool = function(bool) {
  if (typeof bool === 'boolean') {
    return bool;
  }

  if (bool instanceof Error) {
    return bool;
  }

  if (typeof bool === 'number') {
    return bool !== 0;
  }

  if (typeof bool === 'string') {
    var up = bool.toUpperCase();
    if (up === 'TRUE') {
      return true;
    }

    if (up === 'FALSE') {
      return false;
    }
  }

  if (bool instanceof Date && !isNaN(bool)) {
    return true;
  }

  return error.value;
};

exports.parseNumber = function(string) {
  if (string === undefined || string === '') {
    return error.value;
  }
  if (!isNaN(string)) {
    return parseFloat(string);
  }
  return error.value;
};

exports.parseNumberArray = function(arr) {
  var len;
  if (!arr || (len = arr.length) === 0) {
    return error.value;
  }
  var parsed;
  while (len--) {
    parsed = exports.parseNumber(arr[len]);
    if (parsed === error.value) {
      return parsed;
    }
    arr[len] = parsed;
  }
  return arr;
};

exports.parseMatrix = function(matrix) {
  var n;
  if (!matrix || (n = matrix.length) === 0) {
    return error.value;
  }
  var pnarr;
  for (var i = 0; i < matrix.length; i++) {
    pnarr = exports.parseNumberArray(matrix[i]);
    matrix[i] = pnarr;
    if (pnarr instanceof Error) {
      return pnarr;
    }
  }
  return matrix;
};

var d1900 = new Date(1900, 0, 1);
exports.parseDate = function(date) {
  if (!isNaN(date)) {
    if (date instanceof Date) {
      return new Date(date);
    }
    var d = parseInt(date, 10);
    if (d < 0) {
      return error.num;
    }
    if (d <= 60) {
      return new Date(d1900.getTime() + (d - 1) * 86400000);
    }
    return new Date(d1900.getTime() + (d - 2) * 86400000);
  }
  if (typeof date === 'string') {
    date = new Date(date);
    if (!isNaN(date)) {
      return date;
    }
  }
  return error.value;
};

exports.parseDateArray = function(arr) {
  var len = arr.length;
  var parsed;
  while (len--) {
    parsed = this.parseDate(arr[len]);
    if (parsed === error.value) {
      return parsed;
    }
    arr[len] = parsed;
  }
  return arr;
};

exports.anyIsError = function() {
  var n = arguments.length;
  while (n--) {
    if (arguments[n] instanceof Error) {
      return true;
    }
  }
  return false;
};

exports.arrayValuesToNumbers = function(arr) {
  var n = arr.length;
  var el;
  while (n--) {
    el = arr[n];
    if (typeof el === 'number') {
      continue;
    }
    if (el === true) {
      arr[n] = 1;
      continue;
    }
    if (el === false) {
      arr[n] = 0;
      continue;
    }
    if (typeof el === 'string') {
      var number = this.parseNumber(el);
      if (number instanceof Error) {
        arr[n] = 0;
      } else {
        arr[n] = number;
      }
    }
  }
  return arr;
};

exports.rest = function(array, idx) {
  idx = idx || 1;
  if (!array || typeof array.slice !== 'function') {
    return array;
  }
  return array.slice(idx);
};

exports.initial = function(array, idx) {
  idx = idx || 1;
  if (!array || typeof array.slice !== 'function') {
    return array;
  }
  return array.slice(0, array.length - idx);
};
},{"./error":345}],347:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],348:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":347}],349:[function(require,module,exports){
var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":348}],350:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class /;
var isES6ClassFn = function isES6ClassFn(value) {
	try {
		var fnStr = fnToStr.call(value);
		var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
		var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
		var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
		return constructorRegex.test(spaceStripped);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionObject(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isCallable(value) {
	if (!value) { return false; }
	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
	if (hasToStringTag) { return tryFunctionObject(value); }
	if (isES6ClassFn(value)) { return false; }
	var strClass = toStr.call(value);
	return strClass === fnClass || strClass === genClass;
};

},{}],351:[function(require,module,exports){
'use strict';

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateObject(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) { return false; }
	return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
};

},{}],352:[function(require,module,exports){
'use strict';

var has = require('has');
var regexExec = RegExp.prototype.exec;
var gOPD = Object.getOwnPropertyDescriptor;

var tryRegexExecCall = function tryRegexExec(value) {
	try {
		var lastIndex = value.lastIndex;
		value.lastIndex = 0;

		regexExec.call(value);
		return true;
	} catch (e) {
		return false;
	} finally {
		value.lastIndex = lastIndex;
	}
};
var toStr = Object.prototype.toString;
var regexClass = '[object RegExp]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isRegex(value) {
	if (!value || typeof value !== 'object') {
		return false;
	}
	if (!hasToStringTag) {
		return toStr.call(value) === regexClass;
	}

	var descriptor = gOPD(value, 'lastIndex');
	var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
	if (!hasLastIndexDataProperty) {
		return false;
	}

	return tryRegexExecCall(value);
};

},{"has":349}],353:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

if (hasSymbols) {
	var symToStr = Symbol.prototype.toString;
	var symStringRegex = /^Symbol\(.*\)$/;
	var isSymbolObject = function isSymbolObject(value) {
		if (typeof value.valueOf() !== 'symbol') { return false; }
		return symStringRegex.test(symToStr.call(value));
	};
	module.exports = function isSymbol(value) {
		if (typeof value === 'symbol') { return true; }
		if (toStr.call(value) !== '[object Symbol]') { return false; }
		try {
			return isSymbolObject(value);
		} catch (e) {
			return false;
		}
	};
} else {
	module.exports = function isSymbol(value) {
		// this environment does not support Symbols.
		return false;
	};
}

},{}],354:[function(require,module,exports){
this.j$ = this.jStat = (function(Math, undefined) {

// For quick reference.
var concat = Array.prototype.concat;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

// Calculate correction for IEEE error
// TODO: This calculation can be improved.
function calcRdx(n, m) {
  var val = n > m ? n : m;
  return Math.pow(10,
                  17 - ~~(Math.log(((val > 0) ? val : -val)) * Math.LOG10E));
}


var isArray = Array.isArray || function isArray(arg) {
  return toString.call(arg) === '[object Array]';
};


function isFunction(arg) {
  return toString.call(arg) === '[object Function]';
}


function isNumber(arg) {
  return typeof arg === 'number' && arg === arg;
}


// Converts the jStat matrix to vector.
function toVector(arr) {
  return concat.apply([], arr);
}


// The one and only jStat constructor.
function jStat() {
  return new jStat._init(arguments);
}


// TODO: Remove after all references in src files have been removed.
jStat.fn = jStat.prototype;


// By separating the initializer from the constructor it's easier to handle
// always returning a new instance whether "new" was used or not.
jStat._init = function _init(args) {
  var i;

  // If first argument is an array, must be vector or matrix.
  if (isArray(args[0])) {
    // Check if matrix.
    if (isArray(args[0][0])) {
      // See if a mapping function was also passed.
      if (isFunction(args[1]))
        args[0] = jStat.map(args[0], args[1]);
      // Iterate over each is faster than this.push.apply(this, args[0].
      for (i = 0; i < args[0].length; i++)
        this[i] = args[0][i];
      this.length = args[0].length;

    // Otherwise must be a vector.
    } else {
      this[0] = isFunction(args[1]) ? jStat.map(args[0], args[1]) : args[0];
      this.length = 1;
    }

  // If first argument is number, assume creation of sequence.
  } else if (isNumber(args[0])) {
    this[0] = jStat.seq.apply(null, args);
    this.length = 1;

  // Handle case when jStat object is passed to jStat.
  } else if (args[0] instanceof jStat) {
    // Duplicate the object and pass it back.
    return jStat(args[0].toArray());

  // Unexpected argument value, return empty jStat object.
  // TODO: This is strange behavior. Shouldn't this throw or some such to let
  // the user know they had bad arguments?
  } else {
    this[0] = [];
    this.length = 1;
  }

  return this;
};
jStat._init.prototype = jStat.prototype;
jStat._init.constructor = jStat;


// Utility functions.
// TODO: for internal use only?
jStat.utils = {
  calcRdx: calcRdx,
  isArray: isArray,
  isFunction: isFunction,
  isNumber: isNumber,
  toVector: toVector
};


// Easily extend the jStat object.
// TODO: is this seriously necessary?
jStat.extend = function extend(obj) {
  var i, j;

  if (arguments.length === 1) {
    for (j in obj)
      jStat[j] = obj[j];
    return this;
  }

  for (i = 1; i < arguments.length; i++) {
    for (j in arguments[i])
      obj[j] = arguments[i][j];
  }

  return obj;
};


// Returns the number of rows in the matrix.
jStat.rows = function rows(arr) {
  return arr.length || 1;
};


// Returns the number of columns in the matrix.
jStat.cols = function cols(arr) {
  return arr[0].length || 1;
};


// Returns the dimensions of the object { rows: i, cols: j }
jStat.dimensions = function dimensions(arr) {
  return {
    rows: jStat.rows(arr),
    cols: jStat.cols(arr)
  };
};


// Returns a specified row as a vector
jStat.row = function row(arr, index) {
  return arr[index];
};


// Returns the specified column as a vector
jStat.col = function cols(arr, index) {
  var column = new Array(arr.length);
  for (var i = 0; i < arr.length; i++)
    column[i] = [arr[i][index]];
  return column;
};


// Returns the diagonal of the matrix
jStat.diag = function diag(arr) {
  var nrow = jStat.rows(arr);
  var res = new Array(nrow);
  for (var row = 0; row < nrow; row++)
    res[row] = [arr[row][row]];
  return res;
};


// Returns the anti-diagonal of the matrix
jStat.antidiag = function antidiag(arr) {
  var nrow = jStat.rows(arr) - 1;
  var res = new Array(nrow);
  for (var i = 0; nrow >= 0; nrow--, i++)
    res[i] = [arr[i][nrow]];
  return res;
};

// Transpose a matrix or array.
jStat.transpose = function transpose(arr) {
  var obj = [];
  var objArr, rows, cols, j, i;

  // Make sure arr is in matrix format.
  if (!isArray(arr[0]))
    arr = [arr];

  rows = arr.length;
  cols = arr[0].length;

  for (i = 0; i < cols; i++) {
    objArr = new Array(rows);
    for (j = 0; j < rows; j++)
      objArr[j] = arr[j][i];
    obj.push(objArr);
  }

  // If obj is vector, return only single array.
  return obj.length === 1 ? obj[0] : obj;
};


// Map a function to an array or array of arrays.
// "toAlter" is an internal variable.
jStat.map = function map(arr, func, toAlter) {
  var row, nrow, ncol, res, col;

  if (!isArray(arr[0]))
    arr = [arr];

  nrow = arr.length;
  ncol = arr[0].length;
  res = toAlter ? arr : new Array(nrow);

  for (row = 0; row < nrow; row++) {
    // if the row doesn't exist, create it
    if (!res[row])
      res[row] = new Array(ncol);
    for (col = 0; col < ncol; col++)
      res[row][col] = func(arr[row][col], row, col);
  }

  return res.length === 1 ? res[0] : res;
};


// Destructively alter an array.
jStat.alter = function alter(arr, func) {
  return jStat.map(arr, func, true);
};


// Generate a rows x cols matrix according to the supplied function.
jStat.create = function  create(rows, cols, func) {
  var res = new Array(rows);
  var i, j;

  if (isFunction(cols)) {
    func = cols;
    cols = rows;
  }

  for (i = 0; i < rows; i++) {
    res[i] = new Array(cols);
    for (j = 0; j < cols; j++)
      res[i][j] = func(i, j);
  }

  return res;
};


function retZero() { return 0; }


// Generate a rows x cols matrix of zeros.
jStat.zeros = function zeros(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retZero);
};


function retOne() { return 1; }


// Generate a rows x cols matrix of ones.
jStat.ones = function ones(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retOne);
};


// Generate a rows x cols matrix of uniformly random numbers.
jStat.rand = function rand(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, Math.random);
};


function retIdent(i, j) { return i === j ? 1 : 0; }


// Generate an identity matrix of size row x cols.
jStat.identity = function identity(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retIdent);
};


// Tests whether a matrix is symmetric
jStat.symmetric = function symmetric(arr) {
  var issymmetric = true;
  var size = arr.length;
  var row, col;

  if (arr.length !== arr[0].length)
    return false;

  for (row = 0; row < size; row++) {
    for (col = 0; col < size; col++)
      if (arr[col][row] !== arr[row][col])
        return false;
  }

  return true;
};


// Set all values to zero.
jStat.clear = function clear(arr) {
  return jStat.alter(arr, retZero);
};


// Generate sequence.
jStat.seq = function seq(min, max, length, func) {
  if (!isFunction(func))
    func = false;

  var arr = [];
  var hival = calcRdx(min, max);
  var step = (max * hival - min * hival) / ((length - 1) * hival);
  var current = min;
  var cnt;

  // Current is assigned using a technique to compensate for IEEE error.
  // TODO: Needs better implementation.
  for (cnt = 0;
       current <= max;
       cnt++, current = (min * hival + step * hival * cnt) / hival) {
    arr.push((func ? func(current, cnt) : current));
  }

  return arr;
};


// TODO: Go over this entire implementation. Seems a tragic waste of resources
// doing all this work. Instead, and while ugly, use new Function() to generate
// a custom function for each static method.

// Quick reference.
var jProto = jStat.prototype;

// Default length.
jProto.length = 0;

// For internal use only.
// TODO: Check if they're actually used, and if they are then rename them
// to _*
jProto.push = Array.prototype.push;
jProto.sort = Array.prototype.sort;
jProto.splice = Array.prototype.splice;
jProto.slice = Array.prototype.slice;


// Return a clean array.
jProto.toArray = function toArray() {
  return this.length > 1 ? slice.call(this) : slice.call(this)[0];
};


// Map a function to a matrix or vector.
jProto.map = function map(func, toAlter) {
  return jStat(jStat.map(this, func, toAlter));
};


// Destructively alter an array.
jProto.alter = function alter(func) {
  jStat.alter(this, func);
  return this;
};


// Extend prototype with methods that have no argument.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function(func) {
      var self = this,
      results;
      // Check for callback.
      if (func) {
        setTimeout(function() {
          func.call(self, jProto[passfunc].call(self));
        });
        return this;
      }
      results = jStat[passfunc](this);
      return isArray(results) ? jStat(results) : results;
    };
  })(funcs[i]);
})('transpose clear symmetric rows cols dimensions diag antidiag'.split(' '));


// Extend prototype with methods that have one argument.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function(index, func) {
      var self = this;
      // check for callback
      if (func) {
        setTimeout(function() {
          func.call(self, jProto[passfunc].call(self, index));
        });
        return this;
      }
      return jStat(jStat[passfunc](this, index));
    };
  })(funcs[i]);
})('row col'.split(' '));


// Extend prototype with simple shortcut methods.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = new Function(
        'return jStat(jStat.' + passfunc + '.apply(null, arguments));');
  })(funcs[i]);
})('create zeros ones rand identity'.split(' '));


// Exposing jStat.
return jStat;

}(Math));
(function(jStat, Math) {

var isFunction = jStat.utils.isFunction;

// Ascending functions for sort
function ascNum(a, b) { return a - b; }

function clip(arg, min, max) {
  return Math.max(min, Math.min(arg, max));
}


// sum of an array
jStat.sum = function sum(arr) {
  var sum = 0;
  var i = arr.length;
  var tmp;
  while (--i >= 0)
    sum += arr[i];
  return sum;
};


// sum squared
jStat.sumsqrd = function sumsqrd(arr) {
  var sum = 0;
  var i = arr.length;
  while (--i >= 0)
    sum += arr[i] * arr[i];
  return sum;
};


// sum of squared errors of prediction (SSE)
jStat.sumsqerr = function sumsqerr(arr) {
  var mean = jStat.mean(arr);
  var sum = 0;
  var i = arr.length;
  var tmp;
  while (--i >= 0) {
    tmp = arr[i] - mean;
    sum += tmp * tmp;
  }
  return sum;
};


// product of an array
jStat.product = function product(arr) {
  var prod = 1;
  var i = arr.length;
  while (--i >= 0)
    prod *= arr[i];
  return prod;
};


// minimum value of an array
jStat.min = function min(arr) {
  var low = arr[0];
  var i = 0;
  while (++i < arr.length)
    if (arr[i] < low)
      low = arr[i];
  return low;
};


// maximum value of an array
jStat.max = function max(arr) {
  var high = arr[0];
  var i = 0;
  while (++i < arr.length)
    if (arr[i] > high)
      high = arr[i];
  return high;
};


// mean value of an array
jStat.mean = function mean(arr) {
  return jStat.sum(arr) / arr.length;
};


// mean squared error (MSE)
jStat.meansqerr = function meansqerr(arr) {
  return jStat.sumsqerr(arr) / arr.length;
};


// geometric mean of an array
jStat.geomean = function geomean(arr) {
  return Math.pow(jStat.product(arr), 1 / arr.length);
};


// median of an array
jStat.median = function median(arr) {
  var arrlen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  // check if array is even or odd, then return the appropriate
  return !(arrlen & 1)
    ? (_arr[(arrlen / 2) - 1 ] + _arr[(arrlen / 2)]) / 2
    : _arr[(arrlen / 2) | 0 ];
};


// cumulative sum of an array
jStat.cumsum = function cumsum(arr) {
  var len = arr.length;
  var sums = new Array(len);
  var i;
  sums[0] = arr[0];
  for (i = 1; i < len; i++)
    sums[i] = sums[i - 1] + arr[i];
  return sums;
};


// successive differences of a sequence
jStat.diff = function diff(arr) {
  var diffs = [];
  var arrLen = arr.length;
  var i;
  for (i = 1; i < arrLen; i++)
    diffs.push(arr[i] - arr[i - 1]);
  return diffs;
};


// mode of an array
// if there are multiple modes of an array, return all of them
// is this the appropriate way of handling it?
jStat.mode = function mode(arr) {
  var arrLen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  var count = 1;
  var maxCount = 0;
  var numMaxCount = 0;
  var mode_arr = [];
  var i;

  for (i = 0; i < arrLen; i++) {
    if (_arr[i] === _arr[i + 1]) {
      count++;
    } else {
      if (count > maxCount) {
        mode_arr = [_arr[i]];
        maxCount = count;
        numMaxCount = 0;
      }
      // are there multiple max counts
      else if (count === maxCount) {
        mode_arr.push(_arr[i]);
        numMaxCount++;
      }
      // resetting count for new value in array
      count = 1;
    }
  }

  return numMaxCount === 0 ? mode_arr[0] : mode_arr;
};


// range of an array
jStat.range = function range(arr) {
  return jStat.max(arr) - jStat.min(arr);
};

// variance of an array
// flag indicates population vs sample
jStat.variance = function variance(arr, flag) {
  return jStat.sumsqerr(arr) / (arr.length - (flag ? 1 : 0));
};


// standard deviation of an array
// flag indicates population vs sample
jStat.stdev = function stdev(arr, flag) {
  return Math.sqrt(jStat.variance(arr, flag));
};


// mean deviation (mean absolute deviation) of an array
jStat.meandev = function meandev(arr) {
  var devSum = 0;
  var mean = jStat.mean(arr);
  var i;
  for (i = arr.length - 1; i >= 0; i--)
    devSum += Math.abs(arr[i] - mean);
  return devSum / arr.length;
};


// median deviation (median absolute deviation) of an array
jStat.meddev = function meddev(arr) {
  var devSum = 0;
  var median = jStat.median(arr);
  var i;
  for (i = arr.length - 1; i >= 0; i--)
    devSum += Math.abs(arr[i] - median);
  return devSum / arr.length;
};


// coefficient of variation
jStat.coeffvar = function coeffvar(arr) {
  return jStat.stdev(arr) / jStat.mean(arr);
};


// quartiles of an array
jStat.quartiles = function quartiles(arr) {
  var arrlen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  return [
    _arr[ Math.round((arrlen) / 4) - 1 ],
    _arr[ Math.round((arrlen) / 2) - 1 ],
    _arr[ Math.round((arrlen) * 3 / 4) - 1 ]
  ];
};


// Arbitary quantiles of an array. Direct port of the scipy.stats
// implementation by Pierre GF Gerard-Marchant.
jStat.quantiles = function quantiles(arr, quantilesArray, alphap, betap) {
  var sortedArray = arr.slice().sort(ascNum);
  var quantileVals = [quantilesArray.length];
  var n = arr.length;
  var i, p, m, aleph, k, gamma;

  if (typeof alphap === 'undefined')
    alphap = 3 / 8;
  if (typeof betap === 'undefined')
    betap = 3 / 8;

  for (i = 0; i < quantilesArray.length; i++) {
    p = quantilesArray[i];
    m = alphap + p * (1 - alphap - betap);
    aleph = n * p + m;
    k = Math.floor(clip(aleph, 1, n - 1));
    gamma = clip(aleph - k, 0, 1);
    quantileVals[i] = (1 - gamma) * sortedArray[k - 1] + gamma * sortedArray[k];
  }

  return quantileVals;
};

// The percentile rank of score in a given array. Returns the percentage
// of all values in the input array that are less than (kind='strict') or
// less or equal than (kind='weak') score. Default is weak.
jStat.percentileOfScore = function percentileOfScore(arr, score, kind) {
  var counter = 0;
  var len = arr.length;
  var strict = false;
  var value, i;

  if (kind === 'strict')
    strict = true;

  for (i = 0; i < len; i++) {
    value = arr[i];
    if ((strict && value < score) ||
        (!strict && value <= score)) {
      counter++;
    }
  }

  return counter / len;
};

// covariance of two arrays
jStat.covariance = function covariance(arr1, arr2) {
  var u = jStat.mean(arr1);
  var v = jStat.mean(arr2);
  var arr1Len = arr1.length;
  var sq_dev = new Array(arr1Len);
  var i;

  for (i = 0; i < arr1Len; i++)
    sq_dev[i] = (arr1[i] - u) * (arr2[i] - v);

  return jStat.sum(sq_dev) / (arr1Len - 1);
};


// (pearson's) population correlation coefficient, rho
jStat.corrcoeff = function corrcoeff(arr1, arr2) {
  return jStat.covariance(arr1, arr2) /
      jStat.stdev(arr1, 1) /
      jStat.stdev(arr2, 1);
};


var jProto = jStat.prototype;


// Extend jProto with method for calculating cumulative sums, as it does not
// run again in case of true.
// If a matrix is passed, automatically assume operation should be done on the
// columns.
jProto.cumsum = function(fullbool, func) {
  var arr = [];
  var i = 0;
  var tmpthis = this;

  // Assignment reassignation depending on how parameters were passed in.
  if (isFunction(fullbool)) {
    func = fullbool;
    fullbool = false;
  }

  // Check if a callback was passed with the function.
  if (func) {
    setTimeout(function() {
      func.call(tmpthis, jProto.cumsum.call(tmpthis, fullbool));
    });
    return this;
  }

  // Check if matrix and run calculations.
  if (this.length > 1) {
    tmpthis = fullbool === true ? this : this.transpose();
    for (; i < tmpthis.length; i++)
      arr[i] = jStat.cumsum(tmpthis[i]);
    return arr;
  }

  return jStat.cumsum(this[0], fullbool);
};


// Extend jProto with methods which don't require arguments and work on columns.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    // If a matrix is passed, automatically assume operation should be done on
    // the columns.
    jProto[passfunc] = function(fullbool, func) {
      var arr = [];
      var i = 0;
      var tmpthis = this;
      // Assignment reassignation depending on how parameters were passed in.
      if (isFunction(fullbool)) {
        func = fullbool;
        fullbool = false;
      }
      // Check if a callback was passed with the function.
      if (func) {
        setTimeout(function() {
          func.call(tmpthis, jProto[passfunc].call(tmpthis, fullbool));
        });
        return this;
      }
      // Check if matrix and run calculations.
      if (this.length > 1) {
        tmpthis = fullbool === true ? this : this.transpose();
        for (; i < tmpthis.length; i++)
          arr[i] = jStat[passfunc](tmpthis[i]);
        return fullbool === true
            ? jStat[passfunc](jStat.utils.toVector(arr))
            : arr;
      }
      // Pass fullbool if only vector, not a matrix. for variance and stdev.
      return jStat[passfunc](this[0], fullbool);
    };
  })(funcs[i]);
})(('sum sumsqrd sumsqerr product min max mean meansqerr geomean median diff ' +
    'mode range variance stdev meandev meddev coeffvar quartiles').split(' '));


// Extend jProto with functions that take arguments. Operations on matrices are
// done on columns.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function() {
      var arr = [];
      var i = 0;
      var tmpthis = this;
      var args = Array.prototype.slice.call(arguments);

      // If the last argument is a function, we assume it's a callback; we
      // strip the callback out and call the function again.
      if (isFunction(args[args.length - 1])) {
        var callbackFunction = args[args.length - 1];
        var argsToPass = args.slice(0, args.length - 1);

        setTimeout(function() {
          callbackFunction.call(tmpthis,
                                jProto[passfunc].apply(tmpthis, argsToPass));
        });
        return this;

      // Otherwise we curry the function args and call normally.
      } else {
        var callbackFunction = undefined;
        var curriedFunction = function curriedFunction(vector) {
          return jStat[passfunc].apply(tmpthis, [vector].concat(args));
        }
      }

      // If this is a matrix, run column-by-column.
      if (this.length > 1) {
        tmpthis = tmpthis.transpose();
        for (; i < tmpthis.length; i++)
          arr[i] = curriedFunction(tmpthis[i]);
        return arr;
      }

      // Otherwise run on the vector.
      return curriedFunction(this[0]);
    };
  })(funcs[i]);
})('quantiles percentileOfScore'.split(' '));

}(this.jStat, Math));
// Special functions //
(function(jStat, Math) {

// Log-gamma function
jStat.gammaln = function gammaln(x) {
  var j = 0;
  var cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  var ser = 1.000000000190015;
  var xx, y, tmp;
  tmp = (y = xx = x) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++)
    ser += cof[j] / ++y;
  return Math.log(2.5066282746310005 * ser / xx) - tmp;
};


// gamma of x
jStat.gammafn = function gammafn(x) {
  var p = [-1.716185138865495, 24.76565080557592, -379.80425647094563,
           629.3311553128184, 866.9662027904133, -31451.272968848367,
           -36144.413418691176, 66456.14382024054
  ];
  var q = [-30.8402300119739, 315.35062697960416, -1015.1563674902192,
           -3107.771671572311, 22538.118420980151, 4755.8462775278811,
           -134659.9598649693, -115132.2596755535];
  var fact = false;
  var n = 0;
  var xden = 0;
  var xnum = 0;
  var y = x;
  var i, z, yi, res, sum, ysq;
  if (y <= 0) {
    res = y % 1 + 3.6e-16;
    if (res) {
      fact = (!(y & 1) ? 1 : -1) * Math.PI / Math.sin(Math.PI * res);
      y = 1 - y;
    } else {
      return Infinity;
    }
  }
  yi = y;
  if (y < 1) {
    z = y++;
  } else {
    z = (y -= n = (y | 0) - 1) - 1;
  }
  for (i = 0; i < 8; ++i) {
    xnum = (xnum + p[i]) * z;
    xden = xden * z + q[i];
  }
  res = xnum / xden + 1;
  if (yi < y) {
    res /= yi;
  } else if (yi > y) {
    for (i = 0; i < n; ++i) {
      res *= y;
      y++;
    }
  }
  if (fact) {
    res = fact / res;
  }
  return res;
};


// lower incomplete gamma function P(a,x)
jStat.gammap = function gammap(a, x) {
  var aln = jStat.gammaln(a);
  var ap = a;
  var sum = 1 / a;
  var del = sum;
  var b = x + 1 - a;
  var c = 1 / 1.0e-30;
  var d = 1 / b;
  var h = d;
  var i = 1;
  // calculate maximum number of itterations required for a
  var ITMAX = -~(Math.log((a >= 1) ? a : 1 / a) * 8.5 + a * 0.4 + 17);
  var an, endval;

  if (x < 0 || a <= 0) {
    return NaN;
  } else if (x < a + 1) {
    for (; i <= ITMAX; i++) {
      sum += del *= x / ++ap;
    }
    return sum * Math.exp(-x + a * Math.log(x) - (aln));
  }

  for (; i <= ITMAX; i++) {
    an = -i * (i - a);
    b += 2;
    d = an * d + b;
    c = b + an / c;
    d = 1 / d;
    h *= d * c;
  }

  return 1 - h * Math.exp(-x + a * Math.log(x) - (aln));
};


// natural log factorial of n
jStat.factorialln = function factorialln(n) {
  return n < 0 ? NaN : jStat.gammaln(n + 1);
};

// factorial of n
jStat.factorial = function factorial(n) {
  return n < 0 ? NaN : jStat.gammafn(n + 1);
};

// combinations of n, m
jStat.combination = function combination(n, m) {
  // make sure n or m don't exceed the upper limit of usable values
  return (n > 170 || m > 170)
      ? Math.exp(jStat.combinationln(n, m))
      : (jStat.factorial(n) / jStat.factorial(m)) / jStat.factorial(n - m);
};


jStat.combinationln = function combinationln(n, m){
  return jStat.factorialln(n) - jStat.factorialln(m) - jStat.factorialln(n - m);
};


// permutations of n, m
jStat.permutation = function permutation(n, m) {
  return jStat.factorial(n) / jStat.factorial(n - m);
};


// beta function
jStat.betafn = function betafn(x, y) {
  // ensure arguments are positive
  if (x <= 0 || y <= 0)
    return undefined;
  // make sure x + y doesn't exceed the upper limit of usable values
  return (x + y > 170)
      ? Math.exp(jStat.betaln(x, y))
      : jStat.gammafn(x) * jStat.gammafn(y) / jStat.gammafn(x + y);
};


// natural logarithm of beta function
jStat.betaln = function betaln(x, y) {
  return jStat.gammaln(x) + jStat.gammaln(y) - jStat.gammaln(x + y);
};


// Evaluates the continued fraction for incomplete beta function by modified
// Lentz's method.
jStat.betacf = function betacf(x, a, b) {
  var fpmin = 1e-30;
  var m = 1;
  var qab = a + b;
  var qap = a + 1;
  var qam = a - 1;
  var c = 1;
  var d = 1 - qab * x / qap;
  var m2, aa, del, h;

  // These q's will be used in factors that occur in the coefficients
  if (Math.abs(d) < fpmin)
    d = fpmin;
  d = 1 / d;
  h = d;

  for (; m <= 100; m++) {
    m2 = 2 * m;
    aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    // One step (the even one) of the recurrence
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin)
      d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin)
      c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    // Next step of the recurrence (the odd one)
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin)
      d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin)
      c = fpmin;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < 3e-7)
      break;
  }

  return h;
};


// Returns the inverse incomplte gamma function
jStat.gammapinv = function gammapinv(p, a) {
  var j = 0;
  var a1 = a - 1;
  var EPS = 1e-8;
  var gln = jStat.gammaln(a);
  var x, err, t, u, pp, lna1, afac;

  if (p >= 1)
    return Math.max(100, a + 100 * Math.sqrt(a));
  if (p <= 0)
    return 0;
  if (a > 1) {
    lna1 = Math.log(a1);
    afac = Math.exp(a1 * (lna1 - 1) - gln);
    pp = (p < 0.5) ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
    if (p < 0.5)
      x = -x;
    x = Math.max(1e-3,
                 a * Math.pow(1 - 1 / (9 * a) - x / (3 * Math.sqrt(a)), 3));
  } else {
    t = 1 - a * (0.253 + a * 0.12);
    if (p < t)
      x = Math.pow(p / t, 1 / a);
    else
      x = 1 - Math.log(1 - (p - t) / (1 - t));
  }

  for(; j < 12; j++) {
    if (x <= 0)
      return 0;
    err = jStat.gammap(a, x) - p;
    if (a > 1)
      t = afac * Math.exp(-(x - a1) + a1 * (Math.log(x) - lna1));
    else
      t = Math.exp(-x + a1 * Math.log(x) - gln);
    u = err / t;
    x -= (t = u / (1 - 0.5 * Math.min(1, u * ((a - 1) / x - 1))));
    if (x <= 0)
      x = 0.5 * (x + t);
    if (Math.abs(t) < EPS * x)
      break;
  }

  return x;
};


// Returns the error function erf(x)
jStat.erf = function erf(x) {
  var cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
             -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
             4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
             1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
             6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
             -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
             -6.886027e-12, 8.94487e-13, 3.13092e-13,
             -1.12708e-13, 3.81e-16, 7.106e-15,
             -1.523e-15, -9.4e-17, 1.21e-16,
             -2.8e-17];
  var j = cof.length - 1;
  var isneg = false;
  var d = 0;
  var dd = 0;
  var t, ty, tmp, res;

  if (x < 0) {
    x = -x;
    isneg = true;
  }

  t = 2 / (2 + x);
  ty = 4 * t - 2;

  for(; j > 0; j--) {
    tmp = d;
    d = ty * d - dd + cof[j];
    dd = tmp;
  }

  res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
  return isneg ? res - 1 : 1 - res;
};


// Returns the complmentary error function erfc(x)
jStat.erfc = function erfc(x) {
  return 1 - jStat.erf(x);
};


// Returns the inverse of the complementary error function
jStat.erfcinv = function erfcinv(p) {
  var j = 0;
  var x, err, t, pp;
  if (p >= 2)
    return -100;
  if (p <= 0)
    return 100;
  pp = (p < 1) ? p : 2 - p;
  t = Math.sqrt(-2 * Math.log(pp / 2));
  x = -0.70711 * ((2.30753 + t * 0.27061) /
                  (1 + t * (0.99229 + t * 0.04481)) - t);
  for (; j < 2; j++) {
    err = jStat.erfc(x) - pp;
    x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
  }
  return (p < 1) ? x : -x;
};


// Returns the inverse of the incomplete beta function
jStat.ibetainv = function ibetainv(p, a, b) {
  var EPS = 1e-8;
  var a1 = a - 1;
  var b1 = b - 1;
  var j = 0;
  var lna, lnb, pp, t, u, err, x, al, h, w, afac;
  if (p <= 0)
    return 0;
  if (p >= 1)
    return 1;
  if (a >= 1 && b >= 1) {
    pp = (p < 0.5) ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t* (0.99229 + t * 0.04481)) - t;
    if (p < 0.5)
      x = -x;
    al = (x * x - 3) / 6;
    h = 2 / (1 / (2 * a - 1)  + 1 / (2 * b - 1));
    w = (x * Math.sqrt(al + h) / h) - (1 / (2 * b - 1) - 1 / (2 * a - 1)) *
        (al + 5 / 6 - 2 / (3 * h));
    x = a / (a + b * Math.exp(2 * w));
  } else {
    lna = Math.log(a / (a + b));
    lnb = Math.log(b / (a + b));
    t = Math.exp(a * lna) / a;
    u = Math.exp(b * lnb) / b;
    w = t + u;
    if (p < t / w)
      x = Math.pow(a * w * p, 1 / a);
    else
      x = 1 - Math.pow(b * w * (1 - p), 1 / b);
  }
  afac = -jStat.gammaln(a) - jStat.gammaln(b) + jStat.gammaln(a + b);
  for(; j < 10; j++) {
    if (x === 0 || x === 1)
      return x;
    err = jStat.ibeta(x, a, b) - p;
    t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac);
    u = err / t;
    x -= (t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x)))));
    if (x <= 0)
      x = 0.5 * (x + t);
    if (x >= 1)
      x = 0.5 * (x + t + 1);
    if (Math.abs(t) < EPS * x && j > 0)
      break;
  }
  return x;
};


// Returns the incomplete beta function I_x(a,b)
jStat.ibeta = function ibeta(x, a, b) {
  // Factors in front of the continued fraction.
  var bt = (x === 0 || x === 1) ?  0 :
    Math.exp(jStat.gammaln(a + b) - jStat.gammaln(a) -
             jStat.gammaln(b) + a * Math.log(x) + b *
             Math.log(1 - x));
  if (x < 0 || x > 1)
    return false;
  if (x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
    return bt * jStat.betacf(x, a, b) / a;
  // else use continued fraction after making the symmetry transformation.
  return 1 - bt * jStat.betacf(1 - x, b, a) / b;
};


// Returns a normal deviate (mu=0, sigma=1).
// If n and m are specified it returns a object of normal deviates.
jStat.randn = function randn(n, m) {
  var u, v, x, y, q, mat;
  if (!m)
    m = n;
  if (n)
    return jStat.create(n, m, function() { return jStat.randn(); });
  do {
    u = Math.random();
    v = 1.7156 * (Math.random() - 0.5);
    x = u - 0.449871;
    y = Math.abs(v) + 0.386595;
    q = x * x + y * (0.19600 * y - 0.25472 * x);
  } while (q > 0.27597 && (q > 0.27846 || v * v > -4 * Math.log(u) * u * u));
  return v / u;
};


// Returns a gamma deviate by the method of Marsaglia and Tsang.
jStat.randg = function randg(shape, n, m) {
  var oalph = shape;
  var a1, a2, u, v, x, mat;
  if (!m)
    m = n;
  if (!shape)
    shape = 1;
  if (n) {
    mat = jStat.zeros(n,m);
    mat.alter(function() { return jStat.randg(shape); });
    return mat;
  }
  if (shape < 1)
    shape += 1;
  a1 = shape - 1 / 3;
  a2 = 1 / Math.sqrt(9 * a1);
  do {
    do {
      x = jStat.randn();
      v = 1 + a2 * x;
    } while(v <= 0);
    v = v * v * v;
    u = Math.random();
  } while(u > 1 - 0.331 * Math.pow(x, 4) &&
          Math.log(u) > 0.5 * x*x + a1 * (1 - v + Math.log(v)));
  // alpha > 1
  if (shape == oalph)
    return a1 * v;
  // alpha < 1
  do {
    u = Math.random();
  } while(u === 0);
  return Math.pow(u, 1 / oalph) * a1 * v;
};


// making use of static methods on the instance
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function() {
      return jStat(
          jStat.map(this, function(value) { return jStat[passfunc](value); }));
    }
  })(funcs[i]);
})('gammaln gammafn factorial factorialln'.split(' '));


(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function() {
      return jStat(jStat[passfunc].apply(null, arguments));
    };
  })(funcs[i]);
})('randn'.split(' '));

}(this.jStat, Math));
(function(jStat, Math) {

// generate all distribution instance methods
(function(list) {
  for (var i = 0; i < list.length; i++) (function(func) {
    // distribution instance method
    jStat[func] = function(a, b, c) {
      if (!(this instanceof arguments.callee))
        return new arguments.callee(a, b, c);
      this._a = a;
      this._b = b;
      this._c = c;
      return this;
    };
    // distribution method to be used on a jStat instance
    jStat.fn[func] = function(a, b, c) {
      var newthis = jStat[func](a, b, c);
      newthis.data = this;
      return newthis;
    };
    // sample instance method
    jStat[func].prototype.sample = function(arr) {
      var a = this._a;
      var b = this._b;
      var c = this._c;
      if (arr)
        return jStat.alter(arr, function() {
          return jStat[func].sample(a, b, c);
        });
      else
        return jStat[func].sample(a, b, c);
    };
    // generate the pdf, cdf and inv instance methods
    (function(vals) {
      for (var i = 0; i < vals.length; i++) (function(fnfunc) {
        jStat[func].prototype[fnfunc] = function(x) {
          var a = this._a;
          var b = this._b;
          var c = this._c;
          if (!x && x !== 0)
            x = this.data;
          if (typeof x !== 'number') {
            return jStat.fn.map.call(x, function(x) {
              return jStat[func][fnfunc](x, a, b, c);
            });
          }
          return jStat[func][fnfunc](x, a, b, c);
        };
      })(vals[i]);
    })('pdf cdf inv'.split(' '));
    // generate the mean, median, mode and variance instance methods
    (function(vals) {
      for (var i = 0; i < vals.length; i++) (function(fnfunc) {
        jStat[func].prototype[fnfunc] = function() {
          return jStat[func][fnfunc](this._a, this._b, this._c);
        };
      })(vals[i]);
    })('mean median mode variance'.split(' '));
  })(list[i]);
})((
  'beta centralF cauchy chisquare exponential gamma invgamma kumaraswamy ' +
  'lognormal normal pareto studentt weibull uniform  binomial negbin hypgeom ' +
  'poisson triangular'
).split(' '));



// extend beta function with static methods
jStat.extend(jStat.beta, {
  pdf: function pdf(x, alpha, beta) {
    // PDF is zero outside the support
    if (x > 1 || x < 0)
      return 0;
    // PDF is one for the uniform case
    if (alpha == 1 && beta == 1)
      return 1;

    if (alpha < 512 || beta < 512) {
      return (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) /
          jStat.betafn(alpha, beta);
    } else {
      return Math.exp((alpha - 1) * Math.log(x) +
                      (beta - 1) * Math.log(1 - x) -
                      jStat.betaln(alpha, beta));
    }
  },

  cdf: function cdf(x, alpha, beta) {
    return (x > 1 || x < 0) ? (x > 1) * 1 : jStat.ibeta(x, alpha, beta);
  },

  inv: function inv(x, alpha, beta) {
    return jStat.ibetainv(x, alpha, beta);
  },

  mean: function mean(alpha, beta) {
    return alpha / (alpha + beta);
  },

  median: function median(alpha, beta) {
    throw new Error('median not yet implemented');
  },

  mode: function mode(alpha, beta) {
    return (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  },

  // return a random sample
  sample: function sample(alpha, beta) {
    var u = jStat.randg(alpha);
    return u / (u + jStat.randg(beta));
  },

  variance: function variance(alpha, beta) {
    return (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  }
});

// extend F function with static methods
jStat.extend(jStat.centralF, {
  pdf: function pdf(x, df1, df2) {
    if (x < 0)
      return undefined;
    return Math.sqrt((Math.pow(df1 * x, df1) * Math.pow(df2, df2)) /
                     (Math.pow(df1 * x + df2, df1 + df2))) /
                     (x * jStat.betafn(df1/2, df2/2));

  },

  cdf: function cdf(x, df1, df2) {
    return jStat.ibeta((df1 * x) / (df1 * x + df2), df1 / 2, df2 / 2);
  },

  inv: function inv(x, df1, df2) {
    return df2 / (df1 * (1 / jStat.ibetainv(x, df1 / 2, df2 / 2) - 1));
  },

  mean: function mean(df1, df2) {
    return (df2 > 2) ? df2 / (df2 - 2) : undefined;
  },

  mode: function mode(df1, df2) {
    return (df1 > 2) ? (df2 * (df1 - 2)) / (df1 * (df2 + 2)) : undefined;
  },

  // return a random sample
  sample: function sample(df1, df2) {
    var x1 = jStat.randg(df1 / 2) * 2;
    var x2 = jStat.randg(df2 / 2) * 2;
    return (x1 / df1) / (x2 / df2);
  },

  variance: function variance(df1, df2) {
    if (df2 <= 4)
      return undefined;
    return 2 * df2 * df2 * (df1 + df2 - 2) /
        (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4));
  }
});


// extend cauchy function with static methods
jStat.extend(jStat.cauchy, {
  pdf: function pdf(x, local, scale) {
    return (scale / (Math.pow(x - local, 2) + Math.pow(scale, 2))) / Math.PI;
  },

  cdf: function cdf(x, local, scale) {
    return Math.atan((x - local) / scale) / Math.PI + 0.5;
  },

  inv: function(p, local, scale) {
    return local + scale * Math.tan(Math.PI * (p - 0.5));
  },

  median: function median(local, scale) {
    return local;
  },

  mode: function mode(local, scale) {
    return local;
  },

  sample: function sample(local, scale) {
    return jStat.randn() *
        Math.sqrt(1 / (2 * jStat.randg(0.5))) * scale + local;
  }
});



// extend chisquare function with static methods
jStat.extend(jStat.chisquare, {
  pdf: function pdf(x, dof) {
    return Math.exp((dof / 2 - 1) * Math.log(x) - x / 2 - (dof / 2) *
                    Math.log(2) - jStat.gammaln(dof / 2));
  },

  cdf: function cdf(x, dof) {
    return jStat.gammap(dof / 2, x / 2);
  },

  inv: function(p, dof) {
    return 2 * jStat.gammapinv(p, 0.5 * dof);
  },

  mean : function(dof) {
    return dof;
  },

  // TODO: this is an approximation (is there a better way?)
  median: function median(dof) {
    return dof * Math.pow(1 - (2 / (9 * dof)), 3);
  },

  mode: function mode(dof) {
    return (dof - 2 > 0) ? dof - 2 : 0;
  },

  sample: function sample(dof) {
    return jStat.randg(dof / 2) * 2;
  },

  variance: function variance(dof) {
    return 2 * dof;
  }
});



// extend exponential function with static methods
jStat.extend(jStat.exponential, {
  pdf: function pdf(x, rate) {
    return x < 0 ? 0 : rate * Math.exp(-rate * x);
  },

  cdf: function cdf(x, rate) {
    return x < 0 ? 0 : 1 - Math.exp(-rate * x);
  },

  inv: function(p, rate) {
    return -Math.log(1 - p) / rate;
  },

  mean : function(rate) {
    return 1 / rate;
  },

  median: function (rate) {
    return (1 / rate) * Math.log(2);
  },

  mode: function mode(rate) {
    return 0;
  },

  sample: function sample(rate) {
    return -1 / rate * Math.log(Math.random());
  },

  variance : function(rate) {
    return Math.pow(rate, -2);
  }
});



// extend gamma function with static methods
jStat.extend(jStat.gamma, {
  pdf: function pdf(x, shape, scale) {
    return Math.exp((shape - 1) * Math.log(x) - x / scale -
                    jStat.gammaln(shape) - shape * Math.log(scale));
  },

  cdf: function cdf(x, shape, scale) {
    return jStat.gammap(shape, x / scale);
  },

  inv: function(p, shape, scale) {
    return jStat.gammapinv(p, shape) * scale;
  },

  mean : function(shape, scale) {
    return shape * scale;
  },

  mode: function mode(shape, scale) {
    if(shape > 1) return (shape - 1) * scale;
    return undefined;
  },

  sample: function sample(shape, scale) {
    return jStat.randg(shape) * scale;
  },

  variance: function variance(shape, scale) {
    return shape * scale * scale;
  }
});

// extend inverse gamma function with static methods
jStat.extend(jStat.invgamma, {
  pdf: function pdf(x, shape, scale) {
    return Math.exp(-(shape + 1) * Math.log(x) - scale / x -
                    jStat.gammaln(shape) + shape * Math.log(scale));
  },

  cdf: function cdf(x, shape, scale) {
    return 1 - jStat.gammap(shape, scale / x);
  },

  inv: function(p, shape, scale) {
    return scale / jStat.gammapinv(1 - p, shape);
  },

  mean : function(shape, scale) {
    return (shape > 1) ? scale / (shape - 1) : undefined;
  },

  mode: function mode(shape, scale) {
    return scale / (shape + 1);
  },

  sample: function sample(shape, scale) {
    return scale / jStat.randg(shape);
  },

  variance: function variance(shape, scale) {
    if (shape <= 2)
      return undefined;
    return scale * scale / ((shape - 1) * (shape - 1) * (shape - 2));
  }
});


// extend kumaraswamy function with static methods
jStat.extend(jStat.kumaraswamy, {
  pdf: function pdf(x, alpha, beta) {
    return Math.exp(Math.log(alpha) + Math.log(beta) + (alpha - 1) *
                    Math.log(x) + (beta - 1) *
                    Math.log(1 - Math.pow(x, alpha)));
  },

  cdf: function cdf(x, alpha, beta) {
    return (1 - Math.pow(1 - Math.pow(x, alpha), beta));
  },

  mean : function(alpha, beta) {
    return (beta * jStat.gammafn(1 + 1 / alpha) *
            jStat.gammafn(beta)) / (jStat.gammafn(1 + 1 / alpha + beta));
  },

  median: function median(alpha, beta) {
    return Math.pow(1 - Math.pow(2, -1 / beta), 1 / alpha);
  },

  mode: function mode(alpha, beta) {
    if (!(alpha >= 1 && beta >= 1 && (alpha !== 1 && beta !== 1)))
      return undefined;
    return Math.pow((alpha - 1) / (alpha * beta - 1), 1 / alpha);
  },

  variance: function variance(alpha, beta) {
    throw new Error('variance not yet implemented');
    // TODO: complete this
  }
});



// extend lognormal function with static methods
jStat.extend(jStat.lognormal, {
  pdf: function pdf(x, mu, sigma) {
    return Math.exp(-Math.log(x) - 0.5 * Math.log(2 * Math.PI) -
                    Math.log(sigma) - Math.pow(Math.log(x) - mu, 2) /
                    (2 * sigma * sigma));
  },

  cdf: function cdf(x, mu, sigma) {
    return 0.5 +
        (0.5 * jStat.erf((Math.log(x) - mu) / Math.sqrt(2 * sigma * sigma)));
  },

  inv: function(p, mu, sigma) {
    return Math.exp(-1.41421356237309505 * sigma * jStat.erfcinv(2 * p) + mu);
  },

  mean: function mean(mu, sigma) {
    return Math.exp(mu + sigma * sigma / 2);
  },

  median: function median(mu, sigma) {
    return Math.exp(mu);
  },

  mode: function mode(mu, sigma) {
    return Math.exp(mu - sigma * sigma);
  },

  sample: function sample(mu, sigma) {
    return Math.exp(jStat.randn() * sigma + mu);
  },

  variance: function variance(mu, sigma) {
    return (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
  }
});



// extend normal function with static methods
jStat.extend(jStat.normal, {
  pdf: function pdf(x, mean, std) {
    return Math.exp(-0.5 * Math.log(2 * Math.PI) -
                    Math.log(std) - Math.pow(x - mean, 2) / (2 * std * std));
  },

  cdf: function cdf(x, mean, std) {
    return 0.5 * (1 + jStat.erf((x - mean) / Math.sqrt(2 * std * std)));
  },

  inv: function(p, mean, std) {
    return -1.41421356237309505 * std * jStat.erfcinv(2 * p) + mean;
  },

  mean : function(mean, std) {
    return mean;
  },

  median: function median(mean, std) {
    return mean;
  },

  mode: function (mean, std) {
    return mean;
  },

  sample: function sample(mean, std) {
    return jStat.randn() * std + mean;
  },

  variance : function(mean, std) {
    return std * std;
  }
});



// extend pareto function with static methods
jStat.extend(jStat.pareto, {
  pdf: function pdf(x, scale, shape) {
    if (x <= scale)
      return undefined;
    return (shape * Math.pow(scale, shape)) / Math.pow(x, shape + 1);
  },

  cdf: function cdf(x, scale, shape) {
    return 1 - Math.pow(scale / x, shape);
  },

  mean: function mean(scale, shape) {
    if (shape <= 1)
      return undefined;
    return (shape * Math.pow(scale, shape)) / (shape - 1);
  },

  median: function median(scale, shape) {
    return scale * (shape * Math.SQRT2);
  },

  mode: function mode(scale, shape) {
    return scale;
  },

  variance : function(scale, shape) {
    if (shape <= 2)
      return undefined;
    return (scale*scale * shape) / (Math.pow(shape - 1, 2) * (shape - 2));
  }
});



// extend studentt function with static methods
jStat.extend(jStat.studentt, {
  pdf: function pdf(x, dof) {
    return (jStat.gammafn((dof + 1) / 2) / (Math.sqrt(dof * Math.PI) *
        jStat.gammafn(dof / 2))) *
        Math.pow(1 + ((x * x) / dof), -((dof + 1) / 2));
  },

  cdf: function cdf(x, dof) {
    var dof2 = dof / 2;
    return jStat.ibeta((x + Math.sqrt(x * x + dof)) /
                       (2 * Math.sqrt(x * x + dof)), dof2, dof2);
  },

  inv: function(p, dof) {
    var x = jStat.ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
    x = Math.sqrt(dof * (1 - x) / x);
    return (p > 0.5) ? x : -x;
  },

  mean: function mean(dof) {
    return (dof > 1) ? 0 : undefined;
  },

  median: function median(dof) {
    return 0;
  },

  mode: function mode(dof) {
    return 0;
  },

  sample: function sample(dof) {
    return jStat.randn() * Math.sqrt(dof / (2 * jStat.randg(dof / 2)));
  },

  variance: function variance(dof) {
    return (dof  > 2) ? dof / (dof - 2) : (dof > 1) ? Infinity : undefined;
  }
});



// extend weibull function with static methods
jStat.extend(jStat.weibull, {
  pdf: function pdf(x, scale, shape) {
    if (x < 0)
      return 0;
    return (shape / scale) * Math.pow((x / scale), (shape - 1)) *
        Math.exp(-(Math.pow((x / scale), shape)));
  },

  cdf: function cdf(x, scale, shape) {
    return x < 0 ? 0 : 1 - Math.exp(-Math.pow((x / scale), shape));
  },

  inv: function(p, scale, shape) {
    return scale * Math.pow(-Math.log(1 - p), 1 / shape);
  },

  mean : function(scale, shape) {
    return scale * jStat.gammafn(1 + 1 / shape);
  },

  median: function median(scale, shape) {
    return scale * Math.pow(Math.log(2), 1 / shape);
  },

  mode: function mode(scale, shape) {
    if (shape <= 1)
      return undefined;
    return scale * Math.pow((shape - 1) / shape, 1 / shape);
  },

  sample: function sample(scale, shape) {
    return scale * Math.pow(-Math.log(Math.random()), 1 / shape);
  },

  variance: function variance(scale, shape) {
    return scale * scale * jStat.gammafn(1 + 2 / shape) -
        Math.pow(this.mean(scale, shape), 2);
  }
});



// extend uniform function with static methods
jStat.extend(jStat.uniform, {
  pdf: function pdf(x, a, b) {
    return (x < a || x > b) ? 0 : 1 / (b - a);
  },

  cdf: function cdf(x, a, b) {
    if (x < a)
      return 0;
    else if (x < b)
      return (x - a) / (b - a);
    return 1;
  },

  mean: function mean(a, b) {
    return 0.5 * (a + b);
  },

  median: function median(a, b) {
    return jStat.mean(a, b);
  },

  mode: function mode(a, b) {
    throw new Error('mode is not yet implemented');
  },

  sample: function sample(a, b) {
    return (a / 2 + b / 2) + (b / 2 - a / 2) * (2 * Math.random() - 1);
  },

  variance: function variance(a, b) {
    return Math.pow(b - a, 2) / 12;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.binomial, {
  pdf: function pdf(k, n, p) {
    return (p === 0 || p === 1) ?
      ((n * p) === k ? 1 : 0) :
      jStat.combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  },

  cdf: function cdf(x, n, p) {
    var binomarr = [],
    k = 0;
    if (x < 0) {
      return 0;
    }
    if (x < n) {
      for (; k <= x; k++) {
        binomarr[ k ] = jStat.binomial.pdf(k, n, p);
      }
      return jStat.sum(binomarr);
    }
    return 1;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.negbin, {
  pdf: function pdf(k, r, p) {
    return k !== k | 0
      ? false
      : k < 0
        ? 0
        : jStat.combination(k + r - 1, r - 1) * Math.pow(1 - p, k) * Math.pow(p, r);
  },

  cdf: function cdf(x, r, p) {
    var sum = 0,
    k = 0;
    if (x < 0) return 0;
    for (; k <= x; k++) {
      sum += jStat.negbin.pdf(k, r, p);
    }
    return sum;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.hypgeom, {
  pdf: function pdf(k, N, m, n) {
    // Hypergeometric PDF.

    // A simplification of the CDF algorithm below.

    // k = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    if(k !== k | 0) {
      return false;
    } else if(k < 0 || k < m - (N - n)) {
      // It's impossible to have this few successes drawn.
      return 0;
    } else if(k > n || k > m) {
      // It's impossible to have this many successes drawn.
      return 0;
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if(n * 2 > N) {
        // More than half the population is sampled.

        return jStat.hypgeom.pdf(N - m - n + k, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return jStat.hypgeom.pdf(n - k, N, N - m, n);
      }

    } else if(n * 2 > N) {
      // Half or less is successes.

      return jStat.hypgeom.pdf(m - k, N, m, N - n);

    } else if(m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return jStat.hypgeom.pdf(k, N, n, m);
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate product to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1;

      // This keeps track of how much we have normalized.
      var samplesDone = 0;

      for(var i = 0; i < k; i++) {
        // For every possible number of successes up to that observed...

        while(scaledPDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          scaledPDF *= 1 - (m / (N - samplesDone));

          // Say we've normalized by this sample already.
          samplesDone++;
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));
      }

      for(; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledPDF *= 1 - (m / (N - samplesDone));
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledPDF));
    }
  },

  cdf: function cdf(x, N, m, n) {
    // Hypergeometric CDF.

    // This algorithm is due to Prof. Thomas S. Ferguson, <tom@math.ucla.edu>,
    // and comes from his hypergeometric test calculator at
    // <http://www.math.ucla.edu/~tom/distributions/Hypergeometric.html>.

    // x = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    if(x < 0 || x < m - (N - n)) {
      // It's impossible to have this few successes drawn or fewer.
      return 0;
    } else if(x >= n || x >= m) {
      // We will always have this many successes or fewer.
      return 1;
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if(n * 2 > N) {
        // More than half the population is sampled.

        return jStat.hypgeom.cdf(N - m - n + x, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return 1 - jStat.hypgeom.cdf(n - x - 1, N, N - m, n);
      }

    } else if(n * 2 > N) {
      // Half or less is successes.

      return 1 - jStat.hypgeom.cdf(m - x - 1, N, m, N - n);

    } else if(m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return jStat.hypgeom.cdf(x, N, n, m);
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate sum to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // Holds the intermediate, scaled total CDF.
      var scaledCDF = 1;

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1;

      // This keeps track of how much we have normalized.
      var samplesDone = 0;

      for(var i = 0; i < x; i++) {
        // For every possible number of successes up to that observed...

        while(scaledCDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          var factor = 1 - (m / (N - samplesDone));

          scaledPDF *= factor;
          scaledCDF *= factor;

          // Say we've normalized by this sample already.
          samplesDone++;
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));

        // Add to the CDF answer.
        scaledCDF += scaledPDF;
      }

      for(; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledCDF *= 1 - (m / (N - samplesDone));
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledCDF));
    }
  }
});



// extend uniform function with static methods
jStat.extend(jStat.poisson, {
  pdf: function pdf(k, l) {
    return Math.pow(l, k) * Math.exp(-l) / jStat.factorial(k);
  },

  cdf: function cdf(x, l) {
    var sumarr = [],
    k = 0;
    if (x < 0) return 0;
    for (; k <= x; k++) {
      sumarr.push(jStat.poisson.pdf(k, l));
    }
    return jStat.sum(sumarr);
  },

  mean : function(l) {
    return l;
  },

  variance : function(l) {
    return l;
  },

  sample: function sample(l) {
    var p = 1, k = 0, L = Math.exp(-l);
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
});

// extend triangular function with static methods
jStat.extend(jStat.triangular, {
  pdf: function pdf(x, a, b, c) {
    return (b <= a || c < a || c > b)
      ? undefined
      : (x < a || x > b)
        ? 0
        : (x <= c)
          ? (2 * (x - a)) / ((b - a) * (c - a))
          : (2 * (b - x)) / ((b - a) * (b - c));
  },

  cdf: function cdf(x, a, b, c) {
    if (b <= a || c < a || c > b)
      return undefined;
    if (x < a) {
      return 0;
    } else {
      if (x <= c)
        return Math.pow(x - a, 2) / ((b - a) * (c - a));
      return 1 - Math.pow(b - x, 2) / ((b - a) * (b - c));
    }
    // never reach this
    return 1;
  },

  mean: function mean(a, b, c) {
    return (a + b + c) / 3;
  },

  median: function median(a, b, c) {
    if (c <= (a + b) / 2) {
      return b - Math.sqrt((b - a) * (b - c)) / Math.sqrt(2);
    } else if (c > (a + b) / 2) {
      return a + Math.sqrt((b - a) * (c - a)) / Math.sqrt(2);
    }
  },

  mode: function mode(a, b, c) {
    return c;
  },

  sample: function sample(a, b, c) {
    var u = Math.random();
    if (u < ((c - a) / (b - a)))
      return a + Math.sqrt(u * (b - a) * (c - a))
    return b - Math.sqrt((1 - u) * (b - a) * (b - c));
  },

  variance: function variance(a, b, c) {
    return (a * a + b * b + c * c - a * b - a * c - b * c) / 18;
  }
});

}(this.jStat, Math));
/* Provides functions for the solution of linear system of equations, integration, extrapolation,
 * interpolation, eigenvalue problems, differential equations and PCA analysis. */

(function(jStat, Math) {

var push = Array.prototype.push;
var isArray = jStat.utils.isArray;

jStat.extend({

  // add a vector/matrix to a vector/matrix or scalar
  add: function add(arr, arg) {
    // check if arg is a vector or scalar
    if (isArray(arg)) {
      if (!isArray(arg[0])) arg = [ arg ];
      return jStat.map(arr, function(value, row, col) {
        return value + arg[row][col];
      });
    }
    return jStat.map(arr, function(value) { return value + arg; });
  },

  // subtract a vector or scalar from the vector
  subtract: function subtract(arr, arg) {
    // check if arg is a vector or scalar
    if (isArray(arg)) {
      if (!isArray(arg[0])) arg = [ arg ];
      return jStat.map(arr, function(value, row, col) {
        return value - arg[row][col] || 0;
      });
    }
    return jStat.map(arr, function(value) { return value - arg; });
  },

  // matrix division
  divide: function divide(arr, arg) {
    if (isArray(arg)) {
      if (!isArray(arg[0])) arg = [ arg ];
      return jStat.multiply(arr, jStat.inv(arg));
    }
    return jStat.map(arr, function(value) { return value / arg; });
  },

  // matrix multiplication
  multiply: function multiply(arr, arg) {
    var row, col, nrescols, sum,
    nrow = arr.length,
    ncol = arr[0].length,
    res = jStat.zeros(nrow, nrescols = (isArray(arg)) ? arg[0].length : ncol),
    rescols = 0;
    if (isArray(arg)) {
      for (; rescols < nrescols; rescols++) {
        for (row = 0; row < nrow; row++) {
          sum = 0;
          for (col = 0; col < ncol; col++)
          sum += arr[row][col] * arg[col][rescols];
          res[row][rescols] = sum;
        }
      }
      return (nrow === 1 && rescols === 1) ? res[0][0] : res;
    }
    return jStat.map(arr, function(value) { return value * arg; });
  },

  // Returns the dot product of two matricies
  dot: function dot(arr, arg) {
    if (!isArray(arr[0])) arr = [ arr ];
    if (!isArray(arg[0])) arg = [ arg ];
    // convert column to row vector
    var left = (arr[0].length === 1 && arr.length !== 1) ? jStat.transpose(arr) : arr,
    right = (arg[0].length === 1 && arg.length !== 1) ? jStat.transpose(arg) : arg,
    res = [],
    row = 0,
    nrow = left.length,
    ncol = left[0].length,
    sum, col;
    for (; row < nrow; row++) {
      res[row] = [];
      sum = 0;
      for (col = 0; col < ncol; col++)
      sum += left[row][col] * right[row][col];
      res[row] = sum;
    }
    return (res.length === 1) ? res[0] : res;
  },

  // raise every element by a scalar
  pow: function pow(arr, arg) {
    return jStat.map(arr, function(value) { return Math.pow(value, arg); });
  },

  // generate the absolute values of the vector
  abs: function abs(arr) {
    return jStat.map(arr, function(value) { return Math.abs(value); });
  },

  // computes the p-norm of the vector
  // In the case that a matrix is passed, uses the first row as the vector
  norm: function norm(arr, p) {
    var nnorm = 0,
    i = 0;
    // check the p-value of the norm, and set for most common case
    if (isNaN(p)) p = 2;
    // check if multi-dimensional array, and make vector correction
    if (isArray(arr[0])) arr = arr[0];
    // vector norm
    for (; i < arr.length; i++) {
      nnorm += Math.pow(Math.abs(arr[i]), p);
    }
    return Math.pow(nnorm, 1 / p);
  },

  // TODO: make compatible with matrices
  // computes the angle between two vectors in rads
  angle: function angle(arr, arg) {
    return Math.acos(jStat.dot(arr, arg) / (jStat.norm(arr) * jStat.norm(arg)));
  },

  // augment one matrix by another
  aug: function aug(a, b) {
    var newarr = a.slice(),
    i = 0;
    for (; i < newarr.length; i++) {
      push.apply(newarr[i], b[i]);
    }
    return newarr;
  },

  inv: function inv(a) {
    var rows = a.length,
    cols = a[0].length,
    b = jStat.identity(rows, cols),
    c = jStat.gauss_jordan(a, b),
    obj = [],
    i = 0,
    j;
    for (; i < rows; i++) {
      obj[i] = [];
      for (j = cols - 1; j < c[0].length; j++)
      obj[i][j - cols] = c[i][j];
    }
    return obj;
  },

  // calculate the determinant of a matrix
  det: function det(a) {
    var alen = a.length,
    alend = alen * 2,
    vals = new Array(alend),
    rowshift = alen - 1,
    colshift = alend - 1,
    mrow = rowshift - alen + 1,
    mcol = colshift,
    i = 0,
    result = 0,
    j;
    // check for special 2x2 case
    if (alen === 2) {
      return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    }
    for (; i < alend; i++) {
      vals[i] = 1;
    }
    for (i = 0; i < alen; i++) {
      for (j = 0; j < alen; j++) {
        vals[(mrow < 0) ? mrow + alen : mrow ] *= a[i][j];
        vals[(mcol < alen) ? mcol + alen : mcol ] *= a[i][j];
        mrow++;
        mcol--;
      }
      mrow = --rowshift - alen + 1;
      mcol = --colshift;
    }
    for (i = 0; i < alen; i++) {
      result += vals[i];
    }
    for (; i < alend; i++) {
      result -= vals[i];
    }
    return result;
  },

  gauss_elimination: function gauss_elimination(a, b) {
    var i = 0,
    j = 0,
    n = a.length,
    m = a[0].length,
    factor = 1,
    sum = 0,
    x = [],
    maug, pivot, temp, k;
    a = jStat.aug(a, b);
    maug = a[0].length;
    for(; i < n; i++) {
      pivot = a[i][i];
      j = i;
      for (k = i + 1; k < m; k++) {
        if (pivot < Math.abs(a[k][i])) {
          pivot = a[k][i];
          j = k;
        }
      }
      if (j != i) {
        for(k = 0; k < maug; k++) {
          temp = a[i][k];
          a[i][k] = a[j][k];
          a[j][k] = temp;
        }
      }
      for (j = i + 1; j < n; j++) {
        factor = a[j][i] / a[i][i];
        for(k = i; k < maug; k++) {
          a[j][k] = a[j][k] - factor * a[i][k];
        }
      }
    }
    for (i = n - 1; i >= 0; i--) {
      sum = 0;
      for (j = i + 1; j<= n - 1; j++) {
        sum = x[j] * a[i][j];
      }
      x[i] =(a[i][maug - 1] - sum) / a[i][i];
    }
    return x;
  },

  gauss_jordan: function gauss_jordan(a, b) {
    var m = jStat.aug(a, b),
    h = m.length,
    w = m[0].length;
    // find max pivot
    for (var y = 0; y < h; y++) {
      var maxrow = y;
      for (var y2 = y+1; y2 < h; y2++) {
        if (Math.abs(m[y2][y]) > Math.abs(m[maxrow][y]))
          maxrow = y2;
      }
      var tmp = m[y];
      m[y] = m[maxrow];
      m[maxrow] = tmp
      for (var y2 = y+1; y2 < h; y2++) {
        c = m[y2][y] / m[y][y];
        for (var x = y; x < w; x++) {
          m[y2][x] -= m[y][x] * c;
        }
      }
    }
    // backsubstitute
    for (var y = h-1; y >= 0; y--) {
      c = m[y][y];
      for (var y2 = 0; y2 < y; y2++) {
        for (var x = w-1; x > y-1; x--) {
          m[y2][x] -= m[y][x] * m[y2][y] / c;
        }
      }
      m[y][y] /= c;
      for (var x = h; x < w; x++) {
        m[y][x] /= c;
      }
    }
    return m;
  },

  lu: function lu(a, b) {
    throw new Error('lu not yet implemented');
  },

  cholesky: function cholesky(a, b) {
    throw new Error('cholesky not yet implemented');
  },

  gauss_jacobi: function gauss_jacobi(a, b, x, r) {
    var i = 0;
    var j = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.multiply(jStat.inv(d), jStat.add(l, u)), -1);
    c = jStat.multiply(jStat.inv(d), b);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk,xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i++;
    }
    return xk;
  },

  gauss_seidel: function gauss_seidel(a, b, x, r) {
    var i = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var j, xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.multiply(jStat.inv(jStat.add(d, l)), u), -1);
    c = jStat.multiply(jStat.inv(jStat.add(d, l)), b);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk, xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i = i + 1;
    }
    return xk;
  },

  SOR: function SOR(a, b, x, r, w) {
    var i = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var j, xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.inv(jStat.add(d, jStat.multiply(l, w))),
                       jStat.subtract(jStat.multiply(d, 1 - w),
                                      jStat.multiply(u, w)));
    c = jStat.multiply(jStat.multiply(jStat.inv(jStat.add(d,
        jStat.multiply(l, w))), b), w);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk, xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i++;
    }
    return xk;
  },

  householder: function householder(a) {
    var m = a.length;
    var n = a[0].length;
    var i = 0;
    var w = [];
    var p = [];
    var alpha, r, k, j, factor;
    for (; i < m - 1; i++) {
      alpha = 0;
      for (j = i + 1; j < n; j++)
      alpha += (a[j][i] * a[j][i]);
      factor = (a[i + 1][i] > 0) ? -1 : 1;
      alpha = factor * Math.sqrt(alpha);
      r = Math.sqrt((((alpha * alpha) - a[i + 1][i] * alpha) / 2));
      w = jStat.zeros(m, 1);
      w[i + 1][0] = (a[i + 1][i] - alpha) / (2 * r);
      for (k = i + 2; k < m; k++) w[k][0] = a[k][i] / (2 * r);
      p = jStat.subtract(jStat.identity(m, n),
          jStat.multiply(jStat.multiply(w, jStat.transpose(w)), 2));
      a = jStat.multiply(p, jStat.multiply(a, p));
    }
    return a;
  },

  // TODO: not working properly.
  QR: function QR(a, b) {
    var m = a.length;
    var n = a[0].length;
    var i = 0;
    var w = [];
    var p = [];
    var x = [];
    var j, alpha, r, k, factor, sum;
    for (; i < m - 1; i++) {
      alpha = 0;
      for (j = i + 1; j < n; j++)
        alpha += (a[j][i] * a[j][i]);
      factor = (a[i + 1][i] > 0) ? -1 : 1;
      alpha = factor * Math.sqrt(alpha);
      r = Math.sqrt((((alpha * alpha) - a[i + 1][i] * alpha) / 2));
      w = jStat.zeros(m, 1);
      w[i + 1][0] = (a[i + 1][i] - alpha) / (2 * r);
      for (k = i + 2; k < m; k++)
        w[k][0] = a[k][i] / (2 * r);
      p = jStat.subtract(jStat.identity(m, n),
          jStat.multiply(jStat.multiply(w, jStat.transpose(w)), 2));
      a = jStat.multiply(p, a);
      b = jStat.multiply(p, b);
    }
    for (i = m - 1; i >= 0; i--) {
      sum = 0;
      for (j = i + 1; j <= n - 1; j++)
      sum = x[j] * a[i][j];
      x[i] = b[i][0] / a[i][i];
    }
    return x;
  },

  jacobi: function jacobi(a) {
    var condition = 1;
    var count = 0;
    var n = a.length;
    var e = jStat.identity(n, n);
    var ev = [];
    var b, i, j, p, q, maxim, theta, s;
    // condition === 1 only if tolerance is not reached
    while (condition === 1) {
      count++;
      maxim = a[0][1];
      p = 0;
      q = 1;
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          if (i != j) {
            if (maxim < Math.abs(a[i][j])) {
              maxim = Math.abs(a[i][j]);
              p = i;
              q = j;
            }
          }
        }
      }
      if (a[p][p] === a[q][q])
        theta = (a[p][q] > 0) ? Math.PI / 4 : -Math.PI / 4;
      else
        theta = Math.atan(2 * a[p][q] / (a[p][p] - a[q][q])) / 2;
      s = jStat.identity(n, n);
      s[p][p] = Math.cos(theta);
      s[p][q] = -Math.sin(theta);
      s[q][p] = Math.sin(theta);
      s[q][q] = Math.cos(theta);
      // eigen vector matrix
      e = jStat.multiply(e, s);
      b = jStat.multiply(jStat.multiply(jStat.inv(s), a), s);
      a = b;
      condition = 0;
      for (i = 1; i < n; i++) {
        for (j = 1; j < n; j++) {
          if (i != j && Math.abs(a[i][j]) > 0.001) {
            condition = 1;
          }
        }
      }
    }
    for (i = 0; i < n; i++) ev.push(a[i][i]);
    //returns both the eigenvalue and eigenmatrix
    return [e, ev];
  },

  rungekutta: function rungekutta(f, h, p, t_j, u_j, order) {
    var k1, k2, u_j1, k3, k4;
    if (order === 2) {
      while (t_j <= p) {
        k1 = h * f(t_j, u_j);
        k2 = h * f(t_j + h, u_j + k1);
        u_j1 = u_j + (k1 + k2) / 2;
        u_j = u_j1;
        t_j = t_j + h;
      }
    }
    if (order === 4) {
      while (t_j <= p) {
        k1 = h * f(t_j, u_j);
        k2 = h * f(t_j + h / 2, u_j + k1 / 2);
        k3 = h * f(t_j + h / 2, u_j + k2 / 2);
        k4 = h * f(t_j +h, u_j + k3);
        u_j1 = u_j + (k1 + 2 * k2 + 2 * k3 + k4) / 6;
        u_j = u_j1;
        t_j = t_j + h;
      }
    }
    return u_j;
  },

  romberg: function romberg(f, a, b, order) {
    var i = 0;
    var h = (b - a) / 2;
    var x = [];
    var h1 = [];
    var g = [];
    var m, a1, j, k, I, d;
    while (i < order / 2) {
      I = f(a);
      for (j = a, k = 0; j <= b; j = j + h, k++) x[k] = j;
      m = x.length;
      for (j = 1; j < m - 1; j++) {
        I += (((j % 2) !== 0) ? 4 : 2) * f(x[j]);
      }
      I = (h / 3) * (I + f(b));
      g[i] = I;
      h /= 2;
      i++;
    }
    a1 = g.length;
    m = 1;
    while (a1 !== 1) {
      for (j = 0; j < a1 - 1; j++)
      h1[j] = ((Math.pow(4, m)) * g[j + 1] - g[j]) / (Math.pow(4, m) - 1);
      a1 = h1.length;
      g = h1;
      h1 = [];
      m++;
    }
    return g;
  },

  richardson: function richardson(X, f, x, h) {
    function pos(X, x) {
      var i = 0;
      var n = X.length;
      var p;
      for (; i < n; i++)
        if (X[i] === x) p = i;
      return p;
    }
    var n = X.length,
    h_min = Math.abs(x - X[pos(X, x) + 1]),
    i = 0,
    g = [],
    h1 = [],
    y1, y2, m, a, j;
    while (h >= h_min) {
      y1 = pos(X, x + h);
      y2 = pos(X, x);
      g[i] = (f[y1] - 2 * f[y2] + f[2 * y2 - y1]) / (h * h);
      h /= 2;
      i++;
    }
    a = g.length;
    m = 1;
    while (a != 1) {
      for (j = 0; j < a - 1; j++)
      h1[j] = ((Math.pow(4, m)) * g[j + 1] - g[j]) / (Math.pow(4, m) - 1);
      a = h1.length;
      g = h1;
      h1 = [];
      m++;
    }
    return g;
  },

  simpson: function simpson(f, a, b, n) {
    var h = (b - a) / n;
    var I = f(a);
    var x = [];
    var j = a;
    var k = 0;
    var i = 1;
    var m;
    for (; j <= b; j = j + h, k++)
      x[k] = j;
    m = x.length;
    for (; i < m - 1; i++) {
      I += ((i % 2 !== 0) ? 4 : 2) * f(x[i]);
    }
    return (h / 3) * (I + f(b));
  },

  hermite: function hermite(X, F, dF, value) {
    var n = X.length;
    var p = 0;
    var i = 0;
    var l = [];
    var dl = [];
    var A = [];
    var B = [];
    var j;
    for (; i < n; i++) {
      l[i] = 1;
      for (j = 0; j < n; j++) {
        if (i != j) l[i] *= (value - X[j]) / (X[i] - X[j]);
      }
      dl[i] = 0;
      for (j = 0; j < n; j++) {
        if (i != j) dl[i] += 1 / (X [i] - X[j]);
      }
      A[i] = (1 - 2 * (value - X[i]) * dl[i]) * (l[i] * l[i]);
      B[i] = (value - X[i]) * (l[i] * l[i]);
      p += (A[i] * F[i] + B[i] * dF[i]);
    }
    return p;
  },

  lagrange: function lagrange(X, F, value) {
    var p = 0;
    var i = 0;
    var j, l;
    var n = X.length;
    for (; i < n; i++) {
      l = F[i];
      for (j = 0; j < n; j++) {
        // calculating the lagrange polynomial L_i
        if (i != j) l *= (value - X[j]) / (X[i] - X[j]);
      }
      // adding the lagrange polynomials found above
      p += l;
    }
    return p;
  },

  cubic_spline: function cubic_spline(X, F, value) {
    var n = X.length;
    var i = 0, j;
    var A = [];
    var B = [];
    var alpha = [];
    var c = [];
    var h = [];
    var b = [];
    var d = [];
    for (; i < n - 1; i++)
      h[i] = X[i + 1] - X[i];
    alpha[0] = 0;
    for (i = 1; i < n - 1; i++) {
      alpha[i] = (3 / h[i]) * (F[i + 1] - F[i]) -
          (3 / h[i-1]) * (F[i] - F[i-1]);
    }
    for (i = 1; i < n - 1; i++) {
      A[i] = [];
      B[i] = [];
      A[i][i-1] = h[i-1];
      A[i][i] = 2 * (h[i - 1] + h[i]);
      A[i][i+1] = h[i];
      B[i][0] = alpha[i];
    }
    c = jStat.multiply(jStat.inv(A), B);
    for (j = 0; j < n - 1; j++) {
      b[j] = (F[j + 1] - F[j]) / h[j] - h[j] * (c[j + 1][0] + 2 * c[j][0]) / 3;
      d[j] = (c[j + 1][0] - c[j][0]) / (3 * h[j]);
    }
    for (j = 0; j < n; j++) {
      if (X[j] > value) break;
    }
    j -= 1;
    return F[j] + (value - X[j]) * b[j] + jStat.sq(value-X[j]) *
        c[j] + (value - X[j]) * jStat.sq(value - X[j]) * d[j];
  },

  gauss_quadrature: function gauss_quadrature() {
    throw new Error('gauss_quadrature not yet implemented');
  },

  PCA: function PCA(X) {
    var m = X.length;
    var n = X[0].length;
    var flag = false;
    var i = 0;
    var j, temp1;
    var u = [];
    var D = [];
    var result = [];
    var temp2 = [];
    var Y = [];
    var Bt = [];
    var B = [];
    var C = [];
    var V = [];
    var Vt = [];
    for (i = 0; i < m; i++) {
      u[i] = jStat.sum(X[i]) / n;
    }
    for (i = 0; i < n; i++) {
      B[i] = [];
      for(j = 0; j < m; j++) {
        B[i][j] = X[j][i] - u[j];
      }
    }
    B = jStat.transpose(B);
    for (i = 0; i < m; i++) {
      C[i] = [];
      for (j = 0; j < m; j++) {
        C[i][j] = (jStat.dot([B[i]], [B[j]])) / (n - 1);
      }
    }
    result = jStat.jacobi(C);
    V = result[0];
    D = result[1];
    Vt = jStat.transpose(V);
    for (i = 0; i < D.length; i++) {
      for (j = i; j < D.length; j++) {
        if(D[i] < D[j])  {
          temp1 = D[i];
          D[i] = D[j];
          D[j] = temp1;
          temp2 = Vt[i];
          Vt[i] = Vt[j];
          Vt[j] = temp2;
        }
      }
    }
    Bt = jStat.transpose(B);
    for (i = 0; i < m; i++) {
      Y[i] = [];
      for (j = 0; j < Bt.length; j++) {
        Y[i][j] = jStat.dot([Vt[i]], [Bt[j]]);
      }
    }
    return [X, D, Vt, Y];
  }
});

// extend jStat.fn with methods that require one argument
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function(arg, func) {
      var tmpthis = this;
      // check for callback
      if (func) {
        setTimeout(function() {
          func.call(tmpthis, jStat.fn[passfunc].call(tmpthis, arg));
        }, 15);
        return this;
      }
      if (typeof jStat[passfunc](this, arg) === 'number')
        return jStat[passfunc](this, arg);
      else
        return jStat(jStat[passfunc](this, arg));
    };
  }(funcs[i]));
}('add divide multiply subtract dot pow abs norm angle'.split(' ')));

}(this.jStat, Math));
(function(jStat, Math) {

var slice = [].slice;
var isNumber = jStat.utils.isNumber;

// flag==true denotes use of sample standard deviation
// Z Statistics
jStat.extend({
  // 2 different parameter lists:
  // (value, mean, sd)
  // (value, array, flag)
  zscore: function zscore() {
    var args = slice.call(arguments);
    if (isNumber(args[1])) {
      return (args[0] - args[1]) / args[2];
    }
    return (args[0] - jStat.mean(args[1])) / jStat.stdev(args[1], args[2]);
  },

  // 3 different paramter lists:
  // (value, mean, sd, sides)
  // (zscore, sides)
  // (value, array, sides, flag)
  ztest: function ztest() {
    var args = slice.call(arguments);
    if (args.length === 4) {
      if(isNumber(args[1])) {
        var z = jStat.zscore(args[0],args[1],args[2])
        return (args[3] === 1) ?
          (jStat.normal.cdf(-Math.abs(z),0,1)) :
          (jStat.normal.cdf(-Math.abs(z),0,1)* 2);
      }
      var z = args[0]
      return (args[2] === 1) ?
        (jStat.normal.cdf(-Math.abs(z),0,1)) :
        (jStat.normal.cdf(-Math.abs(z),0,1)*2);
    }
    var z = jStat.zscore(args[0],args[1],args[3])
    return (args[1] === 1) ?
      (jStat.normal.cdf(-Math.abs(z), 0, 1)) :
      (jStat.normal.cdf(-Math.abs(z), 0, 1)*2);
  }
});

jStat.extend(jStat.fn, {
  zscore: function zscore(value, flag) {
    return (value - this.mean()) / this.stdev(flag);
  },

  ztest: function ztest(value, sides, flag) {
    var zscore = Math.abs(this.zscore(value, flag));
    return (sides === 1) ?
      (jStat.normal.cdf(-zscore, 0, 1)) :
      (jStat.normal.cdf(-zscore, 0, 1) * 2);
  }
});

// T Statistics
jStat.extend({
  // 2 parameter lists
  // (value, mean, sd, n)
  // (value, array)
  tscore: function tscore() {
    var args = slice.call(arguments);
    return (args.length === 4) ?
      ((args[0] - args[1]) / (args[2] / Math.sqrt(args[3]))) :
      ((args[0] - jStat.mean(args[1])) /
       (jStat.stdev(args[1], true) / Math.sqrt(args[1].length)));
  },

  // 3 different paramter lists:
  // (value, mean, sd, n, sides)
  // (tscore, n, sides)
  // (value, array, sides)
  ttest: function ttest() {
    var args = slice.call(arguments);
    var tscore;
    if (args.length === 5) {
      tscore = Math.abs(jStat.tscore(args[0], args[1], args[2], args[3]));
      return (args[4] === 1) ?
        (jStat.studentt.cdf(-tscore, args[3]-1)) :
        (jStat.studentt.cdf(-tscore, args[3]-1)*2);
    }
    if (isNumber(args[1])) {
      tscore = Math.abs(args[0])
      return (args[2] == 1) ?
        (jStat.studentt.cdf(-tscore, args[1]-1)) :
        (jStat.studentt.cdf(-tscore, args[1]-1) * 2);
    }
    tscore = Math.abs(jStat.tscore(args[0], args[1]))
    return (args[2] == 1) ?
      (jStat.studentt.cdf(-tscore, args[1].length-1)) :
      (jStat.studentt.cdf(-tscore, args[1].length-1) * 2);
  }
});

jStat.extend(jStat.fn, {
  tscore: function tscore(value) {
    return (value - this.mean()) / (this.stdev(true) / Math.sqrt(this.cols()));
  },

  ttest: function ttest(value, sides) {
    return (sides === 1) ?
      (1 - jStat.studentt.cdf(Math.abs(this.tscore(value)), this.cols()-1)) :
      (jStat.studentt.cdf(-Math.abs(this.tscore(value)), this.cols()-1)*2);
  }
});

// F Statistics
jStat.extend({
  // Paramter list is as follows:
  // (array1, array2, array3, ...)
  // or it is an array of arrays
  // array of arrays conversion
  anovafscore: function anovafscore() {
    var args = slice.call(arguments),
    expVar, sample, sampMean, sampSampMean, tmpargs, unexpVar, i, j;
    if (args.length === 1) {
      tmpargs = new Array(args[0].length);
      for (i = 0; i < args[0].length; i++) {
        tmpargs[i] = args[0][i];
      }
      args = tmpargs;
    }
    // 2 sample case
    if (args.length === 2) {
      return jStat.variance(args[0]) / jStat.variance(args[1]);
    }
    // Builds sample array
    sample = new Array();
    for (i = 0; i < args.length; i++) {
      sample = sample.concat(args[i]);
    }
    sampMean = jStat.mean(sample);
    // Computes the explained variance
    expVar = 0;
    for (i = 0; i < args.length; i++) {
      expVar = expVar + args[i].length * Math.pow(jStat.mean(args[i]) - sampMean, 2);
    }
    expVar /= (args.length - 1);
    // Computes unexplained variance
    unexpVar = 0;
    for (i = 0; i < args.length; i++) {
      sampSampMean = jStat.mean(args[i]);
      for (j = 0; j < args[i].length; j++) {
        unexpVar += Math.pow(args[i][j] - sampSampMean, 2);
      }
    }
    unexpVar /= (sample.length - args.length);
    return expVar / unexpVar;
  },

  // 2 different paramter setups
  // (array1, array2, array3, ...)
  // (anovafscore, df1, df2)
  anovaftest: function anovaftest() {
    var args = slice.call(arguments),
    df1, df2, n, i;
    if (isNumber(args[0])) {
      return 1 - jStat.centralF.cdf(args[0], args[1], args[2]);
    }
    anovafscore = jStat.anovafscore(args);
    df1 = args.length - 1;
    n = 0;
    for (i = 0; i < args.length; i++) {
      n = n + args[i].length;
    }
    df2 = n - df1 - 1;
    return 1 - jStat.centralF.cdf(anovafscore, df1, df2);
  },

  ftest: function ftest(fscore, df1, df2) {
    return 1 - jStat.centralF.cdf(fscore, df1, df2);
  }
});

jStat.extend(jStat.fn, {
  anovafscore: function anovafscore() {
    return jStat.anovafscore(this.toArray());
  },

  anovaftes: function anovaftes() {
    var n = 0;
    var i;
    for (i = 0; i < this.length; i++) {
      n = n + this[i].length;
    }
    return jStat.ftest(this.anovafscore(), this.length - 1, n - this.length);
  }
});

// Error Bounds
jStat.extend({
  // 2 different parameter setups
  // (value, alpha, sd, n)
  // (value, alpha, array)
  normalci: function normalci() {
    var args = slice.call(arguments),
    ans = new Array(2),
    change;
    if (args.length === 4) {
      change = Math.abs(jStat.normal.inv(args[1] / 2, 0, 1) *
                        args[2] / Math.sqrt(args[3]));
    } else {
      change = Math.abs(jStat.normal.inv(args[1] / 2, 0, 1) *
                        jStat.stdev(args[2]) / Math.sqrt(args[2].length));
    }
    ans[0] = args[0] - change;
    ans[1] = args[0] + change;
    return ans;
  },

  // 2 different parameter setups
  // (value, alpha, sd, n)
  // (value, alpha, array)
  tci: function tci() {
    var args = slice.call(arguments),
    ans = new Array(2),
    change;
    if (args.length === 4) {
      change = Math.abs(jStat.studentt.inv(args[1] / 2, args[3] - 1) *
                        args[2] / Math.sqrt(args[3]));
    } else {
      change = Math.abs(jStat.studentt.inv(args[1] / 2, args[2].length - 1) *
                        jStat.stdev(args[2], true) / Math.sqrt(args[2].length));
    }
    ans[0] = args[0] - change;
    ans[1] = args[0] + change;
    return ans;
  },

  significant: function significant(pvalue, alpha) {
    return pvalue < alpha;
  }
});

jStat.extend(jStat.fn, {
  normalci: function normalci(value, alpha) {
    return jStat.normalci(value, alpha, this.toArray());
  },

  tci: function tci(value, alpha) {
    return jStat.tci(value, alpha, this.toArray());
  }
});

}(this.jStat, Math));

},{}],355:[function(require,module,exports){
/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.5.3',
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',
        zeroFormat = null,
        defaultFormat = '0,0',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._value = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;
            
        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (languages[currentLanguage].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(languages[currentLanguage].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 0; power <= suffixes.length; power++) {
                    bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) * Number(string.replace(/[^0-9\.]+/g, ''));

                // round if we are talking about bytes
                n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
            }
        }
        return n._value;
    }

    function formatCurrency (n, format, roundingFunction) {
        var symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            minusSignIndex = format.indexOf('-'),
            space = '',
            spliceIndex,
            output;

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        output = formatNumber(n._value, format, roundingFunction);

        // position the symbol
        if (symbolIndex <= 1) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                spliceIndex = 1;
                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex){
                    // the symbol appears before the "(" or "-"
                    spliceIndex = 0;
                }
                output.splice(spliceIndex, 0, languages[currentLanguage].currency.symbol + space);
                output = output.join('');
            } else {
                output = languages[currentLanguage].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + languages[currentLanguage].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);
        
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime (n) {
        var hours = Math.floor(n._value/60/60),
            minutes = Math.floor((n._value - (hours * 60 * 60))/60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (value, format, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            } else if (format.indexOf('+') > -1) {
                signed = true;
                format = format.replace(/\+/g, '');
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check if abbreviation is specified
                abbrK = format.indexOf('aK') >= 0;
                abbrM = format.indexOf('aM') >= 0;
                abbrB = format.indexOf('aB') >= 0;
                abbrT = format.indexOf('aT') >= 0;
                abbrForce = abbrK || abbrM || abbrB || abbrT;

                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + languages[currentLanguage].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + languages[currentLanguage].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                for (power = 0; power <= suffixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (value >= min && value < max) {
                        bytes = bytes + suffixes[power];
                        if (min > 0) {
                            value = value / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + languages[currentLanguage].ordinal(value);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            w = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(value, null, roundingFunction);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    numeral.language = function (key, values) {
        if (!key) {
            return currentLanguage;
        }

        if (key && !values) {
            if(!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            currentLanguage = key;
        }

        if (values || !languages[key]) {
            loadLanguage(key, values);
        }

        return numeral;
    };
    
    // This function provides access to the loaded language data.  If
    // no arguments are passed in, it will simply return the current
    // global language object.
    numeral.languageData = function (key) {
        if (!key) {
            return languages[currentLanguage];
        }
        
        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }
        
        return languages[key];
    };

    numeral.language('en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    numeral.zeroFormat = function (format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numeral.defaultFormat = function (format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    /************************************
        Helpers
    ************************************/

    function loadLanguage(key, values) {
        languages[key] = values;
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function (callback, opt_initialValue) {
            'use strict';
            
            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
            
            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = opt_initialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }

    
    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function (prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
        return mp > mn ? mp : mn;
        }, -Infinity);
    }        


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (inputString, roundingFunction) {
            return formatNumeral(this, 
                  inputString ? inputString : defaultFormat, 
                  (roundingFunction !== undefined) ? roundingFunction : Math.round
              );
        },

        unformat : function (inputString) {
            if (Object.prototype.toString.call(inputString) === '[object Number]') { 
                return inputString; 
            }
            return unformatNumeral(this, inputString ? inputString : defaultFormat);
        },

        value : function () {
            return this._value;
        },

        valueOf : function () {
            return this._value;
        },

        set : function (value) {
            this._value = Number(value);
            return this;
        },

        add : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;            
            return this;
        },

        multiply : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) * (curr * corrFactor) /
                    (corrFactor * corrFactor);
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);            
            return this;
        },

        difference : function (value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }
}).call(this);

},{}],356:[function(require,module,exports){
(function (global){
"use strict";

var numeric = (typeof exports === "undefined")?(function numeric() {}):(exports);
if(typeof global !== "undefined") { global.numeric = numeric; }

numeric.version = "1.2.6";

// 1. Utility functions
numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 0.5;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
}

numeric._myIndexOf = (function _myIndexOf(w) {
    var n = this.length,k;
    for(k=0;k<n;++k) if(this[k]===w) return k;
    return -1;
});
numeric.myIndexOf = (Array.prototype.indexOf)?Array.prototype.indexOf:numeric._myIndexOf;

numeric.Function = Function;
numeric.precision = 4;
numeric.largeArray = 50;

numeric.prettyPrint = function prettyPrint(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return parseFloat(basic).toString()+'e'+scale.toString();
        }
        return 'Infinity';
    }
    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(Array(numeric.precision+8).join(' ')); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") {
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = parseFloat(x.toString()).toString();
            var d = [a,b,c,parseFloat(b).toString(),parseFloat(c).toString()];
            for(k=1;k<d.length;k++) { if(d[k].length < a.length) a = d[k]; }
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { 
            ret.push(x.toString());
            var flag = false;
            for(k in x) { if(x.hasOwnProperty(k)) { 
                if(flag) ret.push(',\n');
                else ret.push('\n{');
                flag = true; 
                ret.push(k); 
                ret.push(': \n'); 
                foo(x[k]); 
            } }
            if(flag) ret.push('}\n');
            return true;
        }
        if(x instanceof Array) {
            if(x.length > numeric.largeArray) { ret.push('...Large Array...'); return true; }
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
}

numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); }
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
}

numeric.toCSV = function toCSV(A) {
    var s = numeric.dim(A);
    var i,j,m,n,row,ret;
    m = s[0];
    n = s[1];
    ret = [];
    for(i=0;i<m;i++) {
        row = [];
        for(j=0;j<m;j++) { row[j] = A[i][j].toString(); }
        ret[i] = row.join(', ');
    }
    return ret.join('\n')+'\n';
}

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
}

numeric.imageURL = function imageURL(img) {
    function base64(A) {
        var n = A.length, i,x,y,z,p,q,r,s;
        var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var ret = "";
        for(i=0;i<n;i+=3) {
            x = A[i];
            y = A[i+1];
            z = A[i+2];
            p = x >> 2;
            q = ((x & 3) << 4) + (y >> 4);
            r = ((y & 15) << 2) + (z >> 6);
            s = z & 63;
            if(i+1>=n) { r = s = 64; }
            else if(i+2>=n) { s = 64; }
            ret += key.charAt(p) + key.charAt(q) + key.charAt(r) + key.charAt(s);
            }
        return ret;
    }
    function crc32Array (a,from,to) {
        if(typeof from === "undefined") { from = 0; }
        if(typeof to === "undefined") { to = a.length; }
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
                     0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
                     0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
                     0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
                     0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
                     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
                     0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
                     0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
                     0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
                     0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
                     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
                     0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
                     0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
                     0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
                     0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
                     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
                     0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
                     0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
                     0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
                     0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
                     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
                     0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
                     0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
                     0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
                     0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
                     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
                     0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
                     0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
                     0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
                     0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
                     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
                     0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
     
        var crc = -1, y = 0, n = a.length,i;

        for (i = from; i < to; i++) {
            y = (crc ^ a[i]) & 0xFF;
            crc = (crc >>> 8) ^ table[y];
        }
     
        return crc ^ (-1);
    }

    var h = img[0].length, w = img[0][0].length, s1, s2, next,k,length,a,b,i,j,adler32,crc32;
    var stream = [
                  137, 80, 78, 71, 13, 10, 26, 10,                           //  0: PNG signature
                  0,0,0,13,                                                  //  8: IHDR Chunk length
                  73, 72, 68, 82,                                            // 12: "IHDR" 
                  (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w&255,   // 16: Width
                  (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h&255,   // 20: Height
                  8,                                                         // 24: bit depth
                  2,                                                         // 25: RGB
                  0,                                                         // 26: deflate
                  0,                                                         // 27: no filter
                  0,                                                         // 28: no interlace
                  -1,-2,-3,-4,                                               // 29: CRC
                  -5,-6,-7,-8,                                               // 33: IDAT Chunk length
                  73, 68, 65, 84,                                            // 37: "IDAT"
                  // RFC 1950 header starts here
                  8,                                                         // 41: RFC1950 CMF
                  29                                                         // 42: RFC1950 FLG
                  ];
    crc32 = crc32Array(stream,12,29);
    stream[29] = (crc32>>24)&255;
    stream[30] = (crc32>>16)&255;
    stream[31] = (crc32>>8)&255;
    stream[32] = (crc32)&255;
    s1 = 1;
    s2 = 0;
    for(i=0;i<h;i++) {
        if(i<h-1) { stream.push(0); }
        else { stream.push(1); }
        a = (3*w+1+(i===0))&255; b = ((3*w+1+(i===0))>>8)&255;
        stream.push(a); stream.push(b);
        stream.push((~a)&255); stream.push((~b)&255);
        if(i===0) stream.push(0);
        for(j=0;j<w;j++) {
            for(k=0;k<3;k++) {
                a = img[k][i][j];
                if(a>255) a = 255;
                else if(a<0) a=0;
                else a = Math.round(a);
                s1 = (s1 + a )%65521;
                s2 = (s2 + s1)%65521;
                stream.push(a);
            }
        }
        stream.push(0);
    }
    adler32 = (s2<<16)+s1;
    stream.push((adler32>>24)&255);
    stream.push((adler32>>16)&255);
    stream.push((adler32>>8)&255);
    stream.push((adler32)&255);
    length = stream.length - 41;
    stream[33] = (length>>24)&255;
    stream[34] = (length>>16)&255;
    stream[35] = (length>>8)&255;
    stream[36] = (length)&255;
    crc32 = crc32Array(stream,37);
    stream.push((crc32>>24)&255);
    stream.push((crc32>>16)&255);
    stream.push((crc32>>8)&255);
    stream.push((crc32)&255);
    stream.push(0);
    stream.push(0);
    stream.push(0);
    stream.push(0);
//    a = stream.length;
    stream.push(73);  // I
    stream.push(69);  // E
    stream.push(78);  // N
    stream.push(68);  // D
    stream.push(174); // CRC1
    stream.push(66);  // CRC2
    stream.push(96);  // CRC3
    stream.push(130); // CRC4
    return 'data:image/png;base64,'+base64(stream);
}

// 2. Linear algebra with Arrays.
numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof x === "number") { var xi = x; '+body+'; return accum; }\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=1;i-=2) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '}\n'+
            'if(i === 0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '}\n'+
            'return accum;'
            );
}
numeric.mapreduce2 = function mapreduce2(body,setup) {
    return Function('x',
            'var n = x.length;\n'+
            'var i,xi;\n'+setup+';\n'+
            'for(i=n-1;i!==-1;--i) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '}\n'+
            'return accum;'
            );
}


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
}

numeric.rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = numeric.rep(s,v,k+1); }
    return ret;
}


numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}
numeric._getCol = function _getCol(A,j,x) {
    var n = A.length, i;
    for(i=n-1;i>0;--i) {
        x[i] = A[i][j];
        --i;
        x[i] = A[i][j];
    }
    if(i===0) x[0] = A[0][j];
}
numeric.dotMMbig = function dotMMbig(x,y){
    var gc = numeric._getCol, p = y.length, v = Array(p);
    var m = x.length, n = y[0].length, A = new Array(m), xj;
    var VV = numeric.dotVV;
    var i,j,k,z;
    --p;
    --m;
    for(i=m;i!==-1;--i) A[i] = Array(n);
    --n;
    for(i=n;i!==-1;--i) {
        gc(y,i,v);
        for(j=m;j!==-1;--j) {
            z=0;
            xj = x[j];
            A[j][i] = VV(xj,v);
        }
    }
    return A;
}

numeric.dotMV = function dotMV(x,y) {
    var p = x.length, q = y.length,i;
    var ret = Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
}

numeric.dotVM = function dotVM(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    p = x.length; q = y[0].length;
    ret = Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=1;j-=2) {
            i0 = j-1;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k];
        }
        if(j===0) { woo += x[0]*y[0][k]; }
        ret[k] = woo;
    }
    return ret;
}

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=1;i-=2) {
        i1 = i-1;
        ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }
    return ret;
}

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 10) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
}

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = Array(n);
        i1 = i+2;
        for(j=n-1;j>=i1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j>i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for(j=i-1;j>=1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j===0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
}
numeric.getDiag = function(A) {
    var n = Math.min(A.length,A[0].length),i,ret = Array(n);
    for(i=n-1;i>=1;--i) {
        ret[i] = A[i][i];
        --i;
        ret[i] = A[i][i];
    }
    if(i===0) {
        ret[0] = A[0][0];
    }
    return ret;
}

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); }
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            '    '+body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric.pointwise2 = function pointwise2(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = (
            'var _n = '+thevec+'.length;\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
});
numeric._biforeach2 = (function _biforeach2(x,y,s,k,f) {
    if(k === s.length-1) { return f(x,y); }
    var i,n=s[k],ret = Array(n);
    for(i=n-1;i>=0;--i) { ret[i] = _biforeach2(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
    return ret;
});
numeric._foreach = (function _foreach(x,s,k,f) {
    if(k === s.length-1) { f(x); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _foreach(x[i],s,k+1,f); }
});
numeric._foreach2 = (function _foreach2(x,s,k,f) {
    if(k === s.length-1) { return f(x); }
    var i,n=s[k], ret = Array(n);
    for(i=n-1;i>=0;i--) { ret[i] = _foreach2(x[i],s,k+1,f); }
    return ret;
});

/*numeric.anyV = numeric.mapreduce('if(xi) return true;','false');
numeric.allV = numeric.mapreduce('if(!xi) return false;','true');
numeric.any = function(x) { if(typeof x.length === "undefined") return x; return numeric.anyV(x); }
numeric.all = function(x) { if(typeof x.length === "undefined") return x; return numeric.allV(x); }*/

numeric.ops2 = {
        add: '+',
        sub: '-',
        mul: '*',
        div: '/',
        mod: '%',
        and: '&&',
        or:  '||',
        eq:  '===',
        neq: '!==',
        lt:  '<',
        gt:  '>',
        leq: '<=',
        geq: '>=',
        band: '&',
        bor: '|',
        bxor: '^',
        lshift: '<<',
        rshift: '>>',
        rrshift: '>>>'
};
numeric.opseq = {
        addeq: '+=',
        subeq: '-=',
        muleq: '*=',
        diveq: '/=',
        modeq: '%=',
        lshifteq: '<<=',
        rshifteq: '>>=',
        rrshifteq: '>>>=',
        bandeq: '&=',
        boreq: '|=',
        bxoreq: '^='
};
numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                    'exp','floor','log','round','sin','sqrt','tan',
                    'isNaN','isFinite'];
numeric.mathfuns2 = ['atan2','pow','max','min'];
numeric.ops1 = {
        neg: '-',
        not: '!',
        bnot: '~',
        clone: ''
};
numeric.mapreducers = {
        any: ['if(xi) return true;','var accum = false;'],
        all: ['if(!xi) return false;','var accum = true;'],
        sum: ['accum += xi;','var accum = 0;'],
        prod: ['accum *= xi;','var accum = 1;'],
        norm2Squared: ['accum += xi*xi;','var accum = 0;'],
        norminf: ['accum = max(accum,abs(xi));','var accum = 0, max = Math.max, abs = Math.abs;'],
        norm1: ['accum += abs(xi)','var accum = 0, abs = Math.abs;'],
        sup: ['accum = max(accum,xi);','var accum = -Infinity, max = Math.max;'],
        inf: ['accum = min(accum,xi);','var accum = Infinity, min = Math.min;']
};

(function () {
    var i,o;
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        numeric.ops2[o] = o;
    }
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            var code, codeeq, setup = '';
            if(numeric.myIndexOf.call(numeric.mathfuns2,i)!==-1) {
                setup = 'var '+o+' = Math.'+o+';\n';
                code = function(r,x,y) { return r+' = '+o+'('+x+','+y+')'; };
                codeeq = function(x,y) { return x+' = '+o+'('+x+','+y+')'; };
            } else {
                code = function(r,x,y) { return r+' = '+x+' '+o+' '+y; };
                if(numeric.opseq.hasOwnProperty(i+'eq')) {
                    codeeq = function(x,y) { return x+' '+o+'= '+y; };
                } else {
                    codeeq = function(x,y) { return x+' = '+x+' '+o+' '+y; };                    
                }
            }
            numeric[i+'VV'] = numeric.pointwise2(['x[i]','y[i]'],code('ret[i]','x[i]','y[i]'),setup);
            numeric[i+'SV'] = numeric.pointwise2(['x','y[i]'],code('ret[i]','x','y[i]'),setup);
            numeric[i+'VS'] = numeric.pointwise2(['x[i]','y'],code('ret[i]','x[i]','y'),setup);
            numeric[i] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var VV = numeric.'+i+'VV, VS = numeric.'+i+'VS, SV = numeric.'+i+'SV;\n'+
                    'var dim = numeric.dim;\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof x === "object") {\n'+
                    '      if(typeof y === "object") x = numeric._biforeach2(x,y,dim(x),0,VV);\n'+
                    '      else x = numeric._biforeach2(x,y,dim(x),0,VS);\n'+
                    '  } else if(typeof y === "object") x = numeric._biforeach2(x,y,dim(y),0,SV);\n'+
                    '  else '+codeeq('x','y')+'\n'+
                    '}\nreturn x;\n');
            numeric[o] = numeric[i];
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]','x[i]'], codeeq('ret[i]','x[i]'),setup);
            numeric[i+'eqS'] = numeric.pointwise2(['ret[i]','x'], codeeq('ret[i]','x'),setup);
            numeric[i+'eq'] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var V = numeric.'+i+'eqV, S = numeric.'+i+'eqS\n'+
                    'var s = numeric.dim(x);\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof y === "object") numeric._biforeach(x,y,s,0,V);\n'+
                    '  else numeric._biforeach(x,y,s,0,S);\n'+
                    '}\nreturn x;\n');
        }
    }
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        delete numeric.ops2[o];
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        numeric.ops1[o] = o;
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            setup = '';
            o = numeric.ops1[i];
            if(numeric.myIndexOf.call(numeric.mathfuns,i)!==-1) {
                if(Math.hasOwnProperty(o)) setup = 'var '+o+' = Math.'+o+';\n';
            }
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]'],'ret[i] = '+o+'(ret[i]);',setup);
            numeric[i+'eq'] = Function('x',
                    'if(typeof x !== "object") return '+o+'x\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'eqV;\n'+
                    'var s = numeric.dim(x);\n'+
                    'numeric._foreach(x,s,0,V);\n'+
                    'return x;\n');
            numeric[i+'V'] = numeric.pointwise2(['x[i]'],'ret[i] = '+o+'(x[i]);',setup);
            numeric[i] = Function('x',
                    'if(typeof x !== "object") return '+o+'(x)\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'V;\n'+
                    'var s = numeric.dim(x);\n'+
                    'return numeric._foreach2(x,s,0,V);\n');
        }
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        delete numeric.ops1[o];
    }
    for(i in numeric.mapreducers) {
        if(numeric.mapreducers.hasOwnProperty(i)) {
            o = numeric.mapreducers[i];
            numeric[i+'V'] = numeric.mapreduce2(o[0],o[1]);
            numeric[i] = Function('x','s','k',
                    o[1]+
                    'if(typeof x !== "object") {'+
                    '    xi = x;\n'+
                    o[0]+';\n'+
                    '    return accum;\n'+
                    '}'+
                    'if(typeof s === "undefined") s = numeric.dim(x);\n'+
                    'if(typeof k === "undefined") k = 0;\n'+
                    'if(k === s.length-1) return numeric.'+i+'V(x);\n'+
                    'var xi;\n'+
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i!==-1;--i) {\n'+
                    '   xi = arguments.callee(x[i]);\n'+
                    o[0]+';\n'+
                    '}\n'+
                    'return accum;\n');
        }
    }
}());

numeric.truncVV = numeric.pointwise(['x[i]','y[i]'],'ret[i] = round(x[i]/y[i])*y[i];','var round = Math.round;');
numeric.truncVS = numeric.pointwise(['x[i]','y'],'ret[i] = round(x[i]/y)*y;','var round = Math.round;');
numeric.truncSV = numeric.pointwise(['x','y[i]'],'ret[i] = round(x/y[i])*y[i];','var round = Math.round;');
numeric.trunc = function trunc(x,y) {
    if(typeof x === "object") {
        if(typeof y === "object") return numeric.truncVV(x,y);
        return numeric.truncVS(x,y);
    }
    if (typeof y === "object") return numeric.truncSV(x,y);
    return Math.round(x/y)*y;
}

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs, m = s[0], n = s[1];
    var A = numeric.clone(x), Ai, Aj;
    var I = numeric.identity(m), Ii, Ij;
    var i,j,k,x;
    for(j=0;j<n;++j) {
        var i0 = -1;
        var v0 = -1;
        for(i=j;i!==m;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for(k=j;k!==n;++k)    Aj[k] /= x; 
        for(k=n-1;k!==-1;--k) Ij[k] /= x;
        for(i=m-1;i!==-1;--i) {
            if(i!==j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for(k=j+1;k!==n;++k)  Ai[k] -= Aj[k]*x;
                for(k=n-1;k>0;--k) { Ii[k] -= Ij[k]*x; --k; Ii[k] -= Ij[k]*x; }
                if(k===0) Ii[0] -= Ij[0]*x;
            }
        }
    }
    return I;
}

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.clone(x),Aj,Ai,alpha,temp,k1,k2,k3;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-1;k+=2) {
                k1 = k+1;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
            }
            if(k!==n) { Ai[k] -= Aj[k]*alpha; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
}

numeric.transpose = function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
}
numeric.negtranspose = function negtranspose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
            --j;
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = -A1[0]; Bj[i-1] = -A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = -A0[j];
            --j;
            ret[j][0] = -A0[j];
        }
        if(j===0) { ret[0][0] = -A0[0]; }
    }
    return ret;
}

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=Array(n), rnd;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=1;i-=2) {
            ret[i] = rnd();
            ret[i-1] = rnd();
        }
        if(i===0) { ret[0] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _random(s,k+1);
    return ret;
}
numeric.random = function random(s) { return numeric._random(s,0); }

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); }

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
}

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
}

numeric.getRange = function getRange(A,I,J) {
    var m = I.length, n = J.length;
    var i,j;
    var B = Array(m), Bi, AI;
    for(i=m-1;i!==-1;--i) {
        B[i] = Array(n);
        Bi = B[i];
        AI = A[I[i]];
        for(j=n-1;j!==-1;--j) Bi[j] = AI[J[j]];
    }
    return B;
}

numeric.blockMatrix = function blockMatrix(X) {
    var s = numeric.dim(X);
    if(s.length<4) return numeric.blockMatrix([X]);
    var m=s[0],n=s[1],M,N,i,j,Xij;
    M = 0; N = 0;
    for(i=0;i<m;++i) M+=X[i][0].length;
    for(j=0;j<n;++j) N+=X[0][j][0].length;
    var Z = Array(M);
    for(i=0;i<M;++i) Z[i] = Array(N);
    var I=0,J,ZI,k,l,Xijk;
    for(i=0;i<m;++i) {
        J=N;
        for(j=n-1;j!==-1;--j) {
            Xij = X[i][j];
            J -= Xij[0].length;
            for(k=Xij.length-1;k!==-1;--k) {
                Xijk = Xij[k];
                ZI = Z[I+k];
                for(l = Xijk.length-1;l!==-1;--l) ZI[J+l] = Xijk[l];
            }
        }
        I += X[i][0].length;
    }
    return Z;
}

numeric.tensor = function tensor(x,y) {
    if(typeof x === "number" || typeof y === "number") return numeric.mul(x,y);
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = Array(m), Ai, i,j,xi;
    for(i=m-1;i>=0;i--) {
        Ai = Array(n);
        xi = x[i];
        for(j=n-1;j>=3;--j) {
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
        }
        while(j>=0) { Ai[j] = xi * y[j]; --j; }
        A[i] = Ai;
    }
    return A;
}

// 3. The Tensor type T
numeric.T = function T(x,y) { this.x = x; this.y = y; }
numeric.t = function t(x,y) { return new numeric.T(x,y); }

numeric.Tbinop = function Tbinop(rr,rc,cr,cc,setup) {
    var io = numeric.indexOf;
    if(typeof setup !== "string") {
        var k;
        setup = '';
        for(k in numeric) {
            if(numeric.hasOwnProperty(k) && (rr.indexOf(k)>=0 || rc.indexOf(k)>=0 || cr.indexOf(k)>=0 || cc.indexOf(k)>=0) && k.length>1) {
                setup += 'var '+k+' = numeric.'+k+';\n';
            }
        }
    }
    return Function(['y'],
            'var x = this;\n'+
            'if(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n'+
            setup+'\n'+
            'if(x.y) {'+
            '  if(y.y) {'+
            '    return new numeric.T('+cc+');\n'+
            '  }\n'+
            '  return new numeric.T('+cr+');\n'+
            '}\n'+
            'if(y.y) {\n'+
            '  return new numeric.T('+rc+');\n'+
            '}\n'+
            'return new numeric.T('+rr+');\n'
    );
}

numeric.T.prototype.add = numeric.Tbinop(
        'add(x.x,y.x)',
        'add(x.x,y.x),y.y',
        'add(x.x,y.x),x.y',
        'add(x.x,y.x),add(x.y,y.y)');
numeric.T.prototype.sub = numeric.Tbinop(
        'sub(x.x,y.x)',
        'sub(x.x,y.x),neg(y.y)',
        'sub(x.x,y.x),x.y',
        'sub(x.x,y.x),sub(x.y,y.y)');
numeric.T.prototype.mul = numeric.Tbinop(
        'mul(x.x,y.x)',
        'mul(x.x,y.x),mul(x.x,y.y)',
        'mul(x.x,y.x),mul(x.y,y.x)',
        'sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))');

numeric.T.prototype.reciprocal = function reciprocal() {
    var mul = numeric.mul, div = numeric.div;
    if(this.y) {
        var d = numeric.add(mul(this.x,this.x),mul(this.y,this.y));
        return new numeric.T(div(this.x,d),div(numeric.neg(this.y),d));
    }
    return new T(div(1,this.x));
}
numeric.T.prototype.div = function div(y) {
    if(!(y instanceof numeric.T)) y = new numeric.T(y);
    if(y.y) { return this.mul(y.reciprocal()); }
    var div = numeric.div;
    if(this.y) { return new numeric.T(div(this.x,y.x),div(this.y,y.x)); }
    return new numeric.T(div(this.x,y.x));
}
numeric.T.prototype.dot = numeric.Tbinop(
        'dot(x.x,y.x)',
        'dot(x.x,y.x),dot(x.x,y.y)',
        'dot(x.x,y.x),dot(x.y,y.x)',
        'sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))'
        );
numeric.T.prototype.transpose = function transpose() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),t(y)); }
    return new numeric.T(t(x));
}
numeric.T.prototype.transjugate = function transjugate() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),numeric.negtranspose(y)); }
    return new numeric.T(t(x));
}
numeric.Tunop = function Tunop(r,c,s) {
    if(typeof s !== "string") { s = ''; }
    return Function(
            'var x = this;\n'+
            s+'\n'+
            'if(x.y) {'+
            '  '+c+';\n'+
            '}\n'+
            r+';\n'
    );
}

numeric.T.prototype.exp = numeric.Tunop(
        'return new numeric.T(ex)',
        'return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))',
        'var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;');
numeric.T.prototype.conj = numeric.Tunop(
        'return new numeric.T(x.x);',
        'return new numeric.T(x.x,numeric.neg(x.y));');
numeric.T.prototype.neg = numeric.Tunop(
        'return new numeric.T(neg(x.x));',
        'return new numeric.T(neg(x.x),neg(x.y));',
        'var neg = numeric.neg;');
numeric.T.prototype.sin = numeric.Tunop(
        'return new numeric.T(numeric.sin(x.x))',
        'return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));');
numeric.T.prototype.cos = numeric.Tunop(
        'return new numeric.T(numeric.cos(x.x))',
        'return x.exp().add(x.neg().exp()).div(2);');
numeric.T.prototype.abs = numeric.Tunop(
        'return new numeric.T(numeric.abs(x.x));',
        'return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));',
        'var mul = numeric.mul;');
numeric.T.prototype.log = numeric.Tunop(
        'return new numeric.T(numeric.log(x.x));',
        'var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\n'+
        'return new numeric.T(numeric.log(r.x),theta.x);');
numeric.T.prototype.norm2 = numeric.Tunop(
        'return numeric.norm2(x.x);',
        'var f = numeric.norm2Squared;\n'+
        'return Math.sqrt(f(x.x)+f(x.y));');
numeric.T.prototype.inv = function inv() {
    var A = this;
    if(typeof A.y === "undefined") { return new numeric.T(numeric.inv(A.x)); }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.clone(A.x), Ay = numeric.clone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return new numeric.T(Rx,Ry);
}
numeric.T.prototype.get = function get(i) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length;
    if(y) {
        while(k<n) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        return new numeric.T(x,y);
    }
    while(k<n) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    return new numeric.T(x);
}
numeric.T.prototype.set = function set(i,v) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length, vx = v.x, vy = v.y;
    if(n===0) {
        if(vy) { this.y = vy; }
        else if(y) { this.y = undefined; }
        this.x = x;
        return this;
    }
    if(vy) {
        if(y) { /* ok */ }
        else {
            y = numeric.rep(numeric.dim(x),0);
            this.y = y;
        }
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        y[ik] = vy;
        return this;
    }
    if(y) {
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        if(vx instanceof Array) y[ik] = numeric.rep(numeric.dim(vx),0);
        else y[ik] = 0;
        return this;
    }
    while(k<n-1) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    ik = i[k];
    x[ik] = vx;
    return this;
}
numeric.T.prototype.getRows = function getRows(i0,i1) {
    var n = i1-i0+1, j;
    var rx = Array(n), ry, x = this.x, y = this.y;
    for(j=i0;j<=i1;j++) { rx[j-i0] = x[j]; }
    if(y) {
        ry = Array(n);
        for(j=i0;j<=i1;j++) { ry[j-i0] = y[j]; }
        return new numeric.T(rx,ry);
    }
    return new numeric.T(rx);
}
numeric.T.prototype.setRows = function setRows(i0,i1,A) {
    var j;
    var rx = this.x, ry = this.y, x = A.x, y = A.y;
    for(j=i0;j<=i1;j++) { rx[j] = x[j-i0]; }
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        for(j=i0;j<=i1;j++) { ry[j] = y[j-i0]; }
    } else if(ry) {
        for(j=i0;j<=i1;j++) { ry[j] = numeric.rep([x[j-i0].length],0); }
    }
    return this;
}
numeric.T.prototype.getRow = function getRow(k) {
    var x = this.x, y = this.y;
    if(y) { return new numeric.T(x[k],y[k]); }
    return new numeric.T(x[k]);
}
numeric.T.prototype.setRow = function setRow(i,v) {
    var rx = this.x, ry = this.y, x = v.x, y = v.y;
    rx[i] = x;
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        ry[i] = y;
    } else if(ry) {
        ry = numeric.rep([x.length],0);
    }
    return this;
}

numeric.T.prototype.getBlock = function getBlock(from,to) {
    var x = this.x, y = this.y, b = numeric.getBlock;
    if(y) { return new numeric.T(b(x,from,to),b(y,from,to)); }
    return new numeric.T(b(x,from,to));
}
numeric.T.prototype.setBlock = function setBlock(from,to,A) {
    if(!(A instanceof numeric.T)) A = new numeric.T(A);
    var x = this.x, y = this.y, b = numeric.setBlock, Ax = A.x, Ay = A.y;
    if(Ay) {
        if(!y) { this.y = numeric.rep(numeric.dim(this),0); y = this.y; }
        b(x,from,to,Ax);
        b(y,from,to,Ay);
        return this;
    }
    b(x,from,to,Ax);
    if(y) b(y,from,to,numeric.rep(numeric.dim(Ax),0));
}
numeric.T.rep = function rep(s,v) {
    var T = numeric.T;
    if(!(v instanceof T)) v = new T(v);
    var x = v.x, y = v.y, r = numeric.rep;
    if(y) return new T(r(s,x),r(s,y));
    return new T(r(s,x));
}
numeric.T.diag = function diag(d) {
    if(!(d instanceof numeric.T)) d = new numeric.T(d);
    var x = d.x, y = d.y, diag = numeric.diag;
    if(y) return new numeric.T(diag(x),diag(y));
    return new numeric.T(diag(x));
}
numeric.T.eig = function eig() {
    if(this.y) { throw new Error('eig: not implemented for complex matrices.'); }
    return numeric.eig(this.x);
}
numeric.T.identity = function identity(n) { return new numeric.T(numeric.identity(n)); }
numeric.T.prototype.getDiag = function getDiag() {
    var n = numeric;
    var x = this.x, y = this.y;
    if(y) { return new n.T(n.getDiag(x),n.getDiag(y)); }
    return new n.T(n.getDiag(x));
}

// 4. Eigenvalues of real matrices

numeric.house = function house(x) {
    var v = numeric.clone(x);
    var s = x[0] >= 0 ? 1 : -1;
    var alpha = s*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    if(foo === 0) { /* this should not happen */ throw new Error('eig: internal error'); }
    return numeric.div(v,foo);
}

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.clone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        if(numeric.norm2(x)>0) {
            v = numeric.house(x);
            B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
            B = Array(m-j-1);
            for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    return {H:A, Q:Q};
}

numeric.epsilon = 2.220446049250313e-16;

numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.clone(H);
    var H0 = numeric.clone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = numeric.epsilon;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,s1+s2)),
                               numeric.diag(numeric.rep([3],s1*s2)));
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.diag(numeric.rep([3],det)));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = numeric.house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            for(k=j;k<=j+1;k++) {
                if(Math.abs(H[k+1][k]) < epsilon*(Math.abs(H[k][k])+Math.abs(H[k+1][k+1]))) {
                    var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[k,k]),maxiter);
                    var QH2 = numeric.QRFrancis(numeric.getBlock(H,[k+1,k+1],[m-1,m-1]),maxiter);
                    B = Array(k+1);
                    for(i=0;i<=k;i++) { B[i] = Q[i]; }
                    C = numeric.dot(QH1.Q,B);
                    for(i=0;i<=k;i++) { Q[i] = C[i]; }
                    B = Array(m-k-1);
                    for(i=k+1;i<m;i++) { B[i-k-1] = Q[i]; }
                    C = numeric.dot(QH2.Q,B);
                    for(i=k+1;i<m;i++) { Q[i] = C[i-k-1]; }
                    return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,k+1))};
                }
            }
            J = Math.min(m-1,j+3);
            x = Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = numeric.house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
}

numeric.eig = function eig(A,maxiter) {
    var QH = numeric.toUpperHessenberg(A);
    var QB = numeric.QRFrancis(QH.H,maxiter);
    var T = numeric.T;
    var n = A.length,i,k,flag = false,B = QB.B,H = numeric.dot(QB.Q,numeric.dot(QH.H,numeric.transpose(QB.Q)));
    var Q = new T(numeric.dot(QB.Q,QH.Q)),Q0;
    var m = B.length,j;
    var a,b,c,d,p1,p2,disc,x,y,p,q,n1,n2;
    var sqrt = Math.sqrt;
    for(k=0;k<m;k++) {
        i = B[k][0];
        if(i === B[k][1]) {
            // nothing
        } else {
            j = i+1;
            a = H[i][i];
            b = H[i][j];
            c = H[j][i];
            d = H[j][j];
            if(b === 0 && c === 0) continue;
            p1 = -a-d;
            p2 = a*d-b*c;
            disc = p1*p1-4*p2;
            if(disc>=0) {
                if(p1<0) x = -0.5*(p1-sqrt(disc));
                else     x = -0.5*(p1+sqrt(disc));
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1);
                    p = (a-x)/n1;
                    q = b/n1;
                } else {
                    n2 = sqrt(n2);
                    p = c/n2;
                    q = (d-x)/n2;
                }
                Q0 = new T([[q,-p],[p,q]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            } else {
                x = -0.5*p1;
                y = 0.5*sqrt(-disc);
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1+y*y);
                    p = (a-x)/n1;
                    q = b/n1;
                    x = 0;
                    y /= n1;
                } else {
                    n2 = sqrt(n2+y*y);
                    p = c/n2;
                    q = (d-x)/n2;
                    x = y/n2;
                    y = 0;
                }
                Q0 = new T([[q,-p],[p,q]],[[x,y],[y,-x]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            }
        }
    }
    var R = Q.dot(A).dot(Q.transjugate()), n = A.length, E = numeric.T.identity(n);
    for(j=0;j<n;j++) {
        if(j>0) {
            for(k=j-1;k>=0;k--) {
                var Rk = R.get([k,k]), Rj = R.get([j,j]);
                if(numeric.neq(Rk.x,Rj.x) || numeric.neq(Rk.y,Rj.y)) {
                    x = R.getRow(k).getBlock([k],[j-1]);
                    y = E.getRow(j).getBlock([k],[j-1]);
                    E.set([j,k],(R.get([k,j]).neg().sub(x.dot(y))).div(Rk.sub(Rj)));
                } else {
                    E.setRow(j,E.getRow(k));
                    continue;
                }
            }
        }
    }
    for(j=0;j<n;j++) {
        x = E.getRow(j);
        E.setRow(j,x.div(x.norm2()));
    }
    E = E.transpose();
    E = Q.transjugate().dot(E);
    return { lambda:R.getDiag(), E:E };
};

// 5. Compressed Column Storage matrices
numeric.ccsSparse = function ccsSparse(A) {
    var m = A.length,n,foo, i,j, counts = [];
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            j = parseInt(j);
            while(j>=counts.length) counts[counts.length] = 0;
            if(foo[j]!==0) counts[j]++;
        }
    }
    var n = counts.length;
    var Ai = Array(n+1);
    Ai[0] = 0;
    for(i=0;i<n;++i) Ai[i+1] = Ai[i] + counts[i];
    var Aj = Array(Ai[n]), Av = Array(Ai[n]);
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            if(foo[j]!==0) {
                counts[j]--;
                Aj[Ai[j]+counts[j]] = i;
                Av[Ai[j]+counts[j]] = foo[j];
            }
        }
    }
    return [Ai,Aj,Av];
}
numeric.ccsFull = function ccsFull(A) {
    var Ai = A[0], Aj = A[1], Av = A[2], s = numeric.ccsDim(A), m = s[0], n = s[1], i,j,j0,j1,k;
    var B = numeric.rep([m,n],0);
    for(i=0;i<n;i++) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j<j1;++j) { B[Aj[j]][i] = Av[j]; }
    }
    return B;
}
numeric.ccsTSolve = function ccsTSolve(A,b,x,bj,xj) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, max = Math.max,n=0;
    if(typeof bj === "undefined") x = numeric.rep([m],0);
    if(typeof bj === "undefined") bj = numeric.linspace(0,x.length-1);
    if(typeof xj === "undefined") xj = [];
    function dfs(j) {
        var k;
        if(x[j] !== 0) return;
        x[j] = 1;
        for(k=Ai[j];k<Ai[j+1];++k) dfs(Aj[k]);
        xj[n] = j;
        ++n;
    }
    var i,j,j0,j1,k,l,l0,l1,a;
    for(i=bj.length-1;i!==-1;--i) { dfs(bj[i]); }
    xj.length = n;
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=bj.length-1;i!==-1;--i) { j = bj[i]; x[j] = b[j]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = max(Ai[j+1],j0);
        for(k=j0;k!==j1;++k) { if(Aj[k] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k!==j1;++k) {
            l = Aj[k];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsDFS = function ccsDFS(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[J];
    k1[0] = k11 = Ai[J+1];
    while(1) {
        if(km >= k11) {
            xj[n] = j[m];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Pinv[Aj[km]];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve = function ccsLPSolve(A,B,x,xj,I,Pinv,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Pinv[Bj[i]],Ai,Aj,x,xj,Pinv); }
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=i0;i!==i1;++i) { j = Pinv[Bj[i]]; x[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Pinv[Aj[k]] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k<j1;++k) {
            l = Pinv[Aj[k]];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsLUP1 = function ccsLUP1(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var x = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,x,xj,i,Pinv,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(x[k]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(x[i])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
            a = x[i]; x[i] = x[e]; x[e] = a;
        }
        a = Li[i];
        e = Ui[i];
        d = x[i];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = x[k];
            xj[j] = 0;
            x[k] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsDFS0 = function ccsDFS0(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS0.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv,P) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[Pinv[J]];
    k1[0] = k11 = Ai[Pinv[J]+1];
    while(1) {
        if(isNaN(km)) throw new Error("Ow!");
        if(km >= k11) {
            xj[n] = Pinv[j[m]];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Aj[km];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                foo = Pinv[foo];
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve0 = function ccsLPSolve0(A,B,y,xj,I,Pinv,P,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Bj[i],Ai,Aj,y,xj,Pinv,P); }
    for(i=xj.length-1;i!==-1;--i) { j = xj[i]; y[P[j]] = 0; }
    for(i=i0;i!==i1;++i) { j = Bj[i]; y[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        l = P[j];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Aj[k] === l) { y[l] /= Av[k]; break; } }
        a = y[l];
        for(k=j0;k<j1;++k) y[Aj[k]] -= a*Av[k];
        y[l] = a;
    }
}
numeric.ccsLUP0 = function ccsLUP0(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var y = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve0, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS0(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,y,xj,i,Pinv,P,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(y[P[k]]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(y[P[i]])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
        }
        a = Li[i];
        e = Ui[i];
        d = y[P[i]];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = y[P[k]];
            xj[j] = 0;
            y[P[k]] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsLUP = numeric.ccsLUP0;

numeric.ccsDim = function ccsDim(A) { return [numeric.sup(A[1])+1,A[0].length-1]; }
numeric.ccsGetBlock = function ccsGetBlock(A,i,j) {
    var s = numeric.ccsDim(A),m=s[0],n=s[1];
    if(typeof i === "undefined") { i = numeric.linspace(0,m-1); }
    else if(typeof i === "number") { i = [i]; }
    if(typeof j === "undefined") { j = numeric.linspace(0,n-1); }
    else if(typeof j === "number") { j = [j]; }
    var p,p0,p1,P = i.length,q,Q = j.length,r,jq,ip;
    var Bi = numeric.rep([n],0), Bj=[], Bv=[], B = [Bi,Bj,Bv];
    var Ai = A[0], Aj = A[1], Av = A[2];
    var x = numeric.rep([m],0),count=0,flags = numeric.rep([m],0);
    for(q=0;q<Q;++q) {
        jq = j[q];
        var q0 = Ai[jq];
        var q1 = Ai[jq+1];
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 1;
            x[r] = Av[p];
        }
        for(p=0;p<P;++p) {
            ip = i[p];
            if(flags[ip]) {
                Bj[count] = p;
                Bv[count] = x[i[p]];
                ++count;
            }
        }
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 0;
        }
        Bi[q+1] = count;
    }
    return B;
}

numeric.ccsDot = function ccsDot(A,B) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var Bi = B[0], Bj = B[1], Bv = B[2];
    var sA = numeric.ccsDim(A), sB = numeric.ccsDim(B);
    var m = sA[0], n = sA[1], o = sB[1];
    var x = numeric.rep([m],0), flags = numeric.rep([m],0), xj = Array(m);
    var Ci = numeric.rep([o],0), Cj = [], Cv = [], C = [Ci,Cj,Cv];
    var i,j,k,j0,j1,i0,i1,l,p,a,b;
    for(k=0;k!==o;++k) {
        j0 = Bi[k];
        j1 = Bi[k+1];
        p = 0;
        for(j=j0;j<j1;++j) {
            a = Bj[j];
            b = Bv[j];
            i0 = Ai[a];
            i1 = Ai[a+1];
            for(i=i0;i<i1;++i) {
                l = Aj[i];
                if(flags[l]===0) {
                    xj[p] = l;
                    flags[l] = 1;
                    p = p+1;
                }
                x[l] = x[l] + Av[i]*b;
            }
        }
        j0 = Ci[k];
        j1 = j0+p;
        Ci[k+1] = j1;
        for(j=p-1;j!==-1;--j) {
            b = j0+j;
            i = xj[j];
            Cj[b] = i;
            Cv[b] = x[i];
            flags[i] = 0;
            x[i] = 0;
        }
        Ci[k+1] = Ci[k]+p;
    }
    return C;
}

numeric.ccsLUPSolve = function ccsLUPSolve(LUP,B) {
    var L = LUP.L, U = LUP.U, P = LUP.P;
    var Bi = B[0];
    var flag = false;
    if(typeof Bi !== "object") { B = [[0,B.length],numeric.linspace(0,B.length-1),B]; Bi = B[0]; flag = true; }
    var Bj = B[1], Bv = B[2];
    var n = L[0].length-1, m = Bi.length-1;
    var x = numeric.rep([n],0), xj = Array(n);
    var b = numeric.rep([n],0), bj = Array(n);
    var Xi = numeric.rep([m+1],0), Xj = [], Xv = [];
    var sol = numeric.ccsTSolve;
    var i,j,j0,j1,k,J,N=0;
    for(i=0;i<m;++i) {
        k = 0;
        j0 = Bi[i];
        j1 = Bi[i+1];
        for(j=j0;j<j1;++j) { 
            J = LUP.Pinv[Bj[j]];
            bj[k] = J;
            b[J] = Bv[j];
            ++k;
        }
        bj.length = k;
        sol(L,b,x,bj,xj);
        for(j=bj.length-1;j!==-1;--j) b[bj[j]] = 0;
        sol(U,x,b,xj,bj);
        if(flag) return b;
        for(j=xj.length-1;j!==-1;--j) x[xj[j]] = 0;
        for(j=bj.length-1;j!==-1;--j) {
            J = bj[j];
            Xj[N] = J;
            Xv[N] = b[J];
            b[J] = 0;
            ++N;
        }
        Xi[i+1] = N;
    }
    return [Xi,Xj,Xv];
}

numeric.ccsbinop = function ccsbinop(body,setup) {
    if(typeof setup === "undefined") setup='';
    return Function('X','Y',
            'var Xi = X[0], Xj = X[1], Xv = X[2];\n'+
            'var Yi = Y[0], Yj = Y[1], Yv = Y[2];\n'+
            'var n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\n'+
            'var Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\n'+
            'var x = numeric.rep([m],0),y = numeric.rep([m],0);\n'+
            'var xk,yk,zk;\n'+
            'var i,j,j0,j1,k,p=0;\n'+
            setup+
            'for(i=0;i<n;++i) {\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Xj[j];\n'+
            '    x[k] = 1;\n'+
            '    Zj[p] = k;\n'+
            '    ++p;\n'+
            '  }\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Yj[j];\n'+
            '    y[k] = Yv[j];\n'+
            '    if(x[k] === 0) {\n'+
            '      Zj[p] = k;\n'+
            '      ++p;\n'+
            '    }\n'+
            '  }\n'+
            '  Zi[i+1] = p;\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n'+
            '  j0 = Zi[i]; j1 = Zi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Zj[j];\n'+
            '    xk = x[k];\n'+
            '    yk = y[k];\n'+
            body+'\n'+
            '    Zv[j] = zk;\n'+
            '  }\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n'+
            '}\n'+
            'return [Zi,Zj,Zv];'
            );
};

(function() {
    var k,A,B,C;
    for(k in numeric.ops2) {
        if(isFinite(eval('1'+numeric.ops2[k]+'0'))) A = '[Y[0],Y[1],numeric.'+k+'(X,Y[2])]';
        else A = 'NaN';
        if(isFinite(eval('0'+numeric.ops2[k]+'1'))) B = '[X[0],X[1],numeric.'+k+'(X[2],Y)]';
        else B = 'NaN';
        if(isFinite(eval('1'+numeric.ops2[k]+'0')) && isFinite(eval('0'+numeric.ops2[k]+'1'))) C = 'numeric.ccs'+k+'MM(X,Y)';
        else C = 'NaN';
        numeric['ccs'+k+'MM'] = numeric.ccsbinop('zk = xk '+numeric.ops2[k]+'yk;');
        numeric['ccs'+k] = Function('X','Y',
                'if(typeof X === "number") return '+A+';\n'+
                'if(typeof Y === "number") return '+B+';\n'+
                'return '+C+';\n'
                );
    }
}());

numeric.ccsScatter = function ccsScatter(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = numeric.sup(Aj)+1,m=Ai.length;
    var Ri = numeric.rep([n],0),Rj=Array(m), Rv = Array(m);
    var counts = numeric.rep([n],0),i;
    for(i=0;i<m;++i) counts[Aj[i]]++;
    for(i=0;i<n;++i) Ri[i+1] = Ri[i] + counts[i];
    var ptr = Ri.slice(0),k,Aii;
    for(i=0;i<m;++i) {
        Aii = Aj[i];
        k = ptr[Aii];
        Rj[k] = Ai[i];
        Rv[k] = Av[i];
        ptr[Aii]=ptr[Aii]+1;
    }
    return [Ri,Rj,Rv];
}

numeric.ccsGather = function ccsGather(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = Ai.length-1,m = Aj.length;
    var Ri = Array(m), Rj = Array(m), Rv = Array(m);
    var i,j,j0,j1,p;
    p=0;
    for(i=0;i<n;++i) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j!==j1;++j) {
            Rj[p] = i;
            Ri[p] = Aj[j];
            Rv[p] = Av[j];
            ++p;
        }
    }
    return [Ri,Rj,Rv];
}

// The following sparse linear algebra routines are deprecated.

numeric.sdim = function dim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

numeric.sclone = function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = numeric.sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
}

numeric.sdiag = function diag(d) {
    var n = d.length,i,ret = Array(n),i1,i2,i3;
    for(i=n-1;i>=1;i-=2) {
        i1 = i-1;
        ret[i] = []; ret[i][i] = d[i];
        ret[i1] = []; ret[i1][i1] = d[i1];
    }
    if(i===0) { ret[0] = []; ret[0][0] = d[i]; }
    return ret;
}

numeric.sidentity = function identity(n) { return numeric.sdiag(numeric.rep([n],1)); }

numeric.stranspose = function transpose(A) {
    var ret = [], n = A.length, i,j,Ai;
    for(i in A) {
        if(!(A.hasOwnProperty(i))) continue;
        Ai = A[i];
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(typeof ret[j] !== "object") { ret[j] = []; }
            ret[j][i] = Ai[j];
        }
    }
    return ret;
}

numeric.sLUP = function LUP(A,tol) {
    throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
};

numeric.sdotMM = function dotMM(A,B) {
    var p = A.length, q = B.length, BT = numeric.stranspose(B), r = BT.length, Ai, BTk;
    var i,j,k,accum;
    var ret = Array(p),reti;
    for(i=p-1;i>=0;i--) {
        reti = [];
        Ai = A[i];
        for(k=r-1;k>=0;k--) {
            accum = 0;
            BTk = BT[k];
            for(j in Ai) {
                if(!(Ai.hasOwnProperty(j))) continue;
                if(j in BTk) { accum += Ai[j]*BTk[j]; }
            }
            if(accum) reti[k] = accum;
        }
        ret[i] = reti;
    }
    return ret;
}

numeric.sdotMV = function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
}

numeric.sdotVM = function dotMV(x,A) {
    var i,j,Ai,alpha;
    var ret = [], accum;
    for(i in x) {
        if(!x.hasOwnProperty(i)) continue;
        Ai = A[i];
        alpha = x[i];
        for(j in Ai) {
            if(!Ai.hasOwnProperty(j)) continue;
            if(!ret[j]) { ret[j] = 0; }
            ret[j] += alpha*Ai[j];
        }
    }
    return ret;
}

numeric.sdotVV = function dotVV(x,y) {
    var i,ret=0;
    for(i in x) { if(x[i] && y[i]) ret+= x[i]*y[i]; }
    return ret;
}

numeric.sdot = function dot(A,B) {
    var m = numeric.sdim(A).length, n = numeric.sdim(B).length;
    var k = m*1000+n;
    switch(k) {
    case 0: return A*B;
    case 1001: return numeric.sdotVV(A,B);
    case 2001: return numeric.sdotMV(A,B);
    case 1002: return numeric.sdotVM(A,B);
    case 2002: return numeric.sdotMM(A,B);
    default: throw new Error('numeric.sdot not implemented for tensors of order '+m+' and '+n);
    }
}

numeric.sscatter = function scatter(V) {
    var n = V[0].length, Vij, i, j, m = V.length, A = [], Aj;
    for(i=n-1;i>=0;--i) {
        if(!V[m-1][i]) continue;
        Aj = A;
        for(j=0;j<m-2;j++) {
            Vij = V[j][i];
            if(!Aj[Vij]) Aj[Vij] = [];
            Aj = Aj[Vij];
        }
        Aj[V[j][i]] = V[j+1][i];
    }
    return A;
}

numeric.sgather = function gather(A,ret,k) {
    if(typeof ret === "undefined") ret = [];
    if(typeof k === "undefined") k = [];
    var n,i,Ai;
    n = k.length;
    for(i in A) {
        if(A.hasOwnProperty(i)) {
            k[n] = parseInt(i);
            Ai = A[i];
            if(typeof Ai === "number") {
                if(Ai) {
                    if(ret.length === 0) {
                        for(i=n+1;i>=0;--i) ret[i] = [];
                    }
                    for(i=n;i>=0;--i) ret[i].push(k[i]);
                    ret[n+1].push(Ai);
                }
            } else gather(Ai,ret,k);
        }
    }
    if(k.length>n) k.pop();
    return ret;
}

// 6. Coordinate matrices
numeric.cLU = function LU(A) {
    var I = A[0], J = A[1], V = A[2];
    var p = I.length, m=0, i,j,k,a,b,c;
    for(i=0;i<p;i++) if(I[i]>m) m=I[i];
    m++;
    var L = Array(m), U = Array(m), left = numeric.rep([m],Infinity), right = numeric.rep([m],-Infinity);
    var Ui, Uj,alpha;
    for(k=0;k<p;k++) {
        i = I[k];
        j = J[k];
        if(j<left[i]) left[i] = j;
        if(j>right[i]) right[i] = j;
    }
    for(i=0;i<m-1;i++) { if(right[i] > right[i+1]) right[i+1] = right[i]; }
    for(i=m-1;i>=1;i--) { if(left[i]<left[i-1]) left[i-1] = left[i]; }
    var countL = 0, countU = 0;
    for(i=0;i<m;i++) {
        U[i] = numeric.rep([right[i]-left[i]+1],0);
        L[i] = numeric.rep([i-left[i]],0);
        countL += i-left[i]+1;
        countU += right[i]-i+1;
    }
    for(k=0;k<p;k++) { i = I[k]; U[i][J[k]-left[i]] = V[k]; }
    for(i=0;i<m-1;i++) {
        a = i-left[i];
        Ui = U[i];
        for(j=i+1;left[j]<=i && j<m;j++) {
            b = i-left[j];
            c = right[i]-i;
            Uj = U[j];
            alpha = Uj[b]/Ui[a];
            if(alpha) {
                for(k=1;k<=c;k++) { Uj[k+b] -= alpha*Ui[k+a]; }
                L[j][i-left[j]] = alpha;
            }
        }
    }
    var Ui = [], Uj = [], Uv = [], Li = [], Lj = [], Lv = [];
    var p,q,foo;
    p=0; q=0;
    for(i=0;i<m;i++) {
        a = left[i];
        b = right[i];
        foo = U[i];
        for(j=i;j<=b;j++) {
            if(foo[j-a]) {
                Ui[p] = i;
                Uj[p] = j;
                Uv[p] = foo[j-a];
                p++;
            }
        }
        foo = L[i];
        for(j=a;j<i;j++) {
            if(foo[j-a]) {
                Li[q] = i;
                Lj[q] = j;
                Lv[q] = foo[j-a];
                q++;
            }
        }
        Li[q] = i;
        Lj[q] = i;
        Lv[q] = 1;
        q++;
    }
    return {U:[Ui,Uj,Uv], L:[Li,Lj,Lv]};
};

numeric.cLUsolve = function LUsolve(lu,b) {
    var L = lu.L, U = lu.U, ret = numeric.clone(b);
    var Li = L[0], Lj = L[1], Lv = L[2];
    var Ui = U[0], Uj = U[1], Uv = U[2];
    var p = Ui.length, q = Li.length;
    var m = ret.length,i,j,k;
    k = 0;
    for(i=0;i<m;i++) {
        while(Lj[k] < i) {
            ret[i] -= Lv[k]*ret[Lj[k]];
            k++;
        }
        k++;
    }
    k = p-1;
    for(i=m-1;i>=0;i--) {
        while(Uj[k] > i) {
            ret[i] -= Uv[k]*ret[Uj[k]];
            k--;
        }
        ret[i] /= Uv[k];
        k--;
    }
    return ret;
};

numeric.cgrid = function grid(n,shape) {
    if(typeof n === "number") n = [n,n];
    var ret = numeric.rep(n,-1);
    var i,j,count;
    if(typeof shape !== "function") {
        switch(shape) {
        case 'L':
            shape = function(i,j) { return (i>=n[0]/2 || j<n[1]/2); }
            break;
        default:
            shape = function(i,j) { return true; };
            break;
        }
    }
    count=0;
    for(i=1;i<n[0]-1;i++) for(j=1;j<n[1]-1;j++) 
        if(shape(i,j)) {
            ret[i][j] = count;
            count++;
        }
    return ret;
}

numeric.cdelsq = function delsq(g) {
    var dir = [[-1,0],[0,-1],[0,1],[1,0]];
    var s = numeric.dim(g), m = s[0], n = s[1], i,j,k,p,q;
    var Li = [], Lj = [], Lv = [];
    for(i=1;i<m-1;i++) for(j=1;j<n-1;j++) {
        if(g[i][j]<0) continue;
        for(k=0;k<4;k++) {
            p = i+dir[k][0];
            q = j+dir[k][1];
            if(g[p][q]<0) continue;
            Li.push(g[i][j]);
            Lj.push(g[p][q]);
            Lv.push(-1);
        }
        Li.push(g[i][j]);
        Lj.push(g[i][j]);
        Lv.push(4);
    }
    return [Li,Lj,Lv];
}

numeric.cdotMV = function dotMV(A,x) {
    var ret, Ai = A[0], Aj = A[1], Av = A[2],k,p=Ai.length,N;
    N=0;
    for(k=0;k<p;k++) { if(Ai[k]>N) N = Ai[k]; }
    N++;
    ret = numeric.rep([N],0);
    for(k=0;k<p;k++) { ret[Ai[k]]+=Av[k]*x[Aj[k]]; }
    return ret;
}

// 7. Splines

numeric.Spline = function Spline(x,yl,yr,kl,kr) { this.x = x; this.yl = yl; this.yr = yr; this.kl = kl; this.kr = kr; }
numeric.Spline.prototype._at = function _at(x1,p) {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var x1,a,b,t;
    var add = numeric.add, sub = numeric.sub, mul = numeric.mul;
    a = sub(mul(kl[p],x[p+1]-x[p]),sub(yr[p+1],yl[p]));
    b = add(mul(kr[p+1],x[p]-x[p+1]),sub(yr[p+1],yl[p]));
    t = (x1-x[p])/(x[p+1]-x[p]);
    var s = t*(1-t);
    return add(add(add(mul(1-t,yl[p]),mul(t,yr[p+1])),mul(a,s*(1-t))),mul(b,s*t));
}
numeric.Spline.prototype.at = function at(x0) {
    if(typeof x0 === "number") {
        var x = this.x;
        var n = x.length;
        var p,q,mid,floor = Math.floor,a,b,t;
        p = 0;
        q = n-1;
        while(q-p>1) {
            mid = floor((p+q)/2);
            if(x[mid] <= x0) p = mid;
            else q = mid;
        }
        return this._at(x0,p);
    }
    var n = x0.length, i, ret = Array(n);
    for(i=n-1;i!==-1;--i) ret[i] = this.at(x0[i]);
    return ret;
}
numeric.Spline.prototype.diff = function diff() {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var n = yl.length;
    var i,dx,dy;
    var zl = kl, zr = kr, pl = Array(n), pr = Array(n);
    var add = numeric.add, mul = numeric.mul, div = numeric.div, sub = numeric.sub;
    for(i=n-1;i!==-1;--i) {
        dx = x[i+1]-x[i];
        dy = sub(yr[i+1],yl[i]);
        pl[i] = div(add(mul(dy, 6),mul(kl[i],-4*dx),mul(kr[i+1],-2*dx)),dx*dx);
        pr[i+1] = div(add(mul(dy,-6),mul(kl[i], 2*dx),mul(kr[i+1], 4*dx)),dx*dx);
    }
    return new numeric.Spline(x,zl,zr,pl,pr);
}
numeric.Spline.prototype.roots = function roots() {
    function sqr(x) { return x*x; }
    function heval(y0,y1,k0,k1,x) {
        var A = k0*2-(y1-y0);
        var B = -k1*2+(y1-y0);
        var t = (x+1)*0.5;
        var s = t*(1-t);
        return (1-t)*y0+t*y1+A*s*(1-t)+B*s*t;
    }
    var ret = [];
    var x = this.x, yl = this.yl, yr = this.yr, kl = this.kl, kr = this.kr;
    if(typeof yl[0] === "number") {
        yl = [yl];
        yr = [yr];
        kl = [kl];
        kr = [kr];
    }
    var m = yl.length,n=x.length-1,i,j,k,y,s,t;
    var ai,bi,ci,di, ret = Array(m),ri,k0,k1,y0,y1,A,B,D,dx,cx,stops,z0,z1,zm,t0,t1,tm;
    var sqrt = Math.sqrt;
    for(i=0;i!==m;++i) {
        ai = yl[i];
        bi = yr[i];
        ci = kl[i];
        di = kr[i];
        ri = [];
        for(j=0;j!==n;j++) {
            if(j>0 && bi[j]*ai[j]<0) ri.push(x[j]);
            dx = (x[j+1]-x[j]);
            cx = x[j];
            y0 = ai[j];
            y1 = bi[j+1];
            k0 = ci[j]/dx;
            k1 = di[j+1]/dx;
            D = sqr(k0-k1+3*(y0-y1)) + 12*k1*y0;
            A = k1+3*y0+2*k0-3*y1;
            B = 3*(k1+k0+2*(y0-y1));
            if(D<=0) {
                z0 = A/B;
                if(z0>x[j] && z0<x[j+1]) stops = [x[j],z0,x[j+1]];
                else stops = [x[j],x[j+1]];
            } else {
                z0 = (A-sqrt(D))/B;
                z1 = (A+sqrt(D))/B;
                stops = [x[j]];
                if(z0>x[j] && z0<x[j+1]) stops.push(z0);
                if(z1>x[j] && z1<x[j+1]) stops.push(z1);
                stops.push(x[j+1]);
            }
            t0 = stops[0];
            z0 = this._at(t0,j);
            for(k=0;k<stops.length-1;k++) {
                t1 = stops[k+1];
                z1 = this._at(t1,j);
                if(z0 === 0) {
                    ri.push(t0); 
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                if(z1 === 0 || z0*z1>0) {
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                var side = 0;
                while(1) {
                    tm = (z0*t1-z1*t0)/(z0-z1);
                    if(tm <= t0 || tm >= t1) { break; }
                    zm = this._at(tm,j);
                    if(zm*z1>0) {
                        t1 = tm;
                        z1 = zm;
                        if(side === -1) z0*=0.5;
                        side = -1;
                    } else if(zm*z0>0) {
                        t0 = tm;
                        z0 = zm;
                        if(side === 1) z1*=0.5;
                        side = 1;
                    } else break;
                }
                ri.push(tm);
                t0 = stops[k+1];
                z0 = this._at(t0, j);
            }
            if(z1 === 0) ri.push(t1);
        }
        ret[i] = ri;
    }
    if(typeof this.yl[0] === "number") return ret[0];
    return ret;
}
numeric.spline = function spline(x,y,k1,kn) {
    var n = x.length, b = [], dx = [], dy = [];
    var i;
    var sub = numeric.sub,mul = numeric.mul,add = numeric.add;
    for(i=n-2;i>=0;i--) { dx[i] = x[i+1]-x[i]; dy[i] = sub(y[i+1],y[i]); }
    if(typeof k1 === "string" || typeof kn === "string") { 
        k1 = kn = "periodic";
    }
    // Build sparse tridiagonal system
    var T = [[],[],[]];
    switch(typeof k1) {
    case "undefined":
        b[0] = mul(3/(dx[0]*dx[0]),dy[0]);
        T[0].push(0,0);
        T[1].push(0,1);
        T[2].push(2/dx[0],1/dx[0]);
        break;
    case "string":
        b[0] = add(mul(3/(dx[n-2]*dx[n-2]),dy[n-2]),mul(3/(dx[0]*dx[0]),dy[0]));
        T[0].push(0,0,0);
        T[1].push(n-2,0,1);
        T[2].push(1/dx[n-2],2/dx[n-2]+2/dx[0],1/dx[0]);
        break;
    default:
        b[0] = k1;
        T[0].push(0);
        T[1].push(0);
        T[2].push(1);
        break;
    }
    for(i=1;i<n-1;i++) {
        b[i] = add(mul(3/(dx[i-1]*dx[i-1]),dy[i-1]),mul(3/(dx[i]*dx[i]),dy[i]));
        T[0].push(i,i,i);
        T[1].push(i-1,i,i+1);
        T[2].push(1/dx[i-1],2/dx[i-1]+2/dx[i],1/dx[i]);
    }
    switch(typeof kn) {
    case "undefined":
        b[n-1] = mul(3/(dx[n-2]*dx[n-2]),dy[n-2]);
        T[0].push(n-1,n-1);
        T[1].push(n-2,n-1);
        T[2].push(1/dx[n-2],2/dx[n-2]);
        break;
    case "string":
        T[1][T[1].length-1] = 0;
        break;
    default:
        b[n-1] = kn;
        T[0].push(n-1);
        T[1].push(n-1);
        T[2].push(1);
        break;
    }
    if(typeof b[0] !== "number") b = numeric.transpose(b);
    else b = [b];
    var k = Array(b.length);
    if(typeof k1 === "string") {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(T)),b[i]);
            k[i][n-1] = k[i][0];
        }
    } else {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.cLUsolve(numeric.cLU(T),b[i]);
        }
    }
    if(typeof y[0] === "number") k = k[0];
    else k = numeric.transpose(k);
    return new numeric.Spline(x,y,y,k,k);
}

// 8. FFT
numeric.fftpow2 = function fftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    fftpow2(xe,ye);
    fftpow2(xo,yo);
    j = n/2;
    var t,k = (-6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric._ifftpow2 = function _ifftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    _ifftpow2(xe,ye);
    _ifftpow2(xo,yo);
    j = n/2;
    var t,k = (6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric.ifftpow2 = function ifftpow2(x,y) {
    numeric._ifftpow2(x,y);
    numeric.diveq(x,x.length);
    numeric.diveq(y,y.length);
}
numeric.convpow2 = function convpow2(ax,ay,bx,by) {
    numeric.fftpow2(ax,ay);
    numeric.fftpow2(bx,by);
    var i,n = ax.length,axi,bxi,ayi,byi;
    for(i=n-1;i!==-1;--i) {
        axi = ax[i]; ayi = ay[i]; bxi = bx[i]; byi = by[i];
        ax[i] = axi*bxi-ayi*byi;
        ay[i] = axi*byi+ayi*bxi;
    }
    numeric.ifftpow2(ax,ay);
}
numeric.T.prototype.fft = function fft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (-3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X;
}
numeric.T.prototype.ifft = function ifft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X.div(n);
}

//9. Unconstrained optimization
numeric.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var max = Math.max;
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    var div = numeric.div, sub = numeric.sub,errest,roundoff,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
}

numeric.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = numeric.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,i,s,x1,y,Hy,Hs,ys,i0,t,nstep,t1,t2;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);
        y = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);
        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;
    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
}

// 10. Ode solver (Dormand-Prince)
numeric.Dopri = function Dopri(x,y,f,ymid,iterations,msg,events) {
    this.x = x;
    this.y = y;
    this.f = f;
    this.ymid = ymid;
    this.iterations = iterations;
    this.events = events;
    this.message = msg;
}
numeric.Dopri.prototype._at = function _at(xi,j) {
    function sqr(x) { return x*x; }
    var sol = this;
    var xs = sol.x;
    var ys = sol.y;
    var k1 = sol.f;
    var ymid = sol.ymid;
    var n = xs.length;
    var x0,x1,xh,y0,y1,yh,xi;
    var floor = Math.floor,h;
    var c = 0.5;
    var add = numeric.add, mul = numeric.mul,sub = numeric.sub, p,q,w;
    x0 = xs[j];
    x1 = xs[j+1];
    y0 = ys[j];
    y1 = ys[j+1];
    h  = x1-x0;
    xh = x0+c*h;
    yh = ymid[j];
    p = sub(k1[j  ],mul(y0,1/(x0-xh)+2/(x0-x1)));
    q = sub(k1[j+1],mul(y1,1/(x1-xh)+2/(x1-x0)));
    w = [sqr(xi - x1) * (xi - xh) / sqr(x0 - x1) / (x0 - xh),
         sqr(xi - x0) * sqr(xi - x1) / sqr(x0 - xh) / sqr(x1 - xh),
         sqr(xi - x0) * (xi - xh) / sqr(x1 - x0) / (x1 - xh),
         (xi - x0) * sqr(xi - x1) * (xi - xh) / sqr(x0-x1) / (x0 - xh),
         (xi - x1) * sqr(xi - x0) * (xi - xh) / sqr(x0-x1) / (x1 - xh)];
    return add(add(add(add(mul(y0,w[0]),
                           mul(yh,w[1])),
                           mul(y1,w[2])),
                           mul( p,w[3])),
                           mul( q,w[4]));
}
numeric.Dopri.prototype.at = function at(x) {
    var i,j,k,floor = Math.floor;
    if(typeof x !== "number") {
        var n = x.length, ret = Array(n);
        for(i=n-1;i!==-1;--i) {
            ret[i] = this.at(x[i]);
        }
        return ret;
    }
    var x0 = this.x;
    i = 0; j = x0.length-1;
    while(j-i>1) {
        k = floor(0.5*(i+j));
        if(x0[k] <= x) i = k;
        else j = k;
    }
    return this._at(x,i);
}

numeric.dopri = function dopri(x0,x1,y0,f,tol,maxit,event) {
    if(typeof tol === "undefined") { tol = 1e-6; }
    if(typeof maxit === "undefined") { maxit = 1000; }
    var xs = [x0], ys = [y0], k1 = [f(x0,y0)], k2,k3,k4,k5,k6,k7, ymid = [];
    var A2 = 1/5;
    var A3 = [3/40,9/40];
    var A4 = [44/45,-56/15,32/9];
    var A5 = [19372/6561,-25360/2187,64448/6561,-212/729];
    var A6 = [9017/3168,-355/33,46732/5247,49/176,-5103/18656];
    var b = [35/384,0,500/1113,125/192,-2187/6784,11/84];
    var bm = [0.5*6025192743/30085553152,
              0,
              0.5*51252292925/65400821598,
              0.5*-2691868925/45128329728,
              0.5*187940372067/1594534317056,
              0.5*-1776094331/19743644256,
              0.5*11237099/235043384];
    var c = [1/5,3/10,4/5,8/9,1,1];
    var e = [-71/57600,0,71/16695,-71/1920,17253/339200,-22/525,1/40];
    var i = 0,er,j;
    var h = (x1-x0)/10;
    var it = 0;
    var add = numeric.add, mul = numeric.mul, y1,erinf;
    var max = Math.max, min = Math.min, abs = Math.abs, norminf = numeric.norminf,pow = Math.pow;
    var any = numeric.any, lt = numeric.lt, and = numeric.and, sub = numeric.sub;
    var e0, e1, ev;
    var ret = new numeric.Dopri(xs,ys,k1,ymid,-1,"");
    if(typeof event === "function") e0 = event(x0,y0);
    while(x0<x1 && it<maxit) {
        ++it;
        if(x0+h>x1) h = x1-x0;
        k2 = f(x0+c[0]*h,                add(y0,mul(   A2*h,k1[i])));
        k3 = f(x0+c[1]*h,            add(add(y0,mul(A3[0]*h,k1[i])),mul(A3[1]*h,k2)));
        k4 = f(x0+c[2]*h,        add(add(add(y0,mul(A4[0]*h,k1[i])),mul(A4[1]*h,k2)),mul(A4[2]*h,k3)));
        k5 = f(x0+c[3]*h,    add(add(add(add(y0,mul(A5[0]*h,k1[i])),mul(A5[1]*h,k2)),mul(A5[2]*h,k3)),mul(A5[3]*h,k4)));
        k6 = f(x0+c[4]*h,add(add(add(add(add(y0,mul(A6[0]*h,k1[i])),mul(A6[1]*h,k2)),mul(A6[2]*h,k3)),mul(A6[3]*h,k4)),mul(A6[4]*h,k5)));
        y1 = add(add(add(add(add(y0,mul(k1[i],h*b[0])),mul(k3,h*b[2])),mul(k4,h*b[3])),mul(k5,h*b[4])),mul(k6,h*b[5]));
        k7 = f(x0+h,y1);
        er = add(add(add(add(add(mul(k1[i],h*e[0]),mul(k3,h*e[2])),mul(k4,h*e[3])),mul(k5,h*e[4])),mul(k6,h*e[5])),mul(k7,h*e[6]));
        if(typeof er === "number") erinf = abs(er);
        else erinf = norminf(er);
        if(erinf > tol) { // reject
            h = 0.2*h*pow(tol/erinf,0.25);
            if(x0+h === x0) {
                ret.msg = "Step size became too small";
                break;
            }
            continue;
        }
        ymid[i] = add(add(add(add(add(add(y0,
                mul(k1[i],h*bm[0])),
                mul(k3   ,h*bm[2])),
                mul(k4   ,h*bm[3])),
                mul(k5   ,h*bm[4])),
                mul(k6   ,h*bm[5])),
                mul(k7   ,h*bm[6]));
        ++i;
        xs[i] = x0+h;
        ys[i] = y1;
        k1[i] = k7;
        if(typeof event === "function") {
            var yi,xl = x0,xr = x0+0.5*h,xi;
            e1 = event(xr,ymid[i-1]);
            ev = and(lt(e0,0),lt(0,e1));
            if(!any(ev)) { xl = xr; xr = x0+h; e0 = e1; e1 = event(xr,y1); ev = and(lt(e0,0),lt(0,e1)); }
            if(any(ev)) {
                var xc, yc, en,ei;
                var side=0, sl = 1.0, sr = 1.0;
                while(1) {
                    if(typeof e0 === "number") xi = (sr*e1*xl-sl*e0*xr)/(sr*e1-sl*e0);
                    else {
                        xi = xr;
                        for(j=e0.length-1;j!==-1;--j) {
                            if(e0[j]<0 && e1[j]>0) xi = min(xi,(sr*e1[j]*xl-sl*e0[j]*xr)/(sr*e1[j]-sl*e0[j]));
                        }
                    }
                    if(xi <= xl || xi >= xr) break;
                    yi = ret._at(xi, i-1);
                    ei = event(xi,yi);
                    en = and(lt(e0,0),lt(0,ei));
                    if(any(en)) {
                        xr = xi;
                        e1 = ei;
                        ev = en;
                        sr = 1.0;
                        if(side === -1) sl *= 0.5;
                        else sl = 1.0;
                        side = -1;
                    } else {
                        xl = xi;
                        e0 = ei;
                        sl = 1.0;
                        if(side === 1) sr *= 0.5;
                        else sr = 1.0;
                        side = 1;
                    }
                }
                y1 = ret._at(0.5*(x0+xi),i-1);
                ret.f[i] = f(xi,yi);
                ret.x[i] = xi;
                ret.y[i] = yi;
                ret.ymid[i-1] = y1;
                ret.events = ev;
                ret.iterations = it;
                return ret;
            }
        }
        x0 += h;
        y0 = y1;
        e0 = e1;
        h = min(0.8*h*pow(tol/erinf,0.25),4*h);
    }
    ret.iterations = it;
    return ret;
}

// 11. Ax = b
numeric.LU = function(A, fast) {
  fast = fast || false;

  var abs = Math.abs;
  var i, j, k, absAjk, Akk, Ak, Pk, Ai;
  var max;
  var n = A.length, n1 = n-1;
  var P = new Array(n);
  if(!fast) A = numeric.clone(A);

  for (k = 0; k < n; ++k) {
    Pk = k;
    Ak = A[k];
    max = abs(Ak[k]);
    for (j = k + 1; j < n; ++j) {
      absAjk = abs(A[j][k]);
      if (max < absAjk) {
        max = absAjk;
        Pk = j;
      }
    }
    P[k] = Pk;

    if (Pk != k) {
      A[k] = A[Pk];
      A[Pk] = Ak;
      Ak = A[k];
    }

    Akk = Ak[k];

    for (i = k + 1; i < n; ++i) {
      A[i][k] /= Akk;
    }

    for (i = k + 1; i < n; ++i) {
      Ai = A[i];
      for (j = k + 1; j < n1; ++j) {
        Ai[j] -= Ai[k] * Ak[j];
        ++j;
        Ai[j] -= Ai[k] * Ak[j];
      }
      if(j===n1) Ai[j] -= Ai[k] * Ak[j];
    }
  }

  return {
    LU: A,
    P:  P
  };
}

numeric.LUsolve = function LUsolve(LUP, b) {
  var i, j;
  var LU = LUP.LU;
  var n   = LU.length;
  var x = numeric.clone(b);
  var P   = LUP.P;
  var Pi, LUi, LUii, tmp;

  for (i=n-1;i!==-1;--i) x[i] = b[i];
  for (i = 0; i < n; ++i) {
    Pi = P[i];
    if (P[i] !== i) {
      tmp = x[i];
      x[i] = x[Pi];
      x[Pi] = tmp;
    }

    LUi = LU[i];
    for (j = 0; j < i; ++j) {
      x[i] -= x[j] * LUi[j];
    }
  }

  for (i = n - 1; i >= 0; --i) {
    LUi = LU[i];
    for (j = i + 1; j < n; ++j) {
      x[i] -= x[j] * LUi[j];
    }

    x[i] /= LUi[i];
  }

  return x;
}

numeric.solve = function solve(A,b,fast) { return numeric.LUsolve(numeric.LU(A,fast), b); }

// 12. Linear programming
numeric.echelonize = function echelonize(A) {
    var s = numeric.dim(A), m = s[0], n = s[1];
    var I = numeric.identity(m);
    var P = Array(m);
    var i,j,k,l,Ai,Ii,Z,a;
    var abs = Math.abs;
    var diveq = numeric.diveq;
    A = numeric.clone(A);
    for(i=0;i<m;++i) {
        k = 0;
        Ai = A[i];
        Ii = I[i];
        for(j=1;j<n;++j) if(abs(Ai[k])<abs(Ai[j])) k=j;
        P[i] = k;
        diveq(Ii,Ai[k]);
        diveq(Ai,Ai[k]);
        for(j=0;j<m;++j) if(j!==i) {
            Z = A[j]; a = Z[k];
            for(l=n-1;l!==-1;--l) Z[l] -= Ai[l]*a;
            Z = I[j];
            for(l=m-1;l!==-1;--l) Z[l] -= Ii[l]*a;
        }
    }
    return {I:I, A:A, P:P};
}

numeric.__solveLP = function __solveLP(c,A,b,tol,maxit,x,flag) {
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var m = c.length, n = b.length,y;
    var unbounded = false, cb,i0=0;
    var alpha = 1.0;
    var f0,df0,AT = numeric.transpose(A), svd = numeric.svd,transpose = numeric.transpose,leq = numeric.leq, sqrt = Math.sqrt, abs = Math.abs;
    var muleq = numeric.muleq;
    var norm = numeric.norminf, any = numeric.any,min = Math.min;
    var all = numeric.all, gt = numeric.gt;
    var p = Array(m), A0 = Array(n),e=numeric.rep([n],1), H;
    var solve = numeric.solve, z = sub(b,dot(A,x)),count;
    var dotcc = dot(c,c);
    var g;
    for(count=i0;count<maxit;++count) {
        var i,j,d;
        for(i=n-1;i!==-1;--i) A0[i] = div(A[i],z[i]);
        var A1 = transpose(A0);
        for(i=m-1;i!==-1;--i) p[i] = (/*x[i]+*/sum(A1[i]));
        alpha = 0.25*abs(dotcc/dot(c,p));
        var a1 = 100*sqrt(dotcc/dot(p,p));
        if(!isFinite(alpha) || alpha>a1) alpha = a1;
        g = add(c,mul(alpha,p));
        H = dot(A1,A0);
        for(i=m-1;i!==-1;--i) H[i][i] += 1;
        d = solve(H,div(g,alpha),true);
        var t0 = div(z,dot(A,d));
        var t = 1.0;
        for(i=n-1;i!==-1;--i) if(t0[i]<0) t = min(t,-0.999*t0[i]);
        y = sub(x,mul(d,t));
        z = sub(b,dot(A,y));
        if(!all(gt(z,0))) return { solution: x, message: "", iterations: count };
        x = y;
        if(alpha<tol) return { solution: y, message: "", iterations: count };
        if(flag) {
            var s = dot(c,g), Ag = dot(A,g);
            unbounded = true;
            for(i=n-1;i!==-1;--i) if(s*Ag[i]<0) { unbounded = false; break; }
        } else {
            if(x[m-1]>=0) unbounded = false;
            else unbounded = true;
        }
        if(unbounded) return { solution: y, message: "Unbounded", iterations: count };
    }
    return { solution: x, message: "maximum iteration count exceeded", iterations:count };
}

numeric._solveLP = function _solveLP(c,A,b,tol,maxit) {
    var m = c.length, n = b.length,y;
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var c0 = numeric.rep([m],0).concat([1]);
    var J = numeric.rep([n,1],-1);
    var A0 = numeric.blockMatrix([[A                   ,   J  ]]);
    var b0 = b;
    var y = numeric.rep([m],0).concat(Math.max(0,numeric.sup(numeric.neg(b)))+1);
    var x0 = numeric.__solveLP(c0,A0,b0,tol,maxit,y,false);
    var x = numeric.clone(x0.solution);
    x.length = m;
    var foo = numeric.inf(sub(b,dot(A,x)));
    if(foo<0) { return { solution: NaN, message: "Infeasible", iterations: x0.iterations }; }
    var ret = numeric.__solveLP(c, A, b, tol, maxit-x0.iterations, x, true);
    ret.iterations += x0.iterations;
    return ret;
};

numeric.solveLP = function solveLP(c,A,b,Aeq,beq,tol,maxit) {
    if(typeof maxit === "undefined") maxit = 1000;
    if(typeof tol === "undefined") tol = numeric.epsilon;
    if(typeof Aeq === "undefined") return numeric._solveLP(c,A,b,tol,maxit);
    var m = Aeq.length, n = Aeq[0].length, o = A.length;
    var B = numeric.echelonize(Aeq);
    var flags = numeric.rep([n],0);
    var P = B.P;
    var Q = [];
    var i;
    for(i=P.length-1;i!==-1;--i) flags[P[i]] = 1;
    for(i=n-1;i!==-1;--i) if(flags[i]===0) Q.push(i);
    var g = numeric.getRange;
    var I = numeric.linspace(0,m-1), J = numeric.linspace(0,o-1);
    var Aeq2 = g(Aeq,I,Q), A1 = g(A,J,P), A2 = g(A,J,Q), dot = numeric.dot, sub = numeric.sub;
    var A3 = dot(A1,B.I);
    var A4 = sub(A2,dot(A3,Aeq2)), b4 = sub(b,dot(A3,beq));
    var c1 = Array(P.length), c2 = Array(Q.length);
    for(i=P.length-1;i!==-1;--i) c1[i] = c[P[i]];
    for(i=Q.length-1;i!==-1;--i) c2[i] = c[Q[i]];
    var c4 = sub(c2,dot(c1,dot(B.I,Aeq2)));
    var S = numeric._solveLP(c4,A4,b4,tol,maxit);
    var x2 = S.solution;
    if(x2!==x2) return S;
    var x1 = dot(B.I,sub(beq,dot(Aeq2,x2)));
    var x = Array(c.length);
    for(i=P.length-1;i!==-1;--i) x[P[i]] = x1[i];
    for(i=Q.length-1;i!==-1;--i) x[Q[i]] = x2[i];
    return { solution: x, message:S.message, iterations: S.iterations };
}

numeric.MPStoLP = function MPStoLP(MPS) {
    if(MPS instanceof String) { MPS.split('\n'); }
    var state = 0;
    var states = ['Initial state','NAME','ROWS','COLUMNS','RHS','BOUNDS','ENDATA'];
    var n = MPS.length;
    var i,j,z,N=0,rows = {}, sign = [], rl = 0, vars = {}, nv = 0;
    var name;
    var c = [], A = [], b = [];
    function err(e) { throw new Error('MPStoLP: '+e+'\nLine '+i+': '+MPS[i]+'\nCurrent state: '+states[state]+'\n'); }
    for(i=0;i<n;++i) {
        z = MPS[i];
        var w0 = z.match(/\S*/g);
        var w = [];
        for(j=0;j<w0.length;++j) if(w0[j]!=="") w.push(w0[j]);
        if(w.length === 0) continue;
        for(j=0;j<states.length;++j) if(z.substr(0,states[j].length) === states[j]) break;
        if(j<states.length) {
            state = j;
            if(j===1) { name = w[1]; }
            if(j===6) return { name:name, c:c, A:numeric.transpose(A), b:b, rows:rows, vars:vars };
            continue;
        }
        switch(state) {
        case 0: case 1: err('Unexpected line');
        case 2: 
            switch(w[0]) {
            case 'N': if(N===0) N = w[1]; else err('Two or more N rows'); break;
            case 'L': rows[w[1]] = rl; sign[rl] = 1; b[rl] = 0; ++rl; break;
            case 'G': rows[w[1]] = rl; sign[rl] = -1;b[rl] = 0; ++rl; break;
            case 'E': rows[w[1]] = rl; sign[rl] = 0;b[rl] = 0; ++rl; break;
            default: err('Parse error '+numeric.prettyPrint(w));
            }
            break;
        case 3:
            if(!vars.hasOwnProperty(w[0])) { vars[w[0]] = nv; c[nv] = 0; A[nv] = numeric.rep([rl],0); ++nv; }
            var p = vars[w[0]];
            for(j=1;j<w.length;j+=2) {
                if(w[j] === N) { c[p] = parseFloat(w[j+1]); continue; }
                var q = rows[w[j]];
                A[p][q] = (sign[q]<0?-1:1)*parseFloat(w[j+1]);
            }
            break;
        case 4:
            for(j=1;j<w.length;j+=2) b[rows[w[j]]] = (sign[rows[w[j]]]<0?-1:1)*parseFloat(w[j+1]);
            break;
        case 5: /*FIXME*/ break;
        case 6: err('Internal error');
        }
    }
    err('Reached end of file without ENDATA');
}
// seedrandom.js version 2.0.
// Author: David Bau 4/2/2011
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
//
// Usage:
//
//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
//
//   Math.seedrandom('yipee'); Sets Math.random to a function that is
//                             initialized using the given explicit seed.
//
//   Math.seedrandom();        Sets Math.random to a function that is
//                             seeded using the current time, dom state,
//                             and other accumulated local entropy.
//                             The generated seed string is returned.
//
//   Math.seedrandom('yowza', true);
//                             Seeds using the given explicit seed mixed
//                             together with accumulated entropy.
//
//   <script src="http://bit.ly/srandom-512"></script>
//                             Seeds using physical random bits downloaded
//                             from random.org.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 Seeds using urandom bits from call.jsonlib.com,
//                             which is faster than random.org.
//
// Examples:
//
//   Math.seedrandom("hello");            // Use "hello" as the seed.
//   document.write(Math.random());       // Always 0.5463663768140734
//   document.write(Math.random());       // Always 0.43973793770592234
//   var rng1 = Math.random;              // Remember the current prng.
//
//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable.
//
//   Math.random = rng1;                  // Continue "hello" prng sequence.
//   document.write(Math.random());       // Always 0.554769432473455
//
//   Math.seedrandom(autoseed);           // Restart at the previous seed.
//   document.write(Math.random());       // Repeat the 'unpredictable' value.
//
// Notes:
//
// Each time seedrandom('arg') is called, entropy from the passed seed
// is accumulated in a pool to help generate future seeds for the
// zero-argument form of Math.seedrandom, so entropy can be injected over
// time by calling seedrandom with explicit data repeatedly.
//
// On speed - This javascript implementation of Math.random() is about
// 3-10x slower than the built-in Math.random() because it is not native
// code, but this is typically fast enough anyway.  Seeding is more expensive,
// especially if you use auto-seeding.  Some details (timings on Chrome 4):
//
// Our Math.random()            - avg less than 0.002 milliseconds per call
// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
// seedrandom('explicit', true) - avg less than 2 milliseconds per call
// seedrandom()                 - avg about 38 milliseconds per call
//
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/**
 * All code is in an anonymous closure to keep the global namespace clean.
 *
 * @param {number=} overflow 
 * @param {number=} startdenom
 */

// Patched by Seb so that seedrandom.js does not pollute the Math object.
// My tests suggest that doing Math.trouble = 1 makes Math lookups about 5%
// slower.
numeric.seedrandom = { pow:Math.pow, random:Math.random };

(function (pool, math, width, chunks, significance, overflow, startdenom) {


//
// seedrandom()
// This is the seedrandom function described above.
//
math['seedrandom'] = function seedrandom(seed, use_entropy) {
  var key = [];
  var arc4;

  // Flatten the seed string or build one from local entropy if needed.
  seed = mixkey(flatten(
    use_entropy ? [seed, pool] :
    arguments.length ? seed :
    [new Date().getTime(), pool, window], 3), key);

  // Use the seed to initialize an ARC4 generator.
  arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(arc4.S, pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  math['random'] = function random() {  // Closure to return a random double:
    var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
    var d = startdenom;                 //   and denominator d = 2 ^ 48.
    var x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  // Return the seed that was used
  return seed;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, u, me = this, keylen = key.length;
  var i = 0, j = me.i = me.j = me.m = 0;
  me.S = [];
  me.c = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) { me.S[i] = i++; }
  for (i = 0; i < width; i++) {
    t = me.S[i];
    j = lowbits(j + t + key[i % keylen]);
    u = me.S[j];
    me.S[i] = u;
    me.S[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  me.g = function getnext(count) {
    var s = me.S;
    var i = lowbits(me.i + 1); var t = s[i];
    var j = lowbits(me.j + t); var u = s[j];
    s[i] = u;
    s[j] = t;
    var r = s[lowbits(t + u)];
    while (--count) {
      i = lowbits(i + 1); t = s[i];
      j = lowbits(j + t); u = s[j];
      s[i] = u;
      s[j] = t;
      r = r * width + s[lowbits(t + u)];
    }
    me.i = i;
    me.j = j;
    return r;
  };
  // For robust unpredictability discard an initial batch of values.
  // See http://www.rsa.com/rsalabs/node.asp?id=2009
  me.g(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
/** @param {Object=} result 
  * @param {string=} prop
  * @param {string=} typ */
function flatten(obj, depth, result, prop, typ) {
  result = [];
  typ = typeof(obj);
  if (depth && typ == 'object') {
    for (prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
/** @param {number=} smear 
  * @param {number=} j */
function mixkey(seed, key, smear, j) {
  seed += '';                         // Ensure the seed is a string
  smear = 0;
  for (j = 0; j < seed.length; j++) {
    key[lowbits(j)] =
      lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
}

//
// lowbits()
// A quick "n mod width" for width a power of 2.
//
function lowbits(n) { return n & (width - 1); }

//
// The following constants are related to IEEE 754 limits.
//
startdenom = math.pow(width, chunks);
significance = math.pow(2, significance);
overflow = significance * 2;

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

// End anonymous scope, and pass initial values.
}(
  [],   // pool: entropy pool starts empty
  numeric.seedrandom, // math: package containing random, pow, and seedrandom
  256,  // width: each RC4 output is 0 <= x < 256
  6,    // chunks: at least six RC4 outputs for each double
  52    // significance: there are 52 significant digits in a double
  ));
/* This file is a slightly modified version of quadprog.js from Alberto Santini.
 * It has been slightly modified by Sébastien Loisel to make sure that it handles
 * 0-based Arrays instead of 1-based Arrays.
 * License is in resources/LICENSE.quadprog */
(function(exports) {

function base0to1(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=0;i<n;i++) ret[i+1] = base0to1(A[i]);
    return ret;
}
function base1to0(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=1;i<n;i++) ret[i-1] = base1to0(A[i]);
    return ret;
}

function dpori(a, lda, n) {
    var i, j, k, kp1, t;

    for (k = 1; k <= n; k = k + 1) {
        a[k][k] = 1 / a[k][k];
        t = -a[k][k];
        //~ dscal(k - 1, t, a[1][k], 1);
        for (i = 1; i < k; i = i + 1) {
            a[i][k] = t * a[i][k];
        }

        kp1 = k + 1;
        if (n < kp1) {
            break;
        }
        for (j = kp1; j <= n; j = j + 1) {
            t = a[k][j];
            a[k][j] = 0;
            //~ daxpy(k, t, a[1][k], 1, a[1][j], 1);
            for (i = 1; i <= k; i = i + 1) {
                a[i][j] = a[i][j] + (t * a[i][k]);
            }
        }
    }

}

function dposl(a, lda, n, b) {
    var i, k, kb, t;

    for (k = 1; k <= n; k = k + 1) {
        //~ t = ddot(k - 1, a[1][k], 1, b[1], 1);
        t = 0;
        for (i = 1; i < k; i = i + 1) {
            t = t + (a[i][k] * b[i]);
        }

        b[k] = (b[k] - t) / a[k][k];
    }

    for (kb = 1; kb <= n; kb = kb + 1) {
        k = n + 1 - kb;
        b[k] = b[k] / a[k][k];
        t = -b[k];
        //~ daxpy(k - 1, t, a[1][k], 1, b[1], 1);
        for (i = 1; i < k; i = i + 1) {
            b[i] = b[i] + (t * a[i][k]);
        }
    }
}

function dpofa(a, lda, n, info) {
    var i, j, jm1, k, t, s;

    for (j = 1; j <= n; j = j + 1) {
        info[1] = j;
        s = 0;
        jm1 = j - 1;
        if (jm1 < 1) {
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        } else {
            for (k = 1; k <= jm1; k = k + 1) {
                //~ t = a[k][j] - ddot(k - 1, a[1][k], 1, a[1][j], 1);
                t = a[k][j];
                for (i = 1; i < k; i = i + 1) {
                    t = t - (a[i][j] * a[i][k]);
                }
                t = t / a[k][k];
                a[k][j] = t;
                s = s + t * t;
            }
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        }
        info[1] = 0;
    }
}

function qpgen2(dmat, dvec, fddmat, n, sol, crval, amat,
    bvec, fdamat, q, meq, iact, nact, iter, work, ierr) {

    var i, j, l, l1, info, it1, iwzv, iwrv, iwrm, iwsv, iwuv, nvl, r, iwnbv,
        temp, sum, t1, tt, gc, gs, nu,
        t1inf, t2min,
        vsmall, tmpa, tmpb,
        go;

    r = Math.min(n, q);
    l = 2 * n + (r * (r + 5)) / 2 + 2 * q + 1;

    vsmall = 1.0e-60;
    do {
        vsmall = vsmall + vsmall;
        tmpa = 1 + 0.1 * vsmall;
        tmpb = 1 + 0.2 * vsmall;
    } while (tmpa <= 1 || tmpb <= 1);

    for (i = 1; i <= n; i = i + 1) {
        work[i] = dvec[i];
    }
    for (i = n + 1; i <= l; i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }

    info = [];

    if (ierr[1] === 0) {
        dpofa(dmat, fddmat, n, info);
        if (info[1] !== 0) {
            ierr[1] = 2;
            return;
        }
        dposl(dmat, fddmat, n, dvec);
        dpori(dmat, fddmat, n);
    } else {
        for (j = 1; j <= n; j = j + 1) {
            sol[j] = 0;
            for (i = 1; i <= j; i = i + 1) {
                sol[j] = sol[j] + dmat[i][j] * dvec[i];
            }
        }
        for (j = 1; j <= n; j = j + 1) {
            dvec[j] = 0;
            for (i = j; i <= n; i = i + 1) {
                dvec[j] = dvec[j] + dmat[j][i] * sol[i];
            }
        }
    }

    crval[1] = 0;
    for (j = 1; j <= n; j = j + 1) {
        sol[j] = dvec[j];
        crval[1] = crval[1] + work[j] * sol[j];
        work[j] = 0;
        for (i = j + 1; i <= n; i = i + 1) {
            dmat[i][j] = 0;
        }
    }
    crval[1] = -crval[1] / 2;
    ierr[1] = 0;

    iwzv = n;
    iwrv = iwzv + n;
    iwuv = iwrv + r;
    iwrm = iwuv + r + 1;
    iwsv = iwrm + (r * (r + 1)) / 2;
    iwnbv = iwsv + q;

    for (i = 1; i <= q; i = i + 1) {
        sum = 0;
        for (j = 1; j <= n; j = j + 1) {
            sum = sum + amat[j][i] * amat[j][i];
        }
        work[iwnbv + i] = Math.sqrt(sum);
    }
    nact = 0;
    iter[1] = 0;
    iter[2] = 0;

    function fn_goto_50() {
        iter[1] = iter[1] + 1;

        l = iwsv;
        for (i = 1; i <= q; i = i + 1) {
            l = l + 1;
            sum = -bvec[i];
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + amat[j][i] * sol[j];
            }
            if (Math.abs(sum) < vsmall) {
                sum = 0;
            }
            if (i > meq) {
                work[l] = sum;
            } else {
                work[l] = -Math.abs(sum);
                if (sum > 0) {
                    for (j = 1; j <= n; j = j + 1) {
                        amat[j][i] = -amat[j][i];
                    }
                    bvec[i] = -bvec[i];
                }
            }
        }

        for (i = 1; i <= nact; i = i + 1) {
            work[iwsv + iact[i]] = 0;
        }

        nvl = 0;
        temp = 0;
        for (i = 1; i <= q; i = i + 1) {
            if (work[iwsv + i] < temp * work[iwnbv + i]) {
                nvl = i;
                temp = work[iwsv + i] / work[iwnbv + i];
            }
        }
        if (nvl === 0) {
            return 999;
        }

        return 0;
    }

    function fn_goto_55() {
        for (i = 1; i <= n; i = i + 1) {
            sum = 0;
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + dmat[j][i] * amat[j][nvl];
            }
            work[i] = sum;
        }

        l1 = iwzv;
        for (i = 1; i <= n; i = i + 1) {
            work[l1 + i] = 0;
        }
        for (j = nact + 1; j <= n; j = j + 1) {
            for (i = 1; i <= n; i = i + 1) {
                work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
            }
        }

        t1inf = true;
        for (i = nact; i >= 1; i = i - 1) {
            sum = work[i];
            l = iwrm + (i * (i + 3)) / 2;
            l1 = l - i;
            for (j = i + 1; j <= nact; j = j + 1) {
                sum = sum - work[l] * work[iwrv + j];
                l = l + j;
            }
            sum = sum / work[l1];
            work[iwrv + i] = sum;
            if (iact[i] < meq) {
                // continue;
                break;
            }
            if (sum < 0) {
                // continue;
                break;
            }
            t1inf = false;
            it1 = i;
        }

        if (!t1inf) {
            t1 = work[iwuv + it1] / work[iwrv + it1];
            for (i = 1; i <= nact; i = i + 1) {
                if (iact[i] < meq) {
                    // continue;
                    break;
                }
                if (work[iwrv + i] < 0) {
                    // continue;
                    break;
                }
                temp = work[iwuv + i] / work[iwrv + i];
                if (temp < t1) {
                    t1 = temp;
                    it1 = i;
                }
            }
        }

        sum = 0;
        for (i = iwzv + 1; i <= iwzv + n; i = i + 1) {
            sum = sum + work[i] * work[i];
        }
        if (Math.abs(sum) <= vsmall) {
            if (t1inf) {
                ierr[1] = 1;
                // GOTO 999
                return 999;
            } else {
                for (i = 1; i <= nact; i = i + 1) {
                    work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
                }
                work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
                // GOTO 700
                return 700;
            }
        } else {
            sum = 0;
            for (i = 1; i <= n; i = i + 1) {
                sum = sum + work[iwzv + i] * amat[i][nvl];
            }
            tt = -work[iwsv + nvl] / sum;
            t2min = true;
            if (!t1inf) {
                if (t1 < tt) {
                    tt = t1;
                    t2min = false;
                }
            }

            for (i = 1; i <= n; i = i + 1) {
                sol[i] = sol[i] + tt * work[iwzv + i];
                if (Math.abs(sol[i]) < vsmall) {
                    sol[i] = 0;
                }
            }

            crval[1] = crval[1] + tt * sum * (tt / 2 + work[iwuv + nact + 1]);
            for (i = 1; i <= nact; i = i + 1) {
                work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
            }
            work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;

            if (t2min) {
                nact = nact + 1;
                iact[nact] = nvl;

                l = iwrm + ((nact - 1) * nact) / 2 + 1;
                for (i = 1; i <= nact - 1; i = i + 1) {
                    work[l] = work[i];
                    l = l + 1;
                }

                if (nact === n) {
                    work[l] = work[n];
                } else {
                    for (i = n; i >= nact + 1; i = i - 1) {
                        if (work[i] === 0) {
                            // continue;
                            break;
                        }
                        gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
                        gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
                        if (work[i - 1] >= 0) {
                            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        } else {
                            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        }
                        gc = work[i - 1] / temp;
                        gs = work[i] / temp;

                        if (gc === 1) {
                            // continue;
                            break;
                        }
                        if (gc === 0) {
                            work[i - 1] = gs * temp;
                            for (j = 1; j <= n; j = j + 1) {
                                temp = dmat[j][i - 1];
                                dmat[j][i - 1] = dmat[j][i];
                                dmat[j][i] = temp;
                            }
                        } else {
                            work[i - 1] = temp;
                            nu = gs / (1 + gc);
                            for (j = 1; j <= n; j = j + 1) {
                                temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                                dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                                dmat[j][i - 1] = temp;

                            }
                        }
                    }
                    work[l] = work[nact];
                }
            } else {
                sum = -bvec[nvl];
                for (j = 1; j <= n; j = j + 1) {
                    sum = sum + sol[j] * amat[j][nvl];
                }
                if (nvl > meq) {
                    work[iwsv + nvl] = sum;
                } else {
                    work[iwsv + nvl] = -Math.abs(sum);
                    if (sum > 0) {
                        for (j = 1; j <= n; j = j + 1) {
                            amat[j][nvl] = -amat[j][nvl];
                        }
                        bvec[nvl] = -bvec[nvl];
                    }
                }
                // GOTO 700
                return 700;
            }
        }

        return 0;
    }

    function fn_goto_797() {
        l = iwrm + (it1 * (it1 + 1)) / 2 + 1;
        l1 = l + it1;
        if (work[l1] === 0) {
            // GOTO 798
            return 798;
        }
        gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        if (work[l1 - 1] >= 0) {
            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        } else {
            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        }
        gc = work[l1 - 1] / temp;
        gs = work[l1] / temp;

        if (gc === 1) {
            // GOTO 798
            return 798;
        }
        if (gc === 0) {
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = work[l1 - 1];
                work[l1 - 1] = work[l1];
                work[l1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = dmat[i][it1];
                dmat[i][it1] = dmat[i][it1 + 1];
                dmat[i][it1 + 1] = temp;
            }
        } else {
            nu = gs / (1 + gc);
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = gc * work[l1 - 1] + gs * work[l1];
                work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
                work[l1 - 1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
                dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
                dmat[i][it1] = temp;
            }
        }

        return 0;
    }

    function fn_goto_798() {
        l1 = l - it1;
        for (i = 1; i <= it1; i = i + 1) {
            work[l1] = work[l];
            l = l + 1;
            l1 = l1 + 1;
        }

        work[iwuv + it1] = work[iwuv + it1 + 1];
        iact[it1] = iact[it1 + 1];
        it1 = it1 + 1;
        if (it1 < nact) {
            // GOTO 797
            return 797;
        }

        return 0;
    }

    function fn_goto_799() {
        work[iwuv + nact] = work[iwuv + nact + 1];
        work[iwuv + nact + 1] = 0;
        iact[nact] = 0;
        nact = nact - 1;
        iter[2] = iter[2] + 1;

        return 0;
    }

    go = 0;
    while (true) {
        go = fn_goto_50();
        if (go === 999) {
            return;
        }
        while (true) {
            go = fn_goto_55();
            if (go === 0) {
                break;
            }
            if (go === 999) {
                return;
            }
            if (go === 700) {
                if (it1 === nact) {
                    fn_goto_799();
                } else {
                    while (true) {
                        fn_goto_797();
                        go = fn_goto_798();
                        if (go !== 797) {
                            break;
                        }
                    }
                    fn_goto_799();
                }
            }
        }
    }

}

function solveQP(Dmat, dvec, Amat, bvec, meq, factorized) {
    Dmat = base0to1(Dmat);
    dvec = base0to1(dvec);
    Amat = base0to1(Amat);
    var i, n, q,
        nact, r,
        crval = [], iact = [], sol = [], work = [], iter = [],
        message;

    meq = meq || 0;
    factorized = factorized ? base0to1(factorized) : [undefined, 0];
    bvec = bvec ? base0to1(bvec) : [];

    // In Fortran the array index starts from 1
    n = Dmat.length - 1;
    q = Amat[1].length - 1;

    if (!bvec) {
        for (i = 1; i <= q; i = i + 1) {
            bvec[i] = 0;
        }
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }
    nact = 0;
    r = Math.min(n, q);
    for (i = 1; i <= n; i = i + 1) {
        sol[i] = 0;
    }
    crval[1] = 0;
    for (i = 1; i <= (2 * n + (r * (r + 5)) / 2 + 2 * q + 1); i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= 2; i = i + 1) {
        iter[i] = 0;
    }

    qpgen2(Dmat, dvec, n, n, sol, crval, Amat,
        bvec, n, q, meq, iact, nact, iter, work, factorized);

    message = "";
    if (factorized[1] === 1) {
        message = "constraints are inconsistent, no solution!";
    }
    if (factorized[1] === 2) {
        message = "matrix D in quadratic function is not positive definite!";
    }

    return {
        solution: base1to0(sol),
        value: base1to0(crval),
        unconstrained_solution: base1to0(dvec),
        iterations: base1to0(iter),
        iact: base1to0(iact),
        message: message
    };
}
exports.solveQP = solveQP;
}(numeric));
/*
Shanti Rao sent me this routine by private email. I had to modify it
slightly to work on Arrays instead of using a Matrix object.
It is apparently translated from http://stitchpanorama.sourceforge.net/Python/svd.py
*/

numeric.svd= function svd(A) {
    var temp;
//Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
	var prec= numeric.epsilon; //Math.pow(2,-52) // assumes double prec
	var tolerance= 1.e-64/prec;
	var itmax= 50;
	var c=0;
	var i=0;
	var j=0;
	var k=0;
	var l=0;
	
	var u= numeric.clone(A);
	var m= u.length;
	
	var n= u[0].length;
	
	if (m < n) throw "Need more rows than columns"
	
	var e = new Array(n);
	var q = new Array(n);
	for (i=0; i<n; i++) e[i] = q[i] = 0.0;
	var v = numeric.rep([n,n],0);
//	v.zero();
	
 	function pythag(a,b)
 	{
		a = Math.abs(a)
		b = Math.abs(b)
		if (a > b)
			return a*Math.sqrt(1.0+(b*b/a/a))
		else if (b == 0.0) 
			return a
		return b*Math.sqrt(1.0+(a*a/b/b))
	}

	//Householder's reduction to bidiagonal form

	var f= 0.0;
	var g= 0.0;
	var h= 0.0;
	var x= 0.0;
	var y= 0.0;
	var z= 0.0;
	var s= 0.0;
	
	for (i=0; i < n; i++)
	{	
		e[i]= g;
		s= 0.0;
		l= i+1;
		for (j=i; j < m; j++) 
			s += (u[j][i]*u[j][i]);
		if (s <= tolerance)
			g= 0.0;
		else
		{	
			f= u[i][i];
			g= Math.sqrt(s);
			if (f >= 0.0) g= -g;
			h= f*g-s
			u[i][i]=f-g;
			for (j=l; j < n; j++)
			{
				s= 0.0
				for (k=i; k < m; k++) 
					s += u[k][i]*u[k][j]
				f= s/h
				for (k=i; k < m; k++) 
					u[k][j]+=f*u[k][i]
			}
		}
		q[i]= g
		s= 0.0
		for (j=l; j < n; j++) 
			s= s + u[i][j]*u[i][j]
		if (s <= tolerance)
			g= 0.0
		else
		{	
			f= u[i][i+1]
			g= Math.sqrt(s)
			if (f >= 0.0) g= -g
			h= f*g - s
			u[i][i+1] = f-g;
			for (j=l; j < n; j++) e[j]= u[i][j]/h
			for (j=l; j < m; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += (u[j][k]*u[i][k])
				for (k=l; k < n; k++) 
					u[j][k]+=s*e[k]
			}	
		}
		y= Math.abs(q[i])+Math.abs(e[i])
		if (y>x) 
			x=y
	}
	
	// accumulation of right hand gtransformations
	for (i=n-1; i != -1; i+= -1)
	{	
		if (g != 0.0)
		{
		 	h= g*u[i][i+1]
			for (j=l; j < n; j++) 
				v[j][i]=u[i][j]/h
			for (j=l; j < n; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += u[i][k]*v[k][j]
				for (k=l; k < n; k++) 
					v[k][j]+=(s*v[k][i])
			}	
		}
		for (j=l; j < n; j++)
		{
			v[i][j] = 0;
			v[j][i] = 0;
		}
		v[i][i] = 1;
		g= e[i]
		l= i
	}
	
	// accumulation of left hand transformations
	for (i=n-1; i != -1; i+= -1)
	{	
		l= i+1
		g= q[i]
		for (j=l; j < n; j++) 
			u[i][j] = 0;
		if (g != 0.0)
		{
			h= u[i][i]*g
			for (j=l; j < n; j++)
			{
				s=0.0
				for (k=l; k < m; k++) s += u[k][i]*u[k][j];
				f= s/h
				for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
			}
			for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
		}
		else
			for (j=i; j < m; j++) u[j][i] = 0;
		u[i][i] += 1;
	}
	
	// diagonalization of the bidiagonal form
	prec= prec*x
	for (k=n-1; k != -1; k+= -1)
	{
		for (var iteration=0; iteration < itmax; iteration++)
		{	// test f splitting
			var test_convergence = false
			for (l=k; l != -1; l+= -1)
			{	
				if (Math.abs(e[l]) <= prec)
				{	test_convergence= true
					break 
				}
				if (Math.abs(q[l-1]) <= prec)
					break 
			}
			if (!test_convergence)
			{	// cancellation of e[l] if l>0
				c= 0.0
				s= 1.0
				var l1= l-1
				for (i =l; i<k+1; i++)
				{	
					f= s*e[i]
					e[i]= c*e[i]
					if (Math.abs(f) <= prec)
						break
					g= q[i]
					h= pythag(f,g)
					q[i]= h
					c= g/h
					s= -f/h
					for (j=0; j < m; j++)
					{	
						y= u[j][l1]
						z= u[j][i]
						u[j][l1] =  y*c+(z*s)
						u[j][i] = -y*s+(z*c)
					} 
				}	
			}
			// test f convergence
			z= q[k]
			if (l== k)
			{	//convergence
				if (z<0.0)
				{	//q[k] is made non-negative
					q[k]= -z
					for (j=0; j < n; j++)
						v[j][k] = -v[j][k]
				}
				break  //break out of iteration loop and move on to next k value
			}
			if (iteration >= itmax-1)
				throw 'Error: no convergence.'
			// shift from bottom 2x2 minor
			x= q[l]
			y= q[k-1]
			g= e[k-1]
			h= e[k]
			f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
			g= pythag(f,1.0)
			if (f < 0.0)
				f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
			else
				f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
			// next QR transformation
			c= 1.0
			s= 1.0
			for (i=l+1; i< k+1; i++)
			{	
				g= e[i]
				y= q[i]
				h= s*g
				g= c*g
				z= pythag(f,h)
				e[i-1]= z
				c= f/z
				s= h/z
				f= x*c+g*s
				g= -x*s+g*c
				h= y*s
				y= y*c
				for (j=0; j < n; j++)
				{	
					x= v[j][i-1]
					z= v[j][i]
					v[j][i-1] = x*c+z*s
					v[j][i] = -x*s+z*c
				}
				z= pythag(f,h)
				q[i-1]= z
				c= f/z
				s= h/z
				f= c*g+s*y
				x= -s*g+c*y
				for (j=0; j < m; j++)
				{
					y= u[j][i-1]
					z= u[j][i]
					u[j][i-1] = y*c+z*s
					u[j][i] = -y*s+z*c
				}
			}
			e[l]= 0.0
			e[k]= f
			q[k]= x
		} 
	}
		
	//vt= transpose(v)
	//return (u,q,vt)
	for (i=0;i<q.length; i++) 
	  if (q[i] < prec) q[i] = 0
	  
	//sort eigenvalues	
	for (i=0; i< n; i++)
	{	 
	//writeln(q)
	 for (j=i-1; j >= 0; j--)
	 {
	  if (q[j] < q[i])
	  {
	//  writeln(i,'-',j)
	   c = q[j]
	   q[j] = q[i]
	   q[i] = c
	   for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
	   for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
//	   u.swapCols(i,j)
//	   v.swapCols(i,j)
	   i = j	   
	  }
	 }	
	}
	
	return {U:u,S:q,V:v}
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],357:[function(require,module,exports){
'use strict';

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var slice = Array.prototype.slice;
var isArgs = require('./isArguments');
var isEnumerable = Object.prototype.propertyIsEnumerable;
var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
var dontEnums = [
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'constructor'
];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var excludedKeys = {
	$console: true,
	$external: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$innerHeight: true,
	$innerWidth: true,
	$outerHeight: true,
	$outerWidth: true,
	$pageXOffset: true,
	$pageYOffset: true,
	$parent: true,
	$scrollLeft: true,
	$scrollTop: true,
	$scrollX: true,
	$scrollY: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = (function () {
	/* global window */
	if (typeof window === 'undefined') { return false; }
	for (var k in window) {
		try {
			if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2));
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) {
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./isArguments":358}],358:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],359:[function(require,module,exports){
'use strict';

var ES = require('es-abstract/es7');
var has = require('has');
var bind = require('function-bind');
var isEnumerable = bind.call(Function.call, Object.prototype.propertyIsEnumerable);

module.exports = function values(O) {
	var obj = ES.RequireObjectCoercible(O);
	var vals = [];
	for (var key in obj) {
		if (has(obj, key) && isEnumerable(obj, key)) {
			vals.push(obj[key]);
		}
	}
	return vals;
};

},{"es-abstract/es7":333,"function-bind":348,"has":349}],360:[function(require,module,exports){
'use strict';

var define = require('define-properties');

var implementation = require('./implementation');
var getPolyfill = require('./polyfill');
var shim = require('./shim');

var polyfill = getPolyfill();

define(polyfill, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = polyfill;

},{"./implementation":359,"./polyfill":361,"./shim":362,"define-properties":329}],361:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Object.values === 'function' ? Object.values : implementation;
};

},{"./implementation":359}],362:[function(require,module,exports){
'use strict';

var getPolyfill = require('./polyfill');
var define = require('define-properties');

module.exports = function shimValues() {
	var polyfill = getPolyfill();
	define(Object, { values: polyfill }, {
		values: function testValues() {
			return Object.values !== polyfill;
		}
	});
	return polyfill;
};

},{"./polyfill":361,"define-properties":329}],363:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FUNCTIONS = exports.OP_FUNCTIONS = exports.OPERATORS = exports.ERRORS = exports.TOKENS = undefined;

var _functions = require('./parser/functions');

/**
 * Token list
 *
 * @static
 * @constant
 * @type {object}
 * @property {string} EOL - End of line.
 * @property {string} NUMBER - Number constant.
 * @property {string} STRING - String constant.
 * @property {string} BOOLEAN - Boolean constant.
 * @property {string} ERROR - Error constant.
 * @property {string} ID - Function name or Cell reference.
 * @property {string} SHEET - Sheet.
 * @property {string} RANGE - Range.
 * @property {string} PLUS - The plus sign (+).
 * @property {string} MINUS - The minus sign (-).
 * @property {string} MULT - The multiplication sign (*).
 * @property {string} DIV - The division sign (/).
 * @property {string} POW - The exponent sign (^).
 * @property {string} LT - The less than sign (<).
 * @property {string} GT - The greater than sign (>).
 * @property {string} EQ - The equal sign (=).
 * @property {string} LE - The less than or equal sign (<=).
 * @property {string} GE - The greater than or equal sign (>=).
 * @property {string} NE - The not equal sign (<>).
 * @property {string} CONCAT - The string concatenation sign (&).
 * @property {string} EXCLAMATION - The exclamation sign (!).
 * @property {string} PERCENT - The percent sign (%).
 * @property {string} COLON - The colon sign (:).
 * @property {string} COMMA - The comma sign (,).
 * @property {string} SEMICOLON - The semi-colon sign (;).
 * @property {string} PERIOD - The dot sign (.).
 * @property {string} DOLLAR - The dollar sign ($).
 * @property {string} LPAREN - The left parentheses sign (().
 * @property {string} RPAREN - The right parentheses sign ()).
 * @property {string} LBRACE - The left brace sign ({).
 * @property {string} RBRACE - The right brace sign (}).
 * @property {string} LBRACKET - The left bracket sign ([).
 * @property {string} RBRACKET - The right bracket sign (]).
 */
var TOKENS = exports.TOKENS = {
    EOL: '(eol)',

    // Constants
    NUMBER: '(number)',
    STRING: '(string)',
    BOOLEAN: '(boolean)',
    ERROR: '(error)',
    ID: '(identifier)',
    SHEET: '(sheet)',
    RANGE: '(range)',

    // Operators
    PLUS: '+',
    MINUS: '-',
    MULT: '*',
    DIV: '/',
    POW: '^',
    LT: '<',
    GT: '>',
    EQ: '=',
    LE: '<=',
    GE: '>=',
    NE: '<>',
    CONCAT: '&',
    EXCLAMATION: '!',
    PERCENT: '%',
    COLON: ':',
    COMMA: ',',
    SEMICOLON: ';',
    PERIOD: '.',
    DOLLAR: '$',
    LPAREN: '(',
    RPAREN: ')',
    LBRACE: '{',
    RBRACE: '}',
    LBRACKET: '[',
    RBRACKET: ']'
};

/**
 * Spreadsheet Error list
 * @see {@link http://docs.oasis-open.org/office/v1.2/os/OpenDocument-v1.2-os-part2.html#__RefHeading__1017966_715980110|5.12Constant Errors}
 *
 * @static
 * @constant
 * @type {object}
 * @property {string} #DIV/0! - Attempt to divide by zero, including division by an empty cell. ERROR.TYPE of 2.
 * @property {string} #NAME? - Unrecognized/deleted name. ERROR.TYPE of 5.
 * @property {string} #N/A - Not available. ISNA() applied to this value will return True. Lookup functions which failed, and NA(), return this value. ERROR.TYPE of 7.
 * @property {string} #NULL! - Intersection of ranges produced zero cells. ERROR.TYPE of 1.
 * @property {string} #NUM! - Failed to meet domain constraints (e.g., input was too large or too small). ERROR.TYPE of 6.
 * @property {string} #REF! - Reference to invalid cell (e.g., beyond the application's abilities). ERROR.TYPE of 4.
 * @property {string} #VALUE! - Parameter is wrong type. ERROR.TYPE of 3.
 */
var ERRORS = exports.ERRORS = {
    DIV: '#DIV/0!',
    NAME: '#NAME?',
    NA: '#N/A',
    NULL: '#NULL!',
    NUM: '#NUM!',
    REF: '#REF!',
    VALUE: '#VALUE!'
};

/**
 * Basic operators
 *
 * @static
 * @constant
 * @type {object}
 * @property {string} + - The plus type, PLUS.
 * @property {string} - - The minus type, MINUS.
 * @property {string} * - The multiplication type, MULT.
 * @property {string} / - The division type, DIV.
 * @property {string} ^ - The exponent type, POW.
 * @property {string} < - The less than type, LT.
 * @property {string} > - The greater than type, GT.
 * @property {string} = - The equal type, EQ.
 * @property {string} <= - The less than or equal type, LE.
 * @property {string} >= - The greater than or equal type, GE.
 * @property {string} <> - The not equal type, NE.
 * @property {string} & - The string concatenation type, CONCAT.
 * @property {string} ! - The exclamation type, EXCLAMATION.
 * @property {string} % - The percent type, PERCENT.
 * @property {string} : - The colon type, COLON.
 * @property {string} , - The comma type, COMMA.
 * @property {string} ; - The semi-colon type, SEMICOLON.
 * @property {string} ( - The left parentheses type, LPAREN.
 * @property {string} ) - The right parentheses type, RPAREN.
 */
var OPERATORS = exports.OPERATORS = {
    '+': TOKENS.PLUS,
    '-': TOKENS.MINUS,
    '*': TOKENS.MULT,
    '/': TOKENS.DIV,
    '^': TOKENS.POW,
    '<': TOKENS.LT,
    '>': TOKENS.GT,
    '=': TOKENS.EQ,
    '<=': TOKENS.LE,
    '>=': TOKENS.GE,
    '<>': TOKENS.NE,
    '&': TOKENS.CONCAT,
    '!': TOKENS.EXCLAMATION,
    '%': TOKENS.PERCENT,
    ':': TOKENS.COLON,
    ',': TOKENS.COMMA,
    ';': TOKENS.SEMICOLON,
    '.': TOKENS.PERIOD,
    '(': TOKENS.LPAREN,
    ')': TOKENS.RPAREN,
    '{': TOKENS.LBRACE,
    '}': TOKENS.RBRACE,
    '[': TOKENS.LBRACKET,
    ']': TOKENS.RBRACKET
};

/**
 * Operation functions.
 *
 * @static
 * @constant
 * @type {object}
 */
var OP_FUNCTIONS = exports.OP_FUNCTIONS = {
    // Basic operations
    '+': function _(left, right) {
        return left + right;
    },
    '-': function _(left, right) {
        return left - right;
    },
    '*': function _(left, right) {
        return left * right;
    },
    '/': function _(left, right) {
        return left / right;
    },
    '^': function _(left, right) {
        return _functions.FUNCTIONS.POW(left, right);
    },

    // Relational operations
    '<': function _(left, right) {
        return left < right;
    },
    '>': function _(left, right) {
        return left > right;
    },
    '=': function _(left, right) {
        return left == right;
    }, // eslint-disable-line eqeqeq
    '<=': function _(left, right) {
        return left <= right;
    },
    '>=': function _(left, right) {
        return left >= right;
    },
    '<>': function _(left, right) {
        return left != right;
    }, // eslint-disable-line eqeqeq

    // Other operations
    '&': function _(left, right) {
        return _functions.FUNCTIONS.CONCAT(left, right);
    }
};

exports.FUNCTIONS = _functions.FUNCTIONS;

},{"./parser/functions":388}],364:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.consts = undefined;

var _parser = require('./parser');

Object.keys(_parser).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _parser[key];
        }
    });
});

require('babel-polyfill');

var _Constants = require('./Constants');

var consts = _interopRequireWildcard(_Constants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.consts = consts;


var Sint = exports; // eslint-disable-line

global.Sint = Sint; // eslint-disable-line

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') // eslint-disable-line
    {
        module.exports = Sint; // eslint-disable-line
    } else if (typeof define === 'function' && define.amd) // eslint-disable-line
    {
        define([], function () // eslint-disable-line
        {
            return Sint;
        });
    } else {
    window.Sint = Sint; // eslint-disable-line
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Constants":363,"./parser":395,"babel-polyfill":1}],365:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Iterable list of characters.
 */
var Characters = function () {
    /**
    * Creates a Characters objects from text.
    * @param {string} [text] - The text source.
    */
    function Characters() {
        var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        _classCallCheck(this, Characters);

        this.text = text;
    }

    /**
     * Advance to the next character.
     * @return {string} Next character.
     */


    _createClass(Characters, [{
        key: 'advance',
        value: function advance() {
            this.pointer++;

            return this.current;
        }

        /**
         * Peek the next character without advancing.
         * @return {string} Next character.
         */

    }, {
        key: 'isWhitespace',


        /**
         * Returns true if the current character is a white space.
         * @return {boolean} True if is a white space.
         */
        value: function isWhitespace() {
            return (/^\s+$/.test(this.current)
            );
        }

        /**
         * Returns true if the current character is alphabetic.
         * @return {boolean} True if is a alphabetic.
         */

    }, {
        key: 'isAlpha',
        value: function isAlpha() {
            return (/^[a-zA-Z]+$/.test(this.current)
            );
        }

        /**
         * Returns true if the current character is a digit.
         * @return {boolean} True if is a digit.
         */

    }, {
        key: 'isDigit',
        value: function isDigit() {
            return (/^[0-9]+$/.test(this.current)
            );
        }

        /**
         * Returns true if the current character is a valid Identifier character.
         * @return {boolean} True if is a valid identifier.
         */

    }, {
        key: 'isIdentifier',
        value: function isIdentifier() {
            return this.isAlpha() || this.isDigit() || /^[\$\.]+$/.test(this.current);
        }
    }, {
        key: 'peek',
        get: function get() {
            return this._text[this.pointer + 1];
        }

        /**
         * Returns true if pointer is equal or greater than text length.
         * @return {boolean} Did pointer reach the last position?
         */

    }, {
        key: 'end',
        get: function get() {
            return this.pointer >= this._text.length;
        }

        /**
         * Returns the first character of text.
         * @return {string} First text character.
         */

    }, {
        key: 'start',
        get: function get() {
            return this._text[0];
        }

        /**
         * Get current character
         * @readonly
         * @return {string} Current character.
         */

    }, {
        key: 'current',
        get: function get() {
            return this._text[this.pointer];
        }

        /**
         * Set a new text and set pointer to zero.
         * @param {string} [value] - Code content.
         */

    }, {
        key: 'text',
        set: function set(value) {
            this._text = String(value);
            this.pointer = 0;
        },
        get: function get() // eslint-disable-line require-jsdoc
        {
            return this._text;
        }
    }]);

    return Characters;
}();

Characters.displayName = 'Characters';
exports.default = Characters;

},{}],366:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('object.values');

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (!Object.values) {
    _object2.default.shim();
}

/**
 * Data from a Worksheet.
 */

var DataGrid = function () {
    /**
    * Creates a Data map.
    * @param {object} [values] - List of values.
    */
    function DataGrid() {
        var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, DataGrid);

        this.values = values;
    }

    /**
     * Get a Cell value;
     * @param {CellIdentifier} [cell] - The Cell.
     * @return {*}                      Cell value.
     */


    _createClass(DataGrid, [{
        key: 'getValue',
        value: function getValue(cell) {
            var name = cell.clean();

            return this.values[name];
        }

        /**
         * Get a Range array.
         * @todo implement this.
         * @param {RangeReference} [range] - Range.
         * @return {array}                   Range values.
         */

    }, {
        key: 'getRange',
        value: function getRange(range) {
            var _range$pair = range.pair(),
                _range$pair2 = _slicedToArray(_range$pair, 2),
                first = _range$pair2[0],
                last = _range$pair2[1]; // eslint-disable-line no-unused-vars


            var result = Object.values(this.values);

            return result;
        }
    }]);

    return DataGrid;
}();

DataGrid.displayName = 'DataGrid';
exports.default = DataGrid;

},{"object.values":360}],367:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Lexer = require('./Lexer');

var _Lexer2 = _interopRequireDefault(_Lexer);

var _Parser = require('./Parser');

var _Parser2 = _interopRequireDefault(_Parser);

var _DataGrid = require('./DataGrid');

var _DataGrid2 = _interopRequireDefault(_DataGrid);

var _ast = require('./ast');

var _Constants = require('./../Constants');

var _NodeVisitor2 = require('./NodeVisitor');

var _NodeVisitor3 = _interopRequireDefault(_NodeVisitor2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Execute an AST.
 * @todo Implement promises as return from function calls.
 * @todo Implement error handling.
 * @todo Implement worksheet data structure.
 */
var Interpreter = function (_NodeVisitor) {
    _inherits(Interpreter, _NodeVisitor);

    /**
     * Create a Interpreter
     * @param {DataGrid} [data] - Data object.
     * @param {object}   [list] - List of functions.
     */
    function Interpreter() {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, Interpreter);

        var _this = _possibleConstructorReturn(this, (Interpreter.__proto__ || Object.getPrototypeOf(Interpreter)).call(this));

        _this.data = data ? data : new _DataGrid2.default();
        _this.functions = list ? list : _Constants.FUNCTIONS;
        return _this;
    }

    /**
     * Visit a FunctionCall object.
     * @throws Will throw an error if function doesn't exists.
     * @param {AST} [node] - The tree or node.
     * @return {*} Result of operation.
     */


    _createClass(Interpreter, [{
        key: 'visitFunctionCall',
        value: function visitFunctionCall(node) {
            var name = node.name;
            var fn = this.functionByName(name);

            if (fn && typeof fn === 'function') {
                var args = [];

                for (var index in node.params) {
                    var arg = node.params[index];

                    args.push(this.visit(arg));
                }

                return fn.apply(null, args);
            }

            throw new Error('Function "' + name + '" doesn\'t exists.');
        }

        /**
         * Visit a CellIdentifier object
         * @param {AST} [node] - The tree or node.
         * @return {*}           Cell value or null.
         */

    }, {
        key: 'visitCellIdentifier',
        value: function visitCellIdentifier(node) {
            if (this.data) {
                return this.data.getValue(node);
            }

            return null;
        }

        /**
         * Visit a RangeReference object
         * @param {AST} [node] - The tree or node.
         * @return {array}       Range as array.
         */

    }, {
        key: 'visitRangeReference',
        value: function visitRangeReference(node) {
            if (this.data) {
                return this.data.getRange(node);
            }

            return null;
        }

        /**
         * Visit a BinOp object
         * @param {AST} [node] - The tree or node.
         * @return {*} Result of operation.
         */

    }, {
        key: 'visitBinOp',
        value: function visitBinOp(node) {
            var sign = node.op.value;
            var operator = _Constants.OP_FUNCTIONS[sign];

            if (operator) {
                return operator(this.visit(node.left), this.visit(node.right));
            }

            return null;
        }

        /**
         * Visit a UnaryOp object
         * @param {AST} [node] - The tree or node.
         * @return {*} Result of operation.
         */

    }, {
        key: 'visitUnaryOp',
        value: function visitUnaryOp(node) {
            if (node.op.type === _Constants.TOKENS.MINUS) {
                return -this.visit(node.expr);
            }

            return +this.visit(node.expr); // eslint-disable-line no-implicit-coercion
        }

        /**
         * Visit a PostfixOp object
         * @param {AST} [node] - The tree or node.
         * @return {*} Result of operation.
         */

    }, {
        key: 'visitPostfixOp',
        value: function visitPostfixOp(node) {
            return Number(this.visit(node.expr) / 100);
        }

        /**
         * Visit a ArrayConstant object
         * @param {AST} [node] - The tree or node.
         * @return {number} Node value.
         */

    }, {
        key: 'visitArrayConstant',
        value: function visitArrayConstant(node) {
            if (!Array.isArray(node.value)) {
                return [];
            }

            var columns = node.value;
            var constant = [];
            var column = [];
            var row = [];

            for (var i in columns) {
                column = columns[i];
                constant[i] = [];
                for (var j in column) {
                    row = column[j];
                    constant[i][j] = this.visit(row);
                }
            }

            return constant;
        }

        /**
         * Visit a NumberConstant object
         * @param {AST} [node] - The tree or node.
         * @return {number} Node value.
         */

    }, {
        key: 'visitNumberConstant',
        value: function visitNumberConstant(node) {
            return node.value;
        }

        /**
         * Visit a StringConstant object
         * @param {AST} [node] - The tree or node.
         * @return {string} Node value.
         */

    }, {
        key: 'visitStringConstant',
        value: function visitStringConstant(node) {
            return node.value;
        }

        /**
         * Visit a BooleanConstant object
         * @param {AST} [node] - The tree or node.
         * @return {boolean} Node value.
         */

    }, {
        key: 'visitBooleanConstant',
        value: function visitBooleanConstant(node) {
            return node.value;
        }

        /**
         * Visit a ErrorConstant object
         * @param {AST} [node] - The tree or node.
         * @return {null} Node value.
         */

    }, {
        key: 'visitErrorConstant',
        value: function visitErrorConstant(node) {
            return node.value;
        }

        /**
         * Return a function from a list.
         * @param {string} [name] - Function name.
         * @return {Function} The function.
         */

    }, {
        key: 'functionByName',
        value: function functionByName(name) {
            var fns = this.functions;

            return fns[name];
        }

        /**
         * Add more functions to the function list.
         * @param  {object} [list] - Pairs of name : function.
         * @return {object} Function list.
         */

    }, {
        key: 'addFunctions',
        value: function addFunctions(list) {
            this.functions = Object.assign(this.functions, list);

            return this.functions;
        }

        /**
         * Set functions.
         * @param  {object} [list] - Pairs of name : function.
         */

    }, {
        key: 'execute',


        /**
         * Execute a AST or parse and then execute a code.
         * @throws Will throw an error if is a invalid code.
         * @param {string|AST} [source] - Source code or AST.
         * @return {*}                    The result of the code.
         */
        value: function execute(source) {
            if (typeof source === 'string') {
                var lexer = new _Lexer2.default(source);
                var parser = new _Parser2.default(lexer);
                var tree = parser.parse();

                return this.execute(tree);
            } else if (source instanceof _ast.AST) {
                return this.visit(source);
            }

            return null;
        }

        /**
         * Execute a AST or parse and then execute a code.
         * @throws Will throw an error if is a invalid code.
         * @param {string|AST} [source] - Source code or AST.
         * @param {DataGrid}   [data]   - Data object.
         * @return {*}                    The result of the code.
         */

    }, {
        key: 'run',
        value: function run() {
            var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (data !== null) {
                this.data = data;
            }

            return this.execute(source);
        }
    }, {
        key: 'functions',
        set: function set(list) {
            this._functions = list;
        }

        /**
         * Return functions.
         * @return {object} Function list.
         */
        ,
        get: function get() {
            return this._functions;
        }
    }]);

    return Interpreter;
}(_NodeVisitor3.default);

Interpreter.displayName = 'Interpreter';
exports.default = Interpreter;

},{"./../Constants":363,"./DataGrid":366,"./Lexer":368,"./NodeVisitor":369,"./Parser":370,"./ast":386}],368:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('./../Constants');

var _Characters2 = require('./Characters');

var _Characters3 = _interopRequireDefault(_Characters2);

var _Token = require('./Token');

var _Token2 = _interopRequireDefault(_Token);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var START_CHAR = '=';
var DOLLAR_SIGN = '$';
var SINGLE_QUOTE = '\'';
var DOUBLE_QUOTE = '"';

// Error characteres
var HASH_SIGN = '#';
var EXCLAMATION_MARK = '!';
var QUESTION_MARK = '?';
var SLASH = '/';

// Returns true if it's a number or number string.
function isNumber(number) {
    return !isNaN(parseFloat(number)) && isFinite(number);
}

/**
 * A class to do Lexical analysis.
 *
 * @extends Characters
 */

var Lexer = function (_Characters) {
    _inherits(Lexer, _Characters);

    /**
    * Creates a Lexer.
    * @param {string} [text] - Code content.
    */
    function Lexer() {
        var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        _classCallCheck(this, Lexer);

        return _possibleConstructorReturn(this, (Lexer.__proto__ || Object.getPrototypeOf(Lexer)).call(this, text));
    }

    /**
     * Skip white space characters
     */


    _createClass(Lexer, [{
        key: 'skipWhitespace',
        value: function skipWhitespace() {
            while (!this.end && this.isWhitespace()) {
                this.advance();
            }
        }

        /**
         * Returns all contents from text.
         * @return {string} Text contents.
         */

    }, {
        key: 'contents',
        value: function contents() {
            var result = '';

            while (!this.end) {
                result += this.current;
                this.advance();
            }

            return result;
        }

        /**
         * Returns a constant or EOF. Constants can be Strings, numbers and Booleans.
         * @return {Token} A Constant token.
         */

    }, {
        key: 'constant',
        value: function constant() {
            var isSingleQuoted = this.current === SINGLE_QUOTE;
            var result = void 0;

            if (isSingleQuoted) {
                this.advance();
                result = this.contents();

                return new _Token2.default(_Constants.TOKENS.STRING, String(result));
            }

            result = this.contents();
            if (result) {
                var lower = result.toUpperCase();
                var error = lower.trim();

                for (var key in _Constants.ERRORS) {
                    if (_Constants.ERRORS[key] === error) {
                        return new _Token2.default(_Constants.TOKENS.ERROR, error);
                    }
                }

                if (lower === 'TRUE') {
                    return new _Token2.default(_Constants.TOKENS.BOOLEAN, true);
                } else if (lower === 'FALSE') {
                    return new _Token2.default(_Constants.TOKENS.BOOLEAN, false);
                } else if (isNumber(result)) {
                    return new _Token2.default(_Constants.TOKENS.NUMBER, parseFloat(result));
                }

                return new _Token2.default(_Constants.TOKENS.STRING, String(result));
            }

            return new _Token2.default(_Constants.TOKENS.EOL);
        }

        /**
         * Returns a digit
         * @return {string} A Number string.
         */

    }, {
        key: 'digit',
        value: function digit() {
            var result = '';

            while (this.isDigit()) {
                result += this.current;
                this.advance();
            }

            return result;
        }

        /**
         * Returns a number token or a range (e.g. 1:3) token.
         * @return {Token} A Number or Range token.
         */

    }, {
        key: 'number',
        value: function number() {
            var result = this.digit();

            if (this.current === '.') {
                this.advance(); // Skip dot sign.
                result = result + '.' + this.digit();
            } else if (this.current === ':') {
                this.advance(); // Skip colon sign.
                result = result + ':' + this.digit();

                return new _Token2.default(_Constants.TOKENS.RANGE, result);
            }
            result = parseFloat(result);

            return new _Token2.default(_Constants.TOKENS.NUMBER, result);
        }

        /**
         * Returns a identifier, that can be a Function name, cell reference or range.
         * @return {string} An Identifier.
         */

    }, {
        key: 'name',
        value: function name() {
            var result = '';

            while (!this.end && this.isIdentifier()) {
                result += this.current;
                this.advance();
            }

            return result.toUpperCase();
        }

        /**
         * Returns a identifier or range token.
         * @return {Token} An ID or RANGE token.
         */

    }, {
        key: 'identifier',
        value: function identifier() {
            var result = this.name();
            var isBoolean = result === 'TRUE' || result === 'FALSE';

            // Checks if its not a function, e.g. TRUE() or FALSE().
            if (isBoolean) {
                this.skipWhitespace();
                if (this.current !== '(') {
                    return new _Token2.default(_Constants.TOKENS.BOOLEAN, result === 'TRUE');
                }
            }

            // Checks if it's a Range
            if (this.current === ':') {
                // Skip the colon mark.
                this.advance();

                var first = result;
                var last = this.name();

                result = first + ':' + last;

                return new _Token2.default(_Constants.TOKENS.RANGE, result);
            }

            // Checks if it's a Sheet
            if (this.current === '!') {
                // Skip the exclamation mark.
                this.advance();

                return new _Token2.default(_Constants.TOKENS.SHEET, result);
            }

            return new _Token2.default(_Constants.TOKENS.ID, result);
        }

        /**
         * Returns a string.
         * @param {string} [end] - the End character.
         * @return {string} The whole string.
         */

    }, {
        key: 'literal',
        value: function literal() {
            var end = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DOUBLE_QUOTE;

            var result = '';

            // Skip the first quote sign.
            this.advance();
            while (!this.end && this.current !== end) {
                result += this.current;
                this.advance();
            }

            // Skip the last quote sign.
            this.advance();

            return String(result);
        }

        /**
         * Returns a string
         * @return {Token} A String token.
         */

    }, {
        key: 'string',
        value: function string() {
            var result = this.literal(DOUBLE_QUOTE);

            return new _Token2.default(_Constants.TOKENS.STRING, result);
        }

        /**
         * Returns a sheet token.
         * @throws Will throw an error if it's an empty sheet.
         * @return {Token} A ID token.
         */

    }, {
        key: 'sheet',
        value: function sheet() {
            var result = this.literal(SINGLE_QUOTE).trim().toUpperCase();

            if (!result.length) {
                throw new Error('Empty sheet name');
            }

            // Skip exclamation point.
            this.advance();

            return new _Token2.default(_Constants.TOKENS.SHEET, result);
        }

        /**
         * Returns a Error string.
         * @throws Will throw an error if it's not a valid Error.
         * @return {Token} A Error token.
         */

    }, {
        key: 'error',
        value: function error() {
            var finalChars = [EXCLAMATION_MARK, QUESTION_MARK, SLASH];
            var result = '';

            while (!this.end && !finalChars.includes(this.current)) {
                result += this.current;
                this.advance();
            }

            var isSlash = this.current === SLASH;

            result += this.current;
            this.advance();

            if (isSlash) {
                switch (this.current) {
                    // #DIV/0!
                    case '0':
                        result += this.current;
                        this.advance();
                        result += this.current;
                        this.advance();
                        break;

                    // #N/A
                    case 'a':
                    case 'A':
                        result += this.current;
                        this.advance();
                        break;
                }
            }

            result = result.toUpperCase();
            for (var key in _Constants.ERRORS) {
                if (_Constants.ERRORS[key] === result) {
                    return new _Token2.default(_Constants.TOKENS.ERROR, result);
                }
            }

            return result;
        }

        /**
         * Returns a operator
         * @return {Token} A String token.
         */

    }, {
        key: 'operator',
        value: function operator() {
            var result = this.current;
            var next = this.advance();

            if (result === '<' && next === '=') {
                result += this.current;
                this.advance();
            } else if (result === '>' && next === '=') {
                result += this.current;
                this.advance();
            } else if (result === '<' && next === '>') {
                result += this.current;
                this.advance();
            }

            return new _Token2.default(_Constants.OPERATORS[result], result);
        }

        /**
         * Return the next token and reset pointer.
         * @return {Token} A Token.
         */

    }, {
        key: 'peek',
        value: function peek() {
            var oldPointer = this.pointer;
            var token = this.next();

            this.pointer = oldPointer;

            return token;
        }

        /**
         * Return the next token for a formula
         * @throws Will throw an error if is a invalid character.
         * @return {Token} A Token.
         */

    }, {
        key: '_nextToken',
        value: function _nextToken() {
            // If it's the first character, skip it.
            if (this.pointer === 0) {
                this.advance();

                return new _Token2.default(_Constants.TOKENS.EQ, START_CHAR);
            }

            while (!this.end) {
                // While is Whitespace, skip.
                if (this.isWhitespace()) {
                    this.skipWhitespace();
                }

                // Get numbers
                if (this.isDigit()) {
                    return this.number();
                }

                // Get identifier
                if (this.isAlpha() || this.current === DOLLAR_SIGN) {
                    return this.identifier();
                }

                // Get Strings
                if (this.current === DOUBLE_QUOTE) {
                    return this.string();
                }

                // Get Sheets
                if (this.current === SINGLE_QUOTE) {
                    return this.sheet();
                }

                // Get Error
                if (this.current === HASH_SIGN) {
                    return this.error();
                }

                // Get Operators
                if (this.current in _Constants.OPERATORS) {
                    return this.operator();
                }

                throw new SyntaxError('Invalid character "' + this.current + '"');
            }

            return new _Token2.default(_Constants.TOKENS.EOL);
        }

        /**
         * Return the next token
         * @return {Token} A Token.
         */

    }, {
        key: 'next',
        value: function next() {
            // Check if starts with "=".
            if (this.start === START_CHAR) {
                return this._nextToken();
            }

            // Return a String, Number or Boolean
            return this.constant();
        }
    }]);

    return Lexer;
}(_Characters3.default);

Lexer.displayName = 'Lexer';
exports.default = Lexer;

},{"./../Constants":363,"./Characters":365,"./Token":373}],369:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Node visitor is a walker for the abstract sysntax tree.
 */
var NodeVisitor = function () {
    function NodeVisitor() {
        _classCallCheck(this, NodeVisitor);
    }

    _createClass(NodeVisitor, [{
        key: "visit",

        /**
         * Visit all nodes of a tree.
         * @param {AST} [node] - The tree or node.
         * @return {*} The result of visiting all nodes.
         */
        value: function visit(node) {
            var methodName = void 0;
            var visitor = void 0;

            if (node) {
                methodName = "visit" + node.constructor.displayName;
                visitor = this[methodName];
            }

            if (!visitor) {
                throw new Error("No " + methodName + " method");
            }

            return visitor.call(this, node);
        }
    }]);

    return NodeVisitor;
}();

NodeVisitor.displayName = "NodeVisitor";
exports.default = NodeVisitor;

},{}],370:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('./../Constants');

var _ast = require('./ast');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Syntax analyzer
 *
 * @example <caption>Grammar:</caption>
 *
 * start : constant
 *       | '=' expr
 *       ;
 *
 * expr : relExp ((EQ | NE) relExp)* ;
 *
 * relExp : addExp ((LT | LE | GT | GE) addExp)* ;
 *
 * addExp : mulExp ((PLUS | MINUS | CONCAT) mulExp)* ;
 *
 * mulExp : term ((MULT | DIV | EXP) term)* ;
 *
 * term : (PLUS | MINUS) factor (PERCENT)? ;
 *
 * factor : constant
 *        | formula
 *        | '{' arraycolumns '}'
 *        | '(' expr ')'
 *        ;
 *
 * arraycolumns : arrayrows
 *              | arrayrows ';' arraycolumns
 *              ;
 *
 * arrayrows : expr
 *           | expr ',' arrayrows
 *           ;
 *
 * formula : (SHEET)? reference ;
 *
 * reference : ID ('(' parameters ')')?
 *           | RANGE
 *           ;
 *
 * parameters : expr (',' expr)
 *            | empty
 *            ;
 *
 * constant : NUMBER
 *          | STRING
 *          | BOOL
 *          | ERROR
 *          ;
 */
var Parser = function () {
    /**
     * Creates a Parser.
     * @param {Lexer} lexer - Lexical analyzer object.
     */
    function Parser() {
        var lexer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        _classCallCheck(this, Parser);

        this.lexer = lexer;
    }

    /**
     * Start rule.
     *
     * @example <caption>Grammar:</caption>
     *
     *  start : constant
     *        | '=' expr
     *        ;
     *
     * @return {AST} Abstract Syntax tree.
     */


    _createClass(Parser, [{
        key: 'start',
        value: function start() {
            if (this.lookahead.type === _Constants.TOKENS.EQ) {
                this.match(_Constants.TOKENS.EQ);

                return this.expr();
            }

            return this.constant();
        }

        /**
         * Expression rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * expr : relExp ((EQ | NE) relExp)* ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'expr',
        value: function expr() {
            var node = this.relExp();

            while ([_Constants.TOKENS.EQ, _Constants.TOKENS.NE].includes(this.lookahead.type)) {
                var token = this.lookahead;

                this.match(token.type);
                node = new _ast.BinOp(node, token, this.relExp());
            }

            return node;
        }

        /**
         * Relational operators rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * relExp : addExp ((LT | LE | GT | GE) addExp)* ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'relExp',
        value: function relExp() {
            var node = this.addExp();

            while ([_Constants.TOKENS.LT, _Constants.TOKENS.LE, _Constants.TOKENS.GT, _Constants.TOKENS.GE].includes(this.lookahead.type)) {
                var token = this.lookahead;

                this.match(token.type);
                node = new _ast.BinOp(node, token, this.addExp());
            }

            return node;
        }

        /**
         * Addition and subtraction Expression rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * addExp : mulExp ((PLUS | MINUS | CONCAT) mulExp)* ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'addExp',
        value: function addExp() {
            var node = this.mulExp();

            while ([_Constants.TOKENS.PLUS, _Constants.TOKENS.MINUS, _Constants.TOKENS.CONCAT].includes(this.lookahead.type)) {
                var token = this.lookahead;

                this.match(token.type);
                node = new _ast.BinOp(node, token, this.mulExp());
            }

            return node;
        }

        /**
         * Multiplication, division and Pow rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * mulExp : term ((MULT | DIV | EXP) term)* ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'mulExp',
        value: function mulExp() {
            var node = this.term();

            while ([_Constants.TOKENS.MULT, _Constants.TOKENS.DIV, _Constants.TOKENS.POW].includes(this.lookahead.type)) {
                var token = this.lookahead;

                this.match(token.type);
                node = new _ast.BinOp(node, token, this.term());
            }

            return node;
        }

        /**
         * Term rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * term : (PLUS | MINUS) factor (PERCENT)? ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'term',
        value: function term() {
            var unary = null;
            var postfix = null;

            if ([_Constants.TOKENS.PLUS, _Constants.TOKENS.MINUS].includes(this.lookahead.type)) {
                unary = this.lookahead;
                this.match(this.lookahead.type);
            }

            var node = this.factor();

            if (this.lookahead.type === _Constants.TOKENS.PERCENT) {
                postfix = this.lookahead;
                this.match(_Constants.TOKENS.PERCENT);
            }

            if (unary !== null) {
                if (postfix !== null) {
                    return new _ast.PostfixOp(postfix, new _ast.UnaryOp(unary, node));
                }

                return new _ast.UnaryOp(unary, node);
            } else if (postfix !== null) {
                return new _ast.PostfixOp(postfix, node);
            }

            return node;
        }
        /**
         * Factor rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * factor : constant
         *        | formula
         *        | '{' arraycolumns '}'
         *        | '(' expr ')'
         *        ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'factor',
        value: function factor() {
            var constants = [_Constants.TOKENS.NUMBER, _Constants.TOKENS.STRING, _Constants.TOKENS.BOOLEAN, _Constants.TOKENS.ERROR];
            var token = this.lookahead;

            if (token.type === _Constants.TOKENS.LPAREN) {
                this.match(_Constants.TOKENS.LPAREN);

                var node = this.expr();

                this.match(_Constants.TOKENS.RPAREN);

                return node;
            }
            if (token.type === _Constants.TOKENS.LBRACE) {
                this.match(_Constants.TOKENS.LBRACE);

                var items = this.arraycolumns();

                this.match(_Constants.TOKENS.RBRACE);

                return new _ast.ArrayConstant(items);
            } else if (constants.includes(token.type)) {
                return this.constant();
            }

            return this.formula();
        }

        /**
         * Array Columns rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * arraycolumns : arrayrows
         *              | arrayrows ';' arraycolumns
         *              ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'arraycolumns',
        value: function arraycolumns() {
            var columns = [this.arrayrows()];

            while (this.lookahead.type === _Constants.TOKENS.SEMICOLON) {
                this.match(_Constants.TOKENS.SEMICOLON);

                var column = this.arrayrows();

                columns.push(column);
            }

            return columns;
        }

        /**
         * Array Rows rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * arrayrows : expr
         *           | expr ',' arrayrows
         *           ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'arrayrows',
        value: function arrayrows() {
            var rows = [this.expr()];

            while (this.lookahead.type === _Constants.TOKENS.COMMA) {
                this.match(_Constants.TOKENS.COMMA);

                var row = this.expr();

                rows.push(row);
            }

            return rows;
        }

        /**
         * Formula rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * formula : (SHEET)? reference ;
         *
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'formula',
        value: function formula() {
            var token = this.lookahead;
            var name = null;

            if (token.type === _Constants.TOKENS.SHEET) {
                this.match(_Constants.TOKENS.SHEET);
                name = token.value;
            }

            return this.reference(name);
        }

        /**
         * Reference rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * reference : ID ('(' parameters ')')?
         *           | RANGE
         *           ;
         *
         * @param {string} [sheet] - Sheet name
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'reference',
        value: function reference() {
            var sheet = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var token = this.lookahead;

            if (this.nextToken().type === _Constants.TOKENS.LPAREN) {
                this.match(_Constants.TOKENS.ID);
                this.match(_Constants.TOKENS.LPAREN);

                var params = this.parameters();

                this.match(_Constants.TOKENS.RPAREN);

                return new _ast.FunctionCall(token.value, params);
            } else if (token.type === _Constants.TOKENS.RANGE) {
                this.match(_Constants.TOKENS.RANGE);

                return new _ast.RangeReference(token, sheet);
            }

            this.match(_Constants.TOKENS.ID);

            return new _ast.CellIdentifier(token.value, sheet);
        }

        /**
         * Parameters rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * parameters : expr (',' expr)
         *            | empty
         *            ;
         *
         * @todo   Should accept empty parameters like "=COUNT(,,,,)".
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'parameters',
        value: function parameters() {
            var params = [];

            while (this.lookahead.type !== _Constants.TOKENS.RPAREN && this.lookahead.type !== _Constants.TOKENS.EOL) {
                var param = this.expr();

                params.push(param);

                if (this.lookahead.type === _Constants.TOKENS.COMMA) {
                    this.match(_Constants.TOKENS.COMMA);
                }
            }

            return params;
        }

        /**
         * Constant rule.
         *
         * @example <caption>Grammar:</caption>
         *
         * constant : NUMBER
         *          | STRING
         *          | BOOL
         *
         * @throws Will throw an error if it's not a constant.
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'constant',
        value: function constant() {
            var token = this.lookahead;
            var node = void 0;

            if (token.type === _Constants.TOKENS.NUMBER) {
                this.match(_Constants.TOKENS.NUMBER);
                node = new _ast.NumberConstant(token.value);
            } else if (token.type === _Constants.TOKENS.STRING) {
                this.match(_Constants.TOKENS.STRING);
                node = new _ast.StringConstant(token.value);
            } else if (token.type === _Constants.TOKENS.BOOLEAN) {
                this.match(_Constants.TOKENS.BOOLEAN);
                node = new _ast.BooleanConstant(token.value);
            } else if (token.type === _Constants.TOKENS.ERROR) {
                this.match(_Constants.TOKENS.ERROR);
                node = new _ast.ErrorConstant(token.value);
            }

            return node;
        }

        /**
         * Get the next token
         * @return {Token} Next token
         */

    }, {
        key: 'nextToken',
        value: function nextToken() {
            return this.lexer.peek();
        }

        /**
         * Match the current token and move to the next.
         * @param {string} tokenType - Token type.
         * @throws Will throw an error if is a invalid token.
         */

    }, {
        key: 'match',
        value: function match(tokenType) {
            if (this.lookahead.type === tokenType) {
                this.lookahead = this.lexer.next();
            } else {
                throw new SyntaxError('Invalid syntax. Expecting "' + tokenType + '"');
            }
        }

        /**
         * Parse a list of tokens.
         * @throws Will throw an error if is a invalid token.
         * @return {AST} Abstract Syntax tree.
         */

    }, {
        key: 'parse',
        value: function parse() {
            if (this.lookahead === null) {
                return null;
            }

            var node = this.start();

            if (this.lookahead.type !== _Constants.TOKENS.EOL) {
                throw new SyntaxError('Invalid syntax. Expecting end of line.');
            }

            return node;
        }

        /**
         * Set a new Lexer.
         * @param {Lexer} value - Lexical analyzer object.
         */

    }, {
        key: 'lexer',
        set: function set(value) {
            this._lexer = value;
            if (this._lexer) {
                this.lookahead = this._lexer.next();
            } else {
                this.lookahead = null;
            }
        },
        get: function get() // eslint-disable-line require-jsdoc
        {
            return this._lexer;
        }
    }]);

    return Parser;
}();

Parser.displayName = 'Parser';
exports.default = Parser;

},{"./../Constants":363,"./ast":386}],371:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Position object.
 */
var Position =
/**
 * Cell Position
 * @param {number} column - Cell column.
 * @param {number} row - Cell row.
 */
function Position() {
  var column = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var row = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  _classCallCheck(this, Position);

  this.column = column;
  this.row = row;
};

Position.displayName = "Position";
exports.default = Position;

},{}],372:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Range object.
 */
var Range = function () {
    /**
    * Creates a Range.
    * @param {Position} first - First position.
    * @param {Position} last - Last position.
    */
    function Range(first, last) {
        _classCallCheck(this, Range);

        this.first = first;
        this.last = last;
    }

    /**
     * Returns correct range, even if last column or row is smaller than first.
     * @return {Range} Correct range.
     */


    _createClass(Range, [{
        key: "correct",
        value: function correct() {
            var first = this.first;
            var last = this.last;

            if (first.column > last.column) {
                var oldCol = first.column;

                first.column = last.column;
                last.column = oldCol;
            }

            if (first.row > last.row) {
                var oldRow = first.row;

                first.row = last.row;
                last.row = oldRow;
            }

            return new Range(first, last);
        }
    }]);

    return Range;
}();

Range.displayName = "Range";
exports.default = Range;

},{}],373:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A Lexical token.
 */
var Token =
/**
* Creates a Token.
* @param {string} type - Token Type.
* @param {string} value - Token value.
*/
function Token(type) {
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Token);

    this.type = type;
    this.value = value;
};

Token.displayName = "Token";
exports.default = Token;

},{}],374:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Abstract Syntax Tree node
 */
var AST = function AST() {
  _classCallCheck(this, AST);
};

AST.displayName = "AST";
exports.default = AST;

},{}],375:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * ArrayConstant represents an array.
 *
 * @extends AST
 */
var ArrayConstant = function (_AST) {
  _inherits(ArrayConstant, _AST);

  /**
   * Create a Array constant.
   * @param {array} value - List of items.
   */
  function ArrayConstant(value) {
    _classCallCheck(this, ArrayConstant);

    var _this = _possibleConstructorReturn(this, (ArrayConstant.__proto__ || Object.getPrototypeOf(ArrayConstant)).call(this));

    _this.value = value;
    return _this;
  }

  return ArrayConstant;
}(_AST3.default);

ArrayConstant.displayName = 'ArrayConstant';
exports.default = ArrayConstant;

},{"./AST":374}],376:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Binary Operator. A binary operator is an operator that operates on two operands.
 *
 * @extends AST
 */
var BinOp = function (_AST) {
  _inherits(BinOp, _AST);

  /**
   * Create a Binary Operator.
   * @param {string} left - Left operand.
   * @param {Token} op - Operator.
   * @param {string} right - Right operand.
   */
  function BinOp(left, op, right) {
    _classCallCheck(this, BinOp);

    var _this = _possibleConstructorReturn(this, (BinOp.__proto__ || Object.getPrototypeOf(BinOp)).call(this));

    _this.left = left;
    _this.token = _this.op = op;
    _this.right = right;
    return _this;
  }

  return BinOp;
}(_AST3.default);

BinOp.displayName = 'BinOp';
exports.default = BinOp;

},{"./AST":374}],377:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * BooleanConstant represents Booleans.
 *
 * @extends AST
 */
var BooleanConstant = function (_AST) {
  _inherits(BooleanConstant, _AST);

  /**
   * Create a Boolean constant.
   * @param {boolean} value - Boolean.
   */
  function BooleanConstant(value) {
    _classCallCheck(this, BooleanConstant);

    var _this = _possibleConstructorReturn(this, (BooleanConstant.__proto__ || Object.getPrototypeOf(BooleanConstant)).call(this));

    _this.value = value;
    return _this;
  }

  return BooleanConstant;
}(_AST3.default);

BooleanConstant.displayName = 'BooleanConstant';
exports.default = BooleanConstant;

},{"./AST":374}],378:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

var _Position = require('./../Position');

var _Position2 = _interopRequireDefault(_Position);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Cell identifier.
 *
 * @extends AST
 */
var CellIdentifier = function (_AST) {
    _inherits(CellIdentifier, _AST);

    /**
     * Create a Cell identifier object.
     * @param {string} [name] - Function name.
     * @param {string} [sheet] - Sheet name.
     */
    function CellIdentifier(name) {
        var sheet = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, CellIdentifier);

        var _this = _possibleConstructorReturn(this, (CellIdentifier.__proto__ || Object.getPrototypeOf(CellIdentifier)).call(this));

        _this.name = name;
        _this.sheet = sheet;
        return _this;
    }

    /**
     * Get cell name (without dollar sign).
     * @return {string} Cell name.
     */


    _createClass(CellIdentifier, [{
        key: 'clean',
        value: function clean() {
            return this.name.toUpperCase().replace(/\$/g, '');
        }

        /**
         * Get cell column and row numbers.
         * @return {Position} Cell position.
         */

    }, {
        key: 'position',
        value: function position() {
            var ref = this.clean();
            var columnString = ref.replace(/[^a-z]/gi, '');
            var column = CellIdentifier.toDecimal(columnString);
            var rowString = ref.replace(/[^0-9]/g, '');
            var row = parseInt(rowString, 10);

            return new _Position2.default(column, row);
        }

        /**
         * From Column string to number. Example: AA => 27
         * Based on: https://stackoverflow.com/questions/12699030/implement-numbering-scheme-like-a-b-c-aa-ab-aaa-similar-to-converting-a-num
         * @param {string} str - Column string
         * @return {number} Column number
         */

    }], [{
        key: 'toDecimal',
        value: function toDecimal(str) {
            var decimal = 0;
            var letters = str.toUpperCase().split(new RegExp());

            for (var i = letters.length - 1; i >= 0; i--) {
                decimal += (letters[i].charCodeAt(0) - 64) * Math.pow(26, letters.length - (i + 1));
            }

            return decimal;
        }

        /**
         * From Column number to string. Example: 27 => AA
         * Based on: https://stackoverflow.com/questions/12699030/implement-numbering-scheme-like-a-b-c-aa-ab-aaa-similar-to-converting-a-num
         * @param {number} value - Column number
         * @return {string} Column string
         */

    }, {
        key: 'toLetters',
        value: function toLetters(value) {
            var digits = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            var result = [];

            value = value - 1;
            if (value === 0) {
                return digits[0];
            }

            while (value >= 0) {
                result.unshift(digits[value % 26]);
                value = Math.floor(value / 26) - 1;
            }

            return result.join('');
        }
    }]);

    return CellIdentifier;
}(_AST3.default);

CellIdentifier.displayName = 'CellIdentifier';
exports.default = CellIdentifier;

},{"./../Position":371,"./AST":374}],379:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * ErrorConstant represents Error references.
 *
 * @extends AST
 */
var ErrorConstant = function (_AST) {
  _inherits(ErrorConstant, _AST);

  /**
   * Create a Error constant.
   * @param {string} [value] - Error description.
   */
  function ErrorConstant(value) {
    _classCallCheck(this, ErrorConstant);

    var _this = _possibleConstructorReturn(this, (ErrorConstant.__proto__ || Object.getPrototypeOf(ErrorConstant)).call(this));

    _this.value = value;
    return _this;
  }

  return ErrorConstant;
}(_AST3.default);

ErrorConstant.displayName = 'ErrorConstant';
exports.default = ErrorConstant;

},{"./AST":374}],380:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Function call.
 *
 * @extends AST
 */
var FunctionCall = function (_AST) {
  _inherits(FunctionCall, _AST);

  /**
   * Create a Function call object.
   * @param {string} [name] - Function name.
   * @param {array} [params] - Function parameters.
   */
  function FunctionCall(name, params) {
    _classCallCheck(this, FunctionCall);

    var _this = _possibleConstructorReturn(this, (FunctionCall.__proto__ || Object.getPrototypeOf(FunctionCall)).call(this));

    _this.name = name;
    _this.params = params;
    return _this;
  }

  return FunctionCall;
}(_AST3.default);

FunctionCall.displayName = 'FunctionCall';
exports.default = FunctionCall;

},{"./AST":374}],381:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * NumberConstant represents Numbers.
 *
 * @extends AST
 */
var NumberConstant = function (_AST) {
  _inherits(NumberConstant, _AST);

  /**
   * Create a Number constant.
   * @param {number} value - Integer or float value.
   */
  function NumberConstant(value) {
    _classCallCheck(this, NumberConstant);

    var _this = _possibleConstructorReturn(this, (NumberConstant.__proto__ || Object.getPrototypeOf(NumberConstant)).call(this));

    _this.value = value;
    return _this;
  }

  return NumberConstant;
}(_AST3.default);

NumberConstant.displayName = 'NumberConstant';
exports.default = NumberConstant;

},{"./AST":374}],382:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * An AST node class to represent postfix operators
 *
 * @extends AST
 */
var PostfixOp = function (_AST) {
  _inherits(PostfixOp, _AST);

  /**
   * Create a Postfix Operator.
   * @param {Token} op - Operator.
   * @param {AST} expr - Expression.
   */
  function PostfixOp(op, expr) {
    _classCallCheck(this, PostfixOp);

    var _this = _possibleConstructorReturn(this, (PostfixOp.__proto__ || Object.getPrototypeOf(PostfixOp)).call(this));

    _this.token = _this.op = op;
    _this.expr = expr;
    return _this;
  }

  return PostfixOp;
}(_AST3.default);

PostfixOp.displayName = 'PostfixOp';
exports.default = PostfixOp;

},{"./AST":374}],383:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

var _CellIdentifier = require('./CellIdentifier');

var _CellIdentifier2 = _interopRequireDefault(_CellIdentifier);

var _Range = require('./../Range');

var _Range2 = _interopRequireDefault(_Range);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Range reference.
 *
 * @extends AST
 */
var RangeReference = function (_AST) {
    _inherits(RangeReference, _AST);

    /**
     * Create a Cell identifier object.
     * @param {Token} [token] - Range token.
     * @param {string} [sheet] - Sheet name.
     */
    function RangeReference(token) {
        var sheet = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, RangeReference);

        var _this = _possibleConstructorReturn(this, (RangeReference.__proto__ || Object.getPrototypeOf(RangeReference)).call(this));

        _this.token = token;
        _this.rangeValue = token.value;
        _this.sheet = sheet;
        return _this;
    }

    /**
     * Get Range pair
     * @return {array} Two CellIdentifier
     */


    _createClass(RangeReference, [{
        key: 'pair',
        value: function pair() {
            var pairs = this.rangeValue.split(':');

            return [new _CellIdentifier2.default(pairs[0]), new _CellIdentifier2.default(pairs[1])];
        }

        /**
         * Get range information
         * @return {Range} Range object
         */

    }, {
        key: 'range',
        value: function range() {
            var pairs = this.pair();

            return new _Range2.default(pairs[0].position(), pairs[1].position());
        }
    }]);

    return RangeReference;
}(_AST3.default);

RangeReference.displayName = 'RangeReference';
exports.default = RangeReference;

},{"./../Range":372,"./AST":374,"./CellIdentifier":378}],384:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * StringConstant represents Strings.
 *
 * @extends AST
 */
var StringConstant = function (_AST) {
  _inherits(StringConstant, _AST);

  /**
   * Create a String constant.
   * @param {string} value - String.
   */
  function StringConstant(value) {
    _classCallCheck(this, StringConstant);

    var _this = _possibleConstructorReturn(this, (StringConstant.__proto__ || Object.getPrototypeOf(StringConstant)).call(this));

    _this.value = value;
    return _this;
  }

  return StringConstant;
}(_AST3.default);

StringConstant.displayName = 'StringConstant';
exports.default = StringConstant;

},{"./AST":374}],385:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AST2 = require('./AST');

var _AST3 = _interopRequireDefault(_AST2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * An AST node class to represent unary operators
 *
 * @extends AST
 */
var UnaryOp = function (_AST) {
  _inherits(UnaryOp, _AST);

  /**
   * Create a Unary Operator.
   * @param {Token} op - Operator.
   * @param {AST} expr - Expression.
   */
  function UnaryOp(op, expr) {
    _classCallCheck(this, UnaryOp);

    var _this = _possibleConstructorReturn(this, (UnaryOp.__proto__ || Object.getPrototypeOf(UnaryOp)).call(this));

    _this.token = _this.op = op;
    _this.expr = expr;
    return _this;
  }

  return UnaryOp;
}(_AST3.default);

UnaryOp.displayName = 'UnaryOp';
exports.default = UnaryOp;

},{"./AST":374}],386:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ErrorConstant = exports.BooleanConstant = exports.StringConstant = exports.NumberConstant = exports.ArrayConstant = exports.PostfixOp = exports.UnaryOp = exports.BinOp = exports.RangeReference = exports.CellIdentifier = exports.FunctionCall = exports.AST = undefined;

var _AST = require('./AST');

var _AST2 = _interopRequireDefault(_AST);

var _FunctionCall = require('./FunctionCall');

var _FunctionCall2 = _interopRequireDefault(_FunctionCall);

var _CellIdentifier = require('./CellIdentifier');

var _CellIdentifier2 = _interopRequireDefault(_CellIdentifier);

var _RangeReference = require('./RangeReference');

var _RangeReference2 = _interopRequireDefault(_RangeReference);

var _BinOp = require('./BinOp');

var _BinOp2 = _interopRequireDefault(_BinOp);

var _UnaryOp = require('./UnaryOp');

var _UnaryOp2 = _interopRequireDefault(_UnaryOp);

var _PostfixOp = require('./PostfixOp');

var _PostfixOp2 = _interopRequireDefault(_PostfixOp);

var _ArrayConstant = require('./ArrayConstant');

var _ArrayConstant2 = _interopRequireDefault(_ArrayConstant);

var _NumberConstant = require('./NumberConstant');

var _NumberConstant2 = _interopRequireDefault(_NumberConstant);

var _StringConstant = require('./StringConstant');

var _StringConstant2 = _interopRequireDefault(_StringConstant);

var _BooleanConstant = require('./BooleanConstant');

var _BooleanConstant2 = _interopRequireDefault(_BooleanConstant);

var _ErrorConstant = require('./ErrorConstant');

var _ErrorConstant2 = _interopRequireDefault(_ErrorConstant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.AST = _AST2.default;
exports.FunctionCall = _FunctionCall2.default;
exports.CellIdentifier = _CellIdentifier2.default;
exports.RangeReference = _RangeReference2.default;
exports.BinOp = _BinOp2.default;
exports.UnaryOp = _UnaryOp2.default;
exports.PostfixOp = _PostfixOp2.default;
exports.ArrayConstant = _ArrayConstant2.default;
exports.NumberConstant = _NumberConstant2.default;
exports.StringConstant = _StringConstant2.default;
exports.BooleanConstant = _BooleanConstant2.default;
exports.ErrorConstant = _ErrorConstant2.default;

},{"./AST":374,"./ArrayConstant":375,"./BinOp":376,"./BooleanConstant":377,"./CellIdentifier":378,"./ErrorConstant":379,"./FunctionCall":380,"./NumberConstant":381,"./PostfixOp":382,"./RangeReference":383,"./StringConstant":384,"./UnaryOp":385}],387:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DATE_TIME_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var DATE_TIME_FUNCTIONS = {
    DATE: formula.DATE,
    // DATEVALUE: formula.DATEVALUE, // Not working
    DAY: formula.DAY,
    // DAYS: formula.DAYS,
    // DAYS360: formula.DAYS360,
    // EDATE: formula.EDATE,
    // EOMONTH: formula.EOMONTH,
    // HOUR: formula.HOUR, // Not working
    // INTERVAL: formula.INTERVAL,
    // ISOWEEKNUM: formula.ISOWEEKNUM,
    // MINUTE: formula.MINUTE, // Not working
    MONTH: formula.MONTH,
    // NETWORKDAYS: formula.NETWORKDAYS,
    NOW: formula.NOW,
    // SECOND: formula.SECOND, // Not working
    TIME: formula.TIME,
    // TIMEVALUE: formula.TIMEVALUE,
    TODAY: formula.TODAY,
    // WEEKDAY: formula.WEEKDAY,
    // WEEKNUM: formula.WEEKNUM,
    // WORKDAY: formula.WORKDAY,
    YEAR: formula.YEAR
    // YEARFRAC: formula.YEARFRAC,
};

exports.DATE_TIME_FUNCTIONS = DATE_TIME_FUNCTIONS;

},{"formulajs":344}],388:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FUNCTIONS = undefined;

var _dateTime = require('./date-time');

var _information = require('./information');

var _logical = require('./logical');

var _mathTrig = require('./math-trig');

var _miscellaneous = require('./miscellaneous');

var _statistical = require('./statistical');

var _text = require('./text');

/**
 * Default functions
 *
 * @static
 * @constant
 * @type {object}
 */

// import { LOOKUP_REFERENCE_FUNCTIONS } from './lookup-reference';

// import { ENGINEERING_FUNCTIONS } from './engineering';
// import { FINANCIAL_FUNCTIONS } from './financial';
var FUNCTIONS = Object.assign(_dateTime.DATE_TIME_FUNCTIONS,
// DATABASE_FUNCTIONS,
// ENGINEERING_FUNCTIONS,
// FINANCIAL_FUNCTIONS,
_information.INFORMATION_FUNCTIONS, _logical.LOGICAL_FUNCTIONS,
// LOOKUP_REFERENCE_FUNCTIONS,
_mathTrig.MATH_TRIG_FUNCTIONS, _miscellaneous.MISCELLANEOUS_FUNCTIONS, _statistical.STATISTICAL_FUNCTIONS, _text.TEXT_FUNCTIONS); // import { DATABASE_FUNCTIONS } from './database';
exports.FUNCTIONS = FUNCTIONS;

},{"./date-time":387,"./information":389,"./logical":390,"./math-trig":391,"./miscellaneous":392,"./statistical":393,"./text":394}],389:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.INFORMATION_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var INFORMATION_FUNCTIONS = {
    // INFO: formula.INFO,
    // ISBLANK: formula.ISBLANK,
    ISBINARY: formula.ISBINARY,
    // ISERR: formula.ISERR, // How to handle error?
    ISERR: formula.ISERR,
    ISERROR: formula.ISERROR, // @todo test this
    ISEVEN: formula.ISEVEN,
    // ISFORMULA: formula.ISFORMULA, // How to handle formula?
    ISLOGICAL: formula.ISLOGICAL,
    // ISNA: formula.ISNA, // How to handle error?
    ISNONTEXT: formula.ISNONTEXT,
    ISNUMBER: formula.ISNUMBER,
    ISODD: formula.ISODD,
    // ISREF: formula.ISREF, // How to handle reference?
    ISTEXT: formula.ISTEXT,
    N: function N(value) {
        return formula.N.apply(INFORMATION_FUNCTIONS, [value]);
    },
    // NA: formula.NA, // How to handle error?
    // SHEET: formula.SHEET,
    // SHEETS: formula.SHEETS,
    TYPE: function TYPE(value) {
        return formula.TYPE.apply(INFORMATION_FUNCTIONS, [value]);
    }
};

exports.INFORMATION_FUNCTIONS = INFORMATION_FUNCTIONS;

},{"formulajs":344}],390:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.LOGICAL_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var LOGICAL_FUNCTIONS = {
    AND: formula.AND,
    // CHOOSE: formula.CHOOSE,
    FALSE: formula.FALSE,
    IF: formula.IF,
    // IFERROR: formula.IFERROR,
    // IFNA: formula.IFNA,
    NOT: formula.NOT,
    OR: formula.OR,
    TRUE: formula.TRUE
    // XOR: formula.XOR,
    // SWITCH: formula.SWITCH,
};

exports.LOGICAL_FUNCTIONS = LOGICAL_FUNCTIONS;

},{"formulajs":344}],391:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MATH_TRIG_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var MATH_TRIG_FUNCTIONS = {
    ABS: formula.ABS,
    // ACOS: formula.ACOS,
    // ACOSH: formula.ACOSH,
    // ACOT: formula.ACOT,
    // ACOTH: formula.ACOTH,
    // AGGREGATE: formula.AGGREGATE,
    // PRODUCT: formula.PRODUCT,
    SUM: formula.SUM,
    ARABIC: formula.ARABIC,
    // ASIN: formula.ASIN,
    // ASINH: formula.ASINH,
    // ATAN: formula.ATAN,
    // ATAN2: formula.ATAN2,
    // ATANH: formula.ATANH,
    // BASE: formula.BASE,
    // CEILING: formula.CEILING,
    ROUND: formula.ROUND,
    // COMBIN: formula.COMBIN,
    // FACT: formula.FACT,
    // COMBINA: formula.COMBINA,
    // COS: formula.COS,
    // COSH: formula.COSH,
    // COT: formula.COT,
    // COTH: formula.COTH,
    // CSC: formula.CSC,
    // CSCH: formula.CSCH,
    // DECIMAL: formula.DECIMAL,
    // DEGREES: formula.DEGREES,
    // EVEN: formula.EVEN,
    // EXP: formula.EXP,
    // FACTDOUBLE: formula.FACTDOUBLE,
    // FLOOR: formula.FLOOR,
    // GCD: formula.GCD,
    // INT: formula.INT,
    // ISO: formula.ISO,
    // LCM: formula.LCM,
    // LN: formula.LN,
    // LOG: formula.LOG,
    // LOG10: formula.LOG10,
    // MDETERM: formula.MDETERM,
    // MINVERSE: formula.MINVERSE,
    // MMULT: formula.MMULT,
    MOD: formula.MOD,
    // MROUND: formula.MROUND,
    // MULTINOMIAL: formula.MULTINOMIAL,
    // MUNIT: formula.MUNIT,
    // ODD: formula.ODD,
    PI: formula.PI,
    // POWER: formula.POWER,
    // QUOTIENT: formula.QUOTIENT,
    RADIANS: formula.RADIANS,
    RAND: formula.RAND,
    RANDBETWEEN: formula.RANDBETWEEN,
    ROMAN: formula.ROMAN,
    ROUNDDOWN: formula.ROUNDDOWN,
    ROUNDUP: formula.ROUNDUP,
    // SEC: formula.SEC,
    // SECH: formula.SECH,
    // SERIESSUM: formula.SERIESSUM,
    SIGN: formula.SIGN,
    // SIN: formula.SIN,
    // SINH: formula.SINH,
    SQRT: formula.SQRT,
    // SQRTPI: formula.SQRTPI,
    // SUBTOTAL: formula.SUBTOTAL,
    ADD: formula.ADD,
    MINUS: formula.MINUS,
    DIVIDE: formula.DIVIDE,
    MULTIPLY: formula.MULTIPLY,
    GTE: formula.GTE,
    LT: formula.LT,
    LTE: formula.LTE,
    EQ: formula.EQ,
    NE: formula.NE,
    POW: formula.POW,
    // SUMIF: formula.SUMIF,
    // SUMIFS: formula.SUMIFS,
    SUMPRODUCT: formula.SUMPRODUCT,
    SUMSQ: formula.SUMSQ
    // SUMX2MY2: formula.SUMX2MY2,
    // SUMX2PY2: formula.SUMX2PY2,
    // SUMXMY2: formula.SUMXMY2,
    // TAN: formula.TAN,
    // TANH: formula.TANH,
    // TRUNC: formula.TRUNC,
};

exports.MATH_TRIG_FUNCTIONS = MATH_TRIG_FUNCTIONS;

},{"formulajs":344}],392:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MISCELLANEOUS_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

var _utils = require('formulajs/lib/utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var MISCELLANEOUS_FUNCTIONS = {
    UNIQUE: function UNIQUE() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return formula.UNIQUE.apply(null, (0, _utils.flatten)(args));
    }
    // FLATTEN: formula.FLATTEN,
    // ARGS2ARRAY: formula.ARGS2ARRAY,
    // REFERENCE: formula.REFERENCE,
    // JOIN: formula.JOIN,
    // NUMBERS: formula.NUMBERS,
    // NUMERAL: formula.NUMERAL,
};

exports.MISCELLANEOUS_FUNCTIONS = MISCELLANEOUS_FUNCTIONS;

},{"formulajs":344,"formulajs/lib/utils":346}],393:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.STATISTICAL_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

var _utils = require('formulajs/lib/utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var STATISTICAL_FUNCTIONS = {
    AVERAGE: formula.AVERAGE,
    AVERAGEA: formula.AVERAGEA,
    // AVERAGEIF: formula.AVERAGEIF, // Not secure, can pass any JS code as criteria
    // AVERAGEIFS: formula.AVERAGEIFS,
    // COLUMN: formula.COLUMN,
    // COLUMNS: formula.COLUMNS,
    // CORREL: formula.CORREL,
    COUNT: formula.COUNT,
    COUNTA: formula.COUNTA,
    COUNTBLANK: formula.COUNTBLANK,
    COUNTIN: function COUNTIN(range, value) {
        return formula.COUNTIN((0, _utils.flatten)(range), value);
    },
    // COUNTIF: formula.COUNTIF,
    // COUNTIFS: formula.COUNTIFS,
    COUNTUNIQUE: formula.COUNTUNIQUE,
    // DEVSQ: formula.DEVSQ,
    // FISHER: formula.FISHER,
    // FISHERINV: formula.FISHERINV,
    // FORECAST: formula.FORECAST,
    // FREQUENCY: formula.FREQUENCY,
    // GAMMA: formula.GAMMA,
    // GAMMALN: formula.GAMMALN,
    // GAUSS: formula.GAUSS,
    // GEOMEAN: formula.GEOMEAN,
    // GROWTH: formula.GROWTH,
    // HARMEAN: formula.HARMEAN,
    // INTERCEPT: formula.INTERCEPT,
    // KURT: formula.KURT,
    // LARGE: formula.LARGE,
    // LINEST: formula.LINEST,
    // LOGEST: formula.LOGEST,
    MAX: formula.MAX,
    // MAXA: formula.MAXA,
    // MEDIAN: formula.MEDIAN,
    MIN: formula.MIN
    // MINA: formula.MINA,
    // PEARSON: formula.PEARSON,
    // PERMUT: formula.PERMUT,
    // PERMUTATIONA: formula.PERMUTATIONA,
    // PHI: formula.PHI,
    // PROB: formula.PROB,
    // ROW: formula.ROW,
    // ROWS: formula.ROWS,
    // RSQ: formula.RSQ,
    // SKEW: formula.SKEW,
    // SLOPE: formula.SLOPE,
    // SMALL: formula.SMALL,
    // STANDARDIZE: formula.STANDARDIZE,
    // STDEV: formula.STDEV,
    // STDEVA: formula.STDEVA,
    // VARA: formula.VARA,
    // STDEVPA: formula.STDEVPA,
    // VARPA: formula.VARPA,
    // STEYX: formula.STEYX,
    // TRANSPOSE: formula.TRANSPOSE,
    // TREND: formula.TREND,
    // TRIMMEAN: formula.TRIMMEAN,
    // BETADIST: formula.BETADIST,
    // BETAINV: formula.BETAINV,
    // BINOMDIST: formula.BINOMDIST,
    // CEILING: formula.CEILING,
    // ISOCEILING: formula.ISOCEILING,
    // CEILINGMATH: formula.CEILINGMATH,
    // CEILINGPRECISE: formula.CEILINGPRECISE,
    // CHIDIST: formula.CHIDIST,
    // CHIDISTRT: formula.CHIDISTRT,
    // CHIINV: formula.CHIINV,
    // CHIINVRT: formula.CHIINVRT,
    // CHITEST: formula.CHITEST,
    // COVAR: formula.COVAR,
    // COVARIANCEP: formula.COVARIANCEP,
    // COVARIANCES: formula.COVARIANCES,
    // CRITBINOM: formula.CRITBINOM,
    // EXPONDIST: formula.EXPONDIST,
    // ERFCPRECISE: formula.ERFCPRECISE,
    // ERFPRECISE: formula.ERFPRECISE,
    // FDIST: formula.FDIST,
    // FDISTRT: formula.FDISTRT,
    // FINVRT: formula.FINVRT,
    // FINV: formula.FINV,
    // FLOOR: formula.FLOOR,
    // FLOORMATH: formula.FLOORMATH,
    // FLOORPRECISE: formula.FLOORPRECISE,
    // FTEST: formula.FTEST,
    // GAMMADIST: formula.GAMMADIST,
    // GAMMAINV: formula.GAMMAINV,
    // GAMMALNPRECISE: formula.GAMMALNPRECISE,
    // HYPGEOMDIST: formula.HYPGEOMDIST,
    // LOGINV: formula.LOGINV,
    // LOGNORMINV: formula.LOGNORMINV,
    // LOGNORMDIST: formula.LOGNORMDIST,
    // MODEMULT: formula.MODEMULT,
    // MODESNGL: formula.MODESNGL,
    // NEGBINOMDIST: formula.NEGBINOMDIST,
    // NETWORKDAYSINTL: formula.NETWORKDAYSINTL,
    // NORMDIST: formula.NORMDIST,
    // NORMINV: formula.NORMINV,
    // NORMSDIST: formula.NORMSDIST,
    // NORMSINV: formula.NORMSINV,
    // PERCENTILEEXC: formula.PERCENTILEEXC,
    // PERCENTILEINC: formula.PERCENTILEINC,
    // PERCENTRANKEXC: formula.PERCENTRANKEXC,
    // PERCENTRANKINC: formula.PERCENTRANKINC,
    // POISSONDIST: formula.POISSONDIST,
    // QUARTILEEXC: formula.QUARTILEEXC,
    // QUARTILEINC: formula.QUARTILEINC,
    // RANKAVG: formula.RANKAVG,
    // RANKEQ: formula.RANKEQ,
    // SKEWP: formula.SKEWP,
    // STDEVP: formula.STDEVP,
    // STDEVS: formula.STDEVS,
    // TDIST: formula.TDIST,
    // TDISTRT: formula.TDISTRT,
    // TINV: formula.TINV,
    // TTEST: formula.TTEST,
    // VARP: formula.VARP,
    // VARS: formula.VARS,
    // WEIBULLDIST: formula.WEIBULLDIST,
    // WORKDAYINTL: formula.WORKDAYINTL,
    // ZTEST: formula.ZTEST,
};

exports.STATISTICAL_FUNCTIONS = STATISTICAL_FUNCTIONS;

},{"formulajs":344,"formulajs/lib/utils":346}],394:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TEXT_FUNCTIONS = undefined;

var _formulajs = require('formulajs');

var formula = _interopRequireWildcard(_formulajs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TEXT_FUNCTIONS = {
    // ASC: formula.ASC,
    // BAHTTEXT: formula.BAHTTEXT,
    // CHAR: formula.CHAR,
    // CLEAN: formula.CLEAN,
    // CODE: formula.CODE,
    CONCAT: function CONCAT(left, right) {
        return formula.CONCATENATE(left, right);
    },
    CONCATENATE: formula.CONCATENATE,
    // DBCS: formula.DBCS,
    // DOLLAR: formula.DOLLAR,
    // EXACT: formula.EXACT,
    // FIND: formula.FIND,
    // FIXED: formula.FIXED,
    // HTML2TEXT: formula.HTML2TEXT,
    LEFT: formula.LEFT,
    LEN: formula.LEN,
    LOWER: formula.LOWER,
    MID: formula.MID,
    // NUMBERVALUE: formula.NUMBERVALUE,
    // PRONETIC: formula.PRONETIC,
    PROPER: formula.PROPER,
    // REGEXEXTRACT: formula.REGEXEXTRACT,
    // REGEXMATCH: formula.REGEXMATCH,
    // REGEXREPLACE: formula.REGEXREPLACE,
    // REPLACE: formula.REPLACE,
    REPT: formula.REPT,
    RIGHT: formula.RIGHT,
    // SEARCH: formula.SEARCH,
    // SPLIT: formula.SPLIT,
    // SUBSTITUTE: formula.SUBSTITUTE,
    // T: formula.T,
    TEXT: formula.TEXT,
    TRIM: formula.TRIM,
    // UNICHAR: formula.UNICHAR,
    // UNICODE: formula.UNICODE,
    UPPER: formula.UPPER
    // VALUE: formula.VALUE,
};

exports.TEXT_FUNCTIONS = TEXT_FUNCTIONS;

},{"formulajs":344}],395:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Token = require('./Token');

Object.defineProperty(exports, 'Token', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Token).default;
  }
});

var _Characters = require('./Characters');

Object.defineProperty(exports, 'Characters', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Characters).default;
  }
});

var _Lexer = require('./Lexer');

Object.defineProperty(exports, 'Lexer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Lexer).default;
  }
});

var _Parser = require('./Parser');

Object.defineProperty(exports, 'Parser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Parser).default;
  }
});

var _NodeVisitor = require('./NodeVisitor');

Object.defineProperty(exports, 'NodeVisitor', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_NodeVisitor).default;
  }
});

var _Interpreter = require('./Interpreter');

Object.defineProperty(exports, 'Interpreter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Interpreter).default;
  }
});

var _DataGrid = require('./DataGrid');

Object.defineProperty(exports, 'DataGrid', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_DataGrid).default;
  }
});

var _Position = require('./Position');

Object.defineProperty(exports, 'Position', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Position).default;
  }
});

var _Range = require('./Range');

Object.defineProperty(exports, 'Range', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Range).default;
  }
});

var _ast = require('./ast');

Object.keys(_ast).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ast[key];
    }
  });
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./Characters":365,"./DataGrid":366,"./Interpreter":367,"./Lexer":368,"./NodeVisitor":369,"./Parser":370,"./Position":371,"./Range":372,"./Token":373,"./ast":386}]},{},[364])