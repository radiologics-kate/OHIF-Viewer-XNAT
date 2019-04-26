/**
 * Opens a simple alert-style dialog.
 *
 * @param {String} title The title/header of the dialog.
 * @param {String} body The text to be displayed in the body of the dialog.
 */
export default function(title, body) {
  // Find components
  const dialog = document.getElementById("ioMessage");
  const descriptionText = dialog.getElementsByClassName("io-description")[0];
  const bodyText = dialog.getElementsByClassName("io-body")[0];

  descriptionText.textContent = title;
  bodyText.textContent = body;

  dialog.showModal();
}
