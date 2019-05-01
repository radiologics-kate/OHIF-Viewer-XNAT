import "./maskImportListDialogs.html";
import MaskImportListDialog from "./ReactComponents/MaskImportListDialog.js";

Template.maskImportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.maskImportListDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.maskImportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "maskImportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.maskImportListDialogs.helpers({
  MaskImportListDialog() {
    return MaskImportListDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING maskImportListDialogId`);
    console.log(instance.data.maskImportListDialogId.get());

    return instance.data.maskImportListDialogId.get();
  }
});
