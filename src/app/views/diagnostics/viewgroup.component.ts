import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem, NodeStatusItemValue, GroupData } from '../../services/api';
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

  async loadData() {
    let groupData = await this._queryService.apiQueryByEnvironmentGroupLoadGet(environment.name, this._group).toPromise() as any as GroupDataExt;
    groupData = groupData || {
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
    groupData.groupedData = groupData.groupedData || [];
    groupData.metadata = groupData.metadata || [];
    groupData.data = groupData.data || [];
    groupData.logsCount = 0;
    groupData.tracesCount = 0;
    groupData.start = null;
    groupData.end = null;

    for (let i = 0; i < groupData.data.length; i++) {
      const dataItem = groupData.data[i];

      let appItem = groupData.groupedData.find(item => item.appName === dataItem.application);
      if (appItem === undefined) {
        appItem = {
          appName: dataItem.application,
          hidden: true,
          hasError: false,
          hasWarning: false,
          items: []
        };
        groupData.groupedData.push(appItem);
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


      //Here is missing the: const nodeItem...

    }

  console.log("Extended data", groupData);
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
