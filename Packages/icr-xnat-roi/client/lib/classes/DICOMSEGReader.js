import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require('dcmjs');

export class DICOMSEGReader {

  constructor (seriesInfo) {
    this._seriesInfo = seriesInfo;
    console.log(seriesInfo);
  }

  read (arrayBuffer, stackToolState, dimensions) {
    dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
    multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);

    const imageIds = stackToolState.data[0].imageIds;

    const segmentSequence = multiframe.SegmentSequence;

    segmentSequence.forEach(segment => {
      console.log(segment);
      console.log(segment.segmentNumber);

      for (let i = 0; i < dimensions.slices; i++) {
        // TODO -> load pixel array data in for each segment.
      }
    });

  }


}
