import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { ApexTitleSubtitle, ApexChart, ApexAxisChartSeries, ApexDataLabels, ApexXAxis, ApexTooltip, ApexStroke, ChartComponent } from 'ng-apexcharts';
import { DataUnitEnum, ValuesAggregates } from '../../services/api';
import { NodeCountersQueryItem } from '../../services/api/model/nodeCountersQueryItem';


@Component({
  selector:    'chart-item',
  templateUrl: 'chartitem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartItemComponent implements OnInit, OnDestroy {

  private _counterId: string;
  get counterId() : string {
    return this._counterId;
  }
  @Input()
  set counterId(value: string) {
    this._counterId = value;
    this.loadData();
  }
  @ViewChild('chartObj') chartComponent: ChartComponent;
  public title: ApexTitleSubtitle;
  public subtitle: ApexTitleSubtitle;
  public chart: ApexChart;
  public dataLabels: ApexDataLabels;
  public series: any; // ApexAxisChartSeries;
  public xaxis: ApexXAxis;
  public tooltip: ApexTooltip;
  public stroke: ApexStroke;

  public counter: NodeCountersQueryItem;
  public aggregates: ValuesAggregates;
  public unit: string;
  public dataUnit: string;
  public destroy = false;

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private cdr: ChangeDetectorRef) {

      this.title = {
        text: '',
        align: 'center'
      };
      this.subtitle = {
        text: '',
        align: 'center'
      };
      this.chart = {
        type: 'area',
        height: 300,
        animations: {
          enabled: false,
          speed: 100
        }
      };
      this.dataLabels = {
        enabled: false
      };
      this.series = null;
      this.xaxis = {
        type: 'datetime'
      };
      this.tooltip = {
        x: {
          format: 'dd MMM yyyy - HH:mm'
        }
      };
      this.stroke = {
        width: 2
      };

    }

  ngOnInit() {
    this.destroy = false;
  }
  ngOnDestroy(): void {
    this.destroy = true;
  }

  async loadData() {
    if (this.destroy) return;

    var fromDate = new Date(new Date().setHours(-336,0,0,0));
    var toDate = new Date(new Date().setHours(0,0,0,0));
    this._queryService.apiQueryCountersAggregation(environment.name, this.counterId, DataUnitEnum.Hourly, fromDate, toDate).subscribe(data => {

      this.title = {
        text: data.counter.name,
        align: 'center'
      };
      this.subtitle = {
        text: data.counter.application + ' | ' + data.counter.category,
        align: 'center'
      };
      this.series = [
        {
          name: 'Hourly',
          data: []
        }
      ];

      for(let i = 0; i < data.data.length; i++) {
        const dataItem = data.data[i];
        this.series[0].data.push([ dataItem.timestamp, dataItem.value ]);
      }
      this.counter = data.counter;
      this.aggregates = data.aggregates;

      this.unit = data.counter.unit.toLowerCase();
      if (this.unit == 'unknown') {
        this.unit = 'rqs';
      } else if (this.unit == 'milliseconds') {
        this.unit = 'ms';
      }
      else if (this.unit == 'minutes') {
        this.unit = 'mins';
      }
      else if (this.unit == 'megabytes') {
        this.unit = 'MBs';
      }
      else if (this.unit == 'messages') {
        this.unit = 'msgs';
      }

      switch(data.dataUnit) {
        case DataUnitEnum.All:
          this.dataUnit = '';
          break;
        case DataUnitEnum.Daily:
          this.dataUnit = '/day';
          break;
        case DataUnitEnum.Hourly:
          this.dataUnit = '/hour';
          break;
        case DataUnitEnum.Minutely:
          this.dataUnit = '/min';
          break;
        case DataUnitEnum.Monthly:
          this.dataUnit = '/month';
          break;
        case DataUnitEnum.Yearly:
          this.dataUnit = '/year';
          break;
        default:
          this.dataUnit = '';
          break;
      }

      //console.log(this.counterId, data, this.series);

      if (this.chartComponent)
        this.chartComponent.updateSeries(this.series, false);

      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();

    var self = this;
    setTimeout(()=> {
      self.loadData();
    }, 120000);
  }
}
