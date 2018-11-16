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

    if (data.structureSetName === 'default') {
      return true;
    }

    return false;
  },
  checked: () => {
    const instance = Template.instance();
    const data = instance.data;

    const ROIContour = data.ROIContourReference;
    const activeROIContourIndex = data.structureSetReference.activeROIContourIndex;

    const isActive = activeROIContourIndex === data.index;

    if (isActive) {
      return 'checked';
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
  'click .js-switch-button'(event) {
    const instance = Template.instance();
    const data = instance.data;
    const ROIContour = data.ROIContourReference;
    data.structureSetReference.activeROIContourIndex = data.index;

    const dialog = $('#volumeManagementDialog');
    dialog.get(0).close();

    // Reset the focus to the active viewport element
    // This makes the mobile Safari keyboard close
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
    element.focus();
  }
});
