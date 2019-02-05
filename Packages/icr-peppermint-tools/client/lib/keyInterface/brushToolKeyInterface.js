import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { icrXnatRoiSession, isModalOpen } from "meteor/icr:xnat-roi-namespace";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import getActiveBrushToolsForElement from "../util/getActiveBrushToolsForElement.js";
import brushMetadataIO from "../util/brushMetadataIO.js";

const getKeyFromKeyCode = cornerstoneTools.import("util/getKeyFromKeyCode");
const Mousetrap = require("mousetrap");
const BaseBrushTool = cornerstoneTools.import("base/BaseBrushTool");

const brushModule = cornerstoneTools.store.modules.brush;

Mousetrap.bind(["[", "]", "-", "=", "+", "n", "N"], function(evt) {
  if (isModalOpen()) {
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
      brushTool.previousSegmentation();
      imageNeedsUpdate = true;
      break;
    case "]":
      brushTool.nextSegmentation();
      imageNeedsUpdate = true;
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
      newSegmentation();
      break;
  }

  if (imageNeedsUpdate) {
    cornerstone.updateImage(element);
  }
});

function newSegmentation() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  let segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];

  if (!segMetadata) {
    brushModule.state.segmentationMetadata[seriesInstanceUid] = [];
    segMetadata = brushModule.state.segmentationMetadata[seriesInstanceUid];
  }

  const colormap = cornerstone.colors.getColormap(brushModule.state.colorMapId);
  const numberOfColors = colormap.getNumberOfColors();

  for (let i = 0; i < numberOfColors; i++) {
    if (!segMetadata[i]) {
      brushModule.state.drawColorId = i;
      brushMetadataIO(i);
      break;
    }
  }
}
