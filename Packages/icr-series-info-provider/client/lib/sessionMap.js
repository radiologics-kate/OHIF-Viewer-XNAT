const sessionMap = {
  get: (seriesInstanceUid, property) => {
    if (property) {
      return _map[seriesInstanceUid][property];
    }

    return _map[seriesInstanceUid];
  },
  set: (json, metadata) => {
    console.log(json);

    const studies = json.studies;

    for (let i = 0; i < studies.length; i++) {
      const seriesList = studies[i].seriesList;

      for (let j = 0; j < seriesList.length; j++) {
        console.log(`series [${i}, ${j}]`);

        _map[seriesList[j].seriesInstanceUid] = {
          seriesDescription: seriesList[j].seriesDescription,
          ...metadata
        };
      }
    }

    console.log(`end of sessionMap.set():`);
    console.log(sessionMap);
  },
  setSession: metadata => {
    _map.session = metadata;
  }
};

_map = {
  session: {}
};

console.log("SESSION_MAP:");
console.log(_map);

export { sessionMap };
