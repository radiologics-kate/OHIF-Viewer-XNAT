import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * Rescales imported polygons based on imported file type and imagePlane properties.
 *
 * @author JamesAPetts
 * @param imageId
 * @param imagePlane
 */
export function rescaleImportedPolygons (imageId, imagePlane) {
  const imageIdToolState = globalToolStateManager.saveImageIdToolState (imageId);

  if ( imageIdToolState === undefined || imageIdToolState.freehand === undefined ) {
    return;
  }

  const toolData = imageIdToolState.freehand.data;
  let rescaledPolygons = false;

  for ( let i = 0; i < toolData.length; i++ ) {
    if (toolData[i].toBeScaled) {
      scaleHandles(toolData[i], imagePlane);
      toolData[i].toBeScaled = false;
      rescaledPolygons = true;
    }
  }

  // If rescaled, update view.
  if (rescaledPolygons) {
    globalToolStateManager.restoreImageIdToolState(imageId, imageIdToolState);
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    cornerstone.updateImage(element);
  }
}

function scaleHandles (toolData, imagePlane) {
  switch (toolData.toBeScaled) {
    case 'AIM':
      // No scaling, TwoDimensionSpatialCoordinates in AIM are already stored in pixel coordinates.
      break;
    case 'RTSTRUCT':
      try {
        scaleRtStructContourData(toolData, imagePlane);
      } catch (err) {
        console.error(err.message);
      };
      break;
    default:
        console.error(`Unrecognised scaling type: ${toolData.toBeScaled}`);
        break;
  };
}

function scaleRtStructContourData (toolData, imagePlane) {
  // See Equation C.7.6.2.1-1 of the DICOM standard

  const X = [ imagePlane.rowCosines.x, imagePlane.rowCosines.y, imagePlane.rowCosines.z ];
  const Y = [ imagePlane.columnCosines.x, imagePlane.columnCosines.y, imagePlane.columnCosines.z ];
  const S = [ imagePlane.imagePositionPatient.x, imagePlane.imagePositionPatient.y, imagePlane.imagePositionPatient.z ];
  const deltaI = imagePlane.rowPixelSpacing;
  const deltaJ = imagePlane.columnPixelSpacing;

  // 9 sets of simulataneous equations to choose from, choose which set to solve
  // Based on the largest component of each direction cosine.
  // This avoids NaNs or floating point errors caused by dividing by very small numbers and ensures a safe mapping.

  const ci = { // Index of max elements in X and Y
    ix: X.indexOf(Math.max(...X)),
    iy: Y.indexOf(Math.max(...Y))
  };

  // Sanity Check
  const directionCosineMagnitude = {
    x: Math.pow(X[0],2) + Math.pow(X[1],2) + Math.pow(X[2],2),
    y: Math.pow(Y[0],2) + Math.pow(Y[1],2) + Math.pow(Y[2],2)
  };

  if ( directionCosineMagnitude.x < 0.99 || directionCosineMagnitude.y < 0.99 ) {
    throw Error(
      `Direction cosines do not sum to 1 in quadrature. There is likely a mistake in the DICOM metadata.`
      + `directionCosineMagnitudes: ${directionCosineMagnitude.x}, ${directionCosineMagnitude.y}`
    );
  }

  // Fill in elements that won't change between points
  const c = [ undefined, Y[ci.ix], X[ci.ix], undefined, X[ci.iy], Y[ci.iy] ];

  for ( let pointI = 0; pointI < toolData.handles.length; pointI++ ) {

    // Subtract imagePositionPatient from the coordinate
    const r = [
      toolData.handles[pointI].x - S[0],
      toolData.handles[pointI].y - S[1],
      toolData.handles[pointI].z - S[2],
    ];

    // Set the variable terms in c.
    c[0] = r[ci.ix];
    c[3] = r[ci.iy];

    // General case: Solves the two choosen simulataneous equations to go from the patient coordinate system to the imagePlane.
    const i = ( c[0] - c[1]*c[3]/c[5] )  /  ( c[2]*deltaI * ( 1 - (c[1]*c[4])/(c[2]*c[5]) ) );
    const j = ( c[3] - c[4]*i*deltaI )  /  ( c[5]*deltaJ );

    toolData.handles[pointI].x = i;
    toolData.handles[pointI].y = j;
    toolData.handles[pointI].z = 0;
  }

  return;
}
