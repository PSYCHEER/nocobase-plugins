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
