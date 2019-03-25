import React from "react";

export default class XNATSubject extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <h5>{this.props.label}</h5>
      </>
    );
  }
}
