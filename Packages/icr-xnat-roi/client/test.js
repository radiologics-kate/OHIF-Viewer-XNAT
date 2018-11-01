import { OHIF } from 'meteor/ohif:core';
import closeIODialog from './lib/IO/closeIODialog.js';
import { maskExport } from './lib/IO/maskExport.js';

// Here select which UI test to map to the testButton in viewportUtils:
OHIF.viewerbase.viewportUtils.testButton = function() {
  console.log('test');
  maskExport();
}
