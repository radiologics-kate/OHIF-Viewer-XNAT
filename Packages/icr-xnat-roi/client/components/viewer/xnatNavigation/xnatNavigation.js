import { Template } from "meteor/templating";

import "./xnatNavigation.html";
import XNATNavigation from "./ReactComponents/XNATNavigation.js";

Template.xnatNavigation.helpers({
  XNATNavigation() {
    return XNATNavigation;
  }
});
