/**
 * Module dependencies.
 */
var os = require('os');
var async = require('async');

/**
 * Main function that converts json to csv
 *
 * @param {Object} params Function parameters containing data, fields,
 * delimiter (default is ',') and hasCSVColumnTitle (default is true)
 * @param {Function} callback(err, csv) - Callback function
 *   if error, returning error in call back.
 *   if csv is created successfully, returning csv output to callback.
 */

module.exports = function(params, callback) {
  checkParams(params, function(err) {
    if (err) return callback(err);
    createColumnTitles(params, function(err, title) {
      if (err) return callback(err);
      createColumnContent(params, title, function(csv) {
        callback(null, csv);
      });
    });
  });
};


/**
 * Check passing params
 *
 * @param {Object} params Function parameters containing data, fields,
 * delimiter, mark quotes and hasCSVColumnTitle
 * @param {Function} callback Callback function returning error when invalid field is found
 */
var checkParams = function(params, callback) {
  // if data is an Object, not in array [{}], then just create 1 item array.
  // So from now all data in array of object format.
  if (!(params.data instanceof Array)) {
    var ar = new Array();
    ar[0] = params.data;
    params.data = ar;
  }

  //#check fieldNames
  if (params.fieldNames && params.fieldNames.length !== params.fields.length) {
    callback(new Error('fieldNames and fields should be of the same length, if fieldNames is provided.'));
  }

  params.fieldNames = params.fieldNames || params.fields;

  //#check delimiter
  params.del = params.del || ',';

  //#check end of line character
  params.eol = params.eol || '';

  //#check quotation mark
  params.quotes = typeof params.quotes === 'string' ? params.quotes : '"';

  //#check hasCSVColumnTitle, if it is not explicitly set to false then true.
  if (params.hasCSVColumnTitle !== false) {
    params.hasCSVColumnTitle = true;
  }
  callback(null);
};

/**
 * Create the title row with all the provided fields as column headings
 *
 * @param {Object} params Function parameters containing data, fields and delimiter
 * @param {Function} callback Callback function returning error and title row as a string
 */
var createColumnTitles = function(params, callback) {
  var str = '';

  //if CSV has column title, then create it
  if (params.hasCSVColumnTitle) {
    params.fieldNames.forEach(function(element) {
      if (str !== '') {
        str += params.del;
      }
      str += JSON.stringify(element).replace(/\"/g, params.quotes);
    });
  }
  callback(null, str);
};

/**
 * Replace the quotation marks of the field element if needed (can be a not string-like item)
 *
 * @param {string} stringified_element The field element after JSON.stringify()
 * @param {string} quotes The params.quotes value. At this point we know that is not equal to double (")
 */
var replaceQuotationMarks = function(stringified_element, quotes) {
  var last_char_index = stringified_element.length - 1;

  //check if it's an string-like element
  if (stringified_element[0] === '"' && stringified_element[last_char_index] === '"') {
    //split the stringified field element because Strings are immutable
    var splitted_element = stringified_element.split('');

    //replace the quotation marks
    splitted_element[0] = quotes;
    splitted_element[last_char_index] = quotes;

    //join again
    stringified_element = splitted_element.join('');
  }

  return stringified_element;
};

/**
 * Create the content column by column and row by row below the title
 *
 * @param {Object} params Function parameters containing data, fields and delimiter
 * @param {String} str Title row as a string
 * @param {Function} callback Callback function returning title row and all content rows
 */
var createColumnContent = function(params, str, callback) {
  params.data.forEach(function(data_element) {
    //if null or empty object do nothing
    if (data_element && Object.getOwnPropertyNames(data_element).length > 0) {
      var line = '';
      var eol = os.EOL || '\n';

      params.fields.forEach(function(field_element) {
        if (data_element.hasOwnProperty(field_element)) {
          var stringified_element = JSON.stringify(data_element[field_element]);

          if (params.quotes !== '"') {
            stringified_element = replaceQuotationMarks(stringified_element, params.quotes);
          }

          line += stringified_element;
        }
        line += params.del;
      });

      //remove last delimeter
      line = line.substring(0, line.length - 1);
      line = line.replace(/\\"/g, Array(3).join(params.quotes));

      //If header exists, add it, otherwise, print only content
      if (str !== '') {
        str += eol + line + params.eol;
      } else {
        str = line + params.eol;
      }
    }
  });
  callback(str);
};
