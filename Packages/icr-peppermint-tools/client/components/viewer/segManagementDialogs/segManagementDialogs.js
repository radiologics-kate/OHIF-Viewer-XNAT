import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

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
    const instance = Template.instance();

    instance.data.recalcSegmentations.get();

    console.log('RECOMPUTE');

    // TODO -> Need some way of retriggering this call. Some session variable or something.
    //
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

Template.segManagementDialogs.events({
  'click .js-seg-management-cancel'(event) {

    closeDialog();
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
