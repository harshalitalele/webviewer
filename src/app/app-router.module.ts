import {NgModule} from '@angular/core';
import { RouterModule } from '@angular/router';
import {ViewerComponent} from '../viewer/viewer.component';
import {StudyComponent} from '../study/study.component';

const appRoutes = [{
  path: 'viewer/:id',
  component: ViewerComponent
}, {
  path: 'study',
  component: StudyComponent
}];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [ RouterModule ]
})
export class AppRouterModule {
  //
}
