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
import sound from '../helpers/sound';

export default Ember.ObjectController.extend({
    actions: {
        hide: function() {
            this.set('visible', false);
            this.set('timeHidden', Date.now());
        },

        close: function() {
            Mas.networkMgr.send({
                id: 'CLOSE',
                windowId: this.get('windowId')
            });
        },

        sendMessage: function() {
            var text = this.get('newMessage');
            this.set('newMessage', '');

            Mas.networkMgr.send({
                id: 'SEND',
                text: text,
                windowId: this.get('windowId')
            });

            this.get('messages').pushObject(Mas.Message.create({
                body: text,
                cat: 'mymsg',
                nick: Mas.nicks[this.get('network')],
                ts: moment().unix()
            }));
        },

        chat: function(userId) {
            Mas.networkMgr.send({
                id: 'CHAT',
                windowId: this.get('windowId'),
                userId: userId
            }, function(resp) {
                if (resp.status !== 'OK') {
                    this.send('openModal', 'info-modal', { title: 'Error', body: resp.errorMsg });
                }
            }.bind(this));
        },

        whois: function(userId) {
            Mas.networkMgr.send({
                id: 'WHOIS',
                windowId: this.get('windowId'),
                userId: userId
            });
        },

        op: function(userId) {
            Mas.networkMgr.send({
                id: 'OP',
                windowId: this.get('windowId'),
                userId: userId
            });
        },

        requestFriend: function(nick) {
            nick = nick;
        },

        kick: function(userId) {
            Mas.networkMgr.send({
                id: 'KICK',
                windowId: this.get('windowId'),
                userId: userId
            });
        },

        kickban: function(userId) {
            Mas.networkMgr.send({
                id: 'KICKBAN',
                windowId: this.get('windowId'),
                userId: userId
            });
        },

        scrollUp: function() {
            if (!this.get('deletedLine') && !this.get('scrollLock')) {
                this.set('scrollLock', true);
                Ember.Logger.info('scrollock on');
            }
        },

        scrollBottom: function() {
            if (this.get('scrollLock')) {
                this.set('scrollLock', false);
                this.set('newMessagesCount', 0);
                Ember.Logger.info('scrollock off');
            }
        }
    },

    initDone: Ember.computed.alias('controllers.application.initDone'),

    newMessageReceived: function() {
        if (!this.get('visible') || this.get('scrollLock')) {
            this.incrementProperty('newMessagesCount');
        }

        if (document.hidden) {
            // Browser title notification
            if (this.get('titleAlert')) {
                titlenotifier.add();
            }

            // Sound notification
            if (this.get('sounds')) {
                sound.play();
            }
        }
    }.observes('messages.@each'),

    isGroup: function() {
        return this.get('type') === 'group';
    }.property('type'),

    cssType: function() {
        if (this.get('type') === 'group') {
            return 'group';
        } else {
            // 1on1 is not valid css class name
            return 'private-1on1';
        }
    }.property('type'),

    _seekRow: function(direction) {
        var newRow = this.get('parentController').nextRow(this.get('model'), direction);
        this.set('row', newRow);
        this.set('animate', true);
    }
});