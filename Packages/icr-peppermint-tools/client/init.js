import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import freehand3DModule from "./lib/modules/freehand3DModule.js";

export default function initialise(configuration = {}) {
  const brushModule = cornerstoneTools.store.modules.brush;
  const brushState = brushModule.state;

  const config = Object.assign({}, defaultConfig, configuration);

  icrXnatRoiSession.set("freehandInterpolate", config.interpolate);
  icrXnatRoiSession.set("showFreehandStats", config.showFreehandStats);
  brushState.holeFill = config.holeFill;
  brushState.strayRemove = config.strayRemove;
  brushState.gate = config.gate;
  brushState.maxRadius = config.maxRadius;
  cornerstoneTools.register("module", "freehand3D", freehand3DModule);
}

const defaultConfig = {
  maxRadius: 64,
  holeFill: 0.02,
  strayRemove: 0.05,
  interpolate: false,
  showFreehandStats: false,
  gate: "muscle"
};
