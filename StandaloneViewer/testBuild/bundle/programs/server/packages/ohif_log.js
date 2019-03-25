(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Log = Package.logging.Log;
var Tracker = Package.deps.Tracker;
var Deps = Package.deps.Deps;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var HTML = Package.htmljs.HTML;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:log":{"main.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/ohif_log/main.js                                                                          //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
let loglevel;
module.watch(require("loglevel"), {
  default(v) {
    loglevel = v;
  }

}, 2);
const defaultLevel = Meteor.isProduction ? 'ERROR' : 'TRACE'; // Create package logger using loglevel

OHIF.log = loglevel.getLogger('OHIF');
OHIF.log.setLevel(defaultLevel); // Add time and timeEnd to OHIF.log namespace

const times = new Map(); // Register the time method

OHIF.log.time = givenKey => {
  const key = typeof givenKey === 'undefined' ? 'default' : givenKey;
  times.set(key, new Date().getTime());
}; // Register the timeEnd method


OHIF.log.timeEnd = givenKey => {
  const key = typeof givenKey === 'undefined' ? 'default' : givenKey;
  const now = new Date().getTime();
  const last = times.get(key) || now;
  times.delete(key);
  const duration = now - last;
  OHIF.log.info(`${key}: ${duration}ms`);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"loglevel":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// node_modules/meteor/ohif_log/node_modules/loglevel/package.json                                    //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
exports.name = "loglevel";
exports.version = "1.4.1";
exports.main = "lib/loglevel";

////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"loglevel.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// node_modules/meteor/ohif_log/node_modules/loglevel/lib/loglevel.js                                 //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:log/main.js");

/* Exports */
Package._define("ohif:log");

})();

//# sourceURL=meteor://💻app/packages/ohif_log.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpsb2cvbWFpbi5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiT0hJRiIsImxvZ2xldmVsIiwiZGVmYXVsdCIsImRlZmF1bHRMZXZlbCIsImlzUHJvZHVjdGlvbiIsImxvZyIsImdldExvZ2dlciIsInNldExldmVsIiwidGltZXMiLCJNYXAiLCJ0aW1lIiwiZ2l2ZW5LZXkiLCJrZXkiLCJzZXQiLCJEYXRlIiwiZ2V0VGltZSIsInRpbWVFbmQiLCJub3ciLCJsYXN0IiwiZ2V0IiwiZGVsZXRlIiwiZHVyYXRpb24iLCJpbmZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0gsU0FBT0ksQ0FBUCxFQUFTO0FBQUNKLGFBQU9JLENBQVA7QUFBUzs7QUFBcEIsQ0FBdEMsRUFBNEQsQ0FBNUQ7QUFBK0QsSUFBSUMsSUFBSjtBQUFTSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDRSxPQUFLRCxDQUFMLEVBQU87QUFBQ0MsV0FBS0QsQ0FBTDtBQUFPOztBQUFoQixDQUF6QyxFQUEyRCxDQUEzRDtBQUE4RCxJQUFJRSxRQUFKO0FBQWFMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxVQUFSLENBQWIsRUFBaUM7QUFBQ0ksVUFBUUgsQ0FBUixFQUFVO0FBQUNFLGVBQVNGLENBQVQ7QUFBVzs7QUFBdkIsQ0FBakMsRUFBMEQsQ0FBMUQ7QUFJOUosTUFBTUksZUFBZVIsT0FBT1MsWUFBUCxHQUFzQixPQUF0QixHQUFnQyxPQUFyRCxDLENBRUE7O0FBQ0FKLEtBQUtLLEdBQUwsR0FBV0osU0FBU0ssU0FBVCxDQUFtQixNQUFuQixDQUFYO0FBQ0FOLEtBQUtLLEdBQUwsQ0FBU0UsUUFBVCxDQUFrQkosWUFBbEIsRSxDQUVBOztBQUNBLE1BQU1LLFFBQVEsSUFBSUMsR0FBSixFQUFkLEMsQ0FFQTs7QUFDQVQsS0FBS0ssR0FBTCxDQUFTSyxJQUFULEdBQWdCQyxZQUFZO0FBQ3hCLFFBQU1DLE1BQU0sT0FBT0QsUUFBUCxLQUFvQixXQUFwQixHQUFrQyxTQUFsQyxHQUE4Q0EsUUFBMUQ7QUFDQUgsUUFBTUssR0FBTixDQUFVRCxHQUFWLEVBQWUsSUFBSUUsSUFBSixHQUFXQyxPQUFYLEVBQWY7QUFDSCxDQUhELEMsQ0FLQTs7O0FBQ0FmLEtBQUtLLEdBQUwsQ0FBU1csT0FBVCxHQUFtQkwsWUFBWTtBQUMzQixRQUFNQyxNQUFNLE9BQU9ELFFBQVAsS0FBb0IsV0FBcEIsR0FBa0MsU0FBbEMsR0FBOENBLFFBQTFEO0FBQ0EsUUFBTU0sTUFBTSxJQUFJSCxJQUFKLEdBQVdDLE9BQVgsRUFBWjtBQUNBLFFBQU1HLE9BQU9WLE1BQU1XLEdBQU4sQ0FBVVAsR0FBVixLQUFrQkssR0FBL0I7QUFDQVQsUUFBTVksTUFBTixDQUFhUixHQUFiO0FBQ0EsUUFBTVMsV0FBV0osTUFBTUMsSUFBdkI7QUFDQWxCLE9BQUtLLEdBQUwsQ0FBU2lCLElBQVQsQ0FBZSxHQUFFVixHQUFJLEtBQUlTLFFBQVMsSUFBbEM7QUFDSCxDQVBELEMiLCJmaWxlIjoiL3BhY2thZ2VzL29oaWZfbG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgbG9nbGV2ZWwgZnJvbSAnbG9nbGV2ZWwnO1xuXG5jb25zdCBkZWZhdWx0TGV2ZWwgPSBNZXRlb3IuaXNQcm9kdWN0aW9uID8gJ0VSUk9SJyA6ICdUUkFDRSc7XG5cbi8vIENyZWF0ZSBwYWNrYWdlIGxvZ2dlciB1c2luZyBsb2dsZXZlbFxuT0hJRi5sb2cgPSBsb2dsZXZlbC5nZXRMb2dnZXIoJ09ISUYnKTtcbk9ISUYubG9nLnNldExldmVsKGRlZmF1bHRMZXZlbCk7XG5cbi8vIEFkZCB0aW1lIGFuZCB0aW1lRW5kIHRvIE9ISUYubG9nIG5hbWVzcGFjZVxuY29uc3QgdGltZXMgPSBuZXcgTWFwKCk7XG5cbi8vIFJlZ2lzdGVyIHRoZSB0aW1lIG1ldGhvZFxuT0hJRi5sb2cudGltZSA9IGdpdmVuS2V5ID0+IHtcbiAgICBjb25zdCBrZXkgPSB0eXBlb2YgZ2l2ZW5LZXkgPT09ICd1bmRlZmluZWQnID8gJ2RlZmF1bHQnIDogZ2l2ZW5LZXk7XG4gICAgdGltZXMuc2V0KGtleSwgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xufTtcblxuLy8gUmVnaXN0ZXIgdGhlIHRpbWVFbmQgbWV0aG9kXG5PSElGLmxvZy50aW1lRW5kID0gZ2l2ZW5LZXkgPT4ge1xuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBnaXZlbktleSA9PT0gJ3VuZGVmaW5lZCcgPyAnZGVmYXVsdCcgOiBnaXZlbktleTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBsYXN0ID0gdGltZXMuZ2V0KGtleSkgfHwgbm93O1xuICAgIHRpbWVzLmRlbGV0ZShrZXkpO1xuICAgIGNvbnN0IGR1cmF0aW9uID0gbm93IC0gbGFzdDtcbiAgICBPSElGLmxvZy5pbmZvKGAke2tleX06ICR7ZHVyYXRpb259bXNgKTtcbn07XG4iXX0=
