import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

const BaseBrushTool = cornerstoneTools.import('base/BaseBrushTool');

const modules = cornerstoneTools.store.modules;

export class MaskExtractor {

  constructor (seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._masks = [];
    this._3DMasks = [];

    const numberOfColors = BaseBrushTool.getNumberOfColors();

    for (let i = 0; i < numberOfColors; i++) {
      this._masks.push([]);
    }

    this._toolStateManager = globalToolStateManager.saveToolState();

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    const image = cornerstone.getImage(element);

    this._element = element;
    this._dimensions = {
      rows: image.rows,
      columns: image.columns
    };
  };

  extractMasks() {


    const stackToolState = cornerstoneTools.getToolState(this._element, 'stack');

    const imageIds = stackToolState.data[0].imageIds;

    this._numberOfSlices = imageIds.length;

    for (let i = 0; i < imageIds.length; i++) {
      const brushState = this._getImageBrushState(imageIds[i]);

      if (brushState) {
        this._appendBrushState(brushState.data, i);
      }

    }

    console.log(this._masks);

    this._constructDataCubes();

    console.log(this._3DMasks);
  }

  _getImageBrushState (imageId) {

    const imageToolState = this._toolStateManager[imageId];

    if (!imageToolState) {
      return;
    }

    return imageToolState.brush;
  }

  _appendBrushState (brushData, frameNumber) {
    for (let i = 0; i < brushData.length; i++) {
      const pixelData = brushData[i].pixelData;

      if (pixelData) {
        this._masks[i][frameNumber] = pixelData;
      }
    }
  }

  _constructDataCubes() {
    const masks = this._masks;

    for (let i = 0; i < masks.length; i++) {
      const mask = masks[i];
      console.log(mask);

      const hasData = mask.some((element) => element !== undefined);

      if (hasData) {
        this._constructOneDataCube(mask, i);
      }
    }
  }

  _constructOneDataCube (mask, maskIndex) {
    console.log('_constructOneDataCube');
    const sliceLength = this._dimensions.rows * this._dimensions.columns;

    const dataCube = new Uint8ClampedArray(
      sliceLength * this._numberOfSlices
    );

    for (let i = 0; i < this._numberOfSlices; i++) {
      if (mask[i]) {
        const start = i * sliceLength;

        for (pixel = 0; pixel < mask[i].length; pixel++) {
          dataCube[start+pixel] = mask[i][pixel]
        }
      }
    }

    this._3DMasks[maskIndex] = dataCube;
  }

}
