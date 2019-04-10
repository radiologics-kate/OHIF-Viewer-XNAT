import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

Template.roiImportListDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiImportListDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiImportListDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.selectAll = new ReactiveVar(true);
  instance.data.importListReady = new ReactiveVar(false);
  instance.data.importList = new ReactiveVar([]);
  instance.data.importMask = [];
});

Template.roiImportListDialogs.helpers({
  importListReady: () => {
    const instance = Template.instance();

    return instance.data.importListReady.get();
  },
  listHasData: () => {
    const instance = Template.instance();
    const importList = instance.data.importList.get();

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
      return "checked";
    }

    return;
  },
  roiCollections: () => {
    const instance = Template.instance();
    const importList = instance.data.importList.get();
    const roiCollections = [];

    const selectAll = instance.data.selectAll.get();

    instance.data.importMask = [];

    if (!importList) {
      return roiCollections; // Blank array, i.e. no list items.
    }

    for (let i = 0; i < importList.length; i++) {
      roiCollections.push({
        collectionInfo: importList[i],
        importMask: instance.data.importMask,
        index: i,
        checked: new ReactiveVar(selectAll)
      });

      instance.data.importMask[i] = selectAll ? true : false;
    }

    return roiCollections;
  }
});

Template.roiImportListDialogs.events({
  "click .js-select-all-check"(event) {
    const instance = Template.instance();
    const checked = event.target.checked;

    instance.data.selectAll.set(checked);
  }
});
