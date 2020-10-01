
import { FP } from "@fp-pro/client";
import tippy from 'tippy.js';
import mobileTemplate from '../views/partials/demo/mobile.handlebars';

const client = process.env.FPJS_TOKEN;
const token = process.env.FPJS_API_TOKEN;
const endpoint = process.env.FPJS_ENDPOINT;
const region = process.env.FPJS_REGION;
const config = {
  ip: "full",
  callbackData: true,
  timeout: 30_000,
};

let activeRequestId;

export function initFpjsWidget() {
  FP.load({ client, endpoint, region })
    .then((fp) => fp.send(config))
    .then(showVisitInfo)
    .then(loadFpjsHistory)
    .then(() => {
      document.getElementById('fpjs_loader').remove();
      document.getElementById('fpjs_container').classList.add('fingerprint-live-demo__loaded');
    });
  // TODO: log errors
  // .catch(e => window.console && console.log('Error: ', e));
}

// Load visit history
export function loadFpjsHistory(visitorId) {
  return fetch(`${endpoint}/visitors/${visitorId}?token=${token}&limit=50`)
    .then((response) => response.json())
    .then(({ visits }) => {
      const container = document.getElementById('fpjs_history');
      
      container.innerHTML = '';

      for (const visit of visits) {
        const element = document.createElement('li');
        const title = getVisitTitle(visit.timestamp);

        element.classList.add('history-visits__visit');
        element.textContent = title;
        element.id = `visit_${visit.requestId}`;

        if (visit.incognito) {
          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

          icon.classList.add('incognito');
          use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#incognito');

          icon.appendChild(use);
          element.appendChild(icon);

          element.classList.add('history-visits__visit--incognito');

          if (visits[0].requestId === visit.requestId) {
            element.classList.add('history-visits__visit--now');
          }
        }

        element.addEventListener('click', () => showVisitInfo(Object.assign(visit, { visitorId }), title));
        container.appendChild(element);

        const { latitude, longitude } = visit.ipLocation;

        liveDemoMobileSplide.add(mobileTemplate({
          visitId: visitorId,
          title,
          browser: getBrowserName(visit.browserDetails),
          ip: visit.ip,
          incognito: visit.incognito ? 'Yes' : 'No',
          bot: getBotDecision(visit.botProbability),
          className: visit.incognito ? 'live-demo--mobile__incognito' : '',
          location: `https://api.mapbox.com/styles/v1/mapbox/${visit.incognito ? 'dark-v10' : 'light-v10'}/static/${longitude},${latitude},7.00,0/512x512?access_token=pk.eyJ1IjoidmFsZW50aW52YXNpbHlldiIsImEiOiJja2ZvMGttN2UxanJ1MzNtcXp5YzNhbWxuIn0.BjZhTdjY812J3OdfgRiZ4A`,
        }));
      }

      highLightRequestId(visits[0].requestId);

      // Tooltips initializations
      tippy('[data-tippy-content]', {
        animation: 'shift-away',
        interactive: true,
        arrow: false,
        trigger: 'click',
      });
    });
}

function highLightRequestId(requestId) {
  if (activeRequestId) {
    const element = document.getElementById(`visit_${activeRequestId}`);
    if (element) {
      element.classList.remove('history-visits__visit--selected');
    }
  }


  const element = document.getElementById(`visit_${activeRequestId = requestId}`);
  if (element) {
    element.classList.add('history-visits__visit--selected');
  }
}

// Let's use existent UI to update values for every visit history
// This will help us reduce the bundle size
function showVisitInfo(visitData, title) {
  const { visitorId, botProbability, incognito, ip, browserDetails, ipLocation, requestId } = visitData;

  const visitorIdSpan = document.getElementById('fpjs_visitor_id');
  const botSpan = document.getElementById('fpjs_bot');
  const ipSpan = document.getElementById('fpjs_ip');
  const incognitoSpan = document.getElementById('fpjs_incognito');
  const browserSpan = document.getElementById('fpjs_browser');
  const imgLocationSpan = document.getElementById('fpjs_location_img');
  const titleSpan = document.getElementById('fpjs_visit_title');

  visitorIdSpan.textContent = visitorId;
  incognitoSpan.textContent = incognito ? 'Yes' : 'No';
  botSpan.textContent = getBotDecision(botProbability);
  ipSpan.textContent = ip;
  browserSpan.textContent = getBrowserName(browserDetails || visitData);

  // Map
  const { latitude, longitude } = ipLocation;
  imgLocationSpan.src = `https://api.mapbox.com/styles/v1/mapbox/${incognito ? 'dark-v10' : 'light-v10'}/static/${longitude},${latitude},7.00,0/400x400?access_token=pk.eyJ1IjoidmFsZW50aW52YXNpbHlldiIsImEiOiJja2ZvMGttN2UxanJ1MzNtcXp5YzNhbWxuIn0.BjZhTdjY812J3OdfgRiZ4A`;
  
  // Title
  if (title) {
    titleSpan.textContent = title;
  } else {
    titleSpan.textContent = 'Your Current Visit';
  }

  // Appearance
  if (incognito) {
    document.documentElement.classList.add('incognito');
  } else {
    document.documentElement.classList.remove('incognito');
  }

  highLightRequestId(requestId);

  return visitorId;
}

function pluralize(num, one, many) {
  num = Math.floor(num);

  if (num === 1) {
    return `${num} ${one}`;
  }

  return `${num} ${many}`;
}

function getVisitTitle(timestamp) {
  const now = Date.now();
  const secondsDiff = Math.floor((now - timestamp) / 1000);

  if (secondsDiff < 1) {
    return 'Current visit';
  }

  if (secondsDiff < 60) {
    return pluralize(secondsDiff, 'second ago', 'seconds ago');
  }

  if (secondsDiff < 60 * 60) {
    return pluralize(secondsDiff / 60, 'minute ago', 'minutes ago');
  }

  if (secondsDiff < 60 * 60 * 24) {
    return pluralize(secondsDiff / (60 * 60), 'hour ago', 'hours ago');
  }

  if (secondsDiff < 60 * 60 * 24 * 7) {
    return pluralize(secondsDiff / (60 * 60 * 24), 'day ago', 'days ago');
  }

  return new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getBrowserName({ browserName, browserVersion, os, osVersion, device }) {
  let browserStr = browserName;

  if (browserVersion) {
    browserStr += " " + browserVersion;
  }
  if (os) {
    browserStr += " on " + os;
  }
  if (osVersion) {
    browserStr += " (" + osVersion + ")";
  }
  if (device && device !== "Unknown" && device !== "Other") {
    browserStr += (", " + device);
  }

  return browserStr;
}

function getBotDecision(botProbability) {
  if (botProbability < 0.6) {
    return "No";
  } else if (botProbability < 0.8) {
    return "Probably";
  }
  
  return "Yes";
}
