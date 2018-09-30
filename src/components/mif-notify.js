/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from '@polymer/lit-element';
import { MifView } from './mif-view.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

class MifNotify extends MifView {
  static get properties() {
    return {
      class: { type: String, value: "error" },
      title: { type: String, value: ""},
      message: { type: String, value: "something lost its way"},

    }
  }

  render() {
    const {type, title, message} = this;
    return html`
      ${SharedStyles}
      <section>
        <h2 ?hidden="${!title || title.length==0}">${title}</h2>
        <p class="${type}">${message}</p>
        <p>
           visit <a href="/">HOME</a> and try again?
        </p>
      </section>
    `
  }
}

window.customElements.define('mif-notify', MifNotify);
