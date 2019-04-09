import { LitElement, html } from 'lit-element';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-slider/paper-slider.js';

class MifTime extends LitElement {
  static get properties() {
    return {
      alwaysFloatLabel: {type:Boolean, attribute:'always-float-label'},
      required: {type: Boolean},
      label: {type: String},
      value: {type: String},
      icon: {type: String},
      format: {type: String},
      range: {type: Boolean},
      min: {type: String},
      max: {type: String},
      workingTime: {type: String, attribute:'working-time'}, // 08:30-12:00,14:00-18:30|14:00-17:30@sat/sun

      tab: {type: String}, // default tab in dialog: DATE | MONTH | YEAR
      lang: {type: String}, // zh_CN (default), en_US

      _index: {type: Number},
      _values: {type: Array},
      _bounds: {type: Array},
      _working: {type: Array},
      _year: {type: Number},

      disabled: {type: Boolean},
      readOnly: {type: Boolean,attribute:'read-only'},

      autoOff: {type: String, attribute:'auto-off'},
    }
  }

  constructor() {
    super();

    this.__pattern = /^\d{4}\/(0[1-9]|1[0-2])\/([0-2][0-9]|3[0-1])( ([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?)?([- ~]\d{4}\/(0[1-9]|1[0-2])\/([0-2][0-9]|3[0-1])( ([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?)?)?$/;
    this.__working = /^([0-1][0-9]|2[0-3]):([0-5][0-9])-([0-1][0-9]|2[0-3]):([0-5][0-9])(@(\/?[A-Z]{3}|(0[1-9]|1[0-2])([0-2][0-9]|3[0-1]))+)?(,?([0-1][0-9]|2[0-3]):([0-5][0-9])-([0-1][0-9]|2[0-3]):([0-5][0-9])(@(\/?[A-Z]{3}|(0[1-9]|1[0-2])([0-2][0-9]|3[0-1]))+)?)*$/;

    this.__days = [31,28,31,30,31,30,31,31,30,31,30,31];

    this.__texts = {
      'MONTH': {
        'en':['JAN.','FEB.','MAR.','APR.','MAY.','JUN.','JUL.','AUG.','SEP.','OCT.','NOV.','DEC.'],
        'zh':'月'
      },
      'WEEKDAY': {
        'en': ['SUN.','MON.','TUE.','WED.','THU.','FRI.','SAT.'],
        'zh': ['周日','周一','周二','周三','周四','周五','周六']
      },
      'HOURS': {
        'en': 'Hours',
        'zh': '时'
      },
      'MINUTES': {
        'en': 'Minutes',
        'zh': '分'
      },
      'SECONDS': {
        'en': 'Seconds',
        'zh': '秒'
      },
      'CURRENT': {
        'en': 'Restore to current time',
        'zh': '使用当前时间'
      }
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
    if(v !== undefined && key=='MONTH') {
      k = v -1;
    }
    return v===undefined ? kl : (kl instanceof Array && kl[k] ? kl[k] : v +' '+kl);
  }

  focus() {
    this.renderRoot.querySelector('paper-input').focus();
  }

  blur() {
    this.renderRoot.querySelector('paper-input').blur();
  }

  _daysOfMonth(m, y) {
    let d = this.__days[m -1];
    if(m == 2 && y%4==0) {
      if(y%100 == 0) {
        d += y%400 ? 1 : 0;
      } else {
        d += 1;
      }
    }
    return d;
  }

  _value(v) {
    if(!v) {
      return '';
    }
    const timed = /[his]/i.test(this.format || 'Y/m/d');
    if(!this.range) {
      const dt = this._format(v);
      return dt.date + (!timed?'': ' ' +dt.time);
    } else {
      const from = v.from, to = v.to, _from = this._format(from), _to = this._format(to);
      return _from.date + (!timed?'': ' ' +_from.time) +'~' + _to.date + (!timed?'': ' ' +_to.time);
    }
  }

  _format(dt) {
    let z = (d)=>d<10?'0'+d:d;
    return {date:[dt.getFullYear(), z(dt.getMonth()+1), z(dt.getDate())].join('/'),
      time:[z(dt.getHours()), z(dt.getMinutes())].join(':')}; // no seconds support , z(dt.getSeconds())
  }

  _formatAs(fmtstr, dt, locale) {
    if(!dt) {
      return;
    }
    var year = dt.getFullYear().toString(), month = dt.getMonth();

    // php, http://php.net/manual/en/function.date.php
    var t = dt.getDate(), hours = dt.getHours(), minutes = dt.getMinutes(), seconds = dt.getSeconds();
    var keys = [{key:'Y', value:year},
    {key:'y', value: year.substr(year.length-2)},
    {key:'m', value: (month < 9 ? '0':'')+(month+1)},
    {key:'M', value: this._text('MONTH', month, 'en')},
    {key:'n', value: month +1},
    {key:'d', value: t<10?'0'+t: t},
    {key:'j', value: t},
    {key:'h', value: hours%12<10?'0' +hours%12:(hours>12?(hours%12<10?'0'+hours%12:hours%12):hours)},
    {key:'A', value: hours<12?'AM':'PM'},
    {key:'H', value: hours<10?'0' +hours:hours},
    {key:'i', value: minutes<10?'0' +minutes: minutes},
    {key:'s', value: seconds<10?'0' +seconds:seconds},
    {key:'W', value: this._text('WEEKDAY', dt.getDay(), 'en')}];

    var result = fmtstr;
    for(var i=0, imax=keys.length; i<imax; i++) {
      var v = keys[i];
      if(result.indexOf(v.key)>-1) {
        result = result.replace(v.key, v.value);
      }
    }
    return result;
  }

  _disabled(y, m, d) {
    const _bounds = this._bounds;
    if(!_bounds || (!_bounds[0] && !_bounds[1])) {
      return false;
    }

    let matched = false;
    const dt0 = _bounds[0];
    let from = !dt0 ? '0000/00/00' :
      [y ? dt0.getFullYear() : '0000', m ? dt0.getMonth()+1 : 0,
       d ? dt0.getDate() : 0].map(k => k<10?'0'+k: k).join('/');

    const dt1 = _bounds[1];
    const to = !dt1 ? '9999/99/99' :
      [y ? dt1.getFullYear() : '9999', m ? dt1.getMonth()+1 : 0,
       d ? dt1.getDate() : 0].map(k => k<10?'0'+k: k).join('/');

    let v = [y,m,d].map(k => k<10?'0' +k : k).join('/');
    let i = 0, j = v.length;
    if(!y && d) { // m/d
      if(!m) { // d
        i = 8;
      } else { // m/d
        i = 5;
      }
    } else if(y && !d) {
      if(!m) { // y
        j = 4;
      } else { // y/m
        j = 7;
      }
    }
    v = v.substring(i, j);
    if(this._index == 1) {
      const _t = this._values && this._values[0] > 0 ? new Date(this._values[0]) : new Date();
      const _ts = [_t.getFullYear(), _t.getMonth()+1, _t.getDate()].map(k => k<10?'0'+k: k).join('/');
      if(_ts > from) {
        from = _ts;
      }
    }
    return v < from.substring(i, j) || v > to.substring(i, j);
  }

  _keyPressed(evt) {
    this.dispatchEvent(new CustomEvent('keydown', {keyCode: evt.keyCode}));
    if(evt.keyCode != 13) {
      return;
    }
    const v = evt.target.value;
    const drxp = /\d{8,14}/g;
    let dss = v;
    if(drxp.test(dss)) {
      dss = dss.replace(drxp, (ds)=>{
        let s = [ds.substr(0,4) ,ds.substr(4,2), ds.substr(6,2)].join('/')
        if(ds.length>=12) {
          s += ' ' + [ds.substr(8,2), ds.substr(10,2)].join(':');
        }
        if(ds.length==14) {
          s += ':' +ds.substr(12, 2);
        }
        return s;
      });
    }
    dss = dss.replace(/\s*-\s*/, '~').replace(/([\/:]\d{2})\s+(\d{4}\/)/, '$1~$2');
    this.value = dss;
    if(!this.invalid) {
      this.dispatchEvent(new CustomEvent('next-focus', {detail: this.value, target: this}));
    }
  }

  _inputChanged(evt) {
    const v = evt.detail.value, rxp = new RegExp(evt.target.pattern);
    if(v != this.value) {
      this.value = v;
    }
    if(v==''||rxp.test(v)) {
      this.dispatchEvent(new CustomEvent('value-changed', {detail: v.replace(/^\s+|\s+$/g, '')}));
    }
  }

  _set(v) {
    if(v instanceof Date)  {
      this._year = v.getFullYear();
      v = v.getTime();
    }
    let _values = this._values ? this._values.slice(0) : [0, 0];
    _values[this._index || 0] = v;
    if(!this._values || _values[0] != this._values[0] || _values[1] != this._values[1])  {
      this._values = _values;
    }
  }

  _confirm() {
    let _values = this._values || [0, 0];
    const now = new Date();
    if(_values[this._index || 0] == 0) {
      this._set(now);
      _values = this._values;
    }

    if(!this.range) {
      this.value = this._value(_values[0] > 0 ? new Date(_values[0]) : now);
    } else {
      this.value = this._value({
        from: _values[0] > 0 ? new Date(_values[0]) : now,
        to: _values[1] > 0 ? new Date(_values[1]) : now
      });
    }
  }

  _setYear(year, from) {
    if(year == from) {
      this._year = from - 9;
      return;
    }
    if(year == from+24) {
      this._year = from + 31;
      return;
    }
    let v = (this._values||[0,0])[this._index || 0];
    let t =!v?new Date():new Date(v);
    t.setFullYear(year);
    this.tab = 'MONTH';
    this._set(t);
  }

  _setMonth(m) {
    let v = (this._values||[0,0])[this._index || 0];
    let t =!v?new Date():new Date(v), d = t.getDate();
    if(d > 28) {
      const d0 = this._daysOfMonth(m, t.getFullYear());
      if(d > d0) {
        t.setDate(d0);
      }
    }
    t.setMonth(m -1);
    this.tab = 'DATE';
    this._set(t);
    this.renderRoot.querySelector('#mypop').notifyResize();
  }

  _setDate(d) {
      let v = (this._values||[0,0])[this._index || 0];
      let t =!v?new Date():new Date(v);
      t.setYear(d.y);
      t.setMonth(d.m -1);
      t.setDate(d.d);
      this._set(t);
      if(this.autoOff=='DATE') {
        this._confirm()
        const mypop = this.renderRoot.querySelector('#mypop');
        mypop.close();
      }
  }

  _setHours(h) {
    let v = (this._values||[0,0])[this._index || 0];
    let t =!v?new Date():new Date(v);
    t.setHours(h);
    this._set(t);
  }

  _setMinutes(i) {
    let v = (this._values||[0,0])[this._index || 0];
    let t =!v?new Date():new Date(v);
    t.setMinutes(i);
    this._set(t);
    if(this.autoOff=='MINUTES') {
      this._confirm()
      const mypop = this.renderRoot.querySelector('#mypop');
      mypop.close();
    }
  }

  _setSeconds(s) {
    let v = (this._values||[0,0])[this._index || 0];
    let t =!v?new Date():new Date(v);
    t.setSeconds(s);
    this._set(t);
  }

  _years(_y, y) {
    if(!_y) {
      _y = y;
    }
    const from = _y - _y % 5 - 10;
    let i = 0;
    const list = Array.from({length: 25}, (v, k) => k +from).map(year => {
      i++;
      return html`<td><paper-button class="year ${y==year?'valued':''}"
        @tap="${_ => this._setYear(year, from)}"
        ?disabled="${this._disabled(year)}">${i==1||i==25?'…':year}</paper-button></td>`
    });
    return [0,1,2,3,4].map((i) => {
      return html`<tr>${ list.slice(i*5, (i+1)*5) }</tr>`;
    });
  }

  _months(m, y) {
    let k = 0;
    const list = [1,2,3,4,5,6,7,8,9,10,11,12].map(k => {
      return html`<td><paper-button class="month ${m==k?'valued':''}"
          @tap="${_ => this._setMonth(k) }"
          ?disabled="${this._disabled(y, k)}">${ this._text('MONTH', k) }</paper-button></td>`
      });
    return [0,1,2,3].map((i) => {
      return html`<tr>${list.slice(i*3, (i+1)*3)}</tr>`;
    });
  }

  _days(current, y, m) {
    const {cy,cm,cd} = current;
    const d = this._daysOfMonth(m, y);
    let ds = [], w0 = new Date(y, m-1, 1).getDay(), w = w0;
    for(let i=1; i<=d; i++) {
      ds.push({y: y, m: m, d: i, w: w, type: (w%6==0?'weekend':'')});
      w = (w +1)%7;
    }
    if(w0 == 0) { // last month line
      w0 = 7;
    }
    if(w0 > 0) { // last month
      const m0 = m==1? 12: m-1;
      let ld = this._daysOfMonth(m0, m0==12? y -1: y);
      while(w0 > 0) {
        w0 = (7 +w0 -1)%7;
        ds.unshift({y: (m0==12? y -1: y), m: m0, d: ld--, w: w0, extra: true, type: 'extra' +(w0%6==0?' weekend':'')});
      }
    }
    if(w == 0) {
      w = 7;
    }
    if(w > 0) { // next month
      let nd = 1;
      const m1 = m==12? 1: m +1;
      while(w > 0) {
        ds.push({y: ( m1==1? y +1: y), m: m1, d: nd++, w: w==7?0:w, extra: true, type: 'extra' +(w%6==0?' weekend':'')});
        w = (w +1)%7;
      }
    }

    const list = ds.map(d => {
      return html`<td><paper-button
         class="${(d.type ? d.type : '') +(cd==d.d && cm==d.m && cy==d.y?' valued' : '')}"
         @tap="${ _ => this._setDate(d) }"
         ?disabled="${this._disabled(d.y, d.m, d.d)}">${d.d}</paper-button></td>`;
    });
    const rows = Array.from({length: list.length/7}, (v, k) => k).map(function(i) {
          return html`<tr>${ list.slice(i*7, (i+1)*7) }</tr>`;
    });

    let i = 0;
    return html`<tr>${
        this._text('WEEKDAY').map(k => {
          i++;
          return html`<th class="${i%6==1?'weekend':'weekday'}">${ k }</th>`
        })
      }</tr>${ rows }`;
  }

  _hours(time, y, m, d) {
    const his = time.split(':');
    return html`<tr><td><label class="hours">${ this._text('HOURS', his[0]) }</label><br/><paper-slider pin snaps max="23" max-markers="24" step="1" value="${his[0]}"
     @value-change="${e => this._setHours(e.target.value) }"></paper-slider></td></tr>
     ${his.length>1 ? html`<tr><td><label class="minutes">${ this._text('MINUTES', his[1]) }</label><br/><paper-slider pin snaps max="59" max-markers="60" step="1" value="${his[1]}"
     @value-change="${e => this._setMinutes(e.target.value) }"></paper-slider></td></tr>`:''}
     ${his.length>2 ? html`<tr><td><label class="seconds">${this._text('SECONDS', his[2])}</label><br/><paper-slider pin snaps max="59" max-markers="60" step="1" value="${his[2]}"
     @value-change="${e => this._setSeconds(e.target.value)}"></paper-slider></td></tr>`:''}`
  }

  _tabSwitch(tag, v) {
    this.tab = tag;
    if(tag == 'YEAR') {
      this._year = v;
    }
  }

  render() {
    let {alwaysFloatLabel, label, icon,
      value, format, disabled, readOnly,
      range, min, max, workingTime,
      tab, _index} = this;

    // defaults
    if(!alwaysFloatLabel) alwaysFloatLabel = false;
    if(!label) label = "";
    if(format === undefined) format = 'Y/m/d';
    if(range === undefined) range = false;
    if(tab === undefined) tab = 'DATE';
    if(_index === undefined) _index = 0;

    let now = new Date(), _values = [now, now];
    if(!this._values && value && this.__pattern.test(value)) {
      const _v = value.split(/\s*[-~]\s*/);
      let _t = new Date(_v[0]);
      if(_t instanceof Date) {
        _values[0] =  _t;
      }
      if(range) {
        _t = new Date(_v[1]);
        if(_t instanceof Date) {
          _values[1] = _t;
        }
      }
    } else if(this._values) {
      const _vint = this._values;
      _values = [
        _vint[0] ? new Date(_vint[0]) : now,
        _vint[1] ? new Date(_vint[1]) : now
      ];
    }
    const timed = /[his]/i.test(format);

    const v = range ? [_values[0], _values[1]] : [_values[0]];
    const _current = this._format(v[_index]);
    const ymd = _current.date.split('/');

    this._values = [v[0].getTime(), v[1] ? v[1].getTime() : 0];

    const _from = this._format(v[0]);
    const _to = range ? this._format(v[1]) : null;

    const y = parseInt(ymd[0], 10), m = parseInt(ymd[1], 10), d = parseInt(ymd[2], 10);

    // parse bounds
    if(min || max) {
      const _min = min ? new Date(/^\d+$/.test(min) ? +min : min) : null;
      const _max = max ? new Date(/^\d+$/.test(max) ? +max : max) : null;
      this._bounds = [isNaN(_min) ? undefined : _min, isNaN(_max) ? undefined: _max];
    }

    // parse working time rules
    if(this.__working.test(workingTime)) {
      this._working = workingTime.split(',').map(hours => {
        hours.split('|').map(hour => {
          const i = hour.indexOf('@');
          let hi = (i > -1 ? hour.substr(0, i): hour).split('-');
          let hr = {from: hi[0], to: hi[1]};
          if(i>0) {
            hr.spec = hour.substr(i+1).toUpperCase().split('/');
          }
          return hr;
        });
      });
    }

    let _confirmDisabled = this._disabled(y, m, d);
    if(range && !_confirmDisabled) {
      const other = v[1-_index] > 0 ? new Date(v[1-_index]) : now;
      _confirmDisabled = this._disabled(other.getFullYear(), other.getMonth()+1, other.getDate);
      if(!_confirmDisabled && _to && _to.date +(timed?' ' +_to.time:'') < _from.date +(timed?' ' +_from.time:'')) {
        _confirmDisabled = true;
      }
    }

    const todo = html`<div class="right">
      <paper-button class="cancel" dialog-dismiss><iron-icon icon="close"></iron-icon></paper-button>
      <paper-button class="confirm" title="${label||''}" dialog-confirm autofocus raised @tap="${_ => this._confirm()}"
        ?disabled="${ _confirmDisabled }"><iron-icon icon="done"></iron-icon></paper-button>
    </div>`;

    return html`
<style>
  :host {
    display: block;
    font-size: 9pt;
  }
  paper-dialog {
    margin: 24px 20px;
    min-height: 382px;
  }
  div.panel {
    width: 300px;
  }
  paper-button {
    padding:4px 8px;
    min-width:1.6em;
  }
  paper-button iron-icon {
    pointer-events: none;
  }
  div.current, div.todor {
    display: flex;
    padding-bottom: 6px;
  }
  div.current div.values paper-button {
    font-size:1.2em;
    margin-right: 0;
  }
  div.current div.values {
    flex: 1.0;
  }
  div.current paper-button.actived {
    background-color: var(--paper-light-blue-50);
    color: var(--paper-blue-700);
    pointer-events: none;
    border-radius: 6px 6px 0 0;
    padding: 6px 8px 0 8px;
    font-weight: bold;
    box-shadow: 0 10px 0 var(--paper-light-blue-50);
  }
  div.current paper-icon-button {
    padding: 2px;
    width: 26px;
    height: 26px;
  }
  paper-button.cancel {
    min-width: 1.2em;
    padding: 4px 2px;
    margin: 0;
  }
  paper-button.cancel iron-icon {
    width:20px;
    height:20px;
    padding: 1px;
    color: var(--paper-brown-400);
  }
  paper-button.confirm {
    background-color: var(--paper-blue-300);
    color: #fff;
  }
  paper-button.confirm[disabled] {
    background-color: var(--paper-grey-300);
    color: #fff;
  }
  table {
    width: 100%;
    min-height: 230px;
    padding: 16px 8px;
    background-color: var(--paper-light-blue-50);
  }
  td {
    text-align:center;
  }
  td paper-button {
    min-width: 2.5em;
    min-height: 2em;
    font-size: 1em;
    background-color: var(--paper-blue-100);
    margin: 0;
  }
  paper-button.weekend {
    background-color: var(--paper-blue-200)
  }
  paper-button.extra {
    opacity: .5;
  }
  td paper-button[disabled] {
    opacity: .7;
  }
  paper-button.extra.weekend {
    background-color: var(--paper-blue-200)
  }
  paper-button.month {
    min-width: 6em;
    padding: 8px 0;
  }    
  paper-button.year {
    min-width: 3.6em;
    padding: 8px 0;
  }
  paper-button.valued, paper-button.valued[disabled] {
    border: 1px solid var(--paper-grey-300);
    background-color: var(--paper-yellow-200);
  }
  th.weekend {
    color: var(--paper-grey-400);
  }
  th.weekday {
    color: var(--paper-grey-500);
  }
  td paper-slider {
    width: 100%;
  }
  #nav {
    color: var(--paper-blue-700);
    padding-top: 6px;
  }
  div.current #nav {
    margin-left: 4px;
  }
  #nav paper-icon-button {
    padding: 2px;
    width: 24px;
    height: 24px;
  }
  div.todor paper-button {
    margin: 0;
    vertical-align: middle;    
  }
  div.todor div.range paper-button[disabled] {
    background-color: transparent;
    color: var(--paper-blue-700);
    font-size: .6em;
  }
  div.range {
    flex: 1.0;
    text-align: center;
  }
  div.single {
    flex: 1.0;
    color: var(--paper-blue-700);
    line-height: 39px;
    text-align: center;
  }
  paper-button.alarm {
    color: var(--paper-red-500);
  }
  @media screen and (max-width: 480px) {
    paper-dialog {
      margin: 24px 0;
    }
    div.panel {
      padding: 0 10px;
    }
  }
  div.icon {
    display:flex;
    align-items:var(--icon-align-items, flex-end);
    height:100%;
  }
</style>
<paper-input type="search"
  ?always-float-label=${alwaysFloatLabel}
  label="${label}"
  value="${this.value||''}"
  @value-changed=${evt => this._inputChanged(evt)}
  auto-focus
  ?disabled=${disabled}
  ?readOnly=${readOnly}
  ?auto-validate=${!_confirmDisabled}
  ?required=${this.required}
  ?invalid=${_confirmDisabled}
  pattern="${this.__pattern.toString().replace(/^\/|\/$/g,'')}"
  @invalid-changed=${evt => this.invalid = evt.detail.value}
  @keydown=${evt => this._keyPressed(evt)}>
  ${icon?html`<paper-icon-button title="${label}" slot="prefix" icon="${icon}"></paper-icon-button>`:''}
  <paper-icon-button title="…" slot="suffix" icon="date-range" @tap=${evt => this._popup(evt)}></paper-icon-button>
</paper-input>
<paper-dialog id="mypop" horizontal-align="center" vertical-align="auto">
  <div class="panel">
${
  html`<div class="todor">
    ${!range?html`<div class="single">${_from.date+(!timed?'':(' ' + _from.time))}</div>`:
      html`<div class="range">
      <paper-button raised ?disabled=${!this._index} @tap=${_ => this._index=0}>${(!this._index || !timed ? _from.date : _from.date.substr(5))+(!timed?'':(' ' + _from.time))}</paper-button>
      ~
      <paper-button raised ?disabled=${this._index==1} @tap=${_ => this._index=1}>${(this._index==1 || !timed ? _to.date : _to.date.substr(5))+(!timed?'':(' ' + _to.time))}</paper-button>
    </div>`}${todo}
  </div>`
}
<div class="current">
  <div class="values">
    <paper-button ?raised="${tab!='YEAR'}" class="${tab!='YEAR'?(this._disabled(y)?'alarm':''):'actived'}" @tap="${_ => { this._tabSwitch('YEAR', y) } }">${ymd[0]}</paper-button>
    <paper-button ?raised="${tab!='MONTH'}" class="${tab!='MONTH'?(this._disabled(y,m)?'alarm':''):'actived'}" @tap="${_ => { this._tabSwitch('MONTH') } }">${ymd[1]}</paper-button>
    <paper-button ?raised="${tab!='DATE'}" class="${tab!='DATE'?(this._disabled(y,m,d)?'alarm':''):'actived'}" @tap="${_ => { this._tabSwitch('DATE') } }">${ymd[2]}</paper-button>
${!timed?'': html`<paper-button ?raised="${tab!='TIME'}" class="${tab!='TIME'?'':'actived'}" @tap="${_ => { this._tabSwitch('TIME') } }">${_current.time}</paper-button>`}
  </div>
  <div id="nav">
    <paper-icon-button icon="chevron-left" @tap="${_ => this._setMonth(m-1)}" ?disabled="${this._disabled(y, m-1)}"></paper-icon-button>
    <paper-icon-button icon="restore" title="${this._text('CURRENT')}" @tap="${ _ => this._set(new Date()) }" ?disabled="${this._disabled(now.getFullYear(), now.getMonth()+1)}"></paper-icon-button>
    <paper-icon-button icon="chevron-right" @tap="${_ => this._setMonth(m+1)}" ?disabled="${this._disabled(y, m+1)}"></paper-icon-button>
  </div>
</div>
<table class="${tab.toLowerCase()}">${ tab=='DATE' ? this._days({cy:y,cm:m,cd:d}, y, m) : (
  tab=='YEAR' ? this._years(this._year, y) :
  (tab=='MONTH' ? this._months(m, y) :
  (tab=='TIME' ? this._hours(_current.time, y, m, d) : ''))
)}</table>
  </div>
</paper-dialog>
    `
  }

  _popup(evt) {
    const mypop = this.renderRoot.querySelector('#mypop');
    this._values = undefined; // reset
    this.tab = 'DATE';
    mypop.open();
  }
}

window.customElements.define('mif-time', MifTime);