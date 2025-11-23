import { Plugin } from '@nocobase/client';
import { SettingsPage } from './SettingsPage';

export class PluginCssOverrideClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('css-override', {
      title: 'CSS Override',
      icon: 'BgColorsOutlined',
      Component: SettingsPage,
    });

    const loadCss = async () => {
      try {
        // Avoid applying custom CSS on signin/login pages — saved CSS may hide login form
        const path = window.location.pathname || '';
        if (/signin|login|register/i.test(path)) {
          return;
        }

        const api = this.app.apiClient;
        const response = await api.request({
          url: 'cssOverride:get?filterByTk=1',
        });
        const customCss = response?.data?.data?.customCss || '';

        let style = document.getElementById('custom-css-override') as HTMLStyleElement;
        if (!style) {
          style = document.createElement('style');
          style.id = 'custom-css-override';
          document.head.appendChild(style);
        }
        style.textContent = customCss;
      } catch (error) {
        // don't throw — log and continue so signin flow is unaffected
        console.error('Failed to load custom CSS:', error);
      }
    };

    setTimeout(() => {
      loadCss();
    }, 1000);

    (window as any).reloadCustomCss = loadCss;
  }
}

export default PluginCssOverrideClient;
