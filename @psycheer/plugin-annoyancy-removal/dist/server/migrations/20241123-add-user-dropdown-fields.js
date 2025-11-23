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
var add_user_dropdown_fields_exports = {};
__export(add_user_dropdown_fields_exports, {
  default: () => add_user_dropdown_fields_default
});
module.exports = __toCommonJS(add_user_dropdown_fields_exports);
var import_server = require("@nocobase/server");
class add_user_dropdown_fields_default extends import_server.Migration {
  on = "afterLoad";
  appVersion = "<0.22.0-alpha.2";
  async up() {
    const repo = this.context.db.getRepository("annoyancyRemovalSettings");
    await this.context.db.sync();
    const exists = await repo.findOne({
      filter: { key: "default" }
    });
    if (exists) {
      await repo.update({
        filter: { key: "default" },
        values: {
          hideChangePassword: true,
          hideVerification: true,
          hideTheme: true
        }
      });
    }
  }
}
