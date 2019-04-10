import messageDialog from "./messageDialog.js";
import { sessionMap } from "meteor/icr:series-info-provider";

/**
 * Opens dialog to notify the user that they do not have the
 * required permissions.
 *
 * @author JamesAPetts
 */
export function displayInsufficientPermissionsDialog(seriesInstanceUid) {
  const projectId = sessionMap.get(seriesInstanceUid, "projectId");
  const experimentLabel = sessionMap.get(seriesInstanceUid, "experimentLabel");

  const title = "Insufficient Permissions";
  const body =
    `You do not have the required permissions to read ROI Collections from ${projectId}/${experimentLabel}.` +
    " If you believe that you should, please contact the project owner.";

  messageDialog(title, body);
}
