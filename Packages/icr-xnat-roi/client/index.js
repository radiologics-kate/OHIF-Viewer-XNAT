import { RoiStateManagement } from '../namespace';

import { createNewVolume, setVolumeName } from './lib/IO/freehandNameIO.js';
import { SeriesInfoProvider } from './lib/classes/SeriesInfoProvider.js';
import { checkAndSetPermissions } from './lib/IO/checkAndSetPermissions.js';

RoiStateManagement.createNewVolume = createNewVolume;
RoiStateManagement.setVolumeName = setVolumeName;
RoiStateManagement.SeriesInfoProvider = SeriesInfoProvider;
RoiStateManagement.checkAndSetPermissions = checkAndSetPermissions;
