(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
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
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var HTML = Package.htmljs.HTML;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:core":{"main.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/main.js                                                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  OHIF: () => OHIF
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);

/*
 * Defines the base OHIF object
 */
const OHIF = {
  log: {},
  ui: {},
  utils: {},
  viewer: {},
  cornerstone: {},
  user: {},
  DICOMWeb: {} // Temporarily added

}; // Expose the OHIF object to the client if it is on development mode
// @TODO: remove this after applying namespace to this package

if (Meteor.isClient) {
  window.OHIF = OHIF;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"both":{"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/index.js                                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.watch(require("./lib"));
module.watch(require("./utils"));
module.watch(require("./schema.js"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"schema.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/schema.js                                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 0);

/*
 Extend the available options on schema definitions:

  * valuesLabels: Used in conjunction with allowedValues to define the text
    label for each value (used on forms)

  * textOptional: Used to allow empty strings

 */
SimpleSchema.extendOptions({
  valuesLabels: Match.Optional([String]),
  textOptional: Match.Optional(Boolean)
}); // Add default required validation for empty strings which can be bypassed
// using textOptional=true definition

SimpleSchema.addValidator(function () {
  if (this.definition.optional !== true && this.definition.textOptional !== true && this.value === '') {
    return 'required';
  }
}); // Including [label] for some messages

SimpleSchema.messages({
  maxCount: '[label] can not have more than [maxCount] values',
  minCount: '[label] must have at least [minCount] values',
  notAllowed: '[label] has an invalid value: "[value]"'
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/index.js                                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.watch(require("./object.js"));
module.watch(require("./DICOMWeb/"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/object.js                                                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.object = {}; // Transforms a shallow object with keys separated by "." into a nested object

OHIF.object.getNestedObject = shallowObject => {
  const nestedObject = {};

  for (let key in shallowObject) {
    if (!shallowObject.hasOwnProperty(key)) continue;
    const value = shallowObject[key];
    const propertyArray = key.split('.');
    let currentObject = nestedObject;

    while (propertyArray.length) {
      const currentProperty = propertyArray.shift();

      if (!propertyArray.length) {
        currentObject[currentProperty] = value;
      } else {
        if (!currentObject[currentProperty]) {
          currentObject[currentProperty] = {};
        }

        currentObject = currentObject[currentProperty];
      }
    }
  }

  return nestedObject;
}; // Transforms a nested object into a shallowObject merging its keys with "." character


OHIF.object.getShallowObject = nestedObject => {
  const shallowObject = {};

  const putValues = (baseKey, nestedObject, resultObject) => {
    for (let key in nestedObject) {
      if (!nestedObject.hasOwnProperty(key)) continue;
      let currentKey = baseKey ? `${baseKey}.${key}` : key;
      const currentValue = nestedObject[key];

      if (typeof currentValue === 'object') {
        if (currentValue instanceof Array) {
          currentKey += '[]';
        }

        putValues(currentKey, currentValue, resultObject);
      } else {
        resultObject[currentKey] = currentValue;
      }
    }
  };

  putValues('', nestedObject, shallowObject);
  return shallowObject;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"DICOMWeb":{"getAttribute.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getAttribute.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getAttribute
});

function getAttribute(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  }

  return convertToInt(element.Value);
}

;

function convertToInt(input) {
  function padFour(input) {
    var l = input.length;
    if (l == 0) return '0000';
    if (l == 1) return '000' + input;
    if (l == 2) return '00' + input;
    if (l == 3) return '0' + input;
    return input;
  }

  var output = '';

  for (var i = 0; i < input.length; i++) {
    for (var j = 0; j < input[i].length; j++) {
      output += padFour(input[i].charCodeAt(j).toString(16));
    }
  }

  return parseInt(output, 16);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAuthorizationHeader.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getAuthorizationHeader.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getAuthorizationHeader
});
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let btoa;
module.watch(require("isomorphic-base64"), {
  btoa(v) {
    btoa = v;
  }

}, 1);

function getAuthorizationHeader() {
  const headers = {}; // Check for OHIF.user since this can also be run on the server

  const accessToken = OHIF.user && OHIF.user.getAccessToken && OHIF.user.getAccessToken();
  const server = OHIF.servers.getCurrentServer();

  if (server && server.requestOptions && server.requestOptions.auth) {
    // HTTP Basic Auth (user:password)
    headers.Authorization = `Basic ${btoa(server.requestOptions.auth)}`;
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getModalities.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getModalities.js                                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getModalities
});

function getModalities(modality, modalitiesInStudy) {
  var modalities = {};

  if (modality) {
    modalities = modality;
  }

  if (modalitiesInStudy) {
    // Find vr in modalities
    if (modalities.vr && modalities.vr === modalitiesInStudy.vr) {
      for (var i = 0; i < modalitiesInStudy.Value.length; i++) {
        var value = modalitiesInStudy.Value[i];

        if (modalities.Value.indexOf(value) === -1) {
          modalities.Value.push(value);
        }
      }
    } else {
      modalities = modalitiesInStudy;
    }
  }

  return modalities;
}

;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getName.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getName.js                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getName
});

function getName(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  } // Return the Alphabetic component group


  if (element.Value[0].Alphabetic) {
    return element.Value[0].Alphabetic;
  } // Orthanc does not return PN properly so this is a temporary workaround


  return element.Value[0];
}

;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNumber.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getNumber.js                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getNumber
});

function getNumber(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  }

  return parseFloat(element.Value[0]);
}

;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getString.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/getString.js                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => getString
});

function getString(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  } // Join the array together separated by backslash
  // NOTE: Orthanc does not correctly split values into an array so the join is a no-op


  return element.Value.join('\\');
}

;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/lib/DICOMWeb/index.js                                                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let getAttribute;
module.watch(require("./getAttribute.js"), {
  default(v) {
    getAttribute = v;
  }

}, 1);
let getAuthorizationHeader;
module.watch(require("./getAuthorizationHeader.js"), {
  default(v) {
    getAuthorizationHeader = v;
  }

}, 2);
let getModalities;
module.watch(require("./getModalities.js"), {
  default(v) {
    getModalities = v;
  }

}, 3);
let getName;
module.watch(require("./getName.js"), {
  default(v) {
    getName = v;
  }

}, 4);
let getNumber;
module.watch(require("./getNumber.js"), {
  default(v) {
    getNumber = v;
  }

}, 5);
let getString;
module.watch(require("./getString.js"), {
  default(v) {
    getString = v;
  }

}, 6);
const DICOMWeb = {
  getAttribute,
  getAuthorizationHeader,
  getModalities,
  getName,
  getNumber,
  getString
};
OHIF.DICOMWeb = DICOMWeb;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"utils":{"absoluteUrl.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/utils/absoluteUrl.js                                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
const productionMode = true;

if (Meteor.isDevelopment) {
  // Return an absolute URL with the page domain using sub path of ROOT_URL
  // to let multiple domains directed to the same server work
  OHIF.utils.absoluteUrl = function (path) {
    // For local testing.
    let absolutePath = "/";
    const absoluteUrl = Meteor.absoluteUrl();
    const absoluteUrlParts = absoluteUrl.split("/");

    if (absoluteUrlParts.length > 4) {
      const rootUrlPrefixIndex = absoluteUrl.indexOf(absoluteUrlParts[3]);
      absolutePath += absoluteUrl.substring(rootUrlPrefixIndex) + path;
    } else {
      absolutePath += path;
    }

    return absolutePath.replace(/\/\/+/g, "/");
  };
} else {
  // JPETTS -- Override this function in XNAT enviornment in order to display correctly when hosted at an arbitrary subdirectory in XNAT.
  OHIF.utils.absoluteUrl = function (path) {
    let viewerUrl = Session.get("viewerRoot");

    if (path[0] === "/") {
      return `${viewerUrl}${path}`;
    }

    return `${viewerUrl}/${path}`;
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/utils/index.js                                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.watch(require("./absoluteUrl"));
module.watch(require("./objectPath"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"objectPath.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ohif_core/both/utils/objectPath.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);

class ObjectPath {
  /**
   * Set an object property based on "path" (namespace) supplied creating
   * ... intermediary objects if they do not exist.
   * @param object {Object} An object where the properties specified on path should be set.
   * @param path {String} A string representing the property to be set, e.g. "user.study.series.timepoint".
   * @param value {Any} The value of the property that will be set.
   * @return {Boolean} Returns "true" on success, "false" if any intermediate component of the supplied path
   * ... is not a valid Object, in which case the property cannot be set. No excpetions are thrown.
   */
  static set(object, path, value) {
    let components = ObjectPath.getPathComponents(path),
        length = components !== null ? components.length : 0,
        result = false;

    if (length > 0 && ObjectPath.isValidObject(object)) {
      let i = 0,
          last = length - 1,
          currentObject = object;

      while (i < last) {
        let field = components[i];

        if (field in currentObject) {
          if (!ObjectPath.isValidObject(currentObject[field])) {
            break;
          }
        } else {
          currentObject[field] = {};
        }

        currentObject = currentObject[field];
        i++;
      }

      if (i === last) {
        currentObject[components[last]] = value;
        result = true;
      }
    }

    return result;
  }
  /**
   * Get an object property based on "path" (namespace) supplied traversing the object
   * ... tree as necessary.
   * @param object {Object} An object where the properties specified might exist.
   * @param path {String} A string representing the property to be searched for, e.g. "user.study.series.timepoint".
   * @return {Any} The value of the property if found. By default, returns the special type "undefined".
   */


  static get(object, path) {
    let found,
        // undefined by default
    components = ObjectPath.getPathComponents(path),
        length = components !== null ? components.length : 0;

    if (length > 0 && ObjectPath.isValidObject(object)) {
      let i = 0,
          last = length - 1,
          currentObject = object;

      while (i < last) {
        let field = components[i];
        const isValid = ObjectPath.isValidObject(currentObject[field]);

        if (field in currentObject && isValid) {
          currentObject = currentObject[field];
          i++;
        } else {
          break;
        }
      }

      if (i === last && components[last] in currentObject) {
        found = currentObject[components[last]];
      }
    }

    return found;
  }
  /**
   * Check if the supplied argument is a real JavaScript Object instance.
   * @param object {Any} The subject to be tested.
   * @return {Boolean} Returns "true" if the object is a real Object instance and "false" otherwise.
   */


  static isValidObject(object) {
    return typeof object === 'object' && object !== null && object instanceof Object;
  }

  static getPathComponents(path) {
    return typeof path === 'string' ? path.split('.') : null;
  }

}

OHIF.utils.ObjectPath = ObjectPath;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"node_modules":{"isomorphic-base64":{"package.json":function(require,exports){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/ohif_core/node_modules/isomorphic-base64/package.json                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
exports.name = "isomorphic-base64";
exports.version = "1.0.2";
exports.main = "index.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/ohif_core/node_modules/isomorphic-base64/index.js                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ohif:core/main.js");
require("/node_modules/meteor/ohif:core/both/index.js");

/* Exports */
Package._define("ohif:core", exports);

})();

//# sourceURL=meteor://💻app/packages/ohif_core.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL21haW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC9zY2hlbWEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2xpYi9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL29iamVjdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldEF0dHJpYnV0ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldEF1dGhvcml6YXRpb25IZWFkZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2xpYi9ESUNPTVdlYi9nZXRNb2RhbGl0aWVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC9saWIvRElDT01XZWIvZ2V0TmFtZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldE51bWJlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldFN0cmluZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC91dGlscy9hYnNvbHV0ZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvdXRpbHMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL3V0aWxzL29iamVjdFBhdGguanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiT0hJRiIsIk1ldGVvciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJsb2ciLCJ1aSIsInV0aWxzIiwidmlld2VyIiwiY29ybmVyc3RvbmUiLCJ1c2VyIiwiRElDT01XZWIiLCJpc0NsaWVudCIsIndpbmRvdyIsIlNpbXBsZVNjaGVtYSIsImV4dGVuZE9wdGlvbnMiLCJ2YWx1ZXNMYWJlbHMiLCJNYXRjaCIsIk9wdGlvbmFsIiwiU3RyaW5nIiwidGV4dE9wdGlvbmFsIiwiQm9vbGVhbiIsImFkZFZhbGlkYXRvciIsImRlZmluaXRpb24iLCJvcHRpb25hbCIsInZhbHVlIiwibWVzc2FnZXMiLCJtYXhDb3VudCIsIm1pbkNvdW50Iiwibm90QWxsb3dlZCIsIm9iamVjdCIsImdldE5lc3RlZE9iamVjdCIsInNoYWxsb3dPYmplY3QiLCJuZXN0ZWRPYmplY3QiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInByb3BlcnR5QXJyYXkiLCJzcGxpdCIsImN1cnJlbnRPYmplY3QiLCJsZW5ndGgiLCJjdXJyZW50UHJvcGVydHkiLCJzaGlmdCIsImdldFNoYWxsb3dPYmplY3QiLCJwdXRWYWx1ZXMiLCJiYXNlS2V5IiwicmVzdWx0T2JqZWN0IiwiY3VycmVudEtleSIsImN1cnJlbnRWYWx1ZSIsIkFycmF5IiwiZGVmYXVsdCIsImdldEF0dHJpYnV0ZSIsImVsZW1lbnQiLCJkZWZhdWx0VmFsdWUiLCJWYWx1ZSIsImNvbnZlcnRUb0ludCIsImlucHV0IiwicGFkRm91ciIsImwiLCJvdXRwdXQiLCJpIiwiaiIsImNoYXJDb2RlQXQiLCJ0b1N0cmluZyIsInBhcnNlSW50IiwiZ2V0QXV0aG9yaXphdGlvbkhlYWRlciIsImJ0b2EiLCJoZWFkZXJzIiwiYWNjZXNzVG9rZW4iLCJnZXRBY2Nlc3NUb2tlbiIsInNlcnZlciIsInNlcnZlcnMiLCJnZXRDdXJyZW50U2VydmVyIiwicmVxdWVzdE9wdGlvbnMiLCJhdXRoIiwiQXV0aG9yaXphdGlvbiIsImdldE1vZGFsaXRpZXMiLCJtb2RhbGl0eSIsIm1vZGFsaXRpZXNJblN0dWR5IiwibW9kYWxpdGllcyIsInZyIiwiaW5kZXhPZiIsInB1c2giLCJnZXROYW1lIiwiQWxwaGFiZXRpYyIsImdldE51bWJlciIsInBhcnNlRmxvYXQiLCJnZXRTdHJpbmciLCJqb2luIiwicHJvZHVjdGlvbk1vZGUiLCJpc0RldmVsb3BtZW50IiwiYWJzb2x1dGVVcmwiLCJwYXRoIiwiYWJzb2x1dGVQYXRoIiwiYWJzb2x1dGVVcmxQYXJ0cyIsInJvb3RVcmxQcmVmaXhJbmRleCIsInN1YnN0cmluZyIsInJlcGxhY2UiLCJ2aWV3ZXJVcmwiLCJTZXNzaW9uIiwiZ2V0IiwiT2JqZWN0UGF0aCIsInNldCIsImNvbXBvbmVudHMiLCJnZXRQYXRoQ29tcG9uZW50cyIsInJlc3VsdCIsImlzVmFsaWRPYmplY3QiLCJsYXN0IiwiZmllbGQiLCJmb3VuZCIsImlzVmFsaWQiLCJPYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsUUFBSyxNQUFJQTtBQUFWLENBQWQ7QUFBK0IsSUFBSUMsTUFBSjtBQUFXSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNGLFNBQU9HLENBQVAsRUFBUztBQUFDSCxhQUFPRyxDQUFQO0FBQVM7O0FBQXBCLENBQXRDLEVBQTRELENBQTVEOztBQUUxQzs7O0FBSUEsTUFBTUosT0FBTztBQUNUSyxPQUFLLEVBREk7QUFFVEMsTUFBSSxFQUZLO0FBR1RDLFNBQU8sRUFIRTtBQUlUQyxVQUFRLEVBSkM7QUFLVEMsZUFBYSxFQUxKO0FBTVRDLFFBQU0sRUFORztBQU9UQyxZQUFVLEVBUEQsQ0FPSzs7QUFQTCxDQUFiLEMsQ0FVQTtBQUNBOztBQUNBLElBQUlWLE9BQU9XLFFB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ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbi8qXG4gKiBEZWZpbmVzIHRoZSBiYXNlIE9ISUYgb2JqZWN0XG4gKi9cblxuY29uc3QgT0hJRiA9IHtcbiAgICBsb2c6IHt9LFxuICAgIHVpOiB7fSxcbiAgICB1dGlsczoge30sXG4gICAgdmlld2VyOiB7fSxcbiAgICBjb3JuZXJzdG9uZToge30sXG4gICAgdXNlcjoge30sXG4gICAgRElDT01XZWI6IHt9LCAvLyBUZW1wb3JhcmlseSBhZGRlZFxufTtcblxuLy8gRXhwb3NlIHRoZSBPSElGIG9iamVjdCB0byB0aGUgY2xpZW50IGlmIGl0IGlzIG9uIGRldmVsb3BtZW50IG1vZGVcbi8vIEBUT0RPOiByZW1vdmUgdGhpcyBhZnRlciBhcHBseWluZyBuYW1lc3BhY2UgdG8gdGhpcyBwYWNrYWdlXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgd2luZG93Lk9ISUYgPSBPSElGO1xufVxuXG5leHBvcnQgeyBPSElGIH07XG4iLCJpbXBvcnQgJy4vbGliJztcbmltcG9ydCAnLi91dGlscyc7XG5cbmltcG9ydCAnLi9zY2hlbWEuanMnO1xuIiwiaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuLypcbiBFeHRlbmQgdGhlIGF2YWlsYWJsZSBvcHRpb25zIG9uIHNjaGVtYSBkZWZpbml0aW9uczpcblxuICAqIHZhbHVlc0xhYmVsczogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGFsbG93ZWRWYWx1ZXMgdG8gZGVmaW5lIHRoZSB0ZXh0XG4gICAgbGFiZWwgZm9yIGVhY2ggdmFsdWUgKHVzZWQgb24gZm9ybXMpXG5cbiAgKiB0ZXh0T3B0aW9uYWw6IFVzZWQgdG8gYWxsb3cgZW1wdHkgc3RyaW5nc1xuXG4gKi9cblNpbXBsZVNjaGVtYS5leHRlbmRPcHRpb25zKHtcbiAgICB2YWx1ZXNMYWJlbHM6IE1hdGNoLk9wdGlvbmFsKFtTdHJpbmddKSxcbiAgICB0ZXh0T3B0aW9uYWw6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pXG59KTtcblxuLy8gQWRkIGRlZmF1bHQgcmVxdWlyZWQgdmFsaWRhdGlvbiBmb3IgZW1wdHkgc3RyaW5ncyB3aGljaCBjYW4gYmUgYnlwYXNzZWRcbi8vIHVzaW5nIHRleHRPcHRpb25hbD10cnVlIGRlZmluaXRpb25cblNpbXBsZVNjaGVtYS5hZGRWYWxpZGF0b3IoZnVuY3Rpb24oKSB7XG4gICAgaWYgKFxuICAgICAgICB0aGlzLmRlZmluaXRpb24ub3B0aW9uYWwgIT09IHRydWUgJiZcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uLnRleHRPcHRpb25hbCAhPT0gdHJ1ZSAmJlxuICAgICAgICB0aGlzLnZhbHVlID09PSAnJ1xuICAgICkge1xuICAgICAgICByZXR1cm4gJ3JlcXVpcmVkJztcbiAgICB9XG59KTtcblxuLy8gSW5jbHVkaW5nIFtsYWJlbF0gZm9yIHNvbWUgbWVzc2FnZXNcblNpbXBsZVNjaGVtYS5tZXNzYWdlcyh7XG4gICAgbWF4Q291bnQ6ICdbbGFiZWxdIGNhbiBub3QgaGF2ZSBtb3JlIHRoYW4gW21heENvdW50XSB2YWx1ZXMnLFxuICAgIG1pbkNvdW50OiAnW2xhYmVsXSBtdXN0IGhhdmUgYXQgbGVhc3QgW21pbkNvdW50XSB2YWx1ZXMnLFxuICAgIG5vdEFsbG93ZWQ6ICdbbGFiZWxdIGhhcyBhbiBpbnZhbGlkIHZhbHVlOiBcIlt2YWx1ZV1cIidcbn0pO1xuIiwiaW1wb3J0ICcuL29iamVjdC5qcyc7XG5pbXBvcnQgJy4vRElDT01XZWIvJztcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuT0hJRi5vYmplY3QgPSB7fTtcblxuLy8gVHJhbnNmb3JtcyBhIHNoYWxsb3cgb2JqZWN0IHdpdGgga2V5cyBzZXBhcmF0ZWQgYnkgXCIuXCIgaW50byBhIG5lc3RlZCBvYmplY3Rcbk9ISUYub2JqZWN0LmdldE5lc3RlZE9iamVjdCA9IHNoYWxsb3dPYmplY3QgPT4ge1xuICAgIGNvbnN0IG5lc3RlZE9iamVjdCA9IHt9O1xuICAgIGZvciAobGV0IGtleSBpbiBzaGFsbG93T2JqZWN0KSB7XG4gICAgICAgIGlmICghc2hhbGxvd09iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzaGFsbG93T2JqZWN0W2tleV07XG4gICAgICAgIGNvbnN0IHByb3BlcnR5QXJyYXkgPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAgbGV0IGN1cnJlbnRPYmplY3QgPSBuZXN0ZWRPYmplY3Q7XG4gICAgICAgIHdoaWxlIChwcm9wZXJ0eUFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFByb3BlcnR5ID0gcHJvcGVydHlBcnJheS5zaGlmdCgpO1xuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0eUFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3RbY3VycmVudFByb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRPYmplY3RbY3VycmVudFByb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0W2N1cnJlbnRQcm9wZXJ0eV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0ID0gY3VycmVudE9iamVjdFtjdXJyZW50UHJvcGVydHldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RlZE9iamVjdDtcbn07XG5cbi8vIFRyYW5zZm9ybXMgYSBuZXN0ZWQgb2JqZWN0IGludG8gYSBzaGFsbG93T2JqZWN0IG1lcmdpbmcgaXRzIGtleXMgd2l0aCBcIi5cIiBjaGFyYWN0ZXJcbk9ISUYub2JqZWN0LmdldFNoYWxsb3dPYmplY3QgPSBuZXN0ZWRPYmplY3QgPT4ge1xuICAgIGNvbnN0IHNoYWxsb3dPYmplY3QgPSB7fTtcbiAgICBjb25zdCBwdXRWYWx1ZXMgPSAoYmFzZUtleSwgbmVzdGVkT2JqZWN0LCByZXN1bHRPYmplY3QpID0+IHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIG5lc3RlZE9iamVjdCkge1xuICAgICAgICAgICAgaWYgKCFuZXN0ZWRPYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBsZXQgY3VycmVudEtleSA9IGJhc2VLZXkgPyBgJHtiYXNlS2V5fS4ke2tleX1gIDoga2V5O1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gbmVzdGVkT2JqZWN0W2tleV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEtleSArPSAnW10nO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHB1dFZhbHVlcyhjdXJyZW50S2V5LCBjdXJyZW50VmFsdWUsIHJlc3VsdE9iamVjdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdE9iamVjdFtjdXJyZW50S2V5XSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwdXRWYWx1ZXMoJycsIG5lc3RlZE9iamVjdCwgc2hhbGxvd09iamVjdCk7XG4gICAgcmV0dXJuIHNoYWxsb3dPYmplY3Q7XG59O1xuIiwiLyoqXG4gKiBSZXR1cm5zIHRoZSBzcGVjaWZpZWQgZWxlbWVudCBhcyBhIGRpY29tIGF0dHJpYnV0ZSBncm91cC9lbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IC0gVGhlIGdyb3VwL2VsZW1lbnQgb2YgdGhlIGVsZW1lbnQgKGUuZy4gJzAwMjgwMDA5JylcbiAqIEBwYXJhbSBbZGVmYXVsdFZhbHVlXSAtIFRoZSB2YWx1ZSB0byByZXR1cm4gaWYgdGhlIGVsZW1lbnQgaXMgbm90IHByZXNlbnRcbiAqIEByZXR1cm5zIHsqfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUoZWxlbWVudCwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFZhbHVlIGlzIG5vdCBwcmVzZW50IGlmIHRoZSBhdHRyaWJ1dGUgaGFzIGEgemVybyBsZW5ndGggdmFsdWVcbiAgICBpZiAoIWVsZW1lbnQuVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gU2FuaXR5IGNoZWNrIHRvIG1ha2Ugc3VyZSB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBlbnRyeSBpbiB0aGUgYXJyYXkuXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBjb252ZXJ0VG9JbnQoZWxlbWVudC5WYWx1ZSk7XG59O1xuXG5mdW5jdGlvbiBjb252ZXJ0VG9JbnQoaW5wdXQpIHtcbiAgICBmdW5jdGlvbiBwYWRGb3VyKGlucHV0KSB7XG4gICAgICAgIHZhciBsID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsID09IDApIHJldHVybiAnMDAwMCc7XG4gICAgICAgIGlmIChsID09IDEpIHJldHVybiAnMDAwJyArIGlucHV0O1xuICAgICAgICBpZiAobCA9PSAyKSByZXR1cm4gJzAwJyArIGlucHV0O1xuICAgICAgICBpZiAobCA9PSAzKSByZXR1cm4gJzAnICsgaW5wdXQ7XG5cbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIHZhciBvdXRwdXQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaW5wdXRbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBwYWRGb3VyKGlucHV0W2ldLmNoYXJDb2RlQXQoaikudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJzZUludChvdXRwdXQsIDE2KTtcbn1cbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcbmltcG9ydCB7IGJ0b2EgfSBmcm9tICdpc29tb3JwaGljLWJhc2U2NCc7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXIgYXMgcGFydCBvZiBhbiBPYmplY3QuXG4gKlxuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0QXV0aG9yaXphdGlvbkhlYWRlcigpIHtcbiAgICBjb25zdCBoZWFkZXJzID0ge307XG5cbiAgICAvLyBDaGVjayBmb3IgT0hJRi51c2VyIHNpbmNlIHRoaXMgY2FuIGFsc28gYmUgcnVuIG9uIHRoZSBzZXJ2ZXJcbiAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IE9ISUYudXNlciAmJiBPSElGLnVzZXIuZ2V0QWNjZXNzVG9rZW4gJiYgT0hJRi51c2VyLmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgY29uc3Qgc2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKTtcblxuICAgIGlmIChzZXJ2ZXIgJiZcbiAgICAgICAgc2VydmVyLnJlcXVlc3RPcHRpb25zICYmXG4gICAgICAgIHNlcnZlci5yZXF1ZXN0T3B0aW9ucy5hdXRoKSB7XG4gICAgICAgIC8vIEhUVFAgQmFzaWMgQXV0aCAodXNlcjpwYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gYEJhc2ljICR7YnRvYShzZXJ2ZXIucmVxdWVzdE9wdGlvbnMuYXV0aCl9YDtcbiAgICB9IGVsc2UgaWYgKGFjY2Vzc1Rva2VuKSB7XG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gO1xuICAgIH1cblxuICAgIHJldHVybiBoZWFkZXJzO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0TW9kYWxpdGllcyhtb2RhbGl0eSwgbW9kYWxpdGllc0luU3R1ZHkpIHtcbiAgICB2YXIgbW9kYWxpdGllcyA9IHt9O1xuICAgIGlmIChtb2RhbGl0eSkge1xuICAgICAgICBtb2RhbGl0aWVzID0gbW9kYWxpdHk7XG4gICAgfVxuXG4gICAgaWYgKG1vZGFsaXRpZXNJblN0dWR5KSB7XG4gICAgICAgIC8vIEZpbmQgdnIgaW4gbW9kYWxpdGllc1xuICAgICAgICBpZiAobW9kYWxpdGllcy52ciAmJiBtb2RhbGl0aWVzLnZyID09PSBtb2RhbGl0aWVzSW5TdHVkeS52cikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RhbGl0aWVzSW5TdHVkeS5WYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG1vZGFsaXRpZXNJblN0dWR5LlZhbHVlW2ldO1xuICAgICAgICAgICAgICAgIGlmIChtb2RhbGl0aWVzLlZhbHVlLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtb2RhbGl0aWVzLlZhbHVlLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZGFsaXRpZXMgPSBtb2RhbGl0aWVzSW5TdHVkeTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbW9kYWxpdGllcztcbn07XG4iLCIvKipcbiAqIFJldHVybnMgdGhlIEFscGhhYmV0aWMgdmVyc2lvbiBvZiBhIFBOXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgLSBUaGUgZ3JvdXAvZWxlbWVudCBvZiB0aGUgZWxlbWVudCAoZS5nLiAnMDAyMDAwMTMnKVxuICogQHBhcmFtIFtkZWZhdWx0VmFsdWVdIC0gVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBlbGVtZW50IGlzIG5vdCBmb3VuZFxuICogQHJldHVybnMgeyp9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldE5hbWUoZWxlbWVudCwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFZhbHVlIGlzIG5vdCBwcmVzZW50IGlmIHRoZSBhdHRyaWJ1dGUgaGFzIGEgemVybyBsZW5ndGggdmFsdWVcbiAgICBpZiAoIWVsZW1lbnQuVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gU2FuaXR5IGNoZWNrIHRvIG1ha2Ugc3VyZSB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBlbnRyeSBpbiB0aGUgYXJyYXkuXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBSZXR1cm4gdGhlIEFscGhhYmV0aWMgY29tcG9uZW50IGdyb3VwXG4gICAgaWYgKGVsZW1lbnQuVmFsdWVbMF0uQWxwaGFiZXRpYykge1xuICAgICAgICByZXR1cm4gZWxlbWVudC5WYWx1ZVswXS5BbHBoYWJldGljO1xuICAgIH1cbiAgICAvLyBPcnRoYW5jIGRvZXMgbm90IHJldHVybiBQTiBwcm9wZXJseSBzbyB0aGlzIGlzIGEgdGVtcG9yYXJ5IHdvcmthcm91bmRcbiAgICByZXR1cm4gZWxlbWVudC5WYWx1ZVswXTtcbn07XG4iLCIvKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHN0cmluZyB2YWx1ZSBhcyBhIEphdmFzY3JpcHQgTnVtYmVyXG4gKiBAcGFyYW0gZWxlbWVudCAtIFRoZSBncm91cC9lbGVtZW50IG9mIHRoZSBlbGVtZW50IChlLmcuICcwMDIwMDAxMycpXG4gKiBAcGFyYW0gW2RlZmF1bHRWYWx1ZV0gLSBUaGUgZGVmYXVsdCB2YWx1ZSB0byByZXR1cm4gaWYgdGhlIGVsZW1lbnQgZG9lcyBub3QgZXhpc3RcbiAqIEByZXR1cm5zIHsqfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXROdW1iZXIoZWxlbWVudCwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFZhbHVlIGlzIG5vdCBwcmVzZW50IGlmIHRoZSBhdHRyaWJ1dGUgaGFzIGEgemVybyBsZW5ndGggdmFsdWVcbiAgICBpZiAoIWVsZW1lbnQuVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gU2FuaXR5IGNoZWNrIHRvIG1ha2Ugc3VyZSB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBlbnRyeSBpbiB0aGUgYXJyYXkuXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZUZsb2F0KGVsZW1lbnQuVmFsdWVbMF0pO1xufTtcbiIsIi8qKlxuICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGVsZW1lbnQgYXMgYSBzdHJpbmcuICBNdWx0aS12YWx1ZWQgZWxlbWVudHMgd2lsbCBiZSBzZXBhcmF0ZWQgYnkgYSBiYWNrc2xhc2hcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAtIFRoZSBncm91cC9lbGVtZW50IG9mIHRoZSBlbGVtZW50IChlLmcuICcwMDIwMDAxMycpXG4gKiBAcGFyYW0gW2RlZmF1bHRWYWx1ZV0gLSBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBlbGVtZW50IGlzIG5vdCBwcmVzZW50XG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0U3RyaW5nKGVsZW1lbnQsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBWYWx1ZSBpcyBub3QgcHJlc2VudCBpZiB0aGUgYXR0cmlidXRlIGhhcyBhIHplcm8gbGVuZ3RoIHZhbHVlXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFNhbml0eSBjaGVjayB0byBtYWtlIHN1cmUgd2UgaGF2ZSBhdCBsZWFzdCBvbmUgZW50cnkgaW4gdGhlIGFycmF5LlxuICAgIGlmICghZWxlbWVudC5WYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gSm9pbiB0aGUgYXJyYXkgdG9nZXRoZXIgc2VwYXJhdGVkIGJ5IGJhY2tzbGFzaFxuICAgIC8vIE5PVEU6IE9ydGhhbmMgZG9lcyBub3QgY29ycmVjdGx5IHNwbGl0IHZhbHVlcyBpbnRvIGFuIGFycmF5IHNvIHRoZSBqb2luIGlzIGEgbm8tb3BcbiAgICByZXR1cm4gZWxlbWVudC5WYWx1ZS5qb2luKCdcXFxcJyk7XG59O1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuXG5pbXBvcnQgZ2V0QXR0cmlidXRlIGZyb20gJy4vZ2V0QXR0cmlidXRlLmpzJztcbmltcG9ydCBnZXRBdXRob3JpemF0aW9uSGVhZGVyIGZyb20gJy4vZ2V0QXV0aG9yaXphdGlvbkhlYWRlci5qcyc7XG5pbXBvcnQgZ2V0TW9kYWxpdGllcyBmcm9tICcuL2dldE1vZGFsaXRpZXMuanMnO1xuaW1wb3J0IGdldE5hbWUgZnJvbSAnLi9nZXROYW1lLmpzJztcbmltcG9ydCBnZXROdW1iZXIgZnJvbSAnLi9nZXROdW1iZXIuanMnO1xuaW1wb3J0IGdldFN0cmluZyBmcm9tICcuL2dldFN0cmluZy5qcyc7XG5cbmNvbnN0IERJQ09NV2ViID0ge1xuICAgIGdldEF0dHJpYnV0ZSxcbiAgICBnZXRBdXRob3JpemF0aW9uSGVhZGVyLFxuICAgIGdldE1vZGFsaXRpZXMsXG4gICAgZ2V0TmFtZSxcbiAgICBnZXROdW1iZXIsXG4gICAgZ2V0U3RyaW5nLFxufTtcblxuT0hJRi5ESUNPTVdlYiA9IERJQ09NV2ViO1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gXCJtZXRlb3Ivb2hpZjpjb3JlXCI7XG5cbmNvbnN0IHByb2R1Y3Rpb25Nb2RlID0gdHJ1ZTtcblxuaWYgKE1ldGVvci5pc0RldmVsb3BtZW50KSB7XG4gIC8vIFJldHVybiBhbiBhYnNvbHV0ZSBVUkwgd2l0aCB0aGUgcGFnZSBkb21haW4gdXNpbmcgc3ViIHBhdGggb2YgUk9PVF9VUkxcbiAgLy8gdG8gbGV0IG11bHRpcGxlIGRvbWFpbnMgZGlyZWN0ZWQgdG8gdGhlIHNhbWUgc2VydmVyIHdvcmtcblxuICBPSElGLnV0aWxzLmFic29sdXRlVXJsID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIC8vIEZvciBsb2NhbCB0ZXN0aW5nLlxuICAgIGxldCBhYnNvbHV0ZVBhdGggPSBcIi9cIjtcblxuICAgIGNvbnN0IGFic29sdXRlVXJsID0gTWV0ZW9yLmFic29sdXRlVXJsKCk7XG4gICAgY29uc3QgYWJzb2x1dGVVcmxQYXJ0cyA9IGFic29sdXRlVXJsLnNwbGl0KFwiL1wiKTtcblxuICAgIGlmIChhYnNvbHV0ZVVybFBhcnRzLmxlbmd0aCA+IDQpIHtcbiAgICAgIGNvbnN0IHJvb3RVcmxQcmVmaXhJbmRleCA9IGFic29sdXRlVXJsLmluZGV4T2YoYWJzb2x1dGVVcmxQYXJ0c1szXSk7XG4gICAgICBhYnNvbHV0ZVBhdGggKz0gYWJzb2x1dGVVcmwuc3Vic3RyaW5nKHJvb3RVcmxQcmVmaXhJbmRleCkgKyBwYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICBhYnNvbHV0ZVBhdGggKz0gcGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gYWJzb2x1dGVQYXRoLnJlcGxhY2UoL1xcL1xcLysvZywgXCIvXCIpO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gSlBFVFRTIC0tIE92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gaW4gWE5BVCBlbnZpb3JubWVudCBpbiBvcmRlciB0byBkaXNwbGF5IGNvcnJlY3RseSB3aGVuIGhvc3RlZCBhdCBhbiBhcmJpdHJhcnkgc3ViZGlyZWN0b3J5IGluIFhOQVQuXG4gIE9ISUYudXRpbHMuYWJzb2x1dGVVcmwgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgbGV0IHZpZXdlclVybCA9IFNlc3Npb24uZ2V0KFwidmlld2VyUm9vdFwiKTtcblxuICAgIGlmIChwYXRoWzBdID09PSBcIi9cIikge1xuICAgICAgcmV0dXJuIGAke3ZpZXdlclVybH0ke3BhdGh9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCR7dmlld2VyVXJsfS8ke3BhdGh9YDtcbiAgfTtcbn1cbiIsImltcG9ydCAnLi9hYnNvbHV0ZVVybCc7XG5pbXBvcnQgJy4vb2JqZWN0UGF0aCc7XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5cbmNsYXNzIE9iamVjdFBhdGgge1xuXG4gICAgLyoqXG4gICAgICogU2V0IGFuIG9iamVjdCBwcm9wZXJ0eSBiYXNlZCBvbiBcInBhdGhcIiAobmFtZXNwYWNlKSBzdXBwbGllZCBjcmVhdGluZ1xuICAgICAqIC4uLiBpbnRlcm1lZGlhcnkgb2JqZWN0cyBpZiB0aGV5IGRvIG5vdCBleGlzdC5cbiAgICAgKiBAcGFyYW0gb2JqZWN0IHtPYmplY3R9IEFuIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydGllcyBzcGVjaWZpZWQgb24gcGF0aCBzaG91bGQgYmUgc2V0LlxuICAgICAqIEBwYXJhbSBwYXRoIHtTdHJpbmd9IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJvcGVydHkgdG8gYmUgc2V0LCBlLmcuIFwidXNlci5zdHVkeS5zZXJpZXMudGltZXBvaW50XCIuXG4gICAgICogQHBhcmFtIHZhbHVlIHtBbnl9IFRoZSB2YWx1ZSBvZiB0aGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHNldC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIFwidHJ1ZVwiIG9uIHN1Y2Nlc3MsIFwiZmFsc2VcIiBpZiBhbnkgaW50ZXJtZWRpYXRlIGNvbXBvbmVudCBvZiB0aGUgc3VwcGxpZWQgcGF0aFxuICAgICAqIC4uLiBpcyBub3QgYSB2YWxpZCBPYmplY3QsIGluIHdoaWNoIGNhc2UgdGhlIHByb3BlcnR5IGNhbm5vdCBiZSBzZXQuIE5vIGV4Y3BldGlvbnMgYXJlIHRocm93bi5cbiAgICAgKi9cbiAgICBzdGF0aWMgc2V0KG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcblxuICAgICAgICBsZXQgY29tcG9uZW50cyA9IE9iamVjdFBhdGguZ2V0UGF0aENvbXBvbmVudHMocGF0aCksXG4gICAgICAgICAgICBsZW5ndGggPSBjb21wb25lbnRzICE9PSBudWxsID8gY29tcG9uZW50cy5sZW5ndGggOiAwLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA+IDAgJiYgT2JqZWN0UGF0aC5pc1ZhbGlkT2JqZWN0KG9iamVjdCkpIHtcblxuICAgICAgICAgICAgbGV0IGkgPSAwLFxuICAgICAgICAgICAgICAgIGxhc3QgPSBsZW5ndGggLSAxLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3QgPSBvYmplY3Q7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgbGFzdCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gY29tcG9uZW50c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWVsZCBpbiBjdXJyZW50T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0UGF0aC5pc1ZhbGlkT2JqZWN0KGN1cnJlbnRPYmplY3RbZmllbGRdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0W2ZpZWxkXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3QgPSBjdXJyZW50T2JqZWN0W2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBpKys7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGkgPT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0W2NvbXBvbmVudHNbbGFzdF1dID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBvYmplY3QgcHJvcGVydHkgYmFzZWQgb24gXCJwYXRoXCIgKG5hbWVzcGFjZSkgc3VwcGxpZWQgdHJhdmVyc2luZyB0aGUgb2JqZWN0XG4gICAgICogLi4uIHRyZWUgYXMgbmVjZXNzYXJ5LlxuICAgICAqIEBwYXJhbSBvYmplY3Qge09iamVjdH0gQW4gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0aWVzIHNwZWNpZmllZCBtaWdodCBleGlzdC5cbiAgICAgKiBAcGFyYW0gcGF0aCB7U3RyaW5nfSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByb3BlcnR5IHRvIGJlIHNlYXJjaGVkIGZvciwgZS5nLiBcInVzZXIuc3R1ZHkuc2VyaWVzLnRpbWVwb2ludFwiLlxuICAgICAqIEByZXR1cm4ge0FueX0gVGhlIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBpZiBmb3VuZC4gQnkgZGVmYXVsdCwgcmV0dXJucyB0aGUgc3BlY2lhbCB0eXBlIFwidW5kZWZpbmVkXCIuXG4gICAgICovXG4gICAgc3RhdGljIGdldChvYmplY3QsIHBhdGgpIHtcblxuICAgICAgICBsZXQgZm91bmQsIC8vIHVuZGVmaW5lZCBieSBkZWZhdWx0XG4gICAgICAgICAgICBjb21wb25lbnRzID0gT2JqZWN0UGF0aC5nZXRQYXRoQ29tcG9uZW50cyhwYXRoKSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbXBvbmVudHMgIT09IG51bGwgPyBjb21wb25lbnRzLmxlbmd0aCA6IDA7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA+IDAgJiYgT2JqZWN0UGF0aC5pc1ZhbGlkT2JqZWN0KG9iamVjdCkpIHtcblxuICAgICAgICAgICAgbGV0IGkgPSAwLFxuICAgICAgICAgICAgICAgIGxhc3QgPSBsZW5ndGggLSAxLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3QgPSBvYmplY3Q7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgbGFzdCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gY29tcG9uZW50c1tpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSBPYmplY3RQYXRoLmlzVmFsaWRPYmplY3QoY3VycmVudE9iamVjdFtmaWVsZF0pO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZCBpbiBjdXJyZW50T2JqZWN0ICYmIGlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE9iamVjdCA9IGN1cnJlbnRPYmplY3RbZmllbGRdO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpID09PSBsYXN0ICYmIGNvbXBvbmVudHNbbGFzdF0gaW4gY3VycmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gY3VycmVudE9iamVjdFtjb21wb25lbnRzW2xhc3RdXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIHN1cHBsaWVkIGFyZ3VtZW50IGlzIGEgcmVhbCBKYXZhU2NyaXB0IE9iamVjdCBpbnN0YW5jZS5cbiAgICAgKiBAcGFyYW0gb2JqZWN0IHtBbnl9IFRoZSBzdWJqZWN0IHRvIGJlIHRlc3RlZC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIFwidHJ1ZVwiIGlmIHRoZSBvYmplY3QgaXMgYSByZWFsIE9iamVjdCBpbnN0YW5jZSBhbmQgXCJmYWxzZVwiIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgaXNWYWxpZE9iamVjdChvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICBvYmplY3QgIT09IG51bGwgJiZcbiAgICAgICAgICAgIG9iamVjdCBpbnN0YW5jZW9mIE9iamVjdFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYXRoQ29tcG9uZW50cyhwYXRoKSB7XG4gICAgICAgIHJldHVybiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnID8gcGF0aC5zcGxpdCgnLicpIDogbnVsbCk7XG4gICAgfVxuXG59XG5cbk9ISUYudXRpbHMuT2JqZWN0UGF0aCA9IE9iamVjdFBhdGg7XG4iXX0=
