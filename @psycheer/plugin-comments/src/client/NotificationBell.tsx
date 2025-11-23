import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Avatar, Typography, Space, Button } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { useAPIClient, useCurrentUserContext } from '@nocobase/client';

const { Text, Paragraph } = Typography;

interface Notification {
  id: number;
  comment: {
    id: number;
    content: string;
    user: { nickname: string; username: string };
  };
  type: 'mention' | 'reply' | 'new_comment';
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const api = useAPIClient();
  const { data: currentUser } = useCurrentUserContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const loadNotifications = async () => {
    try {
      const response = await api.request({
        url: 'comment_notifications:list',
        method: 'post',
      });
      const data = response?.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      // Poll every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkRead = async (notificationId: number) => {
    try {
      await api.request({
        url: 'comment_notifications:markRead',
        method: 'post',
        params: {
          filterByTk: notificationId,
        },
      });
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.request({
        url: 'comment_notifications:markAllRead',
        method: 'post',
      });
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const getNotificationText = (notification: Notification) => {
    const user = notification.comment?.user?.nickname || notification.comment?.user?.username;
    switch (notification.type) {
      case 'mention':
        return `${user} mentioned you in a comment`;
      case 'reply':
        return `${user} replied to your comment`;
      case 'new_comment':
        return `${user} added a new comment`;
      default:
        return 'New notification';
    }
  };

  const menu = (
    <div style={{ width: '400px', maxHeight: '500px', overflow: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item
            key={notification.id}
            style={{
              padding: '12px 16px',
              backgroundColor: notification.isRead ? '#fff' : '#f0f5ff',
              cursor: 'pointer',
            }}
            onClick={() => !notification.isRead && handleMarkRead(notification.id)}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} size="small" />}
              title={
                <Space direction="vertical" size={0}>
                  <Text strong={!notification.isRead}>
                    {getNotificationText(notification)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </Space>
              }
              description={
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {notification.comment?.content?.length > 80 
                    ? notification.comment?.content.substring(0, 80) + '...'
                    : notification.comment?.content
                  }
                </div>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No notifications' }}
      />
    </div>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};
