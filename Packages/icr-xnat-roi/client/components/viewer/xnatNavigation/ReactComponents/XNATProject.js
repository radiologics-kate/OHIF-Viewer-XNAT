import React from "react";
import XNATSubject from "./XNATSubject";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATProject extends React.Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      subjects: [],
      expanded: true
    };
    this.getProjectId = this.getProjectId.bind(this);
    this.getExpandIcon = this.getExpandIcon.bind(this);
  }

  componentDidMount() {
    fetchMockJSON(
      `/data/archive/projects/${this.props.ID}/subjects?format=json`
    )
      .then(result => {
        const subjects = result.ResultSet.Result;
        console.log(subjects);
        this.setState({ subjects });
      })
      .catch(err => console.log(err));
  }

  getProjectId() {
    return this.props.ID;
  }

  getExpandIcon() {
    if (this.state.expanded) {
      return "fa fa-plus-circle";
    }

    return "fa fa-minus-circle";
  }

  render() {
    let body;

    if (this.state.expanded) {
      body = (
        <ul>
          {this.state.subjects.map(subject => (
            <li key={subject.ID}>
              <XNATSubject
                label={subject.label}
                ID={subject.ID}
                getProjectId={this.getProjectId}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a className="btn btn-sm btn-secondary">
            <i className={this.getExpandIcon()} />
          </a>
          <h5>{this.props.ID}</h5>
        </div>
        {body}
      </>
    );
  }
}
