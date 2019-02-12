import { cornerstoneTools, cornerstoneMath } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession, isModalOpen } from "meteor/icr:xnat-roi-namespace";

import brushMetadataIO from "../util/brushMetadataIO.js";

const MODES = {
  OVERLAPPING: "overlapping",
  NON_OVERLAPPING: "nonOverlapping"
};

const BrushTool = cornerstoneTools.BrushTool;
const brushStore = cornerstoneTools.store.modules.brush;

export default class Brush3DTool extends BrushTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: "Brush",
      supportedInteractionTypes: ["Mouse"],
      configuration: {}
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
    const segIndex = brushStore.state.drawColorId;
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    // Check if metadata exists,
    const metaData = brushStore.getters.metadata(seriesInstanceUid, segIndex);

    if (metaData && metaData.SegmentLabel) {
      // Metadata assigned, start drawing.

      this.activeStrategy = MODES.OVERLAPPING;

      if (
        brushStore.state.import &&
        brushStore.state.import[seriesInstanceUid]
      ) {
        // Modified an imported mask.
        brushStore.state.import[seriesInstanceUid].modified = true;

        if (brushStore.state.import[seriesInstanceUid].type === "NIFTI") {
          this.activeStrategy = MODES.NON_OVERLAPPING;
        }
      }

      this._paint(evt);
      this._drawing = true;
      this._startListeningForMouseUp(element);
      this._lastImageCoords = eventData.currentPoints.image;
    } else {
      // Open the UI and let the user input data!

      if (!isModalOpen()) {
        brushMetadataIO(brushStore.state.drawColorId);
      }
    }
  }

  static checkIfAnyMetadataOnSeries() {
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    const metaData = brushStore.getters.metadata(seriesInstanceUid);

    console.log(metaData);

    // If metadata doesn't exist, or all elements undefined (i.e. deleted), open UI.
    if (!metaData || !metaData.find(element => element)) {
      if (!isModalOpen()) {
        brushStore.state.drawColorId = 0;
        brushMetadataIO(brushStore.state.drawColorId);
      }
    }
  }
}
