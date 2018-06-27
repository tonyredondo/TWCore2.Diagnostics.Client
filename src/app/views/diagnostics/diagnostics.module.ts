// Angular
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

// Ngx-bootstrap
import { TabsModule } from 'ngx-bootstrap/tabs';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CodemirrorModule } from '@nomadreservations/ngx-codemirror';

// Components Routing
import { DiagnosticsRoutingModule } from './diagnostics-routing.module';

// Modal Component
import { ModalModule } from 'ngx-bootstrap/modal';

// Charts
import { ChartsModule } from 'ng2-charts/ng2-charts';

// Components
import { LogsComponent } from './logs.component';
import { TracesComponent } from './traces.component';
import { TraceDetailsComponent } from './tracedetails.component';
import { StatusComponent } from './status.component';
import { SearchComponent } from './search.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DiagnosticsRoutingModule,
    BsDropdownModule.forRoot(),
    TabsModule,
    CarouselModule.forRoot(),
    CollapseModule.forRoot(),
    PaginationModule.forRoot(),
    PopoverModule.forRoot(),
    ProgressbarModule.forRoot(),
    TooltipModule.forRoot(),
    BsDatepickerModule.forRoot(),
    ModalModule.forRoot(),
    ChartsModule,
    AlertModule.forRoot(),
    CodemirrorModule
  ],
  declarations: [
    LogsComponent,
    TracesComponent,
    TraceDetailsComponent,
    StatusComponent,
    SearchComponent
  ]
})
export class DiagnosticsModule { }
