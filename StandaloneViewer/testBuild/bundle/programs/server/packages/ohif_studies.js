(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var WADOProxy = Package['ohif:wadoproxy'].WADOProxy;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var entry;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:studies":{"both":{"main.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/both/main.js                                                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.studies = {};

require('../imports/both');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"main.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/server/main.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
require('../imports/server');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"imports":{"both":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/index.js                                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./lib"));
module.watch(require("./services"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/lib/index.js                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./parseFloatArray.js"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseFloatArray.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/lib/parseFloatArray.js                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  parseFloatArray: () => parseFloatArray
});

const parseFloatArray = function (obj) {
  var result = [];

  if (!obj) {
    return result;
  }

  var objs = obj.split("\\");

  for (var i = 0; i < objs.length; i++) {
    result.push(parseFloat(objs[i]));
  }

  return result;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"services":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/services/index.js                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./namespace"));
module.watch(require("./qido/instances.js"));
module.watch(require("./qido/studies.js"));
module.watch(require("./wado/retrieveMetadata.js"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/services/namespace.js                                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.studies.services = {
  QIDO: {},
  WADO: {}
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"qido":{"instances.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/services/qido/instances.js                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let DICOMwebClient;
module.watch(require("dicomweb-client"), {
  default(v) {
    DICOMwebClient = v;
  }

}, 1);
const {
  DICOMWeb
} = OHIF;
/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param studyInstanceUid
 * @param resultData
 * @returns {Array} Series List
 */

function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
  var seriesMap = {};
  var seriesList = [];
  resultData.forEach(function (instance) {
    // Use seriesMap to cache series data
    // If the series instance UID has already been used to
    // process series data, continue using that series
    var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
    var series = seriesMap[seriesInstanceUid]; // If no series data exists in the seriesMap cache variable,
    // process any available series data

    if (!series) {
      series = {
        seriesInstanceUid: seriesInstanceUid,
        seriesNumber: DICOMWeb.getString(instance['00200011']),
        instances: []
      }; // Save this data in the seriesMap cache variable

      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    } // The uri for the dicomweb
    // NOTE: DCM4CHEE seems to return the data zipped
    // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
    //       know how to parse yet
    //var uri = DICOMWeb.getString(instance['00081190']);
    //uri = uri.replace('wado-rs', 'dicom-web');
    // manually create a WADO-URI from the UIDs
    // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?


    var sopInstanceUid = DICOMWeb.getString(instance['00080018']);
    var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + '&contentType=application%2Fdicom'; // Add this instance to the current series

    series.instances.push({
      sopClassUid: DICOMWeb.getString(instance['00080016']),
      sopInstanceUid: sopInstanceUid,
      uri: uri,
      instanceNumber: DICOMWeb.getString(instance['00200013'])
    });
  });
  return seriesList;
}
/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @throws ECONNREFUSED
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */


OHIF.studies.services.QIDO.Instances = function (server, studyInstanceUid) {
  // TODO: Are we using this function anywhere?? Can we remove it?
  const config = {
    url: server.qidoRoot,
    headers: OHIF.DICOMWeb.getAuthorizationHeader()
  };
  const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  const queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
  const options = {
    studyInstanceUID: studyInstanceUid
  };
  return dicomWeb.searchForInstances(options).then(result => {
    return {
      wadoUriRoot: server.wadoUriRoot,
      studyInstanceUid: studyInstanceUid,
      seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result.data)
    };
  });
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"studies.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/services/qido/studies.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let DICOMwebClient;
module.watch(require("dicomweb-client"), {
  default(v) {
    DICOMwebClient = v;
  }

}, 1);
const {
  DICOMWeb
} = OHIF; // TODO: Is there an easier way to do this?

if (Meteor.isServer) {
  var XMLHttpRequest = require('xhr2');

  global.XMLHttpRequest = XMLHttpRequest;
}
/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */


function dateToString(date) {
  if (!date) return '';
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  year = '0'.repeat(4 - year.length).concat(year);
  month = '0'.repeat(2 - month.length).concat(month);
  day = '0'.repeat(2 - day.length).concat(day);
  return ''.concat(year, month, day);
}
/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */


function getQIDOQueryParams(filter, serverSupportsQIDOIncludeField) {
  const commaSeparatedFields = ['00081030', // Study Description
  '00080060' //Modality
  // Add more fields here if you want them in the result
  ].join(',');
  const parameters = {
    PatientName: filter.patientName,
    PatientID: filter.patientId,
    AccessionNumber: filter.accessionNumber,
    StudyDescription: filter.studyDescription,
    ModalitiesInStudy: filter.modalitiesInStudy,
    limit: filter.limit,
    offset: filter.offset,
    includefield: serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all'
  }; // build the StudyDate range parameter

  if (filter.studyDateFrom || filter.studyDateTo) {
    const dateFrom = dateToString(new Date(filter.studyDateFrom));
    const dateTo = dateToString(new Date(filter.studyDateTo));
    parameters.StudyDate = `${dateFrom}-${dateTo}`;
  } // Build the StudyInstanceUID parameter


  if (filter.studyInstanceUid) {
    let studyUids = filter.studyInstanceUid;
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUids;
  } // Clean query params of undefined values.


  const params = {};
  Object.keys(parameters).forEach(key => {
    if (parameters[key] !== undefined && parameters[key] !== "") {
      params[key] = parameters[key];
    }
  });
  return params;
}
/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */


function resultDataToStudies(resultData) {
  const studies = [];
  if (!resultData || !resultData.length) return;
  resultData.forEach(study => studies.push({
    studyInstanceUid: DICOMWeb.getString(study['0020000D']),
    // 00080005 = SpecificCharacterSet
    studyDate: DICOMWeb.getString(study['00080020']),
    studyTime: DICOMWeb.getString(study['00080030']),
    accessionNumber: DICOMWeb.getString(study['00080050']),
    referringPhysicianName: DICOMWeb.getString(study['00080090']),
    // 00081190 = URL
    patientName: DICOMWeb.getName(study['00100010']),
    patientId: DICOMWeb.getString(study['00100020']),
    patientBirthdate: DICOMWeb.getString(study['00100030']),
    patientSex: DICOMWeb.getString(study['00100040']),
    studyId: DICOMWeb.getString(study['00200010']),
    numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
    numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
    studyDescription: DICOMWeb.getString(study['00081030']),
    // modality: DICOMWeb.getString(study['00080060']),
    // modalitiesInStudy: DICOMWeb.getString(study['00080061']),
    modalities: DICOMWeb.getString(DICOMWeb.getModalities(study['00080060'], study['00080061']))
  }));
  return studies;
}

OHIF.studies.services.QIDO.Studies = (server, filter) => {
  const config = {
    url: server.qidoRoot,
    headers: OHIF.DICOMWeb.getAuthorizationHeader()
  };
  const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  const queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
  const options = {
    queryParams
  };
  return dicomWeb.searchForStudies(options).then(resultDataToStudies);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"wado":{"retrieveMetadata.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/both/services/wado/retrieveMetadata.js                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let DICOMwebClient;
module.watch(require("dicomweb-client"), {
  default(v) {
    DICOMwebClient = v;
  }

}, 1);
let parseFloatArray;
module.watch(require("../../lib/parseFloatArray"), {
  parseFloatArray(v) {
    parseFloatArray = v;
  }

}, 2);
const {
  DICOMWeb
} = OHIF;
/**
 * Simple cache schema for retrieved color palettes.
 */

const paletteColorCache = {
  count: 0,
  maxAge: 24 * 60 * 60 * 1000,
  // 24h cache?
  entries: {},
  isValidUID: function (paletteUID) {
    return typeof paletteUID === 'string' && paletteUID.length > 0;
  },
  get: function (paletteUID) {
    let entry = null;

    if (this.entries.hasOwnProperty(paletteUID)) {
      entry = this.entries[paletteUID]; // check how the entry is...

      if (Date.now() - entry.time > this.maxAge) {
        // entry is too old... remove entry.
        delete this.entries[paletteUID];
        this.count--;
        entry = null;
      }
    }

    return entry;
  },
  add: function (entry) {
    if (this.isValidUID(entry.uid)) {
      let paletteUID = entry.uid;

      if (this.entries.hasOwnProperty(paletteUID) !== true) {
        this.count++; // increment cache entry count...
      }

      entry.time = Date.now();
      this.entries[paletteUID] = entry; // @TODO: Add logic to get rid of old entries and reduce memory usage...
    }
  }
};
/** Returns a WADO url for an instance
 *
 * @param studyInstanceUid
 * @param seriesInstanceUid
 * @param sopInstanceUid
 * @returns  {string}
 */

function buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
  // TODO: This can be removed, since DICOMWebClient has the same function. Not urgent, though
  const params = [];
  params.push('requestType=WADO');
  params.push(`studyUID=${studyInstanceUid}`);
  params.push(`seriesUID=${seriesInstanceUid}`);
  params.push(`objectUID=${sopInstanceUid}`);
  params.push('contentType=application/dicom');
  params.push('transferSyntax=*');
  const paramString = params.join('&');
  return `${server.wadoUriRoot}?${paramString}`;
}

function buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
  return `${server.wadoRoot}/studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${sopInstanceUid}`;
}

function buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid, frame) {
  const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
  frame = frame != null || 1;
  return `${baseWadoRsUri}/frames/${frame}`;
}
/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */


function getSourceImageInstanceUid(instance) {
  // TODO= Parse the whole Source Image Sequence
  // This is a really poor workaround for now.
  // Later we should probably parse the whole sequence.
  var SourceImageSequence = instance['00082112'];

  if (SourceImageSequence && SourceImageSequence.Value && SourceImageSequence.Value.length) {
    return SourceImageSequence.Value[0]['00081155'].Value[0];
  }
}

function getPaletteColor(server, instance, tag, lutDescriptor) {
  const numLutEntries = lutDescriptor[0];
  const bits = lutDescriptor[2];
  let uri = WADOProxy.convertURL(instance[tag].BulkDataURI, server); // TODO: Workaround for dcm4chee behind SSL-terminating proxy returning
  // incorrect bulk data URIs

  if (server.wadoRoot.indexOf('https') === 0 && !uri.includes('https')) {
    uri = uri.replace('http', 'https');
  }

  const config = {
    url: server.wadoRoot,
    //BulkDataURI is absolute, so this isn't used
    headers: OHIF.DICOMWeb.getAuthorizationHeader()
  };
  const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  const options = {
    BulkDataURI: uri
  };

  const readUInt16 = (byteArray, position) => {
    return byteArray[position] + byteArray[position + 1] * 256;
  };

  const arrayBufferToPaletteColorLUT = arraybuffer => {
    const byteArray = new Uint8Array(arraybuffer);
    const lut = [];

    for (let i = 0; i < numLutEntries; i++) {
      if (bits === 16) {
        lut[i] = readUInt16(byteArray, i * 2);
      } else {
        lut[i] = byteArray[i];
      }
    }

    return lut;
  };

  return dicomWeb.retrieveBulkData(options).then(arrayBufferToPaletteColorLUT);
}
/**
 * Fetch palette colors for instances with "PALETTE COLOR" photometricInterpretation.
 *
 * @param server {Object} Current server;
 * @param instance {Object} The retrieved instance metadata;
 * @returns {String} The ReferenceSOPInstanceUID
 */


function getPaletteColors(server, instance, lutDescriptor) {
  return Promise.asyncApply(() => {
    let paletteUID = DICOMWeb.getString(instance['00281199']);
    return new Promise((resolve, reject) => {
      if (paletteColorCache.isValidUID(paletteUID)) {
        const entry = paletteColorCache.get(paletteUID);

        if (entry) {
          return resolve(entry);
        }
      } // no entry in cache... Fetch remote data.


      const r = getPaletteColor(server, instance, '00281201', lutDescriptor);
      const g = getPaletteColor(server, instance, '00281202', lutDescriptor);
      ;
      const b = getPaletteColor(server, instance, '00281203', lutDescriptor);
      ;
      const promises = [r, g, b];
      Promise.all(promises).then(args => {
        entry = {
          red: args[0],
          green: args[1],
          blue: args[2]
        }; // when paletteUID is present, the entry can be cached...

        entry.uid = paletteUID;
        paletteColorCache.add(entry);
        resolve(entry);
      });
    });
  });
}

function getFrameIncrementPointer(element) {
  const frameIncrementPointerNames = {
    '00181065': 'frameTimeVector',
    '00181063': 'frameTime'
  };

  if (!element || !element.Value || !element.Value.length) {
    return;
  }

  const value = element.Value[0];
  return frameIncrementPointerNames[value];
}

function getRadiopharmaceuticalInfo(instance) {
  const modality = DICOMWeb.getString(instance['00080060']);

  if (modality !== 'PT') {
    return;
  }

  const radiopharmaceuticalInfo = instance['00540016'];

  if (radiopharmaceuticalInfo === undefined || !radiopharmaceuticalInfo.Value || !radiopharmaceuticalInfo.Value.length) {
    return;
  }

  const firstPetRadiopharmaceuticalInfo = radiopharmaceuticalInfo.Value[0];
  return {
    radiopharmaceuticalStartTime: DICOMWeb.getString(firstPetRadiopharmaceuticalInfo['00181072']),
    radionuclideTotalDose: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181074']),
    radionuclideHalfLife: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181075'])
  };
}
/**
 * Parses result data from a WADO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */


function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
  return Promise.asyncApply(() => {
    if (!resultData.length) {
      return;
    }

    const anInstance = resultData[0];

    if (!anInstance) {
      return;
    }

    const studyData = {
      seriesList: [],
      studyInstanceUid,
      wadoUriRoot: server.wadoUriRoot,
      patientName: DICOMWeb.getName(anInstance['00100010']),
      patientId: DICOMWeb.getString(anInstance['00100020']),
      patientAge: DICOMWeb.getNumber(anInstance['00101010']),
      patientSize: DICOMWeb.getNumber(anInstance['00101020']),
      patientWeight: DICOMWeb.getNumber(anInstance['00101030']),
      accessionNumber: DICOMWeb.getString(anInstance['00080050']),
      studyDate: DICOMWeb.getString(anInstance['00080020']),
      modalities: DICOMWeb.getString(anInstance['00080061']),
      studyDescription: DICOMWeb.getString(anInstance['00081030']),
      imageCount: DICOMWeb.getString(anInstance['00201208']),
      studyInstanceUid: DICOMWeb.getString(anInstance['0020000D']),
      institutionName: DICOMWeb.getString(anInstance['00080080'])
    };
    const seriesMap = {};
    Promise.await(Promise.all(resultData.map(function (instance) {
      return Promise.asyncApply(() => {
        const seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
        let series = seriesMap[seriesInstanceUid];

        if (!series) {
          series = {
            seriesDescription: DICOMWeb.getString(instance['0008103E']),
            modality: DICOMWeb.getString(instance['00080060']),
            seriesInstanceUid: seriesInstanceUid,
            seriesNumber: DICOMWeb.getNumber(instance['00200011']),
            seriesDate: DICOMWeb.getString(instance['00080021']),
            seriesTime: DICOMWeb.getString(instance['00080031']),
            instances: []
          };
          seriesMap[seriesInstanceUid] = series;
          studyData.seriesList.push(series);
        }

        const sopInstanceUid = DICOMWeb.getString(instance['00080018']);
        const wadouri = buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const wadorsuri = buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const instanceSummary = {
          imageType: DICOMWeb.getString(instance['00080008']),
          sopClassUid: DICOMWeb.getString(instance['00080016']),
          modality: DICOMWeb.getString(instance['00080060']),
          sopInstanceUid,
          instanceNumber: DICOMWeb.getNumber(instance['00200013']),
          imagePositionPatient: DICOMWeb.getString(instance['00200032']),
          imageOrientationPatient: DICOMWeb.getString(instance['00200037']),
          frameOfReferenceUID: DICOMWeb.getString(instance['00200052']),
          sliceLocation: DICOMWeb.getNumber(instance['00201041']),
          samplesPerPixel: DICOMWeb.getNumber(instance['00280002']),
          photometricInterpretation: DICOMWeb.getString(instance['00280004']),
          planarConfiguration: DICOMWeb.getNumber(instance['00280006']),
          rows: DICOMWeb.getNumber(instance['00280010']),
          columns: DICOMWeb.getNumber(instance['00280011']),
          pixelSpacing: DICOMWeb.getString(instance['00280030']),
          pixelAspectRatio: DICOMWeb.getString(instance['00280034']),
          bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
          bitsStored: DICOMWeb.getNumber(instance['00280101']),
          highBit: DICOMWeb.getNumber(instance['00280102']),
          pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
          smallestPixelValue: DICOMWeb.getNumber(instance['00280106']),
          largestPixelValue: DICOMWeb.getNumber(instance['00280107']),
          windowCenter: DICOMWeb.getString(instance['00281050']),
          windowWidth: DICOMWeb.getString(instance['00281051']),
          rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
          rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
          rescaleType: DICOMWeb.getNumber(instance['00281054']),
          sourceImageInstanceUid: getSourceImageInstanceUid(instance),
          laterality: DICOMWeb.getString(instance['00200062']),
          viewPosition: DICOMWeb.getString(instance['00185101']),
          acquisitionDateTime: DICOMWeb.getString(instance['0008002A']),
          numberOfFrames: DICOMWeb.getNumber(instance['00280008']),
          frameIncrementPointer: getFrameIncrementPointer(instance['00280009']),
          frameTime: DICOMWeb.getNumber(instance['00181063']),
          frameTimeVector: parseFloatArray(DICOMWeb.getString(instance['00181065'])),
          sliceThickness: DICOMWeb.getNumber(instance['00180050']),
          lossyImageCompression: DICOMWeb.getString(instance['00282110']),
          derivationDescription: DICOMWeb.getString(instance['00282111']),
          lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
          lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
          echoNumber: DICOMWeb.getString(instance['00180086']),
          contrastBolusAgent: DICOMWeb.getString(instance['00180010']),
          radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(instance),
          baseWadoRsUri: baseWadoRsUri,
          wadouri: WADOProxy.convertURL(wadouri, server),
          wadorsuri: WADOProxy.convertURL(wadorsuri, server),
          imageRendering: server.imageRendering,
          thumbnailRendering: server.thumbnailRendering
        }; // Get additional information if the instance uses "PALETTE COLOR" photometric interpretation

        if (instanceSummary.photometricInterpretation === 'PALETTE COLOR') {
          const redPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281101']));
          const greenPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281102']));
          const bluePaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281103']));
          const palettes = Promise.await(getPaletteColors(server, instance, redPaletteColorLookupTableDescriptor));

          if (palettes) {
            if (palettes.uid) {
              instanceSummary.paletteColorLookupTableUID = palettes.uid;
            }

            instanceSummary.redPaletteColorLookupTableData = palettes.red;
            instanceSummary.greenPaletteColorLookupTableData = palettes.green;
            instanceSummary.bluePaletteColorLookupTableData = palettes.blue;
            instanceSummary.redPaletteColorLookupTableDescriptor = redPaletteColorLookupTableDescriptor;
            instanceSummary.greenPaletteColorLookupTableDescriptor = greenPaletteColorLookupTableDescriptor;
            instanceSummary.bluePaletteColorLookupTableDescriptor = bluePaletteColorLookupTableDescriptor;
          }
        }

        series.instances.push(instanceSummary);
      });
    })));
    return studyData;
  });
}
/**
 * Retrieve Study MetaData from a DICOM server using a WADO call
 *
 * @param server
 * @param studyInstanceUid
 * @returns {Promise}
 */


OHIF.studies.services.WADO.RetrieveMetadata = function (server, studyInstanceUid) {
  return Promise.asyncApply(() => {
    const config = {
      url: server.wadoRoot,
      headers: OHIF.DICOMWeb.getAuthorizationHeader()
    };
    const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
    const options = {
      studyInstanceUID: studyInstanceUid
    };
    return dicomWeb.retrieveStudyMetadata(options).then(result => {
      return resultDataToStudyMetadata(server, studyInstanceUid, result);
    });
  });
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"server":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/index.js                                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./methods"));
module.watch(require("./services"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods":{"getStudyMetadata.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/methods/getStudyMetadata.js                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
Meteor.methods({
  /**
   * Retrieves Study metadata given a Study Instance UID
   * This Meteor method is available from both the client and the server
   */
  GetStudyMetadata: function (studyInstanceUid) {
    OHIF.log.info('GetStudyMetadata(%s)', studyInstanceUid); // Get the server data. This is user-defined in the config.json files or through servers
    // configuration modal

    const server = OHIF.servers.getCurrentServer();

    if (!server) {
      throw new Meteor.Error('improper-server-config', 'No properly configured server was available over DICOMWeb or DIMSE.');
    }

    try {
      if (server.type === 'dicomWeb') {
        return OHIF.studies.services.WADO.RetrieveMetadata(server, studyInstanceUid);
      } else if (server.type === 'dimse') {
        return OHIF.studies.services.DIMSE.RetrieveMetadata(studyInstanceUid);
      }
    } catch (error) {
      OHIF.log.trace();
      throw error;
    }
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/methods/index.js                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./getStudyMetadata.js"));
module.watch(require("./studylistSearch.js"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"studylistSearch.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/methods/studylistSearch.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
Meteor.methods({
  /**
   * Use the specified filter to conduct a search from the DICOM server
   *
   * @param filter
   */
  StudyListSearch(filter) {
    // Get the server data. This is user-defined in the config.json files or through servers
    // configuration modal
    const server = OHIF.servers.getCurrentServer();

    if (!server) {
      throw new Meteor.Error('improper-server-config', 'No properly configured server was available over DICOMWeb or DIMSE.');
    }

    try {
      if (server.type === 'dicomWeb') {
        return OHIF.studies.services.QIDO.Studies(server, filter);
      } else if (server.type === 'dimse') {
        return OHIF.studies.services.DIMSE.Studies(filter);
      }
    } catch (error) {
      OHIF.log.trace();
      throw error;
    }
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"services":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/index.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.watch(require("./namespace.js"));
module.watch(require("./dimse/instances.js"));
module.watch(require("./dimse/studies.js"));
module.watch(require("./dimse/retrieveMetadata.js"));
module.watch(require("./dimse/setup.js"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/namespace.js                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.studies.services.DIMSE = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dimse":{"instances.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/dimse/instances.js                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let DIMSE;
module.watch(require("dimse"), {
  default(v) {
    DIMSE = v;
  }

}, 1);

/**
 * Parses data returned from a study search and transforms it into
 * an array of series that are present in the study
 *
 * @param resultData
 * @param studyInstanceUid
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(resultData, studyInstanceUid) {
  const seriesMap = {};
  const seriesList = [];
  resultData.forEach(function (instanceRaw) {
    const instance = instanceRaw.toObject(); // Use seriesMap to cache series data
    // If the series instance UID has already been used to
    // process series data, continue using that series

    const seriesInstanceUid = instance[0x0020000E];
    let series = seriesMap[seriesInstanceUid]; // If no series data exists in the seriesMap cache variable,
    // process any available series data

    if (!series) {
      series = {
        seriesInstanceUid: seriesInstanceUid,
        seriesNumber: instance[0x00200011],
        instances: []
      }; // Save this data in the seriesMap cache variable

      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    } // TODO: Check which peer it should point to


    const server = OHIF.servers.getCurrentServer().peers[0];
    const serverRoot = server.host + ':' + server.port;
    const sopInstanceUid = instance[0x00080018];
    const uri = serverRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1'; // Add this instance to the current series

    series.instances.push({
      sopClassUid: instance[0x00080016],
      sopInstanceUid,
      uri,
      instanceNumber: instance[0x00200013]
    });
  });
  return seriesList;
}
/**
 * Retrieve a set of instances using a DIMSE call
 * @param studyInstanceUid
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */


OHIF.studies.services.DIMSE.Instances = function (studyInstanceUid) {
  //var url = buildUrl(server, studyInstanceUid);
  const result = DIMSE.retrieveInstances(studyInstanceUid);
  return {
    studyInstanceUid: studyInstanceUid,
    seriesList: resultDataToStudyMetadata(result, studyInstanceUid)
  };
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"retrieveMetadata.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/dimse/retrieveMetadata.js                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
let parseFloatArray;
module.watch(require("meteor/ohif:studies/imports/both/lib/parseFloatArray"), {
  parseFloatArray(v) {
    parseFloatArray = v;
  }

}, 1);
let DIMSE;
module.watch(require("dimse"), {
  default(v) {
    DIMSE = v;
  }

}, 2);

/**
 * Returns the value of the element (e.g. '00280009')
 *
 * @param element - The group/element of the element (e.g. '00280009')
 * @param defaultValue - The default value to return if the element does not exist
 * @returns {*}
 */
function getValue(element, defaultValue) {
  if (!element || !element.value) {
    return defaultValue;
  }

  return element.value;
}
/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */


function getSourceImageInstanceUid(instance) {
  // TODO= Parse the whole Source Image Sequence
  // This is a really poor workaround for now.
  // Later we should probably parse the whole sequence.
  const SourceImageSequence = instance[0x00082112];

  if (SourceImageSequence && SourceImageSequence.length) {
    return SourceImageSequence[0][0x00081155];
  }
}
/**
 * Parses result data from a DIMSE search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */


function resultDataToStudyMetadata(studyInstanceUid, resultData) {
  OHIF.log.info('resultDataToStudyMetadata');
  const seriesMap = {};
  const seriesList = [];

  if (!resultData.length) {
    return;
  }

  const anInstance = resultData[0].toObject();

  if (!anInstance) {
    return;
  }

  const studyData = {
    seriesList: seriesList,
    patientName: anInstance[0x00100010],
    patientId: anInstance[0x00100020],
    patientBirthDate: anInstance[0x00100030],
    patientSex: anInstance[0x00100040],
    accessionNumber: anInstance[0x00080050],
    studyDate: anInstance[0x00080020],
    modalities: anInstance[0x00080061],
    studyDescription: anInstance[0x00081030],
    imageCount: anInstance[0x00201208],
    studyInstanceUid: anInstance[0x0020000D],
    institutionName: anInstance[0x00080080]
  };
  resultData.forEach(function (instanceRaw) {
    const instance = instanceRaw.toObject();
    const seriesInstanceUid = instance[0x0020000E];
    let series = seriesMap[seriesInstanceUid];

    if (!series) {
      series = {
        seriesDescription: instance[0x0008103E],
        modality: instance[0x00080060],
        seriesInstanceUid: seriesInstanceUid,
        seriesNumber: parseFloat(instance[0x00200011]),
        instances: []
      };
      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    }

    const sopInstanceUid = instance[0x00080018];
    const instanceSummary = {
      imageType: instance[0x00080008],
      sopClassUid: instance[0x00080016],
      modality: instance[0x00080060],
      sopInstanceUid: sopInstanceUid,
      instanceNumber: parseFloat(instance[0x00200013]),
      imagePositionPatient: instance[0x00200032],
      imageOrientationPatient: instance[0x00200037],
      frameOfReferenceUID: instance[0x00200052],
      sliceThickness: parseFloat(instance[0x00180050]),
      sliceLocation: parseFloat(instance[0x00201041]),
      tablePosition: parseFloat(instance[0x00189327]),
      samplesPerPixel: parseFloat(instance[0x00280002]),
      photometricInterpretation: instance[0x00280004],
      planarConfiguration: parseFloat(instance[0x00280006]),
      rows: parseFloat(instance[0x00280010]),
      columns: parseFloat(instance[0x00280011]),
      pixelSpacing: instance[0x00280030],
      bitsAllocated: parseFloat(instance[0x00280100]),
      bitsStored: parseFloat(instance[0x00280101]),
      highBit: parseFloat(instance[0x00280102]),
      pixelRepresentation: parseFloat(instance[0x00280103]),
      windowCenter: instance[0x00281050],
      windowWidth: instance[0x00281051],
      rescaleIntercept: parseFloat(instance[0x00281052]),
      rescaleSlope: parseFloat(instance[0x00281053]),
      sourceImageInstanceUid: getSourceImageInstanceUid(instance),
      laterality: instance[0x00200062],
      viewPosition: instance[0x00185101],
      acquisitionDateTime: instance[0x0008002A],
      numberOfFrames: parseFloat(instance[0x00280008]),
      frameIncrementPointer: getValue(instance[0x00280009]),
      frameTime: parseFloat(instance[0x00181063]),
      frameTimeVector: parseFloatArray(instance[0x00181065]),
      lossyImageCompression: instance[0x00282110],
      derivationDescription: instance[0x00282111],
      lossyImageCompressionRatio: instance[0x00282112],
      lossyImageCompressionMethod: instance[0x00282114],
      spacingBetweenSlices: instance[0x00180088],
      echoNumber: instance[0x00180086],
      contrastBolusAgent: instance[0x00180010]
    }; // Retrieve the actual data over WADO-URI

    const server = OHIF.servers.getCurrentServer();
    const wadouri = `${server.wadoUriRoot}?requestType=WADO&studyUID=${studyInstanceUid}&seriesUID=${seriesInstanceUid}&objectUID=${sopInstanceUid}&contentType=application%2Fdicom`;
    instanceSummary.wadouri = WADOProxy.convertURL(wadouri, server);
    series.instances.push(instanceSummary);
  });
  studyData.studyInstanceUid = studyInstanceUid;
  return studyData;
}
/**
 * Retrieved Study MetaData from a DICOM server using DIMSE
 * @param studyInstanceUid
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */


OHIF.studies.services.DIMSE.RetrieveMetadata = function (studyInstanceUid) {
  // TODO: Check which peer it should point to
  const activeServer = OHIF.servers.getCurrentServer().peers[0];
  const supportsInstanceRetrievalByStudyUid = activeServer.supportsInstanceRetrievalByStudyUid;
  let results; // Check explicitly for a value of false, since this property
  // may be left undefined in config files

  if (supportsInstanceRetrievalByStudyUid === false) {
    results = DIMSE.retrieveInstancesByStudyOnly(studyInstanceUid);
  } else {
    results = DIMSE.retrieveInstances(studyInstanceUid);
  }

  return resultDataToStudyMetadata(studyInstanceUid, results);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setup.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/dimse/setup.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
let CurrentServer;
module.watch(require("meteor/ohif:servers/both/collections"), {
  CurrentServer(v) {
    CurrentServer = v;
  }

}, 2);
let DIMSE;
module.watch(require("dimse"), {
  default(v) {
    DIMSE = v;
  }

}, 3);

const setupDIMSE = () => {
  // Terminate existing DIMSE servers and sockets and clean up the connection object
  DIMSE.connection.reset(); // Get the new server configuration

  const server = OHIF.servers.getCurrentServer(); // Stop here if the new server is not of DIMSE type

  if (server.type !== 'dimse') {
    return;
  } // Check if peers were defined in the server configuration and throw an error if not


  const peers = server.peers;

  if (!peers || !peers.length) {
    OHIF.log.error('dimse-config: ' + 'No DIMSE Peers provided.');
    throw new Meteor.Error('dimse-config', 'No DIMSE Peers provided.');
  } // Add all the DIMSE peers, establishing the connections


  OHIF.log.info('Adding DIMSE peers');

  try {
    peers.forEach(peer => DIMSE.connection.addPeer(peer));
  } catch (error) {
    OHIF.log.error('dimse-addPeers: ' + error);
    throw new Meteor.Error('dimse-addPeers', error);
  }
}; // Setup the DIMSE connections on startup or when the current server is changed


Meteor.startup(() => {
  CurrentServer.find().observe({
    added: setupDIMSE,
    changed: setupDIMSE
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"studies.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ohif_studies/imports/server/services/dimse/studies.js                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let moment;
module.watch(require("meteor/momentjs:moment"), {
  moment(v) {
    moment = v;
  }

}, 0);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 1);
let DIMSE;
module.watch(require("dimse"), {
  default(v) {
    DIMSE = v;
  }

}, 2);

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
  const studies = [];
  resultData.forEach(function (studyRaw) {
    const study = studyRaw.toObject();
    studies.push({
      studyInstanceUid: study[0x0020000D],
      // 00080005 = SpecificCharacterSet
      studyDate: study[0x00080020],
      studyTime: study[0x00080030],
      accessionNumber: study[0x00080050],
      referringPhysicianName: study[0x00080090],
      // 00081190 = URL
      patientName: study[0x00100010],
      patientId: study[0x00100020],
      patientBirthdate: study[0x00100030],
      patientSex: study[0x00100040],
      imageCount: study[0x00201208],
      studyId: study[0x00200010],
      studyDescription: study[0x00081030],
      modalities: study[0x00080061]
    });
  });
  return studies;
}

OHIF.studies.services.DIMSE.Studies = function (filter) {
  OHIF.log.info('Services.DIMSE.Studies');
  let filterStudyDate = '';

  if (filter.studyDateFrom && filter.studyDateTo) {
    const convertDate = date => moment(date, 'MM/DD/YYYY').format('YYYYMMDD');

    const dateFrom = convertDate(filter.studyDateFrom);
    const dateTo = convertDate(filter.studyDateTo);
    filterStudyDate = `${dateFrom}-${dateTo}`;
  } // Build the StudyInstanceUID parameter


  let studyUids = filter.studyInstanceUid || '';

  if (studyUids) {
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
  }

  const parameters = {
    0x0020000D: studyUids,
    0x00100010: filter.patientName,
    0x00100020: filter.patientId,
    0x00080050: filter.accessionNumber,
    0x00080020: filterStudyDate,
    0x00081030: filter.studyDescription,
    0x00100040: '',
    0x00201208: '',
    0x00080061: filter.modalitiesInStudy
  };
  const results = DIMSE.retrieveStudies(parameters);
  return resultDataToStudies(results);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},"node_modules":{"dicomweb-client":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/dicomweb-client/package.json                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "dicomweb-client";
exports.version = "0.3.2";
exports.main = "build/dicomweb-client.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"build":{"dicomweb-client.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/dicomweb-client/build/dicomweb-client.js                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"xhr2":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/xhr2/package.json                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "xhr2";
exports.version = "0.1.4";
exports.main = "lib/xhr2.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"xhr2.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/xhr2/lib/xhr2.js                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"dimse":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/dimse/package.json                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "dimse";
exports.version = "0.0.2";
exports.main = "./dist/DIMSE.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"DIMSE.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/ohif_studies/node_modules/dimse/dist/DIMSE.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:studies/both/main.js");
require("/node_modules/meteor/ohif:studies/server/main.js");

/* Exports */
Package._define("ohif:studies");

})();

//# sourceURL=meteor://💻app/packages/ohif_studies.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2JvdGgvbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL3NlcnZlci9tYWluLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9ib3RoL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9ib3RoL2xpYi9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvYm90aC9saWIvcGFyc2VGbG9hdEFycmF5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9ib3RoL3NlcnZpY2VzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9ib3RoL3NlcnZpY2VzL25hbWVzcGFjZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvYm90aC9zZXJ2aWNlcy9xaWRvL2luc3RhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvYm90aC9zZXJ2aWNlcy9xaWRvL3N0dWRpZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c3R1ZGllcy9pbXBvcnRzL2JvdGgvc2VydmljZXMvd2Fkby9yZXRyaWV2ZU1ldGFkYXRhLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c3R1ZGllcy9pbXBvcnRzL3NlcnZlci9tZXRob2RzL2dldFN0dWR5TWV0YWRhdGEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c3R1ZGllcy9pbXBvcnRzL3NlcnZlci9tZXRob2RzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOnN0dWRpZXMvaW1wb3J0cy9zZXJ2ZXIvbWV0aG9kcy9zdHVkeWxpc3RTZWFyY2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c3R1ZGllcy9pbXBvcnRzL3NlcnZlci9zZXJ2aWNlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvc2VydmVyL3NlcnZpY2VzL25hbWVzcGFjZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvc2VydmVyL3NlcnZpY2VzL2RpbXNlL2luc3RhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvc2VydmVyL3NlcnZpY2VzL2RpbXNlL3JldHJpZXZlTWV0YWRhdGEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6c3R1ZGllcy9pbXBvcnRzL3NlcnZlci9zZXJ2aWNlcy9kaW1zZS9zZXR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpzdHVkaWVzL2ltcG9ydHMvc2VydmVyL3NlcnZpY2VzL2RpbXNlL3N0dWRpZXMuanMiXSwibmFtZXMiOlsiT0hJRiIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJzdHVkaWVzIiwiZXhwb3J0IiwicGFyc2VGbG9hdEFycmF5Iiwib2JqIiwicmVzdWx0Iiwib2JqcyIsInNwbGl0IiwiaSIsImxlbmd0aCIsInB1c2giLCJwYXJzZUZsb2F0Iiwic2VydmljZXMiLCJRSURPIiwiV0FETyIsIkRJQ09Nd2ViQ2xpZW50IiwiZGVmYXVsdCIsIkRJQ09NV2ViIiwicmVzdWx0RGF0YVRvU3R1ZHlNZXRhZGF0YSIsInNlcnZlciIsInN0dWR5SW5zdGFuY2VVaWQiLCJyZXN1bHREYXRhIiwic2VyaWVzTWFwIiwic2VyaWVzTGlzdCIsImZvckVhY2giLCJpbnN0YW5jZSIsInNlcmllc0luc3RhbmNlVWlkIiwiZ2V0U3RyaW5nIiwic2VyaWVzIiwic2VyaWVzTnVtYmVyIiwiaW5zdGFuY2VzIiwic29wSW5zdGFuY2VVaWQiLCJ1cmkiLCJ3YWRvVXJpUm9vdCIsInNvcENsYXNzVWlkIiwiaW5zdGFuY2VOdW1iZXIiLCJJbnN0YW5jZXMiLCJjb25maWciLCJ1cmwiLCJxaWRvUm9vdCIsImhlYWRlcnMiLCJnZXRBdXRob3JpemF0aW9uSGVhZGVyIiwiZGljb21XZWIiLCJhcGkiLCJxdWVyeVBhcmFtcyIsImdldFFJRE9RdWVyeVBhcmFtcyIsImZpbHRlciIsInFpZG9TdXBwb3J0c0luY2x1ZGVGaWVsZCIsIm9wdGlvbnMiLCJzdHVkeUluc3RhbmNlVUlEIiwic2VhcmNoRm9ySW5zdGFuY2VzIiwidGhlbiIsImRhdGEiLCJNZXRlb3IiLCJpc1NlcnZlciIsIlhNTEh0dHBSZXF1ZXN0IiwiZ2xvYmFsIiwiZGF0ZVRvU3RyaW5nIiwiZGF0ZSIsInllYXIiLCJnZXRGdWxsWWVhciIsInRvU3RyaW5nIiwibW9udGgiLCJnZXRNb250aCIsImRheSIsImdldERhdGUiLCJyZXBlYXQiLCJjb25jYXQiLCJzZXJ2ZXJTdXBwb3J0c1FJRE9JbmNsdWRlRmllbGQiLCJjb21tYVNlcGFyYXRlZEZpZWxkcyIsImpvaW4iLCJwYXJhbWV0ZXJzIiwiUGF0aWVudE5hbWUiLCJwYXRpZW50TmFtZSIsIlBhdGllbnRJRCIsInBhdGllbnRJZCIsIkFjY2Vzc2lvbk51bWJlciIsImFjY2Vzc2lvbk51bWJlciIsIlN0dWR5RGVzY3JpcHRpb24iLCJzdHVkeURlc2NyaXB0aW9uIiwiTW9kYWxpdGllc0luU3R1ZHkiLCJtb2RhbGl0aWVzSW5TdHVkeSIsImxpbWl0Iiwib2Zmc2V0IiwiaW5jbHVkZWZpZWxkIiwic3R1ZHlEYXRlRnJvbSIsInN0dWR5RGF0ZVRvIiwiZGF0ZUZyb20iLCJEYXRlIiwiZGF0ZVRvIiwiU3R1ZHlEYXRlIiwic3R1ZHlVaWRzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVwbGFjZSIsIlN0dWR5SW5zdGFuY2VVSUQiLCJwYXJhbXMiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwidW5kZWZpbmVkIiwicmVzdWx0RGF0YVRvU3R1ZGllcyIsInN0dWR5Iiwic3R1ZHlEYXRlIiwic3R1ZHlUaW1lIiwicmVmZXJyaW5nUGh5c2ljaWFuTmFtZSIsImdldE5hbWUiLCJwYXRpZW50QmlydGhkYXRlIiwicGF0aWVudFNleCIsInN0dWR5SWQiLCJudW1iZXJPZlN0dWR5UmVsYXRlZFNlcmllcyIsIm51bWJlck9mU3R1ZHlSZWxhdGVkSW5zdGFuY2VzIiwibW9kYWxpdGllcyIsImdldE1vZGFsaXRpZXMiLCJTdHVkaWVzIiwic2VhcmNoRm9yU3R1ZGllcyIsInBhbGV0dGVDb2xvckNhY2hlIiwiY291bnQiLCJtYXhBZ2UiLCJlbnRyaWVzIiwiaXNWYWxpZFVJRCIsInBhbGV0dGVVSUQiLCJnZXQiLCJlbnRyeSIsImhhc093blByb3BlcnR5Iiwibm93IiwidGltZSIsImFkZCIsInVpZCIsImJ1aWxkSW5zdGFuY2VXYWRvVXJsIiwicGFyYW1TdHJpbmciLCJidWlsZEluc3RhbmNlV2Fkb1JzVXJpIiwid2Fkb1Jvb3QiLCJidWlsZEluc3RhbmNlRnJhbWVXYWRvUnNVcmkiLCJmcmFtZSIsImJhc2VXYWRvUnNVcmkiLCJnZXRTb3VyY2VJbWFnZUluc3RhbmNlVWlkIiwiU291cmNlSW1hZ2VTZXF1ZW5jZSIsIlZhbHVlIiwiZ2V0UGFsZXR0ZUNvbG9yIiwidGFnIiwibHV0RGVzY3JpcHRvciIsIm51bUx1dEVudHJpZXMiLCJiaXRzIiwiV0FET1Byb3h5IiwiY29udmVydFVSTCIsIkJ1bGtEYXRhVVJJIiwiaW5kZXhPZiIsImluY2x1ZGVzIiwicmVhZFVJbnQxNiIsImJ5dGVBcnJheSIsInBvc2l0aW9uIiwiYXJyYXlCdWZmZXJUb1BhbGV0dGVDb2xvckxVVCIsImFycmF5YnVmZmVyIiwiVWludDhBcnJheSIsImx1dCIsInJldHJpZXZlQnVsa0RhdGEiLCJnZXRQYWxldHRlQ29sb3JzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyIiwiZyIsImIiLCJwcm9taXNlcyIsImFsbCIsImFyZ3MiLCJyZWQiLCJncmVlbiIsImJsdWUiLCJnZXRGcmFtZUluY3JlbWVudFBvaW50ZXIiLCJlbGVtZW50IiwiZnJhbWVJbmNyZW1lbnRQb2ludGVyTmFtZXMiLCJ2YWx1ZSIsImdldFJhZGlvcGhhcm1hY2V1dGljYWxJbmZvIiwibW9kYWxpdHkiLCJyYWRpb3BoYXJtYWNldXRpY2FsSW5mbyIsImZpcnN0UGV0UmFkaW9waGFybWFjZXV0aWNhbEluZm8iLCJyYWRpb3BoYXJtYWNldXRpY2FsU3RhcnRUaW1lIiwicmFkaW9udWNsaWRlVG90YWxEb3NlIiwiZ2V0TnVtYmVyIiwicmFkaW9udWNsaWRlSGFsZkxpZmUiLCJhbkluc3RhbmNlIiwic3R1ZHlEYXRhIiwicGF0aWVudEFnZSIsInBhdGllbnRTaXplIiwicGF0aWVudFdlaWdodCIsImltYWdlQ291bnQiLCJpbnN0aXR1dGlvbk5hbWUiLCJtYXAiLCJzZXJpZXNEZXNjcmlwdGlvbiIsInNlcmllc0RhdGUiLCJzZXJpZXNUaW1lIiwid2Fkb3VyaSIsIndhZG9yc3VyaSIsImluc3RhbmNlU3VtbWFyeSIsImltYWdlVHlwZSIsImltYWdlUG9zaXRpb25QYXRpZW50IiwiaW1hZ2VPcmllbnRhdGlvblBhdGllbnQiLCJmcmFtZU9mUmVmZXJlbmNlVUlEIiwic2xpY2VMb2NhdGlvbiIsInNhbXBsZXNQZXJQaXhlbCIsInBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24iLCJwbGFuYXJDb25maWd1cmF0aW9uIiwicm93cyIsImNvbHVtbnMiLCJwaXhlbFNwYWNpbmciLCJwaXhlbEFzcGVjdFJhdGlvIiwiYml0c0FsbG9jYXRlZCIsImJpdHNTdG9yZWQiLCJoaWdoQml0IiwicGl4ZWxSZXByZXNlbnRhdGlvbiIsInNtYWxsZXN0UGl4ZWxWYWx1ZSIsImxhcmdlc3RQaXhlbFZhbHVlIiwid2luZG93Q2VudGVyIiwid2luZG93V2lkdGgiLCJyZXNjYWxlSW50ZXJjZXB0IiwicmVzY2FsZVNsb3BlIiwicmVzY2FsZVR5cGUiLCJzb3VyY2VJbWFnZUluc3RhbmNlVWlkIiwibGF0ZXJhbGl0eSIsInZpZXdQb3NpdGlvbiIsImFjcXVpc2l0aW9uRGF0ZVRpbWUiLCJudW1iZXJPZkZyYW1lcyIsImZyYW1lSW5jcmVtZW50UG9pbnRlciIsImZyYW1lVGltZSIsImZyYW1lVGltZVZlY3RvciIsInNsaWNlVGhpY2tuZXNzIiwibG9zc3lJbWFnZUNvbXByZXNzaW9uIiwiZGVyaXZhdGlvbkRlc2NyaXB0aW9uIiwibG9zc3lJbWFnZUNvbXByZXNzaW9uUmF0aW8iLCJsb3NzeUltYWdlQ29tcHJlc3Npb25NZXRob2QiLCJlY2hvTnVtYmVyIiwiY29udHJhc3RCb2x1c0FnZW50IiwiaW1hZ2VSZW5kZXJpbmciLCJ0aHVtYm5haWxSZW5kZXJpbmciLCJyZWRQYWxldHRlQ29sb3JMb29rdXBUYWJsZURlc2NyaXB0b3IiLCJncmVlblBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGVzY3JpcHRvciIsImJsdWVQYWxldHRlQ29sb3JMb29rdXBUYWJsZURlc2NyaXB0b3IiLCJwYWxldHRlcyIsInBhbGV0dGVDb2xvckxvb2t1cFRhYmxlVUlEIiwicmVkUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEYXRhIiwiZ3JlZW5QYWxldHRlQ29sb3JMb29rdXBUYWJsZURhdGEiLCJibHVlUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEYXRhIiwiUmV0cmlldmVNZXRhZGF0YSIsInJldHJpZXZlU3R1ZHlNZXRhZGF0YSIsIm1ldGhvZHMiLCJHZXRTdHVkeU1ldGFkYXRhIiwibG9nIiwiaW5mbyIsInNlcnZlcnMiLCJnZXRDdXJyZW50U2VydmVyIiwiRXJyb3IiLCJ0eXBlIiwiRElNU0UiLCJlcnJvciIsInRyYWNlIiwiU3R1ZHlMaXN0U2VhcmNoIiwiaW5zdGFuY2VSYXciLCJ0b09iamVjdCIsInBlZXJzIiwic2VydmVyUm9vdCIsImhvc3QiLCJwb3J0IiwicmV0cmlldmVJbnN0YW5jZXMiLCJnZXRWYWx1ZSIsImRlZmF1bHRWYWx1ZSIsInBhdGllbnRCaXJ0aERhdGUiLCJ0YWJsZVBvc2l0aW9uIiwic3BhY2luZ0JldHdlZW5TbGljZXMiLCJhY3RpdmVTZXJ2ZXIiLCJzdXBwb3J0c0luc3RhbmNlUmV0cmlldmFsQnlTdHVkeVVpZCIsInJlc3VsdHMiLCJyZXRyaWV2ZUluc3RhbmNlc0J5U3R1ZHlPbmx5IiwiQ3VycmVudFNlcnZlciIsInNldHVwRElNU0UiLCJjb25uZWN0aW9uIiwicmVzZXQiLCJwZWVyIiwiYWRkUGVlciIsInN0YXJ0dXAiLCJmaW5kIiwib2JzZXJ2ZSIsImFkZGVkIiwiY2hhbmdlZCIsIm1vbWVudCIsInN0dWR5UmF3IiwiZmlsdGVyU3R1ZHlEYXRlIiwiY29udmVydERhdGUiLCJmb3JtYXQiLCJyZXRyaWV2ZVN0dWRpZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxJQUFKO0FBQVNDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVBQXlDO0FBQUNILE9BQUtJLENBQUwsRUFBTztBQUFDSixXQUFLSSxDQUFMO0FBQU87O0FBQWhCLENBQXpDLEVBQTJELENBQTNEO0FBRVRKLEtBQUtLLE9BQUwsR0FBZSxFQUFmOztBQUVBRixRQUFRLGlCQUFSLEU7Ozs7Ozs7Ozs7O0FDSkFBLFFBQVEsbUJBQVIsRTs7Ozs7Ozs7Ozs7QUNBQUYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE9BQVIsQ0FBYjtBQUErQkYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFOzs7Ozs7Ozs7OztBQ0EvQkYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHNCQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBQUYsT0FBT0ssTUFBUCxDQUFjO0FBQUNDLG1CQUFnQixNQUFJQTtBQUFyQixDQUFkOztBQUFPLE1BQU1BLGtCQUFrQixVQUFTQyxHQUFULEVBQWM7QUFDekMsTUFBSUMsU0FB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c3R1ZGllcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuT0hJRi5zdHVkaWVzID0ge307XG5cbnJlcXVpcmUoJy4uL2ltcG9ydHMvYm90aCcpO1xuIiwicmVxdWlyZSgnLi4vaW1wb3J0cy9zZXJ2ZXInKTtcbiIsImltcG9ydCAnLi9saWInO1xuaW1wb3J0ICcuL3NlcnZpY2VzJztcbiIsImltcG9ydCAnLi9wYXJzZUZsb2F0QXJyYXkuanMnO1xuIiwiZXhwb3J0IGNvbnN0IHBhcnNlRmxvYXRBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIGlmICghb2JqKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgdmFyIG9ianMgPSBvYmouc3BsaXQoXCJcXFxcXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2Jqcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQucHVzaChwYXJzZUZsb2F0KG9ianNbaV0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbiIsImltcG9ydCAnLi9uYW1lc3BhY2UnO1xuXG4vLyBESUNPTVdlYiBpbnN0YW5jZSwgc3R1ZHksIGFuZCBtZXRhZGF0YSByZXRyaWV2YWxcbmltcG9ydCAnLi9xaWRvL2luc3RhbmNlcy5qcyc7XG5pbXBvcnQgJy4vcWlkby9zdHVkaWVzLmpzJztcbmltcG9ydCAnLi93YWRvL3JldHJpZXZlTWV0YWRhdGEuanMnO1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuXG5PSElGLnN0dWRpZXMuc2VydmljZXMgPSB7XG4gICAgUUlETzoge30sXG4gICAgV0FETzoge31cbn07XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgRElDT013ZWJDbGllbnQgZnJvbSAnZGljb213ZWItY2xpZW50JztcblxuY29uc3QgeyBESUNPTVdlYiB9ID0gT0hJRjtcblxuLyoqXG4gKiBQYXJzZXMgZGF0YSByZXR1cm5lZCBmcm9tIGEgUUlETyBzZWFyY2ggYW5kIHRyYW5zZm9ybXMgaXQgaW50b1xuICogYW4gYXJyYXkgb2Ygc2VyaWVzIHRoYXQgYXJlIHByZXNlbnQgaW4gdGhlIHN0dWR5XG4gKlxuICogQHBhcmFtIHNlcnZlciBUaGUgRElDT00gc2VydmVyXG4gKiBAcGFyYW0gc3R1ZHlJbnN0YW5jZVVpZFxuICogQHBhcmFtIHJlc3VsdERhdGFcbiAqIEByZXR1cm5zIHtBcnJheX0gU2VyaWVzIExpc3RcbiAqL1xuZnVuY3Rpb24gcmVzdWx0RGF0YVRvU3R1ZHlNZXRhZGF0YShzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHJlc3VsdERhdGEpIHtcbiAgICB2YXIgc2VyaWVzTWFwID0ge307XG4gICAgdmFyIHNlcmllc0xpc3QgPSBbXTtcblxuICAgIHJlc3VsdERhdGEuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgICAgICAvLyBVc2Ugc2VyaWVzTWFwIHRvIGNhY2hlIHNlcmllcyBkYXRhXG4gICAgICAgIC8vIElmIHRoZSBzZXJpZXMgaW5zdGFuY2UgVUlEIGhhcyBhbHJlYWR5IGJlZW4gdXNlZCB0b1xuICAgICAgICAvLyBwcm9jZXNzIHNlcmllcyBkYXRhLCBjb250aW51ZSB1c2luZyB0aGF0IHNlcmllc1xuICAgICAgICB2YXIgc2VyaWVzSW5zdGFuY2VVaWQgPSBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjAwMDBFJ10pO1xuICAgICAgICB2YXIgc2VyaWVzID0gc2VyaWVzTWFwW3Nlcmllc0luc3RhbmNlVWlkXTtcblxuICAgICAgICAvLyBJZiBubyBzZXJpZXMgZGF0YSBleGlzdHMgaW4gdGhlIHNlcmllc01hcCBjYWNoZSB2YXJpYWJsZSxcbiAgICAgICAgLy8gcHJvY2VzcyBhbnkgYXZhaWxhYmxlIHNlcmllcyBkYXRhXG4gICAgICAgIGlmICghc2VyaWVzKSB7XG4gICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgc2VyaWVzSW5zdGFuY2VVaWQ6IHNlcmllc0luc3RhbmNlVWlkLFxuICAgICAgICAgICAgICAgIHNlcmllc051bWJlcjogRElDT01XZWIuZ2V0U3RyaW5nKGluc3RhbmNlWycwMDIwMDAxMSddKSxcbiAgICAgICAgICAgICAgICBpbnN0YW5jZXM6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBTYXZlIHRoaXMgZGF0YSBpbiB0aGUgc2VyaWVzTWFwIGNhY2hlIHZhcmlhYmxlXG4gICAgICAgICAgICBzZXJpZXNNYXBbc2VyaWVzSW5zdGFuY2VVaWRdID0gc2VyaWVzO1xuICAgICAgICAgICAgc2VyaWVzTGlzdC5wdXNoKHNlcmllcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgdXJpIGZvciB0aGUgZGljb213ZWJcbiAgICAgICAgLy8gTk9URTogRENNNENIRUUgc2VlbXMgdG8gcmV0dXJuIHRoZSBkYXRhIHppcHBlZFxuICAgICAgICAvLyBOT1RFOiBPcnRoYW5jIHJldHVybnMgdGhlIGRhdGEgd2l0aCBtdWx0aS1wYXJ0IG1pbWUgd2hpY2ggY29ybmVyc3RvbmVXQURPSW1hZ2VMb2FkZXIgZG9lc24ndFxuICAgICAgICAvLyAgICAgICBrbm93IGhvdyB0byBwYXJzZSB5ZXRcbiAgICAgICAgLy92YXIgdXJpID0gRElDT01XZWIuZ2V0U3RyaW5nKGluc3RhbmNlWycwMDA4MTE5MCddKTtcbiAgICAgICAgLy91cmkgPSB1cmkucmVwbGFjZSgnd2Fkby1ycycsICdkaWNvbS13ZWInKTtcblxuICAgICAgICAvLyBtYW51YWxseSBjcmVhdGUgYSBXQURPLVVSSSBmcm9tIHRoZSBVSURzXG4gICAgICAgIC8vIE5PVEU6IEhhdmVuJ3QgYmVlbiBhYmxlIHRvIGdldCBPcnRoYW5jJ3MgV0FETy1VUkkgdG8gd29yayB5ZXQgLSBtYXliZSBpdHMgbm90IGNvbmZpZ3VyZWQ/XG4gICAgICAgIHZhciBzb3BJbnN0YW5jZVVpZCA9IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwMTgnXSk7XG4gICAgICAgIHZhciB1cmkgPSBzZXJ2ZXIud2Fkb1VyaVJvb3QgKyAnP3JlcXVlc3RUeXBlPVdBRE8mc3R1ZHlVSUQ9JyArIHN0dWR5SW5zdGFuY2VVaWQgKyAnJnNlcmllc1VJRD0nICsgc2VyaWVzSW5zdGFuY2VVaWQgKyAnJm9iamVjdFVJRD0nICsgc29wSW5zdGFuY2VVaWQgKyAnJmNvbnRlbnRUeXBlPWFwcGxpY2F0aW9uJTJGZGljb20nO1xuXG4gICAgICAgIC8vIEFkZCB0aGlzIGluc3RhbmNlIHRvIHRoZSBjdXJyZW50IHNlcmllc1xuICAgICAgICBzZXJpZXMuaW5zdGFuY2VzLnB1c2goe1xuICAgICAgICAgICAgc29wQ2xhc3NVaWQ6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwMTYnXSksXG4gICAgICAgICAgICBzb3BJbnN0YW5jZVVpZDogc29wSW5zdGFuY2VVaWQsXG4gICAgICAgICAgICB1cmk6IHVyaSxcbiAgICAgICAgICAgIGluc3RhbmNlTnVtYmVyOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjAwMDEzJ10pXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBzZXJpZXNMaXN0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGEgc2V0IG9mIGluc3RhbmNlcyB1c2luZyBhIFFJRE8gY2FsbFxuICogQHBhcmFtIHNlcnZlclxuICogQHBhcmFtIHN0dWR5SW5zdGFuY2VVaWRcbiAqIEB0aHJvd3MgRUNPTk5SRUZVU0VEXG4gKiBAcmV0dXJucyB7e3dhZG9VcmlSb290OiBTdHJpbmcsIHN0dWR5SW5zdGFuY2VVaWQ6IFN0cmluZywgc2VyaWVzTGlzdDogQXJyYXl9fVxuICovXG5PSElGLnN0dWRpZXMuc2VydmljZXMuUUlETy5JbnN0YW5jZXMgPSBmdW5jdGlvbihzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQpIHtcbiAgICAvLyBUT0RPOiBBcmUgd2UgdXNpbmcgdGhpcyBmdW5jdGlvbiBhbnl3aGVyZT8/IENhbiB3ZSByZW1vdmUgaXQ/XG5cbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgIHVybDogc2VydmVyLnFpZG9Sb290LFxuICAgICAgICBoZWFkZXJzOiBPSElGLkRJQ09NV2ViLmdldEF1dGhvcml6YXRpb25IZWFkZXIoKVxuICAgIH07XG4gICAgY29uc3QgZGljb21XZWIgPSBuZXcgRElDT013ZWJDbGllbnQuYXBpLkRJQ09Nd2ViQ2xpZW50KGNvbmZpZyk7XG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBnZXRRSURPUXVlcnlQYXJhbXMoZmlsdGVyLCBzZXJ2ZXIucWlkb1N1cHBvcnRzSW5jbHVkZUZpZWxkKTtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBzdHVkeUluc3RhbmNlVUlEOiBzdHVkeUluc3RhbmNlVWlkXG4gICAgfTtcblxuICAgIHJldHVybiBkaWNvbVdlYi5zZWFyY2hGb3JJbnN0YW5jZXMob3B0aW9ucykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2Fkb1VyaVJvb3Q6IHNlcnZlci53YWRvVXJpUm9vdCxcbiAgICAgICAgICAgIHN0dWR5SW5zdGFuY2VVaWQ6IHN0dWR5SW5zdGFuY2VVaWQsXG4gICAgICAgICAgICBzZXJpZXNMaXN0OiByZXN1bHREYXRhVG9TdHVkeU1ldGFkYXRhKHNlcnZlciwgc3R1ZHlJbnN0YW5jZVVpZCwgcmVzdWx0LmRhdGEpXG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuaW1wb3J0IERJQ09Nd2ViQ2xpZW50IGZyb20gJ2RpY29td2ViLWNsaWVudCc7XG5cbmNvbnN0IHsgRElDT01XZWIgfSA9IE9ISUY7XG5cbi8vIFRPRE86IElzIHRoZXJlIGFuIGVhc2llciB3YXkgdG8gZG8gdGhpcz9cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICB2YXIgWE1MSHR0cFJlcXVlc3QgPSByZXF1aXJlKCd4aHIyJyk7XG5cbiAgICBnbG9iYWwuWE1MSHR0cFJlcXVlc3QgPSBYTUxIdHRwUmVxdWVzdDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgUUlETyBkYXRlIHN0cmluZyBmb3IgYSBkYXRlIHJhbmdlIHF1ZXJ5XG4gKiBBc3N1bWVzIHRoZSB5ZWFyIGlzIHBvc2l0aXZlLCBhdCBtb3N0IDQgZGlnaXRzIGxvbmcuXG4gKlxuICogQHBhcmFtIGRhdGUgVGhlIERhdGUgb2JqZWN0IHRvIGJlIGZvcm1hdHRlZFxuICogQHJldHVybnMge3N0cmluZ30gVGhlIGZvcm1hdHRlZCBkYXRlIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkYXRlVG9TdHJpbmcoZGF0ZSkge1xuICAgIGlmICghZGF0ZSkgcmV0dXJuICcnO1xuICAgIGxldCB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XG4gICAgbGV0IG1vbnRoID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCk7XG4gICAgbGV0IGRheSA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCk7XG4gICAgeWVhciA9ICcwJy5yZXBlYXQoNCAtIHllYXIubGVuZ3RoKS5jb25jYXQoeWVhcik7XG4gICAgbW9udGggPSAnMCcucmVwZWF0KDIgLSBtb250aC5sZW5ndGgpLmNvbmNhdChtb250aCk7XG4gICAgZGF5ID0gJzAnLnJlcGVhdCgyIC0gZGF5Lmxlbmd0aCkuY29uY2F0KGRheSk7XG4gICAgcmV0dXJuICcnLmNvbmNhdCh5ZWFyLCBtb250aCwgZGF5KTtcbn1cblxuLyoqXG4gKiBQcm9kdWNlcyBhIFFJRE8gVVJMIGdpdmVuIHNlcnZlciBkZXRhaWxzIGFuZCBhIHNldCBvZiBzcGVjaWZpZWQgc2VhcmNoIGZpbHRlclxuICogaXRlbXNcbiAqXG4gKiBAcGFyYW0gZmlsdGVyXG4gKiBAcGFyYW0gc2VydmVyU3VwcG9ydHNRSURPSW5jbHVkZUZpZWxkXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgVVJMIHdpdGggZW5jb2RlZCBmaWx0ZXIgcXVlcnkgZGF0YVxuICovXG5mdW5jdGlvbiBnZXRRSURPUXVlcnlQYXJhbXMoZmlsdGVyLCBzZXJ2ZXJTdXBwb3J0c1FJRE9JbmNsdWRlRmllbGQpIHtcbiAgICBjb25zdCBjb21tYVNlcGFyYXRlZEZpZWxkcyA9IFtcbiAgICAgICAgJzAwMDgxMDMwJywgLy8gU3R1ZHkgRGVzY3JpcHRpb25cbiAgICAgICAgJzAwMDgwMDYwJyAvL01vZGFsaXR5XG4gICAgICAgIC8vIEFkZCBtb3JlIGZpZWxkcyBoZXJlIGlmIHlvdSB3YW50IHRoZW0gaW4gdGhlIHJlc3VsdFxuICAgIF0uam9pbignLCcpO1xuXG4gICAgY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgUGF0aWVudE5hbWU6IGZpbHRlci5wYXRpZW50TmFtZSxcbiAgICAgICAgUGF0aWVudElEOiBmaWx0ZXIucGF0aWVudElkLFxuICAgICAgICBBY2Nlc3Npb25OdW1iZXI6IGZpbHRlci5hY2Nlc3Npb25OdW1iZXIsXG4gICAgICAgIFN0dWR5RGVzY3JpcHRpb246IGZpbHRlci5zdHVkeURlc2NyaXB0aW9uLFxuICAgICAgICBNb2RhbGl0aWVzSW5TdHVkeTogZmlsdGVyLm1vZGFsaXRpZXNJblN0dWR5LFxuICAgICAgICBsaW1pdDogZmlsdGVyLmxpbWl0LFxuICAgICAgICBvZmZzZXQ6IGZpbHRlci5vZmZzZXQsXG4gICAgICAgIGluY2x1ZGVmaWVsZDogc2VydmVyU3VwcG9ydHNRSURPSW5jbHVkZUZpZWxkID8gY29tbWFTZXBhcmF0ZWRGaWVsZHMgOiAnYWxsJ1xuICAgIH07XG5cbiAgICAvLyBidWlsZCB0aGUgU3R1ZHlEYXRlIHJhbmdlIHBhcmFtZXRlclxuICAgIGlmIChmaWx0ZXIuc3R1ZHlEYXRlRnJvbSB8fCBmaWx0ZXIuc3R1ZHlEYXRlVG8pIHtcbiAgICAgICAgY29uc3QgZGF0ZUZyb20gPSBkYXRlVG9TdHJpbmcobmV3IERhdGUoZmlsdGVyLnN0dWR5RGF0ZUZyb20pKTtcbiAgICAgICAgY29uc3QgZGF0ZVRvID0gZGF0ZVRvU3RyaW5nKG5ldyBEYXRlKGZpbHRlci5zdHVkeURhdGVUbykpO1xuICAgICAgICBwYXJhbWV0ZXJzLlN0dWR5RGF0ZSA9IGAke2RhdGVGcm9tfS0ke2RhdGVUb31gO1xuICAgIH1cblxuICAgIC8vIEJ1aWxkIHRoZSBTdHVkeUluc3RhbmNlVUlEIHBhcmFtZXRlclxuICAgIGlmIChmaWx0ZXIuc3R1ZHlJbnN0YW5jZVVpZCkge1xuICAgICAgICBsZXQgc3R1ZHlVaWRzID0gZmlsdGVyLnN0dWR5SW5zdGFuY2VVaWQ7XG4gICAgICAgIHN0dWR5VWlkcyA9IEFycmF5LmlzQXJyYXkoc3R1ZHlVaWRzKSA/IHN0dWR5VWlkcy5qb2luKCkgOiBzdHVkeVVpZHM7XG4gICAgICAgIHN0dWR5VWlkcyA9IHN0dWR5VWlkcy5yZXBsYWNlKC9bXjAtOS5dKy9nLCAnXFxcXCcpO1xuICAgICAgICBwYXJhbWV0ZXJzLlN0dWR5SW5zdGFuY2VVSUQgPSBzdHVkeVVpZHM7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gcXVlcnkgcGFyYW1zIG9mIHVuZGVmaW5lZCB2YWx1ZXMuXG4gICAgY29uc3QgcGFyYW1zID0ge307XG4gICAgT2JqZWN0LmtleXMocGFyYW1ldGVycykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBpZiAocGFyYW1ldGVyc1trZXldICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHBhcmFtZXRlcnNba2V5XSAhPT0gXCJcIikge1xuICAgICAgICAgICAgcGFyYW1zW2tleV0gPSBwYXJhbWV0ZXJzW2tleV07XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJhbXM7XG59XG5cbi8qKlxuICogUGFyc2VzIHJlc3VsdGluZyBkYXRhIGZyb20gYSBRSURPIGNhbGwgaW50byBhIHNldCBvZiBTdHVkeSBNZXRhRGF0YVxuICpcbiAqIEBwYXJhbSByZXN1bHREYXRhXG4gKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIFN0dWR5IE1ldGFEYXRhIG9iamVjdHNcbiAqL1xuZnVuY3Rpb24gcmVzdWx0RGF0YVRvU3R1ZGllcyhyZXN1bHREYXRhKSB7XG4gICAgY29uc3Qgc3R1ZGllcyA9IFtdO1xuXG4gICAgaWYgKCFyZXN1bHREYXRhIHx8ICFyZXN1bHREYXRhLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgcmVzdWx0RGF0YS5mb3JFYWNoKHN0dWR5ID0+IHN0dWRpZXMucHVzaCh7XG4gICAgICAgIHN0dWR5SW5zdGFuY2VVaWQ6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAyMDAwMEQnXSksXG4gICAgICAgIC8vIDAwMDgwMDA1ID0gU3BlY2lmaWNDaGFyYWN0ZXJTZXRcbiAgICAgICAgc3R1ZHlEYXRlOiBESUNPTVdlYi5nZXRTdHJpbmcoc3R1ZHlbJzAwMDgwMDIwJ10pLFxuICAgICAgICBzdHVkeVRpbWU6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAwODAwMzAnXSksXG4gICAgICAgIGFjY2Vzc2lvbk51bWJlcjogRElDT01XZWIuZ2V0U3RyaW5nKHN0dWR5WycwMDA4MDA1MCddKSxcbiAgICAgICAgcmVmZXJyaW5nUGh5c2ljaWFuTmFtZTogRElDT01XZWIuZ2V0U3RyaW5nKHN0dWR5WycwMDA4MDA5MCddKSxcbiAgICAgICAgLy8gMDAwODExOTAgPSBVUkxcbiAgICAgICAgcGF0aWVudE5hbWU6IERJQ09NV2ViLmdldE5hbWUoc3R1ZHlbJzAwMTAwMDEwJ10pLFxuICAgICAgICBwYXRpZW50SWQ6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAxMDAwMjAnXSksXG4gICAgICAgIHBhdGllbnRCaXJ0aGRhdGU6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAxMDAwMzAnXSksXG4gICAgICAgIHBhdGllbnRTZXg6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAxMDAwNDAnXSksXG4gICAgICAgIHN0dWR5SWQ6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAyMDAwMTAnXSksXG4gICAgICAgIG51bWJlck9mU3R1ZHlSZWxhdGVkU2VyaWVzOiBESUNPTVdlYi5nZXRTdHJpbmcoc3R1ZHlbJzAwMjAxMjA2J10pLFxuICAgICAgICBudW1iZXJPZlN0dWR5UmVsYXRlZEluc3RhbmNlczogRElDT01XZWIuZ2V0U3RyaW5nKHN0dWR5WycwMDIwMTIwOCddKSxcbiAgICAgICAgc3R1ZHlEZXNjcmlwdGlvbjogRElDT01XZWIuZ2V0U3RyaW5nKHN0dWR5WycwMDA4MTAzMCddKSxcbiAgICAgICAgLy8gbW9kYWxpdHk6IERJQ09NV2ViLmdldFN0cmluZyhzdHVkeVsnMDAwODAwNjAnXSksXG4gICAgICAgIC8vIG1vZGFsaXRpZXNJblN0dWR5OiBESUNPTVdlYi5nZXRTdHJpbmcoc3R1ZHlbJzAwMDgwMDYxJ10pLFxuICAgICAgICBtb2RhbGl0aWVzOiBESUNPTVdlYi5nZXRTdHJpbmcoRElDT01XZWIuZ2V0TW9kYWxpdGllcyhzdHVkeVsnMDAwODAwNjAnXSwgc3R1ZHlbJzAwMDgwMDYxJ10pKVxuICAgIH0pKTtcblxuICAgIHJldHVybiBzdHVkaWVzO1xufVxuXG5PSElGLnN0dWRpZXMuc2VydmljZXMuUUlETy5TdHVkaWVzID0gKHNlcnZlciwgZmlsdGVyKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICB1cmw6IHNlcnZlci5xaWRvUm9vdCxcbiAgICAgICAgaGVhZGVyczogT0hJRi5ESUNPTVdlYi5nZXRBdXRob3JpemF0aW9uSGVhZGVyKClcbiAgICB9O1xuXG4gICAgY29uc3QgZGljb21XZWIgPSBuZXcgRElDT013ZWJDbGllbnQuYXBpLkRJQ09Nd2ViQ2xpZW50KGNvbmZpZyk7XG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBnZXRRSURPUXVlcnlQYXJhbXMoZmlsdGVyLCBzZXJ2ZXIucWlkb1N1cHBvcnRzSW5jbHVkZUZpZWxkKTtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBxdWVyeVBhcmFtc1xuICAgIH07XG5cbiAgICByZXR1cm4gZGljb21XZWIuc2VhcmNoRm9yU3R1ZGllcyhvcHRpb25zKS50aGVuKHJlc3VsdERhdGFUb1N0dWRpZXMpO1xufTtcbiIsImltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcbmltcG9ydCBESUNPTXdlYkNsaWVudCBmcm9tICdkaWNvbXdlYi1jbGllbnQnO1xuXG5pbXBvcnQgeyBwYXJzZUZsb2F0QXJyYXkgfSBmcm9tICcuLi8uLi9saWIvcGFyc2VGbG9hdEFycmF5JztcblxuY29uc3QgeyBESUNPTVdlYiB9ID0gT0hJRjtcblxuLyoqXG4gKiBTaW1wbGUgY2FjaGUgc2NoZW1hIGZvciByZXRyaWV2ZWQgY29sb3IgcGFsZXR0ZXMuXG4gKi9cbmNvbnN0IHBhbGV0dGVDb2xvckNhY2hlID0ge1xuICAgIGNvdW50OiAwLFxuICAgIG1heEFnZTogMjQgKiA2MCAqIDYwICogMTAwMCwgLy8gMjRoIGNhY2hlP1xuICAgIGVudHJpZXM6IHt9LFxuICAgIGlzVmFsaWRVSUQ6IGZ1bmN0aW9uIChwYWxldHRlVUlEKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcGFsZXR0ZVVJRCA9PT0gJ3N0cmluZycgJiYgcGFsZXR0ZVVJRC5sZW5ndGggPiAwO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiAocGFsZXR0ZVVJRCkge1xuICAgICAgICBsZXQgZW50cnkgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5lbnRyaWVzLmhhc093blByb3BlcnR5KHBhbGV0dGVVSUQpKSB7XG4gICAgICAgICAgICBlbnRyeSA9IHRoaXMuZW50cmllc1twYWxldHRlVUlEXTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGhvdyB0aGUgZW50cnkgaXMuLi5cbiAgICAgICAgICAgIGlmICgoRGF0ZS5ub3coKSAtIGVudHJ5LnRpbWUpID4gdGhpcy5tYXhBZ2UpIHtcbiAgICAgICAgICAgICAgICAvLyBlbnRyeSBpcyB0b28gb2xkLi4uIHJlbW92ZSBlbnRyeS5cbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5lbnRyaWVzW3BhbGV0dGVVSURdO1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQtLTtcbiAgICAgICAgICAgICAgICBlbnRyeSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH0sXG4gICAgYWRkOiBmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZFVJRChlbnRyeS51aWQpKSB7XG4gICAgICAgICAgICBsZXQgcGFsZXR0ZVVJRCA9IGVudHJ5LnVpZDtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudHJpZXMuaGFzT3duUHJvcGVydHkocGFsZXR0ZVVJRCkgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50Kys7IC8vIGluY3JlbWVudCBjYWNoZSBlbnRyeSBjb3VudC4uLlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50cnkudGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLmVudHJpZXNbcGFsZXR0ZVVJRF0gPSBlbnRyeTtcbiAgICAgICAgICAgIC8vIEBUT0RPOiBBZGQgbG9naWMgdG8gZ2V0IHJpZCBvZiBvbGQgZW50cmllcyBhbmQgcmVkdWNlIG1lbW9yeSB1c2FnZS4uLlxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqIFJldHVybnMgYSBXQURPIHVybCBmb3IgYW4gaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gc3R1ZHlJbnN0YW5jZVVpZFxuICogQHBhcmFtIHNlcmllc0luc3RhbmNlVWlkXG4gKiBAcGFyYW0gc29wSW5zdGFuY2VVaWRcbiAqIEByZXR1cm5zICB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBidWlsZEluc3RhbmNlV2Fkb1VybChzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHNlcmllc0luc3RhbmNlVWlkLCBzb3BJbnN0YW5jZVVpZCkge1xuICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIHJlbW92ZWQsIHNpbmNlIERJQ09NV2ViQ2xpZW50IGhhcyB0aGUgc2FtZSBmdW5jdGlvbi4gTm90IHVyZ2VudCwgdGhvdWdoXG4gICAgY29uc3QgcGFyYW1zID0gW107XG5cbiAgICBwYXJhbXMucHVzaCgncmVxdWVzdFR5cGU9V0FETycpO1xuICAgIHBhcmFtcy5wdXNoKGBzdHVkeVVJRD0ke3N0dWR5SW5zdGFuY2VVaWR9YCk7XG4gICAgcGFyYW1zLnB1c2goYHNlcmllc1VJRD0ke3Nlcmllc0luc3RhbmNlVWlkfWApO1xuICAgIHBhcmFtcy5wdXNoKGBvYmplY3RVSUQ9JHtzb3BJbnN0YW5jZVVpZH1gKTtcbiAgICBwYXJhbXMucHVzaCgnY29udGVudFR5cGU9YXBwbGljYXRpb24vZGljb20nKTtcbiAgICBwYXJhbXMucHVzaCgndHJhbnNmZXJTeW50YXg9KicpO1xuXG4gICAgY29uc3QgcGFyYW1TdHJpbmcgPSBwYXJhbXMuam9pbignJicpO1xuXG4gICAgcmV0dXJuIGAke3NlcnZlci53YWRvVXJpUm9vdH0/JHtwYXJhbVN0cmluZ31gO1xufVxuXG5mdW5jdGlvbiBidWlsZEluc3RhbmNlV2Fkb1JzVXJpKHNlcnZlciwgc3R1ZHlJbnN0YW5jZVVpZCwgc2VyaWVzSW5zdGFuY2VVaWQsIHNvcEluc3RhbmNlVWlkKSB7XG4gICAgcmV0dXJuIGAke3NlcnZlci53YWRvUm9vdH0vc3R1ZGllcy8ke3N0dWR5SW5zdGFuY2VVaWR9L3Nlcmllcy8ke3Nlcmllc0luc3RhbmNlVWlkfS9pbnN0YW5jZXMvJHtzb3BJbnN0YW5jZVVpZH1gXG59XG5cbmZ1bmN0aW9uIGJ1aWxkSW5zdGFuY2VGcmFtZVdhZG9Sc1VyaShzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHNlcmllc0luc3RhbmNlVWlkLCBzb3BJbnN0YW5jZVVpZCwgZnJhbWUpIHtcbiAgICBjb25zdCBiYXNlV2Fkb1JzVXJpID0gYnVpbGRJbnN0YW5jZVdhZG9Sc1VyaShzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHNlcmllc0luc3RhbmNlVWlkLCBzb3BJbnN0YW5jZVVpZCk7XG4gICAgZnJhbWUgPSBmcmFtZSAhPSBudWxsIHx8IDE7XG5cbiAgICByZXR1cm4gYCR7YmFzZVdhZG9Sc1VyaX0vZnJhbWVzLyR7ZnJhbWV9YFxufVxuXG4vKipcbiAqIFBhcnNlcyB0aGUgU291cmNlSW1hZ2VTZXF1ZW5jZSwgaWYgaXQgZXhpc3RzLCBpbiBvcmRlclxuICogdG8gcmV0dXJuIGEgUmVmZXJlbmNlU09QSW5zdGFuY2VVSUQuIFRoZSBSZWZlcmVuY2VTT1BJbnN0YW5jZVVJRFxuICogaXMgdXNlZCB0byByZWZlciB0byB0aGlzIGltYWdlIGluIGFueSBhY2NvbXBhbnlpbmcgRElDT00tU1IgZG9jdW1lbnRzLlxuICpcbiAqIEBwYXJhbSBpbnN0YW5jZVxuICogQHJldHVybnMge1N0cmluZ30gVGhlIFJlZmVyZW5jZVNPUEluc3RhbmNlVUlEXG4gKi9cbmZ1bmN0aW9uIGdldFNvdXJjZUltYWdlSW5zdGFuY2VVaWQoaW5zdGFuY2UpIHtcbiAgICAvLyBUT0RPPSBQYXJzZSB0aGUgd2hvbGUgU291cmNlIEltYWdlIFNlcXVlbmNlXG4gICAgLy8gVGhpcyBpcyBhIHJlYWxseSBwb29yIHdvcmthcm91bmQgZm9yIG5vdy5cbiAgICAvLyBMYXRlciB3ZSBzaG91bGQgcHJvYmFibHkgcGFyc2UgdGhlIHdob2xlIHNlcXVlbmNlLlxuICAgIHZhciBTb3VyY2VJbWFnZVNlcXVlbmNlID0gaW5zdGFuY2VbJzAwMDgyMTEyJ107XG4gICAgaWYgKFNvdXJjZUltYWdlU2VxdWVuY2UgJiYgU291cmNlSW1hZ2VTZXF1ZW5jZS5WYWx1ZSAmJiBTb3VyY2VJbWFnZVNlcXVlbmNlLlZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gU291cmNlSW1hZ2VTZXF1ZW5jZS5WYWx1ZVswXVsnMDAwODExNTUnXS5WYWx1ZVswXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhbGV0dGVDb2xvcihzZXJ2ZXIsIGluc3RhbmNlLCB0YWcsIGx1dERlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBudW1MdXRFbnRyaWVzID0gbHV0RGVzY3JpcHRvclswXTtcbiAgICBjb25zdCBiaXRzID0gbHV0RGVzY3JpcHRvclsyXTtcblxuICAgIGxldCB1cmkgPSBXQURPUHJveHkuY29udmVydFVSTChpbnN0YW5jZVt0YWddLkJ1bGtEYXRhVVJJLCBzZXJ2ZXIpXG5cbiAgICAvLyBUT0RPOiBXb3JrYXJvdW5kIGZvciBkY200Y2hlZSBiZWhpbmQgU1NMLXRlcm1pbmF0aW5nIHByb3h5IHJldHVybmluZ1xuICAgIC8vIGluY29ycmVjdCBidWxrIGRhdGEgVVJJc1xuICAgIGlmIChzZXJ2ZXIud2Fkb1Jvb3QuaW5kZXhPZignaHR0cHMnKSA9PT0gMCAmJlxuICAgICAgICAhdXJpLmluY2x1ZGVzKCdodHRwcycpKSB7XG4gICAgICAgIHVyaSA9IHVyaS5yZXBsYWNlKCdodHRwJywgJ2h0dHBzJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICB1cmw6IHNlcnZlci53YWRvUm9vdCwgLy9CdWxrRGF0YVVSSSBpcyBhYnNvbHV0ZSwgc28gdGhpcyBpc24ndCB1c2VkXG4gICAgICAgIGhlYWRlcnM6IE9ISUYuRElDT01XZWIuZ2V0QXV0aG9yaXphdGlvbkhlYWRlcigpXG4gICAgfTtcbiAgICBjb25zdCBkaWNvbVdlYiA9IG5ldyBESUNPTXdlYkNsaWVudC5hcGkuRElDT013ZWJDbGllbnQoY29uZmlnKTtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBCdWxrRGF0YVVSSTogdXJpXG4gICAgfTtcblxuICAgIGNvbnN0IHJlYWRVSW50MTYgPSAoYnl0ZUFycmF5LCBwb3NpdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gYnl0ZUFycmF5W3Bvc2l0aW9uXSArIChieXRlQXJyYXlbcG9zaXRpb24gKyAxXSAqIDI1Nik7XG4gICAgfVxuXG4gICAgY29uc3QgYXJyYXlCdWZmZXJUb1BhbGV0dGVDb2xvckxVVCA9IChhcnJheWJ1ZmZlcikgPT57XG4gICAgICAgIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcbiAgICAgICAgY29uc3QgbHV0ID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1MdXRFbnRyaWVzOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChiaXRzID09PSAxNikge1xuICAgICAgICAgICAgICAgIGx1dFtpXSA9IHJlYWRVSW50MTYoYnl0ZUFycmF5LCBpICogMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGx1dFtpXSA9IGJ5dGVBcnJheVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpY29tV2ViLnJldHJpZXZlQnVsa0RhdGEob3B0aW9ucykudGhlbihhcnJheUJ1ZmZlclRvUGFsZXR0ZUNvbG9yTFVUKVxufVxuXG4vKipcbiAqIEZldGNoIHBhbGV0dGUgY29sb3JzIGZvciBpbnN0YW5jZXMgd2l0aCBcIlBBTEVUVEUgQ09MT1JcIiBwaG90b21ldHJpY0ludGVycHJldGF0aW9uLlxuICpcbiAqIEBwYXJhbSBzZXJ2ZXIge09iamVjdH0gQ3VycmVudCBzZXJ2ZXI7XG4gKiBAcGFyYW0gaW5zdGFuY2Uge09iamVjdH0gVGhlIHJldHJpZXZlZCBpbnN0YW5jZSBtZXRhZGF0YTtcbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBSZWZlcmVuY2VTT1BJbnN0YW5jZVVJRFxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRQYWxldHRlQ29sb3JzKHNlcnZlciwgaW5zdGFuY2UsIGx1dERlc2NyaXB0b3IpIHtcbiAgICBsZXQgcGFsZXR0ZVVJRCA9IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODExOTknXSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAocGFsZXR0ZUNvbG9yQ2FjaGUuaXNWYWxpZFVJRChwYWxldHRlVUlEKSkge1xuICAgICAgICAgICAgY29uc3QgZW50cnkgPSBwYWxldHRlQ29sb3JDYWNoZS5nZXQocGFsZXR0ZVVJRCk7XG5cbiAgICAgICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGVudHJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vIGVudHJ5IGluIGNhY2hlLi4uIEZldGNoIHJlbW90ZSBkYXRhLlxuICAgICAgICBjb25zdCByID0gZ2V0UGFsZXR0ZUNvbG9yKHNlcnZlciwgaW5zdGFuY2UsICcwMDI4MTIwMScsIGx1dERlc2NyaXB0b3IpO1xuICAgICAgICBjb25zdCBnID0gZ2V0UGFsZXR0ZUNvbG9yKHNlcnZlciwgaW5zdGFuY2UsICcwMDI4MTIwMicsIGx1dERlc2NyaXB0b3IpOztcbiAgICAgICAgY29uc3QgYiA9IGdldFBhbGV0dGVDb2xvcihzZXJ2ZXIsIGluc3RhbmNlLCAnMDAyODEyMDMnLCBsdXREZXNjcmlwdG9yKTs7XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbciwgZywgYl07XG5cbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKGFyZ3MpID0+IHtcbiAgICAgICAgICAgIGVudHJ5ID0ge1xuICAgICAgICAgICAgICAgIHJlZDogYXJnc1swXSxcbiAgICAgICAgICAgICAgICBncmVlbjogYXJnc1sxXSxcbiAgICAgICAgICAgICAgICBibHVlOiBhcmdzWzJdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyB3aGVuIHBhbGV0dGVVSUQgaXMgcHJlc2VudCwgdGhlIGVudHJ5IGNhbiBiZSBjYWNoZWQuLi5cbiAgICAgICAgICAgIGVudHJ5LnVpZCA9IHBhbGV0dGVVSUQ7XG4gICAgICAgICAgICBwYWxldHRlQ29sb3JDYWNoZS5hZGQoZW50cnkpO1xuXG4gICAgICAgICAgICByZXNvbHZlKGVudHJ5KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEZyYW1lSW5jcmVtZW50UG9pbnRlcihlbGVtZW50KSB7XG4gICAgY29uc3QgZnJhbWVJbmNyZW1lbnRQb2ludGVyTmFtZXMgPSB7XG4gICAgICAgICcwMDE4MTA2NSc6ICdmcmFtZVRpbWVWZWN0b3InLFxuICAgICAgICAnMDAxODEwNjMnOiAnZnJhbWVUaW1lJ1xuICAgIH07XG5cbiAgICBpZighZWxlbWVudCB8fCAhZWxlbWVudC5WYWx1ZSB8fCAhZWxlbWVudC5WYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0gZWxlbWVudC5WYWx1ZVswXTtcbiAgICByZXR1cm4gZnJhbWVJbmNyZW1lbnRQb2ludGVyTmFtZXNbdmFsdWVdO1xufVxuXG5mdW5jdGlvbiBnZXRSYWRpb3BoYXJtYWNldXRpY2FsSW5mbyhpbnN0YW5jZSkge1xuICAgIGNvbnN0IG1vZGFsaXR5ID0gRElDT01XZWIuZ2V0U3RyaW5nKGluc3RhbmNlWycwMDA4MDA2MCddKTtcblxuICAgIGlmIChtb2RhbGl0eSAhPT0gJ1BUJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmFkaW9waGFybWFjZXV0aWNhbEluZm8gPSBpbnN0YW5jZVsnMDA1NDAwMTYnXTtcbiAgICBpZiAoKHJhZGlvcGhhcm1hY2V1dGljYWxJbmZvID09PSB1bmRlZmluZWQpIHx8ICFyYWRpb3BoYXJtYWNldXRpY2FsSW5mby5WYWx1ZSB8fCAhcmFkaW9waGFybWFjZXV0aWNhbEluZm8uVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaXJzdFBldFJhZGlvcGhhcm1hY2V1dGljYWxJbmZvID0gcmFkaW9waGFybWFjZXV0aWNhbEluZm8uVmFsdWVbMF07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmFkaW9waGFybWFjZXV0aWNhbFN0YXJ0VGltZTogRElDT01XZWIuZ2V0U3RyaW5nKGZpcnN0UGV0UmFkaW9waGFybWFjZXV0aWNhbEluZm9bJzAwMTgxMDcyJ10pLFxuICAgICAgICByYWRpb251Y2xpZGVUb3RhbERvc2U6IERJQ09NV2ViLmdldE51bWJlcihmaXJzdFBldFJhZGlvcGhhcm1hY2V1dGljYWxJbmZvWycwMDE4MTA3NCddKSxcbiAgICAgICAgcmFkaW9udWNsaWRlSGFsZkxpZmU6IERJQ09NV2ViLmdldE51bWJlcihmaXJzdFBldFJhZGlvcGhhcm1hY2V1dGljYWxJbmZvWycwMDE4MTA3NSddKVxuICAgIH07XG59XG5cbi8qKlxuICogUGFyc2VzIHJlc3VsdCBkYXRhIGZyb20gYSBXQURPIHNlYXJjaCBpbnRvIFN0dWR5IE1ldGFEYXRhXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBwb3B1bGF0ZWQgd2l0aCBzdHVkeSBtZXRhZGF0YSwgaW5jbHVkaW5nIHRoZVxuICogc2VyaWVzIGxpc3QuXG4gKlxuICogQHBhcmFtIHNlcnZlclxuICogQHBhcmFtIHN0dWR5SW5zdGFuY2VVaWRcbiAqIEBwYXJhbSByZXN1bHREYXRhXG4gKiBAcmV0dXJucyB7e3Nlcmllc0xpc3Q6IEFycmF5LCBwYXRpZW50TmFtZTogKiwgcGF0aWVudElkOiAqLCBhY2Nlc3Npb25OdW1iZXI6ICosIHN0dWR5RGF0ZTogKiwgbW9kYWxpdGllczogKiwgc3R1ZHlEZXNjcmlwdGlvbjogKiwgaW1hZ2VDb3VudDogKiwgc3R1ZHlJbnN0YW5jZVVpZDogKn19XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlc3VsdERhdGFUb1N0dWR5TWV0YWRhdGEoc2VydmVyLCBzdHVkeUluc3RhbmNlVWlkLCByZXN1bHREYXRhKSB7XG4gICAgaWYgKCFyZXN1bHREYXRhLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYW5JbnN0YW5jZSA9IHJlc3VsdERhdGFbMF07XG4gICAgaWYgKCFhbkluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdHVkeURhdGEgPSB7XG4gICAgICAgIHNlcmllc0xpc3Q6IFtdLFxuICAgICAgICBzdHVkeUluc3RhbmNlVWlkLFxuICAgICAgICB3YWRvVXJpUm9vdDogc2VydmVyLndhZG9VcmlSb290LFxuICAgICAgICBwYXRpZW50TmFtZTogRElDT01XZWIuZ2V0TmFtZShhbkluc3RhbmNlWycwMDEwMDAxMCddKSxcbiAgICAgICAgcGF0aWVudElkOiBESUNPTVdlYi5nZXRTdHJpbmcoYW5JbnN0YW5jZVsnMDAxMDAwMjAnXSksXG4gICAgICAgIHBhdGllbnRBZ2U6IERJQ09NV2ViLmdldE51bWJlcihhbkluc3RhbmNlWycwMDEwMTAxMCddKSxcbiAgICAgICAgcGF0aWVudFNpemU6IERJQ09NV2ViLmdldE51bWJlcihhbkluc3RhbmNlWycwMDEwMTAyMCddKSxcbiAgICAgICAgcGF0aWVudFdlaWdodDogRElDT01XZWIuZ2V0TnVtYmVyKGFuSW5zdGFuY2VbJzAwMTAxMDMwJ10pLFxuICAgICAgICBhY2Nlc3Npb25OdW1iZXI6IERJQ09NV2ViLmdldFN0cmluZyhhbkluc3RhbmNlWycwMDA4MDA1MCddKSxcbiAgICAgICAgc3R1ZHlEYXRlOiBESUNPTVdlYi5nZXRTdHJpbmcoYW5JbnN0YW5jZVsnMDAwODAwMjAnXSksXG4gICAgICAgIG1vZGFsaXRpZXM6IERJQ09NV2ViLmdldFN0cmluZyhhbkluc3RhbmNlWycwMDA4MDA2MSddKSxcbiAgICAgICAgc3R1ZHlEZXNjcmlwdGlvbjogRElDT01XZWIuZ2V0U3RyaW5nKGFuSW5zdGFuY2VbJzAwMDgxMDMwJ10pLFxuICAgICAgICBpbWFnZUNvdW50OiBESUNPTVdlYi5nZXRTdHJpbmcoYW5JbnN0YW5jZVsnMDAyMDEyMDgnXSksXG4gICAgICAgIHN0dWR5SW5zdGFuY2VVaWQ6IERJQ09NV2ViLmdldFN0cmluZyhhbkluc3RhbmNlWycwMDIwMDAwRCddKSxcbiAgICAgICAgaW5zdGl0dXRpb25OYW1lOiBESUNPTVdlYi5nZXRTdHJpbmcoYW5JbnN0YW5jZVsnMDAwODAwODAnXSlcbiAgICB9O1xuXG4gICAgY29uc3Qgc2VyaWVzTWFwID0ge307XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChyZXN1bHREYXRhLm1hcChhc3luYyBmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgICAgICBjb25zdCBzZXJpZXNJbnN0YW5jZVVpZCA9IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyMDAwMEUnXSk7XG4gICAgICAgIGxldCBzZXJpZXMgPSBzZXJpZXNNYXBbc2VyaWVzSW5zdGFuY2VVaWRdO1xuXG4gICAgICAgIGlmICghc2VyaWVzKSB7XG4gICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgc2VyaWVzRGVzY3JpcHRpb246IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODEwM0UnXSksXG4gICAgICAgICAgICAgICAgbW9kYWxpdHk6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwNjAnXSksXG4gICAgICAgICAgICAgICAgc2VyaWVzSW5zdGFuY2VVaWQ6IHNlcmllc0luc3RhbmNlVWlkLFxuICAgICAgICAgICAgICAgIHNlcmllc051bWJlcjogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDIwMDAxMSddKSxcbiAgICAgICAgICAgICAgICBzZXJpZXNEYXRlOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMDgwMDIxJ10pLFxuICAgICAgICAgICAgICAgIHNlcmllc1RpbWU6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwMzEnXSksXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlcmllc01hcFtzZXJpZXNJbnN0YW5jZVVpZF0gPSBzZXJpZXM7XG4gICAgICAgICAgICBzdHVkeURhdGEuc2VyaWVzTGlzdC5wdXNoKHNlcmllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3BJbnN0YW5jZVVpZCA9IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwMTgnXSk7XG4gICAgICAgIGNvbnN0IHdhZG91cmkgPSBidWlsZEluc3RhbmNlV2Fkb1VybChzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHNlcmllc0luc3RhbmNlVWlkLCBzb3BJbnN0YW5jZVVpZCk7XG4gICAgICAgIGNvbnN0IGJhc2VXYWRvUnNVcmkgPSBidWlsZEluc3RhbmNlV2Fkb1JzVXJpKHNlcnZlciwgc3R1ZHlJbnN0YW5jZVVpZCwgc2VyaWVzSW5zdGFuY2VVaWQsIHNvcEluc3RhbmNlVWlkKTtcbiAgICAgICAgY29uc3Qgd2Fkb3JzdXJpID0gYnVpbGRJbnN0YW5jZUZyYW1lV2Fkb1JzVXJpKHNlcnZlciwgc3R1ZHlJbnN0YW5jZVVpZCwgc2VyaWVzSW5zdGFuY2VVaWQsIHNvcEluc3RhbmNlVWlkKTtcblxuICAgICAgICBjb25zdCBpbnN0YW5jZVN1bW1hcnkgPSB7XG4gICAgICAgICAgICBpbWFnZVR5cGU6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAwODAwMDgnXSksXG4gICAgICAgICAgICBzb3BDbGFzc1VpZDogRElDT01XZWIuZ2V0U3RyaW5nKGluc3RhbmNlWycwMDA4MDAxNiddKSxcbiAgICAgICAgICAgIG1vZGFsaXR5OiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMDgwMDYwJ10pLFxuICAgICAgICAgICAgc29wSW5zdGFuY2VVaWQsXG4gICAgICAgICAgICBpbnN0YW5jZU51bWJlcjogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDIwMDAxMyddKSxcbiAgICAgICAgICAgIGltYWdlUG9zaXRpb25QYXRpZW50OiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjAwMDMyJ10pLFxuICAgICAgICAgICAgaW1hZ2VPcmllbnRhdGlvblBhdGllbnQ6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyMDAwMzcnXSksXG4gICAgICAgICAgICBmcmFtZU9mUmVmZXJlbmNlVUlEOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjAwMDUyJ10pLFxuICAgICAgICAgICAgc2xpY2VMb2NhdGlvbjogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDIwMTA0MSddKSxcbiAgICAgICAgICAgIHNhbXBsZXNQZXJQaXhlbDogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDI4MDAwMiddKSxcbiAgICAgICAgICAgIHBob3RvbWV0cmljSW50ZXJwcmV0YXRpb246IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODAwMDQnXSksXG4gICAgICAgICAgICBwbGFuYXJDb25maWd1cmF0aW9uOiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMjgwMDA2J10pLFxuICAgICAgICAgICAgcm93czogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDI4MDAxMCddKSxcbiAgICAgICAgICAgIGNvbHVtbnM6IERJQ09NV2ViLmdldE51bWJlcihpbnN0YW5jZVsnMDAyODAwMTEnXSksXG4gICAgICAgICAgICBwaXhlbFNwYWNpbmc6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODAwMzAnXSksXG4gICAgICAgICAgICBwaXhlbEFzcGVjdFJhdGlvOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgwMDM0J10pLFxuICAgICAgICAgICAgYml0c0FsbG9jYXRlZDogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDI4MDEwMCddKSxcbiAgICAgICAgICAgIGJpdHNTdG9yZWQ6IERJQ09NV2ViLmdldE51bWJlcihpbnN0YW5jZVsnMDAyODAxMDEnXSksXG4gICAgICAgICAgICBoaWdoQml0OiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMjgwMTAyJ10pLFxuICAgICAgICAgICAgcGl4ZWxSZXByZXNlbnRhdGlvbjogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDI4MDEwMyddKSxcbiAgICAgICAgICAgIHNtYWxsZXN0UGl4ZWxWYWx1ZTogRElDT01XZWIuZ2V0TnVtYmVyKGluc3RhbmNlWycwMDI4MDEwNiddKSxcbiAgICAgICAgICAgIGxhcmdlc3RQaXhlbFZhbHVlOiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMjgwMTA3J10pLFxuICAgICAgICAgICAgd2luZG93Q2VudGVyOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgxMDUwJ10pLFxuICAgICAgICAgICAgd2luZG93V2lkdGg6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODEwNTEnXSksXG4gICAgICAgICAgICByZXNjYWxlSW50ZXJjZXB0OiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMjgxMDUyJ10pLFxuICAgICAgICAgICAgcmVzY2FsZVNsb3BlOiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMjgxMDUzJ10pLFxuICAgICAgICAgICAgcmVzY2FsZVR5cGU6IERJQ09NV2ViLmdldE51bWJlcihpbnN0YW5jZVsnMDAyODEwNTQnXSksXG4gICAgICAgICAgICBzb3VyY2VJbWFnZUluc3RhbmNlVWlkOiBnZXRTb3VyY2VJbWFnZUluc3RhbmNlVWlkKGluc3RhbmNlKSxcbiAgICAgICAgICAgIGxhdGVyYWxpdHk6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyMDAwNjInXSksXG4gICAgICAgICAgICB2aWV3UG9zaXRpb246IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAxODUxMDEnXSksXG4gICAgICAgICAgICBhY3F1aXNpdGlvbkRhdGVUaW1lOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMDgwMDJBJ10pLFxuICAgICAgICAgICAgbnVtYmVyT2ZGcmFtZXM6IERJQ09NV2ViLmdldE51bWJlcihpbnN0YW5jZVsnMDAyODAwMDgnXSksXG4gICAgICAgICAgICBmcmFtZUluY3JlbWVudFBvaW50ZXI6IGdldEZyYW1lSW5jcmVtZW50UG9pbnRlcihpbnN0YW5jZVsnMDAyODAwMDknXSksXG4gICAgICAgICAgICBmcmFtZVRpbWU6IERJQ09NV2ViLmdldE51bWJlcihpbnN0YW5jZVsnMDAxODEwNjMnXSksXG4gICAgICAgICAgICBmcmFtZVRpbWVWZWN0b3I6IHBhcnNlRmxvYXRBcnJheShESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMTgxMDY1J10pKSxcbiAgICAgICAgICAgIHNsaWNlVGhpY2tuZXNzOiBESUNPTVdlYi5nZXROdW1iZXIoaW5zdGFuY2VbJzAwMTgwMDUwJ10pLFxuICAgICAgICAgICAgbG9zc3lJbWFnZUNvbXByZXNzaW9uOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgyMTEwJ10pLFxuICAgICAgICAgICAgZGVyaXZhdGlvbkRlc2NyaXB0aW9uOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgyMTExJ10pLFxuICAgICAgICAgICAgbG9zc3lJbWFnZUNvbXByZXNzaW9uUmF0aW86IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODIxMTInXSksXG4gICAgICAgICAgICBsb3NzeUltYWdlQ29tcHJlc3Npb25NZXRob2Q6IERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODIxMTQnXSksXG4gICAgICAgICAgICBlY2hvTnVtYmVyOiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMTgwMDg2J10pLFxuICAgICAgICAgICAgY29udHJhc3RCb2x1c0FnZW50OiBESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMTgwMDEwJ10pLFxuICAgICAgICAgICAgcmFkaW9waGFybWFjZXV0aWNhbEluZm86IGdldFJhZGlvcGhhcm1hY2V1dGljYWxJbmZvKGluc3RhbmNlKSxcbiAgICAgICAgICAgIGJhc2VXYWRvUnNVcmk6IGJhc2VXYWRvUnNVcmksXG4gICAgICAgICAgICB3YWRvdXJpOiBXQURPUHJveHkuY29udmVydFVSTCh3YWRvdXJpLCBzZXJ2ZXIpLFxuICAgICAgICAgICAgd2Fkb3JzdXJpOiBXQURPUHJveHkuY29udmVydFVSTCh3YWRvcnN1cmksIHNlcnZlciksXG4gICAgICAgICAgICBpbWFnZVJlbmRlcmluZzogc2VydmVyLmltYWdlUmVuZGVyaW5nLFxuICAgICAgICAgICAgdGh1bWJuYWlsUmVuZGVyaW5nOiBzZXJ2ZXIudGh1bWJuYWlsUmVuZGVyaW5nXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gR2V0IGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaWYgdGhlIGluc3RhbmNlIHVzZXMgXCJQQUxFVFRFIENPTE9SXCIgcGhvdG9tZXRyaWMgaW50ZXJwcmV0YXRpb25cbiAgICAgICAgaWYgKGluc3RhbmNlU3VtbWFyeS5waG90b21ldHJpY0ludGVycHJldGF0aW9uID09PSAnUEFMRVRURSBDT0xPUicpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZFBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGVzY3JpcHRvciA9IHBhcnNlRmxvYXRBcnJheShESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgxMTAxJ10pKTtcbiAgICAgICAgICAgIGNvbnN0IGdyZWVuUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEZXNjcmlwdG9yID0gcGFyc2VGbG9hdEFycmF5KERJQ09NV2ViLmdldFN0cmluZyhpbnN0YW5jZVsnMDAyODExMDInXSkpO1xuICAgICAgICAgICAgY29uc3QgYmx1ZVBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGVzY3JpcHRvciA9IHBhcnNlRmxvYXRBcnJheShESUNPTVdlYi5nZXRTdHJpbmcoaW5zdGFuY2VbJzAwMjgxMTAzJ10pKTtcbiAgICAgICAgICAgIGNvbnN0IHBhbGV0dGVzID0gYXdhaXQgZ2V0UGFsZXR0ZUNvbG9ycyhzZXJ2ZXIsIGluc3RhbmNlLCByZWRQYWxldHRlQ29sb3JMb29rdXBUYWJsZURlc2NyaXB0b3IpO1xuXG4gICAgICAgICAgICBpZiAocGFsZXR0ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFsZXR0ZXMudWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlU3VtbWFyeS5wYWxldHRlQ29sb3JMb29rdXBUYWJsZVVJRCA9IHBhbGV0dGVzLnVpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnN0YW5jZVN1bW1hcnkucmVkUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEYXRhID0gcGFsZXR0ZXMucmVkO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlU3VtbWFyeS5ncmVlblBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGF0YSA9IHBhbGV0dGVzLmdyZWVuO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlU3VtbWFyeS5ibHVlUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEYXRhID0gcGFsZXR0ZXMuYmx1ZTtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZVN1bW1hcnkucmVkUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEZXNjcmlwdG9yID0gcmVkUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEZXNjcmlwdG9yO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlU3VtbWFyeS5ncmVlblBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGVzY3JpcHRvciA9IGdyZWVuUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEZXNjcmlwdG9yO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlU3VtbWFyeS5ibHVlUGFsZXR0ZUNvbG9yTG9va3VwVGFibGVEZXNjcmlwdG9yID0gYmx1ZVBhbGV0dGVDb2xvckxvb2t1cFRhYmxlRGVzY3JpcHRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNlcmllcy5pbnN0YW5jZXMucHVzaChpbnN0YW5jZVN1bW1hcnkpO1xuICAgIH0pKTtcblxuICAgIHJldHVybiBzdHVkeURhdGE7XG59XG5cbi8qKlxuICogUmV0cmlldmUgU3R1ZHkgTWV0YURhdGEgZnJvbSBhIERJQ09NIHNlcnZlciB1c2luZyBhIFdBRE8gY2FsbFxuICpcbiAqIEBwYXJhbSBzZXJ2ZXJcbiAqIEBwYXJhbSBzdHVkeUluc3RhbmNlVWlkXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuT0hJRi5zdHVkaWVzLnNlcnZpY2VzLldBRE8uUmV0cmlldmVNZXRhZGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHNlcnZlciwgc3R1ZHlJbnN0YW5jZVVpZCkge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgdXJsOiBzZXJ2ZXIud2Fkb1Jvb3QsXG4gICAgICAgIGhlYWRlcnM6IE9ISUYuRElDT01XZWIuZ2V0QXV0aG9yaXphdGlvbkhlYWRlcigpXG4gICAgfTtcbiAgICBjb25zdCBkaWNvbVdlYiA9IG5ldyBESUNPTXdlYkNsaWVudC5hcGkuRElDT013ZWJDbGllbnQoY29uZmlnKTtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBzdHVkeUluc3RhbmNlVUlEOiBzdHVkeUluc3RhbmNlVWlkXG4gICAgfTtcblxuICAgIHJldHVybiBkaWNvbVdlYi5yZXRyaWV2ZVN0dWR5TWV0YWRhdGEob3B0aW9ucykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICByZXR1cm4gcmVzdWx0RGF0YVRvU3R1ZHlNZXRhZGF0YShzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQsIHJlc3VsdCk7XG4gICAgfSk7XG59O1xuIiwiaW1wb3J0ICcuL21ldGhvZHMnO1xuaW1wb3J0ICcuL3NlcnZpY2VzJztcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIFN0dWR5IG1ldGFkYXRhIGdpdmVuIGEgU3R1ZHkgSW5zdGFuY2UgVUlEXG4gICAgICogVGhpcyBNZXRlb3IgbWV0aG9kIGlzIGF2YWlsYWJsZSBmcm9tIGJvdGggdGhlIGNsaWVudCBhbmQgdGhlIHNlcnZlclxuICAgICAqL1xuICAgIEdldFN0dWR5TWV0YWRhdGE6IGZ1bmN0aW9uKHN0dWR5SW5zdGFuY2VVaWQpIHtcbiAgICAgICAgT0hJRi5sb2cuaW5mbygnR2V0U3R1ZHlNZXRhZGF0YSglcyknLCBzdHVkeUluc3RhbmNlVWlkKTtcblxuICAgICAgICAvLyBHZXQgdGhlIHNlcnZlciBkYXRhLiBUaGlzIGlzIHVzZXItZGVmaW5lZCBpbiB0aGUgY29uZmlnLmpzb24gZmlsZXMgb3IgdGhyb3VnaCBzZXJ2ZXJzXG4gICAgICAgIC8vIGNvbmZpZ3VyYXRpb24gbW9kYWxcbiAgICAgICAgY29uc3Qgc2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKTtcblxuICAgICAgICBpZiAoIXNlcnZlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW1wcm9wZXItc2VydmVyLWNvbmZpZycsICdObyBwcm9wZXJseSBjb25maWd1cmVkIHNlcnZlciB3YXMgYXZhaWxhYmxlIG92ZXIgRElDT01XZWIgb3IgRElNU0UuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHNlcnZlci50eXBlID09PSAnZGljb21XZWInKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ISUYuc3R1ZGllcy5zZXJ2aWNlcy5XQURPLlJldHJpZXZlTWV0YWRhdGEoc2VydmVyLCBzdHVkeUluc3RhbmNlVWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VydmVyLnR5cGUgPT09ICdkaW1zZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT0hJRi5zdHVkaWVzLnNlcnZpY2VzLkRJTVNFLlJldHJpZXZlTWV0YWRhdGEoc3R1ZHlJbnN0YW5jZVVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBPSElGLmxvZy50cmFjZSgpO1xuXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIiwiaW1wb3J0ICcuL2dldFN0dWR5TWV0YWRhdGEuanMnO1xuaW1wb3J0ICcuL3N0dWR5bGlzdFNlYXJjaC5qcyc7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgIC8qKlxuICAgICAqIFVzZSB0aGUgc3BlY2lmaWVkIGZpbHRlciB0byBjb25kdWN0IGEgc2VhcmNoIGZyb20gdGhlIERJQ09NIHNlcnZlclxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbHRlclxuICAgICAqL1xuICAgIFN0dWR5TGlzdFNlYXJjaChmaWx0ZXIpIHtcbiAgICAgICAgLy8gR2V0IHRoZSBzZXJ2ZXIgZGF0YS4gVGhpcyBpcyB1c2VyLWRlZmluZWQgaW4gdGhlIGNvbmZpZy5qc29uIGZpbGVzIG9yIHRocm91Z2ggc2VydmVyc1xuICAgICAgICAvLyBjb25maWd1cmF0aW9uIG1vZGFsXG4gICAgICAgIGNvbnN0IHNlcnZlciA9IE9ISUYuc2VydmVycy5nZXRDdXJyZW50U2VydmVyKCk7XG5cbiAgICAgICAgaWYgKCFzZXJ2ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ltcHJvcGVyLXNlcnZlci1jb25maWcnLCAnTm8gcHJvcGVybHkgY29uZmlndXJlZCBzZXJ2ZXIgd2FzIGF2YWlsYWJsZSBvdmVyIERJQ09NV2ViIG9yIERJTVNFLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChzZXJ2ZXIudHlwZSA9PT0gJ2RpY29tV2ViJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBPSElGLnN0dWRpZXMuc2VydmljZXMuUUlETy5TdHVkaWVzKHNlcnZlciwgZmlsdGVyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VydmVyLnR5cGUgPT09ICdkaW1zZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT0hJRi5zdHVkaWVzLnNlcnZpY2VzLkRJTVNFLlN0dWRpZXMoZmlsdGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIE9ISUYubG9nLnRyYWNlKCk7XG5cbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iLCJpbXBvcnQgJy4vbmFtZXNwYWNlLmpzJztcblxuLy8gRElNU0UgaW5zdGFuY2UsIHN0dWR5LCBhbmQgbWV0YWRhdGEgcmV0cmlldmFsXG5pbXBvcnQgJy4vZGltc2UvaW5zdGFuY2VzLmpzJztcbmltcG9ydCAnLi9kaW1zZS9zdHVkaWVzLmpzJztcbmltcG9ydCAnLi9kaW1zZS9yZXRyaWV2ZU1ldGFkYXRhLmpzJztcbmltcG9ydCAnLi9kaW1zZS9zZXR1cC5qcyc7XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5cbk9ISUYuc3R1ZGllcy5zZXJ2aWNlcy5ESU1TRSA9IHt9O1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuaW1wb3J0IERJTVNFIGZyb20gJ2RpbXNlJztcblxuLyoqXG4gKiBQYXJzZXMgZGF0YSByZXR1cm5lZCBmcm9tIGEgc3R1ZHkgc2VhcmNoIGFuZCB0cmFuc2Zvcm1zIGl0IGludG9cbiAqIGFuIGFycmF5IG9mIHNlcmllcyB0aGF0IGFyZSBwcmVzZW50IGluIHRoZSBzdHVkeVxuICpcbiAqIEBwYXJhbSByZXN1bHREYXRhXG4gKiBAcGFyYW0gc3R1ZHlJbnN0YW5jZVVpZFxuICogQHJldHVybnMge0FycmF5fSBTZXJpZXMgTGlzdFxuICovXG5mdW5jdGlvbiByZXN1bHREYXRhVG9TdHVkeU1ldGFkYXRhKHJlc3VsdERhdGEsIHN0dWR5SW5zdGFuY2VVaWQpIHtcbiAgICBjb25zdCBzZXJpZXNNYXAgPSB7fTtcbiAgICBjb25zdCBzZXJpZXNMaXN0ID0gW107XG5cbiAgICByZXN1bHREYXRhLmZvckVhY2goZnVuY3Rpb24oaW5zdGFuY2VSYXcpIHtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZVJhdy50b09iamVjdCgpO1xuICAgICAgICAvLyBVc2Ugc2VyaWVzTWFwIHRvIGNhY2hlIHNlcmllcyBkYXRhXG4gICAgICAgIC8vIElmIHRoZSBzZXJpZXMgaW5zdGFuY2UgVUlEIGhhcyBhbHJlYWR5IGJlZW4gdXNlZCB0b1xuICAgICAgICAvLyBwcm9jZXNzIHNlcmllcyBkYXRhLCBjb250aW51ZSB1c2luZyB0aGF0IHNlcmllc1xuICAgICAgICBjb25zdCBzZXJpZXNJbnN0YW5jZVVpZCA9IGluc3RhbmNlWzB4MDAyMDAwMEVdO1xuICAgICAgICBsZXQgc2VyaWVzID0gc2VyaWVzTWFwW3Nlcmllc0luc3RhbmNlVWlkXTtcblxuICAgICAgICAvLyBJZiBubyBzZXJpZXMgZGF0YSBleGlzdHMgaW4gdGhlIHNlcmllc01hcCBjYWNoZSB2YXJpYWJsZSxcbiAgICAgICAgLy8gcHJvY2VzcyBhbnkgYXZhaWxhYmxlIHNlcmllcyBkYXRhXG4gICAgICAgIGlmICghc2VyaWVzKSB7XG4gICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgc2VyaWVzSW5zdGFuY2VVaWQ6IHNlcmllc0luc3RhbmNlVWlkLFxuICAgICAgICAgICAgICAgIHNlcmllc051bWJlcjogaW5zdGFuY2VbMHgwMDIwMDAxMV0sXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzOiBbXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gU2F2ZSB0aGlzIGRhdGEgaW4gdGhlIHNlcmllc01hcCBjYWNoZSB2YXJpYWJsZVxuICAgICAgICAgICAgc2VyaWVzTWFwW3Nlcmllc0luc3RhbmNlVWlkXSA9IHNlcmllcztcbiAgICAgICAgICAgIHNlcmllc0xpc3QucHVzaChzZXJpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogQ2hlY2sgd2hpY2ggcGVlciBpdCBzaG91bGQgcG9pbnQgdG9cbiAgICAgICAgY29uc3Qgc2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKS5wZWVyc1swXTtcblxuICAgICAgICBjb25zdCBzZXJ2ZXJSb290ID0gc2VydmVyLmhvc3QgKyAnOicgKyBzZXJ2ZXIucG9ydDtcblxuICAgICAgICBjb25zdCBzb3BJbnN0YW5jZVVpZCA9IGluc3RhbmNlWzB4MDAwODAwMThdO1xuICAgICAgICBjb25zdCB1cmkgPSBzZXJ2ZXJSb290ICsgJy9zdHVkaWVzLycgKyBzdHVkeUluc3RhbmNlVWlkICsgJy9zZXJpZXMvJyArIHNlcmllc0luc3RhbmNlVWlkICsgJy9pbnN0YW5jZXMvJyArIHNvcEluc3RhbmNlVWlkICsgJy9mcmFtZXMvMSc7XG5cbiAgICAgICAgLy8gQWRkIHRoaXMgaW5zdGFuY2UgdG8gdGhlIGN1cnJlbnQgc2VyaWVzXG4gICAgICAgIHNlcmllcy5pbnN0YW5jZXMucHVzaCh7XG4gICAgICAgICAgICBzb3BDbGFzc1VpZDogaW5zdGFuY2VbMHgwMDA4MDAxNl0sXG4gICAgICAgICAgICBzb3BJbnN0YW5jZVVpZCxcbiAgICAgICAgICAgIHVyaSxcbiAgICAgICAgICAgIGluc3RhbmNlTnVtYmVyOiBpbnN0YW5jZVsweDAwMjAwMDEzXVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2VyaWVzTGlzdDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBhIHNldCBvZiBpbnN0YW5jZXMgdXNpbmcgYSBESU1TRSBjYWxsXG4gKiBAcGFyYW0gc3R1ZHlJbnN0YW5jZVVpZFxuICogQHJldHVybnMge3t3YWRvVXJpUm9vdDogU3RyaW5nLCBzdHVkeUluc3RhbmNlVWlkOiBTdHJpbmcsIHNlcmllc0xpc3Q6IEFycmF5fX1cbiAqL1xuT0hJRi5zdHVkaWVzLnNlcnZpY2VzLkRJTVNFLkluc3RhbmNlcyA9IGZ1bmN0aW9uKHN0dWR5SW5zdGFuY2VVaWQpIHtcbiAgICAvL3ZhciB1cmwgPSBidWlsZFVybChzZXJ2ZXIsIHN0dWR5SW5zdGFuY2VVaWQpO1xuICAgIGNvbnN0IHJlc3VsdCA9IERJTVNFLnJldHJpZXZlSW5zdGFuY2VzKHN0dWR5SW5zdGFuY2VVaWQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3R1ZHlJbnN0YW5jZVVpZDogc3R1ZHlJbnN0YW5jZVVpZCxcbiAgICAgICAgc2VyaWVzTGlzdDogcmVzdWx0RGF0YVRvU3R1ZHlNZXRhZGF0YShyZXN1bHQsIHN0dWR5SW5zdGFuY2VVaWQpXG4gICAgfTtcbn07XG4iLCJpbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBwYXJzZUZsb2F0QXJyYXkgfSBmcm9tICdtZXRlb3Ivb2hpZjpzdHVkaWVzL2ltcG9ydHMvYm90aC9saWIvcGFyc2VGbG9hdEFycmF5JztcbmltcG9ydCBESU1TRSBmcm9tICdkaW1zZSc7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgKGUuZy4gJzAwMjgwMDA5JylcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAtIFRoZSBncm91cC9lbGVtZW50IG9mIHRoZSBlbGVtZW50IChlLmcuICcwMDI4MDAwOScpXG4gKiBAcGFyYW0gZGVmYXVsdFZhbHVlIC0gVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBlbGVtZW50IGRvZXMgbm90IGV4aXN0XG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gZ2V0VmFsdWUoZWxlbWVudCwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKCFlbGVtZW50IHx8ICFlbGVtZW50LnZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnQudmFsdWU7XG59XG5cbi8qKlxuICogUGFyc2VzIHRoZSBTb3VyY2VJbWFnZVNlcXVlbmNlLCBpZiBpdCBleGlzdHMsIGluIG9yZGVyXG4gKiB0byByZXR1cm4gYSBSZWZlcmVuY2VTT1BJbnN0YW5jZVVJRC4gVGhlIFJlZmVyZW5jZVNPUEluc3RhbmNlVUlEXG4gKiBpcyB1c2VkIHRvIHJlZmVyIHRvIHRoaXMgaW1hZ2UgaW4gYW55IGFjY29tcGFueWluZyBESUNPTS1TUiBkb2N1bWVudHMuXG4gKlxuICogQHBhcmFtIGluc3RhbmNlXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgUmVmZXJlbmNlU09QSW5zdGFuY2VVSURcbiAqL1xuZnVuY3Rpb24gZ2V0U291cmNlSW1hZ2VJbnN0YW5jZVVpZChpbnN0YW5jZSkge1xuICAgIC8vIFRPRE89IFBhcnNlIHRoZSB3aG9sZSBTb3VyY2UgSW1hZ2UgU2VxdWVuY2VcbiAgICAvLyBUaGlzIGlzIGEgcmVhbGx5IHBvb3Igd29ya2Fyb3VuZCBmb3Igbm93LlxuICAgIC8vIExhdGVyIHdlIHNob3VsZCBwcm9iYWJseSBwYXJzZSB0aGUgd2hvbGUgc2VxdWVuY2UuXG4gICAgY29uc3QgU291cmNlSW1hZ2VTZXF1ZW5jZSA9IGluc3RhbmNlWzB4MDAwODIxMTJdO1xuICAgIGlmIChTb3VyY2VJbWFnZVNlcXVlbmNlICYmIFNvdXJjZUltYWdlU2VxdWVuY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBTb3VyY2VJbWFnZVNlcXVlbmNlWzBdWzB4MDAwODExNTVdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZXMgcmVzdWx0IGRhdGEgZnJvbSBhIERJTVNFIHNlYXJjaCBpbnRvIFN0dWR5IE1ldGFEYXRhXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBwb3B1bGF0ZWQgd2l0aCBzdHVkeSBtZXRhZGF0YSwgaW5jbHVkaW5nIHRoZVxuICogc2VyaWVzIGxpc3QuXG4gKlxuICogQHBhcmFtIHN0dWR5SW5zdGFuY2VVaWRcbiAqIEBwYXJhbSByZXN1bHREYXRhXG4gKiBAcmV0dXJucyB7e3Nlcmllc0xpc3Q6IEFycmF5LCBwYXRpZW50TmFtZTogKiwgcGF0aWVudElkOiAqLCBhY2Nlc3Npb25OdW1iZXI6ICosIHN0dWR5RGF0ZTogKiwgbW9kYWxpdGllczogKiwgc3R1ZHlEZXNjcmlwdGlvbjogKiwgaW1hZ2VDb3VudDogKiwgc3R1ZHlJbnN0YW5jZVVpZDogKn19XG4gKi9cbmZ1bmN0aW9uIHJlc3VsdERhdGFUb1N0dWR5TWV0YWRhdGEoc3R1ZHlJbnN0YW5jZVVpZCwgcmVzdWx0RGF0YSkge1xuICAgIE9ISUYubG9nLmluZm8oJ3Jlc3VsdERhdGFUb1N0dWR5TWV0YWRhdGEnKTtcbiAgICBjb25zdCBzZXJpZXNNYXAgPSB7fTtcbiAgICBjb25zdCBzZXJpZXNMaXN0ID0gW107XG5cbiAgICBpZiAoIXJlc3VsdERhdGEubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhbkluc3RhbmNlID0gcmVzdWx0RGF0YVswXS50b09iamVjdCgpO1xuICAgIGlmICghYW5JbnN0YW5jZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3R1ZHlEYXRhID0ge1xuICAgICAgICBzZXJpZXNMaXN0OiBzZXJpZXNMaXN0LFxuICAgICAgICBwYXRpZW50TmFtZTogYW5JbnN0YW5jZVsweDAwMTAwMDEwXSxcbiAgICAgICAgcGF0aWVudElkOiBhbkluc3RhbmNlWzB4MDAxMDAwMjBdLFxuICAgICAgICBwYXRpZW50QmlydGhEYXRlOiBhbkluc3RhbmNlWzB4MDAxMDAwMzBdLFxuICAgICAgICBwYXRpZW50U2V4OiBhbkluc3RhbmNlWzB4MDAxMDAwNDBdLFxuICAgICAgICBhY2Nlc3Npb25OdW1iZXI6IGFuSW5zdGFuY2VbMHgwMDA4MDA1MF0sXG4gICAgICAgIHN0dWR5RGF0ZTogYW5JbnN0YW5jZVsweDAwMDgwMDIwXSxcbiAgICAgICAgbW9kYWxpdGllczogYW5JbnN0YW5jZVsweDAwMDgwMDYxXSxcbiAgICAgICAgc3R1ZHlEZXNjcmlwdGlvbjogYW5JbnN0YW5jZVsweDAwMDgxMDMwXSxcbiAgICAgICAgaW1hZ2VDb3VudDogYW5JbnN0YW5jZVsweDAwMjAxMjA4XSxcbiAgICAgICAgc3R1ZHlJbnN0YW5jZVVpZDogYW5JbnN0YW5jZVsweDAwMjAwMDBEXSxcbiAgICAgICAgaW5zdGl0dXRpb25OYW1lOiBhbkluc3RhbmNlWzB4MDAwODAwODBdXG4gICAgfTtcblxuICAgIHJlc3VsdERhdGEuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZVJhdykge1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlUmF3LnRvT2JqZWN0KCk7XG4gICAgICAgIGNvbnN0IHNlcmllc0luc3RhbmNlVWlkID0gaW5zdGFuY2VbMHgwMDIwMDAwRV07XG4gICAgICAgIGxldCBzZXJpZXMgPSBzZXJpZXNNYXBbc2VyaWVzSW5zdGFuY2VVaWRdO1xuICAgICAgICBpZiAoIXNlcmllcykge1xuICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgIHNlcmllc0Rlc2NyaXB0aW9uOiBpbnN0YW5jZVsweDAwMDgxMDNFXSxcbiAgICAgICAgICAgICAgICBtb2RhbGl0eTogaW5zdGFuY2VbMHgwMDA4MDA2MF0sXG4gICAgICAgICAgICAgICAgc2VyaWVzSW5zdGFuY2VVaWQ6IHNlcmllc0luc3RhbmNlVWlkLFxuICAgICAgICAgICAgICAgIHNlcmllc051bWJlcjogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjAwMDExXSksXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlcmllc01hcFtzZXJpZXNJbnN0YW5jZVVpZF0gPSBzZXJpZXM7XG4gICAgICAgICAgICBzZXJpZXNMaXN0LnB1c2goc2VyaWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNvcEluc3RhbmNlVWlkID0gaW5zdGFuY2VbMHgwMDA4MDAxOF07XG5cbiAgICAgICAgY29uc3QgaW5zdGFuY2VTdW1tYXJ5ID0ge1xuICAgICAgICAgICAgaW1hZ2VUeXBlOiBpbnN0YW5jZVsweDAwMDgwMDA4XSxcbiAgICAgICAgICAgIHNvcENsYXNzVWlkOiBpbnN0YW5jZVsweDAwMDgwMDE2XSxcbiAgICAgICAgICAgIG1vZGFsaXR5OiBpbnN0YW5jZVsweDAwMDgwMDYwXSxcbiAgICAgICAgICAgIHNvcEluc3RhbmNlVWlkOiBzb3BJbnN0YW5jZVVpZCxcbiAgICAgICAgICAgIGluc3RhbmNlTnVtYmVyOiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAyMDAwMTNdKSxcbiAgICAgICAgICAgIGltYWdlUG9zaXRpb25QYXRpZW50OiBpbnN0YW5jZVsweDAwMjAwMDMyXSxcbiAgICAgICAgICAgIGltYWdlT3JpZW50YXRpb25QYXRpZW50OiBpbnN0YW5jZVsweDAwMjAwMDM3XSxcbiAgICAgICAgICAgIGZyYW1lT2ZSZWZlcmVuY2VVSUQ6IGluc3RhbmNlWzB4MDAyMDAwNTJdLFxuICAgICAgICAgICAgc2xpY2VUaGlja25lc3M6IHBhcnNlRmxvYXQoaW5zdGFuY2VbMHgwMDE4MDA1MF0pLFxuICAgICAgICAgICAgc2xpY2VMb2NhdGlvbjogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjAxMDQxXSksXG4gICAgICAgICAgICB0YWJsZVBvc2l0aW9uOiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAxODkzMjddKSxcbiAgICAgICAgICAgIHNhbXBsZXNQZXJQaXhlbDogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjgwMDAyXSksXG4gICAgICAgICAgICBwaG90b21ldHJpY0ludGVycHJldGF0aW9uOiBpbnN0YW5jZVsweDAwMjgwMDA0XSxcbiAgICAgICAgICAgIHBsYW5hckNvbmZpZ3VyYXRpb246IHBhcnNlRmxvYXQoaW5zdGFuY2VbMHgwMDI4MDAwNl0pLFxuICAgICAgICAgICAgcm93czogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjgwMDEwXSksXG4gICAgICAgICAgICBjb2x1bW5zOiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAyODAwMTFdKSxcbiAgICAgICAgICAgIHBpeGVsU3BhY2luZzogaW5zdGFuY2VbMHgwMDI4MDAzMF0sXG4gICAgICAgICAgICBiaXRzQWxsb2NhdGVkOiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAyODAxMDBdKSxcbiAgICAgICAgICAgIGJpdHNTdG9yZWQ6IHBhcnNlRmxvYXQoaW5zdGFuY2VbMHgwMDI4MDEwMV0pLFxuICAgICAgICAgICAgaGlnaEJpdDogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjgwMTAyXSksXG4gICAgICAgICAgICBwaXhlbFJlcHJlc2VudGF0aW9uOiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAyODAxMDNdKSxcbiAgICAgICAgICAgIHdpbmRvd0NlbnRlcjogaW5zdGFuY2VbMHgwMDI4MTA1MF0sXG4gICAgICAgICAgICB3aW5kb3dXaWR0aDogaW5zdGFuY2VbMHgwMDI4MTA1MV0sXG4gICAgICAgICAgICByZXNjYWxlSW50ZXJjZXB0OiBwYXJzZUZsb2F0KGluc3RhbmNlWzB4MDAyODEwNTJdKSxcbiAgICAgICAgICAgIHJlc2NhbGVTbG9wZTogcGFyc2VGbG9hdChpbnN0YW5jZVsweDAwMjgxMDUzXSksXG4gICAgICAgICAgICBzb3VyY2VJbWFnZUluc3RhbmNlVWlkOiBnZXRTb3VyY2VJbWFnZUluc3RhbmNlVWlkKGluc3RhbmNlKSxcbiAgICAgICAgICAgIGxhdGVyYWxpdHk6IGluc3RhbmNlWzB4MDAyMDAwNjJdLFxuICAgICAgICAgICAgdmlld1Bvc2l0aW9uOiBpbnN0YW5jZVsweDAwMTg1MTAxXSxcbiAgICAgICAgICAgIGFjcXVpc2l0aW9uRGF0ZVRpbWU6IGluc3RhbmNlWzB4MDAwODAwMkFdLFxuICAgICAgICAgICAgbnVtYmVyT2ZGcmFtZXM6IHBhcnNlRmxvYXQoaW5zdGFuY2VbMHgwMDI4MDAwOF0pLFxuICAgICAgICAgICAgZnJhbWVJbmNyZW1lbnRQb2ludGVyOiBnZXRWYWx1ZShpbnN0YW5jZVsweDAwMjgwMDA5XSksXG4gICAgICAgICAgICBmcmFtZVRpbWU6IHBhcnNlRmxvYXQoaW5zdGFuY2VbMHgwMDE4MTA2M10pLFxuICAgICAgICAgICAgZnJhbWVUaW1lVmVjdG9yOiBwYXJzZUZsb2F0QXJyYXkoaW5zdGFuY2VbMHgwMDE4MTA2NV0pLFxuICAgICAgICAgICAgbG9zc3lJbWFnZUNvbXByZXNzaW9uOiBpbnN0YW5jZVsweDAwMjgyMTEwXSxcbiAgICAgICAgICAgIGRlcml2YXRpb25EZXNjcmlwdGlvbjogaW5zdGFuY2VbMHgwMDI4MjExMV0sXG4gICAgICAgICAgICBsb3NzeUltYWdlQ29tcHJlc3Npb25SYXRpbzogaW5zdGFuY2VbMHgwMDI4MjExMl0sXG4gICAgICAgICAgICBsb3NzeUltYWdlQ29tcHJlc3Npb25NZXRob2Q6IGluc3RhbmNlWzB4MDAyODIxMTRdLFxuICAgICAgICAgICAgc3BhY2luZ0JldHdlZW5TbGljZXM6IGluc3RhbmNlWzB4MDAxODAwODhdLFxuICAgICAgICAgICAgZWNob051bWJlcjogaW5zdGFuY2VbMHgwMDE4MDA4Nl0sXG4gICAgICAgICAgICBjb250cmFzdEJvbHVzQWdlbnQ6IGluc3RhbmNlWzB4MDAxODAwMTBdXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmV0cmlldmUgdGhlIGFjdHVhbCBkYXRhIG92ZXIgV0FETy1VUklcbiAgICAgICAgY29uc3Qgc2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKTtcbiAgICAgICAgY29uc3Qgd2Fkb3VyaSA9IGAke3NlcnZlci53YWRvVXJpUm9vdH0/cmVxdWVzdFR5cGU9V0FETyZzdHVkeVVJRD0ke3N0dWR5SW5zdGFuY2VVaWR9JnNlcmllc1VJRD0ke3Nlcmllc0luc3RhbmNlVWlkfSZvYmplY3RVSUQ9JHtzb3BJbnN0YW5jZVVpZH0mY29udGVudFR5cGU9YXBwbGljYXRpb24lMkZkaWNvbWA7XG4gICAgICAgIGluc3RhbmNlU3VtbWFyeS53YWRvdXJpID0gV0FET1Byb3h5LmNvbnZlcnRVUkwod2Fkb3VyaSwgc2VydmVyKTtcblxuICAgICAgICBzZXJpZXMuaW5zdGFuY2VzLnB1c2goaW5zdGFuY2VTdW1tYXJ5KTtcbiAgICB9KTtcblxuICAgIHN0dWR5RGF0YS5zdHVkeUluc3RhbmNlVWlkID0gc3R1ZHlJbnN0YW5jZVVpZDtcblxuICAgIHJldHVybiBzdHVkeURhdGE7XG59XG5cbi8qKlxuICogUmV0cmlldmVkIFN0dWR5IE1ldGFEYXRhIGZyb20gYSBESUNPTSBzZXJ2ZXIgdXNpbmcgRElNU0VcbiAqIEBwYXJhbSBzdHVkeUluc3RhbmNlVWlkXG4gKiBAcmV0dXJucyB7e3Nlcmllc0xpc3Q6IEFycmF5LCBwYXRpZW50TmFtZTogKiwgcGF0aWVudElkOiAqLCBhY2Nlc3Npb25OdW1iZXI6ICosIHN0dWR5RGF0ZTogKiwgbW9kYWxpdGllczogKiwgc3R1ZHlEZXNjcmlwdGlvbjogKiwgaW1hZ2VDb3VudDogKiwgc3R1ZHlJbnN0YW5jZVVpZDogKn19XG4gKi9cbk9ISUYuc3R1ZGllcy5zZXJ2aWNlcy5ESU1TRS5SZXRyaWV2ZU1ldGFkYXRhID0gZnVuY3Rpb24oc3R1ZHlJbnN0YW5jZVVpZCkge1xuICAgIC8vIFRPRE86IENoZWNrIHdoaWNoIHBlZXIgaXQgc2hvdWxkIHBvaW50IHRvXG4gICAgY29uc3QgYWN0aXZlU2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKS5wZWVyc1swXTtcbiAgICBjb25zdCBzdXBwb3J0c0luc3RhbmNlUmV0cmlldmFsQnlTdHVkeVVpZCA9IGFjdGl2ZVNlcnZlci5zdXBwb3J0c0luc3RhbmNlUmV0cmlldmFsQnlTdHVkeVVpZDtcbiAgICBsZXQgcmVzdWx0cztcblxuICAgIC8vIENoZWNrIGV4cGxpY2l0bHkgZm9yIGEgdmFsdWUgb2YgZmFsc2UsIHNpbmNlIHRoaXMgcHJvcGVydHlcbiAgICAvLyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgaW4gY29uZmlnIGZpbGVzXG4gICAgaWYgKHN1cHBvcnRzSW5zdGFuY2VSZXRyaWV2YWxCeVN0dWR5VWlkID09PSBmYWxzZSkge1xuICAgICAgICByZXN1bHRzID0gRElNU0UucmV0cmlldmVJbnN0YW5jZXNCeVN0dWR5T25seShzdHVkeUluc3RhbmNlVWlkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRzID0gRElNU0UucmV0cmlldmVJbnN0YW5jZXMoc3R1ZHlJbnN0YW5jZVVpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdERhdGFUb1N0dWR5TWV0YWRhdGEoc3R1ZHlJbnN0YW5jZVVpZCwgcmVzdWx0cyk7XG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBPSElGIH0gZnJvbSAnbWV0ZW9yL29oaWY6Y29yZSc7XG5pbXBvcnQgeyBDdXJyZW50U2VydmVyIH0gZnJvbSAnbWV0ZW9yL29oaWY6c2VydmVycy9ib3RoL2NvbGxlY3Rpb25zJztcbmltcG9ydCBESU1TRSBmcm9tICdkaW1zZSc7XG5cbmNvbnN0IHNldHVwRElNU0UgPSAoKSA9PiB7XG4gICAgLy8gVGVybWluYXRlIGV4aXN0aW5nIERJTVNFIHNlcnZlcnMgYW5kIHNvY2tldHMgYW5kIGNsZWFuIHVwIHRoZSBjb25uZWN0aW9uIG9iamVjdFxuICAgIERJTVNFLmNvbm5lY3Rpb24ucmVzZXQoKTtcblxuICAgIC8vIEdldCB0aGUgbmV3IHNlcnZlciBjb25maWd1cmF0aW9uXG4gICAgY29uc3Qgc2VydmVyID0gT0hJRi5zZXJ2ZXJzLmdldEN1cnJlbnRTZXJ2ZXIoKTtcblxuICAgIC8vIFN0b3AgaGVyZSBpZiB0aGUgbmV3IHNlcnZlciBpcyBub3Qgb2YgRElNU0UgdHlwZVxuICAgIGlmIChzZXJ2ZXIudHlwZSAhPT0gJ2RpbXNlJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgcGVlcnMgd2VyZSBkZWZpbmVkIGluIHRoZSBzZXJ2ZXIgY29uZmlndXJhdGlvbiBhbmQgdGhyb3cgYW4gZXJyb3IgaWYgbm90XG4gICAgY29uc3QgcGVlcnMgPSBzZXJ2ZXIucGVlcnM7XG4gICAgaWYgKCFwZWVycyB8fCAhcGVlcnMubGVuZ3RoKSB7XG4gICAgICAgIE9ISUYubG9nLmVycm9yKCdkaW1zZS1jb25maWc6ICcgKyAnTm8gRElNU0UgUGVlcnMgcHJvdmlkZWQuJyk7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2RpbXNlLWNvbmZpZycsICdObyBESU1TRSBQZWVycyBwcm92aWRlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgYWxsIHRoZSBESU1TRSBwZWVycywgZXN0YWJsaXNoaW5nIHRoZSBjb25uZWN0aW9uc1xuICAgIE9ISUYubG9nLmluZm8oJ0FkZGluZyBESU1TRSBwZWVycycpO1xuICAgIHRyeSB7XG4gICAgICAgIHBlZXJzLmZvckVhY2gocGVlciA9PiBESU1TRS5jb25uZWN0aW9uLmFkZFBlZXIocGVlcikpO1xuICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgT0hJRi5sb2cuZXJyb3IoJ2RpbXNlLWFkZFBlZXJzOiAnICsgZXJyb3IpO1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdkaW1zZS1hZGRQZWVycycsIGVycm9yKTtcbiAgICB9XG59O1xuXG4vLyBTZXR1cCB0aGUgRElNU0UgY29ubmVjdGlvbnMgb24gc3RhcnR1cCBvciB3aGVuIHRoZSBjdXJyZW50IHNlcnZlciBpcyBjaGFuZ2VkXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgQ3VycmVudFNlcnZlci5maW5kKCkub2JzZXJ2ZSh7XG4gICAgICAgIGFkZGVkOiBzZXR1cERJTVNFLFxuICAgICAgICBjaGFuZ2VkOiBzZXR1cERJTVNFXG4gICAgfSk7XG59KTtcbiIsImltcG9ydCB7IG1vbWVudCB9IGZyb20gJ21ldGVvci9tb21lbnRqczptb21lbnQnO1xuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuaW1wb3J0IERJTVNFIGZyb20gJ2RpbXNlJztcblxuLyoqXG4gKiBQYXJzZXMgcmVzdWx0aW5nIGRhdGEgZnJvbSBhIFFJRE8gY2FsbCBpbnRvIGEgc2V0IG9mIFN0dWR5IE1ldGFEYXRhXG4gKlxuICogQHBhcmFtIHJlc3VsdERhdGFcbiAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2YgU3R1ZHkgTWV0YURhdGEgb2JqZWN0c1xuICovXG5mdW5jdGlvbiByZXN1bHREYXRhVG9TdHVkaWVzKHJlc3VsdERhdGEpIHtcbiAgICBjb25zdCBzdHVkaWVzID0gW107XG5cbiAgICByZXN1bHREYXRhLmZvckVhY2goZnVuY3Rpb24oc3R1ZHlSYXcpIHtcbiAgICAgICAgY29uc3Qgc3R1ZHkgPSBzdHVkeVJhdy50b09iamVjdCgpO1xuICAgICAgICBzdHVkaWVzLnB1c2goe1xuICAgICAgICAgICAgc3R1ZHlJbnN0YW5jZVVpZDogc3R1ZHlbMHgwMDIwMDAwRF0sXG4gICAgICAgICAgICAvLyAwMDA4MDAwNSA9IFNwZWNpZmljQ2hhcmFjdGVyU2V0XG4gICAgICAgICAgICBzdHVkeURhdGU6IHN0dWR5WzB4MDAwODAwMjBdLFxuICAgICAgICAgICAgc3R1ZHlUaW1lOiBzdHVkeVsweDAwMDgwMDMwXSxcbiAgICAgICAgICAgIGFjY2Vzc2lvbk51bWJlcjogc3R1ZHlbMHgwMDA4MDA1MF0sXG4gICAgICAgICAgICByZWZlcnJpbmdQaHlzaWNpYW5OYW1lOiBzdHVkeVsweDAwMDgwMDkwXSxcbiAgICAgICAgICAgIC8vIDAwMDgxMTkwID0gVVJMXG4gICAgICAgICAgICBwYXRpZW50TmFtZTogc3R1ZHlbMHgwMDEwMDAxMF0sXG4gICAgICAgICAgICBwYXRpZW50SWQ6IHN0dWR5WzB4MDAxMDAwMjBdLFxuICAgICAgICAgICAgcGF0aWVudEJpcnRoZGF0ZTogc3R1ZHlbMHgwMDEwMDAzMF0sXG4gICAgICAgICAgICBwYXRpZW50U2V4OiBzdHVkeVsweDAwMTAwMDQwXSxcbiAgICAgICAgICAgIGltYWdlQ291bnQ6IHN0dWR5WzB4MDAyMDEyMDhdLFxuICAgICAgICAgICAgc3R1ZHlJZDogc3R1ZHlbMHgwMDIwMDAxMF0sXG4gICAgICAgICAgICBzdHVkeURlc2NyaXB0aW9uOiBzdHVkeVsweDAwMDgxMDMwXSxcbiAgICAgICAgICAgIG1vZGFsaXRpZXM6IHN0dWR5WzB4MDAwODAwNjFdXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBzdHVkaWVzO1xufVxuXG5PSElGLnN0dWRpZXMuc2VydmljZXMuRElNU0UuU3R1ZGllcyA9IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgIE9ISUYubG9nLmluZm8oJ1NlcnZpY2VzLkRJTVNFLlN0dWRpZXMnKTtcblxuICAgIGxldCBmaWx0ZXJTdHVkeURhdGUgPSAnJztcbiAgICBpZiAoZmlsdGVyLnN0dWR5RGF0ZUZyb20gJiYgZmlsdGVyLnN0dWR5RGF0ZVRvKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnREYXRlID0gZGF0ZSA9PiBtb21lbnQoZGF0ZSwgJ01NL0REL1lZWVknKS5mb3JtYXQoJ1lZWVlNTUREJyk7XG4gICAgICAgIGNvbnN0IGRhdGVGcm9tID0gY29udmVydERhdGUoZmlsdGVyLnN0dWR5RGF0ZUZyb20pO1xuICAgICAgICBjb25zdCBkYXRlVG8gPSBjb252ZXJ0RGF0ZShmaWx0ZXIuc3R1ZHlEYXRlVG8pO1xuICAgICAgICBmaWx0ZXJTdHVkeURhdGUgPSBgJHtkYXRlRnJvbX0tJHtkYXRlVG99YDtcbiAgICB9XG5cbiAgICAvLyBCdWlsZCB0aGUgU3R1ZHlJbnN0YW5jZVVJRCBwYXJhbWV0ZXJcbiAgICBsZXQgc3R1ZHlVaWRzID0gZmlsdGVyLnN0dWR5SW5zdGFuY2VVaWQgfHwgJyc7XG4gICAgaWYgKHN0dWR5VWlkcykge1xuICAgICAgICBzdHVkeVVpZHMgPSBBcnJheS5pc0FycmF5KHN0dWR5VWlkcykgPyBzdHVkeVVpZHMuam9pbigpIDogc3R1ZHlVaWRzO1xuICAgICAgICBzdHVkeVVpZHMgPSBzdHVkeVVpZHMucmVwbGFjZSgvW14wLTkuXSsvZywgJ1xcXFwnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbWV0ZXJzID0ge1xuICAgICAgICAweDAwMjAwMDBEOiBzdHVkeVVpZHMsXG4gICAgICAgIDB4MDAxMDAwMTA6IGZpbHRlci5wYXRpZW50TmFtZSxcbiAgICAgICAgMHgwMDEwMDAyMDogZmlsdGVyLnBhdGllbnRJZCxcbiAgICAgICAgMHgwMDA4MDA1MDogZmlsdGVyLmFjY2Vzc2lvbk51bWJlcixcbiAgICAgICAgMHgwMDA4MDAyMDogZmlsdGVyU3R1ZHlEYXRlLFxuICAgICAgICAweDAwMDgxMDMwOiBmaWx0ZXIuc3R1ZHlEZXNjcmlwdGlvbixcbiAgICAgICAgMHgwMDEwMDA0MDogJycsXG4gICAgICAgIDB4MDAyMDEyMDg6ICcnLFxuICAgICAgICAweDAwMDgwMDYxOiBmaWx0ZXIubW9kYWxpdGllc0luU3R1ZHlcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IERJTVNFLnJldHJpZXZlU3R1ZGllcyhwYXJhbWV0ZXJzKTtcbiAgICByZXR1cm4gcmVzdWx0RGF0YVRvU3R1ZGllcyhyZXN1bHRzKTtcbn07XG4iXX0=
