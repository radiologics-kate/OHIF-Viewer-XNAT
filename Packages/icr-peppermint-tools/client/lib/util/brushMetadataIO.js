import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import generateBrushMetadata from "../../lib/util/generateBrushMetadata.js";

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * Opens the brushMetadata dialog.
 *
 */
export default async function(segIndex, metadata) {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  function brushMetadataCallback(data) {
    // TODO
    console.log(data);

    if (!data) {
      return;
    }

    const { label, categoryUID, typeUID, modifierUID } = data;

    const metadata = generateBrushMetadata(
      label,
      categoryUID,
      typeUID,
      modifierUID
    );

    brushModule.setters.metadata(seriesInstanceUid, segIndex, metadata);
  }

  const brushMetadataDialog = document.getElementById("brushMetadataDialog");
  const dialogData = Blaze.getData(brushMetadataDialog);

  console.log(`BrushMetadataIO:: segIndex: ${segIndex}`);

  dialogData.brushMetadataDialogSegIndex.set(segIndex);
  dialogData.brushMetadataDialogMetadata.set(metadata);
  dialogData.brushMetadataDialogCallback.set(brushMetadataCallback);

  brushMetadataDialog.showModal();
}
