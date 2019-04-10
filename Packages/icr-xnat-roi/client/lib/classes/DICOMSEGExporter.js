import { sessionMap } from "meteor/icr:series-info-provider";
import { fetchCSRFToken } from "../IO/csrfToken.js";

const XMLWriter = require("xml-writer");

export class DICOMSEGExporter {
  constructor(segBlob, seriesInstanceUid, label, name) {
    this._payload = segBlob;
    this._seriesInstanceUID = seriesInstanceUid;
    this._projectID = sessionMap.get(
      this._seriesInstanceUID,
      "parentProjectId"
    );
    this._experimentID = sessionMap.get(
      this._seriesInstanceUID,
      "experimentId"
    );
    this._label = label;
  }

  async exportToXNAT() {
    const csrfToken = await fetchCSRFToken();
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;

    let putFailed = false;

    // http://10.1.1.18/XNAT_JPETTS/xapi/roi/projects/ITCRdemo/sessions/XNAT_JPETTS_E00014/collections/mySegCollection?type=SEG&overwrite=false
    const putSegUrl =
      `${Session.get("rootUrl")}/xapi/roi/projects/${this._projectID}` +
      `/sessions/${this._experimentID}/collections/${
        this._label
      }?type=SEG&overwrite=false&${csrfTokenParameter}`;
    await this._PUT_uploadSeg(putSegUrl, this._payload).catch(error => {
      putFailed = true;
      console.log(error);
    });
    if (putFailed) {
      throw Error("PUT failed, check logs above.");
    }

    console.log("wrote SEG");
    console.log("PUT succesful, resolving");
    return;
  }

  _PUT_uploadSeg(url, seg) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200 || xhr.status === 201) {
          resolve();
        } else {
          reject(xhr.responseText);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.send(seg);
    });
  }
}
