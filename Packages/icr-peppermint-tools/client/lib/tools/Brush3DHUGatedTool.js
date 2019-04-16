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

const convexHull = require("graham-scan-convex-hull");

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
    let lo =
      imagePixelData[circle[0][0] + circle[0][1] * rows] * rescaleSlope +
      rescaleIntercept;
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

    //const t0 = performance.now();

    // TODO
    //this._fillCircle(circle, gatedCircleArray);

    //console.log(performance.now() - t0);

    return gatedCircleArray;
  }

  _fillCircle(circle, gatedCircleArray) {
    const edgeVoxels = this._giftWrapCircle(circle);
    const circleArray2D = [];

    const max = [edgeVoxels[0][0], edgeVoxels[0][1]];
    const min = [edgeVoxels[0][0], edgeVoxels[0][1]];

    for (let p = 0; p < edgeVoxels.length; p++) {
      const [i, j] = edgeVoxels[p];

      if (i > max[0]) {
        max[0] = i;
      } else if (i < min[0]) {
        min[0] = i;
      }

      if (j > max[1]) {
        max[1] = j;
      } else if (j < min[1]) {
        min[1] = j;
      }
    }

    //console.log(min, max);

    const xSize = max[0] - min[0] + 1;
    const ySize = max[1] - min[1] + 1;

    //console.log(xSize, ySize);

    const data = [];

    // Fill in square as third color.
    for (let i = 0; i < xSize; i++) {
      data[i] = [];

      for (let j = 0; j < ySize; j++) {
        data[i][j] = 2;
      }
    }

    // fill circle in as not colored.
    for (let p = 0; p < circle.length; p++) {
      const i = circle[p][0] - min[0];
      const j = circle[p][1] - min[1];

      data[i][j] = 0;
    }

    // fill gated region as color.
    for (let p = 0; p < gatedCircleArray.length; p++) {
      const i = gatedCircleArray[p][0] - min[0];
      const j = gatedCircleArray[p][1] - min[1];

      data[i][j] = 1;
    }

    //console.log(data);

    // Now we have a filled square with a partially filled circle in the center.
  }

  _giftWrapCircle(circle) {
    const radius = brushModule.state.radius;

    if (radius < 5) {
      return convexHull(circle);
    }

    // We know the collection of points is a circle, so remove most of them, then do a graham scan to get only the edge voxels.
    const com = [0, 0];

    for (let i = 0; i < circle.length; i++) {
      com[0] += circle[i][0];
      com[1] += circle[i][1];
    }

    com[0] = com[0] / circle.length;
    com[1] = com[1] / circle.length;

    const edgeFew = [];

    // Ignore all central points for giftwrap.
    const ignoreRadius = radius - 2;

    for (let i = 0; i < circle.length; i++) {
      const dist = (circle[i][0] - com[0]) ** 2 + (circle[i][1] - com[1]) ** 2;
      if (dist > ignoreRadius ** 2) {
        edgeFew.push(circle[i]);
      }
    }

    return convexHull(edgeFew);
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
