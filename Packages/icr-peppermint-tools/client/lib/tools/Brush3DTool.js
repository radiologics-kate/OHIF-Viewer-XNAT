import { cornerstoneTools, cornerstoneMath } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession, isModalOpen } from "meteor/icr:xnat-roi-namespace";

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
    this.touchDragCallback = this._startPaintingTouch.bind(this);
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
    const segIndex = brushModule.state.drawColorId;
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    // Check if metadata exists,
    const metaData = brushModule.getters.metadata(seriesInstanceUid, segIndex);

    if (metaData && metaData.SegmentLabel) {
      // Metadata assigned, start drawing.
      this._setActiveStrategy(seriesInstanceUid);
      this._paint(evt);
      this._drawing = true;
      this._startListeningForMouseUp(element);
      this._lastImageCoords = eventData.currentPoints.image;
    } else if (!isModalOpen()) {
      // Open the UI and let the user input data!
      newSegmentInput(brushModule.state.drawColorId);
    }
  }

  /**
   * Initialise painting with baseBrushTool
   *
   * @override @protected
   * @event
   * @param {Object} evt - The event.
   */
  _startPaintingTouch(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const segIndex = brushModule.state.drawColorId;
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    // Check if metadata exists,
    const metaData = brushModule.getters.metadata(seriesInstanceUid, segIndex);

    if (metaData && metaData.SegmentLabel) {
      // Metadata assigned, start drawing.
      this._setActiveStrategy(seriesInstanceUid);
      this._paint(evt);
    } else if (!isModalOpen()) {
      // Open the UI and let the user input data!
      newSegmentInput(brushModule.state.drawColorId);
    }
  }

  _setActiveStrategy(seriesInstanceUid) {
    this.activeStrategy = MODES.OVERLAPPING;

    const importMetadata = brushModule.getters.importMetadata(
      seriesInstanceUid
    );

    if (importMetadata) {
      // Modified an imported mask.
      brushModule.setters.importModified(seriesInstanceUid);

      if (importMetadata.type === "NIFTI") {
        this.activeStrategy = MODES.NON_OVERLAPPING;
      }
    }
  }

  static checkIfAnyMetadataOnSeries() {
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    const metaData = brushModule.getters.metadata(seriesInstanceUid);

    // If metadata doesn't exist, or all elements undefined (i.e. deleted), open UI.
    if (!metaData || !metaData.find(element => element)) {
      if (!isModalOpen()) {
        brushModule.state.drawColorId = 0;
        newSegmentInput(brushModule.state.drawColorId);
      }
    }
  }
}
