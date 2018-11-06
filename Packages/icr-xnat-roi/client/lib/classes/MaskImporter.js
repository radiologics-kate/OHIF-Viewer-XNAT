import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;


export class MaskImporter {

  constructor (stackToolState, dimensions) {
    this._stackToolState = stackToolState;
    this._dimensions = dimensions;

    const colorMapId = cornerstoneTools.store.modules.brush.state.colorMapId;
    const colormap = cornerstone.colors.getColormap(colorMapId);
    this._numberOfColors = colormap.getNumberOfColors();
  }

  import (masks) {
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
