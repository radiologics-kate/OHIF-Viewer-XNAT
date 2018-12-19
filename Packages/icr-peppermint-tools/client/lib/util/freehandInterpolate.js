import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

export default function(toolData) {
  const ROIContourUid = toolData.ROIContourUid;
  const seriesInstanceUid = toolData.seriesInstanceUid;

  const imageIds = _getImageIdsOfActiveSeries();
  const ROIContourData = _getROIContourData(imageIds);
  const extent = _getExtentOfRegion(ROIContourData);

  // If a contour can is missing between drawn slices, see if it can be interpolated.
  for (i = extent[0] + 1; i < extent[1]; i++) {
    if (!ROIContourData[i].contours) {
      const contourPair = _getContoursToInterpolate(i, extent, ROIContourData);

      if (contourPair) {
        _interpolateBetween(i, contourPair, ROIContourData);
      }
    }
  }

}

function _getImageIdsOfActiveSeries () {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  return stackToolState.data[0].imageIds;
}


function _getROIContourData (imageIds) {
  const ROIContourData = [];
  const toolStateManager = globalToolStateManager.saveToolState();

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageToolState = toolStateManager[imageId];

    if (!imageToolState || !imageToolState.freehandMouse) {
      ROIContourData.push({
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

      ROIContourData.push(contoursOnSlice);
    }
  }
}

function _getExtentOfRegion (ROIContourData) {
  const extent = [];

  for (let i = 0; i < ROIContourData.length; i++) {
    if (ROIContourData[i].contours) {
      extent.push(i);
      break;
    }
  }

  for (let i = ROIContourData.length - 1; i >= 0; i--) {
    if (ROIContourData[i].contours) {
      extent.push(i);
      break;
    }
  }

  return extent;
}


function _getContoursToInterpolate (index, extent, ROIContourData) {
  let contours = [];
  let canInterpolate = true;

  // Check for nearest lowest index containing contours.
  for (let i = index - 1; i >= extent[0]; i--) {
    if (ROIContourData[i].contours) {
      if (ROIContourData[i].contours.length > 1) {
        canInterpolate = false;
      }

      contours.push(i);
      break;
    }
  }

  if (!canInterpolate) {
    return;
  }

  // Check for nearest upper index containing contours.
  for (let i = index + 1; i <= extent[1]; i++) {
    if (ROIContourData[i].contours) {
      if (ROIContourData[i].contours.length > 1) {
        canInterpolate = false;
      }

      contours.push(i);
      break;
    }
  }

  if (!canInterpolate) {
    return;
  }

  return contours;
}

function _interpolateBetween (index, contourPair, ROIContourData) {
  console.log(`TODO: interpolate frame ${index + 1} between frames (${contourPair[0] + 1}, ${contourPair[1] + 1})`);
}
