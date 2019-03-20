import { icrXnatRoiSession, sessionMap } from "meteor/icr:xnat-roi-namespace";
import { fetchCSRFToken } from "../IO/csrfToken.js";
import { generateUID } from "meteor/icr:peppermint-tools";
import getDateAndTime from "../util/getDateAndTime.js";

const XMLWriter = require("xml-writer");

export class DICOMSEGExporter {
  constructor(segBlob, seriesInstanceUid, label, name) {
    this._payload = segBlob;
    this._projectID = icrXnatRoiSession.get("sourceProjectId");
    this._subjectID = icrXnatRoiSession.get("subjectId");
    this._seriesInstanceUID = seriesInstanceUid;
    this._experimentID = sessionMap[this._seriesInstanceUID].experimentId;
    this._label = label;
    this._UID = generateUID();
    this._ID = this._generateCollectionId();

    const dateAndTime = getDateAndTime();

    this._date = dateAndTime.date;
    this._time = dateAndTime.time;

    this._name = name;

    this._assessorUrl =
      `${Session.get("rootUrl")}/data/archive/projects/${this._projectID}` +
      `/subjects/${this._subjectID}/experiments/${
        this._experimentID
      }/assessors/${this._ID}`;
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

    console.log(putSegUrl);

    await this._PUT_uploadSeg(putSegUrl, this._payload).catch(error => {
      putFailed = true;
      console.log(error);
    });

    if (putFailed) {
      throw Error("PUT failed, check logs above.");
    }
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

  _generateCollectionId() {
    const randomAlphaNumeric = [
      Math.random()
        .toString(36)
        .slice(2, 10),
      Math.random()
        .toString(36)
        .slice(2)
    ];

    return `RoiCollection_${randomAlphaNumeric[0]}_${randomAlphaNumeric[1]}`;
  }
}
