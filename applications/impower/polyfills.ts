/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/docs/ts/latest/guide/browser-support.html
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** ALL Firefox browsers require the following to support `@angular/animation`. **/
// import 'web-animations-js';  // Run `npm install --save web-animations-js`.

/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */

import './zone-settings';
import 'zone.js/dist/zone'; // Included with Angular CLI.
import 'zone.js/dist/zone-error'; // patches the error class so that stack traces have zone stuff removed

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

// code to intercept all XMLHttpRequests
//
// const open = (window as any).XMLHttpRequest.prototype.open,
//       send = (window as any).XMLHttpRequest.prototype.send;
//
// let valRequestCount = 0;
// let timeoutHandle = null;
//
// function openReplacement(method, url, async, user, password) {
//   valRequestCount++;
//   if (timeoutHandle) {
//     clearTimeout(timeoutHandle);
//     timeoutHandle = null;
//   }
//   return open.apply(this, arguments);
// }
//
// function sendReplacement(data) {
//   if (this.onreadystatechange) {
//     this._onreadystatechange = this.onreadystatechange;
//   }
//   this.onreadystatechange = onReadyStateChangeReplacement;
//   return send.apply(this, arguments);
// }
//
// function onReadyStateChangeReplacement() {
//   if (this.readyState === XMLHttpRequest.DONE) {
//     valRequestCount--;
//     if (valRequestCount === 0) {
//       timeoutHandle = setTimeout(() => console.log('No more requests on the wire'), 1000);
//     }
//   }
//   if (this._onreadystatechange) {
//     return this._onreadystatechange.apply(this, arguments);
//   }
// }
//
// (window as any).XMLHttpRequest.prototype.open = openReplacement;
// (window as any).XMLHttpRequest.prototype.send = sendReplacement;
