import { Session } from "meteor/session";
import { Random } from "meteor/random";
import { OHIF } from "meteor/ohif:core";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { getFrameOfReferenceUID } from "./getFrameOfReferenceUID";
import { updateCrosshairsSynchronizer } from "./updateCrosshairsSynchronizer";
import { crosshairsSynchronizers } from "./crosshairsSynchronizers";
import { annotateTextUtils } from "./annotateTextUtils";

import * as peppermintTools from "meteor/icr:peppermint-tools";

let activeTool;
let tools = {};
let pluginTools = {};
let initialized = false;
let defaultTool = {
  left: "wwwc",
  right: "zoom",
  middle: "pan"
};

const defaultToolConfig = {
  shadow: false,
  shadowColor: "#000000",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  drawHandlesOnHover: true
};

const buttonNum = {
  left: 1,
  right: 2,
  middle: 4
};

/**
 * Exported "toolManager" Singleton
 */
export const toolManager = {
  init() {
    // if a default tool is globally defined, make it the default tool...
    if (OHIF.viewer.defaultTool) {
      toolManager.setDefaultTool(OHIF.viewer.defaultTool.left);
      toolManager.setDefaultTool(OHIF.viewer.defaultTool.right, "right");
      toolManager.setDefaultTool(OHIF.viewer.defaultTool.middle, "middle");
    }

    peppermintTools.init({
      interpolate: true
    });
    cornerstoneTools.init({
      showSVGCursors: true
    });

    // Define tools object with the corresponding class names in cornerstone tools,
    //  and support for setting different configuration per tool
    tools = {
      length: {
        className: "LengthTool",
        configuration: defaultToolConfig
      },
      angle: {
        className: "AngleTool",
        configuration: defaultToolConfig
      },
      annotate: {
        className: "ArrowAnnotateTool",
        configuration: {
          ...defaultToolConfig,
          getTextCallback: annotateTextUtils.getTextCallback,
          changeTextCallback: annotateTextUtils.changeTextCallback
        }
      },
      wwwc: {
        className: "WwwcTool"
      },
      zoom: {
        className: "ZoomTool"
      },
      pan: {
        className: "PanTool"
      },
      dragProbe: {
        className: "DragProbeTool"
      },
      magnify: {
        className: "MagnifyTool"
      },
      crosshairs: {
        className: "CrosshairsTool"
      },
      stackScroll: {
        className: "StackScrollTool"
      },
      ellipticalRoi: {
        className: "EllipticalRoiTool",
        configuration: defaultToolConfig
      },
      rectangleRoi: {
        className: "RectangleRoiTool",
        configuration: defaultToolConfig
      },
      wwwcRegion: {
        className: "WwwcRegionTool"
      },
      zoomTouchPinch: {
        className: "ZoomTouchPinchTool"
      },
      panMultiTouch: {
        className: "PanMultiTouchTool"
      },
      stackScrollMouseWheel: {
        className: "StackScrollMouseWheelTool"
      },
      stackScrollMultiTouchTool: {
        className: "StackScrollMultiTouchTool"
      },
      referenceLines: {
        className: "ReferenceLinesTool"
      },
      bidirectional: {
        className: "BidirectionalTool"
      },
      eraser: {
        className: "EraserTool"
      }
    };

    pluginTools = {
      freehandRoi: peppermintTools.FreehandRoi3DTool,
      freehandRoiSculptor: peppermintTools.FreehandRoi3DSculptorTool,
      brush: peppermintTools.Brush3DTool,
      brushHUGated: peppermintTools.Brush3DHUGatedTool,
      brushAutoGated: peppermintTools.Brush3DAutoGatedTool
    };

    const { textStyle, toolStyle, toolColors } = cornerstoneTools;

    // Set text box background color
    textStyle.setBackgroundColor("transparent");

    // Set the tool font and font size
    // context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
    const fontFamily =
      "Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif";
    textStyle.setFont("15px " + fontFamily);

    // Set the tool width
    toolStyle.setToolWidth(2);

    // Set color for inactive tools
    toolColors.setToolColor("rgb(255, 255, 0)"); // yellow

    // Set color for active tools
    toolColors.setActiveColor("rgb(50, 205, 50)"); // limegreen

    initialized = true;
  },
  /**
   * This function searches an object to return the keys that contain a specific value
   *
   * @param object {object} The object to be searched
   * @param value The value to be found
   *
   * @returns {array} The keys for which the object has the specified value
   */
  getKeysByValue(object, value) {
    // http://stackoverflow.com/questions/9907419/javascript-object-get-key-by-value
    return Object.keys(object).filter(key => object[key] === value);
  },

  getMouseButtonMask(button) {
    return buttonNum[button] || undefined;
  },

  configureLoadProcess() {
    // Whenever CornerstoneImageLoadProgress is fired, identify which viewports
    // the "in-progress" image is to be displayed in. Then pass the percent complete
    // via the Meteor Session to the other templates to be displayed in the relevant viewports.

    function handleLoadProgress(e) {
      const eventData = e.detail;
      const viewportIndices = toolManager.getKeysByValue(
        window.ViewportLoading,
        eventData.imageId
      );
      viewportIndices.forEach(viewportIndex => {
        Session.set(
          "CornerstoneLoadProgress" + viewportIndex,
          eventData.percentComplete
        );
      });

      const encodedId = OHIF.string.encodeId(eventData.imageId);
      Session.set(
        "CornerstoneThumbnailLoadProgress" + encodedId,
        eventData.percentComplete
      );
    }

    cornerstone.events.removeEventListener(
      "cornerstoneimageloadprogress",
      handleLoadProgress
    );
    cornerstone.events.addEventListener(
      "cornerstoneimageloadprogress",
      handleLoadProgress
    );
  },

  getTools() {
    return Object.keys(tools);
  },

  addTool(toolName, options) {
    tools[toolName] = options;
  },

  registerThirdPartyTool(className, toolName, toolClass, configuration) {
    cornerstoneTools[className] = toolClass;

    tools[toolName] = {
      className,
      configuration
    };
  },

  setActiveToolWithHook(params) {
    const { toolName, hook } = params;

    toolManager.setActiveTool(toolName, "left");

    hook();
  },

  setActiveTool(toolName, button = "left") {
    // Using setActiveTool with no arguments activates the default tools for all buttons
    if (!toolName) {
      toolManager.setActiveTool(toolManager.getDefaultTool());
      toolManager.setActiveTool(toolManager.getDefaultTool("right"), "right");
      toolManager.setActiveTool(toolManager.getDefaultTool("middle"), "middle");
      return;
    }

    console.log(toolManager.getActiveTool(button));

    let options = {};
    const mouseButtonMask = toolManager.getMouseButtonMask(button);
    if (mouseButtonMask) {
      options = {
        mouseButtonMask,
        isTouchActive: true
      };
    }

    // Need to set it passive so that it doesn't keep touch control.
    // TODO: This seems necessary for this to work, but should shouldn't
    // `cornerstoneTools.setToolActive()`` with `isTouchActive = true` set
    // the other tool passive automagically?
    cornerstoneTools.setToolPassive(toolManager.getActiveTool(button));

    // Set active tools for the other buttons than this one
    switch (button) {
      case "left":
        cornerstoneTools.setToolActive(toolManager.getActiveTool("right"), {
          mouseButtonMask: toolManager.getMouseButtonMask("right"),
          isTouchActive: true
        });
        cornerstoneTools.setToolActive(toolManager.getActiveTool("middle"), {
          mouseButtonMask: toolManager.getMouseButtonMask("middle"),
          isTouchActive: true
        });
        break;
      case "right":
        cornerstoneTools.setToolActive(toolManager.getActiveTool("left"), {
          mouseButtonMask: toolManager.getMouseButtonMask("left"),
          isTouchActive: true
        });
        cornerstoneTools.setToolActive(toolManager.getActiveTool("middle"), {
          mouseButtonMask: toolManager.getMouseButtonMask("middle"),
          isTouchActive: true
        });
        break;
      case "middle":
        cornerstoneTools.setToolActive(toolManager.getActiveTool("left"), {
          mouseButtonMask: toolManager.getMouseButtonMask("left"),
          isTouchActive: true
        });
        cornerstoneTools.setToolActive(toolManager.getActiveTool("right"), {
          mouseButtonMask: toolManager.getMouseButtonMask("right"),
          isTouchActive: true
        });
        break;
    }

    if (toolName === "crosshairs") {
      // Activate crosshairs tool with the synchronizers by element
      cornerstoneTools.store.state.enabledElements.forEach(element => {
        const currentFrameOfReferenceUID = getFrameOfReferenceUID(element);
        if (currentFrameOfReferenceUID) {
          updateCrosshairsSynchronizer(currentFrameOfReferenceUID);
          options.synchronizationContext =
            crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];
        }
        cornerstoneTools.setToolActiveForElement(element, toolName, options);
      });
    } else {
      cornerstoneTools.setToolActive(toolName, options);
    }

    activeTool[button] = toolName;

    // Enable reactivity
    Session.set("ToolManagerActiveToolUpdated", Random.id());
  },

  instantiateTools(element) {
    // Instantiate all cornerstone tools for the given element
    Object.keys(tools).forEach(toolName => {
      const { className, configuration } = tools[toolName];
      const apiTool = cornerstoneTools[className];
      if (apiTool) {
        const options = {
          name: toolName
        };

        // Set configuration only if exists to prevent overwrite default configuration in cornerstone tools
        if (configuration) {
          options.configuration = configuration;
        }

        cornerstoneTools.addToolForElement(element, apiTool, options);

        // Set all tools (except the active tools) passive by default in order to render the external data if exists
        if (!activeTool || !Object.values(activeTool).includes(toolName)) {
          cornerstoneTools.setToolPassive(toolName);
        }
      }
    });

    // JamesAPetts - Peppermint tools
    const freehandTool = pluginTools["freehandRoi"];
    cornerstoneTools.addToolForElement(element, freehandTool, {
      name: "freehandRoi"
    });

    const brushTool = pluginTools["brush"];
    cornerstoneTools.addToolForElement(element, brushTool, { name: "brush" });

    const brushHUGatedTool = pluginTools["brushHUGated"];
    cornerstoneTools.addToolForElement(element, brushHUGatedTool, {
      name: "brushHUGated"
    });

    const brushAutoGatedTool = pluginTools["brushAutoGated"];
    cornerstoneTools.addToolForElement(element, brushAutoGatedTool, {
      name: "brushAutoGated"
    });

    const freehandSculpterMouseTool = pluginTools["freehandRoiSculptor"];
    cornerstoneTools.addToolForElement(element, freehandSculpterMouseTool, {
      name: "freehandRoiSculptor",
      referencedToolName: "freehandRoi"
    });

    // Activate pinch zoom
    cornerstoneTools.setToolActive("zoomTouchPinch", {
      mouseButtonMask: 0,
      isTouchActive: true
    });

    // Activate two-finger pan
    cornerstoneTools.setToolActive("panMultiTouch", {
      mouseButtonMask: 0,
      isTouchActive: true
    });

    // Activate mouse wheel and three (or more) finger stack scroll
    cornerstoneTools.setToolActive("stackScrollMouseWheel", {
      mouseButtonMask: 0,
      isTouchActive: true
    });

    cornerstoneTools.setToolActive("stackScrollMultiTouchTool", {
      mouseButtonMask: 0,
      isTouchActive: true
    });

    cornerstoneTools.setToolPassive("freehandRoi", {
      mouseButtonMask: 1
    });

    cornerstoneTools.setToolPassive("brush", {
      mouseButtonMask: 1
    });
  },

  removeToolsForElement(element) {
    Object.keys(tools).forEach(toolName => {
      cornerstoneTools.removeToolForElement(element, toolName);
    });

    // JamesAPetts
    Object.keys(pluginTools).forEach(toolName => {
      cornerstoneTools.removeToolForElement(element, toolName);
    });
  },

  getNearbyToolData(element, coords, toolTypes) {
    let pointNearTool = false;
    const nearbyTool = {};

    const toolTypesToCheck = toolTypes || this.getTools();
    toolTypesToCheck.forEach(toolType => {
      const toolData = cornerstoneTools.getToolState(element, toolType);
      if (!toolData) {
        return;
      }

      for (let i = 0; i < toolData.data.length; i++) {
        const data = toolData.data[i];
        const tool = cornerstoneTools.getToolForElement(element, toolType);
        if (
          tool &&
          typeof tool.pointNearTool === "function" &&
          tool.pointNearTool(element, data, coords)
        ) {
          pointNearTool = true;
          nearbyTool.tool = data;
          nearbyTool.index = i;
          nearbyTool.toolType = toolType;
          break;
        }
      }

      if (pointNearTool === true) {
        return false;
      }
    });

    return pointNearTool ? nearbyTool : undefined;
  },

  getActiveTool(button = "left") {
    if (!initialized) {
      toolManager.init();
    }

    // If activeTool is not defined, we should set as defaultTool
    if (!activeTool) {
      activeTool = defaultTool;
    }

    return activeTool[button];
  },

  setDefaultTool(tool, button = "left") {
    defaultTool[button] = tool;
  },

  getDefaultTool(button = "left") {
    return defaultTool[button];
  },

  activateCommandButton(button) {
    const activeCommandButtons =
      Session.get("ToolManagerActiveCommandButtons") || [];

    if (activeCommandButtons.indexOf(button) === -1) {
      activeCommandButtons.push(button);
      Session.set("ToolManagerActiveCommandButtons", activeCommandButtons);
    }
  },

  deactivateCommandButton(button) {
    const activeCommandButtons =
      Session.get("ToolManagerActiveCommandButtons") || [];
    const index = activeCommandButtons.indexOf(button);

    if (index !== -1) {
      activeCommandButtons.splice(index, 1);
      Session.set("ToolManagerActiveCommandButtons", activeCommandButtons);
    }
  }
};

toolManager.init();
