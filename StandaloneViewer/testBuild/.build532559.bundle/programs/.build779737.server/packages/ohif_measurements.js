(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var moment = Package['momentjs:moment'].moment;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var HP = Package['ohif:hanging-protocols'].HP;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
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
var selector, options, MeasurementSchemaTypes;

var require = meteorInstall({"node_modules":{"meteor":{"ohif:measurements":{"both":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/index.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./base.js"));
module.watch(require("./configuration"));
module.watch(require("./schema"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"base.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/base.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 0);
OHIF.measurements = {};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"configuration":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/configuration/index.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./measurements.js"));
module.watch(require("./timepoints.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"measurements.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/configuration/measurements.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Tracker;
module.watch(require("meteor/tracker"), {
  Tracker(v) {
    Tracker = v;
  }

}, 1);

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 2);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 3);
let cornerstoneTools;
module.watch(require("meteor/ohif:cornerstone"), {
  cornerstoneTools(v) {
    cornerstoneTools = v;
  }

}, 4);
let configuration = {};

class MeasurementApi {
  static setConfiguration(config) {
    _.extend(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  static getToolsGroupsMap() {
    const toolsGroupsMap = {};
    configuration.measurementTools.forEach(toolGroup => {
      toolGroup.childTools.forEach(tool => toolsGroupsMap[tool.id] = toolGroup.id);
    });
    return toolsGroupsMap;
  }

  constructor(timepointApi) {
    if (timepointApi) {
      this.timepointApi = timepointApi;
    }

    this.toolGroups = {};
    this.tools = {};
    this.toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
    this.changeObserver = new Tracker.Dependency();
    configuration.measurementTools.forEach(toolGroup => {
      const groupCollection = new Mongo.Collection(null);
      groupCollection._debugName = toolGroup.name;
      groupCollection.attachSchema(toolGroup.schema);
      this.toolGroups[toolGroup.id] = groupCollection;
      toolGroup.childTools.forEach(tool => {
        const collection = new Mongo.Collection(null);
        collection._debugName = tool.name;
        collection.attachSchema(tool.schema);
        this.tools[tool.id] = collection;

        const addedHandler = measurement => {
          let measurementNumber; // Get the measurement number

          const timepoint = this.timepointApi.timepoints.findOne({
            studyInstanceUids: measurement.studyInstanceUid
          }); // Preventing errors thrown when non-associated (standalone) study is opened...
          // @TODO: Make sure this logic is correct.

          if (!timepoint) return;
          const emptyItem = groupCollection.findOne({
            toolId: {
              $eq: null
            },
            timepointId: timepoint.timepointId
          });

          if (emptyItem) {
            measurementNumber = emptyItem.measurementNumber;
            groupCollection.update({
              timepointId: timepoint.timepointId,
              measurementNumber
            }, {
              $set: {
                toolId: tool.id,
                toolItemId: measurement._id,
                createdAt: measurement.createdAt
              }
            });
          } else {
            measurementNumber = groupCollection.find({
              studyInstanceUid: {
                $in: timepoint.studyInstanceUids
              }
            }).count() + 1;
          }

          measurement.measurementNumber = measurementNumber; // Get the current location/description (if already defined)

          const updateObject = {
            timepointId: timepoint.timepointId,
            measurementNumber
          };
          const baselineTimepoint = timepointApi.baseline();
          const baselineGroupEntry = groupCollection.findOne({
            timepointId: baselineTimepoint.timepointId
          });

          if (baselineGroupEntry) {
            const tool = this.tools[baselineGroupEntry.toolId];
            const found = tool.findOne({
              measurementNumber
            });

            if (found) {
              updateObject.location = found.location;

              if (found.description) {
                updateObject.description = found.description;
              }
            }
          } // Set the timepoint ID, measurement number, location and description


          collection.update(measurement._id, {
            $set: updateObject
          });

          if (!emptyItem) {
            // Reflect the entry in the tool group collection
            groupCollection.insert({
              toolId: tool.id,
              toolItemId: measurement._id,
              timepointId: timepoint.timepointId,
              studyInstanceUid: measurement.studyInstanceUid,
              createdAt: measurement.createdAt,
              measurementNumber
            });
          } // Enable reactivity


          this.changeObserver.changed();
        };

        const changedHandler = measurement => {
          this.changeObserver.changed();
        };

        const removedHandler = measurement => {
          const measurementNumber = measurement.measurementNumber;
          groupCollection.update({
            toolItemId: measurement._id
          }, {
            $set: {
              toolId: null,
              toolItemId: null
            }
          });
          const nonEmptyItem = groupCollection.findOne({
            measurementNumber,
            toolId: {
              $not: null
            }
          });

          if (nonEmptyItem) {
            return;
          }

          const groupItems = groupCollection.find({
            measurementNumber
          }).fetch();
          groupItems.forEach(groupItem => {
            // Remove the record from the tools group collection too
            groupCollection.remove({
              _id: groupItem._id
            }); // Update the measurement numbers only if it is last item

            const timepoint = this.timepointApi.timepoints.findOne({
              timepointId: groupItem.timepointId
            });
            const filter = {
              studyInstanceUid: {
                $in: timepoint.studyInstanceUids
              },
              measurementNumber
            };
            const remainingItems = groupCollection.find(filter).count();

            if (!remainingItems) {
              filter.measurementNumber = {
                $gte: measurementNumber
              };
              const operator = {
                $inc: {
                  measurementNumber: -1
                }
              };
              const options = {
                multi: true
              };
              groupCollection.update(filter, operator, options);
              toolGroup.childTools.forEach(childTool => {
                const collection = this.tools[childTool.id];
                collection.update(filter, operator, options);
              });
            }
          }); // Synchronize the new tool data

          this.syncMeasurementsAndToolData(); // Enable reactivity

          this.changeObserver.changed();
        };

        collection.find().observe({
          added: addedHandler,
          changed: changedHandler,
          removed: removedHandler
        });
      });
    });
  }

  retrieveMeasurements(patientId, timepointIds) {
    const retrievalFn = configuration.dataExchange.retrieve;

    if (!_.isFunction(retrievalFn)) {
      return;
    }

    return new Promise((resolve, reject) => {
      retrievalFn(patientId, timepointIds).then(measurementData => {
        OHIF.log.info('Measurement data retrieval');
        OHIF.log.info(measurementData);
        const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
        const measurementsGroups = {};
        Object.keys(measurementData).forEach(measurementTypeId => {
          const measurements = measurementData[measurementTypeId];
          measurements.forEach(measurement => {
            const {
              toolType
            } = measurement;

            if (toolType && this.tools[toolType]) {
              delete measurement._id;
              const toolGroup = toolsGroupsMap[toolType];

              if (!measurementsGroups[toolGroup]) {
                measurementsGroups[toolGroup] = [];
              }

              measurementsGroups[toolGroup].push(measurement);
            }
          });
        });
        Object.keys(measurementsGroups).forEach(groupKey => {
          const group = measurementsGroups[groupKey];
          group.sort((a, b) => {
            if (a.measurementNumber > b.measurementNumber) {
              return 1;
            } else if (a.measurementNumber < b.measurementNumber) {
              return -1;
            }

            return 0;
          });
          group.forEach(m => this.tools[m.toolType].insert(m));
        });
        resolve();
      });
    });
  }

  storeMeasurements(timepointId) {
    const storeFn = configuration.dataExchange.store;

    if (!_.isFunction(storeFn)) {
      return;
    }

    let measurementData = {};
    configuration.measurementTools.forEach(toolGroup => {
      toolGroup.childTools.forEach(tool => {
        if (!measurementData[toolGroup.id]) {
          measurementData[toolGroup.id] = [];
        }

        measurementData[toolGroup.id] = measurementData[toolGroup.id].concat(this.tools[tool.id].find().fetch());
      });
    });
    const timepointFilter = timepointId ? {
      timepointId
    } : {};
    const timepoints = this.timepointApi.all(timepointFilter);
    const timepointIds = timepoints.map(t => t.timepointId);
    const patientId = timepoints[0].patientId;
    const filter = {
      patientId,
      timepointId: {
        $in: timepointIds
      }
    };
    OHIF.log.info('Saving Measurements for timepoints:', timepoints);
    return storeFn(measurementData, filter).then(() => {
      OHIF.log.info('Measurement storage completed');
    });
  }

  validateMeasurements() {
    const validateFn = configuration.dataValidation.validateMeasurements;

    if (validateFn && validateFn instanceof Function) {
      validateFn();
    }
  }

  syncMeasurementsAndToolData() {
    configuration.measurementTools.forEach(toolGroup => {
      toolGroup.childTools.forEach(tool => {
        const measurements = this.tools[tool.id].find().fetch();
        measurements.forEach(measurement => {
          OHIF.measurements.syncMeasurementAndToolData(measurement);
        });
      });
    });
  }

  sortMeasurements(baselineTimepointId) {
    const tools = configuration.measurementTools;
    const includedTools = tools.filter(tool => {
      return tool.options && tool.options.caseProgress && tool.options.caseProgress.include;
    }); // Update Measurement the displayed Measurements

    includedTools.forEach(tool => {
      const collection = this.tools[tool.id];
      const measurements = collection.find().fetch();
      measurements.forEach(measurement => {
        OHIF.measurements.syncMeasurementAndToolData(measurement);
      });
    });
  }

  deleteMeasurements(measurementTypeId, filter) {
    const groupCollection = this.toolGroups[measurementTypeId]; // Stop here if it is a temporary toolGroups

    if (!groupCollection) return; // Get the entries information before removing them

    const groupItems = groupCollection.find(filter).fetch();
    const entries = [];
    groupItems.forEach(groupItem => {
      if (!groupItem.toolId) {
        return;
      }

      const collection = this.tools[groupItem.toolId];
      entries.push(collection.findOne(groupItem.toolItemId));
      collection.remove(groupItem.toolItemId);
    }); // Stop here if no entries were found

    if (!entries.length) {
      return;
    } // If the filter doesn't have the measurement number, get it from the first entry


    const measurementNumber = filter.measurementNumber || entries[0].measurementNumber; // Synchronize the new data with cornerstone tools

    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

    _.each(entries, entry => {
      const measurementsData = [];
      const {
        tool
      } = OHIF.measurements.getToolConfiguration(entry.toolType);

      if (Array.isArray(tool.childTools)) {
        tool.childTools.forEach(key => {
          const childMeasurement = entry[key];
          if (!childMeasurement) return;
          measurementsData.push(childMeasurement);
        });
      } else {
        measurementsData.push(entry);
      }

      measurementsData.forEach(measurementData => {
        const {
          imagePath,
          toolType
        } = measurementData;
        const imageId = OHIF.viewerbase.getImageIdForImagePath(imagePath);

        if (toolState[imageId]) {
          const toolData = toolState[imageId][toolType];
          const measurementEntries = toolData && toolData.data;

          const measurementEntry = _.findWhere(measurementEntries, {
            _id: entry._id
          });

          if (measurementEntry) {
            const index = measurementEntries.indexOf(measurementEntry);
            measurementEntries.splice(index, 1);
          }
        }
      });
    });

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState); // Synchronize the updated measurements with Cornerstone Tools
    // toolData to make sure the displayed measurements show 'Target X' correctly

    const syncFilter = _.clone(filter);

    delete syncFilter.timepointId;
    syncFilter.measurementNumber = {
      $gt: measurementNumber - 1
    };

    const toolTypes = _.uniq(entries.map(entry => entry.toolType));

    toolTypes.forEach(toolType => {
      const collection = this.tools[toolType];
      collection.find(syncFilter).forEach(measurement => {
        OHIF.measurements.syncMeasurementAndToolData(measurement);
      });
    });
  }

  getMeasurementById(measurementId) {
    let foundGroup;

    _.find(this.toolGroups, toolGroup => {
      foundGroup = toolGroup.findOne({
        toolItemId: measurementId
      });
      return !!foundGroup;
    }); // Stop here if no group was found or if the record is a placeholder


    if (!foundGroup || !foundGroup.toolId) {
      return;
    }

    return this.tools[foundGroup.toolId].findOne(measurementId);
  }

  fetch(toolGroupId, selector, options) {
    if (!this.toolGroups[toolGroupId]) {
      throw 'MeasurementApi: No Collection with the id: ' + toolGroupId;
    }

    selector = selector || {};
    options = options || {};
    const result = [];
    const items = this.toolGroups[toolGroupId].find(selector, options).fetch();
    items.forEach(item => {
      if (item.toolId) {
        result.push(this.tools[item.toolId].findOne(item.toolItemId));
      } else {
        result.push({
          measurementNumber: item.measurementNumber
        });
      }
    });
    return result;
  }

}

OHIF.measurements.MeasurementApi = MeasurementApi;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"timepoints.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/configuration/timepoints.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 1);
let OHIF;
module.watch(require("meteor/ohif:core"), {
  OHIF(v) {
    OHIF = v;
  }

}, 2);
let TimepointSchema;
module.watch(require("meteor/ohif:measurements/both/schema/timepoints"), {
  schema(v) {
    TimepointSchema = v;
  }

}, 3);
const configuration = {};

class TimepointApi {
  static setConfiguration(config) {
    _.extend(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  constructor(currentTimepointId, options = {}) {
    if (currentTimepointId) {
      this.currentTimepointId = currentTimepointId;
    }

    this.options = options;
    this.timepoints = new Mongo.Collection(null);
    this.timepoints.attachSchema(TimepointSchema);
    this.timepoints._debugName = 'Timepoints';
  }

  retrieveTimepoints(filter) {
    const retrievalFn = configuration.dataExchange.retrieve;

    if (!_.isFunction(retrievalFn)) {
      OHIF.log.error('Timepoint retrieval function has not been configured.');
      return;
    }

    return new Promise((resolve, reject) => {
      retrievalFn(filter).then(timepointData => {
        OHIF.log.info('Timepoint data retrieval');

        _.each(timepointData, timepoint => {
          delete timepoint._id;
          const query = {
            timepointId: timepoint.timepointId
          };
          this.timepoints.update(query, {
            $set: timepoint
          }, {
            upsert: true
          });
        });

        resolve();
      }).catch(reason => {
        OHIF.log.error(`Timepoint retrieval function failed: ${reason}`);
        reject(reason);
      });
    });
  }

  storeTimepoints() {
    const storeFn = configuration.dataExchange.store;

    if (!_.isFunction(storeFn)) {
      return;
    }

    const timepointData = this.timepoints.find().fetch();
    OHIF.log.info('Preparing to store timepoints');
    OHIF.log.info(JSON.stringify(timepointData, null, 2));
    storeFn(timepointData).then(() => OHIF.log.info('Timepoint storage completed'));
  }

  disassociateStudy(timepointIds, studyInstanceUid) {
    const disassociateFn = configuration.dataExchange.disassociate;
    disassociateFn(timepointIds, studyInstanceUid).then(() => {
      OHIF.log.info('Disassociation completed');
      this.timepoints.remove({});
      this.retrieveTimepoints({});
    });
  }

  removeTimepoint(timepointId) {
    const removeFn = configuration.dataExchange.remove;

    if (!_.isFunction(removeFn)) {
      return;
    }

    const timepointData = {
      timepointId
    };
    OHIF.log.info('Preparing to remove timepoint');
    OHIF.log.info(JSON.stringify(timepointData, null, 2));
    removeFn(timepointData).then(() => {
      OHIF.log.info('Timepoint removal completed');
      this.timepoints.remove(timepointData);
    });
  }

  updateTimepoint(timepointId, query) {
    const updateFn = configuration.dataExchange.update;

    if (!_.isFunction(updateFn)) {
      return;
    }

    const timepointData = {
      timepointId
    };
    OHIF.log.info('Preparing to update timepoint');
    OHIF.log.info(JSON.stringify(timepointData, null, 2));
    OHIF.log.info(JSON.stringify(query, null, 2));
    updateFn(timepointData, query).then(() => {
      OHIF.log.info('Timepoint updated completed');
      this.timepoints.update(timepointData, query);
    });
  } // Return all timepoints


  all(filter = {}) {
    return this.timepoints.find(filter, {
      sort: {
        latestDate: -1
      }
    }).fetch();
  } // Return only the current timepoint


  current() {
    return this.timepoints.findOne({
      timepointId: this.currentTimepointId
    });
  }

  lock() {
    const current = this.current();

    if (!current) {
      return;
    }

    this.timepoints.update(current._id, {
      $set: {
        locked: true
      }
    });
  } // Return the prior timepoint


  prior() {
    const current = this.current();

    if (!current) {
      return;
    }

    const latestDate = current.latestDate;
    return this.timepoints.findOne({
      latestDate: {
        $lt: latestDate
      }
    }, {
      sort: {
        latestDate: -1
      }
    });
  } // Return only the current and prior timepoints


  currentAndPrior() {
    const timepoints = [];
    const current = this.current();

    if (current) {
      timepoints.push(current);
    }

    const prior = this.prior();

    if (current && prior && prior._id !== current._id) {
      timepoints.push(prior);
    }

    return timepoints;
  } // Return only the comparison timepoints


  comparison() {
    return this.currentAndPrior();
  } // Return only the baseline timepoint


  baseline() {
    return this.timepoints.findOne({
      timepointType: 'baseline'
    });
  } // Return only the nadir timepoint


  nadir() {
    const timepoint = this.timepoints.findOne({
      timepointKey: 'nadir'
    });
    return timepoint || this.baseline();
  } // Return only the key timepoints (current, prior, nadir and baseline)


  key(filter = {}) {
    const result = []; // Get all the timepoints

    const all = this.all(filter); // Iterate over each timepoint and insert the key ones in the result

    _.each(all, (timepoint, index) => {
      if (index < 2 || index === all.length - 1) {
        result.push(timepoint);
      }
    }); // Return the resulting timepoints


    return result;
  } // Return only the timepoints for the given study


  study(studyInstanceUid) {
    const result = []; // Iterate over each timepoint and insert the key ones in the result

    _.each(this.all(), (timepoint, index) => {
      if (_.contains(timepoint.studyInstanceUids, studyInstanceUid)) {
        result.push(timepoint);
      }
    }); // Return the resulting timepoints


    return result;
  } // Return the timepoint's name


  name(timepoint) {
    // Check if this is a Baseline timepoint, if it is, return 'Baseline'
    if (timepoint.timepointType === 'baseline') {
      return 'Baseline';
    } else if (timepoint.visitNumber) {
      return 'Follow-up ' + timepoint.visitNumber;
    } // Retrieve all of the relevant follow-up timepoints for this patient


    const followupTimepoints = this.timepoints.find({
      patientId: timepoint.patientId,
      timepointType: timepoint.timepointType
    }, {
      sort: {
        latestDate: 1
      }
    }); // Create an array of just timepointIds, so we can use indexOf
    // on it to find the current timepoint's relative position

    const followupTimepointIds = followupTimepoints.map(timepoint => timepoint.timepointId); // Calculate the index of the current timepoint in the array of all
    // relevant follow-up timepoints

    const index = followupTimepointIds.indexOf(timepoint.timepointId) + 1; // If index is 0, it means that the current timepoint was not in the list
    // Log a warning and return here

    if (!index) {
      OHIF.log.warn('Current follow-up was not in the list of relevant follow-ups?');
      return;
    } // Return the timepoint name as 'Follow-up N'


    return 'Follow-up ' + index;
  } // Build the timepoint title based on its date


  title(timepoint) {
    const timepointName = this.name(timepoint);

    const all = _.clone(this.all());

    let index = -1;
    let currentIndex = null;

    for (let i = 0; i < all.length; i++) {
      const currentTimepoint = all[i]; // Skip the iterations until we can't find the selected timepoint on study list

      if (this.currentTimepointId === currentTimepoint.timepointId) {
        currentIndex = 0;
      }

      if (_.isNumber(currentIndex)) {
        index = currentIndex++;
      } // Break the loop if reached the timepoint to get the title


      if (currentTimepoint.timepointId === timepoint.timepointId) {
        break;
      }
    }

    const states = {
      0: '(Current)',
      1: '(Prior)'
    }; // TODO: [design] find out how to define the nadir timepoint

    const parenthesis = states[index] || '';
    return `${timepointName} ${parenthesis}`;
  }

}

OHIF.measurements.TimepointApi = TimepointApi;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"schema":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/schema/index.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./measurements.js"));
module.watch(require("./timepoints.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"measurements.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/schema/measurements.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  MeasurementSchemaTypes: () => MeasurementSchemaTypes
});
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 0);
const Measurement = new SimpleSchema({
  additionalData: {
    type: Object,
    label: 'Additional Data',
    defaultValue: {},
    optional: true,
    blackbox: true
  },
  userId: {
    type: String,
    label: 'User ID',
    optional: true
  },
  patientId: {
    type: String,
    label: 'Patient ID',
    optional: true
  },
  measurementNumber: {
    type: Number,
    label: 'Measurement Number',
    optional: true
  },
  timepointId: {
    type: String,
    label: 'Timepoint ID',
    optional: true
  },
  // Force value to be current date (on server) upon insert
  // and prevent updates thereafter.
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date()
        };
      } else {// [PWV-184] Preventing unset due to child tools updating
        // this.unset(); // Prevent user from supplying their own value
      }
    }
  },
  // Force value to be current date (on server) upon update
  updatedAt: {
    type: Date,
    autoValue: function () {
      if (this.isUpdate) {// return new Date();
      }
    },
    optional: true
  }
});
const StudyLevelMeasurement = new SimpleSchema([Measurement, {
  studyInstanceUid: {
    type: String,
    label: 'Study Instance UID'
  }
}]);
const SeriesLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, {
  seriesInstanceUid: {
    type: String,
    label: 'Series Instance UID'
  }
}]);
const CornerstoneVOI = new SimpleSchema({
  windowWidth: {
    type: Number,
    label: 'Window Width',
    decimal: true,
    optional: true
  },
  windowCenter: {
    type: Number,
    label: 'Window Center',
    decimal: true,
    optional: true
  }
});
const CornerstoneViewportTranslation = new SimpleSchema({
  x: {
    type: Number,
    label: 'X',
    decimal: true,
    optional: true
  },
  y: {
    type: Number,
    label: 'Y',
    decimal: true,
    optional: true
  }
});
const CornerstoneViewport = new SimpleSchema({
  scale: {
    type: Number,
    label: 'Scale',
    decimal: true,
    optional: true
  },
  translation: {
    type: CornerstoneViewportTranslation,
    label: 'Translation',
    optional: true
  },
  voi: {
    type: CornerstoneVOI,
    label: 'VOI',
    optional: true
  },
  invert: {
    type: Boolean,
    label: 'Invert',
    optional: true
  },
  pixelReplication: {
    type: Boolean,
    label: 'Pixel Replication',
    optional: true
  },
  hFlip: {
    type: Boolean,
    label: 'Horizontal Flip',
    optional: true
  },
  vFlip: {
    type: Boolean,
    label: 'Vertical Flip',
    optional: true
  },
  rotation: {
    type: Number,
    label: 'Rotation (degrees)',
    decimal: true,
    optional: true
  }
});
const InstanceLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, SeriesLevelMeasurement, {
  sopInstanceUid: {
    type: String,
    label: 'SOP Instance UID'
  },
  viewport: {
    type: CornerstoneViewport,
    label: 'Viewport Parameters',
    optional: true
  }
}]);
const FrameLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, SeriesLevelMeasurement, InstanceLevelMeasurement, {
  frameIndex: {
    type: Number,
    min: 0,
    label: 'Frame index in Instance'
  },
  imagePath: {
    type: String,
    label: 'Identifier for the measurement\'s image' // studyInstanceUid_seriesInstanceUid_sopInstanceUid_frameIndex

  }
}]);
const CornerstoneToolMeasurement = new SimpleSchema([StudyLevelMeasurement, SeriesLevelMeasurement, InstanceLevelMeasurement, FrameLevelMeasurement, {
  toolType: {
    type: String,
    label: 'Cornerstone Tool Type',
    optional: true
  },
  visible: {
    type: Boolean,
    label: 'Visible',
    defaultValue: true
  },
  active: {
    type: Boolean,
    label: 'Active',
    defaultValue: false
  },
  invalidated: {
    type: Boolean,
    label: 'Invalidated',
    defaultValue: false,
    optional: true
  }
}]);
const CornerstoneHandleBoundingBoxSchema = new SimpleSchema({
  width: {
    type: Number,
    label: 'Width',
    decimal: true
  },
  height: {
    type: Number,
    label: 'Height',
    decimal: true
  },
  left: {
    type: Number,
    label: 'Left',
    decimal: true
  },
  top: {
    type: Number,
    label: 'Top',
    decimal: true
  }
});
const CornerstoneHandleSchema = new SimpleSchema({
  x: {
    type: Number,
    label: 'X',
    decimal: true,
    optional: true // Not actually optional, but sometimes values like x/y position are missing

  },
  y: {
    type: Number,
    label: 'Y',
    decimal: true,
    optional: true // Not actually optional, but sometimes values like x/y position are missing

  },
  highlight: {
    type: Boolean,
    label: 'Highlight',
    defaultValue: false
  },
  active: {
    type: Boolean,
    label: 'Active',
    defaultValue: false,
    optional: true
  },
  drawnIndependently: {
    type: Boolean,
    label: 'Drawn Independently',
    defaultValue: false,
    optional: true
  },
  movesIndependently: {
    type: Boolean,
    label: 'Moves Independently',
    defaultValue: false,
    optional: true
  },
  allowedOutsideImage: {
    type: Boolean,
    label: 'Allowed Outside Image',
    defaultValue: false,
    optional: true
  },
  hasMoved: {
    type: Boolean,
    label: 'Has Already Moved',
    defaultValue: false,
    optional: true
  },
  hasBoundingBox: {
    type: Boolean,
    label: 'Has Bounding Box',
    defaultValue: false,
    optional: true
  },
  boundingBox: {
    type: CornerstoneHandleBoundingBoxSchema,
    label: 'Bounding Box',
    optional: true
  },
  index: {
    // TODO: Remove 'index' from bidirectionalTool since it's useless
    type: Number,
    optional: true
  },
  locked: {
    type: Boolean,
    label: 'Locked',
    optional: true,
    defaultValue: false
  }
});
const MeasurementSchemaTypes = {
  Measurement: Measurement,
  StudyLevelMeasurement: StudyLevelMeasurement,
  SeriesLevelMeasurement: SeriesLevelMeasurement,
  InstanceLevelMeasurement: InstanceLevelMeasurement,
  FrameLevelMeasurement: FrameLevelMeasurement,
  CornerstoneToolMeasurement: CornerstoneToolMeasurement,
  CornerstoneHandleSchema: CornerstoneHandleSchema
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"timepoints.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ohif_measurements/both/schema/timepoints.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 0);
const schema = new SimpleSchema({
  patientId: {
    type: String,
    label: 'Patient ID',
    optional: true
  },
  timepointId: {
    type: String,
    label: 'Timepoint ID'
  },
  timepointType: {
    type: String,
    label: 'Timepoint Type',
    allowedValues: ['baseline', 'followup'],
    defaultValue: 'baseline'
  },
  isLocked: {
    type: Boolean,
    label: 'Timepoint Locked'
  },
  studyInstanceUids: {
    type: [String],
    label: 'Study Instance Uids',
    defaultValue: []
  },
  earliestDate: {
    type: Date,
    label: 'Earliest Study Date from associated studies'
  },
  latestDate: {
    type: Date,
    label: 'Most recent Study Date from associated studies'
  },
  visitNumber: {
    type: Number,
    label: 'Number of patient\'s visit',
    optional: true
  },
  studiesData: {
    type: [Object],
    label: 'Studies data to allow lazy loading',
    optional: true,
    blackbox: true
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ohif:measurements/both/index.js");

/* Exports */
Package._define("ohif:measurements", {
  MeasurementSchemaTypes: MeasurementSchemaTypes
});

})();

//# sourceURL=meteor://💻app/packages/ohif_measurements.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjptZWFzdXJlbWVudHMvYm90aC9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjptZWFzdXJlbWVudHMvYm90aC9iYXNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOm1lYXN1cmVtZW50cy9ib3RoL2NvbmZpZ3VyYXRpb24vaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6bWVhc3VyZW1lbnRzL2JvdGgvY29uZmlndXJhdGlvbi9tZWFzdXJlbWVudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29oaWY6bWVhc3VyZW1lbnRzL2JvdGgvY29uZmlndXJhdGlvbi90aW1lcG9pbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOm1lYXN1cmVtZW50cy9ib3RoL3NjaGVtYS9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2hpZjptZWFzdXJlbWVudHMvYm90aC9zY2hlbWEvbWVhc3VyZW1lbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vaGlmOm1lYXN1cmVtZW50cy9ib3RoL3NjaGVtYS90aW1lcG9pbnRzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsIk9ISUYiLCJ2IiwibWVhc3VyZW1lbnRzIiwiTW9uZ28iLCJUcmFja2VyIiwiXyIsImNvcm5lcnN0b25lVG9vbHMiLCJjb25maWd1cmF0aW9uIiwiTWVhc3VyZW1lbnRBcGkiLCJzZXRDb25maWd1cmF0aW9uIiwiY29uZmlnIiwiZXh0ZW5kIiwiZ2V0Q29uZmlndXJhdGlvbiIsImdldFRvb2xzR3JvdXBzTWFwIiwidG9vbHNHcm91cHNNYXAiLCJtZWFzdXJlbWVudFRvb2xzIiwiZm9yRWFjaCIsInRvb2xHcm91cCIsImNoaWxkVG9vbHMiLCJ0b29sIiwiaWQiLCJjb25zdHJ1Y3RvciIsInRpbWVwb2ludEFwaSIsInRvb2xHcm91cHMiLCJ0b29scyIsImNoYW5nZU9ic2VydmVyIiwiRGVwZW5kZW5jeSIsImdyb3VwQ29sbGVjdGlvbiIsIkNvbGxlY3Rpb24iLCJfZGVidWdOYW1lIiwibmFtZSIsImF0dGFjaFNjaGVtYSIsInNjaGVtYSIsImNvbGxlY3Rpb24iLCJhZGRlZEhhbmRsZXIiLCJtZWFzdXJlbWVudCIsIm1lYXN1cmVtZW50TnVtYmVyIiwidGltZXBvaW50IiwidGltZXBvaW50cyIsImZpbmRPbmUiLCJzdHVkeUluc3RhbmNlVWlkcyIsInN0dWR5SW5zdGFuY2VVaWQiLCJlbXB0eUl0ZW0iLCJ0b29sSWQiLCIkZXEiLCJ0aW1lcG9pbnRJZCIsInVwZGF0ZSIsIiRzZXQiLCJ0b29sSXRlbUlkIiwiX2lkIiwiY3JlYXRlZEF0IiwiZmluZCIsIiRpbiIsImNvdW50IiwidXBkYXRlT2JqZWN0IiwiYmFzZWxpbmVUaW1lcG9pbnQiLCJiYXNlbGluZSIsImJhc2VsaW5lR3JvdXBFbnRyeSIsImZvdW5kIiwibG9jYXRpb24iLCJkZXNjcmlwdGlvbiIsImluc2VydCIsImNoYW5nZWQiLCJjaGFuZ2VkSGFuZGxlciIsInJlbW92ZWRIYW5kbGVyIiwibm9uRW1wdHlJdGVtIiwiJG5vdCIsImdyb3VwSXRlbXMiLCJmZXRjaCIsImdyb3VwSXRlbSIsInJlbW92ZSIsImZpbHRlciIsInJlbWFpbmluZ0l0ZW1zIiwiJGd0ZSIsIm9wZXJhdG9yIiwiJGluYyIsIm9wdGlvbnMiLCJtdWx0aSIsImNoaWxkVG9vbCIsInN5bmNNZWFzdXJlbWVudHNBbmRUb29sRGF0YSIsIm9ic2VydmUiLCJhZGRlZCIsInJlbW92ZWQiLCJyZXRyaWV2ZU1lYXN1cmVtZW50cyIsInBhdGllbnRJZCIsInRpbWVwb2ludElkcyIsInJldHJpZXZhbEZuIiwiZGF0YUV4Y2hhbmdlIiwicmV0cmlldmUiLCJpc0Z1bmN0aW9uIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0aGVuIiwibWVhc3VyZW1lbnREYXRhIiwibG9nIiwiaW5mbyIsIm1lYXN1cmVtZW50c0dyb3VwcyIsIk9iamVjdCIsImtleXMiLCJtZWFzdXJlbWVudFR5cGVJZCIsInRvb2xUeXBlIiwicHVzaCIsImdyb3VwS2V5IiwiZ3JvdXAiLCJzb3J0IiwiYSIsImIiLCJtIiwic3RvcmVNZWFzdXJlbWVudHMiLCJzdG9yZUZuIiwic3RvcmUiLCJjb25jYXQiLCJ0aW1lcG9pbnRGaWx0ZXIiLCJhbGwiLCJtYXAiLCJ0IiwidmFsaWRhdGVNZWFzdXJlbWVudHMiLCJ2YWxpZGF0ZUZuIiwiZGF0YVZhbGlkYXRpb24iLCJGdW5jdGlvbiIsInN5bmNNZWFzdXJlbWVudEFuZFRvb2xEYXRhIiwic29ydE1lYXN1cmVtZW50cyIsImJhc2VsaW5lVGltZXBvaW50SWQiLCJpbmNsdWRlZFRvb2xzIiwiY2FzZVByb2dyZXNzIiwiaW5jbHVkZSIsImRlbGV0ZU1lYXN1cmVtZW50cyIsImVudHJpZXMiLCJsZW5ndGgiLCJ0b29sU3RhdGUiLCJnbG9iYWxJbWFnZUlkU3BlY2lmaWNUb29sU3RhdGVNYW5hZ2VyIiwic2F2ZVRvb2xTdGF0ZSIsImVhY2giLCJlbnRyeSIsIm1lYXN1cmVtZW50c0RhdGEiLCJnZXRUb29sQ29uZmlndXJhdGlvbiIsIkFycmF5IiwiaXNBcnJheSIsImtleSIsImNoaWxkTWVhc3VyZW1lbnQiLCJpbWFnZVBhdGgiLCJpbWFnZUlkIiwidmlld2VyYmFzZSIsImdldEltYWdlSWRGb3JJbWFnZVBhdGgiLCJ0b29sRGF0YSIsIm1lYXN1cmVtZW50RW50cmllcyIsImRhdGEiLCJtZWFzdXJlbWVudEVudHJ5IiwiZmluZFdoZXJlIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwicmVzdG9yZVRvb2xTdGF0ZSIsInN5bmNGaWx0ZXIiLCJjbG9uZSIsIiRndCIsInRvb2xUeXBlcyIsInVuaXEiLCJnZXRNZWFzdXJlbWVudEJ5SWQiLCJtZWFzdXJlbWVudElkIiwiZm91bmRHcm91cCIsInRvb2xHcm91cElkIiwic2VsZWN0b3IiLCJyZXN1bHQiLCJpdGVtcyIsIml0ZW0iLCJUaW1lcG9pbnRTY2hlbWEiLCJUaW1lcG9pbnRBcGkiLCJjdXJyZW50VGltZXBvaW50SWQiLCJyZXRyaWV2ZVRpbWVwb2ludHMiLCJlcnJvciIsInRpbWVwb2ludERhdGEiLCJxdWVyeSIsInVwc2VydCIsImNhdGNoIiwicmVhc29uIiwic3RvcmVUaW1lcG9pbnRzIiwiSlNPTiIsInN0cmluZ2lmeSIsImRpc2Fzc29jaWF0ZVN0dWR5IiwiZGlzYXNzb2NpYXRlRm4iLCJkaXNhc3NvY2lhdGUiLCJyZW1vdmVUaW1lcG9pbnQiLCJyZW1vdmVGbiIsInVwZGF0ZVRpbWVwb2ludCIsInVwZGF0ZUZuIiwibGF0ZXN0RGF0ZSIsImN1cnJlbnQiLCJsb2NrIiwibG9ja2VkIiwicHJpb3IiLCIkbHQiLCJjdXJyZW50QW5kUHJpb3IiLCJjb21wYXJpc29uIiwidGltZXBvaW50VHlwZSIsIm5hZGlyIiwidGltZXBvaW50S2V5Iiwic3R1ZHkiLCJjb250YWlucyIsInZpc2l0TnVtYmVyIiwiZm9sbG93dXBUaW1lcG9pbnRzIiwiZm9sbG93dXBUaW1lcG9pbnRJZHMiLCJ3YXJuIiwidGl0bGUiLCJ0aW1lcG9pbnROYW1lIiwiY3VycmVudEluZGV4IiwiaSIsImN1cnJlbnRUaW1lcG9pbnQiLCJpc051bWJlciIsInN0YXRlcyIsInBhcmVudGhlc2lzIiwiZXhwb3J0IiwiTWVhc3VyZW1lbnRTY2hlbWFUeXBlcyIsIlNpbXBsZVNjaGVtYSIsIk1lYXN1cmVtZW50IiwiYWRkaXRpb25hbERhdGEiLCJ0eXBlIiwibGFiZWwiLCJkZWZhdWx0VmFsdWUiLCJvcHRpb25hbCIsImJsYWNrYm94IiwidXNlcklkIiwiU3RyaW5nIiwiTnVtYmVyIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcHNlcnQiLCIkc2V0T25JbnNlcnQiLCJ1cGRhdGVkQXQiLCJpc1VwZGF0ZSIsIlN0dWR5TGV2ZWxNZWFzdXJlbWVudCIsIlNlcmllc0xldmVsTWVhc3VyZW1lbnQiLCJzZXJpZXNJbnN0YW5jZVVpZCIsIkNvcm5lcnN0b25lVk9JIiwid2luZG93V2lkdGgiLCJkZWNpbWFsIiwid2luZG93Q2VudGVyIiwiQ29ybmVyc3RvbmVWaWV3cG9ydFRyYW5zbGF0aW9uIiwieCIsInkiLCJDb3JuZXJzdG9uZVZpZXdwb3J0Iiwic2NhbGUiLCJ0cmFuc2xhdGlvbiIsInZvaSIsImludmVydCIsIkJvb2xlYW4iLCJwaXhlbFJlcGxpY2F0aW9uIiwiaEZsaXAiLCJ2RmxpcCIsInJvdGF0aW9uIiwiSW5zdGFuY2VMZXZlbE1lYXN1cmVtZW50Iiwic29wSW5zdGFuY2VVaWQiLCJ2aWV3cG9ydCIsIkZyYW1lTGV2ZWxNZWFzdXJlbWVudCIsImZyYW1lSW5kZXgiLCJtaW4iLCJDb3JuZXJzdG9uZVRvb2xNZWFzdXJlbWVudCIsInZpc2libGUiLCJhY3RpdmUiLCJpbnZhbGlkYXRlZCIsIkNvcm5lcnN0b25lSGFuZGxlQm91bmRpbmdCb3hTY2hlbWEiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJDb3JuZXJzdG9uZUhhbmRsZVNjaGVtYSIsImhpZ2hsaWdodCIsImRyYXduSW5kZXBlbmRlbnRseSIsIm1vdmVzSW5kZXBlbmRlbnRseSIsImFsbG93ZWRPdXRzaWRlSW1hZ2UiLCJoYXNNb3ZlZCIsImhhc0JvdW5kaW5nQm94IiwiYm91bmRpbmdCb3giLCJhbGxvd2VkVmFsdWVzIiwiaXNMb2NrZWQiLCJlYXJsaWVzdERhdGUiLCJzdHVkaWVzRGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYjtBQUFtQ0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWI7QUFBeUNGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxVQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBNUUsSUFBSUMsSUFBSjtBQUFTSCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDQyxPQUFL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TztBQUZFLEdBTnNCO0FBVW5DdkIsaUJBQWU7QUFDWHNCLFVBQU1NLE1BREs7QUFFWEwsV0FBTyxnQkFGSTtBQUdYeUQsbUJBQWUsQ0FBQyxVQUFELEVBQWEsVUFBYixDQUhKO0FBSVh4RCxrQkFBYztBQUpILEdBVm9CO0FBZ0JuQ3lELFlBQVU7QUFDTjNELFVBQU04QixPQURBO0FBRU43QixXQUFPO0FBRkQsR0FoQnlCO0FBb0JuQ2xMLHFCQUFtQjtBQUNmaUwsVUFBTSxDQUFDTSxNQUFELENBRFM7QUFFZkwsV0FBTyxxQkFGUTtBQUdmQyxrQkFBYztBQUhDLEdBcEJnQjtBQXlCbkMwRCxnQkFBYztBQUNWNUQsVUFBTVEsSUFESTtBQUVWUCxXQUFPO0FBRkcsR0F6QnFCO0FBNkJuQy9CLGNBQVk7QUFDUjhCLFVBQU1RLElBREU7QUFFUlAsV0FBTztBQUZDLEdBN0J1QjtBQWlDbkNsQixlQUFhO0FBQ1RpQixVQUFNTyxNQURHO0FBRVROLFdBQU8sNEJBRkU7QUFHVEUsY0FBVTtBQUhELEdBakNzQjtBQXNDbkMwRCxlQUFhO0FBQ1Q3RCxVQUFNLENBQUN2SCxNQUFELENBREc7QUFFVHdILFdBQU8sb0NBRkU7QUFHVEUsY0FBVSxJQUhEO0FBSVRDLGNBQVU7QUFKRDtBQXRDc0IsQ0FBakIsQ0FBZixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vaGlmX21lYXN1cmVtZW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9iYXNlLmpzJztcbmltcG9ydCAnLi9jb25maWd1cmF0aW9uJztcbmltcG9ydCAnLi9zY2hlbWEnO1xuIiwiaW1wb3J0IHsgT0hJRiB9IGZyb20gJ21ldGVvci9vaGlmOmNvcmUnO1xuXG5PSElGLm1lYXN1cmVtZW50cyA9IHt9O1xuIiwiaW1wb3J0ICcuL21lYXN1cmVtZW50cy5qcyc7XG5pbXBvcnQgJy4vdGltZXBvaW50cy5qcyc7XG4iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBUcmFja2VyIH0gZnJvbSAnbWV0ZW9yL3RyYWNrZXInO1xuaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcbmltcG9ydCB7IGNvcm5lcnN0b25lVG9vbHMgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JuZXJzdG9uZSc7XG5cbmxldCBjb25maWd1cmF0aW9uID0ge307XG5cbmNsYXNzIE1lYXN1cmVtZW50QXBpIHtcbiAgICBzdGF0aWMgc2V0Q29uZmlndXJhdGlvbihjb25maWcpIHtcbiAgICAgICAgXy5leHRlbmQoY29uZmlndXJhdGlvbiwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFRvb2xzR3JvdXBzTWFwKCkge1xuICAgICAgICBjb25zdCB0b29sc0dyb3Vwc01hcCA9IHt9O1xuICAgICAgICBjb25maWd1cmF0aW9uLm1lYXN1cmVtZW50VG9vbHMuZm9yRWFjaCh0b29sR3JvdXAgPT4ge1xuICAgICAgICAgICAgdG9vbEdyb3VwLmNoaWxkVG9vbHMuZm9yRWFjaCh0b29sID0+ICh0b29sc0dyb3Vwc01hcFt0b29sLmlkXSA9IHRvb2xHcm91cC5pZCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRvb2xzR3JvdXBzTWFwO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHRpbWVwb2ludEFwaSkge1xuICAgICAgICBpZiAodGltZXBvaW50QXBpKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVwb2ludEFwaSA9IHRpbWVwb2ludEFwaTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudG9vbEdyb3VwcyA9IHt9O1xuICAgICAgICB0aGlzLnRvb2xzID0ge307XG4gICAgICAgIHRoaXMudG9vbHNHcm91cHNNYXAgPSBNZWFzdXJlbWVudEFwaS5nZXRUb29sc0dyb3Vwc01hcCgpO1xuICAgICAgICB0aGlzLmNoYW5nZU9ic2VydmVyID0gbmV3IFRyYWNrZXIuRGVwZW5kZW5jeSgpO1xuXG4gICAgICAgIGNvbmZpZ3VyYXRpb24ubWVhc3VyZW1lbnRUb29scy5mb3JFYWNoKHRvb2xHcm91cCA9PiB7XG4gICAgICAgICAgICBjb25zdCBncm91cENvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihudWxsKTtcbiAgICAgICAgICAgIGdyb3VwQ29sbGVjdGlvbi5fZGVidWdOYW1lID0gdG9vbEdyb3VwLm5hbWU7XG4gICAgICAgICAgICBncm91cENvbGxlY3Rpb24uYXR0YWNoU2NoZW1hKHRvb2xHcm91cC5zY2hlbWEpO1xuICAgICAgICAgICAgdGhpcy50b29sR3JvdXBzW3Rvb2xHcm91cC5pZF0gPSBncm91cENvbGxlY3Rpb247XG5cbiAgICAgICAgICAgIHRvb2xHcm91cC5jaGlsZFRvb2xzLmZvckVhY2godG9vbCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKG51bGwpO1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uX2RlYnVnTmFtZSA9IHRvb2wubmFtZTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLmF0dGFjaFNjaGVtYSh0b29sLnNjaGVtYSk7XG4gICAgICAgICAgICAgICAgdGhpcy50b29sc1t0b29sLmlkXSA9IGNvbGxlY3Rpb247XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhZGRlZEhhbmRsZXIgPSBtZWFzdXJlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtZWFzdXJlbWVudE51bWJlcjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIG1lYXN1cmVtZW50IG51bWJlclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lcG9pbnQgPSB0aGlzLnRpbWVwb2ludEFwaS50aW1lcG9pbnRzLmZpbmRPbmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZHlJbnN0YW5jZVVpZHM6IG1lYXN1cmVtZW50LnN0dWR5SW5zdGFuY2VVaWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudGluZyBlcnJvcnMgdGhyb3duIHdoZW4gbm9uLWFzc29jaWF0ZWQgKHN0YW5kYWxvbmUpIHN0dWR5IGlzIG9wZW5lZC4uLlxuICAgICAgICAgICAgICAgICAgICAvLyBAVE9ETzogTWFrZSBzdXJlIHRoaXMgbG9naWMgaXMgY29ycmVjdC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lcG9pbnQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbXB0eUl0ZW0gPSBncm91cENvbGxlY3Rpb24uZmluZE9uZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sSWQ6IHsgJGVxOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lcG9pbnRJZDogdGltZXBvaW50LnRpbWVwb2ludElkXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbXB0eUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50TnVtYmVyID0gZW1wdHlJdGVtLm1lYXN1cmVtZW50TnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cENvbGxlY3Rpb24udXBkYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lcG9pbnRJZDogdGltZXBvaW50LnRpbWVwb2ludElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50TnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sSWQ6IHRvb2wuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xJdGVtSWQ6IG1lYXN1cmVtZW50Ll9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBtZWFzdXJlbWVudC5jcmVhdGVkQXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50TnVtYmVyID0gZ3JvdXBDb2xsZWN0aW9uLmZpbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0dWR5SW5zdGFuY2VVaWQ6IHsgJGluOiB0aW1lcG9pbnQuc3R1ZHlJbnN0YW5jZVVpZHMgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY291bnQoKSArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtZWFzdXJlbWVudC5tZWFzdXJlbWVudE51bWJlciA9IG1lYXN1cmVtZW50TnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBsb2NhdGlvbi9kZXNjcmlwdGlvbiAoaWYgYWxyZWFkeSBkZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lcG9pbnRJZDogdGltZXBvaW50LnRpbWVwb2ludElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVhc3VyZW1lbnROdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZWxpbmVUaW1lcG9pbnQgPSB0aW1lcG9pbnRBcGkuYmFzZWxpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZWxpbmVHcm91cEVudHJ5ID0gZ3JvdXBDb2xsZWN0aW9uLmZpbmRPbmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXBvaW50SWQ6IGJhc2VsaW5lVGltZXBvaW50LnRpbWVwb2ludElkXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFzZWxpbmVHcm91cEVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sID0gdGhpcy50b29sc1tiYXNlbGluZUdyb3VwRW50cnkudG9vbElkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdG9vbC5maW5kT25lKHsgbWVhc3VyZW1lbnROdW1iZXIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVPYmplY3QubG9jYXRpb24gPSBmb3VuZC5sb2NhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlT2JqZWN0LmRlc2NyaXB0aW9uID0gZm91bmQuZGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSB0aW1lcG9pbnQgSUQsIG1lYXN1cmVtZW50IG51bWJlciwgbG9jYXRpb24gYW5kIGRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24udXBkYXRlKG1lYXN1cmVtZW50Ll9pZCwgeyAkc2V0OiB1cGRhdGVPYmplY3QgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlbXB0eUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlZmxlY3QgdGhlIGVudHJ5IGluIHRoZSB0b29sIGdyb3VwIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwQ29sbGVjdGlvbi5pbnNlcnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xJZDogdG9vbC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sSXRlbUlkOiBtZWFzdXJlbWVudC5faWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXBvaW50SWQ6IHRpbWVwb2ludC50aW1lcG9pbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHVkeUluc3RhbmNlVWlkOiBtZWFzdXJlbWVudC5zdHVkeUluc3RhbmNlVWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbWVhc3VyZW1lbnQuY3JlYXRlZEF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50TnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVuYWJsZSByZWFjdGl2aXR5XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlT2JzZXJ2ZXIuY2hhbmdlZCgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VkSGFuZGxlciA9IG1lYXN1cmVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VPYnNlcnZlci5jaGFuZ2VkKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZWRIYW5kbGVyID0gbWVhc3VyZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZWFzdXJlbWVudE51bWJlciA9IG1lYXN1cmVtZW50Lm1lYXN1cmVtZW50TnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwQ29sbGVjdGlvbi51cGRhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbEl0ZW1JZDogbWVhc3VyZW1lbnQuX2lkXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbEl0ZW1JZDogbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub25FbXB0eUl0ZW0gPSBncm91cENvbGxlY3Rpb24uZmluZE9uZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWFzdXJlbWVudE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xJZDogeyAkbm90OiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vbkVtcHR5SXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBJdGVtcyA9IGdyb3VwQ29sbGVjdGlvbi5maW5kKHsgbWVhc3VyZW1lbnROdW1iZXIgfSkuZmV0Y2goKTtcblxuICAgICAgICAgICAgICAgICAgICBncm91cEl0ZW1zLmZvckVhY2goZ3JvdXBJdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcmVjb3JkIGZyb20gdGhlIHRvb2xzIGdyb3VwIGNvbGxlY3Rpb24gdG9vXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cENvbGxlY3Rpb24ucmVtb3ZlKHsgX2lkOiBncm91cEl0ZW0uX2lkIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIG1lYXN1cmVtZW50IG51bWJlcnMgb25seSBpZiBpdCBpcyBsYXN0IGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVwb2ludCA9IHRoaXMudGltZXBvaW50QXBpLnRpbWVwb2ludHMuZmluZE9uZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXBvaW50SWQ6IGdyb3VwSXRlbS50aW1lcG9pbnRJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHVkeUluc3RhbmNlVWlkOiB7ICRpbjogdGltZXBvaW50LnN0dWR5SW5zdGFuY2VVaWRzIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVhc3VyZW1lbnROdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0l0ZW1zID0gZ3JvdXBDb2xsZWN0aW9uLmZpbmQoZmlsdGVyKS5jb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZW1haW5pbmdJdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlci5tZWFzdXJlbWVudE51bWJlciA9IHsgJGd0ZTogbWVhc3VyZW1lbnROdW1iZXIgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcGVyYXRvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGluYzogeyBtZWFzdXJlbWVudE51bWJlcjogLTEgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgbXVsdGk6IHRydWUgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cENvbGxlY3Rpb24udXBkYXRlKGZpbHRlciwgb3BlcmF0b3IsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xHcm91cC5jaGlsZFRvb2xzLmZvckVhY2goY2hpbGRUb29sID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMudG9vbHNbY2hpbGRUb29sLmlkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi51cGRhdGUoZmlsdGVyLCBvcGVyYXRvciwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN5bmNocm9uaXplIHRoZSBuZXcgdG9vbCBkYXRhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3luY01lYXN1cmVtZW50c0FuZFRvb2xEYXRhKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRW5hYmxlIHJlYWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VPYnNlcnZlci5jaGFuZ2VkKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uZmluZCgpLm9ic2VydmUoe1xuICAgICAgICAgICAgICAgICAgICBhZGRlZDogYWRkZWRIYW5kbGVyLFxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkOiBjaGFuZ2VkSGFuZGxlcixcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZDogcmVtb3ZlZEhhbmRsZXJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXRyaWV2ZU1lYXN1cmVtZW50cyhwYXRpZW50SWQsIHRpbWVwb2ludElkcykge1xuICAgICAgICBjb25zdCByZXRyaWV2YWxGbiA9IGNvbmZpZ3VyYXRpb24uZGF0YUV4Y2hhbmdlLnJldHJpZXZlO1xuICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbihyZXRyaWV2YWxGbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXRyaWV2YWxGbihwYXRpZW50SWQsIHRpbWVwb2ludElkcykudGhlbihtZWFzdXJlbWVudERhdGEgPT4ge1xuXG4gICAgICAgICAgICAgICAgT0hJRi5sb2cuaW5mbygnTWVhc3VyZW1lbnQgZGF0YSByZXRyaWV2YWwnKTtcbiAgICAgICAgICAgICAgICBPSElGLmxvZy5pbmZvKG1lYXN1cmVtZW50RGF0YSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0b29sc0dyb3Vwc01hcCA9IE1lYXN1cmVtZW50QXBpLmdldFRvb2xzR3JvdXBzTWFwKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVhc3VyZW1lbnRzR3JvdXBzID0ge307XG5cbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhtZWFzdXJlbWVudERhdGEpLmZvckVhY2gobWVhc3VyZW1lbnRUeXBlSWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZWFzdXJlbWVudHMgPSBtZWFzdXJlbWVudERhdGFbbWVhc3VyZW1lbnRUeXBlSWRdO1xuXG4gICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50cy5mb3JFYWNoKG1lYXN1cmVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgdG9vbFR5cGUgfSA9IG1lYXN1cmVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2xUeXBlICYmIHRoaXMudG9vbHNbdG9vbFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lYXN1cmVtZW50Ll9pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sR3JvdXAgPSB0b29sc0dyb3Vwc01hcFt0b29sVHlwZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtZWFzdXJlbWVudHNHcm91cHNbdG9vbEdyb3VwXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZWFzdXJlbWVudHNHcm91cHNbdG9vbEdyb3VwXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50c0dyb3Vwc1t0b29sR3JvdXBdLnB1c2gobWVhc3VyZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKG1lYXN1cmVtZW50c0dyb3VwcykuZm9yRWFjaChncm91cEtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gbWVhc3VyZW1lbnRzR3JvdXBzW2dyb3VwS2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEubWVhc3VyZW1lbnROdW1iZXIgPiBiLm1lYXN1cmVtZW50TnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEubWVhc3VyZW1lbnROdW1iZXIgPCBiLm1lYXN1cmVtZW50TnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZm9yRWFjaChtID0+IHRoaXMudG9vbHNbbS50b29sVHlwZV0uaW5zZXJ0KG0pKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9yZU1lYXN1cmVtZW50cyh0aW1lcG9pbnRJZCkge1xuICAgICAgICBjb25zdCBzdG9yZUZuID0gY29uZmlndXJhdGlvbi5kYXRhRXhjaGFuZ2Uuc3RvcmU7XG4gICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHN0b3JlRm4pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbWVhc3VyZW1lbnREYXRhID0ge307XG4gICAgICAgIGNvbmZpZ3VyYXRpb24ubWVhc3VyZW1lbnRUb29scy5mb3JFYWNoKHRvb2xHcm91cCA9PiB7XG4gICAgICAgICAgICB0b29sR3JvdXAuY2hpbGRUb29scy5mb3JFYWNoKHRvb2wgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghbWVhc3VyZW1lbnREYXRhW3Rvb2xHcm91cC5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgbWVhc3VyZW1lbnREYXRhW3Rvb2xHcm91cC5pZF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBtZWFzdXJlbWVudERhdGFbdG9vbEdyb3VwLmlkXSA9IG1lYXN1cmVtZW50RGF0YVt0b29sR3JvdXAuaWRdLmNvbmNhdCh0aGlzLnRvb2xzW3Rvb2wuaWRdLmZpbmQoKS5mZXRjaCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB0aW1lcG9pbnRGaWx0ZXIgPSB0aW1lcG9pbnRJZCA/IHsgdGltZXBvaW50SWQgfSA6IHt9O1xuICAgICAgICBjb25zdCB0aW1lcG9pbnRzID0gdGhpcy50aW1lcG9pbnRBcGkuYWxsKHRpbWVwb2ludEZpbHRlcik7XG4gICAgICAgIGNvbnN0IHRpbWVwb2ludElkcyA9IHRpbWVwb2ludHMubWFwKHQgPT4gdC50aW1lcG9pbnRJZCk7XG4gICAgICAgIGNvbnN0IHBhdGllbnRJZCA9IHRpbWVwb2ludHNbMF0ucGF0aWVudElkO1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSB7XG4gICAgICAgICAgICBwYXRpZW50SWQsXG4gICAgICAgICAgICB0aW1lcG9pbnRJZDoge1xuICAgICAgICAgICAgICAgICRpbjogdGltZXBvaW50SWRzXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgT0hJRi5sb2cuaW5mbygnU2F2aW5nIE1lYXN1cmVtZW50cyBmb3IgdGltZXBvaW50czonLCB0aW1lcG9pbnRzKTtcbiAgICAgICAgcmV0dXJuIHN0b3JlRm4obWVhc3VyZW1lbnREYXRhLCBmaWx0ZXIpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgT0hJRi5sb2cuaW5mbygnTWVhc3VyZW1lbnQgc3RvcmFnZSBjb21wbGV0ZWQnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFsaWRhdGVNZWFzdXJlbWVudHMoKSB7XG4gICAgICAgIGNvbnN0IHZhbGlkYXRlRm4gPSBjb25maWd1cmF0aW9uLmRhdGFWYWxpZGF0aW9uLnZhbGlkYXRlTWVhc3VyZW1lbnRzO1xuICAgICAgICBpZiAodmFsaWRhdGVGbiAmJiB2YWxpZGF0ZUZuIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHZhbGlkYXRlRm4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN5bmNNZWFzdXJlbWVudHNBbmRUb29sRGF0YSgpIHtcbiAgICAgICAgY29uZmlndXJhdGlvbi5tZWFzdXJlbWVudFRvb2xzLmZvckVhY2godG9vbEdyb3VwID0+IHtcbiAgICAgICAgICAgIHRvb2xHcm91cC5jaGlsZFRvb2xzLmZvckVhY2godG9vbCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVhc3VyZW1lbnRzID0gdGhpcy50b29sc1t0b29sLmlkXS5maW5kKCkuZmV0Y2goKTtcbiAgICAgICAgICAgICAgICBtZWFzdXJlbWVudHMuZm9yRWFjaChtZWFzdXJlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9ISUYubWVhc3VyZW1lbnRzLnN5bmNNZWFzdXJlbWVudEFuZFRvb2xEYXRhKG1lYXN1cmVtZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzb3J0TWVhc3VyZW1lbnRzKGJhc2VsaW5lVGltZXBvaW50SWQpIHtcbiAgICAgICAgY29uc3QgdG9vbHMgPSBjb25maWd1cmF0aW9uLm1lYXN1cmVtZW50VG9vbHM7XG5cbiAgICAgICAgY29uc3QgaW5jbHVkZWRUb29scyA9IHRvb2xzLmZpbHRlcih0b29sID0+IHtcbiAgICAgICAgICAgIHJldHVybiAodG9vbC5vcHRpb25zICYmIHRvb2wub3B0aW9ucy5jYXNlUHJvZ3Jlc3MgJiYgdG9vbC5vcHRpb25zLmNhc2VQcm9ncmVzcy5pbmNsdWRlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIE1lYXN1cmVtZW50IHRoZSBkaXNwbGF5ZWQgTWVhc3VyZW1lbnRzXG4gICAgICAgIGluY2x1ZGVkVG9vbHMuZm9yRWFjaCh0b29sID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLnRvb2xzW3Rvb2wuaWRdO1xuICAgICAgICAgICAgY29uc3QgbWVhc3VyZW1lbnRzID0gY29sbGVjdGlvbi5maW5kKCkuZmV0Y2goKTtcbiAgICAgICAgICAgIG1lYXN1cmVtZW50cy5mb3JFYWNoKG1lYXN1cmVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICBPSElGLm1lYXN1cmVtZW50cy5zeW5jTWVhc3VyZW1lbnRBbmRUb29sRGF0YShtZWFzdXJlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGVsZXRlTWVhc3VyZW1lbnRzKG1lYXN1cmVtZW50VHlwZUlkLCBmaWx0ZXIpIHtcbiAgICAgICAgY29uc3QgZ3JvdXBDb2xsZWN0aW9uID0gdGhpcy50b29sR3JvdXBzW21lYXN1cmVtZW50VHlwZUlkXTtcblxuICAgICAgICAvLyBTdG9wIGhlcmUgaWYgaXQgaXMgYSB0ZW1wb3JhcnkgdG9vbEdyb3Vwc1xuICAgICAgICBpZiAoIWdyb3VwQ29sbGVjdGlvbikgcmV0dXJuO1xuXG4gICAgICAgIC8vIEdldCB0aGUgZW50cmllcyBpbmZvcm1hdGlvbiBiZWZvcmUgcmVtb3ZpbmcgdGhlbVxuICAgICAgICBjb25zdCBncm91cEl0ZW1zID0gZ3JvdXBDb2xsZWN0aW9uLmZpbmQoZmlsdGVyKS5mZXRjaCgpO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gW107XG4gICAgICAgIGdyb3VwSXRlbXMuZm9yRWFjaChncm91cEl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKCFncm91cEl0ZW0udG9vbElkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy50b29sc1tncm91cEl0ZW0udG9vbElkXTtcbiAgICAgICAgICAgIGVudHJpZXMucHVzaChjb2xsZWN0aW9uLmZpbmRPbmUoZ3JvdXBJdGVtLnRvb2xJdGVtSWQpKTtcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ucmVtb3ZlKGdyb3VwSXRlbS50b29sSXRlbUlkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU3RvcCBoZXJlIGlmIG5vIGVudHJpZXMgd2VyZSBmb3VuZFxuICAgICAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgZmlsdGVyIGRvZXNuJ3QgaGF2ZSB0aGUgbWVhc3VyZW1lbnQgbnVtYmVyLCBnZXQgaXQgZnJvbSB0aGUgZmlyc3QgZW50cnlcbiAgICAgICAgY29uc3QgbWVhc3VyZW1lbnROdW1iZXIgPSBmaWx0ZXIubWVhc3VyZW1lbnROdW1iZXIgfHwgZW50cmllc1swXS5tZWFzdXJlbWVudE51bWJlcjtcblxuICAgICAgICAvLyBTeW5jaHJvbml6ZSB0aGUgbmV3IGRhdGEgd2l0aCBjb3JuZXJzdG9uZSB0b29sc1xuICAgICAgICBjb25zdCB0b29sU3RhdGUgPSBjb3JuZXJzdG9uZVRvb2xzLmdsb2JhbEltYWdlSWRTcGVjaWZpY1Rvb2xTdGF0ZU1hbmFnZXIuc2F2ZVRvb2xTdGF0ZSgpO1xuXG4gICAgICAgIF8uZWFjaChlbnRyaWVzLCBlbnRyeSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZWFzdXJlbWVudHNEYXRhID0gW107XG4gICAgICAgICAgICBjb25zdCB7IHRvb2wgfSA9IE9ISUYubWVhc3VyZW1lbnRzLmdldFRvb2xDb25maWd1cmF0aW9uKGVudHJ5LnRvb2xUeXBlKTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRvb2wuY2hpbGRUb29scykpIHtcbiAgICAgICAgICAgICAgICB0b29sLmNoaWxkVG9vbHMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZE1lYXN1cmVtZW50ID0gZW50cnlba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZE1lYXN1cmVtZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIG1lYXN1cmVtZW50c0RhdGEucHVzaChjaGlsZE1lYXN1cmVtZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVhc3VyZW1lbnRzRGF0YS5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWVhc3VyZW1lbnRzRGF0YS5mb3JFYWNoKG1lYXN1cmVtZW50RGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBpbWFnZVBhdGgsIHRvb2xUeXBlIH0gPSBtZWFzdXJlbWVudERhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VJZCA9IE9ISUYudmlld2VyYmFzZS5nZXRJbWFnZUlkRm9ySW1hZ2VQYXRoKGltYWdlUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHRvb2xTdGF0ZVtpbWFnZUlkXSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sRGF0YSA9IHRvb2xTdGF0ZVtpbWFnZUlkXVt0b29sVHlwZV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lYXN1cmVtZW50RW50cmllcyA9IHRvb2xEYXRhICYmIHRvb2xEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lYXN1cmVtZW50RW50cnkgPSBfLmZpbmRXaGVyZShtZWFzdXJlbWVudEVudHJpZXMsIHsgX2lkOiBlbnRyeS5faWQgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZWFzdXJlbWVudEVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IG1lYXN1cmVtZW50RW50cmllcy5pbmRleE9mKG1lYXN1cmVtZW50RW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVhc3VyZW1lbnRFbnRyaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29ybmVyc3RvbmVUb29scy5nbG9iYWxJbWFnZUlkU3BlY2lmaWNUb29sU3RhdGVNYW5hZ2VyLnJlc3RvcmVUb29sU3RhdGUodG9vbFN0YXRlKTtcblxuICAgICAgICAvLyBTeW5jaHJvbml6ZSB0aGUgdXBkYXRlZCBtZWFzdXJlbWVudHMgd2l0aCBDb3JuZXJzdG9uZSBUb29sc1xuICAgICAgICAvLyB0b29sRGF0YSB0byBtYWtlIHN1cmUgdGhlIGRpc3BsYXllZCBtZWFzdXJlbWVudHMgc2hvdyAnVGFyZ2V0IFgnIGNvcnJlY3RseVxuICAgICAgICBjb25zdCBzeW5jRmlsdGVyID0gXy5jbG9uZShmaWx0ZXIpO1xuICAgICAgICBkZWxldGUgc3luY0ZpbHRlci50aW1lcG9pbnRJZDtcblxuICAgICAgICBzeW5jRmlsdGVyLm1lYXN1cmVtZW50TnVtYmVyID0ge1xuICAgICAgICAgICAgJGd0OiBtZWFzdXJlbWVudE51bWJlciAtIDFcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0b29sVHlwZXMgPSBfLnVuaXEoZW50cmllcy5tYXAoZW50cnkgPT4gZW50cnkudG9vbFR5cGUpKTtcbiAgICAgICAgdG9vbFR5cGVzLmZvckVhY2godG9vbFR5cGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMudG9vbHNbdG9vbFR5cGVdO1xuICAgICAgICAgICAgY29sbGVjdGlvbi5maW5kKHN5bmNGaWx0ZXIpLmZvckVhY2gobWVhc3VyZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIE9ISUYubWVhc3VyZW1lbnRzLnN5bmNNZWFzdXJlbWVudEFuZFRvb2xEYXRhKG1lYXN1cmVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRNZWFzdXJlbWVudEJ5SWQobWVhc3VyZW1lbnRJZCkge1xuICAgICAgICBsZXQgZm91bmRHcm91cDtcbiAgICAgICAgXy5maW5kKHRoaXMudG9vbEdyb3VwcywgdG9vbEdyb3VwID0+IHtcbiAgICAgICAgICAgIGZvdW5kR3JvdXAgPSB0b29sR3JvdXAuZmluZE9uZSh7IHRvb2xJdGVtSWQ6IG1lYXN1cmVtZW50SWQgfSk7XG4gICAgICAgICAgICByZXR1cm4gISFmb3VuZEdyb3VwO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdG9wIGhlcmUgaWYgbm8gZ3JvdXAgd2FzIGZvdW5kIG9yIGlmIHRoZSByZWNvcmQgaXMgYSBwbGFjZWhvbGRlclxuICAgICAgICBpZiAoIWZvdW5kR3JvdXAgfHwgIWZvdW5kR3JvdXAudG9vbElkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy50b29sc1tmb3VuZEdyb3VwLnRvb2xJZF0uZmluZE9uZShtZWFzdXJlbWVudElkKTtcbiAgICB9XG5cbiAgICBmZXRjaCh0b29sR3JvdXBJZCwgc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRvb2xHcm91cHNbdG9vbEdyb3VwSWRdKSB7XG4gICAgICAgICAgICB0aHJvdyAnTWVhc3VyZW1lbnRBcGk6IE5vIENvbGxlY3Rpb24gd2l0aCB0aGUgaWQ6ICcgKyB0b29sR3JvdXBJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwge307XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLnRvb2xHcm91cHNbdG9vbEdyb3VwSWRdLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKCk7XG4gICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS50b29sSWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzLnRvb2xzW2l0ZW0udG9vbElkXS5maW5kT25lKGl0ZW0udG9vbEl0ZW1JZCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IG1lYXN1cmVtZW50TnVtYmVyOiBpdGVtLm1lYXN1cmVtZW50TnVtYmVyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuT0hJRi5tZWFzdXJlbWVudHMuTWVhc3VyZW1lbnRBcGkgPSBNZWFzdXJlbWVudEFwaTtcbiIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IF8gfSBmcm9tICdtZXRlb3IvdW5kZXJzY29yZSc7XG5cbmltcG9ydCB7IE9ISUYgfSBmcm9tICdtZXRlb3Ivb2hpZjpjb3JlJztcblxuaW1wb3J0IHsgc2NoZW1hIGFzIFRpbWVwb2ludFNjaGVtYSB9IGZyb20gJ21ldGVvci9vaGlmOm1lYXN1cmVtZW50cy9ib3RoL3NjaGVtYS90aW1lcG9pbnRzJztcblxuY29uc3QgY29uZmlndXJhdGlvbiA9IHt9O1xuXG5jbGFzcyBUaW1lcG9pbnRBcGkge1xuICAgIHN0YXRpYyBzZXRDb25maWd1cmF0aW9uKGNvbmZpZykge1xuICAgICAgICBfLmV4dGVuZChjb25maWd1cmF0aW9uLCBjb25maWcpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDb25maWd1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihjdXJyZW50VGltZXBvaW50SWQsIG9wdGlvbnM9e30pIHtcbiAgICAgICAgaWYgKGN1cnJlbnRUaW1lcG9pbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VGltZXBvaW50SWQgPSBjdXJyZW50VGltZXBvaW50SWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLnRpbWVwb2ludHMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihudWxsKTtcbiAgICAgICAgdGhpcy50aW1lcG9pbnRzLmF0dGFjaFNjaGVtYShUaW1lcG9pbnRTY2hlbWEpO1xuICAgICAgICB0aGlzLnRpbWVwb2ludHMuX2RlYnVnTmFtZSA9ICdUaW1lcG9pbnRzJztcbiAgICB9XG5cbiAgICByZXRyaWV2ZVRpbWVwb2ludHMoZmlsdGVyKSB7XG4gICAgICAgIGNvbnN0IHJldHJpZXZhbEZuID0gY29uZmlndXJhdGlvbi5kYXRhRXhjaGFuZ2UucmV0cmlldmU7XG4gICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHJldHJpZXZhbEZuKSkge1xuICAgICAgICAgICAgT0hJRi5sb2cuZXJyb3IoJ1RpbWVwb2ludCByZXRyaWV2YWwgZnVuY3Rpb24gaGFzIG5vdCBiZWVuIGNvbmZpZ3VyZWQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0cmlldmFsRm4oZmlsdGVyKS50aGVuKHRpbWVwb2ludERhdGEgPT4ge1xuICAgICAgICAgICAgICAgIE9ISUYubG9nLmluZm8oJ1RpbWVwb2ludCBkYXRhIHJldHJpZXZhbCcpO1xuXG4gICAgICAgICAgICAgICAgXy5lYWNoKHRpbWVwb2ludERhdGEsIHRpbWVwb2ludCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aW1lcG9pbnQuX2lkO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBxdWVyeSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVwb2ludElkOiB0aW1lcG9pbnQudGltZXBvaW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVwb2ludHMudXBkYXRlKHF1ZXJ5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2V0OiB0aW1lcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBzZXJ0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSkuY2F0Y2gocmVhc29uID0+IHtcbiAgICAgICAgICAgICAgICBPSElGLmxvZy5lcnJvcihgVGltZXBvaW50IHJldHJpZXZhbCBmdW5jdGlvbiBmYWlsZWQ6ICR7cmVhc29ufWApO1xuICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3JlVGltZXBvaW50cygpIHtcbiAgICAgICAgY29uc3Qgc3RvcmVGbiA9IGNvbmZpZ3VyYXRpb24uZGF0YUV4Y2hhbmdlLnN0b3JlO1xuICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbihzdG9yZUZuKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGltZXBvaW50RGF0YSA9IHRoaXMudGltZXBvaW50cy5maW5kKCkuZmV0Y2goKTtcbiAgICAgICAgT0hJRi5sb2cuaW5mbygnUHJlcGFyaW5nIHRvIHN0b3JlIHRpbWVwb2ludHMnKTtcbiAgICAgICAgT0hJRi5sb2cuaW5mbyhKU09OLnN0cmluZ2lmeSh0aW1lcG9pbnREYXRhLCBudWxsLCAyKSk7XG5cbiAgICAgICAgc3RvcmVGbih0aW1lcG9pbnREYXRhKS50aGVuKCgpID0+IE9ISUYubG9nLmluZm8oJ1RpbWVwb2ludCBzdG9yYWdlIGNvbXBsZXRlZCcpKTtcbiAgICB9XG5cbiAgICBkaXNhc3NvY2lhdGVTdHVkeSh0aW1lcG9pbnRJZHMsIHN0dWR5SW5zdGFuY2VVaWQpIHtcbiAgICAgICAgY29uc3QgZGlzYXNzb2NpYXRlRm4gPSBjb25maWd1cmF0aW9uLmRhdGFFeGNoYW5nZS5kaXNhc3NvY2lhdGU7XG4gICAgICAgIGRpc2Fzc29jaWF0ZUZuKHRpbWVwb2ludElkcywgc3R1ZHlJbnN0YW5jZVVpZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBPSElGLmxvZy5pbmZvKCdEaXNhc3NvY2lhdGlvbiBjb21wbGV0ZWQnKTtcblxuICAgICAgICAgICAgdGhpcy50aW1lcG9pbnRzLnJlbW92ZSh7fSk7XG4gICAgICAgICAgICB0aGlzLnJldHJpZXZlVGltZXBvaW50cyh7fSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbW92ZVRpbWVwb2ludCh0aW1lcG9pbnRJZCkge1xuICAgICAgICBjb25zdCByZW1vdmVGbiA9IGNvbmZpZ3VyYXRpb24uZGF0YUV4Y2hhbmdlLnJlbW92ZTtcbiAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24ocmVtb3ZlRm4pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aW1lcG9pbnREYXRhID0ge1xuICAgICAgICAgICAgdGltZXBvaW50SWRcbiAgICAgICAgfTtcblxuICAgICAgICBPSElGLmxvZy5pbmZvKCdQcmVwYXJpbmcgdG8gcmVtb3ZlIHRpbWVwb2ludCcpO1xuICAgICAgICBPSElGLmxvZy5pbmZvKEpTT04uc3RyaW5naWZ5KHRpbWVwb2ludERhdGEsIG51bGwsIDIpKTtcblxuICAgICAgICByZW1vdmVGbih0aW1lcG9pbnREYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIE9ISUYubG9nLmluZm8oJ1RpbWVwb2ludCByZW1vdmFsIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgdGhpcy50aW1lcG9pbnRzLnJlbW92ZSh0aW1lcG9pbnREYXRhKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlVGltZXBvaW50KHRpbWVwb2ludElkLCBxdWVyeSkge1xuICAgICAgICBjb25zdCB1cGRhdGVGbiA9IGNvbmZpZ3VyYXRpb24uZGF0YUV4Y2hhbmdlLnVwZGF0ZTtcbiAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24odXBkYXRlRm4pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aW1lcG9pbnREYXRhID0ge1xuICAgICAgICAgICAgdGltZXBvaW50SWRcbiAgICAgICAgfTtcblxuICAgICAgICBPSElGLmxvZy5pbmZvKCdQcmVwYXJpbmcgdG8gdXBkYXRlIHRpbWVwb2ludCcpO1xuICAgICAgICBPSElGLmxvZy5pbmZvKEpTT04uc3RyaW5naWZ5KHRpbWVwb2ludERhdGEsIG51bGwsIDIpKTtcbiAgICAgICAgT0hJRi5sb2cuaW5mbyhKU09OLnN0cmluZ2lmeShxdWVyeSwgbnVsbCwgMikpO1xuXG4gICAgICAgIHVwZGF0ZUZuKHRpbWVwb2ludERhdGEsIHF1ZXJ5KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIE9ISUYubG9nLmluZm8oJ1RpbWVwb2ludCB1cGRhdGVkIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgdGhpcy50aW1lcG9pbnRzLnVwZGF0ZSh0aW1lcG9pbnREYXRhLCBxdWVyeSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBhbGwgdGltZXBvaW50c1xuICAgIGFsbChmaWx0ZXI9e30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXBvaW50cy5maW5kKGZpbHRlciwge1xuICAgICAgICAgICAgc29ydDoge1xuICAgICAgICAgICAgICAgIGxhdGVzdERhdGU6IC0xXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KS5mZXRjaCgpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBvbmx5IHRoZSBjdXJyZW50IHRpbWVwb2ludFxuICAgIGN1cnJlbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbWVwb2ludHMuZmluZE9uZSh7IHRpbWVwb2ludElkOiB0aGlzLmN1cnJlbnRUaW1lcG9pbnRJZCB9KTtcbiAgICB9XG5cbiAgICBsb2NrKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5jdXJyZW50KCk7XG4gICAgICAgIGlmICghY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lcG9pbnRzLnVwZGF0ZShjdXJyZW50Ll9pZCwge1xuICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAgIGxvY2tlZDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIHByaW9yIHRpbWVwb2ludFxuICAgIHByaW9yKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5jdXJyZW50KCk7XG4gICAgICAgIGlmICghY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF0ZXN0RGF0ZSA9IGN1cnJlbnQubGF0ZXN0RGF0ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZXBvaW50cy5maW5kT25lKHtcbiAgICAgICAgICAgIGxhdGVzdERhdGU6IHsgJGx0OiBsYXRlc3REYXRlIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgc29ydDogeyBsYXRlc3REYXRlOiAtMSB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBvbmx5IHRoZSBjdXJyZW50IGFuZCBwcmlvciB0aW1lcG9pbnRzXG4gICAgY3VycmVudEFuZFByaW9yKCkge1xuICAgICAgICBjb25zdCB0aW1lcG9pbnRzID0gW107XG5cbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuY3VycmVudCgpO1xuICAgICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICAgICAgdGltZXBvaW50cy5wdXNoKGN1cnJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJpb3IgPSB0aGlzLnByaW9yKCk7XG4gICAgICAgIGlmIChjdXJyZW50ICYmIHByaW9yICYmIHByaW9yLl9pZCAhPT0gY3VycmVudC5faWQpIHtcbiAgICAgICAgICAgIHRpbWVwb2ludHMucHVzaChwcmlvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGltZXBvaW50cztcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gb25seSB0aGUgY29tcGFyaXNvbiB0aW1lcG9pbnRzXG4gICAgY29tcGFyaXNvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEFuZFByaW9yKCk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIG9ubHkgdGhlIGJhc2VsaW5lIHRpbWVwb2ludFxuICAgIGJhc2VsaW5lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW1lcG9pbnRzLmZpbmRPbmUoeyB0aW1lcG9pbnRUeXBlOiAnYmFzZWxpbmUnIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBvbmx5IHRoZSBuYWRpciB0aW1lcG9pbnRcbiAgICBuYWRpcigpIHtcbiAgICAgICAgY29uc3QgdGltZXBvaW50ID0gdGhpcy50aW1lcG9pbnRzLmZpbmRPbmUoeyB0aW1lcG9pbnRLZXk6ICduYWRpcicgfSk7XG4gICAgICAgIHJldHVybiB0aW1lcG9pbnQgfHwgdGhpcy5iYXNlbGluZSgpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBvbmx5IHRoZSBrZXkgdGltZXBvaW50cyAoY3VycmVudCwgcHJpb3IsIG5hZGlyIGFuZCBiYXNlbGluZSlcbiAgICBrZXkoZmlsdGVyPXt9KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIC8vIEdldCBhbGwgdGhlIHRpbWVwb2ludHNcbiAgICAgICAgY29uc3QgYWxsID0gdGhpcy5hbGwoZmlsdGVyKTtcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgZWFjaCB0aW1lcG9pbnQgYW5kIGluc2VydCB0aGUga2V5IG9uZXMgaW4gdGhlIHJlc3VsdFxuICAgICAgICBfLmVhY2goYWxsLCAodGltZXBvaW50LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgMiB8fCBpbmRleCA9PT0gKGFsbC5sZW5ndGggLSAxKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRpbWVwb2ludCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgcmVzdWx0aW5nIHRpbWVwb2ludHNcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gb25seSB0aGUgdGltZXBvaW50cyBmb3IgdGhlIGdpdmVuIHN0dWR5XG4gICAgc3R1ZHkoc3R1ZHlJbnN0YW5jZVVpZCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgZWFjaCB0aW1lcG9pbnQgYW5kIGluc2VydCB0aGUga2V5IG9uZXMgaW4gdGhlIHJlc3VsdFxuICAgICAgICBfLmVhY2godGhpcy5hbGwoKSwgKHRpbWVwb2ludCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHRpbWVwb2ludC5zdHVkeUluc3RhbmNlVWlkcywgc3R1ZHlJbnN0YW5jZVVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0aW1lcG9pbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIHJlc3VsdGluZyB0aW1lcG9pbnRzXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSB0aW1lcG9pbnQncyBuYW1lXG4gICAgbmFtZSh0aW1lcG9pbnQpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBhIEJhc2VsaW5lIHRpbWVwb2ludCwgaWYgaXQgaXMsIHJldHVybiAnQmFzZWxpbmUnXG4gICAgICAgIGlmICh0aW1lcG9pbnQudGltZXBvaW50VHlwZSA9PT0gJ2Jhc2VsaW5lJykge1xuICAgICAgICAgICAgcmV0dXJuICdCYXNlbGluZSc7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZXBvaW50LnZpc2l0TnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ZvbGxvdy11cCAnICsgdGltZXBvaW50LnZpc2l0TnVtYmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0cmlldmUgYWxsIG9mIHRoZSByZWxldmFudCBmb2xsb3ctdXAgdGltZXBvaW50cyBmb3IgdGhpcyBwYXRpZW50XG4gICAgICAgIGNvbnN0IGZvbGxvd3VwVGltZXBvaW50cyA9IHRoaXMudGltZXBvaW50cy5maW5kKHtcbiAgICAgICAgICAgIHBhdGllbnRJZDogdGltZXBvaW50LnBhdGllbnRJZCxcbiAgICAgICAgICAgIHRpbWVwb2ludFR5cGU6IHRpbWVwb2ludC50aW1lcG9pbnRUeXBlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHNvcnQ6IHtcbiAgICAgICAgICAgICAgICBsYXRlc3REYXRlOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBvZiBqdXN0IHRpbWVwb2ludElkcywgc28gd2UgY2FuIHVzZSBpbmRleE9mXG4gICAgICAgIC8vIG9uIGl0IHRvIGZpbmQgdGhlIGN1cnJlbnQgdGltZXBvaW50J3MgcmVsYXRpdmUgcG9zaXRpb25cbiAgICAgICAgY29uc3QgZm9sbG93dXBUaW1lcG9pbnRJZHMgPSBmb2xsb3d1cFRpbWVwb2ludHMubWFwKHRpbWVwb2ludCA9PiB0aW1lcG9pbnQudGltZXBvaW50SWQpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgdGltZXBvaW50IGluIHRoZSBhcnJheSBvZiBhbGxcbiAgICAgICAgLy8gcmVsZXZhbnQgZm9sbG93LXVwIHRpbWVwb2ludHNcbiAgICAgICAgY29uc3QgaW5kZXggPSBmb2xsb3d1cFRpbWVwb2ludElkcy5pbmRleE9mKHRpbWVwb2ludC50aW1lcG9pbnRJZCkgKyAxO1xuXG4gICAgICAgIC8vIElmIGluZGV4IGlzIDAsIGl0IG1lYW5zIHRoYXQgdGhlIGN1cnJlbnQgdGltZXBvaW50IHdhcyBub3QgaW4gdGhlIGxpc3RcbiAgICAgICAgLy8gTG9nIGEgd2FybmluZyBhbmQgcmV0dXJuIGhlcmVcbiAgICAgICAgaWYgKCFpbmRleCkge1xuICAgICAgICAgICAgT0hJRi5sb2cud2FybignQ3VycmVudCBmb2xsb3ctdXAgd2FzIG5vdCBpbiB0aGUgbGlzdCBvZiByZWxldmFudCBmb2xsb3ctdXBzPycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSB0aW1lcG9pbnQgbmFtZSBhcyAnRm9sbG93LXVwIE4nXG4gICAgICAgIHJldHVybiAnRm9sbG93LXVwICcgKyBpbmRleDtcbiAgICB9XG5cbiAgICAvLyBCdWlsZCB0aGUgdGltZXBvaW50IHRpdGxlIGJhc2VkIG9uIGl0cyBkYXRlXG4gICAgdGl0bGUodGltZXBvaW50KSB7XG4gICAgICAgIGNvbnN0IHRpbWVwb2ludE5hbWUgPSB0aGlzLm5hbWUodGltZXBvaW50KTtcblxuICAgICAgICBjb25zdCBhbGwgPSBfLmNsb25lKHRoaXMuYWxsKCkpO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGN1cnJlbnRJbmRleCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGltZXBvaW50ID0gYWxsW2ldO1xuXG4gICAgICAgICAgICAvLyBTa2lwIHRoZSBpdGVyYXRpb25zIHVudGlsIHdlIGNhbid0IGZpbmQgdGhlIHNlbGVjdGVkIHRpbWVwb2ludCBvbiBzdHVkeSBsaXN0XG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50VGltZXBvaW50SWQgPT09IGN1cnJlbnRUaW1lcG9pbnQudGltZXBvaW50SWQpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5pc051bWJlcihjdXJyZW50SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBjdXJyZW50SW5kZXgrKztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQnJlYWsgdGhlIGxvb3AgaWYgcmVhY2hlZCB0aGUgdGltZXBvaW50IHRvIGdldCB0aGUgdGl0bGVcbiAgICAgICAgICAgIGlmIChjdXJyZW50VGltZXBvaW50LnRpbWVwb2ludElkID09PSB0aW1lcG9pbnQudGltZXBvaW50SWQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXRlcyA9IHtcbiAgICAgICAgICAgIDA6ICcoQ3VycmVudCknLFxuICAgICAgICAgICAgMTogJyhQcmlvciknXG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE86IFtkZXNpZ25dIGZpbmQgb3V0IGhvdyB0byBkZWZpbmUgdGhlIG5hZGlyIHRpbWVwb2ludFxuICAgICAgICBjb25zdCBwYXJlbnRoZXNpcyA9IHN0YXRlc1tpbmRleF0gfHwgJyc7XG4gICAgICAgIHJldHVybiBgJHt0aW1lcG9pbnROYW1lfSAke3BhcmVudGhlc2lzfWA7XG4gICAgfVxuXG59XG5cbk9ISUYubWVhc3VyZW1lbnRzLlRpbWVwb2ludEFwaSA9IFRpbWVwb2ludEFwaTtcbiIsImltcG9ydCAnLi9tZWFzdXJlbWVudHMuanMnO1xuaW1wb3J0ICcuL3RpbWVwb2ludHMuanMnO1xuIiwiaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuY29uc3QgTWVhc3VyZW1lbnQgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICBhZGRpdGlvbmFsRGF0YToge1xuICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgIGxhYmVsOiAnQWRkaXRpb25hbCBEYXRhJyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiB7fSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICAgIGJsYWNrYm94OiB0cnVlXG4gICAgfSxcbiAgICB1c2VySWQ6IHtcbiAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICBsYWJlbDogJ1VzZXIgSUQnLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgcGF0aWVudElkOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6ICdQYXRpZW50IElEJyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1lYXN1cmVtZW50TnVtYmVyOiB7XG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgbGFiZWw6ICdNZWFzdXJlbWVudCBOdW1iZXInLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgdGltZXBvaW50SWQ6IHtcbiAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICBsYWJlbDogJ1RpbWVwb2ludCBJRCcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICAvLyBGb3JjZSB2YWx1ZSB0byBiZSBjdXJyZW50IGRhdGUgKG9uIHNlcnZlcikgdXBvbiBpbnNlcnRcbiAgICAvLyBhbmQgcHJldmVudCB1cGRhdGVzIHRoZXJlYWZ0ZXIuXG4gICAgY3JlYXRlZEF0OiB7XG4gICAgICAgIHR5cGU6IERhdGUsXG4gICAgICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0luc2VydCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzVXBzZXJ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgJHNldE9uSW5zZXJ0OiBuZXcgRGF0ZSgpIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFtQV1YtMTg0XSBQcmV2ZW50aW5nIHVuc2V0IGR1ZSB0byBjaGlsZCB0b29scyB1cGRhdGluZ1xuICAgICAgICAgICAgICAgIC8vIHRoaXMudW5zZXQoKTsgLy8gUHJldmVudCB1c2VyIGZyb20gc3VwcGx5aW5nIHRoZWlyIG93biB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBGb3JjZSB2YWx1ZSB0byBiZSBjdXJyZW50IGRhdGUgKG9uIHNlcnZlcikgdXBvbiB1cGRhdGVcbiAgICB1cGRhdGVkQXQ6IHtcbiAgICAgICAgdHlwZTogRGF0ZSxcbiAgICAgICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzVXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfVxufSk7XG5cbmNvbnN0IFN0dWR5TGV2ZWxNZWFzdXJlbWVudCA9IG5ldyBTaW1wbGVTY2hlbWEoW1xuICAgIE1lYXN1cmVtZW50LFxuICAgIHtcbiAgICAgICAgc3R1ZHlJbnN0YW5jZVVpZDoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgbGFiZWw6ICdTdHVkeSBJbnN0YW5jZSBVSUQnXG4gICAgICAgIH1cbiAgICB9XG5dKTtcblxuY29uc3QgU2VyaWVzTGV2ZWxNZWFzdXJlbWVudCA9IG5ldyBTaW1wbGVTY2hlbWEoW1xuICAgIFN0dWR5TGV2ZWxNZWFzdXJlbWVudCxcbiAgICB7XG4gICAgICAgIHNlcmllc0luc3RhbmNlVWlkOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgICAgICBsYWJlbDogJ1NlcmllcyBJbnN0YW5jZSBVSUQnXG4gICAgICAgIH1cbiAgICB9XG5dKTtcblxuY29uc3QgQ29ybmVyc3RvbmVWT0kgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICB3aW5kb3dXaWR0aDoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnV2luZG93IFdpZHRoJyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHdpbmRvd0NlbnRlcjoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnV2luZG93IENlbnRlcicsXG4gICAgICAgIGRlY2ltYWw6IHRydWUsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbn0pO1xuXG5jb25zdCBDb3JuZXJzdG9uZVZpZXdwb3J0VHJhbnNsYXRpb24gPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICB4OiB7XG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgbGFiZWw6ICdYJyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHk6IHtcbiAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICBsYWJlbDogJ1knLFxuICAgICAgICBkZWNpbWFsOiB0cnVlLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG59KTtcblxuY29uc3QgQ29ybmVyc3RvbmVWaWV3cG9ydCA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAgIHNjYWxlOiB7XG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgbGFiZWw6ICdTY2FsZScsXG4gICAgICAgIGRlY2ltYWw6IHRydWUsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICB0cmFuc2xhdGlvbjoge1xuICAgICAgICB0eXBlOiBDb3JuZXJzdG9uZVZpZXdwb3J0VHJhbnNsYXRpb24sXG4gICAgICAgIGxhYmVsOiAnVHJhbnNsYXRpb24nLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgdm9pOiB7XG4gICAgICAgIHR5cGU6IENvcm5lcnN0b25lVk9JLFxuICAgICAgICBsYWJlbDogJ1ZPSScsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBpbnZlcnQ6IHtcbiAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgbGFiZWw6ICdJbnZlcnQnLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgcGl4ZWxSZXBsaWNhdGlvbjoge1xuICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICBsYWJlbDogJ1BpeGVsIFJlcGxpY2F0aW9uJyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGhGbGlwOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnSG9yaXpvbnRhbCBGbGlwJyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHZGbGlwOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnVmVydGljYWwgRmxpcCcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICByb3RhdGlvbjoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnUm90YXRpb24gKGRlZ3JlZXMpJyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9XG59KTtcblxuY29uc3QgSW5zdGFuY2VMZXZlbE1lYXN1cmVtZW50ID0gbmV3IFNpbXBsZVNjaGVtYShbXG4gICAgU3R1ZHlMZXZlbE1lYXN1cmVtZW50LFxuICAgIFNlcmllc0xldmVsTWVhc3VyZW1lbnQsXG4gICAge1xuICAgICAgICBzb3BJbnN0YW5jZVVpZDoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgbGFiZWw6ICdTT1AgSW5zdGFuY2UgVUlEJ1xuICAgICAgICB9LFxuICAgICAgICB2aWV3cG9ydDoge1xuICAgICAgICAgICAgdHlwZTogQ29ybmVyc3RvbmVWaWV3cG9ydCxcbiAgICAgICAgICAgIGxhYmVsOiAnVmlld3BvcnQgUGFyYW1ldGVycycsXG4gICAgICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuXSk7XG5cbmNvbnN0IEZyYW1lTGV2ZWxNZWFzdXJlbWVudCA9IG5ldyBTaW1wbGVTY2hlbWEoW1xuICAgIFN0dWR5TGV2ZWxNZWFzdXJlbWVudCxcbiAgICBTZXJpZXNMZXZlbE1lYXN1cmVtZW50LFxuICAgIEluc3RhbmNlTGV2ZWxNZWFzdXJlbWVudCxcbiAgICB7XG4gICAgICAgIGZyYW1lSW5kZXg6IHtcbiAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIGxhYmVsOiAnRnJhbWUgaW5kZXggaW4gSW5zdGFuY2UnXG4gICAgICAgIH0sXG4gICAgICAgIGltYWdlUGF0aDoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgbGFiZWw6ICdJZGVudGlmaWVyIGZvciB0aGUgbWVhc3VyZW1lbnRcXCdzIGltYWdlJyAvLyBzdHVkeUluc3RhbmNlVWlkX3Nlcmllc0luc3RhbmNlVWlkX3NvcEluc3RhbmNlVWlkX2ZyYW1lSW5kZXhcbiAgICAgICAgfVxuICAgIH1cbl0pO1xuXG5jb25zdCBDb3JuZXJzdG9uZVRvb2xNZWFzdXJlbWVudCA9IG5ldyBTaW1wbGVTY2hlbWEoW1xuICAgIFN0dWR5TGV2ZWxNZWFzdXJlbWVudCxcbiAgICBTZXJpZXNMZXZlbE1lYXN1cmVtZW50LFxuICAgIEluc3RhbmNlTGV2ZWxNZWFzdXJlbWVudCxcbiAgICBGcmFtZUxldmVsTWVhc3VyZW1lbnQsXG4gICAge1xuICAgICAgICB0b29sVHlwZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgbGFiZWw6ICdDb3JuZXJzdG9uZSBUb29sIFR5cGUnLFxuICAgICAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgdmlzaWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGxhYmVsOiAnVmlzaWJsZScsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgbGFiZWw6ICdBY3RpdmUnLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlZDoge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGxhYmVsOiAnSW52YWxpZGF0ZWQnLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5dKTtcblxuY29uc3QgQ29ybmVyc3RvbmVIYW5kbGVCb3VuZGluZ0JveFNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAgIHdpZHRoOiB7XG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgbGFiZWw6ICdXaWR0aCcsXG4gICAgICAgIGRlY2ltYWw6IHRydWVcbiAgICB9LFxuICAgIGhlaWdodDoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnSGVpZ2h0JyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZVxuICAgIH0sXG4gICAgbGVmdDoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnTGVmdCcsXG4gICAgICAgIGRlY2ltYWw6IHRydWVcbiAgICB9LFxuICAgIHRvcDoge1xuICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgIGxhYmVsOiAnVG9wJyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZVxuICAgIH1cbn0pO1xuXG5jb25zdCBDb3JuZXJzdG9uZUhhbmRsZVNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAgIHg6IHtcbiAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICBsYWJlbDogJ1gnLFxuICAgICAgICBkZWNpbWFsOiB0cnVlLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZSAvLyBOb3QgYWN0dWFsbHkgb3B0aW9uYWwsIGJ1dCBzb21ldGltZXMgdmFsdWVzIGxpa2UgeC95IHBvc2l0aW9uIGFyZSBtaXNzaW5nXG4gICAgfSxcbiAgICB5OiB7XG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgbGFiZWw6ICdZJyxcbiAgICAgICAgZGVjaW1hbDogdHJ1ZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWUgLy8gTm90IGFjdHVhbGx5IG9wdGlvbmFsLCBidXQgc29tZXRpbWVzIHZhbHVlcyBsaWtlIHgveSBwb3NpdGlvbiBhcmUgbWlzc2luZ1xuICAgIH0sXG4gICAgaGlnaGxpZ2h0OiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnSGlnaGxpZ2h0JyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgYWN0aXZlOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnQWN0aXZlJyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGRyYXduSW5kZXBlbmRlbnRseToge1xuICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICBsYWJlbDogJ0RyYXduIEluZGVwZW5kZW50bHknLFxuICAgICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgbW92ZXNJbmRlcGVuZGVudGx5OiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnTW92ZXMgSW5kZXBlbmRlbnRseScsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBhbGxvd2VkT3V0c2lkZUltYWdlOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnQWxsb3dlZCBPdXRzaWRlIEltYWdlJyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGhhc01vdmVkOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiAnSGFzIEFscmVhZHkgTW92ZWQnLFxuICAgICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgaGFzQm91bmRpbmdCb3g6IHtcbiAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgbGFiZWw6ICdIYXMgQm91bmRpbmcgQm94JyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGJvdW5kaW5nQm94OiB7XG4gICAgICAgIHR5cGU6IENvcm5lcnN0b25lSGFuZGxlQm91bmRpbmdCb3hTY2hlbWEsXG4gICAgICAgIGxhYmVsOiAnQm91bmRpbmcgQm94JyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGluZGV4OiB7IC8vIFRPRE86IFJlbW92ZSAnaW5kZXgnIGZyb20gYmlkaXJlY3Rpb25hbFRvb2wgc2luY2UgaXQncyB1c2VsZXNzXG4gICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIGxvY2tlZDoge1xuICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICBsYWJlbDogJ0xvY2tlZCcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlXG4gICAgfVxufSk7XG5cbmV4cG9ydCBjb25zdCBNZWFzdXJlbWVudFNjaGVtYVR5cGVzID0ge1xuICAgIE1lYXN1cmVtZW50OiBNZWFzdXJlbWVudCxcbiAgICBTdHVkeUxldmVsTWVhc3VyZW1lbnQ6IFN0dWR5TGV2ZWxNZWFzdXJlbWVudCxcbiAgICBTZXJpZXNMZXZlbE1lYXN1cmVtZW50OiBTZXJpZXNMZXZlbE1lYXN1cmVtZW50LFxuICAgIEluc3RhbmNlTGV2ZWxNZWFzdXJlbWVudDogSW5zdGFuY2VMZXZlbE1lYXN1cmVtZW50LFxuICAgIEZyYW1lTGV2ZWxNZWFzdXJlbWVudDogRnJhbWVMZXZlbE1lYXN1cmVtZW50LFxuICAgIENvcm5lcnN0b25lVG9vbE1lYXN1cmVtZW50OiBDb3JuZXJzdG9uZVRvb2xNZWFzdXJlbWVudCxcbiAgICBDb3JuZXJzdG9uZUhhbmRsZVNjaGVtYTogQ29ybmVyc3RvbmVIYW5kbGVTY2hlbWFcbn07XG4iLCJpbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gICAgcGF0aWVudElkOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6ICdQYXRpZW50IElEJyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHRpbWVwb2ludElkOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6ICdUaW1lcG9pbnQgSUQnXG4gICAgfSxcbiAgICB0aW1lcG9pbnRUeXBlOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6ICdUaW1lcG9pbnQgVHlwZScsXG4gICAgICAgIGFsbG93ZWRWYWx1ZXM6IFsnYmFzZWxpbmUnLCAnZm9sbG93dXAnXSxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiAnYmFzZWxpbmUnLFxuICAgIH0sXG4gICAgaXNMb2NrZWQ6IHtcbiAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgbGFiZWw6ICdUaW1lcG9pbnQgTG9ja2VkJ1xuICAgIH0sXG4gICAgc3R1ZHlJbnN0YW5jZVVpZHM6IHtcbiAgICAgICAgdHlwZTogW1N0cmluZ10sXG4gICAgICAgIGxhYmVsOiAnU3R1ZHkgSW5zdGFuY2UgVWlkcycsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogW11cbiAgICB9LFxuICAgIGVhcmxpZXN0RGF0ZToge1xuICAgICAgICB0eXBlOiBEYXRlLFxuICAgICAgICBsYWJlbDogJ0VhcmxpZXN0IFN0dWR5IERhdGUgZnJvbSBhc3NvY2lhdGVkIHN0dWRpZXMnLFxuICAgIH0sXG4gICAgbGF0ZXN0RGF0ZToge1xuICAgICAgICB0eXBlOiBEYXRlLFxuICAgICAgICBsYWJlbDogJ01vc3QgcmVjZW50IFN0dWR5IERhdGUgZnJvbSBhc3NvY2lhdGVkIHN0dWRpZXMnLFxuICAgIH0sXG4gICAgdmlzaXROdW1iZXI6IHtcbiAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICBsYWJlbDogJ051bWJlciBvZiBwYXRpZW50XFwncyB2aXNpdCcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBzdHVkaWVzRGF0YToge1xuICAgICAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICAgICAgbGFiZWw6ICdTdHVkaWVzIGRhdGEgdG8gYWxsb3cgbGF6eSBsb2FkaW5nJyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICAgIGJsYWNrYm94OiB0cnVlXG4gICAgfVxufSk7XG4iXX0=
