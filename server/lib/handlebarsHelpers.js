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

const fs = require('fs');
const path = require('path');

let manifest;
const PREFIX = '/dist/';

try {
    manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname,
        '..', 'public', 'dist', 'rev-manifest.json')));
} catch (e) {
    manifest = false;
}

exports.registerHelpers = function registerHelpers(hbs) {
    hbs.registerHelper('asset', file => {
        if (manifest) {
            return PREFIX + manifest[file];
        }

        return PREFIX + file;
    });
};
