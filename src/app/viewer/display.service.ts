/**
 * This service takes in imageID as input
 * returns
 * */
import * as OpenSeadragon from 'node_modules/openseadragon';
import * as getOSDViewer from 'src/app/viewer/webviewer-wrapper';

export class DisplayService {
  myviewer;

  showViewer() {
    /*OpenSeadragon({
      id:            'openseadragon',
      tileSources:   [
        'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi'
      ],
      showNavigator: true,
      navigatorAutoFade: false,
      showNavigationControl: false
    });*/
    this.myviewer = getOSDViewer(OpenSeadragon.Viewer);
  }

  showSlide() {
    const schemaURIs = 'http://172.28.42.142:8090',
    canvasId = 'openseadragon',
    getOsdCallback = function() {
      alert('get osd callback');
    }, annotationHandlers = {},
      imageChangeHandler = {},
      showFullPageControl = false,
      imageName = 'jbirh8hc';
    this.myviewer(schemaURIs, canvasId, getOsdCallback, annotationHandlers, imageChangeHandler, showFullPageControl, imageName, OpenSeadragon);
  }
}
