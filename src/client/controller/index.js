// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import serviceViews from '../shared/serviceViews';
import ControllerExperience from './ControllerExperience';

// launch application when document is fully loaded
window.addEventListener('load', () => {
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

  const experience = new ControllerExperience();

  soundworks.client.start();
});
