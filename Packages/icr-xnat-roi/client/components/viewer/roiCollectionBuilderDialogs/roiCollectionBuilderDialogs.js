import "./roiCollectionBuilderDialogs.html";
import RoiCollectionBuilderDialog from "./ReactComponents/RoiCollectionBuilderDialog.js";

Template.roiCollectionBuilderDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.roiCollectionBuilderDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.roiCollectionBuilderDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiCollectionBuilderDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiCollectionBuilderDialogs.helpers({
  RoiCollectionBuilderDialog() {
    return RoiCollectionBuilderDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING roiCollectionBuilderDialogId`);
    console.log(instance.data.roiCollectionBuilderDialogId.get());

    return instance.data.roiCollectionBuilderDialogId.get();
  }
});
