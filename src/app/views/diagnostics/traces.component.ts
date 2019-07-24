import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { PagedListGroupResult } from '../../services/api';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
defineLocale('en-gb', enGbLocale);
import { moment } from 'ngx-bootstrap/chronos/test/chain';

@Component({
  templateUrl: 'traces.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TracesComponent implements OnInit {
  private _queryParams: Params;
  private _currentPage = 0;
  private _pageSize = 50;
  public bProcessing = false;
  public totalPagesArray: number[];
  public groupData: PagedListGroupResult;
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date;
  public environmentName: string;
  public withErrors: string = 'No';
  constructor(private _queryService: QueryService, private _localeService: BsLocaleService,
    private _activatedRoute: ActivatedRoute, private _router: Router, private cdr: ChangeDetectorRef) {}

  // Public Methods
  ngOnInit() {
    let initialDate = new Date();
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._queryParams.date !== undefined) {
      initialDate = moment.utc(this._queryParams.date, 'YYYY-MM-DD').toDate();
    }
    if (this._queryParams.page !== undefined) {
      this._currentPage = parseInt(this._queryParams.page, 0);
    }
    if (this._queryParams.withErrors !== undefined) {
      this.withErrors = this._queryParams.withErrors;
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
    this.cdr.detectChanges();
    if (environment.name === undefined || environment.name === null || environment.name.length === 0) {
      return;
    }
    this.bProcessing = true;
    this.environmentName = environment.name;
    this.cdr.detectChanges();
    this._queryService.apiQueryByEnvironmentGroupsGet(environment.name, this.bsValue, this.bsValue, this.withErrors == 'Yes', this._currentPage, this._pageSize).subscribe(item => {
      this.bProcessing = false;
      this.cdr.detectChanges();
      if (item === null) {
        return;
      }
      const maxPages = 10;
      this.groupData = item;
      if (item.totalResults == 0 && this.withErrors == 'Yes') {
        this.withErrors = 'No';
        this.updateData();
        return;
      }
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
      this.cdr.detectChanges();
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

  getTimeDiff(end: Date, start: Date): string {
    let timeInSeconds = (moment(end).valueOf() - moment(start).valueOf()) / 1000;
    let minutes = Math.floor(timeInSeconds / 60);
    let seconds = Math.round(timeInSeconds - (minutes * 60));
    if (minutes > 0 && seconds > 0) {
      return minutes + " min, " + seconds + " seconds";
    } else if (minutes > 0) {
      return minutes + " min";
    } else {
      return seconds + " seconds";
    }
  }

  // Private Methods
  private updateParams() {
    this._queryParams.env = environment.name;
    this._queryParams.date = moment(this.bsValue).format('YYYY-MM-DD');
    this._queryParams.page = this._currentPage;
    this._queryParams.withErrors = this.withErrors;
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this._queryParams,
      replaceUrl: true
    });
  }
}
