import "./brushManagementDialogs.html";
import BrushManagementDialog from "./ReactComponents/BrushManagementDialog.js";

Template.brushManagementDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.brushManagementDialogId = new ReactiveVar(
    Math.random().toString()
  );
});

Template.brushManagementDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "brushManagementDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushManagementDialogs.helpers({
  BrushManagementDialog() {
    return BrushManagementDialog;
  },
  id() {
    const instance = Template.instance();

    return instance.data.brushManagementDialogId.get();
  }
});
