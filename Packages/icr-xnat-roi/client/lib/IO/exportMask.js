import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { MaskExtractor } from '../classes/MaskExtractor.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { DICOMSEGWriter } from '../classes/DICOMSEGWriter.js';
import { DICOMSEGExporter } from '../classes/DICOMSEGExporter.js';
import { segBuilder } from './segBuilder.js';
import getDateTimeAndLabel from '../util/getDateTimeAndLabel.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import messageDialog from '../util/messageDialog.js';
import {
  displayExportFailedDialog,
  displayInsufficientPermissionsDialog
} from '../util/displayExportDialogs.js';
import localBackup from './localBackup.js';

const brushModule = cornerstoneTools.store.modules.brush;

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default async function () {

  if (icrXnatRoiSession.get('writePermissions') === true) {
    beginExport();
    return;
  }

  // User does not have write access
  displayInsufficientPermissionsDialog();
}

async function beginExport () {
  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;
  const maskExtractor = new MaskExtractor(seriesInstanceUid);
  const { dateTime, label } = getDateTimeAndLabel('SEG');

  // Check if there are any Masks with metadata.
  if (maskExtractor.hasMasksToExtract() === false) {
    displayNoMasksToExportDialog();
    return;
  }


  let roiCollectionName = await segBuilder(label);

  if (!roiCollectionName) {
    console.log('cancelled.')
    return;
  }

  const masks = maskExtractor.extractMasks();

  if (!masks) {
    console.log('no mask to extract!');
    return;
  }

  const exportInProgressDialog = document.getElementById('exportVolumes');
  exportInProgressDialog.showModal();

  // Get stackToolState // TODO -> Refactor this to a helper.
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, 'stack');
  const imageIds = stackToolState.data[0].imageIds;
  const image = cornerstone.getImage(element);

  const dimensions = {
    rows: image.rows,
    columns: image.columns,
    slices: imageIds.length
  };

  dimensions.cube = dimensions.rows * dimensions.columns * dimensions.slices;

  // TODO DICOM or NIFTI will have different export channels here!
  // In the future we will check the metadata to check if the image is either NIFTI or DICOM.

  // DICOM-SEG
  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  const DICOMSegPromise = dicomSegWriter.write(masks, dimensions);

  console.log(DICOMSegPromise);

  DICOMSegPromise.then(segBlob => {
    console.log('test');
    console.log(segBlob);
    const dicomSegExporter = new DICOMSEGExporter(
      segBlob,
      seriesInstanceUid,
      label,
      roiCollectionName
    );

    console.log('seg exporter... ready!');

    dicomSegExporter.exportToXNAT().then(success => {
      console.log('PUT successful.');
      // Store that we've 'imported' a collection for this series.
      // (For all intents and purposes exporting it ends with an imported state,
      // i.e. not a fresh Mask collection.)
      if (!brushModule.state.import) {
        brushModule.state.import = {};
      }

      brushModule.state.import[seriesInstanceUid] = {
        label: label,
        name: roiCollectionName,
        modified: false
      };

      console.log('=====checking backup:=====');
      localBackup.checkBackupOnExport();
      console.log('=====checking backup DONE=====');
      exportInProgressDialog.close();
    })
    .catch(error => {
      console.log(error.message);
      exportInProgressDialog.close();
      localBackup.saveBackUpForActiveSeries();
      displayExportFailedDialog();
    });;
  });
}

/**
 * Opens dialog to notify the user there are no ROIs eligable for export.
 *
 * @author JamesAPetts
 */
function displayNoMasksToExportDialog () {
  const title = 'Nothing to Export';
  const body = 'There are no Masks to export. Please refer to the More/Help/Mask menu for more information.';

  messageDialog(title, body);
}
