import React from "react";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";

const brushModule = cornerstoneTools.store.modules.brush;

export default class MaskExportListItem extends React.Component {
  constructor(props = {}) {
    super(props);

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

    if (!activeEnabledElement) {
      return [];
    }
    const activeElement = activeEnabledElement.element;

    this._colormap = brushModule.getters.activeCornerstoneColorMap(
      activeElement
    );

    this._getColor = this._getColor.bind(this);
  }

  _getColor(segIndex) {
    const colorArray = this._colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  }

  render() {
    const { segIndex, metadata } = this.props;

    const SegmentedPropertyTypeCodeSequence =
      metadata.SegmentedPropertyTypeCodeSequence;

    let type = SegmentedPropertyTypeCodeSequence.CodeMeaning;

    if (
      SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence
    ) {
      const modifier =
        SegmentedPropertyTypeCodeSequence
          .SegmentedPropertyTypeModifierCodeSequence.CodeMeaning;

      type += ` (${modifier})`;
    }

    return (
      <tr>
        <td className="left-aligned-cell">
          <i
            className="fa fa-square"
            style={{ color: this._getColor(segIndex) }}
          />
          {metadata.SegmentLabel}
        </td>
        <td>{metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning}</td>
        <td>{type}</td>
      </tr>
    );
  }
}
