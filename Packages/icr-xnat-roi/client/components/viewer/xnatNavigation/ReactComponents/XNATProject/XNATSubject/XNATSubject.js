import React from "react";
import XNATSubjectLabel from "./XNATSubjectLabel.js";
import XNATSessionList from "./XNATSession/XNATSessionList.js";
import { Router } from "meteor/clinical:router";
import fetchJSON from "../../helpers/fetchJSON.js";
import onExpandIconClick from "../../helpers/onExpandIconClick.js";
import getExpandIcon from "../../helpers/getExpandIcon.js";
import compareOnProperty from "../../helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import navigateConfirmationContent from "../../helpers/navigateConfirmationContent.js";
import { getUnsavedRegions } from "meteor/icr:peppermint-tools";
import awaitConfirmationDialog from "../../../../../../lib/IO/awaitConfirmationDialog.js";

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

  componentWillUnmount() {
    if (this._cancelablePromise) {
      console.log("canceling promise");
      this._cancelablePromise.cancel();
    }
  }

  fetchData() {
    this._cancelablePromise = fetchJSON(
      `/data/archive/projects/${this.props.projectId}/subjects/${
        this.props.ID
      }/experiments?format=json`
    );

    this._cancelablePromise.promise
      .then(result => {
        if (!result) {
          return;
        }

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

    const unsavedRegions = getUnsavedRegions();

    console.log(unsavedRegions);

    if (unsavedRegions.hasUnsavedRegions) {
      console.log(unsavedRegions);

      const content = navigateConfirmationContent(unsavedRegions);

      awaitConfirmationDialog(content).then(result => {
        if (result === true) {
          this._loadRoute();
        }
      });
      return;
    } else {
      this._loadRoute();
    }
  }

  _loadRoute() {
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
          <XNATSubjectLabel
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
