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
    topic: Ember.computed.oneWay('model.topic'),

    topicTitle: Ember.computed('model.name', function() {
        return `Edit topic for '${this.get('model.name')}'`;
    }),

    actions: {
        changeTopic() {
            dispatch('UPDATE_TOPIC', {
                topic: this.get('topic'),
                window: this.get('model')
            });

            // TODO: Handle error cases
            this.sendAction('closeModal');
        },

        closeModal() {
            this.sendAction('closeModal');
        }
    }
});
