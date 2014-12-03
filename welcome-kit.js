#!/usr/bin/env node

var moment = require("moment");
var subscription = require("./subscription");
var inquirer = require("inquirer");

inquirer.prompt([{
  "message": "Import CSV",
  "name": "import_csv",
}, {
  "message": "Start Date",
  "name": "start",
}, {
  "message": "End Date",
  "name": "end",
}], function(answers) {
  subscription(answers.import_csv, answers.start, answers.end).then(function() {

  });
});