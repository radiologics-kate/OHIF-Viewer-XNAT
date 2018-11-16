Package.describe({
    name: 'icr:peppermint-tools',
    summary: 'cornerstoneTools plugin for 3D tools.',
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
      'ohif:core',
      'ohif:hotkeys',
      'ohif:log',
      'icr:series-info-provider',
      'icr:xnat-roi-namespace'
    ]);


    // ===== Assets =====
    api.addAssets('assets/icons.svg', 'client');


    // keyInterface
    api.addFiles('client/lib/keyInterface/brushToolKeyInterface.js', 'client');
    api.addFiles('client/lib/keyInterface/freehandToolKeyInterface.js', 'client');

    // Components

    api.addFiles(
      'client/components/viewer/peppermint-table.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/freehandSetNameDialogs/freehandSetNameDialogs.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/freehandSetNameDialogs/freehandSetNameDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/freehandSetNameDialogs/freehandSetNameDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataDialogs.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataSearchList/brushMetadataSearchList.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataSearchList/brushMetadataSearchList.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataSearchListItem/brushMetadataSearchListItem.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataSearchListItem/brushMetadataSearchListItem.js',
      'client'
    );

    api.addFiles(
      'client/components/viewer/brushMetadataDialogs/brushMetadataModifiers/brushMetadataModifiers.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementDialogs.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementDialogs.js',
      'client'
    );
    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementDialogs.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementList/segManagementList.html',
      'client'
    );

    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementList/segManagementList.styl',
      'client'
    );

    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementListItem/segManagementListItem.html',
      'client'
    );
    api.addFiles(
      'client/components/viewer/segManagementDialogs/segManagementListItem/segManagementListItem.js',
      'client'
    );


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
      'client/components/viewer/volumeManagementDialogs/roiCollectionList/roiCollectionList.styl',
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

    api.mainModule('main.js', 'client');
});
