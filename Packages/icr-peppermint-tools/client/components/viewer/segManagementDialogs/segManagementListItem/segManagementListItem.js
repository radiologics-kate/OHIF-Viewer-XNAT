import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import brushMetadataIO from '../../../../lib/util/brushMetadataIO.js';

const brushModule = cornerstoneTools.store.modules.brush;

Template.segManagementListItem.helpers({
  color: () => {
    const instance = Template.instance();
    const data = instance.data;
    const segIndex = data.index;

    console.log(`segIndex: ${segIndex}`);

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

    console.log(segIndex);

    closeDialog();

    brushMetadataIO(
      segIndex,
      label,
      type,
      modifier
    );

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
