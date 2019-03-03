// Andrew Avinante (aavin894) Program 1: Fun with Slack
// This program uses the Slack API to interact with Slack conversations

let request = require('request');

function Slack(token, url) {
    this.token = token;
    this.url = url;
}

//Builds the options query for `request()`, takes the request method, Slack API method, and aditional args in `query`
Slack.prototype.setOptions = function(method, APIMethod, query) {
    let urlAPI = this.url + APIMethod;
    let qs = {};
    qs.token = this.token;
    if (query !== undefined) {
        Object.keys(query).forEach(function(i) {
            qs[i] = query[i];
        });
    }
    return {
        url: urlAPI,
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        qs: qs
    }
}

// Retrieves all channels for a given key
Slack.prototype.getChannels = function(callback) {
    request(this.setOptions('GET', 'conversations.list'), function(error, response, body) {
        let channels = [];
        if (!error && response.statusCode == 200) {
            let response = JSON.parse(body);
            for (i in response.channels) {
                channels[i] = {
                    name: response.channels[i].name,
                    topic: response.channels[i].topic.value,
                    id: response.channels[i].id
                };
            };
        }
        callback(error, channels);
    });
}

// Retrieves all users in all channels for a given key
Slack.prototype.getUsers = function(callback) {
    request(this.setOptions('GET', 'users.list'), function(error, response, body) {
        let users = [];
        if (!error && response.statusCode == 200) {
            let response = JSON.parse(body);
            for (i in response.members) {
                users[i] = {
                    name: response.members[i].name,
                    real_name: response.members[i].real_name,
                    id: response.members[i].id
                };
            };
        }
        callback(error, users);
    });
}

// Posts a message to a specified channel via `vhannelName` and `message`
Slack.prototype.postMessage = function(channelName, message, callback) {
    request(this.setOptions('POST', 'chat.postMessage', {
        channel: channelName,
        text: message,
        type: 'message'
    }), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            let response = JSON.parse(body);
            if (response.ok) {
                console.log('Message successfully posted.');
            } else {
                callback(response.error);
            }
        }
    });
}

// Function used for recursion on pulling pages
Slack.prototype.paging = function(args, channelID, pageSize, msg, callback) {
    let self = this;
    request(this.setOptions('GET', 'channels.history', args), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            let response = JSON.parse(body);
            if (response.has_more && response.ok) {
                msg.push(response.messages);
                self.paging({
                    channel: channelID,
                    count: pageSize,
                    latest: response.messages[response.messages.length - 1].ts
                }, channelID, pageSize, msg, callback);
            } else {
                msg.push(response.messages);
                callback(response.error, msg);
            }
        }
    });
}

// Retrieves all messages from a specified channel
Slack.prototype.getPosts = function(channelName, pageSize, callback) {
    let self = this;
    this.getChannels(function(err, channels) {
        if(!err)
        {
            let channelID;
            for (i in channels) {
                if (channelName === channels[i].name) {
                    channelID = channels[i].id;
                }
            };
            let msg = [];
            self.paging({
                channel: channelID,
                count: pageSize
            }, channelID, pageSize, msg, callback);
        }
        else
        {
            callback(err, channels);
        }
    });
}

// This function is used to create headers for output
Slack.prototype.printTableHeader = function(header1, header2) {
    console.log(header1.padEnd(14, ' ') + header2);
    console.log('------------  -------------------------------------------------');
}

exports.Slack = Slack;