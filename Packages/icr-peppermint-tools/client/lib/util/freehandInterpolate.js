import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dP = 0.2; // Aim for < 0.2mm between interpolated points when super-sampling.

export default function(toolData) {
  const ROIContourUid = toolData.ROIContourUid;

  const imageIds = _getImageIdsOfActiveSeries();
  const ROIContourData = _getROIContourData(imageIds, ROIContourUid);
  const extent = _getExtentOfRegion(ROIContourData);

  // TEMP
  const t0 = performance.now();
  // TEMP

  console.log(extent);

  // If a contour can is missing between drawn slices, see if it can be interpolated.
  for (i = extent[0] + 1; i < extent[1]; i++) {
    console.log(i);

    if (!ROIContourData[i].contours) {
      const contourPair = _getContoursToInterpolate(i, extent, ROIContourData);

      if (contourPair) {
        _interpolateBetween(i, contourPair, ROIContourData);
      }
    }
  }

  // TEMP
  const t1 = performance.now();

  console.log(`interpolation took ${t1 - t0} ms.`);
  // TEMP

}

function _getImageIdsOfActiveSeries () {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  return stackToolState.data[0].imageIds;
}


function _getROIContourData (imageIds, ROIContourUid) {
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

  return ROIContourData;
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

  console.log(`_getContoursToInterpolate: ${index}`);

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

  const c1 = generateClosedContour3D(
    ROIContourData[contourPair[0]].contours[0].handles,
    contourPair[0]
  );
  const c2 = generateClosedContour3D(
    ROIContourData[contourPair[1]].contours[0].handles,
    contourPair[1]
  );

  const zInterp = index;

  const cumPerim1 = getCumulativePerimeter(c1);
  const cumPerim2 = getCumulativePerimeter(c2);

  const interpPoints = Math.max(
    Math.ceil(cumPerim1[cumPerim1.length - 1]/dP),
    Math.ceil(cumPerim2[cumPerim2.length - 1]/dP)
  );

  const cumPerim1Norm = normalisedCumulativePerimeter(cumPerim1);
  const cumPerim2Norm = normalisedCumulativePerimeter(cumPerim2);

  // concatinate p1 && cumPerim1Norm
  const perim1Interp = getInterpolatedPerim(interpPoints + c2.x.length, cumPerim1Norm);
  const perim2Interp = getInterpolatedPerim(interpPoints + c1.x.length, cumPerim2Norm);

  const perim1Ind = getIndicatorArray(c1, c2, interpPoints);
  const perim2Ind = getIndicatorArray(c2, c1, interpPoints);

  const nodesPerSegment1 = getNodesPerSegment(perim1Interp, perim1Ind);
  const nodesPerSegment2 = getNodesPerSegment(perim2Interp, perim2Ind);

  const c1i = getSuperSampledContour(c1, nodesPerSegment1);
  const c2i = getSuperSampledContour(c2, nodesPerSegment2);

  console.log(c1i);



}


function getSuperSampledContour(c, nodesPerSegment) {
  const ci = {
    x: [],
    y: [],
    z: [],
    I: []
  };

  const zValue = c.z[0];

  // Length - 1, produces 'open' polygon.
  for (n = 0; n < c.x.length - 1; n++) {
    // Add original point.
    ci.x.push(c.x[n]);
    ci.y.push(c.y[n]);
    ci.z.push(zValue);
    ci.I.push(1);

    // Add linerally interpolated points.

    const xSpacing = (c.x[n+1] - c.x[n]) / (nodesPerSegment[n] + 1);
    const ySpacing = (c.y[n+1] - c.y[n]) / (nodesPerSegment[n] + 1);

    for (i = 0; i < nodesPerSegment[n]; i++) {
      ci.x.push(ci.x[ci.x.length - 1] + xSpacing);
      ci.y.push(ci.y[ci.y.length - 1] + ySpacing);
      ci.z.push(zValue);
      ci.I.push(0);
    }
  }

  return ci;
}

function getNodesPerSegment(perimInterp, perimInd) {
  const idx = [];
  for (var i = 0; i < perimInterp.length; ++i) idx[i] = i;
  idx.sort(function (a, b) { return perimInterp[a] < perimInterp[b] ? -1 : perimInterp[a] > perimInterp[b] ? 1 : 0; });

  const perimIndSorted = [];

  for (let i = 0; i < perimInd.length; i++) {
    perimIndSorted.push(perimInd[idx[i]]);
  }

  const indiciesOfOriginPoints = perimIndSorted.reduce(function(arr, element, i) {
    if (element === 1) arr.push(i);
    return arr;
  }, [])

  const nodesPerSegment= [];

  for (let i = 0; i < indiciesOfOriginPoints.length - 1; i++) {
    nodesPerSegment.push(indiciesOfOriginPoints[i + 1] - indiciesOfOriginPoints[i])
  }

  return nodesPerSegment;
}

function getIndicatorArray(contour3D, otherContour3D, interpPoints) {
  const perimInd = []

  for (let i = 0; i < interpPoints + otherContour3D.x.length - 2; i++) {
    perimInd.push(0);
  }

  for (let i = 0; i < contour3D.x.length; i++) {
    perimInd.push(1);
  }

  return perimInd;
}

function getInterpolatedPerim(length, cumPerimNorm) {
  const diff = 1 / (length - 1);
  const linspace = [diff];

  // Length - 2 as we are discarding 0 an 1 for efficiency (no need to calculate them).
  for (let i = 1; i < length - 2; i++) {
    linspace.push(linspace[linspace.length - 1] + diff);
  }

  return linspace.concat(cumPerimNorm);
}

function getCumulativePerimeter(contour3D) {
  let cumulativePerimeter = [0];

  for (let i = 1; i < contour3D.x.length; i++) {
    const lengthOfSegment = Math.sqrt(
      (contour3D.x[i] - contour3D.x[i-1]) ** 2 + (contour3D.y[i] - contour3D.y[i-1]) ** 2
    );

    cumulativePerimeter.push(cumulativePerimeter[i-1] + lengthOfSegment)
  }

  return cumulativePerimeter;
}

function normalisedCumulativePerimeter(cumPerim) {
  const cumPerimNorm = [];

  for (let i = 0; i < cumPerim.length; i++) {
    cumPerimNorm.push(cumPerim[i]/cumPerim[cumPerim.length - 1]);
  }

  return cumPerimNorm;
}

function generateClosedContour3D (contour2D, z) {
  const c = {
    x: [],
    y: [],
    z: []
  };

  // NOTE: For z positions we only need the relative difference for interpolation, thus use frame index as Z.
  for (let i = 0; i < contour2D.length; i++) {
    c.x[i] = contour2D[i].x;
    c.y[i] = contour2D[i].y;
    c.z[i] = z;
  }

  // Push last node to create closed contour.
  c.x.push(c.x[0]);
  c.y.push(c.y[0]);
  c.z.push(z);

  reverseIfAntiClockwise(c);

  return c;
}

function reverseIfAntiClockwise (contour) {
  const length = contour.x.length;
  const contourXMean = contour.x.reduce(getSumReducer) / length;
  let checkSum = 0;

  for (let k = 0, i = 1, j = 2; k < length; k++) {
    checkSum += (contour.x[i] - contourXMean) * (contour.y[j] - contour.y[k]);
    i++;
    j++;
    if (i >= length) i = 0;
    if (j >= length) j = 0;
  }

  if (checkSum > 0) {
    console.log('C1 anti-clockwise!');
    contour.x.reverse();
    contour.y.reverse();
  }
}

function getSumReducer(total, num) {
  return total + num;
}
