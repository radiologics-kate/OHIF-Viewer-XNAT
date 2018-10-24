import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element, and stores the result in the Session variable: writePermissions.
 *
 * @author JamesAPetts
 */
export async function checkAndSetPermissions () {
  const url = `${Session.get('rootUrl')}/xapi/roi/projects/${icrXnatRoiSession.get('projectId')}/permissions/RoiCollection`;

  const roiCollectionPermissions = await getPermissionsJson(url).catch(error => console.log(error));

  if (roiCollectionPermissions.create) {
    console.log('ROI Collection write permissions for this project? True.');
    icrXnatRoiSession.set('writePermissions', true);
  } else {
    console.log('ROI Collection write permissions for this project? False.');
    icrXnatRoiSession.set('writePermissions', false);
  }
}

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element, and stores the result in the Session variable: writePermissions.
 *
 * @author JamesAPetts
 * @param {String} url - The REST call to be made.
 * @returns {JSON} A JSON representation of the permissions.
 */
function getPermissionsJson (url) {
  return new Promise ((resolve,reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if ( xhr.status === 200 ) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    }

    xhr.onerror = () => {
      reject(xhr.responseText);
    }

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}
