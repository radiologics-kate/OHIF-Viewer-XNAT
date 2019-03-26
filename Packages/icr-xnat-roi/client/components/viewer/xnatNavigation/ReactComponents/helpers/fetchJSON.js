import fetchMockJSON from "../../testJSON/fetchMockJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

const productionMode = true;

let fetchJSON;

if (productionMode) {
  fetchJSON = function(route) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const url = `${Session.get("rootUrl")}${route}`;

      console.log(`fetching: ${url}`);

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(xhr.response);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("GET", url);
      xhr.responseType = "json";
      xhr.send();
    });
  };
} else {
  icrXnatRoiSession.set("projectId", "ITCRdemo");

  fetchJSON = fetchMockJSON;
}

export default fetchJSON;
