import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import { createAppI18n } from './i18n.ts';

describe('App', () => {
  it('affiche le titre traduit dans un titre de niveau 1', () => {
    const wrapper = mount(App, { global: { plugins: [createAppI18n()] } });
    expect(wrapper.get('main h1').text()).toBe('EpiQuest');
  });
});
