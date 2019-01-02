import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { Polygon } from "./classes/Polygon.js";
import generateUID from "./generateUID.js";

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

  const lowerCandidate = extent[0] + 1;
  const upperCandidate = extent[1] - 1;

  // If a contour can is missing between drawn slices, see if it can be interpolated.
  for (i = lowerCandidate; i <= upperCandidate; i++) {
    console.log(`checking contour: ${i}`);

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
  console.log(`Interpolating frame ${index + 1} between frames (${contourPair[0] + 1}, ${contourPair[1] + 1})`);

  const c1 = generateClosedContour3D(
    ROIContourData[contourPair[0]].contours[0].handles,
    contourPair[0]
  );
  const c2 = generateClosedContour3D(
    ROIContourData[contourPair[1]].contours[0].handles,
    contourPair[1]
  );

  const zInterp = (index - contourPair[0])/(contourPair[1] - contourPair[0]);

  const cumPerim1 = getCumulativePerimeter(c1);
  const cumPerim2 = getCumulativePerimeter(c2);

  const interpPoints = Math.max(
    Math.ceil(cumPerim1[cumPerim1.length - 1]/dP),
    Math.ceil(cumPerim2[cumPerim2.length - 1]/dP)
  );

  const cumPerim1Norm = normalisedCumulativePerimeter(cumPerim1);
  const cumPerim2Norm = normalisedCumulativePerimeter(cumPerim2);

  // concatinate p && cumPerimNorm
  const perim1Interp = getInterpolatedPerim(interpPoints + c2.x.length, cumPerim1Norm);
  const perim2Interp = getInterpolatedPerim(interpPoints + c1.x.length, cumPerim2Norm);

  const perim1Ind = getIndicatorArray(c1, c2, interpPoints);
  const perim2Ind = getIndicatorArray(c2, c1, interpPoints);

  const nodesPerSegment1 = getNodesPerSegment(perim1Interp, perim1Ind);
  const nodesPerSegment2 = getNodesPerSegment(perim2Interp, perim2Ind);

  const c1i = getSuperSampledContour(c1, nodesPerSegment1);

  const c2i = getSuperSampledContour(c2, nodesPerSegment2);

  // Keep c2i fixed and shift the starting node of c1i to minimise the total length of segments.
  shiftSuperSampledContourInPlace(c1i, c2i);

  const {c1iReduced, c2iReduced} = reduceContoursToOriginNodes(c1i, c2i);

  const interpolated2DContour = generateInterpolatedOpen2DContour(
    c1iReduced,
    c2iReduced,
    zInterp,
    c1.x.length > c2.x.length
  );

  const c1Metadata = ROIContourData[contourPair[0]].contours[0];

  const ROIContourMetadata = {
    ROICOntourUid: c1Metadata.ROIContourUid,
    seriesInstanceUid: c1Metadata.seriesInstanceUid,
    structureSetUid: c1Metadata.structureSetUid
  };

  addInterpolatedContour(
    interpolated2DContour,
    ROIContourData[index].imageId,
    ROIContourData[contourPair[0]].contours[0]
  );

}

function addInterpolatedContour (interpolated2DContour, imageId, referenceToolData) {
  const handles = [];

  for (let i = 0; i < interpolated2DContour.x.length; i++) {
    handles.push({
      x: interpolated2DContour.x[i],
      y: interpolated2DContour.y[i]
    });
  }

  const polygon = new Polygon(
    handles, // TODO -> convert interpolated2DContour to handles
    null,
    referenceToolData.seriesInstanceUid,
    referenceToolData.structureSetUid,
    referenceToolData.ROIContourUid,
    generateUID()
  );

  const toolStateManager = globalToolStateManager.saveToolState();

  if (!toolStateManager[imageId]) {
    toolStateManager[imageId] = {};
  }

  const imageToolState = toolStateManager[imageId];

  if (!imageToolState.freehandMouse) {
    imageToolState.freehandMouse = {};
    imageToolState.freehandMouse.data = [];
  } else if (!imageToolState.freehandMouse.data) {
    imageToolState.freehandMouse.data = [];
  }

  imageToolState.freehandMouse.data.push(
    polygon.getFreehandToolData(false)
  );
}


function generateInterpolatedOpen2DContour (c1ir, c2ir, zInterp, c1HasMoreOriginalPoints) {
  const cInterp = {
    x: [],
    y: []
  };

  const indicies = c1HasMoreOriginalPoints ? c1ir.I : c2ir.I;

  for (let i = 0; i < c1ir.x.length; i++) {
    if (indicies[i]) {
      cInterp.x.push((1-zInterp)*c1ir.x[i] + zInterp*c2ir.x[i]);
      cInterp.y.push((1-zInterp)*c1ir.y[i] + zInterp*c2ir.y[i]);
    }
  }

  return cInterp;
}

function reduceContoursToOriginNodes (c1i, c2i) {
  const c1iReduced = {
    x: [],
    y: [],
    z: [],
    I: []
  };
  const c2iReduced = {
    x: [],
    y: [],
    z: [],
    I: []
  };

  for (let i = 0; i < c1i.x.length; i++) {
    if (c1i.I[i] || c2i.I[i]) {
      c1iReduced.x.push(c1i.x[i]);
      c1iReduced.y.push(c1i.y[i]);
      c1iReduced.z.push(c1i.z[i]);
      c1iReduced.I.push(c1i.I[i]);

      c2iReduced.x.push(c2i.x[i]);
      c2iReduced.y.push(c2i.y[i]);
      c2iReduced.z.push(c2i.z[i]);
      c2iReduced.I.push(c2i.I[i]);
    }
  }

  return {
    c1iReduced,
    c2iReduced
  };
}


/**
 * shiftSuperSampledContourInPlace - Shifts the indicies of c1i around to
 * minimise: SUM (|c1i[i]-c2i[i]|) from 0 to N.
 *
 * @param  {type} c1i The contour to shift.
 * @param  {type} c2i The reference contour.
 * @modifies c1i
 */
function shiftSuperSampledContourInPlace (c1i, c2i) {
  const c1iLength = c1i.x.length;

  let optimal = {
    startingNode: 0,
    totalSquaredXYLengths: Infinity
  };

  for (let startingNode = 0; startingNode < c1iLength; startingNode++) {
    let node = startingNode;

    // NOTE: 1) Ignore calculating Z, as the sum of all squared Z distances will always be a constant.
    // NOTE: 2) Don't need actual length, so don't worry about square rooting.
    let totalSquaredXYLengths = 0;

    for (let itteration = 0; itteration < c1iLength; itteration++) {

      totalSquaredXYLengths += (c1i.x[node] - c2i.x[itteration])**2
        + (c1i.y[node] - c2i.y[itteration])**2;

      node++;

      if (node === c1iLength) node = 0;
    }

    if (totalSquaredXYLengths < optimal.totalSquaredXYLengths) {
      optimal.totalSquaredXYLengths = totalSquaredXYLengths;
      optimal.startingNode = startingNode;
    }
  }

  let node = optimal.startingNode;

  shiftCircularArray(c1i.x, node);
  shiftCircularArray(c1i.y, node);
  shiftCircularArray(c1i.z, node);
  shiftCircularArray(c1i.I, node);
}

function shiftCircularArray(arr, count) {
  count -= arr.length * Math.floor(count / arr.length);
  arr.push.apply(arr, arr.splice(0, count));
  return arr;
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
  for (let n = 0; n < c.x.length - 1; n++) {
    // Add original point.
    ci.x.push(c.x[n]);
    ci.y.push(c.y[n]);
    ci.z.push(zValue);
    ci.I.push(1);

    // Add linerally interpolated points.

    const xSpacing = (c.x[n+1] - c.x[n]) / (nodesPerSegment[n] + 1);
    const ySpacing = (c.y[n+1] - c.y[n]) / (nodesPerSegment[n] + 1);

    // Add other nodesPerSegment - 1 other points (as already put in original point).
    for (let i = 0; i < nodesPerSegment[n] - 1; i++) {
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
  for (let i = 0; i < perimInterp.length; ++i) idx[i] = i;
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
    console.log('anti-clockwise!');
    contour.x.reverse();
    contour.y.reverse();
  }
}

function getSumReducer(total, num) {
  return total + num;
}
