import {Component, Input, OnInit} from '@angular/core';
import {OsdService} from '../../shared/osd.service';

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

  constructor(private osdService: OsdService) {}

  ngOnInit(): void {
    this.osdInstance = this.osdService.getOsd();
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

  updateOsd() {
    alert('changed osd');
  }

  goHome() {
    if (this.osdInstance.viewport) {
      this.osdInstance.viewport.goHome();
    }
  }

}
