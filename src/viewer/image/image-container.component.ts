import {Component, Input, OnInit} from '@angular/core';

import * as OpenSeadragon from 'openseadragon';
import * as getOSDViewer from 'webviewer-wrapper';

@Component({
  selector: 'app-image-container',
  templateUrl: 'image-container.component.html'
})
export class ImageContainerComponent implements OnInit {
  @Input() ids: string[];

  ngOnInit(): void {
    // getOSDViewer(OpenSeadragon.Viewer);
    // initialize openseadragon
    OpenSeadragon({
      id:            'openseadragon',
      tileSources:   [
        'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi'
      ],
      showNavigator: true,
      navigatorAutoFade: false,
      showNavigationControl: false
    });
    // initialize our wrapper on top of it
    alert(this.ids);
  }

  showImage() {
    // call show image
  }

}
