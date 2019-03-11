import {Component, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {OsdService} from './shared/osd.service';
import {AnnotationsService} from './shared/annotations.service';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html',
  providers: [ OsdService, AnnotationsService ]
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
