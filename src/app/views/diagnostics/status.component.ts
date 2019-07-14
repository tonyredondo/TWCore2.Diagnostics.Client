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
  public bProcessing = false;
  public counters: Array<AppCounters>;
  public rawCounters: { [ key: string ]: CounterItem };
  public selectedCounters: Array<string> = [];
  public shownCounters: Array<CounterItem> = [];
  timerValue: any;
  showSideBar = false;

  // barChart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true,
    animation: false
  };
  public barChartType = 'line';
  public barChartLegend = false;

  // public barChartLabels: string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  // public barChartData: any[] = [
  //   {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
  //   {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  // ];

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
    this.bProcessing = true;
    if (!environment.name) {
      this.bProcessing = false;
      this.noData = true;
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
        for (let i = 0; i < data.length; i++) {
          const item = Object.assign(data[i], { selected : false, lastData: [], barChartLabels: [], barChartData: [] }) as CounterItem;
          for (let j = 0; j < this.selectedCounters.length; j++) {
            if (this.selectedCounters[i] === item.countersId) {
              item.selected = true;
            }
          }
          this.rawCounters[data[i].countersId] = item;
        }
      } else {
        this.noData = true;
      }
      this.bProcessing = false;
      console.log(this.counters);
      console.log(this.rawCounters);
    });
  }

  refreshGraphs() {
    if (this.timerValue) {
      clearTimeout(this.timerValue);
    }
    const yesterdayTime = new Date().getTime() - (24 * 60 * 60 * 1000);
    const fromTime = new Date();
    fromTime.setTime(yesterdayTime);
    // console.log(fromTime);
    for (let i = 0; i < this.selectedCounters.length; i++) {
      const item = this.rawCounters[this.selectedCounters[i]];
      if (item !== undefined) {
        let lastTime = null;
        if (item.lastData !== null && item.lastData !== undefined && item.lastData.length > 0) {
          lastTime = item.lastData[item.lastData.length - 1].timestamp;
        }
        this._queryService.getLastCounterValues(item.countersId, 'Week', environment.name, null, lastTime).subscribe(data => {
          if (data) {
            if (item.lastData !== null && item.lastData !== undefined && item.lastData.length > 0) {
              // console.log(data);
              item.lastData = item.lastData.slice(data.length - 1, item.lastData.length - data.length);
              item.barChartLabels = item.barChartLabels.slice(data.length - 1, item.barChartLabels.length - data.length);
              item.barChartData[0].data = item.barChartData[0].data.slice(data.length - 1, item.barChartData[0].data.length - data.length);
              data.forEach(element => item.lastData.push(element));
              for (let j = 0; j < data.length; j++) {
                const itemData = data[j];
                item.barChartLabels.push(moment(itemData.timestamp).format('MM-DD (HH:mm)'));
                item.barChartData[0].data.push(itemData.value);
              }
            } else {
              item.lastData = data;
              item.barChartLabels = [];
              item.barChartData = [ { data: [], label: 'Values' } ];
              for (let j = 0; j < data.length; j++) {
                const itemData = data[j];
                item.barChartLabels.push(moment(itemData.timestamp).format('MM-DD (HH:mm)'));
                item.barChartData[0].data.push(itemData.value);
              }
            }

            if (this.shownCounters.findIndex(citem => citem.countersId === item.countersId) > -1) {
              return;
            }
            this.shownCounters.push(item);
            this.shownCounters.sort((a, b) => {
              if (a.application < b.application) {
                return -1;
              } else if (a.application > b.application) {
                return 1;
              } else {
                if (a.kind < b.kind) {
                  return -1;
                } else if (a.kind > b.kind) {
                  return 1;
                } else {
                  if (a.category < b.category) {
                    return -1;
                  } else if (a.category > b.category) {
                    return 1;
                  } else {
                    if (a.name < b.name) {
                      return -1;
                    } else if (a.name > b.name) {
                      return 1;
                    } else {
                      return 0;
                    }
                  }
                }
              }
            });
          }
          console.log(item);
        });
      }
    }

    const self = this;
    this.timerValue = setTimeout(function() {
      console.log('Refreshing');
      self.refreshGraphs();
    }, 10000);
  }

  public toggleVisible(item: any) {
    console.log(item);
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
    this.shownCounters = [];
    this.refreshGraphs();
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
  public chartClicked(event: Event) {
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
