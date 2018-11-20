Template.maskImportListItem.onCreated(() => {
    const instance = Template.instance();
});

Template.maskImportListItem.helpers({
  name: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.collectionInfo.name;
  },
  collectionType: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.collectionInfo.collectionType;
  },
  index: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.index;
  }
});
