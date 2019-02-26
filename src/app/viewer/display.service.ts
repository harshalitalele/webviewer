/**
 * This service takes in imageID as input and settings
 * */
import * as OpenSeadragon from 'node_modules/openseadragon';
import * as getOSDViewer from 'src/app/viewer/webviewer-wrapper';
import { AppConstants } from '../app.constants';
import {Injectable} from '@angular/core';
import {AnnotationsService} from './annotations.service';
import {MarkingsService} from './markings.service';

@Injectable()
export class DisplayService {
  myviewer;
  osd;

  constructor(private annService: AnnotationsService,
              private markingService: MarkingsService) {}

  initiateViewer() {
    this.myviewer = getOSDViewer(OpenSeadragon.Viewer);
  }

  getOsdCB() {
    // initiate basic osd things
    // show Annotations Kit
        // annotation service pass osd and basic handlers
    this.annService.initialize();
    // show Marking Tools
    this.markingService.initialize();
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
      self.getOsdCB();
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
