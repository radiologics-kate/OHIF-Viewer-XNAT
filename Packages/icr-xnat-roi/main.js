export {
  checkAndSetPermissions
} from "./client/lib/IO/checkAndSetPermissions.js";

export { default as importROIContours } from "./client/lib/IO/importROIs.js";
export { default as exportROIContours } from "./client/lib/IO/exportROIs.js";
export { default as importSegmentations } from "./client/lib/IO/importMask.js";
export { default as exportSegmentations } from "./client/lib/IO/exportMask.js";

import { default as XNATNavigation } from "./client/components/viewer/xnatNavigation/XNATNavigation.js";
import { default as MaskImportList } from "./client/components/viewer/maskImportListDialogs/MaskImportListDialog.js";
import { default as MaskExportList } from "./client/components/viewer/maskExportListDialogs/MaskExportListDialog.js";
import { default as RoiImportList } from "./client/components/viewer/roiImportListDialogs/RoiImportListDialog.js";
import { default as RoiExportList } from "./client/components/viewer/roiExportListDialogs/RoiExportListDialog.js";

const components = {
  XNATNavigation,
  MaskImportList,
  MaskExportList,
  RoiImportList,
  RoiExportList
};

export { components };
