import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';


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

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
  }

  async loadData() {
  }
}
