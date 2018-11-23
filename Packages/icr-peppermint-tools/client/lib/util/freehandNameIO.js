import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const modules = cornerstoneTools.store.modules;

/**
 * Opens UI that allows user to chose a name for a new volume, and processes
 * the response.
 *
 * @author JamesAPetts
 *
 */
export async function createNewVolume () {
  const name = await imageAnnotationNameInput('Unnamed Lesion');

  if (name) {
    // Create and activate new ROIContour
    const activeSeriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    //Check if default structureSet exists for this series.
    if (!modules.freehand3D.getters.series(activeSeriesInstanceUid)) {
      modules.freehand3D.setters.series(activeSeriesInstanceUid, )
    }



    modules.freehand3D.setters.ROIContourAndSetIndexActive(activeSeriesInstanceUid, 'DEFAULT', name);
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

  function keyConfirmEventHandler () {
    if (e.which === 13) { // If Enter is pressed accept and close the dialog
      confirmEventHandler();
    }
  }

  function confirmEventHandler () {
    const dialog = document.getElementById('freehandSetName');
    const textInput = dialog.getElementsByClassName('freehand-set-name-input')[0];
    const nameText = textInput.value;

    dialog.close();

    removeEventListners();
    resolveRef(nameText);
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

  const dialog = document.getElementById('freehandSetName');
  const textInput = dialog.getElementsByClassName('freehand-set-name-input')[0];
  const confirm = dialog.getElementsByClassName('freehand-set-name-confirm')[0];
  const cancel = dialog.getElementsByClassName('freehand-set-name-cancel')[0];

  // Add event listeners.
  dialog.addEventListener('cancel', cancelEventHandler);
  cancel.addEventListener('click', cancelClickEventHandler);
  dialog.addEventListener('keydown', keyConfirmEventHandler);
  confirm.addEventListener('click', confirmEventHandler);

  textInput.value = defaultName;

  dialog.showModal();

  // Reference to promise.resolve, so that I can use external handlers.
  let resolveRef;

  return new Promise (resolve => {
    resolveRef = resolve;
  });
}
