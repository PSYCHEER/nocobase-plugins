import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Space, Typography, message, Popconfirm, Badge, Dropdown, Menu } from 'antd';
import { 
  UserOutlined, 
  SendOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAPIClient, useCurrentUserContext } from '@nocobase/client';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface Comment {
  id: number;
  content: string;
  user: { id: number; nickname: string; username: string };
  createdAt: string;
  editedAt?: string;
  isEdited: boolean;
  type: 'comment' | 'changelog';
  metadata?: any;
  replies?: Comment[];
}

interface CommentsBlockProps {
  targetCollection: string;
  targetId: number | string;
}

export const CommentsBlock: React.FC<CommentsBlockProps> = ({ targetCollection, targetId }) => {
  console.log('CommentsBlock props:', { targetCollection, targetId });
  
  const api = useAPIClient();
  const { data: currentUser } = useCurrentUserContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    if (!targetCollection || !targetId) {
      console.warn('Cannot load comments: missing targetCollection or targetId', { targetCollection, targetId });
      return;
    }
    
    console.log('Loading comments for:', { targetCollection, targetId });
    try {
      const response = await api.request({
        url: 'comments:list',
        method: 'post',
        data: {
          values: {
            targetCollection,
            targetId,
          },
        },
      });
      
      console.log('Comments API response:', response);
      const commentsData = response?.data?.data;
      if (Array.isArray(commentsData)) {
        console.log('Loaded comments:', commentsData);
        setComments(commentsData);
      } else {
        console.error('Comments API returned non-array:', commentsData);
        setComments([]);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      message.error('Failed to load comments');
      setComments([]);
    }
  };

  useEffect(() => {
    loadComments();
  }, [targetCollection, targetId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await api.request({
        url: 'comments:create',
        method: 'post',
        data: {
          values: {
            targetCollection,
            targetId,
            content: newComment,
          },
        },
      });
      setNewComment('');
      await loadComments();
      message.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      await api.request({
        url: 'comments:create',
        method: 'post',
        data: {
          values: {
            targetCollection,
            targetId,
            content: replyContent,
            parentId,
          },
        },
      });
      setReplyContent('');
      setReplyingTo(null);
      await loadComments();
      message.success('Reply added');
    } catch (error) {
      console.error('Failed to add reply:', error);
      message.error('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      await api.request({
        url: `comments:update`,
        method: 'post',
        params: {
          filterByTk: commentId,
        },
        data: {
          values: {
            content: editContent,
          },
        },
      });
      setEditingId(null);
      setEditContent('');
      await loadComments();
      message.success('Comment updated');
    } catch (error) {
      console.error('Failed to update comment:', error);
      message.error('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await api.request({
        url: `comments:destroy`,
        method: 'post',
        params: {
          filterByTk: commentId,
        },
      });
      await loadComments();
      message.success('Comment deleted');
    } catch (error) {
      message.error('Failed to delete comment');
    }
  };

  const renderChangelogIcon = (metadata: any) => {
    switch (metadata?.action) {
      case 'created':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'updated':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'deleted':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'status_changed':
        return metadata.newValue === 'closed' 
          ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          : <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = currentUser?.data?.id === comment.user?.id;
    const isEditing = editingId === comment.id;
    
    console.log('Comment:', comment.id, 'User:', comment.user?.id, 'CurrentUser:', currentUser?.data?.id, 'isOwner:', isOwner);

    if (comment.type === 'changelog') {
      return (
        <div
          key={comment.id}
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid #f0f0f0',
            marginLeft: isReply ? '48px' : 0,
          }}
        >
          <div style={{ marginTop: '4px' }}>
            {renderChangelogIcon(comment.metadata)}
          </div>
          <div style={{ flex: 1 }}>
            <Space size={4}>
              <Text strong>{comment.user?.nickname || comment.user?.username}</Text>
              <Text type="secondary">{comment.content}</Text>
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
            </div>
          </div>
        </div>
      );
    }

    return (
      <List.Item
        key={comment.id}
        style={{ marginLeft: isReply ? '48px' : 0 }}
        actions={
          isOwner && !isEditing
            ? [
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                >
                  Edit
                </Button>,
                <Popconfirm
                  title="Delete this comment?"
                  onConfirm={() => handleDelete(comment.id)}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>,
              ]
            : []
        }
      >
        <List.Item.Meta
          avatar={<Avatar icon={<UserOutlined />} />}
          title={
            <Space>
              <Text strong>{comment.user?.nickname || comment.user?.username}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
              {comment.isEdited && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (edited)
                </Text>
              )}
            </Space>
          }
          description={
            isEditing ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  placeholder="Edit comment (supports @mentions and markdown)"
                />
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleEdit(comment.id)}
                    loading={loading}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Space>
            ) : (
              <>
                <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </div>
                {!isReply && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    Reply
                  </Button>
                )}
                {replyingTo === comment.id && (
                  <Space direction="vertical" style={{ width: '100%', marginTop: '8px' }}>
                    <TextArea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      placeholder="Write a reply (supports @mentions and markdown)"
                    />
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={() => handleReply(comment.id)}
                        loading={loading}
                      >
                        Reply
                      </Button>
                      <Button size="small" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </Space>
                  </Space>
                )}
              </>
            )
          }
        />
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </List.Item>
    );
  };

  return (
    <Card
      title={
        <Space>
          <Text strong>Comments & Activity</Text>
          <Badge count={comments.length} />
        </Space>
      }
      style={{ marginTop: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            placeholder="Write a comment (supports @mentions and markdown)..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            loading={loading}
            style={{ marginTop: '8px' }}
          >
            Add Comment
          </Button>
        </div>

        <List
          dataSource={comments}
          renderItem={(comment) => renderComment(comment)}
          locale={{ emptyText: 'No comments yet. Be the first to comment!' }}
        />
      </Space>
    </Card>
  );
};
