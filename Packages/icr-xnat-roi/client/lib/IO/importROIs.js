import { AsyncRoiFetcher } from "../classes/AsyncRoiFetcher.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { displayInsufficientPermissionsDialog } from "../util/displayInsufficientPermissionsDialog.js";

/**
 * importROIs - If the user has the correct permissions, begin import event.
 * Otherwise notify the user that they have insufficient permissions.
 *
 * @returns {null}
 */
export default function() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  if (icrXnatRoiSession.get("readPermissions") === false) {
    // User does not have read access
    displayInsufficientPermissionsDialog(seriesInstanceUid, "read");
    return;
  }

  const asyncRoiFetcher = new AsyncRoiFetcher(seriesInstanceUid);
  asyncRoiFetcher.fetch();
}
