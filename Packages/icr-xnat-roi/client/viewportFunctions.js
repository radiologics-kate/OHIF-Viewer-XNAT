import { OHIF } from "meteor/ohif:core";
import exportROIs from "./lib/IO/exportROIs.js";
import importROIs from "./lib/IO/importROIs.js";
import exportMask from "./lib/IO/exportMask.js";
import importMask from "./lib/IO/importMask.js";

OHIF.viewerbase.viewportUtils.exportROIs = () => {
  exportROIs();
};
OHIF.viewerbase.viewportUtils.importROIs = () => {
  importROIs();
};
OHIF.viewerbase.viewportUtils.showHelp = () => {
  const dialog = document.getElementById("showHelpDialog");

  dialog.show();
};

OHIF.viewerbase.viewportUtils.exportMask = function() {
  exportMask();
};

OHIF.viewerbase.viewportUtils.importMask = function() {
  importMask();
};
