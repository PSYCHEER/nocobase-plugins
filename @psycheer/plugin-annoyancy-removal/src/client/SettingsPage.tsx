import React, { useState, useEffect } from 'react';
import { Card, Switch, Form, Space, Typography, message } from 'antd';
import { useAPIClient, useRequest } from '@nocobase/client';

const { Title, Text } = Typography;

export const SettingsPage = () => {
  const api = useAPIClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Load settings
  const { data, loading: fetchLoading, refresh } = useRequest(() =>
    api.request({
      url: 'annoyancyRemovalSettings:get',
      method: 'post',
    })
  );

  useEffect(() => {
    const settingsData = (data as any)?.data?.data;
    if (settingsData && typeof settingsData === 'object') {
      const values = {
        hideLicenseSettings: settingsData.hideLicenseSettings ?? true,
        hideAiIntegration: settingsData.hideAiIntegration ?? true,
        hideMobileDeprecated: settingsData.hideMobileDeprecated ?? true,
        hideChangePassword: settingsData.hideChangePassword ?? true,
        hideVerification: settingsData.hideVerification ?? true,
        hideTheme: settingsData.hideTheme ?? true,
      };
      form.setFieldsValue(values);
    }
  }, [data, form]);

  const handleValuesChange = async (_: any, allValues: any) => {
    setLoading(true);
    try {
      await api.request({
        url: 'annoyancyRemovalSettings:update?filterByTk=1',
        method: 'post',
        data: allValues,
      });
      message.success('Settings saved successfully');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Title level={3}>Annoyancy Removal Settings</Title>}
      loading={fetchLoading}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          hideLicenseSettings: true,
          hideAiIntegration: true,
          hideMobileDeprecated: true,
          hideChangePassword: true,
          hideVerification: true,
          hideTheme: true,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "License settings"</Text>
              <br />
              <Text type="secondary">Remove license settings menu items and buttons</Text>
            </div>
            <Form.Item
              name="hideLicenseSettings"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "AI integration"</Text>
              <br />
              <Text type="secondary">Remove AI integration menu items and buttons</Text>
            </div>
            <Form.Item
              name="hideAiIntegration"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "Mobile (deprecated)"</Text>
              <br />
              <Text type="secondary">Remove deprecated mobile menu items and buttons</Text>
            </div>
            <Form.Item
              name="hideMobileDeprecated"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "Change password"</Text>
              <br />
              <Text type="secondary">Remove "Change password" from user dropdown menu</Text>
            </div>
            <Form.Item
              name="hideChangePassword"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "Verification"</Text>
              <br />
              <Text type="secondary">Remove "Verification" from user dropdown menu</Text>
            </div>
            <Form.Item
              name="hideVerification"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Hide "Theme"</Text>
              <br />
              <Text type="secondary">Remove "Theme" from user dropdown menu</Text>
            </div>
            <Form.Item
              name="hideTheme"
              valuePropName="checked"
              noStyle
            >
              <Switch loading={loading} />
            </Form.Item>
          </div>
        </Space>
      </Form>
    </Card>
  );
};
