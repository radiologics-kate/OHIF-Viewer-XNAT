import { Template } from "meteor/templating";

import "./brushSettingsDialogs.html";
import BrushSettings from "./ReactComponents/BrushSettings.js";

Template.brushSettingsDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "brushSettingsDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushSettingsDialogs.helpers({
  BrushSettings() {
    return BrushSettings;
  }
});
