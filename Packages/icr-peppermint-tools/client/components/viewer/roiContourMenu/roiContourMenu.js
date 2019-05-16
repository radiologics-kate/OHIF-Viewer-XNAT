import "./roiContourMenu.html";
import RoiContourMenu from "./ReactComponents/RoiContourMenu.js";

let cornertoneNewImageActiveViewport = "CornerstoneNewImage0";

Session.set("refreshRoiContourMenu", Math.random().toString);

Template.roiContourMenu.onCreated(() => {
  const instance = Template.instance();
});

Template.roiContourMenu.helpers({
  RoiContourMenu() {
    return RoiContourMenu;
  },
  id() {
    const instance = Template.instance();

    Session.get(cornertoneNewImageActiveViewport);

    const activeViewport = Session.get("activeViewport");

    cornerstoneNewImageActiveViewport = `CornerstoneNewImage${activeViewport}`;

    Session.get("refreshRoiContourMenu");

    return Math.random().toString();
  }
});
