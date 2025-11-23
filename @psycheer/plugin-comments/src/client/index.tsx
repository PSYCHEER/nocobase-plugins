import { Plugin } from '@nocobase/client';
import { CommentsBlock } from './CommentsBlock';
import { CommentsBlockWrapper } from './CommentsBlockWrapper';
import { NotificationBell } from './NotificationBell';
import { CommentsBlockInitializer } from './CommentsBlockInitializer';
import { commentsBlockSettings } from './commentsBlockSettings';

export class PluginCommentsClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Register Comments block component
    this.app.addComponents({
      CommentsBlock,
      CommentsBlockWrapper,
      NotificationBell,
      CommentsBlockInitializer,
    });

    // Register block settings
    this.app.schemaSettingsManager.add(commentsBlockSettings);

    // Add to page initializers
    this.app.schemaInitializerManager.addItem('page:addBlock', 'otherBlocks.comments', {
      title: '{{t("Comments")}}',
      Component: 'CommentsBlockInitializer',
      icon: 'MessageOutlined',
    });

    // Add to popup initializers
    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'otherBlocks.comments', {
      title: '{{t("Comments")}}',
      Component: 'CommentsBlockInitializer',
      icon: 'MessageOutlined',
    });

    // client loaded
  }

  async afterLoad() {}
}

export default PluginCommentsClient;
