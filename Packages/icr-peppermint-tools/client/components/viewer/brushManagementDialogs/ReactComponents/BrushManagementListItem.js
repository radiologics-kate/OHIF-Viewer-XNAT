import React from "react";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import {
  newSegmentInput,
  editSegmentInput
} from "../../../../lib/util/brushMetadataIO.js";

const brushModule = cornerstoneTools.store.modules.brush;

export default class BrushManagementListItem extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    return;
  }
}
