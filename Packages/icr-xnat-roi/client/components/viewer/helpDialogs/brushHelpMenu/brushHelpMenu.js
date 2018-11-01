import { OHIF } from 'meteor/ohif:core';

Template.brushHelpMenu.onCreated(() => {
  const instance = Template.instance();

  instance.data.showBrushHelp = new ReactiveVar('Brush');
});

Template.brushHelpMenu.helpers({
  absoluteUrl: (url) => {
    return OHIF.utils.absoluteUrl(url);
  },
  showBrushHelp: (string) => {
    const instance = Template.instance();

    const showHelp = instance.data.showBrushHelp.get();

    if (!showHelp) {
      return false;
    }

    return (string === showHelp);
  },
  pressed: (buttonName) => {
    const instance = Template.instance();
    const showHelp = instance.data.showBrushHelp.get();

    if (showHelp === buttonName) {
      return 'pressed';
    }

    return 'depressed';
  },
  ioTitle: () => {
    const instance = Template.instance();
    const title = instance.data.showBrushHelp.get();

    console.log(title);

    if (!title) {
      return 'title';
    }

    return title;
  }
});

Template.brushHelpMenu.events({
    'click .js-help-brush'(event) {
      this.showBrushHelp.set('Brush');
    }
});
