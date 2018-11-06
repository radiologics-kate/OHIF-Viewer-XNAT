import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { MaskExtractor } from '../classes/MaskExtractor.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { DICOMSEGWriter } from '../classes/DICOMSEGWriter.js';

/**
 * TODO: If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default function () {
  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;
  const maskExtractor = new MaskExtractor(seriesInstanceUid);

  const masks = maskExtractor.extractMasks();

  if (!masks) {
    console.log('no mask to extract!');
    return;
  }

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
  // In practice we will check the metadata to check if the image is either NIFTI or DICOM.

  // DICOM-SEG
  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  dicomSegWriter.write(masks, dimensions);
}
