import { LitElement, html } from '@polymer/lit-element';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';

class MifPaging extends LitElement {
  static get properties() {
    return {
      lang: {type: String}, // default zh, en
      num: { type: Number, attribute: true},
      numPerPage: { type: Number, attribute: 'num-per-page' },
      total: { type: Number, attribute: true},
      readOnly: { type: Boolean, attribute: 'read-only'}
    }
  }

  constructor() {
    super();
    this.__texts = {
      'PAGE': {
        'en': 'Page',
        'zh': '页数'
      },
      'INFO': {
        'en': ({total, max}) => html`<strong>${total}</strong> items / ${max} pages`,
        'zh': ({total, max}) => html`<strong>${total}</strong> 项 / ${max} 页`
      },
    };
  }

  _text(key, v, lang) {
    if(!lang) {
      lang = this.lang != 'en' ? 'zh' : 'en';
    }
    const texts = this.__texts;
    const kt = texts[key];
    if(!kt) return '/!/';
    const kl = kt[lang] || kt['en'];
    if(kl instanceof Function) {
      return kl(v);
    }
    return v===undefined ? kl : v +' '+kl;
  }


  goto(n) {
    if(n<1) n = 1;
    if(n>this.max) n = this.max;
    this.num = n;
  }

  _keyPressed(event) {
    if(event.keyCode != 13) {
      return;
    }
    let v = parseInt(event.target.value, 10), num = this.num;
    if(v && !event.target.invalid) {
      num = v;
    }
    if(num != this.num) {
      this.goto(num);
    }
  }

  render() {
    const { numPerPage, total, readOnly } = this;

    let num = this.num;
    const max = numPerPage > 0 ? Math.ceil(total/numPerPage) : 0;
    this.max = max;
    if(max < 2) return '';
    if(isNaN(num) || num < 1) num = 1;
    else if(num > max) num = max;

    let n = 3, from = num -n , to = num +n;

    if(from < 1) to = Math.max(2*n +1, to);
    else if (to > max) from = Math.min(max - 2*n, to);

    if(from < 1) from = 1;
    if(to > max) to = max;

    this.dispatchEvent(new CustomEvent('num-changed', {detail: num}));
    let pagekey = Array.apply(null, Array(to - from +1)).map((_, i) => {
      const pn = i +from;
      if(num == pn) {
        return html`<paper-input ?readOnly="${readOnly}"
          label="${ this._text('PAGE') }" no-label-float
          type="number"
          value="${pn}"
          min="1"
          max="${max}"
          @keydown="${e => this._keyPressed(e) }"></paper-input>`;
      }
      return html`<paper-button ?disabled="${num==pn}"
        ?raised="${num!=pn}"
        @tap="${_ => this.goto(pn)}">${pn}</paper-button>`
    });

    return html`
<style is="custom-style">
  :host {display:block;}
  paper-input {
    --paper-input-container-input-color: #06e;
    --paper-input-container-input-webkit-spinner: {
      display: none;
    };
    --paper-input-container-color: #f60;
    min-width: 3em;
    display: inline-block;
    text-align:center;
  }
  paper-button {min-width: 2.5em;}
  nobr {display: inline-block; margin-top: 4px; color:#666}
</style>
<div><paper-button ?disabled="${num==1}" @tap="${_ => this.goto(1)}">&#x2759;&#x276E;</paper-button>
${from > 1 ? '..':'' }
${pagekey}
${to < max ? '..':'' }
<paper-button ?disabled="${num==max}" @tap="${_ => this.goto(max)}">&#x276F;&#x2759;</paper-button>
<nobr> ${ this._text('INFO', {total, max})}</nobr>
</div>`
  }
}

customElements.define('mif-paging', MifPaging);