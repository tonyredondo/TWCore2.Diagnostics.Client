import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { ApplicationsLevels, PagedListNodeLogItem, SerializableException, LogSummary, TraceResult } from '../../services/api';
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
  private defaultPageSize = 15;
  traceData: TraceResult[];
  bsConfig: Partial<BsDatepickerConfig>;
  bsValue: Date[];

  // Constructor
  constructor(private _queryService: QueryService, private localeService: BsLocaleService) {}

  // Methods
  ngOnInit() {
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      maxDate: moment().toDate(),
      showWeekNumbers: false
    });
    this.bsValue = [ moment().subtract(1, 'd').toDate(), moment().toDate() ];
    this.localeService.use('en-gb');
    this.getTraces();
  }
  getTraces() {
    this._queryService.apiQueryByEnvironmentTracesGet(environment.name, this.bsValue[0], this.bsValue[1]).subscribe(x => {
      if (x === null) {
        return;
      }
      this.traceData = x;
      console.log(x);
    });
  }
}
