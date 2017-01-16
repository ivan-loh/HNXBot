'use strict';

const hn          = require('./lib/hn');
const TelegramBot = require('node-telegram-bot-api');


const bot           = new TelegramBot(process.env.TOKEN, {polling: true});
const subscriptions = new Map();

bot.on('message', (message) => {

  const request = message.text.toLowerCase();
  const chatId  = message.chat.id;

  if (request.startsWith('/help') ||
      request.startsWith('/start')) {

    const response = "Hi, to subscribe to HN topics just specify /subscribe [score]" +
                     " and i'll notify you when theres a topic that pass that score";

    bot.sendMessage(chatId, response);
  }

  if (request.startsWith('/subscribe')) {

    let threshold = request.split(' ')[1];
        threshold = parseInt(threshold, 10);
        threshold = isNaN(threshold) || threshold < 100 ? 100 : threshold;

    const response = 'Subscribed to HN ' + threshold + ' News!';
    bot.sendMessage(chatId, response);

    subscriptions.set(chatId, {threshold});
  }

});


(function check() {

  console.log('checking hn');

  hn(30, 0)
    .then((items) => {

      console.log('checking subscription');

      subscriptions
        .forEach((subscription, chatId) => {

          console.log('checking items againts ' + JSON.stringify(chatId));

          const threshold = subscription.threshold;

          items
            .filter(item => item.score >= threshold)
            .forEach(item => {
              if (subscription[item.id]) { return; }

              if (!item.url) {
                item.url = 'https://news.ycombinator.com/item?id=' + item.id;
              }
              subscription[item.id] = item.time;
              const message = `${item.title} + \n` +
                              `Score: ${item.score} Points\n` +
                              `${item.url}`;

              bot.sendMessage(chatId, message)
            });

        });


      setTimeout(check, 1000 * 60);
    });

}());