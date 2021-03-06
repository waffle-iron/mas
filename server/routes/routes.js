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

const path = require('path');
const router = require('koa-router')();
const serve = require('koa-static');
const mount = require('koa-mount');
const bodyParser = require('koa-bodyparser');
const conf = require('../lib/conf');
const passport = require('../lib/passport');
const cacheFilter = require('../lib/cacheFilter');
const registerController = require('../controllers/register');
const loginController = require('../controllers/login');
const websiteController = require('../controllers/website');
const uploadController = require('../controllers/upload');
const userFilesController = require('../controllers/userFiles');
const forgotPasswordController = require('../controllers/forgotPassword');
const confirmEmailController = require('../controllers/confirmEmail');

exports.register = function register(app) {
    app.use(cacheFilter);

    // Passport authentication routes
    if (conf.get('googleauth:enabled') === true && conf.get('googleauth:openid_realm')) {
        router.get('/auth/google', passport.authenticate('google', {
            scope: 'email profile',
            openIDRealm: conf.get('googleauth:openid_realm')
        }));
        router.get('/auth/google/oauth2callback', loginController.googleLogin);
    }

    if (conf.get('yahooauth:enabled') === true) {
        router.get('/auth/yahoo', passport.authenticate('yahoo'));
        router.get('/auth/yahoo/callback', loginController.yahooLogin);
    }

    if (conf.get('cloudronauth:enabled') === true) {
        router.get('/auth/cloudron', passport.authenticate('cloudron'));
        router.get('/auth/cloudron/callback', loginController.cloudronLogin);
    }

    router.post('/login', bodyParser(), loginController.localLogin);

    // File upload endpoint
    router.post('/api/v1/upload', uploadController);

    // Registration routes
    router.post('/register', bodyParser(), registerController.create);
    router.post('/register-ext', registerController.createExt);
    router.post('/register-reset', registerController.createReset);

    // Forgot password
    router.post('/forgot-password', bodyParser(), forgotPasswordController.create);
    router.get('/reset-password/:token', registerController.indexReset);

    // Confirm email
    router.get('/confirm-email/:token', confirmEmailController.show);

    // Web site pages route
    router.get('/', websiteController);
    router.get('/:page', websiteController);

    // Public assets
    router.get('/files/:file', userFilesController);

    app.use(router.routes()).use(router.allowedMethods());

    // Ember CLI Live Reload redirect hack
    if (conf.get('common:dev_mode') === true) {
        router.get('/ember-cli-live-reload.js', function *redirect() { // eslint-disable-line require-yield, max-len
            this.redirect('http://localhost:4200/ember-cli-live-reload.js');
        });
    }

    // TODO: Improve caching strategy for the web site
    app.use(serve(path.join(__dirname, '..', 'website'), {
        maxage: 1000 * 60 * 10 // 10 minutes
    }));

    // Ember client assets
    app.use(mount('/app', serve(path.join(__dirname, '../../client/dist'))));
};
