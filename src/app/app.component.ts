import { Component } from '@angular/core';
import { DisplayService} from './viewer/display.service';
import {AnnotationsService} from './viewer/annotations.service';
import {MarkingsService} from './viewer/markings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ DisplayService, AnnotationsService, MarkingsService ]
})
export class AppComponent {

  constructor(private dispService: DisplayService) {}

  title = 'viewer';
}
