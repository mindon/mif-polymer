import { LitElement, html } from '@polymer/lit-element';

class AppViewer extends LitElement {
  static get properties() {
    return {
      page: { type: String, value: "/" },
    }
  }

  _app(_path, _rules) {
    const i = _path.indexOf('/', 1);
    if(i < 0) {
        return;
    }
    const key = _path.substr(1, i-1);
    for(var ak in _rules) {
      if(ak == key) {
          return ak;
      }
      console.log(key, _rules[ak].test(key));
      if(_rules[ak].test(key)) {
          return ak;
      }
    }
    return;
  }

  constructor() {
    super();
    this._rules = {
      "demo": /^(demo|demo_other_prefixes)/
    };
  }

  render() {
    const _path = this.page;
    if(!_path) return '';
    const app = this._app(_path, this._rules) || 'mif';

    if(app == 'demo') {
      import('./app-demo/render.js');
      return html`<demo-render path="${_path}"></demo-render>`;
    }
    import('./app-mif/render.js');
    return html`<mif-render path="${_path}"></mif-render>`;
  }
}

window.customElements.define('app-viewer', AppViewer);
