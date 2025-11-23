import { Migration } from '@nocobase/server';
export default class extends Migration {
    on: string;
    appVersion: string;
    up(): Promise<void>;
}
