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

  function cancelEventHandler () {
    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();

    removeEventListeners();

    if (dialogData.returnToSegManagement) {
      dialogData.returnToSegManagement = false;
      segManagement();
    }
  }

  function removeEventListeners () {
    dialog.removeEventListener('cancel', cancelEventHandler);
  }

  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  icrXnatRoiSession.set('EditBrushMetadataIndex', segIndex);

  const dialog = document.getElementById('brushMetadataDialog');

  const brushMetadataLabelInput = dialog.getElementsByClassName('brush-metadata-label-input')[0];
  const brushMetadataTypeInput = dialog.getElementsByClassName('brush-metadata-type-input')[0];

  brushMetadataLabelInput.value = label;
  brushMetadataTypeInput.value = type;

  const dialogData = Blaze.getData(dialog);

  dialogData.searchQuery.set(type);
  dialogData.label.set(label);

  // If editing an already existing segmentation, return to the segManagement
  // window after.
  if (label) {
    dialogData.returnToSegManagement = true;
  }

  setOptionIfModifier(modifier);

  dialog.addEventListener('cancel', cancelEventHandler);

  dialog.showModal();
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
