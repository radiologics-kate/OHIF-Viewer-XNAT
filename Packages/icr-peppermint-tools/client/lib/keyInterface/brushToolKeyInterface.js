import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const getKeyFromKeyCode = cornerstoneTools.import('util/getKeyFromKeyCode');
const Mousetrap = require('mousetrap');
const BaseBrushTool = cornerstoneTools.import('base/BaseBrushTool');


Mousetrap.bind(['[', ']', '-', '=', '+'], function(evt) {
  const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
  const element = activeEnabledElement.element;
  const activeBrushTools = getActiveBrushToolsForElement(element);

  if (!activeBrushTools.length) {
    return;
  }

  const brushTool = activeBrushTools[0];
  const key = evt.key;
  let imageNeedsUpdate = false;

  switch (key) {
    case '[':
      brushTool.previousSegmentation();
      imageNeedsUpdate = true;
      break;
    case ']':
      brushTool.nextSegmentation();
      imageNeedsUpdate = true;
      break;
    case '-':
      brushTool.decreaseBrushSize();
      imageNeedsUpdate = true;
      break;
    case '+':
    case '=':
      brushTool.increaseBrushSize();
      imageNeedsUpdate = true;
      break;
  }

  if (imageNeedsUpdate) {
    cornerstone.updateImage(element);
  }

});


function getActiveBrushToolsForElement (element) {
  tools = cornerstoneTools.store.state.tools;

  tools = tools.filter(
    (tool) =>
      tool.element === element &&
      tool.mode === 'active'
  );

  return tools.filter(
    (tool) => tool instanceof BaseBrushTool
  );
}
