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

/* global $, moment, isMobile */

import Ember from 'ember';
import { darkTheme } from '../../../utils/theme-dark'

export default Ember.Component.extend({
    store: Ember.inject.service(),

    classNames: [ 'flex-grow-column', 'flex-1' ],

    draggedWindow: false,

    changeTheme: Ember.observer('store.settings.theme', function() {
        $('#theme-stylesheet').text(this.get('store.settings.theme') === 'dark' ? darkTheme : '');
    })
});