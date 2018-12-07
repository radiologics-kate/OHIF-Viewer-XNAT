/** @export @public @async
 * awaitOverwriteConfirmationDialog - Awaits user input for confirmation.
 *
 * @return {Promise} A promise that resolves to true or false.
 */
export default async function (content) {

  function confirmNewEventHandler () {
    dialog.close();

    removeEventListeners();
    resolveRef('NEW');
  }

  function confirmOverwriteEventHandler () {
    dialog.close();

    removeEventListeners();
    resolveRef('OVERWRITE');
  }

  function cancelEventHandler () {
    removeEventListeners();
    resolveRef(false);
  }

  function cancelClickEventHandler () {
    dialog.close();

    removeEventListeners();
    resolveRef(false);
  }

  function removeEventListeners() {
    dialog.removeEventListener('cancel', cancelEventHandler);
    cancel.removeEventListener('click', cancelClickEventHandler);
    confirmNew.removeEventListener('click', confirmNewEventHandler);
    confirmOverwrite.removeEventListener('click', confirmOverwriteEventHandler)
  }

  const dialog = document.getElementById('ioOverwriteConfirmationDialog');
  const ioConfirmationTitle = dialog.getElementsByClassName('io-confirmation-title')[0];
  const ioConfirmationBody = dialog.getElementsByClassName('io-confirmation-body')[0];
  const confirmNew = dialog.getElementsByClassName('js-io-confirmation-confirm-new')[0];
  const confirmOverwrite = dialog.getElementsByClassName('js-io-confirmation-confirm-overwrite')[0];
  const cancel = dialog.getElementsByClassName('js-io-confirmation-cancel')[0];


  console.log(dialog);

  // Add event listeners.
  dialog.addEventListener('cancel', cancelEventHandler);
  cancel.addEventListener('click', cancelClickEventHandler);
  confirmNew.addEventListener('click', confirmNewEventHandler);
  confirmOverwrite.addEventListener('click', confirmOverwriteEventHandler);

  ioConfirmationTitle.textContent = content.title;
  ioConfirmationBody.textContent = content.body;

  dialog.showModal();

  // Reference to promise.resolve, so that I can use external handlers.
  let resolveRef;

  return new Promise(resolve => {
    resolveRef = resolve;
  });
}
