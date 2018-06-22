import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem, LogLevelQuantity } from '../../services/api';
import { Observable } from 'rxjs/Observable';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { esLocale } from 'ngx-bootstrap/locale';
defineLocale('es', esLocale);

import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { LogLevelEnum } from '../../services/api/model/loglevel';

@Component({
  templateUrl: 'logs.component.html'
})
export class LogsComponent implements OnInit {
  apps: Observable<ApplicationsLevels[]>;
  errorCount: number;
  warningCount: number;
  statsCount: number;
  dataCache: { [index: string]: ICachedData } = {};
  bsConfig: Partial<BsDatepickerConfig>;
  bsValue: Date[];
  private defaultPageSize = 15;

  constructor(private _queryService: QueryService, private localeService: BsLocaleService) {}

  async ngOnInit() {
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: moment().toDate(),
      showWeekNumbers: false
    });
    this.bsValue = [ moment().subtract(7, 'd').toDate(), moment().toDate() ];
    this.localeService.use('es');

    this.getApplications();
  }

  async getApplications() {
    this.apps = this._queryService.apiQueryByEnvironmentLogsApplicationsGet(environment.name, this.bsValue[0], this.bsValue[1]);
    this.apps.subscribe(x => {
      if (x === null) {
        return;
      }
      this.errorCount = 0;
      this.warningCount = 0;
      this.statsCount = 0;
      x.forEach(item => {
        item.levels.forEach(level => {
          if (level.name === LogLevelEnum.Error) {
            this.errorCount += level.count;
          }
          if (level.name === LogLevelEnum.Warning) {
            this.warningCount += level.count;
          }
          if (level.name === LogLevelEnum.Stats) {
            this.statsCount += level.count;
          }
        });
      });
    });
    this.dataCache = {};
  }

  currentLogData(item: ApplicationsLevels): ICachedData {
    const value = this.dataCache[item.application];
    if (value === undefined) {
      const newValue = {
        environment: environment.name,
        level: item.levels[0].name,
        page: 0,
        pageSize: this.defaultPageSize,
        data: this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, item.levels[0].name, this.bsValue[0], this.bsValue[1], 0, this.defaultPageSize),
        unwrappedData: null,
        totalPagesArray: []
      };
      newValue.data.subscribe(x => this.resolveSubscription(newValue, x));
      this.dataCache[item.application] = newValue;
      return newValue;
    }
    if (value.data === null) {
      value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, this.bsValue[0], this.bsValue[1], value.page, value.pageSize);
      value.data.subscribe(x => this.resolveSubscription(value, x));
    }
    return value;
  }

  goToPage(item: ApplicationsLevels, page: number = 0): ICachedData {
    if (page < 0) {
      return;
    }
    const value = this.currentLogData(item);
    if (page > value.totalPagesArray[value.totalPagesArray.length - 1]) {
      return;
    }
    value.page = page;
    value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, this.bsValue[0], this.bsValue[1], value.page, value.pageSize);
    value.data.subscribe(x => this.resolveSubscription(value, x));
    return value;
  }
  changeLevel(item: ApplicationsLevels, level: string) {
    const value = this.currentLogData(item);
    value.level = level;
    value.page = 0;
    value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, this.bsValue[0], this.bsValue[1], value.page, value.pageSize);
    value.data.subscribe(x => this.resolveSubscription(value, x));
  }
  changeRange(item: ApplicationsLevels) {
    const value = this.currentLogData(item);
    value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, this.bsValue[0], this.bsValue[1], value.page, value.pageSize);
    value.data.subscribe(x => this.resolveSubscription(value, x));
  }

  resolveSubscription(value: ICachedData, item: PagedListNodeLogItem) {
    const maxPages = 10;
    value.unwrappedData = item;
    if (item.totalPages < maxPages) {
      value.totalPagesArray = Array(item.totalPages).fill(0).map((a, i) => i);
    } else {
      const midPoint = maxPages / 2;
      if (item.pageNumber <= midPoint) {
        value.totalPagesArray = Array(maxPages).fill(0).map((a, i) => i);
      } else if (item.totalPages - item.pageNumber < midPoint) {
        const startPoint = item.totalPages - maxPages;
        value.totalPagesArray = Array(maxPages).fill(0).map((a, i) => startPoint + i);
      } else {
        const startPoint = item.pageNumber - midPoint;
        value.totalPagesArray = Array(maxPages).fill(0).map((a, i) => startPoint + i);
      }
    }
  }
}

interface ICachedData {
  environment: string;
  level: string;
  page: number;
  pageSize: number;
  data: Observable<PagedListNodeLogItem>;
  unwrappedData: PagedListNodeLogItem;
  totalPagesArray: number[];
}
