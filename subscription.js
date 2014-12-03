var debug = require("debug")("subscription");
var path = require("path");
var util = require("util");
var moment = require('moment');
var _ = require("underscore");
var fs = require("fs");
var parse = require('csv-parse');
var stringify = require('csv-stringify');
var Promise = require("bluebird");
fs.readFile = Promise.promisify(fs.readFile);
parse = Promise.promisify(parse);
stringify = Promise.promisify(stringify);

module.exports = subscription;

function chargebee(start, end, keep) {
  return function(data) {
    var header = data.shift();
    debug("csv orignal %d", data.length);
    data = chargebeeStatus(data, header);
    debug("csv status %d", data.length);
    end.add(1, "day"); // capture todays
    if (start && end) {
      data = chargebeeDate(data, header, start, end)
      debug("csv date %d", data.length);
    }
    var indexes = chargebeeIndexes(header, keep);
    data = chargebeeAbide(data, indexes);
    data.unshift(keep);
    return data;
  }
}

function chargebeeIndexes(header, keep) {
  return _.map(keep, function(item) {
    return _.indexOf(header, item);
  });
}

function chargebeeAbide(rows, indexes) {
  return _.map(rows, function(row) {
    return _.map(indexes, function(index) {
      return row[index];
    });
  });
}

function chargebeeDate(rows, header, start, end) {
  return _.filter(rows, function(row) {
    var index = _.indexOf(header, "subscriptions.created_at");
    var startDate = moment(row[index], "DD-MMM-YYYY HH:mm");
    var isAfter = startDate.isAfter(start);
    var isBefore = startDate.isBefore(end);
    var inBetween = (isAfter && isBefore);
    if (inBetween) debug("%s is after %s yet before %s", startDate.format("YY-MM-DD"), start.format("YY-MM-DD"), end.format("YY-MM-DD"));
    return inBetween;
  });
}

function chargebeeStatus(rows, header) {
  return _.filter(rows, function(row) {
    var invalid = ["Cancelled", "Future"];
    var index = _.indexOf(header, "subscriptions.status");
    return !_.contains(invalid, row[index]);
  });
}

function subscription(import_csv, start, end) {
  import_csv = import_csv.replace(/\s+|\n|\r/gi, "");
  if (!moment.isMoment(start)) start = moment(start, "YYMMDD");
  if (!moment.isMoment(end)) end = moment(end, "YYMMDD");
  var import_dirname = path.dirname(import_csv);
  var export_filename = util.format("Welcome Kits %s-%s.csv", start.format("YYMMDD"), end.format("YYMMDD"));
  var export_csv = path.join(import_dirname, export_filename);
  var keep = [
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
    'customers.cf_gift_from'
  ];
  return fs.readFile(import_csv, "utf8")
    .then(function(data) {
      return parse(data);
    })
    .then(chargebee(start, end, keep))
    .then(function(data) {
      return stringify(data);
    })
    .then(function(data) {
      return fs.writeFile(export_csv, data)
    });
}