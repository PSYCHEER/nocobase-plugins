import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';

export const CommentsBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();

  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-settings': 'blockSettings:comments',
          properties: {
            comments: {
              type: 'void',
              'x-component': 'CommentsBlockWrapper',
            },
          },
        });
      }}
    />
  );
};
