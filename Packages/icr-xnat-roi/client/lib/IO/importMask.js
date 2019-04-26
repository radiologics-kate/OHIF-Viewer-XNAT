import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { AsyncMaskFetcher } from "../classes/AsyncMaskFetcher.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { displayInsufficientPermissionsDialog } from "../util/displayInsufficientPermissionsDialog.js";

/**
 * importMask - If the user has the correct permissions, begin import event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default function importMask() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("readPermissions") === false) {
    // User does not have read access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "read");
    return;
  }

  const asyncMaskFetcher = new AsyncMaskFetcher(seriesInstanceUid);
  asyncMaskFetcher.fetch();
}
