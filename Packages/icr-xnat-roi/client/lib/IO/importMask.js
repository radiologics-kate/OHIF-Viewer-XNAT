import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { DICOMSEGReader } from '../classes/DICOMSEGReader.js';

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default async function () {
  console.log('importMask');

  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;

  // TODO -> Call XNAT to get masks!
  // TODO -> Different paths for NIFTI/DICOM.
  // TEMP -> Grab a local file.

  console.log('fetching DICOM-SEG...');
  const startFetch = performance.now();
  let dicomSegArrayBuffer = await getTestFileFromLocalStorage();
  const endFetch = performance.now();

  console.log(`...found DICOMSEG file in ${endFetch - startFetch} ms!`);

  // Get stackToolState // TODO -> Make this into a function somewhere else as
  // Both import and export use it.
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

  dimensions.sliceLength = dimensions.rows * dimensions.columns;
  dimensions.cube = dimensions.sliceLength * dimensions.slices;

  const dicomSegReader = new DICOMSEGReader(seriesInfo);

  dicomSegReader.read(
    dicomSegArrayBuffer,
    stackToolState,
    dimensions
  );
}


function getTestFileFromLocalStorage() {
  return new Promise((resolve, reject) => {
    url = 'http://localhost:8000';

    const xhr = new XMLHttpRequest();

    xhr.addEventListener('load', () => {
      console.log(xhr.response);
      //do something with the response
      resolve(xhr.response);
    });

    xhr.addEventListener('error', () => {
      console.log(`Request returned, status: ${xhr.status}`);
      console.log(xhr.message);
      reject(xhr.message)
    });

    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer'; //Type of file
    xhr.withCredentials = true;
    xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    xhr.send();
  });

}
