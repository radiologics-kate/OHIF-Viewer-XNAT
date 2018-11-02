import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
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


  // TODO Check if multiframe!
  // TODO Then grab only one dataset and call dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);
  writeDICOMSeg (masks) {
    const bitArrays = [];

    // Grab the base image DICOM.
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    const stackToolState = cornerstoneTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;


    console.log(imageIds);

    let imagePromises = [];
    for (let i = 0; i < imageIds.length; i++) {
      imagePromises.push(
        cornerstone.loadImage(imageIds[0])
      );
    }

    Promise.all(imagePromises).then((images) => {
      console.log(images);

      const datasets = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const arrayBuffer = image.data.byteArray.buffer;
        const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
        const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

        dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

        datasets.push(dataset);
      }

      console.log(datasets);

      const multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);

      console.log(multiframe);

    });

    return;

    console.log(dcmjs.data.BitArray);

    for (let i = 0; i < masks.length; i++) {
      if (masks[i]) {
        bitArrays[i] = dcmjs.data.BitArray.pack(masks[i]);
      }
    }

    console.log(bitArrays);

  }

}
