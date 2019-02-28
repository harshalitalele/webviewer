import {NgModule} from '@angular/core';
import {ViewerComponent} from './viewer.component';
import {ImageContainerComponent} from './image/image-container.component';

@NgModule({
  declarations: [
    ViewerComponent,
    ImageContainerComponent
  ], exports: [
    ViewerComponent
  ]
})
export class ViewerModule {
  //
}
