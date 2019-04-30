import "./roiImportListDialogs.html";
import RoiImportListDialog from "./ReactComponents/RoiImportListDialog.js";

Template.roiImportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.key = new ReactiveVar(Math.Random().toString());
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
  key() {
    const instance = Template.instance();

    return instance.data.key.get();
  }
});
