import { Template } from 'meteor/templating';
import { components as peppermintComponents } from "meteor/icr:peppermint-tools";
import { components as icrXnatRoiComponents } from 'meteor/icr:xnat-roi';

import {
  importROIContours,
  exportROIContours,
  importSegmentations,
  exportSegmentations
} from "meteor/icr:xnat-roi";

const { RoiContourMenu, SegmentationMenu } = peppermintComponents;
const { XNATNavigation } = icrXnatRoiComponents;

let cornertoneNewImageActiveViewport = "CornerstoneNewImage0";

Session.set("refreshRoiContourMenu", Math.random().toString);
Session.set("refreshSegmentationMenu", Math.random().toString);

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
  RoiContourMenu() {
    return RoiContourMenu;
  },
  roiContourMenuId() {
    const instance = Template.instance();

    Session.get(cornertoneNewImageActiveViewport);

    const activeViewport = Session.get("activeViewport");

    cornerstoneNewImageActiveViewport = `CornerstoneNewImage${activeViewport}`;

    Session.get("refreshRoiContourMenu");

    return Math.random().toString();
  },
  roiContourMenuImportCallback() {
    return importROIContours;
  },
  roiContourMenuExportCallback() {
    return exportROIContours
  },
  SegmentationMenu() {
    return SegmentationMenu;
  },
  segmentationMenuId() {
    const instance = Template.instance();

    Session.get(cornertoneNewImageActiveViewport);

    const activeViewport = Session.get("activeViewport");

    cornerstoneNewImageActiveViewport = `CornerstoneNewImage${activeViewport}`;

    Session.get("refreshSegmentationMenu");

    return Math.random().toString();
  },
  segmentationMenuImportCallback() {
    return importSegmentations;
  },
  segmentationMenuExportCallback() {
    return exportSegmentations;
  },
  XNATNavigation() {
    return XNATNavigation;
  }
});
