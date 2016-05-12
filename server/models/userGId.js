//
//   Copyright 2016 Ilkka Oksanen <iao@iki.fi>
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

const TYPES = {
    mas: 'm',
    irc: 'i'
};

module.exports = class UserGId {
    static create(userGIdString) {
        if (!userGIdString) {
            return null;
        }

        if (typeof(userGIdString) === 'object') {
            userGIdString = userGIdString.gId;
        }

        const type = Object.keys(TYPES).find(validType => TYPES[validType] === userGIdString[0]);
        const id = parseInt(userGIdString.substring(1));
        const userGId = new this({ id, type });

        return userGId.valid ? userGId : null;
    }

    constructor({ id, type }) {
        this.id = id;
        this.type = type;
        this.valid = id >= 0 && TYPES[type];
    }

    toString() {
        return `${TYPES[this.type]}${this.id}`;
    }

    equals(otherUserGId) {
        return this.id === otherUserGId.id && this.type === otherUserGId.type;
    }
};