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
  timestamp?: number;
  value?: number;
}

export interface CounterValuesAggregate {
  counter?: NodeCountersQueryItem;
  fromDate?: Date;
  toDate?: Date;
  dataUnit?: DataUnitEnum;
  aggregates?: ValuesAggregates;
  data?: Array<CounterValuesAggregateItem>;
}

export interface ValuesAggregates {
  currentDay?: number;
  averageInCurrentDay?: number;
  currentWeek?: number;
  averageInCurrentWeek?: number;
  aggregatedValue?: number;
  averageValue?: number;
}
