import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import {  PagedListTraceResult } from '../../services/api';
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
  templateUrl: 'traces.component.html'
})

export class TracesComponent implements OnInit {
  private currentPage = 0;
  private pageSize = 25;
  totalPagesArray: number[];
  traceData: PagedListTraceResult;
  bsConfig: Partial<BsDatepickerConfig>;
  bsValue: Date;

  // Constructor
  constructor(private _queryService: QueryService, private localeService: BsLocaleService) {}

  // Methods
  ngOnInit() {
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: moment().toDate(),
      showWeekNumbers: false
    });
    this.bsValue = moment().toDate();
    this.localeService.use('en-gb');
    this.changeDate();
  }
  updateData() {
    this._queryService.apiQueryByEnvironmentTracesGet(environment.name, this.bsValue, this.bsValue, this.currentPage, this.pageSize).subscribe(item => {
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
    this.currentPage = 0;
    this.updateData();
  }
  goToPage(page: number = 0) {
    if (page < 0) {
      return;
    }
    if (page > this.totalPagesArray[this.totalPagesArray.length - 1]) {
      return;
    }
    this.currentPage = page;
    this.updateData();
  }
}
