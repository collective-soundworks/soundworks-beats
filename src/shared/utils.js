import Debug from 'debug';
const debug = Debug('soundworks:beats');
export { debug };

const log = debug;
export { log };

import Blocked from '@ircam/blocked';
export { Blocked };

export default {
  Blocked,
  debug,
  log,
};
