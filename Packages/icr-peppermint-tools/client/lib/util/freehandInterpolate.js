import { cornerstoneTools } from "meteor/ohif:cornerstone";

const modules = cornerstoneTools.store.modules;

export default function(toolData) {
  const freehand3DModule = modules.freehand3D;

  if (!freehand3DModule.getters.interpolate()) {
    console.log("INTERPOLATION OFF!");
    return;
  }

  console.log("TRIGGER INTERPOLATE");
}
