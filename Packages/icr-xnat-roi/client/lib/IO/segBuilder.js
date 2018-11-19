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
export function segBuilder (dialog, label) {

  return new Promise ((resolve, reject) => {
    const confirm = dialog.find('.seg-builder-export-button');
    const cancel = dialog.find('.seg-builder-cancel');
    const textInput = dialog.find('.seg-builder-text-input');

    textInput.val(label);

    const dialogData = Blaze.getData(document.querySelector('#segBuilderDialog'));

    // Trigger recalc of segData.
    dialogData.recalcSegmentations.set(!dialogData.recalcSegmentations.get());

    function confirmHandler () {
      const roiCollectionName = textInput.val();

      if (roiCollectionName) {
        resolve(roiCollectionName);
      }
    }

    function cancelHandler () {
      reject();
    };

    dialog.off('keydown');
    dialog.on('keydown', e => {
      if (e.which === 13) { // If Enter is pressed accept and close the dialog
        confirmHandler();
      } else if (e.which === 27) { // If Esc is pressed cancel and close the dialog
        cancelHandler();
      }
    });

    confirm.off('click');
    confirm.on('click', () => {
      confirmHandler();
    });


    cancel.off('click');
    cancel.on('click', () => {
      cancelHandler();
    });

    dialog.get(0).showModal();
  });
}
