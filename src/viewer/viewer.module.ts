import {NgModule} from '@angular/core';
import {ViewerComponent} from './viewer.component';
import {ImageContainerComponent} from './image/image-container.component';
import {ToolbarComponent} from './toolbar/toolbar.component';

@NgModule({
  declarations: [
    ViewerComponent,
    ImageContainerComponent,
    ToolbarComponent
  ], exports: [
    ViewerComponent
  ]
})
export class ViewerModule {
  //
}
