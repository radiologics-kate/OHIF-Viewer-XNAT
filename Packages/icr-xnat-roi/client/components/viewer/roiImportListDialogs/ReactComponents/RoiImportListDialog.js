import React from "react";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { cornerstoneTools } from "meteor/ohif:cornerstone";

const modules = cornerstoneTools.store.modules;

export default class RoiImportListDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    selectedCheckboxes = [];

    this.state = {
      selectAllChecked: true,
      selectedCheckboxes,
      importListReady: false,
      importList: [],
      importing: false
    };

    this._validTypes = validTypes = ["AIM", "RTSTRUCT"];
    this._seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    this._volumeManagementLabels = this._getVolumeManagementLabels();
    this._experimentId = sessionMap.get(
      this._seriesInstanceUid,
      "experimentId"
    );
    this._subjectId = sessionMap.get(this._seriesInstanceUid, "subjectId");
    this._projectId = sessionMap.get(this._seriesInstanceUid, "projectId");

    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
  }

  /**
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    fetchJSON(
      `/data/archive/projects/${this._projectId}/subjects/${
        this._subjectId
      }/experiments/${this._experimentId}/assessors?format=json`
    )
      .promise.then(sessionAssessorList => {
        if (!sessionAssessorList) {
          this.setState({ importListReady });

          return;
        }
      })
      .catch(err => console.log(err));
  }

  /** @private
   * _getVolumeManagementLabels - Construct a list of roiCollections
   *                               already imported.
   *
   * @returns {string[]} An array of the labels of roiCollections already imported.
   */
  _getVolumeManagementLabels() {
    const freehand3DStore = modules.freehand3D;
    const structureSetUids = [];

    const series = freehand3DStore.getters.series(this.state.seriesInstanceUid);

    if (!series) {
      return structureSetUids;
    }

    const structureSetCollection = series.structureSetCollection;

    for (let i = 0; i < structureSetCollection.length; i++) {
      const label = structureSetCollection[i].uid;

      if (label !== "DEFAULT") {
        structureSetUids.push(label);
      }
    }

    return structureSetUids;
  }

  onChangeCheckbox(evt, index) {
    console.log(`onChangeCheckbox:`);
    console.log(index);
    console.log(evt);

    console.log(evt.target.checked);

    const selectedCheckboxes = this.state.selectedCheckboxes;

    selectedCheckboxes[index] = evt.target.checked;

    this.setState({ selectedCheckboxes });
  }

  onChangeSelectAllCheckbox(evt) {
    const selectedCheckboxes = this.state.selectedCheckboxes;
    const checked = evt.target.checked;

    console.log(checked);

    for (let i = 0; i < selectedCheckboxes.length; i++) {
      selectedCheckboxes[i] = checked;
    }

    this.setState({ selectAllChecked: evt.target.checked, selectedCheckboxes });
  }

  render() {
    const {
      selectAllChecked,
      selectedCheckboxes,
      importList,
      importListReady
    } = this.state;

    console.log("importList:");
    console.log(importList);

    console.log(selectedCheckboxes);

    let importListBody;

    if (importListReady) {
      if (importList.length) {
        importListBody = (
          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <th>
                  Import{" "}
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    value={selectAllChecked}
                    onChange={this.onChangeSelectAllCheckbox}
                  />
                </th>
                <th>Type</th>
              </tr>

              {importList.map((roiCollection, index) => (
                <tr key={`${roiCollection.name}_${roiCollection.index}`}>
                  <td className="roi-import-left-cell">{roiCollection.name}</td>
                  <td>
                    <input
                      className="roi-import-list-item-check"
                      type="checkbox"
                      name="sync"
                      onChange={evt => this.onChangeCheckbox(evt, index)}
                      checked={selectedCheckboxes[index]}
                      value={selectedCheckboxes[index]}
                    />
                  </td>
                  <td className="roi-import-left-cell">
                    {roiCollection.collectionType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        <p>No data to import.</p>;
      }
    } else {
      importListBody = (
        <h1>
          <i className="fa fa-spin fa-circle-o-notch fa-fw" />
        </h1>
      );
    }

    return (
      <div>
        <div className="roi-import-list-header">
          <h3>Import ROI Collections</h3>
          <a
            className="roi-import-list-cancel btn btn-sm btn-secondary"
            onClick={this.onCloseButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>
        <hr />
        <div className="roi-import-list-body">{importListBody}</div>
        <hr />
        <div className="roi-import-list-footer">
          <a className="roi-import-list-confirm btn btn-sm btn-primary">
            <svg stroke="#fff">
              <use xlinkHref="packages/icr_xnat-roi/assets/icons.svg#icon-xnat-import" />
            </svg>
          </a>
        </div>
      </div>
    );
  }
}
