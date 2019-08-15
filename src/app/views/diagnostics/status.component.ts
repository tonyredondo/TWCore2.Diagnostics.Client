import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { QueryService } from '../../services/api/api/query.service';
import { environment } from '../../../environments/environment';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { SearchResults, SerializableException, NodeLogItem, NodeTraceItem, NodeStatusItemValue, DataUnitEnum } from '../../services/api';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
import { KeyValue } from '../../services/api/model/keyValue';
import { NodeCountersQueryItem } from '../../services/api/model/nodeCountersQueryItem';
import { NodeCountersQueryValue } from '../../services/api/model/nodeCountersQueryValue';
defineLocale('en-gb', enGbLocale);

@Component({
  templateUrl: 'status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  public noData?: boolean;
  public bProcessing = false;
  public counters: Array<AppCounters>;
  public selectedCounters: Array<string> = [];
  showSideBar = false;

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);

    if (this._queryParams.env) {
      environment.name = this._queryParams.env;
    }
    let loaded = false;
    if (this._queryParams.cids) {
      var ncids = JSON.parse(this._queryParams.cids);
      if (ncids) {
        this.selectedCounters = ncids;
        var sCounter = JSON.stringify(this.selectedCounters);
        localStorage.setItem("selectedCounters-" + environment.name, sCounter);
        loaded = true;
      }
    }
    if (!loaded) {
      var sCounter = localStorage.getItem("selectedCounters-" + environment.name);
      this.selectedCounters = JSON.parse(sCounter) || [];
    }
    this.updateParams();
    this.getData();
  }

  getData() {
    this.bProcessing = true;
    if (!environment.name) {
      this.bProcessing = false;
      this.noData = true;
      this.cdr.detectChanges();
      return;
    }
    //console.log(environment.name);
    this.noData = null;
    this.counters = null;
    this._queryService.getCounters(environment.name).subscribe(data => {

      if (data && data.length > 0) {
        this.noData = false;
        this.counters = this.createCountersTree(data);

        if (this.selectedCounters.length > 0) {
          for(let ic = 0; ic < this.counters.length; ic++) {
            let appCounters = this.counters[ic];
            for (let kc = 0; kc < appCounters.items.length; kc++) {
              let kindCounters = appCounters.items[kc];
              for (let cc = 0; cc < kindCounters.items.length; cc++) {
                let categoryCounters = kindCounters.items[cc];
                for (let ci = 0; ci < categoryCounters.items.length; ci++) {
                  let counter = categoryCounters.items[ci];
                  for(let sCIdx = 0; sCIdx < this.selectedCounters.length; sCIdx++) {
                    if (counter.countersId === this.selectedCounters[sCIdx])
                      counter.selected = true;
                  }
                }
              }
            }
          }
        }

      } else {
        this.noData = true;
      }
      this.bProcessing = false;
      this.cdr.detectChanges();
    });
  }

  public toggleVisible(item: any) {
    //console.log(item);
    item.itemsVisible = !item.itemsVisible;
  }
  public toggleSelect(item: CounterItem) {
    item.selected = !item.selected;
    if (item.selected) {
      this.selectedCounters.push(item.countersId);
    } else {
      const nSelected = new Array<string>();
      for (let i = 0; i < this.selectedCounters.length; i++) {
        if (this.selectedCounters[i] !== item.countersId) {
          nSelected.push(this.selectedCounters[i]);
        }
      }
      this.selectedCounters = nSelected;
    }
    var sCounter = JSON.stringify(this.selectedCounters);
    localStorage.setItem("selectedCounters-" + environment.name, sCounter);
    this.cdr.detectChanges();
  }
  public toggleSidebar() {
    this.showSideBar = !this.showSideBar;
  }
  public hideSidebar() {
    this.showSideBar = false;
  }
  public showSidebar() {
    this.showSideBar = true;
  }

  // Private Methods
  private createCountersTree(data: NodeCountersQueryItem[]): AppCounters[] {
    const counters = new Array<AppCounters>();

    for (let i = 0; i < data.length; i++) {
      const currentItem = data[i];
      let appItem = counters.find(item => item.applicationName === currentItem.application);
      if (appItem === undefined) {
        appItem = {
          applicationName: currentItem.application,
          items: new Array<KindCounters>(),
          itemsVisible: false
        };
        counters.push(appItem);
        counters.sort((a, b) => a.applicationName < b.applicationName ? -1 : 1);
      }

      let kindItem = appItem.items.find(item => item.kindName === currentItem.kind);
      if (kindItem === undefined) {
        kindItem = {
          kindName: currentItem.kind,
          items: new Array<CategoryCounters>(),
          itemsVisible: false
        };
        appItem.items.push(kindItem);
        appItem.items.sort((a, b) => a.kindName < b.kindName ? -1 : 1);
      }

      let categoryItem = kindItem.items.find(item => item.categoryName === currentItem.category);
      if (categoryItem === undefined) {
        categoryItem = {
          categoryName: currentItem.category,
          items: new Array<CounterItem>(),
          itemsVisible: false
        };
        kindItem.items.push(categoryItem);
        kindItem.items.sort((a, b) => a.categoryName < b.categoryName ? -1 : 1);
      }
      categoryItem.items.push(Object.assign(currentItem, { selected : false, lastData: [], barChartLabels: [], barChartData:[] }));
    }

    return counters;
  }

  private updateParams() {
    this._queryParams.env = environment.name;
    this._queryParams.cids = JSON.stringify(this.selectedCounters);
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this._queryParams,
      replaceUrl: true
    });
  }
}

class AppCounters {
  applicationName: string;
  items: Array<KindCounters>;
  itemsVisible = false;
}
class KindCounters {
  kindName: string;
  items: Array<CategoryCounters>;
  itemsVisible = false;
}
class CategoryCounters {
  categoryName: string;
  items: Array<CounterItem>;
  itemsVisible = false;
}
interface CounterItem extends NodeCountersQueryItem {
  selected: boolean;
  lastData: Array<NodeCountersQueryValue>;
  barChartLabels: string[];
  barChartData: any[];
}
