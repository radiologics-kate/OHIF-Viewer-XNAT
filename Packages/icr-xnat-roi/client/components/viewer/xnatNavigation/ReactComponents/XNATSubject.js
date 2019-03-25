import React from "react";
import XNATSession from "./XNATSession.js";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sessions: [] };
    this.getSubjectId = this.getSubjectId.bind(this);
  }

  componentDidMount() {
    fetchMockJSON(
      `/data/archive/projects/${this.props.getProjectId()}/subjects/${
        this.props.ID
      }/experiments?format=json`
    )
      .then(result => {
        const sessions = result.ResultSet.Result;
        console.log(sessions);
        this.setState({ sessions });
      })
      .catch(err => console.log(err));
  }

  getSubjectId() {
    return this.props.ID;
  }

  render() {
    return (
      <>
        <h5>{this.props.label}</h5>
        <ul>
          {this.state.sessions.map(session => (
            <li key={session.ID}>
              <XNATSession
                ID={session.ID}
                label={session.label}
                getProjectId={this.props.getProjectId}
                getSubjectId={this.props.getSubjectId}
              />
            </li>
          ))}
        </ul>
      </>
    );
  }
}
