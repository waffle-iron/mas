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

/* globals FileAPI, moment */

import Ember from 'ember';

export default Ember.Mixin.create({
    upload: function(files, transform) {
        if (files.length === 0) {
            return;
        }

        var options = {
            url: '/api/v1/upload',
            files: { userFiles: files },
            progress: function() { },
            complete: function(err, xhr) {
                if (!err) {
                    var url = JSON.parse(xhr.responseText).url[0];
                    this._sendMessage(url);
                } else {
                    this._printLine('File upload failed.', 'error');
                }
            }.bind(this),
            data: {
                sessionId: this.remote.sessionId
            }
        };

        if (transform === 'jpeg') {
            options.imageTransform = {
                type: 'image/jpeg',
                quality: 0.9
            };
        }

        FileAPI.upload(options);
    },

    _sendMessage: function(text) {
        this.remote.send({
            id: 'SEND',
            text: text,
            windowId: this.get('windowId')
        });

        this._printLine(text, 'mymsg');
    },

    _printLine: function(text, cat) {
        var messageRecord = this.get('container').lookup('model:message').setProperties({
            body: text,
            cat:  cat,
            nick: cat === 'mymsg' ? this.get('store.nicks')[this.get('network')] : null,
            ts: moment().unix()
        });

        this.get('messages').pushObject(messageRecord);
    }
});