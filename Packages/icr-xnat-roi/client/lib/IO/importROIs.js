import { AsyncRoiFetcher } from '../classes/AsyncRoiFetcher.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { displayInsufficientPermissionsDialog } from '../util/displayImportDialogs.js';

export default function () {
  if (icrXnatRoiSession.get('readPermissions') === false) {
    // User does not have read access
    displayInsufficientPermissionsDialog();
    return;
  }

  beginImport();
}

/**
 * Initiates the fetching of all ROIs in the XNAT Session that can map to the
 * active series.
 *
 * @author JamesAPetts
 */
function beginImport () {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  const asyncRoiFetcher = new AsyncRoiFetcher(seriesInstanceUid);
  asyncRoiFetcher.fetch();
}
