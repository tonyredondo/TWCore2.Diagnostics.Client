import { ActivatedRoute, Params, Router } from '@angular/router';
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
  public searchValue: string;
  public bProcessing = false;
  public bHasResults?: boolean;
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsValue: Date[];
  public searchResults: SearchResults;
  public searchTraces: Array<INodeGroup>;
  public groupResults: Array<NodeGroup>;
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
      console.log(data);

      // ***********************+***********************+***********************+***********************+
      // New model
      const groupArray = Array<NodeGroup>();
      if (this.searchResults !== null) {
        if (this.searchResults.logs !== null) {

          for (let i = 0; i < this.searchResults.logs.length; i++) {
            const aItem = this.searchResults.logs[i];

            let groupItem = groupArray.find(item => item.groupName === aItem.group);
            if (groupItem === undefined) {
              groupItem = {
                groupName: aItem.group,
                items: []
              };
              groupArray.push(groupItem);
            }

            let appItem = groupItem.items.find(item => item.appName === aItem.application);
            if (appItem === undefined) {
              appItem = {
                appName: aItem.application,
                hidden: false,
                hasError: false,
                hasWarning: false,
                items: []
              };
              groupItem.items.push(appItem);
            }

            const nodeItem: NodeItem = {
              assembly: aItem.assembly,
              code: aItem.code,
              exception: aItem.exception,
              id: aItem.id,
              instanceId: aItem.instanceId,
              level: aItem.level,
              logId: aItem.logId,
              machine: aItem.machine,
              message: aItem.message,
              timestamp: aItem.timestamp,
              type: aItem.type,
              tags : null,
              tagsArray: null,
              name: null,
              traceId: null
            };
            if (nodeItem.level === NodeLogItem.LevelEnum.Error) {
              appItem.hasError = true;
            }
            if (nodeItem.level === NodeLogItem.LevelEnum.Warning) {
              appItem.hasWarning = true;
            }
            appItem.items.push(nodeItem);
          }
        }
        if (this.searchResults.traces !== null) {
          for (let i = 0; i < this.searchResults.traces.length; i++) {
            const aItem = this.searchResults.traces[i];

            let groupItem = groupArray.find(item => item.groupName === aItem.group);
            if (groupItem === undefined) {
              groupItem = {
                groupName: aItem.group,
                items: []
              };
              groupArray.push(groupItem);
            }

            let appItem = groupItem.items.find(item => item.appName === aItem.application);
            if (appItem === undefined) {
              appItem = {
                appName: aItem.application,
                hidden: false,
                hasError: false,
                hasWarning: false,
                items: []
              };
              groupItem.items.push(appItem);
            }
            const itemTags = aItem.tags.split(', ');
            const tags = [] as TagItem[];
            for (let it = 0; it < itemTags.length; it++) {
              const itemTagItem = itemTags[it].split(': ');
              tags.push({ key: itemTagItem[0], value: itemTagItem[1] });
            }
            const nodeItem: NodeItem = {
              id: aItem.id,
              instanceId: aItem.instanceId,
              machine: aItem.machine,
              timestamp: aItem.timestamp,
              traceId: aItem.traceId,
              tags: aItem.tags,
              name: aItem.name,
              tagsArray: tags
            };
            if (nodeItem.tags.indexOf('Status: Error') > -1) {
              appItem.hasError = true;
            }
            appItem.items.push(nodeItem);
          }
        }
      }
      for (let i = 0; i < groupArray.length; i++) {
        const groupItem = groupArray[i];
        for (let j = 0; j < groupItem.items.length; j++) {
          const appItem = groupItem.items[j];
          appItem.items.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
          for (let n = 1; n < appItem.items.length; n++) {
            const nodeItem = appItem.items[n];
            const oldNodeItem = appItem.items[0];
            const duration = moment(nodeItem.timestamp).diff(oldNodeItem.timestamp);
            const minutes = Math.floor(duration / 1000 / 60);
            const seconds = Math.floor((duration / 1000) - (minutes * 60));
            const milliseconds = duration - (Math.floor(duration / 1000) * 1000);
            let diffTime = '+ ';
            if (minutes > 0) {
              diffTime += minutes + 'min';
              if (seconds > 0 || milliseconds > 0) {
                diffTime += ', ';
              }
            }
            if (seconds > 0) {
              diffTime += seconds + 's';
              if (milliseconds > 0) {
                diffTime += ', ';
              }
            }
            diffTime += milliseconds + 'ms';
            nodeItem.diffTime = diffTime;
            /*
            const minutesString = minutes > 9 ? minutes : '0' + minutes;
            const secondsString = seconds > 9 ? seconds : '0' + seconds;
            const millisecondsString = milliseconds > 99 ? milliseconds : milliseconds > 9 ? '0' + milliseconds : '00' + milliseconds;
            let diffTime = '+' + minutesString + ':' + secondsString + '.' + millisecondsString;
            if (diffTime === '+00:00.000') {
              diffTime = '';
            }
            nodeItem.diffTime = diffTime;
            */
            console.log(nodeItem.diffTime);
          }
        }
      }
      this.groupResults = groupArray;
      console.log(groupArray);
      // ***********************+***********************+***********************+***********************+***********************+

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

      const groupObject = this.traceGroupBy(items, 'group');
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

  traceGroupBy(value: any[], key: string): { [index: string]: Array<INodeTraceItemExt> } {
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


/*********************************/
interface NodeGroup {
  groupName: string;
  items: NodeApp[];
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
}
