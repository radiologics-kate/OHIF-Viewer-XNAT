import { cornerstoneTools, cornerstoneMath } from 'meteor/ohif:cornerstone';
import generateUID from '../util/generateUID.js';
import { OHIF } from 'meteor/ohif:core';
import { createNewVolume, setVolumeName } from '../util/freehandNameIO.js';

import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

// Cornerstone 3rd party dev kit imports
const {
  insertOrDelete,
  freehandArea,
  calculateFreehandStatistics,
  freehandIntersect,
  FreehandHandleData
} = cornerstoneTools.import('util/freehandUtils');
const draw = cornerstoneTools.import('drawing/draw');
const drawJoinedLines = cornerstoneTools.import('drawing/drawJoinedLines');
const drawHandles = cornerstoneTools.import('drawing/drawHandles');
const drawLinkedTextBox = cornerstoneTools.import('drawing/drawLinkedTextBox');
const moveHandleNearImagePoint = cornerstoneTools.import('manipulators/moveHandleNearImagePoint');
const getNewContext = cornerstoneTools.import('drawing/getNewContext');
const FreehandMouseTool = cornerstoneTools.FreehandMouseTool;
const modules = cornerstoneTools.store.modules;
const toolColors = cornerstoneTools.toolColors;
const numbersWithCommas = cornerstoneTools.import('util/numbersWithCommas');
const pointInsideBoundingBox = cornerstoneTools.import('util/pointInsideBoundingBox');


export default class Freehand3DMouseTool extends FreehandMouseTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: 'FreehandMouse',
      supportedInteractionTypes: ['Mouse'],
      configuration: defaultFreehandConfiguration()
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.configuration.alwaysShowHandles = false;

    this._freehand3DStore  = modules.freehand3D;
  }

  /**
   * Create the measurement data for this tool.
   * @override @public @method
   *
   * @param {object} eventData
   * @returns {object} measurementData
   */
  createNewMeasurement (eventData) {
    const freehand3DStore = this._freehand3DStore;
    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;

    if (!goodEventData) {
      console.error(
        `required eventData not supplied to tool ${
          this.name
        }'s createNewMeasurement`
      );

      return;
    }

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    const referencedStructureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid,
      'DEFAULT'
    );
    const referencedROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    const measurementData = {
      uid: generateUID(),
      seriesInstanceUid,
      structureSetUid: 'DEFAULT',
      ROIContourUid: referencedROIContour.uid,
      referencedROIContour,
      referencedStructureSet,
      visible: true,
      active: true,
      invalidated: true,
      handles: []
    };

    measurementData.handles.textBox = {
      active: false,
      hasMoved: false,
      movesIndependently: false,
      drawnIndependently: true,
      allowedOutsideImage: true,
      hasBoundingBox: true
    };

    freehand3DStore.setters.incrementPolygonCount(
      seriesInstanceUid,
      'DEFAULT',
      referencedROIContour.uid
    );

    return measurementData;
  }


  /**
   * Event handler for called by the mouseDownActivate event, if tool is active and
   * the event is not caught by mouseDownCallback.
   * @override
   *
   * @event
   * @param {Object} evt - The event.
   */
  async addNewMeasurement (evt, interactionType) {
    const eventData = evt.detail;
    const config = this.configuration;
    const freehand3DStore = this._freehand3DStore;

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const activeROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    if (activeROIContour === undefined || activeROIContour === null) {
      createNewVolume(seriesInstanceUid);
      preventPropagation(evt);

      return;
    }

    this._checkVolumeName(seriesInstanceUid).then(() => {
      this._drawing = true;

      this._startDrawing(eventData);
      this._addPoint(eventData);
      preventPropagation(evt);
    }).catch((error) => {
      console.log(error);
      console.log('failure');
      preventPropagation(evt);
    });
  }

  /**
   * Checks that the volume name is set, and calls external library to let the
   * user enter a name if the volume is unnamed.
   * @async @private @method
   *
   * @param {string} seriesInstanceUid The uid of the series.
   * @returns {Promise} A promise that will resolve if the name exists at time of
   * functional call and reject if it doesn't.
   */
  async _checkVolumeName (seriesInstanceUid) {
    const freehand3DStore = this._freehand3DStore;
    const ROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    if (ROIContour.name) {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }

    const activeROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    await setVolumeName(seriesInstanceUid, 'DEFAULT', activeROIContour.uid);
    // Require another click to start the roi now it is (possibly) named.
    return new Promise((resolve, reject) => {
      reject();
    });

  }


  /**
  * Event handler for MOUSE_DOUBLE_CLICK event.
  *
  * @event
  * @param {Object} e - The event.
  */
  doubleClickCallback (evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const freehand3DStore = this._freehand3DStore;

    const toolData = cornerstoneTools.getToolState(evt.currentTarget, this.name);

    const nearby = this._pointNearHandleAllTools(eventData);
    const config = this.configuration;
    const currentTool = config.currentTool;

    // Return if tool actively drawing or no handle nearby
    if (nearby === undefined || currentTool >= 0) {
      return;
    }

    preventPropagation(evt);

    const data = toolData.data[nearby.toolIndex];

    // Check if locked and return
    const structureSet = freehand3DStore.getters.structureSet(
      data.seriesInstanceUid,
      data.structureSetUid
    );

    if (structureSet.isLocked) {
      return;
    }

    setVolumeName(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
  }

  /**
   * Active mouse down callback that takes priority if the user is attempting
   * to insert or delete a handle with ctrl + click.
   *
   * @param {Object} evt - The event.
   */
  preMouseDownCallback (evt) {
    const eventData = evt.detail;

    const toolData = cornerstoneTools.getToolState(evt.currentTarget, this.name);

    if (!toolData) {
      return false;
    }

    const nearby = this._pointNearHandleAllTools(eventData);
    const freehand3DStore = this._freehand3DStore;

    if (eventData.event.ctrlKey) {
      if (nearby !== undefined && nearby.handleNearby.hasBoundingBox) {
        // Ctrl + clicked textBox, do nothing but still consume event.
      } else {
        insertOrDelete.call(this, evt, nearby);
      }

      preventPropagation(evt);

      return true;
    }

    if (!nearby) {
      return;
    }

    const data = toolData.data[nearby.toolIndex];

    // Check if locked and return
    const structureSet = freehand3DStore.getters.structureSet(
      data.seriesInstanceUid,
      data.structureSetUid
    );

    if (structureSet.isLocked) {
      return false;
    }



    return false;
  }

  /**
   * Custom callback for when a handle is selected.
   *
   * @param  {Object} evt
   * @param  {Object} handle The selected handle.
   */
  handleSelectedCallback (evt, handle, data) {
    const freehand3DStore = this._freehand3DStore;
    const eventData = evt.detail;
    const element = eventData.element;
    const toolState = cornerstoneTools.getToolState(eventData.element, this.name);

    if (eventData.event.metaKey) {
      this._switchROIContour(data);
      preventPropagation(evt);

      return;
    }

    if (handle.hasBoundingBox) {
      if (this.configuration.alwaysShowTextBox) {
        // Use default move handler - Can move textbox of locked ROIContours.
        moveHandleNearImagePoint(evt, handle, data, this.name);
        preventPropagation(evt);
      }

      return;
    }

    // Check if locked and return
    const structureSet = freehand3DStore.getters.structureSet(
      data.seriesInstanceUid,
      data.structureSetUid
    );

    if (structureSet.isLocked) {
      return false;
    }

    const config = this.configuration;

    config.dragOrigin = {
      x: handle.x,
      y: handle.y
    };

    // Have to do this to get tool index.
    const nearby = this._pointNearHandleAllTools(eventData);
    const handleNearby = nearby.handleNearby;
    const toolIndex = nearby.toolIndex;

    this._modifying = true;
    config.currentHandle = handleNearby;
    config.currentTool = toolIndex;

    this._activateModify(element);

    // Interupt eventDispatchers
    cornerstoneTools.store.state.isToolLocked = true;

    preventPropagation(evt);
  }

  _switchROIContour (data) {
    const freehand3DStore = this._freehand3DStore;

    freehand3DStore.setters.activeROIContour(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
  }

  /**
   *
   *
   * @param {*} evt
   * @returns
   */
  renderToolData (evt) {
    const eventData = evt.detail;
    const freehand3DStore = this._freehand3DStore;

    // If we have no toolState for this element, return immediately as there is nothing to do
    const toolState = cornerstoneTools.getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    const image = eventData.image;
    const element = eventData.element;
    const config = this.configuration;
    const seriesModule = cornerstone.metaData.get(
      'generalSeriesModule',
      image.imageId
    );

    let modality;

    if (seriesModule) {
      modality = seriesModule.modality;
    }

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);

    const lineWidth = cornerstoneTools.toolStyle.getToolWidth();

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];
      const structureSet = data.referencedStructureSet;
      const ROIContour = data.referencedROIContour;

      if (data.visible === false || !structureSet.visible) {
        continue;
      }

      draw(context, (context) => {
        let color = toolColors.getColorIfActive(data);
        let fillColor;

        if (data.active && !structureSet.isLocked) {
          if (data.handles.invalidHandlePlacement) {
            color = config.invalidColor;
            fillColor = config.invalidColor;
          } else {
            color = toolColors.getColorIfActive(data);
            fillColor = toolColors.getFillColor();
          }
        } else {
          color = ROIContour.color;
          fillColor = ROIContour.color;
        }

        if (data.handles.length) {
          for (let j = 0; j < data.handles.length; j++) {
            const points = [...data.handles[j].lines];

            if (j === data.handles.length - 1 && !data.polyBoundingBox) {
              // If it's still being actively drawn, keep the last line to
              // The mouse location
              points.push(config.mouseLocation.handles.start);
            }
            drawJoinedLines(
              context,
              eventData.element,
              data.handles[j],
              points,
              { color }
            );
          }
        }

        // Draw handles

        const options = {
          fill: fillColor
        };

        if (
          config.alwaysShowHandles ||
          (data.active && data.polyBoundingBox)
        ) {
          // Render all handles
          options.handleRadius = config.activeHandleRadius;
          drawHandles(context, eventData, data.handles, color, options);
        }

        if (data.canComplete) {
          // Draw large handle at the origin if can complete drawing
          options.handleRadius = config.completeHandleRadius;
          drawHandles(context, eventData, [data.handles[0]], color, options);
        }

        if (data.active && !data.polyBoundingBox) {
          // Draw handle at origin and at mouse if actively drawing
          options.handleRadius = config.activeHandleRadius;
          drawHandles(
            context,
            eventData,
            config.mouseLocation.handles,
            color,
            options
          );
          drawHandles(context, eventData, [data.handles[0]], color, options);
        }

        // Define variables for the area and mean/standard deviation
        let area, meanStdDev, meanStdDevSUV;

        // Perform a check to see if the tool has been invalidated. This is to prevent
        // Unnecessary re-calculation of the area, mean, and standard deviation if the
        // Image is re-rendered but the tool has not moved (e.g. during a zoom)
        if (data.invalidated === false) {
          // If the data is not invalidated, retrieve it from the toolState
          meanStdDev = data.meanStdDev;
          meanStdDevSUV = data.meanStdDevSUV;
          area = data.area;
        } else if (!data.active) {
          // If the data has been invalidated, and the tool is not currently active,
          // We need to calculate it again.

          // Retrieve the bounds of the ROI in image coordinates
          const bounds = {
            left: data.handles[0].x,
            right: data.handles[0].x,
            bottom: data.handles[0].y,
            top: data.handles[0].x
          };

          for (let i = 0; i < data.handles.length; i++) {
            bounds.left = Math.min(bounds.left, data.handles[i].x);
            bounds.right = Math.max(bounds.right, data.handles[i].x);
            bounds.bottom = Math.min(bounds.bottom, data.handles[i].y);
            bounds.top = Math.max(bounds.top, data.handles[i].y);
          }

          const polyBoundingBox = {
            left: bounds.left,
            top: bounds.bottom,
            width: Math.abs(bounds.right - bounds.left),
            height: Math.abs(bounds.top - bounds.bottom)
          };

          // Store the bounding box information for the text box
          data.polyBoundingBox = polyBoundingBox;

          // First, make sure this is not a color image, since no mean / standard
          // Deviation will be calculated for color images.
          if (!image.color) {
            // Retrieve the array of pixels that the ROI bounds cover
            const pixels = cornerstone.getPixels(
              element,
              polyBoundingBox.left,
              polyBoundingBox.top,
              polyBoundingBox.width,
              polyBoundingBox.height
            );

            // Calculate the mean & standard deviation from the pixels and the object shape
            meanStdDev = calculateFreehandStatistics.call(
              this,
              pixels,
              polyBoundingBox,
              data.handles
            );

            if (modality === 'PT') {
              // If the image is from a PET scan, use the DICOM tags to
              // Calculate the SUV from the mean and standard deviation.

              // Note that because we are using modality pixel values from getPixels, and
              // The calculateSUV routine also rescales to modality pixel values, we are first
              // Returning the values to storedPixel values before calcuating SUV with them.
              // TODO: Clean this up? Should we add an option to not scale in calculateSUV?
              meanStdDevSUV = {
                mean: calculateSUV(
                  image,
                  (meanStdDev.mean - image.intercept) / image.slope
                ),
                stdDev: calculateSUV(
                  image,
                  (meanStdDev.stdDev - image.intercept) / image.slope
                )
              };
            }

            // If the mean and standard deviation values are sane, store them for later retrieval
            if (meanStdDev && !isNaN(meanStdDev.mean)) {
              data.meanStdDev = meanStdDev;
              data.meanStdDevSUV = meanStdDevSUV;
            }
          }

          // Retrieve the pixel spacing values, and if they are not
          // Real non-zero values, set them to 1
          const columnPixelSpacing = image.columnPixelSpacing || 1;
          const rowPixelSpacing = image.rowPixelSpacing || 1;
          const scaling = columnPixelSpacing * rowPixelSpacing;

          area = freehandArea(data.handles, scaling);

          // If the area value is sane, store it for later retrieval
          if (!isNaN(area)) {
            data.area = area;
          }

          // Set the invalidated flag to false so that this data won't automatically be recalculated
          data.invalidated = false;
        }

        // Only render text if polygon ROI has been completed, and is active,
        // Or config is set to show the textBox all the time
        if (data.polyBoundingBox && (this.configuration.alwaysShowTextBox || data.active)) {
          // If the textbox has not been moved by the user, it should be displayed on the right-most
          // Side of the tool.
          if (!data.handles.textBox.hasMoved) {
            // Find the rightmost side of the polyBoundingBox at its vertical center, and place the textbox here
            // Note that this calculates it in image coordinates
            data.handles.textBox.x =
              data.polyBoundingBox.left + data.polyBoundingBox.width;
            data.handles.textBox.y =
              data.polyBoundingBox.top + data.polyBoundingBox.height / 2;
          }

          const text = textBoxText.call(this, data);

          drawLinkedTextBox(
            context,
            element,
            data.handles.textBox,
            text,
            data.handles,
            textBoxAnchorPoints,
            color,
            lineWidth,
            0,
            true
          );
        }
      });
    }

    function textBoxText (data) {
      const ROIContour = data.referencedROIContour;
      const structureSet = data.referencedStructureSet;

      const { meanStdDev, meanStdDevSUV, area } = data;
      // Define an array to store the rows of text for the textbox
      const textLines = [];

      textLines.push(ROIContour.name);

      if (structureSet.name === 'DEFAULT') {
        textLines.push('Working ROI Collection');
      } else {
        textLines.push(structureSet.name);
      }

      // If the mean and standard deviation values are present, display them
      if (meanStdDev && meanStdDev.mean !== undefined) {
        // If the modality is CT, add HU to denote Hounsfield Units
        let moSuffix = '';

        if (modality === 'CT') {
          moSuffix = ' HU';
        }

        // Create a line of text to display the mean and any units that were specified (i.e. HU)
        let meanText = `Mean: ${numbersWithCommas(
          meanStdDev.mean.toFixed(2)
        )}${moSuffix}`;
        // Create a line of text to display the standard deviation and any units that were specified (i.e. HU)
        let stdDevText = `StdDev: ${numbersWithCommas(
          meanStdDev.stdDev.toFixed(2)
        )}${moSuffix}`;

        // If this image has SUV values to display, concatenate them to the text line
        if (meanStdDevSUV && meanStdDevSUV.mean !== undefined) {
          const SUVtext = ' SUV: ';

          meanText +=
            SUVtext + numbersWithCommas(meanStdDevSUV.mean.toFixed(2));
          stdDevText +=
            SUVtext + numbersWithCommas(meanStdDevSUV.stdDev.toFixed(2));
        }

        // Add these text lines to the array to be displayed in the textbox
        textLines.push(meanText);
        textLines.push(stdDevText);
      }

      // If the area is a sane value, display it
      if (area) {
        // Determine the area suffix based on the pixel spacing in the image.
        // If pixel spacing is present, use millimeters. Otherwise, use pixels.
        // This uses Char code 178 for a superscript 2
        let suffix = ` mm${String.fromCharCode(178)}`;

        if (!image.rowPixelSpacing || !image.columnPixelSpacing) {
          suffix = ` pixels${String.fromCharCode(178)}`;
        }

        // Create a line of text to display the area and its units
        const areaText = `Area: ${numbersWithCommas(area.toFixed(2))}${suffix}`;

        // Add this text line to the array to be displayed in the textbox
        textLines.push(areaText);
      }

      textLines.push(`${ROIContour.polygonCount} contours`);

      return textLines;
    }

    function textBoxAnchorPoints (handles) {
      return handles;
    }
  }

  /**
   * Returns a handle of a particular tool if it is close to the mouse cursor
   *
   * @private
   * @param {Object} eventData - data object associated with an event.
   * @param {Number} toolIndex - the ID of the tool
   * @return {Number|Object|Boolean}
   */
  _pointNearHandle (element, data, coords) {
    const config = this.configuration;

    if (data.handles === undefined) {
      return;
    }

    if (data.visible === false) {
      return;
    }

    for (let i = 0; i < data.handles.length; i++) {
      const handleCanvas = cornerstone.pixelToCanvas(
        element,
        data.handles[i]
      );

      if (
        cornerstoneMath.point.distance(handleCanvas, coords) <
        config.spacing
      ) {
        return i;
      }
    }

    // Check to see if mouse in bounding box of textbox
    if (config.alwaysShowTextBox && data.handles.textBox) {
      if (pointInsideBoundingBox(data.handles.textBox, coords)) {
        return data.handles.textBox;
      }
    }
  }

}

function defaultFreehandConfiguration () {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true
        }
      }
    },
    spacing: 5,
    activeHandleRadius: 3,
    completeHandleRadius: 6,
    alwaysShowHandles: false,
    invalidColor: 'crimson',
    currentHandle: 0,
    currentTool: -1
  };
}


function preventPropagation (evt) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  evt.preventDefault();
}
