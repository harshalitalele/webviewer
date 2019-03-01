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
    // initialize openseadragon
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
        /*self.osd = osdObj;
        self.getOsdCB();*/
        alert('get osd callback');
      }, annotationHandlers = {},
      imageChangeHandler = {},
      showFullPageControl = false,
      imageName = this.ids[1];
    this.myViewer(schemaURIs, canvasId, getOsdCallback,
      annotationHandlers, imageChangeHandler, showFullPageControl,
      imageName, OpenSeadragon);
    // initialize our wrapper on top of it
    alert(this.ids);
  }

  showImage() {
    // call show image
  }

}
