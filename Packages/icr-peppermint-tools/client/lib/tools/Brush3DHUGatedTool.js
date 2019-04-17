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

const floodFill = require("n-dimensional-flood-fill");

const BaseBrushTool = cornerstoneTools.import("base/BaseBrushTool");

export default class Brush3DHUGatedTool extends Brush3DTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: "Brush",
      configuration: {
        gate: "muscle",
        holeFill: 0.02, // Fill voids when smaller than this fraction of host region.
        strayRemove: 0.05 // Don't paint secondary objects smaller than this fraction of the primary.
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

    const t0 = performance.now();

    // TODO
    const filledGatedCircleArray = this._fillCircle(circle, gatedCircleArray);

    console.log(performance.now() - t0);

    return filledGatedCircleArray;

    //return gatedCircleArray;
  }

  _getEdgePixels(data) {
    const edgePixels = [];

    //this._tempPrintData(data);

    const xSize = data.length;
    const ySize = data[0].length;

    //first and last row add all of top and bottom.
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 0) {
        edgePixels.push([i, 0]);
        edgePixels.push([i, ySize - 1]);
      }
    }

    // all other rows - Find first circle member, and use its position to add
    // The first and last circle member of that row.
    for (let j = 1; j < ySize - 1; j++) {
      for (let i = 0; i < data.length; i++) {
        if (data[i][j] === 0) {
          edgePixels.push([i, j]);
          edgePixels.push([xSize - 1 - i, j]);

          break;
        }
      }
    }

    return edgePixels;
  }

  _fillCircle(circle, gatedCircleArray) {
    const config = this._configuration;
    const circleArray2D = [];

    const max = [circle[0][0], circle[0][1]];
    const min = [circle[0][0], circle[0][1]];

    for (let p = 0; p < circle.length; p++) {
      const [i, j] = circle[p];

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
        data[i][j] = -1;
      }
    }

    // fill circle in as not colored.
    for (let p = 0; p < circle.length; p++) {
      const i = circle[p][0] - min[0];
      const j = circle[p][1] - min[1];

      data[i][j] = 0;
    }

    const edgePixels = this._getEdgePixels(data);

    // fill gated region as color.
    for (let p = 0; p < gatedCircleArray.length; p++) {
      const i = gatedCircleArray[p][0] - min[0];
      const j = gatedCircleArray[p][1] - min[1];

      data[i][j] = 1;
    }

    //this._tempPrintData(data);

    // Define our getter for accessing the data structure.
    function getter(x, y) {
      return data[x][y];
    }

    for (let p = 0; p < edgePixels.length; p++) {
      const i = edgePixels[p][0];
      const j = edgePixels[p][1];

      if (data[i][j] === 0) {
        const result = floodFill({
          getter: getter,
          seed: [i, j]
        });

        //console.log(result);

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 2;
        }

        //this._tempPrintData(data);
      }
    }

    const filledGatedCircleArray = [];

    // TEMP

    const holes = [];
    const regions = [];

    // Find each hole and paint them 3.
    // Find contiguous volumes and paint them 4.
    for (let p = 0; p < circle.length; p++) {
      const i = circle[p][0] - min[0];
      const j = circle[p][1] - min[1];

      if (data[i][j] === 0) {
        const result = floodFill({
          getter: getter,
          seed: [i, j]
        });

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 3;
        }

        holes.push(flooded);
      } else if (data[i][j] === 1) {
        const result = floodFill({
          getter: getter,
          seed: [i, j]
        });

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 4;
        }

        regions.push(flooded);
      }
    }

    //this._tempPrintData(data);

    //console.log(regions);
    //console.log(holes);

    // Get size of largest region
    let largestRegionArea = 0;

    for (let i = 0; i < regions.length; i++) {
      if (regions[i].length > largestRegionArea) {
        largestRegionArea = regions[i].length;
      }
    }

    // Delete any region outside the `strayRemove` threshold.
    for (let r = 0; r < regions.length; r++) {
      const region = regions[r];
      if (region.length <= config.strayRemove * largestRegionArea) {
        for (let p = 0; p < region.length; p++) {
          data[region[p][0]][region[p][1]] = 2;
        }
      }
    }

    //this._tempPrintData(data);

    // Fill in any holes smaller than the `holeFill` threshold.
    for (let r = 0; r < holes.length; r++) {
      const hole = holes[r];
      if (hole.length <= config.holeFill * largestRegionArea) {
        for (let p = 0; p < hole.length; p++) {
          data[hole[p][0]][hole[p][1]] = 4;
        }
      }
    }

    //this._tempPrintData(data);

    //return gatedCircleArray;

    for (let i = 0; i < xSize; i++) {
      for (let j = 0; j < ySize; j++) {
        if (data[i][j] === 4) {
          filledGatedCircleArray.push([i + min[0], j + min[1]]);
        }
      }
    }

    //console.log(filledGatedCircleArray);

    return filledGatedCircleArray;

    // Now we have a filled square with a partially filled circle in the center.
  }

  // TEMP
  _tempPrintData(data) {
    for (let j = 0; j < data[0].length; j++) {
      const line = [];

      for (let i = 0; i < data.length; i++) {
        line.push(data[i][j]);
      }

      console.log(
        line
          .join(" ")
          .replace(/-1/g, "_")
          .replace(/2/g, "F") + `   ${j}`
      );
    }

    /*
    for (let i = 0; i < data.length; i++) {

      console.log(data[i].join(" ").replace(/2/g, "_"));
    }
    */
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
