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
  viewerSettings = {
    slides: ['jbirh8hc'],
    id: 'openseadragon',
    showAnnotationsKit: false,
    showMarkingTool: false,
    methodHandlers: {}
  };

  constructor(private dispService: DisplayService) {}

  ngOnInit(): void {
    this.dispService.initiateViewer();
  }

  showSlide() {
    this.dispService.showSlide(this.viewerSettings);
  }
}
