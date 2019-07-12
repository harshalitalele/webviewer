(function (ann) {
    "use strict";
        
    ann.AnnoBoard = function (parentElemParam, canvasDimensions) {
        var selfBoard = this,
            canvasElement,
            onAnnotationCreated = new Event('onAnnotationCreated'),
            onAnnotationDeleted = new Event('onAnnotationDeleted'),
            onAnnotationEdited = new Event('onAnnotationEdited');
        this.allAnnotations = [];
        this.pixelToNanometer = 0;
        
        function getDimensions(baseElement) {
            //To Do: In case of OpenSeadragon, we should fetch proper image height width and top bottom positions here
            return baseElement.getClientRects()[0];
        }
        
        function createCanvasOverlay(element) {
            var canvasElem = document.createElement("canvas"),
                baseElementId = element.getAttribute("id");
            canvasElem.id = "canvas-overlay-" + selfBoard.id;
            //To Do: Check if below line is necessary
            canvasElem.style.position = "absolute";
            canvasElem.style.top = "0px";
            canvasElem.style.left = "0px";
            canvasElem.style.width = "100%";
            canvasElem.style.height = "100%";
            canvasElem.style.zIndex = "9999";
            return canvasElem;
        }
        
        if (typeof parentElemParam === "string") {
            this.id = parentElemParam;
            this.parentElem = document.getElementById(this.id);
        } else if (OpenSeadragon && parentElemParam instanceof OpenSeadragon.Viewer) {
            this.boardType = "OpenSeadragon";
            this.parentElem = parentElemParam.element;
            this.osdViewer = parentElemParam;
            this.id = this.parentElem.getAttribute("id");
        }
                
        this.canvasDimensions = canvasDimensions;
        
        if (!this.canvasDimensions) {
            this.canvasDimensions = getDimensions(this.parentElem);
        }
        
        canvasElement = createCanvasOverlay(this.parentElem);
        //To Do: Check if this is no harmful ever
        this.parentElem.style.position = "relative";
        this.parentElem.appendChild(canvasElement);
        
        this.overlayElem = canvasElement;
        
        this.actions = new ann.actions(this.overlayElem);
        this.actions.attachActions();
        //To Do: should hideOverlay belong to this or should that be private function?
        this.hideOverlay();
        
        this.annotations = [];
        this.implementedAction = null;
        
        //Openseadragon related event listeners
        //To Do: Put a check for openseadragon, so that we can use same events for other boards as well
        this.showAnnotationOnOsd = function (annotation, viewportRect) {
            if (selfBoard.boardType === "OpenSeadragon") {
                if(!viewportRect) {
                    //annotation.element.style.transform = 'rotate(' + -1*parentElemParam.viewport.getRotation() + 'deg)';
                    /*var presentRect = new OpenSeadragon.Rect(parseFloat(annotation.element.style.left), parseFloat(annotation.element.style.top), parseFloat(annotation.element.style.width), parseFloat(annotation.element.style.height));
                    viewportRect = parentElemParam.viewport.viewerElementToViewportRectangle(presentRect);*/
                    
                    var presentTLPt = new OpenSeadragon.Point(parseFloat(annotation.element.style.left), parseFloat(annotation.element.style.top)),
                        vpTLPt = parentElemParam.viewport.imageToViewerElementCoordinates(presentTLPt);
                    
                    //viewportRect.rotate(-1*parentElemParam.viewport.getRotation());
                }
                var overlayOptions = {
                    element: annotation.element,
                    location: viewportRect
                };
                parentElemParam.addOverlay(overlayOptions);
            }
            selfBoard.allAnnotations.push(annotation);
            
            //sort all annotations
            selfBoard.allAnnotations.sort(function(a, b) {
                return b.size - a.size;
            });
            //update zIndex of elements
            var zIndex = 2,
                annIndex = 0;
            for(annIndex in selfBoard.allAnnotations) {
                var currentAnnotation = selfBoard.allAnnotations[annIndex];
                currentAnnotation.element.style.zIndex = zIndex++;
            }
        };
        
        function wrapElem(el) {
            var divEl = document.createElement('div'),
                deg = -1 * parentElemParam.viewport.getRotation();
            el.style.transform = 'rotate(' + deg + 'deg)';
            divEl.appendChild(el);
            divEl.style.position = 'relative';
            el.style.width = 100*Math.cos(deg) + '%';
            el.style.height = '10px';
            /*el.style.top = '10%';
            el.style.left = '10%';
            return divEl;
        }
        
        this.saveAnnotation = function (ev) {
            /*var angle = selfBoard.osdViewer.viewport.getRotation();
            if(angle) {
                ev.annotation.element.style.transform = "rotate(-" + angle + "deg)";
                ev.annotation.element.style.transformOrigin = "left top 0px";
            }*/
            //ev.annotation.element.style.transform = 'rotate(' + -1*parentElemParam.viewport.getRotation() + 'deg)';
            var presentRect = new OpenSeadragon.Rect(parseFloat(ev.annotation.element.style.left), parseFloat(ev.annotation.element.style.top), parseFloat(ev.annotation.element.style.width), parseFloat(ev.annotation.element.style.height));
            var viewportRelativeRect = parentElemParam.viewport.viewerElementToViewportRectangle(presentRect);
            //viewportRelativeRect.rotate(-1*parentElemParam.viewport.getRotation());
            
            var ann = {
                element: wrapElem(ev.annotation.element)
            },
                presentTLPt = new OpenSeadragon.Point(parseFloat(ev.annotation.element.style.left), parseFloat(ev.annotation.element.style.top)),
                vpTLPt = parentElemParam.viewport.viewerElementToViewportCoordinates(presentTLPt);
            
            selfBoard.showAnnotationOnOsd(ann, vpTLPt);
            onAnnotationCreated.annotation = ev.annotation;
            
            //To Do: convert points into 40x level points
            //osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x1, annotation.y1));
            selfBoard.parentElem.dispatchEvent(onAnnotationCreated);
        };
        selfBoard.parentElem.addEventListener("onAnnotationSave", this.saveAnnotation);
        
        this.deleteAnnotationOnOsd = function (ev) {
            if (selfBoard.boardType === "OpenSeadragon") {
                parentElemParam.removeOverlay(ev.annotation.element);
            }
            for(var ann in selfBoard.allAnnotations) {
                if(selfBoard.allAnnotations[ann].hasOwnProperty("id") && selfBoard.allAnnotations[ann].id === ev.annotation.id){
                    selfBoard.allAnnotations.splice(ann, 1);
                    break;
                }
            }
        };
        
        this.deleteAnnotation = function (ev) {
            selfBoard.deleteAnnotationOnOsd(ev);
            onAnnotationDeleted.annotation = ev.annotation;
            selfBoard.parentElem.dispatchEvent(onAnnotationDeleted);
        };
        selfBoard.parentElem.addEventListener("onAnnotationDelete", this.deleteAnnotation);
        
        this.editAnnotationOnOsd = function (ev) {
            if (selfBoard.boardType === "OpenSeadragon") {
                //osd.removeOverlay(ev.annotation.element);
            }
            onAnnotationEdited.annotation = ev.annotation;
            selfBoard.parentElem.dispatchEvent(onAnnotationEdited);
        };
        selfBoard.parentElem.addEventListener("onAnnotationEdit", this.editAnnotationOnOsd);
    };
    
    ann.AnnoBoard.prototype.setPixelToNanometer = function(value) {
        this.pixelToNanometer = value;
    };
    
    ann.AnnoBoard.prototype.drawAnnotation = function (annotationType) {
        this.showOverlay();
        switch (annotationType) {
        case "OpenFreeform":
            this.implementedAction = new ann.freeformAction();
            break;
        case "Rectangular":
            this.implementedAction = new ann.rectangularAction();
            break;
        case "Circular":
            this.implementedAction = new ann.circularAction();
            break;
        case "Freeform":
            this.implementedAction = new ann.closedFreeformAction();
            break;
        case "Ruler":
            //To Do: Add a condition to check if base element is os
            this.implementedAction = new ann.rulerAction();                
            //var zoomFactor = this.osdViewer.viewport.getMaxZoom()/this.osdViewer.viewport.getZoom();
            var tiledImage = this.osdViewer.world.getItemAt(0),
                ratio = tiledImage._scaleSpring.current.value *
                tiledImage.viewport._containerInnerSize.x /
                tiledImage.source.dimensions.x;
                
            this.implementedAction.setConverter(this.pixelToNanometer*ratio*this.osdViewer.viewport.getZoom(true));
            break; 
        case "New Freeform":
            this.implementedAction = new ann.newFreeformAction();
            break;
        case "Paper Freeform":
            this.implementedAction = new ann.paperFreeformAction();
            break;
        case "Arrow":
            this.implementedAction = new ann.arrowAction();
            break;
        }
        this.actions.setBehavior(this.implementedAction);
    };
    
    ann.AnnoBoard.prototype.showAnnotation = function (annotation) {
        var implementedAction;
        annotation.marker = this.marker;
        switch (annotation.type) {
        case "OpenFreeform":
        case "Freeform":
            annotation = new ann.freeformAction(annotation);
            annotation.showAnnotation(annotation.points, this.parentElem);
            break;
        case "Rectangular":
            annotation = new ann.rectangularAction(annotation);
            annotation.showAnnotation(this.parentElem);
            break;
        case "Circular":
            annotation = new ann.circularAction(annotation);
            annotation.showAnnotation(this.parentElem);
            break;
        case "Ruler":
            annotation = new ann.rulerAction(annotation);
            //To Do: Add a condition to check if base element is osd
            var tiledImage = this.osdViewer.world.getItemAt(0),
                ratio = tiledImage._scaleSpring.current.value *
                tiledImage.viewport._containerInnerSize.x /
                tiledImage.source.dimensions.x;
                
            this.implementedAction.setConverter(this.pixelToNanometer*ratio*this.osdViewer.viewport.getZoom(true));
            annotation.showAnnotation(this.parentElem);
            break;
        case "New Freeform":
            annotation = new ann.newFreeformAction(annotation);
            annotation.showAnnotation(this.parentElem);
            break;
        case "Paper Freeform":
            annotation = new ann.paperFreeformAction(annotation);
            annotation.showAnnotation(this.parentElem);
            break;
        case "Arrow":
            annotation = new ann.arrowAction(annotation);
            annotation.showAnnotation(this.parentElem);
            break;
        }
        this.showAnnotationOnOsd(annotation);
        return annotation.element;
    };
    
    ann.AnnoBoard.prototype.removeAllAnnotations = function () {
        var annIndex;
        
        while(this.allAnnotations.length > 0) {
            var annotation = this.allAnnotations.pop();
            annotation.deleteAnnotation();
            this.deleteAnnotationOnOsd({annotation: annotation});
        }
    };
    
    ann.AnnoBoard.prototype.getAnnotations = function () {
        return this.annotations;
    };
    
    ann.AnnoBoard.prototype.getOverlay = function () {
        return this.overlayElem;
    };
    
    ann.AnnoBoard.prototype.showOverlay = function () {
        var context = this.overlayElem.getContext("2d");
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        this.overlayElem.style.display = "block";
    };
    
    //To Do: should hideOverlay belong to this or should that be private function?
    ann.AnnoBoard.prototype.hideOverlay = function () {
        this.overlayElem.style.display = "none";
    };
        
    ann.AnnoBoard.prototype.destroyBoard = function () {
        this.parentElem.removeEventListener("onAnnotationSave", this.saveAnnotation);
        delete this.saveAnnotation;
        this.parentElem.removeEventListener("onAnnotationDelete", this.deleteAnnotation);
        delete this.deleteAnnotationOnOsd;
        this.parentElem.removeEventListener("onAnnotationEdit", this.editAnnotationOnOsd);
        delete this.editAnnotationOnOsd;
        if (this.overlayElem.parentNode) {
            this.overlayElem.parentNode.removeChild(this.overlayElem);
        } else {
            delete this.overlayElem;
        }
    };
    
}(Annotation));
