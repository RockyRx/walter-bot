'use strict';

var unirest = require('unirest');
var nconf = require('nconf');

class FamousQuoteGenerator {

  constructor() {
    this.mashapekey = process.env.KEY_MASH_APE || nconf.get('mashapekey');
  }

  /**
  * Gets a random quote from free API at Mashape
  *
  * @param {String} callback callback function to process the results
  * @param {String} that this object from WalterBot
  */
  _generateRandomQuote(callback, that) {
    unirest.post('https://andruxnet-random-famous-quotes.p.mashape.com/?cat=famous')
    .header('X-Mashape-Key', this.mashapekey)
    .header('Content-Type', 'application/x-www-form-urlencoded')
    .header('Accept', 'application/json')
    .end(function(result) {
      callback(result.body, that);
    });
  }
}

module.exports = FamousQuoteGenerator;
