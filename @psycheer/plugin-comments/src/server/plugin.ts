import { Plugin } from '@nocobase/server';
import path from 'path';

export class PluginCommentsServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    console.log('[Comments Plugin] Starting to load...');
    
    // Register collections
    try {
      await this.db.import({
        directory: path.resolve(__dirname, 'collections'),
      });
      console.log('[Comments Plugin] Collections imported successfully');
    } catch (error) {
      console.error('[Comments Plugin] Failed to import collections:', error);
      throw error;
    }

    // Register actions
    this.app.resource({
      name: 'comments',
      actions: {
        list: async (ctx, next) => {
          // ACL: musí mať právo comments:list
          console.log('[Comments ACL] list:', {
            user: ctx.state.currentUser,
            allowed: ctx.acl.can('comments:list')
          });
          if (!ctx.acl.can('comments:list')) {
            ctx.throw(403, 'No permission to view comments');
          }
          // ...existing code...
        },

        create: async (ctx, next) => {
          // Robust extraction of values
          let targetCollection, targetId, content, parentId, type = 'comment', metadata;
          if (ctx.action?.params?.values?.values) {
            ({ targetCollection, targetId, content, parentId, type = 'comment', metadata } = ctx.action.params.values.values);
          } else if (ctx.action?.params?.values) {
            ({ targetCollection, targetId, content, parentId, type = 'comment', metadata } = ctx.action.params.values);
          } else {
            ({ targetCollection, targetId, content, parentId, type = 'comment', metadata } = ctx.action?.params || {});
          }
          const userId = ctx.state.currentUser?.id;
          console.log('[Comments ACL] create:', {
            user: ctx.state.currentUser,
            allowed: ctx.acl.can('comments:create')
          });
          if (!ctx.acl.can('comments:create')) {
            ctx.throw(403, 'No permission to create comments');
          }
          // ...existing code...

          // Extract mentions
          const mentionRegex = /@(\w+)/g;
          const mentions = content.match(mentionRegex);
          
          if (mentions) {
            const usernames = mentions.map(m => m.substring(1));
            const mentionedUsers = await ctx.db.getRepository('users').find({
              filter: {
                username: {
                  $in: usernames,
                },
              },
            });

            // Create notifications for mentioned users
            for (const user of mentionedUsers) {
              if (user.id !== userId) {
                await ctx.db.getRepository('comment_notifications').create({
                  values: {
                    userId: user.id,
                    commentId: comment.id,
                    type: 'mention',
                  },
                });
              }
            }
          }

          // Notify parent comment author
          if (parentId) {
            const parentComment = await ctx.db.getRepository('comments').findOne({
              filterByTk: parentId,
            });

            if (parentComment && parentComment.userId !== userId) {
              await ctx.db.getRepository('comment_notifications').create({
                values: {
                  userId: parentComment.userId,
                  commentId: comment.id,
                  type: 'reply',
                },
              });
            }
          }

          const fullComment = await ctx.db.getRepository('comments').findOne({
            filterByTk: comment.id,
            appends: ['user'],
          });

          ctx.body = fullComment;
          await next();
        },

        update: async (ctx, next) => {
          // Robust extraction of filterByTk and content
          let filterByTk;
          if (ctx.action?.params?.filterByTk) {
            filterByTk = ctx.action.params.filterByTk;
          } else if (ctx.action?.params?.values?.filterByTk) {
            filterByTk = ctx.action.params.values.filterByTk;
          } else if (ctx.action?.params?.values?.values?.filterByTk) {
            filterByTk = ctx.action.params.values.values.filterByTk;
          }
          const content = ctx.action?.params?.values?.content || ctx.action?.params?.values?.values?.content;
          const userId = ctx.state.currentUser?.id;

          console.log('[Comments API] update request:', { filterByTk, content, userId });

          const comment = await ctx.db.getRepository('comments').findOne({
            filterByTk,
          });

          if (!comment) {
            console.error('[Comments API] update: Comment not found', { filterByTk });
            ctx.throw(404, 'Comment not found');
          }

          // ACL: môže upravovať ak má právo alebo je autor
          console.log('[Comments ACL] update:', {
            user: ctx.state.currentUser,
            allowed: ctx.acl.can('comments:update', comment),
            isAuthor: comment.userId === userId
          });
          if (!ctx.acl.can('comments:update', comment) && comment.userId !== userId) {
            ctx.throw(403, 'No permission to update this comment');
          }

          await ctx.db.getRepository('comments').update({
            filterByTk,
            values: {
              content,
              isEdited: true,
              editedAt: new Date(),
            },
          });

          const updated = await ctx.db.getRepository('comments').findOne({
            filterByTk,
            appends: ['user'],
          });

          console.log('[Comments API] update: updated comment', updated);
          ctx.body = updated;
          await next();
        },

        destroy: async (ctx, next) => {
          const { filterByTk } = ctx.action.params;
          const userId = ctx.state.currentUser?.id;

          const comment = await ctx.db.getRepository('comments').findOne({
            filterByTk,
          });

          if (!comment) {
            ctx.throw(404, 'Comment not found');
          }

          // ACL: môže mazať ak má právo alebo je autor
          console.log('[Comments ACL] destroy:', {
            user: ctx.state.currentUser,
            allowed: ctx.acl.can('comments:destroy', comment),
            isAuthor: comment.userId === userId
          });
          if (!ctx.acl.can('comments:destroy', comment) && comment.userId !== userId) {
            ctx.throw(403, 'No permission to delete this comment');
          }

          // Soft delete
          await ctx.db.getRepository('comments').update({
            filterByTk,
            values: {
              isDeleted: true,
            },
          });

          ctx.body = { success: true };
          await next();
        },

        createChangelog: async (ctx, next) => {
          const { targetCollection, targetId, action, field, oldValue, newValue } = ctx.action.params.values;
          const userId = ctx.state.currentUser?.id;

          let content = '';
          switch (action) {
            case 'created':
              content = `created this record`;
              break;
            case 'updated':
              content = field 
                ? `changed **${field}** from \`${oldValue}\` to \`${newValue}\``
                : `updated this record`;
              break;
            case 'deleted':
              content = `deleted this record`;
              break;
            case 'status_changed':
              content = `changed status from **${oldValue}** to **${newValue}**`;
              break;
            default:
              content = action;
          }

          const comment = await ctx.db.getRepository('comments').create({
            values: {
              userId,
              targetCollection,
              targetId,
              content,
              type: 'changelog',
              metadata: {
                action,
                field,
                oldValue,
                newValue,
              },
            },
          });

          const fullComment = await ctx.db.getRepository('comments').findOne({
            filterByTk: comment.id,
            appends: ['user'],
          });

          ctx.body = fullComment;
          await next();
        },
      },
    });

    // Register permission snippet for comments (use string action names per docs)
    this.app.acl.registerSnippet({
      name: 'comments',
      actions: ['comments:list', 'comments:create', 'comments:update', 'comments:destroy'],
    });

    // Register available actions so they appear in Role/Permission UI with readable names
    this.app.acl.setAvailableAction('comments:list', {
      displayName: '{{t("View comments")}}',
      type: 'existing-data',
    });

    this.app.acl.setAvailableAction('comments:create', {
      displayName: '{{t("Create comments")}}',
      type: 'new-data',
      onNewRecord: true,
    });

    this.app.acl.setAvailableAction('comments:update', {
      displayName: '{{t("Edit comments")}}',
      type: 'existing-data',
    });

    this.app.acl.setAvailableAction('comments:destroy', {
      displayName: '{{t("Delete comments")}}',
      type: 'existing-data',
    });
    
    console.log('[Comments Plugin] Resources and ACL registered successfully');

    // Register notification actions
    this.app.resource({
      name: 'comment_notifications',
      actions: {
        list: async (ctx, next) => {
          const userId = ctx.state.currentUser?.id;

          const notifications = await ctx.db.getRepository('comment_notifications').find({
            filter: {
              userId,
            },
            appends: ['comment', 'comment.user'],
            sort: ['-createdAt'],
          });

          ctx.body = notifications;
          await next();
        },

        markRead: async (ctx, next) => {
          const { filterByTk } = ctx.action.params;
          const userId = ctx.state.currentUser?.id;

          await ctx.db.getRepository('comment_notifications').update({
            filter: {
              id: filterByTk,
              userId,
            },
            values: {
              isRead: true,
              readAt: new Date(),
            },
          });

          ctx.body = { success: true };
          await next();
        },

        markAllRead: async (ctx, next) => {
          const userId = ctx.state.currentUser?.id;

          await ctx.db.getRepository('comment_notifications').update({
            filter: {
              userId,
              isRead: false,
            },
            values: {
              isRead: true,
              readAt: new Date(),
            },
          });

          ctx.body = { success: true };
          await next();
        },
      },
    });
    
    console.log('[Comments Plugin] Load completed successfully');
  }

  async install() {
    console.log('[Comments Plugin] Install hook called');
  }

  async afterEnable() {
    console.log('[Comments Plugin] After enable hook called');
  }

  async afterDisable() {
    console.log('[Comments Plugin] After disable hook called');
  }

  async remove() {
    console.log('[Comments Plugin] Remove hook called');
  }
}

export default PluginCommentsServer;
