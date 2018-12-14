import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

Template.ioHelpImport.helpers({
  canRead: () => {
    const canRead = icrXnatRoiSession.get('readPermissions');

    if (canRead) {
      return true;
    }

    return false;
  },
  projectId: () => {
    return icrXnatRoiSession.get("projectId");
  },
  experimentLabel: () => {
    return icrXnatRoiSession.get("experimentLabel");
  }
});
