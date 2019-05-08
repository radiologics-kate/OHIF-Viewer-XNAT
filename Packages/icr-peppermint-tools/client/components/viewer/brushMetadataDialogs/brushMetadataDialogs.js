import "./brushMetadataDialogs.html";
import BrushMetadataDialog from "./ReactComponents/BrushMetadataDialog.js";

Template.brushMetadataDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.brushMetadataDialogDefaultName = new ReactiveVar("");
  instance.data.brushMetadataDialogCallback = new ReactiveVar(() => {
    return;
  });
});

Template.brushMetadataDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "brushMetadataDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushMetadataDialogs.helpers({
  BrushMetadataDialog() {
    return BrushMetadataDialog;
  },
  defaultName() {
    const instance = Template.instance();

    return instance.data.brushMetadataDialogDefaultName.get();
  },
  callback() {
    const instance = Template.instance();

    console.log(instance.data.brushMetadataDialogCallback.get());

    return instance.data.brushMetadataDialogCallback.get();
  }
});
