import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<=0.1.0';

  async up() {
    const repo = this.context.db.getRepository('cssOverride');
    const exists = await repo.findOne({
      filter: { key: 'default' },
    });

    if (!exists) {
      await repo.create({
        values: {
          key: 'default',
          customCss: '/* Add your custom CSS here */',
        },
      });
    }
  }
}
