import { RoiImporter } from './RoiImporter.js';
import closeIODialog from '../IO/closeIODialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { $ } from 'meteor/jquery';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';


/**
 * @class AsyncRoiFetcher
 * @author JamesAPetts
 *
 * Asynchronusly fetches roiCollections, allows the user to select which to
 * import, and parses them using an instance of RoiImporter.
 *
 */
export class AsyncRoiFetcher {
  constructor (seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._roiImporter = new RoiImporter(seriesInstanceUid);
    this._numCollectionsParsed = 0;
    this._roiCollectionLabel = '';
    this._dialog = $('#importVolumes');
    this._volumeManagementLabels = this._getVolumeManagementLabels();
  }

  /** @private
   * _getVolumeManagementLabels - Construct a list of roiCollections
   *                               already imported.
   *
   * @return {string[]} An array of the labels of roiCollections already imported.
   */
  _getVolumeManagementLabels () {
    const volumeManagementLabels = [];
    const seriesRoiCollectionData = cornerstoneTools.freehand.getRoiCollectionData()[this._seriesInstanceUid];

    // Check if more than just the working directory exists.
    if (seriesRoiCollectionData) {
      Object.keys(seriesRoiCollectionData).forEach(function(roiCollectionName) {
        const label = seriesRoiCollectionData[roiCollectionName].label;

        if (label !== 'DEFAULT') {
          volumeManagementLabels.push(label);
        }
      });
    }

    return volumeManagementLabels;
  }


  /** @public @async
   * fetchRois - Asynchronusly fetch and process all ROIs.
   */
  async fetchRois () {
    // Open the dialog and display a loading icon whilst data is fetched.
    icrXnatRoiSession.set('importListReady', false);
    this._roiImportListDialog = $('#roiImportListDialog');
    this._roiImportListDialog.get(0).showModal();

    // Fetch list of assessors for the session.
    const sessionAssessorsUrl = `${Session.get('rootUrl')}/data/archive/experiments/${icrXnatRoiSession.get('experimentId')}/assessors?format=json`;
    const sessionAssessorList = await this._getJson(sessionAssessorsUrl).catch(error => console.log(error));

    // Filter roiCollections from assessor list.
    const assessorList = sessionAssessorList.ResultSet.Result;
    const roiCollectionList = this._filterRoiCollections(assessorList);

    // Initialise an array of collectionInfo to build up the list.
    this._collectionInfoArray = [];
    this._roiCollectionsToCheck = roiCollectionList.length;

    // If no ROICollections at all, load list dialog immediately.
    if (this._roiCollectionsToCheck=== 0) {
      this._selectAndImportRois();
    }

    // Get each roicollection
    for (let i = 0; i < roiCollectionList.length; i++) {
      const roiCollectionId = roiCollectionList[i].ID;
      const getCollectionUrl = `${Session.get('rootUrl')}/data/archive/experiments/${icrXnatRoiSession.get('experimentId')}/assessors/${roiCollectionId}?format=json`;

      this._addCollectionToListIfCanImport(getCollectionUrl, roiCollectionId);
    }
  }


  /** @private @async
   * _addCollectionToListIfCanImport - Fetches the requested collectionInfo,
   * and adds it to the _collectionInfoArray if the collection references the
   * active series and has not already been imported.
   *
   * @param  {String} getCollectionUrl The REST URL to GET the collectionInfo.
   * @param  {type} roiCollectionId  The ID of the roiCollection.
   */
  async _addCollectionToListIfCanImport (getCollectionUrl, roiCollectionId) {
    const collectionInfoJSON = await this._getJson(getCollectionUrl).catch(error => console.log(error));

    if (this._collectionEligibleForImport(collectionInfoJSON)) {
      const collectionInfo = this._getCollectionInfo(roiCollectionId, collectionInfoJSON);

      this._collectionInfoArray.push(collectionInfo);
    }

    this._roiCollectionsToCheck--;

    if (this._roiCollectionsToCheck === 0) {
      this._selectAndImportRois();
    }
  }

  /** @private @async
   * _selectAndImportRois - Display list of roiCollections eligible for import,
   * await user input, and download the selected roiCollections.
   */
  async _selectAndImportRois() {
    let importMask;

    // Await user input
    try {
      importMask = await this._awaitInputFromListUI(this._collectionInfoArray);
      closeIODialog(this._roiImportListDialog);
    } catch (cancel) {
      closeIODialog(this._roiImportListDialog);
      return;
    }

    // Grab number to parse for UI loading dialog.
    this._numCollectionsToParse = 0;
    for (let i = 0; i < importMask.length; i++) {
      if (importMask[i]) {
        this._numCollectionsToParse++;
      }
    }

    // Exit if zero collections selected.
    if (this._numCollectionsToParse === 0) {
      console.log('numCollectionToParse = 0');
      return;
    }

    this._openProgressDialog();

    for (let i = 0; i < this._collectionInfoArray.length; i++) {
      if (importMask[i]) {
        this._getFilesFromList(this._collectionInfoArray[i]);
      }
    }
  }


  /** @private
   * _openProgressDialog - Opens the progress dialog.
   *
   */
  _openProgressDialog() {
    this._updateProgressDialog();
    this._dialog.get(0).showModal();
  }


  /** @private @async
   * _awaitInputFromListUI - Awaits user input from the roiImportList UI.
   *
   * @param  {Array} importList The list of roiCollections eligible for import.
   * @return {Promise}          A promise that resolves to give a true/false
   *                            array describing which roiCollections to import.
   */
  async _awaitInputFromListUI(importList) {
    icrXnatRoiSession.set('importList', importList);
    icrXnatRoiSession.set('importListReady', true);

    const dialog = this._roiImportListDialog;

    return new Promise((resolve,reject) => {
      const confirm = dialog.find('.roiImportListConfirm');
      const cancel = dialog.find('.roiImportListCancel');

      function confirmHandler () {
        const dialogData = Blaze.getData(document.querySelector('#roiImportListDialog'));

        resolve(dialogData.importMask);
      }

      function cancelHandler () {
        reject();
      }

      // Register handlers.
      dialog.off('keydown');
      dialog.on('keydown', e => {
        if (e.which === 13) { // If Enter is pressed, accept and close the dialog.
          confirmHandler();
        } else if (e.which === 27) { // If Esc is pressed, cancel and close the dialog.
          cancelHandler();
        }
      });

      confirm.off('click');
      confirm.on('click', () => {
        confirmHandler();
      });


      cancel.off('click');
      cancel.on('click', () => {
        cancelHandler();
      });
    });
  }


  /** @private
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @return {Boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport (collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    // Check collection isn't already imported.
    const roiCollectionLabel = item.data_fields.label;

    const collectionAlreadyImported = this._volumeManagementLabels.some(
      label => label === roiCollectionLabel
    );

    if (collectionAlreadyImported) {
      return false;
    }

    // Check the collection references this seriesInstanceUid.
    for (let i = 0; i < children.length; i++) {
      if (children[i].field === 'references/seriesUID') {
        const referencedSeriesInstanceUidList = children[i].items;

        for (let j = 0; j < referencedSeriesInstanceUidList.length; j++) {
          const seriesInstanceUid = referencedSeriesInstanceUidList[j].data_fields.seriesUID;

          if (seriesInstanceUid === this._seriesInstanceUid) {
            return true;
          }
        }
      }
    }

    return false;
  }


  /**
   * _getCollectionInfo - Constructs a collectionInfo object from the supplied
   *                      collectionInfoJSON.
   *
   * @param  {Object} collectionInfoJSON  The POJO created from the JSON
   *                                      retrieved via REST.
   * @return {Object}                     The collectionInfo.
   */
  _getCollectionInfo (roiCollectionId, collectionInfoJSON) {
    const data_fields = collectionInfoJSON.items[0].data_fields;

    return {
      collectionType: data_fields.collectionType,
      label: data_fields.label,
      name: data_fields.name,
      getFilesUrl: `${Session.get('rootUrl')}/data/archive/experiments/${icrXnatRoiSession.get('experimentId')}/assessors/${roiCollectionId}/files?format=json`
    };
  }


  /** @private @async
   * _getFilesFromList - Fetches the data referenced by the collectionInfo.
   *
   * @param  {type} collectionInfo  An object describing the roiCollection to
   *                                import.
   */
  async _getFilesFromList (collectionInfo) {
    const getFilesUrl = collectionInfo.getFilesUrl;
    const roiList = await this._getJson(getFilesUrl).catch(error => console.log(error));

    const result = roiList.ResultSet.Result;

    // Reduce count if no associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      this._incrementNumCollectionsParsed();
    }

    // Retrieve each ROI from the list that has the same collectionType as the collection.
    // In an ideal world this should always be 1, and any other resources -- if any -- are differently formated representations of the same data, but things happen.
    for (let i = 0; i < result.length; i++ ) {
      const fileType = result[i].collection;
      if (fileType === collectionInfo.collectionType) {
        const fileUrl = `${Session.get('rootUrl')}${result[i].URI}`;
        this._getAndImportFile(fileUrl, collectionInfo);
      }
    }
  }

  /** @private @async
   * _getAndImportFile - Imports the file from the REST url and loads it into
   *                     cornerstoneTools toolData.
   *
   * @param  {type} url             The REST URL of the file.
   * @param  {type} collectionInfo  An object describing the roiCollection to
   *                                import.
   */
  async _getAndImportFile (url, collectionInfo) {
    switch (collectionInfo.collectionType) {
      case 'AIM':
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();
        const aimFile = await this._getXml(url).catch(error => console.log(error));
        this._roiImporter.importAIMfile(aimFile, collectionInfo.name, collectionInfo.label);
        break;
      case 'RTSTRUCT':
        const rtStructFile = await this._getArraybuffer(url).catch(error => console.log(error));
        this._roiImporter.importRTStruct(rtStructFile, collectionInfo.name, collectionInfo.label);
        break;
      default:
        console.error(`asyncRoiFetcher._getAndImportFile not configured for filetype: ${fileType}.`);
    }

    this._incrementNumCollectionsParsed();
  }


  /** @private
   * _incrementNumCollectionsParsed - Increases the number of collections
   * parsed, and closes the progress dialog if the collections have all been
   * imported.
   *
   * @return {type}  description
   */
  _incrementNumCollectionsParsed () {
    this._numCollectionsParsed++;
    this._updateProgressDialog();

    if (this._numCollectionsParsed === this._numCollectionsToParse) {
      closeIODialog(this._dialog);
    }
  }


  /** @private
   * _filterRoiCollections - Filters out roiCollections from an assessor list
   * and set the number of roiCollections that need to be parsed.
   *
   * @param  {Array} assessors The assessor list that needs to be filtered.
   * @return {Array}           The filtered list containing only roiCollections.
   */
  _filterRoiCollections (assessors) {
    const roiCollections = [];

    // Get each roicollection
    for ( let i = 0; i < assessors.length; i++ ) {
      if ( assessors[i].xsiType === 'icr:roiCollectionData' ) {
        roiCollections.push(assessors[i]);
      }
    }

    this._numCollectionsToParse = roiCollections.length;

    return roiCollections;
  }

  /** @private
   * _getJson - GETs JSON from a REST URL.
   *
   * @param  {String}   url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getJson (url) {
    return this._GET_file(url, 'json');
  }


  /** @private
   * _getXml - GETs XML from a REST URL.
   *
   * @param  {String} url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getXml (url) {
    return this._GET_file(url, 'xml');
  }


  /** @private
   * _getArraybuffer - GETs and arraybuffer from a REST URL.
   *
   * @param  {type} url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getArraybuffer (url) {
    return this._GET_file(url, 'arraybuffer');
  }


  /** @private
   * _GET_file - GETs a file of the requested filetype from a REST URL.
   *
   * @param  {String} url      The REST URL to request data from.
   * @param  {String} fileType The requested filetype of the data.
   * @return {Promise}         A promise that will resolve to the requested file.
   */
  _GET_file (url, fileType) {
    return new Promise ((resolve,reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if ( xhr.status === 200 ) {
          resolve(xhr.response);
        } else {
          reject(xhr.response);
        }
      }

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      }

      xhr.open('GET', url);
      this._setXhrHeaders(xhr, fileType);
      xhr.send();
    });
  }

  /** @private
   * _setXhrHeaders - Sets the headers of the XMLHttpRequest based on the
   * fileType supplied.
   *
   * @param  {XMLHttpRequest} xhr       The rest client.
   * @param  {String}         fileType  The filetype being requested.
   */
  _setXhrHeaders (xhr, fileType) {
    switch (fileType) {
      case 'json':
        xhr.responseType = 'json';
        break;
      case 'xml':
        xhr.responseType = 'document';
        break;
      case 'arraybuffer':
        xhr.responseType = 'arraybuffer';
        break;
      case null:
        break;
      default:
        console.log(`XNATRESTInterface.GET_file not configured for filetype: ${fileType}.`);
    };
  }


  /** @private
   * _updateProgressDialog - Updates the progress dialog.
   *
   */
  _updateProgressDialog() {
    const ioNotificationText = `Importing ROI Collection: ${this._roiCollectionLabel}...`;
    const ioProgressText = `${this._numCollectionsParsed}/${this._numCollectionsToParse} <i class="fa fa-spin fa-circle-o-notch fa-fw">`;

    document.getElementById('ioNotificationText').innerHTML = ioNotificationText;
    document.getElementById('ioProgressText').innerHTML = ioProgressText;
  }

}
