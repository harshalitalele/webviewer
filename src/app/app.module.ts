import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {ViewerComponent} from './viewer/viewer.component';
import {AppRouterModule} from './app-router.module';
import {TodoComponent} from './todo.component';

@NgModule({
  declarations: [
    AppComponent,
    ViewerComponent,
    TodoComponent
  ],
  imports: [
    BrowserModule,
    AppRouterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
