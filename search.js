#!/usr/bin/env node

var debug = require("debug")("search");
var _ = require("underscore");
var fs = require("fs");
var parse = require('csv-parse');
var Promise = require("bluebird");
fs.readFile = Promise.promisify(fs.readFile);
parse = Promise.promisify(parse);
var moment = require("moment");
var subscription = require("./subscription");
var inquirer = require("inquirer");

inquirer.prompt([{
  "message": "Import CSV",
  "name": "import_csv",
  "default": "/Users/thomas/Downloads/subscriptions_holstee_04_Dec_2014_04_54_34/Subscriptions.csv",
}, {
  "message": "Query",
  "name": "query"
}], function(answers) {
  import_csv = answers.import_csv.replace(/\s+|\n|\r/gi, "");
  fs.readFile(import_csv, "utf8")
    .then(function(data) {
      return parse(data);
    })
    .then(function(rows) {
      var results = search(rows, answers.query);
      debug("strict results %d", results.length);
      _.each(results, function(result) {
        result = _.without(result, "");
        debug(result.join(","));
      });
      var results = searchCaseStandard(rows, answers.query);
      debug("loose results %d", results.length);
      _.each(results, function(result) {
        result = _.without(result, "");
        debug(result.join(","));
      });
      return true;
    });
});

function search(rows, query) {
  return _.filter(rows, function(row) {
    var found = false;
    _.each(row, function(cell) {
      var match = cell.match(query);
      if (match) found = true;
    });
    return found;
  });
}

function searchCaseStandard(rows, query) {
  return _.filter(rows, function(row) {
    var found = false;
    _.each(row, function(cell) {
      var standardCell = cell.toLowerCase();
      var standardQuery = query.toLowerCase();
      var match = standardCell.match(standardQuery);
      if (match) found = true;
    });
    return found;
  });
}