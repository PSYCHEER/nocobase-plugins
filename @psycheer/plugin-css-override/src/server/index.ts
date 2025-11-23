import { Plugin } from '@nocobase/server';

export class PluginCssOverrideServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.importCollections(__dirname + '/collections');

    this.app.resource({
      name: 'cssOverride',
      actions: {
        get: async (ctx, next) => {
          const repo = this.db.getRepository('cssOverride');
          const record = await repo.findOne({
            filter: { key: 'default' },
          });
          ctx.body = record || { customCss: '' };
          await next();
        },
        update: async (ctx, next) => {
          const { customCss } = ctx.action.params.values || {};
          const repo = this.db.getRepository('cssOverride');
          
          const record = await repo.findOne({
            filter: { key: 'default' },
          });

          if (record) {
            await repo.update({
              filter: { key: 'default' },
              values: { customCss },
            });
          } else {
            await repo.create({
              values: { key: 'default', customCss },
            });
          }

          ctx.body = { success: true };
          await next();
        },
      },
    });

    this.app.acl.allow('cssOverride', '*', 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginCssOverrideServer;
