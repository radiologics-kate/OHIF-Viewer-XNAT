import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import displayInsufficientPermissionsDialog from "../dialogUtils/displayInsufficientPermissionsDialog.js";

/**
 * importROIs - If the user has the correct permissions, begin import event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default function importROIs() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("readPermissions") === false) {
    // User does not have read access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "read");
    return;
  }

  const roiImportListDialog = document.getElementById("roiImportListDialog");

  console.log(roiImportListDialog);

  const dialogData = Blaze.getData(roiImportListDialog);

  console.log(dialogData);

  dialogData.roiImportListDialogId.set(Math.random().toString());
  roiImportListDialog.showModal();
}
