import * as OpenSeadragon from '../image/openseadragon';
import * as annotations from '../toolbar/annotations';
import {OsdService} from './osd.service';
import {Injectable} from '@angular/core';

@Injectable()
export class AnnotationsService {
  annoBoard;
  getBoard;
  osdObj;

  constructor(private osdService: OsdService) {
    this.getBoard = new annotations(OpenSeadragon);
  }

  activateAnnoBoard() {
    this.osdObj = this.osdService.getOsd();
    this.annoBoard = this.getBoard(this.osdObj);

    /*this.annoBoard.parentElem.addEventListener('onAnnotationCreated', function(event) {
      const annotation = event.annotation,
        annotationObjToSave = {
          comments: annotation.comment,
          roiIndex: 1, // osdSettings.tileSources[this.osdObj._sequenceIndex].roi,
          slideId: 0,
          pointList: []
        };
      let relativePt;

      switch (annotation.type) {
        case 'Rectangular':
          annotationObjToSave.type = 'RECTANGLE';
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x, annotation.y));
          // To Do: -1 multiplier needs to be reverted after h'bad demo
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(
            new OpenSeadragon.Point(annotation.x + annotation.width, annotation.y + annotation.height));
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          break;
        case 'Circular':
          annotationObjToSave.type = 'CIRCLE';
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(
            new OpenSeadragon.Point(annotation.centerX, annotation.centerY));
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(
            new OpenSeadragon.Point(annotation.centerX + (annotation.radius / Math.sqrt(2)),
              annotation.centerY + (annotation.radius / Math.sqrt(2))));
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          break;
        case 'Freeform':
        case 'OpenFreeform':
          annotationObjToSave.type = annotation.type === 'Freeform' ? 'FREEFORM' : 'OPENFREEFORM';
          for (let i in annotation.points) {
            annotation.points[i].x = Math.ceil(annotation.points[i].x);
            annotation.points[i].y = Math.ceil(annotation.points[i].y);
            relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(
              new OpenSeadragon.Point(annotation.points[i].x, annotation.points[i].y));
            annotationObjToSave.pointList.push({
              pointID: null,
              pointX: Math.ceil(relativePt.x),
              pointY: Math.ceil(-1 * relativePt.y)
            });
          }
          break;
        case 'Ruler':
        case 'Arrow':
          annotationObjToSave.type = annotation.type.toUpperCase();
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x1, annotation.y1));
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          relativePt = this.osdObj.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x2, annotation.y2));
          annotationObjToSave.pointList.push({
            pointID: null,
            pointX: relativePt.x,
            pointY: -1 * relativePt.y
          });
          break;
      }
      let savePromise;
      if (annotation.marker) {
        annotation.slideId = annotationObjToSave.slideId;
        annotation.roi = annotationObjToSave.roiIndex;
        _annotationHandler.saveAnnotation(annotation);
      } else {
        savePromise = _annotationHandler.saveAnnotation(annotationObjToSave);
      }
      if (savePromise) {
        savePromise.then(function(resp) {
          if (resp.status > -1) {
            let newid = resp.annotationInfoList[0].annotationID;
            annotation.id = newid;
            annotation.user = resp.annotationInfoList[0].userName;
            if (isRemoteModeOn) {
              // convert points in 40x level
              annotationObjToSave.id = newid;
              remoteMethods.setAnnotationCreationData(annotationObjToSave);
            }
          } else {
            this.annoBoard.deleteAnnotationOnOsd({annotation: annotation});
            console.log('Save annotation failure');
            console.log('Failure: ' + JSON.stringify(resp));
          }
        });
      }
    });*/
  }

  drawAnnotation(type) {
    this.annoBoard.drawAnnotation(type);
  }
}
