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
    model: null,
    alerts: Ember.computed.oneWay('model.alerts'),

    actions: {
        changeAlerts() {
            if (this.get('alerts.notification') && 'Notification' in window &&
                Notification.permission !== 'granted') {
                Notification.requestPermission();
            }

            dispatch('UPDATE_WINDOW_ALERTS', {
                window: this.get('model'),
                alerts: this.get('alerts')
            });

            this.sendAction('closeModal');
        },

        closeModal() {
            this.sendAction('closeModal');
        }
    },

    alertsTitle: Ember.computed('model.name', function() {
        return 'Configure alerts for \'' + this.get('model.simplifiedName') + '\'';
    })
});
