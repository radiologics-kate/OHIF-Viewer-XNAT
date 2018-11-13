import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const modules = cornerstoneTools.store.modules;

Template.brushMetadataDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#brushMetadataDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushMetadataDialogs.onCreated(() => {
});

Template.brushMetadataDialogs.helpers({
});
