import React from "react";
import WorkingCollectionList from "./WorkingCollectionList.js";
import LockedCollectionsList from "./LockedCollectionsList.js";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import getActiveSeriesInstanceUid from "../../../lib/util/getActiveSeriesInstanceUid.js";
import {
  createNewVolume,
  setVolumeName
} from "../../../lib/util/freehandNameIO.js";
import unlockStructureSet from "../../../lib/util/unlockStructureSet.js";
import "./roiContourMenu.styl";

const modules = cornerstoneTools.store.modules;

//

export default class roiContourMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    const { interpolate, displayStats } = modules.freehand3D.state;

    this.state = {
      workingCollection: [],
      lockedCollections: [],
      unlockConfirmationOpen: false,
      roiCollectionToUnlock: "",
      activeROIContourIndex: 0,
      interpolate,
      displayStats,
      importing: false,
      exporting: false
    };

    this.onNewRoiButtonClick = this.onNewRoiButtonClick.bind(this);
    this.onRoiChange = this.onRoiChange.bind(this);
    this.onRenameButtonClick = this.onRenameButtonClick.bind(this);
    this.onUnlockClick = this.onUnlockClick.bind(this);
    this.onUnlockCancelClick = this.onUnlockCancelClick.bind(this);
    this.onUnlockConfirmClick = this.onUnlockConfirmClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = this.onIOCancel.bind(this);
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
    this.onDisplayStatsToggleClick = this.onDisplayStatsToggleClick.bind(this);
    this.onInterpolateToggleClick = this.onInterpolateToggleClick.bind(this);
    this._workingCollection = this._workingCollection.bind(this);
    this._lockedCollections = this._lockedCollections.bind(this);
  }

  onIOComplete() {
    const freehand3DStore = modules.freehand3D;

    let activeROIContourIndex = 0;

    const seriesInstanceUid = this._seriesInstanceUid;

    if (modules.freehand3D.getters.series(seriesInstanceUid)) {
      activeROIContourIndex = freehand3DStore.getters.activeROIContourIndex(
        seriesInstanceUid
      );
    }

    const workingCollection = this._workingCollection();
    const lockedCollections = this._lockedCollections();

    this.setState({
      workingCollection,
      lockedCollections,
      activeROIContourIndex,
      importing: false,
      exporting: false
    });
  }

  onIOCancel() {
    this.setState({
      importing: false,
      exporting: false
    });
  }

  onImportButtonClick() {
    const { ImportCallbackOrComponent } = this.props;

    if (ImportCallbackOrComponent.prototype.isReactComponent) {
      this.setState({ importing: true });
    } else {
      ImportCallbackOrComponent();
    }
  }

  onExportButtonClick() {
    const { ExportCallbackOrComponent } = this.props;

    if (ExportCallbackOrComponent.prototype.isReactComponent) {
      this.setState({ exporting: true });
    } else {
      ExportCallbackOrComponent();
    }
  }

  onDisplayStatsToggleClick() {
    modules.freehand3D.setters.toggleDisplayStats();

    this.setState({ displayStats: modules.freehand3D.state.displayStats });
  }

  onInterpolateToggleClick() {
    modules.freehand3D.setters.toggleInterpolate();

    this.setState({ interpolate: modules.freehand3D.state.interpolate });
  }

  componentDidMount() {
    const seriesInstanceUid = getActiveSeriesInstanceUid();

    if (!seriesInstanceUid) {
      return;
    }

    this._seriesInstanceUid = seriesInstanceUid;

    const freehand3DStore = modules.freehand3D;

    let activeROIContourIndex = 0;

    if (modules.freehand3D.getters.series(seriesInstanceUid)) {
      activeROIContourIndex = freehand3DStore.getters.activeROIContourIndex(
        this._seriesInstanceUid
      );
    }

    const workingCollection = this._workingCollection();
    const lockedCollections = this._lockedCollections();

    this.setState({
      workingCollection,
      lockedCollections,
      activeROIContourIndex
    });
  }

  onNewRoiButtonClick() {
    const callback = name => {
      // Create and activate new ROIContour
      const seriesInstanceUid = this._seriesInstanceUid;

      //Check if default structureSet exists for this series.
      if (!modules.freehand3D.getters.series(seriesInstanceUid)) {
        modules.freehand3D.setters.series(seriesInstanceUid);
      }

      const activeROIContourIndex = modules.freehand3D.setters.ROIContourAndSetIndexActive(
        seriesInstanceUid,
        "DEFAULT",
        name
      );

      const workingCollection = this._workingCollection();

      this.setState({ workingCollection, activeROIContourIndex });
    };

    createNewVolume(callback);
  }

  onRoiChange(roiContourIndex) {
    modules.freehand3D.setters.activeROIContourIndex(
      roiContourIndex,
      this._seriesInstanceUid
    );

    this.setState({ activeROIContourIndex: roiContourIndex });
  }

  onRenameButtonClick(metadata) {
    const seriesInstanceUid = this._seriesInstanceUid;

    const callback = () => {
      const workingCollection = this._workingCollection();

      this.setState({ workingCollection });
    };

    setVolumeName(this._seriesInstanceUid, "DEFAULT", metadata.uid, callback);
  }

  onUnlockClick(structureSetUid) {
    this.setState({
      unlockConfirmationOpen: true,
      roiCollectionToUnlock: structureSetUid
    });
  }

  onUnlockCancelClick() {
    this.setState({ unlockConfirmationOpen: false });
  }

  onUnlockConfirmClick() {
    const { roiCollectionToUnlock } = this.state;

    unlockStructureSet(this._seriesInstanceUid, roiCollectionToUnlock);

    const workingCollection = this._workingCollection();
    const lockedCollections = this._lockedCollections();

    this.setState({
      unlockConfirmationOpen: false,
      workingCollection,
      lockedCollections
    });
  }

  _workingCollection() {
    const freehand3DStore = modules.freehand3D;
    const seriesInstanceUid = this._seriesInstanceUid;

    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const structureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid
    );

    const ROIContourCollection = structureSet.ROIContourCollection;

    const workingCollection = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (ROIContourCollection[i]) {
        workingCollection.push({
          index: i,
          metadata: ROIContourCollection[i]
        });
      }
    }

    return workingCollection;
  }

  _lockedCollections() {
    const freehand3DStore = modules.freehand3D;
    const seriesInstanceUid = this._seriesInstanceUid;

    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const structureSetCollection = series.structureSetCollection;
    const lockedCollections = [];

    for (let i = 0; i < structureSetCollection.length; i++) {
      const structureSet = structureSetCollection[i];

      if (structureSet.uid === "DEFAULT") {
        continue;
      }

      const ROIContourCollection = structureSet.ROIContourCollection;
      const ROIContourArray = [];

      for (let j = 0; j < ROIContourCollection.length; j++) {
        if (ROIContourCollection[j]) {
          ROIContourArray.push({
            index: j,
            metadata: ROIContourCollection[j]
          });
        }
      }

      lockedCollections.push({
        metadata: structureSet,
        ROIContourArray
      });
    }

    return lockedCollections;
  }

  render() {
    const {
      workingCollection,
      lockedCollections,
      unlockConfirmationOpen,
      roiCollectionToUnlock,
      activeROIContourIndex,
      interpolate,
      displayStats,
      importing,
      exporting
    } = this.state;

    const { ImportCallbackOrComponent, ExportCallbackOrComponent } = this.props;
    const freehand3DStore = modules.freehand3D;

    if (unlockConfirmationOpen) {
      const collection = freehand3DStore.getters.structureSet(
        this._seriesInstanceUid,
        roiCollectionToUnlock
      );

      const collectionName = collection.name;

      return (
        <div>
          <div>
            <h5>Unlock</h5>
            <p>
              Unlock {collectionName} for editing? The ROIs will be moved to the
              Working ROI Collection.
            </p>
          </div>
          <div>
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onUnlockConfirmClick}
            >
              <i className="fa fa fa-check-circle fa-2x" />
            </a>
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onUnlockCancelClick}
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

    let workingCollectionList;

    if (this._seriesInstanceUid) {
      workingCollectionList = (
        <WorkingCollectionList
          workingCollection={workingCollection}
          activeROIContourIndex={activeROIContourIndex}
          onRoiChange={this.onRoiChange}
          onRenameButtonClick={this.onRenameButtonClick}
          onNewRoiButtonClick={this.onNewRoiButtonClick}
        />
      );
    }

    const lockedCollectionsList = lockedCollections.length ? (
      <LockedCollectionsList
        lockedCollections={lockedCollections}
        onUnlockClick={this.onUnlockClick}
        seriesInstanceUid={this._seriesInstanceUid}
      />
    ) : null;

    return (
      <div className="roi-contour-menu-component">
        <div className="roi-contour-menu-header">
          <h3>ROI Contour Collections</h3>
          {ioMenu}
        </div>
        <div className="roi-contour-menu-collection-list-body">
          <table className="peppermint-table">
            <tbody>
              {workingCollectionList}
              {lockedCollectionsList}
            </tbody>
          </table>
        </div>
        <div className="roi-contour-menu-footer">
          <h3>Settings</h3>
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onInterpolateToggleClick}
          >
            <div className="roi-contour-menu-option">
              <svg>
                <use
                  xlinkHref={
                    interpolate
                      ? "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-interpolate-on"
                      : "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-interpolate-off"
                  }
                />
              </svg>
              <label>Interpolation</label>
            </div>
          </a>
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onDisplayStatsToggleClick}
          >
            <div className="roi-contour-menu-option">
              <svg>
                <use
                  xlinkHref={
                    displayStats
                      ? "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-stats-on"
                      : "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-stats-off"
                  }
                />
              </svg>
              <label>Stats</label>
            </div>
          </a>
        </div>
      </div>
    );
  }
}
