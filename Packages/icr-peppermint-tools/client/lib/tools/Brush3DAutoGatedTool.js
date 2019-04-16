import { cornerstoneTools } from "meteor/ohif:cornerstone";
import Brush3DHUGatedTool from "./Brush3DHUGatedTool.js";

export default class Brush3DAutoGatedTool extends Brush3DHUGatedTool {
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
  }

  /**
   * Event handler for MOUSE_DOWN event.
   *
   * @override
   * @event
   * @param {Object} evt - The event.
   */
  preMouseDownCallback(evt) {
    this._setCustomGate(evt);
    this._startPainting(evt);

    return true;
  }
}
