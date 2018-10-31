import { cornerstoneTools, cornerstoneMath } from 'meteor/ohif:cornerstone';
import generateUID from '../util/generateUID.js';
import { OHIF } from 'meteor/ohif:core';
import { createNewVolume, setVolumeName } from '../util/freehandNameIO.js';

import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';


export default class Freehand3DMouseSculpterTool extends FreehandMouseSculpterTool {
  constructor(name = 'FreehandMouse') {
    super(name);

    this.configuration.alwaysShowHandles = false;

    this._freehand3DStore  = modules.freehand3D;
  }
