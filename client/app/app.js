//
//   Copyright 2009-2014 Ilkka Oksanen <iao@iki.fi>
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing,
//   software distributed under the License is distributed on an "AS
//   IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
//   express or implied.  See the License for the specific language
//   governing permissions and limitations under the License.
//

'use strict';

import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;

//// me start

//require('../../server/public/dist/client-templates');

//require('./helpers/uploadMixin');

//require('./routes/application');
//require('./routes/main');

//require('./views/application');
//require('./views/main');
//require('./views/grid');
//require('./views/window');
//require('./views/logs');
//require('./views/radioButton');
//require('./views/captureModal');

//require('./components/modalDialog');

//require('./controllers/application');
//require('./controllers/main');
//require('./controllers/grid');
//require('./controllers/window');
//require('./controllers/joinGroupModal');
//require('./controllers/createGroupModal');
//require('./controllers/joinIrcModal');
//require('./controllers/passwordModal');
//require('./controllers/topicModal');
//require('./controllers/captureModal');
//require('./controllers/alertsModal');
//require('./controllers/infoModal');
//require('./controllers/friends');
//require('./controllers/logs');

//require('./models/message');

//require('./helpers/network');
//require('./helpers/handlebars');
//require('./helpers/users');

//Mas.nicks = {};




//Mas.userDb = Mas.Users.create();

//Mas.Router.map(function() {
//    this.route('main', { path: '/' });
//});

//Mas.networkMgr = Mas.Network.create();

//document.addEventListener('visibilitychange', function() {
//    if (!document.hidden) {
//        titlenotifier.reset();
//    }
//});

/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
//emojify.setConfig({
//    img_dir: '/dist/images/emojify',
//    ignore_emoticons: true
//});
