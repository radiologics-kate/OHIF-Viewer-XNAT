import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import generateBrushMetadata from "../../lib/util/generateBrushMetadata.js";

import segManagement from "./segManagement.js";

const brushModule = cornerstoneTools.store.modules.brush;

export function newSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, segmentInputCallback);
}

export function editSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, editSegmentInputCallback);
}

function editSegmentInputCallback(data) {
  segmentInputCallback(data);

  console.log("EDIT");

  segManagement();

  // TODO -> Reopen seg managamenet dialogs.
}

function segmentInputCallback(data) {
  if (!data) {
    return;
  }

  const { label, categoryUID, typeUID, modifierUID, segIndex } = data;

  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  const metadata = generateBrushMetadata(
    label,
    categoryUID,
    typeUID,
    modifierUID
  );

  brushModule.setters.metadata(seriesInstanceUid, segIndex, metadata);
}

/**
 * Opens the brushMetadata dialog.
 *
 */
function brushMetdataInput(segIndex, metadata, callback) {
  const brushMetadataDialog = document.getElementById("brushMetadataDialog");
  const dialogData = Blaze.getData(brushMetadataDialog);

  console.log(`BrushMetadataIO:: segIndex: ${segIndex}`);

  dialogData.brushMetadataDialogSegIndex.set(segIndex);
  dialogData.brushMetadataDialogMetadata.set(metadata);
  dialogData.brushMetadataDialogCallback.set(callback);

  brushMetadataDialog.showModal();
}
