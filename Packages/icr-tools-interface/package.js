Package.describe({
    name: 'icr:tools-interface',
    summary: 'Keyboard interface for cornerstoneTools api hooks.',
    version: '1.0.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use(['ecmascript',
        'standard-app-packages',
    ]);

    // OHIF dependencies
    api.use([
        'ohif:core',
        'ohif:cornerstone'
    ]);

    api.addFiles('client/lib/keyInterface.js', 'client');
});
