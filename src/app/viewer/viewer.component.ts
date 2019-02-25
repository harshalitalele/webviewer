/**
 * Viewer Component
 * Takes input as single or multiple image IDs and holds template for displaying DZI images
 * Actions:
 * 1. Take image ID/s
 * 2. Get the physical ID/s of the images
 * 3. Pass on ONLY necessary information to the displayService like (image locations, other initial settings)
 * */

import {Component, OnInit} from '@angular/core';
import {DisplayService} from './display.service';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html',
  styleUrls: ['viewer.component.css']
})
export class ViewerComponent implements OnInit {
  imageIds = [];

  constructor(private dispService: DisplayService) {}

  ngOnInit(): void {
    // get schema json
    // get tile URLs method
    // call OpenSeadragon
    // emit viewerCreated event to annotations, markingTool, remote components
    this.dispService.showViewer();
  }

  showViewer() {

  }
}
