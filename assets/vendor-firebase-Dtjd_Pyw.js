var t=Object.defineProperty,e=Object.defineProperties,n=Object.getOwnPropertyDescriptors,r=Object.getOwnPropertySymbols,s=Object.prototype.hasOwnProperty,i=Object.prototype.propertyIsEnumerable,o=(e,n,r)=>n in e?t(e,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[n]=r,a=(t,e)=>{for(var n in e||(e={}))s.call(e,n)&&o(t,n,e[n]);if(r)for(var n of r(e))i.call(e,n)&&o(t,n,e[n]);return t},u=(t,r)=>e(t,n(r)),c=(t,e,n)=>new Promise((r,s)=>{var i=t=>{try{a(n.next(t))}catch(e){s(e)}},o=t=>{try{a(n.throw(t))}catch(e){s(e)}},a=t=>t.done?r(t.value):Promise.resolve(t.value).then(i,o);a((n=n.apply(t,e)).next())});var h={};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const l=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let s=t.charCodeAt(r);s<128?e[n++]=s:s<2048?(e[n++]=s>>6|192,e[n++]=63&s|128):55296==(64512&s)&&r+1<t.length&&56320==(64512&t.charCodeAt(r+1))?(s=65536+((1023&s)<<10)+(1023&t.charCodeAt(++r)),e[n++]=s>>18|240,e[n++]=s>>12&63|128,e[n++]=s>>6&63|128,e[n++]=63&s|128):(e[n++]=s>>12|224,e[n++]=s>>6&63|128,e[n++]=63&s|128)}return e},d={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<t.length;s+=3){const e=t[s],i=s+1<t.length,o=i?t[s+1]:0,a=s+2<t.length,u=a?t[s+2]:0,c=e>>2,h=(3&e)<<4|o>>4;let l=(15&o)<<2|u>>6,d=63&u;a||(d=64,i||(l=64)),r.push(n[c],n[h],n[l],n[d])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(l(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):function(t){const e=[];let n=0,r=0;for(;n<t.length;){const s=t[n++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const i=t[n++];e[r++]=String.fromCharCode((31&s)<<6|63&i)}else if(s>239&&s<365){const i=((7&s)<<18|(63&t[n++])<<12|(63&t[n++])<<6|63&t[n++])-65536;e[r++]=String.fromCharCode(55296+(i>>10)),e[r++]=String.fromCharCode(56320+(1023&i))}else{const i=t[n++],o=t[n++];e[r++]=String.fromCharCode((15&s)<<12|(63&i)<<6|63&o)}}return e.join("")}(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<t.length;){const e=n[t.charAt(s++)],i=s<t.length?n[t.charAt(s)]:0;++s;const o=s<t.length?n[t.charAt(s)]:64;++s;const a=s<t.length?n[t.charAt(s)]:64;if(++s,null==e||null==i||null==o||null==a)throw new f;const u=e<<2|i>>4;if(r.push(u),64!==o){const t=i<<4&240|o>>2;if(r.push(t),64!==a){const t=o<<6&192|a;r.push(t)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class f extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const p=function(t){return function(t){const e=l(t);return d.encodeByteArray(e,!0)}(t).replace(/\./g,"")};
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const m=()=>
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof window)return window;throw new Error("Unable to locate global object.")}().__FIREBASE_DEFAULTS__,g=()=>{if("undefined"==typeof document)return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(n){return}const e=t&&function(t){try{return d.decodeString(t,!0)}catch(n){}return null}(t[1]);return e&&JSON.parse(e)},y=()=>{try{return m()||(()=>{if("undefined"==typeof process)return;const t=h.__FIREBASE_DEFAULTS__;return t?JSON.parse(t):void 0})()||g()}catch(t){return}},v=t=>{const e=(t=>{var e,n;return null==(n=null==(e=y())?void 0:e.emulatorHosts)?void 0:n[t]})(t);if(!e)return;const n=e.lastIndexOf(":");if(n<=0||n+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(n+1),10);return"["===e[0]?[e.substring(1,n-1),r]:[e.substring(0,n),r]},w=()=>{var t;return null==(t=y())?void 0:t.config};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class E{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,n)=>{e?this.reject(e):this.resolve(n),"function"==typeof t&&(this.promise.catch(()=>{}),1===t.length?t(e):t(e,n))}}}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _(){return!function(){var t;const e=null==(t=y())?void 0:t.forceEnvironment;if("node"===e)return!0;if("browser"===e)return!1;try{return"[object process]"===Object.prototype.toString.call(window.process)}catch(n){return!1}}()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}class b extends Error{constructor(t,e,n){super(e),this.code=t,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,b.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,T.prototype.create)}}class T{constructor(t,e,n){this.service=t,this.serviceName=e,this.errors=n}create(t,...e){const n=e[0]||{},r=`${this.service}/${t}`,s=this.errors[t],i=s?function(t,e){return t.replace(S,(t,n)=>{const r=e[n];return null!=r?String(r):`<${n}?>`})}(s,n):"Error",o=`${this.serviceName}: ${i} (${r}).`;return new b(r,o,n)}}const S=/\{\$([^}]+)}/g;function I(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const s of n){if(!r.includes(s))return!1;const n=t[s],i=e[s];if(C(n)&&C(i)){if(!I(n,i))return!1}else if(n!==i)return!1}for(const s of r)if(!n.includes(s))return!1;return!0}function C(t){return null!==t&&"object"==typeof t}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function A(t){return t&&t._delegate?t._delegate:t}
/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function D(t){try{return(t.startsWith("http://")||t.startsWith("https://")?new URL(t).hostname:t).endsWith(".cloudworkstations.dev")}catch(e){return!1}}class N{constructor(t,e,n){this.name=t,this.instanceFactory=e,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const k="[DEFAULT]";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class R{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const t=new E;if(this.instancesDeferred.set(e,t),this.isInitialized(e)||this.shouldAutoInitialize())try{const n=this.getOrInitializeService({instanceIdentifier:e});n&&t.resolve(n)}catch(n){}}return this.instancesDeferred.get(e).promise}getImmediate(t){var e;const n=this.normalizeInstanceIdentifier(null==t?void 0:t.identifier),r=null!=(e=null==t?void 0:t.optional)&&e;if(!this.isInitialized(n)&&!this.shouldAutoInitialize()){if(r)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:n})}catch(s){if(r)return null;throw s}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,this.shouldAutoInitialize()){if(function(t){return"EAGER"===t.instantiationMode}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(t))try{this.getOrInitializeService({instanceIdentifier:k})}catch(e){}for(const[t,n]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const t=this.getOrInitializeService({instanceIdentifier:r});n.resolve(t)}catch(e){}}}}clearInstance(t=k){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}delete(){return c(this,null,function*(){const t=Array.from(this.instances.values());yield Promise.all([...t.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...t.filter(t=>"_delete"in t).map(t=>t._delete())])})}isComponentSet(){return null!=this.component}isInitialized(t=k){return this.instances.has(t)}getOptions(t=k){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,n=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:n,options:e});for(const[s,i]of this.instancesDeferred.entries()){n===this.normalizeInstanceIdentifier(s)&&i.resolve(r)}return r}onInit(t,e){var n;const r=this.normalizeInstanceIdentifier(e),s=null!=(n=this.onInitCallbacks.get(r))?n:new Set;s.add(t),this.onInitCallbacks.set(r,s);const i=this.instances.get(r);return i&&t(i,r),()=>{s.delete(t)}}invokeOnInitCallbacks(t,e){const n=this.onInitCallbacks.get(e);if(n)for(const s of n)try{s(t,e)}catch(r){}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let n=this.instances.get(t);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:(r=t,r===k?void 0:r),options:e}),this.instances.set(t,n),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(n,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,n)}catch(s){}var r;return n||null}normalizeInstanceIdentifier(t=k){return this.component?this.component.multipleInstances?t:k:t}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}class x{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new R(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var O,L;(L=O||(O={}))[L.DEBUG=0]="DEBUG",L[L.VERBOSE=1]="VERBOSE",L[L.INFO=2]="INFO",L[L.WARN=3]="WARN",L[L.ERROR=4]="ERROR",L[L.SILENT=5]="SILENT";const M={debug:O.DEBUG,verbose:O.VERBOSE,info:O.INFO,warn:O.WARN,error:O.ERROR,silent:O.SILENT},V=O.INFO,P={[O.DEBUG]:"log",[O.VERBOSE]:"log",[O.INFO]:"info",[O.WARN]:"warn",[O.ERROR]:"error"},F=(t,e,...n)=>{if(e<t.logLevel)return;(new Date).toISOString();if(!P[e])throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class U{constructor(t){this.name=t,this._logLevel=V,this._logHandler=F,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in O))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel="string"==typeof t?M[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if("function"!=typeof t)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,O.DEBUG,...t),this._logHandler(this,O.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,O.VERBOSE,...t),this._logHandler(this,O.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,O.INFO,...t),this._logHandler(this,O.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,O.WARN,...t),this._logHandler(this,O.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,O.ERROR,...t),this._logHandler(this,O.ERROR,...t)}}let B,j;const q=new WeakMap,$=new WeakMap,z=new WeakMap,G=new WeakMap,K=new WeakMap;let H={get(t,e,n){if(t instanceof IDBTransaction){if("done"===e)return $.get(t);if("objectStoreNames"===e)return t.objectStoreNames||z.get(t);if("store"===e)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return Y(t[e])},set:(t,e,n)=>(t[e]=n,!0),has:(t,e)=>t instanceof IDBTransaction&&("done"===e||"store"===e)||e in t};function Q(t){return t!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(j||(j=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(t)?function(...e){return t.apply(X(this),e),Y(q.get(this))}:function(...e){return Y(t.apply(X(this),e))}:function(e,...n){const r=t.call(X(this),e,...n);return z.set(r,e.sort?e.sort():[e]),Y(r)}}function W(t){return"function"==typeof t?Q(t):(t instanceof IDBTransaction&&function(t){if($.has(t))return;const e=new Promise((e,n)=>{const r=()=>{t.removeEventListener("complete",s),t.removeEventListener("error",i),t.removeEventListener("abort",i)},s=()=>{e(),r()},i=()=>{n(t.error||new DOMException("AbortError","AbortError")),r()};t.addEventListener("complete",s),t.addEventListener("error",i),t.addEventListener("abort",i)});$.set(t,e)}(t),e=t,(B||(B=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some(t=>e instanceof t)?new Proxy(t,H):t);var e}function Y(t){if(t instanceof IDBRequest)return function(t){const e=new Promise((e,n)=>{const r=()=>{t.removeEventListener("success",s),t.removeEventListener("error",i)},s=()=>{e(Y(t.result)),r()},i=()=>{n(t.error),r()};t.addEventListener("success",s),t.addEventListener("error",i)});return e.then(e=>{e instanceof IDBCursor&&q.set(e,t)}).catch(()=>{}),K.set(e,t),e}(t);if(G.has(t))return G.get(t);const e=W(t);return e!==t&&(G.set(t,e),K.set(e,t)),e}const X=t=>K.get(t);const J=["get","getKey","getAll","getAllKeys","count"],Z=["put","add","delete","clear"],tt=new Map;function et(t,e){if(!(t instanceof IDBDatabase)||e in t||"string"!=typeof e)return;if(tt.get(e))return tt.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,s=Z.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!s&&!J.includes(n))return;const i=function(t,...e){return c(this,null,function*(){const i=this.transaction(t,s?"readwrite":"readonly");let o=i.store;return r&&(o=o.index(e.shift())),(yield Promise.all([o[n](...e),s&&i.done]))[0]})};return tt.set(e,i),i}H=(t=>u(a({},t),{get:(e,n,r)=>et(e,n)||t.get(e,n,r),has:(e,n)=>!!et(e,n)||t.has(e,n)}))(H);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class nt{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(function(t){const e=t.getComponent();return"VERSION"===(null==e?void 0:e.type)}(t)){const e=t.getImmediate();return`${e.library}/${e.version}`}return null}).filter(t=>t).join(" ")}}const rt="@firebase/app",st="0.14.11",it=new U("@firebase/app"),ot="@firebase/app-compat",at="@firebase/analytics-compat",ut="@firebase/analytics",ct="@firebase/app-check-compat",ht="@firebase/app-check",lt="@firebase/auth",dt="@firebase/auth-compat",ft="@firebase/database",pt="@firebase/data-connect",mt="@firebase/database-compat",gt="@firebase/functions",yt="@firebase/functions-compat",vt="@firebase/installations",wt="@firebase/installations-compat",Et="@firebase/messaging",_t="@firebase/messaging-compat",bt="@firebase/performance",Tt="@firebase/performance-compat",St="@firebase/remote-config",It="@firebase/remote-config-compat",Ct="@firebase/storage",At="@firebase/storage-compat",Dt="@firebase/firestore",Nt="@firebase/ai",kt="@firebase/firestore-compat",Rt="firebase",xt="[DEFAULT]",Ot={[rt]:"fire-core",[ot]:"fire-core-compat",[ut]:"fire-analytics",[at]:"fire-analytics-compat",[ht]:"fire-app-check",[ct]:"fire-app-check-compat",[lt]:"fire-auth",[dt]:"fire-auth-compat",[ft]:"fire-rtdb",[pt]:"fire-data-connect",[mt]:"fire-rtdb-compat",[gt]:"fire-fn",[yt]:"fire-fn-compat",[vt]:"fire-iid",[wt]:"fire-iid-compat",[Et]:"fire-fcm",[_t]:"fire-fcm-compat",[bt]:"fire-perf",[Tt]:"fire-perf-compat",[St]:"fire-rc",[It]:"fire-rc-compat",[Ct]:"fire-gcs",[At]:"fire-gcs-compat",[Dt]:"fire-fst",[kt]:"fire-fst-compat",[Nt]:"fire-vertex","fire-js":"fire-js",[Rt]:"fire-js-all"},Lt=new Map,Mt=new Map,Vt=new Map;function Pt(t,e){try{t.container.addComponent(e)}catch(n){it.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function Ft(t){const e=t.name;if(Vt.has(e))return it.debug(`There were multiple attempts to register component ${e}.`),!1;Vt.set(e,t);for(const n of Lt.values())Pt(n,t);for(const n of Mt.values())Pt(n,t);return!0}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ut=new T("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."});
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Bt{constructor(t,e,n){this._isDeleted=!1,this._options=a({},t),this._config=a({},e),this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new N("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw Ut.create("app-deleted",{appName:this._name})}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jt(t,e={}){let n=t;if("object"!=typeof e){e={name:e}}const r=a({name:xt,automaticDataCollectionEnabled:!0},e),s=r.name;if("string"!=typeof s||!s)throw Ut.create("bad-app-name",{appName:String(s)});if(n||(n=w()),!n)throw Ut.create("no-options");const i=Lt.get(s);if(i){if(I(n,i.options)&&I(r,i.config))return i;throw Ut.create("duplicate-app",{appName:s})}const o=new x(s);for(const a of Vt.values())o.addComponent(a);const u=new Bt(n,r,o);return Lt.set(s,u),u}function qt(t,e,n){var r;let s=null!=(r=Ot[t])?r:t;n&&(s+=`-${n}`);const i=s.match(/\s|\//),o=e.match(/\s|\//);if(i||o){const t=[`Unable to register library "${s}" with version "${e}":`];return i&&t.push(`library name "${s}" contains illegal characters (whitespace or "/")`),i&&o&&t.push("and"),o&&t.push(`version name "${e}" contains illegal characters (whitespace or "/")`),void it.warn(t.join(" "))}Ft(new N(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $t="firebase-heartbeat-store";let zt=null;function Gt(){return zt||(zt=function(t,e,{blocked:n,upgrade:r,blocking:s,terminated:i}={}){const o=indexedDB.open(t,e),a=Y(o);return r&&o.addEventListener("upgradeneeded",t=>{r(Y(o.result),t.oldVersion,t.newVersion,Y(o.transaction),t)}),n&&o.addEventListener("blocked",t=>n(t.oldVersion,t.newVersion,t)),a.then(t=>{i&&t.addEventListener("close",()=>i()),s&&t.addEventListener("versionchange",t=>s(t.oldVersion,t.newVersion,t))}).catch(()=>{}),a}("firebase-heartbeat-database",1,{upgrade:(t,e)=>{if(0===e)try{t.createObjectStore($t)}catch(n){}}}).catch(t=>{throw Ut.create("idb-open",{originalErrorMessage:t.message})})),zt}function Kt(t,e){return c(this,null,function*(){try{const n=(yield Gt()).transaction($t,"readwrite"),r=n.objectStore($t);yield r.put(e,Ht(t)),yield n.done}catch(n){if(n instanceof b)it.warn(n.message);else{const t=Ut.create("idb-set",{originalErrorMessage:null==n?void 0:n.message});it.warn(t.message)}}})}function Ht(t){return`${t.name}!${t.options.appId}`}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qt{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Yt(e),this._heartbeatsCachePromise=this._storage.read().then(t=>(this._heartbeatsCache=t,t))}triggerHeartbeat(){return c(this,null,function*(){var t,e;try{const n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Wt();if(null==(null==(t=this._heartbeatsCache)?void 0:t.heartbeats)&&(this._heartbeatsCache=yield this._heartbeatsCachePromise,null==(null==(e=this._heartbeatsCache)?void 0:e.heartbeats)))return;if(this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(t=>t.date===r))return;if(this._heartbeatsCache.heartbeats.push({date:r,agent:n}),this._heartbeatsCache.heartbeats.length>30){const t=function(t){if(0===t.length)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(t,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){it.warn(n)}})}getHeartbeatsHeader(){return c(this,null,function*(){var t;try{if(null===this._heartbeatsCache&&(yield this._heartbeatsCachePromise),null==(null==(t=this._heartbeatsCache)?void 0:t.heartbeats)||0===this._heartbeatsCache.heartbeats.length)return"";const e=Wt(),{heartbeatsToSend:n,unsentEntries:r}=function(t,e=1024){const n=[];let r=t.slice();for(const s of t){const t=n.find(t=>t.agent===s.agent);if(t){if(t.dates.push(s.date),Xt(n)>e){t.dates.pop();break}}else if(n.push({agent:s.agent,dates:[s.date]}),Xt(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}(this._heartbeatsCache.heartbeats),s=p(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=e,r.length>0?(this._heartbeatsCache.heartbeats=r,yield this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(e){return it.warn(e),""}})}}function Wt(){return(new Date).toISOString().substring(0,10)}class Yt{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}runIndexedDBEnvironmentCheck(){return c(this,null,function*(){return!!function(){try{return"object"==typeof indexedDB}catch(t){return!1}}()&&new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},s.onupgradeneeded=()=>{n=!1},s.onerror=()=>{var t;e((null==(t=s.error)?void 0:t.message)||"")}}catch(n){e(n)}}).then(()=>!0).catch(()=>!1)})}read(){return c(this,null,function*(){if(yield this._canUseIndexedDBPromise){const t=yield function(t){return c(this,null,function*(){try{const e=(yield Gt()).transaction($t),n=yield e.objectStore($t).get(Ht(t));return yield e.done,n}catch(e){if(e instanceof b)it.warn(e.message);else{const t=Ut.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});it.warn(t.message)}}})}(this.app);return(null==t?void 0:t.heartbeats)?t:{heartbeats:[]}}return{heartbeats:[]}})}overwrite(t){return c(this,null,function*(){var e;if(yield this._canUseIndexedDBPromise){const n=yield this.read();return Kt(this.app,{lastSentHeartbeatDate:null!=(e=t.lastSentHeartbeatDate)?e:n.lastSentHeartbeatDate,heartbeats:t.heartbeats})}})}add(t){return c(this,null,function*(){var e;if(yield this._canUseIndexedDBPromise){const n=yield this.read();return Kt(this.app,{lastSentHeartbeatDate:null!=(e=t.lastSentHeartbeatDate)?e:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...t.heartbeats]})}})}}function Xt(t){return p(JSON.stringify({version:2,heartbeats:t})).length}var Jt;Jt="",Ft(new N("platform-logger",t=>new nt(t),"PRIVATE")),Ft(new N("heartbeat",t=>new Qt(t),"PRIVATE")),qt(rt,st,Jt),qt(rt,st,"esm2020"),qt("fire-js","");
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
qt("firebase","12.12.1","app");var Zt,te,ee="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window||"undefined"!=typeof window?window:"undefined"!=typeof self?self:{};
/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/(function(){var t;
/** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  */function e(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}function n(t,e,n){n||(n=0);const r=Array(16);if("string"==typeof e)for(var s=0;s<16;++s)r[s]=e.charCodeAt(n++)|e.charCodeAt(n++)<<8|e.charCodeAt(n++)<<16|e.charCodeAt(n++)<<24;else for(s=0;s<16;++s)r[s]=e[n++]|e[n++]<<8|e[n++]<<16|e[n++]<<24;e=t.g[0],n=t.g[1],s=t.g[2];let i,o=t.g[3];i=e+(o^n&(s^o))+r[0]+3614090360&4294967295,i=o+(s^(e=n+(i<<7&4294967295|i>>>25))&(n^s))+r[1]+3905402710&4294967295,o=e+(i<<12&4294967295|i>>>20),i=s+(n^o&(e^n))+r[2]+606105819&4294967295,i=n+(e^(s=o+(i<<17&4294967295|i>>>15))&(o^e))+r[3]+3250441966&4294967295,i=e+(o^(n=s+(i<<22&4294967295|i>>>10))&(s^o))+r[4]+4118548399&4294967295,i=o+(s^(e=n+(i<<7&4294967295|i>>>25))&(n^s))+r[5]+1200080426&4294967295,o=e+(i<<12&4294967295|i>>>20),i=s+(n^o&(e^n))+r[6]+2821735955&4294967295,i=n+(e^(s=o+(i<<17&4294967295|i>>>15))&(o^e))+r[7]+4249261313&4294967295,i=e+(o^(n=s+(i<<22&4294967295|i>>>10))&(s^o))+r[8]+1770035416&4294967295,i=o+(s^(e=n+(i<<7&4294967295|i>>>25))&(n^s))+r[9]+2336552879&4294967295,o=e+(i<<12&4294967295|i>>>20),i=s+(n^o&(e^n))+r[10]+4294925233&4294967295,i=n+(e^(s=o+(i<<17&4294967295|i>>>15))&(o^e))+r[11]+2304563134&4294967295,i=e+(o^(n=s+(i<<22&4294967295|i>>>10))&(s^o))+r[12]+1804603682&4294967295,i=o+(s^(e=n+(i<<7&4294967295|i>>>25))&(n^s))+r[13]+4254626195&4294967295,o=e+(i<<12&4294967295|i>>>20),i=s+(n^o&(e^n))+r[14]+2792965006&4294967295,i=n+(e^(s=o+(i<<17&4294967295|i>>>15))&(o^e))+r[15]+1236535329&4294967295,i=e+(s^o&((n=s+(i<<22&4294967295|i>>>10))^s))+r[1]+4129170786&4294967295,i=o+(n^s&((e=n+(i<<5&4294967295|i>>>27))^n))+r[6]+3225465664&4294967295,o=e+(i<<9&4294967295|i>>>23),i=s+(e^n&(o^e))+r[11]+643717713&4294967295,i=n+(o^e&((s=o+(i<<14&4294967295|i>>>18))^o))+r[0]+3921069994&4294967295,i=e+(s^o&((n=s+(i<<20&4294967295|i>>>12))^s))+r[5]+3593408605&4294967295,i=o+(n^s&((e=n+(i<<5&4294967295|i>>>27))^n))+r[10]+38016083&4294967295,o=e+(i<<9&4294967295|i>>>23),i=s+(e^n&(o^e))+r[15]+3634488961&4294967295,i=n+(o^e&((s=o+(i<<14&4294967295|i>>>18))^o))+r[4]+3889429448&4294967295,i=e+(s^o&((n=s+(i<<20&4294967295|i>>>12))^s))+r[9]+568446438&4294967295,i=o+(n^s&((e=n+(i<<5&4294967295|i>>>27))^n))+r[14]+3275163606&4294967295,o=e+(i<<9&4294967295|i>>>23),i=s+(e^n&(o^e))+r[3]+4107603335&4294967295,i=n+(o^e&((s=o+(i<<14&4294967295|i>>>18))^o))+r[8]+1163531501&4294967295,i=e+(s^o&((n=s+(i<<20&4294967295|i>>>12))^s))+r[13]+2850285829&4294967295,i=o+(n^s&((e=n+(i<<5&4294967295|i>>>27))^n))+r[2]+4243563512&4294967295,o=e+(i<<9&4294967295|i>>>23),i=s+(e^n&(o^e))+r[7]+1735328473&4294967295,i=n+(o^e&((s=o+(i<<14&4294967295|i>>>18))^o))+r[12]+2368359562&4294967295,i=e+((n=s+(i<<20&4294967295|i>>>12))^s^o)+r[5]+4294588738&4294967295,i=o+((e=n+(i<<4&4294967295|i>>>28))^n^s)+r[8]+2272392833&4294967295,o=e+(i<<11&4294967295|i>>>21),i=s+(o^e^n)+r[11]+1839030562&4294967295,i=n+((s=o+(i<<16&4294967295|i>>>16))^o^e)+r[14]+4259657740&4294967295,i=e+((n=s+(i<<23&4294967295|i>>>9))^s^o)+r[1]+2763975236&4294967295,i=o+((e=n+(i<<4&4294967295|i>>>28))^n^s)+r[4]+1272893353&4294967295,o=e+(i<<11&4294967295|i>>>21),i=s+(o^e^n)+r[7]+4139469664&4294967295,i=n+((s=o+(i<<16&4294967295|i>>>16))^o^e)+r[10]+3200236656&4294967295,i=e+((n=s+(i<<23&4294967295|i>>>9))^s^o)+r[13]+681279174&4294967295,i=o+((e=n+(i<<4&4294967295|i>>>28))^n^s)+r[0]+3936430074&4294967295,o=e+(i<<11&4294967295|i>>>21),i=s+(o^e^n)+r[3]+3572445317&4294967295,i=n+((s=o+(i<<16&4294967295|i>>>16))^o^e)+r[6]+76029189&4294967295,i=e+((n=s+(i<<23&4294967295|i>>>9))^s^o)+r[9]+3654602809&4294967295,i=o+((e=n+(i<<4&4294967295|i>>>28))^n^s)+r[12]+3873151461&4294967295,o=e+(i<<11&4294967295|i>>>21),i=s+(o^e^n)+r[15]+530742520&4294967295,i=n+((s=o+(i<<16&4294967295|i>>>16))^o^e)+r[2]+3299628645&4294967295,i=e+(s^((n=s+(i<<23&4294967295|i>>>9))|~o))+r[0]+4096336452&4294967295,i=o+(n^((e=n+(i<<6&4294967295|i>>>26))|~s))+r[7]+1126891415&4294967295,o=e+(i<<10&4294967295|i>>>22),i=s+(e^(o|~n))+r[14]+2878612391&4294967295,i=n+(o^((s=o+(i<<15&4294967295|i>>>17))|~e))+r[5]+4237533241&4294967295,i=e+(s^((n=s+(i<<21&4294967295|i>>>11))|~o))+r[12]+1700485571&4294967295,i=o+(n^((e=n+(i<<6&4294967295|i>>>26))|~s))+r[3]+2399980690&4294967295,o=e+(i<<10&4294967295|i>>>22),i=s+(e^(o|~n))+r[10]+4293915773&4294967295,i=n+(o^((s=o+(i<<15&4294967295|i>>>17))|~e))+r[1]+2240044497&4294967295,i=e+(s^((n=s+(i<<21&4294967295|i>>>11))|~o))+r[8]+1873313359&4294967295,i=o+(n^((e=n+(i<<6&4294967295|i>>>26))|~s))+r[15]+4264355552&4294967295,o=e+(i<<10&4294967295|i>>>22),i=s+(e^(o|~n))+r[6]+2734768916&4294967295,i=n+(o^((s=o+(i<<15&4294967295|i>>>17))|~e))+r[13]+1309151649&4294967295,i=e+(s^((n=s+(i<<21&4294967295|i>>>11))|~o))+r[4]+4149444226&4294967295,i=o+(n^((e=n+(i<<6&4294967295|i>>>26))|~s))+r[11]+3174756917&4294967295,o=e+(i<<10&4294967295|i>>>22),i=s+(e^(o|~n))+r[2]+718787259&4294967295,i=n+(o^((s=o+(i<<15&4294967295|i>>>17))|~e))+r[9]+3951481745&4294967295,t.g[0]=t.g[0]+e&4294967295,t.g[1]=t.g[1]+(s+(i<<21&4294967295|i>>>11))&4294967295,t.g[2]=t.g[2]+s&4294967295,t.g[3]=t.g[3]+o&4294967295}function r(t,e){this.h=e;const n=[];let r=!0;for(let s=t.length-1;s>=0;s--){const i=0|t[s];r&&i==e||(n[s]=i,r=!1)}this.g=n}!function(t,e){function n(){}n.prototype=e.prototype,t.F=e.prototype,t.prototype=new n,t.prototype.constructor=t,t.D=function(t,n,r){for(var s=Array(arguments.length-2),i=2;i<arguments.length;i++)s[i-2]=arguments[i];return e.prototype[n].apply(t,s)}}(e,function(){this.blockSize=-1}),e.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0},e.prototype.v=function(t,e){void 0===e&&(e=t.length);const r=e-this.blockSize,s=this.C;let i=this.h,o=0;for(;o<e;){if(0==i)for(;o<=r;)n(this,t,o),o+=this.blockSize;if("string"==typeof t){for(;o<e;)if(s[i++]=t.charCodeAt(o++),i==this.blockSize){n(this,s),i=0;break}}else for(;o<e;)if(s[i++]=t[o++],i==this.blockSize){n(this,s),i=0;break}}this.h=i,this.o+=e},e.prototype.A=function(){var t=Array((this.h<56?this.blockSize:2*this.blockSize)-this.h);t[0]=128;for(var e=1;e<t.length-8;++e)t[e]=0;e=8*this.o;for(var n=t.length-8;n<t.length;++n)t[n]=255&e,e/=256;for(this.v(t),t=Array(16),e=0,n=0;n<4;++n)for(let r=0;r<32;r+=8)t[e++]=this.g[n]>>>r&255;return t};var s={};function i(t){return-128<=t&&t<128?function(t,e){var n=s;return Object.prototype.hasOwnProperty.call(n,t)?n[t]:n[t]=e(t)}(t,function(t){return new r([0|t],t<0?-1:0)}):new r([0|t],t<0?-1:0)}function o(t){if(isNaN(t)||!isFinite(t))return a;if(t<0)return d(o(-t));const e=[];let n=1;for(let r=0;t>=n;r++)e[r]=t/n|0,n*=4294967296;return new r(e,0)}var a=i(0),u=i(1),c=i(16777216);function h(t){if(0!=t.h)return!1;for(let e=0;e<t.g.length;e++)if(0!=t.g[e])return!1;return!0}function l(t){return-1==t.h}function d(t){const e=t.g.length,n=[];for(let r=0;r<e;r++)n[r]=~t.g[r];return new r(n,~t.h).add(u)}function f(t,e){return t.add(d(e))}function p(t,e){for(;(65535&t[e])!=t[e];)t[e+1]+=t[e]>>>16,t[e]&=65535,e++}function m(t,e){this.g=t,this.h=e}function g(t,e){if(h(e))throw Error("division by zero");if(h(t))return new m(a,a);if(l(t))return e=g(d(t),e),new m(d(e.g),d(e.h));if(l(e))return e=g(t,d(e)),new m(d(e.g),e.h);if(t.g.length>30){if(l(t)||l(e))throw Error("slowDivide_ only works with positive integers.");for(var n=u,r=e;r.l(t)<=0;)n=y(n),r=y(r);var s=v(n,1),i=v(r,1);for(r=v(r,2),n=v(n,2);!h(r);){var c=i.add(r);c.l(t)<=0&&(s=s.add(n),i=c),r=v(r,1),n=v(n,1)}return e=f(t,s.j(e)),new m(s,e)}for(s=a;t.l(e)>=0;){for(n=Math.max(1,Math.floor(t.m()/e.m())),r=(r=Math.ceil(Math.log(n)/Math.LN2))<=48?1:Math.pow(2,r-48),c=(i=o(n)).j(e);l(c)||c.l(t)>0;)c=(i=o(n-=r)).j(e);h(i)&&(i=u),s=s.add(i),t=f(t,c)}return new m(s,t)}function y(t){const e=t.g.length+1,n=[];for(let r=0;r<e;r++)n[r]=t.i(r)<<1|t.i(r-1)>>>31;return new r(n,t.h)}function v(t,e){const n=e>>5;e%=32;const s=t.g.length-n,i=[];for(let r=0;r<s;r++)i[r]=e>0?t.i(r+n)>>>e|t.i(r+n+1)<<32-e:t.i(r+n);return new r(i,t.h)}(t=r.prototype).m=function(){if(l(this))return-d(this).m();let t=0,e=1;for(let n=0;n<this.g.length;n++){const r=this.i(n);t+=(r>=0?r:4294967296+r)*e,e*=4294967296}return t},t.toString=function(t){if((t=t||10)<2||36<t)throw Error("radix out of range: "+t);if(h(this))return"0";if(l(this))return"-"+d(this).toString(t);const e=o(Math.pow(t,6));var n=this;let r="";for(;;){const s=g(n,e).g;let i=(((n=f(n,s.j(e))).g.length>0?n.g[0]:n.h)>>>0).toString(t);if(h(n=s))return i+r;for(;i.length<6;)i="0"+i;r=i+r}},t.i=function(t){return t<0?0:t<this.g.length?this.g[t]:this.h},t.l=function(t){return l(t=f(this,t))?-1:h(t)?0:1},t.abs=function(){return l(this)?d(this):this},t.add=function(t){const e=Math.max(this.g.length,t.g.length),n=[];let s=0;for(let r=0;r<=e;r++){let e=s+(65535&this.i(r))+(65535&t.i(r)),i=(e>>>16)+(this.i(r)>>>16)+(t.i(r)>>>16);s=i>>>16,e&=65535,i&=65535,n[r]=i<<16|e}return new r(n,-2147483648&n[n.length-1]?-1:0)},t.j=function(t){if(h(this)||h(t))return a;if(l(this))return l(t)?d(this).j(d(t)):d(d(this).j(t));if(l(t))return d(this.j(d(t)));if(this.l(c)<0&&t.l(c)<0)return o(this.m()*t.m());const e=this.g.length+t.g.length,n=[];for(var s=0;s<2*e;s++)n[s]=0;for(s=0;s<this.g.length;s++)for(let e=0;e<t.g.length;e++){const r=this.i(s)>>>16,i=65535&this.i(s),o=t.i(e)>>>16,a=65535&t.i(e);n[2*s+2*e]+=i*a,p(n,2*s+2*e),n[2*s+2*e+1]+=r*a,p(n,2*s+2*e+1),n[2*s+2*e+1]+=i*o,p(n,2*s+2*e+1),n[2*s+2*e+2]+=r*o,p(n,2*s+2*e+2)}for(t=0;t<e;t++)n[t]=n[2*t+1]<<16|n[2*t];for(t=e;t<2*e;t++)n[t]=0;return new r(n,0)},t.B=function(t){return g(this,t).h},t.and=function(t){const e=Math.max(this.g.length,t.g.length),n=[];for(let r=0;r<e;r++)n[r]=this.i(r)&t.i(r);return new r(n,this.h&t.h)},t.or=function(t){const e=Math.max(this.g.length,t.g.length),n=[];for(let r=0;r<e;r++)n[r]=this.i(r)|t.i(r);return new r(n,this.h|t.h)},t.xor=function(t){const e=Math.max(this.g.length,t.g.length),n=[];for(let r=0;r<e;r++)n[r]=this.i(r)^t.i(r);return new r(n,this.h^t.h)},e.prototype.digest=e.prototype.A,e.prototype.reset=e.prototype.u,e.prototype.update=e.prototype.v,te=e,r.prototype.add=r.prototype.add,r.prototype.multiply=r.prototype.j,r.prototype.modulo=r.prototype.B,r.prototype.compare=r.prototype.l,r.prototype.toNumber=r.prototype.m,r.prototype.toString=r.prototype.toString,r.prototype.getBits=r.prototype.i,r.fromNumber=o,r.fromString=function t(e,n){if(0==e.length)throw Error("number format error: empty string");if((n=n||10)<2||36<n)throw Error("radix out of range: "+n);if("-"==e.charAt(0))return d(t(e.substring(1),n));if(e.indexOf("-")>=0)throw Error('number format error: interior "-" character');const r=o(Math.pow(n,8));let s=a;for(let a=0;a<e.length;a+=8){var i=Math.min(8,e.length-a);const t=parseInt(e.substring(a,a+i),n);i<8?(i=o(Math.pow(n,i)),s=s.j(i).add(o(t))):(s=s.j(r),s=s.add(o(t)))}return s},Zt=r}).apply(void 0!==ee?ee:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var ne,re,se,ie,oe,ae,ue,ce,he="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window||"undefined"!=typeof window?window:"undefined"!=typeof self?self:{};
/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/(function(){var t,e=Object.defineProperty;var n=function(t){t=["object"==typeof globalThis&&globalThis,t,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof he&&he];for(var e=0;e<t.length;++e){var n=t[e];if(n&&n.Math==Math)return n}throw Error("Cannot find global object")}(this);function r(t,r){if(r)t:{var s=n;t=t.split(".");for(var i=0;i<t.length-1;i++){var o=t[i];if(!(o in s))break t;s=s[o]}(r=r(i=s[t=t[t.length-1]]))!=i&&null!=r&&e(s,t,{configurable:!0,writable:!0,value:r})}}r("Symbol.dispose",function(t){return t||Symbol("Symbol.dispose")}),r("Array.prototype.values",function(t){return t||function(){return this[Symbol.iterator]()}}),r("Object.entries",function(t){return t||function(t){var e,n=[];for(e in t)Object.prototype.hasOwnProperty.call(t,e)&&n.push([e,t[e]]);return n}});
/** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  */
var s=s||{},i=this||self;function o(t){var e=typeof t;return"object"==e&&null!=t||"function"==e}function a(t,e,n){return t.call.apply(t.bind,arguments)}function u(t,e,n){return(u=a).apply(null,arguments)}function c(t,e){var n=Array.prototype.slice.call(arguments,1);return function(){var e=n.slice();return e.push.apply(e,arguments),t.apply(this,e)}}function h(t,e){function n(){}n.prototype=e.prototype,t.Z=e.prototype,t.prototype=new n,t.prototype.constructor=t,t.Ob=function(t,n,r){for(var s=Array(arguments.length-2),i=2;i<arguments.length;i++)s[i-2]=arguments[i];return e.prototype[n].apply(t,s)}}var l="undefined"!=typeof AsyncContext&&"function"==typeof AsyncContext.Snapshot?t=>t&&AsyncContext.Snapshot.wrap(t):t=>t;function d(t){const e=t.length;if(e>0){const n=Array(e);for(let r=0;r<e;r++)n[r]=t[r];return n}return[]}function f(t,e){for(let r=1;r<arguments.length;r++){const e=arguments[r];var n=typeof e;if("array"==(n="object"!=n?n:e?Array.isArray(e)?"array":n:"null")||"object"==n&&"number"==typeof e.length){n=t.length||0;const r=e.length||0;t.length=n+r;for(let s=0;s<r;s++)t[n+s]=e[s]}else t.push(e)}}function p(t){i.setTimeout(()=>{throw t},0)}function m(){var t=E;let e=null;return t.g&&(e=t.g,t.g=t.g.next,t.g||(t.h=null),e.next=null),e}var g=new class{constructor(t,e){this.i=t,this.j=e,this.h=0,this.g=null}get(){let t;return this.h>0?(this.h--,t=this.g,this.g=t.next,t.next=null):t=this.i(),t}}(()=>new y,t=>t.reset());class y{constructor(){this.next=this.g=this.h=null}set(t,e){this.h=t,this.g=e,this.next=null}reset(){this.next=this.g=this.h=null}}let v,w=!1,E=new class{constructor(){this.h=this.g=null}add(t,e){const n=g.get();n.set(t,e),this.h?this.h.next=n:this.g=n,this.h=n}},_=()=>{const t=Promise.resolve(void 0);v=()=>{t.then(b)}};function b(){for(var t;t=m();){try{t.h.call(t.g)}catch(n){p(n)}var e=g;e.j(t),e.h<100&&(e.h++,t.next=e.g,e.g=t)}w=!1}function T(){this.u=this.u,this.C=this.C}function S(t,e){this.type=t,this.g=this.target=e,this.defaultPrevented=!1}T.prototype.u=!1,T.prototype.dispose=function(){this.u||(this.u=!0,this.N())},T.prototype[Symbol.dispose]=function(){this.dispose()},T.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()},S.prototype.h=function(){this.defaultPrevented=!0};var I=function(){if(!i.addEventListener||!Object.defineProperty)return!1;var t=!1,e=Object.defineProperty({},"passive",{get:function(){t=!0}});try{const t=()=>{};i.addEventListener("test",t,e),i.removeEventListener("test",t,e)}catch(n){}return t}();function C(t){return/^[\s\xa0]*$/.test(t)}function A(t,e){S.call(this,t?t.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,t&&this.init(t,e)}h(A,S),A.prototype.init=function(t,e){const n=this.type=t.type,r=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:null;this.target=t.target||t.srcElement,this.g=e,(e=t.relatedTarget)||("mouseover"==n?e=t.fromElement:"mouseout"==n&&(e=t.toElement)),this.relatedTarget=e,r?(this.clientX=void 0!==r.clientX?r.clientX:r.pageX,this.clientY=void 0!==r.clientY?r.clientY:r.pageY,this.screenX=r.screenX||0,this.screenY=r.screenY||0):(this.clientX=void 0!==t.clientX?t.clientX:t.pageX,this.clientY=void 0!==t.clientY?t.clientY:t.pageY,this.screenX=t.screenX||0,this.screenY=t.screenY||0),this.button=t.button,this.key=t.key||"",this.ctrlKey=t.ctrlKey,this.altKey=t.altKey,this.shiftKey=t.shiftKey,this.metaKey=t.metaKey,this.pointerId=t.pointerId||0,this.pointerType=t.pointerType,this.state=t.state,this.i=t,t.defaultPrevented&&A.Z.h.call(this)},A.prototype.h=function(){A.Z.h.call(this);const t=this.i;t.preventDefault?t.preventDefault():t.returnValue=!1};var D="closure_listenable_"+(1e6*Math.random()|0),N=0;function k(t,e,n,r,s){this.listener=t,this.proxy=null,this.src=e,this.type=n,this.capture=!!r,this.ha=s,this.key=++N,this.da=this.fa=!1}function R(t){t.da=!0,t.listener=null,t.proxy=null,t.src=null,t.ha=null}function x(t,e,n){for(const r in t)e.call(n,t[r],r,t)}function O(t){const e={};for(const n in t)e[n]=t[n];return e}const L="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function M(t,e){let n,r;for(let s=1;s<arguments.length;s++){for(n in r=arguments[s],r)t[n]=r[n];for(let e=0;e<L.length;e++)n=L[e],Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}}function V(t){this.src=t,this.g={},this.h=0}function P(t,e){const n=e.type;if(n in t.g){var r,s=t.g[n],i=Array.prototype.indexOf.call(s,e,void 0);(r=i>=0)&&Array.prototype.splice.call(s,i,1),r&&(R(e),0==t.g[n].length&&(delete t.g[n],t.h--))}}function F(t,e,n,r){for(let s=0;s<t.length;++s){const i=t[s];if(!i.da&&i.listener==e&&i.capture==!!n&&i.ha==r)return s}return-1}V.prototype.add=function(t,e,n,r,s){const i=t.toString();(t=this.g[i])||(t=this.g[i]=[],this.h++);const o=F(t,e,r,s);return o>-1?(e=t[o],n||(e.fa=!1)):((e=new k(e,this.src,i,!!r,s)).fa=n,t.push(e)),e};var U="closure_lm_"+(1e6*Math.random()|0),B={};function j(t,e,n,r,s){if(Array.isArray(e)){for(let i=0;i<e.length;i++)j(t,e[i],n,r,s);return null}return n=Q(n),t&&t[D]?t.J(e,n,!!o(r)&&!!r.capture,s):function(t,e,n,r,s,i){if(!e)throw Error("Invalid event type");const a=o(s)?!!s.capture:!!s;let u=K(t);if(u||(t[U]=u=new V(t)),n=u.add(e,n,r,a,i),n.proxy)return n;if(r=function(){function t(n){return e.call(t.src,t.listener,n)}const e=G;return t}(),n.proxy=r,r.src=t,r.listener=n,t.addEventListener)I||(s=a),void 0===s&&(s=!1),t.addEventListener(e.toString(),r,s);else if(t.attachEvent)t.attachEvent(z(e.toString()),r);else{if(!t.addListener||!t.removeListener)throw Error("addEventListener and attachEvent are unavailable.");t.addListener(r)}return n}(t,e,n,!1,r,s)}function q(t,e,n,r,s){if(Array.isArray(e))for(var i=0;i<e.length;i++)q(t,e[i],n,r,s);else r=o(r)?!!r.capture:!!r,n=Q(n),t&&t[D]?(t=t.i,(i=String(e).toString())in t.g&&((n=F(e=t.g[i],n,r,s))>-1&&(R(e[n]),Array.prototype.splice.call(e,n,1),0==e.length&&(delete t.g[i],t.h--)))):t&&(t=K(t))&&(e=t.g[e.toString()],t=-1,e&&(t=F(e,n,r,s)),(n=t>-1?e[t]:null)&&$(n))}function $(t){if("number"!=typeof t&&t&&!t.da){var e=t.src;if(e&&e[D])P(e.i,t);else{var n=t.type,r=t.proxy;e.removeEventListener?e.removeEventListener(n,r,t.capture):e.detachEvent?e.detachEvent(z(n),r):e.addListener&&e.removeListener&&e.removeListener(r),(n=K(e))?(P(n,t),0==n.h&&(n.src=null,e[U]=null)):R(t)}}}function z(t){return t in B?B[t]:B[t]="on"+t}function G(t,e){if(t.da)t=!0;else{e=new A(e,this);const n=t.listener,r=t.ha||t.src;t.fa&&$(t),t=n.call(r,e)}return t}function K(t){return(t=t[U])instanceof V?t:null}var H="__closure_events_fn_"+(1e9*Math.random()>>>0);function Q(t){return"function"==typeof t?t:(t[H]||(t[H]=function(e){return t.handleEvent(e)}),t[H])}function W(){T.call(this),this.i=new V(this),this.M=this,this.G=null}function Y(t,e){var n,r=t.G;if(r)for(n=[];r;r=r.G)n.push(r);if(t=t.M,r=e.type||e,"string"==typeof e)e=new S(e,t);else if(e instanceof S)e.target=e.target||t;else{var s=e;M(e=new S(r,t),s)}let i,o;if(s=!0,n)for(o=n.length-1;o>=0;o--)i=e.g=n[o],s=X(i,r,!0,e)&&s;if(i=e.g=t,s=X(i,r,!0,e)&&s,s=X(i,r,!1,e)&&s,n)for(o=0;o<n.length;o++)i=e.g=n[o],s=X(i,r,!1,e)&&s}function X(t,e,n,r){if(!(e=t.i.g[String(e)]))return!0;e=e.concat();let s=!0;for(let i=0;i<e.length;++i){const o=e[i];if(o&&!o.da&&o.capture==n){const e=o.listener,n=o.ha||o.src;o.fa&&P(t.i,o),s=!1!==e.call(n,r)&&s}}return s&&!r.defaultPrevented}function J(t){t.g=function(t,e){if("function"!=typeof t){if(!t||"function"!=typeof t.handleEvent)throw Error("Invalid listener argument");t=u(t.handleEvent,t)}return Number(e)>2147483647?-1:i.setTimeout(t,e||0)}(()=>{t.g=null,t.i&&(t.i=!1,J(t))},t.l);const e=t.h;t.h=null,t.m.apply(null,e)}h(W,T),W.prototype[D]=!0,W.prototype.removeEventListener=function(t,e,n,r){q(this,t,e,n,r)},W.prototype.N=function(){if(W.Z.N.call(this),this.i){var t=this.i;for(const e in t.g){const n=t.g[e];for(let t=0;t<n.length;t++)R(n[t]);delete t.g[e],t.h--}}this.G=null},W.prototype.J=function(t,e,n,r){return this.i.add(String(t),e,!1,n,r)},W.prototype.K=function(t,e,n,r){return this.i.add(String(t),e,!0,n,r)};class Z extends T{constructor(t,e){super(),this.m=t,this.l=e,this.h=null,this.i=!1,this.g=null}j(t){this.h=arguments,this.g?this.i=!0:J(this)}N(){super.N(),this.g&&(i.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function tt(t){T.call(this),this.h=t,this.g={}}h(tt,T);var et=[];function nt(t){x(t.g,function(t,e){this.g.hasOwnProperty(e)&&$(t)},t),t.g={}}tt.prototype.N=function(){tt.Z.N.call(this),nt(this)},tt.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var rt=i.JSON.stringify,st=i.JSON.parse,it=class{stringify(t){return i.JSON.stringify(t,void 0)}parse(t){return i.JSON.parse(t,void 0)}};function ot(){}function at(){}var ut={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function ct(){S.call(this,"d")}function ht(){S.call(this,"c")}h(ct,S),h(ht,S);var lt={},dt=null;function ft(){return dt=dt||new W}function pt(t){S.call(this,lt.Ia,t)}function mt(t){const e=ft();Y(e,new pt(e))}function gt(t,e){S.call(this,lt.STAT_EVENT,t),this.stat=e}function yt(t){const e=ft();Y(e,new gt(e,t))}function vt(t,e){S.call(this,lt.Ja,t),this.size=e}function wt(t,e){if("function"!=typeof t)throw Error("Fn must not be null and must be a function");return i.setTimeout(function(){t()},e)}function Et(){this.g=!0}function _t(t,e,n,r){t.info(function(){return"XMLHTTP TEXT ("+e+"): "+function(t,e){if(!t.g)return e;if(!e)return null;try{const i=JSON.parse(e);if(i)for(t=0;t<i.length;t++)if(Array.isArray(i[t])){var n=i[t];if(!(n.length<2)){var r=n[1];if(Array.isArray(r)&&!(r.length<1)){var s=r[0];if("noop"!=s&&"stop"!=s&&"close"!=s)for(let t=1;t<r.length;t++)r[t]=""}}}return rt(i)}catch(i){return e}}(t,n)+(r?" "+r:"")})}lt.Ia="serverreachability",h(pt,S),lt.STAT_EVENT="statevent",h(gt,S),lt.Ja="timingevent",h(vt,S),Et.prototype.ua=function(){this.g=!1},Et.prototype.info=function(){};var bt,Tt={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},St={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"};function It(){}function Ct(t){return encodeURIComponent(String(t))}function At(t){var e=1;t=t.split(":");const n=[];for(;e>0&&t.length;)n.push(t.shift()),e--;return t.length&&n.push(t.join(":")),n}function Dt(t,e,n,r){this.j=t,this.i=e,this.l=n,this.S=r||1,this.V=new tt(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Nt}function Nt(){this.i=null,this.g="",this.h=!1}h(It,ot),It.prototype.g=function(){return new XMLHttpRequest},bt=new It;var kt={},Rt={};function xt(t,e,n){t.M=1,t.A=de(Jt(e)),t.u=n,t.R=!0,Ot(t,null)}function Ot(t,e){t.F=Date.now(),Vt(t),t.B=Jt(t.A);var n=t.B,r=t.S;Array.isArray(r)||(r=[String(r)]),Ce(n.i,"t",r),t.C=0,n=t.j.L,t.h=new Nt,t.g=fn(t.j,n?e:null,!t.u),t.P>0&&(t.O=new Z(u(t.Y,t,t.g),t.P)),e=t.V,n=t.g,r=t.ba;var s="readystatechange";Array.isArray(s)||(s&&(et[0]=s.toString()),s=et);for(let i=0;i<s.length;i++){const t=j(n,s[i],r||e.handleEvent,!1,e.h||e);if(!t)break;e.g[t.key]=t}e=t.J?O(t.J):{},t.u?(t.v||(t.v="POST"),e["Content-Type"]="application/x-www-form-urlencoded",t.g.ea(t.B,t.v,t.u,e)):(t.v="GET",t.g.ea(t.B,t.v,null,e)),mt(),function(t,e,n,r,s,i){t.info(function(){if(t.g)if(i){var o="",a=i.split("&");for(let t=0;t<a.length;t++){var u=a[t].split("=");if(u.length>1){const t=u[0];u=u[1];const e=t.split("_");o=e.length>=2&&"type"==e[1]?o+(t+"=")+u+"&":o+(t+"=redacted&")}}}else o=null;else o=i;return"XMLHTTP REQ ("+r+") [attempt "+s+"]: "+e+"\n"+n+"\n"+o})}(t.i,t.v,t.B,t.l,t.S,t.u)}function Lt(t){return!!t.g&&("GET"==t.v&&2!=t.M&&t.j.Aa)}function Mt(t,e){var n=t.C,r=e.indexOf("\n",n);return-1==r?Rt:(n=Number(e.substring(n,r)),isNaN(n)?kt:(r+=1)+n>e.length?Rt:(e=e.slice(r,r+n),t.C=r+n,e))}function Vt(t){t.T=Date.now()+t.H,Pt(t,t.H)}function Pt(t,e){if(null!=t.D)throw Error("WatchDog timer not null");t.D=wt(u(t.aa,t),e)}function Ft(t){t.D&&(i.clearTimeout(t.D),t.D=null)}function Ut(t){0==t.j.I||t.K||un(t.j,t)}function Bt(t){Ft(t);var e=t.O;e&&"function"==typeof e.dispose&&e.dispose(),t.O=null,nt(t.V),t.g&&(e=t.g,t.g=null,e.abort(),e.dispose())}function jt(t,e){try{var n=t.j;if(0!=n.I&&(n.g==t||Kt(n.h,t)))if(!t.L&&Kt(n.h,t)&&3==n.I){try{var r=n.Ba.g.parse(e)}catch(h){r=null}if(Array.isArray(r)&&3==r.length){var s=r;if(0==s[0]){t:if(!n.v){if(n.g){if(!(n.g.F+3e3<t.F))break t;an(n),Ye(n)}rn(n),yt(18)}}else n.xa=s[1],0<n.xa-n.K&&s[2]<37500&&n.F&&0==n.A&&!n.C&&(n.C=wt(u(n.Va,n),6e3));Gt(n.h)<=1&&n.ta&&(n.ta=void 0)}else hn(n,11)}else if((t.L||n.g==t)&&an(n),!C(e))for(s=n.Ba.g.parse(e),e=0;e<s.length;e++){let u=s[e];const h=u[0];if(!(h<=n.K))if(n.K=h,u=u[1],2==n.I)if("c"==u[0]){n.M=u[1],n.ba=u[2];const e=u[3];null!=e&&(n.ka=e,n.j.info("VER="+n.ka));const s=u[4];null!=s&&(n.za=s,n.j.info("SVER="+n.za));const h=u[5];null!=h&&"number"==typeof h&&h>0&&(r=1.5*h,n.O=r,n.j.info("backChannelRequestTimeoutMs_="+r)),r=n;const l=t.g;if(l){const t=l.g?l.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(t){var i=r.h;i.g||-1==t.indexOf("spdy")&&-1==t.indexOf("quic")&&-1==t.indexOf("h2")||(i.j=i.l,i.g=new Set,i.h&&(Ht(i,i.h),i.h=null))}if(r.G){const t=l.g?l.g.getResponseHeader("X-HTTP-Session-Id"):null;t&&(r.wa=t,le(r.J,r.G,t))}}n.I=3,n.l&&n.l.ra(),n.aa&&(n.T=Date.now()-t.F,n.j.info("Handshake RTT: "+n.T+"ms"));var o=t;if((r=n).na=dn(r,r.L?r.ba:null,r.W),o.L){Qt(r.h,o);var a=o,c=r.O;c&&(a.H=c),a.D&&(Ft(a),Vt(a)),r.g=o}else nn(r);n.i.length>0&&Je(n)}else"stop"!=u[0]&&"close"!=u[0]||hn(n,7);else 3==n.I&&("stop"==u[0]||"close"==u[0]?"stop"==u[0]?hn(n,7):We(n):"noop"!=u[0]&&n.l&&n.l.qa(u),n.A=0)}mt()}catch(h){}}Dt.prototype.ba=function(t){t=t.target;const e=this.O;e&&3==Ge(t)?e.j():this.Y(t)},Dt.prototype.Y=function(t){try{if(t==this.g)t:{const u=Ge(this.g),c=this.g.ya();this.g.ca();if(!(u<3)&&(3!=u||this.g&&(this.h.h||this.g.la()||Ke(this.g)))){this.K||4!=u||7==c||mt(),Ft(this);var e=this.g.ca();this.X=e;var n=function(t){if(!Lt(t))return t.g.la();const e=Ke(t.g);if(""===e)return"";let n="";const r=e.length,s=4==Ge(t.g);if(!t.h.i){if("undefined"==typeof TextDecoder)return Bt(t),Ut(t),"";t.h.i=new i.TextDecoder}for(let i=0;i<r;i++)t.h.h=!0,n+=t.h.i.decode(e[i],{stream:!(s&&i==r-1)});return e.length=0,t.h.g+=n,t.C=0,t.h.g}(this);if(this.o=200==e,function(t,e,n,r,s,i,o){t.info(function(){return"XMLHTTP RESP ("+r+") [ attempt "+s+"]: "+e+"\n"+n+"\n"+i+" "+o})}(this.i,this.v,this.B,this.l,this.S,u,e),this.o){if(this.U&&!this.L){e:{if(this.g){var r,s=this.g;if((r=s.g?s.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!C(r)){var o=r;break e}}o=null}if(!(t=o)){this.o=!1,this.m=3,yt(12),Bt(this),Ut(this);break t}_t(this.i,this.l,t,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,jt(this,t)}if(this.R){let e;for(t=!0;!this.K&&this.C<n.length;){if(e=Mt(this,n),e==Rt){4==u&&(this.m=4,yt(14),t=!1),_t(this.i,this.l,null,"[Incomplete Response]");break}if(e==kt){this.m=4,yt(15),_t(this.i,this.l,n,"[Invalid Chunk]"),t=!1;break}_t(this.i,this.l,e,null),jt(this,e)}if(Lt(this)&&0!=this.C&&(this.h.g=this.h.g.slice(this.C),this.C=0),4!=u||0!=n.length||this.h.h||(this.m=1,yt(16),t=!1),this.o=this.o&&t,t){if(n.length>0&&!this.W){this.W=!0;var a=this.j;a.g==this&&a.aa&&!a.P&&(a.j.info("Great, no buffering proxy detected. Bytes received: "+n.length),sn(a),a.P=!0,yt(11))}}else _t(this.i,this.l,n,"[Invalid Chunked Response]"),Bt(this),Ut(this)}else _t(this.i,this.l,n,null),jt(this,n);4==u&&Bt(this),this.o&&!this.K&&(4==u?un(this.j,this):(this.o=!1,Vt(this)))}else(function(t){const e={};t=(t.g&&Ge(t)>=2&&t.g.getAllResponseHeaders()||"").split("\r\n");for(let r=0;r<t.length;r++){if(C(t[r]))continue;var n=At(t[r]);const s=n[0];if("string"!=typeof(n=n[1]))continue;n=n.trim();const i=e[s]||[];e[s]=i,i.push(n)}!function(t,e){for(const n in t)e.call(void 0,t[n],n,t)}(e,function(t){return t.join(", ")})})(this.g),400==e&&n.indexOf("Unknown SID")>0?(this.m=3,yt(12)):(this.m=0,yt(13)),Bt(this),Ut(this)}}}catch(u){}},Dt.prototype.cancel=function(){this.K=!0,Bt(this)},Dt.prototype.aa=function(){this.D=null;const t=Date.now();t-this.T>=0?(function(t,e){t.info(function(){return"TIMEOUT: "+e})}(this.i,this.B),2!=this.M&&(mt(),yt(17)),Bt(this),this.m=2,Ut(this)):Pt(this,this.T-t)};var qt=class{constructor(t,e){this.g=t,this.map=e}};function $t(t){this.l=t||10,i.PerformanceNavigationTiming?t=(t=i.performance.getEntriesByType("navigation")).length>0&&("hq"==t[0].nextHopProtocol||"h2"==t[0].nextHopProtocol):t=!!(i.chrome&&i.chrome.loadTimes&&i.chrome.loadTimes()&&i.chrome.loadTimes().wasFetchedViaSpdy),this.j=t?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function zt(t){return!!t.h||!!t.g&&t.g.size>=t.j}function Gt(t){return t.h?1:t.g?t.g.size:0}function Kt(t,e){return t.h?t.h==e:!!t.g&&t.g.has(e)}function Ht(t,e){t.g?t.g.add(e):t.h=e}function Qt(t,e){t.h&&t.h==e?t.h=null:t.g&&t.g.has(e)&&t.g.delete(e)}function Wt(t){if(null!=t.h)return t.i.concat(t.h.G);if(null!=t.g&&0!==t.g.size){let e=t.i;for(const n of t.g.values())e=e.concat(n.G);return e}return d(t.i)}$t.prototype.cancel=function(){if(this.i=Wt(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&0!==this.g.size){for(const t of this.g.values())t.cancel();this.g.clear()}};var Yt=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Xt(t){let e;this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1,t instanceof Xt?(this.l=t.l,Zt(this,t.j),this.o=t.o,this.g=t.g,te(this,t.u),this.h=t.h,ee(this,Ae(t.i)),this.m=t.m):t&&(e=String(t).match(Yt))?(this.l=!1,Zt(this,e[1]||"",!0),this.o=fe(e[2]||""),this.g=fe(e[3]||"",!0),te(this,e[4]),this.h=fe(e[5]||"",!0),ee(this,e[6]||"",!0),this.m=fe(e[7]||"")):(this.l=!1,this.i=new _e(null,this.l))}function Jt(t){return new Xt(t)}function Zt(t,e,n){t.j=n?fe(e,!0):e,t.j&&(t.j=t.j.replace(/:$/,""))}function te(t,e){if(e){if(e=Number(e),isNaN(e)||e<0)throw Error("Bad port number "+e);t.u=e}else t.u=null}function ee(t,e,n){e instanceof _e?(t.i=e,function(t,e){e&&!t.j&&(be(t),t.i=null,t.g.forEach(function(t,e){const n=e.toLowerCase();e!=n&&(Te(this,e),Ce(this,n,t))},t)),t.j=e}(t.i,t.l)):(n||(e=pe(e,we)),t.i=new _e(e,t.l))}function le(t,e,n){t.i.set(e,n)}function de(t){return le(t,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),t}function fe(t,e){return t?e?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function pe(t,e,n){return"string"==typeof t?(t=encodeURI(t).replace(e,me),n&&(t=t.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),t):null}function me(t){return"%"+((t=t.charCodeAt(0))>>4&15).toString(16)+(15&t).toString(16)}Xt.prototype.toString=function(){const t=[];var e=this.j;e&&t.push(pe(e,ge,!0),":");var n=this.g;return(n||"file"==e)&&(t.push("//"),(e=this.o)&&t.push(pe(e,ge,!0),"@"),t.push(Ct(n).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),null!=(n=this.u)&&t.push(":",String(n))),(n=this.h)&&(this.g&&"/"!=n.charAt(0)&&t.push("/"),t.push(pe(n,"/"==n.charAt(0)?ve:ye,!0))),(n=this.i.toString())&&t.push("?",n),(n=this.m)&&t.push("#",pe(n,Ee)),t.join("")},Xt.prototype.resolve=function(t){const e=Jt(this);let n=!!t.j;n?Zt(e,t.j):n=!!t.o,n?e.o=t.o:n=!!t.g,n?e.g=t.g:n=null!=t.u;var r=t.h;if(n)te(e,t.u);else if(n=!!t.h){if("/"!=r.charAt(0))if(this.g&&!this.h)r="/"+r;else{var s=e.h.lastIndexOf("/");-1!=s&&(r=e.h.slice(0,s+1)+r)}if(".."==(s=r)||"."==s)r="";else if(-1!=s.indexOf("./")||-1!=s.indexOf("/.")){r=0==s.lastIndexOf("/",0),s=s.split("/");const t=[];for(let e=0;e<s.length;){const n=s[e++];"."==n?r&&e==s.length&&t.push(""):".."==n?((t.length>1||1==t.length&&""!=t[0])&&t.pop(),r&&e==s.length&&t.push("")):(t.push(n),r=!0)}r=t.join("/")}else r=s}return n?e.h=r:n=""!==t.i.toString(),n?ee(e,Ae(t.i)):n=!!t.m,n&&(e.m=t.m),e};var ge=/[#\/\?@]/g,ye=/[#\?:]/g,ve=/[#\?]/g,we=/[#\?@]/g,Ee=/#/g;function _e(t,e){this.h=this.g=null,this.i=t||null,this.j=!!e}function be(t){t.g||(t.g=new Map,t.h=0,t.i&&function(t,e){if(t){t=t.split("&");for(let n=0;n<t.length;n++){const r=t[n].indexOf("=");let s,i=null;r>=0?(s=t[n].substring(0,r),i=t[n].substring(r+1)):s=t[n],e(s,i?decodeURIComponent(i.replace(/\+/g," ")):"")}}}(t.i,function(e,n){t.add(decodeURIComponent(e.replace(/\+/g," ")),n)}))}function Te(t,e){be(t),e=De(t,e),t.g.has(e)&&(t.i=null,t.h-=t.g.get(e).length,t.g.delete(e))}function Se(t,e){return be(t),e=De(t,e),t.g.has(e)}function Ie(t,e){be(t);let n=[];if("string"==typeof e)Se(t,e)&&(n=n.concat(t.g.get(De(t,e))));else for(t=Array.from(t.g.values()),e=0;e<t.length;e++)n=n.concat(t[e]);return n}function Ce(t,e,n){Te(t,e),n.length>0&&(t.i=null,t.g.set(De(t,e),d(n)),t.h+=n.length)}function Ae(t){const e=new _e;return e.i=t.i,t.g&&(e.g=new Map(t.g),e.h=t.h),e}function De(t,e){return e=String(e),t.j&&(e=e.toLowerCase()),e}function Ne(t,e,n,r,s){try{s&&(s.onload=null,s.onerror=null,s.onabort=null,s.ontimeout=null),r(n)}catch(i){}}function ke(){this.g=new it}function Re(t){this.i=t.Sb||null,this.h=t.ab||!1}function xe(t,e){W.call(this),this.H=t,this.o=e,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}function Oe(t){t.j.read().then(t.Ma.bind(t)).catch(t.ga.bind(t))}function Le(t){t.readyState=4,t.l=null,t.j=null,t.B=null,Me(t)}function Me(t){t.onreadystatechange&&t.onreadystatechange.call(t)}function Ve(t){let e="";return x(t,function(t,n){e+=n,e+=":",e+=t,e+="\r\n"}),e}function Pe(t,e,n){t:{for(r in n){var r=!1;break t}r=!0}r||(n=Ve(n),"string"==typeof t?null!=n&&Ct(n):le(t,e,n))}function Fe(t){W.call(this),this.headers=new Map,this.L=t||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}(t=_e.prototype).add=function(t,e){be(this),this.i=null,t=De(this,t);let n=this.g.get(t);return n||this.g.set(t,n=[]),n.push(e),this.h+=1,this},t.forEach=function(t,e){be(this),this.g.forEach(function(n,r){n.forEach(function(n){t.call(e,n,r,this)},this)},this)},t.set=function(t,e){return be(this),this.i=null,Se(this,t=De(this,t))&&(this.h-=this.g.get(t).length),this.g.set(t,[e]),this.h+=1,this},t.get=function(t,e){return t&&(t=Ie(this,t)).length>0?String(t[0]):e},t.toString=function(){if(this.i)return this.i;if(!this.g)return"";const t=[],e=Array.from(this.g.keys());for(let r=0;r<e.length;r++){var n=e[r];const s=Ct(n);n=Ie(this,n);for(let e=0;e<n.length;e++){let r=s;""!==n[e]&&(r+="="+Ct(n[e])),t.push(r)}}return this.i=t.join("&")},h(Re,ot),Re.prototype.g=function(){return new xe(this.i,this.h)},h(xe,W),(t=xe.prototype).open=function(t,e){if(0!=this.readyState)throw this.abort(),Error("Error reopening a connection");this.F=t,this.D=e,this.readyState=1,Me(this)},t.send=function(t){if(1!=this.readyState)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const e={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};t&&(e.body=t),(this.H||i).fetch(new Request(this.D,e)).then(this.Pa.bind(this),this.ga.bind(this))},t.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&4!=this.readyState&&(this.g=!1,Le(this)),this.readyState=0},t.Pa=function(t){if(this.g&&(this.l=t,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=t.headers,this.readyState=2,Me(this)),this.g&&(this.readyState=3,Me(this),this.g)))if("arraybuffer"===this.responseType)t.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(void 0!==i.ReadableStream&&"body"in t){if(this.j=t.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Oe(this)}else t.text().then(this.Oa.bind(this),this.ga.bind(this))},t.Ma=function(t){if(this.g){if(this.o&&t.value)this.response.push(t.value);else if(!this.o){var e=t.value?t.value:new Uint8Array(0);(e=this.B.decode(e,{stream:!t.done}))&&(this.response=this.responseText+=e)}t.done?Le(this):Me(this),3==this.readyState&&Oe(this)}},t.Oa=function(t){this.g&&(this.response=this.responseText=t,Le(this))},t.Na=function(t){this.g&&(this.response=t,Le(this))},t.ga=function(){this.g&&Le(this)},t.setRequestHeader=function(t,e){this.A.append(t,e)},t.getResponseHeader=function(t){return this.h&&this.h.get(t.toLowerCase())||""},t.getAllResponseHeaders=function(){if(!this.h)return"";const t=[],e=this.h.entries();for(var n=e.next();!n.done;)n=n.value,t.push(n[0]+": "+n[1]),n=e.next();return t.join("\r\n")},Object.defineProperty(xe.prototype,"withCredentials",{get:function(){return"include"===this.m},set:function(t){this.m=t?"include":"same-origin"}}),h(Fe,W);var Ue=/^https?$/i,Be=["POST","PUT"];function je(t,e){t.h=!1,t.g&&(t.j=!0,t.g.abort(),t.j=!1),t.l=e,t.o=5,qe(t),ze(t)}function qe(t){t.A||(t.A=!0,Y(t,"complete"),Y(t,"error"))}function $e(t){if(t.h&&void 0!==s)if(t.v&&4==Ge(t))setTimeout(t.Ca.bind(t),0);else if(Y(t,"readystatechange"),4==Ge(t)){t.h=!1;try{const s=t.ca();t:switch(s){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var e=!0;break t;default:e=!1}var n;if(!(n=e)){var r;if(r=0===s){let e=String(t.D).match(Yt)[1]||null;!e&&i.self&&i.self.location&&(e=i.self.location.protocol.slice(0,-1)),r=!Ue.test(e?e.toLowerCase():"")}n=r}if(n)Y(t,"complete"),Y(t,"success");else{t.o=6;try{var o=Ge(t)>2?t.g.statusText:""}catch(a){o=""}t.l=o+" ["+t.ca()+"]",qe(t)}}finally{ze(t)}}}function ze(t,e){if(t.g){t.m&&(clearTimeout(t.m),t.m=null);const r=t.g;t.g=null,e||Y(t,"ready");try{r.onreadystatechange=null}catch(n){}}}function Ge(t){return t.g?t.g.readyState:0}function Ke(t){try{if(!t.g)return null;if("response"in t.g)return t.g.response;switch(t.F){case"":case"text":return t.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in t.g)return t.g.mozResponseArrayBuffer}return null}catch(e){return null}}function He(t,e,n){return n&&n.internalChannelParams&&n.internalChannelParams[t]||e}function Qe(t){this.za=0,this.i=[],this.j=new Et,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=He("failFast",!1,t),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=He("baseRetryDelayMs",5e3,t),this.Za=He("retryDelaySeedMs",1e4,t),this.Ta=He("forwardChannelMaxRetries",2,t),this.va=He("forwardChannelRequestTimeoutMs",2e4,t),this.ma=t&&t.xmlHttpFactory||void 0,this.Ua=t&&t.Rb||void 0,this.Aa=t&&t.useFetchStreams||!1,this.O=void 0,this.L=t&&t.supportsCrossDomainXhr||!1,this.M="",this.h=new $t(t&&t.concurrentRequestLimit),this.Ba=new ke,this.S=t&&t.fastHandshake||!1,this.R=t&&t.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=t&&t.Pb||!1,t&&t.ua&&this.j.ua(),t&&t.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&t&&t.detectBufferingProxy||!1,this.ia=void 0,t&&t.longPollingTimeout&&t.longPollingTimeout>0&&(this.ia=t.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}function We(t){if(Xe(t),3==t.I){var e=t.V++,n=Jt(t.J);if(le(n,"SID",t.M),le(n,"RID",e),le(n,"TYPE","terminate"),tn(t,n),(e=new Dt(t,t.j,e)).M=2,e.A=de(Jt(n)),n=!1,i.navigator&&i.navigator.sendBeacon)try{n=i.navigator.sendBeacon(e.A.toString(),"")}catch(r){}!n&&i.Image&&((new Image).src=e.A,n=!0),n||(e.g=fn(e.j,null),e.g.ea(e.A)),e.F=Date.now(),Vt(e)}ln(t)}function Ye(t){t.g&&(sn(t),t.g.cancel(),t.g=null)}function Xe(t){Ye(t),t.v&&(i.clearTimeout(t.v),t.v=null),an(t),t.h.cancel(),t.m&&("number"==typeof t.m&&i.clearTimeout(t.m),t.m=null)}function Je(t){if(!zt(t.h)&&!t.m){t.m=!0;var e=t.Ea;v||_(),w||(v(),w=!0),E.add(e,t),t.D=0}}function Ze(t,e){var n;n=e?e.l:t.V++;const r=Jt(t.J);le(r,"SID",t.M),le(r,"RID",n),le(r,"AID",t.K),tn(t,r),t.u&&t.o&&Pe(r,t.u,t.o),n=new Dt(t,t.j,n,t.D+1),null===t.u&&(n.J=t.o),e&&(t.i=e.G.concat(t.i)),e=en(t,n,1e3),n.H=Math.round(.5*t.va)+Math.round(.5*t.va*Math.random()),Ht(t.h,n),xt(n,r,e)}function tn(t,e){t.H&&x(t.H,function(t,n){le(e,n,t)}),t.l&&x({},function(t,n){le(e,n,t)})}function en(t,e,n){n=Math.min(t.i.length,n);const r=t.l?u(t.l.Ka,t.l,t):null;t:{var s=t.i;let e=-1;for(;;){const t=["count="+n];-1==e?n>0?(e=s[0].g,t.push("ofs="+e)):e=0:t.push("ofs="+e);let u=!0;for(let h=0;h<n;h++){var i=s[h].g;const n=s[h].map;if((i-=e)<0)e=Math.max(0,s[h].g-100),u=!1;else try{i="req"+i+"_"||"";try{var a=n instanceof Map?n:Object.entries(n);for(const[e,n]of a){let r=n;o(n)&&(r=rt(n)),t.push(i+e+"="+encodeURIComponent(r))}}catch(c){throw t.push(i+"type="+encodeURIComponent("_badmap")),c}}catch(c){r&&r(n)}}if(u){a=t.join("&");break t}}a=void 0}return t=t.i.splice(0,n),e.G=t,a}function nn(t){if(!t.g&&!t.v){t.Y=1;var e=t.Da;v||_(),w||(v(),w=!0),E.add(e,t),t.A=0}}function rn(t){return!(t.g||t.v||t.A>=3)&&(t.Y++,t.v=wt(u(t.Da,t),cn(t,t.A)),t.A++,!0)}function sn(t){null!=t.B&&(i.clearTimeout(t.B),t.B=null)}function on(t){t.g=new Dt(t,t.j,"rpc",t.Y),null===t.u&&(t.g.J=t.o),t.g.P=0;var e=Jt(t.na);le(e,"RID","rpc"),le(e,"SID",t.M),le(e,"AID",t.K),le(e,"CI",t.F?"0":"1"),!t.F&&t.ia&&le(e,"TO",t.ia),le(e,"TYPE","xmlhttp"),tn(t,e),t.u&&t.o&&Pe(e,t.u,t.o),t.O&&(t.g.H=t.O);var n=t.g;t=t.ba,n.M=1,n.A=de(Jt(e)),n.u=null,n.R=!0,Ot(n,t)}function an(t){null!=t.C&&(i.clearTimeout(t.C),t.C=null)}function un(t,e){var n=null;if(t.g==e){an(t),sn(t),t.g=null;var r=2}else{if(!Kt(t.h,e))return;n=e.G,Qt(t.h,e),r=1}if(0!=t.I)if(e.o)if(1==r){n=e.u?e.u.length:0,e=Date.now()-e.F;var s=t.D;Y(r=ft(),new vt(r,n)),Je(t)}else nn(t);else if(3==(s=e.m)||0==s&&e.X>0||!(1==r&&function(t,e){return!(Gt(t.h)>=t.h.j-(t.m?1:0)||(t.m?(t.i=e.G.concat(t.i),0):1==t.I||2==t.I||t.D>=(t.Sa?0:t.Ta)||(t.m=wt(u(t.Ea,t,e),cn(t,t.D)),t.D++,0)))}(t,e)||2==r&&rn(t)))switch(n&&n.length>0&&(e=t.h,e.i=e.i.concat(n)),s){case 1:hn(t,5);break;case 4:hn(t,10);break;case 3:hn(t,6);break;default:hn(t,2)}}function cn(t,e){let n=t.Qa+Math.floor(Math.random()*t.Za);return t.isActive()||(n*=2),n*e}function hn(t,e){if(t.j.info("Error code "+e),2==e){var n=u(t.bb,t),r=t.Ua;const e=!r;r=new Xt(r||"//www.google.com/images/cleardot.gif"),i.location&&"http"==i.location.protocol||Zt(r,"https"),de(r),e?function(t,e){const n=new Et;if(i.Image){const r=new Image;r.onload=c(Ne,n,"TestLoadImage: loaded",!0,e,r),r.onerror=c(Ne,n,"TestLoadImage: error",!1,e,r),r.onabort=c(Ne,n,"TestLoadImage: abort",!1,e,r),r.ontimeout=c(Ne,n,"TestLoadImage: timeout",!1,e,r),i.setTimeout(function(){r.ontimeout&&r.ontimeout()},1e4),r.src=t}else e(!1)}(r.toString(),n):function(t,e){new Et;const n=new AbortController,r=setTimeout(()=>{n.abort(),Ne(0,0,!1,e)},1e4);fetch(t,{signal:n.signal}).then(t=>{clearTimeout(r),t.ok?Ne(0,0,!0,e):Ne(0,0,!1,e)}).catch(()=>{clearTimeout(r),Ne(0,0,!1,e)})}(r.toString(),n)}else yt(2);t.I=0,t.l&&t.l.pa(e),ln(t),Xe(t)}function ln(t){if(t.I=0,t.ja=[],t.l){const e=Wt(t.h);0==e.length&&0==t.i.length||(f(t.ja,e),f(t.ja,t.i),t.h.i.length=0,d(t.i),t.i.length=0),t.l.oa()}}function dn(t,e,n){var r=n instanceof Xt?Jt(n):new Xt(n);if(""!=r.g)e&&(r.g=e+"."+r.g),te(r,r.u);else{var s=i.location;r=s.protocol,e=e?e+"."+s.hostname:s.hostname,s=+s.port;const t=new Xt(null);r&&Zt(t,r),e&&(t.g=e),s&&te(t,s),n&&(t.h=n),r=t}return n=t.G,e=t.wa,n&&e&&le(r,n,e),le(r,"VER",t.ka),tn(t,r),r}function fn(t,e,n){if(e&&!t.L)throw Error("Can't create secondary domain capable XhrIo object.");return(e=t.Aa&&!t.ma?new Fe(new Re({ab:n})):new Fe(t.ma)).Fa(t.L),e}function pn(){}function mn(){}function gn(t,e){W.call(this),this.g=new Qe(e),this.l=t,this.h=e&&e.messageUrlParams||null,t=e&&e.messageHeaders||null,e&&e.clientProtocolHeaderRequired&&(t?t["X-Client-Protocol"]="webchannel":t={"X-Client-Protocol":"webchannel"}),this.g.o=t,t=e&&e.initMessageHeaders||null,e&&e.messageContentType&&(t?t["X-WebChannel-Content-Type"]=e.messageContentType:t={"X-WebChannel-Content-Type":e.messageContentType}),e&&e.sa&&(t?t["X-WebChannel-Client-Profile"]=e.sa:t={"X-WebChannel-Client-Profile":e.sa}),this.g.U=t,(t=e&&e.Qb)&&!C(t)&&(this.g.u=t),this.A=e&&e.supportsCrossDomainXhr||!1,this.v=e&&e.sendRawJson||!1,(e=e&&e.httpSessionIdParam)&&!C(e)&&(this.g.G=e,null!==(t=this.h)&&e in t&&(e in(t=this.h)&&delete t[e])),this.j=new wn(this)}function yn(t){ct.call(this),t.__headers__&&(this.headers=t.__headers__,this.statusCode=t.__status__,delete t.__headers__,delete t.__status__);var e=t.__sm__;if(e){t:{for(const n in e){t=n;break t}t=void 0}(this.i=t)&&(t=this.i,e=null!==e&&t in e?e[t]:void 0),this.data=e}else this.data=t}function vn(){ht.call(this),this.status=1}function wn(t){this.g=t}(t=Fe.prototype).Fa=function(t){this.H=t},t.ea=function(t,e,n,r){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+t);e=e?e.toUpperCase():"GET",this.D=t,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():bt.g(),this.g.onreadystatechange=l(u(this.Ca,this));try{this.B=!0,this.g.open(e,String(t),!0),this.B=!1}catch(o){return void je(this,o)}if(t=n||"",n=new Map(this.headers),r)if(Object.getPrototypeOf(r)===Object.prototype)for(var s in r)n.set(s,r[s]);else{if("function"!=typeof r.keys||"function"!=typeof r.get)throw Error("Unknown input type for opt_headers: "+String(r));for(const t of r.keys())n.set(t,r.get(t))}r=Array.from(n.keys()).find(t=>"content-type"==t.toLowerCase()),s=i.FormData&&t instanceof i.FormData,!(Array.prototype.indexOf.call(Be,e,void 0)>=0)||r||s||n.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[i,a]of n)this.g.setRequestHeader(i,a);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(t),this.v=!1}catch(o){je(this,o)}},t.abort=function(t){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=t||7,Y(this,"complete"),Y(this,"abort"),ze(this))},t.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ze(this,!0)),Fe.Z.N.call(this)},t.Ca=function(){this.u||(this.B||this.v||this.j?$e(this):this.Xa())},t.Xa=function(){$e(this)},t.isActive=function(){return!!this.g},t.ca=function(){try{return Ge(this)>2?this.g.status:-1}catch(t){return-1}},t.la=function(){try{return this.g?this.g.responseText:""}catch(t){return""}},t.La=function(t){if(this.g){var e=this.g.responseText;return t&&0==e.indexOf(t)&&(e=e.substring(t.length)),st(e)}},t.ya=function(){return this.o},t.Ha=function(){return"string"==typeof this.l?this.l:String(this.l)},(t=Qe.prototype).ka=8,t.I=1,t.connect=function(t,e,n,r){yt(0),this.W=t,this.H=e||{},n&&void 0!==r&&(this.H.OSID=n,this.H.OAID=r),this.F=this.X,this.J=dn(this,null,this.W),Je(this)},t.Ea=function(t){if(this.m)if(this.m=null,1==this.I){if(!t){this.V=Math.floor(1e5*Math.random()),t=this.V++;const s=new Dt(this,this.j,t);let i=this.o;if(this.U&&(i?(i=O(i),M(i,this.U)):i=this.U),null!==this.u||this.R||(s.J=i,i=null),this.S)t:{for(var e=0,n=0;n<this.i.length;n++){var r=this.i[n];if(void 0===(r="__data__"in r.map&&"string"==typeof(r=r.map.__data__)?r.length:void 0))break;if((e+=r)>4096){e=n;break t}if(4096===e||n===this.i.length-1){e=n+1;break t}}e=1e3}else e=1e3;e=en(this,s,e),le(n=Jt(this.J),"RID",t),le(n,"CVER",22),this.G&&le(n,"X-HTTP-Session-Id",this.G),tn(this,n),i&&(this.R?e="headers="+Ct(Ve(i))+"&"+e:this.u&&Pe(n,this.u,i)),Ht(this.h,s),this.Ra&&le(n,"TYPE","init"),this.S?(le(n,"$req",e),le(n,"SID","null"),s.U=!0,xt(s,n,null)):xt(s,n,e),this.I=2}}else 3==this.I&&(t?Ze(this,t):0==this.i.length||zt(this.h)||Ze(this))},t.Da=function(){if(this.v=null,on(this),this.aa&&!(this.P||null==this.g||this.T<=0)){var t=4*this.T;this.j.info("BP detection timer enabled: "+t),this.B=wt(u(this.Wa,this),t)}},t.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,yt(10),Ye(this),on(this))},t.Va=function(){null!=this.C&&(this.C=null,Ye(this),rn(this),yt(19))},t.bb=function(t){t?(this.j.info("Successfully pinged google.com"),yt(2)):(this.j.info("Failed to ping google.com"),yt(1))},t.isActive=function(){return!!this.l&&this.l.isActive(this)},(t=pn.prototype).ra=function(){},t.qa=function(){},t.pa=function(){},t.oa=function(){},t.isActive=function(){return!0},t.Ka=function(){},mn.prototype.g=function(t,e){return new gn(t,e)},h(gn,W),gn.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},gn.prototype.close=function(){We(this.g)},gn.prototype.o=function(t){var e=this.g;if("string"==typeof t){var n={};n.__data__=t,t=n}else this.v&&((n={}).__data__=rt(t),t=n);e.i.push(new qt(e.Ya++,t)),3==e.I&&Je(e)},gn.prototype.N=function(){this.g.l=null,delete this.j,We(this.g),delete this.g,gn.Z.N.call(this)},h(yn,ct),h(vn,ht),h(wn,pn),wn.prototype.ra=function(){Y(this.g,"a")},wn.prototype.qa=function(t){Y(this.g,new yn(t))},wn.prototype.pa=function(t){Y(this.g,new vn)},wn.prototype.oa=function(){Y(this.g,"b")},mn.prototype.createWebChannel=mn.prototype.g,gn.prototype.send=gn.prototype.o,gn.prototype.open=gn.prototype.m,gn.prototype.close=gn.prototype.close,ce=function(){return new mn},ue=function(){return ft()},ae=lt,oe={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Tt.NO_ERROR=0,Tt.TIMEOUT=8,Tt.HTTP_ERROR=6,ie=Tt,St.COMPLETE="complete",se=St,at.EventType=ut,ut.OPEN="a",ut.CLOSE="b",ut.ERROR="c",ut.MESSAGE="d",W.prototype.listen=W.prototype.J,re=at,Fe.prototype.listenOnce=Fe.prototype.K,Fe.prototype.getLastError=Fe.prototype.Ha,Fe.prototype.getLastErrorCode=Fe.prototype.ya,Fe.prototype.getStatus=Fe.prototype.ca,Fe.prototype.getResponseJson=Fe.prototype.La,Fe.prototype.getResponseText=Fe.prototype.la,Fe.prototype.send=Fe.prototype.ea,Fe.prototype.setWithCredentials=Fe.prototype.Fa,ne=Fe}).apply(void 0!==he?he:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class le{constructor(t){this.uid=t}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}le.UNAUTHENTICATED=new le(null),le.GOOGLE_CREDENTIALS=new le("google-credentials-uid"),le.FIRST_PARTY=new le("first-party-uid"),le.MOCK_USER=new le("mock-user");
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let de="12.12.0";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const fe=new U("@firebase/firestore");function pe(){return fe.logLevel}function me(t,...e){if(fe.logLevel<=O.DEBUG){const n=e.map(ve);fe.debug(`Firestore (${de}): ${t}`,...n)}}function ge(t,...e){if(fe.logLevel<=O.ERROR){const n=e.map(ve);fe.error(`Firestore (${de}): ${t}`,...n)}}function ye(t,...e){if(fe.logLevel<=O.WARN){const n=e.map(ve);fe.warn(`Firestore (${de}): ${t}`,...n)}}function ve(t){if("string"==typeof t)return t;try{return e=t,JSON.stringify(e)}catch(n){return t}var e}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function we(t,e,n){let r="Unexpected state";"string"==typeof e?r=e:n=e,Ee(t,r,n)}function Ee(t,e,n){let r=`FIRESTORE (${de}) INTERNAL ASSERTION FAILED: ${e} (ID: ${t.toString(16)})`;if(void 0!==n)try{r+=" CONTEXT: "+JSON.stringify(n)}catch(s){r+=" CONTEXT: "+n}throw ge(r),new Error(r)}function _e(t,e,n,r){let s="Unexpected state";"string"==typeof n?s=n:r=n,t||Ee(e,s,r)}function be(t,e){return t}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Te={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class Se extends b{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ie{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ce{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Ae{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(le.UNAUTHENTICATED))}shutdown(){}}class De{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class Ne{constructor(t){this.t=t,this.currentUser=le.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){_e(void 0===this.o,42304);let n=this.i;const r=t=>this.i!==n?(n=this.i,e(t)):Promise.resolve();let s=new Ie;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new Ie,t.enqueueRetryable(()=>r(this.currentUser))};const i=()=>{const e=s;t.enqueueRetryable(()=>c(this,null,function*(){yield e.promise,yield r(this.currentUser)}))},o=t=>{me("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=t,this.o&&(this.auth.addAuthTokenListener(this.o),i())};this.t.onInit(t=>o(t)),setTimeout(()=>{if(!this.auth){const t=this.t.getImmediate({optional:!0});t?o(t):(me("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new Ie)}},0),i()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(e=>this.i!==t?(me("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):e?(_e("string"==typeof e.accessToken,31837,{l:e}),new Ce(e.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return _e(null===t||"string"==typeof t,2055,{h:t}),new le(t)}}class ke{constructor(t,e,n){this.P=t,this.T=e,this.I=n,this.type="FirstParty",this.user=le.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const t=this.A();return t&&this.R.set("Authorization",t),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class Re{constructor(t,e,n){this.P=t,this.T=e,this.I=n}getToken(){return Promise.resolve(new ke(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable(()=>e(le.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class xe{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Oe{constructor(t,e){var n;this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,null!=(n=t)&&void 0!==n.settings&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){_e(void 0===this.o,3512);const n=t=>{null!=t.error&&me("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${t.error.message}`);const n=t.token!==this.m;return this.m=t.token,me("FirebaseAppCheckTokenProvider",`Received ${n?"new":"existing"} token.`),n?e(t.token):Promise.resolve()};this.o=e=>{t.enqueueRetryable(()=>n(e))};const r=t=>{me("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=t,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(t=>r(t)),setTimeout(()=>{if(!this.appCheck){const t=this.V.getImmediate({optional:!0});t?r(t):me("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new xe(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(t=>t?(_e("string"==typeof t.token,44558,{tokenResult:t}),this.m=t.token,new xe(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(t){const e="undefined"!=typeof self&&(self.crypto||self.msCrypto),n=new Uint8Array(t);if(e&&"function"==typeof e.getRandomValues)e.getRandomValues(n);else for(let r=0;r<t;r++)n[r]=Math.floor(256*Math.random());return n}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{static newId(){const t=62*Math.floor(256/62);let e="";for(;e.length<20;){const n=Le(40);for(let r=0;r<n.length;++r)e.length<20&&n[r]<t&&(e+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(n[r]%62))}return e}}function Ve(t,e){return t<e?-1:t>e?1:0}function Pe(t,e){const n=Math.min(t.length,e.length);for(let r=0;r<n;r++){const n=t.charAt(r),s=e.charAt(r);if(n!==s)return Be(n)===Be(s)?Ve(n,s):Be(n)?1:-1}return Ve(t.length,e.length)}const Fe=55296,Ue=57343;function Be(t){const e=t.charCodeAt(0);return e>=Fe&&e<=Ue}function je(t,e,n){return t.length===e.length&&t.every((t,r)=>n(t,e[r]))}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qe="__name__";class $e{constructor(t,e,n){void 0===e?e=0:e>t.length&&we(637,{offset:e,range:t.length}),void 0===n?n=t.length-e:n>t.length-e&&we(1746,{length:n,range:t.length-e}),this.segments=t,this.offset=e,this.len=n}get length(){return this.len}isEqual(t){return 0===$e.comparator(this,t)}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof $e?t.forEach(t=>{e.push(t)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=void 0===t?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return 0===this.length}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,n=this.limit();e<n;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const n=Math.min(t.length,e.length);for(let r=0;r<n;r++){const n=$e.compareSegments(t.get(r),e.get(r));if(0!==n)return n}return Ve(t.length,e.length)}static compareSegments(t,e){const n=$e.isNumericId(t),r=$e.isNumericId(e);return n&&!r?-1:!n&&r?1:n&&r?$e.extractNumericId(t).compare($e.extractNumericId(e)):Pe(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Zt.fromString(t.substring(4,t.length-2))}}class ze extends $e{construct(t,e,n){return new ze(t,e,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const n of t){if(n.indexOf("//")>=0)throw new Se(Te.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);e.push(...n.split("/").filter(t=>t.length>0))}return new ze(e)}static emptyPath(){return new ze([])}}const Ge=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Ke extends $e{construct(t,e,n){return new Ke(t,e,n)}static isValidIdentifier(t){return Ge.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Ke.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return 1===this.length&&this.get(0)===qe}static keyField(){return new Ke([qe])}static fromServerFormat(t){const e=[];let n="",r=0;const s=()=>{if(0===n.length)throw new Se(Te.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(n),n=""};let i=!1;for(;r<t.length;){const e=t[r];if("\\"===e){if(r+1===t.length)throw new Se(Te.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const e=t[r+1];if("\\"!==e&&"."!==e&&"`"!==e)throw new Se(Te.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);n+=e,r+=2}else"`"===e?(i=!i,r++):"."!==e||i?(n+=e,r++):(s(),r++)}if(s(),i)throw new Se(Te.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new Ke(e)}static emptyPath(){return new Ke([])}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(t){this.path=t}static fromPath(t){return new He(ze.fromString(t))}static fromName(t){return new He(ze.fromString(t).popFirst(5))}static empty(){return new He(ze.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return null!==t&&0===ze.comparator(this.path,t.path)}toString(){return this.path.toString()}static comparator(t,e){return ze.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new He(new ze(t.slice()))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qe(t,e,n){if(!n)throw new Se(Te.INVALID_ARGUMENT,`Function ${t}() cannot be called with an empty ${e}.`)}function We(t){if(!He.isDocumentKey(t))throw new Se(Te.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${t} has ${t.length}.`)}function Ye(t){if(He.isDocumentKey(t))throw new Se(Te.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${t} has ${t.length}.`)}function Xe(t){return"object"==typeof t&&null!==t&&(Object.getPrototypeOf(t)===Object.prototype||null===Object.getPrototypeOf(t))}function Je(t){if(void 0===t)return"undefined";if(null===t)return"null";if("string"==typeof t)return t.length>20&&(t=`${t.substring(0,20)}...`),JSON.stringify(t);if("number"==typeof t||"boolean"==typeof t)return""+t;if("object"==typeof t){if(t instanceof Array)return"an array";{const n=(e=t).constructor?e.constructor.name:null;return n?`a custom ${n} object`:"an object"}}var e;return"function"==typeof t?"a function":we(12329,{type:typeof t})}function Ze(t,e){if("_delegate"in t&&(t=t._delegate),!(t instanceof e)){if(e.name===t.constructor.name)throw new Se(Te.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=Je(t);throw new Se(Te.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${n}`)}}return t}
/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tn(t,e){const n={typeString:t};return e&&(n.value=e),n}function en(t,e){if(!Xe(t))throw new Se(Te.INVALID_ARGUMENT,"JSON must be an object");let n;for(const r in e)if(e[r]){const s=e[r].typeString,i="value"in e[r]?{value:e[r].value}:void 0;if(!(r in t)){n=`JSON missing required field: '${r}'`;break}const o=t[r];if(s&&typeof o!==s){n=`JSON field '${r}' must be a ${s}.`;break}if(void 0!==i&&o!==i.value){n=`Expected '${r}' field to equal '${i.value}'`;break}}if(n)throw new Se(Te.INVALID_ARGUMENT,n);return!0}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nn=-62135596800,rn=1e6;class sn{static now(){return sn.fromMillis(Date.now())}static fromDate(t){return sn.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),n=Math.floor((t-1e3*e)*rn);return new sn(e,n)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new Se(Te.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new Se(Te.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<nn)throw new Se(Te.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new Se(Te.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/rn}_compareTo(t){return this.seconds===t.seconds?Ve(this.nanoseconds,t.nanoseconds):Ve(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:sn._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(en(t,sn._jsonSchema))return new sn(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-nn;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}sn._jsonSchemaVersion="firestore/timestamp/1.0",sn._jsonSchema={type:tn("string",sn._jsonSchemaVersion),seconds:tn("number"),nanoseconds:tn("number")};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class on{static fromTimestamp(t){return new on(t)}static min(){return new on(new sn(0,0))}static max(){return new on(new sn(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function an(t){return new un(t.readTime,t.key,-1)}class un{constructor(t,e,n){this.readTime=t,this.documentKey=e,this.largestBatchId=n}static min(){return new un(on.min(),He.empty(),-1)}static max(){return new un(on.max(),He.empty(),-1)}}function cn(t,e){let n=t.readTime.compareTo(e.readTime);return 0!==n?n:(n=He.comparator(t.documentKey,e.documentKey),0!==n?n:Ve(t.largestBatchId,e.largestBatchId)
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */)}class hn{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ln(t){return c(this,null,function*(){if(t.code!==Te.FAILED_PRECONDITION||"The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab."!==t.message)throw t;me("LocalStore","Unexpectedly lost primary lease")})}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dn{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&we(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new dn((n,r)=>{this.nextCallback=e=>{this.wrapSuccess(t,e).next(n,r)},this.catchCallback=t=>{this.wrapFailure(e,t).next(n,r)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof dn?e:dn.resolve(e)}catch(e){return dn.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):dn.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):dn.reject(e)}static resolve(t){return new dn((e,n)=>{e(t)})}static reject(t){return new dn((e,n)=>{n(t)})}static waitFor(t){return new dn((e,n)=>{let r=0,s=0,i=!1;t.forEach(t=>{++r,t.next(()=>{++s,i&&s===r&&e()},t=>n(t))}),i=!0,s===r&&e()})}static or(t){let e=dn.resolve(!1);for(const n of t)e=e.next(t=>t?dn.resolve(t):n());return e}static forEach(t,e){const n=[];return t.forEach((t,r)=>{n.push(e.call(this,t,r))}),this.waitFor(n)}static mapArray(t,e){return new dn((n,r)=>{const s=t.length,i=new Array(s);let o=0;for(let a=0;a<s;a++){const u=a;e(t[u]).next(t=>{i[u]=t,++o,o===s&&n(i)},t=>r(t))}})}static doWhile(t,e){return new dn((n,r)=>{const s=()=>{!0===t()?e().next(()=>{s()},r):n()};s()})}}function fn(t){return"IndexedDbTransactionError"===t.name}
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pn{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=t=>this.ae(t),this.ue=t=>e.writeSequenceNumber(t))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}pn.ce=-1;function mn(t){return null==t}function gn(t){return 0===t&&1/t==-1/0}function yn(t,e){let n=e;const r=t.length;for(let s=0;s<r;s++){const e=t.charAt(s);switch(e){case"\0":n+="";break;case"":n+="";break;default:n+=e}}return n}function vn(t){return t+""}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wn(t){let e=0;for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e++;return e}function En(t,e){for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e(n,t[n])}function _n(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bn{constructor(t,e){this.comparator=t,this.root=e||Sn.EMPTY}insert(t,e){return new bn(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,Sn.BLACK,null,null))}remove(t){return new bn(this.comparator,this.root.remove(t,this.comparator).copy(null,null,Sn.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const n=this.comparator(t,e.key);if(0===n)return e.value;n<0?e=e.left:n>0&&(e=e.right)}return null}indexOf(t){let e=0,n=this.root;for(;!n.isEmpty();){const r=this.comparator(t,n.key);if(0===r)return e+n.left.size;r<0?n=n.left:(e+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,n)=>(t(e,n),!1))}toString(){const t=[];return this.inorderTraversal((e,n)=>(t.push(`${e}:${n}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new Tn(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new Tn(this.root,t,this.comparator,!1)}getReverseIterator(){return new Tn(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new Tn(this.root,t,this.comparator,!0)}}class Tn{constructor(t,e,n,r){this.isReverse=r,this.nodeStack=[];let s=1;for(;!t.isEmpty();)if(s=e?n(t.key,e):1,e&&r&&(s*=-1),s<0)t=this.isReverse?t.left:t.right;else{if(0===s){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(0===this.nodeStack.length)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class Sn{constructor(t,e,n,r,s){this.key=t,this.value=e,this.color=null!=n?n:Sn.RED,this.left=null!=r?r:Sn.EMPTY,this.right=null!=s?s:Sn.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,n,r,s){return new Sn(null!=t?t:this.key,null!=e?e:this.value,null!=n?n:this.color,null!=r?r:this.left,null!=s?s:this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,n){let r=this;const s=n(t,r.key);return r=s<0?r.copy(null,null,null,r.left.insert(t,e,n),null):0===s?r.copy(null,e,null,null,null):r.copy(null,null,null,null,r.right.insert(t,e,n)),r.fixUp()}removeMin(){if(this.left.isEmpty())return Sn.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let n,r=this;if(e(t,r.key)<0)r.left.isEmpty()||r.left.isRed()||r.left.left.isRed()||(r=r.moveRedLeft()),r=r.copy(null,null,null,r.left.remove(t,e),null);else{if(r.left.isRed()&&(r=r.rotateRight()),r.right.isEmpty()||r.right.isRed()||r.right.left.isRed()||(r=r.moveRedRight()),0===e(t,r.key)){if(r.right.isEmpty())return Sn.EMPTY;n=r.right.min(),r=r.copy(n.key,n.value,null,null,r.right.removeMin())}r=r.copy(null,null,null,null,r.right.remove(t,e))}return r.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,Sn.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,Sn.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw we(43730,{key:this.key,value:this.value});if(this.right.isRed())throw we(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw we(27949);return t+(this.isRed()?0:1)}}Sn.EMPTY=null,Sn.RED=!0,Sn.BLACK=!1,Sn.EMPTY=new class{constructor(){this.size=0}get key(){throw we(57766)}get value(){throw we(16141)}get color(){throw we(16727)}get left(){throw we(29726)}get right(){throw we(36894)}copy(t,e,n,r,s){return this}insert(t,e,n){return new Sn(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class In{constructor(t){this.comparator=t,this.data=new bn(this.comparator)}has(t){return null!==this.data.get(t)}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,n)=>(t(e),!1))}forEachInRange(t,e){const n=this.data.getIteratorFrom(t[0]);for(;n.hasNext();){const r=n.getNext();if(this.comparator(r.key,t[1])>=0)return;e(r.key)}}forEachWhile(t,e){let n;for(n=void 0!==e?this.data.getIteratorFrom(e):this.data.getIterator();n.hasNext();)if(!t(n.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Cn(this.data.getIterator())}getIteratorFrom(t){return new Cn(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(t=>{e=e.add(t)}),e}isEqual(t){if(!(t instanceof In))return!1;if(this.size!==t.size)return!1;const e=this.data.getIterator(),n=t.data.getIterator();for(;e.hasNext();){const t=e.getNext().key,r=n.getNext().key;if(0!==this.comparator(t,r))return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new In(this.comparator);return e.data=t,e}}class Cn{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class An{constructor(t){this.fields=t,t.sort(Ke.comparator)}static empty(){return new An([])}unionWith(t){let e=new In(Ke.comparator);for(const n of this.fields)e=e.add(n);for(const n of t)e=e.add(n);return new An(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return je(this.fields,t.fields,(t,e)=>t.isEqual(e))}}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dn extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nn{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(t){try{return atob(t)}catch(e){throw"undefined"!=typeof DOMException&&e instanceof DOMException?new Dn("Invalid base64 string: "+e):e}}(t);return new Nn(e)}static fromUint8Array(t){const e=function(t){let e="";for(let n=0;n<t.length;++n)e+=String.fromCharCode(t[n]);return e}(t);return new Nn(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return t=this.binaryString,btoa(t);var t}toUint8Array(){return function(t){const e=new Uint8Array(t.length);for(let n=0;n<t.length;n++)e[n]=t.charCodeAt(n);return e}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return Ve(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}Nn.EMPTY_BYTE_STRING=new Nn("");const kn=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Rn(t){if(_e(!!t,39018),"string"==typeof t){let e=0;const n=kn.exec(t);if(_e(!!n,46558,{timestamp:t}),n[1]){let t=n[1];t=(t+"000000000").substr(0,9),e=Number(t)}const r=new Date(t);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:xn(t.seconds),nanos:xn(t.nanos)}}function xn(t){return"number"==typeof t?t:"string"==typeof t?Number(t):0}function On(t){return"string"==typeof t?Nn.fromBase64String(t):Nn.fromUint8Array(t)}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ln="server_timestamp",Mn="__type__",Vn="__previous_value__",Pn="__local_write_time__";function Fn(t){var e,n;return(null==(n=((null==(e=null==t?void 0:t.mapValue)?void 0:e.fields)||{})[Mn])?void 0:n.stringValue)===Ln}function Un(t){const e=t.mapValue.fields[Vn];return Fn(e)?Un(e):e}function Bn(t){const e=Rn(t.mapValue.fields[Pn].timestampValue);return new sn(e.seconds,e.nanos)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jn{constructor(t,e,n,r,s,i,o,a,u,c,h){this.databaseId=t,this.appId=e,this.persistenceKey=n,this.host=r,this.ssl=s,this.forceLongPolling=i,this.autoDetectLongPolling=o,this.longPollingOptions=a,this.useFetchStreams=u,this.isUsingEmulator=c,this.apiKey=h}}const qn="(default)";class $n{constructor(t,e){this.projectId=t,this.database=e||qn}static empty(){return new $n("","")}get isDefaultDatabase(){return this.database===qn}isEqual(t){return t instanceof $n&&t.projectId===this.projectId&&t.database===this.database}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const zn="__type__",Gn="__max__",Kn={},Hn="__vector__",Qn="value";function Wn(t){return"nullValue"in t?0:"booleanValue"in t?1:"integerValue"in t||"doubleValue"in t?2:"timestampValue"in t?3:"stringValue"in t?5:"bytesValue"in t?6:"referenceValue"in t?7:"geoPointValue"in t?8:"arrayValue"in t?9:"mapValue"in t?Fn(t)?4:function(t){return(((t.mapValue||{}).fields||{}).__type__||{}).stringValue===Gn}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(t)?9007199254740991:function(t){var e,n;const r=null==(n=((null==(e=null==t?void 0:t.mapValue)?void 0:e.fields)||{})[zn])?void 0:n.stringValue;return r===Hn}(t)?10:11:we(28295,{value:t})}function Yn(t,e){if(t===e)return!0;const n=Wn(t);if(n!==Wn(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return t.booleanValue===e.booleanValue;case 4:return Bn(t).isEqual(Bn(e));case 3:return function(t,e){if("string"==typeof t.timestampValue&&"string"==typeof e.timestampValue&&t.timestampValue.length===e.timestampValue.length)return t.timestampValue===e.timestampValue;const n=Rn(t.timestampValue),r=Rn(e.timestampValue);return n.seconds===r.seconds&&n.nanos===r.nanos}(t,e);case 5:return t.stringValue===e.stringValue;case 6:return r=e,On(t.bytesValue).isEqual(On(r.bytesValue));case 7:return t.referenceValue===e.referenceValue;case 8:return function(t,e){return xn(t.geoPointValue.latitude)===xn(e.geoPointValue.latitude)&&xn(t.geoPointValue.longitude)===xn(e.geoPointValue.longitude)}(t,e);case 2:return function(t,e){if("integerValue"in t&&"integerValue"in e)return xn(t.integerValue)===xn(e.integerValue);if("doubleValue"in t&&"doubleValue"in e){const n=xn(t.doubleValue),r=xn(e.doubleValue);return n===r?gn(n)===gn(r):isNaN(n)&&isNaN(r)}return!1}(t,e);case 9:return je(t.arrayValue.values||[],e.arrayValue.values||[],Yn);case 10:case 11:return function(t,e){const n=t.mapValue.fields||{},r=e.mapValue.fields||{};if(wn(n)!==wn(r))return!1;for(const s in n)if(n.hasOwnProperty(s)&&(void 0===r[s]||!Yn(n[s],r[s])))return!1;return!0}(t,e);default:return we(52216,{left:t})}var r}function Xn(t,e){return void 0!==(t.values||[]).find(t=>Yn(t,e))}function Jn(t,e){if(t===e)return 0;const n=Wn(t),r=Wn(e);if(n!==r)return Ve(n,r);switch(n){case 0:case 9007199254740991:return 0;case 1:return Ve(t.booleanValue,e.booleanValue);case 2:return function(t,e){const n=xn(t.integerValue||t.doubleValue),r=xn(e.integerValue||e.doubleValue);return n<r?-1:n>r?1:n===r?0:isNaN(n)?isNaN(r)?0:-1:1}(t,e);case 3:return Zn(t.timestampValue,e.timestampValue);case 4:return Zn(Bn(t),Bn(e));case 5:return Pe(t.stringValue,e.stringValue);case 6:return function(t,e){const n=On(t),r=On(e);return n.compareTo(r)}(t.bytesValue,e.bytesValue);case 7:return function(t,e){const n=t.split("/"),r=e.split("/");for(let s=0;s<n.length&&s<r.length;s++){const t=Ve(n[s],r[s]);if(0!==t)return t}return Ve(n.length,r.length)}(t.referenceValue,e.referenceValue);case 8:return function(t,e){const n=Ve(xn(t.latitude),xn(e.latitude));return 0!==n?n:Ve(xn(t.longitude),xn(e.longitude))}(t.geoPointValue,e.geoPointValue);case 9:return tr(t.arrayValue,e.arrayValue);case 10:return function(t,e){var n,r,s,i;const o=t.fields||{},a=e.fields||{},u=null==(n=o[Qn])?void 0:n.arrayValue,c=null==(r=a[Qn])?void 0:r.arrayValue,h=Ve((null==(s=null==u?void 0:u.values)?void 0:s.length)||0,(null==(i=null==c?void 0:c.values)?void 0:i.length)||0);return 0!==h?h:tr(u,c)}(t.mapValue,e.mapValue);case 11:return function(t,e){if(t===Kn&&e===Kn)return 0;if(t===Kn)return 1;if(e===Kn)return-1;const n=t.fields||{},r=Object.keys(n),s=e.fields||{},i=Object.keys(s);r.sort(),i.sort();for(let o=0;o<r.length&&o<i.length;++o){const t=Pe(r[o],i[o]);if(0!==t)return t;const e=Jn(n[r[o]],s[i[o]]);if(0!==e)return e}return Ve(r.length,i.length)}(t.mapValue,e.mapValue);default:throw we(23264,{he:n})}}function Zn(t,e){if("string"==typeof t&&"string"==typeof e&&t.length===e.length)return Ve(t,e);const n=Rn(t),r=Rn(e),s=Ve(n.seconds,r.seconds);return 0!==s?s:Ve(n.nanos,r.nanos)}function tr(t,e){const n=t.values||[],r=e.values||[];for(let s=0;s<n.length&&s<r.length;++s){const t=Jn(n[s],r[s]);if(t)return t}return Ve(n.length,r.length)}function er(t){return nr(t)}function nr(t){return"nullValue"in t?"null":"booleanValue"in t?""+t.booleanValue:"integerValue"in t?""+t.integerValue:"doubleValue"in t?""+t.doubleValue:"timestampValue"in t?function(t){const e=Rn(t);return`time(${e.seconds},${e.nanos})`}(t.timestampValue):"stringValue"in t?t.stringValue:"bytesValue"in t?On(t.bytesValue).toBase64():"referenceValue"in t?function(t){return He.fromName(t).toString()}(t.referenceValue):"geoPointValue"in t?function(t){return`geo(${t.latitude},${t.longitude})`}(t.geoPointValue):"arrayValue"in t?function(t){let e="[",n=!0;for(const r of t.values||[])n?n=!1:e+=",",e+=nr(r);return e+"]"}(t.arrayValue):"mapValue"in t?function(t){const e=Object.keys(t.fields||{}).sort();let n="{",r=!0;for(const s of e)r?r=!1:n+=",",n+=`${s}:${nr(t.fields[s])}`;return n+"}"}(t.mapValue):we(61005,{value:t})}function rr(t){switch(Wn(t)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Un(t);return e?16+rr(e):16;case 5:return 2*t.stringValue.length;case 6:return On(t.bytesValue).approximateByteSize();case 7:return t.referenceValue.length;case 9:return(t.arrayValue.values||[]).reduce((t,e)=>t+rr(e),0);case 10:case 11:return function(t){let e=0;return En(t.fields,(t,n)=>{e+=t.length+rr(n)}),e}(t.mapValue);default:throw we(13486,{value:t})}}function sr(t,e){return{referenceValue:`projects/${t.projectId}/databases/${t.database}/documents/${e.path.canonicalString()}`}}function ir(t){return!!t&&"integerValue"in t}function or(t){return!!t&&"arrayValue"in t}function ar(t){return!!t&&"nullValue"in t}function ur(t){return!!t&&"doubleValue"in t&&isNaN(Number(t.doubleValue))}function cr(t){return!!t&&"mapValue"in t}function hr(t){if(t.geoPointValue)return{geoPointValue:a({},t.geoPointValue)};if(t.timestampValue&&"object"==typeof t.timestampValue)return{timestampValue:a({},t.timestampValue)};if(t.mapValue){const e={mapValue:{fields:{}}};return En(t.mapValue.fields,(t,n)=>e.mapValue.fields[t]=hr(n)),e}if(t.arrayValue){const e={arrayValue:{values:[]}};for(let n=0;n<(t.arrayValue.values||[]).length;++n)e.arrayValue.values[n]=hr(t.arrayValue.values[n]);return e}return a({},t)}class lr{constructor(t){this.value=t}static empty(){return new lr({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let n=0;n<t.length-1;++n)if(e=(e.mapValue.fields||{})[t.get(n)],!cr(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=hr(e)}setAll(t){let e=Ke.emptyPath(),n={},r=[];t.forEach((t,s)=>{if(!e.isImmediateParentOf(s)){const t=this.getFieldsMap(e);this.applyChanges(t,n,r),n={},r=[],e=s.popLast()}t?n[s.lastSegment()]=hr(t):r.push(s.lastSegment())});const s=this.getFieldsMap(e);this.applyChanges(s,n,r)}delete(t){const e=this.field(t.popLast());cr(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Yn(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let n=0;n<t.length;++n){let r=e.mapValue.fields[t.get(n)];cr(r)&&r.mapValue.fields||(r={mapValue:{fields:{}}},e.mapValue.fields[t.get(n)]=r),e=r}return e.mapValue.fields}applyChanges(t,e,n){En(e,(e,n)=>t[e]=n);for(const r of n)delete t[r]}clone(){return new lr(hr(this.value))}}function dr(t){const e=[];return En(t.fields,(t,n)=>{const r=new Ke([t]);if(cr(n)){const t=dr(n.mapValue).fields;if(0===t.length)e.push(r);else for(const n of t)e.push(r.child(n))}else e.push(r)}),new An(e)
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */}class fr{constructor(t,e,n,r,s,i,o){this.key=t,this.documentType=e,this.version=n,this.readTime=r,this.createTime=s,this.data=i,this.documentState=o}static newInvalidDocument(t){return new fr(t,0,on.min(),on.min(),on.min(),lr.empty(),0)}static newFoundDocument(t,e,n,r){return new fr(t,1,e,on.min(),n,r,0)}static newNoDocument(t,e){return new fr(t,2,e,on.min(),on.min(),lr.empty(),0)}static newUnknownDocument(t,e){return new fr(t,3,e,on.min(),on.min(),lr.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(on.min())||2!==this.documentType&&0!==this.documentType||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=lr.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=lr.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=on.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return 1===this.documentState}get hasCommittedMutations(){return 2===this.documentState}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return 0!==this.documentType}isFoundDocument(){return 1===this.documentType}isNoDocument(){return 2===this.documentType}isUnknownDocument(){return 3===this.documentType}isEqual(t){return t instanceof fr&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new fr(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pr{constructor(t,e){this.position=t,this.inclusive=e}}function mr(t,e,n){let r=0;for(let s=0;s<t.position.length;s++){const i=e[s],o=t.position[s];if(r=i.field.isKeyField()?He.comparator(He.fromName(o.referenceValue),n.key):Jn(o,n.data.field(i.field)),"desc"===i.dir&&(r*=-1),0!==r)break}return r}function gr(t,e){if(null===t)return null===e;if(null===e)return!1;if(t.inclusive!==e.inclusive||t.position.length!==e.position.length)return!1;for(let n=0;n<t.position.length;n++)if(!Yn(t.position[n],e.position[n]))return!1;return!0}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yr{constructor(t,e="asc"){this.field=t,this.dir=e}}function vr(t,e){return t.dir===e.dir&&t.field.isEqual(e.field)}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wr{}class Er extends wr{constructor(t,e,n){super(),this.field=t,this.op=e,this.value=n}static create(t,e,n){return t.isKeyField()?"in"===e||"not-in"===e?this.createKeyFieldInFilter(t,e,n):new Ar(t,e,n):"array-contains"===e?new Rr(t,n):"in"===e?new xr(t,n):"not-in"===e?new Or(t,n):"array-contains-any"===e?new Lr(t,n):new Er(t,e,n)}static createKeyFieldInFilter(t,e,n){return"in"===e?new Dr(t,n):new Nr(t,n)}matches(t){const e=t.data.field(this.field);return"!="===this.op?null!==e&&void 0===e.nullValue&&this.matchesComparison(Jn(e,this.value)):null!==e&&Wn(this.value)===Wn(e)&&this.matchesComparison(Jn(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return 0===t;case"!=":return 0!==t;case">":return t>0;case">=":return t>=0;default:return we(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class _r extends wr{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new _r(t,e)}matches(t){return br(this)?void 0===this.filters.find(e=>!e.matches(t)):void 0!==this.filters.find(e=>e.matches(t))}getFlattenedFilters(){return null!==this.Pe||(this.Pe=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function br(t){return"and"===t.op}function Tr(t){return function(t){for(const e of t.filters)if(e instanceof _r)return!1;return!0}(t)&&br(t)}function Sr(t){if(t instanceof Er)return t.field.canonicalString()+t.op.toString()+er(t.value);if(Tr(t))return t.filters.map(t=>Sr(t)).join(",");{const e=t.filters.map(t=>Sr(t)).join(",");return`${t.op}(${e})`}}function Ir(t,e){return t instanceof Er?(n=t,(r=e)instanceof Er&&n.op===r.op&&n.field.isEqual(r.field)&&Yn(n.value,r.value)):t instanceof _r?function(t,e){return e instanceof _r&&t.op===e.op&&t.filters.length===e.filters.length&&t.filters.reduce((t,n,r)=>t&&Ir(n,e.filters[r]),!0)}(t,e):void we(19439);var n,r}function Cr(t){return t instanceof Er?`${(e=t).field.canonicalString()} ${e.op} ${er(e.value)}`:t instanceof _r?function(t){return t.op.toString()+" {"+t.getFilters().map(Cr).join(" ,")+"}"}(t):"Filter";var e}class Ar extends Er{constructor(t,e,n){super(t,e,n),this.key=He.fromName(n.referenceValue)}matches(t){const e=He.comparator(t.key,this.key);return this.matchesComparison(e)}}class Dr extends Er{constructor(t,e){super(t,"in",e),this.keys=kr("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class Nr extends Er{constructor(t,e){super(t,"not-in",e),this.keys=kr("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function kr(t,e){var n;return((null==(n=e.arrayValue)?void 0:n.values)||[]).map(t=>He.fromName(t.referenceValue))}class Rr extends Er{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return or(e)&&Xn(e.arrayValue,this.value)}}class xr extends Er{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return null!==e&&Xn(this.value.arrayValue,e)}}class Or extends Er{constructor(t,e){super(t,"not-in",e)}matches(t){if(Xn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return null!==e&&void 0===e.nullValue&&!Xn(this.value.arrayValue,e)}}class Lr extends Er{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!or(e)||!e.arrayValue.values)&&e.arrayValue.values.some(t=>Xn(this.value.arrayValue,t))}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mr{constructor(t,e=null,n=[],r=[],s=null,i=null,o=null){this.path=t,this.collectionGroup=e,this.orderBy=n,this.filters=r,this.limit=s,this.startAt=i,this.endAt=o,this.Te=null}}function Vr(t,e=null,n=[],r=[],s=null,i=null,o=null){return new Mr(t,e,n,r,s,i,o)}function Pr(t){const e=be(t);if(null===e.Te){let t=e.path.canonicalString();null!==e.collectionGroup&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(t=>Sr(t)).join(","),t+="|ob:",t+=e.orderBy.map(t=>{return(e=t).field.canonicalString()+e.dir;var e}).join(","),mn(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(t=>er(t)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(t=>er(t)).join(",")),e.Te=t}return e.Te}function Fr(t,e){if(t.limit!==e.limit)return!1;if(t.orderBy.length!==e.orderBy.length)return!1;for(let n=0;n<t.orderBy.length;n++)if(!vr(t.orderBy[n],e.orderBy[n]))return!1;if(t.filters.length!==e.filters.length)return!1;for(let n=0;n<t.filters.length;n++)if(!Ir(t.filters[n],e.filters[n]))return!1;return t.collectionGroup===e.collectionGroup&&!!t.path.isEqual(e.path)&&!!gr(t.startAt,e.startAt)&&gr(t.endAt,e.endAt)}function Ur(t){return He.isDocumentKey(t.path)&&null===t.collectionGroup&&0===t.filters.length}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Br{constructor(t,e=null,n=[],r=[],s=null,i="F",o=null,a=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=n,this.filters=r,this.limit=s,this.limitType=i,this.startAt=o,this.endAt=a,this.Ee=null,this.Ie=null,this.Re=null,this.startAt,this.endAt}}function jr(t){return new Br(t)}function qr(t){return 0===t.filters.length&&null===t.limit&&null==t.startAt&&null==t.endAt&&(0===t.explicitOrderBy.length||1===t.explicitOrderBy.length&&t.explicitOrderBy[0].field.isKeyField())}function $r(t){return null!==t.collectionGroup}function zr(t){const e=be(t);if(null===e.Ee){e.Ee=[];const t=new Set;for(const r of e.explicitOrderBy)e.Ee.push(r),t.add(r.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(t){let e=new In(Ke.comparator);return t.filters.forEach(t=>{t.getFlattenedFilters().forEach(t=>{t.isInequality()&&(e=e.add(t.field))})}),e})(e).forEach(r=>{t.has(r.canonicalString())||r.isKeyField()||e.Ee.push(new yr(r,n))}),t.has(Ke.keyField().canonicalString())||e.Ee.push(new yr(Ke.keyField(),n))}return e.Ee}function Gr(t){const e=be(t);return e.Ie||(e.Ie=function(t,e){if("F"===t.limitType)return Vr(t.path,t.collectionGroup,e,t.filters,t.limit,t.startAt,t.endAt);{e=e.map(t=>{const e="desc"===t.dir?"asc":"desc";return new yr(t.field,e)});const n=t.endAt?new pr(t.endAt.position,t.endAt.inclusive):null,r=t.startAt?new pr(t.startAt.position,t.startAt.inclusive):null;return Vr(t.path,t.collectionGroup,e,t.filters,t.limit,n,r)}}(e,zr(t))),e.Ie}function Kr(t,e){const n=t.filters.concat([e]);return new Br(t.path,t.collectionGroup,t.explicitOrderBy.slice(),n,t.limit,t.limitType,t.startAt,t.endAt)}function Hr(t,e,n){return new Br(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),e,n,t.startAt,t.endAt)}function Qr(t,e){return Fr(Gr(t),Gr(e))&&t.limitType===e.limitType}function Wr(t){return`${Pr(Gr(t))}|lt:${t.limitType}`}function Yr(t){return`Query(target=${function(t){let e=t.path.canonicalString();return null!==t.collectionGroup&&(e+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(e+=`, filters: [${t.filters.map(t=>Cr(t)).join(", ")}]`),mn(t.limit)||(e+=", limit: "+t.limit),t.orderBy.length>0&&(e+=`, orderBy: [${t.orderBy.map(t=>{return`${(e=t).field.canonicalString()} (${e.dir})`;var e}).join(", ")}]`),t.startAt&&(e+=", startAt: ",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(t=>er(t)).join(",")),t.endAt&&(e+=", endAt: ",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(t=>er(t)).join(",")),`Target(${e})`}(Gr(t))}; limitType=${t.limitType})`}function Xr(t,e){return e.isFoundDocument()&&function(t,e){const n=e.key.path;return null!==t.collectionGroup?e.key.hasCollectionId(t.collectionGroup)&&t.path.isPrefixOf(n):He.isDocumentKey(t.path)?t.path.isEqual(n):t.path.isImmediateParentOf(n)}(t,e)&&function(t,e){for(const n of zr(t))if(!n.field.isKeyField()&&null===e.data.field(n.field))return!1;return!0}(t,e)&&function(t,e){for(const n of t.filters)if(!n.matches(e))return!1;return!0}(t,e)&&(r=e,!((n=t).startAt&&!function(t,e,n){const r=mr(t,e,n);return t.inclusive?r<=0:r<0}(n.startAt,zr(n),r)||n.endAt&&!function(t,e,n){const r=mr(t,e,n);return t.inclusive?r>=0:r>0}(n.endAt,zr(n),r)));var n,r}function Jr(t){return(e,n)=>{let r=!1;for(const s of zr(t)){const t=Zr(s,e,n);if(0!==t)return t;r=r||s.field.isKeyField()}return 0}}function Zr(t,e,n){const r=t.field.isKeyField()?He.comparator(e.key,n.key):function(t,e,n){const r=e.data.field(t),s=n.data.field(t);return null!==r&&null!==s?Jn(r,s):we(42886)}(t.field,e,n);switch(t.dir){case"asc":return r;case"desc":return-1*r;default:return we(19790,{direction:t.dir})}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ts{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),n=this.inner[e];if(void 0!==n)for(const[r,s]of n)if(this.equalsFn(r,t))return s}has(t){return void 0!==this.get(t)}set(t,e){const n=this.mapKeyFn(t),r=this.inner[n];if(void 0===r)return this.inner[n]=[[t,e]],void this.innerSize++;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],t))return void(r[s]=[t,e]);r.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),n=this.inner[e];if(void 0===n)return!1;for(let r=0;r<n.length;r++)if(this.equalsFn(n[r][0],t))return 1===n.length?delete this.inner[e]:n.splice(r,1),this.innerSize--,!0;return!1}forEach(t){En(this.inner,(e,n)=>{for(const[r,s]of n)t(r,s)})}isEmpty(){return _n(this.inner)}size(){return this.innerSize}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const es=new bn(He.comparator);function ns(){return es}const rs=new bn(He.comparator);function ss(...t){let e=rs;for(const n of t)e=e.insert(n.key,n);return e}function is(t){let e=rs;return t.forEach((t,n)=>e=e.insert(t,n.overlayedDocument)),e}function os(){return us()}function as(){return us()}function us(){return new ts(t=>t.toString(),(t,e)=>t.isEqual(e))}const cs=new bn(He.comparator),hs=new In(He.comparator);function ls(...t){let e=hs;for(const n of t)e=e.add(n);return e}const ds=new In(Ve);
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function fs(t,e){if(t.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:gn(e)?"-0":e}}function ps(t){return{integerValue:""+t}}function ms(t,e){return function(t){return"number"==typeof t&&Number.isInteger(t)&&!gn(t)&&t<=Number.MAX_SAFE_INTEGER&&t>=Number.MIN_SAFE_INTEGER}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(e)?ps(e):fs(t,e)}
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gs{constructor(){this._=void 0}}function ys(t,e,n){return t instanceof Es?function(t,e){const n={fields:{[Mn]:{stringValue:Ln},[Pn]:{timestampValue:{seconds:t.seconds,nanos:t.nanoseconds}}}};return e&&Fn(e)&&(e=Un(e)),e&&(n.fields[Vn]=e),{mapValue:n}}(n,e):t instanceof _s?bs(t,e):t instanceof Ts?Ss(t,e):function(t,e){const n=ws(t,e),r=Cs(n)+Cs(t.Ae);return ir(n)&&ir(t.Ae)?ps(r):fs(t.serializer,r)}(t,e)}function vs(t,e,n){return t instanceof _s?bs(t,e):t instanceof Ts?Ss(t,e):n}function ws(t,e){return t instanceof Is?ir(n=e)||(r=n)&&"doubleValue"in r?e:{integerValue:0}:null;var n,r}class Es extends gs{}class _s extends gs{constructor(t){super(),this.elements=t}}function bs(t,e){const n=As(e);for(const r of t.elements)n.some(t=>Yn(t,r))||n.push(r);return{arrayValue:{values:n}}}class Ts extends gs{constructor(t){super(),this.elements=t}}function Ss(t,e){let n=As(e);for(const r of t.elements)n=n.filter(t=>!Yn(t,r));return{arrayValue:{values:n}}}class Is extends gs{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function Cs(t){return xn(t.integerValue||t.doubleValue)}function As(t){return or(t)&&t.arrayValue.values?t.arrayValue.values.slice():[]}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ds{constructor(t,e){this.field=t,this.transform=e}}class Ns{constructor(t,e){this.version=t,this.transformResults=e}}class ks{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new ks}static exists(t){return new ks(void 0,t)}static updateTime(t){return new ks(t)}get isNone(){return void 0===this.updateTime&&void 0===this.exists}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Rs(t,e){return void 0!==t.updateTime?e.isFoundDocument()&&e.version.isEqual(t.updateTime):void 0===t.exists||t.exists===e.isFoundDocument()}class xs{}function Os(t,e){if(!t.hasLocalMutations||e&&0===e.fields.length)return null;if(null===e)return t.isNoDocument()?new $s(t.key,ks.none()):new Fs(t.key,t.data,ks.none());{const n=t.data,r=lr.empty();let s=new In(Ke.comparator);for(let t of e.fields)if(!s.has(t)){let e=n.field(t);null===e&&t.length>1&&(t=t.popLast(),e=n.field(t)),null===e?r.delete(t):r.set(t,e),s=s.add(t)}return new Us(t.key,r,new An(s.toArray()),ks.none())}}function Ls(t,e,n){var r;t instanceof Fs?function(t,e,n){const r=t.value.clone(),s=js(t.fieldTransforms,e,n.transformResults);r.setAll(s),e.convertToFoundDocument(n.version,r).setHasCommittedMutations()}(t,e,n):t instanceof Us?function(t,e,n){if(!Rs(t.precondition,e))return void e.convertToUnknownDocument(n.version);const r=js(t.fieldTransforms,e,n.transformResults),s=e.data;s.setAll(Bs(t)),s.setAll(r),e.convertToFoundDocument(n.version,s).setHasCommittedMutations()}(t,e,n):(r=n,e.convertToNoDocument(r.version).setHasCommittedMutations())}function Ms(t,e,n,r){return t instanceof Fs?function(t,e,n,r){if(!Rs(t.precondition,e))return n;const s=t.value.clone(),i=qs(t.fieldTransforms,r,e);return s.setAll(i),e.convertToFoundDocument(e.version,s).setHasLocalMutations(),null}(t,e,n,r):t instanceof Us?function(t,e,n,r){if(!Rs(t.precondition,e))return n;const s=qs(t.fieldTransforms,r,e),i=e.data;return i.setAll(Bs(t)),i.setAll(s),e.convertToFoundDocument(e.version,i).setHasLocalMutations(),null===n?null:n.unionWith(t.fieldMask.fields).unionWith(t.fieldTransforms.map(t=>t.field))}(t,e,n,r):(s=e,i=n,Rs(t.precondition,s)?(s.convertToNoDocument(s.version).setHasLocalMutations(),null):i);var s,i}function Vs(t,e){let n=null;for(const r of t.fieldTransforms){const t=e.data.field(r.field),s=ws(r.transform,t||null);null!=s&&(null===n&&(n=lr.empty()),n.set(r.field,s))}return n||null}function Ps(t,e){return t.type===e.type&&!!t.key.isEqual(e.key)&&!!t.precondition.isEqual(e.precondition)&&(n=t.fieldTransforms,r=e.fieldTransforms,!!(void 0===n&&void 0===r||n&&r&&je(n,r,(t,e)=>function(t,e){return t.field.isEqual(e.field)&&(n=t.transform,r=e.transform,n instanceof _s&&r instanceof _s||n instanceof Ts&&r instanceof Ts?je(n.elements,r.elements,Yn):n instanceof Is&&r instanceof Is?Yn(n.Ae,r.Ae):n instanceof Es&&r instanceof Es);var n,r}(t,e)))&&(0===t.type?t.value.isEqual(e.value):1!==t.type||t.data.isEqual(e.data)&&t.fieldMask.isEqual(e.fieldMask)));var n,r}class Fs extends xs{constructor(t,e,n,r=[]){super(),this.key=t,this.value=e,this.precondition=n,this.fieldTransforms=r,this.type=0}getFieldMask(){return null}}class Us extends xs{constructor(t,e,n,r,s=[]){super(),this.key=t,this.data=e,this.fieldMask=n,this.precondition=r,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function Bs(t){const e=new Map;return t.fieldMask.fields.forEach(n=>{if(!n.isEmpty()){const r=t.data.field(n);e.set(n,r)}}),e}function js(t,e,n){const r=new Map;_e(t.length===n.length,32656,{Ve:n.length,de:t.length});for(let s=0;s<n.length;s++){const i=t[s],o=i.transform,a=e.data.field(i.field);r.set(i.field,vs(o,a,n[s]))}return r}function qs(t,e,n){const r=new Map;for(const s of t){const t=s.transform,i=n.data.field(s.field);r.set(s.field,ys(t,i,e))}return r}class $s extends xs{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class zs extends xs{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gs{constructor(t,e,n,r){this.batchId=t,this.localWriteTime=e,this.baseMutations=n,this.mutations=r}applyToRemoteDocument(t,e){const n=e.mutationResults;for(let r=0;r<this.mutations.length;r++){const e=this.mutations[r];e.key.isEqual(t.key)&&Ls(e,t,n[r])}}applyToLocalView(t,e){for(const n of this.baseMutations)n.key.isEqual(t.key)&&(e=Ms(n,t,e,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(t.key)&&(e=Ms(n,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const n=as();return this.mutations.forEach(r=>{const s=t.get(r.key),i=s.overlayedDocument;let o=this.applyToLocalView(i,s.mutatedFields);o=e.has(r.key)?null:o;const a=Os(i,o);null!==a&&n.set(r.key,a),i.isValidDocument()||i.convertToNoDocument(on.min())}),n}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),ls())}isEqual(t){return this.batchId===t.batchId&&je(this.mutations,t.mutations,(t,e)=>Ps(t,e))&&je(this.baseMutations,t.baseMutations,(t,e)=>Ps(t,e))}}class Ks{constructor(t,e,n,r){this.batch=t,this.commitVersion=e,this.mutationResults=n,this.docVersions=r}static from(t,e,n){_e(t.mutations.length===n.length,58842,{me:t.mutations.length,fe:n.length});let r=function(){return cs}();const s=t.mutations;for(let i=0;i<s.length;i++)r=r.insert(s[i].key,n[i].version);return new Ks(t,e,n,r)}}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hs{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return null!==t&&this.mutation===t.mutation}toString(){return`Overlay{\n      largestBatchId: ${this.largestBatchId},\n      mutation: ${this.mutation.toString()}\n    }`}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qs{constructor(t,e){this.count=t,this.unchangedNames=e}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ws,Ys;function Xs(t){if(void 0===t)return ge("GRPC error has no .code"),Te.UNKNOWN;switch(t){case Ws.OK:return Te.OK;case Ws.CANCELLED:return Te.CANCELLED;case Ws.UNKNOWN:return Te.UNKNOWN;case Ws.DEADLINE_EXCEEDED:return Te.DEADLINE_EXCEEDED;case Ws.RESOURCE_EXHAUSTED:return Te.RESOURCE_EXHAUSTED;case Ws.INTERNAL:return Te.INTERNAL;case Ws.UNAVAILABLE:return Te.UNAVAILABLE;case Ws.UNAUTHENTICATED:return Te.UNAUTHENTICATED;case Ws.INVALID_ARGUMENT:return Te.INVALID_ARGUMENT;case Ws.NOT_FOUND:return Te.NOT_FOUND;case Ws.ALREADY_EXISTS:return Te.ALREADY_EXISTS;case Ws.PERMISSION_DENIED:return Te.PERMISSION_DENIED;case Ws.FAILED_PRECONDITION:return Te.FAILED_PRECONDITION;case Ws.ABORTED:return Te.ABORTED;case Ws.OUT_OF_RANGE:return Te.OUT_OF_RANGE;case Ws.UNIMPLEMENTED:return Te.UNIMPLEMENTED;case Ws.DATA_LOSS:return Te.DATA_LOSS;default:return we(39323,{code:t})}}(Ys=Ws||(Ws={}))[Ys.OK=0]="OK",Ys[Ys.CANCELLED=1]="CANCELLED",Ys[Ys.UNKNOWN=2]="UNKNOWN",Ys[Ys.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Ys[Ys.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Ys[Ys.NOT_FOUND=5]="NOT_FOUND",Ys[Ys.ALREADY_EXISTS=6]="ALREADY_EXISTS",Ys[Ys.PERMISSION_DENIED=7]="PERMISSION_DENIED",Ys[Ys.UNAUTHENTICATED=16]="UNAUTHENTICATED",Ys[Ys.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Ys[Ys.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Ys[Ys.ABORTED=10]="ABORTED",Ys[Ys.OUT_OF_RANGE=11]="OUT_OF_RANGE",Ys[Ys.UNIMPLEMENTED=12]="UNIMPLEMENTED",Ys[Ys.INTERNAL=13]="INTERNAL",Ys[Ys.UNAVAILABLE=14]="UNAVAILABLE",Ys[Ys.DATA_LOSS=15]="DATA_LOSS";
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Js=new Zt([4294967295,4294967295],0);function Zs(t){const e=(new TextEncoder).encode(t),n=new te;return n.update(e),new Uint8Array(n.digest())}function ti(t){const e=new DataView(t.buffer),n=e.getUint32(0,!0),r=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Zt([n,r],0),new Zt([s,i],0)]}class ei{constructor(t,e,n){if(this.bitmap=t,this.padding=e,this.hashCount=n,e<0||e>=8)throw new ni(`Invalid padding: ${e}`);if(n<0)throw new ni(`Invalid hash count: ${n}`);if(t.length>0&&0===this.hashCount)throw new ni(`Invalid hash count: ${n}`);if(0===t.length&&0!==e)throw new ni(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=Zt.fromNumber(this.ge)}ye(t,e,n){let r=t.add(e.multiply(Zt.fromNumber(n)));return 1===r.compare(Js)&&(r=new Zt([r.getBits(0),r.getBits(1)],0)),r.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(0===this.ge)return!1;const e=Zs(t),[n,r]=ti(e);for(let s=0;s<this.hashCount;s++){const t=this.ye(n,r,s);if(!this.we(t))return!1}return!0}static create(t,e,n){const r=t%8==0?0:8-t%8,s=new Uint8Array(Math.ceil(t/8)),i=new ei(s,r,e);return n.forEach(t=>i.insert(t)),i}insert(t){if(0===this.ge)return;const e=Zs(t),[n,r]=ti(e);for(let s=0;s<this.hashCount;s++){const t=this.ye(n,r,s);this.Se(t)}}Se(t){const e=Math.floor(t/8),n=t%8;this.bitmap[e]|=1<<n}}class ni extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ri{constructor(t,e,n,r,s){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=n,this.documentUpdates=r,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(t,e,n){const r=new Map;return r.set(t,si.createSynthesizedTargetChangeForCurrentChange(t,e,n)),new ri(on.min(),r,new bn(Ve),ns(),ls())}}class si{constructor(t,e,n,r,s){this.resumeToken=t,this.current=e,this.addedDocuments=n,this.modifiedDocuments=r,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(t,e,n){return new si(n,e,ls(),ls(),ls())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ii{constructor(t,e,n,r){this.be=t,this.removedTargetIds=e,this.key=n,this.De=r}}class oi{constructor(t,e){this.targetId=t,this.Ce=e}}class ai{constructor(t,e,n=Nn.EMPTY_BYTE_STRING,r=null){this.state=t,this.targetIds=e,this.resumeToken=n,this.cause=r}}class ui{constructor(){this.ve=0,this.Fe=li(),this.Me=Nn.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return 0!==this.ve}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=ls(),e=ls(),n=ls();return this.Fe.forEach((r,s)=>{switch(s){case 0:t=t.add(r);break;case 2:e=e.add(r);break;case 1:n=n.add(r);break;default:we(38017,{changeType:s})}}),new si(this.Me,this.xe,t,e,n)}qe(){this.Oe=!1,this.Fe=li()}Ke(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}Ue(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}$e(){this.ve+=1}We(){this.ve-=1,_e(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class ci{constructor(t){this.Ge=t,this.ze=new Map,this.je=ns(),this.Je=hi(),this.He=hi(),this.Ze=new bn(Ve)}Xe(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Ye(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,e=>{const n=this.nt(e);switch(t.state){case 0:this.rt(e)&&n.Le(t.resumeToken);break;case 1:n.We(),n.Ne||n.qe(),n.Le(t.resumeToken);break;case 2:n.We(),n.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(n.Qe(),n.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),n.Le(t.resumeToken));break;default:we(56790,{state:t.state})}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach((t,n)=>{this.rt(n)&&e(n)})}st(t){const e=t.targetId,n=t.Ce.count,r=this.ot(e);if(r){const s=r.target;if(Ur(s))if(0===n){const t=new He(s.path);this.et(e,t,fr.newNoDocument(t,on.min()))}else _e(1===n,20013,{expectedCount:n});else{const r=this._t(e);if(r!==n){const n=this.ut(t),s=n?this.ct(n,t,r):1;if(0!==s){this.it(e);const t=2===s?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(e,t)}}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:n="",padding:r=0},hashCount:s=0}=e;let i,o;try{i=On(n).toUint8Array()}catch(a){if(a instanceof Dn)return ye("Decoding the base64 bloom filter in existence filter failed ("+a.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw a}try{o=new ei(i,r,s)}catch(a){return ye(a instanceof ni?"BloomFilter error: ":"Applying bloom filter failed: ",a),null}return 0===o.ge?null:o}ct(t,e,n){return e.Ce.count===n-this.Pt(t,e.targetId)?0:2}Pt(t,e){const n=this.Ge.getRemoteKeysForTarget(e);let r=0;return n.forEach(n=>{const s=this.Ge.ht(),i=`projects/${s.projectId}/databases/${s.database}/documents/${n.path.canonicalString()}`;t.mightContain(i)||(this.et(e,n,null),r++)}),r}Tt(t){const e=new Map;this.ze.forEach((n,r)=>{const s=this.ot(r);if(s){if(n.current&&Ur(s.target)){const e=new He(s.target.path);this.Et(e).has(r)||this.It(r,e)||this.et(r,e,fr.newNoDocument(e,t))}n.Be&&(e.set(r,n.ke()),n.qe())}});let n=ls();this.He.forEach((t,e)=>{let r=!0;e.forEachWhile(t=>{const e=this.ot(t);return!e||"TargetPurposeLimboResolution"===e.purpose||(r=!1,!1)}),r&&(n=n.add(t))}),this.je.forEach((e,n)=>n.setReadTime(t));const r=new ri(t,e,this.Ze,this.je,n);return this.je=ns(),this.Je=hi(),this.He=hi(),this.Ze=new bn(Ve),r}Ye(t,e){if(!this.rt(t))return;const n=this.It(t,e.key)?2:0;this.nt(t).Ke(e.key,n),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.Et(e.key).add(t)),this.He=this.He.insert(e.key,this.Rt(e.key).add(t))}et(t,e,n){if(!this.rt(t))return;const r=this.nt(t);this.It(t,e)?r.Ke(e,1):r.Ue(e),this.He=this.He.insert(e,this.Rt(e).delete(t)),this.He=this.He.insert(e,this.Rt(e).add(t)),n&&(this.je=this.je.insert(e,n))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}$e(t){this.nt(t).$e()}nt(t){let e=this.ze.get(t);return e||(e=new ui,this.ze.set(t,e)),e}Rt(t){let e=this.He.get(t);return e||(e=new In(Ve),this.He=this.He.insert(t,e)),e}Et(t){let e=this.Je.get(t);return e||(e=new In(Ve),this.Je=this.Je.insert(t,e)),e}rt(t){const e=null!==this.ot(t);return e||me("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new ui),this.Ge.getRemoteKeysForTarget(t).forEach(e=>{this.et(t,e,null)})}It(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function hi(){return new bn(He.comparator)}function li(){return new bn(He.comparator)}const di=(()=>({asc:"ASCENDING",desc:"DESCENDING"}))(),fi=(()=>({"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"}))(),pi=(()=>({and:"AND",or:"OR"}))();class mi{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function gi(t,e){return t.useProto3Json||mn(e)?e:{value:e}}function yi(t,e){return t.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function vi(t,e){return t.useProto3Json?e.toBase64():e.toUint8Array()}function wi(t,e){return yi(t,e.toTimestamp())}function Ei(t){return _e(!!t,49232),on.fromTimestamp(function(t){const e=Rn(t);return new sn(e.seconds,e.nanos)}(t))}function _i(t,e){return bi(t,e).canonicalString()}function bi(t,e){const n=(r=t,new ze(["projects",r.projectId,"databases",r.database])).child("documents");var r;return void 0===e?n:n.child(e)}function Ti(t){const e=ze.fromString(t);return _e(ji(e),10190,{key:e.toString()}),e}function Si(t,e){return _i(t.databaseId,e.path)}function Ii(t,e){const n=Ti(e);if(n.get(1)!==t.databaseId.projectId)throw new Se(Te.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+t.databaseId.projectId);if(n.get(3)!==t.databaseId.database)throw new Se(Te.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+t.databaseId.database);return new He(Di(n))}function Ci(t,e){return _i(t.databaseId,e)}function Ai(t){return new ze(["projects",t.databaseId.projectId,"databases",t.databaseId.database]).canonicalString()}function Di(t){return _e(t.length>4&&"documents"===t.get(4),29091,{key:t.toString()}),t.popFirst(5)}function Ni(t,e,n){return{name:Si(t,e),fields:n.value.mapValue.fields}}function ki(t,e){return{documents:[Ci(t,e.path)]}}function Ri(t,e){const n={structuredQuery:{}},r=e.path;let s;null!==e.collectionGroup?(s=r,n.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=r.popLast(),n.structuredQuery.from=[{collectionId:r.lastSegment()}]),n.parent=Ci(t,s);const i=function(t){if(0!==t.length)return Ui(_r.create(t,"and"))}(e.filters);i&&(n.structuredQuery.where=i);const o=function(t){if(0!==t.length)return t.map(t=>{return{field:Pi((e=t).field),direction:Li(e.dir)};var e})}(e.orderBy);o&&(n.structuredQuery.orderBy=o);const a=gi(t,e.limit);return null!==a&&(n.structuredQuery.limit=a),e.startAt&&(n.structuredQuery.startAt={before:(u=e.startAt).inclusive,values:u.position}),e.endAt&&(n.structuredQuery.endAt=function(t){return{before:!t.inclusive,values:t.position}}(e.endAt)),{ft:n,parent:s};var u}function xi(t){let e=function(t){const e=Ti(t);return 4===e.length?ze.emptyPath():Di(e)}(t.parent);const n=t.structuredQuery,r=n.from?n.from.length:0;let s=null;if(r>0){_e(1===r,65062);const t=n.from[0];t.allDescendants?s=t.collectionId:e=e.child(t.collectionId)}let i=[];n.where&&(i=function(t){const e=Oi(t);return e instanceof _r&&Tr(e)?e.getFilters():[e]}(n.where));let o=[];n.orderBy&&(o=n.orderBy.map(t=>{return new yr(Fi((e=t).field),function(t){switch(t){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(e.direction));var e}));let a=null;n.limit&&(a=function(t){let e;return e="object"==typeof t?t.value:t,mn(e)?null:e}(n.limit));let u=null;n.startAt&&(u=function(t){const e=!!t.before,n=t.values||[];return new pr(n,e)}(n.startAt));let c=null;return n.endAt&&(c=function(t){const e=!t.before,n=t.values||[];return new pr(n,e)}(n.endAt)),function(t,e,n,r,s,i,o,a){return new Br(t,e,n,r,s,i,o,a)}(e,s,o,i,a,"F",u,c)}function Oi(t){return void 0!==t.unaryFilter?function(t){switch(t.unaryFilter.op){case"IS_NAN":const e=Fi(t.unaryFilter.field);return Er.create(e,"==",{doubleValue:NaN});case"IS_NULL":const n=Fi(t.unaryFilter.field);return Er.create(n,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const r=Fi(t.unaryFilter.field);return Er.create(r,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const s=Fi(t.unaryFilter.field);return Er.create(s,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return we(61313);default:return we(60726)}}(t):void 0!==t.fieldFilter?(e=t,Er.create(Fi(e.fieldFilter.field),function(t){switch(t){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return we(58110);default:return we(50506)}}(e.fieldFilter.op),e.fieldFilter.value)):void 0!==t.compositeFilter?function(t){return _r.create(t.compositeFilter.filters.map(t=>Oi(t)),function(t){switch(t){case"AND":return"and";case"OR":return"or";default:return we(1026)}}(t.compositeFilter.op))}(t):we(30097,{filter:t});var e}function Li(t){return di[t]}function Mi(t){return fi[t]}function Vi(t){return pi[t]}function Pi(t){return{fieldPath:t.canonicalString()}}function Fi(t){return Ke.fromServerFormat(t.fieldPath)}function Ui(t){return t instanceof Er?function(t){if("=="===t.op){if(ur(t.value))return{unaryFilter:{field:Pi(t.field),op:"IS_NAN"}};if(ar(t.value))return{unaryFilter:{field:Pi(t.field),op:"IS_NULL"}}}else if("!="===t.op){if(ur(t.value))return{unaryFilter:{field:Pi(t.field),op:"IS_NOT_NAN"}};if(ar(t.value))return{unaryFilter:{field:Pi(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Pi(t.field),op:Mi(t.op),value:t.value}}}(t):t instanceof _r?function(t){const e=t.getFilters().map(t=>Ui(t));return 1===e.length?e[0]:{compositeFilter:{op:Vi(t.op),filters:e}}}(t):we(54877,{filter:t})}function Bi(t){const e=[];return t.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function ji(t){return t.length>=4&&"projects"===t.get(0)&&"databases"===t.get(2)}function qi(t){return!!t&&"function"==typeof t._toProto&&"ProtoValue"===t._protoValueType}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $i{constructor(t,e,n,r,s=on.min(),i=on.min(),o=Nn.EMPTY_BYTE_STRING,a=null){this.target=t,this.targetId=e,this.purpose=n,this.sequenceNumber=r,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=i,this.resumeToken=o,this.expectedCount=a}withSequenceNumber(t){return new $i(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new $i(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new $i(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new $i(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zi{constructor(t){this.yt=t}}function Gi(t){const e=xi({parent:t.parent,structuredQuery:t.structuredQuery});return"LAST"===t.limitType?Hr(e,e.limit,"L"):e}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ki{constructor(){this.bn=new Hi}addToCollectionParentIndex(t,e){return this.bn.add(e),dn.resolve()}getCollectionParents(t,e){return dn.resolve(this.bn.getEntries(e))}addFieldIndex(t,e){return dn.resolve()}deleteFieldIndex(t,e){return dn.resolve()}deleteAllFieldIndexes(t){return dn.resolve()}createTargetIndexes(t,e){return dn.resolve()}getDocumentsMatchingTarget(t,e){return dn.resolve(null)}getIndexType(t,e){return dn.resolve(0)}getFieldIndexes(t,e){return dn.resolve([])}getNextCollectionGroupToUpdate(t){return dn.resolve(null)}getMinOffset(t,e){return dn.resolve(un.min())}getMinOffsetFromCollectionGroup(t,e){return dn.resolve(un.min())}updateCollectionGroup(t,e,n){return dn.resolve()}updateIndexEntries(t,e){return dn.resolve()}}class Hi{constructor(){this.index={}}add(t){const e=t.lastSegment(),n=t.popLast(),r=this.index[e]||new In(ze.comparator),s=!r.has(n);return this.index[e]=r.add(n),s}has(t){const e=t.lastSegment(),n=t.popLast(),r=this.index[e];return r&&r.has(n)}getEntries(t){return(this.index[t]||new In(ze.comparator)).toArray()}}
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qi={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Wi=41943040;class Yi{static withCacheSize(t){return new Yi(t,Yi.DEFAULT_COLLECTION_PERCENTILE,Yi.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,n){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=n}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Yi.DEFAULT_COLLECTION_PERCENTILE=10,Yi.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Yi.DEFAULT=new Yi(Wi,Yi.DEFAULT_COLLECTION_PERCENTILE,Yi.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Yi.DISABLED=new Yi(-1,0,0);
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xi{constructor(t){this.sr=t}next(){return this.sr+=2,this.sr}static _r(){return new Xi(0)}static ar(){return new Xi(-1)}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ji="LruGarbageCollector";function Zi([t,e],[n,r]){const s=Ve(t,n);return 0===s?Ve(e,r):s}class to{constructor(t){this.Pr=t,this.buffer=new In(Zi),this.Tr=0}Er(){return++this.Tr}Ir(t){const e=[t,this.Er()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(e);else{const t=this.buffer.last();Zi(e,t)<0&&(this.buffer=this.buffer.delete(t).add(e))}}get maxValue(){return this.buffer.last()[0]}}class eo{constructor(t,e,n){this.garbageCollector=t,this.asyncQueue=e,this.localStore=n,this.Rr=null}start(){-1!==this.garbageCollector.params.cacheSizeCollectionThreshold&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return null!==this.Rr}Ar(t){me(Ji,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,()=>c(this,null,function*(){this.Rr=null;try{yield this.localStore.collectGarbage(this.garbageCollector)}catch(t){fn(t)?me(Ji,"Ignoring IndexedDB error during garbage collection: ",t):yield ln(t)}yield this.Ar(3e5)}))}}class no{constructor(t,e){this.Vr=t,this.params=e}calculateTargetCount(t,e){return this.Vr.dr(t).next(t=>Math.floor(e/100*t))}nthSequenceNumber(t,e){if(0===e)return dn.resolve(pn.ce);const n=new to(e);return this.Vr.forEachTarget(t,t=>n.Ir(t.sequenceNumber)).next(()=>this.Vr.mr(t,t=>n.Ir(t))).next(()=>n.maxValue)}removeTargets(t,e,n){return this.Vr.removeTargets(t,e,n)}removeOrphanedDocuments(t,e){return this.Vr.removeOrphanedDocuments(t,e)}collect(t,e){return-1===this.params.cacheSizeCollectionThreshold?(me("LruGarbageCollector","Garbage collection skipped; disabled"),dn.resolve(Qi)):this.getCacheSize(t).next(n=>n<this.params.cacheSizeCollectionThreshold?(me("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Qi):this.gr(t,e))}getCacheSize(t){return this.Vr.getCacheSize(t)}gr(t,e){let n,r,s,i,o,a,u;const c=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next(e=>(e>this.params.maximumSequenceNumbersToCollect?(me("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${e}`),r=this.params.maximumSequenceNumbersToCollect):r=e,i=Date.now(),this.nthSequenceNumber(t,r))).next(r=>(n=r,o=Date.now(),this.removeTargets(t,n,e))).next(e=>(s=e,a=Date.now(),this.removeOrphanedDocuments(t,n))).next(t=>(u=Date.now(),pe()<=O.DEBUG&&me("LruGarbageCollector",`LRU Garbage Collection\n\tCounted targets in ${i-c}ms\n\tDetermined least recently used ${r} in `+(o-i)+`ms\n\tRemoved ${s} targets in `+(a-o)+`ms\n\tRemoved ${t} documents in `+(u-a)+`ms\nTotal Duration: ${u-c}ms`),dn.resolve({didRun:!0,sequenceNumbersCollected:r,targetsRemoved:s,documentsRemoved:t})))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ro{constructor(){this.changes=new ts(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,fr.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const n=this.changes.get(e);return void 0!==n?dn.resolve(n):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class so{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class io{constructor(t,e,n,r){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=n,this.indexManager=r}getDocument(t,e){let n=null;return this.documentOverlayCache.getOverlay(t,e).next(r=>(n=r,this.remoteDocumentCache.getEntry(t,e))).next(t=>(null!==n&&Ms(n.mutation,t,An.empty(),sn.now()),t))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(e=>this.getLocalViewOfDocuments(t,e,ls()).next(()=>e))}getLocalViewOfDocuments(t,e,n=ls()){const r=os();return this.populateOverlays(t,r,e).next(()=>this.computeViews(t,e,r,n).next(t=>{let e=ss();return t.forEach((t,n)=>{e=e.insert(t,n.overlayedDocument)}),e}))}getOverlayedDocuments(t,e){const n=os();return this.populateOverlays(t,n,e).next(()=>this.computeViews(t,e,n,ls()))}populateOverlays(t,e,n){const r=[];return n.forEach(t=>{e.has(t)||r.push(t)}),this.documentOverlayCache.getOverlays(t,r).next(t=>{t.forEach((t,n)=>{e.set(t,n)})})}computeViews(t,e,n,r){let s=ns();const i=us(),o=us();return e.forEach((t,e)=>{const o=n.get(e.key);r.has(e.key)&&(void 0===o||o.mutation instanceof Us)?s=s.insert(e.key,e):void 0!==o?(i.set(e.key,o.mutation.getFieldMask()),Ms(o.mutation,e,o.mutation.getFieldMask(),sn.now())):i.set(e.key,An.empty())}),this.recalculateAndSaveOverlays(t,s).next(t=>(t.forEach((t,e)=>i.set(t,e)),e.forEach((t,e)=>{var n;return o.set(t,new so(e,null!=(n=i.get(t))?n:null))}),o))}recalculateAndSaveOverlays(t,e){const n=us();let r=new bn((t,e)=>t-e),s=ls();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(t=>{for(const s of t)s.keys().forEach(t=>{const i=e.get(t);if(null===i)return;let o=n.get(t)||An.empty();o=s.applyToLocalView(i,o),n.set(t,o);const a=(r.get(s.batchId)||ls()).add(t);r=r.insert(s.batchId,a)})}).next(()=>{const i=[],o=r.getReverseIterator();for(;o.hasNext();){const r=o.getNext(),a=r.key,u=r.value,c=as();u.forEach(t=>{if(!s.has(t)){const r=Os(e.get(t),n.get(t));null!==r&&c.set(t,r),s=s.add(t)}}),i.push(this.documentOverlayCache.saveOverlays(t,a,c))}return dn.waitFor(i)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(e=>this.recalculateAndSaveOverlays(t,e))}getDocumentsMatchingQuery(t,e,n,r){return function(t){return He.isDocumentKey(t.path)&&null===t.collectionGroup&&0===t.filters.length}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):$r(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,n,r):this.getDocumentsMatchingCollectionQuery(t,e,n,r)}getNextDocuments(t,e,n,r){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,n,r).next(s=>{const i=r-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,n.largestBatchId,r-s.size):dn.resolve(os());let o=-1,a=s;return i.next(e=>dn.forEach(e,(e,n)=>(o<n.largestBatchId&&(o=n.largestBatchId),s.get(e)?dn.resolve():this.remoteDocumentCache.getEntry(t,e).next(t=>{a=a.insert(e,t)}))).next(()=>this.populateOverlays(t,e,s)).next(()=>this.computeViews(t,a,e,ls())).next(t=>({batchId:o,changes:is(t)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new He(e)).next(t=>{let e=ss();return t.isFoundDocument()&&(e=e.insert(t.key,t)),e})}getDocumentsMatchingCollectionGroupQuery(t,e,n,r){const s=e.collectionGroup;let i=ss();return this.indexManager.getCollectionParents(t,s).next(o=>dn.forEach(o,o=>{const a=(u=e,c=o.child(s),new Br(c,null,u.explicitOrderBy.slice(),u.filters.slice(),u.limit,u.limitType,u.startAt,u.endAt));var u,c;return this.getDocumentsMatchingCollectionQuery(t,a,n,r).next(t=>{t.forEach((t,e)=>{i=i.insert(t,e)})})}).next(()=>i))}getDocumentsMatchingCollectionQuery(t,e,n,r){let s;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,n.largestBatchId).next(i=>(s=i,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,n,s,r))).next(t=>{s.forEach((e,n)=>{const r=n.getKey();null===t.get(r)&&(t=t.insert(r,fr.newInvalidDocument(r)))});let n=ss();return t.forEach((t,r)=>{const i=s.get(t);void 0!==i&&Ms(i.mutation,r,An.empty(),sn.now()),Xr(e,r)&&(n=n.insert(t,r))}),n})}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oo{constructor(t){this.serializer=t,this.Nr=new Map,this.Br=new Map}getBundleMetadata(t,e){return dn.resolve(this.Nr.get(e))}saveBundleMetadata(t,e){return this.Nr.set(e.id,{id:(n=e).id,version:n.version,createTime:Ei(n.createTime)}),dn.resolve();var n}getNamedQuery(t,e){return dn.resolve(this.Br.get(e))}saveNamedQuery(t,e){return this.Br.set(e.name,{name:(n=e).name,query:Gi(n.bundledQuery),readTime:Ei(n.readTime)}),dn.resolve();var n}}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ao{constructor(){this.overlays=new bn(He.comparator),this.Lr=new Map}getOverlay(t,e){return dn.resolve(this.overlays.get(e))}getOverlays(t,e){const n=os();return dn.forEach(e,e=>this.getOverlay(t,e).next(t=>{null!==t&&n.set(e,t)})).next(()=>n)}saveOverlays(t,e,n){return n.forEach((n,r)=>{this.St(t,e,r)}),dn.resolve()}removeOverlaysForBatchId(t,e,n){const r=this.Lr.get(n);return void 0!==r&&(r.forEach(t=>this.overlays=this.overlays.remove(t)),this.Lr.delete(n)),dn.resolve()}getOverlaysForCollection(t,e,n){const r=os(),s=e.length+1,i=new He(e.child("")),o=this.overlays.getIteratorFrom(i);for(;o.hasNext();){const t=o.getNext().value,i=t.getKey();if(!e.isPrefixOf(i.path))break;i.path.length===s&&t.largestBatchId>n&&r.set(t.getKey(),t)}return dn.resolve(r)}getOverlaysForCollectionGroup(t,e,n,r){let s=new bn((t,e)=>t-e);const i=this.overlays.getIterator();for(;i.hasNext();){const t=i.getNext().value;if(t.getKey().getCollectionGroup()===e&&t.largestBatchId>n){let e=s.get(t.largestBatchId);null===e&&(e=os(),s=s.insert(t.largestBatchId,e)),e.set(t.getKey(),t)}}const o=os(),a=s.getIterator();for(;a.hasNext()&&(a.getNext().value.forEach((t,e)=>o.set(t,e)),!(o.size()>=r)););return dn.resolve(o)}St(t,e,n){const r=this.overlays.get(n.key);if(null!==r){const t=this.Lr.get(r.largestBatchId).delete(n.key);this.Lr.set(r.largestBatchId,t)}this.overlays=this.overlays.insert(n.key,new Hs(e,n));let s=this.Lr.get(e);void 0===s&&(s=ls(),this.Lr.set(e,s)),this.Lr.set(e,s.add(n.key))}}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uo{constructor(){this.sessionToken=Nn.EMPTY_BYTE_STRING}getSessionToken(t){return dn.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,dn.resolve()}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class co{constructor(){this.kr=new In(ho.qr),this.Kr=new In(ho.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(t,e){const n=new ho(t,e);this.kr=this.kr.add(n),this.Kr=this.Kr.add(n)}$r(t,e){t.forEach(t=>this.addReference(t,e))}removeReference(t,e){this.Wr(new ho(t,e))}Qr(t,e){t.forEach(t=>this.removeReference(t,e))}Gr(t){const e=new He(new ze([])),n=new ho(e,t),r=new ho(e,t+1),s=[];return this.Kr.forEachInRange([n,r],t=>{this.Wr(t),s.push(t.key)}),s}zr(){this.kr.forEach(t=>this.Wr(t))}Wr(t){this.kr=this.kr.delete(t),this.Kr=this.Kr.delete(t)}jr(t){const e=new He(new ze([])),n=new ho(e,t),r=new ho(e,t+1);let s=ls();return this.Kr.forEachInRange([n,r],t=>{s=s.add(t.key)}),s}containsKey(t){const e=new ho(t,0),n=this.kr.firstAfterOrEqual(e);return null!==n&&t.isEqual(n.key)}}class ho{constructor(t,e){this.key=t,this.Jr=e}static qr(t,e){return He.comparator(t.key,e.key)||Ve(t.Jr,e.Jr)}static Ur(t,e){return Ve(t.Jr,e.Jr)||He.comparator(t.key,e.key)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lo{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.Yn=1,this.Hr=new In(ho.qr)}checkEmpty(t){return dn.resolve(0===this.mutationQueue.length)}addMutationBatch(t,e,n,r){const s=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const i=new Gs(s,e,n,r);this.mutationQueue.push(i);for(const o of r)this.Hr=this.Hr.add(new ho(o.key,s)),this.indexManager.addToCollectionParentIndex(t,o.key.path.popLast());return dn.resolve(i)}lookupMutationBatch(t,e){return dn.resolve(this.Zr(e))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,r=this.Xr(n),s=r<0?0:r;return dn.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return dn.resolve(0===this.mutationQueue.length?-1:this.Yn-1)}getAllMutationBatches(t){return dn.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const n=new ho(e,0),r=new ho(e,Number.POSITIVE_INFINITY),s=[];return this.Hr.forEachInRange([n,r],t=>{const e=this.Zr(t.Jr);s.push(e)}),dn.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new In(Ve);return e.forEach(t=>{const e=new ho(t,0),r=new ho(t,Number.POSITIVE_INFINITY);this.Hr.forEachInRange([e,r],t=>{n=n.add(t.Jr)})}),dn.resolve(this.Yr(n))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,r=n.length+1;let s=n;He.isDocumentKey(s)||(s=s.child(""));const i=new ho(new He(s),0);let o=new In(Ve);return this.Hr.forEachWhile(t=>{const e=t.key.path;return!!n.isPrefixOf(e)&&(e.length===r&&(o=o.add(t.Jr)),!0)},i),dn.resolve(this.Yr(o))}Yr(t){const e=[];return t.forEach(t=>{const n=this.Zr(t);null!==n&&e.push(n)}),e}removeMutationBatch(t,e){_e(0===this.ei(e.batchId,"removed"),55003),this.mutationQueue.shift();let n=this.Hr;return dn.forEach(e.mutations,r=>{const s=new ho(r.key,e.batchId);return n=n.delete(s),this.referenceDelegate.markPotentiallyOrphaned(t,r.key)}).next(()=>{this.Hr=n})}nr(t){}containsKey(t,e){const n=new ho(e,0),r=this.Hr.firstAfterOrEqual(n);return dn.resolve(e.isEqual(r&&r.key))}performConsistencyCheck(t){return this.mutationQueue.length,dn.resolve()}ei(t,e){return this.Xr(t)}Xr(t){return 0===this.mutationQueue.length?0:t-this.mutationQueue[0].batchId}Zr(t){const e=this.Xr(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fo{constructor(t){this.ti=t,this.docs=new bn(He.comparator),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const n=e.key,r=this.docs.get(n),s=r?r.size:0,i=this.ti(e);return this.docs=this.docs.insert(n,{document:e.mutableCopy(),size:i}),this.size+=i-s,this.indexManager.addToCollectionParentIndex(t,n.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const n=this.docs.get(e);return dn.resolve(n?n.document.mutableCopy():fr.newInvalidDocument(e))}getEntries(t,e){let n=ns();return e.forEach(t=>{const e=this.docs.get(t);n=n.insert(t,e?e.document.mutableCopy():fr.newInvalidDocument(t))}),dn.resolve(n)}getDocumentsMatchingQuery(t,e,n,r){let s=ns();const i=e.path,o=new He(i.child("__id-9223372036854775808__")),a=this.docs.getIteratorFrom(o);for(;a.hasNext();){const{key:t,value:{document:o}}=a.getNext();if(!i.isPrefixOf(t.path))break;t.path.length>i.length+1||cn(an(o),n)<=0||(r.has(o.key)||Xr(e,o))&&(s=s.insert(o.key,o.mutableCopy()))}return dn.resolve(s)}getAllFromCollectionGroup(t,e,n,r){we(9500)}ni(t,e){return dn.forEach(this.docs,t=>e(t))}newChangeBuffer(t){return new po(this)}getSize(t){return dn.resolve(this.size)}}class po extends ro{constructor(t){super(),this.Mr=t}applyChanges(t){const e=[];return this.changes.forEach((n,r)=>{r.isValidDocument()?e.push(this.Mr.addEntry(t,r)):this.Mr.removeEntry(n)}),dn.waitFor(e)}getFromCache(t,e){return this.Mr.getEntry(t,e)}getAllFromCache(t,e){return this.Mr.getEntries(t,e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mo{constructor(t){this.persistence=t,this.ri=new ts(t=>Pr(t),Fr),this.lastRemoteSnapshotVersion=on.min(),this.highestTargetId=0,this.ii=0,this.si=new co,this.targetCount=0,this.oi=Xi._r()}forEachTarget(t,e){return this.ri.forEach((t,n)=>e(n)),dn.resolve()}getLastRemoteSnapshotVersion(t){return dn.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return dn.resolve(this.ii)}allocateTargetId(t){return this.highestTargetId=this.oi.next(),dn.resolve(this.highestTargetId)}setTargetsMetadata(t,e,n){return n&&(this.lastRemoteSnapshotVersion=n),e>this.ii&&(this.ii=e),dn.resolve()}lr(t){this.ri.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.oi=new Xi(e),this.highestTargetId=e),t.sequenceNumber>this.ii&&(this.ii=t.sequenceNumber)}addTargetData(t,e){return this.lr(e),this.targetCount+=1,dn.resolve()}updateTargetData(t,e){return this.lr(e),dn.resolve()}removeTargetData(t,e){return this.ri.delete(e.target),this.si.Gr(e.targetId),this.targetCount-=1,dn.resolve()}removeTargets(t,e,n){let r=0;const s=[];return this.ri.forEach((i,o)=>{o.sequenceNumber<=e&&null===n.get(o.targetId)&&(this.ri.delete(i),s.push(this.removeMatchingKeysForTargetId(t,o.targetId)),r++)}),dn.waitFor(s).next(()=>r)}getTargetCount(t){return dn.resolve(this.targetCount)}getTargetData(t,e){const n=this.ri.get(e)||null;return dn.resolve(n)}addMatchingKeys(t,e,n){return this.si.$r(e,n),dn.resolve()}removeMatchingKeys(t,e,n){this.si.Qr(e,n);const r=this.persistence.referenceDelegate,s=[];return r&&e.forEach(e=>{s.push(r.markPotentiallyOrphaned(t,e))}),dn.waitFor(s)}removeMatchingKeysForTargetId(t,e){return this.si.Gr(e),dn.resolve()}getMatchingKeysForTargetId(t,e){const n=this.si.jr(e);return dn.resolve(n)}containsKey(t,e){return dn.resolve(this.si.containsKey(e))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class go{constructor(t,e){this._i={},this.overlays={},this.ai=new pn(0),this.ui=!1,this.ui=!0,this.ci=new uo,this.referenceDelegate=t(this),this.li=new mo(this),this.indexManager=new Ki,this.remoteDocumentCache=new fo(t=>this.referenceDelegate.hi(t)),this.serializer=new zi(e),this.Pi=new oo(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new ao,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let n=this._i[t.toKey()];return n||(n=new lo(e,this.referenceDelegate),this._i[t.toKey()]=n),n}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(t,e,n){me("MemoryPersistence","Starting transaction:",t);const r=new yo(this.ai.next());return this.referenceDelegate.Ti(),n(r).next(t=>this.referenceDelegate.Ei(r).next(()=>t)).toPromise().then(t=>(r.raiseOnCommittedEvent(),t))}Ii(t,e){return dn.or(Object.values(this._i).map(n=>()=>n.containsKey(t,e)))}}class yo extends hn{constructor(t){super(),this.currentSequenceNumber=t}}class vo{constructor(t){this.persistence=t,this.Ri=new co,this.Ai=null}static Vi(t){return new vo(t)}get di(){if(this.Ai)return this.Ai;throw we(60996)}addReference(t,e,n){return this.Ri.addReference(n,e),this.di.delete(n.toString()),dn.resolve()}removeReference(t,e,n){return this.Ri.removeReference(n,e),this.di.add(n.toString()),dn.resolve()}markPotentiallyOrphaned(t,e){return this.di.add(e.toString()),dn.resolve()}removeTarget(t,e){this.Ri.Gr(e.targetId).forEach(t=>this.di.add(t.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(t,e.targetId).next(t=>{t.forEach(t=>this.di.add(t.toString()))}).next(()=>n.removeTargetData(t,e))}Ti(){this.Ai=new Set}Ei(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return dn.forEach(this.di,n=>{const r=He.fromPath(n);return this.mi(t,r).next(t=>{t||e.removeEntry(r,on.min())})}).next(()=>(this.Ai=null,e.apply(t)))}updateLimboDocument(t,e){return this.mi(t,e).next(t=>{t?this.di.delete(e.toString()):this.di.add(e.toString())})}hi(t){return 0}mi(t,e){return dn.or([()=>dn.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ii(t,e)])}}class wo{constructor(t,e){this.persistence=t,this.fi=new ts(t=>function(t){let e="";for(let n=0;n<t.length;n++)e.length>0&&(e=vn(e)),e=yn(t.get(n),e);return vn(e)}(t.path),(t,e)=>t.isEqual(e)),this.garbageCollector=function(t,e){return new no(t,e)}(this,e)}static Vi(t,e){return new wo(t,e)}Ti(){}Ei(t){return dn.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}dr(t){const e=this.pr(t);return this.persistence.getTargetCache().getTargetCount(t).next(t=>e.next(e=>t+e))}pr(t){let e=0;return this.mr(t,t=>{e++}).next(()=>e)}mr(t,e){return dn.forEach(this.fi,(n,r)=>this.wr(t,n,r).next(t=>t?dn.resolve():e(r)))}removeTargets(t,e,n){return this.persistence.getTargetCache().removeTargets(t,e,n)}removeOrphanedDocuments(t,e){let n=0;const r=this.persistence.getRemoteDocumentCache(),s=r.newChangeBuffer();return r.ni(t,r=>this.wr(t,r,e).next(t=>{t||(n++,s.removeEntry(r,on.min()))})).next(()=>s.apply(t)).next(()=>n)}markPotentiallyOrphaned(t,e){return this.fi.set(e,t.currentSequenceNumber),dn.resolve()}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,n)}addReference(t,e,n){return this.fi.set(n,t.currentSequenceNumber),dn.resolve()}removeReference(t,e,n){return this.fi.set(n,t.currentSequenceNumber),dn.resolve()}updateLimboDocument(t,e){return this.fi.set(e,t.currentSequenceNumber),dn.resolve()}hi(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=rr(t.data.value)),e}wr(t,e,n){return dn.or([()=>this.persistence.Ii(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const t=this.fi.get(e);return dn.resolve(void 0!==t&&t>n)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eo{constructor(t,e,n,r){this.targetId=t,this.fromCache=e,this.Ts=n,this.Es=r}static Is(t,e){let n=ls(),r=ls();for(const s of e.docChanges)switch(s.type){case 0:n=n.add(s.doc.key);break;case 1:r=r.add(s.doc.key)}return new Eo(t,e.fromCache,n,r)}}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _o{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bo{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=_()?8:function(t){const e=t.match(/Android ([\d.]+)/i),n=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(n)}("undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:"")>0?6:4}initialize(t,e){this.fs=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,n,r){const s={result:null};return this.gs(t,e).next(t=>{s.result=t}).next(()=>{if(!s.result)return this.ps(t,e,r,n).next(t=>{s.result=t})}).next(()=>{if(s.result)return;const n=new _o;return this.ys(t,e,n).next(r=>{if(s.result=r,this.As)return this.ws(t,e,n,r.size)})}).next(()=>s.result)}ws(t,e,n,r){return n.documentReadCount<this.Vs?(pe()<=O.DEBUG&&me("QueryEngine","SDK will not create cache indexes for query:",Yr(e),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),dn.resolve()):(pe()<=O.DEBUG&&me("QueryEngine","Query:",Yr(e),"scans",n.documentReadCount,"local documents and returns",r,"documents as results."),n.documentReadCount>this.ds*r?(pe()<=O.DEBUG&&me("QueryEngine","The SDK decides to create cache indexes for query:",Yr(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,Gr(e))):dn.resolve())}gs(t,e){if(qr(e))return dn.resolve(null);let n=Gr(e);return this.indexManager.getIndexType(t,n).next(r=>0===r?null:(null!==e.limit&&1===r&&(e=Hr(e,null,"F"),n=Gr(e)),this.indexManager.getDocumentsMatchingTarget(t,n).next(r=>{const s=ls(...r);return this.fs.getDocuments(t,s).next(r=>this.indexManager.getMinOffset(t,n).next(n=>{const i=this.Ss(e,r);return this.bs(e,i,s,n.readTime)?this.gs(t,Hr(e,null,"F")):this.Ds(t,i,e,n)}))})))}ps(t,e,n,r){return qr(e)||r.isEqual(on.min())?dn.resolve(null):this.fs.getDocuments(t,n).next(s=>{const i=this.Ss(e,s);return this.bs(e,i,n,r)?dn.resolve(null):(pe()<=O.DEBUG&&me("QueryEngine","Re-using previous result from %s to execute query: %s",r.toString(),Yr(e)),this.Ds(t,i,e,function(t,e){const n=t.toTimestamp().seconds,r=t.toTimestamp().nanoseconds+1,s=on.fromTimestamp(1e9===r?new sn(n+1,0):new sn(n,r));return new un(s,He.empty(),e)}(r,-1)).next(t=>t))})}Ss(t,e){let n=new In(Jr(t));return e.forEach((e,r)=>{Xr(t,r)&&(n=n.add(r))}),n}bs(t,e,n,r){if(null===t.limit)return!1;if(n.size!==e.size)return!0;const s="F"===t.limitType?e.last():e.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(r)>0)}ys(t,e,n){return pe()<=O.DEBUG&&me("QueryEngine","Using full collection scan to execute query:",Yr(e)),this.fs.getDocumentsMatchingQuery(t,e,un.min(),n)}Ds(t,e,n,r){return this.fs.getDocumentsMatchingQuery(t,n,r).next(t=>(e.forEach(e=>{t=t.insert(e.key,e)}),t))}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const To="LocalStore";class So{constructor(t,e,n,r){this.persistence=t,this.Cs=e,this.serializer=r,this.vs=new bn(Ve),this.Fs=new ts(t=>Pr(t),Fr),this.Ms=new Map,this.xs=t.getRemoteDocumentCache(),this.li=t.getTargetCache(),this.Pi=t.getBundleCache(),this.Os(n)}Os(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new io(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.vs))}}function Io(t,e){return c(this,null,function*(){const n=be(t);return yield n.persistence.runTransaction("Handle user change","readonly",t=>{let r;return n.mutationQueue.getAllMutationBatches(t).next(s=>(r=s,n.Os(e),n.mutationQueue.getAllMutationBatches(t))).next(e=>{const s=[],i=[];let o=ls();for(const t of r){s.push(t.batchId);for(const e of t.mutations)o=o.add(e.key)}for(const t of e){i.push(t.batchId);for(const e of t.mutations)o=o.add(e.key)}return n.localDocuments.getDocuments(t,o).next(t=>({Ns:t,removedBatchIds:s,addedBatchIds:i}))})})})}function Co(t){const e=be(t);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.li.getLastRemoteSnapshotVersion(t))}function Ao(t,e){const n=be(t),r=e.snapshotVersion;let s=n.vs;return n.persistence.runTransaction("Apply remote event","readwrite-primary",t=>{const i=n.xs.newChangeBuffer({trackRemovals:!0});s=n.vs;const o=[];e.targetChanges.forEach((i,a)=>{const u=s.get(a);if(!u)return;o.push(n.li.removeMatchingKeys(t,i.removedDocuments,a).next(()=>n.li.addMatchingKeys(t,i.addedDocuments,a)));let c=u.withSequenceNumber(t.currentSequenceNumber);null!==e.targetMismatches.get(a)?c=c.withResumeToken(Nn.EMPTY_BYTE_STRING,on.min()).withLastLimboFreeSnapshotVersion(on.min()):i.resumeToken.approximateByteSize()>0&&(c=c.withResumeToken(i.resumeToken,r)),s=s.insert(a,c),function(t,e,n){if(0===t.resumeToken.approximateByteSize())return!0;if(e.snapshotVersion.toMicroseconds()-t.snapshotVersion.toMicroseconds()>=3e8)return!0;return n.addedDocuments.size+n.modifiedDocuments.size+n.removedDocuments.size>0}(u,c,i)&&o.push(n.li.updateTargetData(t,c))});let a=ns(),u=ls();if(e.documentUpdates.forEach(r=>{e.resolvedLimboDocuments.has(r)&&o.push(n.persistence.referenceDelegate.updateLimboDocument(t,r))}),o.push(function(t,e,n){let r=ls(),s=ls();return n.forEach(t=>r=r.add(t)),e.getEntries(t,r).next(t=>{let r=ns();return n.forEach((n,i)=>{const o=t.get(n);i.isFoundDocument()!==o.isFoundDocument()&&(s=s.add(n)),i.isNoDocument()&&i.version.isEqual(on.min())?(e.removeEntry(n,i.readTime),r=r.insert(n,i)):!o.isValidDocument()||i.version.compareTo(o.version)>0||0===i.version.compareTo(o.version)&&o.hasPendingWrites?(e.addEntry(i),r=r.insert(n,i)):me(To,"Ignoring outdated watch update for ",n,". Current version:",o.version," Watch version:",i.version)}),{Bs:r,Ls:s}})}(t,i,e.documentUpdates).next(t=>{a=t.Bs,u=t.Ls})),!r.isEqual(on.min())){const e=n.li.getLastRemoteSnapshotVersion(t).next(e=>n.li.setTargetsMetadata(t,t.currentSequenceNumber,r));o.push(e)}return dn.waitFor(o).next(()=>i.apply(t)).next(()=>n.localDocuments.getLocalViewOfDocuments(t,a,u)).next(()=>a)}).then(t=>(n.vs=s,t))}function Do(t,e){const n=be(t);return n.persistence.runTransaction("Get next mutation batch","readonly",t=>(void 0===e&&(e=-1),n.mutationQueue.getNextMutationBatchAfterBatchId(t,e)))}function No(t,e,n){return c(this,null,function*(){const r=be(t),s=r.vs.get(e),i=n?"readwrite":"readwrite-primary";try{n||(yield r.persistence.runTransaction("Release target",i,t=>r.persistence.referenceDelegate.removeTarget(t,s)))}catch(o){if(!fn(o))throw o;me(To,`Failed to update sequence numbers for target ${e}: ${o}`)}r.vs=r.vs.remove(e),r.Fs.delete(s.target)})}function ko(t,e,n){const r=be(t);let s=on.min(),i=ls();return r.persistence.runTransaction("Execute query","readwrite",t=>function(t,e,n){const r=be(t),s=r.Fs.get(n);return void 0!==s?dn.resolve(r.vs.get(s)):r.li.getTargetData(e,n)}(r,t,Gr(e)).next(e=>{if(e)return s=e.lastLimboFreeSnapshotVersion,r.li.getMatchingKeysForTargetId(t,e.targetId).next(t=>{i=t})}).next(()=>r.Cs.getDocumentsMatchingQuery(t,e,n?s:on.min(),n?i:ls())).next(t=>(function(t,e,n){let r=t.Ms.get(e)||on.min();n.forEach((t,e)=>{e.readTime.compareTo(r)>0&&(r=e.readTime)}),t.Ms.set(e,r)}(r,function(t){return t.collectionGroup||(t.path.length%2==1?t.path.lastSegment():t.path.get(t.path.length-2))}(e),t),{documents:t,ks:i})))}class Ro{constructor(){this.activeTargetIds=ds}Qs(t){this.activeTargetIds=this.activeTargetIds.add(t)}Gs(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Ws(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class xo{constructor(){this.vo=new Ro,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,n){}addLocalQueryTarget(t,e=!0){return e&&this.vo.Qs(t),this.Fo[t]||"not-current"}updateQueryState(t,e,n){this.Fo[t]=e}removeLocalQueryTarget(t){this.vo.Gs(t)}isLocalQueryTarget(t){return this.vo.activeTargetIds.has(t)}clearQueryState(t){delete this.Fo[t]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(t){return this.vo.activeTargetIds.has(t)}start(){return this.vo=new Ro,Promise.resolve()}handleUserChange(t,e,n){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oo{Mo(t){}shutdown(){}}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lo="ConnectivityMonitor";class Mo{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(t){this.Lo.push(t)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){me(Lo,"Network connectivity changed: AVAILABLE");for(const t of this.Lo)t(0)}Bo(){me(Lo,"Network connectivity changed: UNAVAILABLE");for(const t of this.Lo)t(1)}static v(){return"undefined"!=typeof window&&void 0!==window.addEventListener&&void 0!==window.removeEventListener}}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Vo=null;function Po(){return null===Vo?Vo=268435456+Math.round(2147483648*Math.random()):Vo++,"0x"+Vo.toString(16)
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */}const Fo="RestConnection",Uo={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class Bo{get qo(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),r=encodeURIComponent(this.databaseId.database);this.Ko=e+"://"+t.host,this.Uo=`projects/${n}/databases/${r}`,this.$o=this.databaseId.database===qn?`project_id=${n}`:`project_id=${n}&database_id=${r}`}Wo(t,e,n,r,s){const i=Po(),o=this.Qo(t,e.toUriEncodedString());me(Fo,`Sending RPC '${t}' ${i}:`,o,n);const a={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(a,r,s);const{host:u}=new URL(o),c=D(u);return this.zo(t,o,a,n,c).then(e=>(me(Fo,`Received RPC '${t}' ${i}: `,e),e),e=>{throw ye(Fo,`RPC '${t}' ${i} failed with error: `,e,"url: ",o,"request:",n),e})}jo(t,e,n,r,s,i){return this.Wo(t,e,n,r,s)}Go(t,e,n){t["X-Goog-Api-Client"]="gl-js/ fire/"+de,t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach((e,n)=>t[n]=e),n&&n.headers.forEach((e,n)=>t[n]=e)}Qo(t,e){const n=Uo[t];let r=`${this.Ko}/v1/${e}:${n}`;return this.databaseInfo.apiKey&&(r=`${r}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),r}terminate(){}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jo{constructor(t){this.Jo=t.Jo,this.Ho=t.Ho}Zo(t){this.Xo=t}Yo(t){this.e_=t}t_(t){this.n_=t}onMessage(t){this.r_=t}close(){this.Ho()}send(t){this.Jo(t)}i_(){this.Xo()}s_(){this.e_()}o_(t){this.n_(t)}__(t){this.r_(t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qo="WebChannelConnection",$o=(t,e,n)=>{t.listen(e,t=>{try{n(t)}catch(e){setTimeout(()=>{throw e},0)}})};class zo extends Bo{constructor(t){super(t),this.a_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}static u_(){if(!zo.c_){const t=ue();$o(t,ae.STAT_EVENT,t=>{t.stat===oe.PROXY?me(qo,"STAT_EVENT: detected buffering proxy"):t.stat===oe.NOPROXY&&me(qo,"STAT_EVENT: detected no buffering proxy")}),zo.c_=!0}}zo(t,e,n,r,s){const i=Po();return new Promise((s,o)=>{const a=new ne;a.setWithCredentials(!0),a.listenOnce(se.COMPLETE,()=>{try{switch(a.getLastErrorCode()){case ie.NO_ERROR:const e=a.getResponseJson();me(qo,`XHR for RPC '${t}' ${i} received:`,JSON.stringify(e)),s(e);break;case ie.TIMEOUT:me(qo,`RPC '${t}' ${i} timed out`),o(new Se(Te.DEADLINE_EXCEEDED,"Request time out"));break;case ie.HTTP_ERROR:const n=a.getStatus();if(me(qo,`RPC '${t}' ${i} failed with status:`,n,"response text:",a.getResponseText()),n>0){let t=a.getResponseJson();Array.isArray(t)&&(t=t[0]);const e=null==t?void 0:t.error;if(e&&e.status&&e.message){const t=function(t){const e=t.toLowerCase().replace(/_/g,"-");return Object.values(Te).indexOf(e)>=0?e:Te.UNKNOWN}(e.status);o(new Se(t,e.message))}else o(new Se(Te.UNKNOWN,"Server responded with status "+a.getStatus()))}else o(new Se(Te.UNAVAILABLE,"Connection failed."));break;default:we(9055,{l_:t,streamId:i,h_:a.getLastErrorCode(),P_:a.getLastError()})}}finally{me(qo,`RPC '${t}' ${i} completed.`)}});const u=JSON.stringify(r);me(qo,`RPC '${t}' ${i} sending request:`,r),a.send(e,"POST",u,n,15)})}T_(t,e,n){const r=Po(),s=[this.Ko,"/","google.firestore.v1.Firestore","/",t,"/channel"],i=this.createWebChannelTransport(),o={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},a=this.longPollingOptions.timeoutSeconds;void 0!==a&&(o.longPollingTimeout=Math.round(1e3*a)),this.useFetchStreams&&(o.useFetchStreams=!0),this.Go(o.initMessageHeaders,e,n),o.encodeInitMessageHeaders=!0;const u=s.join("");me(qo,`Creating RPC '${t}' stream ${r}: ${u}`,o);const c=i.createWebChannel(u,o);this.E_(c);let h=!1,l=!1;const d=new jo({Jo:e=>{l?me(qo,`Not sending because RPC '${t}' stream ${r} is closed:`,e):(h||(me(qo,`Opening RPC '${t}' stream ${r} transport.`),c.open(),h=!0),me(qo,`RPC '${t}' stream ${r} sending:`,e),c.send(e))},Ho:()=>c.close()});return $o(c,re.EventType.OPEN,()=>{l||(me(qo,`RPC '${t}' stream ${r} transport opened.`),d.i_())}),$o(c,re.EventType.CLOSE,()=>{l||(l=!0,me(qo,`RPC '${t}' stream ${r} transport closed`),d.o_(),this.I_(c))}),$o(c,re.EventType.ERROR,e=>{l||(l=!0,ye(qo,`RPC '${t}' stream ${r} transport errored. Name:`,e.name,"Message:",e.message),d.o_(new Se(Te.UNAVAILABLE,"The operation could not be completed")))}),$o(c,re.EventType.MESSAGE,e=>{var n;if(!l){const s=e.data[0];_e(!!s,16349);const i=s,o=(null==i?void 0:i.error)||(null==(n=i[0])?void 0:n.error);if(o){me(qo,`RPC '${t}' stream ${r} received error:`,o);const e=o.status;let n=function(t){const e=Ws[t];if(void 0!==e)return Xs(e)}(e),s=o.message;"NOT_FOUND"===e&&s.includes("database")&&s.includes("does not exist")&&s.includes(this.databaseId.database)&&ye(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),void 0===n&&(n=Te.INTERNAL,s="Unknown error status: "+e+" with message "+o.message),l=!0,d.o_(new Se(n,s)),c.close()}else me(qo,`RPC '${t}' stream ${r} received:`,s),d.__(s)}}),zo.u_(),setTimeout(()=>{d.s_()},0),d}terminate(){this.a_.forEach(t=>t.close()),this.a_=[]}E_(t){this.a_.push(t)}I_(t){this.a_=this.a_.filter(e=>e===t)}Go(t,e,n){super.Go(t,e,n),this.databaseInfo.apiKey&&(t["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return ce()}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Go(){return"undefined"!=typeof document?document:null}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ko(t){return new mi(t,!0)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */zo.c_=!1;class Ho{constructor(t,e,n=1e3,r=1.5,s=6e4){this.Ci=t,this.timerId=e,this.R_=n,this.A_=r,this.V_=s,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(t){this.cancel();const e=Math.floor(this.d_+this.y_()),n=Math.max(0,Date.now()-this.f_),r=Math.max(0,e-n);r>0&&me("ExponentialBackoff",`Backing off for ${r} ms (base delay: ${this.d_} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,r,()=>(this.f_=Date.now(),t())),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){null!==this.m_&&(this.m_.skipDelay(),this.m_=null)}cancel(){null!==this.m_&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qo="PersistentStream";class Wo{constructor(t,e,n,r,s,i,o,a){this.Ci=t,this.S_=n,this.b_=r,this.connection=s,this.authCredentialsProvider=i,this.appCheckCredentialsProvider=o,this.listener=a,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Ho(t,e)}x_(){return 1===this.state||5===this.state||this.O_()}O_(){return 2===this.state||3===this.state}start(){this.F_=0,4!==this.state?this.auth():this.N_()}stop(){return c(this,null,function*(){this.x_()&&(yield this.close(0))})}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&null===this.C_&&(this.C_=this.Ci.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(t){this.K_(),this.stream.send(t)}k_(){return c(this,null,function*(){if(this.O_())return this.close(0)})}K_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}close(t,e){return c(this,null,function*(){this.K_(),this.U_(),this.M_.cancel(),this.D_++,4!==t?this.M_.reset():e&&e.code===Te.RESOURCE_EXHAUSTED?(ge(e.toString()),ge("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===Te.UNAUTHENTICATED&&3!==this.state&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),null!==this.stream&&(this.W_(),this.stream.close(),this.stream=null),this.state=t,yield this.listener.t_(e)})}W_(){}auth(){this.state=1;const t=this.Q_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([t,n])=>{this.D_===e&&this.G_(t,n)},e=>{t(()=>{const t=new Se(Te.UNKNOWN,"Fetching auth token failed: "+e.message);return this.z_(t)})})}G_(t,e){const n=this.Q_(this.D_);this.stream=this.j_(t,e),this.stream.Zo(()=>{n(()=>this.listener.Zo())}),this.stream.Yo(()=>{n(()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.Yo()))}),this.stream.t_(t=>{n(()=>this.z_(t))}),this.stream.onMessage(t=>{n(()=>1==++this.F_?this.J_(t):this.onNext(t))})}N_(){this.state=5,this.M_.p_(()=>c(this,null,function*(){this.state=0,this.start()}))}z_(t){return me(Qo,`close with error: ${t}`),this.stream=null,this.close(4,t)}Q_(t){return e=>{this.Ci.enqueueAndForget(()=>this.D_===t?e():(me(Qo,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class Yo extends Wo{constructor(t,e,n,r,s,i){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,n,r,i),this.serializer=s}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=function(t,e){let n;if("targetChange"in e){e.targetChange;const s="NO_CHANGE"===(r=e.targetChange.targetChangeType||"NO_CHANGE")?0:"ADD"===r?1:"REMOVE"===r?2:"CURRENT"===r?3:"RESET"===r?4:we(39313,{state:r}),i=e.targetChange.targetIds||[],o=function(t,e){return t.useProto3Json?(_e(void 0===e||"string"==typeof e,58123),Nn.fromBase64String(e||"")):(_e(void 0===e||e instanceof Buffer||e instanceof Uint8Array,16193),Nn.fromUint8Array(e||new Uint8Array))}(t,e.targetChange.resumeToken),a=e.targetChange.cause,u=a&&function(t){const e=void 0===t.code?Te.UNKNOWN:Xs(t.code);return new Se(e,t.message||"")}(a);n=new ai(s,i,o,u||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const s=Ii(t,r.document.name),i=Ei(r.document.updateTime),o=r.document.createTime?Ei(r.document.createTime):on.min(),a=new lr({mapValue:{fields:r.document.fields}}),u=fr.newFoundDocument(s,i,o,a),c=r.targetIds||[],h=r.removedTargetIds||[];n=new ii(c,h,u.key,u)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const s=Ii(t,r.document),i=r.readTime?Ei(r.readTime):on.min(),o=fr.newNoDocument(s,i),a=r.removedTargetIds||[];n=new ii([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const s=Ii(t,r.document),i=r.removedTargetIds||[];n=new ii([],i,s,null)}else{if(!("filter"in e))return we(11601,{Vt:e});{e.filter;const t=e.filter;t.targetId;const{count:r=0,unchangedNames:s}=t,i=new Qs(r,s),o=t.targetId;n=new oi(o,i)}}var r;return n}(this.serializer,t),n=function(t){if(!("targetChange"in t))return on.min();const e=t.targetChange;return e.targetIds&&e.targetIds.length?on.min():e.readTime?Ei(e.readTime):on.min()}(t);return this.listener.H_(e,n)}Z_(t){const e={};e.database=Ai(this.serializer),e.addTarget=function(t,e){let n;const r=e.target;if(n=Ur(r)?{documents:ki(t,r)}:{query:Ri(t,r).ft},n.targetId=e.targetId,e.resumeToken.approximateByteSize()>0){n.resumeToken=vi(t,e.resumeToken);const r=gi(t,e.expectedCount);null!==r&&(n.expectedCount=r)}else if(e.snapshotVersion.compareTo(on.min())>0){n.readTime=yi(t,e.snapshotVersion.toTimestamp());const r=gi(t,e.expectedCount);null!==r&&(n.expectedCount=r)}return n}(this.serializer,t);const n=function(t,e){const n=function(t){switch(t){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return we(28987,{purpose:t})}}(e.purpose);return null==n?null:{"goog-listen-tags":n}}(this.serializer,t);n&&(e.labels=n),this.q_(e)}X_(t){const e={};e.database=Ai(this.serializer),e.removeTarget=t,this.q_(e)}}class Xo extends Wo{constructor(t,e,n,r,s,i){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,n,r,i),this.serializer=s}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(t,e){return this.connection.T_("Write",t,e)}J_(t){return _e(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,_e(!t.writeResults||0===t.writeResults.length,55816),this.listener.ta()}onNext(t){_e(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.M_.reset();const e=function(t,e){return t&&t.length>0?(_e(void 0!==e,14353),t.map(t=>function(t,e){let n=t.updateTime?Ei(t.updateTime):Ei(e);return n.isEqual(on.min())&&(n=Ei(e)),new Ns(n,t.transformResults||[])}(t,e))):[]}(t.writeResults,t.commitTime),n=Ei(t.commitTime);return this.listener.na(n,e)}ra(){const t={};t.database=Ai(this.serializer),this.q_(t)}ea(t){const e={streamToken:this.lastStreamToken,writes:t.map(t=>function(t,e){let n;if(e instanceof Fs)n={update:Ni(t,e.key,e.value)};else if(e instanceof $s)n={delete:Si(t,e.key)};else if(e instanceof Us)n={update:Ni(t,e.key,e.data),updateMask:Bi(e.fieldMask)};else{if(!(e instanceof zs))return we(16599,{dt:e.type});n={verify:Si(t,e.key)}}return e.fieldTransforms.length>0&&(n.updateTransforms=e.fieldTransforms.map(t=>function(t,e){const n=e.transform;if(n instanceof Es)return{fieldPath:e.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(n instanceof _s)return{fieldPath:e.field.canonicalString(),appendMissingElements:{values:n.elements}};if(n instanceof Ts)return{fieldPath:e.field.canonicalString(),removeAllFromArray:{values:n.elements}};if(n instanceof Is)return{fieldPath:e.field.canonicalString(),increment:n.Ae};throw we(20930,{transform:e.transform})}(0,t))),e.precondition.isNone||(n.currentDocument=(r=t,void 0!==(s=e.precondition).updateTime?{updateTime:wi(r,s.updateTime)}:void 0!==s.exists?{exists:s.exists}:we(27497))),n;var r,s}(this.serializer,t))};this.q_(e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jo{}class Zo extends Jo{constructor(t,e,n,r){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=n,this.serializer=r,this.ia=!1}sa(){if(this.ia)throw new Se(Te.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(t,e,n,r){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,i])=>this.connection.Wo(t,bi(e,n),r,s,i)).catch(t=>{throw"FirebaseError"===t.name?(t.code===Te.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),t):new Se(Te.UNKNOWN,t.toString())})}jo(t,e,n,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,o])=>this.connection.jo(t,bi(e,n),r,i,o,s)).catch(t=>{throw"FirebaseError"===t.name?(t.code===Te.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),t):new Se(Te.UNKNOWN,t.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class ta{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){0===this.oa&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(t){"Online"===this.state?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,"Online"===t&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}\nThis typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(ge(e),this.aa=!1):me("OnlineStateTracker",e)}Pa(){null!==this._a&&(this._a.cancel(),this._a=null)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ea="RemoteStore";class na{constructor(t,e,n,r,s){this.localStore=t,this.datastore=e,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ea=new Map,this.Ia=new Set,this.Ra=[],this.Aa=s,this.Aa.Mo(t=>{n.enqueueAndForget(()=>c(this,null,function*(){la(this)&&(me(ea,"Restarting streams for network reachability change."),yield function(t){return c(this,null,function*(){const e=be(t);e.Ia.add(4),yield sa(e),e.Va.set("Unknown"),e.Ia.delete(4),yield ra(e)})}(this))}))}),this.Va=new ta(n,r)}}function ra(t){return c(this,null,function*(){if(la(t))for(const e of t.Ra)yield e(!0)})}function sa(t){return c(this,null,function*(){for(const e of t.Ra)yield e(!1)})}function ia(t,e){const n=be(t);n.Ea.has(e.targetId)||(n.Ea.set(e.targetId,e),ha(n)?ca(n):Na(n).O_()&&aa(n,e))}function oa(t,e){const n=be(t),r=Na(n);n.Ea.delete(e),r.O_()&&ua(n,e),0===n.Ea.size&&(r.O_()?r.L_():la(n)&&n.Va.set("Unknown"))}function aa(t,e){if(t.da.$e(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(on.min())>0){const n=t.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(n)}Na(t).Z_(e)}function ua(t,e){t.da.$e(e),Na(t).X_(e)}function ca(t){t.da=new ci({getRemoteKeysForTarget:e=>t.remoteSyncer.getRemoteKeysForTarget(e),At:e=>t.Ea.get(e)||null,ht:()=>t.datastore.serializer.databaseId}),Na(t).start(),t.Va.ua()}function ha(t){return la(t)&&!Na(t).x_()&&t.Ea.size>0}function la(t){return 0===be(t).Ia.size}function da(t){t.da=void 0}function fa(t){return c(this,null,function*(){t.Va.set("Online")})}function pa(t){return c(this,null,function*(){t.Ea.forEach((e,n)=>{aa(t,e)})})}function ma(t,e){return c(this,null,function*(){da(t),ha(t)?(t.Va.ha(e),ca(t)):t.Va.set("Unknown")})}function ga(t,e,n){return c(this,null,function*(){if(t.Va.set("Online"),e instanceof ai&&2===e.state&&e.cause)try{yield function(t,e){return c(this,null,function*(){const n=e.cause;for(const r of e.targetIds)t.Ea.has(r)&&(yield t.remoteSyncer.rejectListen(r,n),t.Ea.delete(r),t.da.removeTarget(r))})}(t,e)}catch(r){me(ea,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),yield ya(t,r)}else if(e instanceof ii?t.da.Xe(e):e instanceof oi?t.da.st(e):t.da.tt(e),!n.isEqual(on.min()))try{const e=yield Co(t.localStore);n.compareTo(e)>=0&&(yield function(t,e){const n=t.da.Tt(e);return n.targetChanges.forEach((n,r)=>{if(n.resumeToken.approximateByteSize()>0){const s=t.Ea.get(r);s&&t.Ea.set(r,s.withResumeToken(n.resumeToken,e))}}),n.targetMismatches.forEach((e,n)=>{const r=t.Ea.get(e);if(!r)return;t.Ea.set(e,r.withResumeToken(Nn.EMPTY_BYTE_STRING,r.snapshotVersion)),ua(t,e);const s=new $i(r.target,e,n,r.sequenceNumber);aa(t,s)}),t.remoteSyncer.applyRemoteEvent(n)}(t,n))}catch(s){me(ea,"Failed to raise snapshot:",s),yield ya(t,s)}})}function ya(t,e,n){return c(this,null,function*(){if(!fn(e))throw e;t.Ia.add(1),yield sa(t),t.Va.set("Offline"),n||(n=()=>Co(t.localStore)),t.asyncQueue.enqueueRetryable(()=>c(this,null,function*(){me(ea,"Retrying IndexedDB access"),yield n(),t.Ia.delete(1),yield ra(t)}))})}function va(t,e){return e().catch(n=>ya(t,n,e))}function wa(t){return c(this,null,function*(){const e=be(t),n=ka(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:-1;for(;Ea(e);)try{const t=yield Do(e.localStore,r);if(null===t){0===e.Ta.length&&n.L_();break}r=t.batchId,_a(e,t)}catch(s){yield ya(e,s)}ba(e)&&Ta(e)})}function Ea(t){return la(t)&&t.Ta.length<10}function _a(t,e){t.Ta.push(e);const n=ka(t);n.O_()&&n.Y_&&n.ea(e.mutations)}function ba(t){return la(t)&&!ka(t).x_()&&t.Ta.length>0}function Ta(t){ka(t).start()}function Sa(t){return c(this,null,function*(){ka(t).ra()})}function Ia(t){return c(this,null,function*(){const e=ka(t);for(const n of t.Ta)e.ea(n.mutations)})}function Ca(t,e,n){return c(this,null,function*(){const r=t.Ta.shift(),s=Ks.from(r,e,n);yield va(t,()=>t.remoteSyncer.applySuccessfulWrite(s)),yield wa(t)})}function Aa(t,e){return c(this,null,function*(){e&&ka(t).Y_&&(yield function(t,e){return c(this,null,function*(){if(function(t){switch(t){case Te.OK:return we(64938);case Te.CANCELLED:case Te.UNKNOWN:case Te.DEADLINE_EXCEEDED:case Te.RESOURCE_EXHAUSTED:case Te.INTERNAL:case Te.UNAVAILABLE:case Te.UNAUTHENTICATED:return!1;case Te.INVALID_ARGUMENT:case Te.NOT_FOUND:case Te.ALREADY_EXISTS:case Te.PERMISSION_DENIED:case Te.FAILED_PRECONDITION:case Te.ABORTED:case Te.OUT_OF_RANGE:case Te.UNIMPLEMENTED:case Te.DATA_LOSS:return!0;default:return we(15467,{code:t})}}(n=e.code)&&n!==Te.ABORTED){const n=t.Ta.shift();ka(t).B_(),yield va(t,()=>t.remoteSyncer.rejectFailedWrite(n.batchId,e)),yield wa(t)}var n})}(t,e)),ba(t)&&Ta(t)})}function Da(t,e){return c(this,null,function*(){const n=be(t);n.asyncQueue.verifyOperationInProgress(),me(ea,"RemoteStore received new credentials");const r=la(n);n.Ia.add(3),yield sa(n),r&&n.Va.set("Unknown"),yield n.remoteSyncer.handleCredentialChange(e),n.Ia.delete(3),yield ra(n)})}function Na(t){return t.ma||(t.ma=function(t,e,n){const r=be(t);return r.sa(),new Yo(e,r.connection,r.authCredentials,r.appCheckCredentials,r.serializer,n)}(t.datastore,t.asyncQueue,{Zo:fa.bind(null,t),Yo:pa.bind(null,t),t_:ma.bind(null,t),H_:ga.bind(null,t)}),t.Ra.push(e=>c(this,null,function*(){e?(t.ma.B_(),ha(t)?ca(t):t.Va.set("Unknown")):(yield t.ma.stop(),da(t))}))),t.ma}function ka(t){return t.fa||(t.fa=function(t,e,n){const r=be(t);return r.sa(),new Xo(e,r.connection,r.authCredentials,r.appCheckCredentials,r.serializer,n)}(t.datastore,t.asyncQueue,{Zo:()=>Promise.resolve(),Yo:Sa.bind(null,t),t_:Aa.bind(null,t),ta:Ia.bind(null,t),na:Ca.bind(null,t)}),t.Ra.push(e=>c(this,null,function*(){e?(t.fa.B_(),yield wa(t)):(yield t.fa.stop(),t.Ta.length>0&&(me(ea,`Stopping write stream with ${t.Ta.length} pending writes`),t.Ta=[]))}))),t.fa
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */}class Ra{constructor(t,e,n,r,s){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=n,this.op=r,this.removalCallback=s,this.deferred=new Ie,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(t=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,n,r,s){const i=Date.now()+n,o=new Ra(t,e,i,r,s);return o.start(n),o}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){null!==this.timerHandle&&(this.clearTimeout(),this.deferred.reject(new Se(Te.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>null!==this.timerHandle?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){null!==this.timerHandle&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function xa(t,e){if(ge("AsyncQueue",`${e}: ${t}`),fn(t))return new Se(Te.UNAVAILABLE,`${e}: ${t}`);throw t}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oa{static emptySet(t){return new Oa(t.comparator)}constructor(t){this.comparator=t?(e,n)=>t(e,n)||He.comparator(e.key,n.key):(t,e)=>He.comparator(t.key,e.key),this.keyedMap=ss(),this.sortedSet=new bn(this.comparator)}has(t){return null!=this.keyedMap.get(t)}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,n)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Oa))return!1;if(this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),n=t.sortedSet.getIterator();for(;e.hasNext();){const t=e.getNext().key,r=n.getNext().key;if(!t.isEqual(r))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),0===t.length?"DocumentSet ()":"DocumentSet (\n  "+t.join("  \n")+"\n)"}copy(t,e){const n=new Oa;return n.comparator=this.comparator,n.keyedMap=t,n.sortedSet=e,n}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(){this.ga=new bn(He.comparator)}track(t){const e=t.doc.key,n=this.ga.get(e);n?0!==t.type&&3===n.type?this.ga=this.ga.insert(e,t):3===t.type&&1!==n.type?this.ga=this.ga.insert(e,{type:n.type,doc:t.doc}):2===t.type&&2===n.type?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):2===t.type&&0===n.type?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):1===t.type&&0===n.type?this.ga=this.ga.remove(e):1===t.type&&2===n.type?this.ga=this.ga.insert(e,{type:1,doc:n.doc}):0===t.type&&1===n.type?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):we(63341,{Vt:t,pa:n}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal((e,n)=>{t.push(n)}),t}}class Ma{constructor(t,e,n,r,s,i,o,a,u){this.query=t,this.docs=e,this.oldDocs=n,this.docChanges=r,this.mutatedKeys=s,this.fromCache=i,this.syncStateChanged=o,this.excludesMetadataChanges=a,this.hasCachedResults=u}static fromInitialDocuments(t,e,n,r,s){const i=[];return e.forEach(t=>{i.push({type:0,doc:t})}),new Ma(t,e,Oa.emptySet(e),i,n,r,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&Qr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,n=t.docChanges;if(e.length!==n.length)return!1;for(let r=0;r<e.length;r++)if(e[r].type!==n[r].type||!e[r].doc.isEqual(n[r].doc))return!1;return!0}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Va{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(t=>t.Da())}}class Pa{constructor(){this.queries=Fa(),this.onlineState="Unknown",this.Ca=new Set}terminate(){!function(t,e){const n=be(t),r=n.queries;n.queries=Fa(),r.forEach((t,n)=>{for(const r of n.Sa)r.onError(e)})}(this,new Se(Te.ABORTED,"Firestore shutting down"))}}function Fa(){return new ts(t=>Wr(t),Qr)}function Ua(t,e){const n=be(t);let r=!1;for(const s of e){const t=s.query,e=n.queries.get(t);if(e){for(const t of e.Sa)t.Fa(s)&&(r=!0);e.wa=s}}r&&ja(n)}function Ba(t,e,n){const r=be(t),s=r.queries.get(e);if(s)for(const i of s.Sa)i.onError(n);r.queries.delete(e)}function ja(t){t.Ca.forEach(t=>{t.next()})}var qa,$a;($a=qa||(qa={})).Ma="default",$a.Cache="cache";class za{constructor(t,e,n){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(t){if(!this.options.includeMetadataChanges){const e=[];for(const n of t.docChanges)3!==n.type&&e.push(n);t=new Ma(t.query,t.docs,t.oldDocs,e,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache)return!0;if(!this.Da())return!0;const n="Offline"!==e;return(!this.options.qa||!n)&&(!t.docs.isEmpty()||t.hasCachedResults||"Offline"===e)}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&!0===this.options.includeMetadataChanges}ka(t){t=Ma.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==qa.Cache}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ga{constructor(t){this.key=t}}class Ka{constructor(t){this.key=t}}class Ha{constructor(t,e){this.query=t,this.Za=e,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=ls(),this.mutatedKeys=ls(),this.eu=Jr(t),this.tu=new Oa(this.eu)}get nu(){return this.Za}ru(t,e){const n=e?e.iu:new La,r=e?e.tu:this.tu;let s=e?e.mutatedKeys:this.mutatedKeys,i=r,o=!1;const a="F"===this.query.limitType&&r.size===this.query.limit?r.last():null,u="L"===this.query.limitType&&r.size===this.query.limit?r.first():null;if(t.inorderTraversal((t,e)=>{const c=r.get(t),h=Xr(this.query,e)?e:null,l=!!c&&this.mutatedKeys.has(c.key),d=!!h&&(h.hasLocalMutations||this.mutatedKeys.has(h.key)&&h.hasCommittedMutations);let f=!1;c&&h?c.data.isEqual(h.data)?l!==d&&(n.track({type:3,doc:h}),f=!0):this.su(c,h)||(n.track({type:2,doc:h}),f=!0,(a&&this.eu(h,a)>0||u&&this.eu(h,u)<0)&&(o=!0)):!c&&h?(n.track({type:0,doc:h}),f=!0):c&&!h&&(n.track({type:1,doc:c}),f=!0,(a||u)&&(o=!0)),f&&(h?(i=i.add(h),s=d?s.add(t):s.delete(t)):(i=i.delete(t),s=s.delete(t)))}),null!==this.query.limit)for(;i.size>this.query.limit;){const t="F"===this.query.limitType?i.last():i.first();i=i.delete(t.key),s=s.delete(t.key),n.track({type:1,doc:t})}return{tu:i,iu:n,bs:o,mutatedKeys:s}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,n,r){const s=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const i=t.iu.ya();i.sort((t,e)=>function(t,e){const n=t=>{switch(t){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return we(20277,{Vt:t})}};return n(t)-n(e)}(t.type,e.type)||this.eu(t.doc,e.doc)),this.ou(n),r=null!=r&&r;const o=e&&!r?this._u():[],a=0===this.Ya.size&&this.current&&!r?1:0,u=a!==this.Xa;return this.Xa=a,0!==i.length||u?{snapshot:new Ma(this.query,t.tu,s,i,t.mutatedKeys,0===a,u,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:o}:{au:o}}va(t){return this.current&&"Offline"===t?(this.current=!1,this.applyChanges({tu:this.tu,iu:new La,mutatedKeys:this.mutatedKeys,bs:!1},!1)):{au:[]}}uu(t){return!this.Za.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach(t=>this.Za=this.Za.add(t)),t.modifiedDocuments.forEach(t=>{}),t.removedDocuments.forEach(t=>this.Za=this.Za.delete(t)),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Ya;this.Ya=ls(),this.tu.forEach(t=>{this.uu(t.key)&&(this.Ya=this.Ya.add(t.key))});const e=[];return t.forEach(t=>{this.Ya.has(t)||e.push(new Ka(t))}),this.Ya.forEach(n=>{t.has(n)||e.push(new Ga(n))}),e}cu(t){this.Za=t.ks,this.Ya=ls();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return Ma.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,0===this.Xa,this.hasCachedResults)}}const Qa="SyncEngine";class Wa{constructor(t,e,n){this.query=t,this.targetId=e,this.view=n}}class Ya{constructor(t){this.key=t,this.hu=!1}}class Xa{constructor(t,e,n,r,s,i){this.localStore=t,this.remoteStore=e,this.eventManager=n,this.sharedClientState=r,this.currentUser=s,this.maxConcurrentLimboResolutions=i,this.Pu={},this.Tu=new ts(t=>Wr(t),Qr),this.Eu=new Map,this.Iu=new Set,this.Ru=new bn(He.comparator),this.Au=new Map,this.Vu=new co,this.du={},this.mu=new Map,this.fu=Xi.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return!0===this.gu}}function Ja(t,e,n=!0){return c(this,null,function*(){const r=wu(t);let s;const i=r.Tu.get(e);return i?(r.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=yield tu(r,e,n,!0),s})}function Za(t,e){return c(this,null,function*(){const n=wu(t);yield tu(n,e,!0,!1)})}function tu(t,e,n,r){return c(this,null,function*(){const s=yield function(t,e){const n=be(t);return n.persistence.runTransaction("Allocate target","readwrite",t=>{let r;return n.li.getTargetData(t,e).next(s=>s?(r=s,dn.resolve(r)):n.li.allocateTargetId(t).next(s=>(r=new $i(e,s,"TargetPurposeListen",t.currentSequenceNumber),n.li.addTargetData(t,r).next(()=>r))))}).then(t=>{const r=n.vs.get(t.targetId);return(null===r||t.snapshotVersion.compareTo(r.snapshotVersion)>0)&&(n.vs=n.vs.insert(t.targetId,t),n.Fs.set(e,t.targetId)),t})}(t.localStore,Gr(e)),i=s.targetId,o=t.sharedClientState.addLocalQueryTarget(i,n);let a;return r&&(a=yield function(t,e,n,r,s){return c(this,null,function*(){t.pu=(e,n,r)=>function(t,e,n,r){return c(this,null,function*(){let s=e.view.ru(n);s.bs&&(s=yield ko(t.localStore,e.query,!1).then(({documents:t})=>e.view.ru(t,s)));const i=r&&r.targetChanges.get(e.targetId),o=r&&null!=r.targetMismatches.get(e.targetId),a=e.view.applyChanges(s,t.isPrimaryClient,i,o);return fu(t,e.targetId,a.au),a.snapshot})}(t,e,n,r);const i=yield ko(t.localStore,e,!0),o=new Ha(e,i.ks),a=o.ru(i.documents),u=si.createSynthesizedTargetChangeForCurrentChange(n,r&&"Offline"!==t.onlineState,s),h=o.applyChanges(a,t.isPrimaryClient,u);fu(t,n,h.au);const l=new Wa(e,n,o);return t.Tu.set(e,l),t.Eu.has(n)?t.Eu.get(n).push(e):t.Eu.set(n,[e]),h.snapshot})}(t,e,i,"current"===o,s.resumeToken)),t.isPrimaryClient&&n&&ia(t.remoteStore,s),a})}function eu(t,e,n){return c(this,null,function*(){const r=be(t),s=r.Tu.get(e),i=r.Eu.get(s.targetId);if(i.length>1)return r.Eu.set(s.targetId,i.filter(t=>!Qr(t,e))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||(yield No(r.localStore,s.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(s.targetId),n&&oa(r.remoteStore,s.targetId),lu(r,s.targetId)}).catch(ln))):(lu(r,s.targetId),yield No(r.localStore,s.targetId,!0))})}function nu(t,e){return c(this,null,function*(){const n=be(t),r=n.Tu.get(e),s=n.Eu.get(r.targetId);n.isPrimaryClient&&1===s.length&&(n.sharedClientState.removeLocalQueryTarget(r.targetId),oa(n.remoteStore,r.targetId))})}function ru(t,e,n){return c(this,null,function*(){const r=function(t){const e=be(t);return e.remoteStore.remoteSyncer.applySuccessfulWrite=au.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=uu.bind(null,e),e}(t);try{const t=yield function(t,e){const n=be(t),r=sn.now(),s=e.reduce((t,e)=>t.add(e.key),ls());let i,o;return n.persistence.runTransaction("Locally write mutations","readwrite",t=>{let a=ns(),u=ls();return n.xs.getEntries(t,s).next(t=>{a=t,a.forEach((t,e)=>{e.isValidDocument()||(u=u.add(t))})}).next(()=>n.localDocuments.getOverlayedDocuments(t,a)).next(s=>{i=s;const o=[];for(const t of e){const e=Vs(t,i.get(t.key).overlayedDocument);null!=e&&o.push(new Us(t.key,e,dr(e.value.mapValue),ks.exists(!0)))}return n.mutationQueue.addMutationBatch(t,r,o,e)}).next(e=>{o=e;const r=e.applyToLocalDocumentSet(i,u);return n.documentOverlayCache.saveOverlays(t,e.batchId,r)})}).then(()=>({batchId:o.batchId,changes:is(i)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(t.batchId),function(t,e,n){let r=t.du[t.currentUser.toKey()];r||(r=new bn(Ve)),r=r.insert(e,n),t.du[t.currentUser.toKey()]=r}(r,t.batchId,n),yield gu(r,t.changes),yield wa(r.remoteStore)}catch(s){const t=xa(s,"Failed to persist write");n.reject(t)}})}function su(t,e){return c(this,null,function*(){const n=be(t);try{const t=yield Ao(n.localStore,e);e.targetChanges.forEach((t,e)=>{const r=n.Au.get(e);r&&(_e(t.addedDocuments.size+t.modifiedDocuments.size+t.removedDocuments.size<=1,22616),t.addedDocuments.size>0?r.hu=!0:t.modifiedDocuments.size>0?_e(r.hu,14607):t.removedDocuments.size>0&&(_e(r.hu,42227),r.hu=!1))}),yield gu(n,t,e)}catch(r){yield ln(r)}})}function iu(t,e,n){const r=be(t);if(r.isPrimaryClient&&0===n||!r.isPrimaryClient&&1===n){const t=[];r.Tu.forEach((n,r)=>{const s=r.view.va(e);s.snapshot&&t.push(s.snapshot)}),function(t,e){const n=be(t);n.onlineState=e;let r=!1;n.queries.forEach((t,n)=>{for(const s of n.Sa)s.va(e)&&(r=!0)}),r&&ja(n)}(r.eventManager,e),t.length&&r.Pu.H_(t),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}function ou(t,e,n){return c(this,null,function*(){const r=be(t);r.sharedClientState.updateQueryState(e,"rejected",n);const s=r.Au.get(e),i=s&&s.key;if(i){let t=new bn(He.comparator);t=t.insert(i,fr.newNoDocument(i,on.min()));const n=ls().add(i),s=new ri(on.min(),new Map,new bn(Ve),t,n);yield su(r,s),r.Ru=r.Ru.remove(i),r.Au.delete(e),mu(r)}else yield No(r.localStore,e,!1).then(()=>lu(r,e,n)).catch(ln)})}function au(t,e){return c(this,null,function*(){const n=be(t),r=e.batch.batchId;try{const t=yield function(t,e){const n=be(t);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",t=>{const r=e.batch.keys(),s=n.xs.newChangeBuffer({trackRemovals:!0});return function(t,e,n,r){const s=n.batch,i=s.keys();let o=dn.resolve();return i.forEach(t=>{o=o.next(()=>r.getEntry(e,t)).next(e=>{const i=n.docVersions.get(t);_e(null!==i,48541),e.version.compareTo(i)<0&&(s.applyToRemoteDocument(e,n),e.isValidDocument()&&(e.setReadTime(n.commitVersion),r.addEntry(e)))})}),o.next(()=>t.mutationQueue.removeMutationBatch(e,s))}(n,t,e,s).next(()=>s.apply(t)).next(()=>n.mutationQueue.performConsistencyCheck(t)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(t,r,e.batch.batchId)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(t,function(t){let e=ls();for(let n=0;n<t.mutationResults.length;++n)t.mutationResults[n].transformResults.length>0&&(e=e.add(t.batch.mutations[n].key));return e}(e))).next(()=>n.localDocuments.getDocuments(t,r))})}(n.localStore,e);hu(n,r,null),cu(n,r),n.sharedClientState.updateMutationState(r,"acknowledged"),yield gu(n,t)}catch(s){yield ln(s)}})}function uu(t,e,n){return c(this,null,function*(){const r=be(t);try{const t=yield function(t,e){const n=be(t);return n.persistence.runTransaction("Reject batch","readwrite-primary",t=>{let r;return n.mutationQueue.lookupMutationBatch(t,e).next(e=>(_e(null!==e,37113),r=e.keys(),n.mutationQueue.removeMutationBatch(t,e))).next(()=>n.mutationQueue.performConsistencyCheck(t)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(t,r,e)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(t,r)).next(()=>n.localDocuments.getDocuments(t,r))})}(r.localStore,e);hu(r,e,n),cu(r,e),r.sharedClientState.updateMutationState(e,"rejected",n),yield gu(r,t)}catch(s){yield ln(s)}})}function cu(t,e){(t.mu.get(e)||[]).forEach(t=>{t.resolve()}),t.mu.delete(e)}function hu(t,e,n){const r=be(t);let s=r.du[r.currentUser.toKey()];if(s){const t=s.get(e);t&&(n?t.reject(n):t.resolve(),s=s.remove(e)),r.du[r.currentUser.toKey()]=s}}function lu(t,e,n=null){t.sharedClientState.removeLocalQueryTarget(e);for(const r of t.Eu.get(e))t.Tu.delete(r),n&&t.Pu.yu(r,n);t.Eu.delete(e),t.isPrimaryClient&&t.Vu.Gr(e).forEach(e=>{t.Vu.containsKey(e)||du(t,e)})}function du(t,e){t.Iu.delete(e.path.canonicalString());const n=t.Ru.get(e);null!==n&&(oa(t.remoteStore,n),t.Ru=t.Ru.remove(e),t.Au.delete(n),mu(t))}function fu(t,e,n){for(const r of n)r instanceof Ga?(t.Vu.addReference(r.key,e),pu(t,r)):r instanceof Ka?(me(Qa,"Document no longer in limbo: "+r.key),t.Vu.removeReference(r.key,e),t.Vu.containsKey(r.key)||du(t,r.key)):we(19791,{wu:r})}function pu(t,e){const n=e.key,r=n.path.canonicalString();t.Ru.get(n)||t.Iu.has(r)||(me(Qa,"New document in limbo: "+n),t.Iu.add(r),mu(t))}function mu(t){for(;t.Iu.size>0&&t.Ru.size<t.maxConcurrentLimboResolutions;){const e=t.Iu.values().next().value;t.Iu.delete(e);const n=new He(ze.fromString(e)),r=t.fu.next();t.Au.set(r,new Ya(n)),t.Ru=t.Ru.insert(n,r),ia(t.remoteStore,new $i(Gr(jr(n.path)),r,"TargetPurposeLimboResolution",pn.ce))}}function gu(t,e,n){return c(this,null,function*(){const r=be(t),s=[],i=[],o=[];r.Tu.isEmpty()||(r.Tu.forEach((t,a)=>{o.push(r.pu(a,e,n).then(t=>{var e;if((t||n)&&r.isPrimaryClient){const s=t?!t.fromCache:null==(e=null==n?void 0:n.targetChanges.get(a.targetId))?void 0:e.current;r.sharedClientState.updateQueryState(a.targetId,s?"current":"not-current")}if(t){s.push(t);const e=Eo.Is(a.targetId,t);i.push(e)}}))}),yield Promise.all(o),r.Pu.H_(s),yield function(t,e){return c(this,null,function*(){const n=be(t);try{yield n.persistence.runTransaction("notifyLocalViewChanges","readwrite",t=>dn.forEach(e,e=>dn.forEach(e.Ts,r=>n.persistence.referenceDelegate.addReference(t,e.targetId,r)).next(()=>dn.forEach(e.Es,r=>n.persistence.referenceDelegate.removeReference(t,e.targetId,r)))))}catch(r){if(!fn(r))throw r;me(To,"Failed to update sequence numbers: "+r)}for(const t of e){const e=t.targetId;if(!t.fromCache){const t=n.vs.get(e),r=t.snapshotVersion,s=t.withLastLimboFreeSnapshotVersion(r);n.vs=n.vs.insert(e,s)}}})}(r.localStore,i))})}function yu(t,e){return c(this,null,function*(){const n=be(t);if(!n.currentUser.isEqual(e)){me(Qa,"User change. New user:",e.toKey());const t=yield Io(n.localStore,e);n.currentUser=e,s="'waitForPendingWrites' promise is rejected due to a user change.",(r=n).mu.forEach(t=>{t.forEach(t=>{t.reject(new Se(Te.CANCELLED,s))})}),r.mu.clear(),n.sharedClientState.handleUserChange(e,t.removedBatchIds,t.addedBatchIds),yield gu(n,t.Ns)}var r,s})}function vu(t,e){const n=be(t),r=n.Au.get(e);if(r&&r.hu)return ls().add(r.key);{let t=ls();const r=n.Eu.get(e);if(!r)return t;for(const e of r){const r=n.Tu.get(e);t=t.unionWith(r.view.nu)}return t}}function wu(t){const e=be(t);return e.remoteStore.remoteSyncer.applyRemoteEvent=su.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=vu.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=ou.bind(null,e),e.Pu.H_=Ua.bind(null,e.eventManager),e.Pu.yu=Ba.bind(null,e.eventManager),e}class Eu{constructor(){this.kind="memory",this.synchronizeTabs=!1}initialize(t){return c(this,null,function*(){this.serializer=Ko(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),yield this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)})}Fu(t,e){return null}Mu(t,e){return null}vu(t){return function(t,e,n,r){return new So(t,e,n,r)}(this.persistence,new bo,t.initialUser,this.serializer)}Cu(t){return new go(vo.Vi,this.serializer)}Du(t){return new xo}terminate(){return c(this,null,function*(){var t,e;null==(t=this.gcScheduler)||t.stop(),null==(e=this.indexBackfillerScheduler)||e.stop(),this.sharedClientState.shutdown(),yield this.persistence.shutdown()})}}Eu.provider={build:()=>new Eu};class _u extends Eu{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){_e(this.persistence.referenceDelegate instanceof wo,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new eo(n,t.asyncQueue,e)}Cu(t){const e=void 0!==this.cacheSizeBytes?Yi.withCacheSize(this.cacheSizeBytes):Yi.DEFAULT;return new go(t=>wo.Vi(t,e),this.serializer)}}class bu{initialize(t,e){return c(this,null,function*(){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=t=>iu(this.syncEngine,t,1),this.remoteStore.remoteSyncer.handleCredentialChange=yu.bind(null,this.syncEngine),yield function(t,e){return c(this,null,function*(){const n=be(t);e?(n.Ia.delete(2),yield ra(n)):e||(n.Ia.add(2),yield sa(n),n.Va.set("Unknown"))})}(this.remoteStore,this.syncEngine.isPrimaryClient))})}createEventManager(t){return new Pa}createDatastore(t){const e=Ko(t.databaseInfo.databaseId),n=function(t){return new zo(t)}(t.databaseInfo);return function(t,e,n,r){return new Zo(t,e,n,r)}(t.authCredentials,t.appCheckCredentials,n,e)}createRemoteStore(t){return e=this.localStore,n=this.datastore,r=t.asyncQueue,s=t=>iu(this.syncEngine,t,0),i=Mo.v()?new Mo:new Oo,new na(e,n,r,s,i);var e,n,r,s,i}createSyncEngine(t,e){return function(t,e,n,r,s,i,o){const a=new Xa(t,e,n,r,s,i);return o&&(a.gu=!0),a}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}terminate(){return c(this,null,function*(){var t,e;yield function(t){return c(this,null,function*(){const e=be(t);me(ea,"RemoteStore shutting down."),e.Ia.add(5),yield sa(e),e.Aa.shutdown(),e.Va.set("Unknown")})}(this.remoteStore),null==(t=this.datastore)||t.terminate(),null==(e=this.eventManager)||e.terminate()})}}bu.provider={build:()=>new bu};
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Tu{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):ge("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout(()=>{this.muted||t(e)},0)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Su="FirestoreClient";class Iu{constructor(t,e,n,r,s){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=n,this._databaseInfo=r,this.user=le.UNAUTHENTICATED,this.clientId=Me.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(n,t=>c(this,null,function*(){me(Su,"Received user=",t.uid),yield this.authCredentialListener(t),this.user=t})),this.appCheckCredentials.start(n,t=>(me(Su,"Received new app check token=",t),this.appCheckCredentialListener(t,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new Ie;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(()=>c(this,null,function*(){try{this._onlineComponents&&(yield this._onlineComponents.terminate()),this._offlineComponents&&(yield this._offlineComponents.terminate()),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const n=xa(e,"Failed to shutdown persistence");t.reject(n)}})),t.promise}}function Cu(t,e){return c(this,null,function*(){t.asyncQueue.verifyOperationInProgress(),me(Su,"Initializing OfflineComponentProvider");const n=t.configuration;yield e.initialize(n);let r=n.initialUser;t.setCredentialChangeListener(t=>c(this,null,function*(){r.isEqual(t)||(yield Io(e.localStore,t),r=t)})),e.persistence.setDatabaseDeletedListener(()=>t.terminate()),t._offlineComponents=e})}function Au(t,e){return c(this,null,function*(){t.asyncQueue.verifyOperationInProgress();const n=yield function(t){return c(this,null,function*(){if(!t._offlineComponents)if(t._uninitializedComponentsProvider){me(Su,"Using user provided OfflineComponentProvider");try{yield Cu(t,t._uninitializedComponentsProvider._offline)}catch(e){const s=e;if(!("FirebaseError"===(n=s).name?n.code===Te.FAILED_PRECONDITION||n.code===Te.UNIMPLEMENTED:!("undefined"!=typeof DOMException&&n instanceof DOMException)||22===n.code||20===n.code||11===n.code))throw s;ye("Error using user provided cache. Falling back to memory cache: "+s),yield Cu(t,new Eu)}}else me(Su,"Using default OfflineComponentProvider"),yield Cu(t,new _u(void 0));var n;return t._offlineComponents})}(t);me(Su,"Initializing OnlineComponentProvider"),yield e.initialize(n,t.configuration),t.setCredentialChangeListener(t=>Da(e.remoteStore,t)),t.setAppCheckTokenChangeListener((t,n)=>Da(e.remoteStore,n)),t._onlineComponents=e})}function Du(t){return c(this,null,function*(){return t._onlineComponents||(t._uninitializedComponentsProvider?(me(Su,"Using user provided OnlineComponentProvider"),yield Au(t,t._uninitializedComponentsProvider._online)):(me(Su,"Using default OnlineComponentProvider"),yield Au(t,new bu))),t._onlineComponents})}function Nu(t){return c(this,null,function*(){const e=yield Du(t),n=e.eventManager;return n.onListen=Ja.bind(null,e.syncEngine),n.onUnlisten=eu.bind(null,e.syncEngine),n.onFirstRemoteStoreListen=Za.bind(null,e.syncEngine),n.onLastRemoteStoreUnlisten=nu.bind(null,e.syncEngine),n})}function ku(t,e,n={}){const r=new Ie;return t.asyncQueue.enqueueAndForget(()=>c(this,null,function*(){return function(t,e,n,r,s){const i=new Tu({next:n=>{i.Nu(),e.enqueueAndForget(()=>function(t,e){return c(this,null,function*(){const n=be(t),r=e.query;let s=3;const i=n.queries.get(r);if(i){const t=i.Sa.indexOf(e);t>=0&&(i.Sa.splice(t,1),0===i.Sa.length?s=e.Da()?0:1:!i.ba()&&e.Da()&&(s=2))}switch(s){case 0:return n.queries.delete(r),n.onUnlisten(r,!0);case 1:return n.queries.delete(r),n.onUnlisten(r,!1);case 2:return n.onLastRemoteStoreUnlisten(r);default:return}})}(t,o)),n.fromCache&&"server"===r.source?s.reject(new Se(Te.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):s.resolve(n)},error:t=>s.reject(t)}),o=new za(n,i,{includeMetadataChanges:!0,qa:!0});return function(e,n){return c(this,null,function*(){const r=be(e);let s=3;const i=n.query;let o=r.queries.get(i);o?!o.ba()&&n.Da()&&(s=2):(o=new Va,s=n.Da()?0:1);try{switch(s){case 0:o.wa=yield r.onListen(i,!0);break;case 1:o.wa=yield r.onListen(i,!1);break;case 2:yield r.onFirstRemoteStoreListen(i)}}catch(t){const r=xa(t,`Initialization of query '${Yr(n.query)}' failed`);return void n.onError(r)}r.queries.set(i,o),o.Sa.push(n),n.va(r.onlineState),o.wa&&n.Fa(o.wa)&&ja(r)})}(t,o)}(yield Nu(t),t.asyncQueue,e,n,r)})),r.promise}function Ru(t,e){const n=new Ie;return t.asyncQueue.enqueueAndForget(()=>c(this,null,function*(){return ru(yield function(t){return Du(t).then(t=>t.syncEngine)}(t),e,n)})),n.promise
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */}function xu(t){const e={};return void 0!==t.timeoutSeconds&&(e.timeoutSeconds=t.timeoutSeconds),e
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */}const Ou=new Map;
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Lu="firestore.googleapis.com",Mu=!0;class Vu{constructor(t){var e,n;if(void 0===t.host){if(void 0!==t.ssl)throw new Se(Te.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Lu,this.ssl=Mu}else this.host=t.host,this.ssl=null!=(e=t.ssl)?e:Mu;if(this.isUsingEmulator=void 0!==t.emulatorOptions,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,void 0===t.cacheSizeBytes)this.cacheSizeBytes=Wi;else{if(-1!==t.cacheSizeBytes&&t.cacheSizeBytes<1048576)throw new Se(Te.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}(function(t,e,n,r){if(!0===e&&!0===r)throw new Se(Te.INVALID_ARGUMENT,`${t} and ${n} cannot be used together.`)})("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:void 0===t.experimentalAutoDetectLongPolling?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=xu(null!=(n=t.experimentalLongPollingOptions)?n:{}),function(t){if(void 0!==t.timeoutSeconds){if(isNaN(t.timeoutSeconds))throw new Se(Te.INVALID_ARGUMENT,`invalid long polling timeout: ${t.timeoutSeconds} (must not be NaN)`);if(t.timeoutSeconds<5)throw new Se(Te.INVALID_ARGUMENT,`invalid long polling timeout: ${t.timeoutSeconds} (minimum allowed value is 5)`);if(t.timeoutSeconds>30)throw new Se(Te.INVALID_ARGUMENT,`invalid long polling timeout: ${t.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&(e=this.experimentalLongPollingOptions,n=t.experimentalLongPollingOptions,e.timeoutSeconds===n.timeoutSeconds)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams;var e,n}}class Pu{constructor(t,e,n,r){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=n,this._app=r,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Vu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new Se(Te.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return"notTerminated"!==this._terminateTask}_setSettings(t){if(this._settingsFrozen)throw new Se(Te.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Vu(t),this._emulatorOptions=t.emulatorOptions||{},void 0!==t.credentials&&(this._authCredentials=function(t){if(!t)return new Ae;switch(t.type){case"firstParty":return new Re(t.sessionIndex||"0",t.iamToken||null,t.authTokenFactory||null);case"provider":return t.client;default:throw new Se(Te.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return"notTerminated"===this._terminateTask&&(this._terminateTask=this._terminate()),this._terminateTask}_restart(){return c(this,null,function*(){"notTerminated"===this._terminateTask?yield this._terminate():this._terminateTask="notTerminated"})}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const e=Ou.get(t);e&&(me("ComponentProvider","Removing Datastore"),Ou.delete(t),e.terminate())}(this),Promise.resolve()}}function Fu(t,e,n,r={}){var s;t=Ze(t,Pu);const i=D(e),o=t._getSettings(),h=u(a({},o),{emulatorOptions:t._getEmulatorOptions()}),l=`${e}:${n}`;i&&function(t){c(this,null,function*(){return(yield fetch(t,{credentials:"include"})).ok})}(`https://${l}`),o.host!==Lu&&o.host!==l&&ye("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const d=u(a({},o),{host:l,ssl:i,emulatorOptions:r});if(!I(d,h)&&(t._setSettings(d),r.mockUserToken)){let e,n;if("string"==typeof r.mockUserToken)e=r.mockUserToken,n=le.MOCK_USER;else{e=function(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n=e||"demo-project",r=t.iat||0,s=t.sub||t.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const i=a({iss:`https://securetoken.google.com/${n}`,aud:n,iat:r,exp:r+3600,auth_time:r,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}}},t);return[p(JSON.stringify({alg:"none",type:"JWT"})),p(JSON.stringify(i)),""].join(".")}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(r.mockUserToken,null==(s=t._app)?void 0:s.options.projectId);const i=r.mockUserToken.sub||r.mockUserToken.user_id;if(!i)throw new Se(Te.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");n=new le(i)}t._authCredentials=new De(new Ce(e,n))}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uu{constructor(t,e,n){this.converter=e,this._query=n,this.type="query",this.firestore=t}withConverter(t){return new Uu(this.firestore,t,this._query)}}class Bu{constructor(t,e,n){this.converter=e,this._key=n,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new ju(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new Bu(this.firestore,t,this._key)}toJSON(){return{type:Bu._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,n){if(en(e,Bu._jsonSchema))return new Bu(t,n||null,new He(ze.fromString(e.referencePath)))}}Bu._jsonSchemaVersion="firestore/documentReference/1.0",Bu._jsonSchema={type:tn("string",Bu._jsonSchemaVersion),referencePath:tn("string")};class ju extends Uu{constructor(t,e,n){super(t,e,jr(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new Bu(this.firestore,null,new He(t))}withConverter(t){return new ju(this.firestore,t,this._path)}}function qu(t,e,...n){if(t=A(t),Qe("collection","path",e),t instanceof Pu){const r=ze.fromString(e,...n);return Ye(r),new ju(t,null,r)}{if(!(t instanceof Bu||t instanceof ju))throw new Se(Te.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(ze.fromString(e,...n));return Ye(r),new ju(t.firestore,null,r)}}function $u(t,e,...n){if(t=A(t),1===arguments.length&&(e=Me.newId()),Qe("doc","path",e),t instanceof Pu){const r=ze.fromString(e,...n);return We(r),new Bu(t,null,new He(r))}{if(!(t instanceof Bu||t instanceof ju))throw new Se(Te.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(ze.fromString(e,...n));return We(r),new Bu(t.firestore,t instanceof ju?t.converter:null,new He(r))}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zu="AsyncQueue";class Gu{constructor(t=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Ho(this,"async_queue_retry"),this._c=()=>{const t=Go();t&&me(zu,"Visibility state changed to "+t.visibilityState),this.M_.w_()},this.ac=t;const e=Go();e&&"function"==typeof e.addEventListener&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=Go();e&&"function"==typeof e.removeEventListener&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise(()=>{});const e=new Ie;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Yu.push(t),this.lc()))}lc(){return c(this,null,function*(){if(0!==this.Yu.length){try{yield this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(t){if(!fn(t))throw t;me(zu,"Operation failed with retryable error: "+t)}this.Yu.length>0&&this.M_.p_(()=>this.lc())}})}cc(t){const e=this.ac.then(()=>(this.rc=!0,t().catch(t=>{throw this.nc=t,this.rc=!1,ge("INTERNAL UNHANDLED ERROR: ",Ku(t)),t}).then(t=>(this.rc=!1,t))));return this.ac=e,e}enqueueAfterDelay(t,e,n){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const r=Ra.createAndSchedule(this,t,e,n,t=>this.hc(t));return this.tc.push(r),r}uc(){this.nc&&we(47125,{Pc:Ku(this.nc)})}verifyOperationInProgress(){}Tc(){return c(this,null,function*(){let t;do{t=this.ac,yield t}while(t!==this.ac)})}Ec(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ic(t){return this.Tc().then(()=>{this.tc.sort((t,e)=>t.targetTimeMs-e.targetTimeMs);for(const e of this.tc)if(e.skipDelay(),"all"!==t&&e.timerId===t)break;return this.Tc()})}Rc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function Ku(t){let e=t.message||"";return t.stack&&(e=t.stack.includes(t.message)?t.stack:t.message+"\n"+t.stack),e}class Hu extends Pu{constructor(t,e,n,r){super(t,e,n,r),this.type="firestore",this._queue=new Gu,this._persistenceKey=(null==r?void 0:r.name)||"[DEFAULT]"}_terminate(){return c(this,null,function*(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new Gu(t),this._firestoreClient=void 0,yield t}})}}function Qu(t,e){const n="object"==typeof t?t:function(t=xt){const e=Lt.get(t);if(!e&&t===xt&&w())return jt();if(!e)throw Ut.create("no-app",{appName:t});return e}(),r="string"==typeof t?t:qn,s=function(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}(n,"firestore").getImmediate({identifier:r});if(!s._initialized){const t=v("firestore");t&&Fu(s,...t)}return s}function Wu(t){if(t._terminated)throw new Se(Te.FAILED_PRECONDITION,"The client has already been terminated.");return t._firestoreClient||function(t){var e,n,r,s;const i=t._freezeSettings(),o=function(t,e,n,r,s){return new jn(t,e,n,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,xu(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,r)}(t._databaseId,(null==(e=t._app)?void 0:e.options.appId)||"",t._persistenceKey,null==(n=t._app)?void 0:n.options.apiKey,i);t._componentsProvider||(null==(r=i.localCache)?void 0:r._offlineComponentProvider)&&(null==(s=i.localCache)?void 0:s._onlineComponentProvider)&&(t._componentsProvider={_offline:i.localCache._offlineComponentProvider,_online:i.localCache._onlineComponentProvider}),t._firestoreClient=new Iu(t._authCredentials,t._appCheckCredentials,t._queue,o,t._componentsProvider&&function(t){const e=null==t?void 0:t._online.build();return{_offline:null==t?void 0:t._offline.build(e),_online:e}}(t._componentsProvider))}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(t),t._firestoreClient}class Yu{constructor(t){this._byteString=t}static fromBase64String(t){try{return new Yu(Nn.fromBase64String(t))}catch(e){throw new Se(Te.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new Yu(Nn.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:Yu._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(en(t,Yu._jsonSchema))return Yu.fromBase64String(t.bytes)}}Yu._jsonSchemaVersion="firestore/bytes/1.0",Yu._jsonSchema={type:tn("string",Yu._jsonSchemaVersion),bytes:tn("string")};
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xu{constructor(...t){for(let e=0;e<t.length;++e)if(0===t[e].length)throw new Se(Te.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ke(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ju{constructor(t){this._methodName=t}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zu{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new Se(Te.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new Se(Te.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return Ve(this._lat,t._lat)||Ve(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Zu._jsonSchemaVersion}}static fromJSON(t){if(en(t,Zu._jsonSchema))return new Zu(t.latitude,t.longitude)}}Zu._jsonSchemaVersion="firestore/geoPoint/1.0",Zu._jsonSchema={type:tn("string",Zu._jsonSchemaVersion),latitude:tn("number"),longitude:tn("number")};
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class tc{constructor(t){this._values=(t||[]).map(t=>t)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(t,e){if(t.length!==e.length)return!1;for(let n=0;n<t.length;++n)if(t[n]!==e[n])return!1;return!0}(this._values,t._values)}toJSON(){return{type:tc._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(en(t,tc._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every(t=>"number"==typeof t))return new tc(t.vectorValues);throw new Se(Te.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}tc._jsonSchemaVersion="firestore/vectorValue/1.0",tc._jsonSchema={type:tn("string",tc._jsonSchemaVersion),vectorValues:tn("object")};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ec=/^__.*__$/;class nc{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return null!==this.fieldMask?new Us(t,this.data,this.fieldMask,e,this.fieldTransforms):new Fs(t,this.data,e,this.fieldTransforms)}}class rc{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return new Us(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function sc(t){switch(t){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw we(40011,{dataSource:t})}}class ic{constructor(t,e,n,r,s,i){this.settings=t,this.databaseId=e,this.serializer=n,this.ignoreUndefinedProperties=r,void 0===s&&this.Ac(),this.fieldTransforms=s||[],this.fieldMask=i||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}i(t){return new ic(a(a({},this.settings),t),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}dc(t){var e;const n=null==(e=this.path)?void 0:e.child(t),r=this.i({path:n,arrayElement:!1});return r.mc(t),r}fc(t){var e;const n=null==(e=this.path)?void 0:e.child(t),r=this.i({path:n,arrayElement:!1});return r.Ac(),r}gc(t){return this.i({path:void 0,arrayElement:!0})}yc(t){return vc(t,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(t){return void 0!==this.fieldMask.find(e=>t.isPrefixOf(e))||void 0!==this.fieldTransforms.find(e=>t.isPrefixOf(e.field))}Ac(){if(this.path)for(let t=0;t<this.path.length;t++)this.mc(this.path.get(t))}mc(t){if(0===t.length)throw this.yc("Document fields must not be empty");if(sc(this.dataSource)&&ec.test(t))throw this.yc('Document fields cannot begin and end with "__"')}}class oc{constructor(t,e,n){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=n||Ko(t)}I(t,e,n,r=!1){return new ic({dataSource:t,methodName:e,targetDoc:n,path:Ke.emptyPath(),arrayElement:!1,hasConverter:r},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function ac(t){const e=t._freezeSettings(),n=Ko(t._databaseId);return new oc(t._databaseId,!!e.ignoreUndefinedProperties,n)}function uc(t,e,n,r,s,i={}){const o=t.I(i.merge||i.mergeFields?2:0,e,n,s);pc("Data must be an object, but it was:",o,r);const a=dc(r,o);let u,c;if(i.merge)u=new An(o.fieldMask),c=o.fieldTransforms;else if(i.mergeFields){const t=[];for(const r of i.mergeFields){const s=mc(e,r,n);if(!o.contains(s))throw new Se(Te.INVALID_ARGUMENT,`Field '${s}' is specified in your field mask but missing from your input data.`);wc(t,s)||t.push(s)}u=new An(t),c=o.fieldTransforms.filter(t=>u.covers(t.field))}else u=null,c=o.fieldTransforms;return new nc(new lr(a),u,c)}class cc extends Ju{_toFieldTransform(t){if(2!==t.dataSource)throw 1===t.dataSource?t.yc(`${this._methodName}() can only appear at the top level of your update data`):t.yc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof cc}}class hc extends Ju{_toFieldTransform(t){return new Ds(t.path,new Es)}isEqual(t){return t instanceof hc}}function lc(t,e){if(fc(t=A(t)))return pc("Unsupported field value:",e,t),dc(t,e);if(t instanceof Ju)return function(t,e){if(!sc(e.dataSource))throw e.yc(`${t._methodName}() can only be used with update() and set()`);if(!e.path)throw e.yc(`${t._methodName}() is not currently supported inside arrays`);const n=t._toFieldTransform(e);n&&e.fieldTransforms.push(n)}(t,e),null;if(void 0===t&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),t instanceof Array){if(e.settings.arrayElement&&4!==e.dataSource)throw e.yc("Nested arrays are not supported");return function(t,e){const n=[];let r=0;for(const s of t){let t=lc(s,e.gc(r));null==t&&(t={nullValue:"NULL_VALUE"}),n.push(t),r++}return{arrayValue:{values:n}}}(t,e)}return function(t,e){if(null===(t=A(t)))return{nullValue:"NULL_VALUE"};if("number"==typeof t)return ms(e.serializer,t);if("boolean"==typeof t)return{booleanValue:t};if("string"==typeof t)return{stringValue:t};if(t instanceof Date){const n=sn.fromDate(t);return{timestampValue:yi(e.serializer,n)}}if(t instanceof sn){const n=new sn(t.seconds,1e3*Math.floor(t.nanoseconds/1e3));return{timestampValue:yi(e.serializer,n)}}if(t instanceof Zu)return{geoPointValue:{latitude:t.latitude,longitude:t.longitude}};if(t instanceof Yu)return{bytesValue:vi(e.serializer,t._byteString)};if(t instanceof Bu){const n=e.databaseId,r=t.firestore._databaseId;if(!r.isEqual(n))throw e.yc(`Document reference is for database ${r.projectId}/${r.database} but should be for database ${n.projectId}/${n.database}`);return{referenceValue:_i(t.firestore._databaseId||e.databaseId,t._key.path)}}if(t instanceof tc)return function(t,e){const n=t instanceof tc?t.toArray():t;return{mapValue:{fields:{[zn]:{stringValue:Hn},[Qn]:{arrayValue:{values:n.map(t=>{if("number"!=typeof t)throw e.yc("VectorValues must only contain numeric values.");return fs(e.serializer,t)})}}}}}}(t,e);if(qi(t))return t._toProto(e.serializer);throw e.yc(`Unsupported field value: ${Je(t)}`)}(t,e)}function dc(t,e){const n={};return _n(t)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):En(t,(t,r)=>{const s=lc(r,e.dc(t));null!=s&&(n[t]=s)}),{mapValue:{fields:n}}}function fc(t){return!("object"!=typeof t||null===t||t instanceof Array||t instanceof Date||t instanceof sn||t instanceof Zu||t instanceof Yu||t instanceof Bu||t instanceof Ju||t instanceof tc||qi(t))}function pc(t,e,n){if(!fc(n)||!Xe(n)){const r=Je(n);throw"an object"===r?e.yc(t+" a custom object"):e.yc(t+" "+r)}}function mc(t,e,n){if((e=A(e))instanceof Xu)return e._internalPath;if("string"==typeof e)return yc(t,e);throw vc("Field path arguments must be of type string or ",t,!1,void 0,n)}const gc=new RegExp("[~\\*/\\[\\]]");function yc(t,e,n){if(e.search(gc)>=0)throw vc(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,t,!1,void 0,n);try{return new Xu(...e.split("."))._internalPath}catch(r){throw vc(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,t,!1,void 0,n)}}function vc(t,e,n,r,s){const i=r&&!r.isEmpty(),o=void 0!==s;let a=`Function ${e}() called with invalid data`;n&&(a+=" (via `toFirestore()`)"),a+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${r}`),o&&(u+=` in document ${s}`),u+=")"),new Se(Te.INVALID_ARGUMENT,a+t+u)}function wc(t,e){return t.some(t=>t.isEqual(e))}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ec{convertValue(t,e="none"){switch(Wn(t)){case 0:return null;case 1:return t.booleanValue;case 2:return xn(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(On(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw we(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const n={};return En(t,(t,r)=>{n[t]=this.convertValue(r,e)}),n}convertVectorValue(t){var e,n,r;const s=null==(r=null==(n=null==(e=t.fields)?void 0:e[Qn].arrayValue)?void 0:n.values)?void 0:r.map(t=>xn(t.doubleValue));return new tc(s)}convertGeoPoint(t){return new Zu(xn(t.latitude),xn(t.longitude))}convertArray(t,e){return(t.values||[]).map(t=>this.convertValue(t,e))}convertServerTimestamp(t,e){switch(e){case"previous":const n=Un(t);return null==n?null:this.convertValue(n,e);case"estimate":return this.convertTimestamp(Bn(t));default:return null}}convertTimestamp(t){const e=Rn(t);return new sn(e.seconds,e.nanos)}convertDocumentKey(t,e){const n=ze.fromString(t);_e(ji(n),9688,{name:t});const r=new $n(n.get(1),n.get(3)),s=new He(n.popFirst(5));return r.isEqual(e)||ge(`Document ${s} contains a document reference within a different database (${r.projectId}/${r.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),s}}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _c extends Ec{constructor(t){super(),this.firestore=t}convertBytes(t){return new Yu(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new Bu(this.firestore,null,e)}}function bc(){return new hc("serverTimestamp")}const Tc="@firebase/firestore",Sc="4.14.0";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ic{constructor(t,e,n,r,s){this._firestore=t,this._userDataWriter=e,this._key=n,this._document=r,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new Bu(this._firestore,this._converter,this._key)}exists(){return null!==this._document}data(){if(this._document){if(this._converter){const t=new Cc(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var t,e;return null!=(e=null==(t=this._document)?void 0:t.data.clone().value.mapValue.fields)?e:void 0}get(t){if(this._document){const e=this._document.data.field(mc("DocumentSnapshot.get",t));if(null!==e)return this._userDataWriter.convertValue(e)}}}class Cc extends Ic{data(){return super.data()}}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ac{}class Dc extends Ac{}function Nc(t,e,...n){let r=[];e instanceof Ac&&r.push(e),r=r.concat(n),function(t){const e=t.filter(t=>t instanceof xc).length,n=t.filter(t=>t instanceof kc).length;if(e>1||e>0&&n>0)throw new Se(Te.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const s of r)t=s._apply(t);return t}class kc extends Dc{constructor(t,e,n){super(),this._field=t,this._op=e,this._value=n,this.type="where"}static _create(t,e,n){return new kc(t,e,n)}_apply(t){const e=this._parse(t);return Mc(t._query,e),new Uu(t.firestore,t.converter,Kr(t._query,e))}_parse(t){const e=ac(t.firestore),n=function(t,e,n,r,s,i,o){let a;if(s.isKeyField()){if("array-contains"===i||"array-contains-any"===i)throw new Se(Te.INVALID_ARGUMENT,`Invalid Query. You can't perform '${i}' queries on documentId().`);if("in"===i||"not-in"===i){Lc(o,i);const e=[];for(const n of o)e.push(Oc(r,t,n));a={arrayValue:{values:e}}}else a=Oc(r,t,o)}else"in"!==i&&"not-in"!==i&&"array-contains-any"!==i||Lc(o,i),a=function(t,e,n,r=!1){return lc(n,t.I(r?4:3,e))}(n,e,o,"in"===i||"not-in"===i);return Er.create(s,i,a)}(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value);return n}}function Rc(t,e,n){const r=e,s=mc("where",t);return kc._create(s,r,n)}class xc extends Ac{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new xc(t,e)}_parse(t){const e=this._queryConstraints.map(e=>e._parse(t)).filter(t=>t.getFilters().length>0);return 1===e.length?e[0]:_r.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return 0===e.getFilters().length?t:(function(t,e){let n=t;const r=e.getFlattenedFilters();for(const s of r)Mc(n,s),n=Kr(n,s)}(t._query,e),new Uu(t.firestore,t.converter,Kr(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return"and"===this.type?"and":"or"}}function Oc(t,e,n){if("string"==typeof(n=A(n))){if(""===n)throw new Se(Te.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!$r(e)&&-1!==n.indexOf("/"))throw new Se(Te.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);const r=e.path.child(ze.fromString(n));if(!He.isDocumentKey(r))throw new Se(Te.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return sr(t,new He(r))}if(n instanceof Bu)return sr(t,n._key);throw new Se(Te.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Je(n)}.`)}function Lc(t,e){if(!Array.isArray(t)||0===t.length)throw new Se(Te.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function Mc(t,e){const n=function(t,e){for(const n of t)for(const t of n.getFlattenedFilters())if(e.indexOf(t.op)>=0)return t.op;return null}(t.filters,function(t){switch(t){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(null!==n)throw n===e.op?new Se(Te.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new Se(Te.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${n.toString()}' filters.`)}function Vc(t,e,n){let r;return r=t?n&&(n.merge||n.mergeFields)?t.toFirestore(e,n):t.toFirestore(e):e,r}class Pc{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Fc extends Ic{constructor(t,e,n,r,s,i){super(t,e,n,r,i),this._firestore=t,this._firestoreImpl=t,this.metadata=s}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Uc(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const n=this._document.data.field(mc("DocumentSnapshot.get",t));if(null!==n)return this._userDataWriter.convertValue(n,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new Se(Te.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=Fc._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),t&&t.isValidDocument()&&t.isFoundDocument()?(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e):e}}Fc._jsonSchemaVersion="firestore/documentSnapshot/1.0",Fc._jsonSchema={type:tn("string",Fc._jsonSchemaVersion),bundleSource:tn("string","DocumentSnapshot"),bundleName:tn("string"),bundle:tn("string")};class Uc extends Fc{data(t={}){return super.data(t)}}class Bc{constructor(t,e,n,r){this._firestore=t,this._userDataWriter=e,this._snapshot=r,this.metadata=new Pc(r.hasPendingWrites,r.fromCache),this.query=n}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return 0===this.size}forEach(t,e){this._snapshot.docs.forEach(n=>{t.call(e,new Uc(this._firestore,this._userDataWriter,n.key,n,new Pc(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new Se(Te.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(t,e){if(t._snapshot.oldDocs.isEmpty()){let e=0;return t._snapshot.docChanges.map(n=>{const r=new Uc(t._firestore,t._userDataWriter,n.doc.key,n.doc,new Pc(t._snapshot.mutatedKeys.has(n.doc.key),t._snapshot.fromCache),t.query.converter);return n.doc,{type:"added",doc:r,oldIndex:-1,newIndex:e++}})}{let n=t._snapshot.oldDocs;return t._snapshot.docChanges.filter(t=>e||3!==t.type).map(e=>{const r=new Uc(t._firestore,t._userDataWriter,e.doc.key,e.doc,new Pc(t._snapshot.mutatedKeys.has(e.doc.key),t._snapshot.fromCache),t.query.converter);let s=-1,i=-1;return 0!==e.type&&(s=n.indexOf(e.doc.key),n=n.delete(e.doc.key)),1!==e.type&&(n=n.add(e.doc),i=n.indexOf(e.doc.key)),{type:jc(e.type),doc:r,oldIndex:s,newIndex:i}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new Se(Te.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=Bc._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Me.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],n=[],r=[];return this.docs.forEach(t=>{null!==t._document&&(e.push(t._document),n.push(this._userDataWriter.convertObjectMap(t._document.data.value.mapValue.fields,"previous")),r.push(t.ref.path))}),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function jc(t){switch(t){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return we(61501,{type:t})}}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Bc._jsonSchemaVersion="firestore/querySnapshot/1.0",Bc._jsonSchema={type:tn("string",Bc._jsonSchemaVersion),bundleSource:tn("string","QuerySnapshot"),bundleName:tn("string"),bundle:tn("string")};
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class qc{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=ac(t)}set(t,e,n){this._verifyNotCommitted();const r=$c(t,this._firestore),s=Vc(r.converter,e,n),i=uc(this._dataReader,"WriteBatch.set",r._key,s,null!==r.converter,n);return this._mutations.push(i.toMutation(r._key,ks.none())),this}update(t,e,n,...r){this._verifyNotCommitted();const s=$c(t,this._firestore);let i;return i="string"==typeof(e=A(e))||e instanceof Xu?function(t,e,n,r,s,i){const o=t.I(1,e,n),a=[mc(e,r,n)],u=[s];if(i.length%2!=0)throw new Se(Te.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let d=0;d<i.length;d+=2)a.push(mc(e,i[d])),u.push(i[d+1]);const c=[],h=lr.empty();for(let d=a.length-1;d>=0;--d)if(!wc(c,a[d])){const t=a[d];let e=u[d];e=A(e);const n=o.fc(t);if(e instanceof cc)c.push(t);else{const r=lc(e,n);null!=r&&(c.push(t),h.set(t,r))}}const l=new An(c);return new rc(h,l,o.fieldTransforms)}(this._dataReader,"WriteBatch.update",s._key,e,n,r):function(t,e,n,r){const s=t.I(1,e,n);pc("Data must be an object, but it was:",s,r);const i=[],o=lr.empty();En(r,(t,r)=>{const a=yc(e,t,n);r=A(r);const u=s.fc(a);if(r instanceof cc)i.push(a);else{const t=lc(r,u);null!=t&&(i.push(a),o.set(a,t))}});const a=new An(i);return new rc(o,a,s.fieldTransforms)}(this._dataReader,"WriteBatch.update",s._key,e),this._mutations.push(i.toMutation(s._key,ks.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=$c(t,this._firestore);return this._mutations=this._mutations.concat(new $s(e._key,ks.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new Se(Te.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function $c(t,e){if((t=A(t)).firestore!==e)throw new Se(Te.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return t}function zc(t){t=Ze(t,Uu);const e=Ze(t.firestore,Hu),n=Wu(e),r=new _c(e);return function(t){if("L"===t.limitType&&0===t.explicitOrderBy.length)throw new Se(Te.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}(t._query),ku(n,t._query).then(n=>new Bc(e,r,t,n))}function Gc(t,e,n){t=Ze(t,Bu);const r=Ze(t.firestore,Hu),s=Vc(t.converter,e,n);return Kc(r,[uc(ac(r),"setDoc",t._key,s,null!==t.converter,n).toMutation(t._key,ks.none())])}function Kc(t,e){return Ru(Wu(t),e)}function Hc(t){return Wu(t=Ze(t,Hu)),new qc(t,e=>Kc(t,e))}!function(t,e=!0){de="12.12.0",Ft(new N("firestore",(t,{instanceIdentifier:n,options:r})=>{const s=t.getProvider("app").getImmediate(),i=new Hu(new Ne(t.getProvider("auth-internal")),new Oe(s,t.getProvider("app-check-internal")),function(t,e){if(!Object.prototype.hasOwnProperty.apply(t.options,["projectId"]))throw new Se(Te.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new $n(t.options.projectId,e)}(s,n),s);return r=a({useFetchStreams:e},r),i._setSettings(r),i},"PUBLIC").setMultipleInstances(!0)),qt(Tc,Sc,t),qt(Tc,Sc,"esm2020")}();export{zc as a,bc as b,qu as c,$u as d,Hc as e,Qu as g,jt as i,Nc as q,Gc as s,Rc as w};
