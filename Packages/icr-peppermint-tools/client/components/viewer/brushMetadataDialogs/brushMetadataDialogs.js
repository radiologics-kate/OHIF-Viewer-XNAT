import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const modules = cornerstoneTools.store.modules;

Template.brushMetadataDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#brushMetadataDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushMetadataDialogs.onCreated(() => {
  const instance = Template.instance();
  instance.data.searchQuery = new ReactiveVar('');
  instance.data.label = new ReactiveVar('');

});

Template.brushMetadataDialogs.helpers({
  searchTest: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get();

    return searchQuery;
  },
});

Template.brushMetadataDialogs.events({
  'keyup .brush-segmentation-search-js'(event) {
    console.log(event.currentTarget.value);

    const instance = Template.instance();
    instance.data.searchQuery.set(event.currentTarget.value);
  },
  'keyup .brush-segmentation-label-js'(event) {
    console.log(event.currentTarget.value);

    const instance = Template.instance();
    instance.data.label.set(event.currentTarget.value);
  }
});
