import React from "react";
import XNATSubject from "./XNATSubject";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATProject extends React.Component {
  constructor(props = {}) {
    super(props);
    this.state = { subjects: [] };
    this.getProjectId = this.getProjectId.bind(this);
  }

  getProjectId() {
    return this.props.ID;
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
  render() {
    return (
      <>
        <h5>{this.props.ID}</h5>
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
      </>
    );
  }
}
