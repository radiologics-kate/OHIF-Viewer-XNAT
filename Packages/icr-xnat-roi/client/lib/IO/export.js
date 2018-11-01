import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { AIMWriter } from "../classes/AIMWriter.js";
import { AsyncRoiFetcher } from '../classes/AsyncRoiFetcher.js';
import { Polygon } from '../classes/Polygon.js';
import { RoiExtractor } from '../classes/RoiExtractor.js';
import { AIMExporter } from '../classes/AIMExporter.js';
import { roiCollectionBuilder } from './roiCollectionBuilder.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import closeIODialog from './closeIODialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const modules = cornerstoneTools.store.modules;
const getToolState = cornerstoneTools.import('stateManagement/getToolState');
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export async function exportROIs () {

  if (icrXnatRoiSession.get('writePermissions') === true) {
    beginExport();
    return;
  }

  // User does not have write access
  displayInsufficientPermissionsDialog();
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
  if (roiExtractor.hasVolumesToExtract() === false) {
    displayNoROIsToExportDialog();
    return;
  }

  // Allow the user to choose which ROIs to export.
  icrXnatRoiSession.set('defaultRoiCollectionName', label);

  const roiCollectionBuilderDialog = $('#roiCollectionBuilderDialog');
  let roiCollectionName;
  let exportMask;

  try {
    const result = await roiCollectionBuilder(roiCollectionBuilderDialog);
    roiCollectionName = result.roiCollectionName;
    exportMask = result.exportMask;
    closeIODialog(roiCollectionBuilderDialog);
  } catch (cancel) {
    closeIODialog(roiCollectionBuilderDialog);
    return;
  }

  // Generate AIM file from the selected ROIs.
  const exportInProgressDialog = $('#exportVolumes');
  exportInProgressDialog.get(0).showModal();

  const volumes = roiExtractor.extractVolumes(exportMask);

  const aw = new AIMWriter(roiCollectionName, label, dateTime);
  aw.writeImageAnnotationCollection(volumes, seriesInfo);

  // Attempt export to XNAT. Lock ROIs for editing if the export is successful.
  const aimExporter = new AIMExporter(aw);
  await aimExporter.exportToXNAT()
    .then(success => {
      console.log('PUT successful.');
      lockExportedROIs(
        exportMask,
        seriesInfo.seriesInstanceUid,
        roiCollectionName,
        label
      );
      closeIODialog(exportInProgressDialog);
    })
    .catch(error => {
      console.log(error.message);
      closeIODialog(exportInProgressDialog);
      displayExportFailedDialog();
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
function lockExportedROIs (exportMask, seriesInstanceUid, structureSetName, structureSetUid) {
  const freehand3DStore = modules.freehand3D;

  const structureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid
  );

  const workingRoiCollection = structureSet.ROIContourCollection;
  const activeROIContourIndex = structureSet.activeROIContourIndex;

  // If active volume has been exported, set active volume to null.
  if (exportMask[activeROIContourIndex]) {
    structureSet.activeROIContourIndex = null;
  }
  // Create copies of ROIContours inside the new structureSet
  const newIndicies = [];

  freehand3DStore.setters.structureSet(
    seriesInstanceUid,
    structureSetName,
    {
      uid: structureSetUid,
      isLocked: true
    }
  );

  let ROIContourIndex = 0;

  for (let i = 0; i < exportMask.length; i++) {
    if (exportMask[i]) {
      const oldROIContour = workingRoiCollection[i];

      freehand3DStore.setters.ROIContour(
        seriesInstanceUid,
        structureSetUid,
        structureSetName,
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

  console.log(newStructureSet);

  const toolStateManager = globalToolStateManager.saveToolState();

  Object.keys(toolStateManager).forEach( elementId => {
    // Only get polygons from this series
    // TODO => There must be a better way to do this with the stack tool now.
    if ( getSeriesInstanceUidFromImageId(elementId) === seriesInstanceUid ) {
      // grab the freehand tool for this DICOM instance
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
  });

  // Set old working volumes undefined
  for (let i = 0; i < exportMask.length; i++) {
    if (exportMask[i]) {
      workingRoiCollection[i] = undefined;
    }
  }
}

/**
 * Extracts the seriesInstanceUid from an image, given the imageId.
 * TODO -> Move this to SeriesInfoProvider.
 *
 * @author JamesAPetts
 * @param {String} imageId The ID of the image being queried.
 */
function getSeriesInstanceUidFromImageId (imageId) {
  const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
  return metaData.series.seriesInstanceUid;
}

/**
 * Moves the ROIs defined by the seriesInstanceUid, roiCollectionName
 * and exportMask from the working directory to a new named roiCollection.
 *
 * @author JamesAPetts
 * @param  {Object} exportData  An object containing the required information
 *                              to execute the move opperation.
 */
function moveExportedPolygonsInInstance (exportData) {
  const freehand3DStore = modules.freehand3D;

  console.log('====moving exported polygons in instance..');
  const {
    toolData,
    elementId,
    exportMask,
    newIndicies,
    newStructureSet,
    structureSetName,
    seriesInstanceUid
  } = exportData;

  for ( let i = 0; i < toolData.length; i++ ) {
    const data = toolData[i];

    const ROIContourIndex = freehand3DStore.getters.ROIContourIndex(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
    const structureSetUid = data.structureSetUid;


    // Check to see if the volume referencing this contour is eligable for export.
    if (structureSetUid === 'DEFAULT' && exportMask[ROIContourIndex]) {
      const newROIContourIndex = newIndicies[ROIContourIndex];

      data.structureSetUid = newStructureSet.uid,
      data.referencedStructureSet = newStructureSet;
      data.referencedROIContour = newStructureSet.ROIContourCollection[newROIContourIndex];
    }
  }
}

/**
 * Opens dialog to notify the user when an export was unsuccessful.
 *
 * @author JamesAPetts
 */
function displayExportFailedDialog () {
  const title = 'Export Failed';
  const body = `Export of ROIs to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}`
    + 'failed. This may be due a bad internet connection. The ROIs have not been locked, if you want'
    + 'to try again. If you have a good connection to XNAT and this problem persists, please contact'
    + 'your XNAT administrator.';
  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user that they do not have the
 * required permissions.
 *
 * @author JamesAPetts
 */
function displayInsufficientPermissionsDialog () {
  const title = 'Insufficient Permissions';
  const body = `You do not have the required permissions to write to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}.`
  + ' If you believe that you should, please contact the project owner.'

  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user there are no ROIs eligable for export.
 *
 * @author JamesAPetts
 */
function displayNoROIsToExportDialog () {
  const title = 'Nothing to Export';
  const body = 'There are no unlocked ROIs to export. Please refer to the ROI/Help menu for more information.';

  messageDialog(title, body);
}

/**
 * Opens a simple alert-style dialog.
 *
 * @author JamesAPetts
 * @param {String} title The title/header of the dialog.
 * @param {String} body The text to be displayed in the body of the dialog.
 */
function messageDialog (title, body) {
  // Find components
  const dialog = $('#ioMessage');
  const cancelButton = dialog.find('.ioDialogCancel');
  const descriptionText = dialog.find('.ioDescription');
  const bodyText = dialog.find('.ioBody');

  cancelButton.off('click');
  cancelButton.on('click', () => {
    closeIODialog(dialog);
  });

  dialog.off('keydown');
  dialog.on('keydown', e => {
    if (e.which = 27) { // If Esc is pressed cancel and close the dialog
      closeIODialog(dialog);
    }
  });

  descriptionText.text(title);
  bodyText.text(body);

  dialog.get(0).showModal();
}
