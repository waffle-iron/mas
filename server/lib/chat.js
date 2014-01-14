//
//   Copyright 2013 Ilkka Oksanen <iao@iki.fi>
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

//var Message = require('./message.js');

function initializeSession(res) {
    var msg = new Message();
    msg.addCommand("SET");
    msg.addCommand("INITDONE");
    msg.send(res);
}

exports.handleLongPoll = function(req, res) {
    var sessionId = req.param('sessionId');
    var sendSeq = req.param('sendSeq');
    var timezone = req.param('timezone');

    console.log('here');

    if (1) { // sendSeq === 0) {
        initializeSession(res);
    }

    console.log('USER', req.user);

    res.json({ user: timezone });
};
