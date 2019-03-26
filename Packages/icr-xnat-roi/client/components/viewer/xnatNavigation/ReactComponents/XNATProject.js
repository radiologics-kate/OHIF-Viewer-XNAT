import React from "react";
import XNATSubject from "./XNATSubject";
import fetchJSON from "./helpers/fetchJSON.js";
import onExpandIconClick from "./helpers/onExpandIconClick.js";
import getExpandIcon from "./helpers/getExpandIcon.js";
import compareOnProperty from "./helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATProject extends React.Component {
  constructor(props = {}) {
    super(props);

    const active = this.props.ID === icrXnatRoiSession.get("projectId");

    this.state = {
      subjects: [],
      active,
      expanded: false,
      fetched: false
    };

    this.getProjectId = this.getProjectId.bind(this);
    this._getProjectInfo = this._getProjectInfo.bind(this);
    this._getSubjectList = this._getSubjectList.bind(this);

    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
  }

  fetchData() {
    fetchJSON(`/data/archive/projects/${this.props.ID}/subjects?format=json`)
      .then(result => {
        const subjects = result.ResultSet.Result;
        console.log(subjects);

        subjects.sort((a, b) => compareOnProperty(a, b, "label"));

        this.setState({
          subjects,
          fetched: true
        });
      })
      .catch(err => console.log(err));
  }

  getProjectId() {
    return this.props.ID;
  }

  _getProjectInfo() {
    let projectInfo;

    if (this.state.active) {
      projectInfo = (
        <div>
          <h5 className="xnat-nav-active">{this.props.name}</h5>
          <h6>{`ID: ${this.props.ID}`}</h6>
        </div>
      );
    } else {
      projectInfo = (
        <div>
          <h5>{this.props.name}</h5>
          <h6>{`ID: ${this.props.ID}`}</h6>
        </div>
      );
    }

    return projectInfo;
  }

  _getSubjectList() {
    let body;

    if (this.state.expanded) {
      if (this.state.fetched) {
        body = (
          <ul>
            {this.state.subjects.map(subject => (
              <li key={subject.ID}>
                <XNATSubject
                  label={subject.label}
                  ID={subject.ID}
                  parentProjectId={subject.project}
                  getProjectId={this.getProjectId}
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
    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onExpandIconClick}
          >
            <i className={this.getExpandIcon()} />
          </a>
          {this._getProjectInfo()}
        </div>
        {this._getSubjectList()}
      </>
    );
  }
}
