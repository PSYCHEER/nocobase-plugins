/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Chart, ChartProps, ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { ReactECharts } from './ReactEcharts';
import deepmerge from 'deepmerge';

export class ECharts extends Chart {
  series: any;
  constructor({
    name,
    title,
    series,
    config,
  }: {
    name: string;
    title: string;
    series: any;
    config?: ChartProps['config'];
  }) {
    super({
      name,
      title,
      Component: ReactECharts,
      config: ['xField', 'yField', 'seriesField', 
        {
          configType: 'input',
          name: 'customColors',
          title: 'Custom Colors (comma separated hex)',
          defaultValue: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
        },
        {
          configType: 'select',
          name: 'legendSort',
          title: 'Legend Sort',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'ASC', value: 'asc' },
            { label: 'DESC', value: 'desc' },
          ],
        },
        ...(config || [])],
    });
    this.series = series;
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, {
      measures,
      dimensions,
    });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        seriesField: seriesField?.value,
        customColors: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps): any {
    const { xField, yField, seriesField, customColors } = general;
    const colors = customColors 
      ? customColors.split(',').map((c: string) => c.trim())
      : ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    let seriesName = [yLabel];
    if (seriesField) {
      seriesName = Array.from(new Set(data.map((row: any) => row[seriesField]))).map((value) => value || 'null');
    }
    const result = deepmerge(
      {
        color: colors,
        dataset: [
          {
            dimensions: [xField, ...(seriesField ? seriesName : [yField])],
            source: data,
          },
        ],
        series: seriesName.map((name) => ({
          name,
          // datasetIndex: 1,
          ...this.series,
          encode: {
            x: xField,
            y: yField,
          },
        })),
        xAxis: {
          name: xLabel,
          type: 'category',
        },
        yAxis: {
          name: yLabel,
          type: 'category',
        },
        animation: false,
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'var(--nb-echarts-tooltip-bg, var(--ant-color-bg-elevated, #1d1d1d))',
          borderColor: function(params: any) {
            // Pre axis trigger (väčšina grafov): params[0].color
            // Pre item trigger (radar): params.color
            if (Array.isArray(params)) {
              return params[0]?.color || 'var(--nb-echarts-tooltip-border, var(--ant-color-border, #333))';
            } else {
              return params?.color || 'var(--nb-echarts-tooltip-border, var(--ant-color-border, #333))';
            }
          },
          borderWidth: 2,
          textStyle: {
            color: 'var(--nb-echarts-tooltip-color, var(--ant-color-text, #fff))',
            fontSize: 14,
            fontFamily: 'inherit',
          },
          extraCssText: [
            'box-shadow: 0 6px 12px 0 var(--nb-echarts-tooltip-shadow, rgba(0,0,0,0.12));',
            'border-radius: 4px;',
            'padding: 12px;',
            'backdrop-filter: blur(2px);',
            'opacity: 0.95;'
          ].join(' '),
        },
      },
      advanced,
    );

    return result;
  }

  getReference() {
    return {
      title: 'ECharts',
      link: 'https://echarts.apache.org/en/option.html',
    };
  }
}
