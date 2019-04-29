import React from "react";

const draw = (
  <div>
    <p>The ROI Draw tool is used to create and edit contours of an ROI.</p>
    <h5>Draw Polygons</h5>
    <ul>
      <li>Click to draw a node.</li>
      <li>Keep clicking to draw the contour point by point.</li>
      <li>
        Complete the contour by clicking on the origin node without crossing any
        lines.
      </li>
    </ul>
    <h5>Draw Freehand</h5>
    <ul>
      <li>Hold the mouse to start drawing.</li>
      <li>Drag the mouse to draw the contour.</li>
      <li>
        Complete the contour by releasing the mouse at the origin node without
        crossing any lines.
      </li>
    </ul>
    <h5>Edit</h5>
    <ul>
      <li>Ctrl-click on a handle to delete it.</li>
      <li>Ctrl-click on a line to insert a new handle.</li>
      <li>Drag a handle to move it.</li>
    </ul>
    <h5>Shortcuts</h5>
    <ul>
      <li>Clicking ‘N’ will create a new volume and activate it.</li>
      <li>
        Alt-click (cmd-click on mac) a contour node to select it as the active
        ROI for drawing.
      </li>
      <li>Double-click a contour node to change the name of an ROI.</li>
    </ul>
  </div>
);

const sculpt = (
  <div>
    <p>This tool is used to sculpt contours drawn with the freehand tool.</p>
    <h5>Select ROI</h5>
    <ul>
      <li>Double click near a contour to select it for editing.</li>
      <li>
        The region will become highlighted to show that it has been selected.
      </li>
    </ul>
    <h5>Edit ROI</h5>
    <ul>
      <li>Hold down left click near the selected tool to begin editing.</li>
      <ul>
        <li>
          The closer to the contour the mouse is, the smaller the tool will be.
        </li>
        <li>The tool can push from both inside and outside the contour.</li>
      </ul>
      <li>With the mouse held down, drag the tool to push the ROI.</li>
      <ul>
        <li>New points will be created and deleted as needed.</li>
      </ul>
      <li>Release the mouse to complete the edit.</li>
      <li>
        You may find you wish to make rough edits with a large tool, before
        making fine adjustments with a finer tool.
      </li>
    </ul>
  </div>
);

const roiManagement = (
  <div>
    <p>
      A "Region of Interest" (ROI) is defined as a collection of contours that
      make up a continuous volume. The ROI Management interface accessed through
      the ROI menu contains a list of the currently active ROIs, and allows for
      the creation of new ROIs. Clicking on an ROI in the list will allow
      activate that ROI for drawing.
    </p>
    <p>
      To avoid potential duplication, imported and exported ROIs are locked for
      editing. These can still be viewed in the ROI manager by toggling "view
      locked ROIs". The ability to edit ROI Collections will come in the future.
    </p>
  </div>
);

const stats = (
  <div>
    <p>
      This button toggles the display of roi statistics on the screen, disabled
      by default.
    </p>
    <p>Enabled</p>
    <ul>
      <li>The statistics for each ROI will be displayed on the screen.</li>
      <li>Statistic windows can be moved by dragging them with the mouse.</li>
      <li>Statistic windows will be present in exported snapshots.</li>
    </ul>
    <p>Disabled</p>
    <ul>
      <li>The statistics can be viewed by hovering over an ROI's node.</li>
      <li>
        If the stats window has been moved, the stats window will display at
        that location.
      </li>
    </ul>
  </div>
);

const interpolate = (
  <div>
    <p>
      When interpolation is turned on, when new contours are drawn intermediate
      contours of an ROI are estimated by linear interpolation.
    </p>
    <ul>
      <li>Interpolated contours are denoted by a dotted line.</li>
      <li>
        Interpolated contours are recalculated everytime a source contour (solid
        line) is edited.
      </li>
      <li>If you edit an interpolated contour, it becomes a source contour.</li>
      <li>
        Interpolation won't occur if there are multiple contours of the same ROI
        on a branch.
      </li>
    </ul>
  </div>
);

export { draw, sculpt, roiManagement, stats, interpolate };
