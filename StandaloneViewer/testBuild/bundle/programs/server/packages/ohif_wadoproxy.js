(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Router = Package['clinical:router'].Router;
var RouteController = Package['clinical:router'].RouteController;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Iron = Package['iron:core'].Iron;

/* Package-scope variables */
var WADOProxy;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:wadoproxy":{"both":{"namespace.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/ohif_wadoproxy/both/namespace.js                                                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
WADOProxy = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"convertURL.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/ohif_wadoproxy/both/convertURL.js                                                                   //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let queryString;
module.watch(require("query-string"), {
  default(v) {
    queryString = v;
  }

}, 0);

WADOProxy.convertURL = (url, serverConfiguration) => {
  if (!url) {
    return null;
  }

  if (serverConfiguration.requestOptions && serverConfiguration.requestOptions.requestFromBrowser === true) {
    return url;
  }

  const {
    settings
  } = WADOProxy;
  const serverId = serverConfiguration._id;
  const query = queryString.stringify({
    url,
    serverId
  });
  return `${settings.uri}?${query}`;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"initialize.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/ohif_wadoproxy/both/initialize.js                                                                   //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
WADOProxy.settings = Object.assign({
  uri: OHIF.utils.absoluteUrl("/__wado_proxy")
}, Meteor.settings && Meteor.settings.proxy ? Meteor.settings.proxy : {});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"routes.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/ohif_wadoproxy/server/routes.js                                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Router;
module.watch(require("meteor/clinical:router"), {
  Router(v) {
    Router = v;
  }

}, 1);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 2);
let Servers;
module.watch(require("meteor/ohif:servers/both/collections"), {
  Servers(v) {
    Servers = v;
  }

}, 3);

const url = require('url');

const http = require('http');

const https = require('https');

const now = require('performance-now'); // The WADO Proxy can perform user authentication if desired.
// In order to use this, create a function to override
// OHIF.user.authenticateUser(request), which returns a Boolean.


let doAuth = false;
let authenticateUser = null;

if (OHIF.user && OHIF.user.authenticateUser) {
  doAuth = true;
  authenticateUser = OHIF.user.authenticateUser;
}

const handleRequest = function () {
  const request = this.request;
  const response = this.response;
  const params = this.params;
  let start = now();
  let user;

  if (doAuth) {
    user = authenticateUser(request);

    if (!user) {
      response.writeHead(401);
      response.end('Error: You must be logged in to perform this action.\n');
      return;
    }
  }

  let end = now();
  const authenticationTime = end - start;
  start = now();
  const server = Servers.findOne(params.query.serverId);

  if (!server) {
    response.writeHead(500);
    response.end('Error: No Server with the specified Server ID was found.\n');
    return;
  }

  const requestOpt = server.requestOptions; // If no Web Access to DICOM Objects (WADO) Service URL is provided
  // return an error for the request.

  const wadoUrl = params.query.url;

  if (!wadoUrl) {
    response.writeHead(500);
    response.end('Error: No WADO URL was provided.\n');
    return;
  }

  if (requestOpt.logRequests) {
    console.log(request.url);
  }

  start = now();

  if (requestOpt.logTiming) {
    console.time(request.url);
  } // Use Node's URL parse to decode the query URL


  const parsed = url.parse(wadoUrl); // Create an object to hold the information required
  // for the request to the PACS.

  let options = {
    headers: {},
    method: request.method,
    hostname: parsed.hostname,
    path: parsed.path
  };
  let requester;

  if (parsed.protocol === 'https:') {
    requester = https.request;
    const allowUnauthorizedAgent = new https.Agent({
      rejectUnauthorized: false
    });
    options.agent = allowUnauthorizedAgent;
  } else {
    requester = http.request;
  }

  if (parsed.port) {
    options.port = parsed.port;
  }

  Object.keys(request.headers).forEach(entry => {
    const value = request.headers[entry];

    if (entry) {
      options.headers[entry] = value;
    }
  }); // Retrieve the authorization user:password string for the PACS,
  // if one is required, and include it in the request to the PACS.

  if (requestOpt.auth) {
    options.auth = requestOpt.auth;
  }

  end = now();
  const prepRequestTime = end - start; // Use Node's HTTP API to send a request to the PACS

  const proxyRequest = requester(options, proxyResponse => {
    // When we receive data from the PACS, stream it as the
    // response to the original request.
    // console.log(`Got response: ${proxyResponse.statusCode}`);
    end = now();
    const proxyReqTime = end - start;
    const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
    const serverTimingHeaders = `
        auth;dur=${authenticationTime};desc="Authenticate User";,
		prep-req;dur=${prepRequestTime};desc="Prepare Request Headers",
	    proxy-req;dur=${proxyReqTime};desc="Request to WADO server",
        total-proxy;dur=${totalProxyTime};desc="Total"
        `.replace(/\n/g, '');
    proxyResponse.headers['Server-Timing'] = serverTimingHeaders;
    response.writeHead(proxyResponse.statusCode, proxyResponse.headers);

    if (requestOpt.logTiming) {
      console.timeEnd(request.url);
    }

    return proxyResponse.pipe(response, {
      end: true
    });
  }); // If our request to the PACS fails, log the error message

  proxyRequest.on('error', error => {
    end = now();
    const proxyReqTime = end - start;
    const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
    console.timeEnd(request.url);
    const serverTimingHeaders = {
      'Server-Timing': `
              auth;dur=${authenticationTime};desc="Authenticate User";,
              prep-req;dur=${prepRequestTime};desc="Prepare Request Headers",
              proxy-req;dur=${proxyReqTime};desc="Request to WADO server",
              total-proxy;dur=${totalProxyTime};desc="Total"
          `.replace(/\n/g, '')
    };
    response.writeHead(500, serverTimingHeaders);
    response.end(`Error: Problem with request to PACS: ${error.message}\n`);
  }); // Stream the original request information into the request
  // to the PACS

  request.pipe(proxyRequest);
}; // Setup a Route using Iron Router to avoid Cross-origin resource sharing
// (CORS) errors. We only handle this route on the Server.


Router.route(WADOProxy.settings.uri.replace(OHIF.utils.absoluteUrl(), ''), handleRequest, {
  where: 'server'
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"query-string":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/ohif_wadoproxy/node_modules/query-string/package.json                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
exports.name = "query-string";
exports.version = "5.1.1";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/ohif_wadoproxy/node_modules/query-string/index.js                                        //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"performance-now":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/ohif_wadoproxy/node_modules/performance-now/package.json                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
exports.name = "performance-now";
exports.version = "2.1.0";
exports.main = "lib/performance-now.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"performance-now.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// node_modules/meteor/ohif_wadoproxy/node_modules/performance-now/lib/performance-now.js                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:wadoproxy/both/namespace.js");
require("/node_modules/meteor/ohif:wadoproxy/both/convertURL.js");
require("/node_modules/meteor/ohif:wadoproxy/both/initialize.js");
require("/node_modules/meteor/ohif:wadoproxy/server/routes.js");

/* Exports */
Package._define("ohif:wadoproxy", {
  WADOProxy: WADOProxy
});

})();

//# sourceURL=meteor://💻app/packages/ohif_wadoproxy.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjp3YWRvcHJveHkvYm90aC9uYW1lc3BhY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6d2Fkb3Byb3h5L2JvdGgvY29udmVydFVSTC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjp3YWRvcHJveHkvYm90aC9pbml0aWFsaXplLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOndhZG9wcm94eS9zZXJ2ZXIvcm91dGVzLmpzIl0sIm5hbWVzIjpbIldBRE9Qcm94eSIsInF1ZXJ5U3RyaW5nIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJjb252ZXJ0VVJMIiwidXJsIiwic2VydmVyQ29uZmlndXJhdGlvbiIsInJlcXVlc3RPcHRpb25zIiwicmVxdWVzdEZyb21Ccm93c2VyIiwic2V0dGluZ3MiLCJzZXJ2ZXJJZCIsIl9pZCIsInF1ZXJ5Iiwic3RyaW5naWZ5IiwidXJpIiwiTWV0ZW9yIiwiT0hJRiIsIk9iamVjdCIsImFzc2lnbiIsInV0aWxzIiwiYWJzb2x1dGVVcmwiLCJwcm94eSIsIlJvdXRlciIsIlNlcnZlcnMiLCJodHRwIiwiaHR0cHMiLCJub3ciLCJkb0F1dGgiLCJhdXRoZW50aWNhdGVVc2VyIiwidXNlciIsImhhbmRsZVJlcXVlc3QiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJwYXJhbXMiLCJzdGFydCIsIndyaXRlSGVhZCIsImVuZCIsImF1dGhlbnRpY2F0aW9uVGltZSIsInNlcnZlciIsImZpbmRPbmUiLCJyZXF1ZXN0T3B0Iiwid2Fkb1VybCIsImxvZ1JlcXVlc3RzIiwiY29uc29sZSIsImxvZyIsImxvZ1RpbWluZyIsInRpbWUiLCJwYXJzZWQiLCJwYXJzZSIsIm9wdGlvbnMiLCJoZWFkZXJzIiwibWV0aG9kIiwiaG9zdG5hbWUiLCJwYXRoIiwicmVxdWVzdGVyIiwicHJvdG9jb2wiLCJhbGxvd1VuYXV0aG9yaXplZEFnZW50IiwiQWdlbnQiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJhZ2VudCIsInBvcnQiLCJrZXlzIiwiZm9yRWFjaCIsImVudHJ5IiwidmFsdWUiLCJhdXRoIiwicHJlcFJlcXVlc3RUaW1lIiwicHJveHlSZXF1ZXN0IiwicHJveHlSZXNwb25zZSIsInByb3h5UmVxVGltZSIsInRvdGFsUHJveHlUaW1lIiwic2VydmVyVGltaW5nSGVhZGVycyIsInJlcGxhY2UiLCJzdGF0dXNDb2RlIiwidGltZUVuZCIsInBpcGUiLCJvbiIsImVycm9yIiwibWVzc2FnZSIsInJvdXRlIiwid2hlcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsWUFBWSxFQUFaLEM7Ozs7Ozs7Ozs7O0FDQUEsSUFBSUMsV0FBSjtBQUFnQkMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsa0JBQVlLLENBQVo7QUFBYzs7QUFBMUIsQ0FBckMsRUFBaUUsQ0FBakU7O0FBRWhCTixVQUFVTyxVQUFWLEdBQXVCLENBQUNDLEdBQUQsRUFBTUMsbUJBQU4sS0FBOEI7QUFDakQsTUFBSSxDQUFDRCxHQUFMLEVBQVU7QUFDTixXQUFPLElBQVA7QUFDSDs7QUFFRCxNQUFJQyxvQkFBb0JDLGNBQXBCLElBQ0FELG9CQUFvQkMsY0FBcEIsQ0FBbUNDLGtCQUFuQyxLQUEwRCxJQUQ5RCxFQUNvRTtBQUNoRSxXQUFPSCxHQUFQO0FBQ0g7O0FBRUQsUUFBTTtBQUFFSTtBQUFGLE1BQWVaLFNBQXJCO0FBQ0EsUUFBTWEsV0FBV0osb0JBQW9CSyxHQUFyQztBQUNBLFFBQU1DLFFBQVFkLFlBQVllLFNBQVosQ0FBc0I7QUFBQ1IsT0FBRDtBQUFNSztBQUFOLEdBQXRCLENBQWQ7QUFFQSxTQUFRLEdBQUVELFNBQVNLLEdBQUksSUFBR0YsS0FBTSxFQUFoQztBQUNILENBZkQsQzs7Ozs7Ozs7Ozs7QUNGQSxJQUFJRyxNQUFKO0FBQVdoQixP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QStCLGVBQWFTLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUJDLFNBQVM7QUFDOUJ6QyxVQUFNVixLQUFOO0FBQ0EsVUFBTTJDLGVBQWVqQyxNQUFNRixLQUEzQjtBQUNBLFVBQU1vQyxpQkFBaUJqQyxxQkFBcUI2QixlQUFyQixHQUF1Q0csWUFBOUQ7QUFDQTFCLFlBQVErQixPQUFSLENBQWdCM0MsUUFBUTFCLEdBQXhCO0FBRUEsVUFBTWtFLHNCQUFzQjtBQUN4Qix1QkFBa0I7eUJBQ0hsQyxrQkFBbUI7NkJBQ2Y2QixlQUFnQjs4QkFDZkcsWUFBYTtnQ0FDWEMsY0FBZTtXQUpwQixDQUtmRSxPQUxlLENBS1AsS0FMTyxFQUtBLEVBTEE7QUFETyxLQUE1QjtBQVNBeEMsYUFBU0csU0FBVCxDQUFtQixHQUFuQixFQUF3Qm9DLG1CQUF4QjtBQUNBdkMsYUFBU0ksR0FBVCxDQUFjLHdDQUF1Q3lDLE1BQU1DLE9BQVEsSUFBbkU7QUFDSCxHQWpCRCxFQXJIK0IsQ0F3SS9CO0FBQ0E7O0FBQ0EvQyxVQUFRNEMsSUFBUixDQUFhUixZQUFiO0FBQ0QsQ0EzSUQsQyxDQTZJQTtBQUNBOzs7QUFDQTdDLE9BQU95RCxLQUFQLENBQWFsRixVQUFVWSxRQUFWLENBQW1CSyxHQUFuQixDQUF1QjBELE9BQXZCLENBQStCeEQsS0FBS0csS0FBTCxDQUFXQyxXQUFYLEVBQS9CLEVBQXlELEVBQXpELENBQWIsRUFBMkVVLGFBQTNFLEVBQTBGO0FBQUVrRCxTQUFPO0FBQVQsQ0FBMUYsRSIsImZpbGUiOiIvcGFja2FnZXMvb2hpZl93YWRvcHJveHkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJXQURPUHJveHkgPSB7fTtcbiIsImltcG9ydCBxdWVyeVN0cmluZyBmcm9tICdxdWVyeS1zdHJpbmcnO1xuXG5XQURPUHJveHkuY29udmVydFVSTCA9ICh1cmwsIHNlcnZlckNvbmZpZ3VyYXRpb24pID0+IHtcbiAgICBpZiAoIXVybCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc2VydmVyQ29uZmlndXJhdGlvbi5yZXF1ZXN0T3B0aW9ucyAmJlxuICAgICAgICBzZXJ2ZXJDb25maWd1cmF0aW9uLnJlcXVlc3RPcHRpb25zLnJlcXVlc3RGcm9tQnJvd3NlciA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIGNvbnN0IHsgc2V0dGluZ3MgfSA9IFdBRE9Qcm94eTtcbiAgICBjb25zdCBzZXJ2ZXJJZCA9IHNlcnZlckNvbmZpZ3VyYXRpb24uX2lkO1xuICAgIGNvbnN0IHF1ZXJ5ID0gcXVlcnlTdHJpbmcuc3RyaW5naWZ5KHt1cmwsIHNlcnZlcklkfSk7XG5cbiAgICByZXR1cm4gYCR7c2V0dGluZ3MudXJpfT8ke3F1ZXJ5fWA7XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcclxuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xyXG5cclxuV0FET1Byb3h5LnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICB1cmkgOiBPSElGLnV0aWxzLmFic29sdXRlVXJsKFwiL19fd2Fkb19wcm94eVwiKSxcclxufSwgKE1ldGVvci5zZXR0aW5ncyAmJiBNZXRlb3Iuc2V0dGluZ3MucHJveHkpID8gTWV0ZW9yLnNldHRpbmdzLnByb3h5IDoge30pO1xyXG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gJ21ldGVvci9jbGluaWNhbDpyb3V0ZXInO1xuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuaW1wb3J0IHsgU2VydmVycyB9IGZyb20gJ21ldGVvci9vaGlmOnNlcnZlcnMvYm90aC9jb2xsZWN0aW9ucyc7XG5cbmNvbnN0IHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuY29uc3QgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcbmNvbnN0IG5vdyA9IHJlcXVpcmUoJ3BlcmZvcm1hbmNlLW5vdycpO1xuXG4vLyBUaGUgV0FETyBQcm94eSBjYW4gcGVyZm9ybSB1c2VyIGF1dGhlbnRpY2F0aW9uIGlmIGRlc2lyZWQuXG4vLyBJbiBvcmRlciB0byB1c2UgdGhpcywgY3JlYXRlIGEgZnVuY3Rpb24gdG8gb3ZlcnJpZGVcbi8vIE9ISUYudXNlci5hdXRoZW50aWNhdGVVc2VyKHJlcXVlc3QpLCB3aGljaCByZXR1cm5zIGEgQm9vbGVhbi5cbmxldCBkb0F1dGggPSBmYWxzZTtcbmxldCBhdXRoZW50aWNhdGVVc2VyID0gbnVsbDtcblxuaWYgKE9ISUYudXNlciAmJlxuICAgIE9ISUYudXNlci5hdXRoZW50aWNhdGVVc2VyKSB7XG4gICAgZG9BdXRoID0gdHJ1ZTtcbiAgICBhdXRoZW50aWNhdGVVc2VyID0gT0hJRi51c2VyLmF1dGhlbnRpY2F0ZVVzZXI7XG59XG5cbmNvbnN0IGhhbmRsZVJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdDtcbiAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLnJlc3BvbnNlO1xuICBjb25zdCBwYXJhbXMgPSB0aGlzLnBhcmFtcztcblxuICBsZXQgc3RhcnQgPSBub3coKTtcbiAgbGV0IHVzZXI7XG4gIGlmIChkb0F1dGgpIHtcbiAgICAgIHVzZXIgPSBhdXRoZW50aWNhdGVVc2VyKHJlcXVlc3QpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDQwMSk7XG4gICAgICAgICAgcmVzcG9uc2UuZW5kKCdFcnJvcjogWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIHBlcmZvcm0gdGhpcyBhY3Rpb24uXFxuJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICB9XG5cbiAgbGV0IGVuZCA9IG5vdygpO1xuICBjb25zdCBhdXRoZW50aWNhdGlvblRpbWUgPSBlbmQgLSBzdGFydDtcblxuICBzdGFydCA9IG5vdygpO1xuXG4gIGNvbnN0IHNlcnZlciA9IFNlcnZlcnMuZmluZE9uZShwYXJhbXMucXVlcnkuc2VydmVySWQpO1xuICBpZiAoIXNlcnZlcikge1xuICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDUwMCk7XG4gICAgICByZXNwb25zZS5lbmQoJ0Vycm9yOiBObyBTZXJ2ZXIgd2l0aCB0aGUgc3BlY2lmaWVkIFNlcnZlciBJRCB3YXMgZm91bmQuXFxuJyk7XG4gICAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZXF1ZXN0T3B0ID0gc2VydmVyLnJlcXVlc3RPcHRpb25zO1xuXG4gIC8vIElmIG5vIFdlYiBBY2Nlc3MgdG8gRElDT00gT2JqZWN0cyAoV0FETykgU2VydmljZSBVUkwgaXMgcHJvdmlkZWRcbiAgLy8gcmV0dXJuIGFuIGVycm9yIGZvciB0aGUgcmVxdWVzdC5cbiAgY29uc3Qgd2Fkb1VybCA9IHBhcmFtcy5xdWVyeS51cmw7XG4gIGlmICghd2Fkb1VybCkge1xuICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDUwMCk7XG4gICAgICByZXNwb25zZS5lbmQoJ0Vycm9yOiBObyBXQURPIFVSTCB3YXMgcHJvdmlkZWQuXFxuJyk7XG4gICAgICByZXR1cm47XG4gIH1cblxuICBpZiAocmVxdWVzdE9wdC5sb2dSZXF1ZXN0cykge1xuICAgICAgY29uc29sZS5sb2cocmVxdWVzdC51cmwpO1xuICB9XG5cbiAgc3RhcnQgPSBub3coKTtcbiAgaWYgKHJlcXVlc3RPcHQubG9nVGltaW5nKSB7XG4gICAgICBjb25zb2xlLnRpbWUocmVxdWVzdC51cmwpO1xuICB9XG5cbiAgLy8gVXNlIE5vZGUncyBVUkwgcGFyc2UgdG8gZGVjb2RlIHRoZSBxdWVyeSBVUkxcbiAgY29uc3QgcGFyc2VkID0gdXJsLnBhcnNlKHdhZG9VcmwpO1xuXG4gIC8vIENyZWF0ZSBhbiBvYmplY3QgdG8gaG9sZCB0aGUgaW5mb3JtYXRpb24gcmVxdWlyZWRcbiAgLy8gZm9yIHRoZSByZXF1ZXN0IHRvIHRoZSBQQUNTLlxuICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgbWV0aG9kOiByZXF1ZXN0Lm1ldGhvZCxcbiAgICAgIGhvc3RuYW1lOiBwYXJzZWQuaG9zdG5hbWUsXG4gICAgICBwYXRoOiBwYXJzZWQucGF0aFxuICB9O1xuXG4gIGxldCByZXF1ZXN0ZXI7XG4gIGlmIChwYXJzZWQucHJvdG9jb2wgPT09ICdodHRwczonKSB7XG4gICAgICByZXF1ZXN0ZXIgPSBodHRwcy5yZXF1ZXN0O1xuXG4gICAgICBjb25zdCBhbGxvd1VuYXV0aG9yaXplZEFnZW50ID0gbmV3IGh0dHBzLkFnZW50KHsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSB9KTtcbiAgICAgIG9wdGlvbnMuYWdlbnQgPSBhbGxvd1VuYXV0aG9yaXplZEFnZW50O1xuICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdGVyID0gaHR0cC5yZXF1ZXN0O1xuICB9XG5cbiAgaWYgKHBhcnNlZC5wb3J0KSB7XG4gICAgICBvcHRpb25zLnBvcnQgPSBwYXJzZWQucG9ydDtcbiAgfVxuXG4gIE9iamVjdC5rZXlzKHJlcXVlc3QuaGVhZGVycykuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJlcXVlc3QuaGVhZGVyc1tlbnRyeV07XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICBvcHRpb25zLmhlYWRlcnNbZW50cnldID0gdmFsdWU7XG4gICAgICB9XG4gIH0pO1xuXG4gIC8vIFJldHJpZXZlIHRoZSBhdXRob3JpemF0aW9uIHVzZXI6cGFzc3dvcmQgc3RyaW5nIGZvciB0aGUgUEFDUyxcbiAgLy8gaWYgb25lIGlzIHJlcXVpcmVkLCBhbmQgaW5jbHVkZSBpdCBpbiB0aGUgcmVxdWVzdCB0byB0aGUgUEFDUy5cbiAgaWYgKHJlcXVlc3RPcHQuYXV0aCkge1xuICAgICAgb3B0aW9ucy5hdXRoID0gcmVxdWVzdE9wdC5hdXRoO1xuICB9XG5cbiAgZW5kID0gbm93KCk7XG4gIGNvbnN0IHByZXBSZXF1ZXN0VGltZSA9IGVuZCAtIHN0YXJ0O1xuXG4gIC8vIFVzZSBOb2RlJ3MgSFRUUCBBUEkgdG8gc2VuZCBhIHJlcXVlc3QgdG8gdGhlIFBBQ1NcbiAgY29uc3QgcHJveHlSZXF1ZXN0ID0gcmVxdWVzdGVyKG9wdGlvbnMsIHByb3h5UmVzcG9uc2UgPT4ge1xuICAgICAgLy8gV2hlbiB3ZSByZWNlaXZlIGRhdGEgZnJvbSB0aGUgUEFDUywgc3RyZWFtIGl0IGFzIHRoZVxuICAgICAgLy8gcmVzcG9uc2UgdG8gdGhlIG9yaWdpbmFsIHJlcXVlc3QuXG4gICAgICAvLyBjb25zb2xlLmxvZyhgR290IHJlc3BvbnNlOiAke3Byb3h5UmVzcG9uc2Uuc3RhdHVzQ29kZX1gKTtcbiAgICAgIGVuZCA9IG5vdygpO1xuICAgICAgY29uc3QgcHJveHlSZXFUaW1lID0gZW5kIC0gc3RhcnQ7XG4gICAgICBjb25zdCB0b3RhbFByb3h5VGltZSA9IGF1dGhlbnRpY2F0aW9uVGltZSArIHByZXBSZXF1ZXN0VGltZSArIHByb3h5UmVxVGltZTtcbiAgICAgIGNvbnN0IHNlcnZlclRpbWluZ0hlYWRlcnMgPSBgXG4gICAgICAgIGF1dGg7ZHVyPSR7YXV0aGVudGljYXRpb25UaW1lfTtkZXNjPVwiQXV0aGVudGljYXRlIFVzZXJcIjssXG5cdFx0cHJlcC1yZXE7ZHVyPSR7cHJlcFJlcXVlc3RUaW1lfTtkZXNjPVwiUHJlcGFyZSBSZXF1ZXN0IEhlYWRlcnNcIixcblx0ICAgIHByb3h5LXJlcTtkdXI9JHtwcm94eVJlcVRpbWV9O2Rlc2M9XCJSZXF1ZXN0IHRvIFdBRE8gc2VydmVyXCIsXG4gICAgICAgIHRvdGFsLXByb3h5O2R1cj0ke3RvdGFsUHJveHlUaW1lfTtkZXNjPVwiVG90YWxcIlxuICAgICAgICBgLnJlcGxhY2UoL1xcbi9nLCAnJylcblxuICAgICAgcHJveHlSZXNwb25zZS5oZWFkZXJzWydTZXJ2ZXItVGltaW5nJ10gPSBzZXJ2ZXJUaW1pbmdIZWFkZXJzO1xuXG4gICAgICByZXNwb25zZS53cml0ZUhlYWQocHJveHlSZXNwb25zZS5zdGF0dXNDb2RlLCBwcm94eVJlc3BvbnNlLmhlYWRlcnMpO1xuXG4gICAgICBpZiAocmVxdWVzdE9wdC5sb2dUaW1pbmcpIHtcbiAgICAgICAgICBjb25zb2xlLnRpbWVFbmQocmVxdWVzdC51cmwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJveHlSZXNwb25zZS5waXBlKHJlc3BvbnNlLCB7IGVuZDogdHJ1ZSB9KTtcbiAgfSk7XG5cbiAgLy8gSWYgb3VyIHJlcXVlc3QgdG8gdGhlIFBBQ1MgZmFpbHMsIGxvZyB0aGUgZXJyb3IgbWVzc2FnZVxuICBwcm94eVJlcXVlc3Qub24oJ2Vycm9yJywgZXJyb3IgPT4ge1xuICAgICAgZW5kID0gbm93KCk7XG4gICAgICBjb25zdCBwcm94eVJlcVRpbWUgPSBlbmQgLSBzdGFydDtcbiAgICAgIGNvbnN0IHRvdGFsUHJveHlUaW1lID0gYXV0aGVudGljYXRpb25UaW1lICsgcHJlcFJlcXVlc3RUaW1lICsgcHJveHlSZXFUaW1lO1xuICAgICAgY29uc29sZS50aW1lRW5kKHJlcXVlc3QudXJsKTtcblxuICAgICAgY29uc3Qgc2VydmVyVGltaW5nSGVhZGVycyA9IHtcbiAgICAgICAgICAnU2VydmVyLVRpbWluZyc6IGBcbiAgICAgICAgICAgICAgYXV0aDtkdXI9JHthdXRoZW50aWNhdGlvblRpbWV9O2Rlc2M9XCJBdXRoZW50aWNhdGUgVXNlclwiOyxcbiAgICAgICAgICAgICAgcHJlcC1yZXE7ZHVyPSR7cHJlcFJlcXVlc3RUaW1lfTtkZXNjPVwiUHJlcGFyZSBSZXF1ZXN0IEhlYWRlcnNcIixcbiAgICAgICAgICAgICAgcHJveHktcmVxO2R1cj0ke3Byb3h5UmVxVGltZX07ZGVzYz1cIlJlcXVlc3QgdG8gV0FETyBzZXJ2ZXJcIixcbiAgICAgICAgICAgICAgdG90YWwtcHJveHk7ZHVyPSR7dG90YWxQcm94eVRpbWV9O2Rlc2M9XCJUb3RhbFwiXG4gICAgICAgICAgYC5yZXBsYWNlKC9cXG4vZywgJycpXG4gICAgICB9O1xuXG4gICAgICByZXNwb25zZS53cml0ZUhlYWQoNTAwLCBzZXJ2ZXJUaW1pbmdIZWFkZXJzKTtcbiAgICAgIHJlc3BvbnNlLmVuZChgRXJyb3I6IFByb2JsZW0gd2l0aCByZXF1ZXN0IHRvIFBBQ1M6ICR7ZXJyb3IubWVzc2FnZX1cXG5gKTtcbiAgfSk7XG5cbiAgLy8gU3RyZWFtIHRoZSBvcmlnaW5hbCByZXF1ZXN0IGluZm9ybWF0aW9uIGludG8gdGhlIHJlcXVlc3RcbiAgLy8gdG8gdGhlIFBBQ1NcbiAgcmVxdWVzdC5waXBlKHByb3h5UmVxdWVzdCk7XG59XG5cbi8vIFNldHVwIGEgUm91dGUgdXNpbmcgSXJvbiBSb3V0ZXIgdG8gYXZvaWQgQ3Jvc3Mtb3JpZ2luIHJlc291cmNlIHNoYXJpbmdcbi8vIChDT1JTKSBlcnJvcnMuIFdlIG9ubHkgaGFuZGxlIHRoaXMgcm91dGUgb24gdGhlIFNlcnZlci5cblJvdXRlci5yb3V0ZShXQURPUHJveHkuc2V0dGluZ3MudXJpLnJlcGxhY2UoT0hJRi51dGlscy5hYnNvbHV0ZVVybCgpLCAnJyksIGhhbmRsZVJlcXVlc3QsIHsgd2hlcmU6ICdzZXJ2ZXInIH0pO1xuIl19
