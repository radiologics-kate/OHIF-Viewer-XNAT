/**
 * Closes a dialog and refocus on the image canvas.
 *
 * @author JamesAPetts
 * @param {HTMLElement} dialog The dialog to close.
 */
export default function (dialog) {
  dialog.get(0).close();

  // Reset the focus to the active viewport element
  // This makes the mobile Safari keyboard close
  const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
  element.focus();
}
