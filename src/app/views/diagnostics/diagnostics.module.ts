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

// Components Routing
import { DiagnosticsRoutingModule } from './diagnostics-routing.module';

// Components
import { LogsComponent } from './logs.component';
import { TracesComponent } from './traces.component';
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
    BsDatepickerModule.forRoot()
  ],
  declarations: [
    LogsComponent,
    TracesComponent,
    StatusComponent,
    SearchComponent
  ]
})
export class DiagnosticsModule { }
