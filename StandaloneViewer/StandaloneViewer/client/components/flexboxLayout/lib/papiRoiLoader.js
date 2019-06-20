// TODO -> Put this somewhere less HACKy
import { cornerstone , cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { getSeriesInstanceUidFromEnabledElement } from "meteor/icr:peppermint-tools";

let freehand3DModule;


export default function papiRoiLoader() {
  launchAsyncPapiRoiLoader();
}

async function launchAsyncPapiRoiLoader() {
  console.log('papiRoiLoader... GO!');

  freehand3DModule = cornerstoneTools.store.modules.freehand3D;

  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const htmlCornerstoneElement = activeEnabledElement.element;


  const seriesInstanceUid = getSeriesInstanceUidFromEnabledElement(activeEnabledElement);
  const stackToolState = cornerstoneTools.getToolState(htmlCornerstoneElement, 'stack');

  if (!stackToolState) {
    return;
  }

  const imageIds = stackToolState.data[0].imageIds;


  const fileIdsJson = await fetchPapiFileIds(seriesInstanceUid);


  const fileIds = JSON.parse(fileIdsJson).file_ids;


  const roi_numMap = await setMetadataAndGetRoiNumberToUIDMap(seriesInstanceUid);

  const promises = [];

  for (let i = 0; i < imageIds.length; i++) {
    promises.push(
      getROIsForImage(imageIds[i], fileIds[i], roi_numMap)
    );
  }

  Promise.all(promises).then(() => {
    console.log('done!');
  });
}

async function getROIsForImage(imageId, file_id, roi_numMap) {
  return new Promise(async (resolve, reject) => {
    const roiDataJSON = await fetchRoisByFileId(file_id);

    const roiData = JSON.parse(roiDataJSON);

    console.log(roiData);


    for (let i = 0; i < roiData.length; i++) {

    }


    resolve();
  });
}

async function setMetadataAndGetRoiNumberToUIDMap(seriesInstanceUid) {
  const papiROIMetadataJSON = await fetchPapiROIMetadata(seriesInstanceUid);

  const papiROIMetadata = JSON.parse(papiROIMetadataJSON);

  const structureSetUid = 'papiROIs';

  freehand3DModule.setters.structureSet(seriesInstanceUid, 'My ROIs', {
    uid: structureSetUid,
    isLocked: true
  });

  const roi_numMap = {};

  // Set metadata:
  for (let i = 0 ; i < papiROIMetadata.length; i++) {
    const { name, roi_num, color, file_ids } = papiROIMetadata[i];

    const polygonCount = file_ids.length;

    const cssFormattedColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    const ROIContourUID = freehand3DModule.setters.ROIContour(seriesInstanceUid, structureSetUid, name, {
      color: cssFormattedColor,
      polygonCount
    });

    roi_numMap[roi_num] = ROIContourUID;
  }


  Session.set("refreshRoiContourMenu", Math.random().toString);

  return roi_numMap;
}

function fetchRoisByFileId(file_id) {
  const url = `http://172.31.83.205/papi/v1/rois/file/${file_id}`;

  console.log(`fetchRoisByFileId: ${url}`);

  return fetchJSON(url);
}

function fetchPapiROIMetadata(seriesInstanceUid) {

  const url = `http://172.31.83.205/papi/v1/rois/series/${seriesInstanceUid}`;

  return fetchJSON(url);
}

function fetchPapiFileIds(seriesInstanceUid) {
  const url = `http://172.31.83.205/papi/v1/series/${seriesInstanceUid}/files`;

  return fetchJSON(url);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        resolve(false);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.send();
  });
}
