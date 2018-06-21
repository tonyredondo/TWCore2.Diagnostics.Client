import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem } from '../../services/api';
import { Observable } from 'rxjs/Observable';

@Component({
  templateUrl: 'logs.component.html'
})
export class LogsComponent implements OnInit {
  apps: Observable<ApplicationsLevels[]>;
  dataCache: { [index: string]: ICachedData } = {};
  private defaultPageSize = 15;

  constructor(private _queryService: QueryService) { }

  async ngOnInit() {
    this.getApplications();
  }

  async getApplications() {
    this.apps = this._queryService.apiQueryByEnvironmentLogsApplicationsGet(environment.name);
  }

  currentLogData(item: ApplicationsLevels): ICachedData {
    const value = this.dataCache[item.application];
    if (value === undefined) {
      const newValue = {
        environment: environment.name,
        level: item.levels[0],
        page: 0,
        pageSize: this.defaultPageSize,
        data: this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, item.levels[0], undefined, undefined, 0, this.defaultPageSize),
        unwrappedData: null,
        totalPagesArray: []
      };
      newValue.data.subscribe(x => {
        newValue.unwrappedData = x;
        newValue.totalPagesArray = Array(x.totalPages).fill(0).map((a, i) => i);
      });
      this.dataCache[item.application] = newValue;
      return newValue;
    }
    if (value.data === null) {
      value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, undefined, undefined, value.page, value.pageSize);
      value.data.subscribe(x => {
        value.unwrappedData = x;
        value.totalPagesArray = Array(x.totalPages).fill(0).map((a, i) => i);
      });
    }
    return value;
  }
  getLogData(item: ApplicationsLevels, level: string, page: number = 0, pageSize: number = this.defaultPageSize): ICachedData {
    const value = this.currentLogData(item);
    let bChanged = false;
    if (value.environment !== environment.name) {
      value.environment = environment.name;
      bChanged = true;
    }
    if (value.level !== level && level !== null) {
      value.level = level;
      bChanged = true;
    }
    if (value.page !== page && page !== -1) {
      value.page = page;
      bChanged = true;
    }
    if (value.pageSize !== pageSize && page !== -1) {
      value.pageSize = pageSize;
      bChanged = true;
    }
    if (bChanged || value.data === null) {
      value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, undefined, undefined, value.page, value.pageSize);
      value.data.subscribe(x => {
        value.unwrappedData = x;
        value.totalPagesArray = Array(x.totalPages).fill(0).map((a, i) => i);
      });
    }
    return value;
  }
  goToPage(item: ApplicationsLevels, page: number = 0): ICachedData {
    if (page < 0) {
      return;
    }
    const value = this.currentLogData(item);
    if (page > value.totalPagesArray.length - 1) {
      return;
    }
    value.page = page;
    value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, undefined, undefined, value.page, value.pageSize);
    value.data.subscribe(x => {
      value.unwrappedData = x;
      value.totalPagesArray = Array(x.totalPages).fill(0).map((a, i) => i);
    });
    return value;
  }
  changeLevel(item: ApplicationsLevels, level: string) {
    const value = this.currentLogData(item);
    value.level = level;
    value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, value.level, undefined, undefined, value.page, value.pageSize);
    value.data.subscribe(x => {
      value.unwrappedData = x;
      value.totalPagesArray = Array(x.totalPages).fill(0).map((a, i) => i);
    });
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
