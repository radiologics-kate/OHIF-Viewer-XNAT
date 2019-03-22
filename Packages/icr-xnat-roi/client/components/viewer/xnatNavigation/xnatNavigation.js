import { Template } from "meteor/templating";

import "./xnatNavigation.html";
import XNATNavigation from "./ReactComponents/XNATNavigation.js";

Template.xnatNavigation.onRendered(() => {
  console.log("==== xnatNavigation onRendered");

  const instance = Template.instance();
  const id = "xnatNavigation";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.xnatNavigation.helpers({
  XNATNavigation() {
    return XNATNavigation;
  }
});
