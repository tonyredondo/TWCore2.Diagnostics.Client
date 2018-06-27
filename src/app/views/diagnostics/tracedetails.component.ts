import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { NodeTraceItem } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CodemirrorService } from '@nomadreservations/ngx-codemirror';

@Component({
  templateUrl: 'tracedetails.component.html'
})
export class TraceDetailsComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  public group: string = null;
  public items: INodeTraceItemExt[] = [];
  // Exception Viewer
  @ViewChild('traceModal')
  public traceModal: ModalDirective;
  public traceObject: string;
  public traceName: string;
  constructor(private _queryService: QueryService, private _activatedRoute: ActivatedRoute, private _router: Router, private _codeMirror: CodemirrorService) { }

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._params.group !== undefined) {
      this.group = this._params.group;
      this.updateData();
    }
  }
  updateData() {
    this._queryService.apiQueryByEnvironmentTracesByGroupNameGet(environment.name, this.group).subscribe(lstTraces => {
      this.items.length = 0;
      for (let i = 0; i < lstTraces.length; i++) {
        const item = lstTraces[i];
        const itemTags = item.tags.split(', ');
        const tags = [] as TagItem[];
        for (let it = 0; it < itemTags.length; it++) {
          const itemTagItem = itemTags[it].split(': ');
          tags.push({ key: itemTagItem[0], value: itemTagItem[1] });
        }
        this.items.push(Object.assign(item, { tagsArray : tags }));
      }
    });
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
        editor.setOption('extraKeys', {'Alt-F': 'findPersistent'});
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
        editor.setOption('extraKeys', {'Alt-F': 'findPersistent'});
        editor.setValue(this.traceObject);
        editor.setSize('100%', '700px');
        editor.getDoc().setCursor({ line: 0, ch: 0});
        editor.getDoc().setSelection({ line: 0, ch: 0}, { line: 0, ch: 0 }, { scroll: true });
        editor.scrollTo(0, 0);
        setTimeout(() => editor.refresh(), 200);
      });
    });
  }

}

interface INodeTraceItemExt extends NodeTraceItem {
  tagsArray: TagItem[];
}
interface TagItem {
  key: string;
  value: string;
}
