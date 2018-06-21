import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LogsComponent } from './logs.component';
import { TracesComponent } from './traces.component';
import { StatusComponent } from './status.component';
import { SearchComponent } from './search.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Diagnostics'
    },
    children: [
      {
        path: 'search',
        component: SearchComponent,
        data: {
          title: 'Search'
        }
      },{
        path: 'logs',
        component: LogsComponent,
        data: {
          title: 'Logs'
        }
      },
      {
        path: 'traces',
        component: TracesComponent,
        data: {
          title: 'Traces'
        }
      },
      {
        path: 'status',
        component: StatusComponent,
        data: {
          title: 'Status'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiagnosticsRoutingModule {}
