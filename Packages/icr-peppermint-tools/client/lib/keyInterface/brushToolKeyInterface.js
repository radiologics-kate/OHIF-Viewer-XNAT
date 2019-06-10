import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import isDialogOpen from "../util/isDialogOpen.js";
import getActiveSeriesInstanceUid from "../util/getActiveSeriesInstanceUid.js";
import getActiveBrushToolsForElement from "../util/getActiveBrushToolsForElement.js";
import { newSegment } from "../util/brushMetadataIO.js";

const Mousetrap = require("mousetrap");
const BaseBrushTool = cornerstoneTools.importInternalModule(
  "base/BaseBrushTool"
);

const brushModule = cornerstoneTools.store.modules.brush;

Mousetrap.bind(["[", "]", "-", "=", "+", "n", "N"], function(evt) {
  if (isDialogOpen()) {
    return;
  }

  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const activeBrushTools = getActiveBrushToolsForElement(element);

  if (!activeBrushTools.length) {
    return;
  }

  const brushTool = activeBrushTools[0];
  const key = evt.key;
  let imageNeedsUpdate = false;

  switch (key) {
    case "[":
      brushTool.previousSegment();
      imageNeedsUpdate = true;
      // JamesAPetts
      Session.set("refreshSegmentationMenu", Math.random().toString);
      break;
    case "]":
      brushTool.nextSegment();
      imageNeedsUpdate = true;
      // JamesAPetts
      Session.set("refreshSegmentationMenu", Math.random().toString);
      break;
    case "-":
      brushTool.decreaseBrushSize();
      imageNeedsUpdate = true;
      break;
    case "+":
    case "=":
      brushTool.increaseBrushSize();
      imageNeedsUpdate = true;
      break;
    case "n":
    case "N":
      newSegment();
      break;
  }

  if (imageNeedsUpdate) {
    cornerstone.updateImage(element);
  }
});
