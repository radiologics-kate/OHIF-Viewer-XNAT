import React from "react";
import fetchJSON from "./helpers/fetchJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    const active =
      this.props.getProjectId() === icrXnatRoiSession.get("projectId") &&
      this.props.getSubjectId() === icrXnatRoiSession.get("subjectId") &&
      this.props.ID === icrXnatRoiSession.get("experimentId");

    const shared =
      this.props.getParentProjectId() !== this.props.getProjectId();

    this.state = {
      active,
      shared
    };

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
    this._getSessionInfo = this._getSessionInfo.bind(this);
  }

  onViewSessionClick() {
    if (this.state.active) {
      return;
    }

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

  _getSessionInfo() {
    let sessionInfo;
    let label;

    if (this.state.active) {
      label = <h5 className="xnat-nav-active">{this.props.label}</h5>;
    } else {
      label = <h5>{this.props.label}</h5>;
    }

    if (this.state.shared) {
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
    let subjectButtonClassNames = "btn btn-sm btn-primary xnat-nav-button";

    if (this.state.active) {
      subjectButtonClassNames += " xnat-nav-button-disabled";
    }

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <i className="fa fa-caret-right xnat-nav-session-caret" />
          <a
            className={subjectButtonClassNames}
            onClick={this.onViewSessionClick}
          >
            <i className="fa fa-eye" />
          </a>
          {this._getSessionInfo()}
        </div>
      </>
    );
  }
}
