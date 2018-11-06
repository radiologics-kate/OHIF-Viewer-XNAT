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
  write (masks, dimensions) {
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

      let numSegments = 0;

      for (let i = 0; i < masks.length; i++) {
        if (masks[i]) {
          numSegments++;
          // TODO -> Naming input for these, auto name them for now.
          seg.addSegment({
            SegmentedPropertyCategoryCodeSequence: {
              CodeValue: "T-D0050",
              CodingSchemeDesignator: "SRT",
              CodeMeaning: "Tissue"
            },
            SegmentLabel: `TEST-${i}`,
            SegmentAlgorithmType: "MANUAL",
            RecommendedDisplayCIELabValue: [ 43802, 26566, 37721 ],
            SegmentedPropertyTypeCodeSequence: {
              CodeValue: "T-D0050",
              CodingSchemeDesignator: "SRT",
              CodeMeaning: "Tissue"
            }
          });
        }
      }

      // Re-define the PixelData ArrayBuffer to be the correct length
      // => segments * rows * columns * slices / 8 (As 8 bits/byte)
      seg.dataset.PixelData = new ArrayBuffer(
        numSegments * dimensions.cube / 8
      );

      const pixels = new Uint8Array(seg.dataset.PixelData);

      console.log(dimensions.cube);
      console.log(pixels.length);

      const lengthOfCubeInBytes = dimensions.cube / 8;

      // Fill up the PixelData array with bitpacked segment information.
      for (let i = 0; i < masks.length; i++) {
        if (masks[i]) {
          const bitArray = dcmjs.data.BitArray.pack(masks[i]);

          console.log(bitArray);

          console.log(lengthOfCubeInBytes);

          for (let j = 0; j < lengthOfCubeInBytes; j++) {
            pixels[(i * lengthOfCubeInBytes) + j] = bitArray[j];
          }

          console.log(pixels[i * lengthOfCubeInBytes]);
        }
      }

      const segBlob = dcmjs.data.datasetToBlob(seg.dataset);

      saveAs(segBlob, "segmentation.dcm", true);

    });

  }

}
