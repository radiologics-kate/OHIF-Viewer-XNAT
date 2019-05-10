import "./roiManagementDialogs.html";
import RoiManagementDialog from "./ReactComponents/RoiManagementDialog.js";

Template.roiManagementDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.roiManagementDialogId = new ReactiveVar(
    Math.random().toString()
  );
});

Template.roiManagementDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiManagementDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiManagementDialogs.helpers({
  RoiManagementDialog() {
    return RoiManagementDialog;
  },
  id() {
    const instance = Template.instance();

    return instance.data.roiManagementDialogId.get();
  }
});
