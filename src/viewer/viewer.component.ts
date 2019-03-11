import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html'
})
export class ViewerComponent implements OnInit {
  imageIds: string[] = [];
  @Output() osdUpdate = new EventEmitter();

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
    alert('osd updated inside Viewer');
    this.osdUpdate.emit();
  }
}
