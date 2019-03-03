// Andrew Avinante (aavin894) Program 1: Fun with Slack
// This program uses the Slack API to interact with Slack conversations using await and promises
let slack = require('./slack-api-async');
let s = new slack.Slack(process.env.SLACK_TOKEN, 'https://slack.com/api/');

// Main function contins switch to compare cmd line args
// if no cmd is matched then program outputs helper message
async function main() {
    switch (process.argv[2]) {
        case 'show-channels':
            {
                try {
                    let channels = await s.getChannels();
                    s.printTableHeader('Channel name', 'Topic');
                    for (i in channels) {
                        console.log(channels[i].name.padEnd(14, ' ') + channels[i].topic);
                    };
                } catch (error) {
                    console.log(error);
                }
                break;
            }
        case 'show-users':
            {
                try {
                    let users = await s.getUsers();
                    s.printTableHeader('User', 'Name');
                    for (i in users) {
                        console.log(users[i].name.padEnd(14, ' ') + users[i].real_name);
                    };
                } catch (error) {
                    console.log(error);
                }
                break;
            }
        case 'post':
            {
                try {
                    await s.postMessage(process.argv[3], process.argv[4]);
                    console.log('Message successfully posted.');
                } catch (error) {
                    console.log(error);
                }
                break;
            }
        case 'get-posts':
            {
                let usersArr = [];
                try {
                    let users = await s.getUsers();
                    for (i in users) {
                        usersArr.push({
                            real_name: users[i].real_name,
                            id: users[i].id
                        });
                    };


                    let channels = await s.getChannels();
                    let channelID;
                    for (i in channels) {
                        if (process.argv[3] === channels[i].name) {
                            channelID = channels[i].id;
                        }
                    };
                    if (channelID === undefined) {
                        console.log('Slack: Unknown channel "' + process.argv[3] + '"');
                        break;
                    }


                    let msg = [];
                    let response = await s.getPosts(channelID, 5, msg);

                    for (let i = 0; i < response.length - 1; i++) {
                        if (process.argv[4] !== undefined) {
                            if (!(response[i].text.toUpperCase()).includes(process.argv[4].toUpperCase())) {
                                continue;
                            }
                        }
                        if (response[i].username !== undefined) {
                            console.log('@' + response[i].username + ': ' + response[i].text);
                            console.log();
                        } else {
                            let name;
                            for (k in usersArr) {
                                if (usersArr[k].id === response[i].user) {
                                    name = usersArr[k].real_name;
                                }
                            }
                            console.log('@' + name + ': ' + response[i].text);
                            console.log();
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            }
        case 'help':
            {
                console.log("Slack command line utility by Andrew Avinante");
                console.log("Usage:".padEnd(8, ' ') + "Command".padEnd(20, ' ') + "Arguments");
                console.log("".padEnd(8, ' ') + "show-channels");
                console.log("".padEnd(8, ' ') + "show-users");
                console.log("".padEnd(8, ' ') + "post".padEnd(20, ' ') + "<channel-name> <message>");
                console.log("".padEnd(8, ' ') + "get-posts".padEnd(20, ' ') + "<channel-name> [<search-word>]");
                break;
            }
        default:
            {
                if (process.argv[2] != undefined) {
                    console.log("Slack: No such command " + process.argv[2]);
                } else {
                    console.log("Slack: Please supply a command");
                    console.log("Usage: node slack.js <command> <arg1> <arg2...>");
                    console.log("Usage: Type 'node slack.js help' for more info");
                }
                break;
            }
    }
}

main();