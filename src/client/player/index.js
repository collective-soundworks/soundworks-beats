// import soundworks client side
import * as soundworks from 'soundworks/client';

// import player experience
import BeatsExperience from './BeatsExperience.js';

// launch application when document is fully loaded
window.addEventListener('load', () => {
  // mandatory configuration options received from the server through the html/default.ejs template
  const socketIO = window.CONFIG && window.CONFIG.SOCKET_CONFIG;
  const appName = window.CONFIG && window.CONFIG.APP_NAME;

  // initialize the 'player' client
  soundworks.client.init('player', { socketIO, appName });

  // create client side (player) experience
  const experience = new BeatsExperience();

  // start the client
  soundworks.client.start();
});
