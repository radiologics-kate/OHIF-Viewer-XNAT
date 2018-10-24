import { stackSynchronizer } from '../../../lib/stackSynchronizer.js';

Template.stackSyncDialog.onRendered(() => {
  const instance = Template.instance();
  const dialogIds = ['stackSyncDialog'];

  dialogIds.forEach(id => {
    const dialog = instance.$('#' + id);
    dialogPolyfill.registerDialog(dialog.get(0));
  });
});

Template.stackSyncDialog.onCreated(() => {
  const instance = Template.instance();
  instance.data.syncScansByDefault = new ReactiveVar(Session.get('defaultStackSync'));

  instance.autorun(function() {
    // Set the function
    const syncScansByDefault = instance.data.syncScansByDefault.get();
    Session.set('defaultStackSync', syncScansByDefault);
  });
});

Template.stackSyncDialog.helpers({
    isChecked() {
        const isSynced = this.syncScansByDefault.get();

        if (isSynced) {
          return 'checked';
        }

        return;
    }
});

Template.stackSyncDialog.events({
    'click .js-syncScansByDefault-check'(event) {
      this.syncScansByDefault.set(!this.syncScansByDefault.get());
    },
    'change .js-switchSyncMethod-select'(event) {
      const method = event.currentTarget.value;
      stackSynchronizer.changeSynchronizationStrategy(method);
    }
});
