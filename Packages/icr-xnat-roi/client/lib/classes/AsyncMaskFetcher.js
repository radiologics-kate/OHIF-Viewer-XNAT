import { MaskImporter } from './MaskImporter.js';
import closeIODialog from '../IO/closeIODialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { $ } from 'meteor/jquery';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * @class AsyncMaskFetcher
 * @author JamesAPetts
 *
 * Asynchronusly fetches roiCollections that contain masks, allows the user to select which to
 * import, and parses them using an instance of MaskImporter.
 *
 */
export class AsyncMaskFetcher {
  constructor (seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._maskImporter = new MaskImporter();
    this._numCollectionsParsed = 0;
    this._roiCollectionLabel = '';
    this._dialog = $('#importVolumes');
    this._ioConfirmationDialog = $('#ioConfirmationDialog');
    this._validTypes = [
      'SEG'
    ];
  }


  /** @public @async
   * fetchMasks - Asynchronusly fetch and process masks.
   */
  async fetchMasks () {
    // Open the dialog and display a loading icon whilst data is fetched.
    icrXnatRoiSession.set('importListReady', false);
    this._maskImportListDialog = $('#maskImportListDialog');
    this._maskImportListDialog.get(0).showModal();

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
    // Await user input

    const importMaskID = await this._awaitInputFromListUI(this._collectionInfoArray);

    closeIODialog(this._maskImportListDialog);

    if (!importMaskID) {
      console.log('cancelled');
      return;
    }

    console.log('confirmed');

    // Only 1 to parse for masks.
    if (importMaskID === undefined) {
      console.log('numCollectionToParse = 0');
      return;
    } else {
      this._numCollectionsToParse = 1;
    }

    this._openProgressDialog();

    this._getFilesFromList(this._collectionInfoArray[importMaskID]);
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
   * _awaitInputFromListUI - Awaits user input from the maskImportList UI.
   *
   * @param  {Array} importList The list of roiCollections eligible for import.
   * @return {Promise}          A promise that resolves to give a true/false
   *                            array describing which roiCollections to import.
   */
  async _awaitInputFromListUI (importList) {
    icrXnatRoiSession.set('importList', importList);
    icrXnatRoiSession.set('importListReady', true);

    const dialog = this._maskImportListDialog;
    const seriesInstanceUid = this._seriesInstanceUid;
    //const ioConfirmationDialog = this._ioConfirmationDialog;


    console.log(`in _awaitInputFromListUI`);
    //console.log(`ioConfirmationDialog: ${ioConfirmationDialog}`);
    console.log(`seriesInstanceUid: ${seriesInstanceUid}`);

    return new Promise((resolve) => {
      const confirm = dialog.find('.mask-import-list-confirm');
      const cancel = dialog.find('.mask-import-list-cancel');

      const confirmHandler = async () => {
        const selection = document.querySelector(".mask-import-list-item-check:checked");
        const importMaskID = selection.value;

        console.log(`importMaskID: ${importMaskID}`);

        const existingData = hasExistingData();

        console.log(existingData);

        if (existingData) {
          console.log('hasExistingData == true');

          const accept = await this._awaitOverwriteConfirmationUI()
            .catch(error => console.log(error.message));

          closeIODialog(this._ioConfirmationDialog);

          if (!accept) {
            console.log('cancelled');
            return;
          }

          console.log('confirmed');
        }

        resolve(importMaskID);
      };

      function hasExistingData() {
        // Check if we either have an import (quicker to check), or we have some data.
        let hasData = false;
        if (brushModule.state.import && brushModule.state.import.label) {
          hasData = true;
        } else {
          const metadata = brushModule.getters.metadata(seriesInstanceUid);
          console.log(metadata);
          if (metadata) {
            hasData = metadata.some(data =>
              data !== undefined
            );
          }
        }

        return hasData;
      }

      function cancelHandler () {
        resolve();
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

  /** @private @async
   * _awaitOverwriteConfirmationUI - Awaits user input for confirmation.
   *
   * @return {Promise} A promise that resolves on accept and rejects on cancel.
   */
  async _awaitOverwriteConfirmationUI () {
    console.log('in _awaitOverwriteConfirmationUI');

    const dialog = this._ioConfirmationDialog;
    const ioConfirmationTitle = dialog.find('.io-confirmation-title');
    const ioConfirmationBody = dialog.find('.io-confirmation-body');

    ioConfirmationTitle.html(`
      Warning
    `);

    ioConfirmationBody.html(`
      Loading in another mask will overwrite existing mask data. Are you sure
      you want to do this?
    `);

    dialog.get(0).showModal();

    return new Promise((resolve) => {
      const confirm = dialog.find('.js-io-confirmation-confirm');
      const cancel = dialog.find('.js-io-confirmation-cancel');

      function confirmHandler () {
        resolve(true);
      }

      function cancelHandler () {
        resolve(false);
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

    const collectionType = item.data_fields.collectionType;

    if (!this._isValidCollectionType(collectionType)) {
      return false;
    }

    // Check collection isn't already imported.
    const roiCollectionLabel = item.data_fields.label;

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
   * _isValidCollectionType - Returns true if the collection is a contour type.
   *
   * @param  {type} collectionType description
   * @return {type}                description
   */
  _isValidCollectionType (collectionType) {

    return this._validTypes.some(type =>
      type === collectionType
    );
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
      case 'SEG':
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();

        // Store that we've imported a collection.
        brushModule.state.import = {
          label: collectionInfo.label,
          name: collectionInfo.name
        };

        console.log(`_getAndImportFile: Importing SEG, url: ${url}`);
        const arrayBuffer = await this._getArraybuffer(url).catch(error => console.log(error));
        this._maskImporter.importDICOMSEG(arrayBuffer, collectionInfo.name, collectionInfo.label);
        break;
      default:
        console.error(`asyncMaskFetcher._getAndImportFile not configured for filetype: ${fileType}.`);
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
