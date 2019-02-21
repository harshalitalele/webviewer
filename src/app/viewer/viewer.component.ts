import { Component } from '@angular/core';
import * as Openseadragon from 'node_modules/openseadragon';

@Component({
  selector: 'app-viewer',
  templateUrl: 'viewer.component.html',
  styleUrls: ['viewer.component.css']
})
export class ViewerComponent {
  showViewer() {
    Openseadragon({
      id:            'openseadragon',
      tileSources:   [
        'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi'
      ],
      showNavigator: true,
      navigatorAutoFade: false,
      showNavigationControl: false
    });
  }
}
