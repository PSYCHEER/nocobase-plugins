/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import ReactEChartsComponent, { EChartsInstance, EChartsReactProps } from 'echarts-for-react';

export const ReactECharts = (props: EChartsReactProps['option']) => {
  const echartRef = React.useRef<any>();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      echartRef.current?.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return <div style={{ height: '400px', width: '100%' }} />;
  }
  
  return <ReactEChartsComponent option={props} ref={(e) => (echartRef.current = e)} style={{ height: '400px', width: '100%' }} />;
};
