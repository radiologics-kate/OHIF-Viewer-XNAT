import { OHIF } from 'meteor/ohif:core';
import { $ } from 'meteor/jquery';

Template.helpDialogs.onRendered(() => {
    const instance = Template.instance();

    const dialog = instance.$('#showHelpDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.helpDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.showHelp = new ReactiveVar('ROI');
});

Template.helpDialogs.helpers({
  absoluteUrl: (url) => {
    return OHIF.utils.absoluteUrl(url);
  },
  showHelp: (string) => {
    const instance = Template.instance();

    const showHelp = instance.data.showHelp.get();

    if (!showHelp) {
      return false;
    }

    return (string === showHelp);
  },
  pressed: (buttonName) => {
    const instance = Template.instance();
    const showHelp = instance.data.showHelp.get();

    if (showHelp === buttonName) {
      return 'pressed';
    }

    return 'depressed';
  },
  title: () => {
    const instance = Template.instance();
    const title = instance.data.showHelp.get();

    if (!title) {
      return 'title';
    }

    return title;
  }
});

Template.helpDialogs.events({
    'click .js-help-roi'(event) {
      this.showHelp.set('ROI');
    },
    'click .js-help-brush'(event) {
      this.showHelp.set('Brush');
    },
    'click .js-help-file'(event) {
      this.showHelp.set('File');
    },
    'click .js-help-cancel'(event) {
      const dialog = $('#showHelpDialog');
      dialog.get(0).close();
    }
});
