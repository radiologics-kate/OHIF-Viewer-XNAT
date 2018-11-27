import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { Polygon } from '../classes/Polygon.js';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

const modules = cornerstoneTools.store.modules;

export class RoiExtractor {

  constructor (seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._volumes = [];
    this._freehand3DStore = modules.freehand3D;
  };

  hasVolumesToExtract () {
    const workingStructureSet = this._freehand3DStore.getters.structureSet(this._seriesInstanceUid);

    if (!workingStructureSet) {
      return false;
    }

    const ROIContourCollection = workingStructureSet.ROIContourCollection;

    let hasVolumes = false;

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (ROIContourCollection[i] && ROIContourCollection[i].polygonCount > 0) {
        this._volumes[i] = [];
        hasVolumes = true;
      }
    }

    return hasVolumes;
  }

  extractVolumes (exportMask) {
    console.log('==== extracting Volumes ====')
    console.log('== export mask ==');
    console.log(exportMask);
    console.log('== seriesInstanceUid ==');
    console.log(this._seriesInstanceUid);

    const toolStateManager = globalToolStateManager.saveToolState();

    console.log(toolStateManager);

    Object.keys(toolStateManager).forEach( elementId => {
      // Only get polygons from this series
      if ( this._getSeriesInstanceUidFromImageId(elementId) === this._seriesInstanceUid ) {
        // grab the freehand tool for this DICOM instance
        console.log('== elementId ==');
        console.log(elementId);

        const freehandToolState = toolStateManager[elementId].freehandMouse;

        if (freehandToolState) {
          // Append new ROIs to polygon list
          this._getNewPolygonsInInstance(freehandToolState.data, elementId, exportMask);
        }
      }
    });

    return this._volumes;
  }

  _getNewPolygonsInInstance (toolData, elementId, exportMask) {
    console.log('_getNewPolygonsInInstance');

    for ( let i = 0; i < toolData.length; i++ ) {
      const data = toolData[i];

      const ROIContourIndex = this._freehand3DStore.getters.ROIContourIndex(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );
      const referencedStructureSet = data.referencedStructureSet;

      // Check to see if the ROIContour referencing this polygon is eligble for export.
      if (referencedStructureSet.uid === 'DEFAULT' && exportMask[ROIContourIndex]) {
        this._appendPolygon(data, elementId, ROIContourIndex);
      }
    }
  }

  _appendPolygon (data, imageId, ROIContourIndex) {
    console.log(`_appendPolygon ${ROIContourIndex}`);
    const ROIContourName = data.referencedROIContour.name;
    const sopInstanceUid = this._getSOPInstanceUidFromImageId(imageId);
    const frameNumber = this._getFrameNumber(imageId);

    const polygon = new Polygon(
      data.handles,
      sopInstanceUid,
      this._seriesInstanceUid,
      'DEFAULT',
      data.ROIContourUid,
      data.uid,
      frameNumber,
    );

    this._volumes[ROIContourIndex].push(polygon);
    console.log('appended ROI');
  }

  _getSOPInstanceUidFromImageId (imageId) {
    const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
    return metaData.instance.sopInstanceUid;
  }

  _getSeriesInstanceUidFromImageId (imageId) {
    const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
    return metaData.series.seriesInstanceUid;
  }

  _getFrameNumber(imageId) {
    console.log('RoiExtractor._getFrameNumber');
    console.log('imageId:');
    console.log(imageId)

    if (imageId.includes("frame=")) {
      const frameArray = imageId.split("frame=");

      console.log(`multi, returning ${String( Number(frameArray[1]) + 1 )}`);
      return String( Number(frameArray[1]) + 1 );
    }

    console.log('single, returning 1');

    return "1";
  }

}
