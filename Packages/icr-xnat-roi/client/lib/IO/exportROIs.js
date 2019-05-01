import { cornerstoneTools } from "meteor/ohif:cornerstone";
import AIMWriter from "./classes/AIMWriter.js";
import RoiExtractor from "./classes/RoiExtractor.js";
import AIMExporter from "./classes/AIMExporter.js";
import displayROICollectionBuilderDialog from "../dialogUtils/displayROICollectionBuilderDialog.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { lockStructureSet } from "meteor/icr:peppermint-tools";
import {
  displayExportFailedDialog,
  displayNothingToExportDialog
} from "../dialogUtils/displayExportDialogs.js";
import displayInsufficientPermissionsDialog from "../dialogUtils/displayInsufficientPermissionsDialog.js";

const modules = cornerstoneTools.store.modules;

//import localBackup from "./localBackup.js";

/**
 * exportROIs - If the user has the correct permissions, begin export event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default async function exportROIs() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("writePermissions") === true) {
    // Check if there are any unlocked ROIs with > 0 contours.
    if (hasROIContoursToExtract(seriesInstanceUid)) {
      const roiCollectionBuilderDialog = document.getElementById(
        "roiCollectionBuilderDialog"
      );
      const dialogData = Blaze.getData(roiCollectionBuilderDialog);

      dialogData.roiCollectionBuilderDialogId.set(Math.random().toString());
      roiCollectionBuilderDialog.showModal();
    } else {
      displayNothingToExportDialog("ROI");
    }
  } else {
    // User does not have write access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "write");
  }
}

/**
 * hasROIContoursToExtract - checks if any contours exist on the series.
 *
 * @param  {type} seriesInstanceUid The series instance UID to check.
 * @returns {type}                   description
 */
function hasROIContoursToExtract(seriesInstanceUid) {
  const freehand3DModule = modules.freehand3D;

  const workingStructureSet = freehand3DModule.getters.structureSet(
    seriesInstanceUid
  );

  if (!workingStructureSet) {
    return false;
  }

  const ROIContourCollection = workingStructureSet.ROIContourCollection;

  let hasContours = false;

  for (let i = 0; i < ROIContourCollection.length; i++) {
    if (ROIContourCollection[i] && ROIContourCollection[i].polygonCount > 0) {
      hasContours = true;
      break;
    }
  }

  return hasContours;
}

/**
 * beginExport - Begin the export routine.
 *
 * @returns {null}
 */
/*
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
*/
