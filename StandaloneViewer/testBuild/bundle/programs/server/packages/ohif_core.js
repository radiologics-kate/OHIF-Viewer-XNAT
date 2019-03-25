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
const productionMode = true; // Return an absolute URL with the page domain using sub path of ROOT_URL
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

if (productionMode) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL21haW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC9zY2hlbWEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2xpYi9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL29iamVjdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldEF0dHJpYnV0ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldEF1dGhvcml6YXRpb25IZWFkZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL2xpYi9ESUNPTVdlYi9nZXRNb2RhbGl0aWVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC9saWIvRElDT01XZWIvZ2V0TmFtZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldE51bWJlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2dldFN0cmluZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvbGliL0RJQ09NV2ViL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmNvcmUvYm90aC91dGlscy9hYnNvbHV0ZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpjb3JlL2JvdGgvdXRpbHMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6Y29yZS9ib3RoL3V0aWxzL29iamVjdFBhdGguanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiT0hJRiIsIk1ldGVvciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJsb2ciLCJ1aSIsInV0aWxzIiwidmlld2VyIiwiY29ybmVyc3RvbmUiLCJ1c2VyIiwiRElDT01XZWIiLCJpc0NsaWVudCIsIndpbmRvdyIsIlNpbXBsZVNjaGVtYSIsImV4dGVuZE9wdGlvbnMiLCJ2YWx1ZXNMYWJlbHMiLCJNYXRjaCIsIk9wdGlvbmFsIiwiU3RyaW5nIiwidGV4dE9wdGlvbmFsIiwiQm9vbGVhbiIsImFkZFZhbGlkYXRvciIsImRlZmluaXRpb24iLCJvcHRpb25hbCIsInZhbHVlIiwibWVzc2FnZXMiLCJtYXhDb3VudCIsIm1pbkNvdW50Iiwibm90QWxsb3dlZCIsIm9iamVjdCIsImdldE5lc3RlZE9iamVjdCIsInNoYWxsb3dPYmplY3QiLCJuZXN0ZWRPYmplY3QiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInByb3BlcnR5QXJyYXkiLCJzcGxpdCIsImN1cnJlbnRPYmplY3QiLCJsZW5ndGgiLCJjdXJyZW50UHJvcGVydHkiLCJzaGlmdCIsImdldFNoYWxsb3dPYmplY3QiLCJwdXRWYWx1ZXMiLCJiYXNlS2V5IiwicmVzdWx0T2JqZWN0IiwiY3VycmVudEtleSIsImN1cnJlbnRWYWx1ZSIsIkFycmF5IiwiZGVmYXVsdCIsImdldEF0dHJpYnV0ZSIsImVsZW1lbnQiLCJkZWZhdWx0VmFsdWUiLCJWYWx1ZSIsImNvbnZlcnRUb0ludCIsImlucHV0IiwicGFkRm91ciIsImwiLCJvdXRwdXQiLCJpIiwiaiIsImNoYXJDb2RlQXQiLCJ0b1N0cmluZyIsInBhcnNlSW50IiwiZ2V0QXV0aG9yaXphdGlvbkhlYWRlciIsImJ0b2EiLCJoZWFkZXJzIiwiYWNjZXNzVG9rZW4iLCJnZXRBY2Nlc3NUb2tlbiIsInNlcnZlciIsInNlcnZlcnMiLCJnZXRDdXJyZW50U2VydmVyIiwicmVxdWVzdE9wdGlvbnMiLCJhdXRoIiwiQXV0aG9yaXphdGlvbiIsImdldE1vZGFsaXRpZXMiLCJtb2RhbGl0eSIsIm1vZGFsaXRpZXNJblN0dWR5IiwibW9kYWxpdGllcyIsInZyIiwiaW5kZXhPZiIsInB1c2giLCJnZXROYW1lIiwiQWxwaGFiZXRpYyIsImdldE51bWJlciIsInBhcnNlRmxvYXQiLCJnZXRTdHJpbmciLCJqb2luIiwicHJvZHVjdGlvbk1vZGUiLCJhYnNvbHV0ZVVybCIsInBhdGgiLCJhYnNvbHV0ZVBhdGgiLCJhYnNvbHV0ZVVybFBhcnRzIiwicm9vdFVybFByZWZpeEluZGV4Iiwic3Vic3RyaW5nIiwicmVwbGFjZSIsInZpZXdlclVybCIsIlNlc3Npb24iLCJnZXQiLCJPYmplY3RQYXRoIiwic2V0IiwiY29tcG9uZW50cyIsImdldFBhdGhDb21wb25lbnRzIiwicmVzdWx0IiwiaXNWYWxpZE9iamVjdCIsImxhc3QiLCJmaWVsZCIsImZvdW5kIiwiaXNWYWxpZCIsIk9iamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxRQUFLLE1BQUlBO0FBQVYsQ0FBZDtBQUErQixJQUFJQyxNQUFKO0FBQVdILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0YsU0FBT0csQ0FBUCxFQUFTO0FBQUNILGFBQU9HLENBQVA7QUFBUzs7QUFBcEIsQ0FBdEMsRUFBNEQsQ0FBNUQ7O0FBRTFDOzs7QUFJQSxNQUFNSixPQUFPO0FBQ1RLLE9BQUssRUFESTtBQUVUQyxNQUFJLEVBRks7QUFHVEMsU0FBTyxFQUhFO0FBSVRDLFVBQVEsRUFKQztBQUtUQyxlQUFhLEVBTEo7QUFNVEMsUUFBTSxFQU5HO0FBT1RDLFlBQVUsRUFQRCxDQU9LOztBQVBMLENBQWIsQyxDQVVBO0FBQ0E7O0FBQ0EsSUFBSVYsT0FBT1csUUFBWCxFQUFxQjtBQUNqQkMsU0FBT2IsSUFBUCxHQUFjQSxJQUFkO0FBQ0gsQzs7Ozs7Ozs7Ozs7QUNwQkRGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxPQUFSLENBQWI7QUFBK0JMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxTQUFSLENBQWI7QUFBaUNMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBaEUsSUFBSVcsWUFBSjtBQUFpQmhCLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw2QkFBUixDQUFiLEVBQW9EO0FBQUNXLGVBQWFWLENBQWIsRUFBZTtBQUFDVSxtQkFBYVYsQ0FBYjtBQUFlOztBQUFoQyxDQUFwRCxFQUFzRixDQUF0Rjs7QUFFakI7Ozs7Ozs7OztBQVNBVSxhQUFhQyxhQUFiLENBQTJCO0FBQ3ZCQyxnQkFBY0MsTUFBTUMsUUFBTixDQUFlLENBQUNDLE1BQUQsQ0FBZixDQURTO0FBRXZCQyxnQkFBY0gsTUFBTUMsUUFBTixDQUFlRyxPQUFmO0FBRlMsQ0FBM0IsRSxDQUtBO0FBQ0E7O0FBQ0FQLGFBQWFRLFlBQWIsQ0FBMEIsWUFBVztBQUNqQyxNQUNJLEtBQUtDLFVBQUwsQ0FBZ0JDLFFBQWhCLEtBQTZCLElBQTdCLElBQ0EsS0FBS0QsVUFBTCxDQUFnQkgsWUFBaEIsS0FBaUMsSUFEakMsSUFFQSxLQUFLSyxLQUFMLEtBQWUsRUFIbkIsRUFJRTtBQUNFLFdBQU8sVUFBUDtBQUNIO0FBQ0osQ0FSRCxFLENBVUE7O0FBQ0FYLGFBQWFZLFFBQWIsQ0FBc0I7QUFDbEJDLFlBQVUsa0RBRFE7QUFFbEJDLFlBQVUsOENBRlE7QUFHbEJDLGNBQVk7QUFITSxDQUF0QixFOzs7Ozs7Ozs7OztBQzdCQS9CLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWI7QUFBcUNMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBckMsSUFBSUgsSUFBSjtBQUFTRixPQUFPSSxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDSCxPQUFLSSxDQUFMLEVBQU87QUFBQ0osV0FBS0ksQ0FBTDtBQUFPOztBQUFoQixDQUF6QyxFQUEyRCxDQUEzRDtBQUVUSixLQUFLOEIsTUFBTCxHQUFjLEVBQWQsQyxDQUVBOztBQUNBOUIsS0FBSzhCLE1BQUwsQ0FBWUMsZUFBWixHQUE4QkMsaUJBQWlCO0FBQzNDLFFBQU1DLGVBQWUsRUFBckI7O0FBQ0EsT0FBSyxJQUFJQyxHQUFULElBQWdCRixhQUFoQixFQUErQjtBQUMzQixRQUFJLENBQUNBLGNBQWNHLGNBQWQsQ0FBNkJELEdBQTdCLENBQUwsRUFBd0M7QUFDeEMsVUFBTVQsUUFBUU8sY0FBY0UsR0FBZCxDQUFkO0FBQ0EsVUFBTUUsZ0JBQWdCRixJQUFJRyxLQUFKLENBQVUsR0FBVixDQUF0QjtBQUNBLFFBQUlDLGdCQUFnQkwsWUFBcEI7O0FBQ0EsV0FBT0csY0FBY0csTUFBckIsRUFBNkI7QUFDekIsWUFBTUMsa0JBQWtCSixjQUFjSyxLQUFkLEVBQXhCOztBQUNBLFVBQUksQ0FBQ0wsY0FBY0csTUFBbkIsRUFBMkI7QUFDdkJELHNCQUFjRSxlQUFkLElBQWlDZixLQUFqQztBQUNILE9BRkQsTUFFTztBQUNILFlBQUksQ0FBQ2EsY0FBY0UsZUFBZCxDQUFMLEVBQXFDO0FBQ2pDRix3QkFBY0UsZUFBZCxJQUFpQyxFQUFqQztBQUNIOztBQUVERix3QkFBZ0JBLGNBQWNFLGVBQWQsQ0FBaEI7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsU0FBT1AsWUFBUDtBQUNILENBdEJELEMsQ0F3QkE7OztBQUNBakMsS0FBSzhCLE1BQUwsQ0FBWVksZ0JBQVosR0FBK0JULGdCQUFnQjtBQUMzQyxRQUFNRCxnQkFBZ0IsRUFBdEI7O0FBQ0EsUUFBTVcsWUFBWSxDQUFDQyxPQUFELEVBQVVYLFlBQVYsRUFBd0JZLFlBQXhCLEtBQXlDO0FBQ3ZELFNBQUssSUFBSVgsR0FBVCxJQUFnQkQsWUFBaEIsRUFBOEI7QUFDMUIsVUFBSSxDQUFDQSxhQUFhRSxjQUFiLENBQTRCRCxHQUE1QixDQUFMLEVBQXVDO0FBQ3ZDLFVBQUlZLGFBQWFGLFVBQVcsR0FBRUEsT0FBUSxJQUFHVixHQUFJLEVBQTVCLEdBQWdDQSxHQUFqRDtBQUNBLFlBQU1hLGVBQWVkLGFBQWFDLEdBQWIsQ0FBckI7O0FBQ0EsVUFBSSxPQUFPYSxZQUFQLEtBQXdCLFFBQTVCLEVBQXNDO0FBQ2xDLFlBQUlBLHdCQUF3QkMsS0FBNUIsRUFBbUM7QUFDL0JGLHdCQUFjLElBQWQ7QUFDSDs7QUFFREgsa0JBQVVHLFVBQVYsRUFBc0JDLFlBQXRCLEVBQW9DRixZQUFwQztBQUNILE9BTkQsTUFNTztBQUNIQSxxQkFBYUMsVUFBYixJQUEyQkMsWUFBM0I7QUFDSDtBQUNKO0FBQ0osR0FmRDs7QUFpQkFKLFlBQVUsRUFBVixFQUFjVixZQUFkLEVBQTRCRCxhQUE1QjtBQUNBLFNBQU9BLGFBQVA7QUFDSCxDQXJCRCxDOzs7Ozs7Ozs7OztBQzlCQWxDLE9BQU9DLE1BQVAsQ0FBYztBQUFDa0QsV0FBUSxNQUFJQztBQUFiLENBQWQ7O0FBT2UsU0FBU0EsWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0JDLFlBQS9CLEVBQTZDO0FBQ3hELE1BQUksQ0FBQ0QsT0FBTCxFQUFjO0FBQ1YsV0FBT0MsWUFBUDtBQUNILEdBSHVELENBSXhEOzs7QUFDQSxNQUFJLENBQUNELFFBQVFFLEtBQWIsRUFBb0I7QUFDaEIsV0FBT0QsWUFBUDtBQUNILEdBUHVELENBUXhEOzs7QUFDQSxNQUFJLENBQUNELFFBQVFFLEtBQVIsQ0FBY2QsTUFBbkIsRUFBMkI7QUFDdkIsV0FBT2EsWUFBUDtBQUNIOztBQUVELFNBQU9FLGFBQWFILFFBQVFFLEtBQXJCLENBQVA7QUFDSDs7QUFBQTs7QUFFRCxTQUFTQyxZQUFULENBQXNCQyxLQUF0QixFQUE2QjtBQUN6QixXQUFTQyxPQUFULENBQWlCRCxLQUFqQixFQUF3QjtBQUNwQixRQUFJRSxJQUFJRixNQUFNaEIsTUFBZDtBQUVBLFFBQUlrQixLQUFLLENBQVQsRUFBWSxPQUFPLE1BQVA7QUFDWixRQUFJQSxLQUFLLENBQVQsRUFBWSxPQUFPLFFBQVFGLEtBQWY7QUFDWixRQUFJRSxLQUFLLENBQVQsRUFBWSxPQUFPLE9BQU9GLEtBQWQ7QUFDWixRQUFJRSxLQUFLLENBQVQsRUFBWSxPQUFPLE1BQU1GLEtBQWI7QUFFWixXQUFPQSxLQUFQO0FBQ0g7O0FBRUQsTUFBSUcsU0FBUyxFQUFiOztBQUNBLE9BQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSixNQUFNaEIsTUFBMUIsRUFBa0NvQixHQUFsQyxFQUF1QztBQUNuQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUwsTUFBTUksQ0FBTixFQUFTcEIsTUFBN0IsRUFBcUNxQixHQUFyQyxFQUEwQztBQUN0Q0YsZ0JBQVVGLFFBQVFELE1BQU1JLENBQU4sRUFBU0UsVUFBVCxDQUFvQkQsQ0FBcEIsRUFBdUJFLFFBQXZCLENBQWdDLEVBQWhDLENBQVIsQ0FBVjtBQUNIO0FBQ0o7O0FBRUQsU0FBT0MsU0FBU0wsTUFBVCxFQUFpQixFQUFqQixDQUFQO0FBQ0gsQzs7Ozs7Ozs7Ozs7QUMzQ0Q1RCxPQUFPQyxNQUFQLENBQWM7QUFBQ2tELFdBQVEsTUFBSWU7QUFBYixDQUFkO0FBQW9ELElBQUloRSxJQUFKO0FBQVNGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVBQXlDO0FBQUNILE9BQUtJLENBQUwsRUFBTztBQUFDSixXQUFLSSxDQUFMO0FBQU87O0FBQWhCLENBQXpDLEVBQTJELENBQTNEO0FBQThELElBQUk2RCxJQUFKO0FBQVNuRSxPQUFPSSxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDOEQsT0FBSzdELENBQUwsRUFBTztBQUFDNkQsV0FBSzdELENBQUw7QUFBTzs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7O0FBUXJILFNBQVM0RCxzQkFBVCxHQUFrQztBQUM3QyxRQUFNRSxVQUFVLEVBQWhCLENBRDZDLENBRzdDOztBQUNBLFFBQU1DLGNBQWNuRSxLQUFLVSxJQUFMLElBQWFWLEtBQUtVLElBQUwsQ0FBVTBELGNBQXZCLElBQXlDcEUsS0FBS1UsSUFBTCxDQUFVMEQsY0FBVixFQUE3RDtBQUNBLFFBQU1DLFNBQVNyRSxLQUFLc0UsT0FBTCxDQUFhQyxnQkFBYixFQUFmOztBQUVBLE1BQUlGLFVBQ0FBLE9BQU9HLGNBRFAsSUFFQUgsT0FBT0csY0FBUCxDQUFzQkMsSUFGMUIsRUFFZ0M7QUFDNUI7QUFDQVAsWUFBUVEsYUFBUixHQUF5QixTQUFRVCxLQUFLSSxPQUFPRyxjQUFQLENBQXNCQyxJQUEzQixDQUFpQyxFQUFsRTtBQUNILEdBTEQsTUFLTyxJQUFJTixXQUFKLEVBQWlCO0FBQ3BCRCxZQUFRUSxhQUFSLEdBQXlCLFVBQVNQLFdBQVksRUFBOUM7QUFDSDs7QUFFRCxTQUFPRCxPQUFQO0FBQ0gsQzs7Ozs7Ozs7Ozs7QUN6QkRwRSxPQUFPQyxNQUFQLENBQWM7QUFBQ2tELFdBQVEsTUFBSTBCO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxhQUFULENBQXVCQyxRQUF2QixFQUFpQ0MsaUJBQWpDLEVBQW9EO0FBQy9ELE1BQUlDLGFBQWEsRUFBakI7O0FBQ0EsTUFBSUYsUUFBSixFQUFjO0FBQ1ZFLGlCQUFhRixRQUFiO0FBQ0g7O0FBRUQsTUFBSUMsaUJBQUosRUFBdUI7QUFDbkI7QUFDQSxRQUFJQyxXQUFXQyxFQUFYLElBQWlCRCxXQUFXQyxFQUFYLEtBQWtCRixrQkFBa0JFLEVBQXpELEVBQTZEO0FBQ3pELFdBQUssSUFBSXBCLElBQUksQ0FBYixFQUFnQkEsSUFBSWtCLGtCQUFrQnhCLEtBQWxCLENBQXdCZCxNQUE1QyxFQUFvRG9CLEdBQXBELEVBQXlEO0FBQ3JELFlBQUlsQyxRQUFRb0Qsa0JBQWtCeEIsS0FBbEIsQ0FBd0JNLENBQXhCLENBQVo7O0FBQ0EsWUFBSW1CLFdBQVd6QixLQUFYLENBQWlCMkIsT0FBakIsQ0FBeUJ2RCxLQUF6QixNQUFvQyxDQUFDLENBQXpDLEVBQTRDO0FBQ3hDcUQscUJBQVd6QixLQUFYLENBQWlCNEIsSUFBakIsQ0FBc0J4RCxLQUF0QjtBQUNIO0FBQ0o7QUFDSixLQVBELE1BT087QUFDSHFELG1CQUFhRCxpQkFBYjtBQUNIO0FBQ0o7O0FBQ0QsU0FBT0MsVUFBUDtBQUNIOztBQUFBLEM7Ozs7Ozs7Ozs7O0FDcEJEaEYsT0FBT0MsTUFBUCxDQUFjO0FBQUNrRCxXQUFRLE1BQUlpQztBQUFiLENBQWQ7O0FBT2UsU0FBU0EsT0FBVCxDQUFpQi9CLE9BQWpCLEVBQTBCQyxZQUExQixFQUF3QztBQUNuRCxNQUFJLENBQUNELE9BQUwsRUFBYztBQUNWLFdBQU9DLFlBQVA7QUFDSCxHQUhrRCxDQUluRDs7O0FBQ0EsTUFBSSxDQUFDRCxRQUFRRSxLQUFiLEVBQW9CO0FBQ2hCLFdBQU9ELFlBQVA7QUFDSCxHQVBrRCxDQVFuRDs7O0FBQ0EsTUFBSSxDQUFDRCxRQUFRRSxLQUFSLENBQWNkLE1BQW5CLEVBQTJCO0FBQ3ZCLFdBQU9hLFlBQVA7QUFDSCxHQVhrRCxDQVluRDs7O0FBQ0EsTUFBSUQsUUFBUUUsS0FBUixDQUFjLENBQWQsRUFBaUI4QixVQUFyQixFQUFpQztBQUM3QixXQUFPaEMsUUFBUUUsS0FBUixDQUFjLENBQWQsRUFBaUI4QixVQUF4QjtBQUNILEdBZmtELENBZ0JuRDs7O0FBQ0EsU0FBT2hDLFFBQVFFLEtBQVIsQ0FBYyxDQUFkLENBQVA7QUFDSDs7QUFBQSxDOzs7Ozs7Ozs7OztBQ3pCRHZELE9BQU9DLE1BQVAsQ0FBYztBQUFDa0QsV0FBUSxNQUFJbUM7QUFBYixDQUFkOztBQU1lLFNBQVNBLFNBQVQsQ0FBbUJqQyxPQUFuQixFQUE0QkMsWUFBNUIsRUFBMEM7QUFDckQsTUFBSSxDQUFDRCxPQUFMLEVBQWM7QUFDVixXQUFPQyxZQUFQO0FBQ0gsR0FIb0QsQ0FJckQ7OztBQUNBLE1BQUksQ0FBQ0QsUUFBUUUsS0FBYixFQUFvQjtBQUNoQixXQUFPRCxZQUFQO0FBQ0gsR0FQb0QsQ0FRckQ7OztBQUNBLE1BQUksQ0FBQ0QsUUFBUUUsS0FBUixDQUFjZCxNQUFuQixFQUEyQjtBQUN2QixXQUFPYSxZQUFQO0FBQ0g7O0FBRUQsU0FBT2lDLFdBQVdsQyxRQUFRRSxLQUFSLENBQWMsQ0FBZCxDQUFYLENBQVA7QUFDSDs7QUFBQSxDOzs7Ozs7Ozs7OztBQ3BCRHZELE9BQU9DLE1BQVAsQ0FBYztBQUFDa0QsV0FBUSxNQUFJcUM7QUFBYixDQUFkOztBQU9lLFNBQVNBLFNBQVQsQ0FBbUJuQyxPQUFuQixFQUE0QkMsWUFBNUIsRUFBMEM7QUFDckQsTUFBSSxDQUFDRCxPQUFMLEVBQWM7QUFDVixXQUFPQyxZQUFQO0FBQ0gsR0FIb0QsQ0FJckQ7OztBQUNBLE1BQUksQ0FBQ0QsUUFBUUUsS0FBYixFQUFvQjtBQUNoQixXQUFPRCxZQUFQO0FBQ0gsR0FQb0QsQ0FRckQ7OztBQUNBLE1BQUksQ0FBQ0QsUUFBUUUsS0FBUixDQUFjZCxNQUFuQixFQUEyQjtBQUN2QixXQUFPYSxZQUFQO0FBQ0gsR0FYb0QsQ0FZckQ7QUFDQTs7O0FBQ0EsU0FBT0QsUUFBUUUsS0FBUixDQUFja0MsSUFBZCxDQUFtQixJQUFuQixDQUFQO0FBQ0g7O0FBQUEsQzs7Ozs7Ozs7Ozs7QUN0QkQsSUFBSXZGLElBQUo7QUFBU0YsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGtCQUFSLENBQWIsRUFBeUM7QUFBQ0gsT0FBS0ksQ0FBTCxFQUFPO0FBQUNKLFdBQUtJLENBQUw7QUFBTzs7QUFBaEIsQ0FBekMsRUFBMkQsQ0FBM0Q7QUFBOEQsSUFBSThDLFlBQUo7QUFBaUJwRCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDOEMsVUFBUTdDLENBQVIsRUFBVTtBQUFDOEMsbUJBQWE5QyxDQUFiO0FBQWU7O0FBQTNCLENBQTFDLEVBQXVFLENBQXZFO0FBQTBFLElBQUk0RCxzQkFBSjtBQUEyQmxFLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw2QkFBUixDQUFiLEVBQW9EO0FBQUM4QyxVQUFRN0MsQ0FBUixFQUFVO0FBQUM0RCw2QkFBdUI1RCxDQUF2QjtBQUF5Qjs7QUFBckMsQ0FBcEQsRUFBMkYsQ0FBM0Y7QUFBOEYsSUFBSXVFLGFBQUo7QUFBa0I3RSxPQUFPSSxLQUFQLENBQWFDLFFBQVEsb0JBQVIsQ0FBYixFQUEyQztBQUFDOEMsVUFBUTdDLENBQVIsRUFBVTtBQUFDdUUsb0JBQWN2RSxDQUFkO0FBQWdCOztBQUE1QixDQUEzQyxFQUF5RSxDQUF6RTtBQUE0RSxJQUFJOEUsT0FBSjtBQUFZcEYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDOEMsVUFBUTdDLENBQVIsRUFBVTtBQUFDOEUsY0FBUTlFLENBQVI7QUFBVTs7QUFBdEIsQ0FBckMsRUFBNkQsQ0FBN0Q7QUFBZ0UsSUFBSWdGLFNBQUo7QUFBY3RGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUM4QyxVQUFRN0MsQ0FBUixFQUFVO0FBQUNnRixnQkFBVWhGLENBQVY7QUFBWTs7QUFBeEIsQ0FBdkMsRUFBaUUsQ0FBakU7QUFBb0UsSUFBSWtGLFNBQUo7QUFBY3hGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUM4QyxVQUFRN0MsQ0FBUixFQUFVO0FBQUNrRixnQkFBVWxGLENBQVY7QUFBWTs7QUFBeEIsQ0FBdkMsRUFBaUUsQ0FBakU7QUFTcmlCLE1BQU1PLFdBQVc7QUFDYnVDLGNBRGE7QUFFYmMsd0JBRmE7QUFHYlcsZUFIYTtBQUliTyxTQUphO0FBS2JFLFdBTGE7QUFNYkU7QUFOYSxDQUFqQjtBQVNBdEYsS0FBS1csUUFBTCxHQUFnQkEsUUFBaEIsQzs7Ozs7Ozs7Ozs7QUNsQkEsSUFBSVgsSUFBSjtBQUFTRixPQUFPSSxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDSCxPQUFLSSxDQUFMLEVBQU87QUFBQ0osV0FBS0ksQ0FBTDtBQUFPOztBQUFoQixDQUF6QyxFQUEyRCxDQUEzRDtBQUVULE1BQU1vRixpQkFBaUIsSUFBdkIsQyxDQUVBO0FBQ0E7O0FBRUF4RixLQUFLTyxLQUFMLENBQVdrRixXQUFYLEdBQXlCLFVBQVNDLElBQVQsRUFBZTtBQUN0QztBQUNBLE1BQUlDLGVBQWUsR0FBbkI7QUFFQSxRQUFNRixjQUFjeEYsT0FBT3dGLFdBQVAsRUFBcEI7QUFDQSxRQUFNRyxtQkFBbUJILFlBQVlwRCxLQUFaLENBQWtCLEdBQWxCLENBQXpCOztBQUVBLE1BQUl1RCxpQkFBaUJyRCxNQUFqQixHQUEwQixDQUE5QixFQUFpQztBQUMvQixVQUFNc0QscUJBQXFCSixZQUFZVCxPQUFaLENBQW9CWSxpQkFBaUIsQ0FBakIsQ0FBcEIsQ0FBM0I7QUFDQUQsb0JBQWdCRixZQUFZSyxTQUFaLENBQXNCRCxrQkFBdEIsSUFBNENILElBQTVEO0FBQ0QsR0FIRCxNQUdPO0FBQ0xDLG9CQUFnQkQsSUFBaEI7QUFDRDs7QUFFRCxTQUFPQyxhQUFhSSxPQUFiLENBQXFCLFFBQXJCLEVBQStCLEdBQS9CLENBQVA7QUFDRCxDQWZEOztBQWlCQSxJQUFJUCxjQUFKLEVBQW9CO0FBQ2xCO0FBQ0F4RixPQUFLTyxLQUFMLENBQVdrRixXQUFYLEdBQXlCLFVBQVNDLElBQVQsRUFBZTtBQUN0QyxRQUFJTSxZQUFZQyxRQUFRQyxHQUFSLENBQVksWUFBWixDQUFoQjs7QUFFQSxRQUFJUixLQUFLLENBQUwsTUFBWSxHQUFoQixFQUFxQjtBQUNuQixhQUFRLEdBQUVNLFNBQVUsR0FBRU4sSUFBSyxFQUEzQjtBQUNEOztBQUVELFdBQVEsR0FBRU0sU0FBVSxJQUFHTixJQUFLLEVBQTVCO0FBQ0QsR0FSRDtBQVNELEM7Ozs7Ozs7Ozs7O0FDbkNENUYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYjtBQUF1Q0wsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFOzs7Ozs7Ozs7OztBQ0F2QyxJQUFJSCxJQUFKO0FBQVNGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVBQXlDO0FBQUNILE9BQUtJLENBQUwsRUFBTztBQUFDSixXQUFLSSxDQUFMO0FBQU87O0FBQWhCLENBQXpDLEVBQTJELENBQTNEOztBQUVULE1BQU0rRixVQUFOLENBQWlCO0FBRWI7Ozs7Ozs7OztBQVNBLFNBQU9DLEdBQVAsQ0FBV3RFLE1BQVgsRUFBbUI0RCxJQUFuQixFQUF5QmpFLEtBQXpCLEVBQWdDO0FBRTVCLFFBQUk0RSxhQUFhRixXQUFXRyxpQkFBWCxDQUE2QlosSUFBN0IsQ0FBakI7QUFBQSxRQUNJbkQsU0FBUzhELGVBQWUsSUFBZixHQUFzQkEsV0FBVzlELE1BQWpDLEdBQTBDLENBRHZEO0FBQUEsUUFFSWdFLFNBQVMsS0FGYjs7QUFJQSxRQUFJaEUsU0FBUyxDQUFULElBQWM0RCxXQUFXSyxhQUFYLENBQXlCMUUsTUFBekIsQ0FBbEIsRUFBb0Q7QUFFaEQsVUFBSTZCLElBQUksQ0FBUjtBQUFBLFVBQ0k4QyxPQUFPbEUsU0FBUyxDQURwQjtBQUFBLFVBRUlELGdCQUFnQlIsTUFGcEI7O0FBSUEsYUFBTzZCLElBQUk4QyxJQUFYLEVBQWlCO0FBRWIsWUFBSUMsUUFBUUwsV0FBVzFDLENBQVgsQ0FBWjs7QUFFQSxZQUFJK0MsU0FBU3BFLGFBQWIsRUFBNEI7QUFDeEIsY0FBSSxDQUFDNkQsV0FBV0ssYUFBWCxDQUF5QmxFLGNBQWNvRSxLQUFkLENBQXpCLENBQUwsRUFBcUQ7QUFDakQ7QUFDSDtBQUNKLFNBSkQsTUFJTztBQUNIcEUsd0JBQWNvRSxLQUFkLElBQXVCLEVBQXZCO0FBQ0g7O0FBRURwRSx3QkFBZ0JBLGNBQWNvRSxLQUFkLENBQWhCO0FBQ0EvQztBQUVIOztBQUVELFVBQUlBLE1BQU04QyxJQUFWLEVBQWdCO0FBQ1puRSxzQkFBYytELFdBQVdJLElBQVgsQ0FBZCxJQUFrQ2hGLEtBQWxDO0FBQ0E4RSxpQkFBUyxJQUFUO0FBQ0g7QUFFSjs7QUFFRCxXQUFPQSxNQUFQO0FBRUg7QUFFRDs7Ozs7Ozs7O0FBT0EsU0FBT0wsR0FBUCxDQUFXcEUsTUFBWCxFQUFtQjRELElBQW5CLEVBQXlCO0FBRXJCLFFBQUlpQixLQUFKO0FBQUEsUUFBVztBQUNQTixpQkFBYUYsV0FBV0csaUJBQVgsQ0FBNkJaLElBQTdCLENBRGpCO0FBQUEsUUFFSW5ELFNBQVM4RCxlQUFlLElBQWYsR0FBc0JBLFdBQVc5RCxNQUFqQyxHQUEwQyxDQUZ2RDs7QUFJQSxRQUFJQSxTQUFTLENBQVQsSUFBYzRELFdBQVdLLGFBQVgsQ0FBeUIxRSxNQUF6QixDQUFsQixFQUFvRDtBQUVoRCxVQUFJNkIsSUFBSSxDQUFSO0FBQUEsVUFDSThDLE9BQU9sRSxTQUFTLENBRHBCO0FBQUEsVUFFSUQsZ0JBQWdCUixNQUZwQjs7QUFJQSxhQUFPNkIsSUFBSThDLElBQVgsRUFBaUI7QUFFYixZQUFJQyxRQUFRTCxXQUFXMUMsQ0FBWCxDQUFaO0FBRUEsY0FBTWlELFVBQVVULFdBQVdLLGFBQVgsQ0FBeUJsRSxjQUFjb0UsS0FBZCxDQUF6QixDQUFoQjs7QUFDQSxZQUFJQSxTQUFTcEUsYUFBVCxJQUEwQnNFLE9BQTlCLEVBQXVDO0FBQ25DdEUsMEJBQWdCQSxjQUFjb0UsS0FBZCxDQUFoQjtBQUNBL0M7QUFDSCxTQUhELE1BR087QUFDSDtBQUNIO0FBRUo7O0FBRUQsVUFBSUEsTUFBTThDLElBQU4sSUFBY0osV0FBV0ksSUFBWCxLQUFvQm5FLGFBQXRDLEVBQXFEO0FBQ2pEcUUsZ0JBQVFyRSxjQUFjK0QsV0FBV0ksSUFBWCxDQUFkLENBQVI7QUFDSDtBQUVKOztBQUVELFdBQU9FLEtBQVA7QUFFSDtBQUVEOzs7Ozs7O0FBS0EsU0FBT0gsYUFBUCxDQUFxQjFFLE1BQXJCLEVBQTZCO0FBQ3pCLFdBQ0ksT0FBT0EsTUFBUCxLQUFrQixRQUFsQixJQUNBQSxXQUFXLElBRFgsSUFFQUEsa0JBQWtCK0UsTUFIdEI7QUFLSDs7QUFFRCxTQUFPUCxpQkFBUCxDQUF5QlosSUFBekIsRUFBK0I7QUFDM0IsV0FBUSxPQUFPQSxJQUFQLEtBQWdCLFFBQWhCLEdBQTJCQSxLQUFLckQsS0FBTCxDQUFXLEdBQVgsQ0FBM0IsR0FBNkMsSUFBckQ7QUFDSDs7QUE3R1k7O0FBaUhqQnJDLEtBQUtPLEtBQUwsQ0FBVzRGLFVBQVgsR0FBd0JBLFVBQXhCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL29oaWZfY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG4vKlxuICogRGVmaW5lcyB0aGUgYmFzZSBPSElGIG9iamVjdFxuICovXG5cbmNvbnN0IE9ISUYgPSB7XG4gICAgbG9nOiB7fSxcbiAgICB1aToge30sXG4gICAgdXRpbHM6IHt9LFxuICAgIHZpZXdlcjoge30sXG4gICAgY29ybmVyc3RvbmU6IHt9LFxuICAgIHVzZXI6IHt9LFxuICAgIERJQ09NV2ViOiB7fSwgLy8gVGVtcG9yYXJpbHkgYWRkZWRcbn07XG5cbi8vIEV4cG9zZSB0aGUgT0hJRiBvYmplY3QgdG8gdGhlIGNsaWVudCBpZiBpdCBpcyBvbiBkZXZlbG9wbWVudCBtb2RlXG4vLyBAVE9ETzogcmVtb3ZlIHRoaXMgYWZ0ZXIgYXBwbHlpbmcgbmFtZXNwYWNlIHRvIHRoaXMgcGFja2FnZVxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgIHdpbmRvdy5PSElGID0gT0hJRjtcbn1cblxuZXhwb3J0IHsgT0hJRiB9O1xuIiwiaW1wb3J0ICcuL2xpYic7XG5pbXBvcnQgJy4vdXRpbHMnO1xuXG5pbXBvcnQgJy4vc2NoZW1hLmpzJztcbiIsImltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cbi8qXG4gRXh0ZW5kIHRoZSBhdmFpbGFibGUgb3B0aW9ucyBvbiBzY2hlbWEgZGVmaW5pdGlvbnM6XG5cbiAgKiB2YWx1ZXNMYWJlbHM6IFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBhbGxvd2VkVmFsdWVzIHRvIGRlZmluZSB0aGUgdGV4dFxuICAgIGxhYmVsIGZvciBlYWNoIHZhbHVlICh1c2VkIG9uIGZvcm1zKVxuXG4gICogdGV4dE9wdGlvbmFsOiBVc2VkIHRvIGFsbG93IGVtcHR5IHN0cmluZ3NcblxuICovXG5TaW1wbGVTY2hlbWEuZXh0ZW5kT3B0aW9ucyh7XG4gICAgdmFsdWVzTGFiZWxzOiBNYXRjaC5PcHRpb25hbChbU3RyaW5nXSksXG4gICAgdGV4dE9wdGlvbmFsOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKVxufSk7XG5cbi8vIEFkZCBkZWZhdWx0IHJlcXVpcmVkIHZhbGlkYXRpb24gZm9yIGVtcHR5IHN0cmluZ3Mgd2hpY2ggY2FuIGJlIGJ5cGFzc2VkXG4vLyB1c2luZyB0ZXh0T3B0aW9uYWw9dHJ1ZSBkZWZpbml0aW9uXG5TaW1wbGVTY2hlbWEuYWRkVmFsaWRhdG9yKGZ1bmN0aW9uKCkge1xuICAgIGlmIChcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uLm9wdGlvbmFsICE9PSB0cnVlICYmXG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbi50ZXh0T3B0aW9uYWwgIT09IHRydWUgJiZcbiAgICAgICAgdGhpcy52YWx1ZSA9PT0gJydcbiAgICApIHtcbiAgICAgICAgcmV0dXJuICdyZXF1aXJlZCc7XG4gICAgfVxufSk7XG5cbi8vIEluY2x1ZGluZyBbbGFiZWxdIGZvciBzb21lIG1lc3NhZ2VzXG5TaW1wbGVTY2hlbWEubWVzc2FnZXMoe1xuICAgIG1heENvdW50OiAnW2xhYmVsXSBjYW4gbm90IGhhdmUgbW9yZSB0aGFuIFttYXhDb3VudF0gdmFsdWVzJyxcbiAgICBtaW5Db3VudDogJ1tsYWJlbF0gbXVzdCBoYXZlIGF0IGxlYXN0IFttaW5Db3VudF0gdmFsdWVzJyxcbiAgICBub3RBbGxvd2VkOiAnW2xhYmVsXSBoYXMgYW4gaW52YWxpZCB2YWx1ZTogXCJbdmFsdWVdXCInXG59KTtcbiIsImltcG9ydCAnLi9vYmplY3QuanMnO1xuaW1wb3J0ICcuL0RJQ09NV2ViLyc7XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5cbk9ISUYub2JqZWN0ID0ge307XG5cbi8vIFRyYW5zZm9ybXMgYSBzaGFsbG93IG9iamVjdCB3aXRoIGtleXMgc2VwYXJhdGVkIGJ5IFwiLlwiIGludG8gYSBuZXN0ZWQgb2JqZWN0XG5PSElGLm9iamVjdC5nZXROZXN0ZWRPYmplY3QgPSBzaGFsbG93T2JqZWN0ID0+IHtcbiAgICBjb25zdCBuZXN0ZWRPYmplY3QgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgaW4gc2hhbGxvd09iamVjdCkge1xuICAgICAgICBpZiAoIXNoYWxsb3dPYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gc2hhbGxvd09iamVjdFtrZXldO1xuICAgICAgICBjb25zdCBwcm9wZXJ0eUFycmF5ID0ga2V5LnNwbGl0KCcuJyk7XG4gICAgICAgIGxldCBjdXJyZW50T2JqZWN0ID0gbmVzdGVkT2JqZWN0O1xuICAgICAgICB3aGlsZSAocHJvcGVydHlBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRQcm9wZXJ0eSA9IHByb3BlcnR5QXJyYXkuc2hpZnQoKTtcbiAgICAgICAgICAgIGlmICghcHJvcGVydHlBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0W2N1cnJlbnRQcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50T2JqZWN0W2N1cnJlbnRQcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE9iamVjdFtjdXJyZW50UHJvcGVydHldID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudE9iamVjdCA9IGN1cnJlbnRPYmplY3RbY3VycmVudFByb3BlcnR5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXN0ZWRPYmplY3Q7XG59O1xuXG4vLyBUcmFuc2Zvcm1zIGEgbmVzdGVkIG9iamVjdCBpbnRvIGEgc2hhbGxvd09iamVjdCBtZXJnaW5nIGl0cyBrZXlzIHdpdGggXCIuXCIgY2hhcmFjdGVyXG5PSElGLm9iamVjdC5nZXRTaGFsbG93T2JqZWN0ID0gbmVzdGVkT2JqZWN0ID0+IHtcbiAgICBjb25zdCBzaGFsbG93T2JqZWN0ID0ge307XG4gICAgY29uc3QgcHV0VmFsdWVzID0gKGJhc2VLZXksIG5lc3RlZE9iamVjdCwgcmVzdWx0T2JqZWN0KSA9PiB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBuZXN0ZWRPYmplY3QpIHtcbiAgICAgICAgICAgIGlmICghbmVzdGVkT2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRLZXkgPSBiYXNlS2V5ID8gYCR7YmFzZUtleX0uJHtrZXl9YCA6IGtleTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IG5lc3RlZE9iamVjdFtrZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50VmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRLZXkgKz0gJ1tdJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwdXRWYWx1ZXMoY3VycmVudEtleSwgY3VycmVudFZhbHVlLCByZXN1bHRPYmplY3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRPYmplY3RbY3VycmVudEtleV0gPSBjdXJyZW50VmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHV0VmFsdWVzKCcnLCBuZXN0ZWRPYmplY3QsIHNoYWxsb3dPYmplY3QpO1xuICAgIHJldHVybiBzaGFsbG93T2JqZWN0O1xufTtcbiIsIi8qKlxuICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGVsZW1lbnQgYXMgYSBkaWNvbSBhdHRyaWJ1dGUgZ3JvdXAvZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAtIFRoZSBncm91cC9lbGVtZW50IG9mIHRoZSBlbGVtZW50IChlLmcuICcwMDI4MDAwOScpXG4gKiBAcGFyYW0gW2RlZmF1bHRWYWx1ZV0gLSBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBlbGVtZW50IGlzIG5vdCBwcmVzZW50XG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0QXR0cmlidXRlKGVsZW1lbnQsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBWYWx1ZSBpcyBub3QgcHJlc2VudCBpZiB0aGUgYXR0cmlidXRlIGhhcyBhIHplcm8gbGVuZ3RoIHZhbHVlXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFNhbml0eSBjaGVjayB0byBtYWtlIHN1cmUgd2UgaGF2ZSBhdCBsZWFzdCBvbmUgZW50cnkgaW4gdGhlIGFycmF5LlxuICAgIGlmICghZWxlbWVudC5WYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udmVydFRvSW50KGVsZW1lbnQuVmFsdWUpO1xufTtcblxuZnVuY3Rpb24gY29udmVydFRvSW50KGlucHV0KSB7XG4gICAgZnVuY3Rpb24gcGFkRm91cihpbnB1dCkge1xuICAgICAgICB2YXIgbCA9IGlucHV0Lmxlbmd0aDtcblxuICAgICAgICBpZiAobCA9PSAwKSByZXR1cm4gJzAwMDAnO1xuICAgICAgICBpZiAobCA9PSAxKSByZXR1cm4gJzAwMCcgKyBpbnB1dDtcbiAgICAgICAgaWYgKGwgPT0gMikgcmV0dXJuICcwMCcgKyBpbnB1dDtcbiAgICAgICAgaWYgKGwgPT0gMykgcmV0dXJuICcwJyArIGlucHV0O1xuXG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICB2YXIgb3V0cHV0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGlucHV0W2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBvdXRwdXQgKz0gcGFkRm91cihpbnB1dFtpXS5jaGFyQ29kZUF0KGopLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VJbnQob3V0cHV0LCAxNik7XG59XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBidG9hIH0gZnJvbSAnaXNvbW9ycGhpYy1iYXNlNjQnO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIEF1dGhvcml6YXRpb24gaGVhZGVyIGFzIHBhcnQgb2YgYW4gT2JqZWN0LlxuICpcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldEF1dGhvcml6YXRpb25IZWFkZXIoKSB7XG4gICAgY29uc3QgaGVhZGVycyA9IHt9O1xuXG4gICAgLy8gQ2hlY2sgZm9yIE9ISUYudXNlciBzaW5jZSB0aGlzIGNhbiBhbHNvIGJlIHJ1biBvbiB0aGUgc2VydmVyXG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBPSElGLnVzZXIgJiYgT0hJRi51c2VyLmdldEFjY2Vzc1Rva2VuICYmIE9ISUYudXNlci5nZXRBY2Nlc3NUb2tlbigpO1xuICAgIGNvbnN0IHNlcnZlciA9IE9ISUYuc2VydmVycy5nZXRDdXJyZW50U2VydmVyKCk7XG5cbiAgICBpZiAoc2VydmVyICYmXG4gICAgICAgIHNlcnZlci5yZXF1ZXN0T3B0aW9ucyAmJlxuICAgICAgICBzZXJ2ZXIucmVxdWVzdE9wdGlvbnMuYXV0aCkge1xuICAgICAgICAvLyBIVFRQIEJhc2ljIEF1dGggKHVzZXI6cGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IGBCYXNpYyAke2J0b2Eoc2VydmVyLnJlcXVlc3RPcHRpb25zLmF1dGgpfWA7XG4gICAgfSBlbHNlIGlmIChhY2Nlc3NUb2tlbikge1xuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSBgQmVhcmVyICR7YWNjZXNzVG9rZW59YDtcbiAgICB9XG5cbiAgICByZXR1cm4gaGVhZGVycztcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldE1vZGFsaXRpZXMobW9kYWxpdHksIG1vZGFsaXRpZXNJblN0dWR5KSB7XG4gICAgdmFyIG1vZGFsaXRpZXMgPSB7fTtcbiAgICBpZiAobW9kYWxpdHkpIHtcbiAgICAgICAgbW9kYWxpdGllcyA9IG1vZGFsaXR5O1xuICAgIH1cblxuICAgIGlmIChtb2RhbGl0aWVzSW5TdHVkeSkge1xuICAgICAgICAvLyBGaW5kIHZyIGluIG1vZGFsaXRpZXNcbiAgICAgICAgaWYgKG1vZGFsaXRpZXMudnIgJiYgbW9kYWxpdGllcy52ciA9PT0gbW9kYWxpdGllc0luU3R1ZHkudnIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kYWxpdGllc0luU3R1ZHkuVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBtb2RhbGl0aWVzSW5TdHVkeS5WYWx1ZVtpXTtcbiAgICAgICAgICAgICAgICBpZiAobW9kYWxpdGllcy5WYWx1ZS5pbmRleE9mKHZhbHVlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kYWxpdGllcy5WYWx1ZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2RhbGl0aWVzID0gbW9kYWxpdGllc0luU3R1ZHk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1vZGFsaXRpZXM7XG59O1xuIiwiLyoqXG4gKiBSZXR1cm5zIHRoZSBBbHBoYWJldGljIHZlcnNpb24gb2YgYSBQTlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IC0gVGhlIGdyb3VwL2VsZW1lbnQgb2YgdGhlIGVsZW1lbnQgKGUuZy4gJzAwMjAwMDEzJylcbiAqIEBwYXJhbSBbZGVmYXVsdFZhbHVlXSAtIFRoZSBkZWZhdWx0IHZhbHVlIHRvIHJldHVybiBpZiB0aGUgZWxlbWVudCBpcyBub3QgZm91bmRcbiAqIEByZXR1cm5zIHsqfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXROYW1lKGVsZW1lbnQsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBWYWx1ZSBpcyBub3QgcHJlc2VudCBpZiB0aGUgYXR0cmlidXRlIGhhcyBhIHplcm8gbGVuZ3RoIHZhbHVlXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFNhbml0eSBjaGVjayB0byBtYWtlIHN1cmUgd2UgaGF2ZSBhdCBsZWFzdCBvbmUgZW50cnkgaW4gdGhlIGFycmF5LlxuICAgIGlmICghZWxlbWVudC5WYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gUmV0dXJuIHRoZSBBbHBoYWJldGljIGNvbXBvbmVudCBncm91cFxuICAgIGlmIChlbGVtZW50LlZhbHVlWzBdLkFscGhhYmV0aWMpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuVmFsdWVbMF0uQWxwaGFiZXRpYztcbiAgICB9XG4gICAgLy8gT3J0aGFuYyBkb2VzIG5vdCByZXR1cm4gUE4gcHJvcGVybHkgc28gdGhpcyBpcyBhIHRlbXBvcmFyeSB3b3JrYXJvdW5kXG4gICAgcmV0dXJuIGVsZW1lbnQuVmFsdWVbMF07XG59O1xuIiwiLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBzdHJpbmcgdmFsdWUgYXMgYSBKYXZhc2NyaXB0IE51bWJlclxuICogQHBhcmFtIGVsZW1lbnQgLSBUaGUgZ3JvdXAvZWxlbWVudCBvZiB0aGUgZWxlbWVudCAoZS5nLiAnMDAyMDAwMTMnKVxuICogQHBhcmFtIFtkZWZhdWx0VmFsdWVdIC0gVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBlbGVtZW50IGRvZXMgbm90IGV4aXN0XG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0TnVtYmVyKGVsZW1lbnQsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBWYWx1ZSBpcyBub3QgcHJlc2VudCBpZiB0aGUgYXR0cmlidXRlIGhhcyBhIHplcm8gbGVuZ3RoIHZhbHVlXG4gICAgaWYgKCFlbGVtZW50LlZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIFNhbml0eSBjaGVjayB0byBtYWtlIHN1cmUgd2UgaGF2ZSBhdCBsZWFzdCBvbmUgZW50cnkgaW4gdGhlIGFycmF5LlxuICAgIGlmICghZWxlbWVudC5WYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VGbG9hdChlbGVtZW50LlZhbHVlWzBdKTtcbn07XG4iLCIvKipcbiAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBlbGVtZW50IGFzIGEgc3RyaW5nLiAgTXVsdGktdmFsdWVkIGVsZW1lbnRzIHdpbGwgYmUgc2VwYXJhdGVkIGJ5IGEgYmFja3NsYXNoXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgLSBUaGUgZ3JvdXAvZWxlbWVudCBvZiB0aGUgZWxlbWVudCAoZS5nLiAnMDAyMDAwMTMnKVxuICogQHBhcmFtIFtkZWZhdWx0VmFsdWVdIC0gVGhlIHZhbHVlIHRvIHJldHVybiBpZiB0aGUgZWxlbWVudCBpcyBub3QgcHJlc2VudFxuICogQHJldHVybnMgeyp9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldFN0cmluZyhlbGVtZW50LCBkZWZhdWx0VmFsdWUpIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLy8gVmFsdWUgaXMgbm90IHByZXNlbnQgaWYgdGhlIGF0dHJpYnV0ZSBoYXMgYSB6ZXJvIGxlbmd0aCB2YWx1ZVxuICAgIGlmICghZWxlbWVudC5WYWx1ZSkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICAvLyBTYW5pdHkgY2hlY2sgdG8gbWFrZSBzdXJlIHdlIGhhdmUgYXQgbGVhc3Qgb25lIGVudHJ5IGluIHRoZSBhcnJheS5cbiAgICBpZiAoIWVsZW1lbnQuVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIC8vIEpvaW4gdGhlIGFycmF5IHRvZ2V0aGVyIHNlcGFyYXRlZCBieSBiYWNrc2xhc2hcbiAgICAvLyBOT1RFOiBPcnRoYW5jIGRvZXMgbm90IGNvcnJlY3RseSBzcGxpdCB2YWx1ZXMgaW50byBhbiBhcnJheSBzbyB0aGUgam9pbiBpcyBhIG5vLW9wXG4gICAgcmV0dXJuIGVsZW1lbnQuVmFsdWUuam9pbignXFxcXCcpO1xufTtcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuaW1wb3J0IGdldEF0dHJpYnV0ZSBmcm9tICcuL2dldEF0dHJpYnV0ZS5qcyc7XG5pbXBvcnQgZ2V0QXV0aG9yaXphdGlvbkhlYWRlciBmcm9tICcuL2dldEF1dGhvcml6YXRpb25IZWFkZXIuanMnO1xuaW1wb3J0IGdldE1vZGFsaXRpZXMgZnJvbSAnLi9nZXRNb2RhbGl0aWVzLmpzJztcbmltcG9ydCBnZXROYW1lIGZyb20gJy4vZ2V0TmFtZS5qcyc7XG5pbXBvcnQgZ2V0TnVtYmVyIGZyb20gJy4vZ2V0TnVtYmVyLmpzJztcbmltcG9ydCBnZXRTdHJpbmcgZnJvbSAnLi9nZXRTdHJpbmcuanMnO1xuXG5jb25zdCBESUNPTVdlYiA9IHtcbiAgICBnZXRBdHRyaWJ1dGUsXG4gICAgZ2V0QXV0aG9yaXphdGlvbkhlYWRlcixcbiAgICBnZXRNb2RhbGl0aWVzLFxuICAgIGdldE5hbWUsXG4gICAgZ2V0TnVtYmVyLFxuICAgIGdldFN0cmluZyxcbn07XG5cbk9ISUYuRElDT01XZWIgPSBESUNPTVdlYjtcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tIFwibWV0ZW9yL29oaWY6Y29yZVwiO1xuXG5jb25zdCBwcm9kdWN0aW9uTW9kZSA9IHRydWU7XG5cbi8vIFJldHVybiBhbiBhYnNvbHV0ZSBVUkwgd2l0aCB0aGUgcGFnZSBkb21haW4gdXNpbmcgc3ViIHBhdGggb2YgUk9PVF9VUkxcbi8vIHRvIGxldCBtdWx0aXBsZSBkb21haW5zIGRpcmVjdGVkIHRvIHRoZSBzYW1lIHNlcnZlciB3b3JrXG5cbk9ISUYudXRpbHMuYWJzb2x1dGVVcmwgPSBmdW5jdGlvbihwYXRoKSB7XG4gIC8vIEZvciBsb2NhbCB0ZXN0aW5nLlxuICBsZXQgYWJzb2x1dGVQYXRoID0gXCIvXCI7XG5cbiAgY29uc3QgYWJzb2x1dGVVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKTtcbiAgY29uc3QgYWJzb2x1dGVVcmxQYXJ0cyA9IGFic29sdXRlVXJsLnNwbGl0KFwiL1wiKTtcblxuICBpZiAoYWJzb2x1dGVVcmxQYXJ0cy5sZW5ndGggPiA0KSB7XG4gICAgY29uc3Qgcm9vdFVybFByZWZpeEluZGV4ID0gYWJzb2x1dGVVcmwuaW5kZXhPZihhYnNvbHV0ZVVybFBhcnRzWzNdKTtcbiAgICBhYnNvbHV0ZVBhdGggKz0gYWJzb2x1dGVVcmwuc3Vic3RyaW5nKHJvb3RVcmxQcmVmaXhJbmRleCkgKyBwYXRoO1xuICB9IGVsc2Uge1xuICAgIGFic29sdXRlUGF0aCArPSBwYXRoO1xuICB9XG5cbiAgcmV0dXJuIGFic29sdXRlUGF0aC5yZXBsYWNlKC9cXC9cXC8rL2csIFwiL1wiKTtcbn07XG5cbmlmIChwcm9kdWN0aW9uTW9kZSkge1xuICAvLyBKUEVUVFMgLS0gT3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiBpbiBYTkFUIGVudmlvcm5tZW50IGluIG9yZGVyIHRvIGRpc3BsYXkgY29ycmVjdGx5IHdoZW4gaG9zdGVkIGF0IGFuIGFyYml0cmFyeSBzdWJkaXJlY3RvcnkgaW4gWE5BVC5cbiAgT0hJRi51dGlscy5hYnNvbHV0ZVVybCA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBsZXQgdmlld2VyVXJsID0gU2Vzc2lvbi5nZXQoXCJ2aWV3ZXJSb290XCIpO1xuXG4gICAgaWYgKHBhdGhbMF0gPT09IFwiL1wiKSB7XG4gICAgICByZXR1cm4gYCR7dmlld2VyVXJsfSR7cGF0aH1gO1xuICAgIH1cblxuICAgIHJldHVybiBgJHt2aWV3ZXJVcmx9LyR7cGF0aH1gO1xuICB9O1xufVxuIiwiaW1wb3J0ICcuL2Fic29sdXRlVXJsJztcbmltcG9ydCAnLi9vYmplY3RQYXRoJztcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuY2xhc3MgT2JqZWN0UGF0aCB7XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYW4gb2JqZWN0IHByb3BlcnR5IGJhc2VkIG9uIFwicGF0aFwiIChuYW1lc3BhY2UpIHN1cHBsaWVkIGNyZWF0aW5nXG4gICAgICogLi4uIGludGVybWVkaWFyeSBvYmplY3RzIGlmIHRoZXkgZG8gbm90IGV4aXN0LlxuICAgICAqIEBwYXJhbSBvYmplY3Qge09iamVjdH0gQW4gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0aWVzIHNwZWNpZmllZCBvbiBwYXRoIHNob3VsZCBiZSBzZXQuXG4gICAgICogQHBhcmFtIHBhdGgge1N0cmluZ30gQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcm9wZXJ0eSB0byBiZSBzZXQsIGUuZy4gXCJ1c2VyLnN0dWR5LnNlcmllcy50aW1lcG9pbnRcIi5cbiAgICAgKiBAcGFyYW0gdmFsdWUge0FueX0gVGhlIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSB0aGF0IHdpbGwgYmUgc2V0LlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgXCJ0cnVlXCIgb24gc3VjY2VzcywgXCJmYWxzZVwiIGlmIGFueSBpbnRlcm1lZGlhdGUgY29tcG9uZW50IG9mIHRoZSBzdXBwbGllZCBwYXRoXG4gICAgICogLi4uIGlzIG5vdCBhIHZhbGlkIE9iamVjdCwgaW4gd2hpY2ggY2FzZSB0aGUgcHJvcGVydHkgY2Fubm90IGJlIHNldC4gTm8gZXhjcGV0aW9ucyBhcmUgdGhyb3duLlxuICAgICAqL1xuICAgIHN0YXRpYyBzZXQob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuXG4gICAgICAgIGxldCBjb21wb25lbnRzID0gT2JqZWN0UGF0aC5nZXRQYXRoQ29tcG9uZW50cyhwYXRoKSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbXBvbmVudHMgIT09IG51bGwgPyBjb21wb25lbnRzLmxlbmd0aCA6IDAsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcblxuICAgICAgICBpZiAobGVuZ3RoID4gMCAmJiBPYmplY3RQYXRoLmlzVmFsaWRPYmplY3Qob2JqZWN0KSkge1xuXG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGFzdCA9IGxlbmd0aCAtIDEsXG4gICAgICAgICAgICAgICAgY3VycmVudE9iamVjdCA9IG9iamVjdDtcblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBsYXN0KSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBjb21wb25lbnRzW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkIGluIGN1cnJlbnRPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFPYmplY3RQYXRoLmlzVmFsaWRPYmplY3QoY3VycmVudE9iamVjdFtmaWVsZF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3RbZmllbGRdID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudE9iamVjdCA9IGN1cnJlbnRPYmplY3RbZmllbGRdO1xuICAgICAgICAgICAgICAgIGkrKztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaSA9PT0gbGFzdCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmplY3RbY29tcG9uZW50c1tsYXN0XV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIG9iamVjdCBwcm9wZXJ0eSBiYXNlZCBvbiBcInBhdGhcIiAobmFtZXNwYWNlKSBzdXBwbGllZCB0cmF2ZXJzaW5nIHRoZSBvYmplY3RcbiAgICAgKiAuLi4gdHJlZSBhcyBuZWNlc3NhcnkuXG4gICAgICogQHBhcmFtIG9iamVjdCB7T2JqZWN0fSBBbiBvYmplY3Qgd2hlcmUgdGhlIHByb3BlcnRpZXMgc3BlY2lmaWVkIG1pZ2h0IGV4aXN0LlxuICAgICAqIEBwYXJhbSBwYXRoIHtTdHJpbmd9IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJvcGVydHkgdG8gYmUgc2VhcmNoZWQgZm9yLCBlLmcuIFwidXNlci5zdHVkeS5zZXJpZXMudGltZXBvaW50XCIuXG4gICAgICogQHJldHVybiB7QW55fSBUaGUgdmFsdWUgb2YgdGhlIHByb3BlcnR5IGlmIGZvdW5kLiBCeSBkZWZhdWx0LCByZXR1cm5zIHRoZSBzcGVjaWFsIHR5cGUgXCJ1bmRlZmluZWRcIi5cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0KG9iamVjdCwgcGF0aCkge1xuXG4gICAgICAgIGxldCBmb3VuZCwgLy8gdW5kZWZpbmVkIGJ5IGRlZmF1bHRcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBPYmplY3RQYXRoLmdldFBhdGhDb21wb25lbnRzKHBhdGgpLFxuICAgICAgICAgICAgbGVuZ3RoID0gY29tcG9uZW50cyAhPT0gbnVsbCA/IGNvbXBvbmVudHMubGVuZ3RoIDogMDtcblxuICAgICAgICBpZiAobGVuZ3RoID4gMCAmJiBPYmplY3RQYXRoLmlzVmFsaWRPYmplY3Qob2JqZWN0KSkge1xuXG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGFzdCA9IGxlbmd0aCAtIDEsXG4gICAgICAgICAgICAgICAgY3VycmVudE9iamVjdCA9IG9iamVjdDtcblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBsYXN0KSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBjb21wb25lbnRzW2ldO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaXNWYWxpZCA9IE9iamVjdFBhdGguaXNWYWxpZE9iamVjdChjdXJyZW50T2JqZWN0W2ZpZWxkXSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkIGluIGN1cnJlbnRPYmplY3QgJiYgaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50T2JqZWN0ID0gY3VycmVudE9iamVjdFtmaWVsZF07XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGkgPT09IGxhc3QgJiYgY29tcG9uZW50c1tsYXN0XSBpbiBjdXJyZW50T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBjdXJyZW50T2JqZWN0W2NvbXBvbmVudHNbbGFzdF1dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm91bmQ7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgc3VwcGxpZWQgYXJndW1lbnQgaXMgYSByZWFsIEphdmFTY3JpcHQgT2JqZWN0IGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSBvYmplY3Qge0FueX0gVGhlIHN1YmplY3QgdG8gYmUgdGVzdGVkLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgXCJ0cnVlXCIgaWYgdGhlIG9iamVjdCBpcyBhIHJlYWwgT2JqZWN0IGluc3RhbmNlIGFuZCBcImZhbHNlXCIgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHN0YXRpYyBpc1ZhbGlkT2JqZWN0KG9iamVjdCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIG9iamVjdCAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgb2JqZWN0IGluc3RhbmNlb2YgT2JqZWN0XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFBhdGhDb21wb25lbnRzKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuICh0eXBlb2YgcGF0aCA9PT0gJ3N0cmluZycgPyBwYXRoLnNwbGl0KCcuJykgOiBudWxsKTtcbiAgICB9XG5cbn1cblxuT0hJRi51dGlscy5PYmplY3RQYXRoID0gT2JqZWN0UGF0aDtcbiJdfQ==
