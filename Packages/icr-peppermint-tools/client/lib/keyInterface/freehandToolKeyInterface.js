import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { createNewVolume } from '../util/freehandNameIO.js';
import { OHIF } from 'meteor/ohif:core';

const getKeyFromKeyCode = cornerstoneTools.import('util/getKeyFromKeyCode');
const Mousetrap = require('mousetrap');
const BaseBrushTool = cornerstoneTools.import('base/BaseBrushTool');

Mousetrap.bind(['n', 'ctrl'], function(evt) {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const freehandTool = cornerstoneTools.getToolForElement(element, 'freehandMouse');

  if (!freehandTool || freehandTool.mode !== 'active') {
    return;
  }

  const key = evt.key;
  let imageNeedsUpdate = false;

  console.log(key);

  switch (key) {
    case 'n':
      createNewVolume();
      break;
    case 'Control':
      freehandTool.configuration.alwaysShowHandles = true;
      console.log(freehandTool.configuration);
      imageNeedsUpdate = true;
      break;
  }

  console.log(freehandTool);

  if (imageNeedsUpdate) {
    cornerstone.updateImage(element);
  }

}, 'keydown');

Mousetrap.bind(['ctrl'], function(evt) {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const freehandTool = cornerstoneTools.getToolForElement(element, 'freehandMouse');

  if (!freehandTool || freehandTool.mode !== 'active') {
    return;
  }

  freehandTool.configuration.alwaysShowHandles = false;
  cornerstone.updateImage(element);

}, 'keyup');
