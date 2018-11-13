import { RoiStateManagement } from '../namespace';

import { checkAndSetPermissions } from './lib/IO/checkAndSetPermissions.js';

import GeneralAnatomyList from './lib/GeneralAnatomylist.js';

console.log(GeneralAnatomyList);

RoiStateManagement.checkAndSetPermissions = checkAndSetPermissions;
