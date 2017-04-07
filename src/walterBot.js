'use strict';

var Bot = require('slackbots');
var CronJob = require('cron').CronJob;
var hn = require('hacker-news-api');
var _ = require('lodash');
var nconf = require('nconf');
var FamousQuoteGenerator = require('./famousQuoteGenerator');
var Chance = require('chance');

nconf.add('config', {type: 'file', file: './configBot.json'});

class WalterBot {

  /**
   * @param {String} slackToken Your Slack bot integration token
   */
  constructor(slackToken) {
    var settingsBot = {
      token: slackToken,
      name: 'walter-bot'
    };

    this.bot = new Bot(settingsBot);
  }

  run() {
    //this._fetchAndProcessHNStories();
    this._generateAndPostRandomQuote();
  }

  /**
  * Fetch, process and post HackerNews stories at pre-configured intervals
  */
  _fetchAndProcessHNStories() {
    var job = new CronJob({
      cronTime: nconf.get('cronexpression'),
      onTick: function() {
        hn.story().since('past_24h').top(function (err, data) {
          if (err) { throw err; }

          /**
          * Only takes the top 5 stories
          * TODO: find a more efficient way to get top 5.
          */
          var topStories = _.take(data.hits, 5);
          this._processHNStories(topStories);

        }.bind(this));
      },
      start: false,
      timeZone: nconf.get('timezone'),
      context: this
    });

    job.start();
  }

  /**
  * Connect to Mashape API and get a random quote
  */
  _generateAndPostRandomQuote() {

    this._generateRandomTime();

    new CronJob({
      cronTime: this.customCronExpression,
      onTick: function() {
        var randomQuote = new FamousQuoteGenerator();
        randomQuote._generateRandomQuote(this._composeAndSendQuote, this);
        this._generateAndPostRandomQuote();
      },
      start: true,
      timeZone: nconf.get('timezone'),
      context: this
    });
  }

  /**
  * Generate a random cron expression to trigger the cron job
  */
  _generateRandomTime() {
    var chance = new Chance();
    var hour = chance.hour({twentyfour: true});
    var minute = chance.minute();

    this.customCronExpression = '00 ' + minute + ' ' + hour + ' * * 1-5';
  }

  _composeAndSendQuote(quoteData, that) {
    var color = 'good';
    var author = 'Random quote by ~ ' + quoteData.author;
    var autherTag = quoteData.author.split(' ')[0] + '+' + quoteData.author.split(' ')[1];
    var authorLink = 'https://www.google.com/search?q=' + autherTag;
    that.postSlackMessage(quoteData.quote, null, null, color, null, author, authorLink, null, null, 'osh-test');
  }

  /**
  * Process the news stories to get the title and URL
  *
  * @param {String} stories top 5 stories of past week
  */
  _processHNStories(stories) {
    var fields = [];
    for (let story of stories) {
      var field = {};
      field.title = story.title;
      field.value = story.url;
      fields.push(field);
    }
    this._composeAndSendMessage(fields);
  }

  /**
  * Compose final message and send to Slack channel
  *
  * @param {String} fields top 5 stories of past week
  */
  _composeAndSendMessage(fields) {
    var color = 'good';
    var title = 'Hello I\'m Walter, your friendly bot. Here\'s the top 5 HackerNews stories for the past 24 hours';

    this.postSlackMessage('.......', null, null, color, fields, null, null, title, null, 'general');
  }

  /**
   * Post a message in the slack general chat
   *
   * @param {String} message Optional text that appears within the attachment
   * @param {String} fallback Required plain-text summary of the attachment
   * @param {String} preText Optional text that appears above the attachment block
   * @param {successColor|failColor|infoColor} color of the vertical line before the message default infoColor yellow
   * @param {Array} fields is an Array of messages  { 'title': 'Project', 'value': 'Awesome Project','short': true},
   * @param {String} authorName Name of the author to be displayed
   * @param {String} authorLink Link to the author
   * @param {String} title title message
   * @param {String} titleLink link message
   * @param {String} nameChannelOrUser where posts a message  channel | group | user by name,
   */
  postSlackMessage(message, fallback, preText, color, fields, authorName, authorLink, title, titleLink, nameChannelOrUser) {
    var params = {
      as_user: true,
      attachments: [
        {
          'fallback': fallback,
          'pretext': preText,
          'color': color || this.infoColor,
          'author_name': authorName,
          'author_link': authorLink,
          'title': title,
          'title_link': titleLink,
          'text': message,
          'fields': fields,
          'mrkdwn_in': ['text', 'pretext']
        }
      ]
    };

    this.bot.postTo(nameChannelOrUser, '', params);
  }

}

module.exports = WalterBot;
