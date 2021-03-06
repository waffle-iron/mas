//
//   Copyright 2014 Ilkka Oksanen <iao@iki.fi>
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

const Settings = require('../models/settings');
const notification = require('../lib/notification');

exports.sendSet = async function sendSet(user, sessionId) {
    const settingsRecord = await Settings.findOrCreate(user.id);
    const command = {
        id: 'SET',
        settings: {
            activeDesktop: settingsRecord.get('activeDesktop'),
            theme: settingsRecord.get('theme'),
            email: user.get('email'),
            emailConfirmed: user.get('emailConfirmed')
        }
    };

    if (sessionId) {
        await notification.send(user, sessionId, command);
    } else {
        await notification.broadcast(user, command);
    }
};
