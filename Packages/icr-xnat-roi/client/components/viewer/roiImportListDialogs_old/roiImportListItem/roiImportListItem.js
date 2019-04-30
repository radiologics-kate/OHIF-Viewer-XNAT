Template.roiImportListItem.onCreated(() => {
  const instance = Template.instance();
});

Template.roiImportListItem.helpers({
  name: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.collectionInfo.name;
  },
  /*
  label: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.collectionInfo.label;
  },*/
  collectionType: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.collectionInfo.collectionType;
  },
  checked: () => {
    const instance = Template.instance();
    const checked = instance.data.checked.get();

    if (checked) {
      return "checked";
    }

    return;
  }
});

Template.roiImportListItem.events({
  "click .js-roi-check"(event) {
    console.log(".js-roi-check");
    const instance = Template.instance();
    const data = instance.data;
    const checked = data.checked;
    const index = data.index;
    const importMask = data.importMask;

    checked.set(event.target.checked);

    importMask[index] = checked.get();
  }
});
