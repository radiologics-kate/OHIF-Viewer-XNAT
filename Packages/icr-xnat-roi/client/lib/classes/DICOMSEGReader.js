import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { MaskImporter } from './MaskImporter.js';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require('dcmjs');

export class DICOMSEGReader {

  constructor (seriesInfo) {
    this._seriesInfo = seriesInfo;
    this._masks = [];
    console.log(seriesInfo);
  }

  read (arrayBuffer, stackToolState, dimensions) {
    dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
    multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);

    const imageIds = stackToolState.data[0].imageIds;
    const pixelData = dcmjs.data.BitArray.unpack(multiframe.PixelData);
    const segmentSequence = multiframe.SegmentSequence;




    if (Array.isArray(segmentSequence)) {
      for (let i = 0; i < segmentSequence.length; i++) {
        const segment = segmentSequence[i];
        const mask = [];

        console.log(segment);
        // TODO -> Store the segment info in some metadata somewhere.

        for (let j = 0; j < dimensions.cube; j++) {
          mask[j] = pixelData[(i * dimensions.cube) + j];
        }

        this._masks.push(mask);
      }
    } else { // Only one segment, will be stored as an object.
      const segment = segmentSequence;
      const mask = [];

      console.log(segment);
      // TODO -> Store the segment info in some metadata somewhere.

      for (let j = 0; j < dimensions.cube; j++) {
        mask[j] = pixelData[j];
      }

      this._masks.push(mask);
    }






    console.log(pixelData);

    console.log(segmentSequence);





    const maskImporter = new MaskImporter(stackToolState, dimensions);

    maskImporter.import(this._masks);
  }


}
