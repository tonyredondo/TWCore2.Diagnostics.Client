import { ActivatedRoute, Params, Router, DefaultUrlSerializer } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CodemirrorService } from '@nomadreservations/ngx-codemirror';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';

defineLocale('en-gb', enGbLocale);

@Component({
  templateUrl: 'search.component.html'
})

export class SearchComponent implements OnInit {
  private _queryParams: Params;
  private _urlSerializer: DefaultUrlSerializer;
  public searchValue: string;
  public bProcessing = false;
  public bHasResults?: boolean;
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date[];
  public searchResults: SearchResults;
  public searchTraces: Array<INodeGroup>;
  public applications: string[] = [];
  public logCollapsed = false;
  // Exception Viewer
  @ViewChild('exceptionModal')
  public exceptionModal: ModalDirective;
  public exceptionTimestamp: Date;
  public exceptionApplication: string;
  public exceptionMachine: string;
  public exceptionData: SerializableException;
  public innerExceptionsData: SerializableException[];
  // Trace Viewer
  @ViewChild('traceModal')
  public traceModal: ModalDirective;
  public traceObject: string;
  public traceName: string;

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _codeMirror: CodemirrorService,
    private localeService: BsLocaleService) {}

  // Public Methods
  ngOnInit() {
    this._urlSerializer = new DefaultUrlSerializer();
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
    if (this.searchValue === undefined || this.searchValue === null || this.searchValue.length === 0) {
      return;
    }
    this.bHasResults = null;
    this.bProcessing = true;
    let searchVal = this.searchValue;

    if (searchVal != null && (searchVal.startsWith("http://") || searchVal.startsWith("HTTP://"))) {
      var regex1 = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
      var regex2 = /[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}/i;
      var regex1Result = regex1.exec(searchVal);
      var regex2Result = regex2.exec(searchVal);
      var finalRes = [];
      if (regex1Result !== null) {
        finalRes = finalRes.concat(regex1Result);
      }
      if (regex2Result !== null) {
        finalRes = finalRes.concat(regex2Result);
      }
      searchVal = finalRes.join(' ');
    }

    this._queryService.apiQueryByEnvironmentSearchBySearchTermGet(environment.name, searchVal, this.bsValue[0], this.bsValue[1]).subscribe(data => {
      this.bProcessing = false;
      if (data == null || (data.logs.length === 0 && data.traces.length === 0)) {
        this.bHasResults = false;
        return;
      }
      this.bHasResults = true;
      this.searchResults = data;

      this.applications.length = 0;
      const items = [];
      for (let i = 0; i < this.searchResults.traces.length; i++) {
        const item = this.searchResults.traces[i];
        const itemTags = item.tags.split(', ');
        const tags = [] as TagItem[];
        for (let it = 0; it < itemTags.length; it++) {
          const itemTagItem = itemTags[it].split(': ');
          tags.push({ key: itemTagItem[0], value: itemTagItem[1] });
        }
        if (this.applications.indexOf(item.application) === -1) {
          this.applications.push(item.application);
        }
        items.push(Object.assign(item, {
          tagsArray : tags,
          cssClass : 'trace-application-bgcolor' + this.applications.indexOf(item.application)
        }));
      }

      const groupObject = this.groupBy(items, 'group');
      this.searchTraces = [];
      for (const groupItem in groupObject) {
        if (groupObject.hasOwnProperty(groupItem)) {
          this.searchTraces.push({
            collapsed: false,
            data: groupObject[groupItem]
          });
        }
      }
      console.log(this.searchTraces);
    });
  }

  groupBy(value: any[], key: string): { [index: string]: Array<INodeTraceItemExt> } {
    const resObj = {} as { [index: string]: Array<INodeTraceItemExt> };
    for (let i = 0; i < value.length; i++) {
        const item = value[i] !== undefined ? value[i] : null;
        if (item != null) {
            let currentKey = ' ';
            if (item[key] !== undefined) {
                currentKey = item[key];
            }

            if (resObj[currentKey] !== undefined) {
              const rObjItem = resObj[currentKey];
              if (Array.isArray(rObjItem)) {
                  resObj[currentKey].push(item);
              } else {
                  resObj[currentKey] = [resObj[currentKey], item];
              }
            } else {
                resObj[currentKey] = [item];
            }
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
    if (this.exceptionData !== null) {
      this.createInnerExceptionData(this.exceptionData.innerException);
    }
    this.exceptionModal.show();
  }
  createInnerExceptionData(item: SerializableException) {
    if (item === null) {
      return;
    }
    this.innerExceptionsData.push(item);
    this.createInnerExceptionData(item.innerException);
  }
  showXmlData(id: string, name: string) {
    this.traceName = name;
    this.traceModal.show();
    this._queryService.apiQueryByEnvironmentTracesXmlByIdGet(environment.name, id).subscribe(x => {
      this.traceObject = x;
      this._codeMirror.instance$.subscribe(editor => {
        editor.setOption('mode', 'application/xml');
        if (x.startsWith('{')) {
          editor.setOption('mode', 'application/json');
        }
        editor.setOption('theme', 'material');
        editor.setOption('readOnly', true);
        editor.setOption('lineNumbers', true);
        editor.setOption('matchBrackets', true);
        editor.setOption('foldGutter', true);
        editor.setOption('gutters', ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']);
        editor.setOption('extraKeys', {
          'Alt-F': 'findPersistent'
        });
        editor.setValue(this.traceObject);
        editor.setSize('100%', '700px');
        editor.getDoc().setCursor({ line: 0, ch: 0});
        editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
        editor.scrollTo(0, 0);
        setTimeout(() => editor.refresh(), 200);
      });
    });
  }
  showJsonData(id: string, name: string) {
    this.traceName = name;
    this.traceModal.show();
    this._queryService.apiQueryByEnvironmentTracesJsonByIdGet(environment.name, id).subscribe(x => {
      this.traceObject = x;
      this._codeMirror.instance$.subscribe(editor => {
        editor.setOption('mode', 'application/json');
        if (x.startsWith('<?xml')) {
          editor.setOption('mode', 'application/xml');
        }
        editor.setOption('theme', 'material');
        editor.setOption('readOnly', true);
        editor.setOption('lineNumbers', true);
        editor.setOption('matchBrackets', true);
        editor.setOption('foldGutter', true);
        editor.setOption('gutters', ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']);
        editor.setOption('extraKeys', {
          'Alt-F': 'findPersistent'
        });
        editor.setValue(this.traceObject);
        editor.setSize('100%', '700px');
        editor.getDoc().setCursor({ line: 0, ch: 0});
        editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
        editor.scrollTo(0, 0);
        setTimeout(() => editor.refresh(), 200);
      });
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
interface TagItem {
  key: string;
  value: string;
}
