var WalterBot = require('./walterBot');
var nconf = require('nconf');

nconf.add('config', {type: 'file', file: './configBot.json'});

try {
  var tokenSlack = process.env.TOKEN_SLACK || nconf.get('tokenslack');

  this.walterBot = new WalterBot(tokenSlack);
  this.walterBot.run();
} catch (error) {
  console.log('Bot failed' + error);
}
