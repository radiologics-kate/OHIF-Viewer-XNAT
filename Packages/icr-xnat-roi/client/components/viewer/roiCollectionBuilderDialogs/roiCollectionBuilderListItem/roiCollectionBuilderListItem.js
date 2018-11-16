Template.roiCollectionBuilderListItem.onCreated(() => {
    const instance = Template.instance();
});

Template.roiCollectionBuilderListItem.helpers({
  color: () => {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.color;
  },
  volumeName: () => {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.name;
  },
  polygonCount: () => {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;

    return ROIContour.polygonCount;
  },
  checked: () => {
    const instance = Template.instance();
    const checked = instance.data.checked.get();

    if (checked) {
      return 'checked';
    }

    return;
  }
});

Template.roiCollectionBuilderListItem.events({
  'click .js-roi-check'(event) {
    const instance = Template.instance();
    const data = instance.data;
    const checked = data.checked;
    const ROIContourIndex = data.index;
    const exportMask = data.exportMask;

    checked.set(!checked.get());

    exportMask[ROIContourIndex] = checked.get();
  }
});
