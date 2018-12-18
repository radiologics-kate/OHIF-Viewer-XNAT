import { OHIF } from "meteor/ohif:core";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

icrXnatRoiSession.set("freehandInterpolate", false);

const modules = cornerstoneTools.store.modules;

/**
 * Toggles interpolation.
 *
 * @author JamesAPetts
 */
export default function() {
  const freehand3DModule = modules.freehand3D;

  const interpolate = !freehand3D.getters.interpolate();

  freehand3D.setters.interpolate = interpolate;
  icrXnatRoiSession.set("freehandInterpolate", interpolate);

  cornerstone.updateImage(element);
}
