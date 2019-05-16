import { Template } from 'meteor/templating';

Template.flexboxLayout.events({
    'transitionend .sidebarMenu'(event, instance) {
        if (!event.target.classList.contains('sidebarMenu')) {
            return;
        }

        window.ResizeViewportManager.handleResize();
    }
});

Template.flexboxLayout.helpers({
  leftSidebarOpen() {
    return Template.instance().data.state.get('leftSidebar') && true;
  },
  leftSidebarScanList() {
      const leftSidebarValue = Template.instance().data.state.get('leftSidebar');

      if (leftSidebarValue === "scanList") {
        return true;
      }

      return;
  },
  leftSidebarChangeSession() {
    const leftSidebarValue = Template.instance().data.state.get('leftSidebar');

    if (leftSidebarValue === "changeSession") {
      return true;
    }

    return;
  },
  rightSidebarOpen() {
      return Template.instance().data.state.get('rightSidebar') && true;
  },
  rightSidebarRoiContourMenu() {
    const leftSidebarValue = Template.instance().data.state.get('rightSidebar');

    if (leftSidebarValue === "roiContourMenu") {
      return true;
    }

    return;
  },
  rightSidebarSegmentationMenu() {
    const leftSidebarValue = Template.instance().data.state.get('rightSidebar');

    if (leftSidebarValue === "segmentationMenu") {
      return true;
    }

    return;
  },
});
