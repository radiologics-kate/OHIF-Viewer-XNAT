Package.describe({
    name: 'icr:series-info-provider',
    summary: 'Helper module to get useful series information.',
    version: '1.0.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use(['ecmascript',
        'standard-app-packages',
    ]);

    // OHIF dependencies
    api.use([
        'ohif:core'
    ]);

    api.mainModule('main.js', 'client');
});
