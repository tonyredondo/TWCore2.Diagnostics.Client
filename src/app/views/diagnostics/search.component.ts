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

    this._queryService.apiQueryByEnvironmentSearchBySearchTermGet(environment.name, searchVal, this.bsValue[0], this.bsValue[1]).subscribe(data => {
      this.bProcessing = false;
      if (data == null || (data.logs.length === 0 && data.traces.length === 0)) {
        this.bHasResults = false;
        return;
      }
      this.bHasResults = true;
      this.searchResults = data;

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
                hidden: true,
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
              application: aItem.application,
              instanceId: aItem.instanceId,
              level: aItem.level,
              logId: aItem.logId,
              machine: aItem.machine,
              message: aItem.message,
              timestamp: new Date(aItem.timestamp),
              type: aItem.type,
              tags : null,
              tagsArray: null,
              name: null,
              traceId: null,
              nextIsStart: false,
              prevIsEnd: false
            };
            if (nodeItem.level === NodeLogItem.LevelEnum.Error) {
              appItem.hasError = true;
              appItem.hidden = false;
            }
            if (nodeItem.level === NodeLogItem.LevelEnum.Warning) {
              appItem.hasWarning = true;
              appItem.hidden = false;
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
              application: aItem.application,
              instanceId: aItem.instanceId,
              machine: aItem.machine,
              timestamp: new Date(aItem.timestamp),
              traceId: aItem.traceId,
              tags: aItem.tags,
              name: aItem.name,
              tagsArray: tags,
              nextIsStart: false,
              prevIsEnd: false
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
          appItem.items.sort(function(a, b) {
            const aNumber = a.timestamp.valueOf();
            const bNumber = b.timestamp.valueOf();
            if (aNumber === bNumber) {
              if (a.logId !== null && a.message != null) {
                if (b.logId !== null && b.message != null) {
                  if (b.message.indexOf('[START') > -1) {
                    return 1;
                  }
                  if (b.message.indexOf('[END') > -1) {
                    return -1;
                  }
                  if (a.message.indexOf('[START') > -1) {
                    return -1;
                  }
                  if (a.message.indexOf('[END') > -1) {
                    return 1;
                  }
                }
                if (b.traceId !== null) {
                  return -1;
                }
              }
            }
            if (a.timestamp < b.timestamp) {
              return -1;
            }
            return 1;
          });

          for (let n = 0; n < appItem.items.length; n++) {
            const nodeItem = appItem.items[n];
            if (n > 0) {
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
              console.log(nodeItem.diffTime);

              const prevItem = appItem.items[n - 1];
              if (prevItem.message && prevItem.message.indexOf('[END') > -1) {
                nodeItem.prevIsEnd = true;
              }
            }
            if (n + 1 < appItem.items.length) {
              const nextItem = appItem.items[n + 1];
              if (nextItem.message && nextItem.message.indexOf('[START') > -1) {
                nodeItem.nextIsStart = true;
              }
            }
          }
        }
      }
      this.groupResults = groupArray;
      console.log(groupArray);

    });
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
          'Ctrl-F': 'findPersistent'
        });
        editor.setValue(this.traceObject);
        // editor.setSize('100%', '700px');
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
          'Ctrl-F': 'findPersistent'
        });
        editor.setValue(this.traceObject);
        // editor.setSize('100%', '700px');
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
}
interface TagItem {
  key: string;
  value: string;
}
