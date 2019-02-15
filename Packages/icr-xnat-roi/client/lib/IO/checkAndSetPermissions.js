import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element, and stores the result in the Session variables.
 *
 * @author JamesAPetts
 */
export async function checkAndSetPermissions() {
  const url = `${Session.get(
    "rootUrl"
  )}/xapi/roi/projects/${icrXnatRoiSession.get(
    "projectId"
  )}/permissions/RoiCollection`;

  console.log(`checkAndSetPermissions: ${url}`);

  const roiCollectionPermissions = await getPermissionsJson(url).catch(error =>
    console.log(error)
  );

  console.log(
    `permissions: create: ${roiCollectionPermissions.create},
    read: ${roiCollectionPermissions.read},
    edit: ${roiCollectionPermissions.edit}`
  );

  icrXnatRoiSession.set("writePermissions", roiCollectionPermissions.create);
  icrXnatRoiSession.set("readPermissions", roiCollectionPermissions.read);
  icrXnatRoiSession.set("editPermissions", roiCollectionPermissions.edit);
}

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element.
 *
 * @author JamesAPetts
 * @param {String} url - The REST call to be made.
 * @returns {JSON} A JSON representation of the permissions.
 */
function getPermissionsJson(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr.response);
      }
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
}
