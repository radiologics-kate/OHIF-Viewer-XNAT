import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { generateUID } from 'meteor/icr:peppermint-tools';
import getDateAndTime from '../util/getDateAndTime.js';

const XMLWriter = require('xml-writer');

export class DICOMSEGExporter {

  constructor (segBlob, seriesInstanceUid, label, name) {
    this._payload = segBlob;
    this._projectID = icrXnatRoiSession.get('projectId');
    this._subjectID = icrXnatRoiSession.get('subjectId');
    this._experimentID = icrXnatRoiSession.get('experimentId');
    this._seriesInstanceUID = seriesInstanceUid;
    this._label = label;
    this._UID = generateUID();
    this._ID = this._generateCollectionId();

    const dateAndTime = getDateAndTime();

    this._date = dateAndTime.date;
    this._time = dateAndTime.time;

    this._name = name;

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
    const putCreateResourceUrl = `${this._assessorUrl}/resources/SEG?content=EXTERNAL&format=DICOM&description=SEG+instance+file&name=SEG&${csrfTokenParameter}`;
    await this._PUT_createResource(putCreateResourceUrl)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('PUT failed, check logs above.');
    }

    // Upload resource (DICOM)
    const putUploadSegUrl = `${this._assessorUrl}/resources/SEG/files/${this._name}.dcm?inbody=true&content=EXTERNAL&format=DICOM&${csrfTokenParameter}`;
    await this._PUT_uploadSeg(putUploadSegUrl, this._payload)
      .catch(error => {
        putFailed = true;
        console.log(error);
      });

    if (putFailed) {
      throw Error('PUT failed, check logs above.');
    }

    console.log('wrote SEG');

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

  _PUT_uploadSeg (url, seg) {
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
      xhr.setRequestHeader('Content-Type', 'application/dicom');
      xhr.send(seg);
    });
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
    xw.writeElement('collectionType', 'SEG');
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
