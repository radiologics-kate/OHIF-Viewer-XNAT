import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import brushMetadataIO from '../../../lib/util/brushMetadataIO.js';

const brushModule = cornerstoneTools.store.modules.brush;

Template.segManagementDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#segManagementDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.segManagementDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.recalcSegmentations = new ReactiveVar('false');
});

Template.segManagementDialogs.helpers({
  segmentations: () => {
    console.log('segmentations helper');

    const instance = Template.instance();

    instance.data.recalcSegmentations.get();

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (!seriesInstanceUid) {
      return;
    }

    const segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];

    console.log(segMetadata);

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const enabledElementUID = activeEnabledElement.uuid;

    const visibleSegmentationsForElement = brushModule.getters.visibleSegmentationsForElement(enabledElementUID);

    console.log(enabledElementUID);

    if (!segMetadata) {
      return;
    }

    const segmentationData = [];

    for (let i = 0; i < segMetadata.length; i++) {
      if (segMetadata[i]) {
        console.log(i);


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
