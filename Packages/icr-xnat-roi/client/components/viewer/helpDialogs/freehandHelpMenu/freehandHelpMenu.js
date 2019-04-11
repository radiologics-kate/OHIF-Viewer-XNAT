import { OHIF } from "meteor/ohif:core";

Template.freehandHelpMenu.onCreated(() => {
  const instance = Template.instance();

  instance.data.showFreehandHelp = new ReactiveVar("Draw");
});

Template.freehandHelpMenu.helpers({
  absoluteUrl: url => {
    return OHIF.utils.absoluteUrl(url);
  },
  showFreehandHelp: string => {
    const instance = Template.instance();
    const showHelp = instance.data.showFreehandHelp.get();

    if (!showHelp) {
      return false;
    }

    return string === showHelp;
  },
  pressed: buttonName => {
    const instance = Template.instance();
    const showHelp = instance.data.showFreehandHelp.get();

    if (showHelp === buttonName) {
      return "pressed";
    }

    return "depressed";
  },
  freehandTitle: () => {
    const instance = Template.instance();
    const title = instance.data.showFreehandHelp.get();

    if (!title) {
      return "title";
    }

    return title;
  }
});

Template.freehandHelpMenu.events({
  "click .js-help-draw"(event) {
    this.showFreehandHelp.set("Draw");
  },
  "click .js-help-sculpt"(event) {
    this.showFreehandHelp.set("Sculpt");
  },
  "click .js-help-volumes"(event) {
    this.showFreehandHelp.set("ROI Management");
  },
  "click .js-help-toggle-stats"(event) {
    this.showFreehandHelp.set("Stats");
  },
  "click .js-help-interpolate"(event) {
    this.showFreehandHelp.set("Interpolate");
  }
});
