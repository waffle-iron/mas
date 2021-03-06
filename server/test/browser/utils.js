'use strict';

/* eslint no-console: 0 */

const request = require('superagent');

exports.tearDown = function tearDown(done) {
    const passedStatus = this.results.failed === 0 && this.results.errors === 0;
    console.log(`Final result: "{ passed: ${passedStatus} }"`);

    if (!this.client.globals.dontReportSauceLabs) {
        const userName = this.client.options.username;
        const accessKey = this.client.options.accessKey;
        const sessionId = this.client.capabilities['webdriver.remote.sessionid'];
        const baseUrl = 'https://saucelabs.com/rest/v1/';

        console.log('Sending final result to Saucelabs...');

        if (userName && accessKey && sessionId) {
            request
            .put(`${baseUrl}${userName}/jobs/${sessionId}`)
            .send({ passed: passedStatus })
            .auth(userName, accessKey)
            .end((error, res) => {
                if (error) {
                    console.log('ERROR sending verdict');
                    console.log(error);
                } else {
                    console.log(`Verdict sent to Sauce Labs, response: ${res.res.statusMessage}`);
                }
                done();
            });
        } else {
            console.log(`Username or access key missing, username: ${userName}`);
            done();
        }
    } else {
        console.log('Local testing. Not notifying Saucelabs.');
        done();
    }
};
