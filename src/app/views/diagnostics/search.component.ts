import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
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
  templateUrl: 'search.component.html'
})

export class SearchComponent implements OnInit {
  private _queryParams: Params;
  public searchValue: string;
  public bProcessing = false;
  public searchView: string = 'ByApp';
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

  goToGroup(groupName: string) {
    this.searchValue = groupName;
    this.doSearch();
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
      if (data == null || data.data == null || data.data.length === 0) {
        this.bHasResults = false;
        return;
      }
      this.bHasResults = true;
      this.searchResults = data;
      console.log(this.searchResults);

      const groupArray = Array<NodeGroup>();
      if (this.searchResults !== null) {

        if (this.searchResults.data !== null) {
          for (let i = 0; i < this.searchResults.data.length; i++) {
            const dataItem = this.searchResults.data[i];

            let groupItem = groupArray.find(item => item.groupName === dataItem.group);
            if (groupItem === undefined) {
              groupItem = {
                groupName: dataItem.group,
                items: [],
                metadata: [],
                tracesCount: 0,
                logsCount: 0,
                start: null,
                end: null
              };
              // Buscar los metadatas del grupo.
              if (groupItem.groupName) {
                this._queryService.apiQueryGetGroupMetadata(environment.name, groupItem.groupName).subscribe(metadata => {
                  if (metadata) {
                    groupItem.metadata = metadata.filter(mitem => mitem.value !== null && mitem.value !== '');
                  }
                });
              }
              groupArray.push(groupItem);
            }

            let appItem = groupItem.items.find(item => item.appName === dataItem.application);
            if (appItem === undefined) {
              appItem = {
                appName: dataItem.application,
                hidden: true,
                hasError: false,
                hasWarning: false,
                items: []
              };
              groupItem.items.push(appItem);
            }
            if (dataItem.tags === null || dataItem.tags === undefined) {
              dataItem.tags = '';
            }
            if (dataItem.traceId === undefined) {
              dataItem.traceId = null;
            }
            if (dataItem.name === undefined) {
              dataItem.name = null;
            }
            if (dataItem.type === undefined) {
              dataItem.type = null;
            }
            if (dataItem.formats === undefined) {
              dataItem.formats = null;
            }
            const itemTags = dataItem.tags.split(', ');
            const tags = [] as TagItem[];
            for (let it = 0; it < itemTags.length; it++) {
              const itemTagItem = itemTags[it].split(': ');
              tags.push({ key: itemTagItem[0], value: itemTagItem[1] });
            }

            const nodeItem: NodeItem = {
              assembly: dataItem.assembly,
              code: dataItem.code,
              exception: dataItem.exception,
              id: dataItem.id,
              application: dataItem.application,
              instanceId: dataItem.instanceId,
              level: dataItem.level,
              logId: dataItem.logId,
              machine: dataItem.machine,
              message: dataItem.message,
              timestamp: new Date(dataItem.timestamp),
              type: dataItem.type,
              tags : dataItem.tags,
              tagsArray: tags,
              name: dataItem.name,
              traceId: dataItem.traceId,
              nextIsStart: false,
              prevIsEnd: false,
              hasXml: ((dataItem.formats !== null && dataItem.formats.indexOf('XML') > -1) || dataItem.formats === null),
              hasJson: ((dataItem.formats !== null && dataItem.formats.indexOf('JSON') > -1) || dataItem.formats === null),
              hasTxt: (dataItem.formats !== null && dataItem.formats.indexOf('TXT') > -1)
            };
            if (nodeItem.tags.indexOf('Status: Error') > -1) {
              appItem.hasError = true;
            }
            if (nodeItem.level === NodeLogItem.LevelEnum.Error) {
              appItem.hasError = true;
              // appItem.hidden = false;
            }
            if (nodeItem.level === NodeLogItem.LevelEnum.Warning) {
              appItem.hasWarning = true;
              // appItem.hidden = false;
            }
            appItem.items.push(nodeItem);
            if (nodeItem.traceId)
              groupItem.tracesCount += 1;
            if (nodeItem.logId)
              groupItem.logsCount += 1;
            if (groupItem.start == null || groupItem.start > nodeItem.timestamp)
              groupItem.start = nodeItem.timestamp;
            if (groupItem.end == null || groupItem.end < nodeItem.timestamp)
              groupItem.end = nodeItem.timestamp;
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
                  if (a.message.indexOf('[END') > -1) {
                    return 1;
                  }
                  if (a.message.indexOf('[START') > -1) {
                    return 1;
                  }
                  return -1;
                }
              }
              if (b.logId !== null && b.message != null) {
                if (a.traceId !== null) {
                  if (b.message.indexOf('[END') > -1) {
                    return -1;
                  }
                  if (b.message.indexOf('[START') > -1) {
                    return -1;
                  }
                  return 1;
                }
              }
            }
            if (a.timestamp < b.timestamp) {
              return -1;
            }
            return 1;
          });

          const startIndex = [];
          for (let n = 0; n < appItem.items.length; n++) {
            const nodeItem = appItem.items[n];
            const isStart = nodeItem.message && nodeItem.message.indexOf('[START') > -1;
            const isEnd = nodeItem.message && nodeItem.message.indexOf('[END') > -1;
            if (isStart) {
              startIndex.push(n);
            }
            const started = startIndex.length > 0;
            const startedIndex = started ? startIndex[startIndex.length - 1] : -1;
            if (n > 0) {
              if (started && startedIndex !== n) {
                const oldNodeItem = appItem.items[startedIndex];
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
                // console.log(nodeItem.diffTime);
              }

              const prevItem = appItem.items[n - 1];
              if (prevItem) {
                const prevDuration = moment(nodeItem.timestamp).diff(prevItem.timestamp);
                if (prevDuration > 5000 && !started) {
                  nodeItem.prevIsEnd = true;
                }
              }
            }
            if (isEnd) {
              startIndex.pop();
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

  showData(rowItem: NodeItem) {
    if (rowItem.hasJson) {
      this.showJsonData(rowItem.id, rowItem.name);
    } else if (rowItem.hasXml) {
      this.showXmlData(rowItem.id, rowItem.name);
    } else if (rowItem.hasTxt) {
      this.showTxtData(rowItem.id, rowItem.name);
    }
  }

  showXmlData(id: string, name: string) {
    this.traceName = name;
    this._queryService.apiQueryByEnvironmentTracesXmlByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceModal.show();
        this.traceObject = x;
        this._codeMirror.instance$.subscribe(editor => {
          editor.setOption('mode', 'application/xml');
          if (this.traceObject.startsWith('{') || this.traceObject.startsWith('[')) {
            editor.setOption('mode', 'application/json');
            this.traceObject = JSON.stringify(JSON.parse(this.traceObject), null, 2);
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
          editor.getDoc().setCursor({ line: 0, ch: 0});
          editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
          editor.scrollTo(0, 0);
          setTimeout(() => editor.refresh(), 200);
        });
      }
    });
  }
  showJsonData(id: string, name: string) {
    this.traceName = name;
    this._queryService.apiQueryByEnvironmentTracesJsonByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceModal.show();
        this.traceObject = x;
        this._codeMirror.instance$.subscribe(editor => {
          editor.setOption('mode', 'application/json');
          if (this.traceObject.startsWith('<?xml')) {
            editor.setOption('mode', 'application/xml');
          } else {
            this.traceObject = JSON.stringify(JSON.parse(this.traceObject), null, 2);
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
          editor.getDoc().setCursor({ line: 0, ch: 0});
          editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
          editor.scrollTo(0, 0);
          setTimeout(() => editor.refresh(), 200);
        });
      }
    });
  }
  showTxtData(id: string, name: string) {
    this.traceName = name;
    this._queryService.apiQueryByEnvironmentTracesTxtByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceModal.show();
        this.traceObject = x;
        this._codeMirror.instance$.subscribe(editor => {
          editor.setOption('mode', 'text/plain');
          if (this.traceObject.startsWith('<?xml')) {
            editor.setOption('mode', 'application/xml');
            console.log("Xml detected.");
          }
          if (this.traceObject.startsWith('{') || this.traceObject.startsWith('[')) {
            editor.setOption('mode', 'application/json');
            this.traceObject = JSON.stringify(JSON.parse(this.traceObject), null, 2);
            console.log("Json detected.");
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
          editor.getDoc().setCursor({ line: 0, ch: 0});
          editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
          editor.scrollTo(0, 0);
          setTimeout(() => editor.refresh(), 200);
        });
      }
    });
  }


  downloadXmlData(id: string, name: string) {
    this._queryService.apiQueryByEnvironmentTracesXmlByIdGet(environment.name, id).subscribe(data => {
      if (data) {
        this.downloadFile(data, name + '.xml', 'application/xml');
      }
    });
  }
  downloadJsonData(id: string, name: string) {
    this._queryService.apiQueryByEnvironmentTracesJsonByIdGet(environment.name, id).subscribe(data => {
      if (data) {
        this.downloadFile(data, name + '.json', 'application/json');
      }
    });
  }
  downloadTxtData(id: string, name: string) {
    this._queryService.apiQueryByEnvironmentTracesTxtByIdGet(environment.name, id).subscribe(data => {
      if (data) {
        this.downloadFile(data, name + '.txt');
      }
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

  //Download methods
  public downloadFile(data, fileName, type="text/plain") {
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);

    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
      new Blob([data], { type })
    );

    // Use download attribute to set set desired file name
    a.setAttribute("download", fileName);

    // Trigger the download by simulating click
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
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
