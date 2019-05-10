import React from "react";

export default class WorkingCollectionListItem extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      roiContourIndex,
      metadata,
      onRoiChange,
      onRenameButtonClick,
      activeROIContourIndex
    } = this.props;

    const checked = activeROIContourIndex === roiContourIndex;
    const name = metadata.name;
    const polygonCount = metadata.polygonCount;
    const roiContourColor = metadata.color;

    return (
      <tr>
        <td />
        <td className="left-aligned-cell">
          <i className="fa fa-square" style={{ color: roiContourColor }} />{" "}
          {name}
        </td>
        <td>{polygonCount}</td>
        <td>
          <input
            type="radio"
            checked={checked}
            onChange={() => onRoiChange(roiContourIndex)}
          />
        </td>
        <td>
          <a
            className="btn btn-sm btn-secondary"
            onClick={() => {
              onRenameButtonClick(metadata);
            }}
          >
            <i className="fa fa-wrench" />
          </a>
        </td>
      </tr>
    );
  }
}
