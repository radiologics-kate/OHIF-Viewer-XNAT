import { MaskImporter } from "./MaskImporter.js";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { AsyncFetcher } from "./AsyncFetcher.js";
import awaitConfirmationDialog from "../IO/awaitConfirmationDialog.js";

const brushModule = cornerstoneTools.store.modules.brush;

const overwriteConfirmationContent = {
  title: `Warning`,
  body: `
    Loading in another ROICollection will overwrite existing mask data. Are you sure
    you want to do this?
  `
};

/**
 * @class AsyncMaskFetcher - Asynchronusly fetches roiCollections that contain masks, allows the user to select which to
 * import, and parses them using a MaskImporter.
 */
export class AsyncMaskFetcher extends AsyncFetcher {
  constructor(seriesInstanceUid) {
    super(seriesInstanceUid, (validTypes = ["SEG", "NIFTI"]));

    this._maskImporter = new MaskImporter();
  }

  /**
   * _openImportListDialog - Open the dialog and display a loading icon
   * whilst data is fetched.
   *
   * @returns {null}
   */
  _openImportListDialog() {
    this._maskImportListDialog = document.getElementById(
      "maskImportListDialog"
    );

    const dialogData = Blaze.getData(this._maskImportListDialog);

    dialogData.maskImportListReady.set(false);
    this._maskImportListDialog.showModal();
  }

  /** @private @async
   * _selectAndImportRois - Display list of roiCollections eligible for import,
   * await user input, and download the selected roiCollections.
   *
   * @returns {null}
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
      importMaskID = await this._awaitInputFromListUI(
        this._collectionInfoArray
      );

      if (importMaskID === undefined) {
        // Cancelled
        confirmed = true;
      } else {
        const hasExistingData = this._hasExistingMaskData();

        if (hasExistingData) {
          confirmed = await awaitConfirmationDialog(
            overwriteConfirmationContent
          );
        } else {
          confirmed = true;
        }
      }
    }

    dialog.close();

    if (importMaskID === undefined) {
      return;
    }

    // Only 1 to parse for masks.
    if (importMaskID === undefined) {
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
   * @returns {Promise}          A promise that resolves to give a true/false
   *                            array describing which roiCollections to import.
   */
  async _awaitInputFromListUI(importList) {
    function keyConfirmEventHandler(e) {
      if (e.which === 13) {
        // If Enter is pressed accept and close the dialog
        confirmEventHandler();
      }
    }

    function confirmEventHandler() {
      const selection = document.querySelector(
        ".mask-import-list-item-check:checked"
      );
      const importMaskID = selection.value;

      removeEventListeners();
      resolveRef(importMaskID);
    }

    function cancelEventHandler(e) {
      e.preventDefault();

      removeEventListeners();
      resolveRef();
    }

    function cancelClickEventHandler() {
      removeEventListeners();
      resolveRef();
    }

    function removeEventListeners() {
      dialog.removeEventListener("cancel", cancelEventHandler);
      cancel.removeEventListener("click", cancelClickEventHandler);
      dialog.removeEventListener("keydown", keyConfirmEventHandler);
      confirm.removeEventListener("click", confirmEventHandler);
    }

    const dialog = this._maskImportListDialog;
    const confirm = dialog.getElementsByClassName(
      "mask-import-list-confirm"
    )[0];
    const cancel = dialog.getElementsByClassName("mask-import-list-cancel")[0];

    dialog.addEventListener("cancel", cancelEventHandler);
    cancel.addEventListener("click", cancelClickEventHandler);
    dialog.addEventListener("keydown", keyConfirmEventHandler);
    confirm.addEventListener("click", confirmEventHandler);

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
   * @returns {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData() {
    let hasData = false;
    if (brushModule.state.import && brushModule.state.import.label) {
      hasData = true;
    } else {
      const metadata =
        brushModule.state.segmentationMetadata[this._seriesInstanceUid];

      if (metadata) {
        hasData = metadata.some(data => data !== undefined);
      }
    }

    return hasData;
  }

  /** @private
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {Boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    const collectionType = item.data_fields.collectionType;

    if (!this._isValidCollectionType(collectionType)) {
      return false;
    }

    // Check the collection references this seriesInstanceUid.
    for (let i = 0; i < children.length; i++) {
      if (children[i].field === "references/seriesUID") {
        const referencedSeriesInstanceUidList = children[i].items;

        for (let j = 0; j < referencedSeriesInstanceUidList.length; j++) {
          const seriesInstanceUid =
            referencedSeriesInstanceUidList[j].data_fields.seriesUID;

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
   * @returns {null}
   */
  async _getAndImportFile(url, collectionInfo) {
    switch (collectionInfo.collectionType) {
      case "SEG":
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: collectionInfo.label,
          type: "SEG",
          name: collectionInfo.name,
          modified: false
        };

        const arrayBuffer = await this._getArraybuffer(url).catch(error =>
          console.log(error)
        );
        this._maskImporter.importDICOMSEG(
          arrayBuffer,
          collectionInfo.name,
          collectionInfo.label
        );
        break;

      case "NIFTI":
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: collectionInfo.label,
          type: "NIFTI",
          name: collectionInfo.name,
          modified: false
        };

        const niftiArrayBuffer = await this._getArraybuffer(url).catch(error =>
          console.log(error)
        );
        this._maskImporter.importNIFTI(
          niftiArrayBuffer,
          collectionInfo.name,
          collectionInfo.label
        );
        break;

      default:
        console.error(
          `asyncMaskFetcher._getAndImportFile not configured for filetype: ${fileType}.`
        );
    }

    this._incrementNumCollectionsParsed();
  }
}
