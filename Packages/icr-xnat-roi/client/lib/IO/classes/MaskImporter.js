import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import NIFTIReader from "./NIFTIReader.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
const dcmjs = require("dcmjs");

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

const brushModule = cornerstoneTools.store.modules.brush;

export default class MaskImporter {
  constructor() {
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;
    const stackToolState = cornerstoneTools.getToolState(element, "stack");
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

  /**
   * importDICOMSEG - Imports a DICOM SEG file to CornerstoneTools.
   *
   * @param  {ArrayBuffer} dicomSegArrayBuffer An arraybuffer of the DICOM SEG object.
   * @param  {string} collectionName      The name of the ROICollection.
   * @param  {string} collectionLabel     The label of the ROICollection.
   * @returns {null}                     description
   */
  importDICOMSEG(dicomSegArrayBuffer, collectionName, collectionLabel) {
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    const stackToolState = cornerstoneTools.getToolState(element, "stack");

    const imageIds = stackToolState.data[0].imageIds;

    const {
      toolState,
      segMetadata
    } = dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
      imageIds,
      dicomSegArrayBuffer,
      cornerstone.metaData
    );

    this._clearMaskMetadata();
    this._clearGlobalBrushToolState(
      globalToolStateManager.saveToolState(),
      imageIds
    );
    this._addBrushToolStateToGlobalToolState(toolState);

    const seriesInstanceUid = this._seriesInfo.seriesInstanceUid;

    for (let i = 0; i < segMetadata.data.length; i++) {
      brushModule.setters.metadata(seriesInstanceUid, i, segMetadata.data[i]);
    }
  }

  /**
   * _addBrushToolStateToGlobalToolState - Merges the imported toolstate to the
   * global tool state.
   *
   * @param  {object} brushToolState The imported toolState.
   * @returns {null}
   */
  _addBrushToolStateToGlobalToolState(brushToolState) {
    const globalToolState = globalToolStateManager.saveToolState();

    Object.keys(brushToolState).forEach(imageId => {
      if (!globalToolState[imageId]) {
        globalToolState[imageId] = {};
        globalToolState[imageId].brush = {};
      } else if (!globalToolState[imageId].brush) {
        globalToolState[imageId].brush = {};
      }

      globalToolState[imageId].brush.data = brushToolState[imageId].brush.data;
    });
  }

  /**
   * importNIFTI - Imports a NIFTI file to CornerstoneTools.
   *
   * @param  {ArrayBuffer} niftyArrayBuffer An arraybuffer of the NIFTI object.
   * @param  {string} collectionName      The name of the ROICollection.
   * @param  {string} collectionLabel     The label of the ROICollection.
   * @returns {null}                     description
   */
  importNIFTI(niftyArrayBuffer, collectionName, collectionLabel) {
    this._clearMaskMetadata();

    const niftiReader = new NIFTIReader(this._seriesInfo, collectionName);

    const masks = niftiReader.read(
      niftyArrayBuffer,
      this._stackToolState,
      this._dimensions
    );

    this._addNIFTIMasksToCornerstone(masks);
  }

  /**
   * _clearMaskMetadata - Clears existing mask metadata for this series.
   *
   * @returns {null}
   */
  _clearMaskMetadata() {
    for (let i = 0; i < this._numberOfColors; i++) {
      brushModule.setters.metadata(
        this._seriesInfo.seriesInstanceUid,
        i,
        undefined
      );
    }
  }

  /**
   * _clearGlobalBrushToolState - Clears existing mask data from the toolState.
   *
   * @param  {object} toolState The toolState to clear brush tool state from.
   * @param  {string[]} imageIds  An array of imageIds.
   * @returns {null}
   */
  _clearGlobalBrushToolState(toolState, imageIds) {
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];

      if (toolState[imageId] && toolState[imageId].brush) {
        delete toolState[imageId].brush;
      }
    }
  }

  /**
   * _addNIFTIMasksToCornerstone -  Cycles through masks and imports pixelData
   *  of each image to the cornerstoneTools brush toolState.
   *
   * @param  {object[]} masks The masks extracted by the NIFTIReader.
   * @returns {null}
   */
  _addNIFTIMasksToCornerstone(masks) {
    const stackToolState = this._stackToolState;
    const dimensions = this._dimensions;
    const sliceLength = dimensions.sliceLength;

    const imageIds = stackToolState.data[0].imageIds;
    const toolState = globalToolStateManager.saveToolState();

    this._initialiseBrushStateNifti(toolState, imageIds);

    for (let i = 0; i < masks.length; i++) {
      const mask = masks[i];

      for (let j = 0; j < dimensions.slices; j++) {
        const pixelData = new Uint8ClampedArray(sliceLength);

        for (let k = 0; k < pixelData.length; k++) {
          pixelData[k] = mask[j * sliceLength + k] ? 1 : 0;
        }

        const imageId = imageIds[j];

        toolState[imageId].brush.data[i] = {
          pixelData,
          invalidated: true
        };
      }
    }

    globalToolStateManager.restoreToolState(toolState);

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    cornerstone.updateImage(element);
  }

  /**
   * _initialiseBrushStateNifti - Initialises the brush state for NIFTI import.
   *
   * @param  {object} toolState The toolState.
   * @param  {string[]} imageIds  An array of imageIds.
   * @returns {null}
   */
  _initialiseBrushStateNifti(toolState, imageIds) {
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
