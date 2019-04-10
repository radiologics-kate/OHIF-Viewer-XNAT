import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { sessionMap } from "meteor/icr:series-info-provider";
import closeIODialog from "../../../lib/IO/closeIODialog.js";

Template.ioDialogs.onRendered(() => {
  const instance = Template.instance();
  const dialogIds = [
    "exportVolumes",
    "ioProgress",
    "ioMessage",
    "ioConfirmationDialog",
    "ioOverwriteConfirmationDialog"
  ];

  dialogIds.forEach(id => {
    const dialog = instance.$("#" + id);
    dialogPolyfill.registerDialog(dialog.get(0));
  });
});

Template.ioDialogs.helpers({
  exportROIsText: () => {
    const canWrite = icrXnatRoiSession.get("writePermissions");

    if (canWrite) {
      return "This command will export all new (unlocked) ROIs in this series as an ROI Collection. You will be prompted to give the ROI Collection a name before you may export";
    } else {
      return (
        `This command is disabled as you do not have the required permissions to write to ${sessionMap.get(
          "session",
          "projectId"
        )}/${sessionMap.get("session", "experimentLabel")}.` +
        " If you believe that you should, please contact the project owner."
      );
    }
  }
});

Template.ioDialogs.events({
  "click .io-dialog-cancel-js"(event) {
    const dialog = $("#ioMessage");

    closeIODialog(dialog);
  }
});
