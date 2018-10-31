import { cornerstoneTools, cornerstoneMath } from 'meteor/ohif:cornerstone';
import generateUID from '../util/generateUID.js';
import { OHIF } from 'meteor/ohif:core';
import { createNewVolume, setVolumeName } from '../util/freehandNameIO.js';

import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

const FreehandSculpterMouseTool = cornerstoneTools.FreehandSculpterMouseTool;
const toolColors = cornerstoneTools.toolColors;

export default class Freehand3DSculpterMouseTool extends FreehandSculpterMouseTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: 'FreehandSculpterMouse',
      referencedToolName: 'FreehandMouse',
      supportedInteractionTypes: ['Mouse'],
      mixins: ['activeOrDisabledBinaryTool'],
      configuration: getDefaultFreehandSculpterMouseToolConfiguration()
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);
  }


  /**
   * Select the freehand tool to be edited. Don't allow selecting of locked
   * ROIContours.
   *
   * @private
   * @param {Object} eventData - Data object associated with the event.
   */
  _selectFreehandTool (eventData) {
    const config = this.configuration;
    const element = eventData.element;
    const closestToolIndex = this._getClosestFreehandToolOnElement(
      element,
      eventData
    );

    if (closestToolIndex === undefined) {
      return;
    }

    const toolState = cornerstoneTools.getToolState(element, this.referencedToolName);

    const isLocked = toolState.data[closestToolIndex].referencedStructureSet.isLocked;

    if (isLocked) {
      return;
    }

    config.currentTool = closestToolIndex;
  }
}


/**
 * Returns the default freehandSculpterMouseTool configuration.
 *
 * @return {Object} The default configuration object.
 */
function getDefaultFreehandSculpterMouseToolConfiguration () {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true
        }
      }
    },
    minSpacing: 5,
    maxSpacing: 20,
    currentTool: null,
    dragColor: toolColors.getActiveColor(),
    hoverColor: toolColors.getToolColor(),

    /* --- Hover options ---
    showCursorOnHover:        Shows a preview of the sculpting radius on hover.
    limitRadiusOutsideRegion: Limit max toolsize outside the subject ROI based
                              on subject ROI area.
    hoverCursorFadeAlpha:     Alpha to fade to when tool very distant from
                              subject ROI.
    hoverCursorFadeDistance:  Distance from ROI in which to fade the hoverCursor
                              (in units of radii).
    */
    showCursorOnHover: true,
    limitRadiusOutsideRegion: true,
    hoverCursorFadeAlpha: 0.5,
    hoverCursorFadeDistance: 1.2
  };
}
