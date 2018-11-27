import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { Polygon } from '../classes/Polygon.js';

import { db } from './indexedDB.js';

const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

const modules = cornerstoneTools.store.modules;

export default {
  saveBackUpForActiveSeries,
  loadBackupData
};


function loadBackupData() {
  const toolStateManager = globalToolStateManager.saveToolState();

  console.log(toolStateManager);

  const studies = OHIF.viewer.StudyMetadataList.all();

  console.log(studies);

  // Loop through studies to find the series
  for ( let i = 0; i < studies.length; i++ ) {
    const displaySets = studies[i].getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      _loadDataIfDisplaySetHasBackup(displaySets[i]);
    }

  }
}


function _loadDataIfDisplaySetHasBackup (displaySet) {
  const seriesInstanceUid = displaySet.seriesInstanceUid;
  const images = displaySet.images;
  const toolStateManager = globalToolStateManager.saveToolState();

  console.log(seriesInstanceUid);

  console.log(displaySet)

  // open a read/write db transaction, ready for adding the data
  let transaction = db.transaction(['XNAT_OHIF_BACKUP'], 'readonly');

  // call an object store that's already been added to the database
  let objectStore = transaction.objectStore('XNAT_OHIF_BACKUP');

  // Make a request to GET our newItem object to the object store
  var request = objectStore.get(seriesInstanceUid);


  // Report on the success of the transaction completing, when everything is done

  request.onsuccess = function() {
    if (request.result) {
      console.log('SUCCESS');

      const data = JSON.parse(request.result.dataDump);

      console.log(data);

      if (data.freehandMouse) {
        const { metadata, toolState } = data.freehandMouse;

        modules.freehand3D.state.seriesCollection.push(metadata);


        console.log(toolState);
        for (let i = 0; i < images.length; i++) {
          console.log(toolState[i]);

          if (!toolState[i]) {
            continue;
          }



          const imageId = images[i]._imageId;

          console.log(imageId);

          const sopInstanceUid = images[i]._sopInstanceUID;

          if (!toolStateManager[imageId]) {
            toolStateManager[imageId] = {};
            toolStateManager[imageId].freehandMouse = {};
            toolStateManager[imageId].freehandMouse.data = [];
          } else if (!toolStateManager[imageId].freehandMouse) {
            toolStateManager[imageId].freehandMouse = {};
            toolStateManager[imageId].freehandMouse.data = [];
          } else if (!toolStateManager[imageId].freehandMouse.data) {
            toolStateManager[imageId].freehandMouse.data = [];
          }

          const toolStateManagerFreehandData = toolStateManager[imageId].freehandMouse.data;

          // Add each polygon.
          const freehandToolData = toolState[i].data;

          console.log(freehandToolData.length)
          console.log('STARTING LOOP');

          for (let j = 0; j < freehandToolData.length; j++) {
            console.log(j);

            const toolData = freehandToolData[j];

            const polygon = new Polygon(
              toolData.handles,
              sopInstanceUid,
              toolData.seriesInstanceUid,
              toolData.structureSetUid,
              toolData.ROIContourUid,
              toolData.uid,
              1
            );

            toolStateManagerFreehandData.push(
              polygon.getFreehandToolData()
            );
          }

        }

      }
      /*
      if (data.brush) {
        const { metadata, toolState } = data.brush;

        console.log(metadata);

        modules.brush.state.segmentationMetadata.seriesInstanceUid = metadata;

        modules.freehand3D.state.seriesCollection.push(metadata);


        console.log(toolState);
        for (let i = 0; i < images.length; i++) {
          console.log(toolState[i]);

          if (!toolState[i]) {
            continue;
          }

          const imageId = images[i]._imageId;

          console.log(imageId);

          const sopInstanceUid = images[i]._sopInstanceUID;

          if (!toolStateManager[imageId]) {
            toolStateManager[imageId] = {};
            toolStateManager[imageId].brush = {};
            toolStateManager[imageId].brush.data = [];
          } else if (!toolStateManager[imageId].brush) {
            toolStateManager[imageId].brush = {};
            toolStateManager[imageId].brush.data = [];
          } else if (!toolStateManager[imageId].brush.data) {
            toolStateManager[imageId].brush.data = [];
          }

          toolStateManager[imageId].brush = toolState[i];
        }
      }
      */

      console.log('====== DONE ======');

      console.log(toolStateManager);

    }

  };




}




function saveBackUpForActiveSeries() {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, 'stack');
  const imageIds = stackToolState.data[0].imageIds;
  const toolStateManager = globalToolStateManager.saveToolState();

  const brushToolState = {};
  const freehandMouseToolState = {};

  // Aggregate toolState
  for (let i = 0; i < imageIds.length; i++) {
    const imageToolState = toolStateManager[imageIds[i]];

    if (!imageToolState) {
      continue;
    }

    if (imageToolState.brush) {
      brushToolState[i] = imageToolState.brush;
    }

    if (imageToolState.freehandMouse) {
      freehandMouseToolState[i] = imageToolState.freehandMouse;
    }
  }

  const dataDump = {};

  const brushMetadata = modules.brush.state.segmentationMetadata[seriesInstanceUid];

  if (brushMetadata) {
    dataDump.brush = {};
    dataDump.brush.metadata = brushMetadata;
    dataDump.brush.toolState = brushToolState;
  }

  const freehandMouseMetadata = modules.freehand3D.getters.series(seriesInstanceUid);

  if (freehandMouseMetadata) {
    dataDump.freehandMouse = {};
    dataDump.freehandMouse.metadata = freehandMouseMetadata;
    dataDump.freehandMouse.toolState = freehandMouseToolState;
  }


  if (dataDump.brush || dataDump.freehandMouse) {
    // Save data
    let newItem = {
      seriesInstanceUid,
      dataDump: JSON.stringify(dataDump)
    };

    // open a read/write db transaction, ready for adding the data
    let transaction = db.transaction(['XNAT_OHIF_BACKUP'], 'readwrite');

    // call an object store that's already been added to the database
    let objectStore = transaction.objectStore('XNAT_OHIF_BACKUP');

    // Make a request to PUT our newItem object to the object store
    var request = objectStore.put(newItem);


    // Report on the success of the transaction completing, when everything is done
    transaction.oncomplete = function() {
      console.log('Transaction completed: database modification finished.');
    };

    transaction.onerror = function() {
      console.log('Transaction not completed due to error');
    };
  }
}
