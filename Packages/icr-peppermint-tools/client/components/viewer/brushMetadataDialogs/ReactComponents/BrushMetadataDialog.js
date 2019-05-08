import React from "react";

const validIcon = 'fa fa-check fa-2x';
const invalidIcon = 'fa fa-times fa-2x';

const validColor = 'limegreen';
const invalidColor = 'firebrick';

export default class BrushMetadataDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      validName: false,
      validType: false
    };

    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);

    this._validLabelIndicator = this._validLabelIndicator.bind(this);
    this._closeDialog = this._closeDialog.bind(this);

    this._maskName = this.props.defaultName;
  }

  onTextInputChange(evt) {
    const {validName} = this.state;

    const name = evt.target.value;

    console.log(evt.target.value);

    this._maskName = name;

    if (name.length > 0 && !validName) {
      this.setState({validName: true})
    } else if (name.length === 0 && validName) {
      this.setState({validName: false})
    }
  }

  onCancelButtonClick() {
    console.log(`onCancelButtonClick`);

    this._closeDialog();
  }

  onConfirmButtonClick() {
    console.log(`onConfirmButtonClick`);

    const data = {
      name: this._roiContourName,
      metadata: {} //TODO
    };

    this.props.callback(data);
    this._closeDialog();
  }

  _closeDialog() {
    const dialog = document.getElementById("freehandSetNameDialog");

    dialog.close();
  }

  _validLabelIndicator() {
    if (this._roiContourName.length > 0) {
      return {
        iconClasses: `${validIcon} brush-metadata-validity-indicator`,
        color: validColor
      }
    }

    return {
      iconClasses: `${invalidIcon} brush-metadata-validity-indicator`,
      color: invalidColor
    }
  }

  render() {
    const { defaultName } = this.props;

    const segmentColor = 'blue' // TODO
    const segmentIndexText = `Segment 0`; // TODO

    const validLabelIndicator = this._validLabelIndicator();

    return <div>

    <div className="brush-metadata-horizontal-box">
      <h3 style={{border:`2px solid ${segmentColor}`}}>{segmentIndexText}</h3>
      <a className="btn btn-sm btn-secondary"
      onClick={this.onCancelButtonClick}>
        <i className="fa fa-times-circle fa-2x"></i>
      </a>
    </div>

    <hr/>

    <div className="brush-metadata-vert-box">
      <label for="brushMetadataLabelInput">Label</label>

      <div className="brush-metadata-horizontal-box">
        <input name="brushMetadataLabelInput"
               class="brush-metadata-input brush-metadata-label-input form-themed form-control"
               onChange={this.onTextInputChange}
               type="text"
               autocomplete="off"
               defaultValue={defaultName}
               placeholder="Enter Segmentation Label.."
               tabindex="1"/>
        <i className={validLabelIndicator.iconClasses}
           style={{color:validLabelIndicator.color}}>
        </i>
      </div>

      <label for="brushMetadataTypeInput">Segmentation Type</label>

      <div class="brush-metadata-horizontal-box">
        <input name="brushMetadataTypeInput"
               class="brush-metadata-input brush-metadata-type-input brush-segmentation-search-js form-themed form-control"
               type="text"
               autocomplete="off"
               placeholder="Search.."
               onfocus="this.select()"
               tabindex="2"/>
        <i class="{{validSegmentationTypeIcon}} brush-metadata-validity-indicator"
           style="color:{{validSegmentationTypeColor}}">
        </i>
      </div>

      {{>brushMetadataSearchList searchResults=searchResults}}

      {{#if modifiers}}
        {{>brushMetadataModifiers modifiers=modifiers}}
      {{/if}}
    </div>

    <hr/>
    {{#if validInput}}
      <a class="brush-metadata-new-button js-brush-metadata-confirm btn btn-sm btn-primary">
        <i class="fa fa fa-check-circle fa-2x"></i>
      </a>
    {{else}}
      <a class="brush-metadata-new-button brush-metadata-invalid-confirm btn btn-sm btn-primary" style="background-color:#263340">
        <i class="fa fa fa-check-circle fa-2x"></i>
      </a>
    {{/if}}

    </div>
  }
}
