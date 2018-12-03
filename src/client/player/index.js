// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import BeatsExperience from './BeatsExperience';
import serviceViews from '../shared/serviceViews';

import { log, Blocked } from '../../shared/utils';

const blocked = new Blocked(duration => {
  log(`----------------------- Blocked for ${duration} ms`);
}, 50);

// launch application when document is fully loaded
window.addEventListener('load', () => {
  log('loaded');

  // initialize the client with configuration received
  // from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = Object.assign({ appContainer: '#container' }, window.soundworksConfig);
  soundworks.client.init(config.clientType, config);

  // configure views for the services
  soundworks.client.setServiceInstanciationHook((id, instance) => {
    if (serviceViews.has(id))
      instance.view = serviceViews.get(id, config);
  });

  // create client side (player) experience and start the client
  const experience = new BeatsExperience(config.assetsDomain);
  soundworks.client.start();
});
