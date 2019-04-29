import React from "react";
import { HelpMenuExport, HelpMenuImport } from "./helpMenuXNATDivs.js";
import { sessionMap } from "meteor/icr:series-info-provider";
import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

export default class HelpMenuXNAT extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      menus: [
        {
          name: "Export",
          xlinkHref: "packages/icr_xnat-roi/assets/icons.svg#icon-xnat-export"
        },
        {
          name: "Import",
          xlinkHref: "packages/icr_xnat-roi/assets/icons.svg#icon-xnat-import"
        }
      ],
      selected: "Export"
    };

    this.isSelected = this.isSelected.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  isSelected(name) {
    return this.state.selected === name ? "pressed" : "depressed";
  }

  onButtonClick(name) {
    this.setState({ selected: name });
  }

  insertHelpSection() {
    const { selected } = this.state;
    const projectId = sessionMap.get("session", "projectId");

    switch (selected) {
      case "Export":
        return (
          <HelpMenuExport
            writePermissions={icrXnatRoiSession.get("writePermissions")}
            projectId={projectId}
          />
        );
      case "Import":
        return (
          <HelpMenuImport
            readPermissons={icrXnatRoiSession.get("readPermissions")}
            projectId={projectId}
          />
        );
    }
  }

  render() {
    const { menus, selected } = this.state;

    return (
      <>
        <div>
          <div className="sub-help-nav-bar">
            {menus.map(menu => (
              <a
                className="sub-help-button btn btn-sm btn-primary"
                key={menu.name}
                onClick={() => {
                  this.onButtonClick(menu.name);
                }}
              >
                <svg className={this.isSelected(menu.name)}>
                  <use xlinkHref={menu.xlinkHref} />
                </svg>
              </a>
            ))}
          </div>

          <div className="sub-help-title">
            <h3>{selected}</h3>
          </div>
        </div>

        <div className="sub-help-body">{this.insertHelpSection()}</div>
      </>
    );
  }
}
