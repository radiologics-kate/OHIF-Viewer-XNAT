import messageDialog from "./messageDialog.js";
import { sessionMap } from "meteor/icr:series-info-provider";

/**
 * displayInsufficientPermissionsDialog - Opens dialog to notify the user that
 * they do not have the required permissions.
 *
 * @param  {string} seriesInstanceUid   The series instance UID of the image
 *                                      referenced by the annotations.
 * @param  {string} readOrWrite = "read"  The opperation the user is trying to
 *                                        perform.
 * @returns {null}
 */
export default function displayInsufficientPermissionsDialog(
  seriesInstanceUid,
  readOrWrite = "read"
) {
  const { experimentLabel, projectId } = sessionMap.getScan(seriesInstanceUid);

  const title = "Insufficient Permissions";
  const body =
    `You do not have the required permissions to ${readOrWrite} ROI Collections to ${projectId}/${experimentLabel}.` +
    " If you believe that you should, please contact the project owner.";

  messageDialog(title, body);
}
