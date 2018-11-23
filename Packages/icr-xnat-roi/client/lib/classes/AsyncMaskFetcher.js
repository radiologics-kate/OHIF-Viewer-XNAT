import { MaskImporter } from './MaskImporter.js';
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
    this._dialog = document.getElementById('importVolumes');
    this._ioConfirmationDialog = document.getElementById('ioConfirmationDialog');
    this._validTypes = [
      'SEG'
    ];
  }


  /** @public @async
   * fetchMasks - Asynchronusly fetch and process masks.
   */
  async fetchMasks () {
    // Open the dialog and display a loading icon whilst data is fetched.
    this._maskImportListDialog = document.getElementById('maskImportListDialog');

    const dialogData = Blaze.getData(this._maskImportListDialog);

    dialogData.maskImportListReady.set(false);
    this._maskImportListDialog.showModal();

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

    const dialog = this._maskImportListDialog;
    const dialogData = Blaze.getData(dialog);

    dialogData.maskImportList.set(this._collectionInfoArray);
    dialogData.maskImportListReady.set(true);

    let importMaskID;
    let confirmed = false;

    // Await user input
    while (!confirmed) {
      importMaskID = await this._awaitInputFromListUI(this._collectionInfoArray);

      if (importMaskID === undefined) {
        console.log(`confirmed: ${confirmed} kinda.. well cancelled.`);
        confirmed = true;
      } else {
        const hasExistingData = this._hasExistingMaskData();

        console.log(hasExistingData);

        if (hasExistingData) {
          console.log('Check confirmation first!');

          confirmed = await this._awaitOverwriteConfirmationUI();
          console.log(`confirmed: ${confirmed}`);
        } else {
          confirmed = true;
          console.log(`confirmed: ${confirmed}`);
        }
      }

    }

    dialog.close();

    if (importMaskID === undefined) {
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
    this._dialog.showModal();
  }


  /** @private @async
   * _awaitInputFromListUI - Awaits user input from the maskImportList UI.
   *
   * @param  {Array} importList The list of roiCollections eligible for import.
   * @return {Promise}          A promise that resolves to give a true/false
   *                            array describing which roiCollections to import.
   */
  async _awaitInputFromListUI (importList) {

    function keyConfirmEventHandler (e) {
      console.log('keyConfirmEventHandler');

      if (e.which === 13) { // If Enter is pressed accept and close the dialog
        confirmEventHandler();
      }
    }

    function confirmEventHandler () {
      const selection = document.querySelector(".mask-import-list-item-check:checked");
      const importMaskID = selection.value;

      console.log(`importMaskID: ${importMaskID}`);

      removeEventListeners();
      resolveRef(importMaskID);
    };

    function cancelEventHandler (e) {
      console.log('prevent default escape.');

      e.preventDefault();

      removeEventListeners();
      resolveRef();
    }

    function cancelClickEventHandler () {
      removeEventListeners();
      resolveRef();
    }

    function removeEventListeners() {
      dialog.removeEventListener('cancel', cancelEventHandler);
      cancel.removeEventListener('click', cancelClickEventHandler);
      dialog.removeEventListener('keydown', keyConfirmEventHandler);
      confirm.removeEventListener('click', confirmEventHandler);
    }

    const dialog = this._maskImportListDialog;
    const confirm = dialog.getElementsByClassName('mask-import-list-confirm')[0];
    const cancel = dialog.getElementsByClassName('mask-import-list-cancel')[0];

    dialog.addEventListener('cancel', cancelEventHandler);
    cancel.addEventListener('click', cancelClickEventHandler);
    dialog.addEventListener('keydown', keyConfirmEventHandler);
    confirm.addEventListener('click', confirmEventHandler);

    // Reference to promise.resolve, so that I can use external handlers.
    let resolveRef;

    return new Promise(resolve => {
      resolveRef = resolve;
    });
  }


  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @return {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData() {
    let hasData = false;
    if (brushModule.state.import && brushModule.state.import.label) {
      hasData = true;
    } else {
      const metadata = brushModule.state.segmentationMetadata[this._seriesInstanceUid];

      //const metadata = brushModule.getters.metadata(this._seriesInstanceUid);
      console.log('metadata:');
      console.log(metadata);
      if (metadata) {
        hasData = metadata.some(data =>
          data !== undefined
        );
      }
    }

    return hasData;
  }

  /** @private @async
   * _awaitOverwriteConfirmationUI - Awaits user input for confirmation.
   *
   * @return {Promise} A promise that resolves on accept and rejects on cancel.
   */
  async _awaitOverwriteConfirmationUI () {

    function keyConfirmEventHandler (e) {
      console.log('keyConfirmEventHandler');

      if (e.which === 13) { // If Enter is pressed accept and close the dialog
        confirmEventHandler();
      }
    }

    function confirmEventHandler () {
      dialog.close();

      removeEventListeners();
      resolveRef(true);
    }

    function cancelEventHandler () {
      resolveRef(false);
    }

    function cancelClickEventHandler () {
      dialog.close();

      removeEventListeners();
      resolveRef(null);
    }

    function removeEventListeners() {
      dialog.removeEventListener('cancel', cancelEventHandler);
      cancel.removeEventListener('click', cancelClickEventHandler);
      dialog.removeEventListener('keydown', keyConfirmEventHandler);
      confirm.removeEventListener('click', confirmEventHandler);
    }

    console.log('in _awaitOverwriteConfirmationUI');

    const dialog = this._ioConfirmationDialog;
    const ioConfirmationTitle = dialog.getElementsByClassName('io-confirmation-title')[0];
    const ioConfirmationBody = dialog.getElementsByClassName('io-confirmation-body')[0];
    const confirm = dialog.getElementsByClassName('js-io-confirmation-confirm')[0];
    const cancel = dialog.getElementsByClassName('js-io-confirmation-cancel')[0];

    // Add event listeners.
    dialog.addEventListener('cancel', cancelEventHandler);
    cancel.addEventListener('click', cancelClickEventHandler);
    dialog.addEventListener('keydown', keyConfirmEventHandler);
    confirm.addEventListener('click', confirmEventHandler);

    console.log(ioConfirmationTitle);

    ioConfirmationTitle.textContent = `
      Warning
    `;

    ioConfirmationBody.textContent = `
      Loading in another ROICollection will overwrite existing mask data. Are you sure
      you want to do this?
    `;

    dialog.showModal();

    // Reference to promise.resolve, so that I can use external handlers.
    let resolveRef;

    return new Promise(resolve => {
      resolveRef = resolve;
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
      this._dialog.close();
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
