import React from "react";

const manual = (
  <div>
    <p>
      The Manual Brush tool allows you to segment images with a circular brush.
    </p>

    <h5>Painting with the brush</h5>
    <ul>
      <li>Click on the canvas to paint with the selected color.</li>
      <li>Drag to make brush strokes.</li>
      <li>Use the + and - keys to increase/decrease the brush size.</li>
      <li>Use the [ and ] keys to change the mask color.</li>
      <li>Ctrl + click with the brush to erase that mask color.</li>
      <li>
        Use the N key to quickly switch to the first unused segmentation color.
      </li>
    </ul>
  </div>
);

const smartCt = (
  <div>
    <p>
      The smart CT brush tool allows you to segment specific tissue types of CT
      images based on a pair of Hounsfield Units (HU). The tissue type can be
      chosen in the Brush Settings menu, as well as a custom HU gate.
    </p>

    <p>
      Holes/artifacts are filled and stray pixels removed, based on the settings
      configured in the Brush Settings Menu.
    </p>

    <h5>Painting with the brush</h5>
    <ul>
      <li>Click on the canvas to paint with the selected color.</li>
      <li>Drag to make brush strokes.</li>
      <li>Use the + and - keys to increase/decrease the brush size.</li>
      <li>Use the [ and ] keys to change the mask color.</li>
      <li>Ctrl + click with the brush to erase that mask color.</li>
      <li>
        Use the N key to quickly switch to the first unused segmentation color.
      </li>
    </ul>
  </div>
);

const auto = (
  <div>
    <p>
      The Auto Brush tool finds the minimum and maximum pixel values within the
      brush radius when pressing down the mouse. Dragging after pressing down
      the mouse will only fill in pixels within this band.
    </p>

    <p>
      Holes/artifacts are filled and stray pixels removed, based on the settings
      configured in the Brush Settings Menu.
    </p>

    <h5>Painting with the brush</h5>
    <ul>
      <li>Click on the canvas to paint with the selected color.</li>
      <li>Drag to make brush strokes.</li>
      <li>Use the + and - keys to increase/decrease the brush size.</li>
      <li>Use the [ and ] keys to change the mask color.</li>
      <li>Ctrl + click with the brush to erase that mask color.</li>
      <li>
        Use the N key to quickly switch to the first unused segmentation color.
      </li>
    </ul>
  </div>
);

const settings = (
  <div>
    <p>
      The Brush Settings menu allows you to configure the properties of the
      Smart CT and Auto Brush tools.
    </p>
    <h5>Smart CT Gate Selection</h5>
    <p>
      This option allows you to select the tissue type to paint with the Smart
      CT Brush. You can also specify a custom gate.
    </p>
    <h5>Smart/Auto Gate Settings</h5>
    <p>These settings affect both the Smart CT and Auto Brush tools.</p>
    <ul>
      <li>
        The first slider sets the size of holes to fill in whilst painting, as a
        fraction of the primary region painted within the brush circle.
      </li>
      <li>
        The second slider sets the size of non-primary regions to ignore whilst
        painting, as a fraction of the primary region painted within the brush
        circle. Regions smaller than this threshold will not be painted.
      </li>
    </ul>
  </div>
);

const segManagement = (
  <div>
    <p>
      The Seg Management menu allows you to view and edit the metadata
      associated with each segmentation. The first line lists the name of the
      ROI Collection. If you have yet to export the collection to XNAT 'New SEG
      ROI Collection' will be displayed. Once you save the collection, the
      collections name, label and type will be displayed in the menu. This is
      also true if you import an existing ROI Collection.
    </p>
    <h5>Segmentation Interface</h5>
    <ul>
      <li>Label - The human-readable label given to the segmentation.</li>
      <li>Category - The annotomical category of the segmentation.</li>
      <li>Type - The specific segmentation type.</li>
      <li>
        Paint - Displays the active color. You can select a color by clicking on
        it.
      </li>
      <li>Hide - Toggle the segmentation's visibility.</li>
      <li>Edit - Edit the metadata of the segmentation.</li>
      <li>
        Delete - Delete the segmentation. You will be prompted to confirm this.
      </li>
    </ul>
    <p>
      Clicking on '+ Segmentation' will generate a new segmentation with the
      next unused color.
    </p>
  </div>
);

export { manual, smartCt, auto, settings, segManagement };
