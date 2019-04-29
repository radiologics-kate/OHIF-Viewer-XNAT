import { OHIF } from "meteor/ohif:core";

Template.brushHelpMenu.onCreated(() => {
  const instance = Template.instance();

  instance.data.showBrushHelp = new ReactiveVar("Manual");
});

Template.brushHelpMenu.helpers({
  absoluteUrl: url => {
    return OHIF.utils.absoluteUrl(url);
  },
  showBrushHelp: string => {
    const instance = Template.instance();

    const showHelp = instance.data.showBrushHelp.get();

    if (!showHelp) {
      return false;
    }

    return string === showHelp;
  },
  pressed: buttonName => {
    const instance = Template.instance();
    const showHelp = instance.data.showBrushHelp.get();

    if (showHelp === buttonName) {
      return "pressed";
    }

    return "depressed";
  },
  ioTitle: () => {
    const instance = Template.instance();
    const title = instance.data.showBrushHelp.get();

    if (!title) {
      return "title";
    }

    return title;
  }
});

Template.brushHelpMenu.events({
  "click .js-help-manual"(event) {
    this.showBrushHelp.set("Manual");
  },
  "click .js-help-smart-ct"(event) {
    this.showBrushHelp.set("Smart CT");
  },
  "click .js-help-auto"(event) {
    this.showBrushHelp.set("Auto");
  },
  "click .js-help-settings"(event) {
    this.showBrushHelp.set("Settings");
  },
  "click .js-help-seg-management"(event) {
    this.showBrushHelp.set("Seg Management");
  }
});
