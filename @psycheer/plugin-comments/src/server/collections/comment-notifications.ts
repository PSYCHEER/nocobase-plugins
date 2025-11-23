import { CollectionOptions } from '@nocobase/database';

export default {
  displayName: 'Comment Notifications',
  group: 'System',
  interface: 'table',
  displayed: true,
  hidden: false,
  internal: false,
  name: 'comment_notifications',
  title: 'Comment Notifications',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
    },
    {
      type: 'belongsTo',
      name: 'comment',
      target: 'comments',
      foreignKey: 'commentId',
    },
    {
      type: 'string',
      name: 'type',
      // mention, reply, new_comment
    },
    {
      type: 'boolean',
      name: 'isRead',
      defaultValue: false,
    },
    {
      type: 'date',
      name: 'readAt',
    },
    {
      type: 'date',
      name: 'createdAt',
    },
  ],
  indexes: [
    {
      fields: ['userId', 'isRead'],
    },
  ],
} as CollectionOptions;
