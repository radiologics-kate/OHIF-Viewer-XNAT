import messageDialog from './messageDialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Opens dialog to notify the user when an export was unsuccessful.
 *
 * @author JamesAPetts
 */
export function displayExportFailedDialog () {
  const title = 'Export Failed';
  const body = `Export of ROIs to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}`
    + 'failed. This may be due a bad internet connection. The ROIs have not been locked, if you want'
    + 'to try again. If you have a good connection to XNAT and this problem persists, please contact'
    + 'your XNAT administrator.';
  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user that they do not have the
 * required permissions.
 *
 * @author JamesAPetts
 */
export function displayInsufficientPermissionsDialog () {
  const title = 'Insufficient Permissions';
  const body = `You do not have the required permissions to write to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}.`
  + ' If you believe that you should, please contact the project owner.'

  messageDialog(title, body);
}
