const showProgressDialog = content => {
  const dialog = document.getElementById("ioProgress");
  if (content) {
    updateProgressDialog(content);
  }

  dialog.showModal();
};

const closeProgressDialog = () => {
  const dialog = document.getElementById("ioProgress");

  dialog.close();
};

const updateProgressDialog = content => {
  console.log("updating progress dialog");

  if (content.notificationText) {
    document.getElementById("ioNotificationText").innerHTML =
      content.notificationText;
  }

  document.getElementById("ioProgressText").innerHTML = content.progressText
    ? content.progressText
    : `<i class="fa fa-spin fa-circle-o-notch fa-fw">`;
};

export default {
  show: showProgressDialog,
  close: closeProgressDialog,
  update: updateProgressDialog
};
