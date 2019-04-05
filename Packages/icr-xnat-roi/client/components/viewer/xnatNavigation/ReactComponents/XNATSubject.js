import React from "react";
import XNATSubjectLabel from "./XNATSubjectLabel.js";
import XNATSessionList from "./XNATSession/XNATSessionList.js";
import { Router } from "meteor/clinical:router";
import fetchJSON from "../../helpers/fetchJSON.js";
import checkSessionJSONExists from "./helpers/checkSessionJSONExists.js";
import onExpandIconClick from "./helpers/onExpandIconClick.js";
import getExpandIcon from "./helpers/getExpandIcon.js";
import compareOnProperty from "./helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";
import navigateConfirmationContent from "./helpers/navigateConfirmationContent.js";
import { getUnsavedRegions } from "meteor/icr:peppermint-tools";
import awaitConfirmationDialog from "../../../../lib/IO/awaitConfirmationDialog.js";
import progressDialog from "../../../../lib/util/progressDialog.js";

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

    this._cancelablePromises = [];
  }

  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === "function") {
        cancelablePromises[i].cancel();
      }
    }
  }

  fetchData() {
    const cancelablePromise = fetchJSON(
      `/data/archive/projects/${this.props.projectId}/subjects/${
        this.props.ID
      }/experiments?format=json`
    );

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(result => {
        if (!result) {
          return;
        }

        const sessions = result.ResultSet.Result;

        sessions.sort((a, b) => compareOnProperty(a, b, "label"));

        this.setState({
          sessions,
          fetched: true
        });
      })
      .catch(err => console.log(err));

    return cancelablePromise.promise;
  }

  onViewSubjectClick() {
    if (this.state.subjectViewActive) {
      return;
    }

    const unsavedRegions = getUnsavedRegions();

    if (unsavedRegions.hasUnsavedRegions) {
      const content = navigateConfirmationContent(unsavedRegions);

      awaitConfirmationDialog(content).then(result => {
        if (result === true) {
          this._checkJSONandloadRoute();
        }
      });
      return;
    } else {
      if (this.state.fetched) {
        this._checkJSONandloadRoute();
      } else {
        this.fetchData().then(() => this._checkJSONandloadRoute());
      }
    }
  }

  _checkJSONandloadRoute() {
    const { projectId, ID } = this.props;
    const { sessions } = this.state;

    const promises = [];

    for (let i = 0; i < sessions.length; i++) {
      const cancelablePromise = checkSessionJSONExists(
        projectId,
        ID,
        sessions[i].ID
      );

      this._cancelablePromises.push(cancelablePromise);
      promises.push(cancelablePromise.promise);
    }

    Promise.all(promises).then(results => {
      if (results.some(result => !result)) {
        this._generateSessionMetadata(results);
      } else {
        this._loadRoute();
      }
    });
  }

  _generateSessionMetadata(sessionsWithMetadata) {
    const { projectId, label } = this.props;
    const { sessions } = this.state;
    const sessionJSONToGenerate = [];

    for (let i = 0; i < sessionsWithMetadata.length; i++) {
      if (!sessionsWithMetadata[i]) {
        sessionJSONToGenerate.push(sessions[i].ID);
      }
    }

    let jsonGenerated = 0;

    // Generate metadata
    progressDialog.show({
      notificationText: `generating metadata for ${label}...`,
      progressText: `${jsonGenerated}/${
        sessionJSONToGenerate.length
      } <i class="fa fa-spin fa-circle-o-notch fa-fw">`
    });

    const promises = [];

    for (let i = 0; i < sessionJSONToGenerate.length; i++) {
      const cancelablePromise = fetchJSON(
        `/xapi/viewer/projects/${projectId}/experiments/${
          sessionJSONToGenerate[i]
        }`
      );

      promises.push(cancelablePromise.promise);

      cancelablePromise.promise.then(() => {
        jsonGenerated++;
        progressDialog.update({
          notificationText: `generating metadata for ${label}...`,
          progressText: `${jsonGenerated}/${
            sessionJSONToGenerate.length
          } <i class="fa fa-spin fa-circle-o-notch fa-fw">`
        });
      });
    }

    Promise.all(promises).then(() => {
      this._loadRoute();
    });
  }

  _loadRoute() {
    const { ID, projectId, parentProjectId } = this.props;
    let params = `?subjectId=${ID}&projectId=${projectId}`;

    if (parentProjectId !== projectId) {
      params += `&parentProjectId=${parentProjectId}`;
    }

    window.location.href = `${Session.get("rootUrl")}/VIEWER${params}`;
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
