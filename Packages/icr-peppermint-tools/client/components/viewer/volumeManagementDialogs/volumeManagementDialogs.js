import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { createNewVolume } from 'meteor/icr:peppermint-tools';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const modules = cornerstoneTools.store.modules;

Template.volumeManagementDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#volumeManagementDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.volumeManagementDialogs.onCreated(() => {
    const instance = Template.instance();

    instance.data.showLocked = new ReactiveVar(false);
});

Template.volumeManagementDialogs.helpers({
  showHideLabel: () => {
    const instance = Template.instance();
    const showLocked = instance.data.showLocked.get();

    if (showLocked) {
      return 'hide';
    }

    return 'show';
  },
  roiCollections: () => {
    const instance = Template.instance();
    const seriesInstanceUid = icrXnatRoiSession.get('volumeManagementActiveSeries');
    const structureSetCollectionData = getOrCreateStructureSetCollectionData(seriesInstanceUid);

    return structureSetCollectionData;
  }
});


Template.volumeManagementDialogs.events({
    'click .js-volume-management-cancel'(event) {
      console.log('.js-volume-management-cancel');

      closeDialog();
    },
    'click .js-volume-management-new'(event) {
      closeDialog();
      createNewVolume();
    }
});


function closeDialog () {
  icrXnatRoiSession.set('modalOpen', false);
  const dialog = $('#volumeManagementDialog');
  dialog.get(0).close();

  // Reset the focus to the active viewport element
  // This makes the mobile Safari keyboard close
  const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
  element.focus();
}

function getOrCreateStructureSetCollectionData(seriesInstanceUid) {
  if (!seriesInstanceUid) {
    return;
  }

  const freehand3DStore = modules.freehand3D;

  let series = freehand3DStore.getters.series(seriesInstanceUid);

  if (!series) {
    freehand3DStore.setters.series(seriesInstanceUid);
    series = freehand3DStore.getters.series(seriesInstanceUid);
  }

  const structureSetCollection = series.structureSetCollection;
  const dataArray = [];

  for (let i = 0; i < structureSetCollection.length; i++) {
    const ROIContourArray = [];
    const structureSet = structureSetCollection[i];
    const ROIContourCollection = structureSet.ROIContourCollection;

    for (let j = 0; j < ROIContourCollection.length; j++) {
      if (ROIContourCollection[j]) {
        ROIContourArray.push({
          index: j,
          ROIContourReference: ROIContourCollection[j],
          structureSetReference: structureSet,
          structureSetName: structureSet.name
        });
      }
    }

    dataArray.push({
      structureSetName: structureSet.name,
      ROIContourArray,
      structureSetReference: structureSet,
      showList: new ReactiveVar(structureSet.name === 'default' ? true : false),
      display: new ReactiveVar(structureSet.visible ? true : false)
    });

  }

  return dataArray;
}
