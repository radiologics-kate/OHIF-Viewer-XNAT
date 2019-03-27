import React from "react";

export default class XNATLabel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { ID, label, active, shared, parentProjectId } = this.props;
    let labelEntry;

    if (active) {
      labelEntry = (
        <>
          <h5 className="xnat-nav-active">{label}</h5>
          <h6>{`ID: ${ID}`}</h6>
        </>
      );
    } else {
      labelEntry = (
        <>
          <h5>{label}</h5>
          <h6>{`ID: ${ID}`}</h6>
        </>
      );
    }

    if (shared) {
      return (
        <div>
          {labelEntry}
          <h6 className="xnat-nav-shared">{`Shared from ${parentProjectId}`}</h6>
        </div>
      );
    }

    return <div>{labelEntry}</div>;
  }
}
