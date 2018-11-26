import { AsyncRoiFetcher } from '../classes/AsyncRoiFetcher.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';

/**
 * Initiates the fetching of all ROIs in the XNAT Session that can map to the
 * active series.
 *
 * @author JamesAPetts
 */
export default function () {
  const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  const asyncRoiFetcher = new AsyncRoiFetcher(seriesInstanceUid);
  asyncRoiFetcher.fetch();
}
