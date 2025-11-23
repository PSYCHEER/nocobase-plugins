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
export declare class Pie extends ECharts {
    constructor();
    init: ChartType['init'];
    getProps({ data, general, advanced, fieldProps }: RenderProps): {
        color: any;
        tooltip: {
            trigger: string;
        };
        legend: {
            orient: string;
            left: string;
            textStyle: {
                color: string;
            };
        };
        series: {
            type: string;
            radius: string[];
            avoidLabelOverlap: boolean;
            itemStyle: {
                borderRadius: number;
                borderColor: any;
                borderWidth: number;
            };
            label: {
                show: boolean;
                position: string;
            };
            emphasis: {
                label: {
                    show: boolean;
                    fontSize: number;
                    fontWeight: string;
                };
            };
            labelLine: {
                show: boolean;
            };
            data: {
                name: any;
                value: any;
                itemStyle: {
                    shadowBlur: number;
                    shadowOffsetX: number;
                    shadowColor: string;
                };
                scaleSize: number;
            }[];
        }[];
    };
}
