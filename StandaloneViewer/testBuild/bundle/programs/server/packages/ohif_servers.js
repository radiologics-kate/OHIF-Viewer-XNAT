(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:servers":{"both":{"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/index.js                                                               //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.watch(require("./base.js"));
module.watch(require("./collections"));
module.watch(require("./lib"));
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"base.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/base.js                                                                //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.servers = {
  collections: {}
};
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"collections":{"currentServer.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/collections/currentServer.js                                           //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.export({
  CurrentServer: () => CurrentServer
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
// CurrentServer is a single document collection to describe which of the Servers is being used
let collectionName = 'currentServer';

if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.clientOnly === true) {
  collectionName = null;
}

const CurrentServer = new Mongo.Collection(collectionName);
CurrentServer._debugName = 'CurrentServer';
OHIF.servers.collections.currentServer = CurrentServer;
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/collections/index.js                                                   //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.export({
  CurrentServer: () => CurrentServer,
  Servers: () => Servers
});
let CurrentServer;
module.watch(require("./currentServer.js"), {
  CurrentServer(v) {
    CurrentServer = v;
  }

}, 0);
let Servers;
module.watch(require("./servers.js"), {
  Servers(v) {
    Servers = v;
  }

}, 1);
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"servers.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/collections/servers.js                                                 //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.export({
  Servers: () => Servers
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
// import { Servers as ServerSchema } from 'meteor/ohif:servers/both/schema/servers.js';
let collectionName = 'servers';

if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.clientOnly === true) {
  collectionName = null;
} // Servers describe the DICOM servers configurations


const Servers = new Mongo.Collection(collectionName); // TODO: Make the Schema match what we are currently sticking into the Collection
//Servers.attachSchema(ServerSchema);

Servers._debugName = 'Servers';
OHIF.servers.collections.servers = Servers;
///////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"getCurrentServer.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/lib/getCurrentServer.js                                                //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let Servers, CurrentServer;
module.watch(require("meteor/ohif:servers/both/collections"), {
  Servers(v) {
    Servers = v;
  },

  CurrentServer(v) {
    CurrentServer = v;
  }

}, 1);

/**
 * Retrieves the current server configuration used to retrieve studies
 */
OHIF.servers.getCurrentServer = () => {
  const currentServer = CurrentServer.findOne();

  if (!currentServer) {
    return;
  }

  const serverConfiguration = Servers.findOne({
    _id: currentServer.serverId
  });
  return serverConfiguration;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/both/lib/index.js                                                           //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.watch(require("./getCurrentServer.js"));
///////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/index.js                                                             //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.watch(require("./publications.js"));
module.watch(require("./methods.js"));
module.watch(require("./startup.js"));
module.watch(require("./lib"));
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/methods.js                                                           //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
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
Meteor.methods({
  serverFind: query => OHIF.servers.control.find(query),
  serverSave: serverSettings => OHIF.servers.control.save(serverSettings),
  serverSetActive: serverId => OHIF.servers.control.setActive(serverId),
  serverRemove: serverId => OHIF.servers.control.remove(serverId)
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/publications.js                                                      //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Servers, CurrentServer;
module.watch(require("meteor/ohif:servers/both/collections"), {
  Servers(v) {
    Servers = v;
  },

  CurrentServer(v) {
    CurrentServer = v;
  }

}, 1);
// When publishing Servers Collection, do not publish the requestOptions.headers
// field in case any authentication information is being passed
Meteor.publish('servers', () => Servers.find({}, {
  fields: {
    'requestOptions.headers': 0,
    'requestOptions.auth': 0
  }
}));
Meteor.publish('currentServer', () => CurrentServer.find());
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/startup.js                                                           //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
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

// Check the servers on meteor startup
if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.clientOnly !== true) {
  Meteor.startup(function () {
    OHIF.log.info('Updating servers information from JSON configuration');

    _.each(Meteor.settings.servers, function (endpoints, serverType) {
      _.each(endpoints, function (endpoint) {
        const server = _.clone(endpoint);

        server.origin = 'json';
        server.type = serverType; // Try to find a server with the same name/type/origin combination

        const existingServer = Servers.findOne({
          name: server.name,
          type: server.type,
          origin: server.origin
        }); // Check if server was already added. Update it if so and insert if not

        if (existingServer) {
          Servers.update(existingServer._id, {
            $set: server
          });
        } else {
          Servers.insert(server);
        }
      });
    });

    OHIF.servers.control.resetCurrentServer();
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"control.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/lib/control.js                                                       //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
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
let Servers, CurrentServer;
module.watch(require("meteor/ohif:servers/both/collections"), {
  Servers(v) {
    Servers = v;
  },

  CurrentServer(v) {
    CurrentServer = v;
  }

}, 2);
OHIF.servers.control = {
  writeCallback(error, affected) {
    if (error) {
      throw new Meteor.Error('data-write', error);
    }
  },

  resetCurrentServer() {
    const currentServer = CurrentServer.findOne();

    if (currentServer && Servers.find({
      _id: currentServer.serverId
    }).count()) {
      return;
    }

    const newServer = Servers.findOne({
      origin: 'json',
      type: Meteor.settings.defaultServiceType || 'dicomWeb'
    });

    if (newServer) {
      CurrentServer.remove({});
      CurrentServer.insert({
        serverId: newServer._id
      });
    }
  },

  find(query) {
    return Servers.find(query).fetch();
  },

  save(serverSettings) {
    const query = {
      _id: serverSettings._id
    };
    const options = {
      upsert: true
    };

    if (!serverSettings._id) {
      delete serverSettings._id;
    }

    return Servers.update(query, serverSettings, options, this.writeCallback);
  },

  setActive(serverId) {
    CurrentServer.remove({});
    CurrentServer.insert({
      serverId: serverId
    });
  },

  remove(serverId) {
    const query = {
      _id: serverId
    };
    const removeStatus = Servers.remove(query, this.writeCallback);
    OHIF.servers.control.resetCurrentServer();
    return removeStatus;
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/ohif_servers/server/lib/index.js                                                         //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
module.watch(require("./control.js"));
///////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:servers/both/index.js");
require("/node_modules/meteor/ohif:servers/server/index.js");

/* Exports */
Package._define("ohif:servers");

})();

//# sourceURL=meteor://💻app/packages/ohif_servers.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzZXJ2ZXJzL2JvdGgvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9ib3RoL2Jhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zL2N1cnJlbnRTZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnNlcnZlcnMvYm90aC9jb2xsZWN0aW9ucy9zZXJ2ZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnNlcnZlcnMvYm90aC9saWIvZ2V0Q3VycmVudFNlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzZXJ2ZXJzL2JvdGgvbGliL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnNlcnZlcnMvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnNlcnZlcnMvc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9zZXJ2ZXIvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnNlcnZlcnMvc2VydmVyL3N0YXJ0dXAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9zZXJ2ZXIvbGliL2NvbnRyb2wuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c2VydmVycy9zZXJ2ZXIvbGliL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsIk9ISUYiLCJ2Iiwic2VydmVycyIsImNvbGxlY3Rpb25zIiwiZXhwb3J0IiwiQ3VycmVudFNlcnZlciIsIk1vbmdvIiwiY29sbGVjdGlvbk5hbWUiLCJNZXRlb3IiLCJzZXR0aW5ncyIsInB1YmxpYyIsImNsaWVudE9ubHkiLCJDb2xsZWN0aW9uIiwiX2RlYnVnTmFtZSIsImN1cnJlbnRTZXJ2ZXIiLCJTZXJ2ZXJzIiwiZ2V0Q3VycmVudFNlcnZlciIsImZpbmRPbmUiLCJzZXJ2ZXJDb25maWd1cmF0aW9uIiwiX2lkIiwic2VydmVySWQiLCJtZXRob2RzIiwic2VydmVyRmluZCIsInF1ZXJ5IiwiY29udHJvbCIsImZpbmQiLCJzZXJ2ZXJTYXZlIiwic2VydmVyU2V0dGluZ3MiLCJzYXZlIiwic2VydmVyU2V0QWN0aXZlIiwic2V0QWN0aXZlIiwic2VydmVyUmVtb3ZlIiwicmVtb3ZlIiwicHVibGlzaCIsImZpZWxkcyIsIl8iLCJzdGFydHVwIiwibG9nIiwiaW5mbyIsImVhY2giLCJlbmRwb2ludHMiLCJzZXJ2ZXJUeXBlIiwiZW5kcG9pbnQiLCJzZXJ2ZXIiLCJjbG9uZSIsIm9yaWdpbiIsInR5cGUiLCJleGlzdGluZ1NlcnZlciIsIm5hbWUiLCJ1cGRhdGUiLCIkc2V0IiwiaW5zZXJ0IiwicmVzZXRDdXJyZW50U2VydmVyIiwid3JpdGVDYWxsYmFjayIsImVycm9yIiwiYWZmZWN0ZWQiLCJFcnJvciIsImNvdW50IiwibmV3U2VydmVyIiwiZGVmYXVsdFNlcnZpY2VUeXBlIiwiZmV0Y2giLCJvcHRpb25zIiwidXBzZXJ0IiwicmVtb3ZlU3RhdHVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYjtBQUFtQ0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYjtBQUF1Q0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE9BQVIsQ0FBYixFOzs7Ozs7Ozs7OztBQ0ExRSxJQUFJQyxJQUFKO0FBQVNILE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVB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QUFJQSxRQUFJLENBQUNuQyxlQUFlUixHQUFwQixFQUF5QjtBQUNyQixhQUFPUSxlQUFlUixHQUF0QjtBQUNIOztBQUVELFdBQU9KLFFBQVFrQyxNQUFSLENBQWUxQixLQUFmLEVBQXNCSSxjQUF0QixFQUFzQ2tDLE9BQXRDLEVBQStDLEtBQUtSLGFBQXBELENBQVA7QUFDSCxHQTNDa0I7O0FBNkNuQnZCLFlBQVVWLFFBQVYsRUFBb0I7QUFDaEJmLGtCQUFjMkIsTUFBZCxDQUFxQixFQUFyQjtBQUNBM0Isa0JBQWM4QyxNQUFkLENBQXFCO0FBQ2pCL0IsZ0JBQVVBO0FBRE8sS0FBckI7QUFHSCxHQWxEa0I7O0FBb0RuQlksU0FBT1osUUFBUCxFQUFpQjtBQUNiLFVBQU1HLFFBQVE7QUFDVkosV0FBS0M7QUFESyxLQUFkO0FBSUEsVUFBTTJDLGVBQWVoRCxRQUFRaUIsTUFBUixDQUFlVCxLQUFmLEVBQXNCLEtBQUs4QixhQUEzQixDQUFyQjtBQUVBckQsU0FBS0UsT0FBTCxDQUFhc0IsT0FBYixDQUFxQjRCLGtCQUFyQjtBQUVBLFdBQU9XLFlBQVA7QUFDSDs7QUE5RGtCLENBQXZCLEM7Ozs7Ozs7Ozs7O0FDSkFsRSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEUiLCJmaWxlIjoiL3BhY2thZ2VzL29oaWZfc2VydmVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9iYXNlLmpzJztcbmltcG9ydCAnLi9jb2xsZWN0aW9ucyc7XG5pbXBvcnQgJy4vbGliJztcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuT0hJRi5zZXJ2ZXJzID0ge1xuICAgIGNvbGxlY3Rpb25zOiB7fVxufTtcbiIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuLy8gQ3VycmVudFNlcnZlciBpcyBhIHNpbmdsZSBkb2N1bWVudCBjb2xsZWN0aW9uIHRvIGRlc2NyaWJlIHdoaWNoIG9mIHRoZSBTZXJ2ZXJzIGlzIGJlaW5nIHVzZWRcbmxldCBjb2xsZWN0aW9uTmFtZSA9ICdjdXJyZW50U2VydmVyJztcbmlmIChNZXRlb3Iuc2V0dGluZ3MgJiYgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYyAmJiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmNsaWVudE9ubHkgPT09IHRydWUpIHtcbiAgICBjb2xsZWN0aW9uTmFtZSA9IG51bGw7XG59XG5cbmNvbnN0IEN1cnJlbnRTZXJ2ZXIgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG5DdXJyZW50U2VydmVyLl9kZWJ1Z05hbWUgPSAnQ3VycmVudFNlcnZlcic7XG5PSElGLnNlcnZlcnMuY29sbGVjdGlvbnMuY3VycmVudFNlcnZlciA9IEN1cnJlbnRTZXJ2ZXI7XG5cbmV4cG9ydCB7IEN1cnJlbnRTZXJ2ZXIgfTtcbiIsImltcG9ydCB7IEN1cnJlbnRTZXJ2ZXIgfSBmcm9tICcuL2N1cnJlbnRTZXJ2ZXIuanMnO1xuaW1wb3J0IHsgU2VydmVycyB9IGZyb20gJy4vc2VydmVycy5qcyc7XG5cbmV4cG9ydCB7IEN1cnJlbnRTZXJ2ZXIsIFNlcnZlcnMgfTtcbiIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcbi8vIGltcG9ydCB7IFNlcnZlcnMgYXMgU2VydmVyU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL29oaWY6c2VydmVycy9ib3RoL3NjaGVtYS9zZXJ2ZXJzLmpzJztcblxubGV0IGNvbGxlY3Rpb25OYW1lID0gJ3NlcnZlcnMnO1xuaWYgKE1ldGVvci5zZXR0aW5ncyAmJiBNZXRlb3Iuc2V0dGluZ3MucHVibGljICYmIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2xpZW50T25seSA9PT0gdHJ1ZSkge1xuICAgIGNvbGxlY3Rpb25OYW1lID0gbnVsbDtcbn1cblxuLy8gU2VydmVycyBkZXNjcmliZSB0aGUgRElDT00gc2VydmVycyBjb25maWd1cmF0aW9uc1xuY29uc3QgU2VydmVycyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbi8vIFRPRE86IE1ha2UgdGhlIFNjaGVtYSBtYXRjaCB3aGF0IHdlIGFyZSBjdXJyZW50bHkgc3RpY2tpbmcgaW50byB0aGUgQ29sbGVjdGlvblxuLy9TZXJ2ZXJzLmF0dGFjaFNjaGVtYShTZXJ2ZXJTY2hlbWEpO1xuU2VydmVycy5fZGVidWdOYW1lID0gJ1NlcnZlcnMnO1xuT0hJRi5zZXJ2ZXJzLmNvbGxlY3Rpb25zLnNlcnZlcnMgPSBTZXJ2ZXJzO1xuXG5leHBvcnQgeyBTZXJ2ZXJzIH07XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBTZXJ2ZXJzLCBDdXJyZW50U2VydmVyIH0gZnJvbSAnbWV0ZW9yL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zJztcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2VydmVyIGNvbmZpZ3VyYXRpb24gdXNlZCB0byByZXRyaWV2ZSBzdHVkaWVzXG4gKi9cbk9ISUYuc2VydmVycy5nZXRDdXJyZW50U2VydmVyID0gKCkgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnRTZXJ2ZXIgPSBDdXJyZW50U2VydmVyLmZpbmRPbmUoKTtcblxuICAgIGlmICghY3VycmVudFNlcnZlcikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VydmVyQ29uZmlndXJhdGlvbiA9IFNlcnZlcnMuZmluZE9uZSh7IF9pZDogY3VycmVudFNlcnZlci5zZXJ2ZXJJZCB9KTtcblxuICAgIHJldHVybiBzZXJ2ZXJDb25maWd1cmF0aW9uO1xufTtcbiIsImltcG9ydCAnLi9nZXRDdXJyZW50U2VydmVyLmpzJztcbiIsImltcG9ydCAnLi9wdWJsaWNhdGlvbnMuanMnO1xuaW1wb3J0ICcuL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuL3N0YXJ0dXAuanMnO1xuaW1wb3J0ICcuL2xpYic7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgIHNlcnZlckZpbmQ6IHF1ZXJ5ID0+IE9ISUYuc2VydmVycy5jb250cm9sLmZpbmQocXVlcnkpLFxuICAgIHNlcnZlclNhdmU6IHNlcnZlclNldHRpbmdzID0+IE9ISUYuc2VydmVycy5jb250cm9sLnNhdmUoc2VydmVyU2V0dGluZ3MpLFxuICAgIHNlcnZlclNldEFjdGl2ZTogc2VydmVySWQgPT4gT0hJRi5zZXJ2ZXJzLmNvbnRyb2wuc2V0QWN0aXZlKHNlcnZlcklkKSxcbiAgICBzZXJ2ZXJSZW1vdmU6IHNlcnZlcklkID0+IE9ISUYuc2VydmVycy5jb250cm9sLnJlbW92ZShzZXJ2ZXJJZClcbn0pO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBTZXJ2ZXJzLCBDdXJyZW50U2VydmVyIH0gZnJvbSAnbWV0ZW9yL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zJztcblxuLy8gV2hlbiBwdWJsaXNoaW5nIFNlcnZlcnMgQ29sbGVjdGlvbiwgZG8gbm90IHB1Ymxpc2ggdGhlIHJlcXVlc3RPcHRpb25zLmhlYWRlcnNcbi8vIGZpZWxkIGluIGNhc2UgYW55IGF1dGhlbnRpY2F0aW9uIGluZm9ybWF0aW9uIGlzIGJlaW5nIHBhc3NlZFxuTWV0ZW9yLnB1Ymxpc2goJ3NlcnZlcnMnLCAoKSA9PiBTZXJ2ZXJzLmZpbmQoe30sIHtcbiAgICBmaWVsZHM6IHtcbiAgICAgICAgJ3JlcXVlc3RPcHRpb25zLmhlYWRlcnMnOiAwLFxuICAgICAgICAncmVxdWVzdE9wdGlvbnMuYXV0aCc6IDAsXG4gICAgfVxufSkpO1xuXG5NZXRlb3IucHVibGlzaCgnY3VycmVudFNlcnZlcicsICgpID0+IEN1cnJlbnRTZXJ2ZXIuZmluZCgpKTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcbmltcG9ydCB7IFNlcnZlcnMgfSBmcm9tICdtZXRlb3Ivb2hpZjpzZXJ2ZXJzL2JvdGgvY29sbGVjdGlvbnMnO1xuXG4vLyBDaGVjayB0aGUgc2VydmVycyBvbiBtZXRlb3Igc3RhcnR1cFxuaWYgKE1ldGVvci5zZXR0aW5ncyAmJlxuICAgIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMgJiZcbiAgICBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmNsaWVudE9ubHkgIT09IHRydWUpIHtcblxuICAgIE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICAgICAgICBPSElGLmxvZy5pbmZvKCdVcGRhdGluZyBzZXJ2ZXJzIGluZm9ybWF0aW9uIGZyb20gSlNPTiBjb25maWd1cmF0aW9uJyk7XG5cbiAgICAgICAgXy5lYWNoKE1ldGVvci5zZXR0aW5ncy5zZXJ2ZXJzLCBmdW5jdGlvbihlbmRwb2ludHMsIHNlcnZlclR5cGUpIHtcbiAgICAgICAgICAgIF8uZWFjaChlbmRwb2ludHMsIGZ1bmN0aW9uKGVuZHBvaW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyID0gXy5jbG9uZShlbmRwb2ludCk7XG4gICAgICAgICAgICAgICAgc2VydmVyLm9yaWdpbiA9ICdqc29uJztcbiAgICAgICAgICAgICAgICBzZXJ2ZXIudHlwZSA9IHNlcnZlclR5cGU7XG5cbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gZmluZCBhIHNlcnZlciB3aXRoIHRoZSBzYW1lIG5hbWUvdHlwZS9vcmlnaW4gY29tYmluYXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1NlcnZlciA9IFNlcnZlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHNlcnZlci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBzZXJ2ZXIudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBzZXJ2ZXIub3JpZ2luXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBzZXJ2ZXIgd2FzIGFscmVhZHkgYWRkZWQuIFVwZGF0ZSBpdCBpZiBzbyBhbmQgaW5zZXJ0IGlmIG5vdFxuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1NlcnZlcikge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2ZXJzLnVwZGF0ZShleGlzdGluZ1NlcnZlci5faWQsIHsgJHNldDogc2VydmVyIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZlcnMuaW5zZXJ0KHNlcnZlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9ISUYuc2VydmVycy5jb250cm9sLnJlc2V0Q3VycmVudFNlcnZlcigpO1xuICAgIH0pO1xufVxuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBTZXJ2ZXJzLCBDdXJyZW50U2VydmVyIH0gZnJvbSAnbWV0ZW9yL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zJztcblxuT0hJRi5zZXJ2ZXJzLmNvbnRyb2wgPSB7XG4gICAgd3JpdGVDYWxsYmFjayhlcnJvciwgYWZmZWN0ZWQpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdkYXRhLXdyaXRlJywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0Q3VycmVudFNlcnZlcigpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFNlcnZlciA9IEN1cnJlbnRTZXJ2ZXIuZmluZE9uZSgpO1xuICAgICAgICBpZiAoY3VycmVudFNlcnZlciAmJiBTZXJ2ZXJzLmZpbmQoeyBfaWQ6IGN1cnJlbnRTZXJ2ZXIuc2VydmVySWQgfSkuY291bnQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3U2VydmVyID0gU2VydmVycy5maW5kT25lKHtcbiAgICAgICAgICAgIG9yaWdpbjogJ2pzb24nLFxuICAgICAgICAgICAgdHlwZTogTWV0ZW9yLnNldHRpbmdzLmRlZmF1bHRTZXJ2aWNlVHlwZSB8fCAnZGljb21XZWInXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChuZXdTZXJ2ZXIpIHtcbiAgICAgICAgICAgIEN1cnJlbnRTZXJ2ZXIucmVtb3ZlKHt9KTtcbiAgICAgICAgICAgIEN1cnJlbnRTZXJ2ZXIuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICBzZXJ2ZXJJZDogbmV3U2VydmVyLl9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmluZChxdWVyeSkge1xuICAgICAgICByZXR1cm4gU2VydmVycy5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xuICAgIH0sXG5cbiAgICBzYXZlKHNlcnZlclNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0ge1xuICAgICAgICAgICAgX2lkOiBzZXJ2ZXJTZXR0aW5ncy5faWRcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHVwc2VydDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghc2VydmVyU2V0dGluZ3MuX2lkKSB7XG4gICAgICAgICAgICBkZWxldGUgc2VydmVyU2V0dGluZ3MuX2lkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFNlcnZlcnMudXBkYXRlKHF1ZXJ5LCBzZXJ2ZXJTZXR0aW5ncywgb3B0aW9ucywgdGhpcy53cml0ZUNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgc2V0QWN0aXZlKHNlcnZlcklkKSB7XG4gICAgICAgIEN1cnJlbnRTZXJ2ZXIucmVtb3ZlKHt9KTtcbiAgICAgICAgQ3VycmVudFNlcnZlci5pbnNlcnQoe1xuICAgICAgICAgICAgc2VydmVySWQ6IHNlcnZlcklkXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW1vdmUoc2VydmVySWQpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB7XG4gICAgICAgICAgICBfaWQ6IHNlcnZlcklkXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVtb3ZlU3RhdHVzID0gU2VydmVycy5yZW1vdmUocXVlcnksIHRoaXMud3JpdGVDYWxsYmFjayk7XG5cbiAgICAgICAgT0hJRi5zZXJ2ZXJzLmNvbnRyb2wucmVzZXRDdXJyZW50U2VydmVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHJlbW92ZVN0YXR1cztcbiAgICB9XG59O1xuIiwiaW1wb3J0ICcuL2NvbnRyb2wuanMnO1xuIl19
