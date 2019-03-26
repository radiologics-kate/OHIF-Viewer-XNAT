import React from "react";
import XNATSession from "./XNATSession.js";
import { Router } from "meteor/clinical:router";
import fetchJSON from "./helpers/fetchJSON.js";
import onExpandIconClick from "./helpers/onExpandIconClick.js";
import getExpandIcon from "./helpers/getExpandIcon.js";
import compareOnProperty from "./helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    const active =
      this.props.getProjectId() === icrXnatRoiSession.get("projectId") &&
      this.props.ID === icrXnatRoiSession.get("subjectId");
    const subjectViewActive =
      this.props.getProjectId() === icrXnatRoiSession.get("projectId") &&
      this.props.ID === icrXnatRoiSession.get("subjectId") &&
      icrXnatRoiSession.get("experimentId") === undefined;

    console.log(`subjectViewActive: ${subjectViewActive}`);
    const shared = this.props.parentProjectId !== this.props.getProjectId();

    this.state = {
      sessions: [],
      active,
      subjectViewActive,
      shared,
      expanded: false,
      fetched: false
    };

    this.getSubjectId = this.getSubjectId.bind(this);
    this.getParentProjectId = this.getParentProjectId.bind(this);
    this.onViewSubjectClick = this.onViewSubjectClick.bind(this);
    this._getSubjectInfo = this._getSubjectInfo.bind(this);
    this._getSessionList = this._getSessionList.bind(this);

    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
  }

  fetchData() {
    fetchJSON(
      `/data/archive/projects/${this.props.getProjectId()}/subjects/${
        this.props.ID
      }/experiments?format=json`
    )
      .then(result => {
        const sessions = result.ResultSet.Result;
        console.log(sessions);

        sessions.sort((a, b) => compareOnProperty(a, b, "label"));

        this.setState({
          sessions,
          fetched: true
        });
      })
      .catch(err => console.log(err));
  }

  getSubjectId() {
    return this.props.ID;
  }

  getParentProjectId() {
    return this.props.parentProjectId;
  }

  onViewSubjectClick() {
    if (this.state.subjectViewActive) {
      return;
    }

    let params = `?subjectId=${
      this.props.ID
    }&projectId=${this.props.getProjectId()}`;

    if (this.props.parentProjectId !== this.props.getProjectId()) {
      params += `&parentProjectId=${this.props.parentProjectId}`;
    }

    console.log(`TODO: -> GO: ${params}`);

    //const viewerRoot = Session.get("viewerRoot");
    const rootUrl = Session.get("rootUrl");

    console.log(`rootUrl: ${rootUrl}`);

    const url = `${rootUrl}/VIEWER${params}`;

    window.location.href = url;
  }

  _getSubjectInfo() {
    let subjectInfo;
    let label;

    if (this.state.active) {
      label = <h5 className="xnat-nav-active">{this.props.label}</h5>;
    } else {
      label = <h5>{this.props.label}</h5>;
    }

    if (this.state.shared) {
      subjectInfo = (
        <div>
          {label}
          <h6>{`ID: ${this.props.ID}`}</h6>
          <h6 className="xnat-nav-shared">{`Shared from ${
            this.props.parentProjectId
          }`}</h6>
        </div>
      );
    } else {
      subjectInfo = (
        <div>
          {label}
          <h6>{`ID: ${this.props.ID}`}</h6>
        </div>
      );
    }

    return subjectInfo;
  }

  _getSessionList() {
    let body;

    if (this.state.expanded) {
      if (this.state.fetched) {
        body = (
          <ul>
            {this.state.sessions.map(session => (
              <li className="xnat-nav-session-item" key={session.ID}>
                <XNATSession
                  ID={session.ID}
                  label={session.label}
                  getProjectId={this.props.getProjectId}
                  getParentProjectId={this.getParentProjectId}
                  getSubjectId={this.getSubjectId}
                />
              </li>
            ))}
          </ul>
        );
      } else {
        body = (
          <ul>
            <li key={`${this.ID} loading`}>
              <i className="fa fa-spin fa-circle-o-notch fa-fw" />
            </li>
          </ul>
        );
      }
    }

    return body;
  }

  render() {
    let subjectButtonClassNames = "btn btn-sm btn-primary xnat-nav-button";

    if (this.state.subjectViewActive) {
      subjectButtonClassNames += " xnat-nav-button-disabled";
    }

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onExpandIconClick}
          >
            <i className={this.getExpandIcon()} />
          </a>
          <a
            className={subjectButtonClassNames}
            onClick={this.onViewSubjectClick}
          >
            <i className="fa fa-eye" />
          </a>
          {this._getSubjectInfo()}
        </div>
        {this._getSessionList()}
      </>
    );
  }
}
