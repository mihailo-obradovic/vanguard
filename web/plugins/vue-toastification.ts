import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

import type { PluginOptions } from 'vue-toastification';

const options: PluginOptions = {};

export default defineNuxtPlugin((app) => {
  app.vueApp.use(Toast, options);
});
