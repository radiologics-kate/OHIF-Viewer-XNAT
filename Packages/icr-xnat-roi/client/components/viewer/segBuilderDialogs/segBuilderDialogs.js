import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { createNewVolume } from 'meteor/icr:peppermint-tools';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { OHIF } from 'meteor/ohif:core';

const brushModule = cornerstoneTools.store.modules.brush;

Template.segBuilderDialogs.onRendered(() => {
    const instance = Template.instance();
    const id = 'segBuilderDialog';

    const dialog = instance.$('#' + id);
    instance.data.dialog = dialog;

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.segBuilderDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.recalcSegBuilderSegmentations = new ReactiveVar(false);
});

Template.segBuilderDialogs.helpers({
  segmentations: () => {
    console.log('segBuilderDialogs.helpers.segmentations');


    const instance = Template.instance();

    instance.data.recalcSegBuilderSegmentations.get();

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (!seriesInstanceUid) {
      return;
    }

    const segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];

    if (!segMetadata) {
      return;
    }

    const segmentationData = [];

    for (let i = 0; i < segMetadata.length; i++) {
      if (segMetadata[i]) {
        segmentationData.push({
          index: i,
          metadata: segMetadata[i]
        });
      }
    }

    return segmentationData;
  }
});


Template.segBuilderDialogs.events({
  'click .js-roi-collection-cancel'(event) {
    const dialog = $('#roiCollectionBuilderDialog');
    dialog.get(0).close();

    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();
  }
});
