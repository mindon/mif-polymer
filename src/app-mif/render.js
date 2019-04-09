import { LitElement, html } from 'lit-element';

import { MifView } from '../components/mif-view.js';
import { SharedStyles } from '../components/shared-styles.js';

class MifRender extends MifView {

  firstUpdated() {
    this.app({
      title: '#Mif# Polymer App Demo',
      navs: [
        {title: "Welcome!", path: "/welcome"},
        {title: "View1", path: "/view1"},
        {title: "View2", path: "/view2"},
        {title: "Hey!", path: "/demo/hey1"},
      ],
    });
  }

  render() {
    const _path = this.path;

    // content
    let _body = '';
    if(_path == '/welcome') {
      import("./feature/mif-welcome.js");
      _body = html`<mif-welcome page-num="8"></mif-welcome>`;

    } else {
      _body = html`<center>${_path +' = ' + new Date()}</center>`;
    }

    return html`
${SharedStyles}
<section>${_body}</section>`
  }
}

window.customElements.define('mif-render', MifRender);
