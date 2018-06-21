import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: 'logs.component.html'
})
export class LogsComponent implements OnInit {
  apps: string[];
  data: any;

  constructor(private _queryService: QueryService) { }

  ngOnInit() {
    this.getApplications();

    this.getApps('');
  }


  async getApplications() {
    const response = await this._queryService.apiQueryApplicationsGet().toPromise();
    this.apps = response.filter(x => x.environment === environment.name).map(x => x.application);
  }

  async getApps(value: string) {
    const response = await this._queryService.apiQueryByEnvironmentLogsSearchBySearchGet(environment.name, '', undefined, undefined, undefined, 0, 100).toPromise();

    this.data = response;
  }

}
