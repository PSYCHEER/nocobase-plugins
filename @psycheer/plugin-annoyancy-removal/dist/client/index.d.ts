import { Plugin } from '@nocobase/client';
export declare class PluginAnnoyancyRemovalClient extends Plugin {
    afterAdd(): Promise<void>;
    beforeLoad(): Promise<void>;
    load(): Promise<void>;
    blockLicenseUrls(): void;
    hideElements(settings: {
        hideLicenseSettings: boolean;
        hideAiIntegration: boolean;
        hideMobileDeprecated: boolean;
        hideChangePassword: boolean;
        hideVerification: boolean;
        hideTheme: boolean;
    }): void;
}
export default PluginAnnoyancyRemovalClient;
