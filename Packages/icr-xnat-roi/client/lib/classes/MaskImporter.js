import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { DICOMSEGReader } from './DICOMSEGReader.js';
import { NIFTIReader } from './NIFTIReader.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

const brushModule = cornerstoneTools.store.modules.brush;


export class MaskImporter {

  constructor () {
    // Get stackToolState // TODO -> Make this into a function somewhere else as
    // Both import and export use it.
    //
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;
    const stackToolState = cornerstoneTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;
    const image = cornerstone.getImage(element);

    const dimensions = {
      rows: image.rows,
      columns: image.columns,
      slices: imageIds.length
    };

    dimensions.sliceLength = dimensions.rows * dimensions.columns;
    dimensions.cube = dimensions.sliceLength * dimensions.slices;

    this._stackToolState = stackToolState;
    this._dimensions = dimensions;
    this._seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();

    const colorMapId = cornerstoneTools.store.modules.brush.state.colorMapId;
    const colormap = cornerstone.colors.getColormap(colorMapId);

    this._numberOfColors = colormap.getNumberOfColors();

  }

  importDICOMSEG (dicomSegArrayBuffer, collectionName, collectionLabel) {
    this._clearMaskMetadata();

    const dicomSegReader = new DICOMSEGReader(this._seriesInfo);

    const masks = dicomSegReader.read(
      dicomSegArrayBuffer,
      this._stackToolState,
      this._dimensions
    );

    console.log(masks);

    this._import(masks);
  }

  importNIFTI (niftyArrayBuffer, collectionName, collectionLabel) {
    this._clearMaskMetadata();

    const niftiReader = new NIFTIReader(this._seriesInfo, collectionName);

    const masks = niftiReader.read(
      niftyArrayBuffer,
      this._stackToolState,
      this._dimensions
    );

    console.log(masks);

    this._import(masks);
  }

  _clearMaskMetadata() {
    for (let i = 0; i < this._numberOfColors; i++) {
      brushModule.setters.metadata(
        this._seriesInfo.seriesInstanceUid,
        i,
        undefined
      );
    }
  }

  _import (masks) {
    const stackToolState = this._stackToolState;
    const dimensions = this._dimensions;
    const sliceLength = dimensions.sliceLength;

    // Cycle through masks and import pixelData of each image to
    // The cornerstoneTools brush toolState.

    const imageIds = stackToolState.data[0].imageIds;
    const toolState = globalToolStateManager.saveToolState();

    this._initialiseBrushState(toolState, imageIds);

    for (let i = 0; i < masks.length; i++) {
      const mask = masks[i];

      for (let j = 0; j < dimensions.slices; j++) {

        const pixelData = new Uint8ClampedArray(
          sliceLength
        );

        for (let k = 0; k < pixelData.length; k++) {
          pixelData[k] = mask[j * sliceLength + k] ? 1 : 0;
        }

        //mask.slice(j * sliceLength, (j+1) * sliceLength)

        const imageId = imageIds[j];

        toolState[imageId].brush.data[i] = {
          pixelData,
          invalidated: true
        };


      }
    }

    globalToolStateManager.restoreToolState(toolState);

    console.log(toolState);

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    cornerstone.updateImage(element);
  }

  _initialiseBrushState (toolState, imageIds) {
    const dimensions = this._dimensions;

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];

      if (!toolState[imageId]) {
        toolState[imageId] = {};
        toolState[imageId].brush = {};
      } else if (!toolState[imageId].brush) {
        toolState[imageId].brush = {};
      }

      toolState[imageId].brush.data = [];

      const brushData = toolState[imageId].brush.data;


      for (let j = 0; j < this._numberOfColors; j++) {
        brushData.push({});
      }
    }
  }



}
