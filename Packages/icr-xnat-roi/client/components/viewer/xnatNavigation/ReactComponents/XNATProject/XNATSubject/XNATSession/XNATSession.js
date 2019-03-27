import React from "react";
import XNATLabel from "../../../XNATLabel.js";
import fetchJSON from "../../../helpers/fetchJSON.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATSession extends React.Component {
  constructor(props) {
    super(props);

    console.log(this.props.projectId === icrXnatRoiSession.get("projectId"));
    console.log(this.props.subjectId === icrXnatRoiSession.get("subjectId"));
    console.log(this.props.ID === icrXnatRoiSession.get("experimentId"));

    const active =
      this.props.projectId === icrXnatRoiSession.get("projectId") &&
      this.props.subjectId === icrXnatRoiSession.get("subjectId") &&
      this.props.ID === icrXnatRoiSession.get("experimentId");

    const shared = this.props.parentProjectId !== this.props.projectId;

    this.state = {
      active,
      shared
    };

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
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

  render() {
    const { ID, label, parentProjectId } = this.props;
    const { active, shared } = this.state;
    const sessionButtonClassNames = this._getSessionButtonClassNames();

    console.log(`xnatSession: active: ${active}`);

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
          <XNATLabel
            ID={ID}
            label={label}
            active={active}
            shared={shared}
            parentProjectId={parentProjectId}
          />
        </div>
      </>
    );
  }
}
