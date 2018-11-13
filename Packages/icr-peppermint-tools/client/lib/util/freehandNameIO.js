import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

const modules = cornerstoneTools.store.modules;

/**
 * Opens UI that allows user to chose a name for a new volume, and processes
 * the response.
 *
 * @author JamesAPetts
 *
 */
export async function createNewVolume () {
  const oldName = 'Unnamed Lesion';
  const name = await imageAnnotationNameInput(oldName);

  if (name) {
    // Create and activate new ROIContour
    const activeSeriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    modules.freehand3D.setters.ROIContourAndSetIndexActive(activeSeriesInstanceUid, 'DEFAULT', name);

    console.log(`making new volume -- name: ${name}, seriesInstanceUid: ${activeSeriesInstanceUid}`);
  }
}

/**
 * Opens UI that allows user to change a volume's name,
 * and processes the response.
 *
 * @author JamesAPetts
 * @param {String} seriesInstanceUid  The UID of the series the ROIContour is associated with.
 * @param {String} structureSetUid    The UID of the structureSet the ROIContour belongs to.
 * @param {String} ROIContourUid      The UID of the ROIContourUid.
 *
 */
export async function setVolumeName (seriesInstanceUid, structureSetUid, ROIContourUid) {
  const ROIContour = modules.freehand3D.getters.ROIContour(seriesInstanceUid, structureSetUid, ROIContourUid);

  // Current name:
  let oldName;
  if (ROIContour.name) {
    oldName = ROIContour.name;
  } else {
    oldName = 'Unnamed Lesion';
  }

  // Await new name input.
  const name = await imageAnnotationNameInput(oldName);

  if (name) {
    ROIContour.name = name;
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

    const dialog = $('#freehandSetName');
    const textInput = dialog.find('.freehandTextInput');
    const confirm = dialog.find('.freehandDialogConfirm');
    const cancel = dialog.find('.freehandDialogCancel');

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
