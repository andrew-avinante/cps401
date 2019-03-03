// Andrew Avinante (aavin894) Program 1: Fun with Slack
// This program uses the Slack API to interact with Slack conversations using await and promises
let request = require('request');

//'Class' constructor
function Slack(token, url) {
    this.token = token;
    this.url = url;
}

//Builds the options query for `request()`, takes the request method, Slack API method, and aditional args in `query`
Slack.prototype.setOptions = function(method, APIMethod, query) {
    let urlAPI = this.url + APIMethod;              // Set url
    let qs = {};                                    // Define query
    qs.token = this.token;                          // Add token value to query
    if (query !== undefined) {                      // Add additional args to query
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

// Generic function to send requests to API, takes `options` as a param
Slack.prototype.request = async function(options) {
    return new Promise(function(resolve) {
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                let response = JSON.parse(body);
                if (response.ok) {
                    resolve(response);
                } else {
                    resolve(response.error);  // Return error as a resolve to be handled in caller functions
                }
            } else {
                resolve(error);               // Return error as a resolve to be handled in caller functions
            }
        });
    });
}

// Retrieves all channels for a given key
Slack.prototype.getChannels = async function() {
    let self = this;
    return new Promise(async function(resolve, reject) {
        let response = await self.request(self.setOptions('GET', 'conversations.list'));
        let channels = [];
        if (response.ok) {
            for (i in response.channels) {                    // Extract channel `name`, `topic`, and `id`
                channels[i] = {
                    name: response.channels[i].name,
                    topic: response.channels[i].topic.value,
                    id: response.channels[i].id
                };
            };
            resolve(channels);
        } else {
            reject(response);
        }
    });
}

// Retrieves all users in all channels for a given key
Slack.prototype.getUsers = async function() {
    let self = this;
    return new Promise(async function(resolve, reject) {
        let response = await self.request(self.setOptions('GET', 'users.list'));
        let users = [];
        if (response.ok) {
            for (i in response.members) {                       // Extract user `name`, `real_name`, and `id`
                users[i] = {
                    name: response.members[i].name,
                    real_name: response.members[i].real_name,
                    id: response.members[i].id
                };
            };
            resolve(users);
        } else {
            reject(response);
        }
    });
}

// Posts a message to a specified channel via `vhannelName` and `message`
Slack.prototype.postMessage = async function(channelName, message) {
    let self = this;
    return new Promise(async function(resolve, reject) {
        let response = await self.request(self.setOptions('POST', 'chat.postMessage', {
            channel: channelName,
            text: message,
            type: 'message'
        }));
        if (response.ok) {
            resolve(response.ok);
        } else {
            reject(response);
        }
    });
}

// Retrieves all messages from a specified channel via `channelID` (channel name translated to ID before 
//function call), `pageSize` (size of pages to be drawn down), `msg` (array for results), `args` (optional)
//This function uses recursion
Slack.prototype.getPosts = async function(channelID, pageSize, msg, args = {
    channel: channelID,
    count: pageSize
}) {
    let self = this;
    return new Promise(async function(resolve, reject) {
        let response = await self.request(self.setOptions('GET', 'channels.history', args));
        if (response.has_more) {          // If response has more pages then recurse
            msg.push(response.messages);
            await self.getPosts(channelID, pageSize, msg, {
                channel: channelID,
                count: pageSize,
                latest: response.messages[response.messages.length - 1].ts
            });
        } else if (!response.has_more) { // End of recursion and start returning values
            msg.push(response.messages);
            resolve(msg);;
        } else {
            reject(error);
        }

        // Converts double array into single array
        let singleArr = [];
        for (let i = msg.length - 1; i > -1; i--) {
            for (let j = msg[i].length - 1; j > -1; j--) {
                singleArr.push(msg[i][j]);
            }
        }
        resolve(singleArr);
    });
}

// This function is used to create headers for output
Slack.prototype.printTableHeader = async function(header1, header2) {
    console.log(header1.padEnd(14, ' ') + header2);
    console.log('------------  -------------------------------------------------');
}

exports.Slack = Slack;