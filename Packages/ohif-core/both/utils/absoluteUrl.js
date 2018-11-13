import { OHIF } from 'meteor/ohif:core';

// Return an absolute URL with the page domain using sub path of ROOT_URL
// to let multiple domains directed to the same server work

const routingMode = 'LOCALHOST';

if (routingMode === 'XNAT') {
  OHIF.utils.absoluteUrl = function(path) {
    // JPETTS -- Overriding this function in order to display correctly when hosted at an arbitrary subdirectory in XNAT
    let viewerUrl = Session.get('viewerRoot');

    if (path[0] === '/') {
      return `${viewerUrl}${path}`;
    }

    return `${viewerUrl}/${path}`;
  };
} else if (routingMode === 'LOCALHOST') {
  OHIF.utils.absoluteUrl = function(path) {
      let absolutePath = '/';

      const absoluteUrl = Meteor.absoluteUrl();
      const absoluteUrlParts = absoluteUrl.split('/');

      if (absoluteUrlParts.length > 4) {
          const rootUrlPrefixIndex = absoluteUrl.indexOf(absoluteUrlParts[3]);
          absolutePath += absoluteUrl.substring(rootUrlPrefixIndex) + path;
      } else {
          absolutePath += path;
      }

      return absolutePath.replace(/\/\/+/g, '/');
  };
} else {
  console.error('routingMode set to an invalid value.');
}
