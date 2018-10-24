import { OHIF } from 'meteor/ohif:core';

export { SeriesInfoProvider };

/**
 * @static @class
 */
class SeriesInfoProvider {

  /**
   * @static Returns the seriesInstanceUid of the active element.
   * @public
   *
   * @return {String} The seriesInstanceUid for the active element.
   */
  static getActiveSeriesInstanceUid () {
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

    return SeriesInfoProvider.getSeriesInstanceUid(activeEnabledElement);
  }

  static getActiveSeriesInfo () {
    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

    return SeriesInfoProvider.getSeriesInfo(activeEnabledElement);
  }

  static getSeriesInfo (enabledElement) {
    if (!enabledElement) {
        return;
    }

    const image = enabledElement.image;
    const imageId = image.imageId;
    const metadataProvider = OHIF.viewer.metadataProvider;
    const metaData = metadataProvider.getMetadata(imageId);

    seriesInfo = {
      studyInstanceUid: metaData.study.studyInstanceUid,
      seriesInstanceUid: metaData.series.seriesInstanceUid,
      modality: metaData.series.modality || metadataProvider.getFromDataSet(image.data, 'string', 'x00080060'),
      startDate: metaData.series.seriesDate || metadataProvider.getFromDataSet(image.data, 'string', 'x00080021'),
      startTime: metaData.series.seriesTime || metadataProvider.getFromDataSet(image.data, 'string', 'x00080031'),
      sopClassUid: metaData.instance.sopClassUid,
      sopInstanceUids: [],
      person: {
        name: metaData.patient.name,
        id: metaData.patient.id || metadataProvider.getFromDataSet(image.data, 'string', 'x00100020'),
        birthDate: metaData.patient.birthDate || metadataProvider.getFromDataSet(image.data, 'string', 'x00100030'),
        sex: metaData.patient.sex || metadataProvider.getFromDataSet(image.data, 'string', 'x00100040'),
        ethnicGroup: metadataProvider.getFromDataSet(image.data, 'string', 'x00102160')
      },
      equipment: {
        manufacturerName: metadataProvider.getFromDataSet(image.data, 'string', 'x00080070'),
        manufacturerModelName: metadataProvider.getFromDataSet(image.data, 'string', 'x00081090'),
        softwareVersion: metadataProvider.getFromDataSet(image.data, 'string', 'x00181020')
      }
    };

    const studies = OHIF.viewer.StudyMetadataList.all();

    // Loop through studies to find the series
    for ( let i = 0; i < studies.length; i++ ) {
      const series = studies[i].getSeriesByUID(seriesInfo.seriesInstanceUid);
      if (series !== undefined) {
        // This study contains the series and we've retrived it.
        for ( let j = 0; j < series.getInstanceCount(); j++ ) {
          const instance = series.getInstanceByIndex(j);
          const sopInstanceUid = instance.getSOPInstanceUID();
          seriesInfo.sopInstanceUids.push(sopInstanceUid);
        }

      }
    }

    return seriesInfo;

  }

  static getSeriesInstanceUid (enabledElement) {
    if (!enabledElement) {
        return;
    }

    const imageId = enabledElement.image.imageId;
    const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);

    return metaData.series.seriesInstanceUid;
  }
}
