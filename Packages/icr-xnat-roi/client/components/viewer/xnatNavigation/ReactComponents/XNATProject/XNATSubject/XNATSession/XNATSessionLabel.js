import React from "react";

export default class XNATSessionLabel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { shared, parentProjectId } = this.props;

    const sharedLabel = shared ? (
      <>
        <h6 className="xnat-nav-shared">{`Shared from ${parentProjectId}`}</h6>
      </>
    ) : null;

    return (
      <div>
        {this._headerLabel()}
        {this._roiCollectionCountLabel()}
        {sharedLabel}
      </div>
    );
  }

  _roiCollectionCountLabel() {
    const { contourCount, maskCount } = this.props;

    let roiCollectionCountLabel;

    if (contourCount || maskCount) {
      let contourCountLabel;
      let maskCountLabel;

      if (contourCount) {
        contourCountLabel = (
          <>
            <svg stroke="#fff" width="16" height="16">
              <use href="packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-menu" />
            </svg>
            {` ${contourCount}  `}
          </>
        );
      }

      if (maskCount) {
        maskCountLabel = (
          <>
            <svg stroke="#fff" width="16" height="16">
              <use href="packages/icr_peppermint-tools/assets/icons.svg#icon-segmentation-menu" />
            </svg>
            {` ${maskCount} `}
          </>
        );
      }

      return (
        <>
          <h6>
            {contourCountLabel}
            {maskCountLabel}
          </h6>
        </>
      );
    }
  }

  _headerLabel() {
    const { label, ID, active } = this.props;

    if (active) {
      return (
        <>
          <h5 className="xnat-nav-active">{label}</h5>
          <h6>{`ID: ${ID}`}</h6>
        </>
      );
    }

    return (
      <>
        <h5>{label}</h5>
        <h6>{`ID: ${ID}`}</h6>
      </>
    );
  }
}
