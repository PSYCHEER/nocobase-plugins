import { Plugin } from '@nocobase/server';
import path from 'path';

export class PluginAnnoyancyRemovalServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
    
    this.app.resource({
      name: 'annoyancyRemovalSettings',
      actions: {
        get: async (ctx, next) => {
          const repo = this.db.getRepository('annoyancyRemovalSettings');
          let settings = await repo.findOne({
            filter: { key: 'default' },
          });
          
          if (!settings) {
            settings = await repo.create({
              values: {
                key: 'default',
                hideLicenseSettings: true,
                hideAiIntegration: true,
                hideMobileDeprecated: true,
              },
            });
          }
          
          ctx.body = settings;
          await next();
        },
        update: async (ctx, next) => {
          const repo = this.db.getRepository('annoyancyRemovalSettings');
          const { hideLicenseSettings, hideAiIntegration, hideMobileDeprecated } = ctx.action.params.values || ctx.request.body;
          
          let settings = await repo.findOne({
            filter: { key: 'default' },
          });
          
          if (!settings) {
            settings = await repo.create({
              values: {
                key: 'default',
                hideLicenseSettings,
                hideAiIntegration,
                hideMobileDeprecated,
              },
            });
          } else {
            await repo.update({
              filter: { key: 'default' },
              values: {
                hideLicenseSettings,
                hideAiIntegration,
                hideMobileDeprecated,
              },
            });
            settings = await repo.findOne({
              filter: { key: 'default' },
            });
          }
          
          ctx.body = settings;
          await next();
        },
      },
    });
    
    this.app.acl.allow('annoyancyRemovalSettings', '*', 'loggedIn');
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAnnoyancyRemovalServer;
