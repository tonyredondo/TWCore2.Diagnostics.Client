import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem } from '../../services/api';
import { Observable } from 'rxjs/Observable';

@Component({
  templateUrl: 'logs.component.html'
})
export class LogsComponent implements OnInit {
  apps: ApplicationsLevels[];
  dataCache: { [index: string]: ICachedData } = {};

  constructor(private _queryService: QueryService) { }

  async ngOnInit() {
    this.getApplications();
  }

  async getApplications() {
    const response = await this._queryService.apiQueryByEnvironmentLogsApplicationsGet(environment.name).toPromise();
    this.apps = response;
  }

  getLogData(application: string, level: string, page: number = 0, pageSize: number = 50): ICachedData {
    const value = this.dataCache[application];
    if (value === undefined) {
      const newValue = {
        environment: environment.name,
        level: level,
        page: page,
        pageSize: pageSize,
        data: this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, application, level, undefined, undefined, page, pageSize)
      };
      this.dataCache[application] = newValue;
      return newValue;
    }
    if (value.environment !== environment.name) {
      value.environment = environment.name;
      value.data = null;
    }
    if (value.level !== level) {
      value.level = level;
      value.data = null;
    }
    if (value.page !== page) {
      value.page = page;
      value.data = null;
    }
    if (value.pageSize !== pageSize) {
      value.pageSize = pageSize;
      value.data = null;
    }
    if (value.data === null) {
      value.data = this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, application, value.level, undefined, undefined, value.page, value.pageSize);
    }
    return value;
  }

}

interface ICachedData {
  environment: string;
  level: string;
  page: number;
  pageSize: number;
  data: Observable<PagedListNodeLogItem>;
}
