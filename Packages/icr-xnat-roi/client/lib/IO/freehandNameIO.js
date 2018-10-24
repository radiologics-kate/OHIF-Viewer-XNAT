import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from '../classes/SeriesInfoProvider.js';

/**
 * Opens UI that allows user to chose a name for a new volume, and processes
 * the response.
 *
 * @author JamesAPetts
 */
export async function createNewVolume () {
  const oldName = 'Unnamed Lesion';
  const name = await imageAnnotationNameInput(oldName);

  if (name) {
    // Create and activate new volume
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    const newActiveIndex = cornerstoneTools.freehand.createNewVolumeAndGetIndex(seriesInstanceUid, name, true);

    console.log(`making new volume -- name: ${name}, seriesInstanceUid: ${seriesInstanceUid}`);
    console.log(`newActiveIndex: ${newActiveIndex}`);
  }
}

/**
 * Opens UI that allows user to change a volume's name,
 * and processes the response.
 *
 * @author JamesAPetts
 * @param {String} seriesInstanceUid  The UID of the series the volume is being
 *                                    drawn on.
 * @param {Number} volumeIndex        The index of the volume being drawn to the
 *                                    'default' ROI list.
 */
export async function setVolumeName (seriesInstanceUid, volumeIndex) {
  const volumeDataI = cornerstoneTools.freehand.getRoiCollectionData()[seriesInstanceUid].default[volumeIndex];

  // Current name:
  let oldName;
  if (volumeDataI.name) {
    oldName = volumeDataI.name;
  } else {
    oldName = 'Unnamed Lesion';
  }

  // Await new name input.
  const name = await imageAnnotationNameInput(oldName);

  if (name) {
    volumeDataI.name = name;
  }

  return name;
}

/**
 * Opens a dialog prompting for name input, and waits for a response before
 * resolving.
 *
 * @author JamesAPetts
 * @param  {String} defaultName The default name to show in the input field.
 * @param  {String} description The header of the input dialog.
 * @return {Promise}            A promise that resolves to return the name given
 *                              by the user.
 */
function imageAnnotationNameInput (defaultName) {
  return new Promise (resolve => {

    function confirmHandler () {
      dialog.get(0).close();
      const nameText = textInput.val();
      resolve(nameText);
    }

    function cancelHandler () {
      dialog.get(0).close();
      resolve(null);
    };

    const dialog = $('#ioSetName');
    const textInput = dialog.find('.ioTextInput');
    const confirm = dialog.find('.ioDialogConfirm');
    const cancel = dialog.find('.ioDialogCancel');

    textInput.val(defaultName);
    textInput.focus();

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
