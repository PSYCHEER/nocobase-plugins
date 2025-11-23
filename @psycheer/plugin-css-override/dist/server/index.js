/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var server_exports = {};
__export(server_exports, {
  PluginCssOverrideServer: () => PluginCssOverrideServer,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_server = require("@nocobase/server");
class PluginCssOverrideServer extends import_server.Plugin {
  async afterAdd() {
  }
  async beforeLoad() {
  }
  async load() {
    await this.importCollections(__dirname + "/collections");
    this.app.resource({
      name: "cssOverride",
      actions: {
        get: async (ctx, next) => {
          const repo = this.db.getRepository("cssOverride");
          const record = await repo.findOne({
            filter: { key: "default" }
          });
          ctx.body = record || { customCss: "" };
          await next();
        },
        update: async (ctx, next) => {
          const { customCss } = ctx.action.params.values || {};
          const repo = this.db.getRepository("cssOverride");
          const record = await repo.findOne({
            filter: { key: "default" }
          });
          if (record) {
            await repo.update({
              filter: { key: "default" },
              values: { customCss }
            });
          } else {
            await repo.create({
              values: { key: "default", customCss }
            });
          }
          ctx.body = { success: true };
          await next();
        }
      }
    });
    this.app.acl.allow("cssOverride", "*", "loggedIn");
  }
  async install() {
  }
  async afterEnable() {
  }
  async afterDisable() {
  }
  async remove() {
  }
}
var server_default = PluginCssOverrideServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginCssOverrideServer
});
