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
        'stylus',
        'momentjs:moment',
        'validatejs',
        'u2622:persistent-session'
    ]);

    // OHIF dependencies
    api.use([
        'ohif:design',
        'ohif:cornerstone',
        'ohif:viewerbase',
        'ohif:core',
        'ohif:hotkeys',
        'ohif:log',
        'icr:xnat-roi-namespace'
    ]);

    api.mainModule('main.js', 'client');
});
