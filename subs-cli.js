#!/usr/bin/env node
var debug = require("debug")
debug.enable('*')
var moment = require("moment")
var subscription = require("./subscription")
var inquirer = require("inquirer")
var argv = require('minimist')(process.argv.slice(2));

inquirer.prompt([{
  "message": "Import CSV",
  "name": "import_csv",
  "default": argv.csv
}, {
  "message": "Start Date",
  "name": "start",
  "default": argv.start
}, {
  "message": "End Date",
  "name": "end",
  "default": argv.end
}], function(answers) {
  answers.import_csv = (answers.import_csv === "") ? false : answers.import_csv
  if(!answers.import_csv) throw new Error("no import csv").message;
  answers.start = (answers.start === "") ? false : answers.start
  answers.end = (answers.end === "") ? false : answers.end
  subscription(answers.import_csv, answers.start, answers.end)
})
