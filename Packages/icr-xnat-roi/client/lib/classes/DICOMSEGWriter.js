import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require('dcmjs');


export class DICOMSEGWriter {

  constructor (seriesInfo) {
    this._seriesInfo = seriesInfo;
    console.log(seriesInfo);
  }

  // TODO Check if multiframe!
  // TODO Then grab only one dataset and call dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);
  write (masks) {
    // Grab the base image DICOM.
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const element = activeEnabledElement.element;

    const stackToolState = cornerstoneTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;

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

      const multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);

      const seg = new dcmjs.derivations.Segmentation([multiframe]);
      const dataSet = seg.dataset;

      const SegmentSequence = dataSet.SegmentSequence;

      console.log(SegmentSequence);


      const pixels = new Uint8Array(seg.dataset.PixelData);

      // TODO -> Include all masks
      // Itterate through 3D stacks of data and give each a segment in the
      // Segment Sequence.
      // TODO -> Naming input for these, auto name them for now.

      if (masks[0]) {
        const bitArray = dcmjs.data.BitArray.pack(masks[0]);
        console.log(bitArray);

        for (let i = 0; i < pixels.length; i++) {
          pixels[i] = bitArray[i];
        }
      }

      const segBlob = dcmjs.data.datasetToBlob(seg.dataset);

      //saveAs(segBlob, "segmentation.dcm", true);

      /*
      for (let i = 0; i < masks.length; i++) {
        if (masks[i]) {
          bitArrays[i] = dcmjs.data.BitArray.pack(masks[i]);
        }
      }
      */


    });

  }

}
