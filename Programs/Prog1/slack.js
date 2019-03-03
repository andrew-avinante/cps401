// Andrew Avinante (aavin894) Program 1: Fun with Slack
// This program uses the Slack API to interact with Slack conversations

let slack = require('./slack-api');
let s = new slack.Slack(process.env.SLACK_TOKEN, 'https://slack.com/api/');

// Main function contins switch to compare cmd line args
// if no cmd is matched then program outputs helper message
function main()
{
  if (process.argv[2] === 'show-channels') {
      s.getChannels(function(err, channels) {
          if (!err) {
              s.printTableHeader('Channel name', 'Topic');
              for (i in channels) {
                  console.log(channels[i].name.padEnd(14, ' ') + channels[i].topic);
              };
          }
      });
  } else if (process.argv[2] === 'show-users') {
      s.getUsers(function(err, users) {
          if (!err) {
              s.printTableHeader('User', 'Name');
              for (i in users) {
                  console.log(users[i].name.padEnd(14, ' ') + users[i].real_name);
              };
          }
      });
  } else if (process.argv[2] === 'post') {
      s.postMessage(process.argv[3], process.argv[4], function(err) {
          if (err) {
              console.log(err);
          }
      });
  } else if (process.argv[2] === 'get-posts') {
      let usersArr = [];
      s.getUsers(function(err, users) {
          if (!err) {
              for (i in users) {
                  usersArr.push({
                      real_name: users[i].real_name,
                      id: users[i].id
                  })
              };
          }
      });
      s.getPosts(process.argv[3], 5, function(err, msg) {
          if (err) {
              console.log(err);
          }
          for (let i = msg.length - 1; i > -1; i--) {
              for (let j = msg[i].length - 1; j > -1; j--) {

                  if (process.argv[4] !== undefined) {
                      if (!(msg[i][j].text.toUpperCase()).includes(process.argv[4].toUpperCase())) {
                          continue;
                      }
                  }

                  if (msg[i][j].username !== undefined) {
                      console.log('@' + msg[i][j].username + ': ' + msg[i][j].text);
                      console.log();
                  } else {
                      let name;
                      for (k in usersArr) {
                          if (usersArr[k].id === msg[i][j].user) {
                              name = usersArr[k].real_name;
                          }
                      }
                      console.log('@' + name + ': ' + msg[i][j].text);
                      console.log();
                  }
              }
          }
      });
  } else if (process.argv[2] === 'help') {
      console.log("Slack command line utility by Andrew Avinante");
      console.log("Usage:".padEnd(8, ' ') + "Command".padEnd(20, ' ') + "Arguments");
      console.log("".padEnd(8, ' ') + "show-channels");
      console.log("".padEnd(8, ' ') + "show-users");
      console.log("".padEnd(8, ' ') + "post".padEnd(20, ' ') + "<channel-name> <message>");
      console.log("".padEnd(8, ' ') + "get-posts".padEnd(20, ' ') + "<channel-name> [<search-word>]");
  } else {
      if (process.argv[2] != undefined) {
          console.log("Slack: No such command " + process.argv[2]);
      } else {
          console.log("Slack: Please supply a command");
          console.log("Usage: node slack.js <command> <arg1> <arg2...>");
          console.log("Usage: Type 'node slack.js help' for more info");
      }
  }
}

main();