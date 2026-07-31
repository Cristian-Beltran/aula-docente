import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Dialog, Loading, Notify, Quasar } from 'quasar';
import App from './App.vue';
import router from './router';

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import './css/app.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading,
  },
  config: {
    notify: {
      position: 'bottom',
      timeout: 1800,
      progress: false,
      closeBtn: 'close',
      actions: [],
    },
  },
});
app.use(pinia);
app.use(router);

app.mount('#q-app');
