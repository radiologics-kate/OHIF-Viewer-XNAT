/**
 * Opens a simple alert-style dialog.
 *
 * @author JamesAPetts
 * @param {String} title The title/header of the dialog.
 * @param {String} body The text to be displayed in the body of the dialog.
 */
export default function (title, body) {
  // Find components
  const dialog = $('#ioMessage');
  const descriptionText = dialog.find('.io-description');
  const bodyText = dialog.find('.io-body');

  descriptionText.text(title);
  bodyText.text(body);

  dialog.get(0).showModal();
}
