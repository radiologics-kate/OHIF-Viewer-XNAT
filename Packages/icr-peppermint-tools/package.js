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
      'icr:series-info-provider'
    ]);

    api.addFiles('client/lib/keyInterface/brushToolKeyInterface.js', 'client');
    api.addFiles('client/lib/keyInterface/freehandToolKeyInterface.js', 'client');

    api.mainModule('main.js', 'client');
});
