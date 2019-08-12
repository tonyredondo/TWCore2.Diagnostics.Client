import { NodeCountersQueryItem } from "./nodeCountersQueryItem";

export type DataUnitEnum = 'All' | 'Yearly' | 'Monthly' | 'Daily' | 'Hourly' | 'Minutely';
export const DataUnitEnum = {
  All: 'All' as DataUnitEnum,
  Yearly: 'Yearly' as DataUnitEnum,
  Monthly: 'Monthly' as DataUnitEnum,
  Daily: 'Daily' as DataUnitEnum,
  Hourly: 'Hourly' as DataUnitEnum,
  Minutely: 'Minutely' as DataUnitEnum
};

export interface CounterValuesAggregateItem {
  from?: Date;
  to?: Date;
  value?: number;
}

export interface CounterValuesAggregate {
  counter?: NodeCountersQueryItem;
  fromDate?: Date;
  toDate?: Date;
  dataUnit?: DataUnitEnum;
  value?: number;
  data?: Array<CounterValuesAggregateItem>;
}
