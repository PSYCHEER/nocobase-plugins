/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var plugin_exports = {};
__export(plugin_exports, {
  PluginAnnoyancyRemovalServer: () => PluginAnnoyancyRemovalServer,
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_server = require("@nocobase/server");
var import_path = __toESM(require("path"));
class PluginAnnoyancyRemovalServer extends import_server.Plugin {
  async afterAdd() {
  }
  async beforeLoad() {
  }
  async load() {
    await this.db.import({
      directory: import_path.default.resolve(__dirname, "collections")
    });
    this.app.resource({
      name: "annoyancyRemovalSettings",
      actions: {
        get: async (ctx, next) => {
          const repo = this.db.getRepository("annoyancyRemovalSettings");
          let settings = await repo.findOne({
            filter: { key: "default" }
          });
          if (!settings) {
            settings = await repo.create({
              values: {
                key: "default",
                hideLicenseSettings: true,
                hideAiIntegration: true,
                hideMobileDeprecated: true
              }
            });
          }
          ctx.body = settings;
          await next();
        },
        update: async (ctx, next) => {
          const repo = this.db.getRepository("annoyancyRemovalSettings");
          const { hideLicenseSettings, hideAiIntegration, hideMobileDeprecated } = ctx.action.params.values || ctx.request.body;
          let settings = await repo.findOne({
            filter: { key: "default" }
          });
          if (!settings) {
            settings = await repo.create({
              values: {
                key: "default",
                hideLicenseSettings,
                hideAiIntegration,
                hideMobileDeprecated
              }
            });
          } else {
            await repo.update({
              filter: { key: "default" },
              values: {
                hideLicenseSettings,
                hideAiIntegration,
                hideMobileDeprecated
              }
            });
            settings = await repo.findOne({
              filter: { key: "default" }
            });
          }
          ctx.body = settings;
          await next();
        }
      }
    });
    this.app.acl.allow("annoyancyRemovalSettings", "*", "loggedIn");
  }
  async afterEnable() {
  }
  async afterDisable() {
  }
  async remove() {
  }
}
var plugin_default = PluginAnnoyancyRemovalServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginAnnoyancyRemovalServer
});
