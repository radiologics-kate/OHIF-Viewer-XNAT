import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const XMLWriter = require('xml-writer');

export class AIMExporter {

  constructor (aimWriter) {
    this._aimString = aimWriter.toString();
    this._projectID = icrXnatRoiSession.get('projectId');
    this._subjectID = icrXnatRoiSession.get('subjectId');
    this._experimentID = icrXnatRoiSession.get('experimentId');
    this._seriesInstanceUID = aimWriter.seriesInfo.seriesInstanceUid;
    this._label = aimWriter.label;
    this._UID = aimWriter.imageAnnotationCollectionUUID;
    this._ID = this._generateCollectionId();
    this._date = aimWriter.date;
    this._time = aimWriter.time;
    this._name = aimWriter.name;

    this._assessorUrl = `${Session.get('rootUrl')}/data/archive/projects/${this._projectID}`
      + `/subjects/${this._subjectID}/experiments/${this._experimentID}/assessors/${this._ID}`;
  }

  async exportToXNAT () {
    const metaDataXml = this._generateResourceMetadata();
    const csrfToken = window.top.csrfToken; //csrfToken of parent. Can only perform put when iframe is embedded in XNAT.
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;

    let putFailed = false;

    // Upload resource metaData
    const putResourceMetadataUrl = `${this._assessorUrl}?inbody=true&${csrfTokenParameter}`;

    await this._PUT_metadata(putResourceMetadataUrl, metaDataXml)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('PUT failed, check logs above.');
    }

    // Create resource
    const putCreateResourceUrl = `${this._assessorUrl}/resources/AIM?content=EXTERNAL&format=XML&description=AIM+instance+file&name=AIM&${csrfTokenParameter}`;
    await this._PUT_createResource(putCreateResourceUrl)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('PUT failed, check logs above.');
    }

    // Upload resource (AIM)
    const putUploadAimUrl = `${this._assessorUrl}/resources/AIM/files/${this._name}.xml?inbody=true&content=EXTERNAL&format=XML&${csrfTokenParameter}`;
    await this._PUT_uploadAim(putUploadAimUrl, this._aimString)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('PUT failed, check logs above.');
    }

    console.log('wrote AIM');

    // Call server code to convert the exported AIM to RT-STRUCT, and add this as an additional resource to the roiCollection.
    const getConvertRTStuctUrl = `${Session.get('rootUrl')}/xapi/roi/projects/${this._projectID}/collections/${this._label}?type=RTSTRUCT&${csrfTokenParameter}`;

    console.log('GET URL for RTSTRUCT conversion:');
    console.log(getConvertRTStuctUrl);

    await this._GET(getConvertRTStuctUrl)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('POST failed for AIM to RTSTUCT conversion, check logs above.');
    }

    console.log('PUT succesful, resolving');
    return;
  }

  // Wrappers around _PUT. Note they return Promises.
  _PUT_metadata (url, metaDataXml) {
    return this._PUT(url, metaDataXml);
  }

  _PUT_createResource (url) {
        return this._PUT(url, null);
  }

  _PUT_uploadAim (url, aimXml) {
    return this._PUT(url, aimXml);
  }

  _PUT (url, xml) {
    return new Promise ((resolve,reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if ( xhr.status === 200 || xhr.status === 201 ) {
          resolve();
        } else {
          reject(xhr.responseText);
        }
      }

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      }

      xhr.open('PUT', url);

      if (xml) {
        xhr.setRequestHeader('Content-Type', 'text/xml');
        xhr.send(xml);
      } else {
        xhr.send();
      }

    });
  }

  _GET (url) {
    return new Promise ((resolve,reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if ( xhr.status === 200 || xhr.status === 201 ) {
          resolve();
        } else {
          reject(xhr.responseText);
        }
      }

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      }

      xhr.open('GET', url);
      xhr.send();
    });
  }


  _generateResourceMetadata () {
    const xw = new XMLWriter(true);
    xw.startDocument('1.0', 'UTF-8', false);
    xw.startElement('RoiCollection')
      .writeAttribute('xmlns:icr', 'http://www.icr.ac.uk/icr')
      .writeAttribute('xmlns:prov', 'http://www.nbirn.net/prov')
      .writeAttribute('xmlns:xnat', 'http://nrg.wustl.edu/xnat')
      .writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .writeAttribute('id', this._ID)
      .writeAttribute('label', this._label)
      .writeAttribute('project', this._projectID)
      .writeAttribute('version','1');
    xw.writeElement('date', this._date);
    xw.writeElement('time', this._time);
    xw.writeElement('imageSession_ID', this._experimentID);
    xw.writeElement('UID', this._UID);
    xw.writeElement('collectionType', 'AIM');
    xw.writeElement('subjectID', this._subjectID);
    xw.startElement('references');
      xw.writeElement('seriesUID',this._seriesInstanceUID);
    xw.endElement();
    xw.writeElement('name', this._name);
    xw.endElement();
    xw.endDocument();

    console.log(xw.toString());

    return xw.toString();
  }

  _generateCollectionId () {
    const randomAlphaNumeric = [
      Math.random().toString(36).slice(2,10),
      Math.random().toString(36).slice(2),
    ];

    return `RoiCollection_${randomAlphaNumeric[0]}_${randomAlphaNumeric[1]}`;
  }


}
