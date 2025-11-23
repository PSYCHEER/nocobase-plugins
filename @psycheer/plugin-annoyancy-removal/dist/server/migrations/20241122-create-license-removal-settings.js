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
var create_license_removal_settings_exports = {};
__export(create_license_removal_settings_exports, {
  default: () => create_license_removal_settings_default
});
module.exports = __toCommonJS(create_license_removal_settings_exports);
var import_server = require("@nocobase/server");
class create_license_removal_settings_default extends import_server.Migration {
  on = "afterLoad";
  appVersion = "<0.22.0-alpha.1";
  async up() {
    const repo = this.context.db.getRepository("licenseRemovalSettings");
    if (!this.context.db.getCollection("licenseRemovalSettings")) {
      this.context.db.collection({
        name: "licenseRemovalSettings",
        fields: [
          {
            type: "string",
            name: "key",
            unique: true
          },
          {
            type: "boolean",
            name: "removePoweredBy",
            defaultValue: true
          },
          {
            type: "boolean",
            name: "removeFooterLinks",
            defaultValue: true
          },
          {
            type: "boolean",
            name: "removeAboutDialog",
            defaultValue: true
          }
        ]
      });
    }
    await this.context.db.sync();
    const exists = await repo.findOne({
      filter: { key: "default" }
    });
    if (!exists) {
      await repo.create({
        values: {
          key: "default",
          removePoweredBy: true,
          removeFooterLinks: true,
          removeAboutDialog: true
        }
      });
    }
  }
}
