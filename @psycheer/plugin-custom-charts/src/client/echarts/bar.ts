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
    const { orientation = 'vertical', xField, yField, seriesField, legendSort = 'none' } = general;
    
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
    
    // Definuj polia pre tooltip
    const categoryField = seriesField;
    const valueField = yField;
    const categoryLabel = fieldProps[categoryField]?.label;
    const valueLabel = fieldProps[valueField]?.label;
    
    // Fix dimensions and series when seriesField is set
    if (seriesField && props.dataset?.[0]) {
      props.dataset[0].dimensions = [xField, yField];
      
      // Sort function
      const sortSeries = (arr: any[], order: string) => {
        if (order === 'none') return arr;
        return arr.sort((a, b) => {
          const na = Number(a), nb = Number(b);
          if (!isNaN(na) && !isNaN(nb)) {
            return order === 'asc' ? na - nb : nb - na;
          }
          return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
      };
      
      // Extract unique series values (xField) and category values (seriesField)
      const seriesValues = sortSeries(Array.from(new Set(data.map((row: any) => row[xField]))), legendSort);
      const categoryValues = Array.from(new Set(data.map((row: any) => row[seriesField]))).sort();
      
      // Set axis data
      if (categoryAxis === 'x') {
        props.xAxis.data = categoryValues;
      } else {
        props.yAxis.data = categoryValues;
      }
      
      // Create a series for each unique xField value
      props.series = seriesValues.map((seriesValue, index) => {
        // Create data with y values for each category (seriesField value), null if missing
        const seriesData = categoryValues.map(categoryValue => {
          const row = data.find((r: any) => r[xField] === seriesValue && r[seriesField] === categoryValue);
          return row ? Number(row[valueField]) : null;
        });
        
        return {
          name: String(seriesValue),
          type: 'bar',
          data: seriesData,
          color: props.color?.[index % props.color.length],
          stack: 'total',
        };
      }).filter(series => series.data.some(point => point !== null));
      
      // Remove dataset when using explicit data
      delete props.dataset;
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
    
    // Pridaj axisPointer na správnu os
    if (categoryAxis === 'x') {
      props.xAxis = {
        ...props.xAxis,
        axisPointer: {
          type: 'shadow'
        }
      };
    } else {
      props.yAxis = {
        ...props.yAxis,
        axisPointer: {
          type: 'shadow'
        }
      };
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
    
    // Vlastný tooltip formátovač - zachovaj vizuálne vlastnosti zo základnej triedy
    props.tooltip = {
      ...props.tooltip, // zachovaj všetky vizuálne vlastnosti
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: orientation === 'horizontal' ? 'shadow' : 'shadow'
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        
        if (seriesField) {
          // S series: ukáž kategóriu, total a rozdelenie
          const categoryValue = params[0]?.name || 'N/A';
          const total = params.reduce((sum: number, param: any) => sum + (param.value || 0), 0);
          let result = `${categoryLabel || 'Series'}: ${String(categoryValue)} : ${total}<br/>`;
          params.forEach((param: any) => {
            const value = param.value;
            if (value !== null && value !== undefined) {
              result += `${String(param.seriesName || 'Value')}: ${value}<br/>`;
            }
          });
          return result;
        } else {
          // Bez series: jednoduchý tooltip
          const param = params[0];
          const categoryValue = param?.name || 'N/A';
          let dataValue = param?.value;
          if (typeof dataValue === 'object' && dataValue !== null) {
            dataValue = dataValue[yField] || dataValue;
          }
          if (typeof dataValue === 'object') {
            dataValue = JSON.stringify(dataValue);
          }
          return `${categoryLabel || categoryField || 'Category'}: ${String(categoryValue)}<br/>${valueLabel || valueField || 'Value'}: ${String(dataValue || 'N/A')}`;
        }
      }
    };

    return props;
  }
}

new Bar();
