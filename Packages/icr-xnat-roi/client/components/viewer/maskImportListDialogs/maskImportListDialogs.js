import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

Template.maskImportListDialogs.onRendered(() => {
    const instance = Template.instance();
    const id = 'maskImportListDialog';

    const dialog = instance.$('#' + id);
    instance.data.dialog = dialog;

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.maskImportListDialogs.onCreated(() => {
    const instance = Template.instance();
});

Template.maskImportListDialogs.helpers({
  importListReady: () => {
    return icrXnatRoiSession.get('importListReady');
  },
  listHasData: () => {
    const instance = Template.instance();
    const importList = icrXnatRoiSession.get('importList');

    if (importList.length > 0) {
      return true;
    }

    return false;
  },
  roiCollections: () => {
    const instance = Template.instance();
    const importList = icrXnatRoiSession.get('importList');
    const roiCollections = [];

    const selectAll = instance.data.selectAll.get();

    if (!importList) {
      return []; // Blank array, i.e. no list items.
    }

    for (let i = 0; i < importList.length; i++) {
      roiCollections.push({
        collectionInfo: importList[i],
        index: i
      });
    }

    return roiCollections;
  }
});
