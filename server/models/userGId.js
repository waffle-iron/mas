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
    static create(params = {}) {
        let options = params;

        if (typeof params === 'string') {
            const type = Object.keys(TYPES).find(validType => TYPES[validType] === params[0]);
            let id;

            if (!type) {
                return null;
            }

            if (type === 'mas') {
                id = parseInt(params.substring(1));
            } else if (type === 'irc') {
                id = params.substring(1);
            }

            options = { id, type };
        }

        const userGId = new this(options);

        return userGId.valid ? userGId : null;
    }

    constructor({ id, type }) {
        this.id = id;
        this.type = type;
    }

    get valid() {
        if (this.type === 'mas') {
            return parseInt(this.id) === this.id && this.id > 0;
        } else if (this.type === 'irc') {
            return this.id === 0 || this.id.length > 0;
        }

        return false;
    }

    get isMASUser() {
        return this.type === 'mas';
    }

    get isIrcUser() {
        return this.type === 'irc';
    }

    toString() {
        return `${TYPES[this.type]}${this.id}`;
    }

    equals(otherUserGId) {
        return this.id === otherUserGId.id && this.type === otherUserGId.type;
    }
};
