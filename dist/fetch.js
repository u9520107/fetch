//detect environment

'use strict';

var _Object$getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  if (window.fetch) {
    module.exports = window.fetch;
  } else {
    var support;
    var methods;

    (function () {
      //polyfill

      var normalizeName = function normalizeName(name) {
        if (typeof name !== 'string') {
          name = String(name);
        }
        if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
          throw new TypeError('Invalid character in header field name');
        }
        return name.toLowerCase();
      };

      var normalizeValue = function normalizeValue(value) {
        if (typeof value !== 'string') {
          value = String(value);
        }
        return value;
      };

      var _Headers = function Headers(headers) {
        this.map = {};

        if (headers instanceof _Headers) {
          headers.forEach(function (value, name) {
            this.append(name, value);
          }, this);
        } else if (headers) {
          _Object$getOwnPropertyNames(headers).forEach(function (name) {
            this.append(name, headers[name]);
          }, this);
        }
      };

      var consumed = function consumed(body) {
        if (body.bodyUsed) {
          return _Promise.reject(new TypeError('Already read'));
        }
        body.bodyUsed = true;
      };

      var fileReaderReady = function fileReaderReady(reader) {
        return new _Promise(function (resolve, reject) {
          reader.onload = function () {
            resolve(reader.result);
          };
          reader.onerror = function () {
            reject(reader.error);
          };
        });
      };

      var readBlobAsArrayBuffer = function readBlobAsArrayBuffer(blob) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        return fileReaderReady(reader);
      };

      var readBlobAsText = function readBlobAsText(blob) {
        var reader = new FileReader();
        reader.readAsText(blob);
        return fileReaderReady(reader);
      };

      var Body = function Body() {
        this.bodyUsed = false;

        this._initBody = function (body) {
          this._bodyInit = body;
          if (typeof body === 'string') {
            this._bodyText = body;
          } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
            this._bodyBlob = body;
          } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
            this._bodyFormData = body;
          } else if (!body) {
            this._bodyText = '';
          } else {
            throw new Error('unsupported BodyInit type');
          }
        };

        if (support.blob) {
          this.blob = function () {
            var rejected = consumed(this);
            if (rejected) {
              return rejected;
            }

            if (this._bodyBlob) {
              return _Promise.resolve(this._bodyBlob);
            } else if (this._bodyFormData) {
              throw new Error('could not read FormData body as blob');
            } else {
              return _Promise.resolve(new Blob([this._bodyText]));
            }
          };

          this.arrayBuffer = function () {
            return this.blob().then(readBlobAsArrayBuffer);
          };

          this.text = function () {
            var rejected = consumed(this);
            if (rejected) {
              return rejected;
            }

            if (this._bodyBlob) {
              return readBlobAsText(this._bodyBlob);
            } else if (this._bodyFormData) {
              throw new Error('could not read FormData body as text');
            } else {
              return _Promise.resolve(this._bodyText);
            }
          };
        } else {
          this.text = function () {
            var rejected = consumed(this);
            return rejected ? rejected : _Promise.resolve(this._bodyText);
          };
        }

        if (support.formData) {
          this.formData = function () {
            return this.text().then(decode);
          };
        }

        this.json = function () {
          return this.text().then(JSON.parse);
        };

        return this;
      }

      // HTTP methods whose capitalization should be normalized
      ;

      var normalizeMethod = function normalizeMethod(method) {
        var upcased = method.toUpperCase();
        return methods.indexOf(upcased) > -1 ? upcased : method;
      };

      var _Request = function Request(input, options) {
        options = options || {};
        var body = options.body;
        if (_Request.prototype.isPrototypeOf(input)) {
          if (input.bodyUsed) {
            throw new TypeError('Already read');
          }
          this.url = input.url;
          this.credentials = input.credentials;
          if (!options.headers) {
            this.headers = new _Headers(input.headers);
          }
          this.method = input.method;
          this.mode = input.mode;
          if (!body) {
            body = input._bodyInit;
            input.bodyUsed = true;
          }
        } else {
          this.url = input;
        }

        this.credentials = options.credentials || this.credentials || 'omit';
        if (options.headers || !this.headers) {
          this.headers = new _Headers(options.headers);
        }
        this.method = normalizeMethod(options.method || this.method || 'GET');
        this.mode = options.mode || this.mode || null;
        this.referrer = null;

        if ((this.method === 'GET' || this.method === 'HEAD') && body) {
          throw new TypeError('Body not allowed for GET or HEAD requests');
        }
        this._initBody(body);
      };

      var decode = function decode(body) {
        var form = new FormData();
        body.trim().split('&').forEach(function (bytes) {
          if (bytes) {
            var split = bytes.split('=');
            var name = split.shift().replace(/\+/g, ' ');
            var value = split.join('=').replace(/\+/g, ' ');
            form.append(decodeURIComponent(name), decodeURIComponent(value));
          }
        });
        return form;
      };

      var headers = function headers(xhr) {
        var head = new _Headers();
        var pairs = xhr.getAllResponseHeaders().trim().split('\n');
        pairs.forEach(function (header) {
          var split = header.trim().split(':');
          var key = split.shift().trim();
          var value = split.join(':').trim();
          head.append(key, value);
        });
        return head;
      };

      var Response = function Response(bodyInit, options) {
        if (!options) {
          options = {};
        }

        this._initBody(bodyInit);
        this.type = 'default';
        this.url = null;
        this.status = options.status;
        this.ok = this.status >= 200 && this.status < 300;
        this.statusText = options.statusText;
        this.headers = options.headers instanceof _Headers ? options.headers : new _Headers(options.headers);
        this.url = options.url || '';
      };

      _Headers.prototype.append = function (name, value) {
        name = normalizeName(name);
        value = normalizeValue(value);
        var list = this.map[name];
        if (!list) {
          list = [];
          this.map[name] = list;
        }
        list.push(value);
      };

      _Headers.prototype['delete'] = function (name) {
        delete this.map[normalizeName(name)];
      };

      _Headers.prototype.get = function (name) {
        var values = this.map[normalizeName(name)];
        return values ? values[0] : null;
      };

      _Headers.prototype.getAll = function (name) {
        return this.map[normalizeName(name)] || [];
      };

      _Headers.prototype.has = function (name) {
        return this.map.hasOwnProperty(normalizeName(name));
      };

      _Headers.prototype.set = function (name, value) {
        this.map[normalizeName(name)] = [normalizeValue(value)];
      };

      _Headers.prototype.forEach = function (callback, thisArg) {
        _Object$getOwnPropertyNames(this.map).forEach(function (name) {
          this.map[name].forEach(function (value) {
            callback.call(thisArg, value, name, this);
          }, this);
        }, this);
      };

      support = {
        blob: 'FileReader' in window && 'Blob' in window && (function () {
          try {
            new Blob();
            return true;
          } catch (e) {
            return false;
          }
        })(),
        formData: 'FormData' in window
      };
      methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

      Body.call(_Request.prototype);

      Body.call(Response.prototype);

      _Headers = _Headers;
      _Request = _Request;
      Response = Response;

      var fetch = function fetch(input, init) {
        var request;
        if (_Request.prototype.isPrototypeOf(input) && !init) {
          request = input;
        } else {
          request = new _Request(input, init);
        }

        return new _Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();

          function responseURL() {
            if ('responseURL' in xhr) {
              return xhr.responseURL;
            }

            // Avoid security warnings on getResponseHeader when not allowed by CORS
            if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
              return xhr.getResponseHeader('X-Request-URL');
            }

            return;
          }

          xhr.onload = function () {
            var status = xhr.status === 1223 ? 204 : xhr.status;
            if (status < 100 || status > 599) {
              reject(new TypeError('Network request failed'));
              return;
            }
            var options = {
              status: status,
              statusText: xhr.statusText,
              headers: headers(xhr),
              url: responseURL()
            };
            var body = 'response' in xhr ? xhr.response : xhr.responseText;
            resolve(new Response(body, options));
          };

          xhr.onerror = function () {
            reject(new TypeError('Network request failed'));
          };

          xhr.open(request.method, request.url, true);

          if (request.credentials === 'include') {
            xhr.withCredentials = true;
          }

          if ('responseType' in xhr && support.blob) {
            xhr.responseType = 'blob';
          }

          request.headers.forEach(function (value, name) {
            xhr.setRequestHeader(name, value);
          });

          xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
        });
      };
      fetch.polyfill = true;
      module.exports = fetch;
    })();
  }
} else {
  //return node fetch
  var _fetch = require('node-fetch');
  module.exports = _fetch;
}