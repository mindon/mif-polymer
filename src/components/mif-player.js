// base on https://github.com/gorork/paper-audio-player
import {LitElement, html, customElement} from '@polymer/lit-element';

class MifPlayer extends LitElement {
  static get properties() {
    return {
      type: {type: String}, // audio | video
      src: {type: String},
      controls: {type: Boolean},
      preload: {type: String},
      volume: {type: Number},
      autoplay: {type: Boolean},
      poster: {type: String},
      _error: {type: String},
    }
  }

  constructor() {
    super();
    this._videoSupports = [
      {rule: /\.mpeg([\?&#].*)?$/i, type: 'video/mpeg'},
      {rule: /\.mpg([\?&#].*)?$/i, type: 'video/mpeg'},
      {rule: /\.avi([\?&#].*)?$/i, type: 'video/avi'},
      {rule: /\.mp4([\?&#].*)?$/i, type: 'video/mp4'},
      {rule: /\.ogg([\?&#].*)?$/i, type: 'video/ogg'},
      {rule: /\.webm([\?&#].*)?$/i, type: 'video/webm'},
    ];

    this._audioSupports = [
      {rule: /\.mp3([\?&#].*)?$/i, type: 'audio/mp3'},
      {rule: /\.m4a([\?&#].*)?$/i, type: 'audio/m4a'},
      {rule: /\.wav([\?&#].*)?$/i, type: 'audio/wav'},
    ];
  }

  _isType(src, ss) {
    for(let i=0; i<ss.length; i++) {
      if(ss[i].rule.test(src)) {
        return true;
      }
    }
    return false;
  }

  render() {
    const {src, controls, autoplay, preload, volume, poster} = this;
    let type = this.type;

    if(type == 'auto') {
      if(this._isType(src, this._videoSupports)) {
        type = 'video';
      } else {
        type = 'audio';
      }
      if(type != this.type) {
        this.pause();
        this.type = type;
      }
    }

    let opts = {controls, autoplay, preload, volume, poster};
    opts.position = 0; // TODO

    return html`<style>
:host {
  display: block;
  box-sizing: border-box;
  font-family: 'Roboto Mono', 'Helvetica Neue', Arial, sans-serif;
}
#process {
  -webkit-transform-origin: left center;
  transform-origin: left center;
  -webkit-transform: scaleX(0);
  transform: scaleX(0);
  will-change: transform;
  background-color: var(--process-color, #0052D9);
}
#error {
  color: var(--error-color, #f00);
}
audio {
  width: 100%;
}
video {
  width: 100%;
}
</style>
<div>
${
  type == 'video' ? this._video(src, opts) : this._audio(src, opts)
}<div><div id="process"></div></div>
${this._error ? html`<div id="error">${this._error}div></div>`: ''}
</div>
`
  }

  _player() {
    let _ctl = this._ctl, tag = this.type=='video' ? 'video' : 'audio';
    if(!_ctl || _ctl.tagName != tag.toUpperCase()) {
      _ctl = this.renderRoot.querySelector(tag);
      this._ctl = _ctl;
    }
    return _ctl;
  }

  play(src) {
    const m = this._player();
    if(!m) {
      console.error('invalid media type::' +this.type);
      return;
    }
    if(!src && this.status!='play') {
      m.play();
      return
    }
    this.pause(m);
    if(src) {
      m.currentTime = 0;
      if(this.src != src) {
        this._waiting = true;
        this.src = src;
        m.load();
      }
      m.play();
    }
  }

  pause(m) {
    if(!m) m = this._player();
    if(!m) {
      console.error('invalid media type::' +this.type);
      return;
    }
    m.pause();
    this._waiting = false;
  }

  reset(m) {
    if(!m) m = this._player();
    if(!m) {
      console.error('invalid media type::' +this.type);
      return;
    }
    m.currentTime = 0; // audio
  }

  config(opts) {
    for(let k in opts) {
      this[k] = opts[k];
    }
  }

  // status:  loading | can-play | playing | paused | ended
  // actions: load | play | pause | stop | currentTime=0 [0,duration]
  // keydown: left | down << / right | up >>  / space | enter > \\

  // 0 - duration
  // progress.style.transform = progress.style.webkitTransform = 'scaleX(' + (ratio / 100) + ')';

  // if preload="none", should load(), when loadedmetadata, update processing status and play
  _audio(src, {controls, autoplay, preload, volume, position}) {
    //preload: auto, metadata, none
    return html`<audio
  src="${src}"
  ?controls="${controls===undefined||controls?true:false}"
  ?autoplay="${autoplay||false}"
  volume="${volume||.3}"
  preload="${preload||'none'}"
  @loadedmetadata="${ evt => {
    this._fire('meta', evt);
    this.debugging && console.log(evt, 'loadedmetadata');
  }}"
  @durationchange="${ evt => {
    const duration = evt.target.duration;
    this._fire('duration', evt, {duration});
    this.debugging && console.log(evt, 'durationchange', evt.target.duration);
  }}"
  @play="${ evt => {
    this._fire('play', evt);
    this.debugging && console.log(evt, 'play');
  }}"
  @timeupdate="${ evt => {
    const currentTime = evt.target.currentTime;
    this._fire('time', evt, {currentTime});
    this.debugging && console.log(evt, 'timeupdate', evt.target.currentTime);
  }}"
  @pause="${ evt => {
    this._fire('pause', evt);
    this.debugging && console.log(evt, 'pause');
  }}"
  @ended="${ evt => {
    this._fire('ended', evt);
    this.debugging && console.log(evt, 'ended');
  }}"
  @error="${ evt => {
    this._fire('error', evt, evt.target.error);
    this.debugging && console.log(evt, evt.target.error, 'error');
  }}" controlsList="nodownload">
</audio>`
  }

   _video(src, {controls, autoplay, preload, volume, position, poster}) {
    let sources = [];
    if(!(src instanceof Array)) {
      sources.push(src);
    } else {
      sources = src;
    }
    const supports = this._videoSupports;
    return html`<video
  ?controls="${controls===undefined||controls?true:false}"
  ?autoplay="${autoplay||false}"
  volume="${volume||.3}"
  preload="${preload||'none'}"
  poster="${poster||'src/joox-beta/assets/logo.png'}"
  @loadedmetadata="${ evt => {
    this._fire('meta', evt);
    this.debugging && console.log(evt, 'loadedmetadata');
  }}"
  @durationchange="${ evt => {
    const duration = evt.target.duration;
    this._fire('duration', evt, {duration});
    this.debugging && console.log(evt, 'durationchange', evt.target.duration);
 }}"
  @play="${ evt => {
    this._fire('play', evt);
    this.debugging && console.log(evt, 'play');
  }}"
  @timeupdate="${ evt => {
    const currentTime = evt.target.currentTime;
    this._fire('time', evt, {currentTime});
    // console.log(evt, 'timeupdate', evt.target.currentTime);
  }}"
  @pause="${ evt => {
    this._fire('pause', evt);
    this.debugging && console.log(evt, 'pause');
  }}"
  @ended="${ evt => {
    this._fire('ended', evt);
    this.debugging && console.log(evt, 'ended');
  }}"
  @error="${ evt => {
    this._fire('error', evt, evt.target.error);
    this.debugging && console.log(evt, evt.target.error, 'error');
  }}" controlsList="nodownload">${
      sources.map(src => {
        let vt = '';
        for(let i=0; i<supports.length; i++) {
          if(supports[i].rule.test(src)) {
            vt = supports[i].type;
            break
          }
        }
        return html`<source src="${src}" type="${vt}" />`
      })
}</video>`
  }

  _fire(status, evt, detail) {
    if(status != 'time') {
      if(detail) {
        if(detail.duration) {
          this.duration = detail.duration;
        } else if(status == 'error') {
          this.error = detail;
        }
      }
      if(this._waiting && (status == 'error' || status == 'pause' || status == 'play')) {
        this._waiting = false;
      }
      if(this.status != status) {
        if(this.status != 'error' || status != 'pause') {
          if(this.error && status != 'error') {
            this.error = null;
          }
          if(this._waiting && status=='meta') {
            this._player().play();
          }
          this.status = status;
          this.dispatchEvent(new CustomEvent("status-changed", {detail:status, target:this}));
        }
      }
    } else {
      if(this._waiting && detail.currentTime === 0) {
        this._waiting = false;
        this._player().play();
      }
      this.currentTime = detail.currentTime;
    }
    if(!detail) detail= {};
    detail.target = evt.target;
    this.dispatchEvent(new CustomEvent(evt.type, {detail:detail, target:this}));
  }
}

customElements.define('mif-player', MifPlayer);