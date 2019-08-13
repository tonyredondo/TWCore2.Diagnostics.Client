import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { ApexTitleSubtitle, ApexChart, ApexAxisChartSeries, ApexDataLabels, ApexXAxis, ApexTooltip } from 'ng-apexcharts';
import { DataUnitEnum } from '../../services/api';


@Component({
  selector:    'chart-item',
  templateUrl: 'chartitem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartItemComponent implements OnInit {
  private _counterId: string;
  get counterId() : string {
    return this._counterId;
  }
  @Input()
  set counterId(value: string) {
    this._counterId = value;
    this.loadData();
  }
  public title: ApexTitleSubtitle;
  public subtitle: ApexTitleSubtitle;
  public chart: ApexChart;
  public dataLabels: ApexDataLabels;
  public series: any; // ApexAxisChartSeries;
  public xaxis: ApexXAxis;
  public tooltip: ApexTooltip;
  public cumulative: string;
  public average: string;

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
        height: 300
      };
      this.dataLabels = {
        enabled: false
      }
      this.series = null;
      this.xaxis = {
        type: 'datetime',
        tickAmount: 6
      }
      this.tooltip = {
        x: {
          format: 'dd MMM yyyy - HH:mm'
        }
      }

    }

  ngOnInit() {
  }

  async loadData() {
    var fromDate = new Date(new Date().setHours(-240,0,0,0));
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
      this.cumulative = data.value + '';
      this.average = data.averageValue.toFixed(2);

      //console.log(this.counterId, data, this.series);

      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();
  }
}
