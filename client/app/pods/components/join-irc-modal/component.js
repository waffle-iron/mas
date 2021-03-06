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

import Ember from 'ember';
import { dispatch } from 'emflux/dispatcher';

export default Ember.Component.extend({
    stores: Ember.inject.service(),

    channel: '',
    password: '',
    errorMsg: '',

    selectedNetwork: null,

    ircNetworks: Ember.computed('stores.networks.networks', function() {
        return this.get('stores.networks.networks').removeObject('MAS');
    }),

    actions: {
        joinIRC() {
            let password = this.get('password').trim();

            dispatch('JOIN_IRC_CHANNEL', {
                name: this.get('channel'),
                network: this.get('selectedNetwork'),
                password: password
            },
            () => { // Accept
                this.sendAction('closeModal');
                this.set('selectedNetwork', null);
            },
            reason => this.set('errorMsg', reason)); // Reject
        },

        closeModal() {
            this.sendAction('closeModal');
        }
    }
});
