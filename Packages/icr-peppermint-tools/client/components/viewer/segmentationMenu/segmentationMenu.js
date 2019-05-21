import React from "react";
import SegmentationMenuListItem from "./SegmentationMenuListItem.js";
import BrushSettings from "./BrushSettings.js";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import getActiveSeriesInstanceUid from "../../../lib/util/getActiveSeriesInstanceUid.js";
import {
  newSegmentInput,
  editSegmentInput
} from "../../../lib/util/brushMetadataIO.js";
import deleteSegment from "../../../lib/util/deleteSegment.js";
import onIOCancel from "../helpers/onIOCancel.js";
import onImportButtonClick from "../helpers/onImportButtonClick.js";
import onExportButtonClick from "../helpers/onExportButtonClick.js";
import getBrushSegmentColor from "../../../lib/util/getBrushSegmentColor.js";
import "./segmentationMenu.styl";

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
    this.onImportButtonClick = onImportButtonClick.bind(this);
    this.onExportButtonClick = onExportButtonClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this._importMetadata = this._importMetadata.bind(this);
    this._visableSegmentsForElement = this._visableSegmentsForElement.bind(
      this
    );
    this._segments = this._segments.bind(this);

    this.state = {
      importMetadata: { name: "", label: "" },
      segments: [],
      visibleSegments: [],
      deleteConfirmationOpen: false,
      segmentToDelete: 0,
      activeSegmentIndex: 0,
      importing: false,
      exporting: false
    };
  }

  componentDidMount() {
    this._seriesInstanceUid = getActiveSeriesInstanceUid();

    if (!this._seriesInstanceUid) {
      return;
    }

    const importMetadata = this._importMetadata();
    const segments = this._segments();
    const visibleSegments = this._visableSegmentsForElement();

    this.setState({
      importMetadata,
      segments,
      visibleSegments,
      activeSegmentIndex: brushModule.state.drawColorId
    });
  }

  onIOComplete() {
    const importMetadata = this._importMetadata();
    const segments = this._segments();
    const visibleSegments = this._visableSegmentsForElement();

    this.setState({
      importMetadata,
      segments,
      visibleSegments,
      activeSegmentIndex: brushModule.state.drawColorId,
      importing: false,
      exporting: false
    });
  }

  onNewSegmentButtonClick() {
    const seriesInstanceUid = getActiveSeriesInstanceUid();

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

  _importMetadata() {
    const seriesInstanceUid = this._seriesInstanceUid;
    const importMetadata = brushModule.getters.importMetadata(
      seriesInstanceUid
    );

    if (importMetadata) {
      return {
        label: importMetadata.label,
        type: importMetadata.type,
        name: importMetadata.name,
        modified: importMetadata.modified ? "true" : " false"
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
      importMetadata,
      segments,
      visibleSegments,
      deleteConfirmationOpen,
      segmentToDelete,
      activeSegmentIndex,
      importing,
      exporting
    } = this.state;

    const { ImportCallbackOrComponent, ExportCallbackOrComponent } = this.props;

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
        ImportCallbackOrComponent
        ExportCallbackOrComponent
      />
    ));

    let brushManagementDialogBody;

    if (deleteConfirmationOpen) {
      const segmentColor = getBrushSegmentColor(segmentToDelete);
      const segmentLabel = segments.find(
        segment => segment.index === segmentToDelete
      ).metadata.SegmentLabel;

      return (
        <div>
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
        </div>
      );
    }

    if (importing) {
      return (
        <ImportCallbackOrComponent
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
        />
      );
    }

    if (exporting) {
      return (
        <ExportCallbackOrComponent
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
        />
      );
    }

    let ioMenu;

    if (ImportCallbackOrComponent || ExportCallbackOrComponent) {
      ioMenu = (
        <div>
          {ImportCallbackOrComponent && (
            <a
              className="btn btn-sm btn-primary roi-contour-menu-io-button"
              onClick={this.onImportButtonClick}
            >
              Import
            </a>
          )}
          {ExportCallbackOrComponent && (
            <a
              className="btn btn-sm btn-primary roi-contour-menu-io-button"
              onClick={this.onExportButtonClick}
            >
              Export
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="segmentation-menu-component">
        <div className="segmentation-menu-list">
          <div className="segmentation-menu-header">
            <h3>Segments</h3>
            {ioMenu}
          </div>
          <table className="peppermint-table">
            <tbody>
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
        <div className="segmentation-menu-footer">
          <BrushSettings />
        </div>
      </div>
    );
  }
}
