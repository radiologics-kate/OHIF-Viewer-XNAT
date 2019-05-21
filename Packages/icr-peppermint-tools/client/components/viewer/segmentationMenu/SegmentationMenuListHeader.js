import React from "react";
import "./segmentationMenu.styl";

const brushModule = cornerstoneTools.store.modules.brush;

export default class SegmentationMenuListHeader extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { importMetadata } = this.props;

    return (
      <>
        <tr>
          <th
            colSpan="3"
            className="left-aligned-cell segmentation-menu-list-bordered"
          >
            {importMetadata.name}
          </th>
          <th
            colSpan="2"
            className="right-aligned-cell segmentation-menu-list-bordered"
          >
            {importMetadata.label}
          </th>
        </tr>
        {importMetadata.type && (
          <tr>
            <th
              colSpan="3"
              className="left-aligned-cell segmentation-menu-list-bordered"
            >
              Type: {importMetadata.type}
            </th>
            <th
              colSpan="2"
              className="right-aligned-cell segmentation-menu-list-bordered"
            >
              Modified: {importMetadata.modified}
            </th>
          </tr>
        )}
      </>
    );
  }
}
