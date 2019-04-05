import React from "react";

export default class XNATProjectLabel extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { active, name } = this.props;

    // <h6>{`ID: ${this.props.ID}`}</h6>

    return (
      <div>
        {active ? <h5 className="xnat-nav-active">{name}</h5> : <h5>{name}</h5>}
      </div>
    );
  }
}
