import { RoiImporter } from "./RoiImporter.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { sessionMap } from "meteor/icr:series-info-provider";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import progressDialog from "../util/progressDialog.js";

/**
 * @abstract @class AsyncFetcher
 * @author JamesAPetts
 *
 * Asynchronusly fetches roiCollections that contain contours, allows the user to select which to
 * import, and parses them using an instance of RoiImporter.
 *
 */
export class AsyncFetcher {
  constructor(seriesInstanceUid, validTypes) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._experimentId = sessionMap.get(
      this._seriesInstanceUid,
      "experimentId"
    );
    this._numCollectionsParsed = 0;
    this._roiCollectionLabel = "";
    this._validTypes = validTypes;
  }

  /**
   * _openImportListDialog - Opens the import list dialog.
   * @private @abstract
   */
  _openImportListDialog() {
    throw new Error("Must implement abstract method _openImportListDialog");
  }

  /**
   * async _selectAndImportRois - Calls UI to allow user input for imports.
   * @private @abstract
   */
  async _selectAndImportRois() {
    throw new Error("Must implement abstract method _selectAndImportRois");
  }

  /**
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   * @private @abstract
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @return {Boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    throw new Error(
      "Must implement abstract method _collectionEligibleForImport"
    );
  }

  /** @private @abstract @async
   * _getAndImportFile - Imports the file from the REST url and loads it into
   *                     cornerstoneTools toolData.
   *
   * @param  {type} url             The REST URL of the file.
   * @param  {type} collectionInfo  An object describing the roiCollection to
   *                                import.
   */
  async _getAndImportFile(url, collectionInfo) {
    throw new Error(
      "Must implement abstract method _collectionEligibleForImport"
    );
  }

  /** @private @async
   * _addCollectionToListIfCanImport - Fetches the requested collectionInfo,
   * and adds it to the _collectionInfoArray if the collection references the
   * active series and has not already been imported.
   *
   * @param  {String} getCollectionUrl The REST URL to GET the collectionInfo.
   * @param  {type} roiCollectionId  The ID of the roiCollection.
   */
  async _addCollectionToListIfCanImport(getCollectionUrl, roiCollectionId) {
    console.log(`_addCollectionToListIfCanImport ${getCollectionUrl}`);
    const collectionInfoJSON = await this._getJson(getCollectionUrl)
      .then(collectionInfoJSON => {
        if (this._collectionEligibleForImport(collectionInfoJSON)) {
          const collectionInfo = this._getCollectionInfo(
            roiCollectionId,
            collectionInfoJSON
          );

          this._collectionInfoArray.push(collectionInfo);
        }

        this._roiCollectionsToCheck--;

        if (this._roiCollectionsToCheck === 0) {
          this._selectAndImportRois();
        }
      })
      .catch(error => {
        console.log(error);
        this._roiCollectionsToCheck--;

        if (this._roiCollectionsToCheck === 0) {
          this._selectAndImportRois();
        }
      });
  }

  /** @public @async
   * fetchMasks - Asynchronusly fetch and process ROI Collections.
   */
  async fetch() {
    this._openImportListDialog();

    // Fetch list of assessors for the session.
    const sessionAssessorsUrl = `${Session.get(
      "rootUrl"
    )}/data/archive/projects/${icrXnatRoiSession.get(
      "projectId"
    )}/subjects/${icrXnatRoiSession.get("subjectId")}/experiments/${
      this._experimentId
    }/assessors?format=json`;
    const sessionAssessorList = await this._getJson(sessionAssessorsUrl).catch(
      error => console.log(error)
    );

    // Filter roiCollections from assessor list.
    const assessorList = sessionAssessorList.ResultSet.Result;
    const roiCollectionList = this._filterRoiCollections(assessorList);

    console.log(`roiCollectionList:`);
    console.log(roiCollectionList);

    // Initialise an array of collectionInfo to build up the list.
    this._collectionInfoArray = [];
    this._roiCollectionsToCheck = roiCollectionList.length;

    // If no ROICollections at all, load list dialog immediately.
    if (this._roiCollectionsToCheck === 0) {
      this._selectAndImportRois();
    }

    // Get each roicollection
    for (let i = 0; i < roiCollectionList.length; i++) {
      const roiCollectionId = roiCollectionList[i].ID;
      const getCollectionUrl = `${Session.get(
        "rootUrl"
      )}/data/archive/experiments/${
        this._experimentId
      }/assessors/${roiCollectionId}?format=json`;

      this._addCollectionToListIfCanImport(getCollectionUrl, roiCollectionId);
    }
  }

  /** @private
   * _openProgressDialog - Opens the progress dialog.
   *
   */
  _openProgressDialog() {
    this._updateProgressDialog();
    progressDialog.show();
  }

  /**
   * _isValidCollectionType - Returns true if the collection is a contour type.
   *
   * @param  {type} collectionType description
   * @return {type}                description
   */
  _isValidCollectionType(collectionType) {
    return this._validTypes.some(type => type === collectionType);
  }

  /**
   * _getCollectionInfo - Constructs a collectionInfo object from the supplied
   *                      collectionInfoJSON.
   * @private
   *
   * @param  {Object} collectionInfoJSON  The POJO created from the JSON
   *                                      retrieved via REST.
   * @return {Object}                     The collectionInfo.
   */
  _getCollectionInfo(roiCollectionId, collectionInfoJSON) {
    const data_fields = collectionInfoJSON.items[0].data_fields;

    return {
      collectionType: data_fields.collectionType,
      label: data_fields.label,
      name: data_fields.name,
      getFilesUrl: `${Session.get("rootUrl")}/data/archive/experiments/${
        this._experimentId
      }/assessors/${roiCollectionId}/files?format=json`
    };
  }

  /**
   * _getFilesFromList - Fetches the data referenced by the collectionInfo.
   * @private @async
   *
   * @param  {type} collectionInfo  An object describing the roiCollection to
   *                                import.
   */
  async _getFilesFromList(collectionInfo) {
    const getFilesUrl = collectionInfo.getFilesUrl;
    const roiList = await this._getJson(getFilesUrl).catch(error =>
      console.log(error)
    );

    const result = roiList.ResultSet.Result;

    // Reduce count if no associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      this._incrementNumCollectionsParsed();
    }

    // Retrieve each ROI from the list that has the same collectionType as the collection.
    // In an ideal world this should always be 1, and any other resources -- if any -- are differently formated representations of the same data, but things happen.
    for (let i = 0; i < result.length; i++) {
      const fileType = result[i].collection;
      if (fileType === collectionInfo.collectionType) {
        const fileUrl = `${Session.get("rootUrl")}${result[i].URI}`;
        this._getAndImportFile(fileUrl, collectionInfo);
      }
    }
  }

  /** @private
   * _incrementNumCollectionsParsed - Increases the number of collections
   * parsed, and closes the progress dialog if the collections have all been
   * imported.
   *
   * @return {type}  description
   */
  _incrementNumCollectionsParsed() {
    this._numCollectionsParsed++;
    this._updateProgressDialog();

    if (this._numCollectionsParsed === this._numCollectionsToParse) {
      progressDialog.close();
    }
  }

  /** @private
   * _filterRoiCollections - Filters out roiCollections from an assessor list
   * and set the number of roiCollections that need to be parsed.
   *
   * @param  {Array} assessors The assessor list that needs to be filtered.
   * @return {Array}           The filtered list containing only roiCollections.
   */
  _filterRoiCollections(assessors) {
    const roiCollections = [];

    // Get each roicollection
    for (let i = 0; i < assessors.length; i++) {
      if (assessors[i].xsiType === "icr:roiCollectionData") {
        roiCollections.push(assessors[i]);
      }
    }

    this._numCollectionsToParse = roiCollections.length;

    return roiCollections;
  }

  /** @private
   * _getJson - GETs JSON from a REST URL.
   *
   * @param  {String}   url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getJson(url) {
    return this._GET_file(url, "json");
  }

  /** @private
   * _getXml - GETs XML from a REST URL.
   *
   * @param  {String} url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getXml(url) {
    return this._GET_file(url, "xml");
  }

  /** @private
   * _getArraybuffer - GETs and arraybuffer from a REST URL.
   *
   * @param  {type} url The REST URL to request data from.
   * @return {Promise}  A promise that will resolve to the requested file.
   */
  _getArraybuffer(url) {
    return this._GET_file(url, "arraybuffer");
  }

  /** @private
   * _GET_file - GETs a file of the requested filetype from a REST URL.
   *
   * @param  {String} url      The REST URL to request data from.
   * @param  {String} fileType The requested filetype of the data.
   * @return {Promise}         A promise that will resolve to the requested file.
   */
  _GET_file(url, fileType) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(xhr.response);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("GET", url);
      this._setXhrHeaders(xhr, fileType);
      xhr.send();
    });
  }

  /** @private
   * _setXhrHeaders - Sets the headers of the XMLHttpRequest based on the
   * fileType supplied.
   *
   * @param  {XMLHttpRequest} xhr       The rest client.
   * @param  {String}         fileType  The filetype being requested.
   */
  _setXhrHeaders(xhr, fileType) {
    switch (fileType) {
      case "json":
        xhr.responseType = "json";
        break;
      case "xml":
        xhr.responseType = "document";
        break;
      case "arraybuffer":
        xhr.responseType = "arraybuffer";
        break;
      case null:
        break;
      default:
        console.log(
          `XNATRESTInterface.GET_file not configured for filetype: ${fileType}.`
        );
    }
  }

  /** @private
   * _updateProgressDialog - Updates the progress dialog.
   *
   */
  _updateProgressDialog() {
    progressDialog.update({
      notificationText: `Importing ROI Collection: ${
        this._roiCollectionLabel
      }. This may take a while...`,
      progressText: `${this._numCollectionsParsed}/${
        this._numCollectionsToParse
      } <i class="fa fa-spin fa-circle-o-notch fa-fw">`
    });
  }
}
