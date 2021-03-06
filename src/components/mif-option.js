import { LitElement, html } from 'lit-element';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-input/paper-input.js';
import './mif-time.js';

class MifOption extends LitElement {
  static get properties() {
    return {
      data: {type: Array},
      value: {type: String},
      required: {type: Boolean},
      pattern: {type: String},
      invalid: {type: Boolean},
      label: {type: String},
      icon: {type: String},
      disabled: {type: Boolean},
      autofocus: {type: Boolean},
      readOnly: {type: Boolean, attribute:'read-only'},
      _viewable: {type: Boolean},
      noArrows: {type: Boolean, attribute:'no-arrows'},
      date: {type: Object},
      off: {type: Function},
      view: {type: Function},
      blurIf: {type: Function},
      query: {type: Function},
      removable: {type: Boolean},
    }
  }

  prev() {
    if(this.off || this.date) {
      if(this.date && this.value) this._dateSlide(-1);
      this.dispatchEvent(new CustomEvent('prev', {detail:this._index}));
      return;
    }
    if(this._index > 0) {
      this._index--;
      this.value = this.data[this._index].value;
    }
  }
  next() {
    if(this.off || this.date) {
      if(this.date && this.value) this._dateSlide(1)
      this.dispatchEvent(new CustomEvent('next', {detail:this._index}));
      return;
    }
    if(this._index < this.data.length-1) {
      this._index++;
      this.value = this.data[this._index].value;
    }
  }

  toggle() {
    if(this._tid) {
      clearTimeout(this._tid);
      this._tid = undefined;
    }
    this._viewable = !this._viewable;
  }

  render() {
    let { label, icon, autofocus,
      data, required, pattern,
      disabled, off, noArrows, removable,
      readOnly, _viewable, view } = this;

    if(this.date && !off) off = (data, tag)=>this._dateOff(data, tag);

    if(!data) data = [];
    const value = this.value;
    let _index = this._index;
    if(data.length > 0) {
      if(value !== undefined) {
        for(let i=0; i<data.length; i++) {
          if(data[i].value == value) {
            this._index = _index = i;
            break;
          }
        }
      }
      if(_index === undefined) {
        this._index = _index = 0;
      }
    }

    const max = data.length, current = data[_index] || {value};
    const offCtl = (tag) => {
      if(disabled) return true;
      return off?off(data, tag):disabled||max<2 ||
       (_index==0 && tag=='prev') ||
       (_index==max-1 && tag=='next');
    }
    if(value != this._lastValue) {
      _viewable = false;
      this.dispatchEvent(new CustomEvent('value-changed', {detail:{value: value, data:current}}));
      this._lastValue = value;
    }

    if(disabled) {
      _viewable = false;
    }

    return html`
<style is="custom-style">
  :host {
    display:block;
  }
  div.horizontal {
    display:flex;
  }
  paper-input, mif-time {
    text-align:center;
    flex:1;
  }
  div.horizontal paper-icon-button, div.horizontal slot {
    align-self: flex-end;
  }
  paper-listbox {
    margin: -8px 40px 0;
    background-color: #eaebf6;
    border-radius: 0 0 6px 6px;
  }
  div.item {
    display: flex;
    width: 100%;
  }
  div.item label {
    flex: 1;
    text-align: center;
  }
  div.removable {
    padding-left: 24px;
  }
  div.item paper-icon-button {
    padding: 4px;
    width: 24px;
    height: 24px;
    color: #960;    
    vertical-align: middle;
  }
</style>
<div class="horizontal">
<paper-icon-button 
  ?hidden=${noArrows}
  ?disabled="${offCtl('prev')}"
  @tap=${_ => this.prev()} 
  icon="chevron-left"></paper-icon-button>
${this.date ? 
html`<mif-time 
  tab-index="0"
  icon="${icon||'fingerprint'}"
  always-float-label
  ?required="${required}"
  ?disabled="${disabled}"
  ?read-only="${readOnly}"
  label="${label}"
  value="${value||''}"
  format="Y/m/d" 
  min="${this.date.min||''}"
  max="${this.date.max||''}"
  auto-off="DATE" 
  @value-changed="${ evt => {
    this.value = evt.detail;
    this.invalid = evt.target.invalid;
    this.data=[{value:evt.detail}];
  } }"
  @next-focus="${
    _ => this.dispatchEvent(new CustomEvent('next-focus', {detail: this.value, target: this}))
  }"
  @keydown="${
    evt => this._keyPressed(evt, offCtl)
  }"></mif-time>`:
html`<paper-input
  tab-index="0"
  label="${label}"
  ?disabled="${disabled||false}"
  always-float-label
  ?autofocus="${autofocus||false}"
  ?required="${required||false}"
  pattern="${pattern||''}"
  value="${view?view(current):current.desc||current.value||''}"
  ?readOnly="${readOnly||false}"
  @focus="${ _ => {
    if(this._tid) clearTimeout(this._tid);
  } }"
  @blur="${ evt => {
    if(this._tid) clearTimeout(this._tid);
    this._tid = setTimeout(_ => this._viewable && this._tid && (this._viewable=false), 200);
    this.dispatchEvent(new CustomEvent('blur', {detail: this.value, target: this}));
    if(!this._busying && this.blurIf) {
      const v = evt.target.value;
      this.blurIf(v, data, ()=>{
        this._keyPressed(v, offCtl);
      })
    }
  } }"
  @value-changed="${
    evt => {
      this.invalid = evt.target.invalid;
      this.dispatchEvent(new CustomEvent('value-changed', {detail: this.value, target: this}));
    }
  }"
  @tap="${_ => readOnly&&this.toggle()}"
  @keydown="${evt => this._keyPressed(evt, offCtl)}">
  <paper-icon-button slot="prefix" icon="${icon||'fingerprint'}"></paper-icon-button>
  <slot slot="suffix" name="list">
    <paper-icon-button
      ?disabled="${offCtl('list')}"
      @tap="${_ =>!readOnly&&this.toggle()}"
      icon="more-vert"></paper-icon-button>
  </slot>
</paper-input>`
}
<paper-icon-button ?hidden=${noArrows} ?disabled="${offCtl('next')}" @tap="${_ => this.next()}" icon="chevron-right"></paper-icon-button>
</div><div ?hidden=${!_viewable}><paper-listbox
  @tap="${_ =>this.toggle()}"
  selected="${_index||0}"
  @selected-changed="${ evt => {
    if(data.length==0) return;
    this._index = evt.detail.value;
    this.value = data[this._index].value;
    this._viewable = false;
  } }">${
  data.map(d => html`<paper-item value="${d.value}"><div class="item ${removable&&d.value!=current.value?'removable':''}">
  <label>${view?view(d):d.desc||d.value||''}</label>
  ${removable&&d.value!=current.value?html`<paper-icon-button icon="close" @tap="${
    evt => {
      this._remove(d);
      evt.stopPropagation();
      return false;
    }
  }"></paper-icon-button>`:''}</div></paper-item>`)
}</paper-listbox></div>`
  }

  _keyPressed(evt, offCtl) {
    let v = '';
    if(typeof evt == 'string') {
      v = evt;
    } else {
      v = evt.target.value;
      const kc = evt.keyCode;
      if(kc == 38 || (kc==37 && this.readOnly)) {// up arrow
        if(offCtl && !offCtl('prev')) {
          this.prev();
          return;
        }
      } else if(kc == 40 || (kc==39 && this.readOnly)) {
        if(offCtl && !offCtl('next')) {
          this.next();
          return;
        }
      }
      if(kc != 13) {
        return;
      }
    }

    const indexOf = (d, data)=>{
      for(let i=0; i<data.length; i++) {
        if(data[i].value==d.value) {
          return i;
        }
      }
      return -1;
    }
    const cb = (d)=>{
      this._busying = false;
      const data = this.data || [];
      let idx = indexOf(d, data);
      if(idx > -1) {
        data[idx] = d;
      } else {
        idx = data.length;
        data.push(d);
      }
      this.data = data.slice(0);
      this._index = idx;
      this.value = data[idx].value;
      this.dispatchEvent(new CustomEvent('data-changed', {detail: {data: this.data, index: idx}}));
    };
    if(!this.query) {
      cb({value:v});
    } else {
      const data = this.data || [];
      const idx = indexOf({value:v}, data);
      // avoid duplicated query
      if(idx < 0 || !data[idx] ||
       data[idx].desc == undefined) {
        if(!this._busying) {
          this._busying = true;
          this.query(v, cb);
        }
      } else {
        this._index = idx;
        this.value = data[idx].value;
      }
    }
    if(!this.invalid) {
      this.dispatchEvent(new CustomEvent('next-focus', {detail: this.value, target: this}));
    }
  }

  _remove(d) {
    const data = this.data;
    for(let i=0, imax=data.length; i<imax; i++) {
      if(data[i].value!=d.value) {
        continue;
      }
      data.splice(i,1);
      this.data = data.slice(0);
      if(this._index > i) {
        this._index--;
      }
      this.dispatchEvent(new CustomEvent('data-changed', {detail: {data: data, index: this._index||0}}));
      break
    }
  }

  _dateOff(opts, tag) {
    const d = this.date;
    if(!opts || opts.length==0 || !opts[0].value) return true;
    if(tag=='prev') return d.min && opts[0].value<=d.min;
    if(tag=='next') return d.max && opts[0].value>=d.max;
  }
  _dateSlide(offset) {
    const t = new Date(this.value);
    if(t.setTime) {
      t.setTime(t.getTime() + offset*24*3600*1000);
      const value = [t.getFullYear(),
        ('0'+(t.getMonth()+1)).slice(-2),
        ('0'+t.getDate()).slice(-2)].join('/');
      this.value = value;
      this.data = [{value}];
    }
  }
}

customElements.define('mif-option', MifOption);
