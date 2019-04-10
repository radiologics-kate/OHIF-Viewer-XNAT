import { setVolumeName } from "../../../../lib/util/freehandNameIO.js";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";

Template.volumeListItem.onRendered(() => {
  const instance = Template.instance();
});

Template.volumeListItem.onCreated(() => {
  const instance = Template.instance();
});

Template.volumeListItem.helpers({
  isDefault: () => {
    const instance = Template.instance();
    const data = instance.data;

    if (data.structureSetName === "default") {
      return true;
    }

    return false;
  },
  checked: () => {
    const instance = Template.instance();
    const data = instance.data;

    const ROIContour = data.ROIContourReference;
    const activeROIContourIndex =
      data.structureSetReference.activeROIContourIndex;

    const isActive = activeROIContourIndex === data.index;

    if (isActive) {
      return "checked";
    }

    return;
  },
  color: () => {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.color;
  },
  volumeName: () => {
    const instance = Template.instance();
    console.log(instance.data);

    instance.data.triggerNameRefresh.get();

    console.log("CALC VOLUME NAME");

    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.name;
  },
  numPolygons: () => {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.polygonCount;
  }
});

Template.volumeListItem.events({
  "click .js-switch-button"(event) {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;
    data.structureSetReference.activeROIContourIndex = data.index;
  },
  "click .js-volume-rename"(event) {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    setVolumeName(seriesInstanceUid, "DEFAULT", ROIContour.uid).then(name => {
      console.log(name);
      instance.data.triggerNameRefresh.set(Math.random());
    });
  }
});
