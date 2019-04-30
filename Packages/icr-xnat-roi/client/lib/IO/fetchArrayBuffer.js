import makeCancelable from "../util/makeCancelable.js";

export default function fetchArrayBuffer(route) {
  return makeCancelable(
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const url = `${Session.get("rootUrl")}${route}`;

      console.log(`fetching: ${url}`);

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          resolve(null);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("GET", url);
      xhr.responseType = "arraybuffer";
      xhr.send();
    })
  );
}
