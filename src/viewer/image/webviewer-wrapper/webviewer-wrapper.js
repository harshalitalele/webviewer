function WebviewerWrapper (OpenSeadragon) {
  WebviewerWrapper.OSD = OpenSeadragon;
  return WebviewerWrapper.showSlideImage;
}

(function( ww ) {
  ww.log = function(msg) {
    console.log('Webviewer-wrapper: ' + msg);
  };

  ww.arrOfSchemas = [];
  ww.arrofDataTiles = [];

  var slideURI = "http://172.28.42.139:8090",
    defaultSettings = {
      elementId: 'openseadragon',
      slideIds: [],
      getOSDCallback: '',
      annotationHandlers: '',
      imageChangeHandler: '',
      OpenSeadragon: ''
    },
    osdSettings = {
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
    },
    defScale = 1.0,
    maxOsdZoom,
    minNavigatorScale = 1,
    minNavigatorLayer,
    scaleLevelMap = {
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

  //To Do: use correct regex here
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

  function getSlideURI(uriIndex) {
    return ww.imageIds[uriIndex];
  }

  function getTileUrls(level, x, y) {
    var ifdNum = ww.levelFolderMap[this.image][this.roi][level];
    if(ifdNum != undefined) {
      //To Do: webp -> jpg needs to be reverted after h'bad demo
      //To Do: x -> y needs to be reverted after h'bad demo
      if(ww.arrofDataTiles.length > 0 && ww.arrofDataTiles[this.image] && ww.arrofDataTiles[this.image].length > 0) {
        if(ifdNum == 0 || ifdNum == 1 || ifdNum == 2 || (ww.arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum] && ww.arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y] && (ww.arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y].indexOf(x) != -1))) {
          var best = "";
          return slideURI + "/tile?query="+getSlideURI(this.image)+":" + ifdNum + ":" + y + ":" + x;
        } else {
          return '';
        }
      } else {
        var best = "";
        return slideURI + "/tile?query="+getSlideURI(this.image)+":" + ifdNum + ":" + y + ":" + x;
      }
    }
    return '';
  }

  function getOverlayUrl(level, x ,y) {
    var ifdNum = ww.levelFolderMap[this.image][this.roi][level];
    if(ww.arrofDataTiles.length > 0 && ww.arrofDataTiles[this.image] && ww.arrofDataTiles[this.image].length > 0) {
      if(ifdNum == 0 || ifdNum == 1 || ifdNum == 2 || (ww.arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum] && ww.arrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y] && (aww.rrofDataTiles[this.image][this.roi].tileextractorTilesInfoParameter.d[ifdNum][y].indexOf(x) != -1))) {
        return slideURI + "/markTile?query=" + getSlideURI(this.image) + ":" + ifdNum + ":" + y + ":" + x;
      } else {
        return '';
      }
    } else {
      return slideURI + "/markTile?query=" + getSlideURI(this.image) + ":" + ifdNum + ":" + y + ":" + x;
    }
  }

  function getScaleLevelMargin(imgWd, imgHt) {
    var maxLevel = Math.ceil(Math.log( Math.max( imgWd, imgHt ) ) / Math.log( 2 ));
    return maxLevel - 17;
  }

  function setLevelFolderMap() {
    ww.levelFolderMap = [];
    ww.osdSettings.tileSources = [];
    ww.osdSettings.tileSourcesReferenceStrip = [];
    ww.osdSettings.roiImageMap = [];
    var currentImage = 0; //to add image into sequence mode, and support getTileURLs method to handle multiple images with custom tiles
    var ROIsNavheight = new Array();
    var ROIsNavWidth =  new Array();
    var navigatorHeightTh = "200"; //threshold height of navigator
    var navigatorWidthTh = "250"; //threshold width of navigator
    for(var schemaArrayIndex  in ww.arrOfSchemas) {
      var schema = ww.arrOfSchemas[schemaArrayIndex],
        slideDetails = schema.slideImage,
        numOfROIs = parseInt(slideDetails.numOfROIs),
        levelFolderMapImage = [],
        currentROI = 0,
        imageProfile = slideDetails.imageProfiles.imageProfile;

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
            ww.osdSettings.tileSources.push(tilesrc);
            if(currentROI == 0) {
              tilesrc.isSlideThumbnail = true;
              ww.osdSettings.tileSourcesReferenceStrip.push(tilesrc)
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
        ww.osdSettings.roiImageMap.push(currentImage);
        currentROI++;
        levelFolderMapImage.push(levelFolderMapRoi);
      }
      currentImage++;

      ww.levelFolderMap.push(levelFolderMapImage);
    }
    var maxH = Math.max.apply(this, ROIsNavheight);
    var maxW = Math.max.apply(this, ROIsNavWidth);
    if(maxH > navigatorHeightTh) {
      ww.osdSettings.navigatorHeight = maxH+"px";
    } else {
      ww.osdSettings.navigatorHeight = navigatorHeightTh+"px";
    }
    if(maxW > navigatorWidthTh) {
      ww.osdSettings.navigatorWidth = maxW+"px";
    } else {
      ww.osdSettings.navigatorWidth = navigatorWidthTh+"px";
    }

    console.log(ww.levelFolderMap);
    return ww.levelFolderMap;
  }

  function updateOsdSettings() {
    var refIndexStart = 0;
    var refIndexEnd = 0;
    for(var schemaArrayIndex  in ww.arrOfSchemas) {
      var schema = ww.arrOfSchemas[schemaArrayIndex];

      refIndexStart = refIndexEnd;// schema.slideImage.slideDetails.numOfROIs
      refIndexEnd = parseInt(schema.slideImage.numOfROIs) + refIndexStart ;

      var tileSourceOsd = ww.osdSettings.tileSources;

      for (var tileSourceOsdIndex in tileSourceOsd) {
        if(tileSourceOsdIndex>=refIndexStart && tileSourceOsdIndex< refIndexEnd)
          tileSourceOsd[tileSourceOsdIndex].tileSize = parseInt(schema.slideImage.tileWidth);
      }

      var tileSourceReferenceStripOsd = ww.osdSettings.tileSourcesReferenceStrip;
      tileSourceReferenceStripOsd[schemaArrayIndex].tileSize = parseInt(schema.slideImage.tileWidth);

    }
  }

  function displaySlideImage() {
    var osd = ww.OSD(ww.osdSettings);
    return osd;
  }

  function processSchemaInfo(getOSDCallback){
    ww.tileSize = parseInt(ww.arrOfSchemas[0].slideImage.tileWidth);
    setLevelFolderMap();
    updateOsdSettings();
    var osd = displaySlideImage();
    getOSDCallback(osd);
  }

  function loadDataTilesSchema (imageNo, requestType, url, getOSDCallback, ROI) {
    if (window.XMLHttpRequest) {
      // code for modern browsers
      xmlhttp = new XMLHttpRequest();
    } else {
      // code for old IE browsers
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var url_send = url + "/ROI_" + ROI + ".json";
    xmlhttp.open(requestType, url_send, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if(this.status == 200 || this.status == 300) {
          ww.arrofDataTiles[imageNo][ROI] = JSON.parse(this.responseText);
          if(ROI == 1 && imageNo == 0) {
            processSchemaInfo(getOSDCallback);
          }
        } else {
          if(ROI == 1 && imageNo == 0) {
            processSchemaInfo(getOSDCallback);
          }
        }
      }
    };
  }

  function makeAjaxRequest(imageNo, slideId, requestType, getOSDCallback) {
    var xmlhttp;

    if (window.XMLHttpRequest) {
      // code for modern browsers
      xmlhttp = new XMLHttpRequest();
    } else {
      // code for old IE browsers
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var url =  slideURI + '/schema?query=' + slideId;
    if(!isUrlValid(url)) {
      return;
    }
    xmlhttp.open(requestType, url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if(this.status == 200 || this.status == 300) {
          const schema = JSON.parse(this.responseText);
          ww.arrOfSchemas[imageNo] = schema;
          for(var r = --schema.slideImage.numOfROIs; r > 0; r--) {
            loadDataTilesSchema(imageNo, requestType, slideURI, getOSDCallback, r);
          }
        } else {
          ww.log("Error in AJAX call requesting schema for " + slideId);
        }
      }
    };
  }

  ww.showSlideImage = function ( viewerSettings ) {

    viewerSettings = Object.assign(defaultSettings, viewerSettings);
    ww.osdSettings = JSON.parse(JSON.stringify(osdSettings));
    ww.osdSettings.id = viewerSettings.elementId;

    if(!ww.OSD) {
      ww.log('OpenSeadragon is not accessible inside webviewer-wrapper');
    } else {
      ww.imageIds = viewerSettings.slideIds;
      for(let imageNo = ww.imageIds.length-1; imageNo >= 0; imageNo--) {
        makeAjaxRequest(imageNo, ww.imageIds[imageNo], "GET", viewerSettings.getOSDCallback);
      }
    }
  }
} ( WebviewerWrapper ));

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // expose as amd module
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // expose as commonjs module
    module.exports = factory();
  } else {
    root.WebviewerWrapper = factory();
  }
} (this, function () {
  return WebviewerWrapper;
}));

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
