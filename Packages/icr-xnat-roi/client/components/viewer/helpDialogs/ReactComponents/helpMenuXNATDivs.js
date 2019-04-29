import React from "react";

export class HelpMenuExport extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { writePermissions, projectId } = this.props;

    if (writePermissions) {
      return (
        <div>
          <h5>ROIs</h5>
          <p>
            This interface will allow you to select a set of ROIs drawn on this
            scan to export to XNAT as a new ROI Collection.
          </p>
          <ul>
            <li>Tick which ROIs you wish to export as a collection.</li>
            <li>Give the ROI Collection an appropriate descriptive name.</li>
            <li>
              Click the large XNAT button to export the collection to XNAT.
            </li>
          </ul>
          <h5>Masks</h5>
          <p>
            This interface will allow you to export your segmentation masks to
            XNAT as a new ROI Collection.
          </p>
          <ul>
            <li>Give the ROI Collection an appropriate descriptive name.</li>
            <li>
              Click the large XNAT button to export the collection to XNAT.
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div>
        <p>
          This command is disabled as you do not have the required permissions
          to write ROI Collections to {projectId}. If you believe that you
          should, please contact the project owner.
        </p>
      </div>
    );
  }
}

export class HelpMenuImport extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { readPermissons, projectId } = this.props;

    if (readPermissons) {
      return (
        <div>
          <h5>ROIs</h5>
          <p>
            This interface will allow you to select contour-based ROI
            Collections to import from XNAT.
          </p>
          <ul>
            <li>Tick which ROI Collections you wish to import.</li>
            <li>
              Click the large XNAT button to import the ROI Collections from
              XNAT.
            </li>
          </ul>
          <h5>Masks</h5>
          <p>
            This interface will allow you to select a mask-based ROI Collection
            to import from XNAT. Only one mask can be loaded onto a scan at a
            time.
          </p>
          <ul>
            <li>Select which ROI Collection you wish to import.</li>
            <li>
              Click the large XNAT button to import the ROI Collection from
              XNAT.
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div>
        <p>
          This command is disabled as you do not have the required permissions
          to read ROI Collections from {projectId}. If you believe that you
          should, please contact the project owner.
        </p>
      </div>
    );
  }
}
