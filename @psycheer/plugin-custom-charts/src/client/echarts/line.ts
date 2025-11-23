/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RenderProps } from '@nocobase/plugin-data-visualization/client';
import { ECharts } from './echarts';

export class Line extends ECharts {
  constructor() {
    super({
      name: 'line',
      title: 'Line Chart',
      series: { type: 'line' },
      config: [],
    });
    this.config = [
      'xField',
      'yField',
      'seriesField',
      {
        configType: 'input',
        name: 'customColors',
        title: 'Custom Colors (comma separated hex)',
        defaultValue: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
      },
    ];
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const props = super.getProps({ data, general, advanced, fieldProps });
    const { xField, yField, seriesField, customColors } = general;
    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    
    const colors = customColors 
      ? customColors.split(',').map((c: string) => c.trim())
      : ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    
    // Fix dimensions when seriesField is set - parent only includes [xField, ...seriesNames]
    // but we need yField in dimensions for proper encoding
    if (seriesField && props.dataset?.[0]) {
      props.dataset[0].dimensions = [xField, yField];
      
      // When using seriesField, we need to transform data to have separate series
      // Extract unique series values
      const seriesValues = Array.from(new Set(data.map((row: any) => row[seriesField])));
      
      // Create a series for each unique value
      props.series = seriesValues.map((seriesValue, index) => ({
        name: String(seriesValue),
        type: 'line',
        data: data
          .filter((row: any) => row[seriesField] === seriesValue)
          .map((row: any) => [row[xField], row[yField]]),
        color: colors[index % colors.length],
      }));
      
      // Remove dataset when using explicit data
      delete props.dataset;
    }
    
    props.xAxis = {
      ...props.xAxis,
      name: xLabel,
      type: 'category',
    };
    props.yAxis = {
      ...props.yAxis,
      name: yLabel,
      type: 'value',
    };
    
    props.legend = {
      show: !!seriesField,
      type: 'scroll',
      textStyle: {
        color: '#fff',
      },
    };
    
    props.tooltip = {
      show: true,
      trigger: 'axis',
    };
    
    return props;
  }
}

new Line();
