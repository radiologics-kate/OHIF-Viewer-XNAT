import "./segExportListDialogs.html";
import SegExportListDialog from "./ReactComponents/SegExportListDialog.js";

Template.segExportListDialogs.onCreated(() => {
  const instance = Template.instance();

  // Used to remount component.
  instance.data.segExportListDialogId = new ReactiveVar("NOT_ACTIVE");
});

Template.segExportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "segExportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.segExportListDialogs.helpers({
  SegExportListDialog() {
    return SegExportListDialog;
  },
  id() {
    const instance = Template.instance();

    console.log(`RECALCULATING segExportListDialogId`);
    console.log(instance.data.segExportListDialogId.get());

    return instance.data.segExportListDialogId.get();
  }
});
