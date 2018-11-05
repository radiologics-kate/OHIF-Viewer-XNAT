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

  // TODO DICOM or NIFTI will have different export channels here!

  // DICOM-SEG
  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  dicomSegWriter.write(masks);
}
