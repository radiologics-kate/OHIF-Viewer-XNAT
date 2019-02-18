import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element, and stores the result in the Session variables.
 *
 * @author JamesAPetts
 */
export async function checkAndSetPermissions() {
  const parentProjectId = icrXnatRoiSession.get("parentProjectId");
  const sourceProjectId = icrXnatRoiSession.get("sourceProjectId");

  const url = `${Session.get(
    "rootUrl"
  )}/xapi/roi/projects/${sourceProjectId}/permissions/RoiCollection`;

  console.log(`checkAndSetPermissions: ${url}`);

  getPermissionsJson(url)
    .then(result => {
      console.log("checkAndSetPermissions GET result:");
      console.log(result);

      const { status, response } = result;

      if (status === 200) {
        console.log(
          `permissions: create: ${response.create},
        read: ${response.read},
        edit: ${response.edit}`
        );

        icrXnatRoiSession.set("writePermissions", response.create);
        icrXnatRoiSession.set("readPermissions", response.read);
        icrXnatRoiSession.set("editPermissions", response.edit);
      } else if (parentProjectId) {
        // Assume read only of parent  project.
        console.log("Can only read from parent project");
        icrXnatRoiSession.set("writePermissions", false);
        icrXnatRoiSession.set("readPermissions", true);
        icrXnatRoiSession.set("editPermissions", false);
      }
    })
    .catch(err => {
      console.log(err);

      icrXnatRoiSession.set("writePermissions", false);
      icrXnatRoiSession.set("readPermissions", false);
      icrXnatRoiSession.set("editPermissions", false);
    });
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
      resolve(xhr);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
}
