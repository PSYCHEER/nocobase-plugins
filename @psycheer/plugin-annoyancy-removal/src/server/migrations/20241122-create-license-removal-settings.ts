import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<0.22.0-alpha.1';

  async up() {
    const repo = this.context.db.getRepository('licenseRemovalSettings');
    
    // Vytvor collection ak neexistuje
    if (!this.context.db.getCollection('licenseRemovalSettings')) {
      this.context.db.collection({
        name: 'licenseRemovalSettings',
        fields: [
          {
            type: 'string',
            name: 'key',
            unique: true,
          },
          {
            type: 'boolean',
            name: 'removePoweredBy',
            defaultValue: true,
          },
          {
            type: 'boolean',
            name: 'removeFooterLinks',
            defaultValue: true,
          },
          {
            type: 'boolean',
            name: 'removeAboutDialog',
            defaultValue: true,
          },
        ],
      });
    }

    // Synchronizuj schému databázy
    await this.context.db.sync();

    // Vytvor predvolené nastavenia
    const exists = await repo.findOne({
      filter: { key: 'default' },
    });

    if (!exists) {
      await repo.create({
        values: {
          key: 'default',
          removePoweredBy: true,
          removeFooterLinks: true,
          removeAboutDialog: true,
        },
      });
    }
  }
}
