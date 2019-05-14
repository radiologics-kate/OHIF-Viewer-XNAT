import React from "react";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import MaskImporter from "../../../../lib/IO/classes/MaskImporter.js";
import fetchJSON from "../../../../lib/IO/fetchJSON.js";
import fetchXML from "../../../../lib/IO/fetchXML.js";
import fetchArrayBuffer from "../../../../lib/IO/fetchArrayBuffer.js";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { sessionMap } from "meteor/icr:series-info-provider";
import awaitConfirmationDialog from "../../../../lib/dialogUtils/awaitConfirmationDialog.js";

const brushModule = cornerstoneTools.store.modules.brush;

const overwriteConfirmationContent = {
  title: `Warning`,
  body: `
    Loading in another ROICollection will overwrite existing mask data. Are you sure
    you want to do this?
  `
};

export default class MaskImportListDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      selected: 0,
      importListReady: false,
      importList: [],
      importing: false,
      progressText: ""
    };

    this._cancelablePromises = [];
    this._validTypes = validTypes = ["SEG", "NIFTI"];
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );
    this.onChangeRadio = this.onChangeRadio.bind(this);

    this._hasExistingMaskData = this._hasExistingMaskData.bind(this);
    this._updateImportingText = this._updateImportingText.bind(this);
    this._closeDialog = this._closeDialog.bind(this);
  }

  onCloseButtonClick() {
    this._closeDialog();
  }

  onChangeRadio(evt, index) {
    this.setState({ selected: index });
  }

  async onExportButtonClick() {
    // TODO!
    const { importList, selected } = this.state;

    if (this._hasExistingMaskData()) {
      confirmed = await awaitConfirmationDialog(overwriteConfirmationContent);

      if (!confirmed) {
        return;
      }
    }

    this._updateImportingText("");
    this.setState({ importing: true });

    this._importRoiCollection(importList[selected]);
  }

  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @returns {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData() {
    let hasData = false;
    if (
      brushModule.state.import &&
      brushModule.state.import[this._seriesInstanceUid] &&
      brushModule.state.import[this._seriesInstanceUid].label
    ) {
      hasData = true;
    } else {
      const metadata =
        brushModule.state.segmentationMetadata[this._seriesInstanceUid];

      if (metadata) {
        hasData = metadata.some(data => data !== undefined);
      }
    }

    return hasData;
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
      this.setState({ importListReady: true });

      return;
    }

    this._seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();
    this._maskImporter = new MaskImporter(this._seriesInstanceUid);

    const scan = sessionMap.getScan(this._seriesInstanceUid);

    this._experimentId = scan.experimentId;
    this._subjectId = scan.subjectId;
    this._projectId = scan.projectId;

    const cancelablePromise = fetchJSON(
      `/data/archive/projects/${this._projectId}/subjects/${
        this._subjectId
      }/experiments/${this._experimentId}/assessors?format=json`
    );

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(sessionAssessorList => {
        if (!sessionAssessorList) {
          this.setState({ importListReady: true });

          return;
        }

        const assessors = sessionAssessorList.ResultSet.Result;

        if (
          !assessors.some(
            assessor => assessor.xsiType === "icr:roiCollectionData"
          )
        ) {
          // No ROICollections
          this.setState({ importListReady: true });

          return;
        }

        const promises = [];

        for (let i = 0; i < assessors.length; i++) {
          if (assessors[i].xsiType === "icr:roiCollectionData") {
            const cancelablePromise = fetchJSON(
              `/data/archive/projects/${this._projectId}/subjects/${
                this._subjectId
              }/experiments/${this._experimentId}/assessors/${
                assessors[i].ID
              }?format=json`
            );

            this._cancelablePromises.push(cancelablePromise);

            promises.push(cancelablePromise.promise);
          }
        }

        const importList = [];

        Promise.all(promises).then(promisesJSON => {
          promisesJSON.forEach(roiCollectionInfo => {
            const data_fields = roiCollectionInfo.items[0].data_fields;

            if (this._collectionEligibleForImport(roiCollectionInfo)) {
              importList.push({
                collectionType: data_fields.collectionType,
                label: data_fields.label,
                name: data_fields.name,
                getFilesUri: `/data/archive/experiments/${
                  this._experimentId
                }/assessors/${data_fields.ID}/files?format=json`
              });
            }
          });

          this.setState({
            importList,
            importListReady: true,
            selected: 0
          });
        });
      })
      .catch(err => console.log(err));
  }

  _closeDialog() {
    const dialog = document.getElementById("maskImportListDialog");
    dialog.close();
  }

  _updateImportingText(roiCollectionLabel) {
    this.setState({
      progressText: roiCollectionLabel
    });
  }

  async _importRoiCollection(roiCollectionInfo) {
    const roiList = await fetchJSON(roiCollectionInfo.getFilesUri).promise;
    const result = roiList.ResultSet.Result;

    // Reduce count if no associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      this._closeDialog();

      return;
    }

    // Retrieve each ROI from the list that has the same collectionType as the collection.
    // In an ideal world this should always be 1, and any other resources -- if any -- are differently formated representations of the same data, but things happen.
    for (let i = 0; i < result.length; i++) {
      const fileType = result[i].collection;
      if (fileType === roiCollectionInfo.collectionType) {
        this._getAndImportFile(result[i].URI, roiCollectionInfo);
      }
    }
  }

  /** @private @async
   * _getAndImportFile - Imports the file from the REST url and loads it into
   *                     cornerstoneTools toolData.
   *
   * @param  {string} uri             The REST URI of the file.
   * @param  {object} roiCollectionInfo  An object describing the roiCollection to
   *                                  import.
   * @returns {null}
   */
  async _getAndImportFile(uri, roiCollectionInfo) {
    switch (roiCollectionInfo.collectionType) {
      case "SEG":
        this._updateImportingText(roiCollectionInfo.name);

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: roiCollectionInfo.label,
          type: "SEG",
          name: roiCollectionInfo.name,
          modified: false
        };

        const segArrayBuffer = await fetchArrayBuffer(uri).promise;

        this._maskImporter.importDICOMSEG(
          segArrayBuffer,
          roiCollectionInfo.name,
          roiCollectionInfo.label
        );
        break;

      case "NIFTI":
        this._updateImportingText(roiCollectionInfo.name);

        // Store that we've imported a collection for this series.
        if (!brushModule.state.import) {
          brushModule.state.import = {};
        }

        brushModule.state.import[this._seriesInstanceUid] = {
          label: roiCollectionInfo.label,
          type: "NIFTI",
          name: roiCollectionInfo.name,
          modified: false
        };

        const niftiArrayBuffer = await fetchArrayBuffer(uri).promise;

        this._maskImporter.importNIFTI(
          niftiArrayBuffer,
          roiCollectionInfo.name,
          roiCollectionInfo.label
        );
        break;

      default:
        console.error(
          `MaskImportListDialog._getAndImportFile not configured for filetype: ${fileType}.`
        );
    }

    this._closeDialog();
  }

  /** @private
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
      return false;
    }

    // Check the collection references this seriesInstanceUid.
    for (let i = 0; i < children.length; i++) {
      if (children[i].field === "references/seriesUID") {
        const referencedSeriesInstanceUidList = children[i].items;

        for (let j = 0; j < referencedSeriesInstanceUidList.length; j++) {
          const seriesInstanceUid =
            referencedSeriesInstanceUidList[j].data_fields.seriesUID;

          if (seriesInstanceUid === this._seriesInstanceUid) {
            return true;
          }
        }
      }
    }

    return false;
  }

  render() {
    const {
      selected,
      importList,
      importListReady,
      importing,
      progressText
    } = this.state;

    let importBody;

    if (importListReady) {
      if (importing) {
        importBody = (
          <>
            <h5>
              {progressText}
              <i className="fa fa-spin fa-circle-o-notch fa-fw" />
            </h5>
          </>
        );
      } else if (importList.length === 0) {
        importBody = <p>No data to import.</p>;
      } else {
        importBody = (
          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <th>Import</th>
                <th>Type</th>
              </tr>

              {importList.map((roiCollection, index) => (
                <tr key={`${roiCollection.name}_${roiCollection.index}`}>
                  <td className="mask-import-left-cell">
                    {roiCollection.name}
                  </td>
                  <td>
                    <input
                      className="mask-import-list-item-check"
                      type="radio"
                      name="sync"
                      onChange={evt => this.onChangeRadio(evt, index)}
                      checked={selected === index ? true : false}
                      value={selected === index ? true : false}
                    />
                  </td>
                  <td className="mask-import-left-cell">
                    {roiCollection.collectionType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    } else {
      importBody = (
        <h1>
          <i className="fa fa-spin fa-circle-o-notch fa-fw" />
        </h1>
      );
    }

    return (
      <div>
        <div className="mask-import-list-header">
          <h3>Import ROI Collections</h3>
          {importing ? null : (
            <a
              className="mask-import-list-cancel btn btn-sm btn-secondary"
              onClick={this.onCloseButtonClick}
            >
              <i className="fa fa-times-circle fa-2x" />
            </a>
          )}
        </div>
        <hr />
        <div className="mask-import-list-body">{importBody}</div>
        <hr />
        <div className="mask-import-list-footer">
          {importing ? null : (
            <a
              className="mask-import-list-confirm btn btn-sm btn-primary"
              onClick={this.onExportButtonClick}
            >
              <svg stroke="#fff">
                <use xlinkHref="packages/icr_xnat-roi/assets/icons.svg#icon-xnat-import" />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  }
}
