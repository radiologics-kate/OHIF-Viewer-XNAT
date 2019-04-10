import { OHIF } from "meteor/ohif:core";
import { cornerstone } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import unlockStructureSet from "../../../../lib/util/unlockStructureSet.js";

Template.volumeList.helpers({
  isDefault: () => {
    const instance = Template.instance();
    const data = instance.data;

    if (data.structureSetName === "default") {
      return true;
    }

    return false;
  },
  notEmpty: () => {
    const instance = Template.instance();
    const data = instance.data;

    if (data.ROIContourArray.length > 0) {
      return true;
    }

    return false;
  },
  showHideButton: () => {
    const instance = Template.instance();
    const showList = instance.data.showList.get();

    if (showList) {
      return "fa fa-minus-square";
    }

    return "fa fa-plus-square";
  },
  displayRoiCollectionButton: () => {
    const instance = Template.instance();
    const display = instance.data.display.get();

    if (display) {
      return "fa fa-eye";
    }

    return "fa fa-eye-slash";
  },
  showBody: () => {
    const instance = Template.instance();
    const showList = instance.data.showList.get();

    return showList;
  }
});

Template.volumeList.events({
  "click .js-show-hide"(event) {
    const instance = Template.instance();
    const showList = instance.data.showList;
    showList.set(!showList.get());
  },
  "click .js-display-roiCollection"(event) {
    const instance = Template.instance();
    const display = instance.data.display.get();
    const structureSet = instance.data.structureSetReference;

    structureSet.visible = !display;
    instance.data.display.set(!display);

    // Update viewport.
    const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();

    cornerstone.updateImage(element);
  },
  "click .js-unlock-roiCollection"(event) {
    const instance = Template.instance();
    const structureSet = instance.data.structureSetReference;

    confirmation({
      title: "Unlock",
      body:
        "Unlock the collection for editing? The regions will be moved to the Working ROI Collection."
    }).then(didConfirm => {
      if (didConfirm) {
        console.log(structureSet);

        structureSetUid = structureSet.uid;

        console.log(structureSetUid);

        const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

        unlockStructureSet(seriesInstanceUid, structureSetUid);

        // Update viewport.
        const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();

        cornerstone.updateImage(element);

        const dialog = $("#volumeManagementDialog");
        dialog.get(0).close();
      }
    });
  }
});

// TODO -> Don't piggyback of icr-xnat-roi content when we rewrite in react.
async function confirmation(content) {
  function keyConfirmEventHandler(e) {
    console.log("keyConfirmEventHandler");

    if (e.which === 13) {
      // If Enter is pressed accept and close the dialog
      confirmEventHandler();
    }
  }

  function confirmEventHandler() {
    dialog.close();

    removeEventListeners();
    resolveRef(true);
  }

  function cancelEventHandler() {
    removeEventListeners();
    resolveRef(false);
  }

  function cancelClickEventHandler() {
    dialog.close();

    removeEventListeners();
    resolveRef(false);
  }

  function removeEventListeners() {
    dialog.removeEventListener("cancel", cancelEventHandler);
    cancel.removeEventListener("click", cancelClickEventHandler);
    dialog.removeEventListener("keydown", keyConfirmEventHandler);
    confirm.removeEventListener("click", confirmEventHandler);
  }

  const dialog = document.getElementById("ioConfirmationDialog");
  const ioConfirmationTitle = dialog.getElementsByClassName(
    "io-confirmation-title"
  )[0];
  const ioConfirmationBody = dialog.getElementsByClassName(
    "io-confirmation-body"
  )[0];
  const confirm = dialog.getElementsByClassName(
    "js-io-confirmation-confirm"
  )[0];
  const cancel = dialog.getElementsByClassName("js-io-confirmation-cancel")[0];

  // Add event listeners.
  dialog.addEventListener("cancel", cancelEventHandler);
  cancel.addEventListener("click", cancelClickEventHandler);
  dialog.addEventListener("keydown", keyConfirmEventHandler);
  confirm.addEventListener("click", confirmEventHandler);

  ioConfirmationTitle.innerHTML = content.title;
  ioConfirmationBody.innerHTML = content.body;

  dialog.showModal();

  // Reference to promise.resolve, so that I can use external handlers.
  let resolveRef;

  return new Promise(resolve => {
    resolveRef = resolve;
  });
}
