// Tools
export {
  default as FreehandRoi3DTool
} from "./client/lib/tools/FreehandRoi3DTool.js";
export {
  default as FreehandRoi3DSculptorTool
} from "./client/lib/tools/FreehandRoi3DSculptorTool.js";
export { default as Brush3DTool } from "./client/lib/tools/Brush3DTool.js";
export {
  default as Brush3DHUGatedTool
} from "./client/lib/tools/Brush3DHUGatedTool.js";
export {
  default as Brush3DAutoGatedTool
} from "./client/lib/tools/Brush3DAutoGatedTool.js";

// Modules
export {
  default as freehand3DModule
} from "./client/lib/modules/freehand3DModule.js";

// Utils
export {
  createNewVolume,
  setVolumeName
} from "./client/lib/util/freehandNameIO.js";
export { default as generateUID } from "./client/lib/util/generateUID.js";
export {
  default as lockStructureSet
} from "./client/lib/util/lockStructureSet.js";
export { getNextColor } from "./client/lib/modules/freehand3DModule.js";
export {
  default as getUnsavedRegions
} from "./client/lib/util/getUnsavedRegions.js";

// Classes
export { Polygon } from "./client/lib/util/classes/Polygon.js";

export { default as init } from "./client/init.js";

import { default as RoiContourMenu } from "./client/components/viewer/roiContourMenu/RoiContourMenu.js";
import { default as SegmentationMenu } from "./client/components/viewer/segmentationMenu/SegmentationMenu.js";

const components = {
  RoiContourMenu,
  SegmentationMenu
};

export { components };
