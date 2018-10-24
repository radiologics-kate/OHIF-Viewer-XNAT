Package.describe({
    name: 'icr:xnat-roi-namespace',
    summary: 'Namespaced Session variables for icr-xnat-roi libraries.',
    version: '1.0.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use(['ecmascript',
        'underscore'
    ]);

    // OHIF dependencies
    api.use([
        'ohif:core',
        'ohif:cornerstone'
    ]);

    api.mainModule('main.js', 'client');
});
