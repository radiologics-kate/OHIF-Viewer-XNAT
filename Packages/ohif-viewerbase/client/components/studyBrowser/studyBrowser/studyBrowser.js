import { Template } from "meteor/templating";
import { OHIF } from "meteor/ohif:core";

Template.studyBrowser.onCreated(() => {
  const instance = Template.instance();

  instance.data.callRender = new ReactiveVar(Math.random());
});

Template.studyBrowser.helpers({
  studies: () => {
    // @TypeSafeStudies
    return OHIF.viewer.Studies.all();
  }
});
