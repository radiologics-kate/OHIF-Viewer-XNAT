import { OHIF } from "meteor/ohif:core";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

const modules = cornerstoneTools.store.modules;

/**
 * Toggles the visibility and interactivity of the stats window for the freehand
 * tool.
 *
 * @author JamesAPetts
 */
export default function() {
  const enabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

  if (!enabledElement) {
    return;
  }

  const element = enabledElement.element;

  const freehand3DModule = modules.freehand3D;
  const displayStats = !freehand3DModule.getters.displayStats();

  freehand3DModule.setters.displayStats(displayStats);
  icrXnatRoiSession.set("showFreehandStats", displayStats);

  cornerstone.updateImage(element);
}
