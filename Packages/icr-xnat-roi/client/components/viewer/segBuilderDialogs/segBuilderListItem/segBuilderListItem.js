import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const brushModule = cornerstoneTools.store.modules.brush;

Template.segBuilderListItem.helpers({
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
});
