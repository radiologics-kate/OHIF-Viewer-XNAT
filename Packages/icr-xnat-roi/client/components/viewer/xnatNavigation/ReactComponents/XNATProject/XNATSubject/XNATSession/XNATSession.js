import React from "react";
import XNATSessionLabel from "./XNATSessionLabel.js";
import fetchJSON from "../../../helpers/fetchJSON.js";
import checkSessionJSONExists from "../../../helpers/checkSessionJSONExists.js";
import navigateConfirmationContent from "../../../helpers/navigateConfirmationContent.js";
import { getUnsavedRegions } from "meteor/icr:peppermint-tools";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import awaitConfirmationDialog from "../../../../../../../lib/IO/awaitConfirmationDialog.js";
import progressDialog from "../../../../../../../lib/util/progressDialog.js";

export default class XNATSession extends React.Component {
  constructor(props) {
    super(props);

    const active =
      this.props.projectId === icrXnatRoiSession.get("projectId") &&
      this.props.subjectId === icrXnatRoiSession.get("subjectId") &&
      this.props.ID === icrXnatRoiSession.get("experimentId");

    const shared = this.props.parentProjectId !== this.props.projectId;

    this.state = {
      active,
      shared,
      hasRois: false,
      maskCount: 0,
      contourCount: 0
    };

    this.onViewSessionClick = this.onViewSessionClick.bind(this);

    this._cancelablePromises = [];

    this._fetchROICollectionInfo();
  }

  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === "function") {
        cancelablePromises[i].cancel();
      }
    }
  }

  render() {
    const { ID, label, parentProjectId } = this.props;
    const { active, shared, hasRois, maskCount, contourCount } = this.state;
    const sessionButtonClassNames = this._getSessionButtonClassNames();

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a
            className={sessionButtonClassNames}
            onClick={this.onViewSessionClick}
          >
            <i className="fa fa-eye" />
          </a>
          <XNATSessionLabel
            ID={ID}
            label={label}
            active={active}
            shared={shared}
            parentProjectId={parentProjectId}
            hasRois={hasRois}
            maskCount={maskCount}
            contourCount={contourCount}
          />
        </div>
      </>
    );
  }

  async onViewSessionClick() {
    if (this.state.active) {
      return;
    }

    const unsavedRegions = getUnsavedRegions();

    console.log(unsavedRegions);

    if (unsavedRegions.hasUnsavedRegions) {
      console.log(unsavedRegions);

      const content = navigateConfirmationContent(unsavedRegions);

      awaitConfirmationDialog(content).then(result => {
        if (result === true) {
          this._checkJSONandloadRoute();
        }
      });
      return;
    } else {
      this._checkJSONandloadRoute();
    }
  }

  _checkJSONandloadRoute() {
    const { projectId, subjectId, ID } = this.props;
    const cancelablePromise = checkSessionJSONExists(projectId, subjectId, ID);

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(result => {
        if (result === true) {
          this._loadRoute();
        } else {
          this._generateSessionMetadata();
        }
      })
      .catch(err => console.log(err));
  }

  _loadRoute() {
    const { projectId, subjectId, ID, label, parentProjectId } = this.props;

    let params = `?subjectId=${subjectId}&projectId=${projectId}&experimentId=${ID}&experimentLabel=${label}`;

    if (parentProjectId !== projectId) {
      //Shared Project
      params += `&parentProjectId=${parentProjectId}`;
    }

    const url = `${Session.get("rootUrl")}/VIEWER${params}`;

    console.log(url);

    window.location.href = url;
  }

  _generateSessionMetadata() {
    const { projectId, subjectId, ID, label } = this.props;
    const rootUrl = Session.get("rootUrl");

    // Generate metadata
    progressDialog.show({
      notificationText: `generating metadata for ${label}...`
    });

    const cancelablePromise = fetchJSON(
      `/xapi/viewer/projects/${projectId}/experiments/${ID}`
    );

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(result => {
        console.log("generatedJSON:");
        console.log(result);

        if (result) {
          this._loadRoute();
        } else {
          progressDialog.close();
        }
      })
      .catch(err => console.log(err));
  }

  _getSessionButtonClassNames() {
    let sessionButtonClassNames =
      "btn btn-sm btn-primary xnat-nav-button xnat-nav-session";

    if (this.state.active) {
      sessionButtonClassNames += " xnat-nav-button-disabled";
    }

    return sessionButtonClassNames;
  }

  _fetchROICollectionInfo() {
    const cancelablePromise = fetchJSON(
      `/data/archive/projects/${this.props.projectId}/subjects/${
        this.props.subjectId
      }/experiments/${this.props.ID}/assessors?format=json`
    );

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(result => {
        if (!result) {
          return;
        }

        const assessors = result.ResultSet.Result;

        if (
          assessors.some(
            assessor => assessor.xsiType === "icr:roiCollectionData"
          )
        ) {
          console.log("has ROIs!");
          this.setState({ hasRois: true });
        }

        this._getRoiCollectionCounts(result.ResultSet.Result);
      })
      .catch(err => console.log(err));
  }

  _getRoiCollectionCounts(assessors) {
    const promises = [];

    for (let i = 0; i < assessors.length; i++) {
      if (assessors[i].xsiType === "icr:roiCollectionData") {
        const cancelablePromise = fetchJSON(
          `/data/archive/projects/${this.props.projectId}/subjects/${
            this.props.subjectId
          }/experiments/${this.props.ID}/assessors/${
            assessors[i].ID
          }?format=json`
        );

        this._cancelablePromises.push(cancelablePromise);

        promises.push(cancelablePromise.promise);
      }
    }

    let maskCount = 0;
    let contourCount = 0;

    Promise.all(promises).then(promisesJSON => {
      promisesJSON.forEach(roiCollectionInfo => {
        const type = roiCollectionInfo.items[0].data_fields.collectionType;

        switch (type) {
          case "RTSTRUCT":
          case "AIM":
            contourCount++;
            break;
          case "SEG":
          case "NIFTI":
            maskCount++;
            break;
        }
      });

      this.setState({
        maskCount,
        contourCount
      });
    });
  }
}
