import React from "react";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { sessionMap } from "meteor/icr:series-info-provider";
import generateDateTimeAndLabel from "../../../../lib/util/generateDateTimeAndLabel.js";

const modules = cornerstoneTools.store.modules;

export default class RoiCollectionBuilderDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { dateTime, label } = generateDateTimeAndLabel("AIM");

    this.state = {
      roiContourList: [],
      selectedCheckboxes: [],
      selectAllChecked: true,
      label,
      dateTime
    };

    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);
    this._closeDialog = this._closeDialog.bind(this);
  }

  onTextInputChange(evt) {
    console.log(evt.target.value);

    this._roiCollectionName = evt.target.value;
  }

  onExportButtonClick() {
    const { roiContourList, selectedCheckboxes } = this.state;

    const exportMask = [];

    for (let i = 0; i < roiContourList.length; i++) {
      if (selectedCheckboxes[i]) {
        exportMask[roiContourList[i].index] = true;
      }
    }

    console.log(exportMask);

    // TODO -> use expot mask to fulfill old exportROIs.js functionality.
  }

  onCloseButtonClick() {
    this._closeDialog();
  }

  onChangeSelectAllCheckbox(evt) {
    const selectedCheckboxes = this.state.selectedCheckboxes;
    const checked = evt.target.checked;

    for (let i = 0; i < selectedCheckboxes.length; i++) {
      selectedCheckboxes[i] = checked;
    }

    this.setState({ selectAllChecked: evt.target.checked, selectedCheckboxes });
  }

  onChangeCheckbox(evt, index) {
    const selectedCheckboxes = this.state.selectedCheckboxes;

    selectedCheckboxes[index] = evt.target.checked;
    this.setState({ selectedCheckboxes });
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === "function") {
        cancelablePromises[i].cancel();
      }
    }
  }

  /**
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    if (this.props.id === "NOT_ACTIVE") {
      return;
    }

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    this._seriesInstanceUid = seriesInstanceUid;

    const freehand3DModule = modules.freehand3D;

    let series = freehand3DModule.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DModule.setters.series(seriesInstanceUid);
      series = freehand3DModule.getters.series(seriesInstanceUid);
    }

    const defaultStructureSet = freehand3DModule.getters.structureSet(
      seriesInstanceUid
    );

    const ROIContourCollection = defaultStructureSet.ROIContourCollection;

    const roiContourList = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (
        !ROIContourCollection[i] ||
        ROIContourCollection[i].polygonCount === 0
      ) {
        continue;
      }

      roiContourList.push({
        index: i,
        ROIContourReference: ROIContourCollection[i],
        structureSetReference: defaultStructureSet
      });
    }

    const selectedCheckboxes = [];

    for (let i = 0; i < roiContourList.length; i++) {
      selectedCheckboxes.push(true);
    }

    this.setState({ roiContourList, selectedCheckboxes });
  }

  _closeDialog() {
    const dialog = document.getElementById("roiCollectionBuilderDialog");
    dialog.close();
  }

  render() {
    const {
      roiContourList,
      selectedCheckboxes,
      selectAllChecked,
      label
    } = this.state;

    console.log(roiContourList);

    let roiCollectionBuilderBody = roiContourList.map((roiContour, index) => (
      <tr key={`${roiContour.ROIContourReference.name}_${index}`}>
        <td className="left-aligned-cell">
          <i
            className="fa fa-square"
            style={{ color: roiContour.ROIContourReference.color }}
          />{" "}
          {roiContour.ROIContourReference.name}
        </td>
        <td>
          <input
            type="checkbox"
            onChange={evt => this.onChangeCheckbox(evt, index)}
            checked={selectedCheckboxes[index]}
            value={selectedCheckboxes[index]}
          />
        </td>
        <td>{roiContour.ROIContourReference.polygonCount}</td>
      </tr>
    ));

    return (
      <div>
        <div className="roi-collection-builder-header">
          <h3>Export Contours</h3>
          <a
            className="roi-collection-builder-cancel btn btn-sm btn-secondary"
            onClick={this.onCloseButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>

        <hr />

        <div className="roi-collection-builder-list-body">
          <table>
            <tbody>
              <tr>
                <th nowrap="true" className="left-aligned-cell">
                  Name
                </th>
                <th>
                  Export{" "}
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    value={selectAllChecked}
                    onChange={this.onChangeSelectAllCheckbox}
                  />
                </th>
                <th>Contours</th>
              </tr>
              {roiCollectionBuilderBody}
            </tbody>
          </table>
        </div>

        <div className="roi-collection-builder-footer">
          <label>Name</label>
          <input
            name="roiCollectionBuilderTextInput"
            className="roi-collection-builder-text-input form-themed form-control"
            type="text"
            defaultValue={label}
            onChange={this.onTextInputChange}
            tabIndex="-1"
            autoComplete="off"
          />
          <a
            className="roi-collection-builder-export-button btn btn-sm btn-primary"
            onClick={this.onExportButtonClick}
          >
            <svg stroke="#fff">
              <use xlinkHref="packages/icr_xnat-roi/assets/icons.svg#icon-xnat-export" />
            </svg>
          </a>
        </div>
      </div>
    );
  }
}
