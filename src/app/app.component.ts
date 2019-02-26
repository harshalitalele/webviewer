import { Component } from '@angular/core';
import { DisplayService} from './viewer/display.service';
import {AnnotationsService} from './viewer/webviewer-wrapper/annotations.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ DisplayService, AnnotationsService ]
})
export class AppComponent {

  constructor(private dispService: DisplayService) {}

  title = 'viewer';
}
