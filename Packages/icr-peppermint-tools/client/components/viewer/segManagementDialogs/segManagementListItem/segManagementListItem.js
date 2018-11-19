import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import brushMetadataIO from '../../../../lib/util/brushMetadataIO.js';

const brushModule = cornerstoneTools.store.modules.brush;

Template.segManagementListItem.helpers({
  color: () => {
    const instance = Template.instance();
    const data = instance.data;
    const segIndex = data.index;

    const colormap = cornerstone.colors.getColormap(brushModule.state.colorMapId);

    if (!colormap) {
      return;
    }
    const colorArray = colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  },
  label: () => {
    const instance = Template.instance();
    const data = instance.data;
    const metadata = data.metadata;

    return metadata.SegmentLabel;
  },
  category: () => {
    const instance = Template.instance();
    const data = instance.data;
    const metadata = data.metadata;

    return metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning;
  },
  typeWithModifier: () => {
    const instance = Template.instance();
    const data = instance.data;
    const metadata = data.metadata;
    const SegmentedPropertyTypeCodeSequence = metadata.SegmentedPropertyTypeCodeSequence;

    let type = SegmentedPropertyTypeCodeSequence.CodeMeaning;

    if (SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence) {
      const modifier = SegmentedPropertyTypeCodeSequence
        .SegmentedPropertyTypeModifierCodeSequence
        .CodeMeaning;

      type += ` (${modifier})`;
    }

    return type;
  },
  checked: () => {
    const instance = Template.instance();
    const drawColorId = brushModule.state.drawColorId;

    if (drawColorId === instance.data.index) {
      return 'checked';
    }

    return;
  },
  showHideIcon: () => {
    const instance = Template.instance();
    const visible = instance.data.visible.get();

    if (visible) {
      return 'fa fa-eye';
    }

    return 'fa fa-eye-slash';
  }

});


Template.segManagementListItem.events({
  'click .js-seg-edit'(event) {
    const instance = Template.instance();
    const data = instance.data;
    const metadata = data.metadata;
    const SegmentedPropertyTypeCodeSequence = metadata.SegmentedPropertyTypeCodeSequence;

    const segIndex = data.index;
    const label = metadata.SegmentLabel;
    const type = SegmentedPropertyTypeCodeSequence.CodeMeaning;
    let modifier;

    if (SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence) {
      modifier = SegmentedPropertyTypeCodeSequence
        .SegmentedPropertyTypeModifierCodeSequence
        .CodeMeaning;
    }

    closeDialog();
    brushMetadataIO(
      segIndex,
      label,
      type,
      modifier
    );
  },
  'click .js-switch-seg'(event) {
    const instance = Template.instance();

    brushModule.state.drawColorId = instance.data.index;
    closeDialog();
  },
  'click .js-seg-showHide'(event) {
    const instance = Template.instance();
    const segIndex = instance.data.index;

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const enabledElementUID = activeEnabledElement.uuid;

    const visible = !instance.data.visible.get();

    brushModule.setters.brushVisibilityForElement(enabledElementUID, segIndex, visible);
    instance.data.visible.set(visible);


    cornerstone.updateImage(activeEnabledElement.element);
  },
  'click .js-seg-delete'(event) {
    const instance = Template.instance();
    const segIndex = instance.data.index;

    // TODO -> open delete dialog with the index said to be deleted.
    // TODO -> Have a wanring and yes/no options.
    // TODO -> Delete and open up segmentation window.
    const segManagementDialog = $('#segManagementDialog');
    const deleteDialog = $('#segDeleteDialog');

    const deleteDialogData = Blaze.getData(document.querySelector('#segDeleteDialog'));

    deleteDialogData.segToBeDeleted.set(segIndex);

    //segManagementDialog.get(0).close();
    deleteDialog.get(0).showModal();

  }
});

function closeDialog () {
  const dialog = $('#segManagementDialog');
  dialog.get(0).close();

  // Reset the focus to the active viewport element
  // This makes the mobile Safari keyboard close
  const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
  element.focus();
}
