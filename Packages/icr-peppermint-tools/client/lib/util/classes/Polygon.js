import { cornerstoneTools } from "meteor/ohif:cornerstone";

const modules = cornerstoneTools.store.modules;

export class Polygon {
  constructor(
    handles,
    sopInstanceUid,
    seriesInstanceUid,
    structureSetUid,
    ROIContourUid,
    polygonUid,
    frameNumber,
    interpolated
  ) {
    this._polyHandles = this._deepCopyHandles(handles);
    this._sopInstanceUid = sopInstanceUid;
    this._seriesInstanceUid = seriesInstanceUid;
    this._structureSetUid = structureSetUid;
    this._ROIContourUid = ROIContourUid;
    this._polygonUid = polygonUid;
    this._frameNumber = frameNumber;
    this._interpolated = interpolated;
  }

  _deepCopyHandles(handles) {
    // Creates a deep copy of the handles object
    const polyHandles = [];
    const isZ = handles[0].z !== undefined;

    for (let i = 0; i < handles.length; i++) {
      polyHandles.push({
        x: handles[i].x,
        y: handles[i].y
      });

      if (isZ) {
        polyHandles[i].z = handles[i].z;
      }
    }

    return polyHandles;
  }

  getFreehandToolData(importType) {
    const seriesInstanceUid = this._seriesInstanceUid;
    const structureSetUid = this._structureSetUid;
    const ROIContourUid = this._ROIContourUid;

    const freehand3DStore = modules.freehand3D;

    const referencedROIContour = freehand3DStore.getters.ROIContour(
      seriesInstanceUid,
      structureSetUid,
      ROIContourUid
    );
    const referencedStructureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid,
      structureSetUid
    );

    const data = {
      uid: this._polygonUid,
      seriesInstanceUid,
      structureSetUid,
      ROIContourUid,
      referencedROIContour,
      referencedStructureSet,
      visible: true,
      active: false,
      invalidated: true,
      handles: []
    };

    if (this._sopInstanceUid) {
      data.sopInstanceUID = this._sopInstanceUid;
    }

    if (this._interpolated) {
      data.interpolated = true;
    }

    this._generateHandles(data.handles);

    data.handles.textBox = {
      active: false,
      hasMoved: false,
      movesIndependently: false,
      drawnIndependently: true,
      allowedOutsideImage: true,
      hasBoundingBox: true
    };

    data.polyBoundingBox = {};

    data.toBeScaled = importType;

    return data;
  }

  _generateHandles(dataHandles) {
    // Construct data.handles object
    for (let i = 0; i < this._polyHandles.length; i++) {
      handle = this._deepCopyOneHandle(i);
      dataHandles.push(handle);
    }

    // Generate lines to be drawn
    for (let i = 0; i < dataHandles.length; i++) {
      if (i === dataHandles.length - 1) {
        dataHandles[i].lines.push(dataHandles[0]);
      } else {
        dataHandles[i].lines.push(dataHandles[i + 1]);
      }
    }
  }

  _deepCopyOneHandle(i) {
    let handle = {
      x: this._polyHandles[i].x,
      y: this._polyHandles[i].y,
      lines: []
    };

    if (this._polyHandles[i].z !== undefined) {
      handle.z = this._polyHandles[i].z;
    }

    return handle;
  }

  get polyHandles() {
    return this._polyHandles;
  }
  get sopInstanceUid() {
    return this._sopInstanceUid;
  }

  get uid() {
    return this._polygonUid;
  }

  get frameNumber() {
    return this._frameNumber;
  }
}
