import {NgModule} from '@angular/core';
import {ViewerComponent} from './viewer/viewer.component';
import {RouterModule} from '@angular/router';
import {TodoComponent} from './todo.component';

const appRoutes = [
  { path: 'viewer', component: ViewerComponent},
  { path: 'todo', component: TodoComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRouterModule {
  //
}
