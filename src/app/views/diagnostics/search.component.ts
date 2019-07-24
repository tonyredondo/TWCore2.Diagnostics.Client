import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem, NodeStatusItemValue } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CodemirrorService } from '@nomadreservations/ngx-codemirror';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
import { KeyValue } from '../../services/api/model/keyValue';
defineLocale('en-gb', enGbLocale);


@Component({
  templateUrl: 'search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchComponent implements OnInit {
  private _queryParams: Params;
  public searchValue: string;
  public bProcessing = false;
  public bHasResults?: boolean;
  public results?: Array<string> = [];
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date[];

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _codeMirror: CodemirrorService,
    private localeService: BsLocaleService,
    private cdr: ChangeDetectorRef) {}

  // Public Methods
  ngOnInit() {
    const initialDate = [ moment().subtract(14, 'd').toDate(), moment().toDate() ];
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
    if (this._queryParams.term !== undefined) {
      this.searchValue = this._queryParams.term;
      this.getData();
    }
  }

  doSearch() {
    this.updateParams();
    this.getData();
  }

  getData() {
    this.cdr.detectChanges();
    if (this.searchValue === undefined || this.searchValue === null || this.searchValue.length === 0) {
      return;
    }
    this.bHasResults = null;
    this.bProcessing = true;
    let searchVal = this.searchValue;
    this.cdr.detectChanges();

    if (searchVal != null && (searchVal.startsWith('http://') || searchVal.startsWith('HTTP://'))) {
      const regex1 = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
      const regex2 = /[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}/i;
      const regex1Result = regex1.exec(searchVal);
      const regex2Result = regex2.exec(searchVal);
      let finalRes = [];
      if (regex1Result !== null) {
        finalRes = finalRes.concat(regex1Result);
      }
      if (regex2Result !== null) {
        finalRes = finalRes.concat(regex2Result);
      }
      searchVal = finalRes.join(' ');
    }

    this._queryService.apiQueryByEnvironmentGroupSearchBySearchTermGet(environment.name, searchVal, this.bsValue[0], this.bsValue[1]).subscribe(data => {
      this.bProcessing = false;
      this.results = data as any as Array<string>;
      if (this.results == null || this.results.length === 0) {
        this.bHasResults = false;
        return;
      }
      this.bHasResults = true;
      console.log(this.results);
      this.cdr.detectChanges();
    });
  }

  // Private Methods
  private updateParams() {
    this._queryParams.env = environment.name;
    this._queryParams.term = this.searchValue;
    this._queryParams.fromDate = moment(this.bsValue[0]).format('YYYY-MM-DD');
    this._queryParams.toDate = moment(this.bsValue[1]).format('YYYY-MM-DD');
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this._queryParams,
      replaceUrl: true
    });
  }
}

interface INodeGroup {
  collapsed: boolean;
  data: INodeTraceItemExt[];
}
interface INodeTraceItemExt extends NodeTraceItem {
  tagsArray: TagItem[];
  cssClass: string;
}



/*********************************/
interface NodeGroup {
  groupName: string;
  items: NodeApp[];
  metadata: KeyValue[];
  logsCount?: number;
  tracesCount?: number;
  start?: Date;
  end?: Date;
}
interface NodeApp {
  appName: string;
  hidden: boolean;
  hasError: boolean;
  hasWarning: boolean;
  items: NodeItem[];
}
interface NodeItem {
  id?: string;
  application?: string;
  machine?: string;
  timestamp?: Date;
  diffTime?: string;
  instanceId?: string;

  logId?: string;
  assembly?: string;
  type?: string;
  code?: string;
  level?: NodeLogItem.LevelEnum;
  message?: string;
  exception?: SerializableException;

  traceId?: string;
  tags?: string;
  name?: string;

  tagsArray: TagItem[];

  nextIsStart: boolean;
  prevIsEnd: boolean;

  hasXml: boolean;
  hasJson: boolean;
  hasTxt: boolean;
}
interface TagItem {
  key: string;
  value: string;
}
