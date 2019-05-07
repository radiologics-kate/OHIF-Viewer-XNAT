import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

Template.freehandSetNameDialogs.onRendered(() => {
    const instance = Template.instance();
    const id = 'freehandSetName';
    const dialog = instance.$('#' + id);

    dialogPolyfill.registerDialog(dialog.get(0));
});
