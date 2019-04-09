import { LitElement, html } from 'lit-element';

import { MifView } from '../components/mif-view.js';
import { SharedStyles } from '../components/shared-styles.js';

class DemoRender extends MifView {

  firstUpdated() {
    this.app({
      title: 'Hey, darling',
      navs: [
        {title: "Hey1", path: "/demo/hey1"},
        {title: "Hey2", path: "/demo/hey2"},
        {title: "Hey3", path: "/demo/hey3"},
        {title: "Welcome!", path: "/welcome"},
      ],
    });
  }

  render() {
    const _path = this.path;

    // import("./components/demo-view1.js");
    this.metas({title: 'My!' + _path.substr(1), desc: 'Hello, My!'});

    return html`
      ${SharedStyles}
      <section>
        <center>${_path} ~</center>
      </section>`
  }
}

window.customElements.define('demo-render', DemoRender);
