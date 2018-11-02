import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require('dcmjs');

console.log(dcmjs);

export class DICOMSEGWriter {

  constructor (seriesInfo) {
    this._seriesInfo = seriesInfo;
    console.log(seriesInfo);
  }

  writeDICOMSeg (masks) {
    const bitArrays = [];

    console.log(masks);

    console.log(dcmjs.data.BitArray);

    for (let i = 0; i < masks.length; i++) {
      if (masks[i]) {
        bitArrays[i] = dcmjs.data.BitArray.pack(masks[i]);
      }
    }

    console.log(bitArrays);

  }

}
