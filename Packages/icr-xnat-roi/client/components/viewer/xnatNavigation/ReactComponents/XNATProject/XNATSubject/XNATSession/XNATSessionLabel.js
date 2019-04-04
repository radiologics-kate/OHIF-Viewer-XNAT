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

  _headerLabel() {
    const { label, ID, active } = this.props;

    //<h6>{`ID: ${ID}`}</h6>

    if (active) {
      return (
        <>
          <h5 className="xnat-nav-active">{label}</h5>
        </>
      );
    }

    return (
      <>
        <h5>{label}</h5>
      </>
    );
  }

  _roiCollectionCountLabel() {
    const { contourCount, maskCount, hasRois } = this.props;

    if (!hasRois) {
      return null;
    }

    // Render loading dialog.
    if (!contourCount && !maskCount) {
      return (
        <>
          <i className="fa fa-spin fa-circle-o-notch" />
        </>
      );
    }

    return (
      <>
        <h6>
          {contourCount ? (
            <>
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                stroke="#ffffff"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                xmlSpace="preserve"
                preserveAspectRatio="xMidYMid meet"
                x="0px"
                y="0px"
              >
                <use xlinkHref="packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-menu" />
              </svg>
              {` ${contourCount}  `}
            </>
          ) : null}
          {maskCount ? (
            <>
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                stroke="#ffffff"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                xmlSpace="preserve"
                preserveAspectRatio="xMidYMid meet"
                x="0px"
                y="0px"
              >
                <use xlinkHref="packages/icr_peppermint-tools/assets/icons.svg#icon-segmentation-menu" />
              </svg>
              {` ${maskCount} `}
            </>
          ) : null}
        </h6>
      </>
    );
  }
}
