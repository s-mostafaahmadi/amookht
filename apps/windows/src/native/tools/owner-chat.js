// Owner AI assistant («دستیار مالک»): the site's ownerAI* functions + owner-agent.js, owner account only.
// Ported by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
import { T } from '../core/tr.js';

export function install(shim) {
  const { S, saveData, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  const $ = (sel) => document.querySelector(sel); // site helper
  window.__amkNoop = function () {};
  window.__amkIfSelf = function (el, ev, fn) { if (ev && ev.target === el && typeof window[fn] === 'function') window[fn](); };
  window.__amkGrow = function (el, max) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, max || 150) + 'px'; };
  window.__amkOwnerDraft = function (el) { window.ownerAIState().draft = el.value; window.__amkGrow(el, 160); };
  // the site re-renders the whole page; here only the owner chat's own root is repainted
  let host = null;
  function render() {
    if (!host) { host = document.createElement('div'); host.id = 'ownerAiRoot'; document.body.appendChild(host); }
    try { host.innerHTML = window.renderOwnerAIChat(); } catch (e) { console.warn('owner chat', e); host.innerHTML = ''; }
  }
  window.ownerAIBuiltinProviders = function ownerAIBuiltinProviders(){return[{id:'builtin:deepseek',name:'DeepSeek',model:'',builtin:true,enabled:true},{id:'builtin:nvidia',name:'NVIDIA',model:'',builtin:true,enabled:true},{id:'builtin:groq',name:'Groq',model:'',builtin:true,enabled:true}]}
  window.ownerAIMergeProviders = function ownerAIMergeProviders(remote=[]){const map=new Map(ownerAIBuiltinProviders().map(x=>[x.id,x]));(Array.isArray(remote)?remote:[]).forEach(x=>map.set(x.id,{...(map.get(x.id)||{}),...x}));return[...map.values()]}
  window.ownerAIState = function ownerAIState(){if(!S.ownerAI)S.ownerAI={open:false,loading:false,sending:false,conversations:[],providers:ownerAIBuiltinProviders(),activeId:null,messages:[],error:'',notice:'',historyOpen:false,manageOpen:false,editingProvider:null};if(!S.ownerAI.providers?.length)S.ownerAI.providers=ownerAIBuiltinProviders();return S.ownerAI}
  window.ownerAIRequest = async function ownerAIRequest(path,options={},timeoutMs=15000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await apiRequest(path,{...options,signal:controller.signal})}catch(error){if(error?.name==='AbortError')throw new Error('زمان پاسخ سرور تمام شد؛ دوباره تلاش کنید.');throw error}finally{clearTimeout(timer)}}
  window.ownerAIProviderOptions = function ownerAIProviderOptions(active){const c=ownerAIState(),selected=active?.provider_preference||'';return`<option value="" ${!selected?'selected':''}>✨ خودکار · جایگزینی هوشمند</option>${c.providers.map(x=>`<option value="${safeText(x.id)}" ${selected===x.id?'selected':''} ${x.enabled?'':'disabled'}>${x.builtin?'مدل داخلی':'مدل افزوده‌شده'} · ${safeText(x.name)}${x.model?' · '+safeText(x.model):''}${x.enabled?'':' · غیرفعال'}</option>`).join('')}`}
  window.renderOwnerAIProviderManager = function renderOwnerAIProviderManager(){const c=ownerAIState();if(!c.manageOpen)return'';const edit=c.editingProvider||{};return`<section class="owner-ai-provider-modal" data-on-click="window.__amkNoop"><header class="owner-ai-provider-head"><div><h3>مدیریت APIهای هوش مصنوعی</h3><p class="owner-ai-provider-notice">کلیدها رمزنگاری می‌شوند و پس از ثبت دوباره نمایش داده نمی‌شوند.</p></div><button data-on-click="window.ownerAICloseProviders" data-on-click-args="">×</button></header><div class="owner-ai-provider-grid">${c.providers.map(p=>`<article class="owner-ai-provider-card ${p.enabled?'':'disabled'}"><header><div><b>${safeText(p.name)}</b><small>${safeText(p.model)}</small></div><span class="owner-ai-provider-badge">${p.builtin?'داخلی':'شخصی'}</span></header><small title="${safeText(p.base_url)}">${safeText(p.base_url)}</small><div class="owner-ai-provider-actions"><button data-on-click="window.ownerAITestProvider" data-on-click-args="'${p.id}'">تست اتصال</button>${p.builtin?'':`<button data-on-click="window.ownerAIEditProvider" data-on-click-args="'${p.id}'">ویرایش</button><button data-on-click="window.ownerAIToggleProvider" data-on-click-args="'${p.id}',${!p.enabled}">${p.enabled?'غیرفعال':'فعال'}</button><button class="danger" data-on-click="window.ownerAIDeleteProvider" data-on-click-args="'${p.id}'">حذف</button>`}</div></article>`).join('')}</div><form class="owner-ai-provider-form" data-on-submit="window.ownerAISaveProvider" data-on-submit-args="event"><h4>${edit.id?'ویرایش API شخصی':'افزودن API جدید'}</h4><div class="owner-ai-provider-fields"><label>نام<input id="ownerAIProviderName" required maxlength="80" value="${safeText(edit.name||'')}"></label><label>مدل<input id="ownerAIProviderModel" required maxlength="160" value="${safeText(edit.model||'')}"></label><label class="wide">آدرس کامل Chat Completions<input id="ownerAIProviderUrl" type="url" required placeholder="https://example.com/v1/chat/completions" value="${safeText(edit.base_url||'')}"></label><label class="wide">API Key ${edit.id?'(برای حفظ کلید فعلی خالی بگذارید)':''}<input id="ownerAIProviderKey" type="password" ${edit.id?'':'required'} autocomplete="new-password" value=""></label></div><footer>${edit.id?`<button type="button" data-on-click="window.ownerAICancelProviderEdit" data-on-click-args="">انصراف</button>`:''}<button class="save" type="submit">${edit.id?'ذخیره تغییرات':'افزودن API'}</button></footer>${c.notice?`<p class="owner-ai-provider-notice">${safeText(c.notice)}</p>`:''}</form></section>`}
  window.renderOwnerAIChat = function renderOwnerAIChat(){if(!isOwnerAccount()||!S.currentUser||['landing','auth'].includes(S.screen))return'';const c=ownerAIState();if(!c.open)return`<button type="button" class="owner-ai-launcher" data-on-click="window.openOwnerAIChat" data-on-click-args="" title="${T('دستیار هوش مصنوعی مالک')}" aria-label="${T('دستیار هوش مصنوعی مالک')}"><svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v1a4 4 0 0 0 1 7.87V20h4v-6H6v-4a6 6 0 0 1 12 0v4h-4v6h4v-1.13A4 4 0 0 0 19 11v-1a7 7 0 0 0-7-7Z"/><path d="M9 10.5h.01M15 10.5h.01M9.5 13.5c1.5 1 3.5 1 5 0"/></svg><i></i></button>`;const active=c.conversations.find(x=>x.id===c.activeId),messages=c.messages||[];return`<div class="owner-ai-backdrop" data-on-click="window.__amkIfSelf" data-on-click-args="this,event,'closeOwnerAIChat'"><section class="owner-ai-window ${c.historyOpen?'show-history':''}" role="dialog" aria-modal="true"><aside class="owner-ai-history"><div class="owner-ai-history-head"><h3>تاریخچه گفتگو</h3><button class="owner-ai-new" data-on-click="window.ownerAINewConversation" data-on-click-args="">+ گفتگوی جدید</button></div><div class="owner-ai-list">${c.conversations.length?c.conversations.map(item=>`<button class="owner-ai-history-item ${item.id===c.activeId?'active':''}" data-on-click="window.ownerAIOpenConversation" data-on-click-args="'${item.id}'"><b>${safeText(item.title||'گفتگوی جدید')}</b><small>${Number(item.message_count||0)} پیام${item.provider?' · '+safeText(item.provider):''}</small><span class="owner-ai-delete" data-on-click="window.ownerAIDeleteConversation" data-on-click-args="'${item.id}'">×</span></button>`).join(''):`<div class="owner-ai-empty"><p>هنوز گفتگویی وجود ندارد.</p></div>`}</div></aside><main class="owner-ai-main"><header class="owner-ai-header"><div class="owner-ai-header-title"><button class="owner-ai-mobile-history" data-on-click="window.ownerAIToggleHistory" data-on-click-args="">تاریخچه</button><span class="owner-ai-orb">AI</span><div><h2>${safeText(active?.title||'دستیار خصوصی مالک')}</h2><p>${active?.provider?`آخرین پاسخ: ${safeText(active.provider)} · ${safeText(active.model||'')}`:'انتخاب آزاد ارائه‌دهنده'}</p></div></div><div class="owner-ai-provider-tools"><select class="owner-ai-provider-select" data-on-change="window.ownerAIChangeProvider" data-on-change-args="this.value" ${!active||c.sending?'disabled':''}>${ownerAIProviderOptions(active)}</select><button class="owner-ai-provider-manage" data-on-click="window.ownerAIOpenProviders" data-on-click-args="" title="مدیریت APIها">⚙</button><button class="owner-ai-close" data-on-click="window.closeOwnerAIChat" data-on-click-args="">×</button></div></header><div class="owner-ai-messages" id="ownerAIMessages">${c.loading?`<div class="owner-ai-thinking"><i></i><i></i><i></i></div>`:messages.length?messages.map(m=>`<article class="owner-ai-bubble ${m.role==='user'?'user':'assistant'}">${safeText(m.content)}${m.role==='assistant'&&m.provider?`<footer class="owner-ai-bubble-meta"><span>${safeText(m.provider)}</span><span>${safeText(m.model||'')}</span></footer>`:''}</article>`).join(''):`<div class="owner-ai-empty"><span>✦</span><h3>چطور می‌توانم کمک کنم؟</h3><p>ارائه‌دهنده را از بالای صفحه انتخاب کنید. تمام تاریخچه همین گفتگو برای پاسخ ارسال می‌شود.</p></div>`}${c.sending?`<div class="owner-ai-thinking"><i></i><i></i><i></i></div>`:''}</div><footer class="owner-ai-compose"><div class="owner-ai-compose-box"><textarea id="ownerAIInput" maxlength="20000" rows="1" placeholder="پیام خود را بنویسید…" data-on-keydown="window.ownerAIInputKey" data-on-keydown-args="event" data-on-input="window.__amkGrow" data-on-input-args="this,150"></textarea><button class="owner-ai-send" data-on-click="window.ownerAISend" data-on-click-args="" ${c.sending?'disabled':''}>↑</button></div>${c.error?`<p class="owner-ai-error">${safeText(c.error)}</p>`:''}</footer></main>${renderOwnerAIProviderManager()}</section></div>`}
  window.ownerAILoadProviders = async function ownerAILoadProviders(){const c=ownerAIState();try{const data=await ownerAIRequest('/owner-ai/providers',{},20000);c.providers=ownerAIMergeProviders(data.providers)}catch(error){c.providers=ownerAIMergeProviders(c.providers)}}
  window.openOwnerAIChat = async function openOwnerAIChat(){if(!isOwnerAccount())return;const c=ownerAIState();c.open=true;c.loading=true;c.sending=false;c.error='';render();ownerAILoadProviders().then(()=>{if(c.open)render()});try{c.conversations=await ownerAIRequest('/owner-ai/conversations?limit=2',{},12000);if(c.activeId&&!c.conversations.some(x=>x.id===c.activeId))c.activeId=null;if(!c.activeId&&c.conversations[0])c.activeId=c.conversations[0].id;if(!c.activeId){const created=await ownerAIRequest('/owner-ai/conversations',{method:'POST',body:JSON.stringify({title:'گفتگوی جدید'})},12000);c.conversations=[created];c.activeId=created.id;c.messages=[]}else await ownerAILoadConversation(c.activeId,false)}catch(error){c.error=error.message||'بارگذاری گفتگوها انجام نشد';c.messages=[]}finally{c.loading=false;render();ownerAIScrollBottom()}}
  window.closeOwnerAIChat = function closeOwnerAIChat(){const c=ownerAIState();c.open=false;c.historyOpen=false;render()}
  window.ownerAIToggleHistory = function ownerAIToggleHistory(){const c=ownerAIState();c.historyOpen=!c.historyOpen;render()}
  window.ownerAINewConversation = async function ownerAINewConversation(){const c=ownerAIState();if(c.sending)return;c.loading=true;c.error='';render();try{const item=await apiRequest('/owner-ai/conversations',{method:'POST',body:JSON.stringify({title:'گفتگوی جدید'})});c.conversations=[item,...c.conversations].slice(0,2);c.activeId=item.id;c.messages=[];c.historyOpen=false}catch(error){c.error=error.message||'ساخت گفتگو انجام نشد'}finally{c.loading=false;render();setTimeout(()=>$('#ownerAIInput')?.focus(),30)}}
  window.ownerAILoadConversation = async function ownerAILoadConversation(id,paint=true){const c=ownerAIState(),data=await ownerAIRequest('/owner-ai/conversations/'+encodeURIComponent(id)+'?limit=40',{},12000);c.activeId=id;c.messages=[...(data.messages||[]),...ownerAIFailedMessages(id)];c.historyOpen=false;if(paint){c.loading=false;render();ownerAIScrollBottom()}}
  window.ownerAIOpenConversation = async function ownerAIOpenConversation(id){const c=ownerAIState();if(c.sending||id===c.activeId){c.historyOpen=false;render();return}c.loading=true;c.error='';render();try{await ownerAILoadConversation(id)}catch(error){c.error=error.message||'گفتگو باز نشد';c.loading=false;render()}}
  window.ownerAIDeleteConversation = async function ownerAIDeleteConversation(id){if(!await appConfirm('این گفتگو و تمام پیام‌های آن حذف شود؟'))return;const c=ownerAIState();try{await apiRequest('/owner-ai/conversations/'+encodeURIComponent(id),{method:'DELETE'});c.conversations=c.conversations.filter(x=>x.id!==id);if(c.activeId===id){c.activeId=c.conversations[0]?.id||null;c.messages=[];if(c.activeId)await ownerAILoadConversation(c.activeId,false)}render()}catch(error){c.error=error.message||'حذف گفتگو انجام نشد';render()}}
  window.ownerAIChangeProvider = async function ownerAIChangeProvider(providerId){const c=ownerAIState(),active=c.conversations.find(x=>x.id===c.activeId);if(!active||c.sending)return;const previous=active.provider_preference||'';active.provider_preference=providerId||null;render();try{const updated=await apiRequest('/owner-ai/conversations/'+encodeURIComponent(active.id)+'/provider',{method:'PATCH',body:JSON.stringify({provider_id:providerId||null})});Object.assign(active,updated)}catch(error){active.provider_preference=previous||null;c.error=error.message||'تغییر API انجام نشد'}render()}
  window.ownerAIOpenProviders = function ownerAIOpenProviders(){const c=ownerAIState();c.manageOpen=true;c.notice='';c.editingProvider=null;render()}
  window.ownerAICloseProviders = function ownerAICloseProviders(){const c=ownerAIState();c.manageOpen=false;c.editingProvider=null;c.notice='';render()}
  window.ownerAIEditProvider = function ownerAIEditProvider(id){const c=ownerAIState();c.editingProvider={...c.providers.find(x=>x.id===id)};c.notice='';render()}
  window.ownerAICancelProviderEdit = function ownerAICancelProviderEdit(){const c=ownerAIState();c.editingProvider=null;c.notice='';render()}
  window.ownerAISaveProvider = async function ownerAISaveProvider(event){event.preventDefault();const c=ownerAIState(),edit=c.editingProvider||{},payload={name:$('#ownerAIProviderName').value.trim(),model:$('#ownerAIProviderModel').value.trim(),base_url:$('#ownerAIProviderUrl').value.trim()},key=$('#ownerAIProviderKey').value.trim();if(key)payload.api_key=key;try{if(edit.id)await apiRequest('/owner-ai/providers/'+encodeURIComponent(edit.id),{method:'PATCH',body:JSON.stringify(payload)});else await apiRequest('/owner-ai/providers',{method:'POST',body:JSON.stringify({...payload,api_key:key})});await ownerAILoadProviders();c.editingProvider=null;c.notice='API با موفقیت ذخیره شد.'}catch(error){c.notice=error.message||'ثبت API انجام نشد'}render()}
  window.ownerAITestProvider = async function ownerAITestProvider(id){const c=ownerAIState();c.notice='در حال آزمایش اتصال…';render();try{const data=await apiRequest('/owner-ai/providers/'+encodeURIComponent(id)+'/test',{method:'POST'});c.notice=`اتصال موفق: ${data.provider} · ${data.model}`}catch(error){c.notice='تست ناموفق: '+(error.message||'خطای اتصال')}render()}
  window.ownerAIToggleProvider = async function ownerAIToggleProvider(id,enabled){const c=ownerAIState();try{await apiRequest('/owner-ai/providers/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({enabled})});await ownerAILoadProviders();c.notice=enabled?'API فعال شد.':'API غیرفعال شد.'}catch(error){c.notice=error.message||'تغییر وضعیت انجام نشد'}render()}
  window.ownerAIDeleteProvider = async function ownerAIDeleteProvider(id){if(!await appConfirm('این API شخصی حذف شود؟'))return;const c=ownerAIState();try{await apiRequest('/owner-ai/providers/'+encodeURIComponent(id),{method:'DELETE'});await ownerAILoadProviders();c.conversations.forEach(x=>{if(x.provider_preference===id)x.provider_preference=null});c.notice='API حذف شد.'}catch(error){c.notice=error.message||'حذف API انجام نشد'}render()}
  window.ownerAIInputKey = function ownerAIInputKey(event){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ownerAISend()}}
  window.ownerAIClientMessageId = function ownerAIClientMessageId(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:r&3|8;return v.toString(16)})}
  window.ownerAISend = async function ownerAISend(){const c=ownerAIState(),input=$('#ownerAIInput'),content=input?.value.trim();if(!content||c.sending||c.loading)return;if(!c.activeId){await ownerAINewConversation();if(!c.activeId)return}const requestId=c.retryRequestId||ownerAIClientMessageId(),pendingId='pending-'+requestId;c.retryRequestId=null;c.sending=true;c.error='';c.messages=[...c.messages,{id:pendingId,role:'user',content,requestId}];input.value='';render();ownerAIScrollBottom();try{const data=await ownerAIRequest('/owner-ai/conversations/'+encodeURIComponent(c.activeId)+'/messages',{method:'POST',body:JSON.stringify({content,client_message_id:requestId})},120000);c.messages=c.messages.filter(x=>x.id!==pendingId);ownerAIRemoveFailedText(c.activeId,content);c.messages.push(data.user_message,data.assistant_message);const updated=data.conversation;c.conversations=[updated,...c.conversations.filter(x=>x.id!==updated.id)];if(data.pending_action){render();ownerAIScrollBottom();const approved=await appConfirm(`دستیار می‌خواهد عملیات زیر را انجام دهد:\n\n${data.pending_action.summary}\n\nآیا اجرا شود؟`);if(approved){const executed=await ownerAIRequest('/owner-ai/conversations/'+encodeURIComponent(c.activeId)+'/actions/confirm',{method:'POST',body:JSON.stringify({token:data.pending_action.token})},30000);c.messages.push(executed.assistant_message)}else c.messages.push({id:'cancelled-'+Date.now(),role:'assistant',content:'عملیات با تصمیم شما لغو شد.',provider:'Amookht Agent',model:'approval-gate'})}}catch(error){const failed={id:'failed-'+requestId,role:'user',content,requestId,failed:true,error:error.message||'ارسال انجام نشد'};c.messages=c.messages.map(x=>x.id===pendingId?failed:x);ownerAIStoreFailed(c.activeId,failed);c.error=''}finally{c.sending=false;render();ownerAIScrollBottom()}}
  window.ownerAIFailedKey = function ownerAIFailedKey(conversationId){return'owner_ai_failed_'+String(S.currentUser||'owner').toLowerCase()+'_'+conversationId}
  window.ownerAIFailedMessages = function ownerAIFailedMessages(conversationId){try{const items=JSON.parse(localStorage.getItem(ownerAIFailedKey(conversationId))||'[]');return Array.isArray(items)?items.filter(x=>x&&x.failed&&x.content).slice(-20):[]}catch{return[]}}
  window.ownerAIStoreFailed = function ownerAIStoreFailed(conversationId,message){const items=ownerAIFailedMessages(conversationId);if(!items.some(x=>x.id===message.id))items.push(message);localStorage.setItem(ownerAIFailedKey(conversationId),JSON.stringify(items.slice(-20)))}
  window.ownerAIRemoveFailedText = function ownerAIRemoveFailedText(conversationId,content){const items=ownerAIFailedMessages(conversationId).filter(x=>x.content!==content);if(items.length)localStorage.setItem(ownerAIFailedKey(conversationId),JSON.stringify(items));else localStorage.removeItem(ownerAIFailedKey(conversationId))}
  window.ownerAIRetryFailed = function ownerAIRetryFailed(id){const c=ownerAIState(),message=c.messages.find(x=>x.id===id&&x.failed);if(!message||c.sending)return;c.messages=c.messages.filter(x=>x.id!==id);ownerAIRemoveFailedText(c.activeId,message.content);c.retryRequestId=message.requestId||ownerAIClientMessageId();render();const input=$('#ownerAIInput');if(!input)return;input.value=message.content;ownerAISend()}
  window.ownerAIDecorateFailed = function ownerAIDecorateFailed(){const c=ownerAIState(),bubbles=[...document.querySelectorAll('#ownerAIMessages .owner-ai-bubble')];c.messages.forEach((message,index)=>{if(!message.failed||!bubbles[index])return;const bubble=bubbles[index];bubble.classList.add('owner-ai-failed');if(bubble.querySelector('.owner-ai-retry'))return;const label=document.createElement('small');label.className='owner-ai-failed-label';label.textContent='ارسال نشد · برای تلاش دوباره فلش را بزنید';const button=document.createElement('button');button.type='button';button.className='owner-ai-retry';button.title='تلاش دوباره';button.setAttribute('aria-label','تلاش دوباره برای ارسال پیام');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg>';button.addEventListener('click',()=>ownerAIRetryFailed(message.id));bubble.append(label,button)})}
  window.ownerAIScrollBottom = function ownerAIScrollBottom(){setTimeout(()=>{ownerAIDecorateFailed();const box=$('#ownerAIMessages');if(box)box.scrollTop=box.scrollHeight;$('#ownerAIInput')?.focus()},40)}
  if(!window.ownerAIFailedObserver){window.ownerAIFailedObserver=new MutationObserver(()=>{if(ownerAIState().messages?.some(x=>x.failed))ownerAIDecorateFailed()});window.ownerAIFailedObserver.observe(document.body,{childList:true,subtree:true})}
  const SUPPORT_LINKS={instagram:'https://www.instagram.com/',telegram:'https://t.me/Amookht_support',whatsapp:'https://www.whatsapp.com/',youtube:'https://www.youtube.com/'};
  /* Owner agent UI v3 — loaded after the main app script and replaces the owner-chat functions:
     Markdown answers, persistent approval cards (button or typed «تأیید»), quick tasks, kept drafts, progress timer. */
  (function () {
    'use strict';
    if (typeof window === 'undefined' || typeof window.renderOwnerAIChat !== 'function') return;
    const E = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const st = () => ownerAIState();
    const OWNER_QUICK_COPY={"چه مقدار محتوای برنامه یادگیری آماده است، برای چند هفته کافی است و چقدر دیگر باید آماده کنیم؟":["How much learning-plan content is ready, how many weeks does it cover, and how much more should we prepare?","Wie viele Inhalte für den Lernplan sind fertig, für wie viele Wochen reichen sie, und wie viel müssen wir noch vorbereiten?"],"پیشرفت من در برنامه یادگیری را تحلیل کن و برای هفتهٔ بعد سه پیشنهاد مشخص بده.":["Analyze my progress in the learning plan and give me three specific suggestions for next week.","Analysiere meinen Fortschritt im Lernplan und gib mir drei konkrete Empfehlungen für nächste Woche."],"۲۰ واژهٔ سطح C1 برای موضوع Informatik & IT در دیتابیس خصوصی بساز.":["Create 20 C1-level words on Informatik & IT in my private database.","Erstelle 20 C1-Wörter zum Thema Informatik & IT in meiner privaten Datenbank."],"یک متن Lesen سطح C1 با سؤال برای موضوع Umwelt & Klima بساز (خصوصی).":["Create a C1 reading text with questions on Umwelt & Klima for my private content.","Erstelle einen C1-Lesetext mit Fragen zum Thema Umwelt & Klima als privaten Inhalt."],"۴ فایل Hören تازه برای برنامه یادگیری سفارش بده.":["Order four new listening files for the learning plan.","Bestelle vier neue Hördateien für den Lernplan."],"کیفیت واژگان بانک محتوای سایت را بررسی کن و بگو کجا ضعیف است و چه پیشنهادی داری.":["Review the site vocabulary bank, identify weak areas and suggest improvements.","Prüfe den Wortschatz der Inhaltsdatenbank, nenne Schwächen und schlage Verbesserungen vor."],"آمار کاربران و فعالیت ۷ روز اخیر سایت را بده.":["Show user statistics and activity for the last seven days.","Zeige Nutzerstatistiken und Aktivitäten der letzten sieben Tage."]};
    const ownerT=(value)=>{const row=OWNER_QUICK_COPY[value];return row?(S.uiLanguage==='en'?row[0]:S.uiLanguage==='de'?row[1]:value):value};
    const QUICK = [
      { icon: '📦', label: 'وضعیت محتوای برنامه', text: 'چه مقدار محتوای برنامه یادگیری آماده است، برای چند هفته کافی است و چقدر دیگر باید آماده کنیم؟' },
      { icon: '📈', label: 'تحلیل پیشرفت من', text: 'پیشرفت من در برنامه یادگیری را تحلیل کن و برای هفتهٔ بعد سه پیشنهاد مشخص بده.' },
      { icon: '🧩', label: '۲۰ واژهٔ C1', text: '۲۰ واژهٔ سطح C1 برای موضوع Informatik & IT در دیتابیس خصوصی بساز.' },
      { icon: '📰', label: 'متن Lesen تازه', text: 'یک متن Lesen سطح C1 با سؤال برای موضوع Umwelt & Klima بساز (خصوصی).' },
      { icon: '🎧', label: 'سفارش Hören برای برنامه', text: '۴ فایل Hören تازه برای برنامه یادگیری سفارش بده.' },
      { icon: '🔎', label: 'کیفیت بانک محتوا', text: 'کیفیت واژگان بانک محتوای سایت را بررسی کن و بگو کجا ضعیف است و چه پیشنهادی داری.' },
      { icon: '👥', label: 'آمار کاربران', text: 'آمار کاربران و فعالیت ۷ روز اخیر سایت را بده.' },
    ];

    // ───────────── Markdown (safe: everything is escaped first) ─────────────
    function inline(s) {
      return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<i>$2</i>').replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,:;!?]|$)/g, '$1<i>$2</i>');
    }
    function md(text) {
      const lines = E(text).split(/\r?\n/);
      let out = '', list = null, i = 0;
      const close = () => { if (list) { out += `</${list}>`; list = null; } };
      while (i < lines.length) {
        const line = lines[i].replace(/\s+$/, '');
        if (/^```/.test(line)) { close(); const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out += `<pre dir="ltr"><code>${buf.join('\n')}</code></pre>`; continue; }
        if (/^\s*\|.*\|\s*$/.test(line)) {
          close(); const rows = []; while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++].trim());
          const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
          const body = rows.filter((r) => !(/^[\s|:-]+$/.test(r) && r.includes('-')));
          if (body.length) out += `<div class="oa-table"><table><thead><tr>${cells(body[0]).map((c) => `<th dir="auto">${c}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td dir="auto">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
          continue;
        }
        const ul = line.match(/^\s*[-*•]\s+(.*)$/), ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/), h = line.match(/^\s*(#{1,4})\s+(.*)$/), q = line.match(/^\s*&gt;\s?(.*)$/);
        if (ul || ol) { const type = ul ? 'ul' : 'ol'; if (list !== type) { close(); out += `<${type} dir="auto">`; list = type; } out += `<li dir="auto">${inline(ul ? ul[1] : ol[2])}</li>`; i++; continue; }
        close();
        if (h) out += `<p class="oa-h oa-h${h[1].length}" dir="auto">${inline(h[2])}</p>`;
        else if (q) out += `<blockquote dir="auto">${inline(q[1])}</blockquote>`;
        else if (/^\s*(---|\*\*\*)\s*$/.test(line)) out += '<hr>';
        else if (line.trim()) out += `<p dir="auto">${inline(line)}</p>`;
        i++;
      }
      close();
      return out;
    }

    // ───────────── rendering ─────────────
    function pendingCard(m) {
      const p = m.pending_action; if (!p) return '';
      const status = p.status || 'pending', busy = st().actionBusy === m.id;
      const badge = { pending: '<span class="oa-badge wait">در انتظار تأیید</span>', done: '<span class="oa-badge ok">✓ انجام شد</span>', cancelled: '<span class="oa-badge off">لغو شد</span>', expired: '<span class="oa-badge off">منقضی شد</span>' }[status] || '';
      const preview = (p.preview || []).join('\n'), long = (p.preview || []).length > 14;
      return `<div class="oa-action oa-${status}">
        <header><b dir="auto">🛠 ${E(p.summary || 'عملیات پیشنهادی')}</b>${badge}</header>
        ${preview ? (long ? `<details ${status === 'pending' ? 'open' : ''}><summary>پیش‌نمایش (${(p.preview || []).length} خط)</summary><div class="oa-md oa-preview">${md(preview)}</div></details>` : `<div class="oa-md oa-preview">${md(preview)}</div>`) : ''}
        ${status === 'pending' ? `<footer><button class="oa-confirm" ${busy ? 'disabled' : ''} data-on-click="window.ownerAIConfirmAction" data-on-click-args="'${E(m.id)}'">${busy ? 'در حال اجرا…' : '✓ تأیید و ذخیره'}</button><button class="oa-cancel" ${busy ? 'disabled' : ''} data-on-click="window.ownerAICancelAction" data-on-click-args="'${E(m.id)}'">لغو</button><small>یا بنویسید «تأیید» / «لغو»؛ برای تغییر، اصلاحیه را بنویسید.</small></footer>` : ''}
      </div>`;
    }
    function bubble(m) {
      if (m.role === 'user') return `<article class="owner-ai-bubble user oa-user" dir="auto">${E(m.content)}</article>`;
      return `<article class="owner-ai-bubble assistant oa-bot"><div class="oa-md">${md(m.content)}</div>${pendingCard(m)}${m.provider ? `<footer class="owner-ai-bubble-meta"><span>${E(m.provider)}</span><span>${E(m.model || '')}</span><button class="oa-copy" title="کپی" data-on-click="window.ownerAICopy" data-on-click-args="'${E(m.id)}'">⧉</button></footer>` : ''}</article>`;
    }
    function emptyState() {
      return `<div class="owner-ai-empty oa-empty"><span>✦</span><h3>دستیار حرفه‌ای مالک</h3><p dir="auto">تولید واژه و متن و تمرین، سفارش محتوای برنامه یادگیری، تحلیل پیشرفت، کیفیت محتوا، آمار سایت، کتابخانه و کاربران. هر تغییری اول به شکل پیش‌نویس نمایش داده می‌شود و فقط با تأیید شما ذخیره می‌شود.</p>
        <div class="oa-quick">${QUICK.map((q, i) => `<button data-on-click="window.ownerAIQuick" data-on-click-args="${i}"><i>${q.icon}</i>${E(q.label)}</button>`).join('')}</div></div>`;
    }
    window.renderOwnerAIChat = function () {
      if (!isOwnerAccount() || !S.currentUser || ['landing', 'auth'].includes(S.screen)) return '';
      const c = st();
      if (!c.open) return `<button type="button" class="owner-ai-launcher" data-on-click="window.openOwnerAIChat" data-on-click-args="" title="${T('دستیار هوش مصنوعی مالک')}" aria-label="${T('دستیار هوش مصنوعی مالک')}"><svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v1a4 4 0 0 0 1 7.87V20h4v-6H6v-4a6 6 0 0 1 12 0v4h-4v6h4v-1.13A4 4 0 0 0 19 11v-1a7 7 0 0 0-7-7Z"/><path d="M9 10.5h.01M15 10.5h.01M9.5 13.5c1.5 1 3.5 1 5 0"/></svg><i></i></button>`;
      const active = c.conversations.find((x) => x.id === c.activeId), messages = c.messages || [];
      const sending = c.sending ? `<div class="oa-working"><div class="owner-ai-thinking"><i></i><i></i><i></i></div><span id="oaElapsed" dir="auto">${E(workingText())}</span></div>` : '';
      return `<div class="owner-ai-backdrop" data-on-click="window.__amkIfSelf" data-on-click-args="this,event,'closeOwnerAIChat'"><section class="owner-ai-window oa-v3 ${c.historyOpen ? 'show-history' : ''}" role="dialog" aria-modal="true">
        <aside class="owner-ai-history"><div class="owner-ai-history-head"><h3>تاریخچه گفتگو</h3><button class="owner-ai-new" data-on-click="window.ownerAINewConversation" data-on-click-args="">+ گفتگوی جدید</button></div>
        <div class="owner-ai-list">${c.conversations.length ? c.conversations.map((item) => `<button class="owner-ai-history-item ${item.id === c.activeId ? 'active' : ''}" data-on-click="window.ownerAIOpenConversation" data-on-click-args="'${E(item.id)}'"><b dir="auto">${E(item.title || 'گفتگوی جدید')}</b><small>${Number(item.message_count || 0)} پیام${item.provider ? ' · ' + E(item.provider) : ''}</small><span class="owner-ai-delete" data-on-click="window.ownerAIDeleteConversation" data-on-click-args="'${E(item.id)}'">×</span></button>`).join('') : `<div class="owner-ai-empty"><p>هنوز گفتگویی وجود ندارد.</p></div>`}</div></aside>
        <main class="owner-ai-main"><header class="owner-ai-header"><div class="owner-ai-header-title"><button class="owner-ai-mobile-history" data-on-click="window.ownerAIToggleHistory" data-on-click-args="">تاریخچه</button><span class="owner-ai-orb">AI</span><div><h2 dir="auto">${E(active?.title || 'دستیار خصوصی مالک')}</h2><p>${active?.provider ? `آخرین پاسخ: ${E(active.provider)} · ${E(active.model || '')}` : 'Agent چندمرحله‌ای · تولید محتوا با تأیید شما'}</p></div></div>
        <div class="owner-ai-provider-tools"><button class="oa-newchat" title="گفتگوی جدید" data-on-click="window.ownerAINewConversation" data-on-click-args="" ${c.sending ? 'disabled' : ''}>＋</button><select class="owner-ai-provider-select" data-on-change="window.ownerAIChangeProvider" data-on-change-args="this.value" ${!active || c.sending ? 'disabled' : ''}>${ownerAIProviderOptions(active)}</select><button class="owner-ai-provider-manage" data-on-click="window.ownerAIOpenProviders" data-on-click-args="" title="مدیریت APIها">⚙</button><button class="owner-ai-close" data-on-click="window.closeOwnerAIChat" data-on-click-args="">×</button></div></header>
        <div class="owner-ai-messages" id="ownerAIMessages">${c.loading ? `<div class="owner-ai-thinking"><i></i><i></i><i></i></div>` : messages.length ? messages.map(bubble).join('') : emptyState()}${sending}</div>
        <footer class="owner-ai-compose"><div class="owner-ai-compose-box"><textarea id="ownerAIInput" maxlength="20000" rows="1" dir="auto" placeholder="کار یا سؤال خود را بنویسید… (Enter ارسال، Shift+Enter خط جدید)" data-on-keydown="window.ownerAIInputKey" data-on-keydown-args="event" data-on-input="window.__amkOwnerDraft" data-on-input-args="this"></textarea><button class="owner-ai-send" data-on-click="window.ownerAISend" data-on-click-args="" ${c.sending ? 'disabled' : ''}>↑</button></div>${c.error ? `<p class="owner-ai-error">${E(c.error)}</p>` : ''}</footer></main>${renderOwnerAIProviderManager()}</section></div>`;
    };

    function workingText() {
      const c = st(), secs = c.sendStarted ? Math.round((Date.now() - c.sendStarted) / 1000) : 0;
      const hint = secs < 8 ? 'در حال بررسی درخواست…' : secs < 30 ? 'در حال استفاده از ابزارها و جمع‌آوری اطلاعات…' : 'در حال تولید و کنترل محتوا… (کارهای بزرگ تا ۳ دقیقه طول می‌کشد)';
      return `${hint} ${secs ? '· ' + secs + ' ثانیه' : ''}`;
    }
    let ticker = null;
    function startTicker() { stopTicker(); ticker = setInterval(() => { const el = document.getElementById('oaElapsed'); if (el) el.textContent = workingText(); }, 1000); }
    function stopTicker() { if (ticker) clearInterval(ticker); ticker = null; }

    // keep the draft across app re-renders (timers, navigation)
    function restoreDraft() {
      const c = st(), input = document.getElementById('ownerAIInput');
      if (input && c.draft && !input.value) { input.value = c.draft; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; }
    }
    if (typeof MutationObserver === 'function') {
      new MutationObserver(() => { if (st().open) restoreDraft(); }).observe(document.documentElement, { childList: true, subtree: true });
    }

    // ───────────── actions ─────────────
    window.ownerAIQuick = function (i) {
      const q = QUICK[i], input = document.getElementById('ownerAIInput'); if (!q || !input) return;
      input.value = ownerT(q.text); st().draft = input.value; input.focus();
      input.style.height = Math.min(input.scrollHeight, 160) + 'px';
    };
    window.ownerAICopy = function (id) {
      const m = (st().messages || []).find((x) => x.id === id); if (!m) return;
      try { navigator.clipboard.writeText(m.content); } catch (e) { /* clipboard unavailable */ }
    };
    window.openOwnerAIChat = async function () {
      if (!isOwnerAccount()) return;
      const c = st(); c.open = true; c.loading = true; c.sending = false; c.error = ''; render();
      ownerAILoadProviders().then(() => { if (c.open) render(); });
      try {
        c.conversations = await ownerAIRequest('/owner-ai/conversations?limit=30', {}, 15000);
        if (c.activeId && !c.conversations.some((x) => x.id === c.activeId)) c.activeId = null;
        if (!c.activeId && c.conversations[0]) c.activeId = c.conversations[0].id;
        if (!c.activeId) { const created = await ownerAIRequest('/owner-ai/conversations', { method: 'POST', body: JSON.stringify({ title: 'گفتگوی جدید' }) }, 15000); c.conversations = [created]; c.activeId = created.id; c.messages = []; }
        else await window.ownerAILoadConversation(c.activeId, false);
      } catch (error) { c.error = error.message || 'بارگذاری گفتگوها انجام نشد'; c.messages = []; }
      finally { c.loading = false; render(); ownerAIScrollBottom(); }
    };
    window.ownerAILoadConversation = async function (id, paint = true) {
      const c = st(), data = await ownerAIRequest('/owner-ai/conversations/' + encodeURIComponent(id) + '?limit=60', {}, 15000);
      c.activeId = id; c.messages = [...(data.messages || []), ...ownerAIFailedMessages(id)]; c.historyOpen = false;
      if (paint) { c.loading = false; render(); ownerAIScrollBottom(); }
    };
    window.ownerAINewConversation = async function () {
      const c = st(); if (c.sending) return; c.loading = true; c.error = ''; render();
      try { const item = await apiRequest('/owner-ai/conversations', { method: 'POST', body: JSON.stringify({ title: 'گفتگوی جدید' }) }); c.conversations = [item, ...c.conversations].slice(0, 30); c.activeId = item.id; c.messages = []; c.historyOpen = false; }
      catch (error) { c.error = error.message || 'ساخت گفتگو انجام نشد'; }
      finally { c.loading = false; render(); setTimeout(() => document.getElementById('ownerAIInput')?.focus(), 30); }
    };
    window.ownerAISend = async function () {
      const c = st(), input = document.getElementById('ownerAIInput'), content = input?.value.trim();
      if (!content || c.sending || c.loading) return;
      if (!c.activeId) { await window.ownerAINewConversation(); if (!c.activeId) return; }
      const requestId = c.retryRequestId || ownerAIClientMessageId(), pendingId = 'pending-' + requestId;
      c.retryRequestId = null; c.sending = true; c.sendStarted = Date.now(); c.error = ''; c.draft = '';
      c.messages = [...c.messages, { id: pendingId, role: 'user', content, requestId }]; input.value = '';
      render(); ownerAIScrollBottom(); startTicker();
      try {
        const data = await ownerAIRequest('/owner-ai/conversations/' + encodeURIComponent(c.activeId) + '/messages', { method: 'POST', body: JSON.stringify({ content, client_message_id: requestId }) }, 260000);
        c.messages = c.messages.filter((x) => x.id !== pendingId); ownerAIRemoveFailedText(c.activeId, content);
        if (data.action_state) c.messages.forEach((m) => { if (m.pending_action && data.action_state[m.pending_action.id]) m.pending_action.status = data.action_state[m.pending_action.id]; });
        c.messages.push(data.user_message, data.assistant_message);
        const updated = data.conversation; c.conversations = [updated, ...c.conversations.filter((x) => x.id !== updated.id)];
      } catch (error) {
        const failed = { id: 'failed-' + requestId, role: 'user', content, requestId, failed: true, error: error.message || 'ارسال انجام نشد' };
        c.messages = c.messages.map((x) => (x.id === pendingId ? failed : x)); ownerAIStoreFailed(c.activeId, failed); c.error = error.message || '';
      } finally { stopTicker(); c.sending = false; c.sendStarted = 0; render(); ownerAIScrollBottom(); }
    };
    async function actionCall(messageId, kind) {
      const c = st(), m = (c.messages || []).find((x) => x.id === messageId), p = m?.pending_action;
      if (!p || p.status !== 'pending' || c.actionBusy) return;
      c.actionBusy = messageId; c.error = ''; render();
      try {
        const data = await ownerAIRequest('/owner-ai/conversations/' + encodeURIComponent(c.activeId) + '/actions/' + kind, { method: 'POST', body: JSON.stringify({ token: p.token }) }, 120000);
        p.status = kind === 'confirm' ? 'done' : 'cancelled';
        if (data.assistant_message) c.messages.push(data.assistant_message);
      } catch (error) {
        const msg = String(error.message || '');
        if (/already executed/i.test(msg)) p.status = 'done'; else if (/cancelled/i.test(msg)) p.status = 'cancelled'; else if (/expired/i.test(msg)) p.status = 'expired';
        c.error = (kind === 'confirm' ? 'اجرای عملیات انجام نشد: ' : 'لغو انجام نشد: ') + msg;
      } finally { c.actionBusy = null; render(); ownerAIScrollBottom(); }
    }
    window.ownerAIConfirmAction = (id) => actionCall(id, 'confirm');
    window.ownerAICancelAction = (id) => actionCall(id, 'cancel');
  })();

  const base = window.render;
  // page redraws re-run the hooks often; never repaint the panel under the owner's cursor
  window.render = function () { const r = base ? base.apply(this, arguments) : undefined; if (!(host && host.contains(document.activeElement))) render(); return r; };
  render();
}
