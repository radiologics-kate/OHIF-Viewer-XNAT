import React from "react";
import XNATSessionLabel from "./XNATSessionLabel.js";
import fetchJSON from "../../../helpers/fetchJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

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
      maskCount: 0,
      contourCount: 0
    };

    this.onViewSessionClick = this.onViewSessionClick.bind(this);

    this._fetchROICollectionInfo();
  }

  render() {
    const { ID, label, parentProjectId } = this.props;
    const { active, shared, maskCount, contourCount } = this.state;
    const sessionButtonClassNames = this._getSessionButtonClassNames();

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <i className="fa fa-caret-right xnat-nav-session-caret" />
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
            maskCount={maskCount}
            contourCount={contourCount}
          />
        </div>
      </>
    );
  }

  onViewSessionClick() {
    if (this.state.active) {
      return;
    }

    const { projectId, subjectId, ID, label, parentProjectId } = this.props;
    let params = `?subjectId=${subjectId}&projectId=${projectId}&experimentId=${ID}&experimentLabel=${label}`;

    if (parentProjectId !== projectId) {
      //Shared Project
      params += `&parentProjectId=${parentProjectId}`;
    }

    const rootUrl = Session.get("rootUrl");
    const url = `${rootUrl}/VIEWER${params}`;

    console.log(url);

    window.location.href = url;
  }

  _getSessionButtonClassNames() {
    let sessionButtonClassNames = "btn btn-sm btn-primary xnat-nav-button";

    if (this.state.active) {
      sessionButtonClassNames += " xnat-nav-button-disabled";
    }

    return sessionButtonClassNames;
  }

  _fetchROICollectionInfo() {
    fetchJSON(
      `/data/archive/projects/${this.props.projectId}/subjects/${
        this.props.subjectId
      }/experiments/${this.props.ID}/assessors?format=json`
    )
      .then(result => {
        this._getRoiCollectionCounts(result.ResultSet.Result);
      })
      .catch(err => console.log(err));
  }

  _getRoiCollectionCounts(assessors) {
    const promises = [];

    for (let i = 0; i < assessors.length; i++) {
      if (assessors[i].xsiType === "icr:roiCollectionData") {
        promises.push(
          fetchJSON(
            `/data/archive/projects/${this.props.projectId}/subjects/${
              this.props.subjectId
            }/experiments/${this.props.ID}/assessors/${
              assessors[i].ID
            }?format=json`
          )
        );
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
