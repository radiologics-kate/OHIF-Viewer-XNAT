import { icrXnatRoiSession, sessionMap } from "meteor/icr:xnat-roi-namespace";
import { fetchCSRFToken } from "../IO/csrfToken.js";

const XMLWriter = require("xml-writer");

export class AIMExporter {
  constructor(aimWriter) {
    this._aimString = aimWriter.toString();
    this._projectID = icrXnatRoiSession.get("sourceProjectId");
    this._subjectID = icrXnatRoiSession.get("subjectId");
    this._seriesInstanceUID = aimWriter.seriesInfo.seriesInstanceUid;
    this._experimentID = sessionMap[this._seriesInstanceUID].experimentId;
    this._label = aimWriter.label;
    this._UID = aimWriter.imageAnnotationCollectionUUID;
    this._ID = this._generateCollectionId();
    this._date = aimWriter.date;
    this._time = aimWriter.time;
    this._name = aimWriter.name;

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

    const putUrl = `${Session.get("rootUrl")}/xapi/roi/projects/${
      this._projectID
    }/sessions/${this._experimentID}/collections/${
      this._label
    }?type=AIM&overwrite=false&${csrfTokenParameter}`;

    await this._PUTAIM(putUrl).catch(error => {
      putFailed = true;
      console.log(error);
    });

    if (putFailed) {
      throw Error("PUT failed, check logs above.");
    }

    console.log("PUT succesful, resolving");

    return;
  }

  _PUTAIM(url) {
    const arraybuffer = this._getArraybuffer();

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
      xhr.send(arraybuffer);
    });
  }

  _getArraybuffer() {
    const utf8AimString = unescape(encodeURIComponent(this._aimString));

    const arraybuffer = new ArrayBuffer(utf8AimString.length); // 2 bytes for each char
    const uint8View = new Uint8Array(arraybuffer);
    for (let i = 0; i < utf8AimString.length; i++) {
      uint8View[i] = utf8AimString.charCodeAt(i);
    }
    return arraybuffer;
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
