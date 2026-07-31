import { boot } from 'quasar/wrappers';
import { Notify } from 'quasar';

export default boot(() => {
  Notify.setDefaults({
    position: 'bottom',
    timeout: 1800,
    progress: false,
    closeBtn: true,
    actions: [],
  });
});
