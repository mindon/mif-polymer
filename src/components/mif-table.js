import { LitElement, html } from '@polymer/lit-element';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
// TODO: support dialog instead of inline, slot?
import './mif-paging.js';

class MifTable extends LitElement {
  static get properties() {
    return {
      lang: {type: String}, // default zh, en
      topic: {type: String},
      fields: {type: Array}, // [{key, name, ...}]
      data: {type: Array},

      detail: {type: Function}, // (row, fields)
      features: {type: Object}, // {task: index}
      rowStyles: {type: Function}, // (row, idx)

      emptyMessage: {type: String, attribute:'empty-message'},

      // paging info
      pageNum: {type: Number, attribute: 'page-num'},
      numPerPage: {type: Number, attribute: 'num-per-page'},
      total: {type: Number},
      pagingHide: {type: String, attribute: 'paging-hide'},

      _atlines: {type: Object}, // {row index: do-name}
      slim: {type: Number},
      rowTrigger: {type: Object},
    }
  }

  constructor() {
    super();
    this.__styles = html`<custom-style>
<style>
  :host {
    display: block;
    font-size: 1rem;
    margin: 1em 0;
    width: 100%;
    max-width: 100%;
    z-index: 0;
  }
  table {
    border-spacing: 0;
    min-width: 360px;
    max-width: 100%;
    width: 100%;
    table-layout: fixed;
    @apply --table-style;
  }
  thead {
    background-color: #f6f6f6;
  }
  tbody {
    overflow: auto;
  }
  th {
    border-width: thin 0;
    border-style: solid;
    border-color: #f0f0f0;
    font-size: 0.8em;
    padding: 0 1em;
    line-height: 2.4em;
    @apply --table-th-style;
  }
  td {
    margin: 0;
    padding: 0.5em 1em;
    border-bottom: solid thin #eee;
    max-width: 36em;
    word-wrap: break-word;
    font-size: 0.8em;
    @apply --table-td-style;
  }
  th iron-icon {
    pointer-events: none;
    color: var(--paper-deep-orange-900);
  }
  paper-button iron-icon {
    pointer-events: none;
  }
  td.center, th.center {
    text-align: center;
  }
  th.left {
    text-align: left;
  }
  td.empty {
    text-align: center;
    color: #930;
    padding: 2em 0;
    @apply --data-empty;
  }
  tr.row-0 {
    @apply --row-0;
  }
  tr.row-1 {
    background-color: #fafafa;
    @apply --row-1;
  }
  td.inline {
    background-color: #eee;
    padding: 1em;
    font-size: 1em;
    border-radius: 0 0 6px 6px;
    @apply --detail-inline; 
  }

  td.inline-active {
    border-radius: 3px 3px 0 0;
    background-color: #eee;
    border-top: 1px solid #fff;
    @apply --detail-inline;  
  }
  td.expand {
    text-align: center;
  }
  td.expand .value {
    white-space: pre;
    word-wrap: break-word;
  }
  div.confirm {
    display: flex;
  }
  div.confirm.todo {
    margin: 1em 0;
  }
  div.confirm paper-button {
    min-width: 3em;
  }
  div.todo paper-button {
    background-color: #fff;
    color: #000;
    min-width: 5em;
  }
  div.confirm paper-button.todo {
    background-color: var(--paper-blue-200);
  }
  div.todo paper-button.cancel {
    color: var(--paper-deep-orange-900);
  }
  div.confirm div.message {
    line-height: 42px;
    color: var(--paper-blue-900);
    padding-left: 1em;
    padding-right: 2em;
    flex: 1;
    text-align: center;
  }
  div.confirm div.failed {
    color: var(--paper-deep-orange-900);
  }
  div.confirm div.success {
    color: var(--paper-green-700);
  }
  div.paging {
    text-align: var(--paging-text-align, center);
  }
</style>
<custom-style>`;

    this.__texts =  {
      'EMPTY': {
        'en': (t)=>`No matched ${t||''} data`,
        'zh': (t)=>`暂无相符的${t||''}数据`
      },
      'EDIT': {
        'en': 'Edit',
        'zh': '修改'
      },
      'UNLINK': {
        'en': 'Delete',
        'zh': '删除'
      },
      'DELETE': {
        'en': (t)=>`Confirm delete this item of ${t||'data'}`,
        'zh': (t)=>`确认删除此${t||'数据项'}？`
      },
      'YES': {
        'en': 'Yes',
        'zh': '确认'
      },
      'NO': {
        'en': 'No',
        'zh': '取消'
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
    let k = v;
    if(kl instanceof Function) {
      return kl(v);
    }
    return v===undefined ? kl : (kl instanceof Array && kl[k] ? kl[k] : v +' '+kl);
  }

  shouldUpdate() {
    return this.fields && this.fields.map ? true : false;
  }

  render() {
    const {topic, fields, data, slim,
      features, _atlines, emptyMessage,
      pageNum, numPerPage, total, pagingHide} = this;

    // header
    let colIndex = 0, cols = 0, colf = {}, _iff = this._conff(features, fields.length);
    const header = html`<thead><tr>${fields.map( field => {
      colIndex++;
      const {prefix, feature, xheaders} = this._feature(field, colIndex-1, _iff);
      if(feature) {
        colf[colIndex -1] = {prefix, feature};
        cols += xheaders.length;
      }
      cols++;

      // header item
      return html`${prefix?xheaders:''}<th
 class="${field.do?'center':'left'}" 
 style="${(field.order?'cursor:default':'')+(field.style?';'+field.style:'')}"
 @click="${ evt => { if(field.order) this._orderToggle(field, colIndex-1, evt.target) } }">${ this._header(field, colIndex-1)}
 ${ field.order ? html` <iron-icon icon="${ this._orderDesc(field) ? 'expand-more':'expand-less' }"></iron-icon>` : '' }
</th>${!prefix?xheaders:''}`;
    })}</tr></thead>`; // header

    // body
    let rowIndex = 0;
    const body = html`<tbody>${ !data || data.length==0 ? 
      html`<tr><td colspan="${cols}" class="empty">${emptyMessage || this._text('EMPTY', topic)}</td></tr>` :
      data.map(row => {
        rowIndex++;
        colIndex = 0;
        // body row
        return html`<tr
          class="${ rowIndex%2==0?'row-1':'row-0' }"
          style="${ this._styleRow(row, rowIndex-1) }"
          @click="${ ((d, idx)=>{return e => {
            const qn = this.rowTrigger, target = e.target;
            if(qn) {
              const tr = this._parentOf(target, 'TR');
              if(!tr) return;
              const t = tr.querySelector(qn.q);
              if(!t || t==target) return;
              if(qn.ignore && qn.ignore(fields[qn.n], d, t, idx)) return;
              this.fire(fields[qn.n], d, t, idx);
            }
          }})(row, rowIndex -1) }">${
          fields.map(field => {
            colIndex++;

            const _colf = colf[colIndex -1];
            const xcell = _colf ? this._xcell(_colf, row, rowIndex -1, colIndex -1) : '';
            // cell
            return html`${ _colf && _colf.prefix ? xcell : '' }${
              this._cell(field, row, rowIndex-1, colIndex -1)
            }${ _colf && !_colf.prefix ? xcell : '' }`;
          })
      }</tr>${ _atlines && _atlines[rowIndex-1] ? this._inline(_atlines[rowIndex-1], row, rowIndex -1, cols) : '' }`;
    }) }</tbody>`; // body

    // paging view
    let npp = numPerPage;
    if(!npp) npp = 8;
    const paging = total && total > numPerPage ? html`<div class="paging"><mif-paging
      lang="${this.lang}"
      total="${total}"
      num-per-page="${npp}"
      num="${pageNum}"
      slim="${slim||3}"
      @num-changed="${e => {
        this.pageNum = e.detail;
        this.dispatchEvent(new CustomEvent('page-num-changed', {detail: e.detail}))
      }}"></mif-paging></div>` : '';

    return html`${this.__styles}
      ${ (!pagingHide || pagingHide!="top" ? paging :'') }
      <table>${ header } ${ body } </table>
      ${ !pagingHide || pagingHide.indexOf("bot") != 0 ? paging :''}`;
  }

  _parentOf(n, tag) {
    while(n && n.tagName != tag) {
      n = n.parentNode;
      if(n == this.renderRoot) {
        n = null;
        break
      }
    }
    return n;
  }

  _header(field, colIdx) {
    return field.name;
  }

  _conff(features, size) {
    // default settings
    const defaults = {
      modify:{i:0, ico:'create', name:this._text('EDIT')},
      delete: {i:-1, ico:'delete', name:this._text('UNLINK'), inline: true}
    };

    let _iff = {};
    // skip off:true and update with default settings
    // generate _iff to keep columns' details
    let n = 0;
    for(var k in features) {
      let fi = features[k];
      if(fi === false || fi.off) {
        continue;
      }
      const _default = defaults[k];
      if(_default) {
        for(var t in _default) {
          if(fi[t] !== undefined) continue;
          fi[t] = _default[t];
        }
      }
      if(isNaN(fi.i)) fi.i = -1;
      let idx = fi.i;
      if(idx < 0) {
        idx = size +idx;
      }
      fi.do = k;
      if(_iff[idx]) {
        _iff[idx].push(fi);
      } else {
        _iff[idx] = [fi];
      }
    }
    return _iff;
  }

  // features position and configs
  _feature(field, colIdx, _iff) {
    const fiarr = _iff[colIdx];
    if(!fiarr) {
      return {};
    }
    let prefix = colIdx == 0;
    const xheaders = fiarr.map(fi => {
      if(!prefix && fi.prefix) prefix = true;
      return html`<th style="${fi.style||''}">${fi.name || fi.do.toUpperCase() || '-'}</th>`;
    })
    return {prefix: prefix, feature: fiarr, xheaders: xheaders};
  }

  // feature column data
  _xcell(colf, row, rowIdx, colIdx) {
    return colf.feature.map(fi => {
      if(!fi || fi.off) return '';
      return this._cell(fi, row, rowIdx, colIdx);
    });
  }

  // order desc
  _orderDesc(field) {
    return field.order.toLowerCase().indexOf(' desc') > 0;
  }

  // toggle order
  _orderToggle(field, colIdx, target) {
    const ico = target.querySelector('iron-icon');
    if(!ico) return;
    const descMode = ico.icon == 'expand-more';
    ico.icon = descMode ? 'expand-less': 'expand-more';
    var k = field.order.toLowerCase().indexOf(' desc'), ok = k>-1?field.order.substr(0, k): field.order;
    if(this.data && this.data.length > 0) {
      this._atlines = {};
      this.dispatchEvent(new CustomEvent('order-by', {detail: ok +(descMode?'':' DESC')}));
    }
  }

  // if current page empty switch to previous page
  updated(props) {
    if(!props['data']) {
      return;
    }
    this._atlines = {};
    if(this.pageNum > 1 && this.data.length == 0) {
      this.pageNum--;
    }
  }

  // to style rows
  _styleRow(row, idx) {
    return this.rowStyles instanceof Function ? this.rowStyles(row, idx) : '';
  }

  // to style cells based on config and data, row/column index
  _styleCell(field, row, rowIdx, colIdx) {
    return field.style instanceof Function ? field.style(row, rowIdx, colIdx) : field.style || '';
  }

  _tapMore(field, row, rowIdx, colIdx, target, content) {
    if(target.parentNode.classList.contains('inline-active')) {
      this._inlineToggle(rowIdx, {do:'expand', _column: colIdx});
    } else {
      this.fire(Object.assign({}, field, {do:'expand',
        _column: colIdx,
        multi: field.multi !== false ? true : false,
        expand: field.expand ? field.expand : ()=> {
          return html`<div>${ content }</div>`;
        }}), row, target, rowIdx);
    }    
  }

  _moreButton(field, row, rowIdx, colIdx, v) {
    let c = v, d = null; try {d=JSON.parse(c)}catch(e){}
    if(d) c = JSON.stringify(d, null, 2);
    return html`${ v.substr(0, field.more) }<paper-icon-button icon="more-horiz" @tap="${
      evt => this._tapMore(field, row, rowIdx, colIdx, evt.target, c)
    }"></paper-icon-button>`;
  }

  // generate cell content
  _cell(field, row, rowIdx, colIdx) {
    let v = html`${field.key ? row[field.key] : ''}`;
    if(v && field.more && v.length > field.more) {
      v = this._moreButton(field, row, rowIdx, colIdx, v);
    }
    let cl = "", inlineTdClass = '';
    let raised = field.raised === false ? false : true;
    const atlines = this._atlines;
    if(field.do) {
      if(field.inline) {
        raised = atlines && atlines[rowIdx] ? atlines[rowIdx].do == field.do ? false: true : true;
        if(!raised) inlineTdClass = 'inline-active';
      }
      field.raised = raised;
    }

    // display
    if(field.display instanceof Function) {
      v = field.display(field, row, rowIdx, colIdx)
    } else if(field.display) {
      v = field.display;
    }
    const disabled = field.disabled instanceof Function ? field.disabled(field, row) : field.disabled || false;
    if(field.icon || (field.ico && !field.do)) {
      v = html`<iron-icon icon="${field.icon || field.ico}"></iron-icon> ${v}`;
    }

    if(field.do) {
      // button view
      let buttonStyle = field.css instanceof Function ? field.css(field, row) : field.css || '';
      if(!raised && field.inline) {
        buttonStyle = 'color: #d50000';
      }
      if(field.ico) {
        v = html`<paper-icon-button
          style="${ buttonStyle }"
          @tap="${e=>this.fire(field, row, e.target, rowIdx)}"
          ?disabled="${disabled}"
          icon="${field.ico}">${v}</paper-icon-button>`;
      } else {
        v = html`<paper-button
          style="${ buttonStyle }"
          @tap="${e=>this.fire(field, row, e.target, rowIdx)}"
          ?disabled="${disabled}"
          ?raised="${raised}">${v}</paper-button>`;
      }
      cl = "center";
    }
    if(field.class) {
      cl = cl ? cl +' ' + field.class: field.class; 
    }
    if(!field.do && raised && atlines && atlines[rowIdx] &&
      colIdx == atlines[rowIdx]._column &&
      atlines[rowIdx].do == 'expand') {
      inlineTdClass = 'inline-active';
    }
    return html`<td class="${cl} ${inlineTdClass}" style="${ this._styleCell(field, row, rowIdx, colIdx) }">${v}</td>`;
  }

  //  render inline part after the data row
  _inline(field, row, rowIdx, cols) {
    const {style, detail, type} = this._inlineBody(field, row, rowIdx);
    return detail ? html`<tr><td class="inline ${type?type:''}" colspan="${cols}" style="${style || ''}">${
      type == 'failed' || type == 'success' ? this._inlineTodo(field, {message: detail, type: type}, row, rowIdx) : detail
    }</td></tr>` : '';
  }

  // inline message or confirm case for inline body
  _inlineTodo(field, detail, row, index, todo) {
    return html`<div class="confirm ${todo?'todo':''}"><div class="message ${detail.type||''}">${detail.message || detail}</div><div>
${todo ? html`<paper-button raised @tap="${ e => todo(e) }" class="todo">${detail.done || ''}<iron-icon icon="done"></iron-icon></paper-button>`:''}
  <paper-button ?raised=${todo?true:false} @tap="${ e => this._inlineToggle(index, field)}" class="cancel">${detail.cancel || ''}<iron-icon icon="${todo?'close':'done'}"></iron-icon></paper-button></div></div>`;
  }

  // inline body based on do name and row data and row index
  _inlineBody(field, row, index) {
    if(field.expand) {
      const body = field.expand instanceof Function ?
        field.expand(field, row, index) :
        field.expand;
      return {detail: field.tapHide ? html`<div @click=${
        _ => this._inlineToggle(index, field)
      }>${ body }</div>` : body, type:'expand' };
    }

    // defaults
    const doName = field.do;
    if(!field.inline) {
      return {};
    }

    let message = field.inline instanceof Function ? field.inline(field, row, index) : field.inline;
    if(message === true) message = '';
    if(!message) {
      if(doName !='delete') {
        return this.inline ? this.inline(field, row, index) : {};
      }
      message = this._text('DELETE', this.topic);
    } else if(message.detail) {
      return message;
    }

    return {detail: this._inlineTodo(field, {
      message: message,
      done: field.done || this._text('YES'),
      cancel: field.cancel || this._text('NO')
    }, row, index, (e)=>{
      this.dispatchEvent(new CustomEvent(field.do, {detail: {field, row, index}}));
      this._inlineToggle(index, field);
    })};
  }

  // toggle inline content of the row
  _inlineToggle(index, field) {
    let atlines = this._atlines || {};
    const doName = (atlines[index] || {}).do;
    let at = {}, multi = field.multi;
    if(doName == field.do || multi) {
      let isFn = multi instanceof Function, closing = !!doName;
      for(var k in atlines) {
        if(k != index && (!isFn || closing ||
          (isFn && multi(atlines[k], this.data[k], k, doName)))) {
          at[k] = atlines[k];
        }
      }
      if(doName != field.do) {
        at[index] = field;
      }
    } else {
      at[index] = field;
    }
    this._atlines = at;
  }

  collapse(ignore) {
    const atlines = this._atlines || {};
    if(ignore === undefined) {
      this._atlines = {};
      return;
    }
    let at = {};
    const ignores = ignore instanceof Array ? ignore : [ignore];
    for(let i=0; i<ignores.length; i++) {
      const k = ignores[i];
      if(atlines[k]) {
        at[k] = atlines[k];
      }
    }
    this._atlines = at;
  }

  // fire inline event or dispatch event outside
  fire(field, row, target, index) {
    const name = field.do || field;
    if(field.inline || (field.expand && !field.debug)) {
      this._inlineToggle(index, field);
      return;
    }

    if(field.debug && field.key) {
      window.dispatchEvent(new CustomEvent('debug', {detail: {topic: field.desc||field.name||'', body: row[field.key]}}));
    } else {
      this.dispatchEvent(new CustomEvent(name, {detail: {field, row, target, index}}));
    }
  }
}

customElements.define('mif-table', MifTable);