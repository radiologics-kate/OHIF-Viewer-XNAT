import messageDialog from './messageDialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Opens dialog to notify the user that they do not have the
 * required permissions.
 *
 * @author JamesAPetts
 */
export function displayInsufficientPermissionsDialog () {
  const title = 'Insufficient Permissions';
  const body = `You do not have the required permissions to read ROI Collections from ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}.`
  + ' If you believe that you should, please contact the project owner.'

  messageDialog(title, body);
}
