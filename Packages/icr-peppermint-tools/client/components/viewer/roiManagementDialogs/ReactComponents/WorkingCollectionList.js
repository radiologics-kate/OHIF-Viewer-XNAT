import React from "react";
import WorkingCollectionListItem from "./WorkingCollectionListItem.js";

export default class WorkingRoiCollectionList extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      workingCollection,
      activeROIContourIndex,
      onRoiChange,
      onRenameButtonClick
    } = this.props;

    return (
      <>
        <tr className="roi-list-header">
          <th />
          <th colSpan="4"> Working ROI Collection</th>
        </tr>

        <tr>
          <th />
          <th>Name</th>
          <th className="centered-cell">Contours</th>
          <th className="centered-cell">Active</th>
          <th className="centered-cell">Rename</th>
        </tr>

        {workingCollection.map(roiContour => (
          <WorkingCollectionListItem
            key={roiContour.metadata.uid}
            roiContourIndex={roiContour.index}
            metadata={roiContour.metadata}
            activeROIContourIndex={activeROIContourIndex}
            onRoiChange={onRoiChange}
            onRenameButtonClick={onRenameButtonClick}
          />
        ))}
      </>
    );
  }
}
