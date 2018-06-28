import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';


@Component({
  templateUrl: 'search.component.html'
})

export class SearchComponent implements OnInit {
  private _queryParams: Params;
  public searchValue: string;
  public bProcessing: boolean = false;
  public bHasResults?: boolean;
  constructor(private _queryService: QueryService, private _activatedRoute: ActivatedRoute, private _router: Router) {}

  // Public Methods
  ngOnInit() {
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    if (this._queryParams.term !== undefined) {
      this.searchValue = this._queryParams.term;
      this.doSearch();
    }
  }

  doSearch() {
    this.updateParams();
    this.bHasResults = null;
    this.bProcessing = true;

    setTimeout(() => {
      this.bProcessing = false;
      this.bHasResults = false;
    }, 1000);

  }


  // Private Methods
  private updateParams() {
    this._queryParams.term = this.searchValue;
    this._router.navigate([], { relativeTo: this._activatedRoute, queryParams: this._queryParams });
  }
}
