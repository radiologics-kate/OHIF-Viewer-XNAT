Template.brushMetadataSearchListItem.helpers({
  CodeMeaning: () => {
    const instance = Template.instance();
    const data = instance.data;

    return data.CodeMeaning;
  }
});

Template.brushMetadataSearchListItem.events({
  "click .brush-metadata-search-select-js"(event) {
    const instance = Template.instance();
    const data = instance.data;

    instance.data.setSegmentationTypeCallback(data.CodeMeaning);
  }
});
