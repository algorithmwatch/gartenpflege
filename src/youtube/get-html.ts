/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-console */
import {
  buildSearchUrl,
  parsePlaylistPage,
  parseSearchHistory,
  parseSearchResultsVideos,
  parseSubscribedChannels,
  parseVideoPage,
  parseWatchHistory,
  searchHistoryUrl,
  subscribedChannelsUrl,
  watchHistoryUrl,
} from '@algorithmwatch/harke';
import fs from 'fs';
import { closeBrowser, newPage } from '../browser';
import { isValidUrl } from '../util';

// TOOD: make headless work with browser

async function getHtml(url: string, closePage = false) {
  if (!isValidUrl(url)) throw 'Invalid url';

  const page = await newPage();

  await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  await page.waitForTimeout(3000 + 1000 * Math.random());
  const html = await page.content();

  const realUrl = await page.url();
  if (realUrl.includes('https://consent.youtube.com/')) {
    const forms = await page.$$('form');
    // last form is the confirm form
    const form = forms[forms.length - 1];

    await form.evaluate((form) => form.submit());
    await page.waitForNavigation();
    await page.waitForTimeout(3000 + 1000 * Math.random());
  }
  if (closePage) await page.close();

  return html;
}

async function loginYoutube() {
  const page = await newPage();
  await page.goto('https://www.youtube.com/account');
}

async function goToUrlandParse(url: string, parse, outputLocation = null) {
  const html = await getHtml(url, true);

  console.log('wait');
  try {
    const result = parse(html);
    console.log(result);

    if (outputLocation !== null) {
      const now = new Date().toISOString().substring(0, 10);
      fs.mkdirSync(outputLocation, { recursive: true });
      fs.writeFileSync(`${outputLocation}/${result.slug}-${now}.html`, html);
    }
    return result;
  } catch (error) {
    console.log(error);
  }
}

function getWatchHistory(outputLocation = null) {
  console.log('watch history');
  return goToUrlandParse(watchHistoryUrl, parseWatchHistory, outputLocation);
}

function getSearchHistory(outputLocation = null) {
  console.log('search history');
  return goToUrlandParse(searchHistoryUrl, parseSearchHistory, outputLocation);
}

function getSubscribedChannels(outputLocation = null) {
  console.log('subscribed channels');
  return goToUrlandParse(
    subscribedChannelsUrl,
    parseSubscribedChannels,
    outputLocation,
  );
}

function getPlaylist(id, outputLocation = null) {
  const url = `https://www.youtube.com/playlist?list=${id}`;
  return goToUrlandParse(url, parsePlaylistPage, outputLocation);
}

function getLikedVideo(outputLocation = null) {
  const LIST_ID_LIKED_VIDEOS = 'LL';
  console.log('liked videos');
  return getPlaylist(LIST_ID_LIKED_VIDEOS, outputLocation);
}

function getVideoPage(url, outputLocation = null) {
  console.log('fetch video');
  return goToUrlandParse(url, parseVideoPage, outputLocation);
}

function getSearchVideoPage(query, outputLocation = null) {
  console.log('search videos for ' + query);
  const url = buildSearchUrl(query, 'videos');
  console.log(url);
  return goToUrlandParse(
    url,
    (x) => parseSearchResultsVideos(x, query),
    outputLocation,
  );
}

export {
  getHtml,
  loginYoutube,
  getWatchHistory,
  getSearchHistory,
  getSubscribedChannels,
  getLikedVideo,
  getPlaylist,
  getSearchVideoPage,
  getVideoPage,
  closeBrowser,
};
