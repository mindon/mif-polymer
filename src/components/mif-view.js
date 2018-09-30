/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement } from '@polymer/lit-element';

export class MifView extends LitElement {
  static get properties() {
    return {
      disabled: { type: Boolean },
      path: { type: String },
    }
  }

  // Only render this view if it is active
  shouldUpdate() {
    return !this.disabled;
  }

  app(props) {
  	var a = {};
  	for(var k in props) {a['app' +k.charAt(0).toUpperCase() +k.substr(1)] = props[k]}
    window.dispatchEvent(new CustomEvent("app-customized", {detail: a}));
  }

  metas(info) {
    window.dispatchEvent(new CustomEvent("meta-changed", {detail: info}));
  }
}
