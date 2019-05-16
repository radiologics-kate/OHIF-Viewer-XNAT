import "./segmentationMenu.html";
import SegmentationMenu from "./ReactComponents/SegmentationMenu.js";

let cornertoneNewImageActiveViewport = "CornerstoneNewImage0";

Session.set("refreshSegmentationMenu", Math.random().toString);

Template.segmentationMenu.helpers({
  SegmentationMenu() {
    return SegmentationMenu;
  },
  id() {
    const instance = Template.instance();

    Session.get(cornertoneNewImageActiveViewport);

    const activeViewport = Session.get("activeViewport");

    cornerstoneNewImageActiveViewport = `CornerstoneNewImage${activeViewport}`;

    Session.get("refreshSegmentationMenu");

    return Math.random().toString();
  }
});
