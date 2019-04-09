import { LitElement, html } from 'lit-element';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-toast/paper-toast.js';

import {  MifView } from '../../components/mif-view.js';
import '../../components/mif-table.js';

// These are the shared styles needed by this element.
import { SharedStyles } from '../../components/shared-styles.js';

export class MifCell extends MifView {
  static get properties() {
    return {
      topic: {type: String},
      data: {type: Array},
      ubase: {type: String},
      current: {type: Object},
      pageNum: {type: Number, attribute: 'page-num'},
      pageSize: {type: Number, attribute: 'page-size'},
      lang: {type: String},
    }
  }

  constructor() {
    super();
    this.__texts = {
      'NEW': {
        'en':'New',
        'zh':'新建'
      },
      'UPDATE': {
        'en':'Update',
        'zh':'修改'
      },
      'CLOSE': {
        'en':'Close',
        'zh':'关闭'
      },
      'SAVE': {
        'en':'Save',
        'zh':'保存'
      },
      'SAVED': {
        'en':' Saved',
        'zh':'保存成功'
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
    return v===undefined ? kl : (kl instanceof Array && kl[v] ? kl[v] : v +' '+kl);
  }

  render() {
    const {topic, data, current,
      fields, features, lang,
      pageNum, pageSize, total,
    } = this;

    return html`
${SharedStyles}
<style>
paper-button[active] {
  background-color: var(--paper-blue-100);
}
h2 {
  font-size: 1.8em;
  margin: 0 auto;
}
h2 paper-button {
  min-width: 1.2em;
  padding: .2em .5em;
  vertical-align: middle;
  margin: 0;
}
paper-button iron-icon {
  pointer-events: none;
  vertical-align: middle;
  margin-bottom: 4px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

#mydetail {
  padding: 2em;
  min-width: 32em;
}
paper-button.submit {
  background-color: var(--paper-indigo-500);
  color: white;
  --paper-button-raised-keyboard-focus: {
    background-color: var(--paper-pink-a200) !important;
    color: white !important;
  };
}
div.tasks {
  margin-top: 2em;
  text-align: center;
}
div.view .admin {
  display: none
}
paper-toast.error {
  --paper-toast-background-color: var(--paper-orange-900);
}
</style>
<div class="${ this._via('admin') ? 'mgr': 'view'}">
  <h2>${topic}
    <paper-button class="admin" @tap="${ _ => this._toggleNew() }"><iron-icon icon="add-circle"></iron-icon></paper-button>
  </h2>
  ${ this._search() }
  <mif-table
    .topic="${topic}"
    .fields="${fields}"
    .features="${features}"
    .data="${data}"
    page-num="${pageNum||1}"
    num-per-page="${pageSize||8}"
    total="${data&&data.length>0?data[0].TotalRows||data.length:0}"
    lang="${lang}"
    @delete="${
      (e)=> {
        const {row, target, index} = e.detail;
        let d = this.data.slice(0);
        this._submit((this.ubase||'') + '/delete', 'ID=' +row.ID).then((resp)=>{
          d.splice(index, 1);
          this.data = d;
        }).catch(err => {
          // console.error(err);
          this.notify(err.toString(), 'error');
        });
      }
    }"
    @modify="${
      (e)=> {
        const {row, target, index} = e.detail;
        // console.log(row, index);
        this.current = row;
        this.row = {index};
        this.renderRoot.querySelector('#mydetail').open();
      }
    }"

    @order-by="${
      (e) => {
        this._query('order=' +encodeURIComponent(e.detail));
      }
    }"
    @page-num-changed="${ this._pageNumChanged }"></mif-table>
  <paper-dialog id="mydetail" with-backdrop>
    <div>
    <h3>${topic} - ${this._text(current ? 'UPDATE' : 'NEW')}</h3>    
    ${ this._detail(current) }
      <div class="tasks">
    <paper-button raised class="cancel" @tap="${_ => this._toggle('#mydetail') }">${this._text('CLOSE')}</paper-button>
    <paper-button id="mysubmit" raised class="submit admin" @tap="${evt => {
      const d = this._verify(this.renderRoot), butt = evt.target;
      if(!d || d.length == 0) {
        return;
      }
      butt.disabled = true;
      this._submit( (this.ubase||'') + '/save', d.join('&')).then((resp) => {
        butt.disabled = false;
        if(!this.current) {
          if(this.data && this.data.length > 0) {
            this.data = [resp].concat(this.data);
          } else {
            this.data = [resp];
          }
        } else {
          let list = this.data.slice(0);
          list[this.row.index] = resp;
          this.data = list;
        }
        this.notify(this.topic +this._text('SAVED'));
        this._reset();
      }).catch(err => {
        butt.disabled = false;
        // console.error(err); // TODO
        this.notify(err.toString(), 'error');
      });
      this._toggle('#mydetail')} }">${this._text('SAVE')}</paper-button>
      </div>
    </div>
  </paper-dialog>
  <paper-toast id="mytoast" always-on-top @tap="${evt => evt.target.close()}"></paper-toast>
</div>
    `;
  }
  _via(role) {
    return true;
  }

  _detail(info) {
    if(!this._via('admin')) {
      return this._view(info);
    }
    return html`<div>TODO</div>`;
  }

  _view(info) {
    return html`<div>TODO</div>`;
  }

  _toggle(id) {
    const d = this.renderRoot.querySelector(id);
    if(d) d.toggle();
  }

  _verify(root) {
    return [];
  }

  _search() {
    return '';
  }

  _toggleNew() {
    this.current = null;
    this.renderRoot.querySelector('#mydetail').open();
  }

  _enter(evt, nxid) {
    if(typeof evt == 'string' || evt instanceof Function) {
      return (event) =>this._enter(event, evt);
    }

    if(evt.keyCode != 13) {
      return true;
    }
    if(nxid instanceof Function) {
      return nxid(evt);
    }
    if(evt.target.invalid) {
      return true;
    }
    const q = !nxid||nxid=='submit'?'#mysubmit':nxid,
      t = this.renderRoot.querySelector(q);
    if(!t) {
      return true;
    }
    if(!nxid||nxid=='submit') {
      t.click();
    } else {
      t.focus();
    }
  }

  _submit(uri, data) {
    return fetch(uri, {
        method: "POST",
        mode: "cors",
        // no-cors, cors, *same-origin
        cache: "no-cache",
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin",
        // include, same-origin, *omit
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            // "Content-Type": "application/json"
        },
        redirect: "follow",
        // manual, *follow, error
        referrer: "no-referrer",
        // no-referrer, *client
        body: data 
    })
    .then(resp=>resp.json());
  }

  _query(conds) {
    if(conds && typeof conds == 'string') {
      const i = conds.indexOf('='),
        last = (this._lastConds || []).slice(0);
      if(i > 0) { //
        const key = conds.substr(i+1);
        for(let j=0; j<last.length; j++) {
          if(last[j].indexOf(key) == 0) {
            last.splice(j, 1);
            break;
          }
        }
      }
      last.push(conds);
      conds = last;
    } else {
      this._lastConds = conds ? conds.slice(0) : '';
    }

    if(!conds) conds = [];
    else if(typeof conds == 'string') conds = [conds];

    let nped = false, pn = 1;
    for(let i=0; i<conds.length; i++) {
      let k = conds[i].indexOf('pn=');
      if(k == 0) {
        pn = parseInt(conds[i].substr(k+3), 10);
        nped = true;
        break;
      }
    }
    if(!nped) {
      conds.push('pn=1');
    }
    if(this.pageNum != pn) {
      this.pageNum = pn;
    }
    conds.push('npp=' +(this.pageSize||8));

    console.log(conds);

    return fetch((this.ubase||'') +'/query' + (conds.length > 0 ?
      '?'+conds.join('&') :'') )
      .then(resp => resp.json())
      .then((d) => {
        this.data = d;
        this.total = d.length > 0 ? d[0].TotalRows : 0;
      })
      .catch(err => {
        // console.error(err); // TODO
        this.notify(err.toString(), 'error');
      });
  }

  _pageNumChanged(evt) {
    if(this.pageNum != evt.detail) {
      this.pageNum = evt.detail;
      this._query('pn=' +this.pageNum);
    }
  }

  _reset() {}

  notify(msg, type) {
    const t = this.renderRoot.querySelector('#mytoast');
    t.className = type||'';
    t.text = msg;
    t.fitInto = this;
    t.open();
  }
}

window.customElements.define('mif-cell', MifCell);
