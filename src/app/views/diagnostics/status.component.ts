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
defineLocale('en-gb', enGbLocale);

@Component({
  templateUrl: 'status.component.html'
})
export class StatusComponent implements OnInit {
  private _params: Params;
  private _queryParams: Params;
  public noData?: boolean;
  public counters: Array<AppCounters>;

  // barChart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartLabels: string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType = 'bar';
  public barChartLegend = false;

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
      }
      else {
        this.noData = true;
      }
      console.log(data);
      console.log(this.noData);
      console.log(this.counters);
    });
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
          items: new Array<KindCounters>()
        };
        counters.push(appItem);
        counters.sort((a, b) => a.applicationName < b.applicationName ? -1 : 1);
      }

      let kindItem = appItem.items.find(item => item.kindName == currentItem.kind);
      if (kindItem === undefined) {
        kindItem = {
          kindName: currentItem.kind,
          items: new Array<CategoryCounters>()
        }
        appItem.items.push(kindItem);
        appItem.items.sort((a, b) => a.kindName < b.kindName ? -1 : 1);
      }

      let categoryItem = kindItem.items.find(item => item.categoryName == currentItem.category);
      if (categoryItem === undefined) {
        categoryItem = {
          categoryName: currentItem.category,
          items: new Array<NodeCountersQueryItem>()
        }
        kindItem.items.push(categoryItem);
        kindItem.items.sort((a, b) => a.categoryName < b.categoryName ? -1 : 1);
      }

      categoryItem.items.push(currentItem);
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
}
class KindCounters {
  kindName: string;
  items: Array<CategoryCounters>;
}
class CategoryCounters {
  categoryName: string;
  items: Array<NodeCountersQueryItem>;
}
