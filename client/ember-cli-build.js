/* global require, module */

'use strict';

let EmberApp = require('ember-cli/lib/broccoli/ember-app'),
    pickFiles = require('broccoli-static-compiler'),
    mergeTrees = require('broccoli-merge-trees');

module.exports = function(defaults) {
    let app = new EmberApp(defaults, {
        hinting: false,
        babel: {
            includePolyfill: true
        },
        lessOptions: {
            paths: [
                'bower_components/bootstrap/less',
                'bower_components/bootswatch/superhero',
                'bower_components'
            ]
        },
        autoprefixer: {
            browsers: [ 'last 2 versions' ],
            cascade: false
        },
        vendorFiles: {
            'handlebars.js': null // Hopefully temporary hack, see ember 1.10 release blog post.
        },
        'ember-cli-selectize': {
            theme: 'bootstrap3'
        }
    });

    // Use `app.import` to add additional libraries to the generated
    // output files.
    //
    // If you need to use different assets in different
    // environments, specify an object as the first parameter. That
    // object's keys should be the environment name and the values
    // should be the asset to use in that environment.
    //
    // If the library that you are including contains AMD or ES6
    // modules that you would like to import into your application
    // please specify an object with the list of modules as keys
    // along with the exports of each module as its value.

    app.import('bower_components/capture-video-frame/capture-video-frame.js');
    app.import('bower_components/momentjs/moment.js');
    app.import('bower_components/howler/howler.js');
    app.import('bower_components/bootstrap/dist/js/bootstrap.js');
    app.import('bower_components/isMobile/isMobile.js');
    app.import('vendor/marked.js');

    app.import('bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js');

    app.import('bower_components/uri.js/src/IPv6.js');
    app.import('bower_components/uri.js/src/punycode.js');
    app.import('bower_components/uri.js/src/SecondLevelDomains.js');
    app.import('bower_components/uri.js/src/URI.js');

    //app.import('bower_components/jquery/dist/jquery.js');
    app.import('bower_components/jquery-cookie/jquery.cookie.js');
    app.import('bower_components/TitleNotifier.js/src/title_notifier.js');
    app.import('bower_components/jquery.atwho/dist/js/jquery.atwho.js');
    app.import('bower_components/getusermedia/dist/getUserMedia.noFallback.js');
    app.import('bower_components/Caret.js/dist/jquery.caret.min.js');
    app.import('bower_components/emojify.js/dist/js/emojify.js');
    app.import('bower_components/magnific-popup/dist/jquery.magnific-popup.js');
    app.import('bower_components/bootstrap-contextmenu/bootstrap-contextmenu.js');
    app.import('bower_components/velocity/velocity.js');
    app.import('bower_components/socket.io-client/socket.io.js');
    app.import('bower_components/perfect-scrollbar/js/perfect-scrollbar.js');

    // Copy only the relevant files:
    let fontsFontAwesome = pickFiles('bower_components/font-awesome/fonts', {
        srcDir: '/',
        destDir: '/assets/fonts'
    });

    let fontsBootstrap = pickFiles('bower_components/bootstrap/dist/fonts', {
        srcDir: '/',
        destDir: '/assets/fonts'
    });

    let emojify = pickFiles('bower_components/emojify.js/dist/images/basic', {
        srcDir: '/',
        destDir: '/assets/images/emoji'
    });

    // Merge the app tree and our new font assets.
    return mergeTrees([
        app.toTree(),
        fontsFontAwesome,
        fontsBootstrap,
        emojify
    ]);
};
