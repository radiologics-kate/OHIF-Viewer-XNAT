import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import DICOMSEGWriter from "./classes/DICOMSEGWriter.js";
import DICOMSEGExporter from "./classes/DICOMSEGExporter.js";
import displayMaskCollectionBuilderDialog from "../dialogUtils/displayMaskCollectionBuilderDialog.js";
import getDateTimeAndLabel from "../util/getDateTimeAndLabel.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { displayNothingToExportDialog } from "../dialogUtils/displayExportDialogs.js";
import awaitConfirmationDialog from "../dialogUtils/awaitConfirmationDialog.js";
import {
  displayExportFailedDialog,
  displayMaskNotModifiedDialog
} from "../dialogUtils/displayExportDialogs.js";
import displayInsufficientPermissionsDialog from "../dialogUtils/displayInsufficientPermissionsDialog.js";
//import localBackup from "./localBackup.js";

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * exportMask - If the user has the correct permissions, begin export event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default async function exportMask() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("writePermissions") === true) {
    // Check if there are any Masks with metadata.
    if (hasMasksToExtract(seriesInstanceUid)) {
      const segExportListDialog = document.getElementById(
        "segExportListDialog"
      );

      const dialogData = Blaze.getData(segExportListDialog);

      dialogData.segExportListDialogId.set(Math.random().toString());
      segExportListDialog.showModal();
    } else {
      displayNothingToExportDialog("Mask");
      return;
    }
  } else {
    // User does not have write access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "write");
  }

  /*

  if (icrXnatRoiSession.get("writePermissions") === false) {
    displayInsufficientPermissionsDialog(seriesInfo.seriesInstanceUid, "write");
    return;
  }


  let roiCollectionInfo;

  if (
    brushModule.state.import &&
    brushModule.state.import[seriesInfo.seriesInstanceUid]
  ) {
    roiCollectionInfo = brushModule.state.import[seriesInfo.seriesInstanceUid];

    if (!roiCollectionInfo.modified) {
      displayMaskNotModifiedDialog(roiCollectionInfo.name);
      return;
    }
  }

  beginExport(seriesInfo, roiCollectionInfo);
  */
}

/**
 * hasMasksToExtract - Checks whether any mask metadata exists on a series.
 *
 * @param  {type} seriesInstanceUid The series instance UID of the series to check.
 * @returns {boolean} true if the series has at least one mask.
 */
function hasMasksToExtract(seriesInstanceUid) {
  const metadata = brushModule.state.segmentationMetadata[seriesInstanceUid];
  let hasMasks = false;

  if (metadata) {
    hasMasks = metadata.some(data => data !== undefined);
  }

  return hasMasks;
}

/**
 * beginExport - Begin the export routine.
 *
 * @param  {object} seriesInfo      An object containing metadata about the
 *                                  series the annotations are drawn onto.
 * @param  {object} roiCollectionInfo Metadata about the ROICollection.
 * @returns {null}
 */
async function beginExport(seriesInfo, roiCollectionInfo) {
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;
  const { dateTime, label } = getDateTimeAndLabel("SEG");

  // Check if there are any Masks with metadata.
  if (hasMasksToExtract(seriesInstanceUid) === false) {
    displayNothingToExportDialog("Mask");
    return;
  }

  // Let the user input a name for the ROICollection.
  let roiCollectionName = await displayMaskCollectionBuilderDialog(
    label,
    roiCollectionInfo
  );

  if (!roiCollectionName) {
    // Cancelled.
    return;
  }

  if (roiCollectionInfo) {
    // roiCollectionInfo exists, therefore this is an edit.
    // Confirm user wants to make a new ROI Collection.
    const content = {
      title: `Warning`,
      body: `The edited ROI Collection will be saved as a new ROI Collection. Continue?`
    };

    const confirmed = await awaitConfirmationDialog(content);

    if (!confirmed) {
      return;
    }
  }

  const exportInProgressDialog = document.getElementById("exportVolumes");
  exportInProgressDialog.showModal();

  // TODO DICOM or NIFTI will have different export channels here!
  // In the future we will check the metadata to check if the image is either NIFTI or DICOM.

  // DICOM-SEG
  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  const DICOMSegPromise = dicomSegWriter.write(roiCollectionName);

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
      .exportToXNAT(false)
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
        displayExportFailedDialog(seriesInstanceUid);
      });
  });
}
