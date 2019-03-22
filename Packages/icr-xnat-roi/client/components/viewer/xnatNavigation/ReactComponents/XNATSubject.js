import React from "react";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sessions: [] };
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

  render() {
    return (
      <>
        <h5>{this.props.label}</h5>
        <ul>
          {this.state.sessions.map(session => (
            <li key={session.ID}>
              <h5>{session.label}</h5>
            </li>
          ))}
        </ul>
      </>
    );
  }
}
