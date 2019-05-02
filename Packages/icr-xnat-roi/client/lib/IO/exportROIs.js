import { cornerstoneTools } from "meteor/ohif:cornerstone";
import AIMWriter from "./classes/AIMWriter.js";
import RoiExtractor from "./classes/RoiExtractor.js";
import AIMExporter from "./classes/AIMExporter.js";
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
      const roiExportListDialog = document.getElementById(
        "roiExportListDialog"
      );
      const dialogData = Blaze.getData(roiExportListDialog);

      dialogData.roiExportListDialogId.set(Math.random().toString());
      roiExportListDialog.showModal();
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
