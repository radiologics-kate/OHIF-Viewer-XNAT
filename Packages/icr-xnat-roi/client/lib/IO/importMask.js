import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { AsyncMaskFetcher } from '../classes/AsyncMaskFetcher.js';

// TEMP
import { MaskImporter } from '../classes/MaskImporter.js';
// TEMP

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export default async function () {
  console.log('importMask');

  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();


  const asyncMaskFetcher = new AsyncMaskFetcher(seriesInstanceUid);
  asyncMaskFetcher.fetch();

  /*
  // TEMP -> Grab a local file.
  const maskImporter = new MaskImporter();

  console.log('fetching NIFTI...');
  const startFetch = performance.now();
  let niftiArrayBuffer = await getTestFileFromLocalStorage();
  const endFetch = performance.now();

  console.log(`...found NIFTI file in ${endFetch - startFetch} ms!`);


  maskImporter.importNIFTI(
    niftiArrayBuffer,
    'exampleCollectionName',
    'exampleCollectionLabel'
  );
  */

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
