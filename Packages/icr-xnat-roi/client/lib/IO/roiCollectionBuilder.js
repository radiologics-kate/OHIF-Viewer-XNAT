import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

/**
 * Opens a dialog which lets the user select a set of one or more ROIs to
 * export to XNAT as an roiCollection.
 *
 * @author JamesAPetts
 * @param  {HTMLElement} dialog The dialog object to be opened.
 * @return {Promise}            A promise which resolves to give the input
 *                              roiCollection name and a list of ROIs to export.
 */
export function roiCollectionBuilder (label) {

  function keyConfirmEventHandler (e) {
    if (e.which === 13) { // If Enter is pressed accept and close the dialog
      confirmEventHandler();
    }
  }

  function confirmEventHandler () {
    const dialogData = Blaze.getData(dialog);
    const exportMask = dialogData.exportMask;
    const roiCollectionName = textInput.value;

    if (!roiCollectionName) {
      console.log('no roiCollectionName');
      return;
    }

    const atLeastOneRoi = exportMask.some(value => {
      if (value) {
        return true;
      }
    });

    if (!atLeastOneRoi) {
      console.log('no ROIs to export');
      return;
    }

    dialog.close();
    removeEventListners();
    resolveRef({
      roiCollectionName,
      exportMask
    });
  }

  function cancelEventHandler () {
    removeEventListners();
    resolveRef(null);
  };

  function cancelClickEventHandler () {
    dialog.close();

    removeEventListners();
    resolveRef(null);
  }

  function removeEventListners() {
    dialog.removeEventListener('cancel', cancelEventHandler);
    cancel.removeEventListener('click', cancelClickEventHandler);
    dialog.removeEventListener('keydown', keyConfirmEventHandler);
    confirm.removeEventListener('click', confirmEventHandler);
  }

  const dialog = document.getElementById('roiCollectionBuilderDialog');
  const confirm = dialog.getElementsByClassName('roi-collection-builder-export-button')[0];
  const cancel = dialog.getElementsByClassName('roi-collection-builder-cancel')[0];
  const textInput = dialog.getElementsByClassName('roi-collection-builder-text-input')[0];

  textInput.value = label;

  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  const dialogData = Blaze.getData(dialog);

  dialogData.roiCollectionBuilderActiveSeries.set('');
  dialogData.roiCollectionBuilderActiveSeries.set(seriesInstanceUid);

  // Add event listeners.
  dialog.addEventListener('cancel', cancelEventHandler);
  cancel.addEventListener('click', cancelClickEventHandler);
  dialog.addEventListener('keydown', keyConfirmEventHandler);
  confirm.addEventListener('click', confirmEventHandler);

  dialog.showModal();

  // Reference to promise.resolve, so that I can use external handlers.
  let resolveRef;

  return new Promise (resolve => {
    resolveRef = resolve;
  });
}
