import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem, SerializableException, LogSummary } from '../../services/api';
import { Observable } from 'rxjs/Observable';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
defineLocale('en-gb', enGbLocale);

import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { LogLevelEnum } from '../../services/api/model/loglevel';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';

// Charts
import { getStyle, hexToRgba } from '@coreui/coreui/dist/js/coreui-utilities';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';


@Component({
  templateUrl: 'logs.component.html'
})

export class LogsComponent implements OnInit {
  private defaultPageSize = 15;
  summary: LogSummary;
  errorCount: number;
  warningCount: number;
  statsCount: number;
  dataCache: { [index: string]: ICachedData } = {};
  bsConfig: Partial<BsDatepickerConfig>;
  bsValue: Date[];
  @ViewChild('exceptionModal') exceptionModal: ModalDirective;
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  // Serializable
  exceptionData: SerializableException;
  innerExceptionsData: SerializableException[];
  // Main chart
  public mainChartData1: Array<number> = [];
  public mainChartData2: Array<number> = [];
  public mainChartData: Array<any> = [
    {
      data: this.mainChartData1,
      label: 'Error'
    },
    {
      data: this.mainChartData2,
      label: 'Warning'
    }
  ];
  public mainChartColours: Array<any> = [
    { // Error
      backgroundColor: hexToRgba(getStyle('--danger'), 100),
      borderColor: getStyle('--danger'),
      pointHoverBackgroundColor: '#fff'
    },
    { // Warning
      backgroundColor: hexToRgba(getStyle('--warning'), 100),
      borderColor: getStyle('--warning'),
      pointHoverBackgroundColor: '#fff',
    }
  ];
  public mainChartLabels: Array<any> = [];
  public mainChartOptions: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips,
      intersect: true,
      mode: 'index',
      position: 'nearest',
      callbacks: {
        labelColor: function(tooltipItem, chart) {
          return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor };
        }
      }
    },
    responsive: true,
    scaleShowVerticalLines: false,
    maintainAspectRatio: false,
    legend: {
      display: true
    }
  };
  public mainChartLegend = false;
  public mainChartType = 'bar';
  public showChart = true;

  // Constructor
  constructor(private _queryService: QueryService, private localeService: BsLocaleService) {}

  // Methods
  ngOnInit() {
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: moment().toDate(),
      showWeekNumbers: false
    });
    this.bsValue = [ moment().subtract(7, 'd').toDate(), moment().toDate() ];
    this.localeService.use('en-gb');
    this.getApplications();
  }
  getApplications() {
    this._queryService.apiQueryByEnvironmentLogsApplicationsGet(environment.name, this.bsValue[0], this.bsValue[1]).subscribe(x => {
      if (x === null) {
        return;
      }
      this.dataCache = {};
      this.summary = x;
      this.errorCount = 0;
      this.warningCount = 0;
      this.statsCount = 0;
      this.mainChartData1.length = 0;
      this.mainChartData2.length = 0;
      this.mainChartLabels.length = 0;
      this.chart.chart.update();
      const series = {};
      this.showChart = false;

      x.levels.forEach(item => {
        if (item.name === LogLevelEnum.Error) {
          this.errorCount = item.count;
        }
        if (item.name === LogLevelEnum.Warning) {
          this.warningCount = item.count;
        }
        if (item.name === LogLevelEnum.Stats) {
          this.statsCount = item.count;
        }
        item.series.forEach(value => {
          const valueDate = value.date.toString();
          if (series[valueDate] === undefined) {
            series[valueDate] = {};
          }
          series[valueDate][item.name] = value.count;
          this.showChart = true;
        });
      });

      for (const key in series) {
        if (series.hasOwnProperty(key)) {
          const element = series[key] as {};
          if (element[LogLevelEnum.Error] !== undefined) {
            this.mainChartData1.push(element[LogLevelEnum.Error]);
          } else {
            this.mainChartData1.push(0);
          }
          if (element[LogLevelEnum.Warning] !== undefined) {
            this.mainChartData2.push(element[LogLevelEnum.Warning]);
          } else {
            this.mainChartData2.push(0);
          }

          this.mainChartLabels.push(moment(key).format('DD/MM/YYYY'));
        }
      }
      this.chart.chart.update();
    });
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
        totalPagesArray: [],
        isCollapsed: true
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
  showException(item: SerializableException) {
    this.exceptionData = item;
    this.innerExceptionsData = [];
    this.createInnerExceptionData(item.innerException);
    this.exceptionModal.show();
  }
  createInnerExceptionData(item: SerializableException) {
    if (item === null) {
      return;
    }
    this.innerExceptionsData.push(item);
    this.createInnerExceptionData(item.innerException);
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
  isCollapsed: boolean;
}
