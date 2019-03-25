import React from "react";
import XNATSubject from "./XNATSubject";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATProject extends React.Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      subjects: [],
      expanded: false,
      fetched: false
    };
    this.getProjectId = this.getProjectId.bind(this);
    this.getExpandIcon = this.getExpandIcon.bind(this);
    this.onExpandIconClick = this.onExpandIconClick.bind(this);
  }

  fetchData() {
    fetchMockJSON(
      `/data/archive/projects/${this.props.ID}/subjects?format=json`
    )
      .then(result => {
        const subjects = result.ResultSet.Result;
        console.log(subjects);
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

  getExpandIcon() {
    if (this.state.expanded) {
      return "fa fa-minus-circle";
    }

    return "fa fa-plus-circle";
  }

  onExpandIconClick() {
    const expanded = !this.state.expanded;

    if (expanded && !this.state.fetched) {
      this.fetchData();
    }

    this.setState({ expanded });
  }

  render() {
    let body;

    console.log(this.state.expanded);

    if (this.state.expanded) {
      if (this.state.fetched) {
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
      } else {
        body = (
          <ul>
            <li key={`${this.ID} loading`}>
              <i class="fa fa-spin fa-circle-o-notch fa-fw" />
            </li>
          </ul>
        );
      }
    }

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a className="btn btn-sm btn-secondary">
            <i
              className={this.getExpandIcon()}
              onClick={this.onExpandIconClick}
            />
          </a>
          <h5>{this.props.ID}</h5>
        </div>
        {body}
      </>
    );
  }
}
