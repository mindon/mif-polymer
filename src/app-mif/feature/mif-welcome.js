import { LitElement, html } from '@polymer/lit-element';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';

import {  MifView } from '../../components/mif-view.js';
import '../../components/mif-time.js';

// These are the shared styles needed by this element.
import { SharedStyles } from '../../components/shared-styles.js';

class MifWelcome extends MifView {
  static get properties() {
    return {
      data: {type: Array}
    }
  }
  firstUpdated() {
    this.metas({title: 'Welcome', desc: 'Welcome to #Mif# Polymer App'});
  }

  render() {
    return html`
${SharedStyles}
<style>
paper-button[active] {
  background-color: var(--paper-blue-100);
}
</style>
<section>
  <h2>Welcome</h2>
  <p>This is a text-only page.</p>
  <p>It doesn't do anything other than display some static text.</p>
</section>
<section>
  <mif-time label="日期范围"
    range
    format="Y/m/d"
    value="2018/10/05~2018/10/27"
    min="2018/08/08"
    max="2019/09/09"
    @next-focus="${ evt => this.renderRoot.querySelector('#other').focus() }"
    @value-changed="${evt => console.log(evt.detail)}"></mif-time>

  <paper-input id="other" label="INPUT Label" type="search"></paper-input>
  <paper-button toggles raised @tap="${ _ => console.log(new Date()) }">Button Click</paper-button>
  <paper-button disabled raised @tap="${ _ => console.log(new Date()) }">Button Click</paper-button>
</section>
    `;
  }

}

window.customElements.define('mif-welcome', MifWelcome);
