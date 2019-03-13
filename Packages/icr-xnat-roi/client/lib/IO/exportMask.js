import { OHIF } from "meteor/ohif:core";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { MaskExtractor } from "../classes/MaskExtractor.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { DICOMSEGWriter } from "../classes/DICOMSEGWriter.js";
import { DICOMSEGExporter } from "../classes/DICOMSEGExporter.js";
import { segBuilder } from "./segBuilder.js";
import getDateTimeAndLabel from "../util/getDateTimeAndLabel.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import messageDialog from "../util/messageDialog.js";
import awaitConfirmationDialog from "./awaitConfirmationDialog.js";
import awaitOverwriteConfirmationDialog from "./awaitOverwriteConfirmationDialog.js";
import {
  displayExportFailedDialog,
  displayInsufficientPermissionsDialog,
  displayMaskNotModifiedDialog,
  displayCantExportNIFTIDialog
} from "../util/displayExportDialogs.js";
import localBackup from "./localBackup.js";

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default async function() {
  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();

  // TEMP
  icrXnatRoiSession.set("writePermissions", true);
  // TEMP

  if (icrXnatRoiSession.get("writePermissions") === false) {
    // User does not have write access
    displayInsufficientPermissionsDialog();
    return;
  }

  let roiCollectionInfo;

  if (
    brushModule.state.import &&
    brushModule.state.import[seriesInfo.seriesInstanceUid]
  ) {
    roiCollectionInfo = brushModule.state.import[seriesInfo.seriesInstanceUid];

    if (!roiCollectionInfo.modified) {
      // Not modified! Display up dialog to say this.
      console.log("NOT MODIFIED");
      displayMaskNotModifiedDialog(roiCollectionInfo);
      return;
    }

    // TEMP -> Eventually we'll have NIFTI mask export.
    if (roiCollectionInfo.type === "NIFTI") {
      console.log("CAN't EXPORT NIFTI!");
      // Can't export this type yet! Display dialog to say this.
      //displayCantExportNIFTIDialog(roiCollectionInfo);
      //return;
    }
  }

  beginExport(seriesInfo, roiCollectionInfo);
}

async function beginExport(seriesInfo, roiCollectionInfo) {
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;
  const maskExtractor = new MaskExtractor(seriesInstanceUid);
  const { dateTime, label } = getDateTimeAndLabel("SEG");

  // Check if there are any Masks with metadata.
  if (maskExtractor.hasMasksToExtract() === false) {
    displayNoMasksToExportDialog();
    return;
  }

  let roiCollectionName = await segBuilder(label, roiCollectionInfo);

  if (!roiCollectionName) {
    console.log("cancelled.");
    return;
  }

  let overwrite = false;

  if (roiCollectionInfo) {
    // TODO -> Bring this code back to life once it is possible to do an overwrite.
    /*
    if (icrXnatRoiSession.get('editPermissions')) {
      // Ask if user wants to Overwrite.
      const content = {
        title: `Warning`,
        body: `You have edited ${roiCollectionInfo.name} (${roiCollectionInfo.label}).
          Would you like to overwrite this collection or save a new one?`
      };

      const confirmed = await awaitOverwriteConfirmationDialog(content);

      if (!confirmed) {
        // Cancelled
        return;
      }

      if (confirmed === 'OVERWRITE') {
        // TODO overwrite put!
        overwrite = true;
        label = roiCollectionInfo.label;
      }

    } else {

      // Confirm user wants to make a new ROI Collection.
      const content = {
        title: `Warning`,
        body: `You do not have permissions to edit ROI collections.
          Save the edited collection as a new collection?`
      };

      const confirmed = await awaitConfirmationDialog(content);

      if (!confirmed) {
        return;
      }
    }
    */

    // TEMP -> No overwrite functionality yet.
    // Confirm user wants to make a new ROI Collection.
    const content = {
      title: `Warning`,
      body: `Save the edited collection as a new collection? It is not yet possible to overwrite collections.`
    };

    const confirmed = await awaitConfirmationDialog(content);

    if (!confirmed) {
      return;
    }
  }

  const masks = maskExtractor.extractMasks();

  if (!masks) {
    console.log("no mask to extract!");
    return;
  }

  const exportInProgressDialog = document.getElementById("exportVolumes");
  exportInProgressDialog.showModal();

  console.log("test1");

  // TODO DICOM or NIFTI will have different export channels here!
  // In the future we will check the metadata to check if the image is either NIFTI or DICOM.

  // DICOM-SEG
  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);

  console.log("test2");

  const DICOMSegPromise = dicomSegWriter.write();

  console.log(DICOMSegPromise);

  DICOMSegPromise.then(segBlob => {
    console.log("test");
    console.log(segBlob);
    const dicomSegExporter = new DICOMSEGExporter(
      segBlob,
      seriesInstanceUid,
      label,
      roiCollectionName
    );

    console.log("seg exporter... ready!");

    dicomSegExporter
      .exportToXNAT(overwrite)
      .then(success => {
        console.log("PUT successful.");
        // Store that we've 'imported' a collection for this series.
        // (For all intents and purposes exporting it ends with an imported state,
        // i.e. not a fresh Mask collection.)
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[seriesInstanceUid] = {
          label: label,
          name: roiCollectionName,
          modified: false
        };

        // TODO -> Work on backup mechanism, disabled for now.
        //console.log('=====checking backup:=====');
        //localBackup.checkBackupOnExport();
        //console.log('=====checking backup DONE=====');
        exportInProgressDialog.close();
      })
      .catch(error => {
        console.log(error);
        exportInProgressDialog.close();
        // TODO -> Work on backup mechanism, disabled for now.
        //localBackup.saveBackUpForActiveSeries();
        displayExportFailedDialog();
      });
  });
}

/**
 * Opens dialog to notify the user there are no ROIs eligable for export.
 *
 * @author JamesAPetts
 */
function displayNoMasksToExportDialog() {
  const title = "Nothing to Export";
  const body =
    "There are no Masks to export. Please refer to the More/Help/Mask menu for more information.";

  messageDialog(title, body);
}
