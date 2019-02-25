/**
 * This service takes in imageID as input
 * returns
 * */
import * as Openseadragon from 'node_modules/openseadragon';

export class DisplayService {

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
