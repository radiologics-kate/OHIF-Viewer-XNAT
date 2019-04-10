import { OHIF } from "meteor/ohif:core";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { AIMWriter } from "../classes/AIMWriter.js";
import { AsyncRoiFetcher } from "../classes/AsyncRoiFetcher.js";
import { Polygon } from "meteor/icr:peppermint-tools";
import { RoiExtractor } from "../classes/RoiExtractor.js";
import { AIMExporter } from "../classes/AIMExporter.js";
import { roiCollectionBuilder } from "./roiCollectionBuilder.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { lockStructureSet } from "meteor/icr:peppermint-tools";
import messageDialog from "../util/messageDialog.js";
import {
  displayExportFailedDialog,
  displayInsufficientPermissionsDialog
} from "../util/displayExportDialogs.js";
import localBackup from "./localBackup.js";

const modules = cornerstoneTools.store.modules;
const getToolState = cornerstoneTools.import("stateManagement/getToolState");
//const globalToolStateManager =
//  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default async function() {
  if (icrXnatRoiSession.get("writePermissions") === true) {
    beginExport();
    return;
  }

  // User does not have write access
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  displayInsufficientPermissionsDialog(seriesInstanceUid);
}

/**
 * Begins the event chain which allows the user to select which newly drawn
 * ROIs they would like to export as an roiCollection to XNAT.
 *
 * @author JamesAPetts
 */
async function beginExport() {
  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const roiExtractor = new RoiExtractor(seriesInfo.seriesInstanceUid);
  const dateTime = AIMWriter.generateDateTime();
  const label = AIMWriter.generateLabel(dateTime);

  // Check if there are any unlocked ROIs with > 0 contours.
  // TODO -> Could do this query with peppermint now?
  if (roiExtractor.hasVolumesToExtract() === false) {
    displayNoROIsToExportDialog();
    return;
  }

  // Allow the user to choose which ROIs to export.
  const result = await roiCollectionBuilder(label);

  if (!result) {
    console.log("cancelled");
    return;
  }

  const { roiCollectionName, exportMask } = result;

  // Generate AIM file from the selected ROIs.
  const exportInProgressDialog = document.getElementById("exportVolumes");
  exportInProgressDialog.showModal();

  const volumes = roiExtractor.extractVolumes(exportMask);

  const aw = new AIMWriter(roiCollectionName, label, dateTime);
  aw.writeImageAnnotationCollection(volumes, seriesInfo);

  // Attempt export to XNAT. Lock ROIs for editing if the export is successful.
  const aimExporter = new AIMExporter(aw);
  await aimExporter
    .exportToXNAT()
    .then(success => {
      console.log("PUT successful.");
      console.log(roiCollectionName);
      console.log(lockStructureSet);

      //lockExportedROIs(
      lockStructureSet(
        exportMask,
        seriesInfo.seriesInstanceUid,
        roiCollectionName,
        label
      );
      //console.log('=====checking backup:=====');
      //localBackup.checkBackupOnExport();
      //console.log('=====checking backup DONE=====');
      exportInProgressDialog.close();
    })
    .catch(error => {
      console.log(error);
      // TODO -> Work on backup mechanism, disabled for now.
      //localBackup.saveBackUpForActiveSeries();
      exportInProgressDialog.close();
      displayExportFailedDialog(seriesInfo.seriesInstanceUid);
    });
}

/**
 * Lock the exported ROIs, such that they can no longer be edited. And then move
 * them to a new named ROI Collection, freeing up the working directory.
 *
 * @author JamesAPetts
 * @param {boolean[]} exportMask      A true/false array describing which ROIs
 *                                    have been exported.
 * @param {string} seriesInstanceUid  The UID of the series on which the ROIs
 *                                    reside.
 * @param {string} roiCollectionName  The name of the newly created
 *                                    roiCollection.
 * @param {string} uid                The uid of the newly created roiCollection.
 */
/*
function lockExportedROIs(
  exportMask,
  seriesInstanceUid,
  structureSetName,
  structureSetUid
) {
  const freehand3DStore = modules.freehand3D;

  const structureSet = freehand3DStore.getters.structureSet(seriesInstanceUid);

  const workingRoiCollection = structureSet.ROIContourCollection;
  const activeROIContourIndex = structureSet.activeROIContourIndex;

  let activeROIContourUid = freehand3DStore.getters.activeROIContour(
    seriesInstanceUid
  ).uid;

  // Create copies of ROIContours inside the new structureSet
  const newIndicies = [];

  freehand3DStore.setters.structureSet(seriesInstanceUid, structureSetName, {
    uid: structureSetUid,
    isLocked: true
  });

  let ROIContourIndex = 0;

  for (let i = 0; i < exportMask.length; i++) {
    if (exportMask[i]) {
      const oldROIContour = workingRoiCollection[i];

      freehand3DStore.setters.ROIContour(
        seriesInstanceUid,
        structureSetUid,
        oldROIContour.name,
        {
          uid: oldROIContour.uid,
          polygonCount: oldROIContour.polygonCount,
          color: oldROIContour.color
        }
      );

      newIndicies[i] = ROIContourIndex;
      ROIContourIndex++;
    }
  }

  // Cycle through slices and update ROIs references to the new volumes.
  const newStructureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid,
    structureSetUid
  );

  const toolStateManager = globalToolStateManager.saveToolState();

  Object.keys(toolStateManager).forEach(elementId => {
    // Only get polygons from this series
    // TODO => There must be a better way to do this with the stack tool now.
    if (getSeriesInstanceUidFromImageId(elementId) === seriesInstanceUid) {
      // grab the freehand tool for this DICOM instance

      if (
        toolStateManager &&
        toolStateManager[elementId] &&
        toolStateManager[elementId].freehandMouse
      ) {
        const toolState = toolStateManager[elementId].freehandMouse;
        const toolData = toolState.data;
        // Append new ROIs to polygon list
        const exportData = {
          toolData,
          elementId,
          exportMask,
          newIndicies,
          newStructureSet,
          structureSetName,
          seriesInstanceUid
        };
        moveExportedPolygonsInInstance(exportData);
      }
    }
  });

  // Remove old working volumes.
  for (let i = exportMask.length - 1; i >= 0; i--) {
    if (exportMask[i]) {
      freehand3DStore.setters.deleteROIFromStructureSet(
        seriesInstanceUid,
        "DEFAULT",
        workingRoiCollection[i].uid
      );
    }
  }

  if (exportMask[activeROIContourIndex]) {
    // If active volume has been exported, set active volume to null.
    structureSet.activeROIContourIndex = null;
  } else {
    console.log(`didnt export active contour..`);
    // Make sure we are pointing to the right contour now.
    freehand3DStore.setters.activeROIContour(
      seriesInstanceUid,
      "DEFAULT",
      activeROIContourUid
    );
  }
}
*/

/**
 * Extracts the seriesInstanceUid from an image, given the imageId.
 * TODO -> Move this to SeriesInfoProvider.
 *
 * @author JamesAPetts
 * @param {String} imageId The ID of the image being queried.
 */
/*
function getSeriesInstanceUidFromImageId(imageId) {
  const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
  return metaData.series.seriesInstanceUid;
}
*/

/**
 * Moves the ROIs defined by the seriesInstanceUid, roiCollectionName
 * and exportMask from the working directory to a new named roiCollection.
 *
 * @author JamesAPetts
 * @param  {Object} exportData  An object containing the required information
 *                              to execute the move opperation.
 */
/*
function moveExportedPolygonsInInstance(exportData) {
  const freehand3DStore = modules.freehand3D;

  console.log("====moving exported polygons in instance..");
  const {
    toolData,
    elementId,
    exportMask,
    newIndicies,
    newStructureSet,
    structureSetName,
    seriesInstanceUid
  } = exportData;

  for (let i = 0; i < toolData.length; i++) {
    const data = toolData[i];

    const ROIContourIndex = freehand3DStore.getters.ROIContourIndex(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
    const structureSetUid = data.structureSetUid;

    // Check to see if the volume referencing this contour is eligable for export.
    if (structureSetUid === "DEFAULT" && exportMask[ROIContourIndex]) {
      const newROIContourIndex = newIndicies[ROIContourIndex];

      (data.structureSetUid = newStructureSet.uid),
        (data.referencedStructureSet = newStructureSet);
      data.referencedROIContour =
        newStructureSet.ROIContourCollection[newROIContourIndex];
    }
  }
}
*/

/**
 * Opens dialog to notify the user there are no ROIs eligable for export.
 *
 * @author JamesAPetts
 */
function displayNoROIsToExportDialog() {
  const title = "Nothing to Export";
  const body =
    "There are no unlocked ROIs to export. Please refer to the More/Help/ROI menu for more information.";

  messageDialog(title, body);
}
