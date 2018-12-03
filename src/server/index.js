import 'source-map-support/register'; // enable sourcemaps in node
import path from 'path';
import { server } from 'soundworks/server';
import BeatsExperience from './BeatsExperience';
import ControllerExperience from './ControllerExperience';
import { debug, Blocked } from '../shared/utils';

const blocked = new Blocked(duration => {
  debug(`----------------------- Blocked for ${duration} ms`);
}, 50);

// init configuration
const configName = process.env.ENV || 'default';
const configPath = path.join(__dirname, 'config', configName);
let config = null;

// rely on node `require` for synchronicity
try {
  config = require(configPath).default;
} catch(err) {
  console.error(`Invalid ENV "${configName}", file "${configPath}.js" not found`);
  process.exit(1);
}

// configure express environment ('production' enables `express` cache systems)
process.env.NODE_ENV = config.env;
// initialize application with configuration options
server.init(config);
// define the configuration object to be passed to the `.ejs` template
server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    env: config.env,
    appName: config.appName,
    websockets: config.websockets,
    version: config.version,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});

const sharedParams = server.require('shared-params');
sharedParams.addBoolean('mute', 'mute', false);
sharedParams.addEnum('forceBuffer', 'forceBuffer', ['auto', 'click', 'clack', 'noise'], 'auto');

const beatsExperience = new BeatsExperience('player');
const controllerExperience = new ControllerExperience('controller');

server.start();
