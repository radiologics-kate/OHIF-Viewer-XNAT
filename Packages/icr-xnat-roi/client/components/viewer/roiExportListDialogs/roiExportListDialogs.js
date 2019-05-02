import "./roiExportListDialogs.html";
import RoiExportListDialog from "./ReactComponents/RoiExportListDialog.js";

Template.roiExportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.roiExportListDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.roiExportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiExportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiExportListDialogs.helpers({
  RoiExportListDialog() {
    return RoiExportListDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING roiExportListDialogId`);
    console.log(instance.data.roiExportListDialogId.get());

    return instance.data.roiExportListDialogId.get();
  }
});
