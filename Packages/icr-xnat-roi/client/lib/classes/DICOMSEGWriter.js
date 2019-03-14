import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";

const brushModule = cornerstoneTools.store.modules.brush;
const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const dcmjs = require("dcmjs");

export class DICOMSEGWriter {
  constructor(seriesInfo) {
    this._seriesInfo = seriesInfo;
  }

  async write(name) {
    return new Promise(resolve => {
      // Grab the base image DICOM.
      const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
      const element = activeEnabledElement.element;

      const stackToolState = cornerstoneTools.getToolState(element, "stack");
      const imageIds = stackToolState.data[0].imageIds;

      let imagePromises = [];
      for (let i = 0; i < imageIds.length; i++) {
        imagePromises.push(cornerstone.loadAndCacheImage(imageIds[i]));
      }

      const brushData = {
        toolState: globalToolStateManager.saveToolState(),
        segments: brushModule.getters.metadata(
          this._seriesInfo.seriesInstanceUid
        )
      };

      Promise.all(imagePromises)
        .then(images => {
          console.log("Got all images. (images, brushData):");
          console.log(images);
          console.log(brushData);

          const options = {
            includeSliceSpacing: true,
            SeriesDescription: name,
            Manufacturer: this._seriesInfo.equipment.manufacturerName,
            ManufacturerModelName: this._seriesInfo.equipment
              .manufacturerModelName,
            SoftwareVersions: this._seriesInfo.equipment.softwareVersion
          };

          const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(
            images,
            brushData,
            options
          );

          console.log(segBlob);

          resolve(segBlob);
        })
        .catch(err => console.log(err));
    });
  }
}
