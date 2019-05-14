const sessionMap = {
  getScan: (seriesInstanceUid, property) => {
    if (!seriesInstanceUid) {
      return _map.scans;
    }

    const scan = _map.scans.find(
      scanI => scanI.seriesInstanceUid === seriesInstanceUid
    );

    if (!property) {
      return scan;
    }

    return scan[property];
  },
  setScan: (json, metadata) => {
    console.log(json);

    const studies = json.studies;

    for (let i = 0; i < studies.length; i++) {
      const seriesList = studies[i].seriesList;

      for (let j = 0; j < seriesList.length; j++) {
        console.log(`series [${i}, ${j}]`);

        _map.scans.push({
          seriesInstanceUid: seriesList[j].seriesInstanceUid,
          seriesDescription: seriesList[j].seriesDescription,
          seriesNumber: seriesList[j].seriesNumber,
          ...metadata
        });
      }
    }

    console.log(`end of sessionMap.set():`);
    console.log(sessionMap);
  },
  setSession: metadata => {
    _map.sessions.push(metadata);
  },
  getSession: (experimentId, property) => {
    if (!experimentId) {
      return _map.sessions;
    }

    const session = _map.sessions.find(
      sessionI => sessionI.seriesInstanceUid === seriesInstanceUid
    );

    if (!property) {
      return session;
    }

    return session[property];
  },
  setSubject: subjectId => {
    _map.subject = subjectId;
  },
  getSubject: () => {
    return _map.subject;
  },
  setProject: projectId => {
    _map.project = projectId;
  },
  getProject: () => {
    return _map.project;
  },
  setParentProject: parentProjectId => {
    _map.parentProject = parentProjectId;
  },
  getParentProject: () => {
    return _map.parentProject;
  },
  setExperiment: experimentId => {
    _map.experiment = experimentId;
  },
  getExperiment: () => {
    return _map.experiment;
  }
};

_map = {
  scans: [],
  sessions: [],
  subject: "",
  project: "",
  parentProject: "",
  experiment: ""
};

console.log("SESSION_MAP:");
console.log(_map);

export { sessionMap };
