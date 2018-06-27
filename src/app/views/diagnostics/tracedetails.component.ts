import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: 'tracedetails.component.html'
})
export class TraceDetailsComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  constructor(private _activatedRoute: ActivatedRoute, private _router: Router) { }

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
  }
}
