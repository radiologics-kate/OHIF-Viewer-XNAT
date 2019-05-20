import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import makeCancelable from "../../../../lib/util/makeCancelable.js";

export default function(projectId, subjectId, experimentId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const url = `${Session.get(
      "rootUrl"
    )}/xapi/viewer/projects/${projectId}/experiments/${experimentId}/exists`;

    console.log(`fetching: ${url}`);

    xhr.onload = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      if (xhr.status === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.send();
  });
}
