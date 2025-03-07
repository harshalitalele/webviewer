import {Component, Input, OnInit} from '@angular/core';
import {OsdService} from '../shared/osd.service';
import {AnnotationsService} from '../shared/annotations.service';

interface FsDocument extends HTMLDocument {
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  msExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  fullscreenElement?: boolean;
  webkitFullscreenElement?: boolean;
  webkitExitFullscreen?: () => void;
}

export function isFullScreen(): boolean {
  const fsDoc = <FsDocument> document;

  return !!(fsDoc.fullscreenElement || fsDoc.mozFullScreenElement || fsDoc.webkitFullscreenElement || fsDoc.msFullscreenElement);
}

interface FsDocumentElement extends HTMLElement {
  msRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
  webkitRequestFullscreen?: () => void;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html'
})
export class ToolbarComponent implements OnInit {
  isFullScreen = false;
  @Input() fsElemId;
  osdInstance;
  toolbarSettings = {
    annotations: true
  };

  constructor(private osdService: OsdService,
              private annService: AnnotationsService) {}

  ngOnInit(): void {
    const self = this;
    this.osdService.currentOsd.subscribe(() => {
      this.osdInstance = this.osdService.getOsd();
      this.annService.activateAnnoBoard();
    });
  }

  drawAnnotation(type) {
    this.annService.drawAnnotation(type);
  }

  toggleFullScreen() {
    const elem = <FsDocumentElement> document.getElementById(this.fsElemId);
    if (!this.isFullScreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
    } else {
      const doc = <FsDocument> document;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
    this.isFullScreen = !this.isFullScreen;

  }

  goHome() {
    if (this.osdInstance.viewport) {
      this.osdInstance.viewport.goHome();
    }
  }

}
