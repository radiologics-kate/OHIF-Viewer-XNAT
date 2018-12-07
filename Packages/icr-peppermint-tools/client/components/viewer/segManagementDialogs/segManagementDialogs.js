import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import brushMetadataIO from '../../../lib/util/brushMetadataIO.js';

const brushModule = cornerstoneTools.store.modules.brush;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

Template.segManagementDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#segManagementDialog');
    const deleteDialog = instance.$('#segDeleteDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
    dialogPolyfill.registerDialog(deleteDialog.get(0));
});

Template.segManagementDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.recalcSegmentations = new ReactiveVar('false');
  instance.data.segToBeDeleted = new ReactiveVar();
});

Template.segManagementDialogs.helpers({
  segmentations: () => {
    const instance = Template.instance();

    instance.data.recalcSegmentations.get();

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (!seriesInstanceUid) {
      return;
    }

    const segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const enabledElementUID = activeEnabledElement.uuid;
    const visibleSegmentationsForElement = brushModule.getters.visibleSegmentationsForElement(enabledElementUID);

    if (!segMetadata) {
      return;
    }

    const segmentationData = [];

    for (let i = 0; i < segMetadata.length; i++) {
      if (segMetadata[i]) {
        segmentationData.push({
          index: i,
          metadata: segMetadata[i],
          visible: new ReactiveVar(
            visibleSegmentationsForElement[i]
          )
        });
      }
    }

    return segmentationData;
  },
  roiCollectionInfo: () => {
    const instance = Template.instance();

    instance.data.recalcSegmentations.get();

    const importInfo = brushModule.state.import;
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (importInfo && importInfo[seriesInstanceUid]) {
      const roiCollection =  importInfo[seriesInstanceUid];
      return {
        label: roiCollection.label,
        type: roiCollection.type,
        name: roiCollection.name,
        modified: roiCollection.modified ? 'true' : ' false'
      };
    };

    return {
      name: 'New SEG ROI Collection',
      label: ''
    };
  },
  segmentationToDelete: () => {
    const instance = Template.instance();
    const segIndex = instance.data.segToBeDeleted.get();

    if (segIndex === undefined) {
      return;
    }

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    const metadata = brushModule.getters.metadata(seriesInstanceUid, segIndex);

    console.log(metadata);

    return metadata.SegmentLabel;
  },
  segmentationToDeleteColor: () => {
    const instance = Template.instance();
    const segIndex = instance.data.segToBeDeleted.get();

    if (segIndex === undefined) {
      return;
    }

    const colormap = cornerstone.colors.getColormap(brushModule.state.colorMapId);

    if (!colormap) {
      return;
    }
    const colorArray = colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  }
});

Template.segManagementDialogs.events({
  'click .js-seg-management-cancel'(event) {

    closeDialog();
  },
  'click .js-seg-management-new'(event) {
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    closeDialog();

    let segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];

    if (!segMetadata) {
      brushModule.state.segmentationMetadata[seriesInstanceUid] = [];
      segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid]
    }

    const colormap = cornerstone.colors.getColormap(brushModule.state.colorMapId);
    const numberOfColors = colormap.getNumberOfColors();

    for (let i = 0; i < numberOfColors; i++) {
      if (!segMetadata[i]) {
        brushModule.state.drawColorId = i;
        brushMetadataIO(i);
        break;
      }
    }
  },
  'click .js-seg-delete-cancel'(event) {
    const dialog = $('#segDeleteDialog');
    dialog.get(0).close();
  },
  'click .js-seg-delete-confirm'(event) {
    const instance = Template.instance();
    const segIndex = instance.data.segToBeDeleted.get();
    const toolStateManager = globalToolStateManager.saveToolState();
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    // Delete metadata
    brushModule.setters.metadata(seriesInstanceUid, segIndex, undefined);

    // Delete pixeldata
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;
    const stackToolState = cornerstoneTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;

    for (let i = 0; i < imageIds.length; i++) {
      const imageToolState = toolStateManager[imageIds[i]];

      if (imageToolState &&
        imageToolState.brush &&
        imageToolState.brush.data[segIndex] &&
        imageToolState.brush.data[segIndex].pixelData
       ) {
        const brushData = imageToolState.brush.data[segIndex];

        const length = brushData.pixelData.length;
        brushData.pixelData = new Uint8ClampedArray(length);
        brushData.invalidated = true;
      }
    }

    instance.data.recalcSegmentations.set(!instance.data.recalcSegmentations.get());

    cornerstone.updateImage(activeEnabledElement.element);

    const dialog = $('#segDeleteDialog');
    dialog.get(0).close();
  }
});

function closeDialog () {
  const dialog = $('#segManagementDialog');
  dialog.get(0).close();

  // Reset the focus to the active viewport element
  // This makes the mobile Safari keyboard close
  const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
  element.focus();
}
