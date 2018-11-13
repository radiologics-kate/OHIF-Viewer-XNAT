import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.volumeList.helpers({
  isDefault: () => {
    const instance = Template.instance();
    const data = instance.data;

    if (data.structureSetName === 'default') {
      return true;
    }

    return false;
  },
  notEmpty: () => {
    const instance = Template.instance();
    const data = instance.data;

    if (data.ROIContourArray.length > 0) {
      return true;
    }

    return false;
  },
  showHideButton: () => {
    const instance = Template.instance();
    const showList = instance.data.showList.get();

    if (showList) {
      return "fa fa-minus-square";
    }

    return "fa fa-plus-square";
  },
  displayRoiCollectionButton: () => {
    const instance = Template.instance();
    const display = instance.data.display.get();

    if (display) {
      return "fa fa-eye";
    }

    return "fa fa-eye-slash";
  },
  showBody: () => {
    const instance = Template.instance();
    const showList = instance.data.showList.get();

    return showList;
  }
});

Template.volumeList.events({
    'click .js-show-hide'(event) {
      console.log('.js-show-hide');
      const instance = Template.instance();
      const showList = instance.data.showList;
      showList.set(!showList.get());
    },
    'click .js-display-roiCollection'(event) {
      console.log('.js-display-roiCollection');
      const instance = Template.instance();
      const display = instance.data.display.get();
      const structureSet = instance.data.structureSetReference;

      structureSet.visible = !display;
      instance.data.display.set(!display);

      // Update viewport.
      const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();

      cornerstone.updateImage(element);
    }
});
