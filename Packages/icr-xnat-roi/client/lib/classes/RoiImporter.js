import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { Polygon } from '../classes/Polygon.js';
import { AIMReader } from '../classes/AIMReader.js';
import { RTStructReader } from '../classes/RTStructReader.js';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

const modules = cornerstoneTools.store.modules;

const freehandToolDataType = 'freehandMouse';

export class RoiImporter {

  constructor (seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._sopInstanceUidToImageIdMap = this._setSopInstanceUidToImageIdMap();

    this._freehand3DStore = modules.freehand3D;
  }

  importAIMfile (aimDoc, roiCollectionName, roiCollectionLabel) {
    const aimReader = new AIMReader(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel
    );
    this._addPolygonsToToolStateManager(aimReader.polygons, 'AIM');
  }

  importRTStruct (rtStructArrayBuffer, roiCollectionName, roiCollectionLabel) {
    const rtStructReader = new RTStructReader(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel
    );
    this._addPolygonsToToolStateManager(rtStructReader.polygons, 'RTSTRUCT');
  }

  _addPolygonsToToolStateManager (polygons, importType) {
    const toolStateManager = globalToolStateManager.saveToolState();

    for ( let i = 0; i < polygons.length; i++ ) {
      const polygon = polygons[i];
      const sopInstanceUid = polygon.sopInstanceUid;
      const correspondingImageId = this._sopInstanceUidToImageIdMap[sopInstanceUid];

      this._addOnePolygonToToolStateManager(polygon, toolStateManager, correspondingImageId, importType);
    }

    this._refreshToolStateManager(toolStateManager);
  }

  _polygonNotAlreadyPresent (freehandToolData, newPolygonUuid) {

    for ( let i = 0; i < freehandToolData.length; i++ ) {
      if ( freehandToolData[i].uuid === newPolygonUuid ) {
        return false;
      }
    }

    return true;
  }

  _addOnePolygonToToolStateManager (polygon, toolStateManager, correspondingImageId, importType) {
    if (!correspondingImageId) {
      // ROI for image which is not loaded
      return;
    }

    // Point to correct imageId if multiframe Image
    correspondingImageId = this._modifyImageIdIfMultiframe(correspondingImageId, polygon);

    this._addImageToolIfNotPresent(toolStateManager, correspondingImageId);

    const freehandToolData = toolStateManager[correspondingImageId][freehandToolDataType].data;
    if (this._polygonNotAlreadyPresent(freehandToolData, polygon.uid)) {
      const data = polygon.getFreehandToolData(importType);

      this._freehand3DStore.setters.incrementPolygonCount(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );
      freehandToolData.push(data);
    }
  }

  _addImageToolIfNotPresent (toolStateManager, imageId) {
    // Add freehand tools to toolStateManager if no toolState for imageId
    if (!toolStateManager[imageId]) {
      toolStateManager[imageId] = {};
      toolStateManager[imageId][freehandToolDataType] = {};
      toolStateManager[imageId][freehandToolDataType].data = [];
    } else if (!toolStateManager[imageId][freehandToolDataType]) {
      toolStateManager[imageId][freehandToolDataType] = {};
      toolStateManager[imageId][freehandToolDataType].data = [];
    }
  }

  _refreshToolStateManager (toolStateManager) {
    // Load the updated toolStateManager

    globalToolStateManager.restoreToolState(toolStateManager);

    // Refresh the visible element
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    OHIF.viewer.metadataProvider.updateMetadata(cornerstone.getImage(element));
    cornerstone.updateImage(element);
  }

  _setSopInstanceUidToImageIdMap () {
    const sopInstanceUidToImageIdMap = {};
    // Get the imageId of each sopInstance in the series
    const studies = OHIF.viewer.StudyMetadataList.all();

    for ( let i = 0; i < studies.length; i++ ) {

      const series = studies[i].getSeriesByUID(this._seriesInstanceUid);
      if ( series !== undefined ) {
        const instanceCount = series.getInstanceCount();

        for ( let j = 0; j < instanceCount; j++ ) {
          const instance = series.getInstanceByIndex(j);
          const imageId = instance.getImageId();
          const sopInstanceUid = instance.sopInstanceUID;
          sopInstanceUidToImageIdMap[sopInstanceUid] = imageId;
        }
      }
    }

    return sopInstanceUidToImageIdMap;
  }


  _modifyImageIdIfMultiframe (correspondingImageId, polygon) {

    if (!correspondingImageId.includes("frame=")) {
      //single frame, return unchanged Id
      return correspondingImageId;
    }

    const frameArray = correspondingImageId.split("frame=");
    const correctedFrameNumber = Number(polygon.frameNumber) - 1;

    return `${frameArray[0]}frame=${correctedFrameNumber}`;
  }


}
