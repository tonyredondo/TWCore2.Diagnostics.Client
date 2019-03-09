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
import { NodeCountersQueryItem } from '../../services/api/model/nodeCountersQueryItem';
import { NodeCountersQueryValue } from '../../services/api/model/nodeCountersQueryValue';
defineLocale('en-gb', enGbLocale);

@Component({
  templateUrl: 'status.component.html'
})
export class StatusComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  public noData?: boolean;
  public counters: Array<AppCounters>;
  public rawCounters: { [ key: string ] : CounterItem };
  public selectedCounters: Array<string> = [];
  public shownCounters: Array<CounterItem> = []

  // barChart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartType = 'bar';
  public barChartLegend = false;

  public barChartLabels: string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartData: any[] = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];

  constructor(private _queryService: QueryService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router) {}

  ngOnInit() {
    this._params = Object.assign({}, this._activatedRoute.snapshot.params);
    this._queryParams = Object.assign({}, this._activatedRoute.snapshot.queryParams);
    this.updateParams();
    this.getData();
  }

  getData() {
    if (!environment.name) {
      return;
    }
    console.log(environment.name);
    this.noData = null;
    this.counters = null;
    this._queryService.getCounters(environment.name).subscribe(data => {
      if (data && data.length > 0) {
        this.noData = false;
        this.counters = this.createCountersTree(data);
        this.rawCounters = {};
        for(let i = 0; i < data.length; i++) {
          const item = Object.assign(data[i], { selected : false, lastData: [], barChartLabels: [], barChartData:[] }) as CounterItem;
          for(let j = 0; j < this.selectedCounters.length; j++) {
            if (this.selectedCounters[i] === item.countersId) {
              item.selected = true;
            }
          }
          this.rawCounters[data[i].countersId] = item;
        }
      }
      else {
        this.noData = true;
      }
      console.log(this.counters);
      console.log(this.rawCounters);
    });
  }

  refreshGraphs() {
    const yesterdayTime = new Date().getTime() - (24*60*60*1000);
    const fromTime = new Date();
    fromTime.setTime(yesterdayTime);
    console.log(fromTime);
    this.shownCounters = []
    for(let i = 0; i < this.selectedCounters.length; i++) {
      const item = this.rawCounters[this.selectedCounters[i]];
      if (item !== undefined) {
        this._queryService.getCounterValues(environment.name, item.countersId, fromTime).subscribe(data => {
          if (data) {
            item.lastData = data;
            item.barChartLabels = [];
            item.barChartData = [ { data: [], label: 'Values' } ];
            for(let j = data.length - 1; j >= 0; j--) {
              const itemData = data[j];
              item.barChartLabels.push(moment(itemData.timestamp).format('HH:mm:ss'));
              item.barChartData[0].data.push(itemData.value);
            }
            this.shownCounters.push(item);
          }
          console.log(item);
        });
      }
    }
  }

  public toggleVisible(item : any) {
    console.log(item);
    item.itemsVisible = !item.itemsVisible;
  }
  public toggleSelect(item: CounterItem) {
    item.selected = !item.selected;
    if (item.selected) {
      this.selectedCounters.push(item.countersId);
    } else {
      const nSelected = new Array<string>();
      for(let i = 0; i < this.selectedCounters.length; i++) {
        if (this.selectedCounters[i] !== item.countersId) {
          nSelected.push(this.selectedCounters[i]);
        }
      }
      this.selectedCounters = nSelected;
    }
    this.refreshGraphs();
  }
  showSideBar = false;
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
  private createCountersTree(data: NodeCountersQueryItem[]) : AppCounters[] {
    const counters = new Array<AppCounters>();

    for(let i = 0; i < data.length; i++) {
      const currentItem = data[i];
      let appItem = counters.find(item => item.applicationName == currentItem.application);
      if (appItem === undefined) {
        appItem = {
          applicationName: currentItem.application,
          items: new Array<KindCounters>(),
          itemsVisible: false
        };
        counters.push(appItem);
        counters.sort((a, b) => a.applicationName < b.applicationName ? -1 : 1);
      }

      let kindItem = appItem.items.find(item => item.kindName == currentItem.kind);
      if (kindItem === undefined) {
        kindItem = {
          kindName: currentItem.kind,
          items: new Array<CategoryCounters>(),
          itemsVisible: false
        }
        appItem.items.push(kindItem);
        appItem.items.sort((a, b) => a.kindName < b.kindName ? -1 : 1);
      }

      let categoryItem = kindItem.items.find(item => item.categoryName == currentItem.category);
      if (categoryItem === undefined) {
        categoryItem = {
          categoryName: currentItem.category,
          items: new Array<CounterItem>(),
          itemsVisible: false
        }
        kindItem.items.push(categoryItem);
        kindItem.items.sort((a, b) => a.categoryName < b.categoryName ? -1 : 1);
      }
      categoryItem.items.push(Object.assign(currentItem, { selected : false, lastData: [], barChartLabels: [], barChartData:[] }));
    }

    return counters;
  }

  private updateParams() {
    this._queryParams.env = environment.name;
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
  barChartLabels: string[],
  barChartData: any[]
}
