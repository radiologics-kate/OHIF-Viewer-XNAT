import React from "react";
import SegmentationMenuListItem from "./SegmentationMenuListItem.js";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import {
  newSegmentInput,
  editSegmentInput
} from "../../../../lib/util/brushMetadataIO.js";
import deleteSegment from "../../../../lib/util/deleteSegment.js";
import getBrushSegmentColor from "../../../../lib/util/getBrushSegmentColor.js";

const brushModule = cornerstoneTools.store.modules.brush;

export default class SegmentationMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this.onNewSegmentButtonClick = this.onNewSegmentButtonClick.bind(this);
    this.onSegmentChange = this.onSegmentChange.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onDeleteCancelClick = this.onDeleteCancelClick.bind(this);
    this.onDeleteConfirmClick = this.onDeleteConfirmClick.bind(this);
    this._roiCollectionInfo = this._roiCollectionInfo.bind(this);
    this._visableSegmentsForElement = this._visableSegmentsForElement.bind(
      this
    );
    this._segments = this._segments.bind(this);

    this.state = {
      roiCollectionInfo: { name: "", label: "" },
      segments: [],
      visibleSegments: [],
      deleteConfirmationOpen: false,
      segmentToDelete: 0,
      activeSegmentIndex: 0
    };

    console.log(`TEST:`);
    console.log(this.state);
  }

  componentDidMount() {
    this._seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (!this._seriesInstanceUid) {
      return;
    }

    console.log(`BRUSH MANAGEMENT DIALOG COMPONENT DID MOUNT`);
    console.log(this._seriesInstanceUid);

    const roiCollectionInfo = this._roiCollectionInfo();
    const segments = this._segments();
    const visibleSegments = this._visableSegmentsForElement();

    console.log(segments);

    this.setState({
      roiCollectionInfo,
      segments,
      visibleSegments,
      activeSegmentIndex: brushModule.state.drawColorId
    });
  }

  onNewSegmentButtonClick() {
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    let segmentMetadata =
      brushModule.state.segmentationMetadata[seriesInstanceUid];

    if (!segmentMetadata) {
      brushModule.state.segmentationMetadata[seriesInstanceUid] = [];
      segmentMetadata =
        brushModule.state.segmentationMetadata[seriesInstanceUid];
    }

    const colormap = cornerstone.colors.getColormap(
      brushModule.state.colorMapId
    );
    const numberOfColors = colormap.getNumberOfColors();

    for (let i = 0; i < numberOfColors; i++) {
      if (!segmentMetadata[i]) {
        newSegmentInput(i);
        break;
      }
    }
  }

  onSegmentChange(segmentIndex) {
    brushModule.state.drawColorId = segmentIndex;

    this.setState({ activeSegmentIndex: segmentIndex });
  }

  onShowHideClick(segmentIndex) {
    const { visibleSegments } = this.state;

    visibleSegments[segmentIndex] = !visibleSegments[segmentIndex];

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const enabledElementUID = activeEnabledElement.uuid;

    brushModule.setters.brushVisibilityForElement(
      enabledElementUID,
      segmentIndex,
      visibleSegments[segmentIndex]
    );

    cornerstone.updateImage(activeEnabledElement.element);

    this.setState({ visibleSegments });
  }

  onEditClick(segmentIndex, metadata) {
    editSegmentInput(segmentIndex, metadata);
  }

  onDeleteClick(segmentIndex) {
    //TODO !
    console.log("TODO: Delete");
    this.setState({
      deleteConfirmationOpen: true,
      segmentToDelete: segmentIndex
    });
  }

  onDeleteConfirmClick() {
    const { segmentToDelete } = this.state;

    deleteSegment(this._seriesInstanceUid, segmentToDelete);

    const segments = this._segments();
    const visibleSegments = this._visableSegmentsForElement();

    this.setState({
      deleteConfirmationOpen: false,
      segments,
      visibleSegments
    });
  }

  onDeleteCancelClick() {
    this.setState({
      deleteConfirmationOpen: false
    });
  }

  _roiCollectionInfo() {
    const importInfo = brushModule.state.import;
    const seriesInstanceUid = this._seriesInstanceUid;

    if (importInfo && importInfo[seriesInstanceUid]) {
      const roiCollection = importInfo[seriesInstanceUid];
      return {
        label: roiCollection.label,
        type: roiCollection.type,
        name: roiCollection.name,
        modified: roiCollection.modified ? "true" : " false"
      };
    }

    return {
      name: "New Segmentation Collection",
      label: ""
    };
  }

  _visableSegmentsForElement() {
    const seriesInstanceUid = this._seriesInstanceUid;

    if (!seriesInstanceUid) {
      return;
    }

    const segmentMetadata =
      brushModule.state.segmentationMetadata[seriesInstanceUid];

    const activeEnabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();
    const enabledElementUID = activeEnabledElement.uuid;
    const visible = brushModule.getters.visibleSegmentationsForElement(
      enabledElementUID
    );

    const visableSegmentsForElement = [];

    for (let i = 0; i < visible.length; i++) {
      visableSegmentsForElement.push(visible[i]);
    }

    return visableSegmentsForElement;
  }

  _segments() {
    const seriesInstanceUid = this._seriesInstanceUid;

    console.log(`_segments seriesInstanceUid:`);
    console.log(seriesInstanceUid);

    if (!seriesInstanceUid) {
      return;
    }

    const segmentMetadata =
      brushModule.state.segmentationMetadata[seriesInstanceUid];

    const segments = [];

    if (!segmentMetadata) {
      return segments;
    }

    for (let i = 0; i < segmentMetadata.length; i++) {
      if (segmentMetadata[i]) {
        segments.push({
          index: i,
          metadata: segmentMetadata[i]
        });
      }
    }

    return segments;
  }

  render() {
    const {
      roiCollectionInfo,
      segments,
      visibleSegments,
      deleteConfirmationOpen,
      segmentToDelete,
      activeSegmentIndex
    } = this.state;

    console.log("BurshManagementDialog render:");
    console.log(segments);

    const segmentRows = segments.map(segment => (
      <SegmentationMenuListItem
        key={`${segment.metadata.SegmentLabel}_${segment.index}`}
        segmentIndex={segment.index}
        metadata={segment.metadata}
        visible={visibleSegments[segment.index]}
        onSegmentChange={this.onSegmentChange}
        onShowHideClick={this.onShowHideClick}
        onEditClick={this.onEditClick}
        onDeleteClick={this.onDeleteClick}
        checked={segment.index === activeSegmentIndex}
      />
    ));

    let brushManagementDialogBody;

    if (deleteConfirmationOpen) {
      const segmentColor = getBrushSegmentColor(segmentToDelete);
      const segmentLabel = segments.find(
        segment => segment.index === segmentToDelete
      ).metadata.SegmentLabel;

      return (
        <>
          <div>
            <h5>Warning!</h5>
            <p>
              Are you sure you want to delete {segmentLabel}? This cannot be
              undone.
            </p>
          </div>
          <div className="seg-delete-horizontal-box">
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onDeleteConfirmClick}
            >
              <i className="fa fa fa-check-circle fa-2x" />
            </a>
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onDeleteCancelClick}
            >
              <i className="fa fa fa-times-circle fa-2x" />
            </a>
          </div>
        </>
      );
    }

    return (
      <div className="segmentation-menu-component">
        <h3>Segments</h3>
        <div className="segmentation-menu-list">
          <table className="peppermint-table">
            <tbody>
              <tr>
                <th colSpan="3" className="left-aligned-cell">
                  {roiCollectionInfo.name}
                </th>
                <th colSpan="2" className="right-aligned-cell">
                  {roiCollectionInfo.label}
                </th>
              </tr>
              {roiCollectionInfo.type && (
                <tr>
                  <th colSpan="3" className="left-aligned-cell">
                    Type: {roiCollectionInfo.type}
                  </th>
                  <th colSpan="2" className="right-aligned-cell">
                    Modified: {roiCollectionInfo.modified}
                  </th>
                </tr>
              )}

              <tr className="segmentation-menu-list-bordered">
                <th>Paint</th>
                <th>Label</th>
                <th className="centered-cell">Type</th>
                <th className="centered-cell">Hide</th>
                <th className="centered-cell">Delete</th>
              </tr>

              {segmentRows}
              <tr>
                <th />
                <th>
                  <a
                    className="segmentation-menu-new-button btn btn-sm btn-primary"
                    onClick={this.onNewSegmentButtonClick}
                  >
                    <i className="fa fa-plus-circle" /> Segment
                  </a>
                </th>
              </tr>
            </tbody>
          </table>
        </div>
        <div />
      </div>
    );
  }
}
