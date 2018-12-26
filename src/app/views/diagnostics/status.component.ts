import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: 'status.component.html'
})
export class StatusComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;

  // barChart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartLabels: string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType = 'bar';
  public barChartLegend = false;

  public barChartData: any[] = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router) { }

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
  }
}
