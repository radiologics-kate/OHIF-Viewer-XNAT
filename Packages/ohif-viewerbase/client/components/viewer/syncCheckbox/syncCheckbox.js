import { Template } from 'meteor/templating';
import { viewportUtils } from '../../../lib/viewportUtils';
import { stackSynchronizer } from '../../../lib/stackSynchronizer.js';
import { getElementIfNotEmpty } from '../../../lib/getElementIfNotEmpty.js';

// JamesAPetts
Template.syncCheckbox.onCreated(() => {
    const instance = Template.instance();

    instance.data.synced = new ReactiveVar(Session.get('defaultStackSync'));

    instance.autorun(function() {
        const isSynced = Session.get('defaultStackSync');
        instance.data.synced.set(isSynced);
    });
});

Template.syncCheckbox.helpers({
    isChecked() {
        Session.get('CornerstoneImageRendered' + this.viewportIndex);

        const isSynced = this.synced.get();

        const element = getElementIfNotEmpty(this.viewportIndex);

        if (!element) {
            return;
        }

        if (isSynced) {
          stackSynchronizer.add(element);
          return 'checked';
        }

        stackSynchronizer.remove(element);
        return;
    }
});

Template.syncCheckbox.events({
    'click .js-sync-check'(event) {
      this.synced.set(!this.synced.get());
    }
});
