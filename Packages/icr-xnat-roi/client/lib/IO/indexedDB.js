import localBackup from './localBackup.js';

// Create an instance of a db object for us to store the open database in
let db;

export {
  db
};

window.onload = function() {
  console.log('======================= indexedDB TEST =======================');


  // Open our database; it is created if it doesn't already exist
  // (see onupgradeneeded below)
  let request = window.indexedDB.open('XNAT_OHIF_BACKUP', );

  // onerror handler signifies that the database didn't open successfully
  request.onerror = function() {
    console.log('Database failed to open');
  };

  // onsuccess handler signifies that the database opened successfully
  request.onsuccess = function() {
    console.log('Database opened successfully');

    // Store the opened database object in the db variable. This is used a lot below
    db = request.result;

    console.log(db);

    localBackup.loadBackupData();
    //testDB();
  };

  // Setup the database tables if this has not already been done
  request.onupgradeneeded = function(e) {
    // Grab a reference to the opened database
    let db = e.target.result;

    // Create an objectStore to store our data in in (basically like a single table)
    // including a auto-incrementing key
    let objectStore = db.createObjectStore('XNAT_OHIF_BACKUP', { keyPath: 'seriesInstanceUid'});

    // Define what data items the objectStore will contain
    objectStore.createIndex('seriesInstanceUid', 'seriesInstanceUid', { unique: true });
    objectStore.createIndex('dataDump', 'dataDump', { unique: false });

    console.log('Database setup complete');
  };



};



function testDB () {
  console.log('======================= testDB =======================');

  /*
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const stackToolState = cornerstoneTools.getToolState(element, 'stack');
  const imageIds = stackToolState.data[0].imageIds;
  */



  /*
  // Loop through studies to find the series
  for ( let i = 0; i < studies.length; i++ ) {
    const series = studies[i].getSeriesByUID(seriesInfo.seriesInstanceUid);
    if (series !== undefined) {
      // This study contains the series and we've retrived it.
      for ( let j = 0; j < series.getInstanceCount(); j++ ) {
        const instance = series.getInstanceByIndex(j);
        const sopInstanceUid = instance.getSOPInstanceUID();
        seriesInfo.sopInstanceUids.push(sopInstanceUid);
      }

    }
  }
  */


  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store
  let objectStore = db.transaction('XNAT_OHIF_BACKUP').objectStore('XNAT_OHIF_BACKUP');

  objectStore.openCursor().onsuccess = function(e) {
    // Get a reference to the cursor
    let cursor = e.target.result;

    // If there is still another data item to iterate through, keep running this code
    if (cursor) {

      console.log(cursor.value.seriesInstanceUid);
      console.log(cursor.value.dataDump);

      // Iterate to the next item in the cursor
      cursor.continue();
    }
  };
}
