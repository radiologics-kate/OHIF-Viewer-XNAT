/**
 * Opens a simple alert-style dialog.
 *
 * @param {String} title The title/header of the dialog.
 * @param {String} body The text to be displayed in the body of the dialog.
 */
export default function(title, body) {
  // Find components
  const ioMessageDialog = document.getElementById("ioMessage");

  const dialogData = Blaze.getData(ioMessageDialog);

  dialogData.messageDialogTitle.set(title);
  dialogData.messageDialogBody.set(body);

  ioMessageDialog.showModal();
}
