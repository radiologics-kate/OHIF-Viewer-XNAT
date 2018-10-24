/**
 * Import main dependency...
 */

import { OHIF } from 'meteor/ohif:core';

/**
 * Create Metadata namespace...
 */

const RoiStateManagement = {};

/**
 * Append Metadata namespace to OHIF namespace...
 */

OHIF.RoiStateManagement = RoiStateManagement;

/**
 * Export relevant objects...
 */

export { OHIF, RoiStateManagement };
