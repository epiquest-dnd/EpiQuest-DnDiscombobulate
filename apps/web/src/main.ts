import { createApp } from 'vue';
import App from './App.vue';
import { createAppI18n } from './i18n.ts';

const i18n = createAppI18n();
// La langue lue par les lecteurs d'écran suit la langue active (ADR-0004).
document.documentElement.lang = i18n.global.locale.value;

createApp(App).use(i18n).mount('#app');
