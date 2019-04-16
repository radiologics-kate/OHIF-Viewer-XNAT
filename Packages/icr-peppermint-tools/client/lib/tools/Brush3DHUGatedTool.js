import {
  cornerstoneTools,
  cornerstone,
  cornerstoneMath
} from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import Brush3DTool from "./Brush3DTool.js";
import { icrXnatRoiSession, isModalOpen } from "meteor/icr:xnat-roi-namespace";

import brushMetadataIO from "../util/brushMetadataIO.js";
import gatedHU from "../util/gatedHU.js";

const brushModule = cornerstoneTools.store.modules.brush;
const getToolState = cornerstoneTools.getToolState;
const addToolState = cornerstoneTools.addToolState;
const { getCircle, drawBrushPixels } = cornerstoneTools.import(
  "util/brushUtils"
);
const BaseBrushTool = cornerstoneTools.import("base/BaseBrushTool");

export default class Brush3DHUGatedTool extends Brush3DTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: "Brush",
      configuration: {
        gate: "adipose"
      }
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.initialConfiguration = initialConfiguration;

    console.log(this);

    // Bind the strategies so that we can use `this`.
    this.strategies = {
      overlapping: this._overlappingStrategy.bind(this),
      nonOverlapping: this._nonOverlappingStrategy.bind(this)
    };

    this.touchDragCallback = this._startPaintingTouch.bind(this);
  }

  /**
   * Event handler for MOUSE_DOWN event.
   *
   * @override
   * @event
   * @param {Object} evt - The event.
   */
  preMouseDownCallback(evt) {
    if (evt.detail.event.shiftKey) {
      console.log("SHIFT!");
      this._setCustomGate(evt);
      return true;
    }

    this._startPainting(evt);

    return true;
  }

  _setCustomGate(evt) {
    const eventData = evt.detail;
    const { element, image } = eventData;
    const { rows, columns } = image;
    const { x, y } = eventData.currentPoints.image;
    const radius = brushModule.state.radius;
    const imagePixelData = image.getPixelData();
    const rescaleSlope = image.slope || 1;
    const rescaleIntercept = image.intercept || 1;

    const circle = getCircle(radius, rows, columns, x, y);

    // Initialise hi and lo as the first pixelValue in the circle.
    let lo = imagePixelData[circle[0][0] + circle[0][1] * rows];
    let hi = lo;

    for (let i = 0; i < circle.length; i++) {
      let pixelValue = imagePixelData[circle[i][0] + circle[i][1] * rows];

      pixelValue = pixelValue * rescaleSlope + rescaleIntercept;

      if (pixelValue < lo) {
        lo = pixelValue;
      }

      if (pixelValue > hi) {
        hi = pixelValue;
      }
    }

    console.log(lo, hi);

    this._configuration.gate = "custom";
    gatedHU.custom = [lo, hi];
  }

  _overlappingStrategy(evt) {
    const eventData = evt.detail;
    const { element, image } = eventData;
    const { rows, columns } = image;
    const { x, y } = eventData.currentPoints.image;
    let toolState = getToolState(
      element,
      BaseBrushTool.getReferencedToolDataName()
    );

    if (!toolState) {
      addToolState(element, BaseBrushTool.getReferencedToolDataName(), {});
      toolState = getToolState(
        element,
        BaseBrushTool.getReferencedToolDataName()
      );
    }

    const toolData = toolState.data;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = brushModule.state.radius;
    const pointerArray = this._gateCircle(
      image,
      getCircle(radius, rows, columns, x, y),
      this._configuration.gate,
      rows,
      columns
    );

    this._drawMainColor(eventData, toolData, pointerArray);
  }

  _nonOverlappingStrategy(evt) {
    const eventData = evt.detail;
    const { element, image } = eventData;
    const { rows, columns } = image;
    const { x, y } = eventData.currentPoints.image;

    let toolState = getToolState(
      element,
      BaseBrushTool.getReferencedToolDataName()
    );

    if (!toolState) {
      addToolState(element, BaseBrushTool.getReferencedToolDataName(), {});
      toolState = getToolState(
        element,
        BaseBrushTool.getReferencedToolDataName()
      );
    }

    const toolData = toolState.data;
    const segmentationIndex = brushModule.state.drawColorId;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = brushModule.state.radius;

    const pointerArray = this._gateCircle(
      image,
      getCircle(radius, rows, columns, x, y),
      this._configuration.gate,
      rows,
      columns
    );

    const numberOfColors = BaseBrushTool.getNumberOfColors();

    // If there is brush data in this region for other colors, delete it.
    for (let i = 0; i < numberOfColors; i++) {
      if (i === segmentationIndex) {
        continue;
      }

      if (toolData[i] && toolData[i].pixelData) {
        drawBrushPixels(pointerArray, toolData[i], columns, true);
        toolData[i].invalidated = true;
      }
    }

    this._drawMainColor(eventData, toolData, pointerArray);
  }

  _gateCircle(image, circle, gate, rows, columns) {
    const imagePixelData = image.getPixelData();
    const gateValues = gatedHU[gate];

    const rescaleSlope = image.slope || 1;
    const rescaleIntercept = image.intercept || 1;

    const gatedCircleArray = [];

    for (let i = 0; i < circle.length; i++) {
      let pixelValue = imagePixelData[circle[i][0] + circle[i][1] * rows];

      pixelValue = pixelValue * rescaleSlope + rescaleIntercept;

      if (pixelValue >= gateValues[0] && pixelValue <= gateValues[1]) {
        gatedCircleArray.push(circle[i]);
      }
    }

    return gatedCircleArray;
  }

  _drawMainColor(eventData, toolData, pointerArray) {
    const shouldErase = this._isCtrlDown(eventData);
    const columns = eventData.image.columns;
    const segmentationIndex = brushModule.state.drawColorId;

    if (shouldErase && !toolData[segmentationIndex]) {
      // Erase command, yet no data yet, just return.
      return;
    }

    if (!toolData[segmentationIndex]) {
      toolData[segmentationIndex] = {};
    }

    if (!toolData[segmentationIndex].pixelData) {
      const enabledElement = cornerstone.getEnabledElement(eventData.element);
      const enabledElementUID = enabledElement.uuid;

      // Clear cache for this color to avoid flickering.
      const imageBitmapCacheForElement = brushModule.getters.imageBitmapCacheForElement(
        enabledElementUID
      );

      if (imageBitmapCacheForElement) {
        imageBitmapCacheForElement[segmentationIndex] = null;
      }

      // Add a new pixelData array.
      toolData[segmentationIndex].pixelData = new Uint8ClampedArray(
        eventData.image.width * eventData.image.height
      );
    }

    const toolDataI = toolData[segmentationIndex];

    // Draw / Erase the active color.
    drawBrushPixels(pointerArray, toolDataI, columns, shouldErase);

    toolDataI.invalidated = true;
  }

  _isCtrlDown(eventData) {
    return (eventData.event && eventData.event.ctrlKey) || eventData.ctrlKey;
  }
}
