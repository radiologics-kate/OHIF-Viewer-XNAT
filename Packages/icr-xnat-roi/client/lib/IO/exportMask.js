import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { displayNothingToExportDialog } from "../dialogUtils/displayExportDialogs.js";
import { displayMaskNotModifiedDialog } from "../dialogUtils/displayExportDialogs.js";
import displayInsufficientPermissionsDialog from "../dialogUtils/displayInsufficientPermissionsDialog.js";
//import localBackup from "./localBackup.js";

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * exportMask - If the user has the correct permissions, begin export event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default async function() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("writePermissions") === true) {
    // Check if there are any Masks with metadata.
    if (hasMasksToExtract(seriesInstanceUid)) {
      beginExportIfNewOrModifiedMask(seriesInstanceUid);
    } else {
      displayNothingToExportDialog("Mask");
    }
  } else {
    // User does not have write access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "write");
  }
}

function beginExportIfNewOrModifiedMask(seriesInstanceUid) {
  let roiCollectionInfo;

  // If imported mask, check its been modified.
  if (
    brushModule.state.import &&
    brushModule.state.import[seriesInstanceUid] &&
    !brushModule.state.import[seriesInstanceUid].modified
  ) {
    displayMaskNotModifiedDialog(
      brushModule.state.import[seriesInstanceUid].name
    );
  } else {
    const maskExportListDialog = document.getElementById(
      "maskExportListDialog"
    );
    const dialogData = Blaze.getData(maskExportListDialog);

    dialogData.maskExportListDialogId.set(Math.random().toString());
    maskExportListDialog.showModal();
  }
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
