import { sessionMap } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

Template.ioHelpExport.helpers({
  canWrite: () => {
    const canWrite = icrXnatRoiSession.get("writePermissions");

    if (canWrite) {
      return true;
    }

    return false;
  },
  projectId: () => {
    return sessionMap.get("session", "projectId");
  }
});
