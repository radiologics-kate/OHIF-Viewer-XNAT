(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var Iron = Package['iron:core'].Iron;

/* Package-scope variables */
var compilePath, Url;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/clinical_router-url/packages/clinical_router-url.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/clinical:router-url/lib/compiler.js                                                                  //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/*                                                                                                               // 1
Based on https://github.com/pillarjs/path-to-regexp                                                              // 2
                                                                                                                 // 3
The MIT License (MIT)                                                                                            // 4
                                                                                                                 // 5
Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)                                                          // 6
                                                                                                                 // 7
Permission is hereby granted, free of charge, to any person obtaining a copy                                     // 8
of this software and associated documentation files (the "Software"), to deal                                    // 9
in the Software without restriction, including without limitation the rights                                     // 10
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell                                        // 11
copies of the Software, and to permit persons to whom the Software is                                            // 12
furnished to do so, subject to the following conditions:                                                         // 13
                                                                                                                 // 14
The above copyright notice and this permission notice shall be included in                                       // 15
all copies or substantial portions of the Software.                                                              // 16
                                                                                                                 // 17
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR                                       // 18
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,                                         // 19
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE                                      // 20
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER                                           // 21
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,                                    // 22
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN                                        // 23
THE SOFTWARE.                                                                                                    // 24
*/                                                                                                               // 25
                                                                                                                 // 26
var typeOf = function (o) { return Object.prototype.toString.call(o); };                                         // 27
                                                                                                                 // 28
/**                                                                                                              // 29
 * The main path matching regexp utility.                                                                        // 30
 *                                                                                                               // 31
 * @type {RegExp}                                                                                                // 32
 */                                                                                                              // 33
var PATH_REGEXP = new RegExp([                                                                                   // 34
  // Match already escaped characters that would otherwise incorrectly appear                                    // 35
  // in future matches. This allows the user to escape special characters that                                   // 36
  // shouldn't be transformed.                                                                                   // 37
  '(\\\\.)',                                                                                                     // 38
  // Match Express-style parameters and un-named parameters with a prefix                                        // 39
  // and optional suffixes. Matches appear as:                                                                   // 40
  //                                                                                                             // 41
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]                                                     // 42
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]                                       // 43
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',                          // 44
  // Match regexp special characters that should always be escaped.                                              // 45
  '([.+*?=^!:${}()[\\]|\\/])'                                                                                    // 46
].join('|'), 'g');                                                                                               // 47
                                                                                                                 // 48
/**                                                                                                              // 49
 * Escape the capturing group by escaping special characters and meaning.                                        // 50
 *                                                                                                               // 51
 * @param  {String} group                                                                                        // 52
 * @return {String}                                                                                              // 53
 */                                                                                                              // 54
function escapeGroup (group) {                                                                                   // 55
  return group.replace(/([=!:$\/()])/g, '\\$1');                                                                 // 56
}                                                                                                                // 57
                                                                                                                 // 58
/**                                                                                                              // 59
 * Attach the keys as a property of the regexp.                                                                  // 60
 *                                                                                                               // 61
 * @param  {RegExp} re                                                                                           // 62
 * @param  {Array}  keys                                                                                         // 63
 * @return {RegExp}                                                                                              // 64
 */                                                                                                              // 65
var attachKeys = function (re, keys) {                                                                           // 66
  re.keys = keys;                                                                                                // 67
                                                                                                                 // 68
  return re;                                                                                                     // 69
};                                                                                                               // 70
                                                                                                                 // 71
/**                                                                                                              // 72
 * Normalize the given path string, returning a regular expression.                                              // 73
 *                                                                                                               // 74
 * An empty array should be passed in, which will contain the placeholder key                                    // 75
 * names. For example `/user/:id` will then contain `["id"]`.                                                    // 76
 *                                                                                                               // 77
 * @param  {(String|RegExp|Array)} path                                                                          // 78
 * @param  {Array}                 keys                                                                          // 79
 * @param  {Object}                options                                                                       // 80
 * @return {RegExp}                                                                                              // 81
 */                                                                                                              // 82
function pathtoRegexp (path, keys, options) {                                                                    // 83
  if (keys && typeOf(keys) !== '[object Array]') {                                                               // 84
    options = keys;                                                                                              // 85
    keys = null;                                                                                                 // 86
  }                                                                                                              // 87
                                                                                                                 // 88
  keys = keys || [];                                                                                             // 89
  options = options || {};                                                                                       // 90
                                                                                                                 // 91
  var strict = options.strict;                                                                                   // 92
  var end = options.end !== false;                                                                               // 93
  var flags = options.sensitive ? '' : 'i';                                                                      // 94
  var index = 0;                                                                                                 // 95
                                                                                                                 // 96
  if (path instanceof RegExp) {                                                                                  // 97
    // Match all capturing groups of a regexp.                                                                   // 98
    var groups = path.source.match(/\((?!\?)/g) || [];                                                           // 99
                                                                                                                 // 100
    // Map all the matches to their numeric keys and push into the keys.                                         // 101
    keys.push.apply(keys, groups.map(function (match, index) {                                                   // 102
      return {                                                                                                   // 103
        name:      index,                                                                                        // 104
        delimiter: null,                                                                                         // 105
        optional:  false,                                                                                        // 106
        repeat:    false                                                                                         // 107
      };                                                                                                         // 108
    }));                                                                                                         // 109
                                                                                                                 // 110
    // Return the source back to the user.                                                                       // 111
    return attachKeys(path, keys);                                                                               // 112
  }                                                                                                              // 113
                                                                                                                 // 114
  if (typeOf(path) === '[object Array]') {                                                                       // 115
    // Map array parts into regexps and return their source. We also pass                                        // 116
    // the same keys and options instance into every generation to get                                           // 117
    // consistent matching groups before we join the sources together.                                           // 118
    path = path.map(function (value) {                                                                           // 119
      return pathtoRegexp(value, keys, options).source;                                                          // 120
    });                                                                                                          // 121
                                                                                                                 // 122
    // Generate a new regexp instance by joining all the parts together.                                         // 123
    return attachKeys(new RegExp('(?:' + path.join('|') + ')', flags), keys);                                    // 124
  }                                                                                                              // 125
                                                                                                                 // 126
  // Alter the path string into a usable regexp.                                                                 // 127
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {      // 128
    // Avoiding re-escaping escaped characters.                                                                  // 129
    if (escaped) {                                                                                               // 130
      return escaped;                                                                                            // 131
    }                                                                                                            // 132
                                                                                                                 // 133
    // Escape regexp special characters.                                                                         // 134
    if (escape) {                                                                                                // 135
      return '\\' + escape;                                                                                      // 136
    }                                                                                                            // 137
                                                                                                                 // 138
    var repeat   = suffix === '+' || suffix === '*';                                                             // 139
    var optional = suffix === '?' || suffix === '*';                                                             // 140
                                                                                                                 // 141
    keys.push({                                                                                                  // 142
      name:      key || index++,                                                                                 // 143
      delimiter: prefix || '/',                                                                                  // 144
      optional:  optional,                                                                                       // 145
      repeat:    repeat                                                                                          // 146
    });                                                                                                          // 147
                                                                                                                 // 148
    // Escape the prefix character.                                                                              // 149
    prefix = prefix ? '\\' + prefix : '';                                                                        // 150
                                                                                                                 // 151
    // Match using the custom capturing group, or fallback to capturing                                          // 152
    // everything up to the next slash (or next period if the param was                                          // 153
    // prefixed with a period).                                                                                  // 154
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');                                 // 155
                                                                                                                 // 156
    // Allow parameters to be repeated more than once.                                                           // 157
    if (repeat) {                                                                                                // 158
      capture = capture + '(?:' + prefix + capture + ')*';                                                       // 159
    }                                                                                                            // 160
                                                                                                                 // 161
    // Allow a parameter to be optional.                                                                         // 162
    if (optional) {                                                                                              // 163
      return '(?:' + prefix + '(' + capture + '))?';                                                             // 164
    }                                                                                                            // 165
                                                                                                                 // 166
    // Basic parameter support.                                                                                  // 167
    return prefix + '(' + capture + ')';                                                                         // 168
  });                                                                                                            // 169
                                                                                                                 // 170
  // Check whether the path ends in a slash as it alters some match behaviour.                                   // 171
  var endsWithSlash = path[path.length - 1] === '/';                                                             // 172
                                                                                                                 // 173
  // In non-strict mode we allow an optional trailing slash in the match. If                                     // 174
  // the path to match already ended with a slash, we need to remove it for                                      // 175
  // consistency. The slash is only valid at the very end of a path match, not                                   // 176
  // anywhere in the middle. This is important for non-ending mode, otherwise                                    // 177
  // "/test/" will match "/test//route".                                                                         // 178
  if (!strict) {                                                                                                 // 179
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';                                         // 180
  }                                                                                                              // 181
                                                                                                                 // 182
  // In non-ending mode, we need prompt the capturing groups to match as much                                    // 183
  // as possible by using a positive lookahead for the end or next path segment.                                 // 184
  if (!end) {                                                                                                    // 185
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';                                                          // 186
  }                                                                                                              // 187
                                                                                                                 // 188
  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);                                     // 189
};                                                                                                               // 190
                                                                                                                 // 191
compilePath = pathtoRegexp;                                                                                      // 192
                                                                                                                 // 193
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/clinical:router-url/lib/url.js                                                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/*****************************************************************************/                                  // 1
/* Imports */                                                                                                    // 2
/*****************************************************************************/                                  // 3
var warn = Iron.utils.warn;                                                                                      // 4
var assert = Iron.utils.assert;                                                                                  // 5
                                                                                                                 // 6
/*****************************************************************************/                                  // 7
/* Url */                                                                                                        // 8
/*****************************************************************************/                                  // 9
function safeDecodeURIComponent (val) {                                                                          // 10
  try {                                                                                                          // 11
    return decodeURIComponent(val.replace(/\+/g, ' '));                                                          // 12
  } catch (e) {                                                                                                  // 13
    if (e.constructor == URIError) {                                                                             // 14
      warn("Tried to decode an invalid URI component: " + JSON.stringify(val) + " " + e.stack);                  // 15
    }                                                                                                            // 16
                                                                                                                 // 17
    return undefined;                                                                                            // 18
  }                                                                                                              // 19
}                                                                                                                // 20
                                                                                                                 // 21
function safeDecodeURI (val) {                                                                                   // 22
  try {                                                                                                          // 23
    return decodeURI(val.replace(/\+/g, ' '));                                                                   // 24
  } catch (e) {                                                                                                  // 25
    if (e.constructor == URIError) {                                                                             // 26
      warn("Tried to decode an invalid URI: " + JSON.stringify(val) + " " + e.stack);                            // 27
    }                                                                                                            // 28
                                                                                                                 // 29
    return undefined;                                                                                            // 30
  }                                                                                                              // 31
}                                                                                                                // 32
                                                                                                                 // 33
/**                                                                                                              // 34
 * Url utilities and the ability to compile a url into a regular expression.                                     // 35
 */                                                                                                              // 36
Url = function (url, options) {                                                                                  // 37
  options = options || {};                                                                                       // 38
  this.options = options;                                                                                        // 39
  this.keys = [];                                                                                                // 40
  this.regexp = compilePath(url, this.keys, options);                                                            // 41
  this._originalPath = url;                                                                                      // 42
  _.extend(this, Url.parse(url));                                                                                // 43
};                                                                                                               // 44
                                                                                                                 // 45
// We need to have a ROOT URL without the path prefix so we can add ironRouters' routes to it to create          // 46
// nice absolute paths on the server, including the path prefix, but only once, not twice.                       // 47
// We'll store that in Url.ROOT_URL_WITHOUT_PATH_PREFIX.                                                         // 48
var ROOT_URL_WITHOUT_PATH_PREFIX = __meteor_runtime_config__.ROOT_URL;                                           // 49
if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX) {                                                            // 50
  var pos = __meteor_runtime_config__.ROOT_URL.indexOf(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX);          // 51
  if (pos != -1) {                                                                                               // 52
    ROOT_URL_WITHOUT_PATH_PREFIX = __meteor_runtime_config__.ROOT_URL.substr(0, pos)                             // 53
  }                                                                                                              // 54
}                                                                                                                // 55
                                                                                                                 // 56
// add the root URL without path prefix to the Url                                                               // 57
Url.ROOT_URL_WITHOUT_PATH_PREFIX = ROOT_URL_WITHOUT_PATH_PREFIX;                                                 // 58
                                                                                                                 // 59
/**                                                                                                              // 60
 * Given a relative or absolute path return                                                                      // 61
 * a relative path with a leading forward slash and                                                              // 62
 * no search string or hash fragment                                                                             // 63
 *                                                                                                               // 64
 * @param {String} path                                                                                          // 65
 * @return {String}                                                                                              // 66
 */                                                                                                              // 67
Url.normalize = function (url) {                                                                                 // 68
  if (url instanceof RegExp)                                                                                     // 69
    return url;                                                                                                  // 70
  else if (typeof url !== 'string')                                                                              // 71
    return '/';                                                                                                  // 72
                                                                                                                 // 73
  var parts = Url.parse(url);                                                                                    // 74
  var pathname = parts.pathname;                                                                                 // 75
                                                                                                                 // 76
  if (pathname.charAt(0) !== '/')                                                                                // 77
    pathname = '/' + pathname;                                                                                   // 78
                                                                                                                 // 79
  if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {                                     // 80
    pathname = pathname.slice(0, pathname.length - 1);                                                           // 81
  }                                                                                                              // 82
                                                                                                                 // 83
  return pathname;                                                                                               // 84
};                                                                                                               // 85
                                                                                                                 // 86
/**                                                                                                              // 87
 * Returns true if both a and b are of the same origin.                                                          // 88
 */                                                                                                              // 89
Url.isSameOrigin = function (a, b) {                                                                             // 90
  var aParts = Url.parse(a);                                                                                     // 91
  var bParts = Url.parse(b);                                                                                     // 92
  var result = aParts.origin === bParts.origin;                                                                  // 93
  return result;                                                                                                 // 94
};                                                                                                               // 95
                                                                                                                 // 96
/**                                                                                                              // 97
 * Given a query string return an object of key value pairs.                                                     // 98
 *                                                                                                               // 99
 * "?p1=value1&p2=value2 => {p1: value1, p2: value2}                                                             // 100
 */                                                                                                              // 101
Url.fromQueryString = function (query) {                                                                         // 102
  if (!query)                                                                                                    // 103
    return {};                                                                                                   // 104
                                                                                                                 // 105
  if (typeof query !== 'string')                                                                                 // 106
    throw new Error("expected string");                                                                          // 107
                                                                                                                 // 108
  // get rid of the leading question mark                                                                        // 109
  if (query.charAt(0) === '?')                                                                                   // 110
    query = query.slice(1);                                                                                      // 111
                                                                                                                 // 112
  var keyValuePairs = query.split('&');                                                                          // 113
  var result = {};                                                                                               // 114
  var parts;                                                                                                     // 115
                                                                                                                 // 116
  _.each(keyValuePairs, function (pair) {                                                                        // 117
    var parts = pair.split('=');                                                                                 // 118
    var key = parts[0];                                                                                          // 119
    var value = safeDecodeURIComponent(parts[1]);                                                                // 120
                                                                                                                 // 121
    if (key.slice(-2) === '[]') {                                                                                // 122
      key = key.slice(0, -2);                                                                                    // 123
      result[key] = result[key] || [];                                                                           // 124
      result[key].push(value);                                                                                   // 125
    } else {                                                                                                     // 126
      result[key] = value;                                                                                       // 127
    }                                                                                                            // 128
  });                                                                                                            // 129
                                                                                                                 // 130
  return result;                                                                                                 // 131
};                                                                                                               // 132
                                                                                                                 // 133
/**                                                                                                              // 134
 * Given a query object return a query string.                                                                   // 135
 */                                                                                                              // 136
Url.toQueryString = function (queryObject) {                                                                     // 137
  var result = [];                                                                                               // 138
                                                                                                                 // 139
  if (typeof queryObject === 'string') {                                                                         // 140
    if (queryObject.charAt(0) !== '?')                                                                           // 141
      return '?' + queryObject;                                                                                  // 142
    else                                                                                                         // 143
      return queryObject;                                                                                        // 144
  }                                                                                                              // 145
                                                                                                                 // 146
  _.each(queryObject, function (value, key) {                                                                    // 147
    if (_.isArray(value)) {                                                                                      // 148
      _.each(value, function(valuePart) {                                                                        // 149
        result.push(encodeURIComponent(key + '[]') + '=' + encodeURIComponent(valuePart));                       // 150
      });                                                                                                        // 151
    } else {                                                                                                     // 152
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));                                    // 153
    }                                                                                                            // 154
  });                                                                                                            // 155
                                                                                                                 // 156
  // no sense in adding a pointless question mark                                                                // 157
  if (result.length > 0)                                                                                         // 158
    return '?' + result.join('&');                                                                               // 159
  else                                                                                                           // 160
    return '';                                                                                                   // 161
};                                                                                                               // 162
                                                                                                                 // 163
/**                                                                                                              // 164
 * Given a string url return an object with all of the url parts.                                                // 165
 */                                                                                                              // 166
Url.parse = function (url) {                                                                                     // 167
  if (typeof url !== 'string')                                                                                   // 168
    return {};                                                                                                   // 169
                                                                                                                 // 170
  //http://tools.ietf.org/html/rfc3986#page-50                                                                   // 171
  //http://www.rfc-editor.org/errata_search.php?rfc=3986                                                         // 172
  var re = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;                                      // 173
                                                                                                                 // 174
  var match = url.match(re);                                                                                     // 175
                                                                                                                 // 176
  var protocol = match[1] ? match[1].toLowerCase() : undefined;                                                  // 177
  var hostWithSlashes = match[3];                                                                                // 178
  var slashes = !!hostWithSlashes;                                                                               // 179
  var hostWithAuth= match[4] ? match[4].toLowerCase() : undefined;                                               // 180
  var hostWithAuthParts = hostWithAuth ? hostWithAuth.split('@') : [];                                           // 181
                                                                                                                 // 182
  var host, auth;                                                                                                // 183
                                                                                                                 // 184
  if (hostWithAuthParts.length == 2) {                                                                           // 185
    auth = hostWithAuthParts[0];                                                                                 // 186
    host = hostWithAuthParts[1];                                                                                 // 187
  } else if (hostWithAuthParts.length == 1) {                                                                    // 188
    host = hostWithAuthParts[0];                                                                                 // 189
    auth = undefined;                                                                                            // 190
  } else {                                                                                                       // 191
    host = undefined;                                                                                            // 192
    auth = undefined;                                                                                            // 193
  }                                                                                                              // 194
                                                                                                                 // 195
  var hostWithPortParts = (host && host.split(':')) || [];                                                       // 196
  var hostname = hostWithPortParts[0];                                                                           // 197
  var port = hostWithPortParts[1];                                                                               // 198
  var origin = (protocol && host) ? protocol + '//' + host : undefined;                                          // 199
  var pathname = match[5];                                                                                       // 200
  var hash = match[8];                                                                                           // 201
  var originalUrl = url;                                                                                         // 202
                                                                                                                 // 203
  var search = match[6];                                                                                         // 204
                                                                                                                 // 205
  var query;                                                                                                     // 206
  var indexOfSearch = (hash && hash.indexOf('?')) || -1;                                                         // 207
                                                                                                                 // 208
  // if we found a search string in the hash and there is no explicit search                                     // 209
  // string                                                                                                      // 210
  if (~indexOfSearch && !search) {                                                                               // 211
    search = hash.slice(indexOfSearch);                                                                          // 212
    hash = hash.substr(0, indexOfSearch);                                                                        // 213
    // get rid of the ? character                                                                                // 214
    query = search.slice(1);                                                                                     // 215
  } else {                                                                                                       // 216
    query = match[7];                                                                                            // 217
  }                                                                                                              // 218
                                                                                                                 // 219
  var path = pathname + (search || '');                                                                          // 220
  var queryObject = Url.fromQueryString(query);                                                                  // 221
                                                                                                                 // 222
  var rootUrl = [                                                                                                // 223
    protocol || '',                                                                                              // 224
    slashes ? '//' : '',                                                                                         // 225
    hostWithAuth || ''                                                                                           // 226
  ].join('');                                                                                                    // 227
                                                                                                                 // 228
  var href = [                                                                                                   // 229
    protocol || '',                                                                                              // 230
    slashes ? '//' : '',                                                                                         // 231
    hostWithAuth || '',                                                                                          // 232
    pathname || '',                                                                                              // 233
    search || '',                                                                                                // 234
    hash || ''                                                                                                   // 235
  ].join('');                                                                                                    // 236
                                                                                                                 // 237
  return {                                                                                                       // 238
    rootUrl: rootUrl || '',                                                                                      // 239
    originalUrl: url || '',                                                                                      // 240
    href: href || '',                                                                                            // 241
    protocol: protocol || '',                                                                                    // 242
    auth: auth || '',                                                                                            // 243
    host: host || '',                                                                                            // 244
    hostname: hostname || '',                                                                                    // 245
    port: port || '',                                                                                            // 246
    origin: origin || '',                                                                                        // 247
    path: path || '',                                                                                            // 248
    pathname: pathname || '',                                                                                    // 249
    search: search || '',                                                                                        // 250
    query: query || '',                                                                                          // 251
    queryObject: queryObject || '',                                                                              // 252
    hash: hash || '',                                                                                            // 253
    slashes: slashes                                                                                             // 254
  };                                                                                                             // 255
};                                                                                                               // 256
                                                                                                                 // 257
/**                                                                                                              // 258
 * Returns true if the path matches and false otherwise.                                                         // 259
 */                                                                                                              // 260
Url.prototype.test = function (path) {                                                                           // 261
  path = Url.normalize(path);                                                                                    // 262
  path = Url.trimPathPrefixAccordingToMeteorRootUrlSettingsForRouteMatching(path);                               // 263
  return this.regexp.test(path);                                                                                 // 264
};                                                                                                               // 265
                                                                                                                 // 266
/**                                                                                                              // 267
 * Returns the result of calling exec on the compiled path with                                                  // 268
 * the given path.                                                                                               // 269
 */                                                                                                              // 270
Url.prototype.exec = function (path) {                                                                           // 271
  path = Url.normalize(path);                                                                                    // 272
  path = Url.trimPathPrefixAccordingToMeteorRootUrlSettingsForRouteMatching(path);                               // 273
  return this.regexp.exec(path);                                                                                 // 274
};                                                                                                               // 275
                                                                                                                 // 276
/**                                                                                                              // 277
 * Returns an array of parameters given a path. The array may have named                                         // 278
 * properties in addition to indexed values.                                                                     // 279
 */                                                                                                              // 280
Url.prototype.params = function (path) {                                                                         // 281
  if (!path)                                                                                                     // 282
    return [];                                                                                                   // 283
                                                                                                                 // 284
  var params = [];                                                                                               // 285
  var m = this.exec(path);                                                                                       // 286
  var queryString;                                                                                               // 287
  var keys = this.keys;                                                                                          // 288
  var key;                                                                                                       // 289
  var value;                                                                                                     // 290
                                                                                                                 // 291
  if (!m)                                                                                                        // 292
    throw new Error('The route named "' + this.name + '" does not match the path "' + path + '"');               // 293
                                                                                                                 // 294
  for (var i = 1, len = m.length; i < len; ++i) {                                                                // 295
    key = keys[i - 1];                                                                                           // 296
    value = typeof m[i] == 'string' ? safeDecodeURIComponent(m[i]) : m[i];                                       // 297
    if (key) {                                                                                                   // 298
      params[key.name] = params[key.name] !== undefined ?                                                        // 299
        params[key.name] : value;                                                                                // 300
    } else                                                                                                       // 301
      params.push(value);                                                                                        // 302
  }                                                                                                              // 303
                                                                                                                 // 304
  path = safeDecodeURI(path);                                                                                    // 305
                                                                                                                 // 306
  if (typeof path !== 'undefined') {                                                                             // 307
    queryString = path.split('?')[1];                                                                            // 308
    if (queryString)                                                                                             // 309
      queryString = queryString.split('#')[0];                                                                   // 310
                                                                                                                 // 311
    params.hash = path.split('#')[1] || null;                                                                    // 312
    params.query = Url.fromQueryString(queryString);                                                             // 313
  }                                                                                                              // 314
                                                                                                                 // 315
  return params;                                                                                                 // 316
};                                                                                                               // 317
                                                                                                                 // 318
Url.prototype.resolve = function (params, options) {                                                             // 319
  var value;                                                                                                     // 320
  var isValueDefined;                                                                                            // 321
  var result;                                                                                                    // 322
  var wildCardCount = 0;                                                                                         // 323
  var path = this._originalPath;                                                                                 // 324
  var hash;                                                                                                      // 325
  var query;                                                                                                     // 326
  var missingParams = [];                                                                                        // 327
  var originalParams = params;                                                                                   // 328
                                                                                                                 // 329
  options = options || {};                                                                                       // 330
  params = params || [];                                                                                         // 331
  query = options.query;                                                                                         // 332
  hash = options.hash && options.hash.toString();                                                                // 333
                                                                                                                 // 334
  if (path instanceof RegExp) {                                                                                  // 335
    throw new Error('Cannot currently resolve a regular expression path');                                       // 336
  } else {                                                                                                       // 337
    path = path                                                                                                  // 338
      .replace(                                                                                                  // 339
        /(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,                                                                  // 340
        function (match, slash, format, key, capture, optional, offset) {                                        // 341
          slash = slash || '';                                                                                   // 342
          value = params[key];                                                                                   // 343
          isValueDefined = typeof value !== 'undefined';                                                         // 344
                                                                                                                 // 345
          if (optional && !isValueDefined) {                                                                     // 346
            value = '';                                                                                          // 347
          } else if (!isValueDefined) {                                                                          // 348
            missingParams.push(key);                                                                             // 349
            return;                                                                                              // 350
          }                                                                                                      // 351
                                                                                                                 // 352
          value = _.isFunction(value) ? value.call(params) : value;                                              // 353
          var escapedValue = _.map(String(value).split('/'), function (segment) {                                // 354
            return encodeURIComponent(segment);                                                                  // 355
          }).join('/');                                                                                          // 356
          return slash + escapedValue                                                                            // 357
        }                                                                                                        // 358
      )                                                                                                          // 359
      .replace(                                                                                                  // 360
        /\*/g,                                                                                                   // 361
        function (match) {                                                                                       // 362
          if (typeof params[wildCardCount] === 'undefined') {                                                    // 363
            throw new Error(                                                                                     // 364
              'You are trying to access a wild card parameter at index ' +                                       // 365
              wildCardCount +                                                                                    // 366
              ' but the value of params at that index is undefined');                                            // 367
          }                                                                                                      // 368
                                                                                                                 // 369
          var paramValue = String(params[wildCardCount++]);                                                      // 370
          return _.map(paramValue.split('/'), function (segment) {                                               // 371
            return encodeURIComponent(segment);                                                                  // 372
          }).join('/');                                                                                          // 373
        }                                                                                                        // 374
      );                                                                                                         // 375
                                                                                                                 // 376
    query = Url.toQueryString(query);                                                                            // 377
                                                                                                                 // 378
    path = path + query;                                                                                         // 379
                                                                                                                 // 380
    if (hash) {                                                                                                  // 381
      hash = encodeURI(hash.replace('#', ''));                                                                   // 382
      path = path + '#' + hash;                                                                                  // 383
    }                                                                                                            // 384
  }                                                                                                              // 385
                                                                                                                 // 386
  // Because of optional possibly empty segments we normalize path here                                          // 387
  path = path.replace(/\/+/g, '/'); // Multiple / -> one /                                                       // 388
  path = path.replace(/^(.+)\/$/g, '$1'); // Removal of trailing /                                               // 389
                                                                                                                 // 390
  path = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + path                                                   // 391
                                                                                                                 // 392
  if (missingParams.length == 0)                                                                                 // 393
    return path;                                                                                                 // 394
  else if (options.throwOnMissingParams === true)                                                                // 395
    throw new Error("Missing required parameters on path " + JSON.stringify(this._originalPath) + ". The missing params are: " + JSON.stringify(missingParams) + ". The params object passed in was: " + JSON.stringify(originalParams) + ".");
  else                                                                                                           // 397
    return null;                                                                                                 // 398
};                                                                                                               // 399
                                                                                                                 // 400
/**                                                                                                              // 401
 * If the entire Meteor project is running in a subdirectory of the webserver (eg. myapp.com/beta/), it's probably being started with setting
 * the Meteor ROOT_URL - variable to allow for serving from that specific URL, including the subdirectory, as in // 403
 *                                                                                                               // 404
 * ROOT_URL="http://myapp.com/beta" meteor .                                                                     // 405
 *                                                                                                               // 406
 * To be able to match routes containing the prefix ("/beta/" in the example) in front of the main route, we'll trim the part in front of the path
 * configured via ROOT_URL.                                                                                      // 408
 *                                                                                                               // 409
 * In short: "/beta/myRoutePath" -> "/myRoutePath".                                                              // 410
 *                                                                                                               // 411
 * This function will be called when a route should be matched.                                                  // 412
 *                                                                                                               // 413
 * Note that on the server the transformation / stripping of the rootUrlPathPrefix is taken care of by meteors' HTTP stack and doesn't mustn't be trimmed there.
 *                                                                                                               // 415
 * We take care of that inside of the function, but it should probably be taken care of by the calling side.     // 416
 *                                                                                                               // 417
 * @param {String} path                                                                                          // 418
 * @return {String}                                                                                              // 419
 */                                                                                                              // 420
                                                                                                                 // 421
Url.trimPathPrefixAccordingToMeteorRootUrlSettingsForRouteMatching = function(path) {                            // 422
  var rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;                                        // 423
  if (Meteor.isClient && rootUrlPathPrefix) {                                                                    // 424
    assert(path.substring(0, rootUrlPathPrefix.length) === rootUrlPathPrefix, "Unknown path prefix, expected: '" + rootUrlPathPrefix + "'");
    path = path.substring(rootUrlPathPrefix.length);                                                             // 426
  }                                                                                                              // 427
  return path;                                                                                                   // 428
};                                                                                                               // 429
                                                                                                                 // 430
                                                                                                                 // 431
/*****************************************************************************/                                  // 432
/* Namespacing */                                                                                                // 433
/*****************************************************************************/                                  // 434
Iron.Url = Url;                                                                                                  // 435
                                                                                                                 // 436
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("clinical:router-url");

})();
