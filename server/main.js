//
//   Copyright 2009-2015 Ilkka Oksanen <iao@iki.fi>
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
const koa = require('koa');
const hbs = require('koa-hbs');
const error = require('koa-error');
const compress = require('koa-compress');
// const logger = require('koa-logger');
const handlebarsHelpers = require('./lib/handlebarsHelpers');
const log = require('./lib/log');
const redisModule = require('./lib/redis');
const passport = require('./lib/passport');
const userSession = require('./lib/userSession');
const routes = require('./routes/routes');
const init = require('./lib/init');
const scheduler = require('./lib/scheduler');
const demoContent = require('./lib/demoContent');
const socketController = require('./controllers/socket');
const conf = require('./lib/conf');

const app = koa();

exports.init = async function initServer(httpServer, httpsServer, setHttpHandlers) {
    // Development only
    if (app.env === 'development') {
        app.use(error());
        // app.use(logger());
    }

    app.use(function *xFrameOptionsMiddleware(next) {
        this.set('X-Frame-Options', 'DENY');
        yield next;
    });

    // Enable GZIP compression
    app.use(compress());

    app.use(passport.initialize());

    app.use(hbs.middleware({
        layoutsPath: path.join(__dirname, 'views/layouts'),
        viewPath: path.join(__dirname, 'views'),
        defaultLayout: 'main'
    }));

    app.use(userSession.auth);

    handlebarsHelpers.registerHelpers(hbs);

    log.info('Registering website routes');
    routes.register(app);

    await redisModule.loadScripts();

    scheduler.init();

    // Socket.io server (socketController) must be created after last app.use()

    if (conf.get('frontend:https')) {
        socketController.setup(httpsServer);

        const forceSSLApp = koa();

        // To keep things simple, force SSL is always activated if https is enabled
        forceSSLApp.use(function *forceSSLAppMiddleware() { // eslint-disable-line require-yield
            this.response.status = 301;
            this.response.redirect(conf.getComputed('site_url') + this.request.url);
        });

        setHttpHandlers(forceSSLApp.callback(), app.callback());
    } else {
        socketController.setup(httpServer);

        setHttpHandlers(app.callback(), null);
    }

    if (conf.get('frontend:demo_mode') === true) {
        demoContent.enable();
    }

    init.on('beforeShutdown', async () => {
        await socketController.shutdown();
        scheduler.quit();
    });

    init.on('afterShutdown', async () => {
        redisModule.shutdown();
        httpServer.close();
        log.quit();
    });
};
