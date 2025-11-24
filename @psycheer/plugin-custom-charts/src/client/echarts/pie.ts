/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { ECharts } from './echarts';
import deepmerge from 'deepmerge';

export class Pie extends ECharts {
  constructor() {
    super({
      name: 'pie',
      title: 'Pie Chart',
      series: { type: 'pie' },
      config: [],
    });
    this.config = [
      {
        configType: 'field',
        name: 'angleField',
        title: 'angleField',
        required: true,
      },
      {
        configType: 'field',
        name: 'colorField',
        title: 'colorField',
        required: true,
      },
      {
        configType: 'input',
        name: 'customColors',
        title: 'Custom Colors (comma separated hex)',
        defaultValue: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
      },
      {
        configType: 'input',
        name: 'borderWidth',
        title: 'Border Width',
        defaultValue: '0',
      },
      {
        configType: 'input',
        name: 'borderColor',
        title: 'Border Color',
        defaultValue: '#fff',
      },
      {
        configType: 'input',
        name: 'borderRadius',
        title: 'Border Radius',
        defaultValue: '10',
      },
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        colorField: xField?.value,
        angleField: yField?.value,
        customColors: '#5470c6,#91cc75,#fac858,#ee6666,#73c0de,#3ba272,#fc8452,#9a60b4,#ea7ccc',
        borderWidth: '0',
        borderColor: '#fff',
        borderRadius: '10',
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { colorField, angleField, customColors, borderWidth, borderColor, borderRadius } = general;
    const colors = customColors 
      ? customColors.split(',').map((c: string) => c.trim())
      : ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    
    const result = deepmerge(
      {
        color: colors,
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            color: '#fff',
          },
        },
        series: [
          {
            type: 'pie',
            radius: ['50%', '65%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: borderRadius !== undefined ? parseInt(borderRadius) : 10,
              borderColor: borderColor || '#fff',
              borderWidth: borderWidth !== undefined ? parseInt(borderWidth) : 0,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold',
              },
            },
            labelLine: {
              show: false,
            },
            data: data.map((item: any) => ({
              name: item[colorField],
              value: item[angleField],
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
              scaleSize: 10,
            })),
          },
        ],
      },
      advanced,
    );

    return result;
  }
}
