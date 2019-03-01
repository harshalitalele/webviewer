/**
 * @Author: Harshali.Talele
 * @Description: This is a wrapper over openseadragon library to make it easy to use as per our requirements and image schema.
 *              Completely written using vanilla Javascript.
 *
 **/

var imgName = '' ;
var annotationRemoteActions = {
    "CREATION": "Created",
    "UPDATE": "Updated",
    "DELETE": "Removed",
    "HIGHLIGHT": "Highlighted",
    "HIGHLIGHT_REMOVED": "removeHighlight"
}, onFullScreen, onHome, onPrevious, onNext, isAnnoHandlerAlreadySet = false;

function getOSDViewer($) {
    var isRemoteModeOn = false,
        _annotationHandler = {},
        isPresenter = false,
        annotationsColors = ['red', 'green', 'blue', 'white', 'black'],
        currentROIAnnotations = [],
        listOfSlideURIs =[],
        mouseTracker,
        _isRemoteView = false,
        annoBoard,
        userColorMap = {},
        annotationsMap = {},
        annotationTree = {},
        annotationKeyMap = {
            "SHAPE": "type",
            "USERS": "userName"
        }, remoteMethods = {};

    function reinitializeSessionData() {
        isRemoteModeOn = false;
        isPresenter = false;
        currentROIAnnotations = [];
        listOfSlideURIs =[];
        annotationsList = [];
        annotationsMap = {};
    }

    function _imageChangeHandler() {
        console.log("There is no image change handler for this instance!");
        return;
    }
    function setRemoteConsultingMethods() {
        $.prototype.startGettingRemoteObject = function(callbackFn) {
            isRemoteModeOn = true;
            var osdInstance = this;
            if(!osdInstance.remoteConsultingObj) {
                osdInstance.remoteConsultingObj = {};
            }
            //bind all events and pass the callbackFn to those
            osdInstance.addHandler("viewport-change", function() {
                if(!osdInstance.remoteConsultingObj.viewerDetails) {
                    osdInstance.remoteConsultingObj.viewerDetails = {};
                }
                osdInstance.remoteConsultingObj.viewerDetails.center = osdInstance.viewport.getCenter(true);
                osdInstance.remoteConsultingObj.viewerDetails.zoom = osdInstance.viewport.getZoom(true);
                osdInstance.remoteConsultingObj.viewerDetails.presenterContainerWd = osdInstance.viewport._containerInnerSize.x;
                callbackFn(osdInstance.remoteConsultingObj);
                delete osdInstance.remoteConsultingObj.viewerDetails;
            });
            var isMouseInOsd = false;
            isPresenter = true;
            if(!osdInstance.remoteConsultingObj.mousePosition) {
                osdInstance.remoteConsultingObj.mousePosition = {};
            }
            mouseTracker = new OpenSeadragon.MouseTracker(
                {
                    element     : "openseadragon",
                    enterHandler: function(ev) {
                        isMouseInOsd = isPresenter && true;
                    },
                    exitHandler: function(ev) {
                        isMouseInOsd = false;
                    },
                    moveHandler: function (ev) {
                        if (isMouseInOsd && isPresenter) {
                        //changes done for Remote Consulting start
                            var webPoint = ev.position;
                            // Convert that to viewport coordinates, the lingua franca of OpenSeadragon coordinates.
                            var viewportPoint = osdInstance.viewport.pointFromPixel(webPoint);

                            // Convert from viewport coordinates to image coordinates.
                            var imagePoint = osdInstance.viewport.viewportToImageCoordinates(viewportPoint);
                            if(!osdInstance.remoteConsultingObj.hasOwnProperty("mousePosition")) {
                                osdInstance.remoteConsultingObj.mousePosition = {};
                            }
                            osdInstance.remoteConsultingObj.mousePosition.mouseX = imagePoint.x;
                            osdInstance.remoteConsultingObj.mousePosition.mouseY = imagePoint.y;
                            //changes done for Remote Consulting end
                            callbackFn(osdInstance.remoteConsultingObj);
                            delete osdInstance.remoteConsultingObj.mousePosition;
                        }
                    }
                }
            );

            remoteMethods.setAnnotationCreationData = function(annotation) {
                if(!osdInstance.remoteConsultingObj.annotationDetails) {
                    osdInstance.remoteConsultingObj.annotationDetails = {};
                }
                osdInstance.remoteConsultingObj.annotationDetails.action = annotationRemoteActions.CREATION;
                osdInstance.remoteConsultingObj.annotationDetails.annotationData = {};
                osdInstance.remoteConsultingObj.annotationDetails.annotationData.toProcess = annotation;
                callbackFn(osdInstance.remoteConsultingObj);
                osdInstance.remoteConsultingObj.annotationDetails = {};
            };
            //ToDo: Need to work on Annotation Removed and Updated
            remoteMethods.setAnnotationRemovalData = function(annotation) {
                if(!osdInstance.remoteConsultingObj.annotationDetails) {
                    osdInstance.remoteConsultingObj.annotationDetails = {};
                }
                osdInstance.remoteConsultingObj.annotationDetails.action = annotationRemoteActions.DELETE;
                osdInstance.remoteConsultingObj.annotationDetails.annotationData = {};
                osdInstance.remoteConsultingObj.annotationDetails.annotationData.toProcess = annotation;
                callbackFn(osdInstance.remoteConsultingObj);
                osdInstance.remoteConsultingObj.annotationDetails = {};
            };
            remoteMethods.setAnnotationUpdatedData = function(annotation) {
                if(!osdInstance.remoteConsultingObj.annotationDetails) {
                    osdInstance.remoteConsultingObj.annotationDetails = {};
                }
                osdInstance.remoteConsultingObj.annotationDetails.action = annotationRemoteActions.UPDATE;
                osdInstance.remoteConsultingObj.annotationDetails.annotationData = {};
                osdInstance.remoteConsultingObj.annotationDetails.annotationData.toProcess = annotation;
                callbackFn(osdInstance.remoteConsultingObj);
                osdInstance.remoteConsultingObj.annotationDetails = {};
            };

            remoteMethods.setAnnotationHighlightedData = function(annotation) {
                if(!osdInstance.remoteConsultingObj.annotationDetails) {
                    osdInstance.remoteConsultingObj.annotationDetails = {};
                }
                osdInstance.remoteConsultingObj.annotationDetails.action = annotationRemoteActions.HIGHLIGHT;
                osdInstance.remoteConsultingObj.annotationDetails.annotationData = annotation;
                callbackFn(osdInstance.remoteConsultingObj);
                osdInstance.remoteConsultingObj.annotationDetails = {};
            };

            remoteMethods.resetAnnotationHighlightedData = function() {
                if(!osdInstance.remoteConsultingObj.annotationDetails) {
                    osdInstance.remoteConsultingObj.annotationDetails = {};
                }
                osdInstance.remoteConsultingObj.annotationDetails.action = annotationRemoteActions.HIGHLIGHT_REMOVED;
                osdInstance.remoteConsultingObj.annotationDetails.annotationData = {};
                callbackFn(osdInstance.remoteConsultingObj);
                osdInstance.remoteConsultingObj.annotationDetails = {};
            };
            anno.onEditorShown(function() {
                callbackFn($.remoteConsultingObj);
            });
            anno.onMouseOverAnnotation(function() {
                callbackFn($.remoteConsultingObj);
            });
        };

        $.prototype.stopGettingRemoteObject = function() {
            //remove viewport-change handler
            this.removeAllHandlers("viewport-change");
            //clean data and detach callback method
            mouseTracker.destroy();
            //remove anno.setAnnotationCreationData
        };

        $.prototype.readAndReflectRemoteObject = function (remoteObj) {
            var osdInstance = this;

            function getThisAnnotationReference(annotationID) {
                for(var i in currentROIAnnotations) {
                    if(currentROIAnnotations[i] && currentROIAnnotations[i].id == annotationID) {
                        return currentROIAnnotations[i];
                    }
                }
            }

            function movePointer(mousePos) {
                if(!osdInstance.pointerElem || osdInstance.pointerElem == {}) {
                    var pointerDiv = document.createElement("DIV");
                    //commented as it was causing mouse pointer on participant side to flicker
                    pointerDiv.setAttribute('id','pointerDiv');
                    pointerDiv.style.position = "absolute";
                    pointerDiv.style.opacity = 0.7;
                    pointerDiv.style.height = "15px";
                    pointerDiv.style.width  = "15px";
                    pointerDiv.style.backgroundColor = "yellow";
                    pointerDiv.style.zIndex = "2";
                    pointerDiv.style.borderRadius = "50%";
                    document.getElementById("openseadragon").appendChild(pointerDiv);
                    osdInstance.pointerElem = pointerDiv;
                }
                osdInstance.pointerElem.style.top = mousePos.y + "px";
                osdInstance.pointerElem.style.left = mousePos.x + "px";
                annoBoard.checkHighlights();
            }

            if (remoteObj.hasOwnProperty("mousePosition")) {
                var imagePoint=new OpenSeadragon.Point(remoteObj.mousePosition.mouseX, remoteObj.mousePosition.mouseY);
                var mousePosTarget = osdInstance.viewport.imageToViewerElementCoordinates(imagePoint);
                movePointer(mousePosTarget);
            }
            if(remoteObj.hasOwnProperty("viewerDetails")) {
                var viewerDetails = remoteObj.viewerDetails;
                setTimeout(function() {
                    osdInstance.viewport.update();
                    osdInstance.viewport.panTo(viewerDetails.center, true);
                    var vpzoom = viewerDetails.zoom * viewerDetails.presenterContainerWd / osdInstance.viewport._containerInnerSize.x;
                    osdInstance.viewport.zoomTo(vpzoom, viewerDetails.center, true);
                }, 50);
            }
            if(remoteObj.hasOwnProperty("annotationDetails")) {
                //ToDo: Draw/Remove/Update annotations
                var annotationDetails = remoteObj.annotationDetails;
                switch(annotationDetails.action) {
                    case annotationRemoteActions.CREATION:
                        var annotation = getAnnotationCurrentZoom(annotationDetails.annotationData.toProcess);
                        annotation.comment = annotationDetails.annotationData.toProcess.comments;
                        annotation.id = annotationDetails.annotationData.toProcess.id;
                        annotation.user = annotationDetails.annotationData.toProcess.userName;
                        annoBoard.showAnnotation(annotation);
                        annotationsMap[annotation.id] = annotation;
                        break;
                    case annotationRemoteActions.DELETE:
                        var annotationId = annotationDetails.annotationData.toProcess.id,
                            annotation = {};
                            for(var i in annoBoard.allAnnotations) {
                                if(annoBoard.allAnnotations[i].id == annotationId) {
                                    annotation = annoBoard.allAnnotations[i];
                                    break;
                                }
                            }
                        annoBoard.deleteAnnotationOnOsd({annotation: annotation});
                        break;
                    case annotationRemoteActions.UPDATE:
                        var annotationId = annotationDetails.annotationData.toProcess.id,
                            annotation = {};
                        for(var i in annoBoard.allAnnotations) {
                            if(annoBoard.allAnnotations[i].id == annotationId) {
                                annoBoard.allAnnotations[i].comment = annotationDetails.annotationData.toProcess.comment;
                                break;
                            }
                        }
                        break;
                    case annotationRemoteActions.HIGHLIGHT:
                        var annotationToHighlight = getThisAnnotationReference(annotationDetails.annotationData.id);
                        //anno.highlightAnnotation(annotationToHighlight);
                        break;
                    case annotationRemoteActions.HIGHLIGHT_REMOVED:
                        //anno.highlightAnnotation();
                        break;
                    default:
                        break;
                }
            }
        };
    }

    var levelFolderMap = [];
    var scaleLevelMap = {
        0.0009765625: 6,
        0.001953125: 7,
        0.00390625: 8,
        0.0078125: 9,
        0.015625: 10,
        0.03125: 11,
        0.0625: 12,
        0.125: 13,
        0.25: 14,
        0.5: 15,
        1.0: 16
    };

    function getAnnotationCurrentZoom(annotation) {
        var annotationType = annotation.type,
            annotationObj = {};
        switch (annotationType) {
            case "RECTANGLE":
                annotationObj.type = "Rectangular";
                //To Do: -1 multiplier needs to be reverted after h'bad demo
                var viewerPoint1 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[0].pointX, -1*annotation.pointList[0].pointY)),
                    viewerPoint2 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[1].pointX, -1*annotation.pointList[1].pointY));
                annotationObj.x = viewerPoint1.x;
                annotationObj.y = viewerPoint1.y;
                annotationObj.width = viewerPoint2.x - viewerPoint1.x;
                annotationObj.height = viewerPoint2.y - viewerPoint1.y;
                break;
            case "CIRCLE":
                annotationObj.type = "Circular";
                var viewerPoint1 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[0].pointX, -1*annotation.pointList[0].pointY)),
                    viewerPoint2 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[1].pointX, -1*annotation.pointList[1].pointY));
                annotationObj.centerX = viewerPoint1.x;
                annotationObj.centerY = viewerPoint1.y;
                annotationObj.radius = Math.sqrt((viewerPoint2.x - viewerPoint1.x)*(viewerPoint2.x - viewerPoint1.x) + (viewerPoint2.y - viewerPoint1.y)*(viewerPoint2.y - viewerPoint1.y));
                break;
            case "FREEFORM":
            case "OPENFREEFORM":
                annotationObj.type = annotationType === "FREEFORM" ? "Freeform" : "OpenFreeform";
                annotationObj.points = [];
                for(var ptIndex in annotation.pointList) {
                    var viewerPoint = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[ptIndex].pointX, -1*annotation.pointList[ptIndex].pointY));
                    annotationObj.points.push(viewerPoint);
                }
                break;
            case "RULER":
            case "ARROW":
                annotationObj.type = annotationType === "RULER" ? "Ruler" : "Arrow";
                var viewerPoint1 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[0].pointX, -1*annotation.pointList[0].pointY)),
                    viewerPoint2 = osd.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annotation.pointList[1].pointX, -1*annotation.pointList[1].pointY));
                annotationObj.x1 = viewerPoint1.x;
                annotationObj.y1 = viewerPoint1.y;
                annotationObj.x2 = viewerPoint2.x;
                annotationObj.y2 = viewerPoint2.y;
                break;
        }
        return annotationObj;
    }

    function getScaleLevelMargin(imgWd, imgHt) {
        var maxLevel = Math.ceil(Math.log( Math.max( imgWd, imgHt ) ) / Math.log( 2 ));
        return maxLevel - 17;
    }
    var prevLevel = -1;

    function getSlideURI(uriIndex) {
        return listOfSlideURIs[uriIndex];
    }

    function getOverlayUrl(level, x ,y) {
        var ifdNum = levelFolderMap[this.image][this.roi][level];
        if(arrofDataTiles.length > 0 && arrofDataTiles[this.image] && arrofDataTiles[this.image].length > 0) {
            if(ifdNum == 0 || ifdNum == 1 || ifdNum == 2 || (arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum] && arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y] && (arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y].indexOf(x) != -1))) {
                return getSlideURI(this.image) + "/markTile?query=" + imgName + ":" + ifdNum + ":" + y + ":" + x;
            } else {
                return '';
            }
        } else {
            return getSlideURI(this.image) + "/markTile?query=" + imgName + ":" + ifdNum + ":" + y + ":" + x;
        }
    }

    function getTileUrls(level, x, y) {
        var ifdNum = levelFolderMap[this.image][this.roi][level];
        if(ifdNum != undefined) {
            if(prevLevel != level) {
                prevLevel = level;
            }
            //To Do: webp -> jpg needs to be reverted after h'bad demo
            //To Do: x -> y needs to be reverted after h'bad demo
            if(arrofDataTiles.length > 0 && arrofDataTiles[this.image] && arrofDataTiles[this.image].length > 0) {
                if(ifdNum == 0 || ifdNum == 1 || ifdNum == 2 || (arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum] && arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y] && (arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y].indexOf(x) != -1))) {
                    var best = "";
                    return getSlideURI(this.image) + "/tile?query="+imgName+":" + ifdNum + ":" + y + ":" + x;
                } else {
                    return '';
                }
            } else {
                var best = "";
                return getSlideURI(this.image) + "/tile?query="+imgName+":" + ifdNum + ":" + y + ":" + x;
            }
        }
        return '';
    }

    //Set some default settings
    var osdSettings = {
        navigatorAutoResize: false,
        id:                     "",
        showNavigationControl:  false,
        showSequenceControl: false,
        tileSources:            [],
        initialPage: 1, //this flag is to display first ROI by default.
        tileSourcesReferenceStrip: [],
        roiImageMap:[],
        sequenceMode: true,
        showReferenceStrip: true,
        referenceStripSizeRatio: 0.3,
        showNavigator:          true,
        navigatorMaintainSizeRatio: true,
        navigatorSizeRatio: 0.25,
        preserveImageSizeOnResize: true,
        zoomPerScroll: 1.5,
        loadTilesWithAjax: true,
        gestureSettingsMouse : {
            flickEnabled: true
        },
        maxZoomPixelRatio: 1,
        minPixelRatio: 0.5,
        timeout: 50000,
        navigatorPosition: "ABSOLUTE",
        navigatorTop: "4px"
    };
    var osd, tileSize, toolbarId = "toolbarDiv";

    //ToDo: Update this method
    function isUrlValid(url) {
        // var pattern = new RegExp('^(http?:\\/\\/)?'+ // protocol
        //     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        //     '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        //     '(\\:\\d+)?(\/[-a-z\\d%_.~+]*)*'); // port and path
        // if(!pattern.test(url)) {
        //     console.log("getOSDViewer: invalid URL for slide images");
        //     return false;
        // }
        return true;
    }
    var arrOfSchemas = [];
	var arrofDataTiles = new Array(new Array());

    function makeAjaxRequest(slideURI, requestType, getOSDCallback,imageNo,imageName) {
        var xmlhttp;

        if (window.XMLHttpRequest) {
            // code for modern browsers
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var storagePath = slideURI;
        var url =  storagePath+'/schema?query='+imageName;
        //var url =  storagePath+ "/schema.json";
        if(!isUrlValid(url)) {
            return;
        }
        xmlhttp.open(requestType, url, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if(this.status == 200 || this.status == 300) {
                    //Typical action to be performed when the document is ready
                    var schema = JSON.parse(this.responseText);
                    arrOfSchemas[imageNo] = schema;
                    for(var r=--schema.slideImage.numOfROIs;r>0;r--) {
                        loadDataTilesSchema(imageNo,requestType,storagePath,getOSDCallback,r);
                    }
                } else {
                    console.log("Error in AJAX call");
                    alert("Error in AJAX call");
                    //throw an error
                    //failureCallback();
                }
            }
        };
    }

    function loadDataTilesSchema(imageNo,requestType,url,getOSDCallback,ROI) { 
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var url_send = url + "/ROI_"+ROI+".json";
        xmlhttp.open(requestType, url_send, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if(this.status == 200 || this.status == 300) {
                    arrofDataTiles[imageNo][ROI] = JSON.parse(this.responseText);
                    if(ROI == 1 && imageNo == 0) {
                        processSchemaInfo(getOSDCallback);
                    }
                }  else {
                    if(ROI == 1 && imageNo == 0) {
                        processSchemaInfo(getOSDCallback);
                    }
                }  
            } 
        };
    }

    var defScale = 1.0, maxOsdZoom;

    function processSchemaInfo(getOSDCallback){
        tileSize = parseInt(arrOfSchemas[0].slideImage.tileWidth);
        setLevelFolderMap();
        updateOsdSettings();
        var osd = displaySlideImage();
        getOSDCallback(osd, annoBoard);
    }
    var minNavigatorScale = 1, minNavigatorLayer;
    function setLevelFolderMap() {
        levelFolderMap = [];
        osdSettings.tileSources = [];
        osdSettings.tileSourcesReferenceStrip = [];
        osdSettings.roiImageMap = [];
        var currentImage = 0; //to add image into sequence mode, and support getTileURLs method to handle multiple images with custom tiles
        var ROIsNavheight = new Array();
        var ROIsNavWidth =  new Array();
        var navigatorHeightTh = "200";//threshold height of navigator 
        var navigatorWidthTh = "250";//threshold width of navigator
        for(var schemaArrayIndex  in arrOfSchemas) {
            var schema = arrOfSchemas[schemaArrayIndex];
            var slideDetails = schema.slideImage;
            var numOfROIs = parseInt(slideDetails.numOfROIs);
            levelFolderMapImage = [];

            var currentROI = 0;
            var imageProfile = slideDetails.imageProfiles.imageProfile;
                         
            for (var imageProfileIndex in imageProfile) {
                var tilesrc = {
                    height: 512,
                    width: 512,
                    tileSize: 512,
                    getTileUrl: getTileUrls,
                    getOverlayUrl: getOverlayUrl,
                    roi: null,
                    image:null,
                    isSlideThumbnail:false
                };
                tilesrc.roi = currentROI;
                tilesrc.image = currentImage;
                tilesrc.pixelToNanometer = imageProfile[imageProfileIndex].pixelToNanometer;

                var levelFolderMapRoi = {};
                var levelMargin = getScaleLevelMargin(parseInt(imageProfile[imageProfileIndex].imageBounds.right), parseInt(imageProfile[imageProfileIndex].imageBounds.bottom));
                var imageLayers = imageProfile[imageProfileIndex].layers.layer;
                tilesrc.maxImgZoom = parseFloat(imageProfile[imageProfileIndex].resolution);

                for (var lIndex in imageLayers) {
                    var layer = imageLayers[lIndex];
                    var defaultLevel = 12;
                    if (parseFloat(layer.scale) == defScale) {
                        tilesrc.height = parseFloat(layer.height) / defScale;
                        tilesrc.width = parseFloat(layer.width) / defScale;
                        osdSettings.tileSources.push(tilesrc);
                        if(currentROI == 0) {
                            tilesrc.isSlideThumbnail = true;
                            osdSettings.tileSourcesReferenceStrip.push(tilesrc)
                        }
                    }
                    if(minNavigatorScale > layer.scale) {
                        minNavigatorScale = layer.scale;
                        minNavigatorLayer = layer;
                    }
                    var osdLevel = scaleLevelMap[parseFloat(layer.scale)];
                    levelFolderMapRoi[osdLevel + levelMargin + 1] = layer.ifdNum;
                }
                ROIsNavheight.push(minNavigatorLayer.height*(osdSettings.minPixelRatio+0.01));
                ROIsNavWidth.push(minNavigatorLayer.width*(osdSettings.minPixelRatio+0.01));
                osdSettings.roiImageMap.push(currentImage);
                currentROI++;
                levelFolderMapImage.push(levelFolderMapRoi);
            }
            currentImage++;
            window.levelFolderMap = levelFolderMap;

            levelFolderMap.push(levelFolderMapImage);
        }
        var maxH = Math.max.apply(this, ROIsNavheight);
        var maxW = Math.max.apply(this, ROIsNavWidth);
        if(maxH > navigatorHeightTh) {
            osdSettings.navigatorHeight = maxH+"px";
        } else {
            osdSettings.navigatorHeight = navigatorHeightTh+"px";
        }
        if(maxW > navigatorWidthTh) {
            osdSettings.navigatorWidth = maxW+"px";
        } else {
            osdSettings.navigatorWidth = navigatorWidthTh+"px";
        }
        
        console.log(levelFolderMap);
        return levelFolderMap;
    }

    function updateOsdSettings() {
        var refIndexStart = 0;
        var refIndexEnd = 0;
        for(var schemaArrayIndex  in arrOfSchemas) {
            var schema = arrOfSchemas[schemaArrayIndex];

            refIndexStart = refIndexEnd;// schema.slideImage.slideDetails.numOfROIs
            refIndexEnd = parseInt(schema.slideImage.numOfROIs) + refIndexStart ;

            var tileSourceOsd = osdSettings.tileSources;

            for (var tileSourceOsdIndex in tileSourceOsd) {
                if(tileSourceOsdIndex>=refIndexStart && tileSourceOsdIndex< refIndexEnd)
                    tileSourceOsd[tileSourceOsdIndex].tileSize = parseInt(schema.slideImage.tileWidth);
            }

            var tileSourceReferenceStripOsd = osdSettings.tileSourcesReferenceStrip;
            tileSourceReferenceStripOsd[schemaArrayIndex].tileSize = parseInt(schema.slideImage.tileWidth);

        }
        if(document.getElementById(toolbarId)) {
            osdSettings.toolbar = toolbarId;
        }
    }

    function createZoomElement() {
        var divElem = document.createElement("Div");
        divElem.style.position = "absolute";
        divElem.style.top = "1%";
        divElem.style.left = "1%";
        divElem.style.color = "#ffffff";
        divElem.style.fontWeight = "bolder";
        divElem.style.padding="3px 10px 3px 10px";
        divElem.style.backgroundColor="#464e55";
        divElem.style.opacity=0.8;
        divElem.style.zIndex=999999999;
        document.getElementById("openseadragon").appendChild(divElem);
        return divElem;
    }

    $.prototype.openSelectedSlide = function (imageNo, roi) {
        var pageNo = 0;
        for(var i = imageNo; i < osdSettings.roiImageMap.length; i++) {
            if(osdSettings.roiImageMap[i] == imageNo) {
                var tempPageNo = parseInt(i) + parseInt(roi);
                if(osdSettings.roiImageMap.hasOwnProperty(tempPageNo)) {
                    pageNo = tempPageNo;
                }
                break;
            }
        }
        this.goToPage(pageNo);
        return this;
    };

    $.prototype.getCompleteListOfAnnotationIds = function() {
        return Object.keys(annotationsMap);
    };

    //this method needs to be deleted after getting correct format of API response
    $.prototype.createAnnotationMapAndTree = function(annotationsResponse) {
        var annotationIndex,
            annotation,
            annotationTree = {
                type: {
                    displayName: "SHAPE",
                    options: {}
                },
                userName: {
                    displayName: "USERS",
                    options: {}
                }
            }, treekey;
        annotationsMap = {};
        for(annotationIndex in annotationsResponse.annotationInfoList) {
            annotation = annotationsResponse.annotationInfoList[annotationIndex];
            annotationsMap[annotation.annotationID] = annotation;
            for(treekey in annotationTree) {
                var option = annotation[treekey];
                if(option == "FREEFORM") {
                    option = "CLOSEDFREEFORM";
                }
                if(!annotationTree[treekey].options.hasOwnProperty(option)) {
                    annotationTree[treekey].options[option] = [];
                }
                annotationTree[treekey].options[option].push({
                    id: annotation.annotationID,
                    displayTitle: annotation.comments,
                    roi: annotation.roiIndex
                });
            }
        }
        return annotationTree;
    };

    $.prototype.updateTree = function(annotationRef, tree, action) {
        var annotation;
        switch(action) {
            case "add":
                for(var key in tree) {
                    var annotationParam = annotationRef[key];
                    if(annotationParam == "FREEFORM") {
                        annotationParam = "CLOSEDFREEFORM";
                    }
                    if(!tree[key].options.hasOwnProperty(annotationParam)) {
                        tree[key].options[annotationParam] = [];
                        tree[key].options[annotationParam].checked = true;
                    }
                    tree[key].options[annotationParam].push({
                        id: annotationRef.annotationID,
                        displayTitle: annotationRef.comments,
                        roi: annotationRef.roiIndex,
                        checked: true
                    });
                }
                annotationsMap[annotationRef.annotationID] = annotationRef;
                break;
            case "delete":
                for(var key in tree) {
                    annotation = annotationsMap[annotationRef];
                    var annotationParam = annotation[key] == "FREEFORM" ? "CLOSEDFREEFORM" : annotation[key],
                        subAnnotations = tree[key].options[annotationParam];
                    for(var i in subAnnotations) {
                        if(subAnnotations[i].id === annotation.annotationID) {
                            subAnnotations.splice(i, 1);
                        }
                    }
                }
                delete annotationsMap[annotationRef];
                break;
            case "edit":
                for(var key in tree) {
                    annotation = annotationsMap[annotationRef.annotationID];
                    annotation.comments = annotationRef.comments;
                    var annotationParam = annotation[key] == "FREEFORM" ? "CLOSEDFREEFORM" : annotation[key],
                        subAnnotations = tree[key].options[annotationParam];
                    for(var i in subAnnotations) {
                        if(subAnnotations[i].id === annotation.annotationID) {
                            subAnnotations[i].displayTitle = annotationRef.comments;
                        }
                    }
                }
                break;
        }
        return tree;
    };

    $.prototype.displayAnnotations = function (annotationsList) {
        annoBoard.removeAllAnnotations();
        var isSlideId = true,
            colorIndex = 0,
            currentROI = osdSettings.tileSources[this._sequenceIndex].roi,
            annotationColor;
        userColorMap = {};
        if(annotationsList && annotationsList.length > 0) {
            isSlideId = typeof annotationsList[0] !== "object";
        } else {
            //annotationsList = Object.keys(annotationsMap);
        }

        for(var index in annotationsList) {
            var annotationObj = {},
                annotation;

            if(isSlideId) {
                annotation = annotationsMap[annotationsList[index]];
            } else {
                annotation = annotationsList[index];
            }

            var user = annotation.actEmail;
            if(!userColorMap.hasOwnProperty(user) && !_isRemoteView) {
                annotationColor = annotationsColors[colorIndex%5];
                userColorMap[user] = annotationColor;
                colorIndex++;
            }
            if(annotation.roiIndex != currentROI) {
                continue;
            }

            annotationObj = getAnnotationCurrentZoom(annotation);
            annotationObj.comment = annotation.comments;
            annotationObj.user = annotation.userName;
            annotationObj.id = annotation.annotationID;
            if(annotationObj.type) {
                annoBoard.showAnnotation(annotationObj);
            }
            //anno.addAnnotation(annotationObj);
        }
        //currentROIAnnotations = anno.getAnnotations();
        return userColorMap;
    };

    function setImageChangeHandler() {
        osd.addHandler("page", function (event) {
            var seq = event.eventSource._sequenceIndex,
                roi = event.eventSource.tileSources[seq].roi,
                imageNo = osdSettings.roiImageMap[event.page],
                imageDetails = {
                    imageNo: imageNo,
                    roi: roi
                };
            annoBoard.setPixelToNanometer(event.eventSource.tileSources[seq].pixelToNanometer);
            console.log("setImageChangeHandler: " + JSON.stringify(imageDetails));
            setTimeout(function () {
                _imageChangeHandler(imageDetails);
            }, 2);
        });
    }

    function addAnnotationEvents() {
        annoBoard.parentElem.addEventListener("onAnnotationCreated", function(event) {
            var annotation = event.annotation,
                annotationObjToSave = {
                    comments: annotation.comment,
                    roiIndex: osdSettings.tileSources[osd._sequenceIndex].roi,
                    slideId: 0,
                    pointList: []
                },
                relativePt;

            switch(annotation.type) {
                case "Rectangular":
                    annotationObjToSave.type = "RECTANGLE";
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x, annotation.y));
                    //To Do: -1 multiplier needs to be reverted after h'bad demo
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x + annotation.width, annotation.y + annotation.height));
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    break;
                case "Circular":
                    annotationObjToSave.type = "CIRCLE";
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.centerX, annotation.centerY));
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.centerX + (annotation.radius / Math.sqrt(2)), annotation.centerY + (annotation.radius / Math.sqrt(2))));
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    break;
                case "Freeform":
                case "OpenFreeform":
                    annotationObjToSave.type = annotation.type === "Freeform" ? "FREEFORM" : "OPENFREEFORM";
                    for(var i in annotation.points) {
                        annotation.points[i].x = Math.ceil(annotation.points[i].x);
                        annotation.points[i].y = Math.ceil(annotation.points[i].y);
                        relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.points[i].x, annotation.points[i].y));
                        annotationObjToSave.pointList.push({
                            pointID: null,
                            pointX: Math.ceil(relativePt.x),
                            pointY: Math.ceil(-1*relativePt.y)
                        });
                    }
                    break;
                case "Ruler":
                case "Arrow":
                    annotationObjToSave.type = annotation.type.toUpperCase();
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x1, annotation.y1));
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    relativePt = osd.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(annotation.x2, annotation.y2));
                    annotationObjToSave.pointList.push({
                        pointID: null,
                        pointX: relativePt.x,
                        pointY: -1*relativePt.y
                    });
                    break;
            }
            var savePromise;
            if(annotation.marker) {
                annotation.slideId = annotationObjToSave.slideId;
                annotation.roi = annotationObjToSave.roiIndex;
                _annotationHandler.saveAnnotation(annotation);
            } else {
                savePromise = _annotationHandler.saveAnnotation(annotationObjToSave);
            }
            if(savePromise) {
                savePromise.then(function(resp) {
                    if(resp.status > -1) {
                        var newid = resp.annotationInfoList[0].annotationID;
                        annotation.id = newid;
                        annotation.user = resp.annotationInfoList[0].userName;
                        if(isRemoteModeOn) {
                            //convert points in 40x level
                            annotationObjToSave.id = newid;
                            remoteMethods.setAnnotationCreationData(annotationObjToSave);
                        }
                    } else {
                        annoBoard.deleteAnnotationOnOsd({annotation: annotation});
                        console.log("Save annotation failure");
                        console.log("Failure: " + JSON.stringify(resp));
                    }
                });
            }
        });
        annoBoard.parentElem.addEventListener("onAnnotationDeleted", function(event) {
            var annotation = event.annotation;
            if(_annotationHandler.hasOwnProperty('deleteAnnotation')) {
                var annotationObjectToDelete = {
                    annotationID: annotation.id
                };
                var deletePromise = _annotationHandler.deleteAnnotation(annotationObjectToDelete);
                if(deletePromise) {
                    deletePromise.then(function(resp) {
                        if(resp.status > -1) {
                            if(isRemoteModeOn) {
                                remoteMethods.setAnnotationRemovalData(annotation);
                            }
                        } else {
                            console.log("Delete annotation failure");
                            console.log("Failure in deleting annotation: " + JSON.stringify(data));
                        }
                    });
                }
            } else {
                console.log("user handler for deleting annotation not present");
            }
        });
        annoBoard.parentElem.addEventListener("onAnnotationEdited", function(event) {
            var annotation = event.annotation;
            if(_annotationHandler.hasOwnProperty('editAnnotation')) {
                var annotationObjectToEdit = {
                    id: annotation.id,
                    text: annotation.comment
                };
                var editPromise = _annotationHandler.editAnnotation(annotationObjectToEdit);
                if(editPromise) {
                    editPromise.then(function(resp) {
                        if(resp.status > -1) {
                            if(isRemoteModeOn) {
                                remoteMethods.setAnnotationUpdatedData(annotation);
                            }
                        } else {
                            console.log("Failure in updating annotation: " + JSON.stringify(data));
                        }
                    });
                }
            } else {
                console.log("user handler for deleting annotation not present");
            }
        });
        annoBoard.parentElem.addEventListener("onAnnotationCancel", function(event) {
            var annotation = event.annotation;
            if(_annotationHandler.hasOwnProperty('cancelAnnotation')) {
                _annotationHandler.cancelAnnotation(annotation);
            } else {
                console.log("user handler for cancelling annotation not present");
            }
        });
        isAnnoHandlerAlreadySet = true;
    }

    function displaySlideImage() {
        osd = OpenSeadragon(osdSettings);
        setRemoteConsultingMethods(osd);
        /*if (annoBoard) {
            annoBoard.destroyBoard();
        }
        annoBoard = {};*///new Annotation(osd);
        //annoBoard.setPixelToNanometer(osdSettings.tileSources[1].pixelToNanometer);
        /*if(!isAnnoHandlerAlreadySet) {
            addAnnotationEvents();
        }*/
        //setImageChangeHandler();

        var zoomElem = createZoomElement();
        osd.addHandler("zoom", function () {
            var zoom = osd.viewport.getZoom();
            maxOsdZoom = osd.viewport.getMaxZoom();
            zoomElem.textContent = "Zoom X" + (Math.round(zoom * 100 * osd.tileSources[osd._sequenceIndex].maxImgZoom / maxOsdZoom)) / 100+"x";
        });
        var canvasElem = document.getElementById('openseadragon').querySelector('.openseadragon-canvas');
        canvasElem.addEventListener("keypress", function(keyEvent) {
            if(keyEvent.which === 32) {
                osd.viewport.goHome(true);
                keyEvent.preventDefault();
            }
        });
        return osd;
    }
   return function(schemaURIs, canvasId, getOSDCallback, annotationHandlers, imageChangeHandler, showFullPageControl,imageName, OpenSeadragon) {
      window.OpenSeadragon = OpenSeadragon;
      alert("this is inner method");
      var canvasContainer = document.getElementById(canvasId);
        imgName = imageName;
        //get your webviewer html and toolbar
        //append as innerHTML
        //and pass on canvasId as new html one

        reinitializeSessionData();
        if(annotationHandlers) {
            _annotationHandler = annotationHandlers;
        } else {
            _annotationHandler = {};
        }
        if(imageChangeHandler) {
            _imageChangeHandler = imageChangeHandler;
        }
        osdSettings.showFullPageControl = showFullPageControl;

        if(typeof schemaURIs === 'string') {
            osdSettings.showReferenceStrip = false;
            _isRemoteView = false;
            listOfSlideURIs.push(schemaURIs);
        } else if(Array.isArray(schemaURIs)) {
            osdSettings.showReferenceStrip = true;
            _isRemoteView = true;
            listOfSlideURIs = schemaURIs;
        } else {
            _isRemoteView = false;
            console.log("getOSDViewer: Unsupported schemaURI data type");
            return;
        }
        osdSettings.id = canvasId;
        arrOfSchemas = [];

		for(var imageNo=listOfSlideURIs.length-1;imageNo>=0;imageNo--) {
            makeAjaxRequest(listOfSlideURIs[imageNo], "GET", getOSDCallback,imageNo,imageName);
        }
    };
};

function removeDisabledToolbarOverlay(){
    //document.getElementById('toolbarDiv').classList.toggle('fade');
    $('#toolbarDiv > div').not('.chatDiv').removeClass('fade1');
    var disabledOverlayDiv = document.getElementById('disabledOverlay');
    disabledOverlayDiv.parentNode.removeChild(disabledOverlayDiv);
}

function addDisabledToolbarOverlay(){
    if(!document.getElementById('disabledOverlay')) {
        var slideSource = document.getElementById('toolbarDiv');
        slideSource.classList.toggle('fade');
        $('#toolbarDiv > div').not('.chatDiv').addClass('fade1');
        var overlayDiv = document.createElement('div');
        overlayDiv.id = 'disabledOverlay';
        overlayDiv.className = 'disabledToolBarOverlay';
        document.getElementById('toolbarDiv').appendChild(overlayDiv);
    }
}

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // expose as amd module
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // expose as commonjs module
    module.exports = factory();
  } else {
    // expose as window.OpenSeadragon
    root.getOSDViewer = factory();
  }
}(this, function () {
  return getOSDViewer;
}));
