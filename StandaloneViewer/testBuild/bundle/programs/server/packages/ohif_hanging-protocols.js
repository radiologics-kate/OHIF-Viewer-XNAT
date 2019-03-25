(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var Router = Package['clinical:router'].Router;
var RouteController = Package['clinical:router'].RouteController;
var moment = Package['momentjs:moment'].moment;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Iron = Package['iron:core'].Iron;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Log = Package.logging.Log;
var Tracker = Package.deps.Tracker;
var Deps = Package.deps.Deps;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var HP, HangingProtocols, indexToRemove;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:hanging-protocols":{"both":{"namespace.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/namespace.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
HP = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collections.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/collections.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
HangingProtocols = new Meteor.Collection('hangingprotocols');
HangingProtocols._debugName = 'HangingProtocols';
HangingProtocols.allow({
  insert: function () {
    return true;
  },
  update: function () {
    return true;
  },
  remove: function () {
    return true;
  }
}); // @TODO: Remove this after stabilizing ProtocolEngine

if (Meteor.isDevelopment && Meteor.isServer) {
  Meteor.startup(() => {
    HangingProtocols.remove({});
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"schema.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/schema.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.watch(require("./classes/Protocol"));
module.watch(require("./classes/Stage"));
module.watch(require("./classes/Viewport"));
module.watch(require("./classes/ViewportStructure"));
module.watch(require("./classes/rules/ProtocolMatchingRule"));
module.watch(require("./classes/rules/StudyMatchingRule"));
module.watch(require("./classes/rules/SeriesMatchingRule"));
module.watch(require("./classes/rules/ImageMatchingRule"));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hardcodedData.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/hardcodedData.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
HP.attributeDefaults = {
  abstractPriorValue: 0
};
HP.displaySettings = {
  invert: {
    id: 'invert',
    text: 'Show Grayscale Inverted',
    defaultValue: 'NO',
    options: ['YES', 'NO']
  }
}; // @TODO Fix abstractPriorValue comparison

HP.studyAttributes = [{
  id: 'x00100020',
  text: '(x00100020) Patient ID'
}, {
  id: 'x0020000d',
  text: '(x0020000d) Study Instance UID'
}, {
  id: 'x00080020',
  text: '(x00080020) Study Date'
}, {
  id: 'x00080030',
  text: '(x00080030) Study Time'
}, {
  id: 'x00081030',
  text: '(x00081030) Study Description'
}, {
  id: 'abstractPriorValue',
  text: 'Abstract Prior Value'
}];
HP.protocolAttributes = [{
  id: 'x00100020',
  text: '(x00100020) Patient ID'
}, {
  id: 'x0020000d',
  text: '(x0020000d) Study Instance UID'
}, {
  id: 'x00080020',
  text: '(x00080020) Study Date'
}, {
  id: 'x00080030',
  text: '(x00080030) Study Time'
}, {
  id: 'x00081030',
  text: '(x00081030) Study Description'
}, {
  id: 'anatomicRegion',
  text: 'Anatomic Region'
}];
HP.seriesAttributes = [{
  id: 'x0020000e',
  text: '(x0020000e) Series Instance UID'
}, {
  id: 'x00080060',
  text: '(x00080060) Modality'
}, {
  id: 'x00200011',
  text: '(x00200011) Series Number'
}, {
  id: 'x0008103e',
  text: '(x0008103e) Series Description'
}, {
  id: 'numImages',
  text: 'Number of Images'
}];
HP.instanceAttributes = [{
  id: 'x00080016',
  text: '(x00080016) SOP Class UID'
}, {
  id: 'x00080018',
  text: '(x00080018) SOP Instance UID'
}, {
  id: 'x00185101',
  text: '(x00185101) View Position'
}, {
  id: 'x00200013',
  text: '(x00200013) Instance Number'
}, {
  id: 'x00080008',
  text: '(x00080008) Image Type'
}, {
  id: 'x00181063',
  text: '(x00181063) Frame Time'
}, {
  id: 'x00200060',
  text: '(x00200060) Laterality'
}, {
  id: 'x00541330',
  text: '(x00541330) Image Index'
}, {
  id: 'x00280004',
  text: '(x00280004) Photometric Interpretation'
}, {
  id: 'x00180050',
  text: '(x00180050) Slice Thickness'
}];
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"testData.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/testData.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
function getDefaultProtocol() {
  var protocol = new HP.Protocol('Default');
  protocol.id = 'defaultProtocol';
  protocol.locked = true;
  var oneByOne = new HP.ViewportStructure('grid', {
    rows: 1,
    columns: 1
  });
  var viewport = new HP.Viewport();
  var first = new HP.Stage(oneByOne, 'oneByOne');
  first.viewports.push(viewport);
  protocol.stages.push(first);
  HP.defaultProtocol = protocol;
  return HP.defaultProtocol;
}

function getMRTwoByTwoTest() {
  var proto = new HP.Protocol('MR_TwoByTwo');
  proto.id = 'MR_TwoByTwo';
  proto.locked = true; // Use http://localhost:3000/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78

  var studyInstanceUid = new HP.ProtocolMatchingRule('studyInstanceUid', {
    equals: {
      value: '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    }
  }, true);
  proto.addProtocolMatchingRule(studyInstanceUid);
  var oneByTwo = new HP.ViewportStructure('grid', {
    rows: 1,
    columns: 2
  }); // Stage 1

  var left = new HP.Viewport();
  var right = new HP.Viewport();
  var firstSeries = new HP.SeriesMatchingRule('seriesNumber', {
    equals: {
      value: 1
    }
  });
  var secondSeries = new HP.SeriesMatchingRule('seriesNumber', {
    equals: {
      value: 2
    }
  });
  var thirdImage = new HP.ImageMatchingRule('instanceNumber', {
    equals: {
      value: 3
    }
  });
  left.seriesMatchingRules.push(firstSeries);
  left.imageMatchingRules.push(thirdImage);
  right.seriesMatchingRules.push(secondSeries);
  right.imageMatchingRules.push(thirdImage);
  var first = new HP.Stage(oneByTwo, 'oneByTwo');
  first.viewports.push(left);
  first.viewports.push(right);
  proto.stages.push(first); // Stage 2

  var twoByOne = new HP.ViewportStructure('grid', {
    rows: 2,
    columns: 1
  });
  var left2 = new HP.Viewport();
  var right2 = new HP.Viewport();
  var fourthSeries = new HP.SeriesMatchingRule('seriesNumber', {
    equals: {
      value: 4
    }
  });
  var fifthSeries = new HP.SeriesMatchingRule('seriesNumber', {
    equals: {
      value: 5
    }
  });
  left2.seriesMatchingRules.push(fourthSeries);
  left2.imageMatchingRules.push(thirdImage);
  right2.seriesMatchingRules.push(fifthSeries);
  right2.imageMatchingRules.push(thirdImage);
  var second = new HP.Stage(twoByOne, 'twoByOne');
  second.viewports.push(left2);
  second.viewports.push(right2);
  proto.stages.push(second);
  HP.testProtocol = proto;
  return HP.testProtocol;
}

function getDemoProtocols() {
  HP.demoProtocols = [];
  /**
   * Demo #1
   */

  HP.demoProtocols.push({
    "id": "demoProtocol1",
    "locked": false,
    "name": "DFCI-CT-CHEST-COMPARE",
    "createdDate": "2017-02-14T16:07:09.033Z",
    "modifiedDate": "2017-02-14T16:18:43.930Z",
    "availableTo": {},
    "editableBy": {},
    "protocolMatchingRules": [{
      "id": "7tmuq7KzDMCWFeapc",
      "weight": 2,
      "required": false,
      "attribute": "x00081030",
      "constraint": {
        "contains": {
          "value": "DFCI CT CHEST"
        }
      }
    }],
    "stages": [{
      "id": "v5PfGt9F6mffZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "2.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "2.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "XTzu8HB3feep3HYKs",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "3.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "3.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:12.085Z"
    }, {
      "id": "3yPYNaeFtr76Qz3jq",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 2,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {
          "wlPreset": "Lung"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 3.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "6vdBRZYnqmmosipph",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "SxfTyhGcMhr56PtPM",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }, {
        "viewportSettings": {
          "wlPreset": "Lung"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "FTAyChZCPW68yJjXD",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 3.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "gMJjfrbsqYNbErPx5",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:11:40.489Z"
    }],
    "numberOfPriorsReferenced": 4
  });
  /**
   * Demo #2
   */

  HP.demoProtocols.push({
    "id": "demoProtocol2",
    "locked": false,
    "name": "DFCI-CT-CHEST-COMPARE-2",
    "createdDate": "2017-02-14T16:07:09.033Z",
    "modifiedDate": "2017-02-14T16:18:43.930Z",
    "availableTo": {},
    "editableBy": {},
    "protocolMatchingRules": [{
      "id": "7tmuq7KzDMCWFeapc",
      "weight": 2,
      "required": false,
      "attribute": "x00081030",
      "constraint": {
        "contains": {
          "value": "DFCI CT CHEST"
        }
      }
    }],
    "stages": [{
      "id": "v5PfGt9F6mffZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mac",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "2.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYc",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "2.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnXTByWnPt",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "XTzu8HB3feep3HYKs",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }, {
          "id": "mYnsCcNwZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 5.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }, {
          "id": "ygz4nb29iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 5.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:12.085Z"
    }, {
      "id": "3yPYNaeFtr76Qz3jq",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 2,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7mtr",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }, {
          "id": "jXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 5.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {
          "wlPreset": "Lung"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "ygz4nb28iJZcJhnYb",
          "weight": 2,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 3.0"
            }
          }
        }, {
          "id": "ycz4nb28iJZcJhnYa",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 5.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "6vdBRZYnqmmosipph",
          "weight": 2,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }, {
          "id": "6vdBRFYnqmmosipph",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 5.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "SxfTyhGcMhr56PtPM",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }, {
        "viewportSettings": {
          "wlPreset": "Lung"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "FTAyChZCPW68yJjXD",
          "weight": 2,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 3.0"
            }
          }
        }, {
          "id": "DTAyChZCPW68yJjXD",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 5.0"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "gMJjfrbsqYNbErPx5",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:11:40.489Z"
    }],
    "numberOfPriorsReferenced": 1
  });
  /**
   * Demo: screenCT
   */

  HP.demoProtocols.push({
    "id": "screenCT",
    "locked": false,
    "name": "DFCI-CT-CHEST-SCREEN",
    "createdDate": "2017-02-14T16:07:09.033Z",
    "modifiedDate": "2017-02-14T16:18:43.930Z",
    "availableTo": {},
    "editableBy": {},
    "protocolMatchingRules": [{
      "id": "7tmuq7KzDMCWFeapc",
      "weight": 2,
      "required": false,
      "attribute": "x00081030",
      "constraint": {
        "contains": {
          "value": "DFCI CT CHEST"
        }
      }
    }],
    "stages": [{
      "id": "v5PfGt9F6mffZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 1
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL55z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "2.0"
            }
          }
        }],
        "studyMatchingRules": []
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F4mffZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 2,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7nTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 5.0"
            }
          }
        }, {
          "id": "mXnsCcNzZL56z7rTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 3.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56r7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 5.0"
            }
          }
        }, {
          "id": "mXnsCcNzZL56a7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Lung 3.0"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcRzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 4.0"
            }
          }
        }, {
          "id": "mXnsCcNzTL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Coronal"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcMzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Body 4.0"
            }
          }
        }, {
          "id": "mXnsCcAzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Sagittal"
            }
          }
        }],
        "studyMatchingRules": []
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }],
    "numberOfPriorsReferenced": 0
  });
  /**
   * Demo: PETCTSCREEN
   */

  HP.demoProtocols.push({
    "id": "PETCTSCREEN",
    "locked": false,
    "name": "PETCT-SCREEN",
    "createdDate": "2017-02-14T16:07:09.033Z",
    "modifiedDate": "2017-02-14T16:18:43.930Z",
    "availableTo": {},
    "editableBy": {},
    "protocolMatchingRules": [{
      "id": "7tmuqgKzDMCWFeapc",
      "weight": 5,
      "required": false,
      "attribute": "x00081030",
      "constraint": {
        "contains": {
          "value": "PETCT"
        }
      }
    }],
    "stages": [{
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcAzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZR56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }, {
          "id": "mRnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x00200011",
          "constraint": {
            "numericality": {
              "greaterThanOrEqualTo": 2
            }
          }
        }],
        "studyMatchingRules": []
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsGcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Corrected"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsHcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT WB"
            }
          }
        }],
        "studyMatchingRules": []
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {
          "invert": "YES"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXneCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Uncorrected"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCuNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT Nk"
            }
          }
        }],
        "studyMatchingRules": []
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }],
    "numberOfPriorsReferenced": 0
  });
  /**
   * Demo: PETCTCOMPARE
   */

  HP.demoProtocols.push({
    "id": "PETCTCOMPARE",
    "locked": false,
    "name": "PETCT-COMPARE",
    "createdDate": "2017-02-14T16:07:09.033Z",
    "modifiedDate": "2017-02-14T16:18:43.930Z",
    "availableTo": {},
    "editableBy": {},
    "protocolMatchingRules": [{
      "id": "7tmuqgKzDMCWFeapc",
      "weight": 5,
      "required": false,
      "attribute": "x00081030",
      "constraint": {
        "contains": {
          "value": "PETCT"
        }
      }
    }],
    "stages": [{
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL59z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7lTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTbnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 1,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNjZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }, {
          "id": "mXnsCcNzZL56z7gTZ",
          "weight": 1,
          "required": false,
          "attribute": "x00200011",
          "constraint": {
            "numericality": {
              "greaterThanOrEqualTo": 2
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcCzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "Topogram"
            }
          }
        }, {
          "id": "mXnsCcNzZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x00200011",
          "constraint": {
            "numericality": {
              "greaterThanOrEqualTo": 2
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvn1TByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 2,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL26z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Corrected"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL46z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT WB"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL57z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Corrected"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnYTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZQ56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT WB"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgLTvnKTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }, {
      "id": "v5PfGt9F6mFgZPif5",
      "name": "oneByOne",
      "viewportStructure": {
        "type": "grid",
        "properties": {
          "rows": 2,
          "columns": 2
        },
        "layoutTemplateName": "gridLayout"
      },
      "viewports": [{
        "viewportSettings": {
          "invert": "YES"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZL56z7nTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Uncorrected"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNxZL56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT Nk"
            }
          }
        }],
        "studyMatchingRules": []
      }, {
        "viewportSettings": {
          "invert": "YES"
        },
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZA56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "PET WB Uncorrected"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgHTvnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }, {
        "viewportSettings": {},
        "imageMatchingRules": [],
        "seriesMatchingRules": [{
          "id": "mXnsCcNzZP56z7mTZ",
          "weight": 1,
          "required": false,
          "attribute": "x0008103e",
          "constraint": {
            "contains": {
              "value": "CT Nk"
            }
          }
        }],
        "studyMatchingRules": [{
          "id": "uDoEgITvnXTByWnPz",
          "weight": 1,
          "required": false,
          "attribute": "abstractPriorValue",
          "constraint": {
            "equals": {
              "value": 1
            }
          }
        }]
      }],
      "createdDate": "2017-02-14T16:07:09.033Z"
    }],
    "numberOfPriorsReferenced": 1
  });
}

getDefaultProtocol(); //getMRTwoByTwoTest();
//getDemoProtocols();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"classes":{"Protocol.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/Protocol.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 2);
let removeFromArray;
module.watch(require("../lib/removeFromArray"), {
  removeFromArray(v) {
    removeFromArray = v;
  }

}, 3);

/**
 * This class represents a Hanging Protocol at the highest level
 *
 * @type {Protocol}
 */
HP.Protocol = class Protocol {
  /**
   * The Constructor for the Class to create a Protocol with the bare
   * minimum information
   *
   * @param name The desired name for the Protocol
   */
  constructor(name) {
    // Create a new UUID for this Protocol
    this.id = Random.id(); // Store a value which determines whether or not a Protocol is locked
    // This is probably temporary, since we will eventually have role / user
    // checks for editing. For now we just need it to prevent changes to the
    // default protocols.

    this.locked = false; // Boolean value to indicate if the protocol has updated priors information
    // it's set in "updateNumberOfPriorsReferenced" function

    this.hasUpdatedPriorsInformation = false; // Apply the desired name

    this.name = name; // Set the created and modified dates to Now

    this.createdDate = new Date();
    this.modifiedDate = new Date(); // If we are logged in while creating this Protocol,
    // store this information as well

    if (OHIF.user && OHIF.user.userLoggedIn && OHIF.user.userLoggedIn()) {
      this.createdBy = OHIF.user.getUserId();
      this.modifiedBy = OHIF.user.getUserId();
    } // Create two empty Sets specifying which roles
    // have read and write access to this Protocol


    this.availableTo = new Set();
    this.editableBy = new Set(); // Define empty arrays for the Protocol matching rules
    // and Stages

    this.protocolMatchingRules = [];
    this.stages = []; // Define auxiliary values for priors

    this.numberOfPriorsReferenced = -1;
  }

  getNumberOfPriorsReferenced(skipCache = false) {
    let numberOfPriorsReferenced = skipCache !== true ? this.numberOfPriorsReferenced : -1; // Check if information is cached already

    if (numberOfPriorsReferenced > -1) {
      return numberOfPriorsReferenced;
    }

    numberOfPriorsReferenced = 0; // Search each study matching rule for prior rules
    // Each stage can have many viewports that can have
    // multiple study matching rules.

    this.stages.forEach(stage => {
      if (!stage.viewports) {
        return;
      }

      stage.viewports.forEach(viewport => {
        if (!viewport.studyMatchingRules) {
          return;
        }

        viewport.studyMatchingRules.forEach(rule => {
          // If the current rule is not a priors rule, it will return -1 then numberOfPriorsReferenced will continue to be 0
          const priorsReferenced = rule.getNumberOfPriorsReferenced();

          if (priorsReferenced > numberOfPriorsReferenced) {
            numberOfPriorsReferenced = priorsReferenced;
          }
        });
      });
    });
    this.numberOfPriorsReferenced = numberOfPriorsReferenced;
    return numberOfPriorsReferenced;
  }

  updateNumberOfPriorsReferenced() {
    this.getNumberOfPriorsReferenced(true);
  }
  /**
   * Method to update the modifiedDate when the Protocol
   * has been changed
   */


  protocolWasModified() {
    // If we are logged in while modifying this Protocol,
    // store this information as well
    if (OHIF.user && OHIF.user.userLoggedIn && OHIF.user.userLoggedIn()) {
      this.modifiedBy = OHIF.user.getUserId();
    } // Protocol has been modified, so mark priors information
    // as "outdated"


    this.hasUpdatedPriorsInformation = false; // Update number of priors referenced info

    this.updateNumberOfPriorsReferenced(); // Update the modifiedDate with the current Date/Time

    this.modifiedDate = new Date();
  }
  /**
   * Occasionally the Protocol class needs to be instantiated from a JavaScript Object
   * containing the Protocol data. This function fills in a Protocol with the Object
   * data.
   *
   * @param input A Protocol as a JavaScript Object, e.g. retrieved from MongoDB or JSON
   */


  fromObject(input) {
    // Check if the input already has an ID
    // If so, keep it. It not, create a new UUID
    this.id = input.id || Random.id(); // Assign the input name to the Protocol

    this.name = input.name; // Retrieve locked status, use !! to make it truthy
    // so that undefined values will be set to false

    this.locked = !!input.locked; // TODO: Check how to regenerate Set from Object
    //this.availableTo = new Set(input.availableTo);
    //this.editableBy = new Set(input.editableBy);
    // If the input contains Protocol matching rules

    if (input.protocolMatchingRules) {
      input.protocolMatchingRules.forEach(ruleObject => {
        // Create new Rules from the stored data
        var rule = new HP.ProtocolMatchingRule();
        rule.fromObject(ruleObject); // Add them to the Protocol

        this.protocolMatchingRules.push(rule);
      });
    } // If the input contains data for various Stages in the
    // display set sequence


    if (input.stages) {
      input.stages.forEach(stageObject => {
        // Create Stages from the stored data
        var stage = new HP.Stage();
        stage.fromObject(stageObject); // Add them to the Protocol

        this.stages.push(stage);
      });
    }
  }
  /**
   * Creates a clone of the current Protocol with a new name
   *
   * @param name
   * @returns {Protocol|*}
   */


  createClone(name) {
    // Create a new JavaScript independent of the current Protocol
    var currentProtocol = Object.assign({}, this); // Create a new Protocol to return

    var clonedProtocol = new HP.Protocol(); // Apply the desired properties

    currentProtocol.id = clonedProtocol.id;
    clonedProtocol.fromObject(currentProtocol); // If we have specified a name, assign it

    if (name) {
      clonedProtocol.name = name;
    } // Unlock the clone


    clonedProtocol.locked = false; // Return the cloned Protocol

    return clonedProtocol;
  }
  /**
   * Adds a Stage to this Protocol's display set sequence
   *
   * @param stage
   */


  addStage(stage) {
    this.stages.push(stage); // Update the modifiedDate and User that last
    // modified this Protocol

    this.protocolWasModified();
  }
  /**
   * Adds a Rule to this Protocol's array of matching rules
   *
   * @param rule
   */


  addProtocolMatchingRule(rule) {
    this.protocolMatchingRules.push(rule); // Update the modifiedDate and User that last
    // modified this Protocol

    this.protocolWasModified();
  }
  /**
   * Removes a Rule from this Protocol's array of matching rules
   *
   * @param rule
   */


  removeProtocolMatchingRule(rule) {
    var wasRemoved = removeFromArray(this.protocolMatchingRules, rule); // Update the modifiedDate and User that last
    // modified this Protocol

    if (wasRemoved) {
      this.protocolWasModified();
    }
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rule.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/Rule.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  Rule: () => Rule
});
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let comparators;
module.watch(require("../lib/comparators"), {
  comparators(v) {
    comparators = v;
  }

}, 1);
const EQUALS_REGEXP = /^equals$/;
/**
 * This Class represents a Rule to be evaluated given a set of attributes
 * Rules have:
 * - An attribute (e.g. 'seriesDescription')
 * - A constraint Object, in the form required by Validate.js:
 *
 * rule.constraint = {
 *   contains: {
 *      value: 'T-1'
 *      }
 *   };
 *
 *  Note: In this example we use the 'contains' Validator, which is a custom Validator defined in Viewerbase
 *
 * - A value for whether or not they are Required to be matched (default: False)
 * - A value for their relative weighting during Protocol or Image matching (default: 1)
 */

class Rule {
  /**
   * The Constructor for the Class to create a Rule with the bare
   * minimum information
   *
   * @param name The desired name for the Rule
   */
  constructor(attribute, constraint, required, weight) {
    // Create a new UUID for this Rule
    this.id = Random.id(); // Set the Rule's weight (defaults to 1)

    this.weight = weight || 1; // If an attribute is specified, assign it

    if (attribute) {
      this.attribute = attribute;
    } // If a constraint is specified, assign it


    if (constraint) {
      this.constraint = constraint;
    } // If a value for 'required' is specified, assign it


    if (required === undefined) {
      // If no value was specified, default to False
      this.required = false;
    } else {
      this.required = required;
    } // Cache for constraint info object


    this._constraintInfo = void 0; // Cache for validator and value object

    this._validatorAndValue = void 0;
  }
  /**
   * Occasionally the Rule class needs to be instantiated from a JavaScript Object.
   * This function fills in a Protocol with the Object data.
   *
   * @param input A Rule as a JavaScript Object, e.g. retrieved from MongoDB or JSON
   */


  fromObject(input) {
    // Check if the input already has an ID
    // If so, keep it. It not, create a new UUID
    this.id = input.id || Random.id(); // Assign the specified input data to the Rule

    this.required = input.required;
    this.weight = input.weight;
    this.attribute = input.attribute;
    this.constraint = input.constraint;
  }
  /**
   * Get the constraint info object for the current constraint
   * @return {Object\undefined} Constraint object or undefined if current constraint 
   *                            is not valid or not found in comparators list
   */


  getConstraintInfo() {
    let constraintInfo = this._constraintInfo; // Check if info is cached already

    if (constraintInfo !== void 0) {
      return constraintInfo;
    }

    const ruleConstraint = Object.keys(this.constraint)[0];

    if (ruleConstraint !== void 0) {
      constraintInfo = comparators.find(comparator => ruleConstraint === comparator.id);
    } // Cache this information for later use


    this._constraintInfo = constraintInfo;
    return constraintInfo;
  }
  /**
  * Check if current rule is related to priors
  * @return {Boolean} True if a rule is related to priors or false otherwise
  */


  isRuleForPrior() {
    // @TODO: Should we check this too? this.attribute === 'relativeTime'
    return this.attribute === 'abstractPriorValue';
  }
  /**
   * If the current rule is a rule for priors, returns the number of referenced priors. Otherwise, returns -1.
   * @return {Number} The number of referenced priors or -1 if not applicable. Returns zero if the actual value could not be determined.
   */


  getNumberOfPriorsReferenced() {
    if (!this.isRuleForPrior()) {
      return -1;
    } // Get rule's validator and value


    const ruleValidatorAndValue = this.getConstraintValidatorAndValue();
    const {
      value,
      validator
    } = ruleValidatorAndValue;
    const intValue = parseInt(value, 10) || 0; // avoid possible NaN
    // "Equal to" validators

    if (EQUALS_REGEXP.test(validator)) {
      // In this case, -1 (the oldest prior) indicates that at least one study is used
      return intValue < 0 ? 1 : intValue;
    } // Default cases return value


    return 0;
  }
  /**
   * Get the constraint validator and value
   * @return {Object|undefined} Returns an object containing the validator and it's value or undefined
   */


  getConstraintValidatorAndValue() {
    let validatorAndValue = this._validatorAndValue; // Check if validator and value are cached already

    if (validatorAndValue !== void 0) {
      return validatorAndValue;
    } // Get the constraint info object


    const constraintInfo = this.getConstraintInfo(); // Constraint info object exists and is valid

    if (constraintInfo !== void 0) {
      const validator = constraintInfo.validator;
      const currentValidator = this.constraint[validator];

      if (currentValidator) {
        const constraintValidator = constraintInfo.validatorOption;
        const constraintValue = currentValidator[constraintValidator];
        validatorAndValue = {
          value: constraintValue,
          validator: constraintInfo.id
        };
        this._validatorAndValue = validatorAndValue;
      }
    }

    return validatorAndValue;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Stage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/Stage.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);

/**
 * A Stage is one step in the Display Set Sequence for a Hanging Protocol
 *
 * Stages are defined as a ViewportStructure and an array of Viewports
 *
 * @type {Stage}
 */
HP.Stage = class Stage {
  constructor(ViewportStructure, name) {
    // Create a new UUID for this Stage
    this.id = Random.id(); // Assign the name and ViewportStructure provided

    this.name = name;
    this.viewportStructure = ViewportStructure; // Create an empty array for the Viewports

    this.viewports = []; // Set the created date to Now

    this.createdDate = new Date();
  }
  /**
   * Creates a clone of the current Stage with a new name
   *
   * Note! This method absolutely cannot be renamed 'clone', because
   * Minimongo's insert method uses 'clone' internally and this
   * somehow causes very bizarre behaviour
   *
   * @param name
   * @returns {Stage|*}
   */


  createClone(name) {
    // Create a new JavaScript independent of the current Protocol
    var currentStage = Object.assign({}, this); // Create a new Stage to return

    var clonedStage = new HP.Stage(); // Assign the desired properties

    currentStage.id = clonedStage.id;
    clonedStage.fromObject(currentStage); // If we have specified a name, assign it

    if (name) {
      clonedStage.name = name;
    } // Return the cloned Stage


    return clonedStage;
  }
  /**
   * Occasionally the Stage class needs to be instantiated from a JavaScript Object.
   * This function fills in a Protocol with the Object data.
   *
   * @param input A Stage as a JavaScript Object, e.g. retrieved from MongoDB or JSON
   */


  fromObject(input) {
    // Check if the input already has an ID
    // If so, keep it. It not, create a new UUID
    this.id = input.id || Random.id(); // Assign the input name to the Stage

    this.name = input.name; // If a ViewportStructure is present in the input, add it from the
    // input data

    this.viewportStructure = new HP.ViewportStructure();
    this.viewportStructure.fromObject(input.viewportStructure); // If any viewports are present in the input object

    if (input.viewports) {
      input.viewports.forEach(viewportObject => {
        // Create a new Viewport with their data
        var viewport = new HP.Viewport();
        viewport.fromObject(viewportObject); // Add it to the viewports array

        this.viewports.push(viewport);
      });
    }
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Viewport.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/Viewport.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let removeFromArray;
module.watch(require("../lib/removeFromArray"), {
  removeFromArray(v) {
    removeFromArray = v;
  }

}, 0);

/**
 * This Class defines a Viewport in the Hanging Protocol Stage. A Viewport contains
 * arrays of Rules that are matched in the ProtocolEngine in order to determine which
 * images should be hung.
 *
 * @type {Viewport}
 */
HP.Viewport = class Viewport {
  constructor() {
    this.viewportSettings = {};
    this.imageMatchingRules = [];
    this.seriesMatchingRules = [];
    this.studyMatchingRules = [];
  }
  /**
   * Occasionally the Viewport class needs to be instantiated from a JavaScript Object.
   * This function fills in a Viewport with the Object data.
   *
   * @param input The Viewport as a JavaScript Object, e.g. retrieved from MongoDB or JSON
   */


  fromObject(input) {
    // If ImageMatchingRules exist, create them from the Object data
    // and add them to the Viewport's imageMatchingRules array
    if (input.imageMatchingRules) {
      input.imageMatchingRules.forEach(ruleObject => {
        var rule = new HP.ImageMatchingRule();
        rule.fromObject(ruleObject);
        this.imageMatchingRules.push(rule);
      });
    } // If SeriesMatchingRules exist, create them from the Object data
    // and add them to the Viewport's seriesMatchingRules array


    if (input.seriesMatchingRules) {
      input.seriesMatchingRules.forEach(ruleObject => {
        var rule = new HP.SeriesMatchingRule();
        rule.fromObject(ruleObject);
        this.seriesMatchingRules.push(rule);
      });
    } // If StudyMatchingRules exist, create them from the Object data
    // and add them to the Viewport's studyMatchingRules array


    if (input.studyMatchingRules) {
      input.studyMatchingRules.forEach(ruleObject => {
        var rule = new HP.StudyMatchingRule();
        rule.fromObject(ruleObject);
        this.studyMatchingRules.push(rule);
      });
    } // If ViewportSettings exist, add them to the current protocol


    if (input.viewportSettings) {
      this.viewportSettings = input.viewportSettings;
    }
  }
  /**
   * Finds and removes a rule from whichever array it exists in.
   * It is not required to specify if it exists in studyMatchingRules,
   * seriesMatchingRules, or imageMatchingRules
   *
   * @param rule
   */


  removeRule(rule) {
    var array;

    if (rule instanceof HP.StudyMatchingRule) {
      array = this.studyMatchingRules;
    } else if (rule instanceof HP.SeriesMatchingRule) {
      array = this.seriesMatchingRules;
    } else if (rule instanceof HP.ImageMatchingRule) {
      array = this.imageMatchingRules;
    }

    removeFromArray(array, rule);
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ViewportStructure.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/ViewportStructure.js                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**
 * The ViewportStructure class represents the layout and layout properties that
 * Viewports are displayed in. ViewportStructure has a type, which corresponds to
 * a layout template, and a set of properties, which depend on the type.
 *
 * @type {ViewportStructure}
 */
HP.ViewportStructure = class ViewportStructure {
  constructor(type, properties) {
    this.type = type;
    this.properties = properties;
  }
  /**
   * Occasionally the ViewportStructure class needs to be instantiated from a JavaScript Object.
   * This function fills in a ViewportStructure with the Object data.
   *
   * @param input The ViewportStructure as a JavaScript Object, e.g. retrieved from MongoDB or JSON
   */


  fromObject(input) {
    this.type = input.type;
    this.properties = input.properties;
  }
  /**
   * Retrieve the layout template name based on the layout type
   *
   * @returns {string}
   */


  getLayoutTemplateName() {
    // Viewport structure can be updated later when we build more complex display layouts
    switch (this.type) {
      case 'grid':
        return 'gridLayout';
    }
  }
  /**
   * Retrieve the number of Viewports required for this layout
   * given the layout type and properties
   *
   * @returns {string}
   */


  getNumViewports() {
    // Viewport structure can be updated later when we build more complex display layouts
    switch (this.type) {
      case 'grid':
        // For the typical grid layout, we only need to multiply rows by columns to
        // obtain the number of viewports
        return this.properties.rows * this.properties.columns;
    }
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rules":{"ImageMatchingRule.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/rules/ImageMatchingRule.js                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Rule;
module.watch(require("../Rule"), {
  Rule(v) {
    Rule = v;
  }

}, 0);

/**
 * The ImageMatchingRule class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {ImageMatchingRule}
 */
HP.ImageMatchingRule = class ImageMatchingRule extends Rule {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ProtocolMatchingRule.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/rules/ProtocolMatchingRule.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Rule;
module.watch(require("../Rule"), {
  Rule(v) {
    Rule = v;
  }

}, 0);

/**
 * The ProtocolMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {ProtocolMatchingRule}
 */
HP.ProtocolMatchingRule = class ProtocolMatchingRule extends Rule {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"SeriesMatchingRule.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/rules/SeriesMatchingRule.js                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Rule;
module.watch(require("../Rule"), {
  Rule(v) {
    Rule = v;
  }

}, 0);

/**
 * The SeriesMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {SeriesMatchingRule}
 */
HP.SeriesMatchingRule = class SeriesMatchingRule extends Rule {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"StudyMatchingRule.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/classes/rules/StudyMatchingRule.js                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Rule;
module.watch(require("../Rule"), {
  Rule(v) {
    Rule = v;
  }

}, 0);

/**
 * The StudyMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {StudyMatchingRule}
 */
HP.StudyMatchingRule = class StudyMatchingRule extends Rule {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"lib":{"comparators.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/lib/comparators.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  comparators: () => comparators
});
const comparators = [{
  id: 'equals',
  name: '= (Equals)',
  validator: 'equals',
  validatorOption: 'value',
  description: 'The attribute must equal this value.'
}, {
  id: 'doesNotEqual',
  name: '!= (Does not equal)',
  validator: 'doesNotEqual',
  validatorOption: 'value',
  description: 'The attribute must not equal this value.'
}, {
  id: 'contains',
  name: 'Contains',
  validator: 'contains',
  validatorOption: 'value',
  description: 'The attribute must contain this value.'
}, {
  id: 'doesNotContain',
  name: 'Does not contain',
  validator: 'doesNotContain',
  validatorOption: 'value',
  description: 'The attribute must not contain this value.'
}, {
  id: 'startsWith',
  name: 'Starts with',
  validator: 'startsWith',
  validatorOption: 'value',
  description: 'The attribute must start with this value.'
}, {
  id: 'endsWith',
  name: 'Ends with',
  validator: 'endsWith',
  validatorOption: 'value',
  description: 'The attribute must end with this value.'
}, {
  id: 'onlyInteger',
  name: 'Only Integers',
  validator: 'numericality',
  validatorOption: 'onlyInteger',
  description: "Real numbers won't be allowed."
}, {
  id: 'greaterThan',
  name: '> (Greater than)',
  validator: 'numericality',
  validatorOption: 'greaterThan',
  description: 'The attribute has to be greater than this value.'
}, {
  id: 'greaterThanOrEqualTo',
  name: '>= (Greater than or equal to)',
  validator: 'numericality',
  validatorOption: 'greaterThanOrEqualTo',
  description: 'The attribute has to be at least this value.'
}, {
  id: 'lessThanOrEqualTo',
  name: '<= (Less than or equal to)',
  validator: 'numericality',
  validatorOption: 'lessThanOrEqualTo',
  description: 'The attribute can be this value at the most.'
}, {
  id: 'lessThan',
  name: '< (Less than)',
  validator: 'numericality',
  validatorOption: 'lessThan',
  description: 'The attribute has to be less than this value.'
}, {
  id: 'odd',
  name: 'Odd',
  validator: 'numericality',
  validatorOption: 'odd',
  description: 'The attribute has to be odd.'
}, {
  id: 'even',
  name: 'Even',
  validator: 'numericality',
  validatorOption: 'even',
  description: 'The attribute has to be even.'
}]; // Immutable object

Object.freeze(comparators);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeFromArray.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/both/lib/removeFromArray.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  removeFromArray: () => removeFromArray
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);

/**
 * Removes the first instance of an element from an array, if an equal value exists
 *
 * @param array
 * @param input
 *
 * @returns {boolean} Whether or not the element was found and removed
 */
const removeFromArray = (array, input) => {
  // If the array is empty, stop here
  if (!array || !array.length) {
    return false;
  }

  array.forEach((value, index) => {
    if (_.isEqual(value, input)) {
      indexToRemove = index;
      return false;
    }
  });

  if (indexToRemove === void 0) {
    return false;
  }

  array.splice(indexToRemove, 1);
  return true;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"collections.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ohif_hanging-protocols/server/collections.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('hangingprotocols', function () {
  // TODO: filter by availableTo user
  return HangingProtocols.find();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:hanging-protocols/both/namespace.js");
require("/node_modules/meteor/ohif:hanging-protocols/both/collections.js");
require("/node_modules/meteor/ohif:hanging-protocols/both/schema.js");
require("/node_modules/meteor/ohif:hanging-protocols/both/hardcodedData.js");
require("/node_modules/meteor/ohif:hanging-protocols/both/testData.js");
require("/node_modules/meteor/ohif:hanging-protocols/server/collections.js");

/* Exports */
Package._define("ohif:hanging-protocols", {
  HP: HP
});

})();

//# sourceURL=meteor://💻app/packages/ohif_hanging-protocols.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL25hbWVzcGFjZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL2NvbGxlY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvc2NoZW1hLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvaGFyZGNvZGVkRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL3Rlc3REYXRhLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvY2xhc3Nlcy9Qcm90b2NvbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL2NsYXNzZXMvUnVsZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL2NsYXNzZXMvU3RhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6aGFuZ2luZy1wcm90b2NvbHMvYm90aC9jbGFzc2VzL1ZpZXdwb3J0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvY2xhc3Nlcy9WaWV3cG9ydFN0cnVjdHVyZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9ib3RoL2NsYXNzZXMvcnVsZXMvSW1hZ2VNYXRjaGluZ1J1bGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6aGFuZ2luZy1wcm90b2NvbHMvYm90aC9jbGFzc2VzL3J1bGVzL1Byb3RvY29sTWF0Y2hpbmdSdWxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvY2xhc3Nlcy9ydWxlcy9TZXJpZXNNYXRjaGluZ1J1bGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6aGFuZ2luZy1wcm90b2NvbHMvYm90aC9jbGFzc2VzL3J1bGVzL1N0dWR5TWF0Y2hpbmdSdWxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvbGliL2NvbXBhcmF0b3JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOmhhbmdpbmctcHJvdG9jb2xzL2JvdGgvbGliL3JlbW92ZUZyb21BcnJheS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjpoYW5naW5nLXByb3RvY29scy9zZXJ2ZXIvY29sbGVjdGlvbnMuanMiXSwibmFtZXMiOlsiSFAiLCJIYW5naW5nUHJvdG9jb2xzIiwiTWV0ZW9yIiwiQ29sbGVjdGlvbiIsIl9kZWJ1Z05hbWUiLCJhbGxvdyIsImluc2VydCIsInVwZGF0ZSIsInJlbW92ZSIsImlzRGV2ZWxvcG1lbnQiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJhdHRyaWJ1dGVEZWZhdWx0cyIsImFic3RyYWN0UHJpb3JWYWx1ZSIsImRpc3BsYXlTZXR0aW5ncyIsImludmVydCIsImlkIiwidGV4dCIsImRlZmF1bHRWYWx1ZSIsIm9wdGlvbnMiLCJzdHVkeUF0dHJpYnV0ZXMiLCJwcm90b2NvbEF0dHJpYnV0ZXMiLCJzZXJpZXNBdHRyaWJ1dGVzIiwiaW5zdGFuY2VBdHRyaWJ1dGVzIiwiZ2V0RGVmYXVsdFByb3RvY29sIiwicHJvdG9jb2wiLCJQcm90b2NvbCIsImxvY2tlZCIsIm9uZUJ5T25lIiwiVmlld3BvcnRTdHJ1Y3R1cmUiLCJyb3dzIiwiY29sdW1ucyIsInZpZXdwb3J0IiwiVmlld3BvcnQiLCJmaXJzdCIsIlN0YWdlIiwidmlld3BvcnRzIiwicHVzaCIsInN0YWdlcyIsImRlZmF1bHRQcm90b2NvbCIsImdldE1SVHdvQnlUd29UZXN0IiwicHJvdG8iLCJzdHVkeUluc3RhbmNlVWlkIiwiUHJvdG9jb2xNYXRjaGluZ1J1bGUiLCJlcXVhbHMiLCJ2YWx1ZSIsImFkZFByb3RvY29sTWF0Y2hpbmdSdWxlIiwib25lQnlUd28iLCJsZWZ0IiwicmlnaHQiLCJmaXJzdFNlcmllcyIsIlNlcmllc01hdGNoaW5nUnVsZSIsInNlY29uZFNlcmllcyIsInRoaXJkSW1hZ2UiLCJJbWFnZU1hdGNoaW5nUnVsZSIsInNlcmllc01hdGNoaW5nUnVsZXMiLCJpbWFnZU1hdGNoaW5nUnVsZXMiLCJ0d29CeU9uZSIsImxlZnQyIiwicmlnaHQyIiwiZm91cnRoU2VyaWVzIiwiZmlmdGhTZXJpZXMiLCJzZWNvbmQiLCJ0ZXN0UHJvdG9jb2wiLCJnZXREZW1vUHJvdG9jb2xzIiwiZGVtb1Byb3RvY29scyIsInYiLCJSYW5kb20iLCJPSElGIiwicmVtb3ZlRnJvbUFycmF5IiwiY29uc3RydWN0b3IiLCJuYW1lIiwiaGFzVXBkYXRlZFByaW9yc0luZm9ybWF0aW9uIiwiY3JlYXRlZERhdGUiLCJEYXRlIiwibW9kaWZpZWREYXRlIiwidXNlciIsInVzZXJMb2dnZWRJbiIsImNyZWF0ZWRCeSIsImdldFVzZXJJZCIsIm1vZGlmaWVkQnkiLCJhdmFpbGFibGVUbyIsIlNldCIsImVkaXRhYmxlQnkiLCJwcm90b2NvbE1hdGNoaW5nUnVsZXMiLCJudW1iZXJPZlByaW9yc1JlZmVyZW5jZWQiLCJnZXROdW1iZXJPZlByaW9yc1JlZmVyZW5jZWQiLCJza2lwQ2FjaGUiLCJmb3JFYWNoIiwic3RhZ2UiLCJzdHVkeU1hdGNoaW5nUnVsZXMiLCJydWxlIiwicHJpb3JzUmVmZXJlbmNlZCIsInVwZGF0ZU51bWJlck9mUHJpb3JzUmVmZXJlbmNlZCIsInByb3RvY29sV2FzTW9kaWZpZWQiLCJmcm9tT2JqZWN0IiwiaW5wdXQiLCJydWxlT2JqZWN0Iiwic3RhZ2VPYmplY3QiLCJjcmVhdGVDbG9uZSIsImN1cnJlbnRQcm90b2NvbCIsIk9iamVjdCIsImFzc2lnbiIsImNsb25lZFByb3RvY29sIiwiYWRkU3RhZ2UiLCJyZW1vdmVQcm90b2NvbE1hdGNoaW5nUnVsZSIsIndhc1JlbW92ZWQiLCJleHBvcnQiLCJSdWxlIiwiY29tcGFyYXRvcnMiLCJFUVVBTFNfUkVHRVhQIiwiYXR0cmlidXRlIiwiY29uc3RyYWludCIsInJlcXVpcmVkIiwid2VpZ2h0IiwidW5kZWZpbmVkIiwiX2NvbnN0cmFpbnRJbmZvIiwiX3ZhbGlkYXRvckFuZFZhbHVlIiwiZ2V0Q29uc3RyYWludEluZm8iLCJjb25zdHJhaW50SW5mbyIsInJ1bGVDb25zdHJhaW50Iiwia2V5cyIsImZpbmQiLCJjb21wYXJhdG9yIiwiaXNSdWxlRm9yUHJpb3IiLCJydWxlVmFsaWRhdG9yQW5kVmFsdWUiLCJnZXRDb25zdHJhaW50VmFsaWRhdG9yQW5kVmFsdWUiLCJ2YWxpZGF0b3IiLCJpbnRWYWx1ZSIsInBhcnNlSW50IiwidGVzdCIsInZhbGlkYXRvckFuZFZhbHVlIiwiY3VycmVudFZhbGlkYXRvciIsImNvbnN0cmFpbnRWYWxpZGF0b3IiLCJ2YWxpZGF0b3JPcHRpb24iLCJjb25zdHJhaW50VmFsdWUiLCJ2aWV3cG9ydFN0cnVjdHVyZSIsImN1cnJlbnRTdGFnZSIsImNsb25lZFN0YWdlIiwidmlld3BvcnRPYmplY3QiLCJ2aWV3cG9ydFNldHRpbmdzIiwiU3R1ZHlNYXRjaGluZ1J1bGUiLCJyZW1vdmVSdWxlIiwiYXJyYXkiLCJ0eXBlIiwicHJvcGVydGllcyIsImdldExheW91dFRlbXBsYXRlTmFtZSIsImdldE51bVZpZXdwb3J0cyIsImRlc2NyaXB0aW9uIiwiZnJlZXplIiwiXyIsImxlbmd0aCIsImluZGV4IiwiaXNFcXVhbCIsImluZGV4VG9SZW1vdmUiLCJzcGxpY2UiLCJwdWJsaXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7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Sjs7QUFBTTdJLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUMySSxJQUFFcEYsQ0FBRixFQUFJO0FBQUNvRixRQUFFcEYsQ0FBRjtBQUFJOztBQUFWLENBQTFDLEVBQXNELENBQXREOztBQUUzRDs7Ozs7Ozs7QUFRQSxNQUFNRyxrQkFBa0IsQ0FBQzBFLEtBQUQsRUFBUS9DLEtBQVIsS0FBa0I7QUFDdEM7QUFDQSxNQUFJLENBQUMrQyxLQUFELElBQ0EsQ0FBQ0EsTUFBTVEsTUFEWCxFQUNtQjtBQUNmLFdBQU8sS0FBUDtBQUNIOztBQUVEUixRQUFNdkQsT0FBTixDQUFjLENBQUMzQyxLQUFELEVBQVEyRyxLQUFSLEtBQWtCO0FBQzVCLFFBQUlGLEVBQUVHLE9BQUYsQ0FBVTVHLEtBQVYsRUFBaUJtRCxLQUFqQixDQUFKLEVBQTZCO0FBQ3pCMEQsc0JBQWdCRixLQUFoQjtBQUNBLGFBQU8sS0FBUDtBQUNIO0FBQ0osR0FMRDs7QUFPQSxNQUFJRSxrQkFBa0IsS0FBSyxDQUEzQixFQUE4QjtBQUMxQixXQUFPLEtBQVA7QUFDSDs7QUFFRFgsUUFBTVksTUFBTixDQUFhRCxhQUFiLEVBQTRCLENBQTVCO0FBQ0EsU0FBTyxJQUFQO0FBQ0gsQ0FwQkQsQzs7Ozs7Ozs7Ozs7QUNWQTNKLE9BQU82SixPQUFQLENBQWUsa0JBQWYsRUFBbUMsWUFBVztBQUMxQztBQUNBLFNBQU85SixpQkFBaUI0SCxJQUFqQixFQUFQO0FBQ0gsQ0FIRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9vaGlmX2hhbmdpbmctcHJvdG9jb2xzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiSFAgPSB7fTtcbiIsIkhhbmdpbmdQcm90b2NvbHMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ2hhbmdpbmdwcm90b2NvbHMnKTtcbkhhbmdpbmdQcm90b2NvbHMuX2RlYnVnTmFtZSA9ICdIYW5naW5nUHJvdG9jb2xzJztcblxuSGFuZ2luZ1Byb3RvY29scy5hbGxvdyh7XG4gICAgaW5zZXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn0pO1xuXG4vLyBAVE9ETzogUmVtb3ZlIHRoaXMgYWZ0ZXIgc3RhYmlsaXppbmcgUHJvdG9jb2xFbmdpbmVcbmlmIChNZXRlb3IuaXNEZXZlbG9wbWVudCAmJiBNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICBNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgICAgIEhhbmdpbmdQcm90b2NvbHMucmVtb3ZlKHt9KTtcbiAgICB9KTtcbn1cbiIsIi8vIEBUT0RPIHN0YXJ0IHVzaW5nIG5hbWVzcGFjZSBpbnN0ZWFkXG5cbi8vIEJhc2UgY2xhc3Nlc1xuaW1wb3J0ICcuL2NsYXNzZXMvUHJvdG9jb2wnO1xuaW1wb3J0ICcuL2NsYXNzZXMvU3RhZ2UnO1xuaW1wb3J0ICcuL2NsYXNzZXMvVmlld3BvcnQnO1xuaW1wb3J0ICcuL2NsYXNzZXMvVmlld3BvcnRTdHJ1Y3R1cmUnO1xuXG4vLyBTcGVjaWFsaXplZCBSdWxlIGNsYXNzZXNcbmltcG9ydCAnLi9jbGFzc2VzL3J1bGVzL1Byb3RvY29sTWF0Y2hpbmdSdWxlJztcbmltcG9ydCAnLi9jbGFzc2VzL3J1bGVzL1N0dWR5TWF0Y2hpbmdSdWxlJztcbmltcG9ydCAnLi9jbGFzc2VzL3J1bGVzL1Nlcmllc01hdGNoaW5nUnVsZSc7XG5pbXBvcnQgJy4vY2xhc3Nlcy9ydWxlcy9JbWFnZU1hdGNoaW5nUnVsZSc7XG4iLCJIUC5hdHRyaWJ1dGVEZWZhdWx0cyA9IHtcbiAgICBhYnN0cmFjdFByaW9yVmFsdWU6IDBcbn07XG5cbkhQLmRpc3BsYXlTZXR0aW5ncyA9IHtcbiAgICBpbnZlcnQ6IHtcbiAgICAgICAgaWQ6ICdpbnZlcnQnLFxuICAgICAgICB0ZXh0OiAnU2hvdyBHcmF5c2NhbGUgSW52ZXJ0ZWQnLFxuICAgICAgICBkZWZhdWx0VmFsdWU6ICdOTycsXG4gICAgICAgIG9wdGlvbnM6IFsnWUVTJywgJ05PJ11cbiAgICB9XG59O1xuXG4vLyBAVE9ETyBGaXggYWJzdHJhY3RQcmlvclZhbHVlIGNvbXBhcmlzb25cbkhQLnN0dWR5QXR0cmlidXRlcyA9IFt7XG4gICAgaWQ6ICd4MDAxMDAwMjAnLFxuICAgIHRleHQ6ICcoeDAwMTAwMDIwKSBQYXRpZW50IElEJ1xufSwge1xuICAgIGlkOiAneDAwMjAwMDBkJyxcbiAgICB0ZXh0OiAnKHgwMDIwMDAwZCkgU3R1ZHkgSW5zdGFuY2UgVUlEJ1xufSwge1xuICAgIGlkOiAneDAwMDgwMDIwJyxcbiAgICB0ZXh0OiAnKHgwMDA4MDAyMCkgU3R1ZHkgRGF0ZSdcbn0sIHtcbiAgICBpZDogJ3gwMDA4MDAzMCcsXG4gICAgdGV4dDogJyh4MDAwODAwMzApIFN0dWR5IFRpbWUnXG59LCB7XG4gICAgaWQ6ICd4MDAwODEwMzAnLFxuICAgIHRleHQ6ICcoeDAwMDgxMDMwKSBTdHVkeSBEZXNjcmlwdGlvbidcbn0sIHtcbiAgICBpZDogJ2Fic3RyYWN0UHJpb3JWYWx1ZScsXG4gICAgdGV4dDogJ0Fic3RyYWN0IFByaW9yIFZhbHVlJ1xufV07XG5cbkhQLnByb3RvY29sQXR0cmlidXRlcyA9IFt7XG4gICAgaWQ6ICd4MDAxMDAwMjAnLFxuICAgIHRleHQ6ICcoeDAwMTAwMDIwKSBQYXRpZW50IElEJ1xufSwge1xuICAgIGlkOiAneDAwMjAwMDBkJyxcbiAgICB0ZXh0OiAnKHgwMDIwMDAwZCkgU3R1ZHkgSW5zdGFuY2UgVUlEJ1xufSwge1xuICAgIGlkOiAneDAwMDgwMDIwJyxcbiAgICB0ZXh0OiAnKHgwMDA4MDAyMCkgU3R1ZHkgRGF0ZSdcbn0sIHtcbiAgICBpZDogJ3gwMDA4MDAzMCcsXG4gICAgdGV4dDogJyh4MDAwODAwMzApIFN0dWR5IFRpbWUnXG59LCB7XG4gICAgaWQ6ICd4MDAwODEwMzAnLFxuICAgIHRleHQ6ICcoeDAwMDgxMDMwKSBTdHVkeSBEZXNjcmlwdGlvbidcbn0sIHtcbiAgICBpZDogJ2FuYXRvbWljUmVnaW9uJyxcbiAgICB0ZXh0OiAnQW5hdG9taWMgUmVnaW9uJ1xufV07XG5cbkhQLnNlcmllc0F0dHJpYnV0ZXMgPSBbe1xuICAgIGlkOiAneDAwMjAwMDBlJyxcbiAgICB0ZXh0OiAnKHgwMDIwMDAwZSkgU2VyaWVzIEluc3RhbmNlIFVJRCdcbn0sIHtcbiAgICBpZDogJ3gwMDA4MDA2MCcsXG4gICAgdGV4dDogJyh4MDAwODAwNjApIE1vZGFsaXR5J1xufSwge1xuICAgIGlkOiAneDAwMjAwMDExJyxcbiAgICB0ZXh0OiAnKHgwMDIwMDAxMSkgU2VyaWVzIE51bWJlcidcbn0sIHtcbiAgICBpZDogJ3gwMDA4MTAzZScsXG4gICAgdGV4dDogJyh4MDAwODEwM2UpIFNlcmllcyBEZXNjcmlwdGlvbidcbn0sIHtcbiAgICBpZDogJ251bUltYWdlcycsXG4gICAgdGV4dDogJ051bWJlciBvZiBJbWFnZXMnXG59XTtcblxuSFAuaW5zdGFuY2VBdHRyaWJ1dGVzID0gW3tcbiAgICBpZDogJ3gwMDA4MDAxNicsXG4gICAgdGV4dDogJyh4MDAwODAwMTYpIFNPUCBDbGFzcyBVSUQnXG59LCB7XG4gICAgaWQ6ICd4MDAwODAwMTgnLFxuICAgIHRleHQ6ICcoeDAwMDgwMDE4KSBTT1AgSW5zdGFuY2UgVUlEJ1xufSwge1xuICAgIGlkOiAneDAwMTg1MTAxJyxcbiAgICB0ZXh0OiAnKHgwMDE4NTEwMSkgVmlldyBQb3NpdGlvbidcbn0sIHtcbiAgICBpZDogJ3gwMDIwMDAxMycsXG4gICAgdGV4dDogJyh4MDAyMDAwMTMpIEluc3RhbmNlIE51bWJlcidcbn0sIHtcbiAgICBpZDogJ3gwMDA4MDAwOCcsXG4gICAgdGV4dDogJyh4MDAwODAwMDgpIEltYWdlIFR5cGUnXG59LCB7XG4gICAgaWQ6ICd4MDAxODEwNjMnLFxuICAgIHRleHQ6ICcoeDAwMTgxMDYzKSBGcmFtZSBUaW1lJ1xufSwge1xuICAgIGlkOiAneDAwMjAwMDYwJyxcbiAgICB0ZXh0OiAnKHgwMDIwMDA2MCkgTGF0ZXJhbGl0eSdcbn0sIHtcbiAgICBpZDogJ3gwMDU0MTMzMCcsXG4gICAgdGV4dDogJyh4MDA1NDEzMzApIEltYWdlIEluZGV4J1xufSwge1xuICAgIGlkOiAneDAwMjgwMDA0JyxcbiAgICB0ZXh0OiAnKHgwMDI4MDAwNCkgUGhvdG9tZXRyaWMgSW50ZXJwcmV0YXRpb24nXG59LCB7XG4gICAgaWQ6ICd4MDAxODAwNTAnLFxuICAgIHRleHQ6ICcoeDAwMTgwMDUwKSBTbGljZSBUaGlja25lc3MnXG59XTtcbiIsImZ1bmN0aW9uIGdldERlZmF1bHRQcm90b2NvbCgpIHtcbiAgICB2YXIgcHJvdG9jb2wgPSBuZXcgSFAuUHJvdG9jb2woJ0RlZmF1bHQnKTtcbiAgICBwcm90b2NvbC5pZCA9ICdkZWZhdWx0UHJvdG9jb2wnO1xuICAgIHByb3RvY29sLmxvY2tlZCA9IHRydWU7XG5cbiAgICB2YXIgb25lQnlPbmUgPSBuZXcgSFAuVmlld3BvcnRTdHJ1Y3R1cmUoJ2dyaWQnLCB7XG4gICAgICAgIHJvd3M6IDEsXG4gICAgICAgIGNvbHVtbnM6IDFcbiAgICB9KTtcblxuICAgIHZhciB2aWV3cG9ydCA9IG5ldyBIUC5WaWV3cG9ydCgpO1xuICAgIHZhciBmaXJzdCA9IG5ldyBIUC5TdGFnZShvbmVCeU9uZSwgJ29uZUJ5T25lJyk7XG4gICAgZmlyc3Qudmlld3BvcnRzLnB1c2godmlld3BvcnQpO1xuXG4gICAgcHJvdG9jb2wuc3RhZ2VzLnB1c2goZmlyc3QpO1xuXG4gICAgSFAuZGVmYXVsdFByb3RvY29sID0gcHJvdG9jb2w7XG4gICAgcmV0dXJuIEhQLmRlZmF1bHRQcm90b2NvbDtcbn1cblxuZnVuY3Rpb24gZ2V0TVJUd29CeVR3b1Rlc3QoKSB7XG4gICAgdmFyIHByb3RvID0gbmV3IEhQLlByb3RvY29sKCdNUl9Ud29CeVR3bycpO1xuICAgIHByb3RvLmlkID0gJ01SX1R3b0J5VHdvJztcbiAgICBwcm90by5sb2NrZWQgPSB0cnVlO1xuICAgIC8vIFVzZSBodHRwOi8vbG9jYWxob3N0OjMwMDAvdmlld2VyLzEuMi44NDAuMTEzNjE5LjIuNS4xNzYyNTgzMTUzLjIxNTUxOS45Nzg5NTcwNjMuNzhcblxuICAgIHZhciBzdHVkeUluc3RhbmNlVWlkID0gbmV3IEhQLlByb3RvY29sTWF0Y2hpbmdSdWxlKCdzdHVkeUluc3RhbmNlVWlkJywge1xuICAgICAgICBlcXVhbHM6IHtcbiAgICAgICAgICAgIHZhbHVlOiAnMS4yLjg0MC4xMTM2MTkuMi41LjE3NjI1ODMxNTMuMjE1NTE5Ljk3ODk1NzA2My43OCdcbiAgICAgICAgfVxuICAgIH0sIHRydWUpO1xuXG4gICAgcHJvdG8uYWRkUHJvdG9jb2xNYXRjaGluZ1J1bGUoc3R1ZHlJbnN0YW5jZVVpZCk7XG5cbiAgICB2YXIgb25lQnlUd28gPSBuZXcgSFAuVmlld3BvcnRTdHJ1Y3R1cmUoJ2dyaWQnLCB7XG4gICAgICAgIHJvd3M6IDEsXG4gICAgICAgIGNvbHVtbnM6IDJcbiAgICB9KTtcblxuICAgIC8vIFN0YWdlIDFcbiAgICB2YXIgbGVmdCA9IG5ldyBIUC5WaWV3cG9ydCgpO1xuICAgIHZhciByaWdodCA9IG5ldyBIUC5WaWV3cG9ydCgpO1xuXG4gICAgdmFyIGZpcnN0U2VyaWVzID0gbmV3IEhQLlNlcmllc01hdGNoaW5nUnVsZSgnc2VyaWVzTnVtYmVyJywge1xuICAgICAgICBlcXVhbHM6IHtcbiAgICAgICAgICAgIHZhbHVlOiAxXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBzZWNvbmRTZXJpZXMgPSBuZXcgSFAuU2VyaWVzTWF0Y2hpbmdSdWxlKCdzZXJpZXNOdW1iZXInLCB7XG4gICAgICAgIGVxdWFsczoge1xuICAgICAgICAgICAgdmFsdWU6IDJcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHRoaXJkSW1hZ2UgPSBuZXcgSFAuSW1hZ2VNYXRjaGluZ1J1bGUoJ2luc3RhbmNlTnVtYmVyJywge1xuICAgICAgICBlcXVhbHM6IHtcbiAgICAgICAgICAgIHZhbHVlOiAzXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGxlZnQuc2VyaWVzTWF0Y2hpbmdSdWxlcy5wdXNoKGZpcnN0U2VyaWVzKTtcbiAgICBsZWZ0LmltYWdlTWF0Y2hpbmdSdWxlcy5wdXNoKHRoaXJkSW1hZ2UpO1xuXG4gICAgcmlnaHQuc2VyaWVzTWF0Y2hpbmdSdWxlcy5wdXNoKHNlY29uZFNlcmllcyk7XG4gICAgcmlnaHQuaW1hZ2VNYXRjaGluZ1J1bGVzLnB1c2godGhpcmRJbWFnZSk7XG5cbiAgICB2YXIgZmlyc3QgPSBuZXcgSFAuU3RhZ2Uob25lQnlUd28sICdvbmVCeVR3bycpO1xuICAgIGZpcnN0LnZpZXdwb3J0cy5wdXNoKGxlZnQpO1xuICAgIGZpcnN0LnZpZXdwb3J0cy5wdXNoKHJpZ2h0KTtcblxuICAgIHByb3RvLnN0YWdlcy5wdXNoKGZpcnN0KTtcblxuICAgIC8vIFN0YWdlIDJcbiAgICB2YXIgdHdvQnlPbmUgPSBuZXcgSFAuVmlld3BvcnRTdHJ1Y3R1cmUoJ2dyaWQnLCB7XG4gICAgICAgIHJvd3M6IDIsXG4gICAgICAgIGNvbHVtbnM6IDFcbiAgICB9KTtcbiAgICB2YXIgbGVmdDIgPSBuZXcgSFAuVmlld3BvcnQoKTtcbiAgICB2YXIgcmlnaHQyID0gbmV3IEhQLlZpZXdwb3J0KCk7XG5cbiAgICB2YXIgZm91cnRoU2VyaWVzID0gbmV3IEhQLlNlcmllc01hdGNoaW5nUnVsZSgnc2VyaWVzTnVtYmVyJywge1xuICAgICAgICBlcXVhbHM6IHtcbiAgICAgICAgICAgIHZhbHVlOiA0XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBmaWZ0aFNlcmllcyA9IG5ldyBIUC5TZXJpZXNNYXRjaGluZ1J1bGUoJ3Nlcmllc051bWJlcicsIHtcbiAgICAgICAgZXF1YWxzOiB7XG4gICAgICAgICAgICB2YWx1ZTogNVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBsZWZ0Mi5zZXJpZXNNYXRjaGluZ1J1bGVzLnB1c2goZm91cnRoU2VyaWVzKTtcbiAgICBsZWZ0Mi5pbWFnZU1hdGNoaW5nUnVsZXMucHVzaCh0aGlyZEltYWdlKTtcbiAgICByaWdodDIuc2VyaWVzTWF0Y2hpbmdSdWxlcy5wdXNoKGZpZnRoU2VyaWVzKTtcbiAgICByaWdodDIuaW1hZ2VNYXRjaGluZ1J1bGVzLnB1c2godGhpcmRJbWFnZSk7XG5cbiAgICB2YXIgc2Vjb25kID0gbmV3IEhQLlN0YWdlKHR3b0J5T25lLCAndHdvQnlPbmUnKTtcbiAgICBzZWNvbmQudmlld3BvcnRzLnB1c2gobGVmdDIpO1xuICAgIHNlY29uZC52aWV3cG9ydHMucHVzaChyaWdodDIpO1xuXG4gICAgcHJvdG8uc3RhZ2VzLnB1c2goc2Vjb25kKTtcblxuICAgIEhQLnRlc3RQcm90b2NvbCA9IHByb3RvO1xuICAgIHJldHVybiBIUC50ZXN0UHJvdG9jb2w7XG59XG5cbmZ1bmN0aW9uIGdldERlbW9Qcm90b2NvbHMoKSB7XG5cbiAgICBIUC5kZW1vUHJvdG9jb2xzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBEZW1vICMxXG4gICAgICovXG4gICAgSFAuZGVtb1Byb3RvY29scy5wdXNoKHtcbiAgICAgICAgXCJpZFwiOiBcImRlbW9Qcm90b2NvbDFcIixcbiAgICAgICAgXCJsb2NrZWRcIjogZmFsc2UsXG4gICAgICAgIFwibmFtZVwiOiBcIkRGQ0ktQ1QtQ0hFU1QtQ09NUEFSRVwiLFxuICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCIsXG4gICAgICAgIFwibW9kaWZpZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjoxODo0My45MzBaXCIsXG4gICAgICAgIFwiYXZhaWxhYmxlVG9cIjoge30sXG4gICAgICAgIFwiZWRpdGFibGVCeVwiOiB7fSxcbiAgICAgICAgXCJwcm90b2NvbE1hdGNoaW5nUnVsZXNcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwiaWRcIjogXCI3dG11cTdLekRNQ1dGZWFwY1wiLFxuICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzMFwiLFxuICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkRGQ0kgQ1QgQ0hFU1RcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBcInN0YWdlc1wiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNm1mZlpQaWY1XCIsXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwib25lQnlPbmVcIixcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCIyLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ5Z3o0bmIyOGlKWmNKaG5ZYVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjIuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFR2blhUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiWFR6dThIQjNmZWVwM0hZS3NcIixcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCIzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ5Z3o0bmIyOGlKWmNKaG5ZYVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjMuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFR2blhUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjEyLjA4NVpcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiM3lQWU5hZUZ0cjc2UXozanFcIixcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDMuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW11cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndsUHJlc2V0XCI6IFwiTHVuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInlnejRuYjI4aUpaY0pobllhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiTHVuZyAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCI2dmRCUlpZbnFtbW9zaXBwaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkJvZHkgMy4wXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiU3hmVHloR2NNaHI1NlB0UE1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJhYnN0cmFjdFByaW9yVmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndsUHJlc2V0XCI6IFwiTHVuZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIkZUQXlDaFpDUFc2OHlKalhEXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiTHVuZyAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJnTUpqZnJic3FZTmJFclB4NVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcImFic3RyYWN0UHJpb3JWYWx1ZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlcXVhbHNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjoxMTo0MC40ODlaXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgXCJudW1iZXJPZlByaW9yc1JlZmVyZW5jZWRcIjogNFxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGVtbyAjMlxuICAgICAqL1xuXG4gICAgSFAuZGVtb1Byb3RvY29scy5wdXNoKHtcbiAgICAgICAgXCJpZFwiOiBcImRlbW9Qcm90b2NvbDJcIixcbiAgICAgICAgXCJsb2NrZWRcIjogZmFsc2UsXG4gICAgICAgIFwibmFtZVwiOiBcIkRGQ0ktQ1QtQ0hFU1QtQ09NUEFSRS0yXCIsXG4gICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIixcbiAgICAgICAgXCJtb2RpZmllZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjE4OjQzLjkzMFpcIixcbiAgICAgICAgXCJhdmFpbGFibGVUb1wiOiB7fSxcbiAgICAgICAgXCJlZGl0YWJsZUJ5XCI6IHt9LFxuICAgICAgICBcInByb3RvY29sTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgXCJpZFwiOiBcIjd0bXVxN0t6RE1DV0ZlYXBjXCIsXG4gICAgICAgICAgICBcIndlaWdodFwiOiAyLFxuICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDMwXCIsXG4gICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiREZDSSBDVCBDSEVTVFwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XSxcbiAgICAgICAgXCJzdGFnZXNcIjogW3tcbiAgICAgICAgICAgIFwiaWRcIjogXCJ2NVBmR3Q5RjZtZmZaUGlmNVwiLFxuICAgICAgICAgICAgXCJuYW1lXCI6IFwib25lQnlPbmVcIixcbiAgICAgICAgICAgIFwidmlld3BvcnRTdHJ1Y3R1cmVcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImdyaWRcIixcbiAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInJvd3NcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJjb2x1bW5zXCI6IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwibGF5b3V0VGVtcGxhdGVOYW1lXCI6IFwiZ3JpZExheW91dFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW3tcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpMNTZ6N21hY1wiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjIuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInlnejRuYjI4aUpaY0poblljXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiMi4wXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ1RG9FZ0xUdm5YVEJ5V25QdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcImFic3RyYWN0UHJpb3JWYWx1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJlcXVhbHNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogMVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgXCJjcmVhdGVkRGF0ZVwiOiBcIjIwMTctMDItMTRUMTY6MDc6MDkuMDMzWlwiXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIFwiaWRcIjogXCJYVHp1OEhCM2ZlZXAzSFlLc1wiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056Wkw1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVluc0NjTndaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDUuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInlnejRuYjI4aUpaY0pobllhXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwieWd6NG5iMjlpSlpjSmhuWWFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDUuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwidURvRWdMVHZuWFRCeVduUHpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJhYnN0cmFjdFByaW9yVmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjEyLjA4NVpcIlxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBcImlkXCI6IFwiM3lQWU5hZUZ0cjc2UXozanFcIixcbiAgICAgICAgICAgIFwidmlld3BvcnRTdHJ1Y3R1cmVcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImdyaWRcIixcbiAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInJvd3NcIjogMixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2x1bW5zXCI6IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwibGF5b3V0VGVtcGxhdGVOYW1lXCI6IFwiZ3JpZExheW91dFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW3tcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpMNTZ6N210clwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkJvZHkgMy4wXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImpYbnNDY056Wkw1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSA1LjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW11cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIndsUHJlc2V0XCI6IFwiTHVuZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInlnejRuYjI4aUpaY0poblliXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiTHVuZyAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwieWN6NG5iMjhpSlpjSmhuWWFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJMdW5nIDUuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIjZ2ZEJSWllucW1tb3NpcHBoXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSAzLjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiNnZkQlJGWW5xbW1vc2lwcGhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDUuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiU3hmVHloR2NNaHI1NlB0UE1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJhYnN0cmFjdFByaW9yVmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ3bFByZXNldFwiOiBcIkx1bmdcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJGVEF5Q2haQ1BXNjh5SmpYRFwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAyLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkx1bmcgMy4wXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIkRUQXlDaFpDUFc2OHlKalhEXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiTHVuZyA1LjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImdNSmpmcmJzcVlOYkVyUHg1XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjoxMTo0MC40ODlaXCJcbiAgICAgICAgfV0sXG4gICAgICAgIFwibnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkXCI6IDFcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIERlbW86IHNjcmVlbkNUXG4gICAgICovXG5cbiAgICBIUC5kZW1vUHJvdG9jb2xzLnB1c2goe1xuICAgICAgICBcImlkXCI6IFwic2NyZWVuQ1RcIixcbiAgICAgICAgXCJsb2NrZWRcIjogZmFsc2UsXG4gICAgICAgIFwibmFtZVwiOiBcIkRGQ0ktQ1QtQ0hFU1QtU0NSRUVOXCIsXG4gICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIixcbiAgICAgICAgXCJtb2RpZmllZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjE4OjQzLjkzMFpcIixcbiAgICAgICAgXCJhdmFpbGFibGVUb1wiOiB7fSxcbiAgICAgICAgXCJlZGl0YWJsZUJ5XCI6IHt9LFxuICAgICAgICBcInByb3RvY29sTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgXCJpZFwiOiBcIjd0bXVxN0t6RE1DV0ZlYXBjXCIsXG4gICAgICAgICAgICBcIndlaWdodFwiOiAyLFxuICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDMwXCIsXG4gICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiREZDSSBDVCBDSEVTVFwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XSxcbiAgICAgICAgXCJzdGFnZXNcIjogW3tcbiAgICAgICAgICAgIFwiaWRcIjogXCJ2NVBmR3Q5RjZtZmZaUGlmNVwiLFxuICAgICAgICAgICAgXCJuYW1lXCI6IFwib25lQnlPbmVcIixcbiAgICAgICAgICAgIFwidmlld3BvcnRTdHJ1Y3R1cmVcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImdyaWRcIixcbiAgICAgICAgICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInJvd3NcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJjb2x1bW5zXCI6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwibGF5b3V0VGVtcGxhdGVOYW1lXCI6IFwiZ3JpZExheW91dFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2aWV3cG9ydHNcIjogW3tcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpMNTV6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjIuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNG1mZlpQaWY1XCIsXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJvbmVCeU9uZVwiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAyLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056Wkw1Nno3blRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSA1LjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejdyVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDMuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056Wkw1NnI3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiTHVuZyA1LjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2YTdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJMdW5nIDMuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY1J6Wkw1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQm9keSA0LjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpUTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJDb3JvbmFsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTXpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJCb2R5IDQuMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NBelpMNTZ6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIlNhZ2l0dGFsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIlxuICAgICAgICB9XSxcbiAgICAgICAgXCJudW1iZXJPZlByaW9yc1JlZmVyZW5jZWRcIjogMFxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGVtbzogUEVUQ1RTQ1JFRU5cbiAgICAgKi9cblxuICAgIEhQLmRlbW9Qcm90b2NvbHMucHVzaCh7XG4gICAgICAgIFwiaWRcIjogXCJQRVRDVFNDUkVFTlwiLFxuICAgICAgICBcImxvY2tlZFwiOiBmYWxzZSxcbiAgICAgICAgXCJuYW1lXCI6IFwiUEVUQ1QtU0NSRUVOXCIsXG4gICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIixcbiAgICAgICAgXCJtb2RpZmllZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjE4OjQzLjkzMFpcIixcbiAgICAgICAgXCJhdmFpbGFibGVUb1wiOiB7fSxcbiAgICAgICAgXCJlZGl0YWJsZUJ5XCI6IHt9LFxuICAgICAgICBcInByb3RvY29sTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgXCJpZFwiOiBcIjd0bXVxZ0t6RE1DV0ZlYXBjXCIsXG4gICAgICAgICAgICBcIndlaWdodFwiOiA1LFxuICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDMwXCIsXG4gICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiUEVUQ1RcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfV0sXG4gICAgICAgIFwic3RhZ2VzXCI6IFt7XG4gICAgICAgICAgICBcImlkXCI6IFwidjVQZkd0OUY2bUZnWlBpZjVcIixcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm9uZUJ5T25lXCIsXG4gICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJncmlkXCIsXG4gICAgICAgICAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sdW1uc1wiOiAyXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidmlld3BvcnRzXCI6IFt7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjQXpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJUb3BvZ3JhbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056WlI1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiVG9wb2dyYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVJuc0NjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAyMDAwMTFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibnVtZXJpY2FsaXR5XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdyZWF0ZXJUaGFuT3JFcXVhbFRvXCI6IDJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIlxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBcImlkXCI6IFwidjVQZkd0OUY2bUZnWlBpZjVcIixcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm9uZUJ5T25lXCIsXG4gICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJncmlkXCIsXG4gICAgICAgICAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sdW1uc1wiOiAyXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidmlld3BvcnRzXCI6IFt7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0djTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJQRVQgV0IgQ29ycmVjdGVkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0hjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJDVCBXQlwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNm1GZ1pQaWY1XCIsXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJvbmVCeU9uZVwiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCI6IFwiWUVTXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuZUNjTnpaTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJQRVQgV0IgVW5jb3JyZWN0ZWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW11cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ3VOelpMNTZ6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkNUIE5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIlxuICAgICAgICB9XSxcbiAgICAgICAgXCJudW1iZXJPZlByaW9yc1JlZmVyZW5jZWRcIjogMFxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGVtbzogUEVUQ1RDT01QQVJFXG4gICAgICovXG5cbiAgICBIUC5kZW1vUHJvdG9jb2xzLnB1c2goe1xuICAgICAgICBcImlkXCI6IFwiUEVUQ1RDT01QQVJFXCIsXG4gICAgICAgIFwibG9ja2VkXCI6IGZhbHNlLFxuICAgICAgICBcIm5hbWVcIjogXCJQRVRDVC1DT01QQVJFXCIsXG4gICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIixcbiAgICAgICAgXCJtb2RpZmllZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjE4OjQzLjkzMFpcIixcbiAgICAgICAgXCJhdmFpbGFibGVUb1wiOiB7fSxcbiAgICAgICAgXCJlZGl0YWJsZUJ5XCI6IHt9LFxuICAgICAgICBcInByb3RvY29sTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgXCJpZFwiOiBcIjd0bXVxZ0t6RE1DV0ZlYXBjXCIsXG4gICAgICAgICAgICBcIndlaWdodFwiOiA1LFxuICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDMwXCIsXG4gICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiUEVUQ1RcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfV0sXG4gICAgICAgIFwic3RhZ2VzXCI6IFt7XG4gICAgICAgICAgICBcImlkXCI6IFwidjVQZkd0OUY2bUZnWlBpZjVcIixcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm9uZUJ5T25lXCIsXG4gICAgICAgICAgICBcInZpZXdwb3J0U3RydWN0dXJlXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJncmlkXCIsXG4gICAgICAgICAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJyb3dzXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sdW1uc1wiOiAyXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImxheW91dFRlbXBsYXRlTmFtZVwiOiBcImdyaWRMYXlvdXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidmlld3BvcnRzXCI6IFt7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU5ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJUb3BvZ3JhbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056Wkw1Nno3bFRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiVG9wb2dyYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFRiblhUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNm1GZ1pQaWY1XCIsXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJvbmVCeU9uZVwiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY05qWkw1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiVG9wb2dyYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejdnVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAyMDAwMTFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibnVtZXJpY2FsaXR5XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdyZWF0ZXJUaGFuT3JFcXVhbFRvXCI6IDJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjQ3paTDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJUb3BvZ3JhbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpMNTZ6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDIwMDAxMVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJudW1lcmljYWxpdHlcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ3JlYXRlclRoYW5PckVxdWFsVG9cIjogMlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFR2bjFUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNm1GZ1pQaWY1XCIsXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJvbmVCeU9uZVwiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAyLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056WkwyNno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiUEVUIFdCIENvcnJlY3RlZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbXVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056Wkw0Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQ1QgV0JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW11cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpMNTd6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIlBFVCBXQiBDb3JyZWN0ZWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFR2bllUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7fSxcbiAgICAgICAgICAgICAgICBcImltYWdlTWF0Y2hpbmdSdWxlc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInNlcmllc01hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIm1YbnNDY056WlE1Nno3bVRaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwieDAwMDgxMDNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiQ1QgV0JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW3tcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInVEb0VnTFR2bktUQnlXblB6XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VpZ2h0XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0cmlidXRlXCI6IFwiYWJzdHJhY3RQcmlvclZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uc3RyYWludFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImVxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcImNyZWF0ZWREYXRlXCI6IFwiMjAxNy0wMi0xNFQxNjowNzowOS4wMzNaXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJpZFwiOiBcInY1UGZHdDlGNm1GZ1pQaWY1XCIsXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJvbmVCeU9uZVwiLFxuICAgICAgICAgICAgXCJ2aWV3cG9ydFN0cnVjdHVyZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZ3JpZFwiLFxuICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicm93c1wiOiAyLFxuICAgICAgICAgICAgICAgICAgICBcImNvbHVtbnNcIjogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJsYXlvdXRUZW1wbGF0ZU5hbWVcIjogXCJncmlkTGF5b3V0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZpZXdwb3J0c1wiOiBbe1xuICAgICAgICAgICAgICAgIFwidmlld3BvcnRTZXR0aW5nc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCI6IFwiWUVTXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaTDU2ejduVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJQRVQgV0IgVW5jb3JyZWN0ZWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgXCJzdHVkeU1hdGNoaW5nUnVsZXNcIjogW11cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcInZpZXdwb3J0U2V0dGluZ3NcIjoge30sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOeFpMNTZ6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIkNUIE5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIFwic3R1ZHlNYXRjaGluZ1J1bGVzXCI6IFtdXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIjogXCJZRVNcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpbWFnZU1hdGNoaW5nUnVsZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzZXJpZXNNYXRjaGluZ1J1bGVzXCI6IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJtWG5zQ2NOelpBNTZ6N21UWlwiLFxuICAgICAgICAgICAgICAgICAgICBcIndlaWdodFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImF0dHJpYnV0ZVwiOiBcIngwMDA4MTAzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnN0cmFpbnRcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIlBFVCBXQiBVbmNvcnJlY3RlZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwidURvRWdIVHZuWFRCeVduUHpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJhYnN0cmFjdFByaW9yVmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJ2aWV3cG9ydFNldHRpbmdzXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VNYXRjaGluZ1J1bGVzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic2VyaWVzTWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwibVhuc0NjTnpaUDU2ejdtVFpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJ4MDAwODEwM2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCJDVCBOa1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBcInN0dWR5TWF0Y2hpbmdSdWxlc1wiOiBbe1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwidURvRWdJVHZuWFRCeVduUHpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3ZWlnaHRcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyaWJ1dGVcIjogXCJhYnN0cmFjdFByaW9yVmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb25zdHJhaW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwiY3JlYXRlZERhdGVcIjogXCIyMDE3LTAyLTE0VDE2OjA3OjA5LjAzM1pcIlxuICAgICAgICB9XSxcbiAgICAgICAgXCJudW1iZXJPZlByaW9yc1JlZmVyZW5jZWRcIjogMVxuICAgIH0pO1xuXG59XG5cbmdldERlZmF1bHRQcm90b2NvbCgpO1xuLy9nZXRNUlR3b0J5VHdvVGVzdCgpO1xuLy9nZXREZW1vUHJvdG9jb2xzKCk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuXG4vLyBMb2NhbCBpbXBvcnRzXG5pbXBvcnQgeyByZW1vdmVGcm9tQXJyYXkgfSBmcm9tICcuLi9saWIvcmVtb3ZlRnJvbUFycmF5JztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIHJlcHJlc2VudHMgYSBIYW5naW5nIFByb3RvY29sIGF0IHRoZSBoaWdoZXN0IGxldmVsXG4gKlxuICogQHR5cGUge1Byb3RvY29sfVxuICovXG5IUC5Qcm90b2NvbCA9IGNsYXNzIFByb3RvY29sIHtcbiAgICAvKipcbiAgICAgKiBUaGUgQ29uc3RydWN0b3IgZm9yIHRoZSBDbGFzcyB0byBjcmVhdGUgYSBQcm90b2NvbCB3aXRoIHRoZSBiYXJlXG4gICAgICogbWluaW11bSBpbmZvcm1hdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgVGhlIGRlc2lyZWQgbmFtZSBmb3IgdGhlIFByb3RvY29sXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobmFtZSkge1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgVVVJRCBmb3IgdGhpcyBQcm90b2NvbFxuICAgICAgICB0aGlzLmlkID0gUmFuZG9tLmlkKCk7XG5cbiAgICAgICAgLy8gU3RvcmUgYSB2YWx1ZSB3aGljaCBkZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGEgUHJvdG9jb2wgaXMgbG9ja2VkXG4gICAgICAgIC8vIFRoaXMgaXMgcHJvYmFibHkgdGVtcG9yYXJ5LCBzaW5jZSB3ZSB3aWxsIGV2ZW50dWFsbHkgaGF2ZSByb2xlIC8gdXNlclxuICAgICAgICAvLyBjaGVja3MgZm9yIGVkaXRpbmcuIEZvciBub3cgd2UganVzdCBuZWVkIGl0IHRvIHByZXZlbnQgY2hhbmdlcyB0byB0aGVcbiAgICAgICAgLy8gZGVmYXVsdCBwcm90b2NvbHMuXG4gICAgICAgIHRoaXMubG9ja2VkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQm9vbGVhbiB2YWx1ZSB0byBpbmRpY2F0ZSBpZiB0aGUgcHJvdG9jb2wgaGFzIHVwZGF0ZWQgcHJpb3JzIGluZm9ybWF0aW9uXG4gICAgICAgIC8vIGl0J3Mgc2V0IGluIFwidXBkYXRlTnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkXCIgZnVuY3Rpb25cbiAgICAgICAgdGhpcy5oYXNVcGRhdGVkUHJpb3JzSW5mb3JtYXRpb24gPSBmYWxzZTtcblxuICAgICAgICAvLyBBcHBseSB0aGUgZGVzaXJlZCBuYW1lXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgLy8gU2V0IHRoZSBjcmVhdGVkIGFuZCBtb2RpZmllZCBkYXRlcyB0byBOb3dcbiAgICAgICAgdGhpcy5jcmVhdGVkRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHRoaXMubW9kaWZpZWREYXRlID0gbmV3IERhdGUoKTtcblxuICAgICAgICAvLyBJZiB3ZSBhcmUgbG9nZ2VkIGluIHdoaWxlIGNyZWF0aW5nIHRoaXMgUHJvdG9jb2wsXG4gICAgICAgIC8vIHN0b3JlIHRoaXMgaW5mb3JtYXRpb24gYXMgd2VsbFxuICAgICAgICBpZiAoT0hJRi51c2VyICYmIE9ISUYudXNlci51c2VyTG9nZ2VkSW4gJiYgT0hJRi51c2VyLnVzZXJMb2dnZWRJbigpKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZWRCeSA9IE9ISUYudXNlci5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgIHRoaXMubW9kaWZpZWRCeSA9IE9ISUYudXNlci5nZXRVc2VySWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0d28gZW1wdHkgU2V0cyBzcGVjaWZ5aW5nIHdoaWNoIHJvbGVzXG4gICAgICAgIC8vIGhhdmUgcmVhZCBhbmQgd3JpdGUgYWNjZXNzIHRvIHRoaXMgUHJvdG9jb2xcbiAgICAgICAgdGhpcy5hdmFpbGFibGVUbyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5lZGl0YWJsZUJ5ID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIERlZmluZSBlbXB0eSBhcnJheXMgZm9yIHRoZSBQcm90b2NvbCBtYXRjaGluZyBydWxlc1xuICAgICAgICAvLyBhbmQgU3RhZ2VzXG4gICAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGluZ1J1bGVzID0gW107XG4gICAgICAgIHRoaXMuc3RhZ2VzID0gW107XG5cbiAgICAgICAgLy8gRGVmaW5lIGF1eGlsaWFyeSB2YWx1ZXMgZm9yIHByaW9yc1xuICAgICAgICB0aGlzLm51bWJlck9mUHJpb3JzUmVmZXJlbmNlZCA9IC0xO1xuICAgIH1cblxuICAgIGdldE51bWJlck9mUHJpb3JzUmVmZXJlbmNlZChza2lwQ2FjaGUgPSBmYWxzZSkge1xuICAgICAgICBsZXQgbnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkID0gc2tpcENhY2hlICE9PSB0cnVlID8gdGhpcy5udW1iZXJPZlByaW9yc1JlZmVyZW5jZWQgOiAtMTtcblxuICAgICAgICAvLyBDaGVjayBpZiBpbmZvcm1hdGlvbiBpcyBjYWNoZWQgYWxyZWFkeVxuICAgICAgICBpZiAobnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXJPZlByaW9yc1JlZmVyZW5jZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBudW1iZXJPZlByaW9yc1JlZmVyZW5jZWQgPSAwO1xuXG4gICAgICAgIC8vIFNlYXJjaCBlYWNoIHN0dWR5IG1hdGNoaW5nIHJ1bGUgZm9yIHByaW9yIHJ1bGVzXG4gICAgICAgIC8vIEVhY2ggc3RhZ2UgY2FuIGhhdmUgbWFueSB2aWV3cG9ydHMgdGhhdCBjYW4gaGF2ZVxuICAgICAgICAvLyBtdWx0aXBsZSBzdHVkeSBtYXRjaGluZyBydWxlcy5cbiAgICAgICAgdGhpcy5zdGFnZXMuZm9yRWFjaChzdGFnZSA9PiB7XG4gICAgICAgICAgICBpZiAoIXN0YWdlLnZpZXdwb3J0cykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhZ2Uudmlld3BvcnRzLmZvckVhY2godmlld3BvcnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdmlld3BvcnQuc3R1ZHlNYXRjaGluZ1J1bGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2aWV3cG9ydC5zdHVkeU1hdGNoaW5nUnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgcnVsZSBpcyBub3QgYSBwcmlvcnMgcnVsZSwgaXQgd2lsbCByZXR1cm4gLTEgdGhlbiBudW1iZXJPZlByaW9yc1JlZmVyZW5jZWQgd2lsbCBjb250aW51ZSB0byBiZSAwXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByaW9yc1JlZmVyZW5jZWQgPSBydWxlLmdldE51bWJlck9mUHJpb3JzUmVmZXJlbmNlZCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJpb3JzUmVmZXJlbmNlZCA+IG51bWJlck9mUHJpb3JzUmVmZXJlbmNlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkID0gcHJpb3JzUmVmZXJlbmNlZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkID0gbnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkO1xuXG4gICAgICAgIHJldHVybiBudW1iZXJPZlByaW9yc1JlZmVyZW5jZWRcbiAgICB9XG5cbiAgICB1cGRhdGVOdW1iZXJPZlByaW9yc1JlZmVyZW5jZWQoKSB7XG4gICAgICAgIHRoaXMuZ2V0TnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkKHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byB1cGRhdGUgdGhlIG1vZGlmaWVkRGF0ZSB3aGVuIHRoZSBQcm90b2NvbFxuICAgICAqIGhhcyBiZWVuIGNoYW5nZWRcbiAgICAgKi9cbiAgICBwcm90b2NvbFdhc01vZGlmaWVkKCkge1xuICAgICAgICAvLyBJZiB3ZSBhcmUgbG9nZ2VkIGluIHdoaWxlIG1vZGlmeWluZyB0aGlzIFByb3RvY29sLFxuICAgICAgICAvLyBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGFzIHdlbGxcbiAgICAgICAgaWYgKE9ISUYudXNlciAmJiBPSElGLnVzZXIudXNlckxvZ2dlZEluICYmIE9ISUYudXNlci51c2VyTG9nZ2VkSW4oKSkge1xuICAgICAgICAgICAgdGhpcy5tb2RpZmllZEJ5ID0gT0hJRi51c2VyLmdldFVzZXJJZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvdG9jb2wgaGFzIGJlZW4gbW9kaWZpZWQsIHNvIG1hcmsgcHJpb3JzIGluZm9ybWF0aW9uXG4gICAgICAgIC8vIGFzIFwib3V0ZGF0ZWRcIlxuICAgICAgICB0aGlzLmhhc1VwZGF0ZWRQcmlvcnNJbmZvcm1hdGlvbiA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBudW1iZXIgb2YgcHJpb3JzIHJlZmVyZW5jZWQgaW5mb1xuICAgICAgICB0aGlzLnVwZGF0ZU51bWJlck9mUHJpb3JzUmVmZXJlbmNlZCgpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbW9kaWZpZWREYXRlIHdpdGggdGhlIGN1cnJlbnQgRGF0ZS9UaW1lXG4gICAgICAgIHRoaXMubW9kaWZpZWREYXRlID0gbmV3IERhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPY2Nhc2lvbmFsbHkgdGhlIFByb3RvY29sIGNsYXNzIG5lZWRzIHRvIGJlIGluc3RhbnRpYXRlZCBmcm9tIGEgSmF2YVNjcmlwdCBPYmplY3RcbiAgICAgKiBjb250YWluaW5nIHRoZSBQcm90b2NvbCBkYXRhLiBUaGlzIGZ1bmN0aW9uIGZpbGxzIGluIGEgUHJvdG9jb2wgd2l0aCB0aGUgT2JqZWN0XG4gICAgICogZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbnB1dCBBIFByb3RvY29sIGFzIGEgSmF2YVNjcmlwdCBPYmplY3QsIGUuZy4gcmV0cmlldmVkIGZyb20gTW9uZ29EQiBvciBKU09OXG4gICAgICovXG4gICAgZnJvbU9iamVjdChpbnB1dCkge1xuICAgICAgICAvLyBDaGVjayBpZiB0aGUgaW5wdXQgYWxyZWFkeSBoYXMgYW4gSURcbiAgICAgICAgLy8gSWYgc28sIGtlZXAgaXQuIEl0IG5vdCwgY3JlYXRlIGEgbmV3IFVVSURcbiAgICAgICAgdGhpcy5pZCA9IGlucHV0LmlkIHx8IFJhbmRvbS5pZCgpO1xuXG4gICAgICAgIC8vIEFzc2lnbiB0aGUgaW5wdXQgbmFtZSB0byB0aGUgUHJvdG9jb2xcbiAgICAgICAgdGhpcy5uYW1lID0gaW5wdXQubmFtZTtcblxuICAgICAgICAvLyBSZXRyaWV2ZSBsb2NrZWQgc3RhdHVzLCB1c2UgISEgdG8gbWFrZSBpdCB0cnV0aHlcbiAgICAgICAgLy8gc28gdGhhdCB1bmRlZmluZWQgdmFsdWVzIHdpbGwgYmUgc2V0IHRvIGZhbHNlXG4gICAgICAgIHRoaXMubG9ja2VkID0gISFpbnB1dC5sb2NrZWQ7XG5cbiAgICAgICAgLy8gVE9ETzogQ2hlY2sgaG93IHRvIHJlZ2VuZXJhdGUgU2V0IGZyb20gT2JqZWN0XG4gICAgICAgIC8vdGhpcy5hdmFpbGFibGVUbyA9IG5ldyBTZXQoaW5wdXQuYXZhaWxhYmxlVG8pO1xuICAgICAgICAvL3RoaXMuZWRpdGFibGVCeSA9IG5ldyBTZXQoaW5wdXQuZWRpdGFibGVCeSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGlucHV0IGNvbnRhaW5zIFByb3RvY29sIG1hdGNoaW5nIHJ1bGVzXG4gICAgICAgIGlmIChpbnB1dC5wcm90b2NvbE1hdGNoaW5nUnVsZXMpIHtcbiAgICAgICAgICAgIGlucHV0LnByb3RvY29sTWF0Y2hpbmdSdWxlcy5mb3JFYWNoKHJ1bGVPYmplY3QgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBuZXcgUnVsZXMgZnJvbSB0aGUgc3RvcmVkIGRhdGFcbiAgICAgICAgICAgICAgICB2YXIgcnVsZSA9IG5ldyBIUC5Qcm90b2NvbE1hdGNoaW5nUnVsZSgpO1xuICAgICAgICAgICAgICAgIHJ1bGUuZnJvbU9iamVjdChydWxlT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGVtIHRvIHRoZSBQcm90b2NvbFxuICAgICAgICAgICAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGluZ1J1bGVzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBpbnB1dCBjb250YWlucyBkYXRhIGZvciB2YXJpb3VzIFN0YWdlcyBpbiB0aGVcbiAgICAgICAgLy8gZGlzcGxheSBzZXQgc2VxdWVuY2VcbiAgICAgICAgaWYgKGlucHV0LnN0YWdlcykge1xuICAgICAgICAgICAgaW5wdXQuc3RhZ2VzLmZvckVhY2goc3RhZ2VPYmplY3QgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBTdGFnZXMgZnJvbSB0aGUgc3RvcmVkIGRhdGFcbiAgICAgICAgICAgICAgICB2YXIgc3RhZ2UgPSBuZXcgSFAuU3RhZ2UoKTtcbiAgICAgICAgICAgICAgICBzdGFnZS5mcm9tT2JqZWN0KHN0YWdlT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGVtIHRvIHRoZSBQcm90b2NvbFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhZ2VzLnB1c2goc3RhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY2xvbmUgb2YgdGhlIGN1cnJlbnQgUHJvdG9jb2wgd2l0aCBhIG5ldyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQcm90b2NvbHwqfVxuICAgICAqL1xuICAgIGNyZWF0ZUNsb25lKG5hbWUpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IEphdmFTY3JpcHQgaW5kZXBlbmRlbnQgb2YgdGhlIGN1cnJlbnQgUHJvdG9jb2xcbiAgICAgICAgdmFyIGN1cnJlbnRQcm90b2NvbCA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBQcm90b2NvbCB0byByZXR1cm5cbiAgICAgICAgdmFyIGNsb25lZFByb3RvY29sID0gbmV3IEhQLlByb3RvY29sKCk7XG5cbiAgICAgICAgLy8gQXBwbHkgdGhlIGRlc2lyZWQgcHJvcGVydGllc1xuICAgICAgICBjdXJyZW50UHJvdG9jb2wuaWQgPSBjbG9uZWRQcm90b2NvbC5pZDtcbiAgICAgICAgY2xvbmVkUHJvdG9jb2wuZnJvbU9iamVjdChjdXJyZW50UHJvdG9jb2wpO1xuXG4gICAgICAgIC8vIElmIHdlIGhhdmUgc3BlY2lmaWVkIGEgbmFtZSwgYXNzaWduIGl0XG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICBjbG9uZWRQcm90b2NvbC5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVubG9jayB0aGUgY2xvbmVcbiAgICAgICAgY2xvbmVkUHJvdG9jb2wubG9ja2VkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBjbG9uZWQgUHJvdG9jb2xcbiAgICAgICAgcmV0dXJuIGNsb25lZFByb3RvY29sO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBTdGFnZSB0byB0aGlzIFByb3RvY29sJ3MgZGlzcGxheSBzZXQgc2VxdWVuY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGFnZVxuICAgICAqL1xuICAgIGFkZFN0YWdlKHN0YWdlKSB7XG4gICAgICAgIHRoaXMuc3RhZ2VzLnB1c2goc3RhZ2UpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbW9kaWZpZWREYXRlIGFuZCBVc2VyIHRoYXQgbGFzdFxuICAgICAgICAvLyBtb2RpZmllZCB0aGlzIFByb3RvY29sXG4gICAgICAgIHRoaXMucHJvdG9jb2xXYXNNb2RpZmllZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBSdWxlIHRvIHRoaXMgUHJvdG9jb2wncyBhcnJheSBvZiBtYXRjaGluZyBydWxlc1xuICAgICAqXG4gICAgICogQHBhcmFtIHJ1bGVcbiAgICAgKi9cbiAgICBhZGRQcm90b2NvbE1hdGNoaW5nUnVsZShydWxlKSB7XG4gICAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGluZ1J1bGVzLnB1c2gocnVsZSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtb2RpZmllZERhdGUgYW5kIFVzZXIgdGhhdCBsYXN0XG4gICAgICAgIC8vIG1vZGlmaWVkIHRoaXMgUHJvdG9jb2xcbiAgICAgICAgdGhpcy5wcm90b2NvbFdhc01vZGlmaWVkKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIFJ1bGUgZnJvbSB0aGlzIFByb3RvY29sJ3MgYXJyYXkgb2YgbWF0Y2hpbmcgcnVsZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBydWxlXG4gICAgICovXG4gICAgcmVtb3ZlUHJvdG9jb2xNYXRjaGluZ1J1bGUocnVsZSkge1xuICAgICAgICB2YXIgd2FzUmVtb3ZlZCA9IHJlbW92ZUZyb21BcnJheSh0aGlzLnByb3RvY29sTWF0Y2hpbmdSdWxlcywgcnVsZSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtb2RpZmllZERhdGUgYW5kIFVzZXIgdGhhdCBsYXN0XG4gICAgICAgIC8vIG1vZGlmaWVkIHRoaXMgUHJvdG9jb2xcbiAgICAgICAgaWYgKHdhc1JlbW92ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvdG9jb2xXYXNNb2RpZmllZCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsImltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuXG5pbXBvcnQgeyBjb21wYXJhdG9ycyB9IGZyb20gJy4uL2xpYi9jb21wYXJhdG9ycyc7XG5cbmNvbnN0IEVRVUFMU19SRUdFWFAgPSAvXmVxdWFscyQvO1xuXG4vKipcbiAqIFRoaXMgQ2xhc3MgcmVwcmVzZW50cyBhIFJ1bGUgdG8gYmUgZXZhbHVhdGVkIGdpdmVuIGEgc2V0IG9mIGF0dHJpYnV0ZXNcbiAqIFJ1bGVzIGhhdmU6XG4gKiAtIEFuIGF0dHJpYnV0ZSAoZS5nLiAnc2VyaWVzRGVzY3JpcHRpb24nKVxuICogLSBBIGNvbnN0cmFpbnQgT2JqZWN0LCBpbiB0aGUgZm9ybSByZXF1aXJlZCBieSBWYWxpZGF0ZS5qczpcbiAqXG4gKiBydWxlLmNvbnN0cmFpbnQgPSB7XG4gKiAgIGNvbnRhaW5zOiB7XG4gKiAgICAgIHZhbHVlOiAnVC0xJ1xuICogICAgICB9XG4gKiAgIH07XG4gKlxuICogIE5vdGU6IEluIHRoaXMgZXhhbXBsZSB3ZSB1c2UgdGhlICdjb250YWlucycgVmFsaWRhdG9yLCB3aGljaCBpcyBhIGN1c3RvbSBWYWxpZGF0b3IgZGVmaW5lZCBpbiBWaWV3ZXJiYXNlXG4gKlxuICogLSBBIHZhbHVlIGZvciB3aGV0aGVyIG9yIG5vdCB0aGV5IGFyZSBSZXF1aXJlZCB0byBiZSBtYXRjaGVkIChkZWZhdWx0OiBGYWxzZSlcbiAqIC0gQSB2YWx1ZSBmb3IgdGhlaXIgcmVsYXRpdmUgd2VpZ2h0aW5nIGR1cmluZyBQcm90b2NvbCBvciBJbWFnZSBtYXRjaGluZyAoZGVmYXVsdDogMSlcbiAqL1xuZXhwb3J0IGNsYXNzIFJ1bGUge1xuICAgIC8qKlxuICAgICAqIFRoZSBDb25zdHJ1Y3RvciBmb3IgdGhlIENsYXNzIHRvIGNyZWF0ZSBhIFJ1bGUgd2l0aCB0aGUgYmFyZVxuICAgICAqIG1pbmltdW0gaW5mb3JtYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFRoZSBkZXNpcmVkIG5hbWUgZm9yIHRoZSBSdWxlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYXR0cmlidXRlLCBjb25zdHJhaW50LCByZXF1aXJlZCwgd2VpZ2h0KSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBVVUlEIGZvciB0aGlzIFJ1bGVcbiAgICAgICAgdGhpcy5pZCA9IFJhbmRvbS5pZCgpO1xuXG4gICAgICAgIC8vIFNldCB0aGUgUnVsZSdzIHdlaWdodCAoZGVmYXVsdHMgdG8gMSlcbiAgICAgICAgdGhpcy53ZWlnaHQgPSB3ZWlnaHQgfHwgMTtcblxuICAgICAgICAvLyBJZiBhbiBhdHRyaWJ1dGUgaXMgc3BlY2lmaWVkLCBhc3NpZ24gaXRcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGNvbnN0cmFpbnQgaXMgc3BlY2lmaWVkLCBhc3NpZ24gaXRcbiAgICAgICAgaWYgKGNvbnN0cmFpbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY29uc3RyYWludCA9IGNvbnN0cmFpbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIHZhbHVlIGZvciAncmVxdWlyZWQnIGlzIHNwZWNpZmllZCwgYXNzaWduIGl0XG4gICAgICAgIGlmIChyZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiBubyB2YWx1ZSB3YXMgc3BlY2lmaWVkLCBkZWZhdWx0IHRvIEZhbHNlXG4gICAgICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVpcmVkID0gcmVxdWlyZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWNoZSBmb3IgY29uc3RyYWludCBpbmZvIG9iamVjdFxuICAgICAgICB0aGlzLl9jb25zdHJhaW50SW5mbyA9IHZvaWQgMDtcblxuICAgICAgICAvLyBDYWNoZSBmb3IgdmFsaWRhdG9yIGFuZCB2YWx1ZSBvYmplY3RcbiAgICAgICAgdGhpcy5fdmFsaWRhdG9yQW5kVmFsdWUgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2NjYXNpb25hbGx5IHRoZSBSdWxlIGNsYXNzIG5lZWRzIHRvIGJlIGluc3RhbnRpYXRlZCBmcm9tIGEgSmF2YVNjcmlwdCBPYmplY3QuXG4gICAgICogVGhpcyBmdW5jdGlvbiBmaWxscyBpbiBhIFByb3RvY29sIHdpdGggdGhlIE9iamVjdCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlucHV0IEEgUnVsZSBhcyBhIEphdmFTY3JpcHQgT2JqZWN0LCBlLmcuIHJldHJpZXZlZCBmcm9tIE1vbmdvREIgb3IgSlNPTlxuICAgICAqL1xuICAgIGZyb21PYmplY3QoaW5wdXQpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGlucHV0IGFscmVhZHkgaGFzIGFuIElEXG4gICAgICAgIC8vIElmIHNvLCBrZWVwIGl0LiBJdCBub3QsIGNyZWF0ZSBhIG5ldyBVVUlEXG4gICAgICAgIHRoaXMuaWQgPSBpbnB1dC5pZCB8fCBSYW5kb20uaWQoKTtcblxuICAgICAgICAvLyBBc3NpZ24gdGhlIHNwZWNpZmllZCBpbnB1dCBkYXRhIHRvIHRoZSBSdWxlXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBpbnB1dC5yZXF1aXJlZDtcbiAgICAgICAgdGhpcy53ZWlnaHQgPSBpbnB1dC53ZWlnaHQ7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlID0gaW5wdXQuYXR0cmlidXRlO1xuICAgICAgICB0aGlzLmNvbnN0cmFpbnQgPSBpbnB1dC5jb25zdHJhaW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY29uc3RyYWludCBpbmZvIG9iamVjdCBmb3IgdGhlIGN1cnJlbnQgY29uc3RyYWludFxuICAgICAqIEByZXR1cm4ge09iamVjdFxcdW5kZWZpbmVkfSBDb25zdHJhaW50IG9iamVjdCBvciB1bmRlZmluZWQgaWYgY3VycmVudCBjb25zdHJhaW50IFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIG5vdCB2YWxpZCBvciBub3QgZm91bmQgaW4gY29tcGFyYXRvcnMgbGlzdFxuICAgICAqL1xuICAgIGdldENvbnN0cmFpbnRJbmZvKCkge1xuICAgICAgICBsZXQgY29uc3RyYWludEluZm8gPSB0aGlzLl9jb25zdHJhaW50SW5mbztcbiAgICAgICAgLy8gQ2hlY2sgaWYgaW5mbyBpcyBjYWNoZWQgYWxyZWFkeVxuICAgICAgICBpZiAoY29uc3RyYWludEluZm8gIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnN0cmFpbnRJbmZvO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcnVsZUNvbnN0cmFpbnQgPSBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cmFpbnQpWzBdO1xuXG4gICAgICAgIGlmIChydWxlQ29uc3RyYWludCAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICBjb25zdHJhaW50SW5mbyA9IGNvbXBhcmF0b3JzLmZpbmQoY29tcGFyYXRvciA9PiBydWxlQ29uc3RyYWludCA9PT0gY29tcGFyYXRvci5pZClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhY2hlIHRoaXMgaW5mb3JtYXRpb24gZm9yIGxhdGVyIHVzZVxuICAgICAgICB0aGlzLl9jb25zdHJhaW50SW5mbyA9IGNvbnN0cmFpbnRJbmZvO1xuXG4gICAgICAgIHJldHVybiBjb25zdHJhaW50SW5mbztcbiAgICB9XG5cbiAgICAgLyoqXG4gICAgICogQ2hlY2sgaWYgY3VycmVudCBydWxlIGlzIHJlbGF0ZWQgdG8gcHJpb3JzXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBhIHJ1bGUgaXMgcmVsYXRlZCB0byBwcmlvcnMgb3IgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgaXNSdWxlRm9yUHJpb3IoKSB7XG4gICAgICAgIC8vIEBUT0RPOiBTaG91bGQgd2UgY2hlY2sgdGhpcyB0b28/IHRoaXMuYXR0cmlidXRlID09PSAncmVsYXRpdmVUaW1lJ1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUgPT09ICdhYnN0cmFjdFByaW9yVmFsdWUnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHRoZSBjdXJyZW50IHJ1bGUgaXMgYSBydWxlIGZvciBwcmlvcnMsIHJldHVybnMgdGhlIG51bWJlciBvZiByZWZlcmVuY2VkIHByaW9ycy4gT3RoZXJ3aXNlLCByZXR1cm5zIC0xLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiByZWZlcmVuY2VkIHByaW9ycyBvciAtMSBpZiBub3QgYXBwbGljYWJsZS4gUmV0dXJucyB6ZXJvIGlmIHRoZSBhY3R1YWwgdmFsdWUgY291bGQgbm90IGJlIGRldGVybWluZWQuXG4gICAgICovXG4gICAgZ2V0TnVtYmVyT2ZQcmlvcnNSZWZlcmVuY2VkKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNSdWxlRm9yUHJpb3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IHJ1bGUncyB2YWxpZGF0b3IgYW5kIHZhbHVlXG4gICAgICAgIGNvbnN0IHJ1bGVWYWxpZGF0b3JBbmRWYWx1ZSA9IHRoaXMuZ2V0Q29uc3RyYWludFZhbGlkYXRvckFuZFZhbHVlKCk7XG4gICAgICAgIGNvbnN0IHsgdmFsdWUsIHZhbGlkYXRvciB9ID0gcnVsZVZhbGlkYXRvckFuZFZhbHVlO1xuICAgICAgICBjb25zdCBpbnRWYWx1ZSA9IHBhcnNlSW50KHZhbHVlLCAxMCkgfHwgMDsgLy8gYXZvaWQgcG9zc2libGUgTmFOXG5cbiAgICAgICAgLy8gXCJFcXVhbCB0b1wiIHZhbGlkYXRvcnNcbiAgICAgICAgaWYgKEVRVUFMU19SRUdFWFAudGVzdCh2YWxpZGF0b3IpKSB7XG4gICAgICAgICAgICAvLyBJbiB0aGlzIGNhc2UsIC0xICh0aGUgb2xkZXN0IHByaW9yKSBpbmRpY2F0ZXMgdGhhdCBhdCBsZWFzdCBvbmUgc3R1ZHkgaXMgdXNlZFxuICAgICAgICAgICAgcmV0dXJuIGludFZhbHVlIDwgMCA/IDEgOiBpbnRWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlZmF1bHQgY2FzZXMgcmV0dXJuIHZhbHVlXG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY29uc3RyYWludCB2YWxpZGF0b3IgYW5kIHZhbHVlXG4gICAgICogQHJldHVybiB7T2JqZWN0fHVuZGVmaW5lZH0gUmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgdmFsaWRhdG9yIGFuZCBpdCdzIHZhbHVlIG9yIHVuZGVmaW5lZFxuICAgICAqL1xuICAgIGdldENvbnN0cmFpbnRWYWxpZGF0b3JBbmRWYWx1ZSgpIHtcbiAgICAgICAgbGV0IHZhbGlkYXRvckFuZFZhbHVlID0gdGhpcy5fdmFsaWRhdG9yQW5kVmFsdWU7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBpZiB2YWxpZGF0b3IgYW5kIHZhbHVlIGFyZSBjYWNoZWQgYWxyZWFkeVxuICAgICAgICBpZiAodmFsaWRhdG9yQW5kVmFsdWUgIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvckFuZFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IHRoZSBjb25zdHJhaW50IGluZm8gb2JqZWN0XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnRJbmZvID0gdGhpcy5nZXRDb25zdHJhaW50SW5mbygpO1xuXG4gICAgICAgIC8vIENvbnN0cmFpbnQgaW5mbyBvYmplY3QgZXhpc3RzIGFuZCBpcyB2YWxpZFxuICAgICAgICBpZiAoY29uc3RyYWludEluZm8gIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29uc3RyYWludEluZm8udmFsaWRhdG9yO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFZhbGlkYXRvciA9IHRoaXMuY29uc3RyYWludFt2YWxpZGF0b3JdO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFZhbGlkYXRvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cmFpbnRWYWxpZGF0b3IgPSBjb25zdHJhaW50SW5mby52YWxpZGF0b3JPcHRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgY29uc3RyYWludFZhbHVlID0gY3VycmVudFZhbGlkYXRvcltjb25zdHJhaW50VmFsaWRhdG9yXTtcblxuICAgICAgICAgICAgICAgIHZhbGlkYXRvckFuZFZhbHVlID0ge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY29uc3RyYWludFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGNvbnN0cmFpbnRJbmZvLmlkXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRvckFuZFZhbHVlID0gdmFsaWRhdG9yQW5kVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsaWRhdG9yQW5kVmFsdWU7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5cbi8qKlxuICogQSBTdGFnZSBpcyBvbmUgc3RlcCBpbiB0aGUgRGlzcGxheSBTZXQgU2VxdWVuY2UgZm9yIGEgSGFuZ2luZyBQcm90b2NvbFxuICpcbiAqIFN0YWdlcyBhcmUgZGVmaW5lZCBhcyBhIFZpZXdwb3J0U3RydWN0dXJlIGFuZCBhbiBhcnJheSBvZiBWaWV3cG9ydHNcbiAqXG4gKiBAdHlwZSB7U3RhZ2V9XG4gKi9cbkhQLlN0YWdlID0gY2xhc3MgU3RhZ2Uge1xuICAgIGNvbnN0cnVjdG9yKFZpZXdwb3J0U3RydWN0dXJlLCBuYW1lKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBVVUlEIGZvciB0aGlzIFN0YWdlXG4gICAgICAgIHRoaXMuaWQgPSBSYW5kb20uaWQoKTtcblxuICAgICAgICAvLyBBc3NpZ24gdGhlIG5hbWUgYW5kIFZpZXdwb3J0U3RydWN0dXJlIHByb3ZpZGVkXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMudmlld3BvcnRTdHJ1Y3R1cmUgPSBWaWV3cG9ydFN0cnVjdHVyZTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gZW1wdHkgYXJyYXkgZm9yIHRoZSBWaWV3cG9ydHNcbiAgICAgICAgdGhpcy52aWV3cG9ydHMgPSBbXTtcblxuICAgICAgICAvLyBTZXQgdGhlIGNyZWF0ZWQgZGF0ZSB0byBOb3dcbiAgICAgICAgdGhpcy5jcmVhdGVkRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNsb25lIG9mIHRoZSBjdXJyZW50IFN0YWdlIHdpdGggYSBuZXcgbmFtZVxuICAgICAqXG4gICAgICogTm90ZSEgVGhpcyBtZXRob2QgYWJzb2x1dGVseSBjYW5ub3QgYmUgcmVuYW1lZCAnY2xvbmUnLCBiZWNhdXNlXG4gICAgICogTWluaW1vbmdvJ3MgaW5zZXJ0IG1ldGhvZCB1c2VzICdjbG9uZScgaW50ZXJuYWxseSBhbmQgdGhpc1xuICAgICAqIHNvbWVob3cgY2F1c2VzIHZlcnkgYml6YXJyZSBiZWhhdmlvdXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICogQHJldHVybnMge1N0YWdlfCp9XG4gICAgICovXG4gICAgY3JlYXRlQ2xvbmUobmFtZSkge1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgSmF2YVNjcmlwdCBpbmRlcGVuZGVudCBvZiB0aGUgY3VycmVudCBQcm90b2NvbFxuICAgICAgICB2YXIgY3VycmVudFN0YWdlID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IFN0YWdlIHRvIHJldHVyblxuICAgICAgICB2YXIgY2xvbmVkU3RhZ2UgPSBuZXcgSFAuU3RhZ2UoKTtcblxuICAgICAgICAvLyBBc3NpZ24gdGhlIGRlc2lyZWQgcHJvcGVydGllc1xuICAgICAgICBjdXJyZW50U3RhZ2UuaWQgPSBjbG9uZWRTdGFnZS5pZDtcbiAgICAgICAgY2xvbmVkU3RhZ2UuZnJvbU9iamVjdChjdXJyZW50U3RhZ2UpO1xuXG4gICAgICAgIC8vIElmIHdlIGhhdmUgc3BlY2lmaWVkIGEgbmFtZSwgYXNzaWduIGl0XG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICBjbG9uZWRTdGFnZS5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgY2xvbmVkIFN0YWdlXG4gICAgICAgIHJldHVybiBjbG9uZWRTdGFnZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPY2Nhc2lvbmFsbHkgdGhlIFN0YWdlIGNsYXNzIG5lZWRzIHRvIGJlIGluc3RhbnRpYXRlZCBmcm9tIGEgSmF2YVNjcmlwdCBPYmplY3QuXG4gICAgICogVGhpcyBmdW5jdGlvbiBmaWxscyBpbiBhIFByb3RvY29sIHdpdGggdGhlIE9iamVjdCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlucHV0IEEgU3RhZ2UgYXMgYSBKYXZhU2NyaXB0IE9iamVjdCwgZS5nLiByZXRyaWV2ZWQgZnJvbSBNb25nb0RCIG9yIEpTT05cbiAgICAgKi9cbiAgICBmcm9tT2JqZWN0KGlucHV0KSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBpbnB1dCBhbHJlYWR5IGhhcyBhbiBJRFxuICAgICAgICAvLyBJZiBzbywga2VlcCBpdC4gSXQgbm90LCBjcmVhdGUgYSBuZXcgVVVJRFxuICAgICAgICB0aGlzLmlkID0gaW5wdXQuaWQgfHwgUmFuZG9tLmlkKCk7XG5cbiAgICAgICAgLy8gQXNzaWduIHRoZSBpbnB1dCBuYW1lIHRvIHRoZSBTdGFnZVxuICAgICAgICB0aGlzLm5hbWUgPSBpbnB1dC5uYW1lO1xuXG4gICAgICAgIC8vIElmIGEgVmlld3BvcnRTdHJ1Y3R1cmUgaXMgcHJlc2VudCBpbiB0aGUgaW5wdXQsIGFkZCBpdCBmcm9tIHRoZVxuICAgICAgICAvLyBpbnB1dCBkYXRhXG4gICAgICAgIHRoaXMudmlld3BvcnRTdHJ1Y3R1cmUgPSBuZXcgSFAuVmlld3BvcnRTdHJ1Y3R1cmUoKTtcbiAgICAgICAgdGhpcy52aWV3cG9ydFN0cnVjdHVyZS5mcm9tT2JqZWN0KGlucHV0LnZpZXdwb3J0U3RydWN0dXJlKTtcblxuICAgICAgICAvLyBJZiBhbnkgdmlld3BvcnRzIGFyZSBwcmVzZW50IGluIHRoZSBpbnB1dCBvYmplY3RcbiAgICAgICAgaWYgKGlucHV0LnZpZXdwb3J0cykge1xuICAgICAgICAgICAgaW5wdXQudmlld3BvcnRzLmZvckVhY2godmlld3BvcnRPYmplY3QgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBWaWV3cG9ydCB3aXRoIHRoZWlyIGRhdGFcbiAgICAgICAgICAgICAgICB2YXIgdmlld3BvcnQgPSBuZXcgSFAuVmlld3BvcnQoKTtcbiAgICAgICAgICAgICAgICB2aWV3cG9ydC5mcm9tT2JqZWN0KHZpZXdwb3J0T2JqZWN0KTtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCBpdCB0byB0aGUgdmlld3BvcnRzIGFycmF5XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3cG9ydHMucHVzaCh2aWV3cG9ydCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiLy8gTG9jYWwgaW1wb3J0c1xuaW1wb3J0IHsgcmVtb3ZlRnJvbUFycmF5IH0gZnJvbSAnLi4vbGliL3JlbW92ZUZyb21BcnJheSc7XG5cbi8qKlxuICogVGhpcyBDbGFzcyBkZWZpbmVzIGEgVmlld3BvcnQgaW4gdGhlIEhhbmdpbmcgUHJvdG9jb2wgU3RhZ2UuIEEgVmlld3BvcnQgY29udGFpbnNcbiAqIGFycmF5cyBvZiBSdWxlcyB0aGF0IGFyZSBtYXRjaGVkIGluIHRoZSBQcm90b2NvbEVuZ2luZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgd2hpY2hcbiAqIGltYWdlcyBzaG91bGQgYmUgaHVuZy5cbiAqXG4gKiBAdHlwZSB7Vmlld3BvcnR9XG4gKi9cbkhQLlZpZXdwb3J0ID0gY2xhc3MgVmlld3BvcnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnZpZXdwb3J0U2V0dGluZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5pbWFnZU1hdGNoaW5nUnVsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXJpZXNNYXRjaGluZ1J1bGVzID0gW107XG4gICAgICAgIHRoaXMuc3R1ZHlNYXRjaGluZ1J1bGVzID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2NjYXNpb25hbGx5IHRoZSBWaWV3cG9ydCBjbGFzcyBuZWVkcyB0byBiZSBpbnN0YW50aWF0ZWQgZnJvbSBhIEphdmFTY3JpcHQgT2JqZWN0LlxuICAgICAqIFRoaXMgZnVuY3Rpb24gZmlsbHMgaW4gYSBWaWV3cG9ydCB3aXRoIHRoZSBPYmplY3QgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbnB1dCBUaGUgVmlld3BvcnQgYXMgYSBKYXZhU2NyaXB0IE9iamVjdCwgZS5nLiByZXRyaWV2ZWQgZnJvbSBNb25nb0RCIG9yIEpTT05cbiAgICAgKi9cbiAgICBmcm9tT2JqZWN0KGlucHV0KSB7XG4gICAgICAgIC8vIElmIEltYWdlTWF0Y2hpbmdSdWxlcyBleGlzdCwgY3JlYXRlIHRoZW0gZnJvbSB0aGUgT2JqZWN0IGRhdGFcbiAgICAgICAgLy8gYW5kIGFkZCB0aGVtIHRvIHRoZSBWaWV3cG9ydCdzIGltYWdlTWF0Y2hpbmdSdWxlcyBhcnJheVxuICAgICAgICBpZiAoaW5wdXQuaW1hZ2VNYXRjaGluZ1J1bGVzKSB7XG4gICAgICAgICAgICBpbnB1dC5pbWFnZU1hdGNoaW5nUnVsZXMuZm9yRWFjaChydWxlT2JqZWN0ID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcnVsZSA9IG5ldyBIUC5JbWFnZU1hdGNoaW5nUnVsZSgpO1xuICAgICAgICAgICAgICAgIHJ1bGUuZnJvbU9iamVjdChydWxlT2JqZWN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlTWF0Y2hpbmdSdWxlcy5wdXNoKHJ1bGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBTZXJpZXNNYXRjaGluZ1J1bGVzIGV4aXN0LCBjcmVhdGUgdGhlbSBmcm9tIHRoZSBPYmplY3QgZGF0YVxuICAgICAgICAvLyBhbmQgYWRkIHRoZW0gdG8gdGhlIFZpZXdwb3J0J3Mgc2VyaWVzTWF0Y2hpbmdSdWxlcyBhcnJheVxuICAgICAgICBpZiAoaW5wdXQuc2VyaWVzTWF0Y2hpbmdSdWxlcykge1xuICAgICAgICAgICAgaW5wdXQuc2VyaWVzTWF0Y2hpbmdSdWxlcy5mb3JFYWNoKHJ1bGVPYmplY3QgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBydWxlID0gbmV3IEhQLlNlcmllc01hdGNoaW5nUnVsZSgpO1xuICAgICAgICAgICAgICAgIHJ1bGUuZnJvbU9iamVjdChydWxlT2JqZWN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcmllc01hdGNoaW5nUnVsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgU3R1ZHlNYXRjaGluZ1J1bGVzIGV4aXN0LCBjcmVhdGUgdGhlbSBmcm9tIHRoZSBPYmplY3QgZGF0YVxuICAgICAgICAvLyBhbmQgYWRkIHRoZW0gdG8gdGhlIFZpZXdwb3J0J3Mgc3R1ZHlNYXRjaGluZ1J1bGVzIGFycmF5XG4gICAgICAgIGlmIChpbnB1dC5zdHVkeU1hdGNoaW5nUnVsZXMpIHtcbiAgICAgICAgICAgIGlucHV0LnN0dWR5TWF0Y2hpbmdSdWxlcy5mb3JFYWNoKHJ1bGVPYmplY3QgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBydWxlID0gbmV3IEhQLlN0dWR5TWF0Y2hpbmdSdWxlKCk7XG4gICAgICAgICAgICAgICAgcnVsZS5mcm9tT2JqZWN0KHJ1bGVPYmplY3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1ZHlNYXRjaGluZ1J1bGVzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIFZpZXdwb3J0U2V0dGluZ3MgZXhpc3QsIGFkZCB0aGVtIHRvIHRoZSBjdXJyZW50IHByb3RvY29sXG4gICAgICAgIGlmIChpbnB1dC52aWV3cG9ydFNldHRpbmdzKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdwb3J0U2V0dGluZ3MgPSBpbnB1dC52aWV3cG9ydFNldHRpbmdzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYW5kIHJlbW92ZXMgYSBydWxlIGZyb20gd2hpY2hldmVyIGFycmF5IGl0IGV4aXN0cyBpbi5cbiAgICAgKiBJdCBpcyBub3QgcmVxdWlyZWQgdG8gc3BlY2lmeSBpZiBpdCBleGlzdHMgaW4gc3R1ZHlNYXRjaGluZ1J1bGVzLFxuICAgICAqIHNlcmllc01hdGNoaW5nUnVsZXMsIG9yIGltYWdlTWF0Y2hpbmdSdWxlc1xuICAgICAqXG4gICAgICogQHBhcmFtIHJ1bGVcbiAgICAgKi9cbiAgICByZW1vdmVSdWxlKHJ1bGUpIHtcbiAgICAgICAgdmFyIGFycmF5O1xuICAgICAgICBpZiAocnVsZSBpbnN0YW5jZW9mIEhQLlN0dWR5TWF0Y2hpbmdSdWxlKSB7XG4gICAgICAgICAgICBhcnJheSA9IHRoaXMuc3R1ZHlNYXRjaGluZ1J1bGVzO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGUgaW5zdGFuY2VvZiBIUC5TZXJpZXNNYXRjaGluZ1J1bGUpIHtcbiAgICAgICAgICAgIGFycmF5ID0gdGhpcy5zZXJpZXNNYXRjaGluZ1J1bGVzO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGUgaW5zdGFuY2VvZiBIUC5JbWFnZU1hdGNoaW5nUnVsZSkge1xuICAgICAgICAgICAgYXJyYXkgPSB0aGlzLmltYWdlTWF0Y2hpbmdSdWxlcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbW92ZUZyb21BcnJheShhcnJheSwgcnVsZSk7XG4gICAgfVxufTsiLCIvKipcbiAqIFRoZSBWaWV3cG9ydFN0cnVjdHVyZSBjbGFzcyByZXByZXNlbnRzIHRoZSBsYXlvdXQgYW5kIGxheW91dCBwcm9wZXJ0aWVzIHRoYXRcbiAqIFZpZXdwb3J0cyBhcmUgZGlzcGxheWVkIGluLiBWaWV3cG9ydFN0cnVjdHVyZSBoYXMgYSB0eXBlLCB3aGljaCBjb3JyZXNwb25kcyB0b1xuICogYSBsYXlvdXQgdGVtcGxhdGUsIGFuZCBhIHNldCBvZiBwcm9wZXJ0aWVzLCB3aGljaCBkZXBlbmQgb24gdGhlIHR5cGUuXG4gKlxuICogQHR5cGUge1ZpZXdwb3J0U3RydWN0dXJlfVxuICovXG5IUC5WaWV3cG9ydFN0cnVjdHVyZSA9IGNsYXNzIFZpZXdwb3J0U3RydWN0dXJlIHtcbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2NjYXNpb25hbGx5IHRoZSBWaWV3cG9ydFN0cnVjdHVyZSBjbGFzcyBuZWVkcyB0byBiZSBpbnN0YW50aWF0ZWQgZnJvbSBhIEphdmFTY3JpcHQgT2JqZWN0LlxuICAgICAqIFRoaXMgZnVuY3Rpb24gZmlsbHMgaW4gYSBWaWV3cG9ydFN0cnVjdHVyZSB3aXRoIHRoZSBPYmplY3QgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbnB1dCBUaGUgVmlld3BvcnRTdHJ1Y3R1cmUgYXMgYSBKYXZhU2NyaXB0IE9iamVjdCwgZS5nLiByZXRyaWV2ZWQgZnJvbSBNb25nb0RCIG9yIEpTT05cbiAgICAgKi9cbiAgICBmcm9tT2JqZWN0KGlucHV0KSB7XG4gICAgICAgIHRoaXMudHlwZSA9IGlucHV0LnR5cGU7XG4gICAgICAgIHRoaXMucHJvcGVydGllcyA9IGlucHV0LnByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGxheW91dCB0ZW1wbGF0ZSBuYW1lIGJhc2VkIG9uIHRoZSBsYXlvdXQgdHlwZVxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRMYXlvdXRUZW1wbGF0ZU5hbWUoKSB7XG4gICAgICAgIC8vIFZpZXdwb3J0IHN0cnVjdHVyZSBjYW4gYmUgdXBkYXRlZCBsYXRlciB3aGVuIHdlIGJ1aWxkIG1vcmUgY29tcGxleCBkaXNwbGF5IGxheW91dHNcbiAgICAgICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2dyaWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiAnZ3JpZExheW91dCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgbnVtYmVyIG9mIFZpZXdwb3J0cyByZXF1aXJlZCBmb3IgdGhpcyBsYXlvdXRcbiAgICAgKiBnaXZlbiB0aGUgbGF5b3V0IHR5cGUgYW5kIHByb3BlcnRpZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0TnVtVmlld3BvcnRzKCkge1xuICAgICAgICAvLyBWaWV3cG9ydCBzdHJ1Y3R1cmUgY2FuIGJlIHVwZGF0ZWQgbGF0ZXIgd2hlbiB3ZSBidWlsZCBtb3JlIGNvbXBsZXggZGlzcGxheSBsYXlvdXRzXG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdncmlkJzpcbiAgICAgICAgICAgICAgICAvLyBGb3IgdGhlIHR5cGljYWwgZ3JpZCBsYXlvdXQsIHdlIG9ubHkgbmVlZCB0byBtdWx0aXBseSByb3dzIGJ5IGNvbHVtbnMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYnRhaW4gdGhlIG51bWJlciBvZiB2aWV3cG9ydHNcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzLnJvd3MgKiB0aGlzLnByb3BlcnRpZXMuY29sdW1ucztcbiAgICAgICAgfSAgIFxuICAgIH1cbn07IiwiaW1wb3J0IHsgUnVsZSB9IGZyb20gJy4uL1J1bGUnO1xuXG4vKipcbiAqIFRoZSBJbWFnZU1hdGNoaW5nUnVsZSBjbGFzcyBleHRlbmRzIHRoZSBSdWxlIENsYXNzLlxuICpcbiAqIEF0IHByZXNlbnQgaXQgZG9lcyBub3QgYWRkIGFueSBuZXcgbWV0aG9kcyBvciBhdHRyaWJ1dGVzXG4gKiBAdHlwZSB7SW1hZ2VNYXRjaGluZ1J1bGV9XG4gKi9cbkhQLkltYWdlTWF0Y2hpbmdSdWxlID0gY2xhc3MgSW1hZ2VNYXRjaGluZ1J1bGUgZXh0ZW5kcyBSdWxlIHt9OyIsImltcG9ydCB7IFJ1bGUgfSBmcm9tICcuLi9SdWxlJztcblxuLyoqXG4gKiBUaGUgUHJvdG9jb2xNYXRjaGluZ1J1bGUgQ2xhc3MgZXh0ZW5kcyB0aGUgUnVsZSBDbGFzcy5cbiAqXG4gKiBBdCBwcmVzZW50IGl0IGRvZXMgbm90IGFkZCBhbnkgbmV3IG1ldGhvZHMgb3IgYXR0cmlidXRlc1xuICogQHR5cGUge1Byb3RvY29sTWF0Y2hpbmdSdWxlfVxuICovXG5IUC5Qcm90b2NvbE1hdGNoaW5nUnVsZSA9IGNsYXNzIFByb3RvY29sTWF0Y2hpbmdSdWxlIGV4dGVuZHMgUnVsZSB7fTsiLCJpbXBvcnQgeyBSdWxlIH0gZnJvbSAnLi4vUnVsZSc7XG5cbi8qKlxuICogVGhlIFNlcmllc01hdGNoaW5nUnVsZSBDbGFzcyBleHRlbmRzIHRoZSBSdWxlIENsYXNzLlxuICpcbiAqIEF0IHByZXNlbnQgaXQgZG9lcyBub3QgYWRkIGFueSBuZXcgbWV0aG9kcyBvciBhdHRyaWJ1dGVzXG4gKiBAdHlwZSB7U2VyaWVzTWF0Y2hpbmdSdWxlfVxuICovXG5IUC5TZXJpZXNNYXRjaGluZ1J1bGUgPSBjbGFzcyBTZXJpZXNNYXRjaGluZ1J1bGUgZXh0ZW5kcyBSdWxlIHt9OyIsImltcG9ydCB7IFJ1bGUgfSBmcm9tICcuLi9SdWxlJztcblxuLyoqXG4gKiBUaGUgU3R1ZHlNYXRjaGluZ1J1bGUgQ2xhc3MgZXh0ZW5kcyB0aGUgUnVsZSBDbGFzcy5cbiAqXG4gKiBBdCBwcmVzZW50IGl0IGRvZXMgbm90IGFkZCBhbnkgbmV3IG1ldGhvZHMgb3IgYXR0cmlidXRlc1xuICogQHR5cGUge1N0dWR5TWF0Y2hpbmdSdWxlfVxuICovXG5IUC5TdHVkeU1hdGNoaW5nUnVsZSA9IGNsYXNzIFN0dWR5TWF0Y2hpbmdSdWxlIGV4dGVuZHMgUnVsZSB7fTtcbiIsImNvbnN0IGNvbXBhcmF0b3JzID0gW3tcbiAgICBpZDogJ2VxdWFscycsXG4gICAgbmFtZTogJz0gKEVxdWFscyknLFxuICAgIHZhbGlkYXRvcjogJ2VxdWFscycsXG4gICAgdmFsaWRhdG9yT3B0aW9uOiAndmFsdWUnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBtdXN0IGVxdWFsIHRoaXMgdmFsdWUuJ1xufSwge1xuICAgIGlkOiAnZG9lc05vdEVxdWFsJyxcbiAgICBuYW1lOiAnIT0gKERvZXMgbm90IGVxdWFsKScsXG4gICAgdmFsaWRhdG9yOiAnZG9lc05vdEVxdWFsJyxcbiAgICB2YWxpZGF0b3JPcHRpb246ICd2YWx1ZScsXG4gICAgZGVzY3JpcHRpb246ICdUaGUgYXR0cmlidXRlIG11c3Qgbm90IGVxdWFsIHRoaXMgdmFsdWUuJ1xufSwge1xuICAgIGlkOiAnY29udGFpbnMnLFxuICAgIG5hbWU6ICdDb250YWlucycsXG4gICAgdmFsaWRhdG9yOiAnY29udGFpbnMnLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ3ZhbHVlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBhdHRyaWJ1dGUgbXVzdCBjb250YWluIHRoaXMgdmFsdWUuJ1xufSwge1xuICAgIGlkOiAnZG9lc05vdENvbnRhaW4nLFxuICAgIG5hbWU6ICdEb2VzIG5vdCBjb250YWluJyxcbiAgICB2YWxpZGF0b3I6ICdkb2VzTm90Q29udGFpbicsXG4gICAgdmFsaWRhdG9yT3B0aW9uOiAndmFsdWUnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBtdXN0IG5vdCBjb250YWluIHRoaXMgdmFsdWUuJ1xufSwge1xuICAgIGlkOiAnc3RhcnRzV2l0aCcsXG4gICAgbmFtZTogJ1N0YXJ0cyB3aXRoJyxcbiAgICB2YWxpZGF0b3I6ICdzdGFydHNXaXRoJyxcbiAgICB2YWxpZGF0b3JPcHRpb246ICd2YWx1ZScsXG4gICAgZGVzY3JpcHRpb246ICdUaGUgYXR0cmlidXRlIG11c3Qgc3RhcnQgd2l0aCB0aGlzIHZhbHVlLidcbn0sIHtcbiAgICBpZDogJ2VuZHNXaXRoJyxcbiAgICBuYW1lOiAnRW5kcyB3aXRoJyxcbiAgICB2YWxpZGF0b3I6ICdlbmRzV2l0aCcsXG4gICAgdmFsaWRhdG9yT3B0aW9uOiAndmFsdWUnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBtdXN0IGVuZCB3aXRoIHRoaXMgdmFsdWUuJ1xufSwge1xuICAgIGlkOiAnb25seUludGVnZXInLFxuICAgIG5hbWU6ICdPbmx5IEludGVnZXJzJyxcbiAgICB2YWxpZGF0b3I6ICdudW1lcmljYWxpdHknLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ29ubHlJbnRlZ2VyJyxcbiAgICBkZXNjcmlwdGlvbjogXCJSZWFsIG51bWJlcnMgd29uJ3QgYmUgYWxsb3dlZC5cIlxufSwge1xuICAgIGlkOiAnZ3JlYXRlclRoYW4nLFxuICAgIG5hbWU6ICc+IChHcmVhdGVyIHRoYW4pJyxcbiAgICB2YWxpZGF0b3I6ICdudW1lcmljYWxpdHknLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ2dyZWF0ZXJUaGFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBhdHRyaWJ1dGUgaGFzIHRvIGJlIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlLidcbn0sIHtcbiAgICBpZDogJ2dyZWF0ZXJUaGFuT3JFcXVhbFRvJyxcbiAgICBuYW1lOiAnPj0gKEdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byknLFxuICAgIHZhbGlkYXRvcjogJ251bWVyaWNhbGl0eScsXG4gICAgdmFsaWRhdG9yT3B0aW9uOiAnZ3JlYXRlclRoYW5PckVxdWFsVG8nLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBoYXMgdG8gYmUgYXQgbGVhc3QgdGhpcyB2YWx1ZS4nXG59LCB7XG4gICAgaWQ6ICdsZXNzVGhhbk9yRXF1YWxUbycsXG4gICAgbmFtZTogJzw9IChMZXNzIHRoYW4gb3IgZXF1YWwgdG8pJyxcbiAgICB2YWxpZGF0b3I6ICdudW1lcmljYWxpdHknLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ2xlc3NUaGFuT3JFcXVhbFRvJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBhdHRyaWJ1dGUgY2FuIGJlIHRoaXMgdmFsdWUgYXQgdGhlIG1vc3QuJ1xufSwge1xuICAgIGlkOiAnbGVzc1RoYW4nLFxuICAgIG5hbWU6ICc8IChMZXNzIHRoYW4pJyxcbiAgICB2YWxpZGF0b3I6ICdudW1lcmljYWxpdHknLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ2xlc3NUaGFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBhdHRyaWJ1dGUgaGFzIHRvIGJlIGxlc3MgdGhhbiB0aGlzIHZhbHVlLidcbn0sIHtcbiAgICBpZDogJ29kZCcsXG4gICAgbmFtZTogJ09kZCcsXG4gICAgdmFsaWRhdG9yOiAnbnVtZXJpY2FsaXR5JyxcbiAgICB2YWxpZGF0b3JPcHRpb246ICdvZGQnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBoYXMgdG8gYmUgb2RkLidcbn0sIHtcbiAgICBpZDogJ2V2ZW4nLFxuICAgIG5hbWU6ICdFdmVuJyxcbiAgICB2YWxpZGF0b3I6ICdudW1lcmljYWxpdHknLFxuICAgIHZhbGlkYXRvck9wdGlvbjogJ2V2ZW4nLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGF0dHJpYnV0ZSBoYXMgdG8gYmUgZXZlbi4nXG59XTtcblxuLy8gSW1tdXRhYmxlIG9iamVjdFxuT2JqZWN0LmZyZWV6ZShjb21wYXJhdG9ycyk7XG5cbmV4cG9ydCB7IGNvbXBhcmF0b3JzIH0iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFuIGVsZW1lbnQgZnJvbSBhbiBhcnJheSwgaWYgYW4gZXF1YWwgdmFsdWUgZXhpc3RzXG4gKlxuICogQHBhcmFtIGFycmF5XG4gKiBAcGFyYW0gaW5wdXRcbiAqXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIGVsZW1lbnQgd2FzIGZvdW5kIGFuZCByZW1vdmVkXG4gKi9cbmNvbnN0IHJlbW92ZUZyb21BcnJheSA9IChhcnJheSwgaW5wdXQpID0+IHtcbiAgICAvLyBJZiB0aGUgYXJyYXkgaXMgZW1wdHksIHN0b3AgaGVyZVxuICAgIGlmICghYXJyYXkgfHxcbiAgICAgICAgIWFycmF5Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYXJyYXkuZm9yRWFjaCgodmFsdWUsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmIChfLmlzRXF1YWwodmFsdWUsIGlucHV0KSkge1xuICAgICAgICAgICAgaW5kZXhUb1JlbW92ZSA9IGluZGV4O1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoaW5kZXhUb1JlbW92ZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhcnJheS5zcGxpY2UoaW5kZXhUb1JlbW92ZSwgMSk7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnQgeyByZW1vdmVGcm9tQXJyYXkgfTsiLCJNZXRlb3IucHVibGlzaCgnaGFuZ2luZ3Byb3RvY29scycsIGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86IGZpbHRlciBieSBhdmFpbGFibGVUbyB1c2VyXG4gICAgcmV0dXJuIEhhbmdpbmdQcm90b2NvbHMuZmluZCgpO1xufSk7XG4iXX0=
