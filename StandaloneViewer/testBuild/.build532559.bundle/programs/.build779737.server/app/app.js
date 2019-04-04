var require = meteorInstall({"server":{"collections.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// server/collections.js                                                                             //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
// Create a Collection to store data
RequestStudies = new Meteor.Collection('requestStudies'); // Remove all previous data

RequestStudies.remove({});
const testDataFiles = ['sample.json', 'testDICOMs.json', 'CRStudy.json', 'CTStudy.json', 'DXStudy.json', 'MGStudy.json', 'MRStudy.json', 'PTCTStudy.json', 'RFStudy.json'];
testDataFiles.forEach(file => {
  if (file.indexOf('.json') === -1) {
    return;
  } // Read JSON files and save the content in the database


  const jsonData = Assets.getText(`testData/${file}`);
  const data = JSON.parse(jsonData);
  RequestStudies.insert(data);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

}},"routes.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// routes.js                                                                                         //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
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
let icrXnatRoiSession;
module.watch(require("meteor/icr:xnat-roi-namespace"), {
  icrXnatRoiSession(v) {
    icrXnatRoiSession = v;
  }

}, 3);
let sessionMap;
module.watch(require("meteor/icr:series-info-provider"), {
  sessionMap(v) {
    sessionMap = v;
  }

}, 4);
console.log(Meteor.isDevelopment);

if (Meteor.isClient && !Meteor.isDevelopment) {
  // XNAT deployment mode.
  // Disconnect from the Meteor Server since we don't need it
  OHIF.log.info('Disconnecting from the Meteor server');
  Meteor.disconnect();
  const url = window.location.href;
  const origin = window.location.origin;
  const urlExtention = url.replace(origin, '').split('VIEWER')[0].replace(/\//g, '');
  console.log(urlExtention);
  let viewerRoot;
  let rootUrl;

  if (urlExtention) {
    viewerRoot = `/${urlExtention}/VIEWER`;
    rootUrl = `${origin}/${urlExtention}`;
  } else {
    viewerRoot = `/VIEWER`;
    rootUrl = origin;
  }

  Session.set('rootUrl', rootUrl);
  Session.set('viewerRoot', viewerRoot);
  console.log(`origin: ${origin}`);
  console.log(`urlExtention ${urlExtention}`);
  console.log(`rootUrl: ${rootUrl}`);
  console.log(`viewerRoot" ${viewerRoot}`);
  Router.configure({
    loadingTemplate: 'loading'
  });
  Router.onBeforeAction('loading'); // JPETTS -- route based on XNAT root

  Router.route(`${viewerRoot}`, {
    onRun: function () {
      console.log('onRun');
      const next = this.next;
      console.log(this.params); // Query params:
      //
      // Single Session:
      //   projectId, subjectId, experimentId, experimentLabel
      //
      // Single Session in shared project:
      //   projectId, subjectId, experimentId, experimentLabel, parentProjectId
      //
      // Subject:
      //   projectId, subjectId
      //
      // Subject in shared project (WIP):
      //  projectId, subjectId, parentProjectId

      let subjectId;
      let projectId;
      let experimentId;
      let experimentLabel;
      let parentProjectId;

      if (this.params.query) {
        const query = this.params.query;
        experimentLabel = query.experimentLabel;
        parentProjectId = query.parentProjectId;
        subjectId = query.subjectId;
        projectId = query.projectId;
        experimentId = query.experimentId;
      } else {
        console.error('insufficient query parameters.');
      }

      if (parentProjectId) {
        console.log(`This experiment is shared view of ${experimentId} from ${parentProjectId}`);
      }

      if (experimentId) {
        // Single Session
        //
        icrXnatRoiSession.set('sourceProjectId', parentProjectId ? parentProjectId : projectId);
        icrXnatRoiSession.set('experimentId', experimentId);
        icrXnatRoiSession.set('subjectId', subjectId);
        icrXnatRoiSession.set('projectId', projectId);
        icrXnatRoiSession.set('parentProjectId', parentProjectId);
        OHIF.RoiStateManagement.checkAndSetPermissions(); // Build JSON GET url.

        const jsonRequestUrl = `${Session.get('rootUrl')}/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
        getJson(jsonRequestUrl).then(json => {
          // Parse the response content
          // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
          if (!json) {
            OHIF.log.warn('Response was undefined');
            return;
          }

          sessionMap.set(json, experimentId, experimentLabel);
          let jsonString = JSON.stringify(json);

          if (parentProjectId) {
            console.log(`replacing ${parentProjectId} with ${projectId}`);
            jsonString = jsonString.replace(new RegExp(parentProjectId, 'g'), projectId);
          }

          this.data = JSON.parse(jsonString);
          next();
        }).catch(error => {
          console.log(error);
          OHIF.log.warn('An error occurred while retrieving the JSON data');
          next();
        });
      } else {
        // Whole Subject.
        //
        icrXnatRoiSession.set('sourceProjectId', parentProjectId ? parentProjectId : projectId);
        icrXnatRoiSession.set('projectId', projectId);
        icrXnatRoiSession.set('subjectId', subjectId);
        const subjectExperimentListUrl = `${Session.get('rootUrl')}/data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;
        OHIF.RoiStateManagement.checkAndSetPermissions();
        getJson(subjectExperimentListUrl).then(json => {
          // TODO -> Fetch each json.
          // Promise.all and combine JSON.
          // Load up viewer.
          console.log(json);
          const experimentList = json.ResultSet.Result;
          const results = [];

          for (let i = 0; i < experimentList.length; i++) {
            const experimentIdI = experimentList[i].ID;
            const experimentJSONFetchUrl = `${Session.get('rootUrl')}/xapi/viewer/projects/${projectId}/experiments/${experimentIdI}`;
            results[i] = getJson(experimentJSONFetchUrl);
          }

          Promise.all(results).then(jsonFiles => {
            console.log(jsonFiles);
            let studyList = {
              transactionId: subjectId,
              studies: []
            };

            for (let i = 0; i < jsonFiles.length; i++) {
              const experimentJsonI = jsonFiles[i];
              const studiesI = experimentJsonI.studies;
              sessionMap.set(experimentJsonI, experimentList[i].ID, experimentList[i].label);
              console.log('Session Map:');
              console.log(sessionMap); // TODO -> clean this

              studiesI[0].studyDescription = experimentList[i].label || experimentList[i].ID;
              console.log(`Studies[${i}]`);
              console.log(studiesI);
              studyList.studies = [...studyList.studies, ...studiesI];
            }

            console.log(studyList);

            if (parentProjectId) {
              console.log(`replacing ${parentProjectId} with ${projectId}`);
              let jsonString = JSON.stringify(studyList);
              jsonString = jsonString.replace(new RegExp(parentProjectId, 'g'), projectId);
              studyList = JSON.parse(jsonString);
            }

            console.log(studyList);
            this.data = studyList;
            console.log(this);
            console.log(this.data);
            next();
          });
        });
      }
    },

    action() {
      console.log('Loading up viewer with json!'); // Render the Viewer with this data

      this.render('standaloneViewer', {
        data: () => this.data
      });
    }

  });
} else {
  // Local dev mode.
  if (Meteor.isClient) {
    // Disconnect from the Meteor Server since we don't need it
    OHIF.log.info('Disconnecting from the Meteor server');
    Meteor.disconnect();
    Router.configure({
      loadingTemplate: 'loading'
    });
    Router.onBeforeAction('loading');
    Router.route('/:id?', {
      onRun: function () {
        console.warn('onRun'); // Retrieve the query from the URL the user has entered

        const query = this.params.query;
        const id = this.params.id;

        if (!id && !query.url) {
          console.log('No URL was specified. Use ?url=${yourURL}');
          return;
        }

        const next = this.next;
        const idUrl = `/api/${id}`;
        const url = query.url || idUrl; // Define a request to the server to retrieve the study data
        // as JSON, given a URL that was in the Route

        const oReq = new XMLHttpRequest(); // Add event listeners for request failure

        oReq.addEventListener('error', () => {
          OHIF.log.warn('An error occurred while retrieving the JSON data');
          next();
        }); // When the JSON has been returned, parse it into a JavaScript Object
        // and render the OHIF Viewer with this data

        oReq.addEventListener('load', () => {
          // Parse the response content
          // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
          if (!oReq.responseText) {
            OHIF.log.warn('Response was undefined');
            return;
          }

          OHIF.log.info(JSON.stringify(oReq.responseText, null, 2));
          const parsedJSON = JSON.parse(oReq.responseText);
          sessionMap.set(parsedJSON, 'TEST_EXPERIMENT_ID', 'TEST_EXPERIMENT_LABEL');
          this.data = parsedJSON;
          next();
        }); // Open the Request to the server for the JSON data
        // In this case we have a server-side route called /api/
        // which responds to GET requests with the study data

        OHIF.log.info(`Sending Request to: ${url}`);
        oReq.open('GET', url);
        oReq.setRequestHeader('Accept', 'application/json'); // Fire the request to the server

        oReq.send();
      },

      action() {
        // Render the Viewer with this data
        this.render('standaloneViewer', {
          data: () => this.data
        });
      }

    });
  } // This is ONLY for demo purposes.


  if (Meteor.isServer) {
    // You can test this with:
    // curl -v -H "Content-Type: application/json" -X GET 'http://localhost:3000/getData/testId'
    //
    // Or by going to:
    // http://localhost:3000/api/testId
    Router.route('/api/:id', {
      where: 'server'
    }).get(function () {
      // "this" is the RouteController instance.
      // "this.response" is the Connect response object
      // "this.request" is the Connect request object
      const id = this.params.id; // Find the relevant study data from the Collection given the ID

      const data = RequestStudies.findOne({
        transactionId: id
      }); // Set the response headers to return JSON to any server

      this.response.setHeader('Content-Type', 'application/json');
      this.response.setHeader('Access-Control-Allow-Origin', '*');
      this.response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // Change the response text depending on the available study data

      if (!data) {
        this.response.write('No Data Found');
      } else {
        // Stringify the JavaScript object to JSON for the response
        this.response.write(JSON.stringify(data));
      } // Finalize the response


      this.response.end();
    });
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    // Define a request to the server to retrieve the session data as JSON.
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`GET ${url}... ${xhr.status}`);
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////

}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/collections.js");
require("/routes.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL2NvbGxlY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9yb3V0ZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlJlcXVlc3RTdHVkaWVzIiwiQ29sbGVjdGlvbiIsInJlbW92ZSIsInRlc3REYXRhRmlsZXMiLCJmb3JFYWNoIiwiZmlsZSIsImluZGV4T2YiLCJqc29uRGF0YSIsIkFzc2V0cyIsImdldFRleHQiLCJkYXRhIiwiSlNPTiIsInBhcnNlIiwiaW5zZXJ0IiwiUm91dGVyIiwiT0hJRiIsImljclhuYXRSb2lTZXNzaW9uIiwic2Vzc2lvbk1hcCIsImNvbnNvbGUiLCJsb2ciLCJpc0RldmVsb3BtZW50IiwiaXNDbGllbnQiLCJpbmZvIiwiZGlzY29ubmVjdCIsInVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiaHJlZiIsIm9yaWdpbiIsInVybEV4dGVudGlvbiIsInJlcGxhY2UiLCJzcGxpdCIsInZpZXdlclJvb3QiLCJyb290VXJsIiwiU2Vzc2lvbiIsInNldCIsImNvbmZpZ3VyZSIsImxvYWRpbmdUZW1wbGF0ZSIsIm9uQmVmb3JlQWN0aW9uIiwicm91dGUiLCJvblJ1biIsIm5leHQiLCJwYXJhbXMiLCJzdWJqZWN0SWQiLCJwcm9qZWN0SWQiLCJleHBlcmltZW50SWQiLCJleHBlcmltZW50TGFiZWwiLCJwYXJlbnRQcm9qZWN0SWQiLCJxdWVyeSIsImVycm9yIiwiUm9pU3RhdGVNYW5hZ2VtZW50IiwiY2hlY2tBbmRTZXRQZXJtaXNzaW9ucyIsImpzb25SZXF1ZXN0VXJsIiwiZ2V0IiwiZ2V0SnNvbiIsInRoZW4iLCJqc29uIiwid2FybiIsImpzb25TdHJpbmciLCJzdHJpbmdpZnkiLCJSZWdFeHAiLCJjYXRjaCIsInN1YmplY3RFeHBlcmltZW50TGlzdFVybCIsImV4cGVyaW1lbnRMaXN0IiwiUmVzdWx0U2V0IiwiUmVzdWx0IiwicmVzdWx0cyIsImkiLCJsZW5ndGgiLCJleHBlcmltZW50SWRJIiwiSUQiLCJleHBlcmltZW50SlNPTkZldGNoVXJsIiwiUHJvbWlzZSIsImFsbCIsImpzb25GaWxlcyIsInN0dWR5TGlzdCIsInRyYW5zYWN0aW9uSWQiLCJzdHVkaWVzIiwiZXhwZXJpbWVudEpzb25JIiwic3R1ZGllc0kiLCJsYWJlbCIsInN0dWR5RGVzY3JpcHRpb24iLCJhY3Rpb24iLCJyZW5kZXIiLCJpZCIsImlkVXJsIiwib1JlcSIsIlhNTEh0dHBSZXF1ZXN0IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlc3BvbnNlVGV4dCIsInBhcnNlZEpTT04iLCJvcGVuIiwic2V0UmVxdWVzdEhlYWRlciIsInNlbmQiLCJpc1NlcnZlciIsIndoZXJlIiwiZmluZE9uZSIsInJlc3BvbnNlIiwic2V0SGVhZGVyIiwid3JpdGUiLCJlbmQiLCJyZXNvbHZlIiwicmVqZWN0IiwieGhyIiwib25sb2FkIiwic3RhdHVzIiwib25lcnJvciIsInJlc3BvbnNlVHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0gsU0FBT0ksQ0FBUCxFQUFTO0FBQUNKLGFBQU9JLENBQVA7QUFBUzs7QUFBcEIsQ0FBdEMsRUFBNEQsQ0FBNUQ7QUFFWDtBQUNBQyxpQkFBaUIsSUFBSUwsT0FBT00sVUFBWCxDQUFzQixnQkFBdEIsQ0FBakIsQyxDQUVBOztBQUNBRCxlQUFlRSxNQUFmLENBQXNCLEVBQXRCO0FBRUEsTUFBTUMsZ0JBQWdCLENBQ2xCLGFBRGtCLEVBRWxCLGlCQUZrQixFQUdsQixjQUhrQixFQUlsQixjQUprQixFQUtsQixjQUxrQixFQU1sQixjQU5rQixFQU9sQixjQVBrQixFQVFsQixnQkFSa0IsRUFTbEIsY0FUa0IsQ0FBdEI7QUFZQUEsY0FBY0MsT0FBZCxDQUFzQkMsUUFBUTtBQUMxQixNQUFJQSxLQUFLQyxPQUFMLENBQWEsT0FBYixNQUEwQixDQUFDLENB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cyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG4vLyBDcmVhdGUgYSBDb2xsZWN0aW9uIHRvIHN0b3JlIGRhdGFcblJlcXVlc3RTdHVkaWVzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdyZXF1ZXN0U3R1ZGllcycpO1xuXG4vLyBSZW1vdmUgYWxsIHByZXZpb3VzIGRhdGFcblJlcXVlc3RTdHVkaWVzLnJlbW92ZSh7fSk7XG5cbmNvbnN0IHRlc3REYXRhRmlsZXMgPSBbXG4gICAgJ3NhbXBsZS5qc29uJyxcbiAgICAndGVzdERJQ09Ncy5qc29uJyxcbiAgICAnQ1JTdHVkeS5qc29uJyxcbiAgICAnQ1RTdHVkeS5qc29uJyxcbiAgICAnRFhTdHVkeS5qc29uJyxcbiAgICAnTUdTdHVkeS5qc29uJyxcbiAgICAnTVJTdHVkeS5qc29uJyxcbiAgICAnUFRDVFN0dWR5Lmpzb24nLFxuICAgICdSRlN0dWR5Lmpzb24nXG5dO1xuXG50ZXN0RGF0YUZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgaWYgKGZpbGUuaW5kZXhPZignLmpzb24nKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlYWQgSlNPTiBmaWxlcyBhbmQgc2F2ZSB0aGUgY29udGVudCBpbiB0aGUgZGF0YWJhc2VcbiAgICBjb25zdCBqc29uRGF0YSA9IEFzc2V0cy5nZXRUZXh0KGB0ZXN0RGF0YS8ke2ZpbGV9YCk7XG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoanNvbkRhdGEpO1xuXG4gICAgUmVxdWVzdFN0dWRpZXMuaW5zZXJ0KGRhdGEpO1xufSk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gJ21ldGVvci9jbGluaWNhbDpyb3V0ZXInO1xuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuaW1wb3J0IHsgaWNyWG5hdFJvaVNlc3Npb24gfSBmcm9tICdtZXRlb3IvaWNyOnhuYXQtcm9pLW5hbWVzcGFjZSc7XG5pbXBvcnQgeyBzZXNzaW9uTWFwIH0gZnJvbSAnbWV0ZW9yL2ljcjpzZXJpZXMtaW5mby1wcm92aWRlcic7XG5cbmNvbnNvbGUubG9nKE1ldGVvci5pc0RldmVsb3BtZW50KTtcblxuaWYgKE1ldGVvci5pc0NsaWVudCAmJiAhTWV0ZW9yLmlzRGV2ZWxvcG1lbnQpIHtcbiAgLy8gWE5BVCBkZXBsb3ltZW50IG1vZGUuXG4gIC8vIERpc2Nvbm5lY3QgZnJvbSB0aGUgTWV0ZW9yIFNlcnZlciBzaW5jZSB3ZSBkb24ndCBuZWVkIGl0XG4gIE9ISUYubG9nLmluZm8oJ0Rpc2Nvbm5lY3RpbmcgZnJvbSB0aGUgTWV0ZW9yIHNlcnZlcicpO1xuICBNZXRlb3IuZGlzY29ubmVjdCgpO1xuXG4gIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXG4gIGNvbnN0IG9yaWdpbiA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW47XG4gIGNvbnN0IHVybEV4dGVudGlvbiA9IHVybC5yZXBsYWNlKG9yaWdpbiwgJycpLnNwbGl0KCdWSUVXRVInKVswXS5yZXBsYWNlKC9cXC8vZywgJycpO1xuXG4gIGNvbnNvbGUubG9nKHVybEV4dGVudGlvbik7XG5cbiAgbGV0IHZpZXdlclJvb3Q7XG4gIGxldCByb290VXJsO1xuXG4gIGlmICh1cmxFeHRlbnRpb24pIHtcbiAgICB2aWV3ZXJSb290ID0gYC8ke3VybEV4dGVudGlvbn0vVklFV0VSYDtcbiAgICByb290VXJsID0gYCR7b3JpZ2lufS8ke3VybEV4dGVudGlvbn1gO1xuICB9IGVsc2Uge1xuICAgIHZpZXdlclJvb3QgPSBgL1ZJRVdFUmA7XG4gICAgcm9vdFVybCA9IG9yaWdpbjtcbiAgfVxuXG4gIFNlc3Npb24uc2V0KCdyb290VXJsJywgcm9vdFVybCk7XG4gIFNlc3Npb24uc2V0KCd2aWV3ZXJSb290Jywgdmlld2VyUm9vdCk7XG5cbiAgY29uc29sZS5sb2coYG9yaWdpbjogJHtvcmlnaW59YCk7XG4gIGNvbnNvbGUubG9nKGB1cmxFeHRlbnRpb24gJHt1cmxFeHRlbnRpb259YCk7XG4gIGNvbnNvbGUubG9nKGByb290VXJsOiAke3Jvb3RVcmx9YCk7XG4gIGNvbnNvbGUubG9nKGB2aWV3ZXJSb290XCIgJHt2aWV3ZXJSb290fWApO1xuXG4gIFJvdXRlci5jb25maWd1cmUoe1xuICAgICAgbG9hZGluZ1RlbXBsYXRlOiAnbG9hZGluZydcbiAgfSk7XG5cbiAgUm91dGVyLm9uQmVmb3JlQWN0aW9uKCdsb2FkaW5nJyk7XG5cbiAgLy8gSlBFVFRTIC0tIHJvdXRlIGJhc2VkIG9uIFhOQVQgcm9vdFxuICBSb3V0ZXIucm91dGUoYCR7dmlld2VyUm9vdH1gLCB7XG4gICAgICBvblJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ29uUnVuJyk7XG5cbiAgICAgICAgICBjb25zdCBuZXh0ID0gdGhpcy5uZXh0O1xuXG4gICAgICAgICAgY29uc29sZS5sb2codGhpcy5wYXJhbXMpO1xuXG4gICAgICAgICAgLy8gUXVlcnkgcGFyYW1zOlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gU2luZ2xlIFNlc3Npb246XG4gICAgICAgICAgLy8gICBwcm9qZWN0SWQsIHN1YmplY3RJZCwgZXhwZXJpbWVudElkLCBleHBlcmltZW50TGFiZWxcbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFNpbmdsZSBTZXNzaW9uIGluIHNoYXJlZCBwcm9qZWN0OlxuICAgICAgICAgIC8vICAgcHJvamVjdElkLCBzdWJqZWN0SWQsIGV4cGVyaW1lbnRJZCwgZXhwZXJpbWVudExhYmVsLCBwYXJlbnRQcm9qZWN0SWRcbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFN1YmplY3Q6XG4gICAgICAgICAgLy8gICBwcm9qZWN0SWQsIHN1YmplY3RJZFxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gU3ViamVjdCBpbiBzaGFyZWQgcHJvamVjdCAoV0lQKTpcbiAgICAgICAgICAvLyAgcHJvamVjdElkLCBzdWJqZWN0SWQsIHBhcmVudFByb2plY3RJZFxuXG4gICAgICAgICAgbGV0IHN1YmplY3RJZDtcbiAgICAgICAgICBsZXQgcHJvamVjdElkO1xuICAgICAgICAgIGxldCBleHBlcmltZW50SWQ7XG4gICAgICAgICAgbGV0IGV4cGVyaW1lbnRMYWJlbDtcbiAgICAgICAgICBsZXQgcGFyZW50UHJvamVjdElkO1xuXG4gICAgICAgICAgaWYgKHRoaXMucGFyYW1zLnF1ZXJ5KSB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMucGFyYW1zLnF1ZXJ5O1xuXG4gICAgICAgICAgICBleHBlcmltZW50TGFiZWwgPSBxdWVyeS5leHBlcmltZW50TGFiZWw7XG4gICAgICAgICAgICBwYXJlbnRQcm9qZWN0SWQgPSBxdWVyeS5wYXJlbnRQcm9qZWN0SWQ7XG4gICAgICAgICAgICBzdWJqZWN0SWQgPSBxdWVyeS5zdWJqZWN0SWQ7XG4gICAgICAgICAgICBwcm9qZWN0SWQgPSBxdWVyeS5wcm9qZWN0SWQ7XG4gICAgICAgICAgICBleHBlcmltZW50SWQgPSBxdWVyeS5leHBlcmltZW50SWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2luc3VmZmljaWVudCBxdWVyeSBwYXJhbWV0ZXJzLicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwYXJlbnRQcm9qZWN0SWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUaGlzIGV4cGVyaW1lbnQgaXMgc2hhcmVkIHZpZXcgb2YgJHtleHBlcmltZW50SWR9IGZyb20gJHtwYXJlbnRQcm9qZWN0SWR9YCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV4cGVyaW1lbnRJZCkge1xuICAgICAgICAgICAgLy8gU2luZ2xlIFNlc3Npb25cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICBpY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ3NvdXJjZVByb2plY3RJZCcsIHBhcmVudFByb2plY3RJZCA/IHBhcmVudFByb2plY3RJZCA6IHByb2plY3RJZCk7XG4gICAgICAgICAgICBpY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ2V4cGVyaW1lbnRJZCcsIGV4cGVyaW1lbnRJZCk7XG4gICAgICAgICAgICBpY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ3N1YmplY3RJZCcsIHN1YmplY3RJZCk7XG4gICAgICAgICAgICBpY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ3Byb2plY3RJZCcsIHByb2plY3RJZCk7XG4gICAgICAgICAgICBpY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ3BhcmVudFByb2plY3RJZCcsIHBhcmVudFByb2plY3RJZCk7XG5cbiAgICAgICAgICAgIE9ISUYuUm9pU3RhdGVNYW5hZ2VtZW50LmNoZWNrQW5kU2V0UGVybWlzc2lvbnMoKTtcblxuICAgICAgICAgICAgLy8gQnVpbGQgSlNPTiBHRVQgdXJsLlxuICAgICAgICAgICAgY29uc3QganNvblJlcXVlc3RVcmwgPSBgJHtTZXNzaW9uLmdldCgncm9vdFVybCcpfS94YXBpL3ZpZXdlci9wcm9qZWN0cy8ke3Byb2plY3RJZH0vZXhwZXJpbWVudHMvJHtleHBlcmltZW50SWR9YDtcblxuICAgICAgICAgICAgZ2V0SnNvbihqc29uUmVxdWVzdFVybCkudGhlbihqc29uID0+IHtcbiAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIHJlc3BvbnNlIGNvbnRlbnRcbiAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1hNTEh0dHBSZXF1ZXN0L3Jlc3BvbnNlVGV4dFxuICAgICAgICAgICAgICBpZiAoIWpzb24pIHtcbiAgICAgICAgICAgICAgICAgIE9ISUYubG9nLndhcm4oJ1Jlc3BvbnNlIHdhcyB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNlc3Npb25NYXAuc2V0KGpzb24sIGV4cGVyaW1lbnRJZCwgZXhwZXJpbWVudExhYmVsKTtcblxuICAgICAgICAgICAgICBsZXQganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGpzb24pO1xuXG4gICAgICAgICAgICAgIGlmIChwYXJlbnRQcm9qZWN0SWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgcmVwbGFjaW5nICR7cGFyZW50UHJvamVjdElkfSB3aXRoICR7cHJvamVjdElkfWApO1xuICAgICAgICAgICAgICAgIGpzb25TdHJpbmcgPSBqc29uU3RyaW5nLnJlcGxhY2UoIG5ldyBSZWdFeHAoIHBhcmVudFByb2plY3RJZCwgJ2cnICksIHByb2plY3RJZCApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcblxuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgICAgT0hJRi5sb2cud2FybignQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgcmV0cmlldmluZyB0aGUgSlNPTiBkYXRhJyk7XG4gICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXaG9sZSBTdWJqZWN0LlxuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgaWNyWG5hdFJvaVNlc3Npb24uc2V0KCdzb3VyY2VQcm9qZWN0SWQnLCBwYXJlbnRQcm9qZWN0SWQgPyBwYXJlbnRQcm9qZWN0SWQgOiBwcm9qZWN0SWQpO1xuICAgICAgICAgICAgaWNyWG5hdFJvaVNlc3Npb24uc2V0KCdwcm9qZWN0SWQnLCBwcm9qZWN0SWQpO1xuICAgICAgICAgICAgaWNyWG5hdFJvaVNlc3Npb24uc2V0KCdzdWJqZWN0SWQnLCBzdWJqZWN0SWQpO1xuXG5cbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3RFeHBlcmltZW50TGlzdFVybCA9IGAke1Nlc3Npb24uZ2V0KCdyb290VXJsJyl9L2RhdGEvYXJjaGl2ZS9wcm9qZWN0cy8ke3Byb2plY3RJZH0vc3ViamVjdHMvJHtzdWJqZWN0SWR9L2V4cGVyaW1lbnRzP2Zvcm1hdD1qc29uYDtcblxuICAgICAgICAgICAgT0hJRi5Sb2lTdGF0ZU1hbmFnZW1lbnQuY2hlY2tBbmRTZXRQZXJtaXNzaW9ucygpO1xuXG4gICAgICAgICAgICBnZXRKc29uKHN1YmplY3RFeHBlcmltZW50TGlzdFVybCkudGhlbihqc29uID0+IHtcbiAgICAgICAgICAgICAgLy8gVE9ETyAtPiBGZXRjaCBlYWNoIGpzb24uXG4gICAgICAgICAgICAgIC8vIFByb21pc2UuYWxsIGFuZCBjb21iaW5lIEpTT04uXG4gICAgICAgICAgICAgIC8vIExvYWQgdXAgdmlld2VyLlxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhqc29uKTtcblxuICAgICAgICAgICAgICBjb25zdCBleHBlcmltZW50TGlzdCA9IGpzb24uUmVzdWx0U2V0LlJlc3VsdDtcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwZXJpbWVudExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBlcmltZW50SWRJID0gZXhwZXJpbWVudExpc3RbaV0uSUQ7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBleHBlcmltZW50SlNPTkZldGNoVXJsID0gYCR7U2Vzc2lvbi5nZXQoJ3Jvb3RVcmwnKX0veGFwaS92aWV3ZXIvcHJvamVjdHMvJHtwcm9qZWN0SWR9L2V4cGVyaW1lbnRzLyR7ZXhwZXJpbWVudElkSX1gO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpXSA9IGdldEpzb24oZXhwZXJpbWVudEpTT05GZXRjaFVybCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBQcm9taXNlLmFsbChyZXN1bHRzKS50aGVuKChqc29uRmlsZXMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhqc29uRmlsZXMpO1xuXG4gICAgICAgICAgICAgICAgbGV0IHN0dWR5TGlzdCA9IHtcbiAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uSWQ6IHN1YmplY3RJZCxcbiAgICAgICAgICAgICAgICAgIHN0dWRpZXM6IFtdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwganNvbkZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBleHBlcmltZW50SnNvbkkgPSBqc29uRmlsZXNbaV07XG4gICAgICAgICAgICAgICAgICBjb25zdCBzdHVkaWVzSSA9IGV4cGVyaW1lbnRKc29uSS5zdHVkaWVzO1xuXG4gICAgICAgICAgICAgICAgICBzZXNzaW9uTWFwLnNldChleHBlcmltZW50SnNvbkksIGV4cGVyaW1lbnRMaXN0W2ldLklELCBleHBlcmltZW50TGlzdFtpXS5sYWJlbCk7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXNzaW9uIE1hcDonKVxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2Vzc2lvbk1hcCk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLT4gY2xlYW4gdGhpc1xuICAgICAgICAgICAgICAgICAgc3R1ZGllc0lbMF0uc3R1ZHlEZXNjcmlwdGlvbiA9IGV4cGVyaW1lbnRMaXN0W2ldLmxhYmVsIHx8IGV4cGVyaW1lbnRMaXN0W2ldLklEO1xuXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU3R1ZGllc1ske2l9XWApO1xuXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdHVkaWVzSSk7XG5cbiAgICAgICAgICAgICAgICAgIHN0dWR5TGlzdC5zdHVkaWVzID0gWy4uLnN0dWR5TGlzdC5zdHVkaWVzLCAuLi5zdHVkaWVzSV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3R1ZHlMaXN0KTtcblxuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudFByb2plY3RJZCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHJlcGxhY2luZyAke3BhcmVudFByb2plY3RJZH0gd2l0aCAke3Byb2plY3RJZH1gKTtcblxuICAgICAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzdHVkeUxpc3QpO1xuXG4gICAgICAgICAgICAgICAgICBqc29uU3RyaW5nID0ganNvblN0cmluZy5yZXBsYWNlKCBuZXcgUmVnRXhwKCBwYXJlbnRQcm9qZWN0SWQsICdnJyApLCBwcm9qZWN0SWQgKTtcblxuICAgICAgICAgICAgICAgICAgc3R1ZHlMaXN0ID0gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdHVkeUxpc3QpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gc3R1ZHlMaXN0O1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcblxuICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGFjdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgdXAgdmlld2VyIHdpdGgganNvbiEnKTtcbiAgICAgICAgICAvLyBSZW5kZXIgdGhlIFZpZXdlciB3aXRoIHRoaXMgZGF0YVxuICAgICAgICAgIHRoaXMucmVuZGVyKCdzdGFuZGFsb25lVmlld2VyJywge1xuICAgICAgICAgICAgICBkYXRhOiAoKSA9PiB0aGlzLmRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgfSk7XG59IGVsc2Uge1xuICAgIC8vIExvY2FsIGRldiBtb2RlLlxuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIC8vIERpc2Nvbm5lY3QgZnJvbSB0aGUgTWV0ZW9yIFNlcnZlciBzaW5jZSB3ZSBkb24ndCBuZWVkIGl0XG4gICAgICBPSElGLmxvZy5pbmZvKCdEaXNjb25uZWN0aW5nIGZyb20gdGhlIE1ldGVvciBzZXJ2ZXInKTtcbiAgICAgIE1ldGVvci5kaXNjb25uZWN0KCk7XG5cbiAgICAgIFJvdXRlci5jb25maWd1cmUoe1xuICAgICAgICAgIGxvYWRpbmdUZW1wbGF0ZTogJ2xvYWRpbmcnXG4gICAgICB9KTtcblxuICAgICAgUm91dGVyLm9uQmVmb3JlQWN0aW9uKCdsb2FkaW5nJyk7XG5cbiAgICAgIFJvdXRlci5yb3V0ZSgnLzppZD8nLCB7XG4gICAgICAgICAgb25SdW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ29uUnVuJyk7XG4gICAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBxdWVyeSBmcm9tIHRoZSBVUkwgdGhlIHVzZXIgaGFzIGVudGVyZWRcbiAgICAgICAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnBhcmFtcy5xdWVyeTtcbiAgICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLnBhcmFtcy5pZDtcblxuICAgICAgICAgICAgICBpZiAoIWlkICYmICFxdWVyeS51cmwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBVUkwgd2FzIHNwZWNpZmllZC4gVXNlID91cmw9JHt5b3VyVVJMfScpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMubmV4dDtcbiAgICAgICAgICAgICAgY29uc3QgaWRVcmwgPSBgL2FwaS8ke2lkfWA7XG4gICAgICAgICAgICAgIGNvbnN0IHVybCA9IHF1ZXJ5LnVybCB8fCBpZFVybDtcblxuICAgICAgICAgICAgICAvLyBEZWZpbmUgYSByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgdG8gcmV0cmlldmUgdGhlIHN0dWR5IGRhdGFcbiAgICAgICAgICAgICAgLy8gYXMgSlNPTiwgZ2l2ZW4gYSBVUkwgdGhhdCB3YXMgaW4gdGhlIFJvdXRlXG4gICAgICAgICAgICAgIGNvbnN0IG9SZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIGZvciByZXF1ZXN0IGZhaWx1cmVcbiAgICAgICAgICAgICAgb1JlcS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIE9ISUYubG9nLndhcm4oJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHJldHJpZXZpbmcgdGhlIEpTT04gZGF0YScpO1xuICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBKU09OIGhhcyBiZWVuIHJldHVybmVkLCBwYXJzZSBpdCBpbnRvIGEgSmF2YVNjcmlwdCBPYmplY3RcbiAgICAgICAgICAgICAgLy8gYW5kIHJlbmRlciB0aGUgT0hJRiBWaWV3ZXIgd2l0aCB0aGlzIGRhdGFcbiAgICAgICAgICAgICAgb1JlcS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIHJlc3BvbnNlIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9YTUxIdHRwUmVxdWVzdC9yZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgICAgIGlmICghb1JlcS5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBPSElGLmxvZy53YXJuKCdSZXNwb25zZSB3YXMgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBPSElGLmxvZy5pbmZvKEpTT04uc3RyaW5naWZ5KG9SZXEucmVzcG9uc2VUZXh0LCBudWxsLCAyKSk7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZEpTT04gPSBKU09OLnBhcnNlKG9SZXEucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgICAgICAgc2Vzc2lvbk1hcC5zZXQocGFyc2VkSlNPTiwgJ1RFU1RfRVhQRVJJTUVOVF9JRCcsICdURVNUX0VYUEVSSU1FTlRfTEFCRUwnKTtcblxuICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gcGFyc2VkSlNPTlxuXG4gICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIC8vIE9wZW4gdGhlIFJlcXVlc3QgdG8gdGhlIHNlcnZlciBmb3IgdGhlIEpTT04gZGF0YVxuICAgICAgICAgICAgICAvLyBJbiB0aGlzIGNhc2Ugd2UgaGF2ZSBhIHNlcnZlci1zaWRlIHJvdXRlIGNhbGxlZCAvYXBpL1xuICAgICAgICAgICAgICAvLyB3aGljaCByZXNwb25kcyB0byBHRVQgcmVxdWVzdHMgd2l0aCB0aGUgc3R1ZHkgZGF0YVxuICAgICAgICAgICAgICBPSElGLmxvZy5pbmZvKGBTZW5kaW5nIFJlcXVlc3QgdG86ICR7dXJsfWApO1xuICAgICAgICAgICAgICBvUmVxLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgICAgIG9SZXEuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuXG4gICAgICAgICAgICAgIC8vIEZpcmUgdGhlIHJlcXVlc3QgdG8gdGhlIHNlcnZlclxuICAgICAgICAgICAgICBvUmVxLnNlbmQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFjdGlvbigpIHtcbiAgICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBWaWV3ZXIgd2l0aCB0aGlzIGRhdGFcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoJ3N0YW5kYWxvbmVWaWV3ZXInLCB7XG4gICAgICAgICAgICAgICAgICBkYXRhOiAoKSA9PiB0aGlzLmRhdGFcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBPTkxZIGZvciBkZW1vIHB1cnBvc2VzLlxuICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgIC8vIFlvdSBjYW4gdGVzdCB0aGlzIHdpdGg6XG4gICAgICAvLyBjdXJsIC12IC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgLVggR0VUICdodHRwOi8vbG9jYWxob3N0OjMwMDAvZ2V0RGF0YS90ZXN0SWQnXG4gICAgICAvL1xuICAgICAgLy8gT3IgYnkgZ29pbmcgdG86XG4gICAgICAvLyBodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpL3Rlc3RJZFxuXG4gICAgICBSb3V0ZXIucm91dGUoJy9hcGkvOmlkJywgeyB3aGVyZTogJ3NlcnZlcicgfSkuZ2V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBcInRoaXNcIiBpcyB0aGUgUm91dGVDb250cm9sbGVyIGluc3RhbmNlLlxuICAgICAgICAvLyBcInRoaXMucmVzcG9uc2VcIiBpcyB0aGUgQ29ubmVjdCByZXNwb25zZSBvYmplY3RcbiAgICAgICAgLy8gXCJ0aGlzLnJlcXVlc3RcIiBpcyB0aGUgQ29ubmVjdCByZXF1ZXN0IG9iamVjdFxuICAgICAgICBjb25zdCBpZCA9IHRoaXMucGFyYW1zLmlkO1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIHJlbGV2YW50IHN0dWR5IGRhdGEgZnJvbSB0aGUgQ29sbGVjdGlvbiBnaXZlbiB0aGUgSURcbiAgICAgICAgY29uc3QgZGF0YSA9IFJlcXVlc3RTdHVkaWVzLmZpbmRPbmUoeyB0cmFuc2FjdGlvbklkOiBpZCB9KTtcblxuICAgICAgICAvLyBTZXQgdGhlIHJlc3BvbnNlIGhlYWRlcnMgdG8gcmV0dXJuIEpTT04gdG8gYW55IHNlcnZlclxuICAgICAgICB0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgdGhpcy5yZXNwb25zZS5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgIHRoaXMucmVzcG9uc2Uuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ09yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQnKTtcblxuICAgICAgICAvLyBDaGFuZ2UgdGhlIHJlc3BvbnNlIHRleHQgZGVwZW5kaW5nIG9uIHRoZSBhdmFpbGFibGUgc3R1ZHkgZGF0YVxuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICB0aGlzLnJlc3BvbnNlLndyaXRlKCdObyBEYXRhIEZvdW5kJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU3RyaW5naWZ5IHRoZSBKYXZhU2NyaXB0IG9iamVjdCB0byBKU09OIGZvciB0aGUgcmVzcG9uc2VcbiAgICAgICAgICB0aGlzLnJlc3BvbnNlLndyaXRlKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpbmFsaXplIHRoZSByZXNwb25zZVxuICAgICAgICB0aGlzLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgfSk7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGdldEpzb24odXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgLy8gRGVmaW5lIGEgcmVxdWVzdCB0byB0aGUgc2VydmVyIHRvIHJldHJpZXZlIHRoZSBzZXNzaW9uIGRhdGEgYXMgSlNPTi5cbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgR0VUICR7dXJsfS4uLiAke3hoci5zdGF0dXN9YCk7XG5cbiAgICAgIHJlc29sdmUoeGhyLnJlc3BvbnNlKTtcbiAgICB9O1xuXG4gICAgeGhyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgfTtcblxuICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwianNvblwiO1xuICAgIHhoci5zZW5kKCk7XG4gIH0pO1xufVxuIl19
