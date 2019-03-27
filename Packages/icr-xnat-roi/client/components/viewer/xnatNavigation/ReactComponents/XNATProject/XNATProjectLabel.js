import React from "react";

export default class XNATProjectINFO extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    let projectName;

    if (this.props.active) {
      projectName = <h5 className="xnat-nav-active">{this.props.name}</h5>;
    } else {
      projectName = <h5>{this.props.name}</h5>;
    }

    return (
      <div>
        {projectName}
        <h6>{`ID: ${this.props.ID}`}</h6>
      </div>
    );
  }
}
