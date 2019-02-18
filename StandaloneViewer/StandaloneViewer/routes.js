import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const productionMode = true;

if (Meteor.isClient && productionMode) {
  // XNAT deployment mode.
  // Disconnect from the Meteor Server since we don't need it
  OHIF.log.info('Disconnecting from the Meteor server');
  Meteor.disconnect();

  const url = window.location.href;
  const hostname = window.location.hostname;

  const origin = window.location.origin;
  const urlExtention = url.replace(origin, '');

  const viewerRoot = urlExtention.split('VIEWER')[0] + 'VIEWER';

  const rootUrl = origin + '/' + urlExtention.split('VIEWER')[0].replace(/\//g, '');

  Session.set('rootUrl', rootUrl);
  Session.set('viewerRoot', viewerRoot);

  Router.configure({
      loadingTemplate: 'loading'
  });

  Router.onBeforeAction('loading');

  // JPETTS -- route based on XNAT root
  Router.route(`${viewerRoot}`, {
      onRun: function() {
          console.log('onRun');

          const next = this.next;

          console.log(this.params);

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
            csrfToken = decodeURIComponent(atob(query.csrfToken));
          } else {
            console.error('insufficient query parameters.');
          }

          if (parentProjectId) {
            console.log(`This experiment is shared view of ${experimentId} from ${parentProjectId}`);
          }

          icrXnatRoiSession.set('sourceProjectId', parentProjectId ? parentProjectId : projectId);
          icrXnatRoiSession.set('experimentId', experimentId);
          icrXnatRoiSession.set('experimentLabel', experimentLabel);
          icrXnatRoiSession.set('subjectId', subjectId);
          icrXnatRoiSession.set('projectId', projectId);
          icrXnatRoiSession.set('csrfToken', csrfToken);
          icrXnatRoiSession.set('parentProjectId', parentProjectId);

          console.log(`decoded csrfToken: ${csrfToken}`)

          OHIF.RoiStateManagement.checkAndSetPermissions();

          // Build JSON GET url.
          const jsonRequestUrl = `${Session.get('rootUrl')}/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

          // Define a request to the server to retrieve the study data
          // as JSON, given a URL that was in the Route
          const oReq = new XMLHttpRequest();

          // Add event listeners for request failure
          oReq.addEventListener('error', () => {
              OHIF.log.warn('An error occurred while retrieving the JSON data');
              next();
          });

          // When the JSON has been returned, parse it into a JavaScript Object
          // and render the OHIF Viewer with this data
          oReq.addEventListener('load', () => {
              // Parse the response content
              // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
              if (!oReq.responseText) {
                  OHIF.log.warn('Response was undefined');
                  return;
              }

              OHIF.log.info(JSON.stringify(oReq.responseText, null, 2));

              let jsonString = oReq.responseText;

              if (parentProjectId) {
                console.log(`replacing ${parentProjectId} with ${projectId}`);
                jsonString = jsonString.replace( new RegExp( parentProjectId, 'g' ), projectId );
              }

              console.log(jsonString);

              this.data = JSON.parse(jsonString);
              console.log(this.data);

              next();
          });

          // Open the Request to the server for the JSON data
          // In this case we have a server-side route called /api/
          // which responds to GET requests with the study data
          console.log(`Sending Request to: ${jsonRequestUrl}`);
          oReq.open('GET', jsonRequestUrl);
          oReq.setRequestHeader('Accept', 'application/json')

          // Fire the request to the server
          oReq.send();
      },
      action() {
        console.log('Loading up viewer with json!');
          // Render the Viewer with this data
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
          onRun: function() {
              console.warn('onRun');
              // Retrieve the query from the URL the user has entered
              const query = this.params.query;
              const id = this.params.id;

              if (!id && !query.url) {
                  console.log('No URL was specified. Use ?url=${yourURL}');
                  return;
              }

              const next = this.next;
              const idUrl = `/api/${id}`;
              const url = query.url || idUrl;

              // Define a request to the server to retrieve the study data
              // as JSON, given a URL that was in the Route
              const oReq = new XMLHttpRequest();

              // Add event listeners for request failure
              oReq.addEventListener('error', () => {
                  OHIF.log.warn('An error occurred while retrieving the JSON data');
                  next();
              });

              // When the JSON has been returned, parse it into a JavaScript Object
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
              });

              // Open the Request to the server for the JSON data
              // In this case we have a server-side route called /api/
              // which responds to GET requests with the study data
              OHIF.log.info(`Sending Request to: ${url}`);
              oReq.open('GET', url);
              oReq.setRequestHeader('Accept', 'application/json')

              // Fire the request to the server
              oReq.send();
          },
          action() {
              // Render the Viewer with this data
              this.render('standaloneViewer', {
                  data: () => this.data
              });
          }
      });
    }

    // This is ONLY for demo purposes.
    if (Meteor.isServer) {
      // You can test this with:
      // curl -v -H "Content-Type: application/json" -X GET 'http://localhost:3000/getData/testId'
      //
      // Or by going to:
      // http://localhost:3000/api/testId

      Router.route('/api/:id', { where: 'server' }).get(function() {
        // "this" is the RouteController instance.
        // "this.response" is the Connect response object
        // "this.request" is the Connect request object
        const id = this.params.id;

        // Find the relevant study data from the Collection given the ID
        const data = RequestStudies.findOne({ transactionId: id });

        // Set the response headers to return JSON to any server
        this.response.setHeader('Content-Type', 'application/json');
        this.response.setHeader('Access-Control-Allow-Origin', '*');
        this.response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        // Change the response text depending on the available study data
        if (!data) {
          this.response.write('No Data Found');
        } else {
          // Stringify the JavaScript object to JSON for the response
          this.response.write(JSON.stringify(data));
        }

        // Finalize the response
        this.response.end();
      });
    }
}
