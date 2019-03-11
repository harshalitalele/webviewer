import * as OpenSeadragon from '../image/openseadragon';
import * as annotations from '../toolbar/annotations';
import {OsdService} from './osd.service';
import {Injectable} from '@angular/core';

@Injectable()
export class AnnotationsService {
  annoBoard;
  getBoard;

  constructor(private osdService: OsdService) {
    this.getBoard = new annotations(OpenSeadragon);
  }

  activateAnnoBoard() {
    this.annoBoard = this.getBoard(this.osdService.getOsd());
  }

  drawAnnotation(type) {
    this.annoBoard.drawAnnotation(type);
  }
}
