import React, { useState, useEffect, useRef } from 'react';
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
  // props debug removed
  
  const api = useAPIClient();
  const { data: currentUser } = useCurrentUserContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const newEditorRef = useRef<HTMLDivElement | null>(null);
  const editEditorRef = useRef<HTMLDivElement | null>(null);
  const newVditorRef = useRef<any>(null);
  const editVditorRef = useRef<any>(null);

  const loadComments = async () => {
    if (!targetCollection || !targetId) {
      console.warn('Cannot load comments: missing targetCollection or targetId', { targetCollection, targetId });
      return;
    }
    
    // loading comments
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
      
      const commentsData = response?.data?.data;
      if (Array.isArray(commentsData)) {
        // loaded comments
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

  // Initialize Vditor for new comment editor (if available)
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!newEditorRef.current) return;
      try {
        const mod = await import('vditor');
        await import('vditor/dist/index.css');
        const Vditor = (mod && (mod as any).default) || (mod as any).Vditor || mod;
        if (!mounted) return;
        try {
          newVditorRef.current = new Vditor(newEditorRef.current, {
            value: newComment || '',
            height: 180,
            mode: 'sv',
            toolbar: ['bold', 'italic', 'strike', '|', 'list', 'ordered-list', 'check', '|', 'quote', 'line', 'code', 'inline-code', 'table', 'link', 'image', 'upload', 'edit-mode'],
            input: () => {
              try {
                const v = newVditorRef.current && newVditorRef.current.getValue ? newVditorRef.current.getValue() : '';
                setNewComment(v);
              } catch (e) {
                // ignore vditor input errors
              }
            }
          });
        } catch (e) {
          newVditorRef.current = null;
        }
      } catch (e) {
        // vditor not installed — keep textarea fallback
        newVditorRef.current = null;
      }
    };
    init();
    return () => {
      mounted = false;
      if (newVditorRef.current && typeof newVditorRef.current.destroy === 'function') {
        try { newVditorRef.current.destroy(); } catch (e) {}
        newVditorRef.current = null;
      }
    };
  }, []);

  const handleAddComment = async () => {
    const content = (newVditorRef.current && typeof newVditorRef.current.getValue === 'function')
      ? (newVditorRef.current.getValue() || '').trim()
      : (newComment || '').trim();

    if (!content) return;

    setLoading(true);
    try {
      await api.request({
        url: 'comments:create',
        method: 'post',
        data: {
          values: {
            targetCollection,
            targetId,
            content,
          },
        },
      });

      // clear editor
      setNewComment('');
      if (newVditorRef.current && typeof newVditorRef.current.setValue === 'function') {
        try { newVditorRef.current.setValue(''); } catch (e) {}
      }

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
    // Optimistic removal: update UI immediately, perform delete in background.
    const removeCommentById = (list: Comment[], id: number): Comment[] => {
      return list.reduce<Comment[]>((acc, c) => {
        if (c.id === id) return acc; // drop this comment
        const copy = { ...c } as Comment;
        if (copy.replies && copy.replies.length) {
          copy.replies = removeCommentById(copy.replies, id);
        }
        acc.push(copy);
        return acc;
      }, []);
    };

    // Keep a snapshot for potential revert
    const previous = comments;

    // Apply optimistic update
    setComments((prev) => removeCommentById(prev, commentId));
    message.success('Comment deleted (pending)');

    // Fire delete request and refresh in background. If it fails, revert and show error.
    (async () => {
      try {
        await api.request({
          url: `comments:destroy`,
          method: 'post',
          params: {
            filterByTk: commentId,
          },
        });

        // Try a non-blocking reload to reconcile state; ignore errors here.
        loadComments().catch((e) => {
          console.warn('[CommentsBlock] background loadComments failed', e);
        });
      } catch (error) {
        console.error('[CommentsBlock] comments:destroy failed', error);
        // Revert optimistic change
        setComments(previous);
        message.error('Failed to delete comment');
      }
    })();
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
    
    // ownership check (no debug log)

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
        <List
          dataSource={comments}
          renderItem={(comment) => renderComment(comment)}
          locale={{ emptyText: 'No comments yet. Be the first to comment!' }}
        />

        <div>
          {/* Vditor container (if available) */}
          <div ref={newEditorRef} style={{ display: 'block' }} />

          {/* Fallback textarea when Vditor not loaded */}
          {!newVditorRef.current && (
            <TextArea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              placeholder="Write a comment (supports @mentions and markdown)..."
            />
          )}

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
      </Space>
    </Card>
  );
};
