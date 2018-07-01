import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';


@Component({
  templateUrl: 'search.component.html'
})

export class SearchComponent implements OnInit {
  private _queryParams: Params;
  public searchValue: string;
  public bProcessing: boolean = false;
  public bHasResults?: boolean;
  public bsValue: Date[];
  public searchResults: SearchResults;
  public searchTraces: Array<Array<NodeTraceItem>>;
  // Exception Viewer
  @ViewChild('exceptionModal')
  public exceptionModal: ModalDirective;
  public exceptionTimestamp: Date;
  public exceptionApplication: string;
  public exceptionMachine: string;
  public exceptionData: SerializableException;
  public innerExceptionsData: SerializableException[];
  constructor(private _queryService: QueryService, private _activatedRoute: ActivatedRoute, private _router: Router) {}

  // Public Methods
  ngOnInit() {
    const initialDate = [ moment().subtract(6, 'd').toDate(), moment().toDate() ];
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._queryParams.fromDate !== undefined) {
      initialDate[0] = moment(this._queryParams.fromDate, 'YYYY-MM-DD').toDate();
    }
    if (this._queryParams.toDate !== undefined) {
      initialDate[1] = moment(this._queryParams.toDate, 'YYYY-MM-DD').toDate();
    }
    this.bsValue = initialDate;
    if (this._queryParams.term !== undefined) {
      this.searchValue = this._queryParams.term;
      this.doSearch();
    }
  }

  doSearch() {
    this.updateParams();
    this.bHasResults = null;
    this.bProcessing = true;

    this._queryService.apiQueryByEnvironmentSearchBySearchTermGet(environment.name, this.searchValue, this.bsValue[0], this.bsValue[1]).subscribe(data => {
      this.bProcessing = false;
      if (data == null || (data.logs.length == 0 && data.traces.length == 0))
      {
        this.bHasResults = false;
        return;
      }
      this.bHasResults = true;
      this.searchResults = data;
      const groupObject = this.groupBy(this.searchResults.traces, 'group');
      this.searchTraces = [];
      for(const groupItem in groupObject) {
        if (groupObject.hasOwnProperty(groupItem)) {
          this.searchTraces.push(groupObject[groupItem]);
        }
      }
    });
  }

  groupBy(value: any[], key: string) : { [index: string]: Array<NodeTraceItem> } {
    var resObj = {} as { [index: string]: Array<NodeTraceItem> };
    for (var i = 0; i < value.length; i++) {
        const item = value[i] !== undefined ? value[i] : null;
        if (item != null) {
            var currentKey = ' ';
            if (item[key] !== undefined)
                currentKey = item[key];

            if (resObj[currentKey] !== undefined) {
              const rObjItem = resObj[currentKey];
              if (Array.isArray(rObjItem))
                  resObj[currentKey].push(item);
              else
                  resObj[currentKey] = [resObj[currentKey], item];
            }
            else
                resObj[currentKey] = item;
        }
    }
    return resObj;
  }

  showException(item: NodeLogItem) {
    this.exceptionTimestamp = item.timestamp;
    this.exceptionApplication = item.application;
    this.exceptionMachine = item.machine;
    this.exceptionData = item.exception;
    this.innerExceptionsData = [];
    this.createInnerExceptionData(this.exceptionData.innerException);
    this.exceptionModal.show();
  }
  createInnerExceptionData(item: SerializableException) {
    if (item === null) {
      return;
    }
    this.innerExceptionsData.push(item);
    this.createInnerExceptionData(item.innerException);
  }

  // Private Methods
  private updateParams() {
    this._queryParams.term = this.searchValue;
    this._queryParams.fromDate = moment(this.bsValue[0]).format('YYYY-MM-DD');
    this._queryParams.toDate = moment(this.bsValue[1]).format('YYYY-MM-DD');
    this._router.navigate([], { relativeTo: this._activatedRoute, queryParams: this._queryParams });
  }
}
