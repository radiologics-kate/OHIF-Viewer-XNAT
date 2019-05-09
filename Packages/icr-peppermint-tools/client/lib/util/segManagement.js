/**
 * Opens the brushMetadata dialog.
 */
export default function() {
  const brushManagementDialog = document.getElementById(
    "brushManagementDialog"
  );
  const dialogData = Blaze.getData(brushManagementDialog);

  dialogData.brushManagementDialogId.set(Math.random().toString());
  brushManagementDialog.showModal();
}
