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

const MODES = {
  OVERLAPPING: "overlapping",
  NON_OVERLAPPING: "nonOverlapping"
};

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
        gate: "fat"
      },
      strategies: {
        overlapping: _overlappingStrategy,
        nonOverlapping: _nonOverlappingStrategy
      }
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.initialConfiguration = initialConfiguration;

    // Bind the strategies so that we can use `this`.
    this.strategies = {
      overlapping: _overlappingStrategy.bind(this),
      nonOverlapping: _nonOverlappingStrategy.bind(this)
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
}

function _overlappingStrategy(evt) {
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
  const pointerArray = gateCircle(
    image,
    getCircle(radius, rows, columns, x, y),
    this._configuration.gate,
    rows,
    columns
  );

  _drawMainColor(eventData, toolData, pointerArray);
}

function _nonOverlappingStrategy(evt) {
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

  const pointerArray = gateCircle(
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

  _drawMainColor(eventData, toolData, pointerArray);
}

function gateCircle(image, circle, gate, rows, columns) {
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

function _drawMainColor(eventData, toolData, pointerArray) {
  const shouldErase = _isCtrlDown(eventData);
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

function _isCtrlDown(eventData) {
  return (eventData.event && eventData.event.ctrlKey) || eventData.ctrlKey;
}

// TODO -> This is the list from wikipedia, but there are lots of
// Conflicting ranges in various literature. Which one to use?
const gatedHU = {
  //fat: [-120, -90],
  fat: [-150, -50],
  softTissueContrastCT: [100, 300],
  boneCancellous: [300, 400],
  boneCortical: [1800, 1900],
  subduralHemotomaFirstHours: [75, 100],
  subduralHemotomaAfter3Days: [65, 85],
  subduralHemotoma10To14Days: [35, 40],
  bloodUnclotted: [13, 50],
  bloodClotted: [50, 75],
  pleuralEffusionTransudate: [2, 15],
  pleuralEffusionExudate: [4, 33],
  chyle: [-31, -29], // TODO -> -30 on Wikipedia
  water: [-1, 1], // TODO -> water is defined to be zero, so what range should I allow.
  urine: [-5, 15],
  bile: [-5, 15],
  csf: [14, 16], // TODO -> +15 on Wikipedia
  mucus: [0, 130],
  lung: [-700, -600],
  kidney: [20, 45],
  liver: [54, 66],
  lymphNodes: [10, 20],
  muscle: [35, 55],
  thymusChild: [20, 40],
  thymusAdult: [20, 120],
  whiteMatter: [20, 30],
  greyMatter: [37, 45],
  gallstoneCholesterol: [30, 100],
  gallstoneBilirubin: [90, 120],
  custom: [0, 0]
};
