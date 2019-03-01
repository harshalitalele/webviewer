import {Component, Input, OnInit} from '@angular/core';

import * as OpenSeadragon from 'openseadragon';
import * as getOSDViewer from './webviewer-wrapper';

@Component({
  selector: 'app-image-container',
  templateUrl: 'image-container.component.html'
})
export class ImageContainerComponent implements OnInit {
  @Input() ids: string[];
  myViewer;

  ngOnInit(): void {
    this.myViewer =  getOSDViewer(OpenSeadragon.Viewer);
    /*OpenSeadragon({
      id:            'openseadragon',
      tileSources:   [
        'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi'
      ],
      showNavigator: true,
      navigatorAutoFade: false,
      showNavigationControl: false
    });*/

    const schemaURIs = 'http://172.28.42.142:8090',
      canvasId = 'openseadragon',
      getOsdCallback = function(osdObj) {
        alert('get osd callback');
      }, annotationHandlers = {},
      imageChangeHandler = {},
      showFullPageControl = false,
      imageName = this.ids[this.ids.length - 1];
    this.myViewer(schemaURIs, canvasId, getOsdCallback,
      annotationHandlers, imageChangeHandler, showFullPageControl,
      imageName, OpenSeadragon);
  }

}
