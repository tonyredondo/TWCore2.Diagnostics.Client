import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { NodeTraceItem } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  templateUrl: 'tracedetails.component.html'
})
export class TraceDetailsComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  public group: string = null;
  public items: INodeTraceItemExt[] = [];
  public applications: string[] = [];
  // Trace Viewer
  @ViewChild('traceModal')
  public traceModal: ModalDirective;
  public traceObject: string;
  public traceName: string;
  constructor(private _queryService: QueryService, private _activatedRoute: ActivatedRoute, private _router: Router, private _location: Location) { }

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._params.group !== undefined) {
      this.group = this._params.group;
      this.loadData();
    } else {
      this._location.back();
    }
  }
  updateData() {
    this.updateParams();
    this.loadData();
  }
  loadData() {
    this._queryService.apiQueryByEnvironmentTracesByGroupNameGet(environment.name, this.group).subscribe(lstTraces => {
      // Parse Tags and create TagsArray and Group Applications
      this.applications.length = 0;
      this.items.length = 0;
      for (let i = 0; i < lstTraces.length; i++) {
        const item = lstTraces[i];
        const itemTags = item.tags.split(', ');
        const tags = [] as TagItem[];
        for (let it = 0; it < itemTags.length; it++) {
          const itemTagItem = itemTags[it].split(': ');
          tags.push({ key: itemTagItem[0], value: itemTagItem[1] });
        }
        if (this.applications.indexOf(item.application) === -1) {
          this.applications.push(item.application);
        }
        this.items.push(Object.assign(item, {
          tagsArray : tags,
          cssClass : 'trace-application-bgcolor' + this.applications.indexOf(item.application)
        }));
      }
    });
  }
  showXmlData(id: string, name: string) {
    this.traceName = name;
    this.traceModal.show();
    this._queryService.apiQueryByEnvironmentTracesXmlByIdGet(environment.name, id).subscribe(x => {
      this.traceObject = x;

    });
  }
  showJsonData(id: string, name: string) {
    this.traceName = name;
    this.traceModal.show();
    this._queryService.apiQueryByEnvironmentTracesJsonByIdGet(environment.name, id).subscribe(x => {
      this.traceObject = x;

    });
  }
  goBack() {
    this._location.back();
  }

  // Private Methods
  private updateParams() {
    this._queryParams.env = environment.name;
    this._params.group = this.group;
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this._queryParams,
      replaceUrl: true
    });
  }
}

interface INodeTraceItemExt extends NodeTraceItem {
  tagsArray: TagItem[];
  cssClass: string;
}
interface TagItem {
  key: string;
  value: string;
}
