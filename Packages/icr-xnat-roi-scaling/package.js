Package.describe({
    name: 'icr:xnat-roi-scaling',
    summary: 'Scaling functionality for importing of different data types.',
    version: '0.1.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use(['ecmascript',
        'standard-app-packages'
    ]);

    // OHIF dependencies
    api.use([
        'ohif:core',
        'ohif:cornerstone'
    ]);

    api.addFiles('client/lib/rescaleImportedPolygons.js', 'client');

    api.mainModule('main.js', 'client');

});
