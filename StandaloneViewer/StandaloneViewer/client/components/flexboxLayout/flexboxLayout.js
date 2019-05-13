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

      console.log(leftSidebarValue);

      if (leftSidebarValue === "scanList") {

        console.log(true);
        return true;
      }

      console.log(false);

      return;
  },
  leftSidebarChangeSession() {
    const leftSidebarValue = Template.instance().data.state.get('leftSidebar');

    if (leftSidebarValue === "changeSession") {
      return true;
    }

    return;
    //return Template.instance().data.state.get('leftSidebarChangeSession');
  },
  rightSidebarOpen() {
      return Template.instance().data.state.get('rightSidebar');
  }
});
