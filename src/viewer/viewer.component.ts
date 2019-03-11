import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Subject} from 'rxjs';
import {AnnotationsService} from './shared/annotations.service';
import {OsdService} from './shared/osd.service';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html',
  providers: [ AnnotationsService, OsdService ]
})
export class ViewerComponent implements OnInit {
  imageIds: string[] = [];

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.imageIds = params['id'].split(',');
      // reload app-image-container
    });
  }
}
