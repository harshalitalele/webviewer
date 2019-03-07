import { Component, Input, OnInit } from '@angular/core';

import * as OpenSeadragon from 'openseadragon';
import * as wrapper from './webviewer-wrapper';
import {OsdService} from '../../shared/osd.service';

@Component({
  selector: 'app-image-container',
  templateUrl: 'image-container.component.html'
})
export class ImageContainerComponent implements OnInit {
  @Input() ids: string[];
  viewerWrapper;

  constructor(private osdService: OsdService) {}

  ngOnInit(): void {
    // Initializing wrapper methods on OpenSeadragon object
    this.viewerWrapper =  new wrapper(OpenSeadragon);

    const viewerSettings = {
      elementId: 'openseadragon',
      slideIds: this.ids,
      getOSDCallback: function(osd) {
        this.osdService.setOsd(osd);
      },
      annotationHandlers: '',
      imageChangeHandler: ''
    };
    this.viewerWrapper(viewerSettings);
  }

}
