const fetch = require("node-fetch");
const c = require("chalk");
const terminalLink = require("terminal-link");
require("console.table");
const log = console.log;

const user = process.env.JENKINS_USER;
const pass = process.env.JENKINS_API_KEY;

// const url = `https://${user}:${pass}@stage.build.viacom.com/view/Web%20RMP/job/relaunch-rmp-web-qa-git-2-java-7/rssAll`;

const url = `https://${user}:${pass}@stage.build.viacom.com/job/relaunch-rmp-web-qa-git-2-java-7/api/json?depth=2&tree=builds[status,duration,timestamp,id,building,actions[parameters[name,value]],result,estimatedDuration,duration]`;
const buildURL = `https://stage.build.viacom.com/view/Web%20RMP/job/relaunch-rmp-web-qa-git-2-java-7/`;

fetch(url)
  .then(d => d.json())
  .then(data => {
    const builds = [];

    data.builds.forEach(b => {
      const d = new Date(b.timestamp);

      builds.push({
        ID: c.cyan("Build " + b.id),
        Date: getDateString(d),
        User: getUser(b),
        Branch: getParam(b, "branchName"),
        Status: getStatus(b),
        Duration: getDuration(b),
        Link: terminalLink(buildURL + b.id)
      });
    });

    console.table(builds);
  })
  .catch(e => {
    console.error(e);
  });

function getStatus(build) {
  if (build.building) {
    return c.yellow("building");
  } else if (build.result == "SUCCESS") {
    // return c.green('success');
    return c.green("success ✔ ");
  } else if (build.result === "FAILURE") {
    return c.red("failure ✖");
  }
}

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
// const DAY = HOUR * 24;
function getDuration(b) {
  let d = b.duration;

  if (!b.building) {
    let h = (d - (d % HOUR)) / HOUR;
    d = d - h * HOUR;

    let m = (d - (d % MINUTE)) / MINUTE;
    d = d - m * MINUTE;

    let s = (d - (d % SECOND)) / SECOND;
    d = d - s * SECOND;

    return `${leftPad(h.toString(), "0", 2)}:${leftPad(
      m.toString(),
      "0",
      2
    )}:${leftPad(s.toString(), "0", 2)}`;
  } else {
    const now = Date.now();
    const diff = now - b.timestamp;
    const progress = diff / b.estimatedDuration;
    let result = "";
    for (var i = 0; i < 1; i += 0.1) {
      if (progress - i > 0.1) {
        result += "=";
      } else {
        result += " ";
      }
    }
    return `[${result}]`;
  }
}

function getUser(b) {
  return getParam(b, "ldapid");
}

function getParam(b, param) {
  let result = c.red("unknown");
  b.actions.forEach(a => {
    if (a.parameters) {
      a.parameters.forEach(p => {
        if (p.name === param) {
          result = p.value;
        }
      });
    }
  });
  return result;
}

function getDateString(date) {
  let result = "";
  result += leftPad(`${date.getMonth() + 1}`, "0", 2); // Month
  result += "/";
  result += leftPad(`${date.getDate()}`, "0", 2);
  result += " ";
  result += leftPad(`${date.getHours()}`, "0", 2);
  result += ":";
  result += leftPad(`${date.getMinutes()}`, "0", 2);

  return result;
}

function leftPad(str, char, len) {
  while (str.length < len) {
    str = char + str;
  }
  return str;
}
