const sessionMap = {
  get(seriesInstanceUid, property) {
    if (property) {
      return _map[seriesInstanceUid][property];
    }

    return _map[seriesInstanceUid];
  },
  set(json, experimentId, experimentLabel) {
    console.log(json);

    const studies = json.studies;

    for (let i = 0; i < studies.length; i++) {
      const seriesList = studies[i].seriesList;

      console.log(`seriesList ${i}`);

      for (let j = 0; j < seriesList.length; j++) {
        console.log(`series [${i}, ${j}]`);

        _map[seriesList[j].seriesInstanceUid] = {
          experimentId,
          experimentLabel,
          seriesDescription: seriesList[j].seriesDescription
        };
      }
    }

    console.log(`end of updateSessionMap:`);
    console.log(sessionMap);
  }
};

_map = {};

export { sessionMap };
