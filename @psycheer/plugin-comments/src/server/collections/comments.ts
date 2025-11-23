import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'comments',
  title: 'Comments',
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
      type: 'string',
      name: 'targetCollection',
      allowNull: false,
    },
    {
      type: 'bigInt',
      name: 'targetId',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'content',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'comments',
      foreignKey: 'parentId',
    },
    {
      type: 'hasMany',
      name: 'replies',
      target: 'comments',
      foreignKey: 'parentId',
    },
    {
      type: 'string',
      name: 'type',
      defaultValue: 'comment',
      // comment, changelog, mention, status_change, etc.
    },
    {
      type: 'json',
      name: 'metadata',
      // For changelog: { action: 'created', field: 'status', oldValue: 'open', newValue: 'closed' }
      // For mentions: { mentionedUsers: [1, 2, 3] }
    },
    {
      type: 'json',
      name: 'attachments',
      // Array of attachment objects
    },
    {
      type: 'boolean',
      name: 'isEdited',
      defaultValue: false,
    },
    {
      type: 'date',
      name: 'editedAt',
    },
    {
      type: 'boolean',
      name: 'isDeleted',
      defaultValue: false,
    },
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'date',
      name: 'updatedAt',
    },
  ],
  indexes: [
    {
      fields: ['targetCollection', 'targetId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['parentId'],
    },
  ],
} as CollectionOptions;
