import { OHIF } from 'meteor/ohif:core';

Template.ioHelpMenu.onCreated(() => {
  const instance = Template.instance();

  instance.data.showIoHelp = new ReactiveVar('Import ROIs');
});

Template.ioHelpMenu.helpers({
  absoluteUrl: (url) => {
    return OHIF.utils.absoluteUrl(url);
  },
  showIoHelp: (string) => {
    const instance = Template.instance();

    const showHelp = instance.data.showIoHelp.get();

    if (!showHelp) {
      return false;
    }

    return (string === showHelp);
  },
  pressed: (buttonName) => {
    const instance = Template.instance();
    const showHelp = instance.data.showIoHelp.get();

    if (showHelp === buttonName) {
      return 'pressed';
    }

    return 'depressed';
  },
  ioTitle: () => {
    const instance = Template.instance();
    const title = instance.data.showIoHelp.get();

    console.log(title);

    if (!title) {
      return 'title';
    }

    return title;
  }
});

Template.ioHelpMenu.events({
    'click .js-help-export'(event) {
      this.showIoHelp.set('Export ROIs');
    },
    'click .js-help-import'(event) {
      this.showIoHelp.set('Import ROIs');
    },
    'click .js-help-snapshot'(event) {
      this.showIoHelp.set('Export Snapshot');
    }
});
