import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

Template.roiImportListDialogs.onRendered(() => {
    const instance = Template.instance();
    const id = 'roiImportListDialog';

    const dialog = instance.$('#' + id);
    instance.data.dialog = dialog;

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiImportListDialogs.onCreated(() => {
    const instance = Template.instance();

    instance.data.selectAll = new ReactiveVar(true);
    instance.data.importMask = [];
});

Template.roiImportListDialogs.helpers({
  importListReady: () => {
    return icrXnatRoiSession.get('importListReady');
  },
  listHasData: () => {
    const instance = Template.instance();
    const importList = icrXnatRoiSession.get('importList');

    if (importList.length > 0) {
      return true;
    }

    instance.data.importMask = [];

    return false;
  },
  selectAllChecked: () => {
    const instance = Template.instance();
    const selectAll = instance.data.selectAll.get();

    if (selectAll) {
      return 'checked';
    }

    return;
  },
  roiCollections: () => {
    const instance = Template.instance();
    const importList = icrXnatRoiSession.get('importList');
    const roiCollections = [];

    const selectAll = instance.data.selectAll.get();

    console.log(`importList: ${importList}`);

    if (!importList) {
      return []; // Blank array, i.e. no list items.
    }

    instance.data.importMask = [];

    for (let i = 0; i < importList.length; i++) {
      roiCollections.push({
        collectionInfo: importList[i],
        importMask: instance.data.importMask,
        index: i,
        checked: new ReactiveVar(selectAll)
      });

      instance.data.importMask[i] = selectAll ? true : false;
    }

    console.log('inside roiCollections helper');
    console.log(roiCollections);

    return roiCollections;
  }
});


Template.roiImportListDialogs.events({
    'click .js-select-all-check'(event) {
      const instance = Template.instance();
      instance.data.selectAll.set(!instance.data.selectAll.get());
    }
});
