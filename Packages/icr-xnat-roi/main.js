/**
 * Import namespace...
 */

import { OHIF, RoiStateManagement } from  './namespace.js';

/**
 * Import scripts that will populate the Metadata namespace as a side effect only import. This is effectively the public API...
 */

import './client/'; // which is actually: import './client/index.js';

export { OHIF, RoiStateManagement };
