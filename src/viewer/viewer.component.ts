import {Component, OnInit} from '@angular/core';
import { ParamMap, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html'
})
export class ViewerComponent implements OnInit {
  imageIds = [];
  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.imageIds = [this.route.paramMap.destination._value.id];
    // initialize openseadragon
    // initialize our wrapper on top of it
    // call show image
  }
}
