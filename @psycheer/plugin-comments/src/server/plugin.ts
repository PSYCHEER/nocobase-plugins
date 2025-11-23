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
          const { targetCollection, targetId } = ctx.action.params.values || ctx.action.params;
          
          const comments = await ctx.db.getRepository('comments').find({
            filter: {
              targetCollection,
              targetId,
              isDeleted: false,
              parentId: null, // Only top-level comments
            },
            appends: ['user', 'replies', 'replies.user'],
            sort: ['-createdAt'],
          });

          ctx.body = comments;
          await next();
        },

        create: async (ctx, next) => {
          const { targetCollection, targetId, content, parentId, type = 'comment', metadata } = ctx.action.params.values;
          const userId = ctx.state.currentUser?.id;

          if (!userId) {
            ctx.throw(401, 'Unauthorized');
          }

          const comment = await ctx.db.getRepository('comments').create({
            values: {
              userId,
              targetCollection,
              targetId,
              content,
              parentId,
              type,
              metadata,
            },
          });

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
          const { filterByTk } = ctx.action.params;
          const { content } = ctx.action.params.values;
          const userId = ctx.state.currentUser?.id;

          const comment = await ctx.db.getRepository('comments').findOne({
            filterByTk,
          });

          if (!comment) {
            ctx.throw(404, 'Comment not found');
          }

          if (comment.userId !== userId) {
            ctx.throw(403, 'Forbidden');
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

          if (comment.userId !== userId) {
            ctx.throw(403, 'Forbidden');
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

    this.app.acl.registerSnippet({
      name: 'pm.comments',
      actions: ['comments:*'],
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
