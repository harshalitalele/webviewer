var userInControl = true;
(function () {

  if ( typeof window.Event === "function" ) return false;

  function Event ( event, params ) {
    //params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'Event' );
    evt.initEvent(event, true, false);
    //evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  Event.prototype = window.Event.prototype;

  window.Event = Event;
})();

function Annotation(OpenSeadragon) {
  "use strict";

  Annotation.OSD = OpenSeadragon;

  return function (id, canvasDimensions) {
    return new Annotation.AnnoBoard(id, canvasDimensions);
  };
}

(function (ann) {
  "use strict";

  var hasTouch = !!window.hasOwnProperty('ontouchstart'),
    ACTIONS = {
      DOWN: hasTouch ? "touchstart" : "mousedown",
      MOVE: hasTouch ? "touchmove" : "mousemove",
      UP: hasTouch ? "touchend" : "mouseup",
      LEAVE: hasTouch ? "touchleave" : "mouseleave"
    };

  ann.actions = function (overlayElem) {
    this.baseElement = overlayElem;
    this.isActionStarted = false;
    this.isActionCompleted = false;
    this.implementedAction = null;
  };

  ann.actions.prototype.attachActions = function () {
    var selfActions = this;

    function getRelativePoints(x, y) {
      var parentPos = selfActions.baseElement.getClientRects()[0];
      return {x: x - parentPos.left, y: y - parentPos.top};
    }

    this.mousedownListener = function (event) {
      selfActions.isActionStarted = true;
      selfActions.isActionCompleted = false;
      selfActions.baseElement.width = parseFloat(selfActions.baseElement.getClientRects()[0].width);
      selfActions.baseElement.height = parseFloat(selfActions.baseElement.getClientRects()[0].height);
    };

    this.mousemoveListener = function (event) {
      if (selfActions.isActionStarted && !selfActions.isActionCompleted) {
        if (!event.x || !event.y) {
          event.x = event.touches[0].clientX;
          event.y = event.touches[0].clientY;
        }
        selfActions.implementedAction.actionChangeBehavior(selfActions.baseElement, getRelativePoints(event.x, event.y));
      }
    };

    this.mouseupListener = function (event) {
      selfActions.isActionStarted = false;
      selfActions.isActionCompleted = true;
      if (!event.x || !event.y) {
        event.x = event.touches[0].clientX;
        event.y = event.touches[0].clientY;
      }
      selfActions.implementedAction.actionCompleteBehavior(selfActions.baseElement, getRelativePoints(event.x, event.y));
      if(!selfActions.implementedAction.marker) {
        var promise = ann.Editor("onDrawn", {x: event.x, y: event.y}, selfActions.implementedAction, selfActions.baseElement.parentNode);
        promise.then(function () {
          selfActions.baseElement.style.display = "none";
        }, function () {
          selfActions.baseElement.style.display = "none";
        }).catch(function () {
          selfActions.baseElement.style.display = "none";
        });
      } else {
        if (selfActions.implementedAction && selfActions.implementedAction.onSave) {
          selfActions.implementedAction.onSave('');
          var onAnnotationSave = typeof Event === "function" ? new Event('onAnnotationSave') : window.Event;
          onAnnotationSave.annotation = selfActions.implementedAction;
          selfActions.baseElement.parentNode.dispatchEvent(onAnnotationSave);
        }
        selfActions.baseElement.style.display = "none";
      }
    };

    this.mouseleaveListener = function (event) {
      selfActions.isActionStarted = false;
      selfActions.isActionCompleted = true;
    };

    this.baseElement.addEventListener(ACTIONS.DOWN, this.mousedownListener);
    this.baseElement.addEventListener(ACTIONS.MOVE, this.mousemoveListener);
    this.baseElement.addEventListener(ACTIONS.UP, this.mouseupListener);
    this.baseElement.addEventListener(ACTIONS.LEAVE, this.mouseleaveListener);
  };

  ann.actions.prototype.detachActions = function () {
    this.baseElement.removeEventListener(ACTIONS.DOWN, this.mousedownListener);
    this.baseElement.removeEventListener(ACTIONS.MOVE, this.mousemoveListener);
    this.baseElement.removeEventListener(ACTIONS.UP, this.mouseupListener);
    this.baseElement.removeEventListener(ACTIONS.LEAVE, this.mouseleaveListener);
  };

  ann.actions.prototype.setBehavior = function (implementedAction) {
    //To Do: validate allowed if implementedAction is among the allowed ones
    this.implementedAction = implementedAction;
  };

}(Annotation));

(function (ann) {
  "use strict";

  var editorHTML = "<form>"
    + "<div class='top-left annotation-popup' id='annotation-popup'>"
    + "<div id='annotation-comments'></div>"
    + "<div class='annotation-popup-buttons' id='annotation-popup-buttons'>"
    + "<a class='annotation-popup-button annotation-popup-button-edit' id='annotation-popup-button-fill' title='Fill' href='javascript:void(0);'>Fill</a>"
    + "<a class='annotation-popup-button annotation-popup-button-edit' id='annotation-popup-button-edit' title='Edit' href='javascript:void(0);'>EDIT</a>"
    + "<a class='annotation-popup-button annotation-popup-button-delete' id='annotation-popup-button-delete' title='Delete' href='javascript:void(0);'>DELETE</a>"
    + "</div>"
    + "<span class='annotation-popup-text'></span>"
    + "<div id='popup-user-details' class='user-details'></div>"
    + "</div>"
    + "<div id='annotation-editor' class='annotation-editor-field'>"
    + "<form>"
    + "<textarea id='annotation-editor-text' class='annotation-editor-text' placeholder='Add a Comment...' tabindex='1'></textarea>"
    + "<span class='error-message' id='error-message'></span>"
    + "<div id='editor-user-details' class='user-details'></div>"
    + "<div class='annotation-editor-button-container'>"
    + "<a class='annotation-editor-button annotation-editor-button-cancel' id='annotation-editor-button-cancel' href='javascript:void(0);' tabindex='3'>Cancel</a>"
    + "<a class='annotation-editor-button annotation-editor-button-save disabled' id='annotation-editor-button-save' href='javascript:void(0);' tabindex='2'>Save</a>"
    + "</div>"
    + "</form>"
    + "</div>"
    + "</form>",
    editorElement = document.createElement("div"),
    onAnnotationSave = typeof Event === "function" ? new Event('onAnnotationSave') : window.Event,
    onAnnotationDelete = typeof Event === "function" ? new Event('onAnnotationDelete') : window.Event,
    onAnnotationEdit = typeof Event === "function" ? new Event('onAnnotationEdit') : window.Event,
    onAnnotationCancel = typeof Event === "function" ? new Event('onAnnotationCancel') : window.Event,
    isEditingProgress = false,
    isHighlighted = false;

  ann.Editor = function (userAction, position, implementedAction, baseElement) {
    if (isEditingProgress && userAction !== "edit") {
      //do something
      return;
    }
    var isMarker = implementedAction.marker;

    editorElement.innerHTML = editorHTML;
    editorElement.style.position = "absolute";
    editorElement.style.zIndex = "999999998";
    editorElement.style.display = "block";
    document.body.appendChild(editorElement);

    var editorOut = true,
      annotationOut = false;

    editorElement.firstChild.style.position = "fixed";
    editorElement.firstChild.style.top = (position.y > (window.innerHeight - 90) ? (window.innerHeight - 90) : position.y) + "px";
    editorElement.firstChild.style.left = (position.x > (window.innerWidth - 300) ? (window.innerWidth - 300) : position.x) + "px";

    return new Promise(function (resolve, reject) {
      if (userAction === "highlight") {
        isHighlighted = true;
        document.getElementById("annotation-comments").innerHTML = implementedAction.comment.replace(",", "<br/>");
        document.getElementById("popup-user-details").innerHTML = implementedAction.user;
        editorElement.style.width = "auto";
        editorElement.style.height = "auto";

        var popupStyles = document.getElementById("annotation-popup").style;
        popupStyles.display = "block";
        document.getElementById("annotation-editor").style.display = "none";
        popupStyles.backgroundColor = "rgba(100,100,100,0.8)";
        popupStyles.padding = "10px";

        if(!userInControl || implementedAction.user == "system.analysis@airamatrix.com") {
          document.getElementById("annotation-popup-buttons").style.display = "none";
        }

        editorElement.firstElementChild.addEventListener("mouseleave", function(e) {
          editorOut = true;
        });

        implementedAction.element.addEventListener("mouseleave", function(e) {
          annotationOut = true;
        });

        editorElement.firstElementChild.addEventListener("mouseover", function(e) {
          editorOut = false;
        });

        implementedAction.element.addEventListener("mouseover", function(e) {
          annotationOut = false;
        });

        var editorHidingCheck = setInterval(function() {
          if(editorOut && annotationOut) {
            ann.hideEditor();
            annotationOut = false;
            editorOut = false;
            //clearInterval(editorHidingCheck);
          }
        }, 20);

        editorElement.style.top = "0";
        editorElement.style.left = "0";

        var validAnnotation = false,
          onEdit = function () {
            //do some common code
            if (implementedAction && implementedAction.onEdit) {
              implementedAction.onEdit();
            }
            //To Do: emit onAnnotationCreated event
            editorElement.style.display = "none";
            isEditingProgress = true;
            ann.Editor("edit", position, implementedAction, baseElement);
          }, onDelete = function () {
            //do some common code
            if (implementedAction && implementedAction.deleteAnnotation) {
              implementedAction.deleteAnnotation();
              onAnnotationDelete.annotation = implementedAction;
              baseElement.dispatchEvent(onAnnotationDelete);
            }
            //To Do: emit onAnnotationDelete event
            editorElement.style.display = "none";
            //return reject();
          };

        if(!isMarker) {
          document.getElementById("annotation-popup-button-fill").style.display = "none";
          document.getElementById("annotation-popup-button-edit").style.display = "inline-block";
          document.getElementById("annotation-popup-button-edit").addEventListener("click", onEdit);
        } else {
          document.getElementById("annotation-popup-button-fill").style.display = "inline-block";
          document.getElementById("annotation-popup-button-edit").style.display = "none";
          document.getElementById("annotation-popup-button-fill").addEventListener("click", function (ev) {
            if (implementedAction && implementedAction.fillColor) {
              implementedAction.fillColor("blue");
            }
            //To Do: emit onAnnotationDelete event
            editorElement.style.display = "none";
          });
        }
        document.getElementById("annotation-popup-button-delete").addEventListener("click", onDelete);
      } else {
        editorElement.style.width = document.documentElement.scrollWidth + "px";
        editorElement.style.height = document.documentElement.scrollHeight + "px";
        editorElement.style.top = "0";
        editorElement.style.left = "0";
        editorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        document.getElementById("annotation-editor").style.display = "block";
        document.getElementById("annotation-popup").style.display = "none";

        if (implementedAction.comment) {
          document.getElementById("annotation-editor-text").value = implementedAction.comment;
          document.getElementById("editor-user-details").innerHTML = implementedAction.user;
        } else {
          //document.getElementById("editor-user-details").innerHTML = "currentUser";
        }

        var onSave = function () {
          //do some common code
          if (implementedAction && implementedAction.onSave) {
            var comment = document.getElementById("annotation-editor-text").value;
            implementedAction.onSave(comment);
            if (!isEditingProgress) {
              if(!onAnnotationSave) {
                onAnnotationSave = window.Event;
              }
              onAnnotationSave.annotation = implementedAction;
              baseElement.dispatchEvent(onAnnotationSave);
            } else {
              onAnnotationEdit.annotation = implementedAction;
              baseElement.dispatchEvent(onAnnotationEdit);
            }
          }
          //To Do: emit onAnnotationCreated event
          editorElement.style.display = "none";
          isEditingProgress = false;
          return resolve("saved");
        }, onCancel = function () {
          //do some common code
          if (implementedAction && implementedAction.deleteAnnotation && !isEditingProgress) {
            implementedAction.deleteAnnotation();
          }
          //To Do: emit onAnnotationCancel
          onAnnotationCancel.annotation = implementedAction;
          baseElement.dispatchEvent(onAnnotationCancel);

          editorElement.style.display = "none";
          isEditingProgress = false;
          return reject("cancelled");
        }, validateMessage = function () {
          var comment = document.getElementById("annotation-editor-text").value,
            errorMsg = "Please enter some comment",
            errorElement = document.getElementById("error-message"),
            saveButton = document.getElementById("annotation-editor-button-save");
          if(!comment) {
            validAnnotation = false;
            errorElement.innerHTML = errorMsg;
            saveButton.classList.add("disabled");
          } else {
            validAnnotation = true;
            errorElement.innerHTML = "";
            saveButton.classList.remove("disabled");
          }
        };
        document.getElementById("annotation-editor-text").addEventListener("keyup", validateMessage);
        document.getElementById("annotation-editor-button-save").addEventListener("click", function() {
          validateMessage();
          if(validAnnotation) {
            onSave();
          } else {
            return false;
          }
        });
        document.getElementById("annotation-editor-button-cancel").addEventListener("click", onCancel);
      }
    });
  };

  ann.hideEditor = function () {
    if (isHighlighted) {
      document.getElementById("annotation-popup").style.display = "none";
      isHighlighted = false;
    }
  };
}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  function updateActionBoundaries(point, boundaries) {
    if (point.x < boundaries.x) {
      boundaries.width += boundaries.x - point.x;
      boundaries.x = point.x;
    } else if (point.x > (boundaries.x + boundaries.width)) {
      boundaries.width = point.x - boundaries.x;
    }
    if (point.y < boundaries.y) {
      boundaries.height += boundaries.y - point.y;
      boundaries.y = point.y;
    } else if (point.y > (boundaries.y + boundaries.height)) {
      boundaries.height = point.y - boundaries.y;
    }
  }

  function getActionBoundaries(points) {
    var pointIndex,
      actionBoundaries = {
        x: points[0].x,
        y: points[0].y,
        width: 0,
        height: 0
      },
      x2 = points[0].x,
      y2 = points[0].y;

    for (pointIndex = 1; pointIndex < points.length; pointIndex = pointIndex + 1) {
      //To Do: See if there is any optimum way of doing this
      var point = points[pointIndex];
      if (point.x < actionBoundaries.x) {
        actionBoundaries.x = point.x;
      } else if (point.x > x2) {
        x2 = point.x;
      }
      actionBoundaries.width = x2 - actionBoundaries.x;
      if (point.y < actionBoundaries.y) {
        actionBoundaries.y = point.y;
      } else if (point.y > y2) {
        y2 = point.y;
      }
      actionBoundaries.height = y2 - actionBoundaries.y;
    }
    return actionBoundaries;
  }

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement.parentNode);
    });
  }

  function getSlope(p1, p2) {
    return (p2.y-p1.y)/(p2.x-p1.x);
  }

  function zipPoints(points, tolerance) {
    tolerance = tolerance || 1;
    var zippedPointsSet = [points[0], points[1]],
      lastPoint = points[0],
      lastSlope = getSlope(points[1], lastPoint),
      origDatasetLen = points.length,
      ptDist = 3;

    for(var i = 2; i < origDatasetLen; i++) {
      var currentPt = points[i];
      //check for nearness
      if(Math.abs(currentPt.x - lastPoint.x) < ptDist && Math.abs(currentPt.y - lastPoint.y) < ptDist) {
        continue;
      } else {
        //check for slope
        var currentSlope = getSlope(currentPt, lastPoint);
        if(Math.abs(currentSlope - lastSlope) < tolerance) {
          zippedPointsSet.pop();
        }
        zippedPointsSet.push(currentPt);
        lastPoint = currentPt;
        lastSlope = currentSlope;
      }
    }
    return zippedPointsSet;
  }

  ann.freeformAction = function (annotation, actionBoundaries) {
    this.type = "OpenFreeform";
    this.color = "#00ff00";
    this.lineWidth = 5;
    this.points = [];
    this.comment = "";
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.actionBoundaries = actionBoundaries || (this.points && this.points.length > 0 ? getActionBoundaries(this.points) : {x: 0, y: 0, width: 0, height: 0});
    this.element = null;
  };

  ann.freeformAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    if (actionCompleted) {
      this.actionBoundaries.x = point.x;
      this.actionBoundaries.y = point.y;
      context.beginPath();
      context.moveTo(point.x, point.y);
      this.points.push(point);
      actionCompleted = false;
    } else {
      context.lineTo(point.x, point.y);
      context.stroke();
      this.points.push(point);
      updateActionBoundaries(point, this.actionBoundaries);
    }
  };

  ann.freeformAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.lineTo(point.x, point.y);
    context.stroke();
    context.closePath();
    this.points.push(point);
    updateActionBoundaries(point, this.actionBoundaries);

    context.clearRect(0, 0, baseElement.width, baseElement.height);
    this.showAnnotation(this.points, baseElement.parentNode);

    actionCompleted = true;
  };

  ann.freeformAction.prototype.showAnnotation = function (points, baseElement) {

    var element = document.createElement("div"),
      point1 = points[0],
      ptIndex;

    points = zipPoints(points, 0.15);

    element.setAttribute("id", "freeform-annotation");

    //if this.actionBoundaries not there get them from points and set them
    if (!this.actionBoundaries || this.actionBoundaries.width === 0) {
      this.actionBoundaries = getActionBoundaries(points);
    }

    element.style.width = this.actionBoundaries.width + "px";
    element.style.height = this.actionBoundaries.height + "px";
    element.style.zIndex = "2";

    this.size = this.actionBoundaries.width * this.actionBoundaries.height;

    for (ptIndex = 1; ptIndex < points.length; ptIndex = ptIndex + 1) {
      var point2 = points[ptIndex],
        lineElem = document.createElement("hr"),
        xdiff = point2.x - point1.x,
        ydiff = point2.y - point1.y,
        length = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
        angle = Math.atan2((point2.y - point1.y),(point2.x - point1.x))*180/Math.PI;
      lineElem.style.borderColor = "#00ff00";
      lineElem.style.borderWidth = this.lineWidth/2 + "px";
      lineElem.style.width = length * 100 / (this.actionBoundaries.width) + "%";
      lineElem.style.height = "0px";
      lineElem.style.position = "absolute";
      lineElem.style.top = (point1.y - this.actionBoundaries.y) * 100 / this.actionBoundaries.height + "%";
      lineElem.style.left = (point1.x - this.actionBoundaries.x) * 100 / this.actionBoundaries.width + "%";
      lineElem.style.margin = "0px";
      lineElem.style.transformOrigin = "left center";
      lineElem.setAttribute("noshade", "");
      lineElem.style.transform = "rotate(" + angle + "deg)";
      element.appendChild(lineElem);
      point1 = points[ptIndex];
    }

    //set reference to this.element
    this.element = element;

    this.element.style.position = "absolute";
    this.element.style.top = this.actionBoundaries.y + "px";
    this.element.style.left = this.actionBoundaries.x + "px";

    baseElement.appendChild(this.element);

    addHighlightAction(this, baseElement.firstElementChild);
  };

  ann.freeformAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.freeformAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.freeformAction.prototype.onCancel = function () {
    this.deleteAnnotation();
  };

  ann.freeformAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  function updateActionBoundaries(point, boundaries) {
    if (point.x < boundaries.x) {
      boundaries.width += boundaries.x - point.x;
      boundaries.x = point.x;
    } else if (point.x > (boundaries.x + boundaries.width)) {
      boundaries.width = point.x - boundaries.x;
    }
    if (point.y < boundaries.y) {
      boundaries.height += boundaries.y - point.y;
      boundaries.y = point.y;
    } else if (point.y > (boundaries.y + boundaries.height)) {
      boundaries.height = point.y - boundaries.y;
    }
  }

  function getActionBoundaries(points) {
    var pointIndex,
      actionBoundaries = {
        x: points[0].x,
        y: points[0].y,
        width: 0,
        height: 0
      },
      x2 = points[0].x,
      y2 = points[0].y;

    for (pointIndex = 1; pointIndex < points.length; pointIndex = pointIndex + 1) {
      //To Do: See if there is any optimum way of doing this
      var point = points[pointIndex];
      if(point.x < actionBoundaries.x) {
        actionBoundaries.x = point.x;
      } else if(point.x > x2) {
        x2 = point.x;
      }
      actionBoundaries.width = x2 - actionBoundaries.x;
      if(point.y < actionBoundaries.y) {
        actionBoundaries.y = point.y;
      } else if(point.y > y2) {
        y2 = point.y;
      }
      actionBoundaries.height = y2 - actionBoundaries.y;
    }
    return actionBoundaries;
  }

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement.parentNode);
    });
  }

  function addClickAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("click", function (event) {
      implementedAction.fillColor(getFillColor());
    });
  }

  function getSlope(p1, p2) {
    return (p2.y-p1.y)/(p2.x-p1.x);
  }

  function zipPoints(points, tolerance) {
    tolerance = tolerance || 1;
    var zippedPointsSet = [points[0], points[1]],
      lastPoint = points[0],
      lastSlope = getSlope(points[1], lastPoint),
      origDatasetLen = points.length,
      ptDist = 3;

    for(var i = 2; i < origDatasetLen; i++) {
      var currentPt = points[i];
      //check for nearness
      if(Math.sqrt((currentPt.y - lastPoint.y)**2 + (currentPt.x - lastPoint.x)**2) < ptDist) {
        continue;
      } else {
        //check for slope
        var currentSlope = getSlope(currentPt, lastPoint);
        if(Math.abs(currentSlope - lastSlope) < tolerance) {
          zippedPointsSet.pop();
        }
        zippedPointsSet.push(currentPt);
        lastPoint = currentPt;
        lastSlope = currentSlope;
      }
    }
    return zippedPointsSet;
  }

  ann.closedFreeformAction = function (annotation, actionBoundaries) {
    this.type = "Freeform";
    this.color = "#00ff00";
    this.lineWidth = 50;
    this.points = [];
    this.comment = "";
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.actionBoundaries = actionBoundaries || (this.points && this.points.length > 0 ? getActionBoundaries(this.points) : {x: 0, y: 0, width: 0, height: 0});
    this.element = null;
    this.fillElement = null;
    this.tempLayer = null;
  };

  ann.closedFreeformAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d"),
      tempLayerContext = this.tempLayer ? this.tempLayer.getContext("2d") : null;
    if(this.marker) {
      this.color = "#000";
    }
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    if(tempLayerContext) {
      tempLayerContext.strokeStyle = this.color;
      tempLayerContext.lineWidth = context.lineWidth;
    }
    if (actionCompleted) {
      this.tempLayer = baseElement.cloneNode(true);
      this.tempLayer.style.zIndex = "2";
      this.tempLayer.style.position = "absolute";
      baseElement.parentNode.appendChild(this.tempLayer);

      this.actionBoundaries.x = point.x;
      this.actionBoundaries.y = point.y;
      context.beginPath();
      context.moveTo(point.x, point.y);
      this.points.push(point);
      actionCompleted = false;
    } else {
      context.lineTo(point.x, point.y);
      context.stroke();
      this.points.push(point);
      updateActionBoundaries(point, this.actionBoundaries);

      tempLayerContext.clearRect(0, 0, context.canvas.width, context.canvas.height);
      tempLayerContext.beginPath();
      tempLayerContext.moveTo(this.points[0].x, this.points[0].y);
      tempLayerContext.lineTo(point.x, point.y);
      tempLayerContext.stroke();
    }
  };

  ann.closedFreeformAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.lineTo(point.x, point.y);
    context.lineTo(this.points[0].x, this.points[0].y);
    context.stroke();
    context.closePath();
    this.points.push(point);
    updateActionBoundaries(point, this.actionBoundaries);

    this.tempLayer.parentNode.removeChild(this.tempLayer);

    //context.clearRect(0, 0, baseElement.width, baseElement.height);
    this.showAnnotation(this.points, baseElement.parentNode);

    actionCompleted = true;
  };

  ann.closedFreeformAction.prototype.showAnnotation = function (points, baseElement) {
    var element = document.createElement("div"),
      point1 = points[0],
      ptIndex;

    element.setAttribute("id", "closed-freeform-annotation");

    points = zipPoints(points, 0.15);
    points.push(points[0]);
    this.points = points;

    //if this.actionBoundaries not there get them from points and set them
    if (!this.actionBoundaries || this.actionBoundaries.width === 0) {
      this.actionBoundaries = getActionBoundaries(points);
    }

    element.style.width = this.actionBoundaries.width + "px";
    element.style.height = this.actionBoundaries.height + "px";
    element.style.zIndex = "2";

    this.size = this.actionBoundaries.width * this.actionBoundaries.height;

    for (ptIndex = 1; ptIndex < points.length; ptIndex = ptIndex + 1) {
      var point2 = points[ptIndex],
        lineElem = document.createElement("hr"),
        xdiff = point2.x - point1.x,
        ydiff = point2.y - point1.y,
        length = Math.sqrt(xdiff*xdiff + ydiff*ydiff) - this.lineWidth/2,
        angle = Math.atan2((point2.y - point1.y),(point2.x - point1.x))*180/Math.PI,
        scaleParam = "";
      lineElem.style.borderColor = "red";//this.color;
      lineElem.style.borderWidth = this.lineWidth/2 + "px";
      lineElem.style.borderRadius = 2*this.lineWidth + "px";
      lineElem.style.width = length * 100 / (this.actionBoundaries.width) + "%";
      lineElem.style.height = "0px";
      lineElem.style.position = "absolute";
      lineElem.style.top = (point1.y - this.actionBoundaries.y) * 100 / (this.actionBoundaries.height) + "%";
      lineElem.style.left = (point1.x - this.actionBoundaries.x) * 100 / (this.actionBoundaries.width) + "%";
      lineElem.style.margin = "0px";
      lineElem.style.transformOrigin = "left center";
      lineElem.setAttribute("noshade", "");
      lineElem.style.transform = "rotate(" + angle + "deg)" + scaleParam;
      element.appendChild(lineElem);
      point1 = points[ptIndex];
    }

    //set reference to this.element
    this.element = element;

    this.element.style.position = "absolute";
    this.element.style.top = this.actionBoundaries.y + "px";
    this.element.style.left = this.actionBoundaries.x + "px";

    baseElement.appendChild(this.element);

    if(!this.marker) {
      addHighlightAction(this, baseElement.firstElementChild);
    } else {
      addClickAction(this, baseElement.firstElementChild);
    }
  };

  ann.closedFreeformAction.prototype.fillColor = function (color) {
    this.fillColor = color;
    if(!this.fillElement) {
      var canvasElem = document.createElement("canvas");
      canvasElem.width = this.actionBoundaries.width;
      canvasElem.height = this.actionBoundaries.height;
      canvasElem.style.width = this.actionBoundaries.width + "px";
      canvasElem.style.height = this.actionBoundaries.height + "px";

      var ctx = canvasElem.getContext("2d");
      ctx.beginPath();

      var pts = this.points,
        offsetPt = {x : this.actionBoundaries.x, y: this.actionBoundaries.y},
        ptIndex;
      ctx.moveTo(pts[0].x - offsetPt.x, pts[0].y - offsetPt.y);
      for (ptIndex = 1; ptIndex < pts.length; ptIndex = ptIndex + 1) {
        var point = pts[ptIndex];
        ctx.lineTo(point.x - offsetPt.x, point.y - offsetPt.y);
      }
      ctx.lineTo(pts[0].x - offsetPt.x, pts[0].y - offsetPt.y);
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color;
      ctx.fill();
      this.element.appendChild(canvasElem);
      canvasElem.style.width = "100%";
      canvasElem.style.height = "100%";
      this.fillElement = canvasElem;
    } else {
      var ctx = this.fillElement.getContext("2d");
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fill;
    }
  };

  ann.closedFreeformAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.closedFreeformAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.closedFreeformAction.prototype.onCancel = function () {
    this.deleteAnnotation();
  };

  ann.closedFreeformAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  ann.rectangularAction = function (annotation) {
    this.type = "Rectangular";
    this.color = "#00ff00";
    this.lineWidth = 5;
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.element = null;
  };

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement);
    });
  }

  ann.rectangularAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    if (actionCompleted) {
      context.beginPath();
      this.x = point.x;
      this.y = point.y;
      this.width = 1;
      this.height = 1;
      actionCompleted = false;
    } else {
      this.width = point.x - this.x;
      this.height = point.y - this.y;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.beginPath();
      context.rect(this.x, this.y, this.width, this.height);
      context.stroke();
    }
  };

  ann.rectangularAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.closePath();

    context.clearRect(0, 0, baseElement.width, baseElement.height);
    this.showAnnotation(baseElement.parentNode);

    this.points = [];

    actionCompleted = true;
  };

  ann.rectangularAction.prototype.showAnnotation = function (baseElement) {
    var element = document.createElement("div");
    element.setAttribute("id", "rectangular-annotation");

    //set height and width of the canvas element
    element.style.width = Math.abs(this.width) - this.lineWidth + "px";
    element.style.height = Math.abs(this.height) - this.lineWidth + "px";
    element.style.zIndex = "2";
    element.style.border = this.lineWidth + "px solid " + this.color;

    this.size = Math.abs(this.width) * Math.abs(this.height);

    //set reference to this.freeformElement
    this.element = element;

    this.element.style.position = "absolute";
    this.element.style.top = this.height > 0 ? this.y - this.lineWidth/2 + "px" : this.y + this.height - this.lineWidth/2 + "px";
    this.element.style.left = this.width > 0 ? this.x - this.lineWidth/2 + "px" : this.x + this.width - this.lineWidth/2 + "px";

    baseElement.appendChild(this.element);

    addHighlightAction(this, baseElement);
  };

  ann.rectangularAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.rectangularAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.rectangularAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  ann.circularAction = function (annotation) {
    this.type = "Circular";
    this.color = "#00ff00";
    this.lineWidth = 5;
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.element = null;
  };

  function calculateDistance(point1, point2) {
    return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) + (point2.y - point1.y) * (point2.y - point1.y));
  }

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement.parentNode);
    });
  }

  ann.circularAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    if (actionCompleted) {
      context.beginPath();
      this.centerX = point.x;
      this.centerY = point.y;
      this.radius = 1;
      actionCompleted = false;
    } else {
      this.radius = calculateDistance(point, {x: this.centerX, y: this.centerY});
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.beginPath();
      context.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
      context.stroke();
    }
  };

  ann.circularAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.closePath();

    context.clearRect(0, 0, baseElement.width, baseElement.height);
    this.showAnnotation(baseElement.parentNode);

    actionCompleted = true;
  };

  ann.circularAction.prototype.showAnnotation = function (baseElement) {
    var element = document.createElement("div");
    element.setAttribute("id", "circular-annotation");

    //set height and width of the canvas element
    element.style.width = this.radius * 2 - this.lineWidth + "px";
    element.style.height = this.radius * 2 - this.lineWidth + "px";
    element.style.zIndex = "2";
    element.style.border = this.lineWidth + "px solid " + this.color;
    element.style.borderRadius = "50%";

    this.size = this.radius * 4;

    //set reference to this.freeformElement
    this.element = element;

    this.points = [];

    this.element.style.position = "absolute";
    this.element.style.top = this.centerY - this.radius - this.lineWidth/2 + "px";
    this.element.style.left = this.centerX - this.radius - this.lineWidth/2 + "px";

    baseElement.appendChild(this.element);

    addHighlightAction(this, baseElement.firstElementChild);
  };

  ann.circularAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.circularAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.circularAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  ann.rulerAction = function (annotation) {
    this.type = "Ruler";
    this.color = "#00ff00";
    this.lineWidth = 50;
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.element = null;
  };

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement.parentNode);
    });
  }

  ann.rulerAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.strokeStyle = this.color;
    context.font = "15px Arial green";
    context.lineWidth = this.lineWidth;
    if (actionCompleted) {
      context.beginPath();
      this.x1 = point.x;
      this.y1 = point.y;
      this.x2 = point.x + 1;
      this.y2 = point.y + 1;
      actionCompleted = false;
    } else {
      this.x2 = point.x;
      this.y2 = point.y;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.beginPath();
      context.moveTo(this.x1, this.y1);
      context.lineTo(this.x2, this.y2);
      if (this.pixelToNanometer > 0) {
        var realDistance = this.getRealDistance(),
          distLabelX = (this.x2 + this.x1) / 2,
          distLabelY = (this.y2 + this.y1) / 2 - 30;
        context.fillStyle = this.color;
        context.fillText(realDistance, distLabelX, distLabelY);
        this.realDistance = realDistance;
      }
      context.stroke();
    }
  };

  ann.rulerAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");

    this.x2 = point.x;
    this.y2 = point.y;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    context.moveTo(this.x1, this.y1);
    context.lineTo(this.x2, this.y2);
    context.stroke();

    context.closePath();

    this.showAnnotation(baseElement.parentNode);

    this.points = [];

    actionCompleted = true;
  };

  ann.rulerAction.prototype.showAnnotation = function (baseElement) {
    var element = document.createElement("div");
    element.setAttribute("id", "ruler-annotation");
    var xdiff = Math.abs(this.x2 - this.x1);
    var ydiff = Math.abs(this.y2 - this.y1);
    var length = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
    this.length = length;
    element.style.width = length + "px";
    element.style.height = ydiff + "px";

    var lineElem = document.createElement("hr");
    lineElem.style.borderColor = "#00ff00";
    lineElem.style.borderWidth = this.lineWidth + "px";
    lineElem.style.width = "100%";
    lineElem.style.position = "absolute";
    lineElem.style.margin = "0px";
    lineElem.setAttribute("noshade", "");
    var angle = Math.atan((this.y2 - this.y1)/(this.x2 - this.x1))*180/Math.PI;
    if((this.x2 < this.x1 && this.y2 > this.y1) || (this.x2 < this.x1 && this.y2 < this.y1)) {
      angle = 180 + angle;
    }
    this.angle = angle;
    lineElem.style.transform = "rotate(" + angle + "deg)";
    lineElem.style.transformOrigin = "left top";

    this.size = Math.abs(xdiff) * Math.abs(ydiff);
    element.appendChild(lineElem);

    //set reference to this.freeformElement
    this.element = element;

    this.element.style.position = "absolute";
    this.element.style.top = this.y1 - this.lineWidth + "px";
    this.element.style.left = this.x1 - this.lineWidth + "px";

    baseElement.appendChild(this.element);

    this.addMeasurementLabel();

    addHighlightAction(this, baseElement.firstElementChild);
  };

  ann.rulerAction.prototype.getRealDistance = function() {
    var xdiff = this.x2 - this.x1,
      ydiff = this.y2 - this.y1,
      canvasLength = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
      realDist = canvasLength * this.pixelToNanometer;

    if(realDist < Math.pow(10, 3)) {
      realDist = realDist.toFixed(2) + " nm";
    } else if(realDist < Math.pow(10, 6)) {
      realDist = (realDist/1000).toFixed(2) + " &mu;m";
    } else if(realDist < Math.pow(10, 9)) {
      realDist = (realDist/Math.pow(10, 6)).toFixed(2) + " mm";
    }

    return realDist;
  };

  ann.rulerAction.prototype.addMeasurementLabel = function() {
    var mLabel = document.createElement("div"),
      angle = this.angle,
      xDirection = 1,
      yDirection = 1;
    mLabel.style.position = "absolute";
    if(this.x2 < this.x1) {
      angle = this.angle - 180;
      xDirection = -1;
    }
    if(this.y2 < this.y1) {
      yDirection = -1;
    }
    mLabel.innerHTML = this.realDistance ? this.realDistance : this.getRealDistance();
    //mLabel.style.transform = "rotate(" + angle + "deg)";
    //mLabel.style.transformOrigin = "left";
    mLabel.style.left = (this.x2 - this.x1)/2/this.length * 100 + "%";
    mLabel.style.top = yDirection * 50 + "%";
    mLabel.style.fontSize = "18px";
    mLabel.style.fontWeight = "bold";
    mLabel.style.zIndex = "99";
    mLabel.style.color = "#00ff00";
    mLabel.style.padding = "2px";

    this.element.appendChild(mLabel);
  };

  ann.rulerAction.prototype.setConverter = function(conversionRatio) {
    this.pixelToNanometer = conversionRatio;
  };

  ann.rulerAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.rulerAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.rulerAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";
  var actionCompleted = true;

  ann.arrowAction = function (annotation) {
    this.type = "Arrow";
    this.color = "#00ff00";
    if(!Object.hasOwnProperty("assign")) {
      for(var k in annotation) {
        this[k] = annotation[k];
      }
    } else {
      Object.assign(this, annotation);
    }
    this.element = null;
  };

  function addHighlightAction(implementedAction, baseElement) {
    implementedAction.element.addEventListener("mouseenter", function (event) {
      var position = implementedAction.getHighlightPosition();
      ann.Editor("highlight", position, implementedAction, baseElement.parentNode);
    });
  }

  ann.arrowAction.prototype.actionChangeBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.strokeStyle = this.color;
    context.lineWidth = "5";
    if (actionCompleted) {
      context.beginPath();
      this.x1 = point.x;
      this.y1 = point.y;
      this.x2 = point.x + 1;
      this.y2 = point.y + 1;
      actionCompleted = false;
    } else {
      this.x2 = point.x;
      this.y2 = point.y;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.beginPath();
      context.moveTo(this.x1, this.y1);
      context.lineTo(this.x2, this.y2);

      //To Do: draw arrow head
      var arrowAngle = Math.atan2((this.y2 - this.y1), (this.x2 - this.x1)),
        headLength = 20,
        headAngle = 45*Math.PI/180,
        x3 = this.x2 - headLength * Math.cos(arrowAngle - headAngle),
        y3 = this.y2 - headLength * Math.sin(arrowAngle - headAngle),
        x4 = this.x2 - headLength * Math.cos(arrowAngle + headAngle),
        y4 = this.y2 - headLength * Math.sin(arrowAngle + headAngle);
      context.lineTo(x3, y3);
      context.lineTo(this.x2, this.y2);
      context.lineTo(x4, y4);
      //End: draw arrow head

      context.stroke();
    }
  };

  ann.arrowAction.prototype.actionCompleteBehavior = function (baseElement, point) {
    var context = baseElement.getContext("2d");
    context.closePath();

    this.showAnnotation(baseElement.parentNode);

    this.points = [];

    actionCompleted = true;
  };

  ann.arrowAction.prototype.showAnnotation = function (baseElement) {
    var element = document.createElement("div");
    element.setAttribute("id", "arrow-annotation");
    var xdiff = Math.abs(this.x2 - this.x1);
    var ydiff = Math.abs(this.y2 - this.y1);
    var length = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
    this.length = length;
    element.style.width = length + "px";
    element.style.height = ydiff + "px";

    var lineElemWrapper = document.createElement("div"),
      lineElem = document.createElement("hr");
    lineElem.style.borderColor = "#00ff00";
    lineElem.style.borderWidth = "4px";
    lineElem.style.width = "100%";
    lineElem.style.position = "absolute";
    lineElem.style.margin = "0px";
    lineElem.setAttribute("noshade", "");
    var angle = Math.atan((this.y2 - this.y1)/(this.x2 - this.x1))*180/Math.PI;
    if((this.x2 < this.x1 && this.y2 > this.y1) || (this.x2 < this.x1 && this.y2 < this.y1)) {
      angle = 180 + angle;
    }
    this.angle = angle;
    lineElemWrapper.appendChild(lineElem);
    lineElemWrapper.style.transform = "rotate(" + angle + "deg)";
    lineElemWrapper.style.transformOrigin = "left top";

    this.size = Math.abs(xdiff) * Math.abs(ydiff);
    element.appendChild(lineElemWrapper);

    //arrow head element
    var headElem = document.createElement("i"),
      headElemStyles = headElem.style;
    headElemStyles.border = "solid #00ff00";
    headElemStyles.borderWidth = "0 4px 4px 0";
    headElemStyles.width = "20px";
    headElemStyles.height = "20px";
    headElemStyles.display = "inline-block";
    headElemStyles.padding = "3px";
    headElemStyles.marginTop = "-9px";
    headElemStyles.float = "right";
    headElemStyles.transform = "rotate(-45deg)";
    lineElemWrapper.appendChild(headElem);

    //set reference to this.freeformElement
    this.element = element;

    this.element.style.position = "absolute";
    this.element.style.top = this.y1 + "px";
    this.element.style.left = this.x1 + "px";

    baseElement.appendChild(this.element);

    addHighlightAction(this, baseElement.firstElementChild);
  };

  ann.arrowAction.prototype.deleteAnnotation = function () {
    this.element.parentNode.removeChild(this.element);
  };

  ann.arrowAction.prototype.onSave = function (comment) {
    this.comment = comment;
  };

  ann.arrowAction.prototype.getHighlightPosition = function () {
    var annotationPos = this.element.getClientRects()[0],
      annotationContainerPos = this.element.parentElement.getClientRects()[0];
    return {
      x: Math.max(annotationPos.left, annotationContainerPos.left, 0),
      y: Math.max(annotationPos.top, annotationContainerPos.top, 0)
    };
  };

}(Annotation));

(function (ann) {
  "use strict";

  ann.AnnoBoard = function (parentElemParam, canvasDimensions) {
    var selfBoard = this,
      canvasElement,
      onAnnotationCreated = typeof Event === "function" ? new Event('onAnnotationCreated') : window.event,
      onAnnotationDeleted = typeof Event === "function" ? new Event('onAnnotationDeleted') : window.event,
      onAnnotationEdited = typeof Event === "function" ? new Event('onAnnotationEdited') : window.event;
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
      canvasElem.style.zIndex = "999999998";
      canvasElem.style.cursor = "crosshair";
      return canvasElem;
    }

    if (typeof parentElemParam === "string") {
      this.id = parentElemParam;
      this.parentElem = document.getElementById(this.id);
    } else {
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
          var presentRect = new ann.OSD.Rect(parseFloat(annotation.element.style.left), parseFloat(annotation.element.style.top), parseFloat(annotation.element.style.width), parseFloat(annotation.element.style.height));
          viewportRect = parentElemParam.viewport.viewerElementToViewportRectangle(presentRect);
        }
        parentElemParam.addOverlay(annotation.element, viewportRect);
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

    this.saveAnnotation = function (ev) {
      var presentRect = new ann.OSD.Rect(parseFloat(ev.annotation.element.style.left), parseFloat(ev.annotation.element.style.top), parseFloat(ev.annotation.element.style.width), parseFloat(ev.annotation.element.style.height));
      var viewportRelativeRect = parentElemParam.viewport.viewerElementToViewportRectangle(presentRect);
      selfBoard.showAnnotationOnOsd(ev.annotation, viewportRelativeRect);
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

  ann.AnnoBoard.prototype.checkHighlights = function() {
    var osd = this.osdViewer,
      pointerX = parseFloat(osd.pointerElem.style.left),
      pointerY = parseFloat(osd.pointerElem.style.top);
    for(var a in this.allAnnotations) {
      var annotation = this.allAnnotations[a].element,
        annotationX = parseFloat(annotation.style.left),
        annotationY = parseFloat(annotation.style.top),
        annotationX2 = parseFloat(annotation.style.width) + annotationX,
        annotationY2 = parseFloat(annotation.style.height) + annotationY;
      if(pointerX >= annotationX && pointerX <= annotationX2 && pointerY >= annotationY && pointerY <= annotationY2) {
        var position = this.allAnnotations[a].getHighlightPosition();
        ann.Editor("highlight", position, this.allAnnotations[a], osd.element);
        setTimeout(function() {
          ann.hideEditor();
        }, 2000);
      }
    }
  };

  ann.AnnoBoard.prototype.drawAnnotation = function (annotationType, isMarker) {
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
        var tiledImage = this.osdViewer.world.getItemAt(0),
          ratio = tiledImage._scaleSpring.current.value *
            tiledImage.viewport._containerInnerSize.x /
            tiledImage.source.dimensions.x;

        this.implementedAction.setConverter(this.pixelToNanometer/(ratio*this.osdViewer.viewport.getZoom(true)));
        break;
      case "Arrow":
        this.implementedAction = new ann.arrowAction();
        break;
    }
    this.implementedAction.marker = isMarker;
    this.actions.setBehavior(this.implementedAction);
  };

  ann.AnnoBoard.prototype.showAnnotation = function (annotation) {
    var implementedAction;
    switch (annotation.type) {
      case "OpenFreeform":
      case "Freeform":
        implementedAction = new ann.freeformAction(annotation);
        implementedAction.showAnnotation(annotation.points, this.parentElem);
        break;
      case "Rectangular":
        implementedAction = new ann.rectangularAction(annotation);
        implementedAction.showAnnotation(this.parentElem);
        break;
      case "Circular":
        implementedAction = new ann.circularAction(annotation);
        implementedAction.showAnnotation(this.parentElem);
        break;
      case "Ruler":
        implementedAction = new ann.rulerAction(annotation);
        //To Do: Add a condition to check if base element is osd
        var tiledImage = this.osdViewer.world.getItemAt(0),
          ratio = tiledImage._scaleSpring.current.value *
            tiledImage.viewport._containerInnerSize.x /
            tiledImage.source.dimensions.x;

        implementedAction.setConverter(this.pixelToNanometer/(ratio*this.osdViewer.viewport.getZoom(true)));
        implementedAction.showAnnotation(this.parentElem);
        break;
      case "Arrow":
        implementedAction = new ann.arrowAction(annotation);
        implementedAction.showAnnotation(this.parentElem);
        break;
    }
    this.showAnnotationOnOsd(implementedAction);
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


(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // expose as amd module
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // expose as commonjs module
    module.exports = factory();
  } else {
    root.Annotation = factory();
  }
} (this, function () {
  return Annotation;
}));

/*
var upArr = [],
  downArr = [],
  twd = 5,
  tht = 5;

function getUpArr(m, n) {
  for(var i = 0; i < m; i++) {
    for(var j = 0; j < n; j++) {
      if(i%2 && j%2) {
        var fkey = (i*n+j)*4;
        downArr.push(fkey);
        downArr.push(fkey+1);
        downArr.push(fkey+2);
        downArr.push(fkey+3);
        //console.log(fkey);
      } else {
        var fkey = (i*n+j)*4;
        upArr.push(fkey);
        upArr.push(fkey+1);
        upArr.push(fkey+2);
        upArr.push(fkey+3);
        //console.log(fkey);
      }
    }
  }
}

function showOutput() {
  alert("showing output...");
  var outputArr = [],
    downKey = 0,
    upKey = 0;
  for(var i = 0; i < twd; i++) {
    for(var j = 0; j < tht; j++) {
      if(i%2 && j%2) {
        outputArr.push(downArr[downKey++]);
        outputArr.push(downArr[downKey++]);
        outputArr.push(downArr[downKey++]);
        outputArr.push(downArr[downKey++]);
        //console.log(downArr[downKey]);
      } else {
        outputArr.push(upArr[upKey++]);
        outputArr.push(upArr[upKey++]);
        outputArr.push(upArr[upKey++]);
        outputArr.push(upArr[upKey++]);
        //console.log(upArr[upKey]);
      }
    }
  }
}

getUpArr(twd, tht);
*/

