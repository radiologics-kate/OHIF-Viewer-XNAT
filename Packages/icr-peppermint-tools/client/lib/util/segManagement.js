/**
 * Opens the brushMetadata dialog.
 */
export default function() {
  function cancelEventHandler(e) {
    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();

    removeEventListeners();
  }

  function removeEventListeners() {
    dialog.removeEventListener("cancel", cancelEventHandler);
  }

  // Find components
  const dialog = document.getElementById("segManagementDialog");

  console.log(dialog);

  // Trigger recalc of segData.
  const dialogData = Blaze.getData(dialog);
  dialogData.recalcSegmentations.set(!dialogData.recalcSegmentations.get());

  dialog.addEventListener("cancel", cancelEventHandler);
  dialog.showModal();
}
