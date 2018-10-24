import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

/**
 * Toggles the visibility and interactivity of the stats window for the freehand
 * tool.
 *
 * @author JamesAPetts
 */
export function toggleFreehandStats () {
  const enabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

  if (!enabledElement) {
      return;
  }

  const freehandMousetool = cornerstoneTools.getToolForElement(enabledElement, 'FreehandMouse');

  freehandMousetool.configuration.alwaysShowTextBox = !freehandMousetool.configuration.alwaysShowTextBox;

  cornerstone.updateImage(enabledElement.element);
}
