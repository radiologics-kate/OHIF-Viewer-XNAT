import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import GeneralAnatomyList from '../../../lib/GeneralAnatomylist.js';

const brushModule = cornerstoneTools.store.modules.brush;

const validIcon = 'fa fa-check fa-2x';
const invalidIcon = 'fa fa-times fa-2x';

const validColor = 'limegreen';
const invalidColor = 'firebrick';

Template.brushMetadataDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#brushMetadataDialog');

    dialogPolyfill.registerDialog(dialog.get(0));
});

Template.brushMetadataDialogs.onCreated(() => {
  const instance = Template.instance();
  instance.data.searchQuery = new ReactiveVar('');
  instance.data.label = new ReactiveVar('');

  instance.data.setSegmentationTypeCallback = (text) => {
    const segmentationInput = document.getElementsByClassName('brushMetadataSegmentationTypeInput');

    segmentationInput[0].value = text;

    instance.data.searchQuery.set(text);
  };
});

Template.brushMetadataDialogs.helpers({
  searchTest: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get();

    return searchQuery;
  },
  searchResults: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get().toUpperCase();

    const categories = GeneralAnatomyList.SegmentationCodes.Category;
    let searchResults = [];


    // Print no search results if valid result, and correct capitalisation.
    if (isValidSegmentation(categories, searchQuery)) {
      let CodeMeaning;

      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        for (let j = 0; j < category.Type.length; j++) {
          const Type = category.Type[j];

          // Check if the CodeMeaning contains the string
          if (Type.CodeMeaning.toUpperCase() === searchQuery) {
            CodeMeaning = Type.CodeMeaning;
          }
        }
      }

      instance.data.setSegmentationTypeCallback(CodeMeaning);

      return searchResults;
    }

    // Return all results if search empty.
    if (searchQuery === '') {
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        for (let j = 0; j < category.Type.length; j++) {
          const Type = category.Type[j];
          const dataObject = {
            setSegmentationTypeCallback: instance.data.setSegmentationTypeCallback
          };

          searchResults.push(Object.assign(dataObject, Type));
        }
      }
    } else {
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        for (let j = 0; j < category.Type.length; j++) {
          const Type = category.Type[j];

          // Check if the CodeMeaning contains the string
          if (Type.CodeMeaning.toUpperCase().indexOf(searchQuery) > -1) {
            const dataObject = {
              setSegmentationTypeCallback: instance.data.setSegmentationTypeCallback
            };

            searchResults.push(Object.assign(dataObject, Type));
          }
        }
      }
    }

    return searchResults;

  },
  validSegmentationTypeIcon: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get().toUpperCase();

    if (searchQuery === '') {
      return invalidIcon;
    }

    const categories = GeneralAnatomyList.SegmentationCodes.Category;
    const valid = isValidSegmentation(categories, searchQuery);

    if (valid) {
      return validIcon;
    }

    return invalidIcon;
  },
  validLabelIcon: () => {
    const instance = Template.instance();
    const label = instance.data.label.get();

    if (label === '') {
      return invalidIcon;
    }

    return validIcon;
  },
  validLabelColor: () => {
    const instance = Template.instance();
    const label = instance.data.label.get();

    if (label === '') {
      return invalidColor;
    }

    return validColor;
  },
  validSegmentationTypeColor: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get().toUpperCase();

    if (searchQuery === '') {
      return invalidColor;
    }

    const categories = GeneralAnatomyList.SegmentationCodes.Category;
    const valid = isValidSegmentation(categories, searchQuery);

    if (valid) {
      return validColor;
    }

    return invalidColor;
  },
  segmentationColor: () => {
    const segIndex = icrXnatRoiSession.get('EditBrushMetadataIndex');

    const colormap = cornerstone.colors.getColormap(brushModule.state.colorMapId);

    if (!colormap) {
      return;
    }
    const colorArray = colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  },
  segmentationIndex: () => {
    const segIndex = icrXnatRoiSession.get('EditBrushMetadataIndex');

    return segIndex;
  },
  validInput: () => {
    const instance = Template.instance();
    const searchQuery = instance.data.searchQuery.get();
    const label = instance.data.label.get();

    if (searchQuery === '' || label === '') {
      return false;
    }

    const categories = GeneralAnatomyList.SegmentationCodes.Category;

    if (!isValidSegmentation(categories, searchQuery.toUpperCase())) {
      return false;
    }

    return true;
  }
});

Template.brushMetadataDialogs.events({
  'keyup .brush-segmentation-search-js'(event) {

    // Autocomplete?
    if (event.key === 'Enter') {
      event.currentTarget.value = autoComplete(event.currentTarget.value);
    }

    const instance = Template.instance();
    instance.data.searchQuery.set(event.currentTarget.value);
  },
  'keyup .brush-segmentation-label-js'(event) {

    const instance = Template.instance();
    instance.data.label.set(event.currentTarget.value);
  },
  'click .js-brush-metadata-cancel'(event) {

    closeDialog();
  },
  'click .js-brush-metadata-confirm'(event) {
    const instance = Template.instance();

    const segIndex = icrXnatRoiSession.get('EditBrushMetadataIndex');
    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    const metadata = generateMetadata(
      instance.data.label.get(),
      instance.data.searchQuery.get()
    );

    brushModule.setters.metadata(seriesInstanceUid, segIndex, metadata);

    console.log(seriesInstanceUid);
    console.log(segIndex);

    closeDialog();
  }
});


function closeDialog () {
  const dialog = $('#brushMetadataDialog');
  dialog.get(0).close();

  // Reset the focus to the active viewport element
  // This makes the mobile Safari keyboard close
  const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
  element.focus();
}

function isValidSegmentation (categories, searchQuery) {
  return categories.some(category => {
    return category.Type.some(Type =>
      Type.CodeMeaning.toUpperCase() === searchQuery
    );
  });
}

function autoComplete (searchQuery) {
  const categories = GeneralAnatomyList.SegmentationCodes.Category;

  let autoCompletedType;

  let done = false;

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    for (let j = 0; j < category.Type.length; j++) {
      const Type = category.Type[j];

      // Check if the CodeMeaning contains the string
      if (!done && Type.CodeMeaning.toUpperCase().indexOf(searchQuery.toUpperCase()) > -1) {
        autoCompletedType = Type.CodeMeaning;
        console.log('Autocomplete');
        done = true;
      }
    }
  }

  return autoCompletedType;
}

function generateMetadata (label, segmentationType) {
  const categories = GeneralAnatomyList.SegmentationCodes.Category;
  let Type;
  let categoryOfType;

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    for (let j = 0; j < category.Type.length; j++) {
      if (category.Type[j].CodeMeaning == segmentationType) {
        Type = category.Type[j];
        categoryOfType = category;
      }
    }
  }

  console.log(Type);
  console.log(categoryOfType);

  const metadata = {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: categoryOfType.CodeValue,
      CodingSchemeDesignator: categoryOfType.CodingSchemeDesignator,
      CodeMeaning: categoryOfType.CodeMeaning
    },
    SegmentLabel: label,
    SegmentAlgorithmType: "MANUAL",
    RecommendedDisplayCIELabValue: Type.recommendedDisplayRGBValue,
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: Type.CodeValue,
      CodingSchemeDesignator: Type.CodingSchemeDesignator,
      CodeMeaning: Type.CodeMeaning
    }
  };

  return metadata;
}
