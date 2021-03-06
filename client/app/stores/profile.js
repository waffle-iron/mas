//
//   Copyright 2009-2015 Ilkka Oksanen <iao@iki.fi>
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

import Store from 'emflux/store';
import { dispatch } from 'emflux/dispatcher';
import socket from '../utils/socket';

export default Store.extend({
    nick: '',
    name: '',
    email: '',

    handleUpdateProfile(data, successCb, rejectCb) {
        socket.send({
            id: 'UPDATE_PROFILE',
            name: data.name,
            email: data.email
        }, resp => {
            if (resp.status === 'OK') {
                // Don't nag about unconfirmed email address anymore in this session
                dispatch('SET_EMAIL_CONFIRMED');
                successCb();
            } else {
                rejectCb(resp.errorMsg);
            }
        });
    },

    handleFetchProfile() {
        socket.send({
            id: 'GET_PROFILE'
        }, resp => {
            this.set('name', resp.name);
            this.set('email', resp.email);
            this.set('nick', resp.nick);
        });
    }
});
