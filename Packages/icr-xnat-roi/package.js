Package.describe({
    name: 'icr:xnat-roi',
    summary: 'Region of interest import/export and volume functionality.',
    version: '0.1.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use(['ecmascript',
        'standard-app-packages',
        'http',
        'jquery',
        'stylus'
    ]);

    // OHIF dependencies
    api.use([
        'ohif:design',
        'ohif:cornerstone',
        'ohif:viewerbase',
        'ohif:core',
        'ohif:hotkeys',
        'ohif:log',
        'icr:xnat-roi-namespace',
        'icr:freehand-three-d',
        'icr:series-info-provider'
    ]);

    // ===== Assets =====
    api.addAssets('assets/icons.svg', 'client');

    // ===== Interface =====
    api.addFiles('client/viewportFunctions.js', 'client');
    api.addFiles('client/test.js', 'client');

    // ===== Components =====
    api.addFiles('client/components/viewer/ioDialogs/ioDialogs.html', 'client');
    api.addFiles('client/components/viewer/ioDialogs/ioDialogs.js', 'client');
    api.addFiles('client/components/viewer/ioDialogs/ioDialogs.styl', 'client');

    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeManagementDialogs.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeManagementDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeManagementDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/roiCollectionList/roiCollectionList.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeList/volumeList.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeList/volumeList.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeListItem/volumeListItem.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/volumeManagementDialogs/volumeListItem/volumeListItem.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/roiImportListDialogs/roiImportListDialogs.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiImportListDialogs/roiImportListDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiImportListDialogs/roiImportListDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/roiImportListDialogs/roiImportListItem/roiImportListItem.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiImportListDialogs/roiImportListItem/roiImportListItem.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/roiCollectionBuilderDialogs/roiCollectionBuilderDialogs.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiCollectionBuilderDialogs/roiCollectionBuilderDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiCollectionBuilderDialogs/roiCollectionBuilderDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/roiCollectionBuilderDialogs/roiCollectionBuilderListItem/roiCollectionBuilderListItem.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/roiCollectionBuilderDialogs/roiCollectionBuilderListItem/roiCollectionBuilderListItem.js',
      'client'
    );

    // Help Menu
    api.addFiles('client/components/viewer/helpDialogs/helpDialogs.html', 'client');
    api.addFiles('client/components/viewer/helpDialogs/helpDialogs.js', 'client');
    api.addFiles('client/components/viewer/helpDialogs/helpDialogs.styl', 'client');

    // -- freehand

    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/freehandHelpMenu.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/freehandHelpMenu.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/divs/freehandHelpDraw.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/divs/freehandHelpSculpt.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/divs/freehandHelpToggleStats.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/freehandHelpMenu/divs/freehandHelpVolumes.html',
      'client'
    );

    // -- io
    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/ioHelpMenu.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/ioHelpMenu.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/divs/ioHelpExport.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/divs/ioHelpExport.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/divs/ioHelpImport.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/helpDialogs/ioHelpMenu/divs/ioHelpSnapshot.html',
      'client'
    );


    api.mainModule('main.js', 'client');
});
