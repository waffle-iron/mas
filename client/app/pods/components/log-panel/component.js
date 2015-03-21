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

/* globals moment */

import Ember from 'ember';

export default Ember.Component.extend({
    classNames: [ 'flex-column', 'flex-1' ],
    classNameBindings: [ 'enabled:visible:hidden' ],

    socket: Ember.inject.service(),
    store: Ember.inject.service(),

    enabled: true,
    window: null,

    $dateInput: null,
    currentDate: null,
    messages: null,
    tooManyMessages: false, // Temporary solution, pagination is coming

    friendlyDate: function() {
        return moment(this.get('currentDate')).format('dddd, MMMM Do YYYY');
    }.property('currentDate'),

    actions: {
        nextDay() {
            this._seek(1);
        },

        previousDay() {
            this._seek(-1);
        },

        exit() {
            this.set('enabled', false);
            this.sendAction('compress');
        }
    },

    init() {
        this._super();

        this.set('currentDate', new Date());

        this.messages = Ember.A([]);
    },

    didInsertElement() {
        this.$().velocity('slideDown', {
            duration: 700,
            easing: 'easeInOutQuad',
            display: 'flex'
        });

        this.$dateInput = this.$('.logs-date');

        this.$dateInput.datepicker({
            autoclose: true,
            todayHighlight: true,
            weekStart: 1
        });

        this.$dateInput.datepicker().on('changeDate', function() {
            this.set('currentDate', this.$dateInput.datepicker('getDate'));
            this._fetchData();
        }.bind(this));

        this._seek(0);
    },

    _seek(days) {
        let newDate = moment(this.get('currentDate')).add(days, 'd').toDate();

        this.set('currentDate', newDate);
        this.$dateInput.datepicker('update', newDate);

        this._fetchData();
    },

    _fetchData() {
        // Beginning and end of the selected day in unix time format
        let date = this.get('currentDate');
        let epochTsStart = moment(date).startOf('day').unix();
        let epochTsEnd = moment(date).endOf('day').unix();

        this.get('socket').send({
            id: 'GET_CONVERSATION_LOG',
            windowId: this.get('window.windowId'),
            start: epochTsStart,
            end: epochTsEnd
        }, function(resp) {
            let windowObject = this.get('window');
            let messages = this.get('messages');
            let container = this.get('container');
            messages.clear();

            // TBD: Temporary check, implement pagination
            this.set('tooManyMessages', resp.results.length > 999);

            resp.results.forEach(function(message) {
                let messageRecord = container.lookup('model:message').setProperties(message);
                messageRecord.set('window', windowObject);
                messages.pushObject(messageRecord);
                this._loadImages();
            }.bind(this));
        }.bind(this));
    },

    _loadImages() {
        Ember.run.next(this, function() {
            this.$('img[data-src]').each(function() {
                let $img = $(this);
                $img.attr('src', $img.data('src')).one('load error', function() {
                    $img.removeClass('loader loader-small-dark');
                });
            });
        });
    }
});