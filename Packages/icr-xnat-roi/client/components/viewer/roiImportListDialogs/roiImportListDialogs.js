import "./roiImportListDialogs.html";
import RoiImportListDialog from "./ReactComponents/RoiImportListDialog.js";

Template.roiImportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.roiImportListDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.roiImportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiImportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiImportListDialogs.helpers({
  RoiImportListDialog() {
    return RoiImportListDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING roiImportListDialogId`);
    console.log(instance.data.roiImportListDialogId.get());

    return instance.data.roiImportListDialogId.get();
  }
});
