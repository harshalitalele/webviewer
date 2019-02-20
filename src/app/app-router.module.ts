import {NgModule} from '@angular/core';
import {ViewerComponent} from './viewer/viewer.component';
import {RouterModule} from '@angular/router';

const appRoutes = [
  { path: 'viewer', component: ViewerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRouterModule {
  //
}
