import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html'
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
