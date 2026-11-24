/* amookht-sync.js — real-time sync of one account's state across all open browsers (2026-11-11).
   Writes: PATCH /v1/account/state with only the changed paths + base_version.
   Reads:  WebSocket /v1/sync/ws pushes every change of the account (all workers, via Redis).
   Timer timestamps (appSettings.freeStudy.endAt/startedAt/pauseStartedAt) travel in SERVER time;
   each browser converts with its measured clock offset, so every device shows the same remaining time. */
(function(){
'use strict';
if(window.AmookhtSync)return;
if(typeof S==='undefined'||typeof persistedData!=='function'||typeof apiRequest!=='function')return;

var DEEP={'appSettings':1,'appSettings.freeStudy':1};
var FS='appSettings.freeStudy';
var TIME_KEYS={endAt:1,startedAt:1,pauseStartedAt:1};
var MISSING={};
var API=(typeof APP_API_BASE==='string'&&APP_API_BASE)?APP_API_BASE:'/v1';
var CID='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
var X={account:null,accountSince:0,ready:false,base:null,version:0,wsVersion:0,pathVer:{},
  ws:null,wsOpen:false,retry:0,reconnectTimer:null,pingTimer:null,lastMsgAt:0,
  offset:0,samples:[],pushing:null,again:false,pushTimer:null,retryPushTimer:null,
  resyncing:null,resyncVersion:0,echo:0,echoMuteUntil:0,remoteRenderAt:0,queue:[],renderTimer:null,lastOtherRender:0,stats:{sent:0,recv:0,resync:0,rejected:0}};

function acct(){try{return S.currentUser&&typeof authTokens==='function'&&authTokens()?.access_token?S.currentUser:null}catch(e){return null}}
function J(v){return v===undefined?undefined:JSON.stringify(v)}
function flatten(obj,prefix,out){out=out||{};prefix=prefix||'';if(!obj||typeof obj!=='object')return out;
  for(var k in obj){if(!Object.prototype.hasOwnProperty.call(obj,k))continue;var v=obj[k];if(v===undefined)continue;var p=prefix+k;
    if(DEEP[p]&&v&&typeof v==='object'&&!Array.isArray(v))flatten(v,p+'.',out);else out[p]=v}
  return out}
function localFlat(){return flatten(persistedData())}
// dir=+1 local->server, -1 server->local
function convTimes(fs,dir){if(!fs||typeof fs!=='object'||Array.isArray(fs))return fs;var o={};for(var k in fs){var v=fs[k];o[k]=(TIME_KEYS[k]&&typeof v==='number'&&v>0)?Math.round(v+dir*X.offset):v}return o}
function conv(p,v,dir){if(v===MISSING||v===undefined)return v;
  if(p.indexOf(FS+'.')===0){var k=p.slice(FS.length+1);return (TIME_KEYS[k]&&typeof v==='number'&&v>0)?Math.round(v+dir*X.offset):v}
  if(p===FS)return convTimes(v,dir);
  if(p==='appSettings'&&v&&typeof v==='object'&&v.freeStudy){var a=Object.assign({},v);a.freeStudy=convTimes(v.freeStudy,dir);return a}
  return v}
function getLocal(p){var f=localFlat();return Object.prototype.hasOwnProperty.call(f,p)?f[p]:MISSING}

function applyTop(k,v){var val=v===MISSING?undefined:v;var sel=S.selectedTestdafExamId||'builtin-testdaf-1';
  switch(k){
    case 'user':S.user=Object.assign({},S.user||{},val||{});document.documentElement.classList.toggle('reduce-motion',!!S.user.reducedMotion);break;
    case 'completed':S.completedActivities=Array.isArray(val)?val:[];break;
    case 'points':S.totalPoints=Number(val)||0;break;
    case 'history':S.history=Array.isArray(val)?val:[];break;
    case 'errors':S.errors=Array.isArray(val)?(typeof normalizeLearningError==='function'?val.map(normalizeLearningError):val):[];break;
    case 'favorites':S.favorites=Array.isArray(val)?(typeof normalizeFavorite==='function'?val.map(normalizeFavorite):val):[];break;
    case 'darkMode':if(typeof val==='boolean'){S.dark=val;try{localStorage.setItem('amookht_theme',val?'dark':'light')}catch(e){}document.documentElement.classList.toggle('dark',val)}break;
    case 'uiLanguage':if(val){S.uiLanguage=val;try{if(typeof AMOOKHT_UI_LANGUAGE_KEY!=='undefined')localStorage.setItem(AMOOKHT_UI_LANGUAGE_KEY,val)}catch(e){}document.documentElement.lang=val}break;
    case 'testdafSim':if(val&&typeof val==='object'){S.testdafSim=val;S.testdafExamStates=S.testdafExamStates||{};S.testdafExamStates[sel]=val}break;
    case 'testdafExamStates':S.testdafExamStates=val&&typeof val==='object'?val:{};if(S.testdafExamStates[sel])S.testdafSim=S.testdafExamStates[sel];break;
    case 'appSettings':S.appSettings=val&&typeof val==='object'?val:{};break;
    default:S[k]=val}}
function applyPath(p,v){var parts=p.split('.');
  if(parts[0]==='appSettings'&&parts.length>1){if(!S.appSettings||typeof S.appSettings!=='object')S.appSettings={};
    if(parts.length===2){if(v===MISSING)delete S.appSettings[parts[1]];else S.appSettings[parts[1]]=v;return}
    var fs=S.appSettings.freeStudy;if(!fs||typeof fs!=='object'){fs=S.appSettings.freeStudy={}}
    if(v===MISSING)delete fs[parts[2]];else fs[parts[2]]=v;return}
  applyTop(parts[0],v)}
function setBase(p,localValue){var j=localValue===MISSING?undefined:J(localValue);if(j===undefined)X.base.delete(p);else X.base.set(p,j)}

/* ---------- clock offset (serverTime ≈ localTime + offset) ---------- */
function sampleOffset(sentAt,serverTime){var now=Date.now();if(!sentAt||!serverTime)return;var rtt=now-sentAt;if(rtt<0||rtt>20000)return;
  X.samples.push({rtt:rtt,off:serverTime-(sentAt+now)/2,at:now});X.samples=X.samples.filter(function(s){return now-s.at<600000}).slice(-12);
  var best=X.samples.reduce(function(a,b){return b.rtt<a.rtt?b:a});X.offset=Math.round(best.off)}

/* ---------- rendering after remote changes ---------- */
function inFocusMode(){var c=document.querySelector('.free-timer');return !!(c&&(document.fullscreenElement===c||c.classList.contains('free-focus-fallback')))}
function typing(){var a=document.activeElement;return !!(a&&a!==document.body&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))}
function afterApply(paths){if(!paths.length)return;
  var timer=paths.some(function(p){return p===FS||p.indexOf(FS+'.')===0||p==='appSettings'});
  var other=paths.some(function(p){return !(p===FS||p.indexOf(FS+'.')===0)});
  if(timer){try{clearInterval(S.freeStudyInterval);
      if(document.querySelector('.free-timer')&&typeof freeStudyRefreshFocus==='function'&&!(typing()&&!inFocusMode()))freeStudyRefreshFocus();
      else if(typeof freeStudyStartTicker==='function')freeStudyStartTicker()}catch(e){console.warn('sync timer refresh',e)}}
  if(other&&Date.now()<X.echoMuteUntil)other=false; // render side-effects ping-ponging between devices
  if(other&&!inFocusMode()){var wait=Math.max(0,1500-(Date.now()-X.lastOtherRender));clearTimeout(X.renderTimer);
    var go=function(){if(typing())return;if(selecting()){X.renderTimer=setTimeout(go,700);return}X.lastOtherRender=Date.now();X.remoteRenderAt=Date.now();try{render()}catch(e){console.warn('sync render',e)}};
    X.renderTimer=setTimeout(go,timer?Math.max(wait,60):wait)}}
/*SYNC-SEL*/ // a remote render would wipe the learner's text selection (and its toolbar) → wait until it is cleared
function selecting(){try{var s=window.getSelection();if(!s||s.isCollapsed||!String(s).trim())return false;var n=s.anchorNode,app=document.getElementById('app');return !!(n&&app&&app.contains(n))}catch(e){return false}}

/* ---------- remote patches ---------- */
function onRemotePatch(m){
  if(X.pushing||X.resyncing||!X.ready){X.queue.push(m);return}
  X.stats.recv++;
  if(m.version>X.version)X.version=m.version;
  if(m.client_id===CID)return;
  var cur=localFlat(),touched=[];
  function one(p,raw){if((X.pathVer[p]||0)>m.version)return;
    var lj=J(cur[p]);if(lj!==X.base.get(p))return; // unsent local edit: it is pushed next and wins
    var lv=raw===MISSING?MISSING:conv(p,raw,-1);applyPath(p,lv);setBase(p,lv);X.pathVer[p]=m.version;if(J(lv===MISSING?undefined:lv)!==lj)touched.push(p)}
  var set=m.set||{};for(var p in set)one(p,set[p]);
  (m.unset||[]).forEach(function(p){one(p,MISSING)});
  afterApply(touched)}
function drainQueue(){if(X.pushing||X.resyncing||!X.ready)return;var q=X.queue;X.queue=[];q.forEach(function(m){if(m.version>X.resyncVersion||m.client_id===CID)onRemotePatch(m)})}

/* ---------- full resync (first load, reconnect after a gap) ---------- */
function resync(){if(X.resyncing)return X.resyncing;var first=!X.base,account=X.account;
  X.resyncing=(async function(){await null;try{
    if(X.pushing)try{await X.pushing}catch(e){}
    var t0=Date.now(),r=await apiRequest('/account/state',{cache:'no-store'});sampleOffset(t0,r.server_time);
    if(X.account!==account)return;
    X.stats.resync++;
    var remote=flatten(r.state_data||{}),cur=localFlat(),base=X.base||new Map(),touched=[],newBase=new Map(),keys={};
    Object.keys(remote).forEach(function(k){keys[k]=1});Object.keys(cur).forEach(function(k){keys[k]=1});base.forEach(function(_,k){keys[k]=1});
    Object.keys(keys).forEach(function(p){
      var has=Object.prototype.hasOwnProperty.call(remote,p),rv=has?conv(p,remote[p],-1):MISSING,rj=has?J(rv):undefined,lj=J(cur[p]),bj=base.get(p),take;
      if(first)take=(p===FS||p.indexOf(FS+'.')===0||p==='appSettings')?true:!(S.serverConnected&&lj!==undefined);
      else{var localDirty=lj!==bj,remoteChanged=rj!==bj;take=remoteChanged&&(!localDirty||lj!==rj)} // both changed: server wins
      if(take&&lj!==rj){applyPath(p,rv);touched.push(p)}
      if(rj!==undefined)newBase.set(p,rj)});
    X.base=newBase;X.pathVer={};X.version=Math.max(Number(r.version)||0,0);X.resyncVersion=X.version;X.ready=true;
    afterApply(touched)}
  finally{X.resyncing=null}})();
  X.resyncing.then(function(){drainQueue();schedulePush(0)},function(e){console.warn('sync resync failed',e);setTimeout(function(){if(X.account&&!X.ready)resync()},5000)});
  return X.resyncing}

/* ---------- pushing local changes ---------- */
function schedulePush(ms){clearTimeout(X.pushTimer);X.pushTimer=setTimeout(function(){push()},ms||0)}
function push(opts){opts=opts||{};if(!X.ready||!acct())return Promise.resolve(false);
  if(X.pushing||X.resyncing){X.again=true;return X.pushing||X.resyncing}
  X.pushing=(async function(){var ok=true;await null; /* let X.pushing be assigned before any finally runs */try{do{X.again=false;
      var cur=localFlat(),set={},snap={},unset=[],n=0;
      for(var p in cur){var j=J(cur[p]);if(j===undefined)continue;snap[p]=j;if(X.base.get(p)!==j){set[p]=conv(p,cur[p],1);n++}}
      X.base.forEach(function(_,k){if(!Object.prototype.hasOwnProperty.call(snap,k))unset.push(k)});
      if(!n&&!unset.length)break;
      var body=JSON.stringify({schema_version:1,base_version:X.version,set:set,unset:unset,client_id:CID});
      var r=await apiRequest('/account/state',{method:'PATCH',body:body,keepalive:!!opts.keepalive&&body.length<60000});
      X.stats.sent++;
      if(r.saved&&r.version>X.version)X.version=r.version;
      (r.applied||[]).forEach(function(p){if(Object.prototype.hasOwnProperty.call(snap,p))X.base.set(p,snap[p]);else X.base.delete(p);X.pathVer[p]=r.version});
      var touched=[];
      Object.keys(r.normalized||{}).forEach(function(p){var lv=conv(p,r.normalized[p],-1);applyPath(p,lv);setBase(p,lv);touched.push(p)});
      (r.rejected||[]).forEach(function(x){X.stats.rejected++;var lv=x.exists?conv(x.path,x.value,-1):MISSING;applyPath(x.path,lv);setBase(x.path,lv);X.pathVer[x.path]=r.version;touched.push(x.path)});
      if((r.rejected||[]).length&&r.version>X.version)X.version=r.version;
      afterApply(touched);
      if(n&&Date.now()-(X.remoteRenderAt||0)<1500){if(++X.echo>=3){X.echo=0;X.echoMuteUntil=Date.now()+30000}}else if(n)X.echo=0;
      S.serverConnected=true;S.syncStatus='synced';
    }while(X.again)}
    catch(e){ok=false;S.syncStatus='local';console.warn('sync push failed',e);clearTimeout(X.retryPushTimer);X.retryPushTimer=setTimeout(function(){push()},5000)}
    finally{X.pushing=null;drainQueue()}
    return ok})();
  return X.pushing}

/* ---------- WebSocket ---------- */
function wsUrl(){var u=new URL(API+'/sync/ws',location.href);u.protocol=u.protocol==='https:'?'wss:':'ws:';return u.toString()}
function stopPing(){clearInterval(X.pingTimer);X.pingTimer=null}
function ping(){var ws=X.ws;if(!ws||ws.readyState!==1)return;try{ws.send(JSON.stringify({type:'ping',t:Date.now()}))}catch(e){}}
function startPing(){stopPing();X.pingTimer=setInterval(function(){if(Date.now()-X.lastMsgAt>65000){try{X.ws&&X.ws.close()}catch(e){}return}ping()},25000)}
function scheduleReconnect(){clearTimeout(X.reconnectTimer);if(!X.account)return;var d=Math.min(30000,1000*Math.pow(2,X.retry++))+Math.random()*500;X.reconnectTimer=setTimeout(connect,d)}
function connect(){clearTimeout(X.reconnectTimer);if(!X.account||X.ws)return;var ws;
  try{ws=new WebSocket(wsUrl())}catch(e){scheduleReconnect();return}
  X.ws=ws;var authAt=0;
  ws.onopen=function(){authAt=Date.now();ws.send(JSON.stringify({type:'auth',token:(authTokens()||{}).access_token,client_id:CID}))};
  ws.onmessage=function(ev){if(X.ws!==ws)return;X.lastMsgAt=Date.now();var m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.type==='hello'){X.retry=0;X.wsOpen=true;sampleOffset(authAt,m.server_time);X.wsVersion=m.version;startPing();setTimeout(ping,1500);
      if(!X.ready||m.version!==X.version)resync();else schedulePush(0);return}
    if(m.type==='pong'){sampleOffset(m.t,m.server_time);return}
    if(m.type==='patch'){var gap=X.wsVersion&&m.version>X.wsVersion+1;X.wsVersion=Math.max(X.wsVersion,m.version);if(gap){resync();return}onRemotePatch(m);return}
    if(m.type==='resync'||m.type==='resync_required'){if(m.version)X.wsVersion=Math.max(X.wsVersion,m.version);if(m.client_id!==CID||m.type==='resync_required')resync();return}};
  ws.onclose=function(ev){if(X.ws!==ws)return;X.ws=null;X.wsOpen=false;stopPing();if(!X.account)return;
    if(ev.code===4401){apiRequest('/account/me').then(function(){scheduleReconnect()},function(){scheduleReconnect()});return}
    scheduleReconnect()};
  ws.onerror=function(){}}
function teardown(){clearTimeout(X.reconnectTimer);clearTimeout(X.pushTimer);clearTimeout(X.retryPushTimer);stopPing();var ws=X.ws;X.ws=null;X.wsOpen=false;try{ws&&ws.close()}catch(e){}
  X.ready=false;X.base=null;X.version=0;X.wsVersion=0;X.pathVer={};X.queue=[];X.retry=0}

/* ---------- lifecycle ---------- */
function tick(){var a=acct();
  if(a!==X.account){teardown();X.account=a;X.accountSince=Date.now();return}
  if(!a)return;
  if(!X.ready&&!X.resyncing&&S.serverConnected&&Date.now()-X.accountSince>1500)resync();
  if(X.ready&&!X.ws)connect()}
setInterval(tick,1000);
document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='visible'||!X.account)return;
  if(!X.ws){X.retry=0;connect();return}var before=X.lastMsgAt;ping();setTimeout(function(){if(X.ws&&X.lastMsgAt===before){try{X.ws.close()}catch(e){}}},4000)});
window.addEventListener('online',function(){if(X.account&&!X.ws){X.retry=0;connect()}schedulePush(0)});
window.addEventListener('pagehide',function(){if(X.ready)push({keepalive:true})});

/* ---------- hooks into the app (globals stay the same names) ---------- */
var origSync=window.syncStateToServer,origFlush=window.flushStateToServer,origSave=window.saveData;
if(typeof origSync==='function')window.syncStateToServer=function(){return X.ready?push():origSync.apply(this,arguments)};
if(typeof origFlush==='function')window.flushStateToServer=function(){if(!X.ready)return origFlush.apply(this,arguments);push({keepalive:true});return !!acct()};
if(typeof origSave==='function')window.saveData=function(){var r=origSave.apply(this,arguments);if(X.ready)schedulePush(250);return r};
['freeStudyToggleTimer','freeStudySetMode','freeStudyReset','freeStudyFinish','freeStudySelectCategory','freeStudySaveCategory','freeStudyRemoveCategory','freeStudySetGoal','freeStudyAddTask','freeStudyToggleTask','freeStudyDeleteTask','freeStudySetTab'].forEach(function(name){
  var fn=window[name];if(typeof fn!=='function'||fn.__amkSync)return;
  var wrapped=function(){var r=fn.apply(this,arguments);if(X.ready)schedulePush(0);return r};wrapped.__amkSync=1;window[name]=wrapped});

window.AmookhtSync={state:X,clientId:CID,push:push,resync:resync,
  serverNow:function(){return Date.now()+X.offset},
  status:function(){return{account:X.account,ready:X.ready,ws:!!X.wsOpen,version:X.version,offset:X.offset,rtt:X.samples.length?Math.min.apply(null,X.samples.map(function(s){return s.rtt})):null,stats:X.stats}}};
})();
