/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from 'lit-element';
import { MifView } from './mif-view.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

class MifNotify extends MifView {
  static get properties() {
    return {
      type: { type: String },
      title: { type: String },
      extra: { type: String }
    }
  }

  render() {
    const {type, title} = this;
    let extra = this.extra;
    if(!extra) {
      extra = html`visit <a href="/">HOME</a> and retry?`;
    }

    return html`
${SharedStyles}
<style>
  p {text-align: center}
  h2 {
    @apply --header-style;
  }
  #content { @apply --content-style; }
  #extra { @apply --extra-style; }

  .error h2, .error slot {color: var(--paper-red-700)}
  .warning h2 {color: var(--paper-orange-700)}
  .info h2 {color: var(--paper-green-700)}
</style>
<section class="${type || ''}">
  ${ title ? html`<h2>${title}</h2>` : '' }
  <p id="content"><slot>~</slot></p>
  <p id="extra">${ extra }</p>
</section>
    `
  }
}

window.customElements.define('mif-notify', MifNotify);
