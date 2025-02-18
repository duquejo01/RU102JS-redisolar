const redis = require('./redis_client');
/* eslint-disable no-unused-vars */
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();

  // START Challenge #7
  const key = keyGenerator.getKey(`limiter:${opts.interval}:${name}:${opts.maxHits}`);
  const transaction = client.multi();

  const currentTimestampMs = timeUtils.getCurrentTimestampMillis();

  const member = `${currentTimestampMs}-${Math.random()}`;

  transaction.zadd(key, currentTimestampMs, member);
  transaction.zremrangebyscore(key, 0, (currentTimestampMs - opts.interval) );
  transaction.zcard(key);

  const response = await transaction.execAsync();
  const hits = parseInt(response[2], 10);
  
  let hitsRemaining;
  if(hits > opts.maxHits) {
    hitsRemaining = -1;
  } else {
    hitsRemaining = opts.maxHits - hits;
  }

  return hitsRemaining;
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
