/**
 * This service takes in imageID as input and settings
 * */
import * as OpenSeadragon from 'node_modules/openseadragon';
import * as getOSDViewer from 'src/app/viewer/webviewer-wrapper';
import { AppConstants } from '../app.constants';

export class DisplayService {
  myviewer;
  osd;

  initiateViewer() {
    this.myviewer = getOSDViewer(OpenSeadragon.Viewer);
  }

  showSlide(viewerSettings) {
    if (this.osd) {
      this.osd.destroy();
      this.osd = null;
    }
    const self = this;

    // clear previous info if existed
    const schemaURIs = AppConstants.getImageUrl(),
    canvasId = viewerSettings.id,
    getOsdCallback = function(osdObj) {
      self.osd = osdObj;
      // alert('get osd callback');
    }, annotationHandlers = {},
      imageChangeHandler = {},
      showFullPageControl = false,
      imageName = viewerSettings.slides[0];
    this.myviewer(schemaURIs, canvasId, getOsdCallback,
      annotationHandlers, imageChangeHandler, showFullPageControl,
      imageName, OpenSeadragon);
  }
}
