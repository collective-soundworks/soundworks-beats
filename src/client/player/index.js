import * as soundworks from 'soundworks/client';
import BeatsExperience from './BeatsExperience.js';

window.addEventListener('load', () => {
  // configuration received from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const { appName, clientType, socketIO }  = window.soundworksConfig;
  // initialize the 'player' client
  soundworks.client.init(clientType, { socketIO, appName });
  // initialize the 'player' client
  const experience = new BeatsExperience();

  // start the client
  soundworks.client.start();
});
