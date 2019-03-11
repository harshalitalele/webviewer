import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html'
})
export class ViewerComponent implements OnInit {
  imageIds: string[] = [];
  private eventsSubject: Subject<void> = new Subject<void>();

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.imageIds = params['id'].split(',');
      // reload app-image-container
    });
  }

  updateOsd() {
    this.eventsSubject.next();
    alert('osd updated inside Viewer');
  }
}
