import React from "react";
import XNATProject from "./XNATProject.js";
import fetchMockJSON from "../testJSON/fetchMockJSON.js";

export default class XNATNavigation extends React.Component {
  constructor(props = {}) {
    super(props);
    this.state = { projects: [] };
  }

  componentDidMount() {
    fetchMockJSON("/data/archive/projects/?format=json")
      .then(result => {
        const projects = result.ResultSet.Result;
        console.log(projects);
        this.setState({ projects });
      })
      .catch(err => console.log(err));
  }

  render() {
    return (
      <>
        <h3>Switch Subject/Session</h3>
        <hr />
        <div className="xnat-navigation-tree">
          <ul>
            {this.state.projects.map(project => (
              <li key={project.ID}>
                <XNATProject ID={project.ID} />
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }
}
