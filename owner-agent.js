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
      ${status === 'pending' ? `<footer><button class="oa-confirm" ${busy ? 'disabled' : ''} onclick="ownerAIConfirmAction('${E(m.id)}')">${busy ? 'در حال اجرا…' : '✓ تأیید و ذخیره'}</button><button class="oa-cancel" ${busy ? 'disabled' : ''} onclick="ownerAICancelAction('${E(m.id)}')">لغو</button><small>یا بنویسید «تأیید» / «لغو»؛ برای تغییر، اصلاحیه را بنویسید.</small></footer>` : ''}
    </div>`;
  }
  function bubble(m) {
    if (m.role === 'user') return `<article class="owner-ai-bubble user oa-user" dir="auto">${E(m.content)}</article>`;
    return `<article class="owner-ai-bubble assistant oa-bot"><div class="oa-md">${md(m.content)}</div>${pendingCard(m)}${m.provider ? `<footer class="owner-ai-bubble-meta"><span>${E(m.provider)}</span><span>${E(m.model || '')}</span><button class="oa-copy" title="کپی" onclick="ownerAICopy('${E(m.id)}')">⧉</button></footer>` : ''}</article>`;
  }
  function emptyState() {
    return `<div class="owner-ai-empty oa-empty"><span>✦</span><h3>دستیار حرفه‌ای مالک</h3><p dir="auto">تولید واژه و متن و تمرین، سفارش محتوای برنامه یادگیری، تحلیل پیشرفت، کیفیت محتوا، آمار سایت، کتابخانه و کاربران. هر تغییری اول به شکل پیش‌نویس نمایش داده می‌شود و فقط با تأیید شما ذخیره می‌شود.</p>
      <div class="oa-quick">${QUICK.map((q, i) => `<button onclick="ownerAIQuick(${i})"><i>${q.icon}</i>${E(q.label)}</button>`).join('')}</div></div>`;
  }
  window.renderOwnerAIChat = function () {
    if (!isOwnerAccount() || !S.currentUser || ['landing', 'auth'].includes(S.screen)) return '';
    const c = st();
    if (!c.open) return `<button type="button" class="owner-ai-launcher" onclick="openOwnerAIChat()" title="دستیار هوش مصنوعی مالک" aria-label="دستیار هوش مصنوعی مالک"><svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v1a4 4 0 0 0 1 7.87V20h4v-6H6v-4a6 6 0 0 1 12 0v4h-4v6h4v-1.13A4 4 0 0 0 19 11v-1a7 7 0 0 0-7-7Z"/><path d="M9 10.5h.01M15 10.5h.01M9.5 13.5c1.5 1 3.5 1 5 0"/></svg><i></i></button>`;
    const active = c.conversations.find((x) => x.id === c.activeId), messages = c.messages || [];
    const sending = c.sending ? `<div class="oa-working"><div class="owner-ai-thinking"><i></i><i></i><i></i></div><span id="oaElapsed" dir="auto">${E(workingText())}</span></div>` : '';
    return `<div class="owner-ai-backdrop" onclick="if(event.target===this)closeOwnerAIChat()"><section class="owner-ai-window oa-v3 ${c.historyOpen ? 'show-history' : ''}" role="dialog" aria-modal="true">
      <aside class="owner-ai-history"><div class="owner-ai-history-head"><h3>تاریخچه گفتگو</h3><button class="owner-ai-new" onclick="ownerAINewConversation()">+ گفتگوی جدید</button></div>
      <div class="owner-ai-list">${c.conversations.length ? c.conversations.map((item) => `<button class="owner-ai-history-item ${item.id === c.activeId ? 'active' : ''}" onclick="ownerAIOpenConversation('${E(item.id)}')"><b dir="auto">${E(item.title || 'گفتگوی جدید')}</b><small>${Number(item.message_count || 0)} پیام${item.provider ? ' · ' + E(item.provider) : ''}</small><span class="owner-ai-delete" onclick="event.stopPropagation();ownerAIDeleteConversation('${E(item.id)}')">×</span></button>`).join('') : `<div class="owner-ai-empty"><p>هنوز گفتگویی وجود ندارد.</p></div>`}</div></aside>
      <main class="owner-ai-main"><header class="owner-ai-header"><div class="owner-ai-header-title"><button class="owner-ai-mobile-history" onclick="ownerAIToggleHistory()">تاریخچه</button><span class="owner-ai-orb">AI</span><div><h2 dir="auto">${E(active?.title || 'دستیار خصوصی مالک')}</h2><p>${active?.provider ? `آخرین پاسخ: ${E(active.provider)} · ${E(active.model || '')}` : 'Agent چندمرحله‌ای · تولید محتوا با تأیید شما'}</p></div></div>
      <div class="owner-ai-provider-tools"><button class="oa-newchat" title="گفتگوی جدید" onclick="ownerAINewConversation()" ${c.sending ? 'disabled' : ''}>＋</button><select class="owner-ai-provider-select" onchange="ownerAIChangeProvider(this.value)" ${!active || c.sending ? 'disabled' : ''}>${ownerAIProviderOptions(active)}</select><button class="owner-ai-provider-manage" onclick="ownerAIOpenProviders()" title="مدیریت APIها">⚙</button><button class="owner-ai-close" onclick="closeOwnerAIChat()">×</button></div></header>
      <div class="owner-ai-messages" id="ownerAIMessages">${c.loading ? `<div class="owner-ai-thinking"><i></i><i></i><i></i></div>` : messages.length ? messages.map(bubble).join('') : emptyState()}${sending}</div>
      <footer class="owner-ai-compose"><div class="owner-ai-compose-box"><textarea id="ownerAIInput" maxlength="20000" rows="1" dir="auto" placeholder="کار یا سؤال خود را بنویسید… (Enter ارسال، Shift+Enter خط جدید)" onkeydown="ownerAIInputKey(event)" oninput="ownerAIState().draft=this.value;this.style.height='auto';this.style.height=Math.min(this.scrollHeight,160)+'px'"></textarea><button class="owner-ai-send" onclick="ownerAISend()" ${c.sending ? 'disabled' : ''}>↑</button></div>${c.error ? `<p class="owner-ai-error">${E(c.error)}</p>` : ''}</footer></main>${renderOwnerAIProviderManager()}</section></div>`;
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
