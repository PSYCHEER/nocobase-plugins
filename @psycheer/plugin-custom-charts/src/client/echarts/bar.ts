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

export class Bar extends ECharts {
  constructor() {
    super({
      name: 'bar',
      title: 'Bar Chart',
      series: { type: 'bar' },
      config: [],
    });
    this.config = [
      'xField',
      'yField',
      'seriesField',
      {
        configType: 'select',
        name: 'orientation',
        title: 'Orientation',
        defaultValue: 'vertical',
        options: [
          { label: 'Vertical (bottom to top)', value: 'vertical' },
          { label: 'Horizontal (left to right)', value: 'horizontal' },
        ],
      },
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
    const { orientation = 'vertical', xField, yField, seriesField } = general;
    
    // Detekcia ktoré pole má agregáciu (transformer)
    const xHasTransformer = fieldProps[xField]?.transformer;
    const yHasTransformer = fieldProps[yField]?.transformer;
    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    
    // Rozhodnutie: pole s transformer = value os, bez transformer = category os
    let categoryAxis: 'x' | 'y';
    let valueAxis: 'x' | 'y';
    
    if (orientation === 'vertical') {
      // Preferencia: X=category, Y=value
      if (yHasTransformer || !xHasTransformer) {
        categoryAxis = 'x';
        valueAxis = 'y';
      } else {
        // Ak X má transformer a Y nie, vymeň
        categoryAxis = 'y';
        valueAxis = 'x';
      }
    } else {
      // Horizontal: preferencia X=value, Y=category
      if (xHasTransformer || !yHasTransformer) {
        categoryAxis = 'y';
        valueAxis = 'x';
      } else {
        // Ak Y má transformer a X nie, vymeň
        categoryAxis = 'x';
        valueAxis = 'y';
      }
    }
    
    // Nastav osi
    props.xAxis = {
      ...props.xAxis,
      name: xLabel,
      type: categoryAxis === 'x' ? 'category' : 'value',
    };
    props.yAxis = {
      ...props.yAxis,
      name: yLabel,
      type: categoryAxis === 'y' ? 'category' : 'value',
    };
    
    // Ak boli polia vymenené, uprav encode v sériách
    const needsSwap = (orientation === 'vertical' && categoryAxis === 'y') || 
                      (orientation === 'horizontal' && categoryAxis === 'x');
    
    if (needsSwap && props.series && Array.isArray(props.series)) {
      props.series = props.series.map((s: any) => ({
        ...s,
        encode: {
          x: s.encode?.y || yField,
          y: s.encode?.x || xField,
        },
      }));
    }
    
    // Ak nie je series pole, pridaj farby pre každý stĺpec
    if (!seriesField && props.series && props.series.length > 0) {
      props.series[0].itemStyle = {
        color: (params: any) => {
          const colors = props.color || ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
          return colors[params.dataIndex % colors.length];
        }
      };
    }
    
    props.legend = {
      show: !!seriesField,
      type: 'scroll',
      textStyle: {
        color: '#fff',
      },
    };
    
    // Vlastný tooltip formátovač
    const categoryField = categoryAxis === 'x' ? xField : yField;
    const valueField = categoryAxis === 'x' ? yField : xField;
    const categoryLabel = categoryAxis === 'x' ? xLabel : yLabel;
    const valueLabel = categoryAxis === 'x' ? yLabel : xLabel;
    
    props.tooltip = {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        
        if (seriesField) {
          // S series: ukáž všetky série
          let result = `${categoryLabel}: ${params[0].name}<br/>`;
          params.forEach((param: any) => {
            const value = typeof param.value === 'object' ? param.value[valueField] : param.value;
            result += `${param.seriesName}: ${value}<br/>`;
          });
          return result;
        } else {
          // Bez series: jednoduchý tooltip
          const param = params[0];
          const categoryValue = param.name;
          const dataValue = typeof param.value === 'object' ? param.value[valueField] : param.value;
          return `${categoryLabel}: ${categoryValue}<br/>${valueLabel}: ${dataValue}`;
        }
      }
    };

    return props;
  }
}

new Bar();
