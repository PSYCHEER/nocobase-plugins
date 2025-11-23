/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Chart, ChartProps, ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
export declare class ECharts extends Chart {
    series: any;
    constructor({ name, title, series, config, }: {
        name: string;
        title: string;
        series: any;
        config?: ChartProps['config'];
    });
    init: ChartType['init'];
    getProps({ data, general, advanced, fieldProps }: RenderProps): any;
    getReference(): {
        title: string;
        link: string;
    };
}
