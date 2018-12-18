import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

export default function(toolData) {
  const freehand3DModule = modules.freehand3D;

  if (!freehand3DModule.getters.interpolate()) {
    console.log("INTERPOLATION OFF!");
    return;
  }

  console.log("TRIGGER INTERPOLATE... GO!");

  const ROIContourUid = toolData.ROIContourUid;
  const seriesInstanceUid = toolData.seriesInstanceUid;

  // Get images IDs for this active series.

  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  const imageIds = stackToolState.data[0].imageIds;

  // Trawl through imageIds and get the freehand data that corresponds to the ROIContourUid.
  const contoursOnSlices = [];
  const toolStateManager = globalToolStateManager.saveToolState();

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageToolState = toolStateManager[imageId];

    if (!imageToolState || !imageToolState.freehandMouse) {
      contoursOnSlices.push({
        imageId
      });
    } else {
      const contours = imageToolState.freehandMouse.data.filter(contour => {
        return contour.ROIContourUid === ROIContourUid;
      });

      const contoursOnSlice = {
        imageId
      };

      if (contours.length) {
        contoursOnSlice.contours = contours;
      }

      contoursOnSlices.push(contoursOnSlice);
    }
  }

  // Get the extend of the drawn slices of the ROIContour.
  let minContour;

  for (let i = 0; i < contoursOnSlices.length; i++) {
    if (contoursOnSlices[i].contours) {
      minContour = i;
      break;
    }
  }

  let maxContour;

  for (let i = contoursOnSlices.length - 1; i >= 0; i--) {
    if (contoursOnSlices[i].contours) {
      maxContour = i;
      break;
    }
  }

  // If a contour can be interpolated... attempt it!
  for (i = minContour + 1; i < maxContour; i++) {
    if (!contoursOnSlices[i].contours) {
      interpolateIfPossible(i, minContour, maxContour, contoursOnSlices);
    }
  }

}


function interpolateIfPossible(index, minContour, maxContour, contoursOnSlices) {
  let lowerBound;
  let upperBound;

  let canInterpolate = true;

  // Check for nearest lowest index containing contours.
  for (let i = index - 1; i >= minContour; i--) {
    if (contoursOnSlices[i].contours) {
      if (contoursOnSlices[i].contours.length > 1) {
        canInterpolate = false;
      }

      lowerBound = i;
      break;
    }
  }

  if (!canInterpolate) {
    console.log(`lowerBound ${lowerBound} has > 1 contour, can't interpolate`);
    return;
  }

  // Check for nearest upper index containing contours.
  for (let i = index + 1; i <= maxContour; i++) {
    if (contoursOnSlices[i].contours) {
      if (contoursOnSlices[i].contours.length > 1) {
        canInterpolate = false;
      }

      upperBound = i;
      break;
    }
  }

  if (!canInterpolate) {
    console.log(`upperBound ${upperBound} has > 1 contour, can't interpolate`);
    return;
  }

  interpolateBetween(index, lowerBound, upperBound, contoursOnSlices);
}

function interpolateBetween(index, lowerBound, upperBound, contoursOnSlices) {
  console.log(`TODO: interpolate frame ${index + 1} between frames (${lowerBound + 1}, ${upperBound + 1})`);
}
