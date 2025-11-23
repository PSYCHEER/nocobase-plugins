import { SchemaSettings } from '@nocobase/client';

export const commentsBlockSettings = new SchemaSettings({
  name: 'blockSettings:comments',
  items: [
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
