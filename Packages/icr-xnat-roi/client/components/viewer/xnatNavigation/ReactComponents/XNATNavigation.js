import React from "react";
import XNATProject from "./XNATProject.js";
import fetchJSON from "./helpers/fetchJSON.js";
import compareOnProperty from "./helpers/compareOnProperty.js";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class XNATNavigation extends React.Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      activeProjects: [],
      otherProjects: []
    };
  }

  componentDidMount() {
    fetchJSON("/data/archive/projects/?format=json")
      .then(result => {
        const otherProjects = result.ResultSet.Result;
        console.log(otherProjects);

        const activeProjectId = icrXnatRoiSession.get("projectId");
        const thisProjectIndex = otherProjects.findIndex(
          element => element.ID === activeProjectId
        );

        const activeProjects = otherProjects.splice(thisProjectIndex, 1);

        console.log(activeProjects);

        console.log(thisProjectIndex);

        otherProjects.sort((a, b) => compareOnProperty(a, b, "name"));

        this.setState({
          activeProjects,
          otherProjects
        });
      })
      .catch(err => console.log(err));
  }

  /*
  <h5>Change Subject/Session View</h5>
  <hr />
  */

  render() {
    // TODO: Only render "Other Projects" if other projects exist.

    let otherProjectsList;

    if (this.state.otherProjects.length) {
      otherProjectsList = (
        <>
          <h4>Other Projects</h4>
          {this.state.otherProjects.map(project => (
            <li key={project.ID}>
              <XNATProject ID={project.ID} name={project.name} />
            </li>
          ))}
        </>
      );
    }

    return (
      <>
        <div className="xnat-navigation-tree">
          <ul>
            <h4>This Project</h4>
            {this.state.activeProjects.map(project => (
              <li key={project.ID}>
                <XNATProject ID={project.ID} name={project.name} />
              </li>
            ))}
            {otherProjectsList}
          </ul>
        </div>
      </>
    );
  }
}
