import { OHIF } from 'meteor/ohif:core';
import { exportROIs } from './lib/IO/export.js';
import { importROIs } from './lib/IO/import.js';
import exportMask from './lib/IO/exportMask.js';
import importMask from './lib/IO/importMask.js';

import { toggleFreehandStats } from 'meteor/icr:peppermint-tools';
import { volumeManagement } from 'meteor/icr:peppermint-tools';
import { segManagement } from 'meteor/icr:peppermint-tools';

import { $ } from 'meteor/jquery';

OHIF.viewerbase.viewportUtils.exportROIs = () => {
  exportROIs();
}
OHIF.viewerbase.viewportUtils.importROIs = () => {
  importROIs();
}
OHIF.viewerbase.viewportUtils.showHelp = () => {
  const showHelpDialog = $('#showHelpDialog');

  showHelpDialog.get(0).showModal();
}

OHIF.viewerbase.viewportUtils.exportMask = function() {
  console.log('exportMask');
  exportMask();
}

OHIF.viewerbase.viewportUtils.importMask = function() {
  console.log('importMask');
  importMask();
}

OHIF.viewerbase.viewportUtils.toggleFreehandStats = () => {
  toggleFreehandStats();
}

OHIF.viewerbase.viewportUtils.volumeManagement = () => {
  volumeManagement();
}

OHIF.viewerbase.viewportUtils.segManagement = () => {
  segManagement();
}
