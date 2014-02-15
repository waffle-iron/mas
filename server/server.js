#!/usr/bin/env node --harmony
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

process.title = 'mas-server';

var log = require('./lib/log'),
    fs = require('fs'),
    path = require('path'),
    koa = require('koa'),
    router = require('koa-router'),
    resourceRouter = require('koa-resource-router'),
    hbs = require('koa-hbs'),
    less = require('koa-less'),
    serve = require('koa-static'),
    error = require('koa-error'),
    //logger = require('koa-logger'),
    mount = require('koa-mount'),
    co = require('co'),
    conf = require('./lib/conf'),
    redis = require('./lib/redis'),
    routesIndex = require('./routes'),
    routesPages = require('./routes/pages'),
    authenticator = require('./controllers/authenticator'),
    seqChecker = require('./controllers/seqChecker'),
    listenController = require('./controllers/listen'),
    commandController = require('./controllers/command'),
    loginController = require('./controllers/login'),
    registerController = require('./controllers/register'),
    scheduler = require('./lib/scheduler');

var app = koa();

log.info('Server starting.');

process.on('uncaughtException', function(err) {
    var errorMsg = 'STACK: ' + err.stack;
    var file = path.normalize(conf.get('log:directory') + '/mas-exit-stack-trace.log');

    fs.writeFileSync(file, errorMsg);
    console.error(err.stack);
    process.exit(1);
});

// Development only
if (app.env === 'development') {
    app.use(error());
//    app.use(logger());
}

app.use(hbs.middleware({
    defaultLayout: 'layouts/main',
    viewPath: __dirname + '/views'
}));

hbs.registerHelper('getPageJSFile', function() {
    return this.page + '.js';
});

app.use(router(app));

// REST API common filtering
app.all('/api/v1/:method/:sessionId/:seq/:timezone?*', authenticator, seqChecker);

// REST API routes
app.get('/api/v1/listen*', listenController);
app.post('/api/v1/send*', commandController);

// Registration and login page routes
var login = new resourceRouter('login', loginController);
var register = new resourceRouter('register', registerController);
app.use(login.middleware());
app.use(register.middleware());

// Public routes
app.use(less(path.join(__dirname, 'public')));
app.use(serve(path.join(__dirname, 'public')));

// Qooxdoo routes
app.use(mount('/main', serve(path.join(__dirname, '/../client'))));
app.use(mount('/vendor/qooxdoo-sdk', serve(path.join(__dirname, '../vendor/qooxdoo-sdk'))));

// Page routes
app.get('/', routesIndex);
app.get(/.html$/, routesPages); // All other pages

co(function *() {
    yield redis.loadScripts();
    scheduler.init();
    app.listen(3000);
})();
