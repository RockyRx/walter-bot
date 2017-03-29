'use strict';

var Bot = require('slackbots');
var schedule = require('node-schedule');
var hn = require('hacker-news-api');
var _ = require('lodash');
var nconf = require('nconf');

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
    this._fetchAndProcessHNStories();
  }

  /**
  * Fetch, process and post HackerNews stories at pre-configured intervals
  */
  _fetchAndProcessHNStories() {
    schedule.scheduleJob(nconf.get('cronexpression'), function() {
      hn.story().since('past_24h').top(function (err, data) {
        if (err) { throw err; }

        /**
        * Only takes the top 5 stories
        * TODO: find a more efficient way to get top 5.
        */
        var topStories = _.take(data.hits, 5);
        this._processHNStories(topStories);

      }.bind(this));
    }.bind(this));
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
  * Process the news stories to get the title and URL
  *
  * @param {String} fields top 5 stories of past week
  */
  _composeAndSendMessage(fields) {
    var color = 'successColor';
    var title = 'Hello I\'m Walter, your friendly bot. Here\'s the top 5 HackerNews stories for the past 24 hours';

    this.postSlackMessage('.......', null, color, fields, title, null, 'osh-test');
  }

  /**
   * Post a message in the slack general chat
   *
   * @param {String} message
   * @param {String} fallback
   * @param {successColor|failColor|infoColor} color of the vertical line before the message default infoColor yellow
   * @param {Array} fields is an Array of messages  { 'title': 'Project', 'value': 'Awesome Project','short': true},
   * @param {String} title title message,
   * @param {String} titleLink link message
   * @param {String} nameChannelOrUser where posts a message  channel | group | user by name,
   */
  postSlackMessage(message, fallback, color, fields, title, titleLink, nameChannelOrUser) {
    var params = {
      as_user: true,
      attachments: [
        {
          'fallback': fallback,
          'color': color || this.infoColor,
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
