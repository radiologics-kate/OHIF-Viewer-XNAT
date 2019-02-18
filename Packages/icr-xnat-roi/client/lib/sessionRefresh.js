// Refresh the XNAT session every minute when the viewer is open.
setInterval(function() {
  console.log("request session refresh...");
  getBuildInfo();
}, 60000);

/**
 * Queries the buildInfo
 *
 * @author JamesAPetts
 */
function getBuildInfo() {
  const xhr = new XMLHttpRequest();

  xhr.open("GET", `${Session.get("rootUrl")}/xapi/siteConfig/buildInfo`);
  //xhr.responseType = "json";
  xhr.send();
}
