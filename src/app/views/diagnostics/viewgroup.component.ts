import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
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
  selector:    'view-group',
  templateUrl: 'viewgroup.component.html'
})
export class ViewGroupComponent implements OnInit {
  private _group: string;

  get group() : string {
    return this._group;
  }
  @Input()
  set group(value: string) {
    this._group = value;
    this.loadData();
  }

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _codeMirror: CodemirrorService,
    private localeService: BsLocaleService) {}

  ngOnInit() {
  }

  loadData() {
  }
}
