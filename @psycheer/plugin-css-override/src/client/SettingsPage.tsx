import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message } from 'antd';
import { useAPIClient, useRequest } from '@nocobase/client';
import TextArea from 'antd/es/input/TextArea';

export const SettingsPage = () => {
  const api = useAPIClient();
  const [form] = Form.useForm();

  const { data, loading } = useRequest({
    url: 'cssOverride:get?filterByTk=1',
  });

  useEffect(() => {
    if ((data as any)?.data) {
      form.setFieldsValue({
        customCss: (data as any).data.customCss || '',
      });
    }
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await api.resource('cssOverride').update({
        filterByTk: 1,
        values,
      });
      message.success('CSS saved successfully');
      
      if ((window as any).reloadCustomCss) {
        await (window as any).reloadCustomCss();
      }
    } catch (error) {
      message.error('Failed to save CSS');
    }
  };

  return (
    <Card title="CSS Override Settings" loading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="customCss"
          label="Custom CSS"
          rules={[{ required: true, message: 'Please enter your custom CSS' }]}
        >
          <TextArea
            rows={20}
            placeholder="/* Add your custom CSS here */"
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave}>
            Save CSS
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
