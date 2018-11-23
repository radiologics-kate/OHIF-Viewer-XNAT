import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * Opens the brushMetadata dialog.
 *
 * @author JamesAPetts
 */
export default async function () {
  function cancelEventHandler (e) {
    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();

    removeEventListeners();
  }

  function removeEventListeners () {
    dialog.removeEventListener('cancel', cancelEventHandler);
  }

  // Find components
  const dialog = document.getElementById('segManagementDialog');

  // Trigger recalc of segData.
  const dialogData = Blaze.getData(dialog);
  dialogData.recalcSegmentations.set(!dialogData.recalcSegmentations.get());

  dialog.addEventListener('cancel', cancelEventHandler);
  dialog.showModal();
}
