import { MaskImporter } from './MaskImporter.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { $ } from 'meteor/jquery';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { AsyncFetcher } from './AsyncFetcher.js';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * @class AsyncMaskFetcher
 * @author JamesAPetts
 *
 * Asynchronusly fetches roiCollections that contain masks, allows the user to select which to
 * import, and parses them using an instance of MaskImporter.
 *
 */
export class AsyncMaskFetcher extends AsyncFetcher {
  constructor (seriesInstanceUid) {
    super(
      seriesInstanceUid,
      validTypes = [
        'SEG',
        'NIFTI'
      ]
    );

    this._maskImporter = new MaskImporter();
    this._ioConfirmationDialog = document.getElementById('ioConfirmationDialog');
  }

  _openImportListDialog() {
    // Open the dialog and display a loading icon whilst data is fetched.
    this._maskImportListDialog = document.getElementById('maskImportListDialog');

    const dialogData = Blaze.getData(this._maskImportListDialog);

    dialogData.maskImportListReady.set(false);
    this._maskImportListDialog.showModal();
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
      removeEventListeners();
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

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: collectionInfo.label,
          type: 'SEG',
          name: collectionInfo.name,
          modified: false
        };

        console.log(`_getAndImportFile: Importing SEG, url: ${url}`);
        const arrayBuffer = await this._getArraybuffer(url).catch(error => console.log(error));
        this._maskImporter.importDICOMSEG(arrayBuffer, collectionInfo.name, collectionInfo.label);
        break;

      case 'NIFTI':
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: collectionInfo.label,
          type: 'NIFTI',
          name: collectionInfo.name,
          modified: false
        };

        console.log(`_getAndImportFile: Importing NIFTI, url: ${url}`);
        const niftiArrayBuffer = await this._getArraybuffer(url).catch(error => console.log(error));
        this._maskImporter.importNIFTI(niftiArrayBuffer, collectionInfo.name, collectionInfo.label);
        break;

      default:
        console.error(`asyncMaskFetcher._getAndImportFile not configured for filetype: ${fileType}.`);
    }

    this._incrementNumCollectionsParsed();
  }
}
