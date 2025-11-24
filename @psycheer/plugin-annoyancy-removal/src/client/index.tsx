import { Plugin } from '@nocobase/client';
import { SettingsPage } from './SettingsPage';

export class PluginAnnoyancyRemovalClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.pluginSettingsManager.add('annoyancy-removal-settings', {
      title: 'Annoyancy Removal',
      icon: 'EyeInvisibleOutlined',
      Component: SettingsPage,
      aclSnippet: 'pm.annoyancy-removal-settings',
    });
    
    const loadSettings = async () => {
      try {
        const response = await this.app.apiClient.request({
          url: 'annoyancyRemovalSettings:get',
          method: 'post',
        });
        return response?.data?.data || {
          hideLicenseSettings: true,
          hideAiIntegration: true,
          hideMobileDeprecated: true,
          hideChangePassword: true,
          hideVerification: true,
          hideTheme: true,
        };
      } catch (error) {
        return {
          hideLicenseSettings: true,
          hideAiIntegration: true,
          hideMobileDeprecated: true,
          hideChangePassword: true,
          hideVerification: true,
          hideTheme: true,
        };
      };
    };
    
    const path = window.location.pathname || '';
    // Do not run these UI-hiding or redirecting helpers on signin/login/register pages
    if (!/signin|login|register/i.test(path)) {
      const hasAuthToken = () => {
        try {
          // check common localStorage keys
          const ls = window.localStorage;
          const keys = ['nb_token', 'nb:token', 'token', 'access_token', 'nocobase_token', 'Authorization'];
          for (const k of keys) {
            if (ls && ls.getItem && ls.getItem(k)) return true;
          }

          // check cookies
          const cookie = document.cookie || '';
          if (/nb_token=|nb:token=|access_token=|nocobase_token=|token=/i.test(cookie)) return true;
        } catch (e) {
          // ignore access errors
        }
        return false;
      };

      if (hasAuthToken()) {
        loadSettings().then((settings) => {
          if (settings.hideLicenseSettings || settings.hideAiIntegration || settings.hideMobileDeprecated) {
            this.hideElements(settings);
          }

          this.blockLicenseUrls();
        }).catch(() => {
          // swallow errors so signin is not affected
        });
      } else {
        // If no auth token yet, poll shortly for login (user may login without full page reload)
        let checks = 0;
        const maxChecks = 30; // ~30s
        const intervalId = setInterval(async () => {
          checks += 1;
          if (hasAuthToken()) {
            clearInterval(intervalId);
            try {
              const settings = await loadSettings();
              if (settings.hideLicenseSettings || settings.hideAiIntegration || settings.hideMobileDeprecated) {
                this.hideElements(settings);
              }
              this.blockLicenseUrls();
            } catch (e) {
              // ignore
            }
          }
          if (checks >= maxChecks) {
            clearInterval(intervalId);
          }
        }, 1000);
      }
    }
  }
  
  blockLicenseUrls() {
    const blockLicenseUrl = () => {
      const path = window.location.pathname;
      if (path.includes('annoyancy-removal')) {
        return;
      }
      
      if (path.includes('/admin/settings/license-settings') || 
          path.includes('/admin/settings/license')) {
        window.location.href = '/admin/settings';
      }
    };
    
    blockLicenseUrl();
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      blockLicenseUrl();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      blockLicenseUrl();
    };
    
    window.addEventListener('popstate', blockLicenseUrl);
  }
  
  hideElements(settings: { 
    hideLicenseSettings: boolean; 
    hideAiIntegration: boolean; 
    hideMobileDeprecated: boolean; 
    hideChangePassword: boolean;
    hideVerification: boolean;
    hideTheme: boolean;
  }) {
    const hideElementsInternal = () => {
      const existingStyle = document.getElementById('license-hider-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Don't apply hiding on settings page
      if (window.location.pathname.includes('annoyancy-removal')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'license-hider-styles';
      
      let cssRules = '';
      
      if (settings.hideLicenseSettings) {
        cssRules += `
        a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"]),
        li[data-menu-id*="license"]:not([data-menu-id*="annoyancy-removal"]):not([data-menu-id*="permissions"]) {
          display: none !important;
        }
        
        .ant-menu-item:has(a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])) {
          display: none !important;
        }
        
        li:has(a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])) {
          display: none !important;
        }
        
        .ant-card:has(a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])),
        .ant-list-item:has(a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])),
        .ant-col:has(a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])) {
          display: none !important;
        }
        `;
      }
      
      if (settings.hideAiIntegration) {
        cssRules += `
        li.ant-menu-item[data-menu-id="ai"],
        li.ant-menu-item[data-menu-id^="ai-"],
        li.ant-menu-item[data-menu-id$="-ai"],
        li.ant-menu-item[data-menu-id*="-ai-"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id="ai"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id^="ai-"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id$="-ai"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id*="-ai-"] {
          display: none !important;
        }
        
        .ant-card:has(a[href^="/admin/settings/ai"]),
        .ant-list-item:has(a[href^="/admin/settings/ai"]),
        .ant-col:has(a[href^="/admin/settings/ai"]) {
          display: none !important;
        }
        `;
      }
      
      if (settings.hideMobileDeprecated) {
        cssRules += `
        li.ant-menu-item[data-menu-id$="-mobile"],
        li.ant-menu-item[title="Mobile (deprecated)"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id="mobile"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id^="mobile-"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id$="-mobile"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id*="-mobile-"] {
          display: none !important;
        }
        `;
      }
      
      if (settings.hideChangePassword) {
        cssRules += `
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id*="changePassword"],
        .ant-dropdown li.ant-dropdown-menu-item[title="changePassword"] {
          display: none !important;
        }
        `;
      }
      
      if (settings.hideVerification) {
        cssRules += `
        li.ant-menu-item[data-menu-id$="-verification"],
        li.ant-menu-item[title="Verification"],
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id*="verification"],
        .ant-dropdown li.ant-dropdown-menu-item[title="verification"] {
          display: none !important;
        }
        `;
      }
      
      if (settings.hideTheme) {
        cssRules += `
        .ant-dropdown li.ant-dropdown-menu-item[data-menu-id*="theme"],
        .ant-dropdown li.ant-dropdown-menu-item[title="theme"] {
          display: none !important;
        }
        `;
      }
      
      style.textContent = cssRules;
      document.head.appendChild(style);
    };
    
    hideElementsInternal();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideElementsInternal);
    }
    
    const observer = new MutationObserver(() => {
      const path = window.location.pathname;
      if (path.includes('annoyancy-removal') || path.includes('permissions')) {
        return;
      }
      
      setTimeout(() => {
        if (settings.hideLicenseSettings) {
          const licenseLinks = document.querySelectorAll('a[href*="/admin/settings/license"]:not([href*="annoyancy-removal"]):not([href*="permissions"])');
          licenseLinks.forEach(link => {
            const parent = link.closest('li') || link.closest('.ant-menu-item') || link.parentElement;
            if (parent) (parent as HTMLElement).style.display = 'none';
          });
        }
        
        if (settings.hideAiIntegration) {
          const aiItems = document.querySelectorAll('li.ant-menu-item[data-menu-id="ai"], li.ant-menu-item[data-menu-id^="ai-"], li.ant-menu-item[data-menu-id$="-ai"], li.ant-menu-item[data-menu-id*="-ai-"]');
          aiItems.forEach(item => (item as HTMLElement).style.display = 'none');
          
          const allCards = document.querySelectorAll('.ant-card');
          allCards.forEach(card => {
            const text = card.textContent || '';
            if (text.includes('AI integration') || text.includes('AI Integration')) {
              (card as HTMLElement).style.display = 'none';
            }
          });
        }
        
        if (settings.hideMobileDeprecated) {
          const allMenuItems = document.querySelectorAll('li.ant-menu-item');
          allMenuItems.forEach(item => {
            const titleSpan = item.querySelector('.ant-menu-title-content');
            if (titleSpan && titleSpan.textContent?.includes('Mobile (deprecated)')) {
              (item as HTMLElement).style.display = 'none';
            }
          });
          
          const allCards = document.querySelectorAll('.ant-card');
          allCards.forEach(card => {
            const text = card.textContent || '';
            if (text.includes('Mobile (deprecated)')) {
              (card as HTMLElement).style.display = 'none';
            }
          });
        }
        
        if (settings.hideChangePassword) {
          const dropdownItems = document.querySelectorAll('.ant-dropdown li.ant-dropdown-menu-item');
          dropdownItems.forEach(item => {
            const text = item.textContent || '';
            if (text.includes('Change password')) {
              (item as HTMLElement).style.display = 'none';
            }
          });
        }
        
        if (settings.hideVerification) {
          const dropdownItems = document.querySelectorAll('.ant-dropdown li.ant-dropdown-menu-item');
          dropdownItems.forEach(item => {
            const text = item.textContent || '';
            if (text.includes('Verification')) {
              (item as HTMLElement).style.display = 'none';
            }
          });
        }
        
        if (settings.hideTheme) {
          const dropdownItems = document.querySelectorAll('.ant-dropdown li.ant-dropdown-menu-item');
          dropdownItems.forEach(item => {
            const text = item.textContent || '';
            if (text.includes('Theme')) {
              (item as HTMLElement).style.display = 'none';
            }
          });
        }
      }, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

export default PluginAnnoyancyRemovalClient;
