import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

Template.toolbarSection.onCreated(() => {
    const instance = Template.instance();

    if (OHIF.uiSettings.leftSidebarOpen) {
        instance.data.state.set('leftSidebar', 'scanList');
    }
});

Template.toolbarSection.helpers({
    leftSidebarToggleButtonData() {
        const instance = Template.instance();
        // JamesAPetts - Return two things
        return {
              toggleable: true,
              key: 'leftSidebar',
              value: instance.data.state,
              options: [{
                  value: 'scanList',
                  svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-studies',
                  svgWidth: 15,
                  svgHeight: 13,
                  bottomLabel: 'Scans'
              },
              {
                  value: 'changeSession',
                  svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-measurements-lesions',
                  svgWidth: 15,
                  svgHeight: 13,
                  bottomLabel: 'XNAT Nav'
              }]
          };
    },
    rightSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
              toggleable: true,
              key: 'rightSidebar',
              value: instance.data.state,
              options: [{
                  value: 'roiContourMenu',
                  svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-switch-volume',
                  svgWidth: 15,
                  svgHeight: 13,
                  bottomLabel: 'Contours'
              },
              {
                  value: 'segmentationMenu',
                  svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-seg-management-menu',
                  svgWidth: 15,
                  svgHeight: 13,
                  bottomLabel: 'Segments'
              }]
          };
    },
    toolbarButtons() {
        const extraTools = [];

        extraTools.push({
            id: 'crosshairs',
            title: 'Crosshairs',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-crosshairs'
        });

        extraTools.push({
            id: 'magnify',
            title: 'Magnify (M)',
            classes: 'imageViewerTool toolbarSectionButton',
            iconClasses: 'fa fa-circle'
        });

        extraTools.push({
            id: 'wwwcRegion',
            title: 'ROI Window (R)',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square'
        });

        extraTools.push({
            id: 'dragProbe',
            title: 'Probe',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-dot-circle-o'
        });

        extraTools.push({
          id: 'showSyncSettings',
          title: 'Sync Settings',
          classes: 'imageViewerCommand',
          iconClasses: 'fa fa-link'
        });

        extraTools.push({
            id: 'invert',
            title: 'Invert (I)',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-adjust'
        });

        extraTools.push({
            id: 'rotateL',
            title: 'Left (<)',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-rotate-left'
        });

        extraTools.push({
            id: 'rotateR',
            title: 'Right (>)',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-rotate-right'
        });

        extraTools.push({
            id: 'flipH',
            title: 'Flip H (H)',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-horizontal'
        });

        extraTools.push({
            id: 'flipV',
            title: 'Flip V (V)',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-vertical'
        });

        extraTools.push({
            id: 'resetViewport',
            title: 'Reset',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-undo'
        });

        const buttonData = [];

        if (!OHIF.uiSettings.displayEchoUltrasoundWorkflow) {

            buttonData.push({
                id: 'previousDisplaySet',
                title: 'Previous',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-up fa-fw'
            });

            buttonData.push({
                id: 'nextDisplaySet',
                title: 'Next',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-down fa-fw'
            });

            const { isPlaying } = OHIF.viewerbase.viewportUtils;
            buttonData.push({
                id: 'toggleCinePlay',
                title: () => isPlaying() ? 'Stop' : 'Play',
                classes: 'imageViewerCommand',
                iconClasses: () => ('fa fa-fw ' + (isPlaying() ? 'fa-stop' : 'fa-play')),
                active: isPlaying
            });

            buttonData.push({
                id: 'toggleCineDialog',
                title: 'CINE',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-youtube-play',
                active: () => $('#cineDialog').is(':visible')
            });
        }

        buttonData.push({
            id: 'layout',
            title: 'Layout',
            iconClasses: 'fa fa-th-large',
            buttonTemplateName: 'layoutButton'
        });

        buttonData.push({
            id: 'zoom',
            title: 'Zoom (Z)',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels (L)',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan (P)',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-pan'
        });

        const annotationTools = [
          {
            id: 'length',
            title: 'Length',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
          },
          {
            id: 'annotate',
            title: 'Annotate',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target'
          },
          {
            id: 'angle',
            title: 'Angle',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-angle-left'
          },/*
          {
            id: 'bidirectional',
            title: 'Bidirectional',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#bidirectional-tool'
          },*/
          {
            id: 'ellipticalRoi',
            title: 'Ellipse',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-circle-o'
          },
          {
            id: 'rectangleRoi',
            title: 'Rectangle',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square-o'
          }
        ];

        buttonData.push({
            id: 'Annotations',
            title: 'Annotations',
            classes: 'rp-x-1 rm-l-3',
            svgLink: 'packages/icr_xnat-roi/assets/icons.svg#annotations-menu',
            subTools: annotationTools
        });

        const freehandTools = [
          {
              id: 'freehandRoi',
              title: 'Draw (D)',
              classes: 'imageViewerTool',
              svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-freehand-draw'
          },
          {
              id: 'freehandRoiSculptor',
              title: 'Sculpt (S)',
              classes: 'imageViewerTool',
              svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-freehand-sculpt'
          }
        ];

        const deleteTools = [
          {
            id: 'eraser',
            title: 'Eraser (E)',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-eraser'
          },
          {
              id: 'clearTools',
              title: 'Clear',
              classes: 'imageViewerCommand',
              iconClasses: 'fa fa-trash'
          }
        ];

        buttonData.push({
            id: 'Freehand',
            title: 'ROI',
            classes: 'rp-x-1 rm-l-3',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-freehand-menu',
            subTools: freehandTools
        });

        const brushTools = [
          {
            id: 'brush',
            title: 'Manual (B)',
            classes: 'imageViewerTool',
            svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-brush-regular'
          },
          {
            id: 'brushHUGated',
            title: 'Smart CT',
            classes: 'imageViewerTool',
            svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-brush-smart'
          },
          {
            id: 'brushAutoGated',
            title: 'Auto',
            classes: 'imageViewerTool',
            svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-brush-auto'
          }
        ];

        buttonData.push({
            id: 'Brush',
            title: 'Segment',
            classes: 'rp-x-1 rm-l-3',
            svgLink: 'packages/icr_peppermint-tools/assets/icons.svg#icon-segmentation-menu',
            subTools: brushTools
        });

        buttonData.push({
          id: 'delete',
          title: 'Delete',
          classes: 'rp-x-1 rm-l-3',
          iconClasses: 'fa fa-times',
          subTools: deleteTools
        });

        buttonData.push({
            id: 'toggleMore',
            title: 'More',
            classes: 'rp-x-1 rm-l-3',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-more',
            subTools: extraTools
        });

        buttonData.push({
          id: 'showHelp',
          title: 'Help',
          classes: 'imageViewerCommand',
          iconClasses: 'fa fa-question'
        });

        return buttonData;
    },

    hangingProtocolButtons() {
        let buttonData = [];

        buttonData.push({
            id: 'previousPresentationGroup',
            title: 'Prev. Stage',
            iconClasses: 'fa fa-step-backward',
            buttonTemplateName: 'previousPresentationGroupButton'
        });

        buttonData.push({
            id: 'nextPresentationGroup',
            title: 'Next Stage',
            iconClasses: 'fa fa-step-forward',
            buttonTemplateName: 'nextPresentationGroupButton'
        });

        return buttonData;
    }

});

Template.toolbarSection.onRendered(function() {
    const instance = Template.instance();

    instance.$('#layout').dropdown();

    // TODO: Figure out a way to disable/enable the buttons with each status from
    // New API

    // const states = OHIF.viewerbase.toolManager.getToolDefaultStates();
    // const disabledToolButtons = states.disabledToolButtons;
    // const allToolbarButtons = $('#toolbar').find('button');
    // if (disabledToolButtons && disabledToolButtons.length > 0) {
    //     for (let i = 0; i < allToolbarButtons.length; i++) {
    //         const toolbarButton = allToolbarButtons[i];
    //         $(toolbarButton).prop('disabled', false);

    //         const index = disabledToolButtons.indexOf($(toolbarButton).attr('id'));
    //         if (index !== -1) {
    //             $(toolbarButton).prop('disabled', true);
    //         }
    //     }
    // }
});
