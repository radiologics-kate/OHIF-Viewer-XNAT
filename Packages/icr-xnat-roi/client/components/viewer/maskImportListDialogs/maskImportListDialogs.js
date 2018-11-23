Template.maskImportListDialogs.onRendered(() => {
    const instance = Template.instance();
    const id = 'maskImportListDialog';

    const dialog = instance.$('#' + id);
    instance.data.dialog = dialog;

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.maskImportListDialogs.onCreated(() => {
    const instance = Template.instance();

    instance.data.maskImportListReady = new ReactiveVar(false);
    instance.data.maskImportList = new ReactiveVar([]);
});

Template.maskImportListDialogs.helpers({
  importListReady: () => {
    const instance = Template.instance();

    return instance.data.maskImportListReady.get();
  },
  listHasData: () => {
    const instance = Template.instance();
    const importList = instance.data.maskImportList.get();

    if (importList.length > 0) {
      return true;
    }

    return false;
  },
  roiCollections: () => {
    const instance = Template.instance();
    const importList = instance.data.maskImportList.get();
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
