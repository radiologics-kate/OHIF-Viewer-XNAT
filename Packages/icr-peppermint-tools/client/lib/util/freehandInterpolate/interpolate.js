import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { Polygon } from "../classes/Polygon.js";
import generateUID from "../generateUID.js";
import generateInterpolationData from "./generateInterpolationData.js";

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const dP = 0.2; // Aim for < 0.2mm between interpolated points when super-sampling.

/**
 * interpolate - Interpolate missing contours in the ROIContour.
 *
 * @param  {object} toolData The tool data of the freehand3D contour.
 * @return {null}
 */
export default function(toolData) {
  const { ROIContourData, interpolationList } = generateInterpolationData(
    toolData
  );

  // TEMP
  const t0 = performance.now();
  // TEMP

  for (let i = 0; i < interpolationList.length; i++) {
    if (interpolationList[i]) {
      _linearlyInterpolateBetween(
        interpolationList[i].list,
        interpolationList[i].pair,
        ROIContourData
      );
    }
  }

  // TEMP
  const t1 = performance.now();
  console.log(`${t1 - t0} ms`);
  // TEMP
}

/**
 * _linearlyInterpolateBetween - Linearly interpolate all the slices in the
 * indicies array between the contourPair.
 *
 * @param  {Number[]} indicies     An array of slice indicies to interpolate.
 * @param  {Number[]} contourPair  The pair of contours to interpolate between.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                    for the ROIContour.
 * @return {null}
 */

function _linearlyInterpolateBetween(indicies, contourPair, ROIContourData) {
  const c1 = generateClosedContour3D(
    ROIContourData[contourPair[0]].contours[0].handles,
    contourPair[0]
  );
  const c2 = generateClosedContour3D(
    ROIContourData[contourPair[1]].contours[0].handles,
    contourPair[1]
  );

  const { c1Interp, c2Interp } = _generateInterpolationContourPair(c1, c2);

  // Using the newly constructed contours, interpolate each ROI.
  indicies.forEach(function(index) {
    _linearlyInterpolateContour(
      c1Interp,
      c2Interp,
      index,
      contourPair,
      ROIContourData,
      c1.x.length > c2.x.length
    );
  });
}

/**
 * _linearlyInterpolateContour - Inserts a linearly interpolated contour at
 * specified slice index.
 *
 * @param  {object} c1Interp       The first reference contour.
 * @param  {object} c2Interp       The second reference contour.
 * @param  {Number} sliceIndex       The slice index to interpolate.
 * @param  {Number{}} contourPair    The slice indicies of the reference contours.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                  for the ROIContour.
 * @return {null}
 */
function _linearlyInterpolateContour(
  c1Interp,
  c2Interp,
  sliceIndex,
  contourPair,
  ROIContourData,
  c1HasMoreOriginalPoints
) {
  const zInterp =
    (sliceIndex - contourPair[0]) / (contourPair[1] - contourPair[0]);
  const interpolated2DContour = generateInterpolatedOpen2DContour(
    c1Interp,
    c2Interp,
    zInterp,
    c1HasMoreOriginalPoints
  );

  const c1Metadata = ROIContourData[contourPair[0]].contours[0];

  const ROIContourMetadata = {
    ROICOntourUid: c1Metadata.ROIContourUid,
    seriesInstanceUid: c1Metadata.seriesInstanceUid,
    structureSetUid: c1Metadata.structureSetUid
  };

  if (ROIContourData[sliceIndex].contours) {
    editInterpolatedContour(
      interpolated2DContour,
      ROIContourData[sliceIndex].imageId,
      c1Metadata
    );
  } else {
    addInterpolatedContour(
      interpolated2DContour,
      ROIContourData[sliceIndex].imageId,
      c1Metadata
    );
  }
}

/**
 * _generateInterpolationContourPair - generates two aligned contours with an
 * equal number of points from which an intermediate contour may be interpolated.
 *
 * @param  {object} c1 The first contour.
 * @param  {object} c2 The second contour.
 * @return {object}  An object containing the two contours.
 */
function _generateInterpolationContourPair(c1, c2) {
  const cumPerim1 = getCumulativePerimeter(c1);
  const cumPerim2 = getCumulativePerimeter(c2);

  const interpPoints = Math.max(
    Math.ceil(cumPerim1[cumPerim1.length - 1] / dP),
    Math.ceil(cumPerim2[cumPerim2.length - 1] / dP)
  );

  const cumPerim1Norm = normalisedCumulativePerimeter(cumPerim1);
  const cumPerim2Norm = normalisedCumulativePerimeter(cumPerim2);

  // concatinate p && cumPerimNorm
  const perim1Interp = getInterpolatedPerim(
    interpPoints + c2.x.length,
    cumPerim1Norm
  );
  const perim2Interp = getInterpolatedPerim(
    interpPoints + c1.x.length,
    cumPerim2Norm
  );

  const perim1Ind = getIndicatorArray(c1, c2, interpPoints);
  const perim2Ind = getIndicatorArray(c2, c1, interpPoints);

  const nodesPerSegment1 = getNodesPerSegment(perim1Interp, perim1Ind);
  const nodesPerSegment2 = getNodesPerSegment(perim2Interp, perim2Ind);

  const c1i = getSuperSampledContour(c1, nodesPerSegment1);

  const c2i = getSuperSampledContour(c2, nodesPerSegment2);

  // Keep c2i fixed and shift the starting node of c1i to minimise the total length of segments.
  shiftSuperSampledContourInPlace(c1i, c2i);

  return reduceContoursToOriginNodes(c1i, c2i);
}

/**
 * addInterpolatedContour - Adds a new contour to the imageId.
 *
 * @param  {object} interpolated2DContour The polygon to add to the ROIContour.
 * @param  {String} imageId               The imageId to add the polygon to.
 * @param  {type} referencedToolData    The toolData of another polygon in the
 * ROIContour, to assign appropriate metadata to the new polygon.
 * @return {null}
 */
function addInterpolatedContour(
  interpolated2DContour,
  imageId,
  referencedToolData
) {
  const handles = [];

  for (let i = 0; i < interpolated2DContour.x.length; i++) {
    handles.push({
      x: interpolated2DContour.x[i],
      y: interpolated2DContour.y[i]
    });
  }

  const polygon = new Polygon(
    handles,
    null,
    referencedToolData.seriesInstanceUid,
    referencedToolData.structureSetUid,
    referencedToolData.ROIContourUid,
    generateUID(),
    null,
    true
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

  imageToolState.freehandMouse.data.push(polygon.getFreehandToolData(false));
}

/**
 * editInterpolatedContour - Edits an interpolated polygon on the imageId
 * that corresponds to the specified ROIContour.
 *
 * @param  {object} interpolated2DContour The polygon to add to the ROIContour.
 * @param  {String} imageId               The imageId to add the polygon to.
 * @param  {type} referencedToolData    The toolData of another polygon in the
 * ROIContour, to assign appropriate metadata to the new polygon.
 * @return {null}
 */
function editInterpolatedContour(
  interpolated2DContour,
  imageId,
  referencedToolData
) {
  const toolStateManager = globalToolStateManager.saveToolState();
  const imageToolState = toolStateManager[imageId];

  if (!imageToolState) {
    throw new Error(
      "Image toolstate does not exist. This should not be reached in this case!"
    );
  }

  // Find the index of the polygon on this slice corresponding to
  // The ROIContour.
  let toolDataIndex;

  for (let i = 0; i < imageToolState.freehandMouse.data.length; i++) {
    if (
      imageToolState.freehandMouse.data[i].ROIContourUid ===
      referencedToolData.ROIContourUid
    ) {
      toolDataIndex = i;
      break;
    }
  }

  const oldPolygon = imageToolState.freehandMouse.data[toolDataIndex];
  const handles = [];

  for (let i = 0; i < interpolated2DContour.x.length; i++) {
    handles.push({
      x: interpolated2DContour.x[i],
      y: interpolated2DContour.y[i]
    });
  }

  const updatedPolygon = new Polygon(
    handles,
    null,
    oldPolygon.seriesInstanceUid,
    oldPolygon.structureSetUid,
    oldPolygon.ROIContourUid,
    oldPolygon.uid,
    null,
    true
  );

  imageToolState.freehandMouse.data[
    toolDataIndex
  ] = updatedPolygon.getFreehandToolData(false);
}

function generateInterpolatedOpen2DContour(
  c1ir,
  c2ir,
  zInterp,
  c1HasMoreOriginalPoints
) {
  const cInterp = {
    x: [],
    y: []
  };

  const indicies = c1HasMoreOriginalPoints ? c1ir.I : c2ir.I;

  for (let i = 0; i < c1ir.x.length; i++) {
    if (indicies[i]) {
      cInterp.x.push((1 - zInterp) * c1ir.x[i] + zInterp * c2ir.x[i]);
      cInterp.y.push((1 - zInterp) * c1ir.y[i] + zInterp * c2ir.y[i]);
    }
  }

  return cInterp;
}

function reduceContoursToOriginNodes(c1i, c2i) {
  const c1Interp = {
    x: [],
    y: [],
    z: [],
    I: []
  };
  const c2Interp = {
    x: [],
    y: [],
    z: [],
    I: []
  };

  for (let i = 0; i < c1i.x.length; i++) {
    if (c1i.I[i] || c2i.I[i]) {
      c1Interp.x.push(c1i.x[i]);
      c1Interp.y.push(c1i.y[i]);
      c1Interp.z.push(c1i.z[i]);
      c1Interp.I.push(c1i.I[i]);

      c2Interp.x.push(c2i.x[i]);
      c2Interp.y.push(c2i.y[i]);
      c2Interp.z.push(c2i.z[i]);
      c2Interp.I.push(c2i.I[i]);
    }
  }

  return {
    c1Interp,
    c2Interp
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
function shiftSuperSampledContourInPlace(c1i, c2i) {
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
      totalSquaredXYLengths +=
        (c1i.x[node] - c2i.x[itteration]) ** 2 +
        (c1i.y[node] - c2i.y[itteration]) ** 2;

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

    const xSpacing = (c.x[n + 1] - c.x[n]) / (nodesPerSegment[n] + 1);
    const ySpacing = (c.y[n + 1] - c.y[n]) / (nodesPerSegment[n] + 1);

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
  idx.sort(function(a, b) {
    return perimInterp[a] < perimInterp[b]
      ? -1
      : perimInterp[a] > perimInterp[b]
      ? 1
      : 0;
  });

  const perimIndSorted = [];

  for (let i = 0; i < perimInd.length; i++) {
    perimIndSorted.push(perimInd[idx[i]]);
  }

  const indiciesOfOriginPoints = perimIndSorted.reduce(function(
    arr,
    element,
    i
  ) {
    if (element === 1) arr.push(i);
    return arr;
  },
  []);

  const nodesPerSegment = [];

  for (let i = 0; i < indiciesOfOriginPoints.length - 1; i++) {
    nodesPerSegment.push(
      indiciesOfOriginPoints[i + 1] - indiciesOfOriginPoints[i]
    );
  }

  return nodesPerSegment;
}

function getIndicatorArray(contour3D, otherContour3D, interpPoints) {
  const perimInd = [];

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
      (contour3D.x[i] - contour3D.x[i - 1]) ** 2 +
        (contour3D.y[i] - contour3D.y[i - 1]) ** 2
    );

    cumulativePerimeter.push(cumulativePerimeter[i - 1] + lengthOfSegment);
  }

  return cumulativePerimeter;
}

function normalisedCumulativePerimeter(cumPerim) {
  const cumPerimNorm = [];

  for (let i = 0; i < cumPerim.length; i++) {
    cumPerimNorm.push(cumPerim[i] / cumPerim[cumPerim.length - 1]);
  }

  return cumPerimNorm;
}

function generateClosedContour3D(contour2D, z) {
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

function reverseIfAntiClockwise(contour) {
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
    console.log("anti-clockwise!");
    contour.x.reverse();
    contour.y.reverse();
  }
}

function getSumReducer(total, num) {
  return total + num;
}
