import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

/**
 * Opens a dialog which lets the user to input a label for the segmentations to
 * be exported to XNAT.
 *
 * @author JamesAPetts
 * @param  {HTMLElement} dialog The dialog object to be opened.
 * @return {Promise}            A promise which resolves to give the input
 *                              roiCollection name and a list of ROIs to export.
 */
export function segBuilder (label) {

  function keyConfirmEventHandler (e) {
    if (e.which === 13) { // If Enter is pressed accept and close the dialog
      confirmEventHandler();
    }
  }

  function confirmEventHandler () {
    const roiCollectionName = textInput.value;

    if (roiCollectionName) {
      dialog.close();
      removeEventListners();
      resolveRef(roiCollectionName);
    }
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

  const dialog = document.getElementById('segBuilderDialog');
  const confirm = dialog.getElementsByClassName('seg-builder-export-button')[0];
  const cancel = dialog.getElementsByClassName('seg-builder-cancel')[0];
  const textInput = dialog.getElementsByClassName('seg-builder-text-input')[0];

  dialog.addEventListener('cancel', cancelEventHandler);
  cancel.addEventListener('click', cancelClickEventHandler);
  dialog.addEventListener('keydown', keyConfirmEventHandler);
  confirm.addEventListener('click', confirmEventHandler);

  textInput.value = label;

  const dialogData = Blaze.getData(dialog);

  // Trigger recalc of segData.
  dialogData.recalcSegBuilderSegmentations.set(!dialogData.recalcSegBuilderSegmentations.get());

  dialog.showModal();

  // Reference to promise.resolve, so that I can use external handlers.
  let resolveRef;

  return new Promise (resolve => {
    resolveRef = resolve;
  });
}
