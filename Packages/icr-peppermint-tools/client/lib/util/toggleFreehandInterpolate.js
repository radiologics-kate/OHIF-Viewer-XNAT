import { OHIF } from "meteor/ohif:core";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

const modules = cornerstoneTools.store.modules;

/**
 * Toggles interpolation.
 *
 * @author JamesAPetts
 */
export default function() {
  const enabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

  if (!enabledElement) {
    return;
  }

  const freehand3DModule = modules.freehand3D;
  const interpolate = !freehand3DModule.getters.interpolate();

  freehand3DModule.setters.interpolate(interpolate);
  icrXnatRoiSession.set("freehandInterpolate", interpolate);

  cornerstone.updateImage(enabledElement.element);
}
