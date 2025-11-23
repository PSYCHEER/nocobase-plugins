/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Chart, ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
export declare class Radar extends Chart {
    constructor();
    init: ChartType['init'];
    getProps({ data, general, advanced, fieldProps }: RenderProps): {
        title: {
            text: string;
        };
    } | {
        color: any;
        radar: {
            indicator: {
                name: string;
                max: number;
            }[];
            shape: string;
            splitNumber: number;
        };
        series: {
            type: string;
            data: any[];
        }[];
        legend: {
            show: boolean;
            type: string;
            data: any[];
            textStyle: {
                color: string;
            };
        };
        tooltip: {
            show: boolean;
            trigger: string;
        };
        animation: boolean;
    };
}
