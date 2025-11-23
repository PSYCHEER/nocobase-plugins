/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Chart, ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { ReactECharts } from './ReactEcharts';
import deepmerge from 'deepmerge';

export class Radar extends Chart {
  constructor() {
    super({
      name: 'radar',
      title: 'Radar Chart',
      Component: ReactECharts,
      config: [
        {
          configType: 'field',
          name: 'categoryField',
          title: 'Category Field',
          required: true,
        },
        {
          configType: 'field',
          name: 'valueField',
          title: 'Value Field',
          required: true,
        },
        {
          configType: 'field',
          name: 'seriesField',
          title: 'Series Field',
        },
        {
          configType: 'input',
          name: 'customColors',
          title: 'Custom Colors (comma separated hex)',
          defaultValue: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
        },
        {
          configType: 'select',
          name: 'areaStyle',
          title: 'Fill Area',
          defaultValue: 'filled',
          options: [
            { label: 'Filled', value: 'filled' },
            { label: 'Line Only', value: 'none' },
          ],
        },
      ],
    });
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, {
      measures,
      dimensions,
    });
    
    return {
      general: {
        categoryField: xField?.value,
        valueField: yField?.value,
        seriesField: seriesField?.value,
        customColors: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
        areaStyle: 'filled',
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { categoryField, valueField, seriesField, customColors, areaStyle } = general;
    
    if (!categoryField || !valueField) {
      return deepmerge(
        {
          title: { text: 'Please configure Category Field and Value Field' },
        },
        advanced,
      );
    }

    const colors = customColors 
      ? customColors.split(',').map((c: string) => c.trim())
      : ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

    // Get unique categories (indicators for radar)
    const categories = Array.from(new Set(data.map((row: any) => row[categoryField])));
    
    // Build radar indicator configuration
    const indicator = categories.map(cat => ({
      name: String(cat),
      max: Math.max(...data.filter((row: any) => row[categoryField] === cat).map((row: any) => row[valueField] || 0)) * 1.2,
    }));

    let seriesData: any[];

    if (seriesField) {
      // Multiple series - one radar line per series value
      const seriesValues = Array.from(new Set(data.map((row: any) => row[seriesField])));
      
      seriesData = seriesValues.map((seriesValue, index) => {
        const values = categories.map(cat => {
          const row = data.find((r: any) => r[categoryField] === cat && r[seriesField] === seriesValue);
          return row ? row[valueField] : 0;
        });

        return {
          name: String(seriesValue),
          value: values,
          areaStyle: areaStyle === 'filled' ? { opacity: 0.3 } : undefined,
          lineStyle: {
            color: colors[index % colors.length],
          },
          itemStyle: {
            color: colors[index % colors.length],
          },
        };
      });
    } else {
      // Single series
      const values = categories.map(cat => {
        const row = data.find((r: any) => r[categoryField] === cat);
        return row ? row[valueField] : 0;
      });

      seriesData = [{
        name: fieldProps[valueField]?.label || valueField,
        value: values,
        areaStyle: areaStyle === 'filled' ? { opacity: 0.3 } : undefined,
        lineStyle: {
          color: colors[0],
        },
        itemStyle: {
          color: colors[0],
        },
      }];
    }

    return deepmerge(
      {
        color: colors,
        radar: {
          indicator,
          shape: 'polygon',
          splitNumber: 4,
        },
        series: [{
          type: 'radar',
          data: seriesData,
        }],
        legend: {
          show: !!seriesField,
          type: 'scroll',
          data: seriesData.map(s => s.name),
          textStyle: {
            color: '#fff',
          },
        },
        tooltip: {
          show: true,
          trigger: 'item',
        },
        animation: false,
      },
      advanced,
    );
  }
}

new Radar();
