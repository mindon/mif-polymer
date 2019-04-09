/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html } from 'lit-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

// These are the elements needed by this element.
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import './snack-bar.js';
import '../app-viewer.js';
import { MifIcon } from './mif-icon.js';

class MifPolymer extends LitElement {
  render() {
    const {appTitle, appPowered, appNavs, _page, _drawerOpened, _snackbarOpened, _offline} = this;

    // Anything that's related to rendering should be done in here.
    return html`
<style>
  :host {
    --app-drawer-width: 256px;
    display: block;

    --app-primary-color: #E91E63;
    --app-secondary-color: #293237;
    --app-dark-text-color: var(--app-secondary-color);
    --app-light-text-color: white;
    --app-section-even-color: #f7f7f7;
    --app-section-odd-color: white;

    --app-header-background-color: white;
    --app-header-text-color: var(--app-dark-text-color);
    --app-header-selected-color: var(--app-primary-color);

    --app-drawer-background-color: var(--app-secondary-color);
    --app-drawer-text-color: var(--app-light-text-color);
    --app-drawer-selected-color: #78909C;
  }

  app-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    text-align: center;
    background-color: var(--app-header-background-color);
    color: var(--app-header-text-color);
    border-bottom: 1px solid #eee;
    z-index: 1;
  }
  app-drawer {
    z-index: 2;
  }
  .toolbar-top {
    background-color: var(--app-header-background-color);
  }

  [main-title] {
    font-size: 30px;
    padding-right: 44px;
  }

  .toolbar-list {
    display: none;
  }

  .toolbar-list > a {
    display: inline-block;
    color: var(--app-header-text-color);
    text-decoration: none;
    line-height: 30px;
    padding: 4px 24px;
  }

  .toolbar-list > a[selected] {
    color: var(--app-header-selected-color);
    border-bottom: 4px solid var(--app-header-selected-color);
  }

  .menu-btn {
    background: none;
    border: none;
    fill: var(--app-header-text-color);
    cursor: pointer;
    height: 44px;
    width: 44px;
  }

  .drawer-list {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 24px;
    background: var(--app-drawer-background-color);
    position: relative;
  }

  .drawer-list > a {
    display: block;
    text-decoration: none;
    color: var(--app-drawer-text-color);
    line-height: 40px;
    padding: 0 24px;
  }

  .drawer-list > a[selected] {
    color: var(--app-drawer-selected-color);
  }

  /* Workaround for IE11 displaying <main> as inline */
  main {
    display: block;
  }

  .main-content {
    padding-top: 64px;
    min-height: 100vh;
  }

  .page {
    display: none;
  }

  .page[active] {
    display: block;
  }

  footer {
    padding: 24px;
    background: var(--app-drawer-background-color);
    color: var(--app-drawer-text-color);
    text-align: center;
  }

  /* Wide layout: when the viewport width is bigger than 460px, layout
  changes to a wide layout. */
  @media (min-width: 460px) {
    .toolbar-list {
      display: block;
    }

    .menu-btn {
      display: none;
    }

    .main-content {
      padding-top: 107px;
    }

    /* The drawer button isn't shown in the wide layout, so we don't
    need to offset the title */
    [main-title] {
      padding-right: 0px;
    }
  }
</style>

<!-- Header -->
${
appTitle ? html`
  <app-header condenses reveals effects="waterfall">
    <app-toolbar class="toolbar-top">
      <button class="menu-btn" title="Menu" @click="${_ => this._updateDrawerState(true)}">${MifIcon.Menu}</button>
      <div main-title>${unsafeHTML(appTitle)}</div>
    </app-toolbar>${
appNavs && appNavs.length > 0 ? html`
    <!-- This gets hidden on a small screen-->
    <nav class="toolbar-list">
    ${ appNavs.map((nav) => {
      return html`<a ?selected="${_page === nav.path}" href="${nav.path}">${nav.title}</a>`
    })}
    </nav>`:''}
  </app-header>`:''
}

<!-- Drawer content -->
<app-drawer .opened="${_drawerOpened}"
  @opened-changed="${e => this._updateDrawerState(e.target.opened)}">
  ${appNavs && appNavs.length > 0 ? html`<nav class="drawer-list">
    ${appNavs.map((nav) => {
      return html`<a ?selected="${_page === nav.path}" href="${nav.path}">${nav.title}</a>`
    })}
  </nav>`:''
}</app-drawer>

<!-- Main content -->
<main role="main" class="main-content">
  ${ _page ? html`<app-viewer page="${_page}"></app-viewer>`: '#Mif# Polymer App' }
</main>
<footer>
  <p>${appPowered ? html`${unsafeHTML(appPowered)}`:'&heart; 2018. MINDON.if Powered by Polymer Project'}</p>
</footer>
<snack-bar ?active="${_snackbarOpened}">
  you are ${_offline ? html`<b style="color:#ff6">offline</b>` : html`<b style="color:#0b0">online</b>`} now.
</snack-bar>
    `;
  }

  static get properties() {
    return {
      appTitle: { type: String, value: "#Mif# Polymer App"},
      appPowered: { type: String, value: "#Mif# Polymer App by MINDON.if"},
      appNavs: { type: Array, value: []}, /* {title, uri, icon!, desc!} */
      _page: { type: String },
      _drawerOpened: { type: Boolean },
      _snackbarOpened: { type: Boolean },
      _offline: { type: Boolean }
    }
  }

  constructor() {
    super();
    this._drawerOpened = false;
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
    setPassiveTouchGestures(true);

    window.addEventListener('meta-changed', (e)=>{
      const view = e.detail ? e.detail : {};
      const desc = view.desc || view.title;
      const appTitle = this.appTitle;
      let metas = {
          title: (view.title ? view.title + ' - ' : '') + appTitle,
          description: (desc ? desc + ' - ' : '') + appTitle
          // This object also takes an image property, that points to an img src.
      };
      if(view.image) metas.image = view.image;
      updateMetadata(metas);
    });
    window.addEventListener('app-customized', (e)=>{
      const props = e.detail;
      for(var k in props) {
        this[k] = props[k];
      }
    })
  }

  firstUpdated() {
    installRouter((location) => this._locationChanged(location));
    installOfflineWatcher((offline) => this._offlineChanged(offline));
    installMediaQueryWatcher(`(min-width: 460px)`,
        (matches) => this._layoutChanged(matches));
  }

  _layoutChanged(isWideLayout) {
    // The drawer doesn't make sense in a wide layout, so if it's opened, close it.
    this._updateDrawerState(false);
  }

  _offlineChanged(offline) {
    const previousOffline = this._offline;
    this._offline = offline;

    // Don't show the snackbar on the first load of the page.
    if (previousOffline === undefined) {
      return;
    }

    clearTimeout(this.__snackbarTimer);
    this._snackbarOpened = true;
    this.__snackbarTimer = setTimeout(() => { this._snackbarOpened = false }, 3000);
  }

  _locationChanged() {
    const path = window.decodeURIComponent(window.location.pathname);
    if(path=='/' && /^#\/.+/.test(location.hash)){
        path = location.hash.substr(1);
    }
    const page = path === '/' || !path ? '/' : path;
    this._page = page.charAt(0)=='/' ? page : '/' +page;
    // Close the drawer - in case the *path* change came from a link in the drawer.
    this._updateDrawerState(false);
  }

  _updateDrawerState(opened) {
    if (opened !== this._drawerOpened) {
      this._drawerOpened = opened;
    }
  }
}

window.customElements.define('mif-polymer', MifPolymer);
