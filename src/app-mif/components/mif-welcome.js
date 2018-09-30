import { html } from '@polymer/lit-element';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';

import {  MifView } from '../../components/mif-view.js';

// These are the shared styles needed by this element.
import { SharedStyles } from '../../components/shared-styles.js';

class MifWelcome extends MifView {
  firstUpdated() {
    this.metas({title: 'Welcome', desc: 'Welcome to #Mif# Polymer App'});
  }
  render() {
    return html`
      ${SharedStyles}
      <section>
        <h2>Welcome to #Mif# Polymer App</h2>
        <p>This is a text-only page.</p>
        <p>It doesn't do anything other than display some static text.</p>
      </section>
      <section>
        <paper-input label="INPUT Label" type="search" always-float-label></paper-input>
        <paper-input label="INPUT Label" type="search"></paper-input>
        <paper-button toggles raised @tap="${ _ => console.log(new Date()) }">Button Click</paper-button>
        <paper-button disabled raised @tap="${ _ => console.log(new Date()) }">Button Click</paper-button>
      </section>
    `;
  }
}

window.customElements.define('mif-welcome', MifWelcome);
