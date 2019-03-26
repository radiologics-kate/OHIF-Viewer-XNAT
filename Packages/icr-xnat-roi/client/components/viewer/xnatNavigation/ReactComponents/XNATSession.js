import React from "react";
import fetchJSON from "./helpers/fetchJSON.js";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
  }

  onViewSessionClick() {
    console.log(this.props);

    fetchJSON(
      `/data/archive/projects/${this.props.getProjectId()}/subjects/${this.props.getSubjectId()}/experiments/${
        this.props.ID
      }?format=json`
    )
      .then(result => {
        console.log(result);

        const parentProjectId = result.items[0].data_fields.project;

        let params = `?subjectId=${this.props.getSubjectId()}&projectId=${this.props.getProjectId()}&experimentId=${
          this.props.ID
        }&experimentLabel=${this.props.label}`;

        if (parentProjectId !== this.props.getProjectId()) {
          //Shared Project
          params += `&parentProjectId=${parentProjectId}`;
        }

        console.log(`-> GO: ${params}`);

        //const viewerRoot = Session.get("viewerRoot");
        const rootUrl = Session.get("rootUrl");

        console.log(`rootUrl: ${rootUrl}`);

        const url = `${rootUrl}/VIEWER${params}`;

        window.location.href = url;
      })
      .catch(err => console.log(err));
  }

  //

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
          <div>
            <h5>{this.props.label}</h5>
            <h6>{`ID: ${this.props.ID}`}</h6>
          </div>
        </div>
      </>
    );
  }
}
