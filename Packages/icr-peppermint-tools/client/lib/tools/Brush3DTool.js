import { cornerstoneTools } from "meteor/ohif:cornerstone";
import getActiveSeriesInstanceUid from "../util/getActiveSeriesInstanceUid.js";
import isDialogOpen from "../util/isDialogOpen.js";
import { OHIF } from "meteor/ohif:core";

import { newSegmentInput } from "../util/brushMetadataIO.js";

const MODES = {
  OVERLAPPING: "overlapping",
  NON_OVERLAPPING: "nonOverlapping"
};

const BrushTool = cornerstoneTools.BrushTool;
const brushModule = cornerstoneTools.store.modules.brush;

export default class Brush3DTool extends BrushTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: "Brush"
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.initialConfiguration = initialConfiguration;
  }

  /**
   * Initialise painting with baseBrushTool
   *
   * @override @protected
   * @event
   * @param {Object} evt - The event.
   */
  _startPainting(evt) {
    const eventData = evt.detail;
    const element = eventData.element;

    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex
    } = brushModule.getters.getAndCacheLabelmap2D(element);

    const shouldErase =
      this._isCtrlDown(eventData) || this.configuration.alwaysEraseOnClick;

    this.paintEventData = {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      shouldErase
    };

    const segmentIndex = labelmap3D.activeSegmentIndex;
    const metadata = labelmap3D.metadata[segmentIndex];

    if (metadata) {
      // Metadata assigned, start drawing.
      if (eventData.currentPoints) {
        this._paint(evt);
      }
      this._drawing = true;
      this._startListeningForMouseUp(element);
    } else if (!isDialogOpen()) {
      // Open the UI and let the user input data!
      const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
      const activeElement = activeEnabledElement.element;

      const activeSegmentIndex = brushModule.getters.activeSegmentIndex(
        activeElement
      );

      newSegmentInput(activeSegmentIndex);
    }
  }

  static checkIfAnyMetadataOnActiveElement() {
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const activeElement = activeEnabledElement.element;

    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex
    } = brushModule.getters.getAndCacheLabelmap2D(activeElement);

    const metadata = labelmap3D.metadata;

    // If metadata doesn't exist, or all elements undefined (i.e. deleted), open UI.
    if (!metadata || !metadata.find(element => element)) {
      if (!isDialogOpen()) {
        newSegmentInput(1);
      }
    }
  }
}
