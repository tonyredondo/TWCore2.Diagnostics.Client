import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem, SerializableException, LogSummary, NodeLogItem } from '../../services/api';
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
  private _queryParams: Params;
  private _defaultPageSize = 10;
  public bProcessing = false;
  // Summary rows
  public summary: LogSummary;
  public errorCount: number;
  public warningCount: number;
  public statsCount: number;
  // Data Cache
  public dataCache: { [index: string]: ICachedData } = {};
  // Date picker
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date[];
  // Exception Viewer
  @ViewChild('exceptionModal')
  public exceptionModal: ModalDirective;
  public exceptionTimestamp: Date;
  public exceptionApplication: string;
  public exceptionMachine: string;
  public exceptionData: SerializableException;
  public innerExceptionsData: SerializableException[];
  // Cart
  @ViewChild(BaseChartDirective)
  public chart: BaseChartDirective;
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
  constructor(private _queryService: QueryService, private localeService: BsLocaleService, private _activatedRoute: ActivatedRoute, private _router: Router) {}

  // Public Methods
  ngOnInit() {
    const initialDate = [ moment().subtract(2, 'd').toDate(), moment().toDate() ];
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._queryParams.fromDate !== undefined) {
      initialDate[0] = moment.utc(this._queryParams.fromDate, 'YYYY-MM-DD').toDate();
    }
    if (this._queryParams.toDate !== undefined) {
      initialDate[1] = moment.utc(this._queryParams.toDate, 'YYYY-MM-DD').toDate();
    }

    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: moment().toDate(),
      showWeekNumbers: false
    });
    this.bsValue = initialDate;
    this.localeService.use('en-gb');
    this.getApplications();
  }
  getApplications() {
    this.bProcessing = true;
    this.updateParams();
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
      const seriesArray = [];
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
          const date = moment(value.date);
          const valueDate = value.date.toString();
          if (series[valueDate] === undefined) {
            series[valueDate] = {};
          }
          series[valueDate]['Time'] = date.toDate().getTime();
          series[valueDate]['Key'] = date.format('DD/MM/YYYY');
          series[valueDate][item.name] = value.count;
          this.showChart = true;
        });
      });

      for (const key in series) {
        if (series.hasOwnProperty(key)) {
          seriesArray.push(series[key]);
        }
      }
      seriesArray.sort((a, b) => a.Time - b.Time);

      for (let i = 0; i < seriesArray.length; i++) {
        const element = seriesArray[i] as {};
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
        this.mainChartLabels.push(element['Key']);
      }

      this.chart.chart.update();

      this.bProcessing = false;
    });
  }
  currentLogData(item: ApplicationsLevels): ICachedData {
    const value = this.dataCache[item.application];
    if (value === undefined) {
      const newValue = {
        environment: environment.name,
        level: item.levels[0].name,
        page: 0,
        pageSize: this._defaultPageSize,
        data: this._queryService.apiQueryByEnvironmentLogsByApplicationByLevelGet(environment.name, item.application, item.levels[0].name, this.bsValue[0], this.bsValue[1], 0, this._defaultPageSize),
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
  showException(item: NodeLogItem) {
    this.exceptionTimestamp = item.timestamp;
    this.exceptionApplication = item.application;
    this.exceptionMachine = item.machine;
    this.exceptionData = item.exception;
    this.innerExceptionsData = [];
    if (this.exceptionData !== null) {
      this.createInnerExceptionData(this.exceptionData.innerException);
    }
    this.exceptionModal.show();
  }
  createInnerExceptionData(item: SerializableException) {
    if (item === null) {
      return;
    }
    this.innerExceptionsData.push(item);
    this.createInnerExceptionData(item.innerException);
  }

  levelsLegend(item: ApplicationsLevels): string {
    if (item.levels === null) {
      return;
    }
    const textItems = [];
    item.levels.forEach(value => {
      let name = value.name;
      if (name !== 'Stats') {
        name += 's';
      }
      textItems.push(value.count + ' ' + name);
    });
    return textItems.join(', ');
  }

  // Private Methods
  private updateParams() {
    this._queryParams.env = environment.name;
    this._queryParams.fromDate = moment(this.bsValue[0]).format('YYYY-MM-DD');
    this._queryParams.toDate = moment(this.bsValue[1]).format('YYYY-MM-DD');
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this._queryParams,
      replaceUrl: true
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
  isCollapsed: boolean;
}
