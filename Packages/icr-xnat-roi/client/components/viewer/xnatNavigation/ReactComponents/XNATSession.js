import React from "react";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
  }

  onViewSessionClick() {
    console.log(this.props);

    const params = `?subjectId=${this.props.getSubjectId()}&projectId=${this.props.getProjectId()}&experimentId=${
      this.props.ID
    }&experimentLabel=${this.props.label}`;

    console.log(`TODO: -> GO: ${params}`);

    //const viewerRoot = Session.get("viewerRoot");
    const rootUrl = Session.get("rootUrl");

    console.log(`rootUrl: ${rootUrl}`);

    const url = `${rootUrl}/VIEWER${params}`;

    window.location.href = url;
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
