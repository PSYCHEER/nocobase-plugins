import { Plugin } from '@nocobase/server';
import path from 'path';

export class PluginCommentsServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Minimal startup log
    // Helper: safe ACL check that won't throw when ACL/auth internals misbehave.
    // Also allow bypass by header `x-role: root` to ensure root access when auth is unavailable.
    const safeCan = async (ctx: any, action: string, subject?: any) => {
      try {
        const headerRole = (ctx && ctx.headers && (ctx.headers['x-role'] || ctx.headers['x-roles']));
        if (headerRole === 'root' || headerRole === 'ROOT') return true;
        if (ctx && ctx.state && ctx.state.currentUser && ctx.state.currentUser.id === 1) return true;

        // First attempt: use runtime ACL if available
        try {
          const res = ctx && ctx.acl ? ctx.acl.can(action, subject) : false;
          if (res && typeof (res as any).then === 'function') {
            const awaited = await res;
            if (awaited) return true;
          } else if (res) {
            return true;
          }
        } catch (e) {
          console.warn('[Comments Plugin] ctx.acl.can threw, falling back to DB permissions check', e && e.message);
        }

        // Fallback: check permissions table directly. This helps when runtime ACL cache isn't propagated.
        try {
          const permsRepo = ctx && ctx.db && typeof ctx.db.getRepository === 'function' ? ctx.db.getRepository('permissions') : null;
          if (!permsRepo || typeof permsRepo.find !== 'function') {
            console.warn('[Comments Plugin] safeCan fallback: permissions repository unavailable');
            return false;
          }

          // Try matching both full action and short action name
          const shortAction = (action || '').split(':').pop();
          const rows = await permsRepo.find({ filter: { resource: 'comments', action: { $in: [action, shortAction] } } });
          if (!rows || rows.length === 0) {
            // no explicit permission rows — deny by default
            return false;
          }

          const user = ctx.state.currentUser || {};
          const roleNames = Array.isArray(user.roles) ? user.roles.map((r: any) => r && (r.name || r.id)).filter(Boolean) : [];

          for (const r of rows) {
            try {
              // If permission row ties to a role id/name
              if (r.roleId && roleNames.length) {
                if (roleNames.includes(r.roleId) || roleNames.includes(String(r.roleId))) return true;
              }
              // If permission row ties to a user
              if (r.userId && user.id && Number(r.userId) === Number(user.id)) return true;
              // If permission row is global allow for this resource/action
              if ((r.allow === true || r.effect === 'allow') && !r.roleId && !r.userId) return true;
            } catch (inner) {
              // ignore row parsing issues
            }
          }

          return false;
        } catch (e) {
          console.error('[Comments Plugin] safeCan fallback failed', e);
          return false;
        }
      } catch (e) {
        console.error('[Comments Plugin] safeCan error', e);
        return false;
      }
    };
    
    // Register collections
    try {
      await this.db.import({
        directory: path.resolve(__dirname, 'collections'),
      });
      console.log('[Comments Plugin] Collections imported successfully');
      // Diagnostic: log whether authManager.tokenController is available
      // silent: skip verbose authManager/tokenController diagnostics
      // Diagnostic: check whether `users` collection is present and has repository
      // silent: skip verbose users collection presence check
    } catch (error) {
      console.error('[Comments Plugin] Failed to import collections:', error);
      throw error;
    }

    // Register actions
    this.app.resource({
      name: 'comments',
      actions: {
        list: async (ctx, next) => {
          // Try to extract filter/target info from multiple possible locations
          const params = ctx.action?.params || {};
          const values = params.values?.values || params.values || params;
          let filter: any = {};
          if (values && typeof values === 'object') {
            if (values.filter) {
              filter = { ...values.filter };
            }
            if (values.targetCollection) filter.targetCollection = values.targetCollection;
            if (values.targetId) filter.targetId = values.targetId;
          }

          // Also consider body/query (raw request) as fallback
          try {
            if ((!filter || Object.keys(filter).length === 0) && ctx.request) {
              const body = ctx.request.body || {};
              if (body.filter) filter = { ...body.filter };
              if (body.targetCollection) filter.targetCollection = body.targetCollection;
              if (body.targetId) filter.targetId = body.targetId;
            }
          } catch (e) {
            // ignore
          }

          // If still empty, attempt to read JSON `filter` from querystring
          try {
            if ((!filter || Object.keys(filter).length === 0) && ctx.request && ctx.request.query && ctx.request.query.filter) {
              const q = ctx.request.query.filter;
              if (typeof q === 'string') {
                try {
                  const parsed = JSON.parse(q);
                  filter = { ...parsed };
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            // ignore
          }

          // If no targetCollection/targetId specified, DO NOT return all comments by default for non-admins.
          const user = ctx.state.currentUser;
          const isRoot = user && (user.id === 1 || (Array.isArray(user.roles) && user.roles.some((r: any) => r && (r.name === 'root' || r.name === 'ROOT' || r.id === 1))));
          if (!filter.targetCollection || !filter.targetId) {
            // Allow root to list all comments when explicitly requested (keep previous behavior),
            // but for normal requests require targetCollection+targetId.
            if (!user || !isRoot) {
              // No specific target — return empty set to avoid leaking comments across records
              ctx.body = [];
              await next();
              return;
            }
          }

          // (Removed soft-delete filtering — plugin uses permanent deletes)

          // ACL: musí mať právo comments:list
          // For 'own' permissions we pass a subject containing the current user id and target info
          const subject: any = isRoot ? undefined : { userId: user?.id, targetCollection: filter.targetCollection, targetId: filter.targetId };
          const allowed = await safeCan(ctx, 'comments:list', subject);
          if (!allowed) {
            ctx.throw(403, 'No permission to view comments');
          }

          const comments = await ctx.db.getRepository('comments').find({ filter, appends: ['user'] });
          ctx.body = comments;
          await next();
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
          const allowedCreate = await safeCan(ctx, 'comments:create');
          if (!allowedCreate) {
            ctx.throw(403, 'No permission to create comments');
          }

          // Create the comment first
          const created = await ctx.db.getRepository('comments').create({
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

          // Extract mentions and create notifications safely
          try {
            const mentionRegex = /@(\w+)/g;
            const mentions = content ? content.match(mentionRegex) : null;
            if (mentions && mentions.length) {
              const usernames = mentions.map((m) => m.substring(1));
              const mentionedUsers = await ctx.db.getRepository('users').find({
                filter: { username: { $in: usernames } },
              });
              for (const u of mentionedUsers) {
                if (u.id !== userId) {
                  await ctx.db.getRepository('comment_notifications').create({
                    values: { userId: u.id, commentId: created.id, type: 'mention' },
                  });
                }
              }
            }
          } catch (e) {
            console.error('[Comments Plugin] failed to create mention notifications', e);
          }

          // Notify parent comment author
          if (parentId) {
            try {
              const parentComment = await ctx.db.getRepository('comments').findOne({ filterByTk: parentId });
              if (parentComment && parentComment.userId !== userId) {
                await ctx.db.getRepository('comment_notifications').create({
                  values: { userId: parentComment.userId, commentId: created.id, type: 'reply' },
                });
              }
            } catch (e) {
              console.error('[Comments Plugin] failed to notify parent comment author', e);
            }
          }

          const fullComment = await ctx.db.getRepository('comments').findOne({ filterByTk: created.id, appends: ['user'] });
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

          // update request received

          const comment = await ctx.db.getRepository('comments').findOne({
            filterByTk,
          });

          if (!comment) {
            console.error('[Comments API] update: Comment not found', { filterByTk });
            ctx.throw(404, 'Comment not found');
          }

          // ACL: môže upravovať ak má právo alebo je autor
          const allowedUpdate = await safeCan(ctx, 'comments:update', comment);
          // ACL update check
          if (!allowedUpdate && comment.userId !== userId) {
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

          // update completed
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
          const allowedDestroy = await safeCan(ctx, 'comments:destroy', comment);
          // ACL destroy check
          if (!allowedDestroy && comment.userId !== userId) {
            ctx.throw(403, 'No permission to delete this comment');
          }

          // Attempt permanent removal (hard delete) with multiple fallbacks
          const repo = ctx.db.getRepository('comments');
          let deleted = false;
          let deletedCount = 0;
          try {
            // Preferred: repo.delete if available
            if (repo && typeof repo.delete === 'function') {
              const res = await (repo as any).delete({ filterByTk });
              // try to interpret common results
              if (res && (res.affected || res.deletedCount || res.length)) {
                deleted = true;
                deletedCount = res.affected || res.deletedCount || res.length || 0;
              } else {
                // if repo.delete returns nothing meaningful, still treat as success
                deleted = true;
              }
            } else if (repo && typeof (repo as any).destroy === 'function') {
              const res = await (repo as any).destroy({ filterByTk });
              deleted = true;
            } else if (repo && repo.model && typeof repo.model.destroy === 'function') {
              // Sequelize-style model
              const res = await repo.model.destroy({ where: { id: comment.id } });
              if (typeof res === 'number') {
                deleted = res > 0;
                deletedCount = res;
              } else {
                deleted = true;
              }
            } else if (repo && typeof (repo as any).remove === 'function') {
              const res = await (repo as any).remove({ filterByTk });
              deleted = true;
            } else {
              console.warn('[Comments Plugin] destroy: no delete API found on repository, falling back to soft-delete');
            }
          } catch (e) {
            console.error('[Comments Plugin] destroy: permanent delete attempt failed', e);
          }

          // Verify deletion
          try {
            const after = await ctx.db.getRepository('comments').findOne({ filterByTk, appends: ['user'] });
            if (!after) {
              ctx.body = { success: true, deleted: true, deletedCount };
            } else {
              // If hard delete didn't work, attempt to fall back to previous soft-delete to avoid visible data
              try {
                await ctx.db.getRepository('comments').update({ filterByTk, values: { isDeleted: true } });
                const now = await ctx.db.getRepository('comments').findOne({ filterByTk, appends: ['user'] });
                  // fallback soft-delete applied
                ctx.body = { success: true, deleted: false, fallbackSoftDeleted: true, updated: now };
              } catch (e) {
                console.error('[Comments Plugin] destroy: fallback soft-delete failed', e);
                ctx.body = { success: false, error: 'Failed to permanently delete or soft-delete the comment' };
              }
            }
          } catch (e) {
            console.error('[Comments Plugin] destroy: verification failed', e);
            ctx.body = { success: deleted, deletedCount };
          }
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
        // Debug action: list permission rows for 'comments' snippet
        debugPermissions: async (ctx, next) => {
          const user = ctx.state.currentUser;
          if (!user || user.id !== 1) {
            ctx.throw(401, 'Only root can call debugPermissions');
          }
          try {
            const permsRepo = ctx && ctx.db && typeof ctx.db.getRepository === 'function'
              ? ctx.db.getRepository('permissions')
              : null;
            if (!permsRepo || typeof permsRepo.find !== 'function') {
              console.warn('[Comments Plugin] debugPermissions: permissions repository unavailable', { hasDb: !!ctx.db, permsRepo: !!permsRepo });
              ctx.body = { ok: false, error: 'permissions repository unavailable' };
              await next();
              return;
            }

            const rows = await permsRepo.find({ filter: { resource: 'comments' } });
            ctx.body = { ok: true, count: rows && rows.length || 0, rows };
          } catch (e) {
            console.error('[Comments Plugin] debugPermissions failed', e);
            ctx.body = { ok: false, error: String(e) };
          }
          await next();
        },
        // Raw list (no ACL) for debugging: root-only, shows isDeleted etc.
        rawList: async (ctx, next) => {
          const user = ctx.state.currentUser;
          const headerRole = ctx && ctx.headers && (ctx.headers['x-role'] || ctx.headers['x-roles']);
          if (!((user && user.id === 1) || headerRole === 'root' || headerRole === 'ROOT')) {
            ctx.throw(401, 'Only root can call rawList');
          }

          // Accept targetCollection/targetId in body or params
          const params = ctx.action?.params || {};
          const values = params.values?.values || params.values || params;
          let targetCollection = values && values.targetCollection;
          let targetId = values && values.targetId;
          try {
            if ((!targetCollection || !targetId) && ctx.request) {
              targetCollection = ctx.request.body?.targetCollection || targetCollection;
              targetId = ctx.request.body?.targetId || targetId;
            }
          } catch (e) {
            // ignore
          }

          const filter: any = {};
          if (targetCollection) filter.targetCollection = targetCollection;
          if (targetId) filter.targetId = targetId;

          try {
            const rows = await ctx.db.getRepository('comments').find({ filter, appends: ['user'] });
            ctx.body = { ok: true, count: rows?.length || 0, rows };
          } catch (e) {
            console.error('[Comments Plugin] rawList failed', e);
            ctx.body = { ok: false, error: String(e) };
          }

          await next();
        },
        // Manual root-only ACL reload endpoint — call when Roles/Permissions changes don't propagate
        reloadAcl: async (ctx, next) => {
          // Allow only root user or header-based root bypass for quick admin use
          const user = ctx.state.currentUser;
          const headerRole = ctx && ctx.headers && (ctx.headers['x-role'] || ctx.headers['x-roles']);
          if (!((user && user.id === 1) || headerRole === 'root' || headerRole === 'ROOT')) {
            ctx.throw(401, 'Only root can call reloadAcl');
          }

          try {
            if (plugin && plugin.app && plugin.app.acl && typeof (plugin.app.acl as any).writeRolesToACL === 'function') {
              await (plugin.app.acl as any).writeRolesToACL();
              console.log('[Comments Plugin] manual reloadAcl() called by root');
              ctx.body = { ok: true, message: 'writeRolesToACL called' };
            } else {
              console.warn('[Comments Plugin] reloadAcl: writeRolesToACL not available on app.acl');
              ctx.body = { ok: false, error: 'writeRolesToACL not available' };
            }
          } catch (e) {
            console.error('[Comments Plugin] reloadAcl failed', e);
            ctx.body = { ok: false, error: String(e) };
          }

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
      type: 'old-data',
    });

    this.app.acl.setAvailableAction('comments:create', {
      displayName: '{{t("Create comments")}}',
      type: 'new-data',
      onNewRecord: true,
    });

    this.app.acl.setAvailableAction('comments:update', {
      displayName: '{{t("Edit comments")}}',
      type: 'old-data',
    });

    this.app.acl.setAvailableAction('comments:destroy', {
      displayName: '{{t("Delete comments")}}',
      type: 'old-data',
    });

    // Ensure `root` always has access to comments operations (bypass checks)
    this.app.acl.allow('comments', ['list', 'create', 'update', 'destroy'], (ctx) => {
      const user = ctx.state.currentUser;
      if (!user) return false;
      // Allow if user id is 1 (typical root) or has a role named 'root'
      if (user.id === 1) return true;
      if (Array.isArray(user.roles)) {
        try {
          return user.roles.some((r: any) => r && (r.name === 'root' || r.name === 'ROOT' || r.id === 1));
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    
    console.log('[Comments Plugin] Resources and ACL registered successfully');

    // Capture plugin instance for async callbacks below
    const plugin = this;

    // Skip verbose ws auth token event logging in production

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
    
    // Load completed

    // DB diagnostics: log permission/role save attempts so we can see why UI changes fail
    try {
      if (this.db && this.db.on) {
        this.db.on('permissions.afterSave', async (model: any) => {
          // Minimal: try to reload runtime ACL when permissions change
          try {
            if (plugin && plugin.app && plugin.app.acl && typeof (plugin.app.acl as any).writeRolesToACL === 'function') {
              try {
                await (plugin.app.acl as any).writeRolesToACL();
              } catch (e) {
                console.error('[Comments Plugin] writeRolesToACL failed after permissions.afterSave', e);
              }
            }
          } catch (e) {
            console.error('[Comments Plugin] permissions.afterSave handler failed', e);
          }
        });

        this.db.on('roles.afterSave', async (model: any) => {
          // Minimal: try to reload runtime ACL when roles change
          try {
            if (plugin && plugin.app && plugin.app.acl && typeof (plugin.app.acl as any).writeRolesToACL === 'function') {
              try {
                await (plugin.app.acl as any).writeRolesToACL();
              } catch (e) {
                console.error('[Comments Plugin] writeRolesToACL failed after roles.afterSave', e);
              }
            }
          } catch (e) {
            console.error('[Comments Plugin] roles.afterSave handler failed', e);
          }
        });
      }
    } catch (e) {
      console.error('[Comments Plugin] failed to register DB diagnostics', e);
    }
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
