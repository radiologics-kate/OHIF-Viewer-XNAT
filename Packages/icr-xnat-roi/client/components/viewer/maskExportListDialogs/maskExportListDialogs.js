import "./maskExportListDialogs.html";
import MaskExportListDialog from "./ReactComponents/MaskExportListDialog.js";

Template.maskExportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.maskExportListDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.maskExportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "maskExportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.maskExportListDialogs.helpers({
  MaskExportListDialog() {
    return MaskExportListDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING maskExportListDialogId`);
    console.log(instance.data.maskExportListDialogId.get());

    return instance.data.maskExportListDialogId.get();
  }
});
