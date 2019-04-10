import { RoiImporter } from "./RoiImporter.js";
import closeIODialog from "../IO/closeIODialog.js";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { AsyncFetcher } from "./AsyncFetcher.js";

const modules = cornerstoneTools.store.modules;

/**
 * @class AsyncRoiFetcher
 * @author JamesAPetts
 *
 * Asynchronusly fetches roiCollections that contain contours, allows the user to select which to
 * import, and parses them using an instance of RoiImporter.
 *
 */
export class AsyncRoiFetcher extends AsyncFetcher {
  constructor(seriesInstanceUid) {
    super(seriesInstanceUid, (validTypes = ["AIM", "RTSTRUCT"]));

    this._roiImporter = new RoiImporter(seriesInstanceUid);
    this._volumeManagementLabels = this._getVolumeManagementLabels();
  }

  /** @private
   * _getVolumeManagementLabels - Construct a list of roiCollections
   *                               already imported.
   *
   * @return {string[]} An array of the labels of roiCollections already imported.
   */
  _getVolumeManagementLabels() {
    const freehand3DStore = modules.freehand3D;
    const structureSetUids = [];

    const series = freehand3DStore.getters.series(this._seriesInstanceUid);

    if (!series) {
      return structureSetUids;
    }

    const structureSetCollection = series.structureSetCollection;

    for (let i = 0; i < structureSetCollection.length; i++) {
      const label = structureSetCollection[i].uid;

      if (label !== "DEFAULT") {
        structureSetUids.push(label);
      }
    }

    return structureSetUids;
  }

  _openImportListDialog() {
    // Open the dialog and display a loading icon whilst data is fetched.
    this._roiImportListDialog = document.getElementById("roiImportListDialog");

    const dialogData = Blaze.getData(this._roiImportListDialog);

    dialogData.importListReady.set(false);
    this._roiImportListDialog.showModal();
  }

  /** @private @async
   * _selectAndImportRois - Display list of roiCollections eligible for import,
   * await user input, and download the selected roiCollections.
   */
  async _selectAndImportRois() {
    // Await user input
    const importMask = await this._awaitInputFromListUI(
      this._collectionInfoArray
    );

    if (!importMask) {
      console.log("cancelled");
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
      console.log("numCollectionToParse = 0");
      return;
    }

    this._openProgressDialog();

    for (let i = 0; i < this._collectionInfoArray.length; i++) {
      if (importMask[i]) {
        this._getFilesFromList(this._collectionInfoArray[i]);
      }
    }
  }

  /** @private @async
   * _awaitInputFromListUI - Awaits user input from the roiImportList UI.
   *
   * @param  {Array} importList The list of roiCollections eligible for import.
   * @return {Promise}          A promise that resolves to give a true/false
   *                            array describing which roiCollections to import.
   */
  async _awaitInputFromListUI(importList) {
    function keyConfirmEventHandler(e) {
      console.log("keyConfirmEventHandler");

      if (e.which === 13) {
        // If Enter is pressed accept and close the dialog
        confirmEventHandler();
      }
    }

    function confirmEventHandler() {
      const dialogData = Blaze.getData(
        document.querySelector("#roiImportListDialog")
      );

      dialog.close();

      removeEventListeners();
      resolveRef(dialogData.importMask);
    }

    function cancelEventHandler() {
      removeEventListeners();
      resolveRef(null);
    }

    function cancelClickEventHandler() {
      dialog.close();

      removeEventListeners();
      resolveRef(null);
    }

    function removeEventListeners() {
      dialog.removeEventListener("cancel", cancelEventHandler);
      cancel.removeEventListener("click", cancelClickEventHandler);
      dialog.removeEventListener("keydown", keyConfirmEventHandler);
      confirm.removeEventListener("click", confirmEventHandler);
    }

    const dialog = this._roiImportListDialog;
    const confirm = dialog.getElementsByClassName("roi-import-list-confirm")[0];
    const cancel = dialog.getElementsByClassName("roi-import-list-cancel")[0];
    const dialogData = Blaze.getData(dialog);

    // Add event listeners.
    dialog.addEventListener("cancel", cancelEventHandler);
    cancel.addEventListener("click", cancelClickEventHandler);
    dialog.addEventListener("keydown", keyConfirmEventHandler);
    confirm.addEventListener("click", confirmEventHandler);

    dialogData.importListReady.set(true);
    dialogData.importList.set(importList);

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
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    const collectionType = item.data_fields.collectionType;

    if (!this._isValidCollectionType(collectionType)) {
      return false;
    }

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
   */
  async _getAndImportFile(url, collectionInfo) {
    switch (collectionInfo.collectionType) {
      case "AIM":
        this._roiCollectionLabel = collectionInfo.label;
        this._updateProgressDialog();
        const aimFile = await this._getXml(url).catch(error =>
          console.log(error)
        );
        this._roiImporter.importAIMfile(
          aimFile,
          collectionInfo.name,
          collectionInfo.label
        );
        break;
      case "RTSTRUCT":
        const rtStructFile = await this._getArraybuffer(url).catch(error =>
          console.log(error)
        );
        this._roiImporter.importRTStruct(
          rtStructFile,
          collectionInfo.name,
          collectionInfo.label
        );
        break;
      default:
        console.error(
          `asyncRoiFetcher._getAndImportFile not configured for filetype: ${fileType}.`
        );
    }

    this._incrementNumCollectionsParsed();
  }
}
