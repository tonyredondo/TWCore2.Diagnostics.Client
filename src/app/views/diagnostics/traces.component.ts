import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { PagedListTraceResult } from '../../services/api';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
defineLocale('en-gb', enGbLocale);
import { moment } from 'ngx-bootstrap/chronos/test/chain';

@Component({
  templateUrl: 'traces.component.html'
})

export class TracesComponent implements OnInit {
  private _queryParams: Params;
  private _currentPage = 0;
  private _pageSize = 25;
  public totalPagesArray: number[];
  public traceData: PagedListTraceResult;
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date;
  constructor(private _queryService: QueryService, private _localeService: BsLocaleService, private _activatedRoute: ActivatedRoute, private _router: Router) {}

  // Public Methods
  ngOnInit() {
    let initialDate = new Date();
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._queryParams.date !== undefined) {
      initialDate = moment(this._queryParams.date, 'YYYY-MM-DD').toDate();
    }
    if (this._queryParams.page !== undefined) {
      this._currentPage = parseInt(this._queryParams.page, 0);
    }

    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: new Date(),
      showWeekNumbers: false
    });
    this.bsValue = initialDate;
    this._localeService.use('en-gb');
    this.updateParams();
    this.updateData();
  }
  updateData() {
    this._queryService.apiQueryByEnvironmentTracesGet(environment.name, this.bsValue, this.bsValue, this._currentPage, this._pageSize).subscribe(item => {
      if (item === null) {
        return;
      }
      const maxPages = 10;
      this.traceData = item;
      if (item.totalPages < maxPages) {
        this.totalPagesArray = Array(item.totalPages).fill(0).map((a, i) => i);
      } else {
        const midPoint = maxPages / 2;
        if (item.pageNumber <= midPoint) {
          this.totalPagesArray = Array(maxPages).fill(0).map((a, i) => i);
        } else if (item.totalPages - item.pageNumber < midPoint) {
          const startPoint = item.totalPages - maxPages;
          this.totalPagesArray = Array(maxPages).fill(0).map((a, i) => startPoint + i);
        } else {
          const startPoint = item.pageNumber - midPoint;
          this.totalPagesArray = Array(maxPages).fill(0).map((a, i) => startPoint + i);
        }
      }
    });
  }
  changeDate() {
    this._currentPage = 0;
    this.updateParams();
    this.updateData();
  }
  goToPage(page: number = 0) {
    if (page < 0) {
      return;
    }
    if (page > this.totalPagesArray[this.totalPagesArray.length - 1]) {
      return;
    }
    this._currentPage = page;
    this.updateParams();
    this.updateData();
  }

  getTimeDiff(end: Date, start: Date): Number {
    return (moment(end).valueOf() - moment(start).valueOf()) / 1000;
  }

  // Private Methods
  private updateParams() {
    this._queryParams.date = moment(this.bsValue).format('YYYY-MM-DD');
    this._queryParams.page = this._currentPage;
    this._router.navigate([], { relativeTo: this._activatedRoute, queryParams: this._queryParams });
  }
}
