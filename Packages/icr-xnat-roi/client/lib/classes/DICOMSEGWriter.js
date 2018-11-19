import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require('dcmjs');

export class DICOMSEGWriter {

  constructor (seriesInfo) {
    this._seriesInfo = seriesInfo;
  }

  // TODO Check if multiframe!
  // TODO Then grab only one dataset and call dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);
  async write (masks, dimensions) {
    return new Promise (resolve => {
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
        const datasets = [];
        const metadataProvider = OHIF.viewer.metadataProvider;

        // Check if multiframe
        if (metadataProvider.getMultiframeModuleMetadata(images[0]).isMultiframeImage) {
          const image = images[0];
          const arrayBuffer = image.data.byteArray.buffer;
          const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
          const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

          dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
          datasets.push(dataset);
        } else {
          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const arrayBuffer = image.data.byteArray.buffer;
            const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
            const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

            dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
            datasets.push(dataset);
          }
        }

        const multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);

        const seg = new dcmjs.derivations.Segmentation([multiframe]);
        const dataSet = seg.dataset;

        const SegmentSequence = dataSet.SegmentSequence;

        let numSegments = 0;

        for (let i = 0; i < masks.length; i++) {
          if (masks[i]) {
            numSegments++;
            const segMetadata = modules.brush.getters.metadata(
              this._seriesInfo.seriesInstanceUid,
              i
            );

            console.log(segMetadata);

            seg.addSegment(segMetadata);
          }
        }

        // Re-define the PixelData ArrayBuffer to be the correct length
        // => segments * rows * columns * slices / 8 (As 8 bits/byte)
        seg.dataset.PixelData = new ArrayBuffer(
          numSegments * dimensions.cube / 8
        );

        const pixels = new Uint8Array(seg.dataset.PixelData);

        const lengthOfCubeInBytes = dimensions.cube / 8;

        // Fill up the PixelData array with bitpacked segment information.
        for (let i = 0; i < masks.length; i++) {
          if (masks[i]) {
            const bitArray = dcmjs.data.BitArray.pack(masks[i]);

            for (let j = 0; j < lengthOfCubeInBytes; j++) {
              pixels[(i * lengthOfCubeInBytes) + j] = bitArray[j];
            }
          }
        }

        const segBlob = dcmjs.data.datasetToBlob(seg.dataset);

        resolve(segBlob);
      });
    });

  }

}
