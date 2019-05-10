import React from "react";
import WorkingCollectionList from "./WorkingCollectionList.js";
import LockedCollectionsList from "./LockedCollectionsList.js";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import {
  createNewVolume,
  setVolumeName
} from "../../../../lib/util/freehandNameIO.js";
import volumeManagement from "../../../../lib/util/volumeManagement.js";
import unlockStructureSet from "../../../../lib/util/unlockStructureSet.js";

const modules = cornerstoneTools.store.modules;

export default class RoiManagementDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      workingCollection: [],
      lockedCollections: [],
      unlockConfirmationOpen: false,
      roiCollectionToUnlock: ""
    };

    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onNewRoiButtonClick = this.onNewRoiButtonClick.bind(this);
    this.onRoiChange = this.onRoiChange.bind(this);
    this.onRenameButtonClick = this.onRenameButtonClick.bind(this);
    this.onUnlockClick = this.onUnlockClick.bind(this);
    this.onUnlockCancelClick = this.onUnlockCancelClick.bind(this);
    this.onUnlockConfirmClick = this.onUnlockConfirmClick.bind(this);
    this._workingCollection = this._workingCollection.bind(this);
    this._lockedCollections = this._lockedCollections.bind(this);
    this._closeDialog = this._closeDialog.bind(this);
  }

  componentDidMount() {
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    if (!seriesInstanceUid) {
      return;
    }

    this._seriesInstanceUid = seriesInstanceUid;

    const workingCollection = this._workingCollection();
    const lockedCollections = this._lockedCollections();

    this.setState({ workingCollection, lockedCollections });
  }

  onCancelButtonClick() {
    this._closeDialog();
  }

  onNewRoiButtonClick() {
    createNewVolume();
    this._closeDialog();
  }

  onRoiChange(roiContourIndex) {
    modules.freehand3D.setters.activeROIContourIndex(
      roiContourIndex,
      this._seriesInstanceUid
    );

    this._closeDialog();
  }

  onRenameButtonClick(metadata) {
    const seriesInstanceUid = this._seriesInstanceUid;

    const callback = () => {
      const workingCollection = this._workingCollection();

      this.setState({ workingCollection });
    };

    // TODO -> Just do this inside the dialog.
    setVolumeName(this._seriesInstanceUid, "DEFAULT", metadata.uid, callback);
  }

  onUnlockClick(structureSetUid) {
    console.log(structureSetUid);

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

    console.log(
      `UNLOCK structureSet: ${
        this._seriesInstanceUid
      }, ${roiCollectionToUnlock}`
    );

    unlockStructureSet(this._seriesInstanceUid, roiCollectionToUnlock);

    const workingCollection = this._workingCollection();
    const lockedCollections = this._lockedCollections();

    this.setState({
      unlockConfirmationOpen: false,
      workingCollection,
      lockedCollections
    });
  }

  _closeDialog() {
    const dialog = document.getElementById("roiManagementDialog");

    dialog.close();
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
      roiCollectionToUnlock
    } = this.state;

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

    console.log("WORKING COLLECTION");
    console.log(workingCollection);
    console.log(lockedCollections);

    let workingCollectionList;

    if (workingCollection.length) {
      const activeROIContourIndex = freehand3DStore.getters.activeROIContourIndex(
        this._seriesInstanceUid
      );

      workingCollectionList = workingCollection.length && (
        <WorkingCollectionList
          workingCollection={workingCollection}
          activeROIContourIndex={activeROIContourIndex}
          onRoiChange={this.onRoiChange}
          onRenameButtonClick={this.onRenameButtonClick}
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
      <div>
        <div className="roi-management-header">
          <h3>Regions of Interest</h3>
          <a
            className="roi-management-cancel btn btn-sm btn-secondary"
            onClick={this.onCancelButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>
        <div className="roi-management-collection-list-body">
          <table className="peppermint-table">
            <tbody>
              {workingCollectionList}
              {lockedCollectionsList}
            </tbody>
          </table>
        </div>
        <a
          className="roi-management-new-button btn btn-sm btn-primary"
          onClick={this.onNewRoiButtonClick}
        >
          <i className="fa fa-plus-circle" /> ROI
        </a>{" "}
      </div>
    );
  }
}
