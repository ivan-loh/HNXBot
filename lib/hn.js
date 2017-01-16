'use strict';

const request = require('request');
const async   = require('async');



function fetchList(fetchLimit) {

  const endpoint = 'https://hacker-news.firebaseio.com/v0/topstories.json';

  function executor (resolve, reject) {
    const handle = (err, res, stories) => {
      if (err) { return reject(err); }
      resolve(JSON.parse(stories).splice(0, fetchLimit));
    };
    request(endpoint, handle);
  }

  return new Promise(executor);
}



function fetchItem(ids) {

  const ONE_DAY = 1000 * 60 * 60 * 24;
  const NOW     = Date.now();

  const fetchs = ids.map(id => (done) => {
    const endpoint = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
    request(endpoint, (err, res, item) => {
      done(err, err ? null : JSON.parse(item));
    });
  });

  function executor(resolve, reject) {
    async
      .parallel(fetchs, (err, results) => {
        if (err) { return reject(err); }
        results = results.filter(e => (NOW - (e.time * 1000)) < ONE_DAY);
        resolve(results);
      });
  }

  return new Promise(executor);
}



function filterScore(scoreLimit) {
  return function (items) {

    function executor (resolve, reject) {
      resolve(items.filter(e => e.score > scoreLimit));
    }

    return new Promise(executor);
  }
}



module.exports = (fetchLimit, scoreLimit) => {

  function executor (resolve, reject) {
    fetchList(fetchLimit)
      .then(fetchItem)
      .then(filterScore(scoreLimit))
      .then(resolve)
      .catch(reject);
  }

  return new Promise(executor);
};

