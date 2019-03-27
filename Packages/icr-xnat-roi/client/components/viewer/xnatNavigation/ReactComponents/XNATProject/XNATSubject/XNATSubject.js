import React from "react";
import XNATLabel from "../../XNATLabel.js";
import XNATSessionList from "./XNATSession/XNATSessionList.js";
import { Router } from "meteor/clinical:router";
import fetchJSON from "../../helpers/fetchJSON.js";
import onExpandIconClick from "../../helpers/onExpandIconClick.js";
import getExpandIcon from "../../helpers/getExpandIcon.js";
import compareOnProperty from "../../helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    const active =
      this.props.projectId === icrXnatRoiSession.get("projectId") &&
      this.props.ID === icrXnatRoiSession.get("subjectId");
    const subjectViewActive =
      this.props.projectId === icrXnatRoiSession.get("projectId") &&
      this.props.ID === icrXnatRoiSession.get("subjectId") &&
      icrXnatRoiSession.get("experimentId") === undefined;

    console.log(`subjectViewActive: ${subjectViewActive}`);
    const shared = this.props.parentProjectId !== this.props.projectId;

    this.state = {
      sessions: [],
      active,
      subjectViewActive,
      shared,
      expanded: false,
      fetched: false
    };

    this.onViewSubjectClick = this.onViewSubjectClick.bind(this);

    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
  }

  fetchData() {
    fetchJSON(
      `/data/archive/projects/${this.props.projectId}/subjects/${
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

  onViewSubjectClick() {
    if (this.state.subjectViewActive) {
      return;
    }

    const { ID, projectId, parentProjectId } = this.props;
    let params = `?subjectId=${ID}&projectId=${projectId}`;

    if (parentProjectId !== projectId) {
      params += `&parentProjectId=${parentProjectId}`;
    }

    const rootUrl = Session.get("rootUrl");
    const url = `${rootUrl}/VIEWER${params}`;

    console.log(url);

    window.location.href = url;
  }

  _getSubjectButtonClassNames() {
    let subjectButtonClassNames = "btn btn-sm btn-primary xnat-nav-button";

    if (this.state.subjectViewActive) {
      subjectButtonClassNames += " xnat-nav-button-disabled";
    }

    return subjectButtonClassNames;
  }

  render() {
    const { ID, label, projectId, parentProjectId } = this.props;
    const { sessions, active, shared, fetched, expanded } = this.state;
    const subjectButtonClassNames = this._getSubjectButtonClassNames();

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
          <XNATLabel
            ID={ID}
            label={label}
            active={active}
            shared={shared}
            parentProjectId={parentProjectId}
          />
        </div>
        {expanded ? (
          <XNATSessionList
            projectId={projectId}
            parentProjectId={parentProjectId}
            subjectId={ID}
            sessions={sessions}
            fetched={fetched}
          />
        ) : null}
      </>
    );
  }
}
