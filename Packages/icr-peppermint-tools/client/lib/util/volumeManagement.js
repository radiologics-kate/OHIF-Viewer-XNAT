/**
 * Opens the volumeManagement dialog.
 *
 * @author JamesAPetts
 */
export default async function() {
  const roiManagementDialog = document.getElementById("roiManagementDialog");
  const dialogData = Blaze.getData(roiManagementDialog);

  dialogData.roiManagementDialogId.set(Math.random().toString());
  roiManagementDialog.showModal();
}
