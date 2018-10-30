import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { Polygon } from './Polygon.js';

const modules = cornerstoneTools.store.modules;

//Parses aim files and extracts individual ROIs
export class AIMReader {

  constructor (xmlDocument, seriesInstanceUidToImport, roiCollectionName, roiCollectionLabel) {

    this._doc = xmlDocument;

    try {
      this._checkXML();
    } catch (err) {
      console.log(err.message);
    }

    this._freehand3DStore = modules.freehand3D;

    this._seriesInstanceUidToImport = seriesInstanceUidToImport;
    this._polygons = [];
    this._sopInstancesInSeries = this._getSopInstancesInSeries();
    this._roiCollectionName = roiCollectionName;
    this._roiCollectionLabel = roiCollectionLabel;
    this._extractAnnotations();
    console.log(this._polygons);
  }

  _checkXML () {
    if ( !(this._doc instanceof Document) ) {
      throw 'Input is not of type Document!';
    }

    if ( !this._checkIfAIMv4_0() ) {
      throw 'Input is not an AIMv4_0 ImageAnnotationCollection file!';
    }
  }

  _checkIfAIMv4_0 () {
    const imageAnnotationCollections = this._doc.getElementsByTagName('ImageAnnotationCollection');
    if ( imageAnnotationCollections.length === 0 ) {

      return false;
    }
    const aimVersion = imageAnnotationCollections[0].getAttribute('aimVersion');
    if ( aimVersion !== 'AIMv4_0' ) {

      return false;
    }

    return true;
  }

  _getSopInstancesInSeries () {
    let sopInstancesInSeries = [];
    const imageSeriesList = this._doc.getElementsByTagName('imageSeries');

    if ( imageSeriesList.length === 0 ) {
      throw 'No image series information in AIM file!';
    }

    for ( let i = 0; i < imageSeriesList.length; i++ ) {
      const seriesInstanceUid = this._getSeriesInstanceUid(imageSeriesList[i]);
      console.log(`imageSeries: ${i}, seriesInstanceUid: ${seriesInstanceUid}`);
      if ( seriesInstanceUid === this._seriesInstanceUidToImport ) {
        this._appendSopInstances(sopInstancesInSeries,imageSeriesList[i]);
      }
    }

    return sopInstancesInSeries;
  }

  _getSeriesInstanceUid(imageSeries) {
    const seriesInstanceUidElement = imageSeries.getElementsByTagName('instanceUid')[0];
    const seriesInstanceUid = seriesInstanceUidElement.getAttribute('root');

    return seriesInstanceUid
  }

  _appendSopInstances(sopInstancesInSeries, imageSeries) {
    sopInstanceUidElements = imageSeries.getElementsByTagName('sopInstanceUid');
    for (let i = 0; i < sopInstanceUidElements.length; i++ ) {
      const sopInstanceUid = sopInstanceUidElements[i].getAttribute('root');
      if (!sopInstancesInSeries.includes(sopInstanceUid)) {
        sopInstancesInSeries.push(sopInstanceUid);
      }
    }
  }

  _extractAnnotations () {
    const annotations = this._doc.getElementsByTagName('ImageAnnotation');

    for ( let i = 0; i < annotations.length; i++ ) {
      this._extractPolygons(annotations[i]);
    }
  }

  _extractPolygons (annotation) {
    const children = annotation.children;
    const ROIContourUid = this._createNewVolumeAndGetUid(children);
    const markupEntitys = annotation.getElementsByTagName('MarkupEntity');

    console.log(`Number of Polygons in annotation: ${markupEntitys.length}`);
    for ( let i = 0; i < markupEntitys.length; i++ ) {
      this._addMarkupEntityIfPolygon(markupEntitys[i], ROIContourUid);
    }
  }

  _addMarkupEntityIfPolygon (markupEntity, ROIContourUid) {
    if ( markupEntity.getAttribute('xsi:type') === 'TwoDimensionPolyline' ) {
      this._addPolygon(markupEntity, ROIContourUid);
    }
  }

  _addPolygon (markupEntity, ROIContourUid) {
    const sopInstanceUid = markupEntity.getElementsByTagName('imageReferenceUid')[0].getAttribute('root');

    // Don't extract polygon if it doesn't belong to the series being imported
    if (!this._sopInstancesInSeries.includes(sopInstanceUid)) {
      console.log('referencedSopInstance not in active series');
      return;
    }

    const polygonUid = markupEntity.getElementsByTagName('uniqueIdentifier')[0].getAttribute('root');
    const referencedFrameNumber = markupEntity.getElementsByTagName('referencedFrameNumber')[0].getAttribute('value');
    const twoDimensionSpatialCoordinateCollection = markupEntity.getElementsByTagName('twoDimensionSpatialCoordinateCollection')[0].children;

    const handles = [];

    // NOTE: itterate up to length - 1, as first and last points are the same for closed polygons.
    for ( let i = 0; i < twoDimensionSpatialCoordinateCollection.length - 1; i++ ) {
      handles.push({
        x: Number(twoDimensionSpatialCoordinateCollection[i].getElementsByTagName('x')[0].getAttribute('value')),
        y: Number(twoDimensionSpatialCoordinateCollection[i].getElementsByTagName('y')[0].getAttribute('value'))
      });
    }

    const polygon = new Polygon(
      handles,
      sopInstanceUid,
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      ROIContourUid,
      polygonUid,
      referencedFrameNumber
    );
    this._polygons.push(polygon);
  }

  _createNewVolumeAndGetUid(element) {
    const freehand3DStore = this._freehand3DStore;
    let name;
    let uid;
    let comment;

    for (let i = 0; i < element.length; i++) {
      if (element[i].tagName === 'uniqueIdentifier') {
        uid = element[i].getAttribute('root');
      } else if (element[i].tagName === 'name') {
        name = element[i].getAttribute('value');
      } else if (element[i].tagName === 'comment') {
        comment = element[i].getAttribute('value');
      }
    }

    if (!uid) {
      throw Error('Invalid AIM, no imageAnnotation uniqueIdentifier found!');
    }
    if (!name) {
      if (comment) {
        name = comment;
      } else {
        console.log('No name or comment for imageAnnotation, using default name \"Untitled Lession\"');
        name = 'Untitled Lession'
      }
    }

    const structureSet = freehand3DStore.getters.structureSet(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel
    );

    if (!structureSet) {
      freehand3DStore.setters.structureSet(
        this._seriesInstanceUidToImport,
        this._roiCollectionName,
        {
          isLocked: true,
          visible: true,
          uid: this._roiCollectionLabel
        }
      );
    }

    const ROIContourUid = freehand3DStore.setters.ROIContour(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      name,
      {
        uid
      }
    );

    return ROIContourUid;
  }

  _isIncluded(includeElement) {
    if (includeElement.getAttribute('root') === 'true') {
      return true;
    }

    throw 'Holes (i.e. includeFlag === false) are currently unsupported!';
    return false;
  }

  get polygons() {
    return this._polygons;
  }

}
