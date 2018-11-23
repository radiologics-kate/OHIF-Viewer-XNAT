import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Opens the volumeManagement dialog.
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
  const dialog = document.getElementById('volumeManagementDialog');
  const cancel = dialog.getElementsByClassName('.volumeManagementCancel')[0];

  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  const dialogData = Blaze.getData(dialog);

  dialogData.activeSeries.set('');
  dialogData.activeSeries.set(seriesInstanceUid);

  dialog.addEventListener('cancel', cancelEventHandler);

  dialog.showModal();
}
