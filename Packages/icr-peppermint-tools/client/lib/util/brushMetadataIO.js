import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import segManagement from './segManagement.js';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * Opens the brushMetadata dialog.
 *
 * @author JamesAPetts
 */
export default async function (segIndex, label = '', type = '', modifier) {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  icrXnatRoiSession.set('EditBrushMetadataIndex', segIndex);

  // Find components
  const dialog = $('#brushMetadataDialog');

  // Reset the form.
  const brushMetadataTextInput = dialog.find('.brushMetadataTextInput');
  const brushMetadataSegmentationTypeInput = dialog.find('.brushMetadataSegmentationTypeInput');

  const dialogData = Blaze.getData(document.querySelector('#brushMetadataDialog'));

  dialogData.searchQuery.set(type);
  dialogData.label.set(label);

  // If editing an already existing segmentation, return to the segManagement
  // window after.
  if (label) {
    dialogData.returnToSegManagement = true;
  }

  brushMetadataTextInput[0].value = label;
  brushMetadataSegmentationTypeInput[0].value = type;

  setOptionIfModifier(modifier);

  function closeDialog () {
    dialog.get(0).close();

    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();
  }

  dialog.off('keydown');
  dialog.on('keydown', e => {
    if (e.which === 27) { // If Esc is pressed cancel and close the dialog
      closeDialog();
      if (dialogData.returnToSegManagement) {
        dialogData.returnToSegManagement = false;
        segManagement();
      }
    }
  });

  dialog.get(0).showModal();

  const firstInputField = dialog.find('.brush-segmentation-label-js');
  firstInputField.focus();
}

function setOptionIfModifier (modifier) {
  if (modifier) {
    const select = document.getElementById('brush-metadata-modifier-select');
    const options = select.options;

    for (let i = 0; i < options.length; i++) {
      if (options[i].value === modifier) {
        options[i].selected = true;
      } else {
        options[i].selected = false;
      }
    }
  }
}
