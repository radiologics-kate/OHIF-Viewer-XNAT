import { cornerstoneTools } from "meteor/ohif:cornerstone";
import getActiveSeriesInstanceUid from "./getActiveSeriesInstanceUid.js";
import generateBrushMetadata from "../../lib/util/generateBrushMetadata.js";
import { OHIF } from "meteor/ohif:core";

const brushModule = cornerstoneTools.store.modules.brush;

export function newSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, segmentInputCallback);
}

export function editSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, segmentInputCallback);
}

export function newSegment() {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

  if (!activeEnabledElement) {
    return [];
  }
  const activeElement = activeEnabledElement.element;

  let segmentMetadata = brushModule.getters.metadata(activeElement);

  if (!Array.isArray(segmentMetadata)) {
    const { labelmap3D } = brushModule.getters.getAndCacheLabelmap2D(
      activeElement
    );
    segmentMetadata = labelmap3D.metadata;
  }

  const colormap = brushModule.getters.activeCornerstoneColorMap(activeElement);

  const numberOfColors = colormap.getNumberOfColors();

  for (let i = 1; i < numberOfColors; i++) {
    if (!segmentMetadata[i]) {
      newSegmentInput(i);
      break;
    }
  }
}

function segmentInputCallback(data) {
  if (!data) {
    return;
  }

  const { label, categoryUID, typeUID, modifierUID, segIndex } = data;

  const seriesInstanceUid = getActiveSeriesInstanceUid();
  const metadata = generateBrushMetadata(
    label,
    categoryUID,
    typeUID,
    modifierUID
  );

  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const activeElement = activeEnabledElement.element;

  // TODO -> support for multiple labelmaps.
  brushModule.setters.metadata(activeElement, 0, segIndex, metadata);
  brushModule.setters.activeSegmentIndex(activeElement, segIndex);

  // JamesAPetts
  Session.set("refreshSegmentationMenu", Math.random().toString());
}

/**
 * Opens the brushMetadata dialog.
 *
 */
function brushMetdataInput(segIndex, metadata, callback) {
  const brushMetadataDialog = document.getElementById("brushMetadataDialog");
  const dialogData = Blaze.getData(brushMetadataDialog);

  dialogData.brushMetadataDialogSegIndex.set(segIndex);
  dialogData.brushMetadataDialogMetadata.set(metadata);
  dialogData.brushMetadataDialogCallback.set(callback);

  brushMetadataDialog.showModal();
}
