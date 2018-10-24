Package.describe({
    name: 'icr:freehand-three-d',
    summary: '3D freehand roi plugin for OHIF',
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

    api.mainModule('main.js', 'client');
});
