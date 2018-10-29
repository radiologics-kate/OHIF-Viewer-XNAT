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
export function roiCollectionBuilder (dialog) {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  icrXnatRoiSession.set('roiCollectionBuilderActiveSeries', '');
  icrXnatRoiSession.set('roiCollectionBuilderActiveSeries', seriesInstanceUid);

  return new Promise ((resolve, reject) => {
    const confirm = dialog.find('.roiCollectionBuilderExportButton');
    const cancel = dialog.find('.roiCollectionBuilderCancel');
    const textInput = dialog.find('.roiCollectionBuilderTextInput');

    function confirmHandler () {
      const dialogData = Blaze.getData(document.querySelector('#roiCollectionBuilderDialog'));
      const exportMask = dialogData.exportMask;
      const roiCollectionName = textInput.val();

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

      resolve({
        roiCollectionName,
        exportMask
      });
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
