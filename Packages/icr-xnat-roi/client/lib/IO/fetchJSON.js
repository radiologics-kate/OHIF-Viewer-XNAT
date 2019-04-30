import fetchMockJSON from "../../components/viewer/xnatNavigation/testJSON/fetchMockJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import makeCancelable from "../util/makeCancelable.js";

let fetchJSON;

if (Meteor.isDevelopment) {
  icrXnatRoiSession.set("projectId", "ITCRdemo");
  icrXnatRoiSession.set("subjectId", "XNAT_JPETTS_S00011");
  icrXnatRoiSession.set("experimentId", "XNAT_JPETTS_E00014");

  fetchJSON = fetchMockJSON;
} else {
  fetchJSON = function(route) {
    return makeCancelable(
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        const url = `${Session.get("rootUrl")}${route}`;

        console.log(`fetching: ${url}`);

        xhr.onload = () => {
          console.log(`Request returned, status: ${xhr.status}`);
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            resolve(null);
          }
        };

        xhr.onerror = () => {
          console.log(`Request returned, status: ${xhr.status}`);
          reject(xhr.responseText);
        };

        xhr.open("GET", url);
        xhr.responseType = "json";
        xhr.send();
      })
    );
  };
}

export default fetchJSON;
