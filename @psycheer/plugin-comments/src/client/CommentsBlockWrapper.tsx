import React from 'react';
import { CommentsBlock } from './CommentsBlock';
import { useRecord, useCollection, useDataBlockProps } from '@nocobase/client';
import { useParams } from 'react-router-dom';

export const CommentsBlockWrapper: React.FC<{ collection?: string }> = ({ collection }) => {
  const record = useRecord();
  const collectionCtx = useCollection();
  const params = useParams<{ id?: string }>();
  const dataBlockProps = useDataBlockProps();
  
  console.log('CommentsBlockWrapper - record:', record);
  console.log('CommentsBlockWrapper - params:', params);
  console.log('CommentsBlockWrapper - dataBlockProps:', dataBlockProps);
  
  // Try multiple ways to get collection and ID
  const targetCollection = collection || collectionCtx?.name || record?.__collection?.name || record?.__collectionName;
  // Prioritize dataBlockProps.filterByTk (most reliable in detail views)
  const targetId = dataBlockProps?.filterByTk || dataBlockProps?.params?.filterByTk || params?.id || record?.id;

  console.log('CommentsBlockWrapper - targetCollection:', targetCollection, 'targetId:', targetId);

  if (!targetCollection || !targetId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Comments block requires a record context. 
        <br />
        Add this block to a record detail page or form.
        <br />
        <small>Debug: collection={targetCollection}, id={targetId}</small>
      </div>
    );
  }

  return <CommentsBlock targetCollection={targetCollection} targetId={targetId} />;
};
