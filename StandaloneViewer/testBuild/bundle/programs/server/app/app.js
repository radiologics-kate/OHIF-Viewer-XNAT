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
let icrXnatRoiSession, sessionMap;
module.watch(require("meteor/icr:xnat-roi-namespace"), {
  icrXnatRoiSession(v) {
    icrXnatRoiSession = v;
  },

  sessionMap(v) {
    sessionMap = v;
  }

}, 3);
const productionMode = true;

if (Meteor.isClient && productionMode) {
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
      // Subject (WIP):
      //   projectId, subjectId

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
        icrXnatRoiSession.set('sourceProjectId', parentProjectId ? parentProjectId : projectId); //icrXnatRoiSession.set('experimentId', experimentId);
        //icrXnatRoiSession.set('experimentLabel', experimentLabel);

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

          updateSessionMap(json, experimentId, experimentLabel);
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
        icrXnatRoiSession.set('sourceProjectId', projectId);
        icrXnatRoiSession.set('projectId', projectId);
        icrXnatRoiSession.set('subjectId', subjectId);
        const subjectExperimentListUrl = `${Session.get('rootUrl')}/data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;
        OHIF.RoiStateManagement.checkAndSetPermissions(); //
        // TODO:
        // ROICollection IO restructure.
        // SeriesInstanceUID -> ExperimentId + projectId map.
        // Update IO to deal with the new Schema.

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
            const studyList = {
              transactionId: subjectId,
              studies: []
            };

            for (let i = 0; i < jsonFiles.length; i++) {
              const experimentJsonI = jsonFiles[i];
              const studiesI = experimentJsonI.studies;
              updateSessionMap(experimentJsonI, experimentList[i].ID, experimentList[i].label);
              console.log('Session Map:');
              console.log(sessionMap); // TODO -> clean this

              studiesI[0].studyDescription = experimentList[i].label || experimentList[i].ID;
              console.log(`Studies[${i}]`);
              console.log(studiesI);
              studyList.studies = [...studyList.studies, ...studiesI];
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
          this.data = JSON.parse(oReq.responseText);
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

function updateSessionMap(json, experimentId, experimentLabel) {
  console.log(json);
  const studies = json.studies;

  for (let i = 0; i < studies.length; i++) {
    const seriesList = studies[i].seriesList;
    console.log(`seriesList ${i}`);

    for (let j = 0; j < seriesList.length; j++) {
      console.log(`series [${i}, ${j}]`);
      sessionMap[seriesList[j].seriesInstanceUid] = {
        experimentId,
        experimentLabel
      };
    }
  }

  console.log(`end of updateSessionMap:`);
  console.log(sessionMap);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL2NvbGxlY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9yb3V0ZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlJlcXVlc3RTdHVkaWVzIiwiQ29sbGVjdGlvbiIsInJlbW92ZSIsInRlc3REYXRhRmlsZXMiLCJmb3JFYWNoIiwiZmlsZSIsImluZGV4T2YiLCJqc29uRGF0YSIsIkFzc2V0cyIsImdldFRleHQiLCJkYXRhIiwiSlNPTiIsInBhcnNlIiwiaW5zZXJ0IiwiUm91dGVyIiwiT0hJRiIsImljclhuYXRSb2lTZXNzaW9uIiwic2Vzc2lvbk1hcCIsInByb2R1Y3Rpb25Nb2RlIiwiaXNDbGllbnQiLCJsb2ciLCJpbmZvIiwiZGlzY29ubmVjdCIsInVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiaHJlZiIsIm9yaWdpbiIsInVybEV4dGVudGlvbiIsInJlcGxhY2UiLCJzcGxpdCIsImNvbnNvbGUiLCJ2aWV3ZXJSb290Iiwicm9vdFVybCIsIlNlc3Npb24iLCJzZXQiLCJjb25maWd1cmUiLCJsb2FkaW5nVGVtcGxhdGUiLCJvbkJlZm9yZUFjdGlvbiIsInJvdXRlIiwib25SdW4iLCJuZXh0IiwicGFyYW1zIiwic3ViamVjdElkIiwicHJvamVjdElkIiwiZXhwZXJpbWVudElkIiwiZXhwZXJpbWVudExhYmVsIiwicGFyZW50UHJvamVjdElkIiwicXVlcnkiLCJlcnJvciIsIlJvaVN0YXRlTWFuYWdlbWVudCIsImNoZWNrQW5kU2V0UGVybWlzc2lvbnMiLCJqc29uUmVxdWVzdFVybCIsImdldCIsImdldEpzb24iLCJ0aGVuIiwianNvbiIsIndhcm4iLCJ1cGRhdGVTZXNzaW9uTWFwIiwianNvblN0cmluZyIsInN0cmluZ2lmeSIsIlJlZ0V4cCIsImNhdGNoIiwic3ViamVjdEV4cGVyaW1lbnRMaXN0VXJsIiwiZXhwZXJpbWVudExpc3QiLCJSZXN1bHRTZXQiLCJSZXN1bHQiLCJyZXN1bHRzIiwiaSIsImxlbmd0aCIsImV4cGVyaW1lbnRJZEkiLCJJRCIsImV4cGVyaW1lbnRKU09ORmV0Y2hVcmwiLCJQcm9taXNlIiwiYWxsIiwianNvbkZpbGVzIiwic3R1ZHlMaXN0IiwidHJhbnNhY3Rpb25JZCIsInN0dWRpZXMiLCJleHBlcmltZW50SnNvbkkiLCJzdHVkaWVzSSIsImxhYmVsIiwic3R1ZHlEZXNjcmlwdGlvbiIsImFjdGlvbiIsInJlbmRlciIsImlkIiwiaWRVcmwiLCJvUmVxIiwiWE1MSHR0cFJlcXVlc3QiLCJhZGRFdmVudExpc3RlbmVyIiwicmVzcG9uc2VUZXh0Iiwib3BlbiIsInNldFJlcXVlc3RIZWFkZXIiLCJzZW5kIiwiaXNTZXJ2ZXIiLCJ3aGVyZSIsImZpbmRPbmUiLCJyZXNwb25zZSIsInNldEhlYWRlciIsIndyaXRlIiwiZW5kIiwic2VyaWVzTGlzdCIsImoiLCJzZXJpZXNJbnN0YW5jZVVpZCIsInJlc29sdmUiLCJyZWplY3QiLCJ4aHIiLCJvbmxvYWQiLCJzdGF0dXMiLCJvbmVycm9yIiwicmVzcG9uc2VUeXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLElBQUlBLE1BQUo7QUFBV0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDSCxTQUFPSSxDQUFQLEVBQVM7QUFBQ0osYUFBT0ksQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUVYO0FBQ0FDLGlCQUFpQixJQUFJTCxPQUFPTSxVQUFYLENBQXNCLGdCQUF0QixDQUFqQixDLENBRUE7O0FBQ0FELGVBQWVFLE1BQWYsQ0FBc0IsRUFBdEI7QUFFQSxNQUFNQyxnQkFBZ0IsQ0FDbEIsYUFEa0IsRUFFbEIsaUJBRmtCLEVBR2xCLGNBSGtCLEVBSWxCLGNBSmtCLEVBS2xCLGNBTGtCLEVBTWxCLGNBTmtCLEVBT2xCLGNBUGtCLEVBUWxCLGdCQVJrQixFQVNsQixjQVRrQixDQUF0QjtBQVlBQSxjQUFjQyxPQUFkLENBQXNCQyxRQUFRO0FB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QUosR0FBbUIsTUFBbkI7QUFDQUosUUFBSWIsSUFBSjtBQUNELEdBakJNLENBQVA7QUFrQkQsQyIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbi8vIENyZWF0ZSBhIENvbGxlY3Rpb24gdG8gc3RvcmUgZGF0YVxuUmVxdWVzdFN0dWRpZXMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3JlcXVlc3RTdHVkaWVzJyk7XG5cbi8vIFJlbW92ZSBhbGwgcHJldmlvdXMgZGF0YVxuUmVxdWVzdFN0dWRpZXMucmVtb3ZlKHt9KTtcblxuY29uc3QgdGVzdERhdGFGaWxlcyA9IFtcbiAgICAnc2FtcGxlLmpzb24nLFxuICAgICd0ZXN0RElDT01zLmpzb24nLFxuICAgICdDUlN0dWR5Lmpzb24nLFxuICAgICdDVFN0dWR5Lmpzb24nLFxuICAgICdEWFN0dWR5Lmpzb24nLFxuICAgICdNR1N0dWR5Lmpzb24nLFxuICAgICdNUlN0dWR5Lmpzb24nLFxuICAgICdQVENUU3R1ZHkuanNvbicsXG4gICAgJ1JGU3R1ZHkuanNvbidcbl07XG5cbnRlc3REYXRhRmlsZXMuZm9yRWFjaChmaWxlID0+IHtcbiAgICBpZiAoZmlsZS5pbmRleE9mKCcuanNvbicpID09PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVhZCBKU09OIGZpbGVzIGFuZCBzYXZlIHRoZSBjb250ZW50IGluIHRoZSBkYXRhYmFzZVxuICAgIGNvbnN0IGpzb25EYXRhID0gQXNzZXRzLmdldFRleHQoYHRlc3REYXRhLyR7ZmlsZX1gKTtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShqc29uRGF0YSk7XG5cbiAgICBSZXF1ZXN0U3R1ZGllcy5pbnNlcnQoZGF0YSk7XG59KTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnbWV0ZW9yL2NsaW5pY2FsOnJvdXRlcic7XG5pbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBpY3JYbmF0Um9pU2Vzc2lvbiwgc2Vzc2lvbk1hcCB9IGZyb20gJ21ldGVvci9pY3I6eG5hdC1yb2ktbmFtZXNwYWNlJztcblxuY29uc3QgcHJvZHVjdGlvbk1vZGUgPSB0cnVlO1xuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50ICYmIHByb2R1Y3Rpb25Nb2RlKSB7XG4gIC8vIFhOQVQgZGVwbG95bWVudCBtb2RlLlxuICAvLyBEaXNjb25uZWN0IGZyb20gdGhlIE1ldGVvciBTZXJ2ZXIgc2luY2Ugd2UgZG9uJ3QgbmVlZCBpdFxuICBPSElGLmxvZy5pbmZvKCdEaXNjb25uZWN0aW5nIGZyb20gdGhlIE1ldGVvciBzZXJ2ZXInKTtcbiAgTWV0ZW9yLmRpc2Nvbm5lY3QoKTtcblxuICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICBjb25zdCBvcmlnaW4gPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luO1xuICBjb25zdCB1cmxFeHRlbnRpb24gPSB1cmwucmVwbGFjZShvcmlnaW4sICcnKS5zcGxpdCgnVklFV0VSJylbMF0ucmVwbGFjZSgvXFwvL2csICcnKTtcblxuICBjb25zb2xlLmxvZyh1cmxFeHRlbnRpb24pO1xuXG4gIGxldCB2aWV3ZXJSb290O1xuICBsZXQgcm9vdFVybDtcblxuICBpZiAodXJsRXh0ZW50aW9uKSB7XG4gICAgdmlld2VyUm9vdCA9IGAvJHt1cmxFeHRlbnRpb259L1ZJRVdFUmA7XG4gICAgcm9vdFVybCA9IGAke29yaWdpbn0vJHt1cmxFeHRlbnRpb259YDtcbiAgfSBlbHNlIHtcbiAgICB2aWV3ZXJSb290ID0gYC9WSUVXRVJgO1xuICAgIHJvb3RVcmwgPSBvcmlnaW47XG4gIH1cblxuICBTZXNzaW9uLnNldCgncm9vdFVybCcsIHJvb3RVcmwpO1xuICBTZXNzaW9uLnNldCgndmlld2VyUm9vdCcsIHZpZXdlclJvb3QpO1xuXG4gIGNvbnNvbGUubG9nKGBvcmlnaW46ICR7b3JpZ2lufWApO1xuICBjb25zb2xlLmxvZyhgdXJsRXh0ZW50aW9uICR7dXJsRXh0ZW50aW9ufWApO1xuICBjb25zb2xlLmxvZyhgcm9vdFVybDogJHtyb290VXJsfWApO1xuICBjb25zb2xlLmxvZyhgdmlld2VyUm9vdFwiICR7dmlld2VyUm9vdH1gKTtcblxuICBSb3V0ZXIuY29uZmlndXJlKHtcbiAgICAgIGxvYWRpbmdUZW1wbGF0ZTogJ2xvYWRpbmcnXG4gIH0pO1xuXG4gIFJvdXRlci5vbkJlZm9yZUFjdGlvbignbG9hZGluZycpO1xuXG4gIC8vIEpQRVRUUyAtLSByb3V0ZSBiYXNlZCBvbiBYTkFUIHJvb3RcbiAgUm91dGVyLnJvdXRlKGAke3ZpZXdlclJvb3R9YCwge1xuICAgICAgb25SdW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdvblJ1bicpO1xuXG4gICAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMubmV4dDtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMucGFyYW1zKTtcblxuICAgICAgICAgIC8vIFF1ZXJ5IHBhcmFtczpcbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFNpbmdsZSBTZXNzaW9uOlxuICAgICAgICAgIC8vICAgcHJvamVjdElkLCBzdWJqZWN0SWQsIGV4cGVyaW1lbnRJZCwgZXhwZXJpbWVudExhYmVsXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBTaW5nbGUgU2Vzc2lvbiBpbiBzaGFyZWQgcHJvamVjdDpcbiAgICAgICAgICAvLyAgIHByb2plY3RJZCwgc3ViamVjdElkLCBleHBlcmltZW50SWQsIGV4cGVyaW1lbnRMYWJlbCwgcGFyZW50UHJvamVjdElkXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBTdWJqZWN0IChXSVApOlxuICAgICAgICAgIC8vICAgcHJvamVjdElkLCBzdWJqZWN0SWRcblxuICAgICAgICAgIGxldCBzdWJqZWN0SWQ7XG4gICAgICAgICAgbGV0IHByb2plY3RJZDtcbiAgICAgICAgICBsZXQgZXhwZXJpbWVudElkO1xuICAgICAgICAgIGxldCBleHBlcmltZW50TGFiZWw7XG4gICAgICAgICAgbGV0IHBhcmVudFByb2plY3RJZDtcblxuICAgICAgICAgIGlmICh0aGlzLnBhcmFtcy5xdWVyeSkge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnBhcmFtcy5xdWVyeTtcblxuICAgICAgICAgICAgZXhwZXJpbWVudExhYmVsID0gcXVlcnkuZXhwZXJpbWVudExhYmVsO1xuICAgICAgICAgICAgcGFyZW50UHJvamVjdElkID0gcXVlcnkucGFyZW50UHJvamVjdElkO1xuICAgICAgICAgICAgc3ViamVjdElkID0gcXVlcnkuc3ViamVjdElkO1xuICAgICAgICAgICAgcHJvamVjdElkID0gcXVlcnkucHJvamVjdElkO1xuICAgICAgICAgICAgZXhwZXJpbWVudElkID0gcXVlcnkuZXhwZXJpbWVudElkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdpbnN1ZmZpY2llbnQgcXVlcnkgcGFyYW1ldGVycy4nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocGFyZW50UHJvamVjdElkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgVGhpcyBleHBlcmltZW50IGlzIHNoYXJlZCB2aWV3IG9mICR7ZXhwZXJpbWVudElkfSBmcm9tICR7cGFyZW50UHJvamVjdElkfWApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChleHBlcmltZW50SWQpIHtcbiAgICAgICAgICAgIC8vIFNpbmdsZSBTZXNzaW9uXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgaWNyWG5hdFJvaVNlc3Npb24uc2V0KCdzb3VyY2VQcm9qZWN0SWQnLCBwYXJlbnRQcm9qZWN0SWQgPyBwYXJlbnRQcm9qZWN0SWQgOiBwcm9qZWN0SWQpO1xuICAgICAgICAgICAgLy9pY3JYbmF0Um9pU2Vzc2lvbi5zZXQoJ2V4cGVyaW1lbnRJZCcsIGV4cGVyaW1lbnRJZCk7XG4gICAgICAgICAgICAvL2ljclhuYXRSb2lTZXNzaW9uLnNldCgnZXhwZXJpbWVudExhYmVsJywgZXhwZXJpbWVudExhYmVsKTtcbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgnc3ViamVjdElkJywgc3ViamVjdElkKTtcbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgncHJvamVjdElkJywgcHJvamVjdElkKTtcbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgncGFyZW50UHJvamVjdElkJywgcGFyZW50UHJvamVjdElkKTtcblxuICAgICAgICAgICAgT0hJRi5Sb2lTdGF0ZU1hbmFnZW1lbnQuY2hlY2tBbmRTZXRQZXJtaXNzaW9ucygpO1xuXG4gICAgICAgICAgICAvLyBCdWlsZCBKU09OIEdFVCB1cmwuXG4gICAgICAgICAgICBjb25zdCBqc29uUmVxdWVzdFVybCA9IGAke1Nlc3Npb24uZ2V0KCdyb290VXJsJyl9L3hhcGkvdmlld2VyL3Byb2plY3RzLyR7cHJvamVjdElkfS9leHBlcmltZW50cy8ke2V4cGVyaW1lbnRJZH1gO1xuXG4gICAgICAgICAgICBnZXRKc29uKGpzb25SZXF1ZXN0VXJsKS50aGVuKGpzb24gPT4ge1xuICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgcmVzcG9uc2UgY29udGVudFxuICAgICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvWE1MSHR0cFJlcXVlc3QvcmVzcG9uc2VUZXh0XG4gICAgICAgICAgICAgIGlmICghanNvbikge1xuICAgICAgICAgICAgICAgICAgT0hJRi5sb2cud2FybignUmVzcG9uc2Ugd2FzIHVuZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdXBkYXRlU2Vzc2lvbk1hcChqc29uLCBleHBlcmltZW50SWQsIGV4cGVyaW1lbnRMYWJlbCk7XG5cbiAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcblxuICAgICAgICAgICAgICBpZiAocGFyZW50UHJvamVjdElkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHJlcGxhY2luZyAke3BhcmVudFByb2plY3RJZH0gd2l0aCAke3Byb2plY3RJZH1gKTtcbiAgICAgICAgICAgICAgICBqc29uU3RyaW5nID0ganNvblN0cmluZy5yZXBsYWNlKCBuZXcgUmVnRXhwKCBwYXJlbnRQcm9qZWN0SWQsICdnJyApLCBwcm9qZWN0SWQgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UoanNvblN0cmluZyk7XG5cbiAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgIE9ISUYubG9nLndhcm4oJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHJldHJpZXZpbmcgdGhlIEpTT04gZGF0YScpO1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2hvbGUgU3ViamVjdC5cbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgnc291cmNlUHJvamVjdElkJywgcHJvamVjdElkKTtcbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgncHJvamVjdElkJywgcHJvamVjdElkKTtcbiAgICAgICAgICAgIGljclhuYXRSb2lTZXNzaW9uLnNldCgnc3ViamVjdElkJywgc3ViamVjdElkKTtcblxuXG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0RXhwZXJpbWVudExpc3RVcmwgPSBgJHtTZXNzaW9uLmdldCgncm9vdFVybCcpfS9kYXRhL2FyY2hpdmUvcHJvamVjdHMvJHtwcm9qZWN0SWR9L3N1YmplY3RzLyR7c3ViamVjdElkfS9leHBlcmltZW50cz9mb3JtYXQ9anNvbmA7XG5cblxuICAgICAgICAgICAgT0hJRi5Sb2lTdGF0ZU1hbmFnZW1lbnQuY2hlY2tBbmRTZXRQZXJtaXNzaW9ucygpO1xuXG5cblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE86XG4gICAgICAgICAgICAvLyBST0lDb2xsZWN0aW9uIElPIHJlc3RydWN0dXJlLlxuICAgICAgICAgICAgLy8gU2VyaWVzSW5zdGFuY2VVSUQgLT4gRXhwZXJpbWVudElkICsgcHJvamVjdElkIG1hcC5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBJTyB0byBkZWFsIHdpdGggdGhlIG5ldyBTY2hlbWEuXG5cbiAgICAgICAgICAgIGdldEpzb24oc3ViamVjdEV4cGVyaW1lbnRMaXN0VXJsKS50aGVuKGpzb24gPT4ge1xuICAgICAgICAgICAgICAvLyBUT0RPIC0+IEZldGNoIGVhY2gganNvbi5cbiAgICAgICAgICAgICAgLy8gUHJvbWlzZS5hbGwgYW5kIGNvbWJpbmUgSlNPTi5cbiAgICAgICAgICAgICAgLy8gTG9hZCB1cCB2aWV3ZXIuXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGpzb24pO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGV4cGVyaW1lbnRMaXN0ID0ganNvbi5SZXN1bHRTZXQuUmVzdWx0O1xuICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gW107XG5cbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBlcmltZW50TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cGVyaW1lbnRJZEkgPSBleHBlcmltZW50TGlzdFtpXS5JRDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGV4cGVyaW1lbnRKU09ORmV0Y2hVcmwgPSBgJHtTZXNzaW9uLmdldCgncm9vdFVybCcpfS94YXBpL3ZpZXdlci9wcm9qZWN0cy8ke3Byb2plY3RJZH0vZXhwZXJpbWVudHMvJHtleHBlcmltZW50SWRJfWA7XG5cbiAgICAgICAgICAgICAgICByZXN1bHRzW2ldID0gZ2V0SnNvbihleHBlcmltZW50SlNPTkZldGNoVXJsKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIFByb21pc2UuYWxsKHJlc3VsdHMpLnRoZW4oKGpzb25GaWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGpzb25GaWxlcyk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdHVkeUxpc3QgPSB7XG4gICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiBzdWJqZWN0SWQsXG4gICAgICAgICAgICAgICAgICBzdHVkaWVzOiBbXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGpzb25GaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXhwZXJpbWVudEpzb25JID0ganNvbkZpbGVzW2ldO1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc3R1ZGllc0kgPSBleHBlcmltZW50SnNvbkkuc3R1ZGllcztcblxuICAgICAgICAgICAgICAgICAgdXBkYXRlU2Vzc2lvbk1hcChleHBlcmltZW50SnNvbkksIGV4cGVyaW1lbnRMaXN0W2ldLklELCBleHBlcmltZW50TGlzdFtpXS5sYWJlbCk7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXNzaW9uIE1hcDonKVxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2Vzc2lvbk1hcCk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLT4gY2xlYW4gdGhpc1xuICAgICAgICAgICAgICAgICAgc3R1ZGllc0lbMF0uc3R1ZHlEZXNjcmlwdGlvbiA9IGV4cGVyaW1lbnRMaXN0W2ldLmxhYmVsIHx8IGV4cGVyaW1lbnRMaXN0W2ldLklEO1xuXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU3R1ZGllc1ske2l9XWApO1xuXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdHVkaWVzSSk7XG5cbiAgICAgICAgICAgICAgICAgIHN0dWR5TGlzdC5zdHVkaWVzID0gWy4uLnN0dWR5TGlzdC5zdHVkaWVzLCAuLi5zdHVkaWVzSV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3R1ZHlMaXN0KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IHN0dWR5TGlzdDtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG5cbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nIHVwIHZpZXdlciB3aXRoIGpzb24hJyk7XG4gICAgICAgICAgLy8gUmVuZGVyIHRoZSBWaWV3ZXIgd2l0aCB0aGlzIGRhdGFcbiAgICAgICAgICB0aGlzLnJlbmRlcignc3RhbmRhbG9uZVZpZXdlcicsIHtcbiAgICAgICAgICAgICAgZGF0YTogKCkgPT4gdGhpcy5kYXRhXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gIH0pO1xufSBlbHNlIHtcbiAgICAvLyBMb2NhbCBkZXYgbW9kZS5cbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICAvLyBEaXNjb25uZWN0IGZyb20gdGhlIE1ldGVvciBTZXJ2ZXIgc2luY2Ugd2UgZG9uJ3QgbmVlZCBpdFxuICAgICAgT0hJRi5sb2cuaW5mbygnRGlzY29ubmVjdGluZyBmcm9tIHRoZSBNZXRlb3Igc2VydmVyJyk7XG4gICAgICBNZXRlb3IuZGlzY29ubmVjdCgpO1xuXG4gICAgICBSb3V0ZXIuY29uZmlndXJlKHtcbiAgICAgICAgICBsb2FkaW5nVGVtcGxhdGU6ICdsb2FkaW5nJ1xuICAgICAgfSk7XG5cbiAgICAgIFJvdXRlci5vbkJlZm9yZUFjdGlvbignbG9hZGluZycpO1xuXG4gICAgICBSb3V0ZXIucm91dGUoJy86aWQ/Jywge1xuICAgICAgICAgIG9uUnVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdvblJ1bicpO1xuICAgICAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgcXVlcnkgZnJvbSB0aGUgVVJMIHRoZSB1c2VyIGhhcyBlbnRlcmVkXG4gICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5wYXJhbXMucXVlcnk7XG4gICAgICAgICAgICAgIGNvbnN0IGlkID0gdGhpcy5wYXJhbXMuaWQ7XG5cbiAgICAgICAgICAgICAgaWYgKCFpZCAmJiAhcXVlcnkudXJsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gVVJMIHdhcyBzcGVjaWZpZWQuIFVzZSA/dXJsPSR7eW91clVSTH0nKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IG5leHQgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgIGNvbnN0IGlkVXJsID0gYC9hcGkvJHtpZH1gO1xuICAgICAgICAgICAgICBjb25zdCB1cmwgPSBxdWVyeS51cmwgfHwgaWRVcmw7XG5cbiAgICAgICAgICAgICAgLy8gRGVmaW5lIGEgcmVxdWVzdCB0byB0aGUgc2VydmVyIHRvIHJldHJpZXZlIHRoZSBzdHVkeSBkYXRhXG4gICAgICAgICAgICAgIC8vIGFzIEpTT04sIGdpdmVuIGEgVVJMIHRoYXQgd2FzIGluIHRoZSBSb3V0ZVxuICAgICAgICAgICAgICBjb25zdCBvUmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVycyBmb3IgcmVxdWVzdCBmYWlsdXJlXG4gICAgICAgICAgICAgIG9SZXEuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBPSElGLmxvZy53YXJuKCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSByZXRyaWV2aW5nIHRoZSBKU09OIGRhdGEnKTtcbiAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgSlNPTiBoYXMgYmVlbiByZXR1cm5lZCwgcGFyc2UgaXQgaW50byBhIEphdmFTY3JpcHQgT2JqZWN0XG4gICAgICAgICAgICAgIC8vIGFuZCByZW5kZXIgdGhlIE9ISUYgVmlld2VyIHdpdGggdGhpcyBkYXRhXG4gICAgICAgICAgICAgIG9SZXEuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSByZXNwb25zZSBjb250ZW50XG4gICAgICAgICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvWE1MSHR0cFJlcXVlc3QvcmVzcG9uc2VUZXh0XG4gICAgICAgICAgICAgICAgICBpZiAoIW9SZXEucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgT0hJRi5sb2cud2FybignUmVzcG9uc2Ugd2FzIHVuZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgT0hJRi5sb2cuaW5mbyhKU09OLnN0cmluZ2lmeShvUmVxLnJlc3BvbnNlVGV4dCwgbnVsbCwgMikpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZShvUmVxLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgLy8gT3BlbiB0aGUgUmVxdWVzdCB0byB0aGUgc2VydmVyIGZvciB0aGUgSlNPTiBkYXRhXG4gICAgICAgICAgICAgIC8vIEluIHRoaXMgY2FzZSB3ZSBoYXZlIGEgc2VydmVyLXNpZGUgcm91dGUgY2FsbGVkIC9hcGkvXG4gICAgICAgICAgICAgIC8vIHdoaWNoIHJlc3BvbmRzIHRvIEdFVCByZXF1ZXN0cyB3aXRoIHRoZSBzdHVkeSBkYXRhXG4gICAgICAgICAgICAgIE9ISUYubG9nLmluZm8oYFNlbmRpbmcgUmVxdWVzdCB0bzogJHt1cmx9YCk7XG4gICAgICAgICAgICAgIG9SZXEub3BlbignR0VUJywgdXJsKTtcbiAgICAgICAgICAgICAgb1JlcS5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpXG5cbiAgICAgICAgICAgICAgLy8gRmlyZSB0aGUgcmVxdWVzdCB0byB0aGUgc2VydmVyXG4gICAgICAgICAgICAgIG9SZXEuc2VuZCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBSZW5kZXIgdGhlIFZpZXdlciB3aXRoIHRoaXMgZGF0YVxuICAgICAgICAgICAgICB0aGlzLnJlbmRlcignc3RhbmRhbG9uZVZpZXdlcicsIHtcbiAgICAgICAgICAgICAgICAgIGRhdGE6ICgpID0+IHRoaXMuZGF0YVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIE9OTFkgZm9yIGRlbW8gcHVycG9zZXMuXG4gICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgLy8gWW91IGNhbiB0ZXN0IHRoaXMgd2l0aDpcbiAgICAgIC8vIGN1cmwgLXYgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiAtWCBHRVQgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9nZXREYXRhL3Rlc3RJZCdcbiAgICAgIC8vXG4gICAgICAvLyBPciBieSBnb2luZyB0bzpcbiAgICAgIC8vIGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hcGkvdGVzdElkXG5cbiAgICAgIFJvdXRlci5yb3V0ZSgnL2FwaS86aWQnLCB7IHdoZXJlOiAnc2VydmVyJyB9KS5nZXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFwidGhpc1wiIGlzIHRoZSBSb3V0ZUNvbnRyb2xsZXIgaW5zdGFuY2UuXG4gICAgICAgIC8vIFwidGhpcy5yZXNwb25zZVwiIGlzIHRoZSBDb25uZWN0IHJlc3BvbnNlIG9iamVjdFxuICAgICAgICAvLyBcInRoaXMucmVxdWVzdFwiIGlzIHRoZSBDb25uZWN0IHJlcXVlc3Qgb2JqZWN0XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy5wYXJhbXMuaWQ7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgcmVsZXZhbnQgc3R1ZHkgZGF0YSBmcm9tIHRoZSBDb2xsZWN0aW9uIGdpdmVuIHRoZSBJRFxuICAgICAgICBjb25zdCBkYXRhID0gUmVxdWVzdFN0dWRpZXMuZmluZE9uZSh7IHRyYW5zYWN0aW9uSWQ6IGlkIH0pO1xuXG4gICAgICAgIC8vIFNldCB0aGUgcmVzcG9uc2UgaGVhZGVycyB0byByZXR1cm4gSlNPTiB0byBhbnkgc2VydmVyXG4gICAgICAgIHRoaXMucmVzcG9uc2Uuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICB0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgdGhpcy5yZXNwb25zZS5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnT3JpZ2luLCBYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEFjY2VwdCcpO1xuXG4gICAgICAgIC8vIENoYW5nZSB0aGUgcmVzcG9uc2UgdGV4dCBkZXBlbmRpbmcgb24gdGhlIGF2YWlsYWJsZSBzdHVkeSBkYXRhXG4gICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgIHRoaXMucmVzcG9uc2Uud3JpdGUoJ05vIERhdGEgRm91bmQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdHJpbmdpZnkgdGhlIEphdmFTY3JpcHQgb2JqZWN0IHRvIEpTT04gZm9yIHRoZSByZXNwb25zZVxuICAgICAgICAgIHRoaXMucmVzcG9uc2Uud3JpdGUoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxpemUgdGhlIHJlc3BvbnNlXG4gICAgICAgIHRoaXMucmVzcG9uc2UuZW5kKCk7XG4gICAgICB9KTtcbiAgICB9XG59XG5cblxuZnVuY3Rpb24gdXBkYXRlU2Vzc2lvbk1hcChqc29uLCBleHBlcmltZW50SWQsIGV4cGVyaW1lbnRMYWJlbCkge1xuICBjb25zb2xlLmxvZyhqc29uKTtcblxuICBjb25zdCBzdHVkaWVzID0ganNvbi5zdHVkaWVzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3R1ZGllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHNlcmllc0xpc3QgPSBzdHVkaWVzW2ldLnNlcmllc0xpc3Q7XG5cbiAgICBjb25zb2xlLmxvZyhgc2VyaWVzTGlzdCAke2l9YCk7XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNlcmllc0xpc3QubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnNvbGUubG9nKGBzZXJpZXMgWyR7aX0sICR7an1dYCk7XG5cbiAgICAgIHNlc3Npb25NYXBbc2VyaWVzTGlzdFtqXS5zZXJpZXNJbnN0YW5jZVVpZF0gPSB7XG4gICAgICAgIGV4cGVyaW1lbnRJZCxcbiAgICAgICAgZXhwZXJpbWVudExhYmVsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBlbmQgb2YgdXBkYXRlU2Vzc2lvbk1hcDpgKTtcbiAgY29uc29sZS5sb2coc2Vzc2lvbk1hcCk7XG59XG5cblxuZnVuY3Rpb24gZ2V0SnNvbih1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAvLyBEZWZpbmUgYSByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIgdG8gcmV0cmlldmUgdGhlIHNlc3Npb24gZGF0YSBhcyBKU09OLlxuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGBHRVQgJHt1cmx9Li4uICR7eGhyLnN0YXR1c31gKTtcblxuICAgICAgcmVzb2x2ZSh4aHIucmVzcG9uc2UpO1xuICAgIH07XG5cbiAgICB4aHIub25lcnJvciA9ICgpID0+IHtcbiAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsKTtcbiAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJqc29uXCI7XG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG4iXX0=
