var debug = require("debug")("subscription");
var path = require("path");
var util = require("util");
var moment = require('moment');
var _ = require("underscore");
var fs = require("fs");
var parse = require('csv-parse');
var stringify = require('csv-stringify');
var Promise = require("bluebird");
fs = Promise.promisifyAll(fs);
parse = Promise.promisify(parse);
stringify = Promise.promisify(stringify);

module.exports = subscription;

var defaultColumns = [
  'addresses.first_name',
  'addresses.last_name',
  'addresses.company',
  'addresses.addr',
  'addresses.extended_addr',
  'addresses.extended_addr2',
  'addresses.city',
  'addresses.state',
  'addresses.country',
  'addresses.zip',
  'customers.cf_gift_from',
  //'subscriptions.created_at'
];

function fileName(start, end, import_csv){
  var startString = (start) ? start.format("YYMMDD") : false
  var endString = (end) ? end.format("YYMMDD") : false
  var welcomeKits = util.format("Welcome Kits %s-%s.csv", startString, endString)
  var subscription = util.format("Subscription Final %s.csv", endString)
  var filename = (start && end) ? welcomeKits : subscription
  return filename
}

function endViaFolder(import_csv){
  var dirname = path.dirname(import_csv)
  var basename = path.basename(dirname)
  var dateString = basename.replace("subscriptions_holstee_", "")
  var dayOfExport = moment(dateString, "DD_MMM_YYYY_HH_mm_ss")
  // we want to subtract 1 day because we exported a csv at
  // the given date but in the middle of the day somewhere
  // if we always use the day before we will be able to
  // pickup where we left off the day after
  dayOfExport.subtract(1, "day")
  return dayOfExport
}

function chargebeeDate(rows, start, end) {
  return _.filter(rows, function(row) {
    var dateCell = row["subscriptions.created_at"]
    var startDate = moment(dateCell, "DD-MMM-YYYY HH:mm")
    var isAfter = startDate.isAfter(start)
    var isBefore = startDate.isBefore(end)
    return (isAfter && isBefore)
  })
}

function chargebeeStatus(rows) {
  return _.filter(rows, function(row) {
    var statusCell = row["subscriptions.status"];
    var invalid = ["Cancelled", "Future"];
    return !_.contains(invalid, statusCell);
  })
}

function chargebeeCountStatus(rows){
  var counts = _.countBy(rows, function(row) {
    return row["subscriptions.status"].toLowerCase()
  })
  counts.total = rows.length;
  return counts;
}

function chargebeeColumns(rows, keep){
  return _.map(rows, function(row){
    return _.pick(row, keep)
  })
}

function calculateEnd(givenEnd, import_csv){
  if(moment.isMoment(givenEnd)) return givenEnd
  if(givenEnd) return moment(givenEnd, "YYMMDD")
  return endViaFolder(import_csv)
}

function subscription(import_csv, start, end, columns) {
  columns = columns || defaultColumns
  import_csv = import_csv.replace(/\s+$|\n|\r/gi, "");
  start = (start && !moment.isMoment(start)) ? moment(start, "YYMMDD") : false
  end = calculateEnd(end, import_csv)
  // capture the date for the last day in the span
  var endUsage = end.clone().add(1, "day")
  var export_filename = fileName(start, end);
  var import_dirname = path.dirname(import_csv);
  var export_csv = path.join(import_dirname, export_filename);
  return fs.readFileAsync(import_csv, "utf8")
    .then(function(data){
      return parse(data, {columns: true}) // parse the csv into a javascript object
    }).then(function(data){
      // filter out invalud statuses
      data = chargebeeStatus(data)
      // if start and end segment out dates
      data = (start) ? chargebeeDate(data, start, endUsage) : data

      // log count
      var counts = chargebeeCountStatus(data);
      _.each(counts, function(count, key){
        debug("%s %d", key, count);
      })

      // only keep the columns we need
      data = chargebeeColumns(data, columns)
      // turn the object back into CSV string
      return stringify(data, {header: true})
    }).then(function(data){
      debug("exporting file '%s'", export_filename);
      return fs.writeFileAsync(export_csv, data)
    })
}
