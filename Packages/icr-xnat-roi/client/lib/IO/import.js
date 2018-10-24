import { AsyncRoiFetcher } from '../classes/AsyncRoiFetcher.js';
import { SeriesInfoProvider } from '../classes/SeriesInfoProvider.js';

/**
 * Initiates the fetching of all ROIs in the XNAT Session that can map to the
 * active series.
 *
 * @author JamesAPetts
 */
export function importROIs () {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
  const asyncRoiFetcher = new AsyncRoiFetcher(seriesInstanceUid);
  asyncRoiFetcher.fetchRois();
}
