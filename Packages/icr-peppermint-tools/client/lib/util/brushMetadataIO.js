import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * Opens the brushMetadata dialog.
 *
 * @author JamesAPetts
 */
export default async function () {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  icrXnatRoiSession.set('EditBrushMetadataIndex', brushModule.state.drawColorId);

  // Find components
  const dialog = $('#brushMetadataDialog');

  // Reset the form.
  const brushMetadataTextInput = dialog.find('.brushMetadataTextInput');
  const brushMetadataSegmentationTypeInput = dialog.find('.brushMetadataSegmentationTypeInput');

  const dialogData = Blaze.getData(document.querySelector('#brushMetadataDialog'));

  dialogData.searchQuery.set('');
  dialogData.label.set('');

  brushMetadataTextInput[0].value = '';
  brushMetadataSegmentationTypeInput[0].value = '';

  function closeDialog () {
    dialog.get(0).close();

    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();
  }

  function closeDialogAndAccept() {
    closeDialog();
    // TODO -> key interface here. -> Refactor to do this in Blaze?
  }

  dialog.off('keydown');
  dialog.on('keydown', e => {
    if (e.which === 13) { // If Enter is pressed accept and close the dialog
      closeDialogAndAccept();
    } else if (e.which === 27) { // If Esc is pressed cancel and close the dialog
      closeDialog();
    }
  });

  dialog.get(0).showModal();

  const firstInputField = dialog.find('.brush-segmentation-label-js');
  firstInputField.focus();
}
