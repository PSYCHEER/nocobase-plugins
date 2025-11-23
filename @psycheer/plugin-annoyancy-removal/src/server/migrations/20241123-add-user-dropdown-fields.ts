import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<0.22.0-alpha.2';

  async up() {
    const repo = this.context.db.getRepository('annoyancyRemovalSettings');
    
    // Synchronizuj schému databázy (pridá nové stĺpce)
    await this.context.db.sync();

    // Aktualizuj existujúce nastavenia s novými defaultmi
    const exists = await repo.findOne({
      filter: { key: 'default' },
    });

    if (exists) {
      await repo.update({
        filter: { key: 'default' },
        values: {
          hideChangePassword: true,
          hideVerification: true,
          hideTheme: true,
        },
      });
    }
  }
}
