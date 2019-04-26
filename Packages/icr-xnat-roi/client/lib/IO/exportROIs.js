import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { AIMWriter } from "../classes/AIMWriter.js";
import { RoiExtractor } from "../classes/RoiExtractor.js";
import { AIMExporter } from "../classes/AIMExporter.js";
import displayROICollectionBuilderDialog from "../util/displayROICollectionBuilderDialog.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { lockStructureSet } from "meteor/icr:peppermint-tools";
import {
  displayExportFailedDialog,
  displayNothingToExportDialog
} from "../util/displayExportDialogs.js";
import { displayInsufficientPermissionsDialog } from "../util/displayInsufficientPermissionsDialog.js";

//import localBackup from "./localBackup.js";

/**
 * exportROIs - If the user has the correct permissions, begin export event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default async function exportROIs() {
  if (icrXnatRoiSession.get("writePermissions") === true) {
    beginExport();
    return;
  }

  // User does not have write access
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  displayInsufficientPermissionsDialog(seriesInstanceUid, "write");
}

/**
 * beginExport - Begin the export routine.
 *
 * @returns {null}
 */
async function beginExport() {
  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const roiExtractor = new RoiExtractor(seriesInfo.seriesInstanceUid);
  const dateTime = AIMWriter.generateDateTime();
  const label = AIMWriter.generateLabel(dateTime);

  // Check if there are any unlocked ROIs with > 0 contours.
  if (roiExtractor.hasROIContoursToExtract() === false) {
    displayNothingToExportDialog("ROI");
    return;
  }

  // Allow the user to choose which ROIs to export.
  const result = await displayROICollectionBuilderDialog(label);

  if (!result) {
    // Cancelled
    return;
  }

  const { roiCollectionName, exportMask } = result;

  // Generate AIM file from the selected ROIs.
  const exportInProgressDialog = document.getElementById("exportVolumes");
  exportInProgressDialog.showModal();

  const volumes = roiExtractor.extractROIContours(exportMask);

  const aw = new AIMWriter(roiCollectionName, label, dateTime);
  aw.writeImageAnnotationCollection(volumes, seriesInfo);

  // Attempt export to XNAT. Lock ROIs for editing if the export is successful.
  const aimExporter = new AIMExporter(aw);
  await aimExporter
    .exportToXNAT()
    .then(success => {
      console.log("PUT successful.");
      console.log(roiCollectionName);
      console.log(lockStructureSet);

      //lockExportedROIs(
      lockStructureSet(
        exportMask,
        seriesInfo.seriesInstanceUid,
        roiCollectionName,
        label
      );
      //console.log('=====checking backup:=====');
      //localBackup.checkBackupOnExport();
      //console.log('=====checking backup DONE=====');
      exportInProgressDialog.close();
    })
    .catch(error => {
      console.log(error);
      // TODO -> Work on backup mechanism, disabled for now.
      //localBackup.saveBackUpForActiveSeries();
      exportInProgressDialog.close();
      displayExportFailedDialog(seriesInfo.seriesInstanceUid);
    });
}
