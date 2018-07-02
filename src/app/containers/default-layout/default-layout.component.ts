import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { navItems } from './../../_nav';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html'
})

export class DefaultLayoutComponent implements OnInit {
  private _queryParams: Params;
  public navItems = navItems;
  public sidebarMinimized = true;
  private changes: MutationObserver;
  public element: HTMLElement = document.body;
  public currentEnvironment: string;
  public environments: string[];
  constructor(private _queryService: QueryService, private _activatedRoute: ActivatedRoute, private _router: Router) {

    this.changes = new MutationObserver((mutations) => {
      this.sidebarMinimized = document.body.classList.contains('sidebar-minimized');
    });

    this.changes.observe(<Element>this.element, {
      attributes: true
    });
  }
  ngOnInit() {
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    this.currentEnvironment = environment.name;
    if (this._queryParams.env !== undefined) {
      this.changeEnvironment(this._queryParams.env);
    } else {
      this.updateParams();
    }
    this._queryService.apiQueryGet().subscribe(envs => {
      this.environments = envs;
      if (envs === undefined || envs === null) {
        return;
      }
      if (envs.indexOf(this.currentEnvironment) === -1 && envs.length > 0) {
        this.changeEnvironmentAndReload(envs[0]);
      }
    });
    console.log(this._activatedRoute);
  }
  changeEnvironment(name: string) {
    if (environment.name === name) {
      return;
    }
    this.currentEnvironment = name;
    environment.name = name;
    this.updateParams();
  }
  changeEnvironmentAndReload(name: string) {
    this.changeEnvironment(name);
    this._router.navigate([''], { relativeTo: this._activatedRoute, queryParams: this._queryParams });
  }

  // Private Methods
  private updateParams() {
    this._queryParams.env = this.currentEnvironment;
    this._router.navigate([], { relativeTo: this._activatedRoute, queryParams: this._queryParams });
  }
}
