import React from "react";
import fetchJSON from "./helpers/fetchJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
    this.getSessionInfo = this.getSessionInfo.bind(this);
  }

  onViewSessionClick() {
    console.log(this.props);

    let params = `?subjectId=${this.props.getSubjectId()}&projectId=${this.props.getProjectId()}&experimentId=${
      this.props.ID
    }&experimentLabel=${this.props.label}`;

    if (this.props.getParentProjectId() !== this.props.getProjectId()) {
      //Shared Project
      params += `&parentProjectId=${this.props.getParentProjectId()}`;
    }

    console.log(`-> GO: ${params}`);

    //const viewerRoot = Session.get("viewerRoot");
    const rootUrl = Session.get("rootUrl");

    console.log(`rootUrl: ${rootUrl}`);

    const url = `${rootUrl}/VIEWER${params}`;

    window.location.href = url;
  }

  getSessionInfo() {
    let sessionInfo;
    let label;

    if (
      this.props.getProjectId() === icrXnatRoiSession.get("projectId") &&
      this.props.getSubjectId() === icrXnatRoiSession.get("subjectId") &&
      this.props.ID === icrXnatRoiSession.get("experimentId")
    ) {
      label = <h5 className="xnat-nav-active">{this.props.label}</h5>;
    } else {
      label = <h5>{this.props.label}</h5>;
    }

    if (this.props.getParentProjectId() !== this.props.getProjectId()) {
      sessionInfo = (
        <div>
          {label}
          <h6>{`ID: ${this.props.ID}`}</h6>
          <h6 className="xnat-nav-shared">{`Shared from ${this.props.getParentProjectId()}`}</h6>
        </div>
      );
    } else {
      sessionInfo = (
        <div>
          {label}
          <h6>{`ID: ${this.props.ID}`}</h6>
        </div>
      );
    }

    return sessionInfo;
  }

  render() {
    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <i className="fa fa-caret-right xnat-nav-session-caret" />
          <a
            className="btn btn-sm btn-primary xnat-nav-button"
            onClick={this.onViewSessionClick}
          >
            <i className="fa fa-eye" />
          </a>
          {this.getSessionInfo()}
        </div>
      </>
    );
  }
}
