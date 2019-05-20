import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import freehand3DModule from "./lib/modules/freehand3DModule.js";

const modules = cornerstoneTools.store.modules;

export default function initialise(configuration = {}) {
  const brushModule = cornerstoneTools.store.modules.brush;
  const brushState = brushModule.state;

  const config = Object.assign({}, defaultConfig, configuration);

  brushState.holeFill = config.holeFill;
  brushState.holeFillRange = config.holeFillRange;
  brushState.strayRemove = config.strayRemove;
  brushState.strayRemoveRange = config.strayRemoveRange;
  brushState.gates = config.gates;
  brushState.gates.push({
    name: "custom",
    range: [0, 100]
  });
  brushState.activeGate = brushState.gates[0].name;
  brushState.maxRadius = config.maxRadius;
  cornerstoneTools.register("module", "freehand3D", freehand3DModule);

  const freehand3DStore = modules.freehand3D;

  icrXnatRoiSession.set("freehandInterpolate", config.interpolate);
  freehand3DStore.state.interpolate = config.interpolate;

  icrXnatRoiSession.set("showFreehandStats", config.showFreehandStats);
  freehand3DStore.state.displayStats = config.showFreehandStats;

  brushModule.getters.activeGateRange = () => {
    const activeGate = brushState.activeGate;
    const gates = brushState.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === activeGate;
    });

    return brushState.gates[gateIndex].range;
  };

  brushModule.getters.customGateRange = () => {
    const gates = brushState.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === "custom";
    });

    return brushState.gates[gateIndex].range;
  };

  brushModule.setters.customGateRange = (min, max) => {
    const gates = brushState.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === "custom";
    });

    const customGateRange = brushState.gates[gateIndex].range;

    if (min !== null) {
      customGateRange[0] = min;
    }

    if (max !== null) {
      customGateRange[1] = max;
    }
  };

  brushModule.getters.importMetadata = seriesInstanceUid => {
    if (
      brushModule.state.import &&
      brushModule.state.import[seriesInstanceUid]
    ) {
      return brushModule.state.import[seriesInstanceUid];
    }
  };

  brushModule.setters.importMetadata = (seriesInstanceUid, metadata) => {
    // Store that we've imported a collection for this series.
    if (!brushModule.state.import) {
      brushModule.state.import = {};
    }

    brushModule.state.import[seriesInstanceUid] = metadata;
  };

  brushModule.setters.importModified = seriesInstanceUid => {
    const importMetadata = brushModule.state.import[seriesInstanceUid];

    if (importMetadata.modified) {
      return;
    }

    importMetadata.modified = true;

    // JamesAPetts
    console.log(`MODIFYING SEGMENTATION`);
    Session.set("refreshSegmentationMenu", Math.random().toString());
  };
}

const defaultConfig = {
  maxRadius: 64,
  holeFill: 2,
  holeFillRange: [0, 20],
  strayRemove: 5,
  strayRemoveRange: [0, 99],
  interpolate: false,
  showFreehandStats: false,
  gates: [
    {
      //https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4309522/
      name: "adipose",
      range: [-190, -30]
    },
    {
      //https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4309522/
      name: "muscle",
      range: [-29, 150]
    },
    {
      name: "bone",
      range: [150, 2000]
    }
  ]
};
