import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem, NodeStatusItemValue, GroupData } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
import { KeyValue } from '../../services/api/model/keyValue';
import * as vkbeautify from 'vkbeautify';
defineLocale('en-gb', enGbLocale);

@Component({
  selector:    'view-group',
  templateUrl: 'viewgroup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewGroupComponent implements OnInit {
  private _group: string;
  public groupData: GroupDataExt = null;
  public searchView: string = 'ByApp';
  public bProcessing: boolean = true;

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

  get group() : string {
    return this._group;
  }
  @Input()
  set group(value: string) {
    this._group = value;
    this.loadData();
  }
  editorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    readOnly: true,
    contextmenu: true,
    fontSize: 11,
    glyphMargin: false,
    quickSuggestions: false,
    language: 'javascript'
  };
  code: string= '';

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private localeService: BsLocaleService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.traceModal.onHide.subscribe(i => {
      this.code = '';
      //this.cdr.detectChanges();
    });
  }

  async loadData() {
    this.bProcessing = true;
    this.cdr.detectChanges();
    var gData = await this._queryService.apiQueryByEnvironmentGroupLoadGet(environment.name, this._group).toPromise() as any as GroupDataExt;
    gData = gData || {
      environment: environment.name,
      group: this._group,
      metadata: [],
      data: [],
      groupedData: [],
      logsCount: 0,
      tracesCount: 0,
      start: null,
      end: null
    };
    gData.groupedData = gData.groupedData || [];
    gData.metadata = gData.metadata || [];
    gData.data = gData.data || [];
    gData.logsCount = 0;
    gData.tracesCount = 0;
    gData.start = null;
    gData.end = null;

    for (let i = 0; i < gData.data.length; i++) {
      const dataItem = gData.data[i];

      let appItem = gData.groupedData.find(item => item.appName === dataItem.application);
      if (appItem === undefined) {
        appItem = {
          appName: dataItem.application,
          hidden: true,
          hasError: false,
          hasWarning: false,
          items: []
        };
        gData.groupedData.push(appItem);
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
        gData.tracesCount += 1;
      if (nodeItem.logId)
        gData.logsCount += 1;
      if (gData.start == null || gData.start > nodeItem.timestamp)
        gData.start = nodeItem.timestamp;
      if (gData.end == null || gData.end < nodeItem.timestamp)
        gData.end = nodeItem.timestamp;
    }

    for (let j = 0; j < gData.groupedData.length; j++) {
      const appItem = gData.groupedData[j];
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

    console.log("Extended data", gData);
    this.groupData = gData;
    this.bProcessing = false;
    this.cdr.detectChanges();
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

  showDataTime(rowItem: any) {
    if (rowItem.formats !== null && rowItem.formats.indexOf('JSON') > -1) {
      this.showJsonData(rowItem.id, rowItem.name);
    } else if (rowItem.formats !== null && rowItem.formats.indexOf('XML') > -1) {
      this.showXmlData(rowItem.id, rowItem.name);
    } else if (rowItem.formats !== null && rowItem.formats.indexOf('TXT') > -1) {
      this.showTxtData(rowItem.id, rowItem.name);
    }
  }

  showXmlData(id: string, name: string) {
    this.traceName = name;
    this.code = '.: Loading Trace :.';
    this.traceModal.show();
    this.cdr.detectChanges();

    this._queryService.apiQueryByEnvironmentTracesXmlByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceObject = x;
        this.editorOptions = Object.assign({ }, this.editorOptions);
        this.editorOptions.language = 'xml';
        console.log(this.editorOptions);

        if (this.traceObject.startsWith('<?xml')) {
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.xml(this.traceObject);
          }
        } else if (this.traceObject.startsWith('{') || this.traceObject.startsWith('[')) {
          this.editorOptions.language = 'json';
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.json(this.traceObject);
          }
        }

        this.code = this.traceObject;
        this.cdr.detectChanges();
      }
    });
  }
  showJsonData(id: string, name: string) {
    this.traceName = name;
    this.code = '.: Loading Trace :.';
    this.traceModal.show();
    this.cdr.detectChanges();

    this._queryService.apiQueryByEnvironmentTracesJsonByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceObject = x;
        this.editorOptions = Object.assign({ }, this.editorOptions);
        this.editorOptions.language = 'json';

        if (this.traceObject.startsWith('<?xml')) {
          this.editorOptions.language = 'xml';
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.xml(this.traceObject);
          }
        } else {
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.json(this.traceObject);
          }
        }

        this.code = this.traceObject;
        this.cdr.detectChanges();
      }
    });
  }
  showTxtData(id: string, name: string) {
    this.traceName = name;
    this.code = '.: Loading Trace :.';
    this.traceModal.show();
    this.cdr.detectChanges();

    this._queryService.apiQueryByEnvironmentTracesTxtByIdGet(environment.name, id).subscribe(x => {
      if (x) {
        this.traceObject = x;
        this.editorOptions = Object.assign({ }, this.editorOptions);
        this.editorOptions.language = 'txt';

        if (this.traceObject.startsWith('<?xml')) {
          this.editorOptions.language = 'xml';
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.xml(this.traceObject);
          }
          console.log("Xml detected.");
        }
        if (this.traceObject.startsWith('{') || this.traceObject.startsWith('[')) {
          this.editorOptions.language = 'json';
          if (this.lineLessThan(this.traceObject, 5)) {
            this.traceObject = vkbeautify.json(this.traceObject);
          }
          console.log("Json detected.");
        }

        this.code = this.traceObject;
        this.cdr.detectChanges();
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

  lineLessThan(value: string, lines: number): boolean {
    if (value === undefined) {
      return true;
    }
    if (value === null) {
      return true;
    }
    var idx = 0;
    while (lines > 0 && idx < value.length - 1) {
      idx = value.indexOf('\n', idx + 1);
      if (idx < 1)
        break;
      lines--;
    }
    return lines > 0;
  }
}

/*********************************/

interface GroupDataExt extends GroupData
{
  groupedData: NodeApp[];
  logsCount: number;
  tracesCount: number;
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
