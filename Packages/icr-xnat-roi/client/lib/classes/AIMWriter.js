import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import XMLWriter from 'xml-writer';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

// Class which extends the XMLWriter with some abstracted AIM specific functionality.
export class AIMWriter extends XMLWriter {

  constructor (name, label, dateTime) {
    super(true); // The argument 'true' just formats the XML with indentation such that it is human readable.
    this._name = name;
    this._label = label;
    this._shapeIdentifier = 0;
    this._imageAnnotationNumber = 0;
    this._imageAnnotationCollectionUUID = this._generateUUID();
    this._dateTime = dateTime;
    this._freehand3DStore = modules.freehand3D;
  }

  writeImageAnnotationCollection (volumes, seriesInfo) {
    console.log(`volumes`);
    console.log(volumes);

    console.log('seriesInfo');
    console.log(seriesInfo);

    this._seriesInfo = seriesInfo;
    this._referencedSopInstanceUids = [];
    this._startImageAnnotationCollection();
      this._addImageAnnotations(volumes);
    this._endImageAnnotationCollection();
  }

  _startImageAnnotationCollection () {
    this.startDocument('1.0', 'UTF-8', false);
    this.startElement('ImageAnnotationCollection')
      .writeAttribute('xmlns','gme://caCORE.caCORE/4.4/edu.northwestern.radiology.AIM')
      .writeAttribute('xmlns:rdf','http://www.w3.org/1999/02/22-rdf-syntax-ns#')
      .writeAttribute('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance')
      .writeAttribute('aimVersion','AIMv4_0')
      .writeAttribute('xsi:schemaLocation', 'gme://caCORE.caCORE/4.4/edu.northwestern.radiology.AIM AIM_v4_rv44_XML.xsd');
    this._addProperty('uniqueIdentifier', 'root', this._imageAnnotationCollectionUUID);
    this._addDateTime();
    this._addProperty('description', 'value', this._name);
    this._addUser();
    this._addEquipment();
    this._addPerson();
    this.startElement('imageAnnotations');
  };

  _endImageAnnotationCollection () {
    this.endElement('imageAnnotations');
    this.endElement('ImageAnnotationCollection');
  };

  _addUser () {
    const username = window.top.username;

    this.startElement('user');
      this._addProperty('name', 'value', username);
      this._addProperty('loginName', 'value', username);
      this._addProperty('roleInTrial');
    this.endElement();
  }

  _addEquipment () {
    this.startElement('equipment');
      this._addProperty('manufacturerName', 'value', this._seriesInfo.equipment.manufacturerName);
      this._addProperty('manufacturerModelName', 'value', this._seriesInfo.equipment.manufacturerModelName);
      this._addProperty('softwareVersion', 'value', this._seriesInfo.equipment.softwareVersion);
    this.endElement();
  }

  _addPerson () {
    this.startElement('person');
      this._addProperty('name', 'value', this._seriesInfo.person.name);
      this._addProperty('id', 'value', this._seriesInfo.person.id);
      this._addProperty('birthDate', 'value', this._seriesInfo.person.birthDate);
      this._addProperty('sex', 'value', this._seriesInfo.person.sex);
      this._addProperty('ethnicGroup', 'value', this._seriesInfo.person.ethnicGroup);
    this.endElement();
  }

  _addImageAnnotations (volumes) {
    for (let i = 0; i < volumes.length; i++) {
      if (volumes[i] && volumes[i].length > 0) {
        this._addImageAnnotation(volumes[i], i);
      }
    }
  }

  _addImageAnnotation (polygons, i) {
    console.log(`imageAnnotation: ${i}`);

    this._referencedSopInstanceUids = [];

    this._startImageAnnotation(polygons, i);
      this._addMarkupEntityCollection(polygons, i);
      this._addImageReferenceEntityCollection();
    this._endImageAnnotation();
  }

  _startImageAnnotation (polygons, ROIContourIndex) {
    this.startElement('ImageAnnotation');
    this._imageAnnotationUniqueIdentifier(ROIContourIndex);
    this._addMultiProperty('typeCode', [
      { name: 'code', value: 'AnyClosedShape' },
      { name: 'codeSystem', value: ' ' },
      { name: 'codeSystemName', value: ' ' },
      { name: 'codeSystemVersion', value: ' ' }
    ]);
    this._addDateTime();
    const imageAnnotationName = this._imageAnnotationName(ROIContourIndex);
    this._addProperty('name', 'value', imageAnnotationName);

  }

  _endImageAnnotation () {
    this.endElement('ImageAnnotation');
  }

  _addMarkupEntityCollection (polygons) {
    this.startElement('markupEntityCollection');
      for (let i = 0; i < polygons.length; i++) {
        this._addMarkupEntity(polygons[i]);
      }
    this.endElement();
  }

  _addMarkupEntity (polygon) {
    this.startElement('MarkupEntity').writeAttribute('xsi:type','TwoDimensionPolyline');
      this._addProperty('uniqueIdentifier', 'root', `${polygon.uid}`);
      this._addProperty('shapeIdentifier', 'value',`${this._shapeIdentifier}`);
      this._addProperty('includeFlag', 'value', 'true'); //Note: no support for lesions with holes (.e.g. donuts) for now.
      this._addProperty('imageReferenceUid', 'root', polygon.sopInstanceUid);
      this._addProperty('referencedFrameNumber', 'value', polygon.frameNumber);
      this._twoDimensionSpatialCoordinateCollection(polygon.polyHandles, polygon.sopInstanceUid);
    this.endElement();

    this._shapeIdentifier++;
    this._addReferencedImage(polygon.sopInstanceUid);
  }

  _addReferencedImage (sopInstanceUid) {
    if (this._referencedSopInstanceUids.includes(sopInstanceUid)) {
      return;
    }
    this._referencedSopInstanceUids.push(sopInstanceUid);

    return;
  }

  _addImageReferenceEntityCollection () {
    this.startElement('imageReferenceEntityCollection');
    this.startElement('ImageReferenceEntity').writeAttribute('xsi:type', 'DicomImageReferenceEntity');
    this._addProperty('uniqueIdentifier', 'root', `${this._generateUUID()}`);
    this._addImageStudy();
    this.endElement('ImageReferenceEntity');
    this.endElement('imageReferenceEntityCollection');
  }

  _addImageStudy () {
    this.startElement('imageStudy');
    this._addProperty('instanceUid', 'root', this._seriesInfo.studyInstanceUid);
    this._addProperty('startDate', 'value', this._seriesInfo.startDate);
    this._addProperty('startTime', 'value', this._seriesInfo.startTime);
    this._addImageSeries();
    this.endElement()
  }

  _addImageSeries () {
    this.startElement('imageSeries');
    this._addProperty('instanceUid', 'root', this._seriesInfo.seriesInstanceUid);
    this._addMultiProperty('modality', [
      { name: 'code', value: this._seriesInfo.modality },
      { name: 'codeSystem', value: '1.2.840.10008.2.16.4' },
      { name: 'codeSystemName', value: 'DCM' },
      { name: 'codeSystemVersion', value: '01' }
    ]);
    this._addImageCollection();
    this.endElement('imageSeries');
  }

  _addImageCollection () {
    this.startElement('imageCollection');
    for (let i = 0; i < this._referencedSopInstanceUids.length; i++) {
      this._addImage(this._seriesInfo.sopClassUid, this._referencedSopInstanceUids[i]);
    };
    this.endElement('');
  }

  _addImage (sopClassUid, sopInstanceUid) {
    this.startElement('Image');
    this._addProperty('sopClassUid', 'root', sopClassUid);
    this._addProperty('sopInstanceUid', 'root', sopInstanceUid);
    this.endElement();
  }

  _addDateTime () {
    this._addProperty('dateTime', 'value', this._dateTime);
  }

  _imageAnnotationUniqueIdentifier (ROIContourIndex) {
    //saves the unique identifier of the annotation for later use in child MarkupEntitys
    console.log(`ROIContourIndex: ${ROIContourIndex}`);
    const seriesInstanceUid = this._seriesInfo.seriesInstanceUid;
    const structureSet = this._freehand3DStore.getters.structureSet(seriesInstanceUid);
    const ROIContourUid = structureSet.ROIContourCollection[ROIContourIndex].uid;

    console.log(`uuidString: ${ROIContourUid}`);
    this._addProperty('uniqueIdentifier', 'root', ROIContourUid);
  };

  _imageAnnotationName (ROIContourIndex) {
    const seriesInstanceUid = this._seriesInfo.seriesInstanceUid;
    const structureSet = this._freehand3DStore.getters.structureSet(seriesInstanceUid);
    const name = structureSet.ROIContourCollection[ROIContourIndex].name;

    console.log(`name: ${name}`);

    return name;
  }

  _twoDimensionSpatialCoordinateCollection (polyHandles, sopInstanceUid) {
    this.startElement('twoDimensionSpatialCoordinateCollection');
    for (let i = 0; i < polyHandles.length; i++) {
      this._twoDimensionSpatialCoordinate(polyHandles[i], i);
    };
    // For a closed polygon the AIM 4.0 specification requires that the first
    // Coordinate appear again at the end:
    this._twoDimensionSpatialCoordinate(polyHandles[0], 0);
    this.endElement();
  };

  _twoDimensionSpatialCoordinate (point, i) {
    this.startElement('TwoDimensionSpatialCoordinate');
    this._addProperty('coordinateIndex', 'value',`${i}`);
    this._addProperty('x', 'value', `${point.x}`);
    this._addProperty('y', 'value', `${point.y}`);
    this.endElement();
  };

  _addProperty (elementName, attributeName, attributeValue) {
    this.startElement(elementName).writeAttribute(attributeName, attributeValue).endElement();
  }

  _addMultiProperty (elementName, attributes) {
    this.startElement(elementName);
    for (let i = 0; i < attributes.length; i++) {
      this.writeAttribute(attributes[i].name, attributes[i].value);
    }
    this.endElement();
  }

  _generateUUID () { // https://stackoverflow.com/a/8809472/9208320 Public Domain/MIT
    let d = new Date().getTime();

    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      d += performance.now(); // Use high-precision timer if available
    }

    return 'x.x.x.x.x.x.xxxx.xxx.x.x.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;

      d = Math.floor(d / 16);

      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  static generateDateTime () {
    const d = new Date();
    const dateTime = {
      year: d.getFullYear().toString(),
      month: ( d.getMonth() + 1 ).toString(),
      date: d.getDate().toString(),
      hours: d.getHours().toString(),
      minutes: d.getMinutes().toString(),
      seconds: d.getSeconds().toString()
    };

    // Pad with zeros e.g. March: 3 => 03
    Object.keys(dateTime).forEach(element => {
      if (dateTime[`${element}`].length < 2) {
        dateTime[`${element}`] = '0' + dateTime[`${element}`];
      };
    });

    dateTimeFormated = dateTime.year + dateTime.month + dateTime.date
      + dateTime.hours + dateTime.minutes + dateTime.seconds;

    return dateTimeFormated;
  }

  static generateLabel (dateTime) {
    return `AIM_${dateTime.slice(0,8)}_${dateTime.slice(8,14)}`;
  }

  get seriesInfo () {
    return this._seriesInfo;
  }

  get imageAnnotationCollectionUUID () {
    return this._imageAnnotationCollectionUUID;
  }

  get date () {
    const dateTime = this._dateTime;
    const formatedDate = `${dateTime.slice(0,4)}-${dateTime.slice(4,6)}-${dateTime.slice(6,8)}`;

    return formatedDate;
  }

  get time () {
    const dateTime = this._dateTime;
    const formatedTime = `${dateTime.slice(8,10)}:${dateTime.slice(10,12)}:${dateTime.slice(12,14)}`;

    return formatedTime;
  }

  get label () {
    return this._label;
  }

  get name () {
    return this._name;
  }

}
