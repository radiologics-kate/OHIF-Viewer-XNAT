import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { createNewVolume } from 'meteor/icr:peppermint-tools';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Opens the volumeManagement dialog.
 *
 * @author JamesAPetts
 */
export default async function () {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  icrXnatRoiSession.set('volumeManagementActiveSeries', '');
  icrXnatRoiSession.set('volumeManagementActiveSeries', seriesInstanceUid);
  let showLocked = false;

  // Find components
  const dialog = $('#volumeManagementDialog');
  const cancel = dialog.find('.volumeManagementCancel');

  function closeDialog () {
    dialog.get(0).close();

    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();
  }

  function closeDialogAndCreateNewVolume() {
    closeDialog();
    createNewVolume();
  }

  dialog.off('keydown');
  dialog.on('keydown', e => {
    if (e.which === 13) { // If Enter is pressed accept and close the dialog
      closeDialogAndCreateNewVolume();
    } else if (e.which === 27) { // If Esc is pressed cancel and close the dialog
      closeDialog();
    }
  });

  dialog.get(0).showModal();
}
