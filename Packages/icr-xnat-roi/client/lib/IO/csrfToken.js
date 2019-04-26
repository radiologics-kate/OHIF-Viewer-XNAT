import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

/**
 * fetchCSRFToken - Fetches the users CSRFToken from the XNAT backend. Required
 * for PUT events.
 *
 * @returns {Promise} A promise that resolves to the token.
 */
export function fetchCSRFToken() {
  return new Promise((resolve, reject) => {
    const url = `${Session.get("rootUrl")}`;
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      const childNodes = xhr.response.childNodes;

      let htmlNode;

      for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i] instanceof HTMLElement) {
          htmlNode = childNodes[i];
          break;
        }
      }

      const csrfToken = htmlNode.innerHTML
        .split("csrfToken = '")[1]
        .split("'")[0];

      resolve(csrfToken);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
  });
}
