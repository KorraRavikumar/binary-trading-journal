// ===== GLOBAL VARIABLES =====
let trades = [];
let transactions = [];
let settings = { dailyLimit: 10, riskPercentage: 2, defaultAmount: 10, dailyLossLimitPct: 6, cooldownMinutes: 5 };
let goals = { dailyWins: 4, avgPayout: 87 };
let tradingRules = ['Max 10 trades per day','Never trade without a setup','No Martingale EVER','Stop after 3 consecutive losses','Take profit at daily target','No trading when emotional','Only trade my setups','Risk max 2% per trade'];
let diaryEntries = [];
let weeklyReviews = [];
let tradingSchedule = {
    0: { active: false, start: '00:00', end: '00:00' },
    1: { active: true, start: '09:00', end: '20:00' },
    2: { active: true, start: '09:00', end: '20:00' },
    3: { active: true, start: '09:00', end: '20:00' },
    4: { active: true, start: '09:00', end: '20:00' },
    5: { active: true, start: '09:00', end: '17:00' },
    6: { active: false, start: '00:00', end: '00:00' }
};
let currentMonth = new Date();
let currentChartView = 'daily';
let plChart = null;
let balanceChart = null;
let winRateTrendChart = null;
let equityCurveChart = null;
let tradeToDelete = null;
let transactionToDelete = null;
let pendingLossTrade = null;
let voiceEnabled = true;
let currentLossCount = 0;
let selectedMistakes = [];
let sessionMood = null;
let sessionStarted = false;
let cooldownActive = false;
let cooldownTimer = null;
let cooldownEndTime = null;
let profitLocked = false;
let postTradeData = {};
let pendingPostTradeId = null;
let tradeConfidence = 5;

const expiryLabels = {'5s':'5 Sec','10s':'10 Sec','15s':'15 Sec','30s':'30 Sec','60s':'60 Sec','2m':'2 Min','3m':'3 Min','5m':'5 Min','10m':'10 Min','15m':'15 Min','30m':'30 Min','45m':'45 Min','1h':'1 Hour','2h':'2 Hours','3h':'3 Hours','4h':'4 Hours','1d':'End of Day','1w':'End of Week'};
const optionTypeLabels = {'call':'Call (Higher)','put':'Put (Lower)'};
const setupIcons = {'Greenline Moment':'🟢','Closing below or above Greenline':'↕️','Golden Moment':'🌟','Traffic Line Moment':'🚦'};
const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayNamesShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ===== ACHIEVEMENTS =====
const achievementDefs = [
    {id:'first_trade',name:'First Trade',icon:'🎯',desc:'Record your first trade',target:1,getCurrent:()=>trades.length,check:()=>trades.length>=1},
    {id:'ten_trades',name:'10 Trades',icon:'📊',desc:'Complete 10 trades',target:10,getCurrent:()=>trades.length,check:()=>trades.length>=10},
    {id:'fifty_trades',name:'50 Trades',icon:'🔥',desc:'Complete 50 trades',target:50,getCurrent:()=>trades.length,check:()=>trades.length>=50},
    {id:'hundred_trades',name:'100 Trades',icon:'💯',desc:'Complete 100 trades',target:100,getCurrent:()=>trades.length,check:()=>trades.length>=100},
    {id:'first_win',name:'First Win',icon:'✅',desc:'Win your first trade',target:1,getCurrent:()=>trades.filter(t=>t.result==='win').length,check:()=>trades.filter(t=>t.result==='win').length>=1},
    {id:'ten_wins',name:'10 Wins',icon:'🏆',desc:'Win 10 trades',target:10,getCurrent:()=>trades.filter(t=>t.result==='win').length,check:()=>trades.filter(t=>t.result==='win').length>=10},
    {id:'fifty_wins',name:'50 Wins',icon:'👑',desc:'Win 50 trades',target:50,getCurrent:()=>trades.filter(t=>t.result==='win').length,check:()=>trades.filter(t=>t.result==='win').length>=50},
    {id:'win_rate_55',name:'55% Win Rate',icon:'📈',desc:'55% win rate (min 20 trades)',target:55,getCurrent:()=>trades.length>0?(trades.filter(t=>t.result==='win').length/trades.length*100):0,check:()=>trades.length>=20&&(trades.filter(t=>t.result==='win').length/trades.length*100)>=55},
    {id:'win_rate_60',name:'60% Win Rate',icon:'🎯',desc:'60% win rate (min 30 trades)',target:60,getCurrent:()=>trades.length>0?(trades.filter(t=>t.result==='win').length/trades.length*100):0,check:()=>trades.length>=30&&(trades.filter(t=>t.result==='win').length/trades.length*100)>=60},
    {id:'win_rate_70',name:'70% Win Rate',icon:'💎',desc:'70% win rate (min 50 trades)',target:70,getCurrent:()=>trades.length>0?(trades.filter(t=>t.result==='win').length/trades.length*100):0,check:()=>trades.length>=50&&(trades.filter(t=>t.result==='win').length/trades.length*100)>=70},
    {id:'profit_50',name:'$50 Profit',icon:'💰',desc:'Earn $50 profit',target:50,getCurrent:()=>Math.max(0,calculateTotalPL()),check:()=>calculateTotalPL()>=50},
    {id:'profit_100',name:'$100 Profit',icon:'💵',desc:'Earn $100 profit',target:100,getCurrent:()=>Math.max(0,calculateTotalPL()),check:()=>calculateTotalPL()>=100},
    {id:'profit_500',name:'$500 Profit',icon:'🤑',desc:'Earn $500 profit',target:500,getCurrent:()=>Math.max(0,calculateTotalPL()),check:()=>calculateTotalPL()>=500},
    {id:'streak_3',name:'3 Win Streak',icon:'🔥',desc:'Win 3 in a row',target:3,getCurrent:()=>calculateMaxStreak('win'),check:()=>calculateMaxStreak('win')>=3},
    {id:'streak_5',name:'5 Win Streak',icon:'🔥🔥',desc:'Win 5 in a row',target:5,getCurrent:()=>calculateMaxStreak('win'),check:()=>calculateMaxStreak('win')>=5},
    {id:'streak_10',name:'10 Win Streak',icon:'🔥🔥🔥',desc:'Win 10 in a row',target:10,getCurrent:()=>calculateMaxStreak('win'),check:()=>calculateMaxStreak('win')>=10},
    {id:'diary_7',name:'Week Journaler',icon:'📓',desc:'Write 7 diary entries',target:7,getCurrent:()=>diaryEntries.length,check:()=>diaryEntries.length>=7},
    {id:'diary_30',name:'Month Journaler',icon:'📔',desc:'Write 30 entries',target:30,getCurrent:()=>diaryEntries.length,check:()=>diaryEntries.length>=30},
    {id:'profitable_week',name:'Profitable Week',icon:'📅',desc:'End a week in profit',target:1,getCurrent:()=>getWeekPL()>0?1:0,check:()=>getWeekPL()>0},
    {id:'grade_a_10',name:'10 A+ Trades',icon:'⭐',desc:'Grade 10 trades A+',target:10,getCurrent:()=>trades.filter(t=>t.grade==='A+').length,check:()=>trades.filter(t=>t.grade==='A+').length>=10},
];

// ===== TELUGU VOICE =====
let voices = [];
let voicesLoaded = false;

function fixChromeBug(){if('speechSynthesis' in window){window.speechSynthesis.cancel();for(let i=0;i<10;i++)setTimeout(()=>window.speechSynthesis.getVoices(),i*50);}}
function loadVoices(){return new Promise(r=>{voices=window.speechSynthesis.getVoices();if(voices.length>0){voicesLoaded=true;r(voices);}else{window.speechSynthesis.onvoiceschanged=()=>{voices=window.speechSynthesis.getVoices();voicesLoaded=true;r(voices);};setTimeout(()=>{voices=window.speechSynthesis.getVoices();if(voices.length>0)voicesLoaded=true;r(voices);},1000);}});}
if('speechSynthesis' in window){fixChromeBug();loadVoices();}

function speakTeluguWarning(cl){
    if(!voiceEnabled||!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();voices=window.speechSynthesis.getVoices();
    const m=getMessage(cl);const u=new SpeechSynthesisUtterance(m.text);
    const v=findBestVoice(m.lang);if(v){u.voice=v;u.lang=v.lang;}else u.lang=m.lang;
    u.rate=1.85;u.pitch=cl>=3?1.2:1;u.volume=1;
    const ind=document.getElementById('voice-indicator');
    if(ind){ind.style.display='flex';ind.innerHTML='<span class="voice-wave">🔊</span><span>Speaking...</span>';}
    u.onend=()=>{if(ind)ind.style.display='none';};
    u.onerror=()=>{if(ind)ind.style.display='none';speakEnglishFallback(cl);};
    setTimeout(()=>window.speechSynthesis.speak(u),50);
}

function getMessage(l){
    const tv=voices.find(v=>v.lang==='te-IN'||v.lang==='te'||v.lang.startsWith('te'));
    const msgs={high:{te:"ప్రమాదం! ఆగండి! "+l+" ట్రేడ్లు ఓడిపోయారు! మార్టింగేల్ వాడకండి! ట్రేడింగ్ ఆపండి!",en:"Danger! Stop! "+l+" losses! No Martingale!"},med:{te:"హెచ్చరిక! "+l+" ట్రేడ్లు ఓడిపోయారు. జాగ్రత్త! తొందరపడకండి!",en:"Warning! "+l+" losses. Be careful! Don't rush!"},low:{te:"క్రమశిక్షణ! తొందరపడకండి! సరైన సమయం వేచి ఉండండి!",en:"Discipline! Don't rush! Wait for the right moment!"}};
    let lv=l>=3?'high':(l>=2?'med':'low');
    return tv?{text:msgs[lv].te,lang:'te-IN'}:{text:msgs[lv].en,lang:'en-US'};
}

function findBestVoice(){if(!voices.length)voices=window.speechSynthesis.getVoices();const c=[v=>v.lang==='te-IN',v=>v.lang.startsWith('te'),v=>v.lang==='hi-IN',v=>v.lang==='en-IN',v=>v.lang==='en-US',v=>v.lang.startsWith('en'),v=>true];for(const f of c){const v=voices.find(f);if(v)return v;}return null;}
function speakEnglishFallback(l){const u=new SpeechSynthesisUtterance(l>=3?"Danger! Stop! "+l+" losses!":"Discipline! Don't rush!");u.lang='en-US';u.rate=1.85;u.volume=1;const v=voices.find(v=>v.lang.startsWith('en'));if(v)u.voice=v;try{window.speechSynthesis.speak(u);}catch(e){}}
function replayTeluguVoice(){window.speechSynthesis.cancel();setTimeout(()=>speakTeluguWarning(currentLossCount||1),100);}
function toggleVoiceAlerts(){voiceEnabled=document.getElementById('voice-enabled').checked;localStorage.setItem('voice_enabled',voiceEnabled);if(voiceEnabled)testVoice();}
function testVoice(){if(!('speechSynthesis' in window)){alert('Voice not supported');return;}window.speechSynthesis.cancel();voices=window.speechSynthesis.getVoices();const u=new SpeechSynthesisUtterance('Voice alerts enabled.');u.rate=1.85;u.volume=1;u.lang='en-US';if(voices.length>0){const v=voices.find(v=>v.lang.startsWith('en'))||voices[0];u.voice=v;}u.onerror=e=>alert('Voice error: '+e.error);setTimeout(()=>{try{window.speechSynthesis.speak(u);}catch(e){alert('Failed');}},100);}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp(){
    const vp=localStorage.getItem('voice_enabled');
    if(vp!==null)voiceEnabled=vp==='true';
    loadFromLocalStorage();
    // Always initialize UI first
    initializeAppUI();
    // Only show welcome for brand new users
    if(!trades.length&&!transactions.length&&!localStorage.getItem('binary_settings')){
        document.getElementById('welcome-modal').classList.add('active');
    }
}
function initializeAppUI(){
    const vc=document.getElementById('voice-enabled');if(vc)vc.checked=voiceEnabled;
    const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
    document.getElementById('trade-datetime').value=now.toISOString().slice(0,16);
    document.getElementById('transaction-date').valueAsDate=new Date();
    document.getElementById('diary-date').valueAsDate=new Date();
    document.getElementById('daily-limit').value=settings.dailyLimit;
    document.getElementById('risk-percentage').value=settings.riskPercentage;
    document.getElementById('daily-loss-limit-pct').value=settings.dailyLossLimitPct||6;
    document.getElementById('cooldown-minutes').value=settings.cooldownMinutes||5;
    document.getElementById('goal-avg-payout').value=goals.avgPayout||87;

    document.getElementById('trade-form').addEventListener('submit',handleTradeSubmit);
    document.getElementById('settings-form').addEventListener('submit',handleSettingsSubmit);
    document.getElementById('transaction-form').addEventListener('submit',handleTransactionSubmit);
    document.getElementById('goals-form').addEventListener('submit',handleGoalsSubmit);
    document.getElementById('diary-form').addEventListener('submit',handleDiarySubmit);
    document.getElementById('rules-form').addEventListener('submit',handleRulesSubmit);
    document.getElementById('schedule-form').addEventListener('submit',handleScheduleSubmit);
    document.getElementById('screenshot').addEventListener('change',handleScreenshotPreview);
    document.getElementById('trade-amount').addEventListener('input',updateResultAmount);
    document.getElementById('payout-percentage').addEventListener('input',updateResultAmount);

    populateAssetFilter();
    renderRulesEditor();
    renderScheduleEditor();
    renderWinTargetSelector();
    updateAutoCalculatedAmount();
    autoCalculateGoals();
    updateAll();
    updateLastSavedTime();
    applyScreenFit();
    checkScheduleOnLoad();
    checkDailyLossLimit();
    updateProtectionBar();
}

function applyScreenFit(){
    const s=document.createElement('style');s.id='screen-fit';
    s.textContent=`html,body{width:100%;height:100%;overflow-x:hidden}img{max-width:100%}canvas{max-width:100%!important}`;
    const ex=document.getElementById('screen-fit');if(ex)ex.remove();
    document.head.appendChild(s);
}

function startFresh(){document.getElementById('welcome-modal').classList.remove('active');initializeAppUI();}
function triggerRestoreBackup(){document.getElementById('restore-file-input').click();}

function restoreBackup(e){
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=function(ev){
        try{
            const d=JSON.parse(ev.target.result);
            if(d.version&&d.trades!==undefined){
                trades=d.trades||[];transactions=d.transactions||[];
                settings=d.settings||{dailyLimit:10,riskPercentage:2,defaultAmount:10,dailyLossLimitPct:6,cooldownMinutes:5};
                goals=d.goals||{dailyWins:4,avgPayout:87};
                tradingRules=d.tradingRules||tradingRules;
                diaryEntries=d.diaryEntries||[];
                weeklyReviews=d.weeklyReviews||[];
                tradingSchedule=d.tradingSchedule||tradingSchedule;
                saveToLocalStorage();
                document.getElementById('welcome-modal').classList.remove('active');
                initializeAppUI();
                document.getElementById('restore-message').innerHTML=`✅ Restored! ${trades.length} trades`;
                document.getElementById('restore-success-modal').classList.add('active');
            }else alert('❌ Invalid file.');
        }catch(err){alert('❌ Error reading file.');}
    };
    r.readAsText(f);e.target.value='';
}

// ===== LOCAL STORAGE =====
function loadFromLocalStorage(){
    try{
        const load=(k)=>{const v=localStorage.getItem(k);return v?JSON.parse(v):null;};
        trades=load('binary_trades')||[];transactions=load('binary_transactions')||[];
        settings=load('binary_settings')||{dailyLimit:10,riskPercentage:2,defaultAmount:10,dailyLossLimitPct:6,cooldownMinutes:5};
        goals=load('binary_goals')||{dailyWins:4,avgPayout:87};
        tradingRules=load('binary_rules')||tradingRules;
        diaryEntries=load('binary_diary')||[];
        weeklyReviews=load('binary_weekly_reviews')||[];
        tradingSchedule=load('binary_schedule')||tradingSchedule;
    }catch(e){console.error('Load error:',e);}
}

function saveToLocalStorage(){
    try{
        localStorage.setItem('binary_trades',JSON.stringify(trades));
        localStorage.setItem('binary_transactions',JSON.stringify(transactions));
        localStorage.setItem('binary_settings',JSON.stringify(settings));
        localStorage.setItem('binary_goals',JSON.stringify(goals));
        localStorage.setItem('binary_rules',JSON.stringify(tradingRules));
        localStorage.setItem('binary_diary',JSON.stringify(diaryEntries));
        localStorage.setItem('binary_weekly_reviews',JSON.stringify(weeklyReviews));
        localStorage.setItem('binary_schedule',JSON.stringify(tradingSchedule));
        updateLastSavedTime();
    }catch(e){console.error('Save error:',e);}
}

function updateLastSavedTime(){const el=document.getElementById('last-saved');if(el)el.innerHTML=`<span>💾 ${new Date().toLocaleTimeString()}</span>`;}

// ===== BACKUP =====
function downloadBackup(){
    const d={version:4,exportDate:new Date().toISOString(),appName:'BinaryJournal Pro Elite',trades,transactions,settings,goals,tradingRules,diaryEntries,weeklyReviews,tradingSchedule};
    const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=u;a.download=`binary_journal_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
    document.getElementById('backup-success-modal').classList.add('active');
}

function triggerUploadBackup(){document.getElementById('backup-file-input').click();}

function uploadBackup(e){
    const f=e.target.files[0];if(!f)return;
    if((trades.length>0||transactions.length>0)&&!confirm('⚠️ Replace all data?')){e.target.value='';return;}
    const r=new FileReader();
    r.onload=function(ev){
        try{
            const d=JSON.parse(ev.target.result);
            if(d.version&&d.trades!==undefined){
                trades=d.trades||[];transactions=d.transactions||[];
                settings=d.settings||{dailyLimit:10,riskPercentage:2,defaultAmount:10,dailyLossLimitPct:6,cooldownMinutes:5};
                goals=d.goals||{dailyWins:4,avgPayout:87};
                tradingRules=d.tradingRules||tradingRules;
                diaryEntries=d.diaryEntries||[];
                weeklyReviews=d.weeklyReviews||[];
                tradingSchedule=d.tradingSchedule||tradingSchedule;
                saveToLocalStorage();
                document.getElementById('daily-limit').value=settings.dailyLimit;
                document.getElementById('risk-percentage').value=settings.riskPercentage;
                renderRulesEditor();renderScheduleEditor();renderWinTargetSelector();
                updateAutoCalculatedAmount();autoCalculateGoals();updateAll();populateAssetFilter();
                document.getElementById('restore-message').innerHTML=`✅ Restored ${trades.length} trades`;
                document.getElementById('restore-success-modal').classList.add('active');
            }else alert('❌ Invalid file.');
        }catch(err){alert('❌ Error.');}
    };
    r.readAsText(f);e.target.value='';
}

function closeBackupSuccessModal(){document.getElementById('backup-success-modal').classList.remove('active');}
function closeRestoreSuccessModal(){document.getElementById('restore-success-modal').classList.remove('active');}

// ===== AUTO CALCULATE AMOUNT =====
function updateAutoCalculatedAmount(){
    const bal=calculateCurrentBalance(),rp=parseFloat(document.getElementById('risk-percentage').value)||2,calc=(bal*rp)/100;
    const da=document.getElementById('default-amount');if(da)da.value=calc.toFixed(2);
    settings.defaultAmount=parseFloat(calc.toFixed(2));
    const f=document.getElementById('calc-formula');
    if(f)f.innerHTML=`<span class="formula-icon">🔢</span><span class="formula-text">$${bal.toFixed(2)} × ${rp}% = <strong>$${calc.toFixed(2)}</strong></span>`;
    const s=document.getElementById('suggested-amount');if(s)s.textContent=`$${calc.toFixed(2)}`;
    const r=document.getElementById('risk-pct-display');if(r)r.textContent=rp;
    const m=document.getElementById('max-risk-amount');if(m)m.textContent=`$${calc.toFixed(2)}`;
}

function useSuggestedAmount(){document.getElementById('trade-amount').value=((calculateCurrentBalance()*settings.riskPercentage)/100).toFixed(2);updateResultAmount();}

// ===== CORE CALCULATIONS =====
function calculateTotalDeposits(){return transactions.filter(t=>t.type==='deposit').reduce((s,t)=>s+t.amount,0);}
function calculateTotalWithdrawals(){return transactions.filter(t=>t.type==='withdrawal').reduce((s,t)=>s+t.amount,0);}
function calculateTotalPL(){return trades.reduce((s,t)=>s+t.pl,0);}
function calculateCurrentBalance(){return calculateTotalDeposits()-calculateTotalWithdrawals()+calculateTotalPL();}
function calculateInitialCapital(){return calculateTotalDeposits()-calculateTotalWithdrawals();}

function getTodayTrades(){
    const now=new Date();
    const ts=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    return trades.filter(t=>{const d=new Date(t.date);return(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))===ts;});
}

function getDateTrades(date){
    let td;if(typeof date==='string'){const p=date.split('T')[0].split('-').map(Number);td=new Date(p[0],p[1]-1,p[2]);}else td=new Date(date);
    const ts=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
    return trades.filter(t=>{const d=new Date(t.date);return(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))===ts;});
}

function getWeekPL(){const now=new Date(),ws=new Date(now);ws.setDate(now.getDate()-now.getDay());ws.setHours(0,0,0,0);return trades.filter(t=>new Date(t.date)>=ws).reduce((s,t)=>s+t.pl,0);}
function getMonthPL(){const now=new Date();return trades.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,t)=>s+t.pl,0);}
function getTodayPL(){return getTodayTrades().reduce((s,t)=>s+t.pl,0);}
function getTodayLosses(){return Math.abs(getTodayTrades().filter(t=>t.result==='loss').reduce((s,t)=>s+t.pl,0));}

function calculateCurrentStreak(){if(!trades.length)return{type:'none',count:0};const s=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));let c=0,ty=s[0].result;for(const t of s){if(t.result===ty)c++;else break;}return{type:ty,count:c};}
function calculateMaxStreak(rt){if(!trades.length)return 0;const s=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));let mx=0,c=0;for(const t of s){if(t.result===rt){c++;mx=Math.max(mx,c);}else c=0;}return mx;}
function getConsecutiveLosses(){const s=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));let c=0;for(const t of s){if(t.result==='loss')c++;else break;}return c;}

// ===== PROTECTION SYSTEMS =====

// 1. Daily Loss Limit
function getDailyLossLimit(){return(calculateCurrentBalance()*(settings.dailyLossLimitPct||6))/100;}
function isDailyLossLimitReached(){return getTodayLosses()>=getDailyLossLimit();}

function checkDailyLossLimit(){
    const limit=getDailyLossLimit();
    const used=getTodayLosses();
    const pct=limit>0?Math.min((used/limit)*100,100):0;
    const fill=document.getElementById('loss-progress-fill');
    if(fill)fill.style.width=pct+'%';
    const txt=document.getElementById('loss-display-text');
    if(txt)txt.textContent=`$${used.toFixed(2)} / $${limit.toFixed(2)}`;
    const luDisplay=document.getElementById('loss-used-display');
    if(luDisplay)luDisplay.textContent=`$${used.toFixed(2)}`;
    const banner=document.getElementById('loss-lock-banner');
    if(isDailyLossLimitReached()){
        if(banner)banner.style.display='flex';
        lockTrading('loss');
    }else{
        if(banner)banner.style.display='none';
    }
}

function showDailyLossLimitModal(){
    const det=document.getElementById('loss-limit-details');
    if(det){
        det.innerHTML=`<strong>Today's Losses:</strong> $${getTodayLosses().toFixed(2)}<br><strong>Daily Limit:</strong> $${getDailyLossLimit().toFixed(2)} (${settings.dailyLossLimitPct}%)<br><strong>Balance:</strong> $${calculateCurrentBalance().toFixed(2)}`;
    }
    document.getElementById('loss-limit-modal').classList.add('active');
    speakTeluguWarning(5);
}

function closeLossLimitModal(){document.getElementById('loss-limit-modal').classList.remove('active');}

// 2. Pre-Session Mood Check
function startTradingSession(){
    if(checkIfRestDay()){return;}
    document.getElementById('mood-check-modal').classList.add('active');
}

function selectSessionMood(mood){
    sessionMood=mood;
    document.querySelectorAll('.pre-session-mood-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.pre-session-mood-btn[data-mood="${mood}"]`).classList.add('active');
    const warn=document.getElementById('mood-warning');
    const warnText=document.getElementById('mood-warning-text');
    const confirmBtn=document.getElementById('mood-confirm-btn');
    if(mood==='angry'){
        warn.style.display='block';
        warnText.innerHTML='🚨 You are ANGRY! Trading is BLOCKED. <br>Come back when you feel calm. <br>😡 కోపంగా ఉన్నప్పుడు ట్రేడ్ చేయకండి!';
        confirmBtn.disabled=true;
        confirmBtn.textContent='🚫 Trading Blocked (Angry)';
    }else if(mood==='stressed'){
        warn.style.display='block';
        warnText.innerHTML='⚠️ You are STRESSED. Trading not recommended. <br>😟 ఒత్తిడిలో ట్రేడ్ చేయడం మంచిది కాదు!';
        confirmBtn.disabled=false;
        confirmBtn.textContent='⚠️ Trade Carefully (At Your Risk)';
    }else{
        warn.style.display='none';
        confirmBtn.disabled=false;
        confirmBtn.textContent='✅ Start Trading Session';
    }
}

function confirmSessionMood(){
    if(sessionMood==='angry')return;
    sessionStarted=true;
    document.getElementById('mood-check-modal').classList.remove('active');
    updateSessionStatus();
    updateProtectionBar();
    alert(`✅ Session started! Mood: ${sessionMood}\n\nStay disciplined! క్రమశిక్షణతో ఉండండి!`);
}

function updateSessionStatus(){
    const bar=document.getElementById('session-status-bar');
    const icon=document.getElementById('session-status-icon');
    const text=document.getElementById('session-status-text');
    const btn=document.getElementById('session-start-btn');
    if(sessionStarted){
        bar.className='session-status-bar active';
        const moodEmojis={great:'😊',good:'🙂',neutral:'😐',stressed:'😟',angry:'😡'};
        icon.textContent=moodEmojis[sessionMood]||'✅';
        text.textContent=`Session active (${sessionMood})`;
        if(btn)btn.style.display='none';
    }else{
        bar.className='session-status-bar';
        icon.textContent='⚪';text.textContent='No session started';
        if(btn)btn.style.display='flex';
    }
}

// 3. Cooldown Timer
function startCooldown(){
    const mins=settings.cooldownMinutes||5;
    if(mins<=0)return;
    cooldownActive=true;
    cooldownEndTime=Date.now()+(mins*60*1000);
    document.getElementById('cooldown-modal').classList.add('active');
    const banner=document.getElementById('cooldown-banner');
    if(banner)banner.style.display='flex';
    updateCooldownDisplay();
    cooldownTimer=setInterval(()=>{
        const remaining=cooldownEndTime-Date.now();
        if(remaining<=0){clearInterval(cooldownTimer);cooldownActive=false;
            document.getElementById('cooldown-modal').classList.remove('active');
            if(banner)banner.style.display='none';
            updateProtectionBar();
        }else{updateCooldownDisplay();}
    },1000);
}

function updateCooldownDisplay(){
    const remaining=Math.max(0,cooldownEndTime-Date.now());
    const mins=Math.floor(remaining/60000);
    const secs=Math.floor((remaining%60000)/1000);
    const display=`${mins}:${String(secs).padStart(2,'0')}`;
    const el=document.getElementById('cooldown-timer-display');if(el)el.textContent=display;
    const bannerTime=document.getElementById('cooldown-banner-time');if(bannerTime)bannerTime.textContent=display;
    const total=(settings.cooldownMinutes||5)*60*1000;
    const pct=((total-remaining)/total)*100;
    const fill=document.getElementById('cooldown-progress-fill');if(fill)fill.style.width=(100-pct)+'%';
}

function skipCooldown(){
    if(confirm('⚠️ Skipping cooldown increases revenge trading risk. Continue?')){
        clearInterval(cooldownTimer);cooldownActive=false;
        document.getElementById('cooldown-modal').classList.remove('active');
        const banner=document.getElementById('cooldown-banner');if(banner)banner.style.display='none';
        updateProtectionBar();
    }
}

// 4. Profit Protection
function checkProfitProtection(){
    const todayPL=getTodayPL();
    const dailyTarget=goals.calculatedDaily||0;
    if(dailyTarget>0&&todayPL>=dailyTarget&&!profitLocked){
        const det=document.getElementById('profit-protection-details');
        if(det)det.innerHTML=`<strong>Today's P&L:</strong> +$${todayPL.toFixed(2)}<br><strong>Daily Target:</strong> $${dailyTarget.toFixed(2)}<br><strong>🎉 You exceeded by: $${(todayPL-dailyTarget).toFixed(2)}</strong>`;
        document.getElementById('profit-protection-modal').classList.add('active');
    }
}

function lockProfits(){profitLocked=true;document.getElementById('profit-protection-modal').classList.remove('active');lockTrading('profit');alert('🔒 Profits locked! Trading blocked for today. Great job!');}
function continueTradingAfterTarget(){document.getElementById('profit-protection-modal').classList.remove('active');}

// 5. Trading Schedule
function checkIfRestDay(){
    const today=new Date().getDay();
    const schedule=tradingSchedule[today];
    if(!schedule||!schedule.active){
        document.getElementById('schedule-blocked-modal').classList.add('active');
        return true;
    }
    return false;
}

function checkScheduleOnLoad(){
    const today=new Date().getDay();
    const schedule=tradingSchedule[today];
    updateScheduleDisplay();
    if(!schedule||!schedule.active){
        updateSessionStatus();
    }
}

function closeScheduleBlockedModal(){document.getElementById('schedule-blocked-modal').classList.remove('active');}
function overrideSchedule(){document.getElementById('schedule-blocked-modal').classList.remove('active');document.getElementById('mood-check-modal').classList.add('active');}

// 6. Confidence Meter
function selectConfidence(val){
    tradeConfidence=val;
    document.querySelectorAll('.conf-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.conf-btn[data-conf="${val}"]`).classList.add('active');
    const display=document.getElementById('confidence-display');
    if(display)display.textContent=val+'/10';
}

// 7. Post Trade Review
function showPostTradeReview(tradeId){
    pendingPostTradeId=tradeId;
    postTradeData={};
    document.querySelectorAll('.post-btn').forEach(b=>b.classList.remove('selected'));
    document.getElementById('post-trade-save-btn').disabled=true;
    document.getElementById('post-trade-modal').classList.add('active');
}

function selectPostTrade(key,value,btn){
    postTradeData[key]=value;
    const parent=btn.parentElement;
    parent.querySelectorAll('.post-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    if(Object.keys(postTradeData).length>=3){
        document.getElementById('post-trade-save-btn').disabled=false;
    }
}

function savePostTradeReview(){
    if(pendingPostTradeId){
        const trade=trades.find(t=>t.id===pendingPostTradeId);
        if(trade){
            trade.postReview=postTradeData;
            saveToLocalStorage();
        }
    }
    document.getElementById('post-trade-modal').classList.remove('active');
    pendingPostTradeId=null;postTradeData={};
}

function skipPostTradeReview(){document.getElementById('post-trade-modal').classList.remove('active');pendingPostTradeId=null;}

// Lock/Unlock Trading
function lockTrading(reason){
    const btn=document.getElementById('add-trade-submit-btn');
    if(btn){btn.disabled=true;btn.textContent=reason==='loss'?'🛑 LOCKED - Daily Loss Limit':'🔒 LOCKED - Profits Protected';}
}

function unlockTrading(){
    const btn=document.getElementById('add-trade-submit-btn');
    if(btn){btn.disabled=false;btn.innerHTML='<span>✅</span> Add Trade';}
}

// Protection Bar
function updateProtectionBar(){
    const moodEl=document.getElementById('prot-mood');
    const lossEl=document.getElementById('prot-loss');
    const cdEl=document.getElementById('prot-cooldown');
    const profEl=document.getElementById('prot-profit');
    const schedEl=document.getElementById('prot-schedule');
    if(!moodEl)return;

    const moodEmojis={great:'😊',good:'🙂',neutral:'😐',stressed:'😟',angry:'😡'};
    moodEl.innerHTML=`<span>🧘</span><span>Mood: ${sessionMood?moodEmojis[sessionMood]+' '+sessionMood:'--'}</span>`;
    moodEl.className='protection-item '+(sessionMood==='great'||sessionMood==='good'?'ok':(sessionMood==='stressed'?'warning':(sessionMood==='angry'?'danger':'')));

    const lossUsed=getTodayLosses(),lossLimit=getDailyLossLimit();
    lossEl.innerHTML=`<span>🛑</span><span>Loss: $${lossUsed.toFixed(0)}/$${lossLimit.toFixed(0)}</span>`;
    lossEl.className='protection-item '+(lossUsed>=lossLimit?'danger':(lossUsed>=lossLimit*0.7?'warning':'ok'));

    cdEl.innerHTML=`<span>⏱️</span><span>Cooldown: ${cooldownActive?'Active':'Ready'}</span>`;
    cdEl.className='protection-item '+(cooldownActive?'warning':'ok');

    profEl.innerHTML=`<span>🔒</span><span>Profit Lock: ${profitLocked?'ON':'Off'}</span>`;
    profEl.className='protection-item '+(profitLocked?'warning':'ok');

    const today=new Date().getDay();
    const sched=tradingSchedule[today];
    schedEl.innerHTML=`<span>🗓️</span><span>${sched&&sched.active?dayNamesShort[today]+' ✅':'Rest Day ❌'}</span>`;
    schedEl.className='protection-item '+(sched&&sched.active?'ok':'warning');
}
// ===== UPDATE ALL =====
function updateAll(){
    try{updateDashboard();}catch(e){console.error('Dashboard:',e);}
    try{updateChart();}catch(e){console.error('Chart:',e);}
    try{updateMoneyManagement();}catch(e){console.error('MM:',e);}
    try{updateBinaryAnalytics();}catch(e){console.error('Analytics:',e);}
    try{renderCalendar();}catch(e){console.error('Calendar:',e);}
    try{renderAllTrades();}catch(e){console.error('Trades:',e);}
    try{updateSetupsAnalysis();}catch(e){console.error('Setups:',e);}
    try{updateSidebarProgress();}catch(e){console.error('Sidebar:',e);}
    try{updateStreakDisplay();}catch(e){console.error('Streak:',e);}
    try{updateAutoCalculatedAmount();}catch(e){console.error('Amount:',e);}
    try{updateGoalsProgress();}catch(e){console.error('Goals:',e);}
    try{renderDiaryHistory();}catch(e){console.error('Diary:',e);}
    try{renderRulesDisplay();}catch(e){console.error('Rules:',e);}
    try{updateRulesCompliance();}catch(e){console.error('Compliance:',e);}
    try{updateAchievements();}catch(e){console.error('Achievements:',e);}
    try{updateHeatmap();}catch(e){console.error('Heatmap:',e);}
    try{updateRulesTicker();}catch(e){console.error('Ticker:',e);}
    try{updateWinRateTrendChart();}catch(e){console.error('WR Chart:',e);}
    try{updateEquityCurveChart();}catch(e){console.error('EQ Chart:',e);}
    try{updateRiskRewardCard();}catch(e){console.error('RR Card:',e);}
    try{updateDashboardGoals();}catch(e){console.error('DashGoals:',e);}
    try{updateLatestAchievements();}catch(e){console.error('Achievements:',e);}
    try{autoCalculateGoals();}catch(e){console.error('CalcGoals:',e);}
    try{checkDailyLossLimit();}catch(e){console.error('LossLimit:',e);}
    try{updateProtectionBar();}catch(e){console.error('Protection:',e);}
    try{renderWeeklyReviews();}catch(e){console.error('Weekly:',e);}
    try{updateScheduleDisplay();}catch(e){console.error('Schedule:',e);}
}
// ===== NAVIGATION =====
function showSection(sectionId){
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    
    const section = document.getElementById(sectionId);
    if(!section){console.error('Section not found:', sectionId);return;}
    section.classList.add('active');
    
    // Find and activate nav item safely
    const navItem = event && event.target ? event.target.closest('.nav-item') : null;
    if(navItem) navItem.classList.add('active');    if(sectionId==='add-trade'){updateDailyProgress();updateResultAmount();updateAutoCalculatedAmount();checkDailyLossLimit();}
    if(sectionId==='money-management'){updateMoneyManagement();updateAutoCalculatedAmount();}
    if(sectionId==='analytics')updateBinaryAnalytics();
    if(sectionId==='heatmap')updateHeatmap();
    if(sectionId==='goals'){renderWinTargetSelector();autoCalculateGoals();updateGoalsProgress();}
    if(sectionId==='achievements')updateAchievements();
    if(sectionId==='rules'){renderRulesEditor();renderRulesDisplay();updateRulesCompliance();}
    if(sectionId==='diary')renderDiaryHistory();
    if(sectionId==='schedule'){renderScheduleEditor();updateScheduleDisplay();}
    if(sectionId==='weekly-review')renderWeeklyReviews();
}

// ===== DASHBOARD =====
function updateDashboard(){
    const balance=calculateCurrentBalance(),ic=calculateInitialCapital(),totalPL=calculateTotalPL();
    const wins=trades.filter(t=>t.result==='win'),losses=trades.filter(t=>t.result==='loss');
    const winRate=trades.length?((wins.length/trades.length)*100).toFixed(1):0;
    const roi=ic>0?((totalPL/ic)*100).toFixed(2):0;
    const dailyPL={};
    trades.forEach(t=>{const d=new Date(t.date);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(!dailyPL[k])dailyPL[k]=0;dailyPL[k]+=t.pl;});
    const bestDay=Object.values(dailyPL).length?Math.max(...Object.values(dailyPL)):0;
    const today=new Date();
    const tk=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    const todayPL=dailyPL[tk]||0;
    const cs=calculateCurrentStreak();
    const assetStats=getAssetPerformance(),expiryStats=getExpiryPerformance();
    let bestAsset='-',baw=0;
    for(const[a,s]of Object.entries(assetStats)){if(s.winRate>baw&&s.total>=3){baw=s.winRate;bestAsset=a;}}
    let bestExpiry='-',bew=0;
    for(const[e,s]of Object.entries(expiryStats)){if(s.winRate>bew&&s.total>=3){bew=s.winRate;bestExpiry=expiryLabels[e]||e;}}
    
    // Safe element updater
    const sel=(id,v,style)=>{
        const e=document.getElementById(id);
        if(!e)return;
        e.textContent=v;
        if(style)Object.assign(e.style,style);
    };
    
    sel('dashboard-balance',`$${balance.toFixed(2)}`);
    sel('balance-change-text',`${roi>=0?'+':''}${roi}%`);
    sel('today-pl',`${todayPL>=0?'+':''}$${todayPL.toFixed(2)}`,{color:todayPL>=0?'#22c55e':'#ef4444'});
    sel('dashboard-winrate',`${winRate}%`,{color:parseFloat(winRate)>=55?'#22c55e':'#ef4444'});
    sel('total-wins',wins.length);
    sel('total-losses',losses.length);
    sel('best-asset',bestAsset);
    sel('best-expiry',bestExpiry);
    sel('total-pl',`${totalPL>=0?'+':''}$${totalPL.toFixed(2)}`);
    sel('total-trades',trades.length);
    sel('win-rate',`${winRate}%`);
    sel('best-day',`$${bestDay.toFixed(2)}`);
    sel('roi',`${roi}%`);
    sel('current-streak-dash',cs.count);
    sel('add-trade-balance',`$${balance.toFixed(2)}`);
    updateDailyProgress();
}
function updateDailyProgress(){
    const tt=getTodayTrades();
    const el=document.getElementById('daily-progress');
    if(el)el.textContent=`${tt.length}/${settings.dailyLimit}`;
}

function updateSidebarProgress(){
    const tt=getTodayTrades();
    const pct=(tt.length/settings.dailyLimit)*100;
    const sp=document.getElementById('sidebar-progress');if(sp)sp.style.width=`${Math.min(pct,100)}%`;
    const st=document.getElementById('sidebar-progress-text');if(st)st.textContent=`${tt.length}/${settings.dailyLimit} trades`;
}

function updateStreakDisplay(){
    const cs=calculateCurrentStreak();
    const el=document.getElementById('sidebar-streak-icons');if(!el)return;
    if(!cs.count){el.textContent='-';return;}
    const icon=cs.type==='win'?'🟢':'🔴';
    el.textContent=Array(Math.min(cs.count,10)).fill(icon).join('')+(cs.count>10?` +${cs.count-10}`:'');
}

// ===== DASHBOARD EXTRAS =====
function updateDashboardGoals(){
    const c=document.getElementById('dashboard-goals');if(!c)return;
    const todayPL=getTodayPL(),todayWins=getTodayTrades().filter(t=>t.result==='win').length,weekPL=getWeekPL();
    const dt=goals.calculatedDaily||0,wt=goals.calculatedWeekly||0;
    const dp=dt?Math.min((Math.max(0,todayPL)/Math.abs(dt))*100,100):0;
    const dw=Math.min((todayWins/(goals.dailyWins||1))*100,100);
    const wp=wt?Math.min((Math.max(0,weekPL)/Math.abs(wt))*100,100):0;
    c.innerHTML=`
        <div class="goal-mini-card"><div class="goal-mini-label">Daily Profit</div><div class="goal-mini-bar"><div class="goal-mini-fill" style="width:${Math.max(0,dp)}%;background:${todayPL>=dt&&dt>0?'#22c55e':'linear-gradient(90deg,#6366f1,#8b5cf6)'}"></div></div><div class="goal-mini-text" style="color:${todayPL>=0?'#22c55e':'#ef4444'}">$${todayPL.toFixed(2)} / $${dt.toFixed(2)}</div></div>
        <div class="goal-mini-card"><div class="goal-mini-label">Daily Wins</div><div class="goal-mini-bar"><div class="goal-mini-fill" style="width:${Math.max(0,dw)}%;background:${todayWins>=goals.dailyWins?'#22c55e':'linear-gradient(90deg,#6366f1,#8b5cf6)'}"></div></div><div class="goal-mini-text">${todayWins}/${goals.dailyWins} wins</div></div>
        <div class="goal-mini-card"><div class="goal-mini-label">Weekly Profit</div><div class="goal-mini-bar"><div class="goal-mini-fill" style="width:${Math.max(0,wp)}%;background:${weekPL>=wt&&wt>0?'#22c55e':'linear-gradient(90deg,#6366f1,#8b5cf6)'}"></div></div><div class="goal-mini-text" style="color:${weekPL>=0?'#22c55e':'#ef4444'}">$${weekPL.toFixed(2)} / $${wt.toFixed(2)}</div></div>
    `;
}

function updateRulesTicker(){const el=document.getElementById('ticker-content');if(el)el.textContent=tradingRules.map((r,i)=>`📜 Rule ${i+1}: ${r}`).join('     |     ');}

function updateLatestAchievements(){
    const c=document.getElementById('latest-achievements');if(!c)return;
    const unlocked=achievementDefs.filter(a=>a.check());
    if(!unlocked.length){c.innerHTML=`<h3>🏆 Latest Achievements</h3><p style="color:var(--text-muted);padding:10px;">Complete trades to unlock!</p>`;return;}
    c.innerHTML=`<h3>🏆 Latest Achievements</h3><div class="latest-achievement-list">${unlocked.slice(-5).reverse().map(a=>`<div class="latest-achievement-badge"><span>${a.icon}</span><span>${a.name}</span></div>`).join('')}</div>`;
}

function updateRiskRewardCard(){
    const c=document.getElementById('risk-reward-card');if(!c)return;
    const w=trades.filter(t=>t.result==='win'),l=trades.filter(t=>t.result==='loss');
    const aw=w.length?w.reduce((s,t)=>s+t.pl,0)/w.length:0;
    const al=l.length?Math.abs(l.reduce((s,t)=>s+t.pl,0)/l.length):0;
    const rr=al>0?(aw/al).toFixed(2):'0.00';
    const be=aw+al>0?((al/(aw+al))*100).toFixed(1):'0.0';
    const wr=trades.length?(w.length/trades.length*100).toFixed(1):'0.0';
    const edge=(parseFloat(wr)-parseFloat(be)).toFixed(1);
    const ev=trades.length?((parseFloat(wr)/100*aw)-((100-parseFloat(wr))/100*al)).toFixed(2):'0.00';
    c.innerHTML=`<h3 style="margin-bottom:14px;font-size:15px;">📊 Risk-Reward Analysis</h3><div class="rr-grid">
        <div class="rr-item"><span class="rr-label">Avg Win</span><span class="rr-value rr-positive">$${aw.toFixed(2)}</span></div>
        <div class="rr-item"><span class="rr-label">Avg Loss</span><span class="rr-value rr-negative">$${al.toFixed(2)}</span></div>
        <div class="rr-item"><span class="rr-label">Risk:Reward</span><span class="rr-value rr-neutral">1:${rr}</span></div>
        <div class="rr-item"><span class="rr-label">Breakeven WR</span><span class="rr-value rr-neutral">${be}%</span></div>
        <div class="rr-item"><span class="rr-label">Your Edge</span><span class="rr-value ${parseFloat(edge)>=0?'rr-positive':'rr-negative'}">${edge}%</span><div class="rr-description">${parseFloat(edge)>=0?'✅ Profitable':'❌ No edge yet'}</div></div>
        <div class="rr-item"><span class="rr-label">Expected Value</span><span class="rr-value ${parseFloat(ev)>=0?'rr-positive':'rr-negative'}">$${ev}/trade</span></div>
    </div>`;
}

// ===== CHARTS =====
function updateWinRateTrendChart(){
    const ctx=document.getElementById('winRateTrendChart');if(!ctx)return;
    const labels=[],data=[];
    for(let i=11;i>=0;i--){
        const we=new Date();we.setDate(we.getDate()-(i*7));const ws=new Date(we);ws.setDate(ws.getDate()-6);
        labels.push(`W${12-i}`);
        const wt=trades.filter(t=>{const d=new Date(t.date);return d>=ws&&d<=we;});
        data.push(wt.length>0?parseFloat((wt.filter(t=>t.result==='win').length/wt.length*100).toFixed(1)):null);
    }
    if(winRateTrendChart)winRateTrendChart.destroy();
    winRateTrendChart=new Chart(ctx.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Win Rate %',data,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:4,pointBackgroundColor:'#6366f1',spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8',callback:v=>v+'%'}},x:{grid:{display:false},ticks:{color:'#94a3b8'}}}}});
}

function updateEquityCurveChart(){
    const ctx=document.getElementById('equityCurveChart');if(!ctx)return;
    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const labels=['Start'],eq=[0],dd=[0];let bal=0,peak=0;
    sorted.forEach(t=>{bal+=t.pl;if(bal>peak)peak=bal;labels.push(new Date(t.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}));eq.push(parseFloat(bal.toFixed(2)));dd.push(parseFloat((peak-bal>0?-(peak-bal):0).toFixed(2)));});
    if(equityCurveChart)equityCurveChart.destroy();
    equityCurveChart=new Chart(ctx.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Equity',data:eq,borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,0.1)',fill:true,tension:0.3,borderWidth:2},{label:'Drawdown',data:dd,borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',fill:true,tension:0.3,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8'}},x:{grid:{display:false},ticks:{color:'#94a3b8',maxTicksLimit:10}}}}});
}

function updateChartView(view){currentChartView=view;document.querySelectorAll('.chart-tab').forEach(t=>t.classList.remove('active'));event.target.classList.add('active');updateChart();}

function updateChart(){
    const ctx=document.getElementById('plChart');if(!ctx)return;
    let labels=[],data=[];
    if(currentChartView==='daily'){for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');labels.push(ds.substring(5));data.push(getDateTrades(ds).reduce((s,t)=>s+t.pl,0));}}
    else if(currentChartView==='weekly'){for(let i=11;i>=0;i--){const we=new Date();we.setDate(we.getDate()-(i*7));const ws=new Date(we);ws.setDate(ws.getDate()-6);labels.push(`W${12-i}`);data.push(trades.filter(t=>{const d=new Date(t.date);return d>=ws&&d<=we;}).reduce((s,t)=>s+t.pl,0));}}
    else{for(let i=11;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);labels.push(d.toLocaleDateString('en-US',{month:'short'}));data.push(trades.filter(t=>{const td=new Date(t.date);return td.getMonth()===d.getMonth()&&td.getFullYear()===d.getFullYear();}).reduce((s,t)=>s+t.pl,0));}}
    if(plChart)plChart.destroy();
    plChart=new Chart(ctx.getContext('2d'),{type:'bar',data:{labels,datasets:[{label:'P&L',data,backgroundColor:data.map(v=>v>=0?'rgba(34,197,94,0.8)':'rgba(239,68,68,0.8)'),borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8'}},x:{grid:{display:false},ticks:{color:'#94a3b8'}}}}});
}

// ===== ANALYTICS =====
function getExpiryPerformance(){const s={};trades.forEach(t=>{if(!s[t.expiry])s[t.expiry]={total:0,wins:0,losses:0,pl:0};s[t.expiry].total++;if(t.result==='win')s[t.expiry].wins++;else s[t.expiry].losses++;s[t.expiry].pl+=t.pl;});for(const e in s)s[e].winRate=(s[e].wins/s[e].total*100).toFixed(1);return s;}
function getAssetPerformance(){const s={};trades.forEach(t=>{if(!s[t.asset])s[t.asset]={total:0,wins:0,losses:0,pl:0};s[t.asset].total++;if(t.result==='win')s[t.asset].wins++;else s[t.asset].losses++;s[t.asset].pl+=t.pl;});for(const a in s)s[a].winRate=(s[a].wins/s[a].total*100).toFixed(1);return s;}

function getSessionPerformance(){
    const sessions={'Asian Morning (05:30-12:00 IST)':{total:0,wins:0,pl:0},'London Afternoon (12:00-19:30 IST)':{total:0,wins:0,pl:0},'New York Evening (19:30-02:30 IST)':{total:0,wins:0,pl:0},'Late Night (02:30-05:30 IST)':{total:0,wins:0,pl:0}};
    trades.forEach(t=>{const h=new Date(t.date).getHours(),m=new Date(t.date).getMinutes(),tv=h+(m/60);let s;if(tv>=5.5&&tv<12)s='Asian Morning (05:30-12:00 IST)';else if(tv>=12&&tv<19.5)s='London Afternoon (12:00-19:30 IST)';else if(tv>=19.5||tv<2.5)s='New York Evening (19:30-02:30 IST)';else s='Late Night (02:30-05:30 IST)';sessions[s].total++;if(t.result==='win')sessions[s].wins++;sessions[s].pl+=t.pl;});
    for(const s in sessions)sessions[s].winRate=sessions[s].total>0?(sessions[s].wins/sessions[s].total*100).toFixed(1):'0.0';
    return sessions;
}

function getOptionTypePerformance(){const s={};trades.forEach(t=>{if(!s[t.optionType])s[t.optionType]={total:0,wins:0,losses:0,pl:0};s[t.optionType].total++;if(t.result==='win')s[t.optionType].wins++;else s[t.optionType].losses++;s[t.optionType].pl+=t.pl;});for(const ty in s)s[ty].winRate=(s[ty].wins/s[ty].total*100).toFixed(1);return s;}

function updateBinaryAnalytics(){
    // Expiry
    const es=getExpiryPerformance(),ec=document.getElementById('expiry-analysis');
    if(!Object.keys(es).length){ec.innerHTML='<div class="empty-state"><div class="empty-state-icon">⏰</div><p class="empty-state-text">No data yet</p></div>';}
    else{let be=null,we=null,bw=0,ww=100;for(const[e,s]of Object.entries(es)){if(s.total>=3){if(parseFloat(s.winRate)>bw){bw=parseFloat(s.winRate);be=e;}if(parseFloat(s.winRate)<ww){ww=parseFloat(s.winRate);we=e;}}}
    ec.innerHTML=Object.entries(es).sort((a,b)=>parseFloat(b[1].winRate)-parseFloat(a[1].winRate)).map(([e,s])=>{let c=e===be?'best':(e===we&&parseFloat(s.winRate)<50?'worst':'');return`<div class="expiry-card ${c}"><div class="expiry-name">${expiryLabels[e]||e} ${e===be?'⭐':''}</div><div class="expiry-stats"><div class="expiry-stat-item"><span class="expiry-stat-label">Win Rate</span><span class="expiry-stat-value ${parseFloat(s.winRate)>=55?'positive':'negative'}">${s.winRate}%</span></div><div class="expiry-stat-item"><span class="expiry-stat-label">Trades</span><span class="expiry-stat-value">${s.total}</span></div><div class="expiry-stat-item"><span class="expiry-stat-label">Wins</span><span class="expiry-stat-value positive">${s.wins}</span></div><div class="expiry-stat-item"><span class="expiry-stat-label">P&L</span><span class="expiry-stat-value ${s.pl>=0?'positive':'negative'}">${s.pl>=0?'+':''}$${s.pl.toFixed(2)}</span></div></div></div>`;}).join('');}
    // Asset
    const as=getAssetPerformance(),ac=document.getElementById('asset-analysis');
    if(!Object.keys(as).length){ac.innerHTML='<div class="empty-state"><div class="empty-state-icon">🌍</div><p class="empty-state-text">No data yet</p></div>';}
    else{let ba=null,wa=null,bw=0,ww=100;for(const[a,s]of Object.entries(as)){if(s.total>=3){if(parseFloat(s.winRate)>bw){bw=parseFloat(s.winRate);ba=a;}if(parseFloat(s.winRate)<ww){ww=parseFloat(s.winRate);wa=a;}}}
    ac.innerHTML=Object.entries(as).sort((a,b)=>parseFloat(b[1].winRate)-parseFloat(a[1].winRate)).map(([a,s])=>{let c=a===ba?'best':(a===wa&&parseFloat(s.winRate)<50?'avoid':'');return`<div class="asset-card ${c}"><div class="asset-name">${a} ${a===ba?'⭐':''} ${c==='avoid'?'⚠️':''}</div><div class="asset-stats"><div class="asset-stat-item"><span class="asset-stat-label">Win Rate</span><span class="asset-stat-value ${parseFloat(s.winRate)>=55?'positive':'negative'}">${s.winRate}%</span></div><div class="asset-stat-item"><span class="asset-stat-label">Trades</span><span class="asset-stat-value">${s.total}</span></div><div class="asset-stat-item"><span class="asset-stat-label">W/L</span><span class="asset-stat-value">${s.wins}/${s.losses}</span></div><div class="asset-stat-item"><span class="asset-stat-label">P&L</span><span class="asset-stat-value ${s.pl>=0?'positive':'negative'}">${s.pl>=0?'+':''}$${s.pl.toFixed(2)}</span></div></div></div>`;}).join('');}
    // Session
    const ss=getSessionPerformance(),sc=document.getElementById('session-analysis');
    let bs=null,bsw=0;for(const[s,d]of Object.entries(ss)){if(d.total>=3&&parseFloat(d.winRate)>bsw){bsw=parseFloat(d.winRate);bs=s;}}
    sc.innerHTML=Object.entries(ss).map(([s,d])=>`<div class="session-card ${s===bs?'best':''}"><div class="session-name">${s} ${s===bs?'⭐':''}</div><div class="session-stats"><div class="session-stat"><span class="session-stat-label">Win Rate</span><span class="session-stat-value" style="color:${parseFloat(d.winRate)>=55?'#22c55e':'#ef4444'}">${d.winRate}%</span></div><div class="session-stat"><span class="session-stat-label">Trades</span><span class="session-stat-value">${d.total}</span></div><div class="session-stat"><span class="session-stat-label">P&L</span><span class="session-stat-value" style="color:${d.pl>=0?'#22c55e':'#ef4444'}">${d.pl>=0?'+':''}$${d.pl.toFixed(2)}</span></div></div></div>`).join('');
    // Option Type
    const os=getOptionTypePerformance(),oc=document.getElementById('option-type-analysis');
    if(!Object.keys(os).length){oc.innerHTML='<div class="empty-state"><div class="empty-state-icon">📊</div><p class="empty-state-text">No data</p></div>';}
    else{const oi={'call':'📈','put':'📉'};oc.innerHTML=Object.entries(os).map(([ty,s])=>`<div class="option-type-card"><div class="option-type-icon">${oi[ty]||'📊'}</div><div class="option-type-name">${optionTypeLabels[ty]||ty}</div><div class="option-type-stats"><div class="session-stat"><span class="session-stat-label">Win Rate</span><span class="session-stat-value" style="color:${parseFloat(s.winRate)>=55?'#22c55e':'#ef4444'}">${s.winRate}%</span></div><div class="session-stat"><span class="session-stat-label">W/L</span><span class="session-stat-value">${s.wins}/${s.losses}</span></div><div class="session-stat"><span class="session-stat-label">P&L</span><span class="session-stat-value" style="color:${s.pl>=0?'#22c55e':'#ef4444'}">${s.pl>=0?'+':''}$${s.pl.toFixed(2)}</span></div></div></div>`).join('');}
    // Streaks
    const cs=calculateCurrentStreak(),mw=calculateMaxStreak('win'),ml=calculateMaxStreak('loss');
    document.getElementById('streak-analysis').innerHTML=`<div class="streak-stat-card"><div class="streak-stat-label">Current Streak</div><div class="streak-stat-value ${cs.type==='win'?'positive':cs.type==='loss'?'negative':''}">${cs.count}</div><div class="current-streak-display">${cs.count>0?(cs.type==='win'?'🟢'.repeat(Math.min(cs.count,10)):'🔴'.repeat(Math.min(cs.count,10))):'-'}</div></div><div class="streak-stat-card"><div class="streak-stat-label">Max Win Streak</div><div class="streak-stat-value positive">${mw}</div><div class="current-streak-display">🏆 Best</div></div><div class="streak-stat-card"><div class="streak-stat-label">Max Loss Streak</div><div class="streak-stat-value negative">${ml}</div><div class="current-streak-display">⚠️ Worst</div></div>`;
}

// ===== HEATMAP =====
function updateHeatmap(){
    const c=document.getElementById('heatmap-container');if(!c)return;
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];const hours=[];
    for(let h=6;h<=23;h++)hours.push(h);for(let h=0;h<=5;h++)hours.push(h);
    const hd={};
    trades.forEach(t=>{const d=new Date(t.date);const day=d.getDay()===0?6:d.getDay()-1;const hour=d.getHours();const k=`${day}-${hour}`;if(!hd[k])hd[k]={wins:0,losses:0,pl:0,total:0};hd[k].total++;hd[k].pl+=t.pl;if(t.result==='win')hd[k].wins++;else hd[k].losses++;});
    let html='<table class="heatmap-table"><thead><tr><th>IST</th>';days.forEach(d=>html+=`<th>${d}</th>`);html+='</tr></thead><tbody>';
    hours.forEach(h=>{html+=`<tr><td class="time-label">${String(h).padStart(2,'0')}:00</td>`;for(let d=0;d<7;d++){const k=`${d}-${h}`,dt=hd[k];if(!dt||!dt.total){html+='<td class="no-data">-</td>';}else{const wr=(dt.wins/dt.total*100);let cls=dt.pl>5?'strong-profit':dt.pl>0?'light-profit':dt.pl>-5?'light-loss':'strong-loss';html+=`<td class="${cls}" title="${days[d]} ${h}:00 IST\nTrades:${dt.total} WR:${wr.toFixed(0)}% P&L:$${dt.pl.toFixed(2)}">${dt.total}t ${wr.toFixed(0)}%</td>`;}}html+='</tr>';});
    html+='</tbody></table>';c.innerHTML=html;
    const ins=document.getElementById('heatmap-insights');if(!ins)return;
    let bt=null,wt=null,bp=-Infinity,wp=Infinity;
    for(const[k,d]of Object.entries(hd)){if(d.total>=2){if(d.pl>bp){bp=d.pl;bt=k;}if(d.pl<wp){wp=d.pl;wt=k;}}}
    let ih='';
    if(bt){const[d,h]=bt.split('-');ih+=`<div class="heatmap-insight-card good"><div class="insight-title">✅ Best Time</div><div class="insight-text">${days[d]} at ${String(h).padStart(2,'0')}:00 IST<br>P&L: +$${bp.toFixed(2)}</div></div>`;}
    if(wt&&wp<0){const[d,h]=wt.split('-');ih+=`<div class="heatmap-insight-card bad"><div class="insight-title">❌ Worst Time</div><div class="insight-text">${days[d]} at ${String(h).padStart(2,'0')}:00 IST<br>P&L: $${wp.toFixed(2)}</div></div>`;}
    ih+=`<div class="heatmap-insight-card info"><div class="insight-title">📊 Data Points</div><div class="insight-text">${Object.keys(hd).length} time slots<br>${trades.length} trades analyzed</div></div>`;
    ins.innerHTML=ih;
}

// ===== MONEY MANAGEMENT =====
function updateMoneyManagement(){
    const bal=calculateCurrentBalance(),dep=calculateTotalDeposits(),wit=calculateTotalWithdrawals(),pl=calculateTotalPL();
    document.getElementById('mm-current-balance').textContent=`$${bal.toFixed(2)}`;
    document.getElementById('mm-total-deposits').textContent=`$${dep.toFixed(2)}`;
    document.getElementById('mm-total-withdrawals').textContent=`$${wit.toFixed(2)}`;
    document.getElementById('mm-total-pl').textContent=`${pl>=0?'+':''}$${pl.toFixed(2)}`;
    document.getElementById('mm-total-pl').style.color=pl>=0?'#22c55e':'#ef4444';
    updatePerformanceMetrics();renderTransactionHistory();updateBalanceChart();updateAutoCalculatedAmount();
}

function updatePerformanceMetrics(){
    const w=trades.filter(t=>t.result==='win'),l=trades.filter(t=>t.result==='loss');
    const aw=w.length?w.reduce((s,t)=>s+t.pl,0)/w.length:0;
    const al=l.length?l.reduce((s,t)=>s+Math.abs(t.pl),0)/l.length:0;
    const tw=w.reduce((s,t)=>s+t.pl,0),tl=Math.abs(l.reduce((s,t)=>s+t.pl,0));
    const pf=tl>0?tw/tl:0;
    const lw=w.length?Math.max(...w.map(t=>t.pl)):0;
    const ll=l.length?Math.min(...l.map(t=>t.pl)):0;
    let peak=0,maxDD=0,bal=0;
    [...trades].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t=>{bal+=t.pl;if(bal>peak)peak=bal;const dd=peak-bal;if(dd>maxDD)maxDD=dd;});
    document.getElementById('avg-win').textContent=`$${aw.toFixed(2)}`;
    document.getElementById('avg-loss').textContent=`$${al.toFixed(2)}`;
    document.getElementById('profit-factor').textContent=pf.toFixed(2);
    document.getElementById('largest-win').textContent=`$${lw.toFixed(2)}`;
    document.getElementById('largest-loss').textContent=`$${Math.abs(ll).toFixed(2)}`;
    document.getElementById('max-drawdown').textContent=`$${maxDD.toFixed(2)}`;
}

function updateBalanceChart(){
    const ctx=document.getElementById('balanceChart');if(!ctx)return;
    const all=[...transactions.map(t=>({date:t.date,amount:t.type==='deposit'?t.amount:-t.amount})),...trades.map(t=>({date:t.date.split('T')[0],amount:t.pl}))].sort((a,b)=>new Date(a.date)-new Date(b.date));
    let bal=0;const labels=['Start'],data=[0];
    all.forEach(e=>{bal+=e.amount;labels.push(new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}));data.push(parseFloat(bal.toFixed(2)));});
    if(balanceChart)balanceChart.destroy();
    balanceChart=new Chart(ctx.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Balance',data,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',fill:true,tension:0.4,borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8'}},x:{grid:{display:false},ticks:{color:'#94a3b8',maxTicksLimit:10}}}}});
}

// ===== SETTINGS =====
function handleSettingsSubmit(e){
    e.preventDefault();
    const dl=parseInt(document.getElementById('daily-limit').value);
    const rp=parseFloat(document.getElementById('risk-percentage').value);
    const llp=parseFloat(document.getElementById('daily-loss-limit-pct').value);
    const cm=parseInt(document.getElementById('cooldown-minutes').value);
    if(isNaN(dl)||dl<1||dl>20){alert('⚠️ Limit 1-20');return;}
    if(isNaN(rp)||rp<0.5||rp>10){alert('⚠️ Risk 0.5-10%');return;}
    if(isNaN(llp)||llp<1||llp>20){alert('⚠️ Loss limit 1-20%');return;}
    settings.dailyLimit=dl;settings.riskPercentage=rp;settings.dailyLossLimitPct=llp;settings.cooldownMinutes=cm;
    if(goals.dailyWins>dl)goals.dailyWins=Math.max(1,Math.round(dl*0.6));
    updateAutoCalculatedAmount();saveToLocalStorage();renderWinTargetSelector();autoCalculateGoals();
    alert('✅ Settings saved!');updateAll();
}

// ===== TRANSACTIONS =====
function selectTransactionType(type){document.getElementById('transaction-type').value=type;document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');}

function handleTransactionSubmit(e){
    e.preventDefault();
    const type=document.getElementById('transaction-type').value,amount=parseFloat(document.getElementById('transaction-amount').value),date=document.getElementById('transaction-date').value,note=document.getElementById('transaction-note').value;
    if(!amount||amount<=0){alert('Enter valid amount');return;}
    transactions.push({id:Date.now(),type,amount,date,note});transactions.sort((a,b)=>new Date(b.date)-new Date(a.date));saveToLocalStorage();
    document.getElementById('transaction-form').reset();document.getElementById('transaction-date').valueAsDate=new Date();selectTransactionType('deposit');
    alert(`✅ ${type.charAt(0).toUpperCase()+type.slice(1)} added!`);updateAll();
}

function renderTransactionHistory(){
    const c=document.getElementById('transaction-history');
    if(!transactions.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">💸</div><p class="empty-state-text">No transactions</p></div>';return;}
    c.innerHTML=transactions.map(t=>`<div class="transaction-item ${t.type}"><div class="transaction-info"><span class="transaction-type-badge">${t.type}</span><span class="transaction-amount">${t.type==='deposit'?'+':'-'}$${t.amount.toFixed(2)}</span><span class="transaction-date">${new Date(t.date).toLocaleDateString()}</span>${t.note?`<span class="transaction-note">${t.note}</span>`:''}</div><button class="btn-delete-small" onclick="deleteTransaction(${t.id})">🗑️</button></div>`).join('');
}

function deleteTransaction(id){transactionToDelete=id;document.getElementById('delete-transaction-modal').classList.add('active');}
function confirmDeleteTransaction(){transactions=transactions.filter(t=>t.id!==transactionToDelete);saveToLocalStorage();closeDeleteTransactionModal();updateAll();}
function closeDeleteTransactionModal(){document.getElementById('delete-transaction-modal').classList.remove('active');transactionToDelete=null;}

// ===== CALENDAR =====
function renderCalendar(){
    const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
    document.getElementById('current-month').textContent=currentMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const grid=document.getElementById('calendar-grid');grid.innerHTML='';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>grid.innerHTML+=`<div class="calendar-day-header">${d}</div>`);
    const fd=new Date(y,m,1).getDay();for(let i=0;i<fd;i++)grid.innerHTML+='<div class="calendar-day empty"></div>';
    const dim=new Date(y,m+1,0).getDate();
    for(let d=1;d<=dim;d++){
        const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const dt=getDateTrades(ds),dp=dt.reduce((s,t)=>s+t.pl,0);
        let cn='calendar-day',pl='';
        if(dt.length>0){cn+=dp>=0?' profit':' loss';pl=`<div class="day-pl">${dp>=0?'+':''}$${dp.toFixed(0)}</div>`;}else cn+=' no-trade';
        grid.innerHTML+=`<div class="${cn}" onclick="${dt.length?`showDayDetail('${ds}')`:''}">${'<div class="day-number">'+d+'</div>'}${pl}</div>`;
    }
}

function changeMonth(d){currentMonth.setMonth(currentMonth.getMonth()+d);renderCalendar();}

function showDayDetail(date){
    const dt=getDateTrades(date),dp=dt.reduce((s,t)=>s+t.pl,0),w=dt.filter(t=>t.result==='win').length,l=dt.filter(t=>t.result==='loss').length;
    document.getElementById('modal-date').textContent=new Date(date+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('modal-total-trades').textContent=dt.length;
    document.getElementById('modal-profitable').textContent=w;
    document.getElementById('modal-losses').textContent=l;
    document.getElementById('modal-pl').textContent=`${dp>=0?'+':''}$${dp.toFixed(2)}`;
    document.getElementById('modal-pl').className=`modal-stat-value ${dp>=0?'positive':'negative'}`;
    document.getElementById('modal-trades-list').innerHTML=dt.map(t=>createTradeCard(t)).join('');
    document.getElementById('day-modal').classList.add('active');
}

function closeDayModal(){document.getElementById('day-modal').classList.remove('active');}

// ===== PRE-TRADE CHECKLIST =====
function updateChecklistProgress(){
    const checks=document.querySelectorAll('.checklist-check');
    const checked=document.querySelectorAll('.checklist-check:checked').length;
    const pct=(checked/checks.length)*100;
    document.getElementById('checklist-progress-fill').style.width=pct+'%';
    document.getElementById('checklist-count').textContent=`${checked}/${checks.length} completed`;
    const b=document.getElementById('checklist-blocker');if(b){if(checked===checks.length)b.classList.add('hidden');else b.classList.remove('hidden');}
}

// ===== TRADE SELECTORS =====
function selectGrade(g){document.getElementById('trade-grade').value=g;document.querySelectorAll('.grade-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.grade-btn[data-grade="${g}"]`).classList.add('active');}
function toggleMistakeTag(btn,m){
    if(m==='No Mistake'){selectedMistakes=['No Mistake'];document.querySelectorAll('.mistake-tag').forEach(b=>{b.classList.remove('active');b.classList.remove('active-green');});btn.classList.add('active-green');}
    else{selectedMistakes=selectedMistakes.filter(x=>x!=='No Mistake');document.querySelectorAll('.mistake-tag').forEach(b=>{if(b.textContent.includes('No Mistake'))b.classList.remove('active-green');});if(selectedMistakes.includes(m)){selectedMistakes=selectedMistakes.filter(x=>x!==m);btn.classList.remove('active');}else{selectedMistakes.push(m);btn.classList.add('active');}}
    document.getElementById('trade-mistakes').value=selectedMistakes.join(',');
}
function selectSetup(s){document.getElementById('trade-setup').value=s;document.querySelectorAll('.setup-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.setup-btn[data-setup="${s}"]`).classList.add('active');}
function selectOptionType(t){document.getElementById('option-type').value=t;document.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.option-btn[data-type="${t}"]`).classList.add('active');}
function selectResult(r){document.getElementById('trade-result').value=r;document.querySelectorAll('.result-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.result-btn[data-result="${r}"]`).classList.add('active');updateResultAmount();}
function handleScreenshotPreview(e){const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{document.getElementById('image-preview').innerHTML=`<img src="${ev.target.result}">`;document.getElementById('file-label').innerHTML=`<span>✓</span><span>${f.name}</span>`;};r.readAsDataURL(f);}}
function updateResultAmount(){const a=parseFloat(document.getElementById('trade-amount').value)||0,r=document.getElementById('trade-result').value,p=parseFloat(document.getElementById('payout-percentage').value)||87,pl=document.getElementById('pl-amount-display'),cp=document.getElementById('calculated-pl');if(r&&a>0){pl.style.display='block';if(r==='win'){cp.textContent=`+$${(a*p/100).toFixed(2)}`;cp.style.color='#22c55e';}else{cp.textContent=`-$${a.toFixed(2)}`;cp.style.color='#ef4444';}}else pl.style.display='none';}

// ===== ADD TRADE =====
function handleTradeSubmit(e){
    e.preventDefault();
    if(isDailyLossLimitReached()){showDailyLossLimitModal();return;}
    if(profitLocked){alert('🔒 Profits locked! You chose to stop trading today.');return;}
    if(cooldownActive){alert('⏱️ Cooldown active! Please wait before next trade.');return;}
    const checked=document.querySelectorAll('.checklist-check:checked').length;
    if(checked<6){alert('⚠️ Complete all 6 checklist items first!');return;}
    const datetime=document.getElementById('trade-datetime').value;
    const asset=document.getElementById('trade-asset').value;
    const expiry=document.getElementById('trade-expiry').value;
    const optionType=document.getElementById('option-type').value;
    const setup=document.getElementById('trade-setup').value;
    const amount=parseFloat(document.getElementById('trade-amount').value);
    const result=document.getElementById('trade-result').value;
    const payout=parseFloat(document.getElementById('payout-percentage').value)||87;
    const notes=document.getElementById('notes').value;
    const grade=document.getElementById('trade-grade').value||'B';
    const mistakes=document.getElementById('trade-mistakes').value;
    const screenshotFile=document.getElementById('screenshot').files[0];
    if(!datetime){alert('⚠️ Select date/time');return;}
    if(!asset){alert('⚠️ Select asset');return;}
    if(!expiry){alert('⚠️ Select expiry');return;}
    if(!optionType){alert('⚠️ Select Call/Put');return;}
    if(!setup){alert('⚠️ Select setup');return;}
    if(!result){alert('⚠️ Select Win/Loss');return;}
    if(!amount||amount<=0){alert('⚠️ Enter amount');return;}
    const td=new Date(datetime),tds=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
    if(getDateTrades(tds).length>=settings.dailyLimit){alert('⚠️ Daily limit reached!');document.getElementById('congrats-modal').classList.add('active');return;}
    const pl=result==='win'?amount*(payout/100):-amount;
    const tradeData={date:datetime,asset,expiry,optionType,setup,amount,result,payout,pl,notes,grade,mistakes,confidence:tradeConfidence};
    const cl=getConsecutiveLosses();
    if(result==='loss'){
        currentLossCount=cl+1;
        if(screenshotFile){const r=new FileReader();r.onload=function(ev){pendingLossTrade={tradeData,screenshotBase64:ev.target.result};showLossWarning(cl);};r.readAsDataURL(screenshotFile);}
        else{pendingLossTrade={tradeData,screenshotBase64:null};showLossWarning(cl);}
        return;
    }
    saveTradeDirectly(tradeData,screenshotFile);
}

function showLossWarning(cl){
    if(cl>=1){document.getElementById('loss-streak-warning').style.display='block';document.getElementById('consecutive-losses').textContent=cl+1;const te=document.getElementById('consecutive-losses-telugu');if(te)te.textContent=cl+1;}
    else document.getElementById('loss-streak-warning').style.display='none';
    document.getElementById('loss-warning-modal').classList.add('active');
    speakTeluguWarning(cl+1);
}

function saveTradeDirectly(td,sf){const nt={id:Date.now(),...td,screenshot:null};if(sf){const r=new FileReader();r.onload=ev=>{nt.screenshot=ev.target.result;finalizeTrade(nt);};r.readAsDataURL(sf);}else finalizeTrade(nt);}
function saveTradeWithBase64(td,sb){finalizeTrade({id:Date.now(),...td,screenshot:sb});}

function finalizeTrade(trade){
    const prevAch=achievementDefs.filter(a=>a.check()).map(a=>a.id);
    trades.push(trade);saveToLocalStorage();resetTradeForm();updateAll();populateAssetFilter();
    checkDailyLossLimit();checkProfitProtection();updateProtectionBar();
    if(trade.result==='loss')startCooldown();
    const newAch=achievementDefs.filter(a=>a.check()&&!prevAch.includes(a.id));
    if(newAch.length>0){const a=newAch[0];document.getElementById('achievement-title').textContent=`🏆 ${a.name} Unlocked!`;document.getElementById('achievement-message').textContent=a.desc;setTimeout(()=>document.getElementById('achievement-modal').classList.add('active'),500);}
    const td=new Date(trade.date),tds=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
    const dt=getDateTrades(tds);
    if(dt.length>=settings.dailyLimit)document.getElementById('congrats-modal').classList.add('active');
    else{const rem=settings.dailyLimit-dt.length;alert(trade.result==='win'?`✅ WIN! +$${trade.pl.toFixed(2)}\n${dt.length}/${settings.dailyLimit} (${rem} left)`: `❌ Loss: -$${Math.abs(trade.pl).toFixed(2)}\nStay disciplined!\n${dt.length}/${settings.dailyLimit} (${rem} left)`);}
    setTimeout(()=>showPostTradeReview(trade.id),500);
}

function resetTradeForm(){
    document.getElementById('trade-form').reset();
    const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
    document.getElementById('trade-datetime').value=now.toISOString().slice(0,16);
    document.getElementById('trade-setup').value='';document.getElementById('option-type').value='';
    document.getElementById('trade-result').value='';document.getElementById('payout-percentage').value='87';
    document.getElementById('trade-grade').value='B';document.getElementById('trade-mistakes').value='';
    selectedMistakes=[];tradeConfidence=5;
    document.getElementById('trade-amount').value=((calculateCurrentBalance()*settings.riskPercentage)/100).toFixed(2);
    document.querySelectorAll('.setup-btn,.option-btn,.result-btn,.grade-btn,.mistake-tag,.conf-btn').forEach(b=>{b.classList.remove('active');b.classList.remove('active-green');});
    const cd=document.getElementById('confidence-display');if(cd)cd.textContent='5/10';
    document.getElementById('image-preview').innerHTML='';
    document.getElementById('file-label').innerHTML='<span>📷</span><span>Click to upload</span>';
    document.getElementById('pl-amount-display').style.display='none';
    document.querySelectorAll('.checklist-check').forEach(c=>c.checked=false);
    updateChecklistProgress();
}

function closeLossWarningModal(){document.getElementById('loss-warning-modal').classList.remove('active');window.speechSynthesis.cancel();pendingLossTrade=null;}
function confirmLossWarning(){document.getElementById('loss-warning-modal').classList.remove('active');window.speechSynthesis.cancel();if(pendingLossTrade){saveTradeWithBase64(pendingLossTrade.tradeData,pendingLossTrade.screenshotBase64);pendingLossTrade=null;}}
function closeCongratsModal(){document.getElementById('congrats-modal').classList.remove('active');}
function closeAchievementModal(){document.getElementById('achievement-modal').classList.remove('active');}

// ===== ALL TRADES =====
function populateAssetFilter(){const a=[...new Set(trades.map(t=>t.asset))];const s=document.getElementById('filter-asset');const cv=s.value;s.innerHTML='<option value="">All Assets</option>';a.forEach(x=>s.innerHTML+=`<option value="${x}">${x}</option>`);s.value=cv;}

function renderAllTrades(){
    const c=document.getElementById('all-trades-list');
    const sorted=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!sorted.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-text">No trades yet</p></div>';return;}
    c.innerHTML=sorted.map(t=>createTradeCard(t)).join('');
}

function createTradeCard(trade){
    const oi={'call':'📈','put':'📉'};const d=new Date(trade.date);
    const mh=trade.mistakes?`<div class="trade-mistake-tags">${trade.mistakes.split(',').filter(m=>m).map(m=>`<span class="trade-mistake-tag">${m}</span>`).join('')}</div>`:'';
    const prh=trade.postReview?`<div class="trade-post-review">📝 Analysis: ${trade.postReview.analysis?'✅':'❌'} | Setup: ${trade.postReview.followed?'✅':'❌'} | Again: ${trade.postReview.again?'✅':'❌'}</div>`:'';
    return `<div class="trade-card ${trade.result==='win'?'profit':'loss'}">
        <button class="btn-delete-trade" onclick="deleteTrade(${trade.id})">🗑️</button>
        <div class="trade-card-header"><span class="trade-symbol">${trade.asset}</span><span class="trade-pl ${trade.result==='win'?'profit':'loss'}">${trade.pl>=0?'+':''}$${trade.pl.toFixed(2)}</span></div>
        <div class="trade-card-details">
            <span>📅 ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
            <span>⏰ ${expiryLabels[trade.expiry]||trade.expiry}</span>
            <span>${oi[trade.optionType]||'📊'} ${optionTypeLabels[trade.optionType]||trade.optionType}</span>
            <span>${setupIcons[trade.setup]||'📊'} ${trade.setup}</span>
            <span>💰 $${trade.amount.toFixed(2)} @ ${trade.payout}%</span>
            ${trade.grade?`<span class="trade-grade-badge">Grade: ${trade.grade}</span>`:''}
            ${trade.confidence?`<span class="trade-confidence-badge">Conf: ${trade.confidence}/10</span>`:''}
        </div>
        ${mh}${prh}
        ${trade.notes?`<div class="trade-notes">📝 ${trade.notes}</div>`:''}
        ${trade.screenshot?`<div class="trade-screenshot"><img src="${trade.screenshot}" onclick="openImageModal('${trade.screenshot}')"></div>`:''}
    </div>`;
}

function filterTrades(){
    const s=document.getElementById('search-trades').value.toLowerCase();
    const sf=document.getElementById('filter-setup').value,af=document.getElementById('filter-asset').value,rf=document.getElementById('filter-result').value;
    let f=trades.filter(t=>(t.asset.toLowerCase().includes(s)||t.setup.toLowerCase().includes(s)||(t.notes&&t.notes.toLowerCase().includes(s)))&&(!sf||t.setup===sf)&&(!af||t.asset===af)&&(!rf||t.result===rf));
    const c=document.getElementById('all-trades-list');
    f=f.sort((a,b)=>new Date(b.date)-new Date(a.date));
    c.innerHTML=f.length?f.map(t=>createTradeCard(t)).join(''):'<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">No trades found</p></div>';
}

function deleteTrade(id){tradeToDelete=id;document.getElementById('delete-modal').classList.add('active');}
function confirmDelete(){trades=trades.filter(t=>t.id!==tradeToDelete);saveToLocalStorage();closeDeleteModal();updateAll();populateAssetFilter();alert('✅ Deleted!');}
function closeDeleteModal(){document.getElementById('delete-modal').classList.remove('active');tradeToDelete=null;}
function openImageModal(src){const m=document.createElement('div');m.className='modal active';m.style.cursor='zoom-out';m.innerHTML=`<img src="${src}" style="max-width:90%;max-height:90%;border-radius:16px;">`;m.onclick=()=>m.remove();document.body.appendChild(m);}

// ===== SETUPS =====
function updateSetupsAnalysis(){
    const c=document.getElementById('setups-list');const s={};
    trades.forEach(t=>{if(!s[t.setup])s[t.setup]={total:0,wins:0,pl:0};s[t.setup].total++;if(t.result==='win')s[t.setup].wins++;s[t.setup].pl+=t.pl;});
    const sorted=Object.entries(s).sort((a,b)=>b[1].pl-a[1].pl);
    if(!sorted.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">📈</div><p class="empty-state-text">No data</p></div>';return;}
    c.innerHTML=sorted.map(([n,d])=>{const wr=((d.wins/d.total)*100).toFixed(1);return`<div class="setup-card"><div class="setup-card-header"><span class="setup-card-icon">${setupIcons[n]||'📊'}</span><span class="setup-card-name">${n}</span></div><div class="setup-card-stats"><div class="setup-stat"><span class="setup-stat-label">Trades</span><span class="setup-stat-value">${d.total}</span></div><div class="setup-stat"><span class="setup-stat-label">Win Rate</span><span class="setup-stat-value" style="color:${parseFloat(wr)>=55?'#22c55e':'#ef4444'}">${wr}%</span></div><div class="setup-stat"><span class="setup-stat-label">P&L</span><span class="setup-stat-value" style="color:${d.pl>=0?'#22c55e':'#ef4444'}">${d.pl>=0?'+':''}$${d.pl.toFixed(2)}</span></div><div class="setup-stat"><span class="setup-stat-label">Avg P&L</span><span class="setup-stat-value" style="color:${d.pl/d.total>=0?'#22c55e':'#ef4444'}">${d.pl/d.total>=0?'+':''}$${(d.pl/d.total).toFixed(2)}</span></div></div></div>`;}).join('');
}

// ===== GOALS =====
function handleGoalsSubmit(e){
    e.preventDefault();
    goals.dailyWins=parseInt(document.getElementById('goal-daily-wins').value)||4;
    goals.avgPayout=parseInt(document.getElementById('goal-avg-payout').value)||87;
    saveToLocalStorage();autoCalculateGoals();alert('✅ Goals saved!');updateGoalsProgress();updateDashboardGoals();
}

function renderWinTargetSelector(){
    const c=document.getElementById('win-target-selector');if(!c)return;
    const limit=settings.dailyLimit;
    const ld=document.getElementById('goal-daily-limit-display');if(ld)ld.textContent=limit;
    const ld2=document.getElementById('win-target-limit-display');if(ld2)ld2.textContent=limit;
    if(goals.dailyWins>limit)goals.dailyWins=limit;
    const mi=document.getElementById('goal-daily-wins-input');if(mi){mi.value=goals.dailyWins;mi.max=limit;}
    const pct=((goals.dailyWins/limit)*100).toFixed(0);
    const pd=document.getElementById('win-target-pct-display');if(pd)pd.textContent=`(${pct}%)`;
    let html='';
    for(let i=1;i<=limit;i++){const bp=((i/limit)*100).toFixed(0);html+=`<button type="button" class="win-target-btn ${i===goals.dailyWins?'active':''}" onclick="selectWinTarget(${i})"><span class="wt-number">${i}</span><span class="wt-label">of ${limit}</span><span class="wt-pct">${bp}%</span></button>`;}
    c.innerHTML=html;
}

function selectWinTarget(wins){
    const limit=settings.dailyLimit;goals.dailyWins=wins;
    document.getElementById('goal-daily-wins').value=wins;
    const mi=document.getElementById('goal-daily-wins-input');if(mi)mi.value=wins;
    const pct=((wins/limit)*100).toFixed(0);
    const pd=document.getElementById('win-target-pct-display');if(pd)pd.textContent=`(${pct}%)`;
    document.querySelectorAll('.win-target-btn').forEach(b=>b.classList.remove('active'));
    event.target.closest('.win-target-btn').classList.add('active');
    autoCalculateGoals();
}

function manualWinTarget(value){
    const limit=settings.dailyLimit;let wins=parseInt(value);
    if(isNaN(wins)||wins<1)wins=1;if(wins>limit)wins=limit;
    goals.dailyWins=wins;document.getElementById('goal-daily-wins').value=wins;
    const mi=document.getElementById('goal-daily-wins-input');if(mi)mi.value=wins;
    const pct=((wins/limit)*100).toFixed(0);
    const pd=document.getElementById('win-target-pct-display');if(pd)pd.textContent=`(${pct}%)`;
    document.querySelectorAll('.win-target-btn').forEach((b,i)=>b.classList.toggle('active',i+1===wins));
    autoCalculateGoals();
}

function autoCalculateGoals(){
    const balance=calculateCurrentBalance(),riskPct=settings.riskPercentage,dailyLimit=settings.dailyLimit;
    const dailyWins=goals.dailyWins||4,avgPayoutEl=document.getElementById('goal-avg-payout');
    const avgPayout=avgPayoutEl?parseFloat(avgPayoutEl.value)||87:87;
    const tradeAmount=(balance*riskPct)/100,dailyLosses=dailyLimit-dailyWins;
    const winAmount=tradeAmount*(avgPayout/100),lossAmount=tradeAmount;
    const dailyProfit=(dailyWins*winAmount)-(dailyLosses*lossAmount);
    const dailyWinRate=(dailyWins/dailyLimit)*100;
    const weeklyProfit=dailyProfit*5,weeklyWinRate=dailyWinRate;
    const monthlyProfit=dailyProfit*22,monthlyGrowth=balance>0?((monthlyProfit/balance)*100):0;
    goals.calculatedDaily=dailyProfit;goals.calculatedWeekly=weeklyProfit;
    goals.calculatedMonthly=monthlyProfit;goals.calculatedWinRate=dailyWinRate;
    goals.calculatedGrowth=monthlyGrowth;goals.avgPayout=avgPayout;
    updateGoalInputSummary(balance,riskPct,tradeAmount,dailyLimit,dailyWins,avgPayout);
    updateAutoGoalsBreakdown(balance,riskPct,tradeAmount,dailyLimit,dailyWins,dailyLosses,winAmount,lossAmount,dailyProfit,dailyWinRate,weeklyProfit,weeklyWinRate,monthlyProfit,monthlyGrowth);
}

function updateGoalInputSummary(balance,riskPct,tradeAmount,dailyLimit,dailyWins,avgPayout){
    const c=document.getElementById('goal-input-summary');if(!c)return;
    c.innerHTML=`<div class="goal-summary-item"><span class="goal-summary-label">Balance</span><span class="goal-summary-value green">$${balance.toFixed(2)}</span></div><div class="goal-summary-item"><span class="goal-summary-label">Risk/Trade</span><span class="goal-summary-value">${riskPct}%</span></div><div class="goal-summary-item"><span class="goal-summary-label">Trade Amt</span><span class="goal-summary-value blue">$${tradeAmount.toFixed(2)}</span></div><div class="goal-summary-item"><span class="goal-summary-label">Daily Limit</span><span class="goal-summary-value">${dailyLimit}</span></div><div class="goal-summary-item"><span class="goal-summary-label">Win Target</span><span class="goal-summary-value green">${dailyWins}/${dailyLimit}</span></div><div class="goal-summary-item"><span class="goal-summary-label">Payout</span><span class="goal-summary-value">${avgPayout}%</span></div>`;
}

function updateAutoGoalsBreakdown(balance,riskPct,tradeAmount,dailyLimit,dailyWins,dailyLosses,winAmount,lossAmount,dailyProfit,dailyWinRate,weeklyProfit,weeklyWinRate,monthlyProfit,monthlyGrowth){
    const c=document.getElementById('auto-goals-breakdown');if(!c)return;
    c.innerHTML=`
        <div class="auto-goal-card daily"><div class="auto-goal-card-header"><span class="auto-goal-card-icon">☀️</span><div><div class="auto-goal-card-title">Daily Goal</div><div class="auto-goal-card-period">Per trading day</div></div></div><div class="auto-goal-formula">${dailyWins} wins × $${winAmount.toFixed(2)} = <strong style="color:#22c55e">+$${(dailyWins*winAmount).toFixed(2)}</strong><br>${dailyLosses} losses × $${lossAmount.toFixed(2)} = <strong style="color:#ef4444">-$${(dailyLosses*lossAmount).toFixed(2)}</strong><br>━━━━━━━━━━━━<br>Net = <strong>${dailyProfit>=0?'+':''}$${dailyProfit.toFixed(2)}</strong></div><div class="auto-goal-result"><span class="auto-goal-result-label">Daily Target</span><span class="auto-goal-result-value" style="color:${dailyProfit>=0?'#22c55e':'#ef4444'}">${dailyProfit>=0?'+':''}$${dailyProfit.toFixed(2)}</span></div><div class="auto-goal-result" style="margin-top:7px"><span class="auto-goal-result-label">Win Rate Needed</span><span class="auto-goal-result-value" style="font-size:17px">${dailyWinRate.toFixed(1)}%</span></div></div>
        <div class="auto-goal-card weekly"><div class="auto-goal-card-header"><span class="auto-goal-card-icon">📅</span><div><div class="auto-goal-card-title">Weekly Goal</div><div class="auto-goal-card-period">5 trading days</div></div></div><div class="auto-goal-formula">$${dailyProfit.toFixed(2)}/day × 5 days<br>━━━━━━━━━━━━<br>Weekly = <strong>${weeklyProfit>=0?'+':''}$${weeklyProfit.toFixed(2)}</strong></div><div class="auto-goal-result"><span class="auto-goal-result-label">Weekly Target</span><span class="auto-goal-result-value" style="color:${weeklyProfit>=0?'#22c55e':'#ef4444'}">${weeklyProfit>=0?'+':''}$${weeklyProfit.toFixed(2)}</span></div><div class="auto-goal-result" style="margin-top:7px"><span class="auto-goal-result-label">Win Rate</span><span class="auto-goal-result-value" style="font-size:17px">${weeklyWinRate.toFixed(1)}%</span></div></div>
        <div class="auto-goal-card monthly"><div class="auto-goal-card-header"><span class="auto-goal-card-icon">📆</span><div><div class="auto-goal-card-title">Monthly Goal</div><div class="auto-goal-card-period">22 trading days</div></div></div><div class="auto-goal-formula">$${dailyProfit.toFixed(2)}/day × 22 days<br>━━━━━━━━━━━━<br>Monthly = <strong>${monthlyProfit>=0?'+':''}$${monthlyProfit.toFixed(2)}</strong><br>Growth = <strong>${monthlyGrowth.toFixed(1)}%</strong></div><div class="auto-goal-result"><span class="auto-goal-result-label">Monthly Target</span><span class="auto-goal-result-value" style="color:${monthlyProfit>=0?'#22c55e':'#ef4444'}">${monthlyProfit>=0?'+':''}$${monthlyProfit.toFixed(2)}</span></div><div class="auto-goal-result" style="margin-top:7px"><span class="auto-goal-result-label">Account Growth</span><span class="auto-goal-result-value" style="font-size:17px;color:${monthlyGrowth>=0?'#22c55e':'#ef4444'}">${monthlyGrowth.toFixed(1)}%</span></div></div>
        <div class="auto-goal-card" style="border-left-color:var(--secondary)"><div class="auto-goal-card-header"><span class="auto-goal-card-icon">🚀</span><div><div class="auto-goal-card-title">Yearly Projection</div><div class="auto-goal-card-period">12 months consistent</div></div></div><div class="auto-goal-formula">$${monthlyProfit.toFixed(2)}/month × 12<br>━━━━━━━━━━━━<br>Yearly = <strong>${(monthlyProfit*12)>=0?'+':''}$${(monthlyProfit*12).toFixed(2)}</strong><br>New Balance = <strong>$${(balance+(monthlyProfit*12)).toFixed(2)}</strong></div><div class="auto-goal-result"><span class="auto-goal-result-label">Yearly Projection</span><span class="auto-goal-result-value" style="color:${monthlyProfit>=0?'#22c55e':'#ef4444'}">${(monthlyProfit*12)>=0?'+':''}$${(monthlyProfit*12).toFixed(2)}</span></div></div>
    `;
}

function updateGoalsProgress(){
    const c=document.getElementById('goals-progress');if(!c)return;
    const tt=getTodayTrades(),todayPL=getTodayPL(),todayWins=tt.filter(t=>t.result==='win').length,weekPL=getWeekPL(),monthPL=getMonthPL(),ic=calculateInitialCapital();
    const dt=goals.calculatedDaily||0,wt=goals.calculatedWeekly||0,mt=goals.calculatedMonthly||0,wrt=goals.calculatedWinRate||57,gt=goals.calculatedGrowth||10;
    const weekTrades=trades.filter(t=>{const d=new Date(t.date);const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);return d>=ws;});
    const weekWR=weekTrades.length>0?(weekTrades.filter(t=>t.result==='win').length/weekTrades.length*100):0;
    const monthGrowth=ic>0?((monthPL/ic)*100):0;
    const gd=[
        {icon:'🎯',title:'Daily Wins',sub:'Today',current:todayWins,target:goals.dailyWins,unit:'',color:todayWins>=goals.dailyWins?'#22c55e':'#6366f1'},
        {icon:'💰',title:'Daily Profit',sub:'Today',current:todayPL,target:dt,unit:'$',color:todayPL>=dt&&dt>0?'#22c55e':'#6366f1'},
        {icon:'📅',title:'Weekly Profit',sub:'This Week',current:weekPL,target:wt,unit:'$',color:weekPL>=wt&&wt>0?'#22c55e':'#6366f1'},
        {icon:'📊',title:'Weekly Win Rate',sub:'This Week',current:weekWR,target:wrt,unit:'%',color:weekWR>=wrt?'#22c55e':'#6366f1'},
        {icon:'📆',title:'Monthly Profit',sub:'This Month',current:monthPL,target:mt,unit:'$',color:monthPL>=mt&&mt>0?'#22c55e':'#6366f1'},
        {icon:'📈',title:'Monthly Growth',sub:'This Month',current:monthGrowth,target:gt,unit:'%',color:monthGrowth>=gt?'#22c55e':'#6366f1'}
    ];
    c.innerHTML='<h3 style="margin-bottom:14px;font-size:15px;color:var(--text-primary)">📊 Live Progress vs Goals</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">'+
    gd.map(g=>{const pct=g.target!==0?Math.min((Math.max(0,g.current)/Math.abs(g.target))*100,100):0;const ach=g.current>=g.target&&g.target>0;const cd=g.unit==='$'?`$${Math.abs(g.current).toFixed(2)}`:`${g.current.toFixed(g.unit==='%'?1:0)}${g.unit}`;const td=g.unit==='$'?`$${g.target.toFixed(2)}`:`${g.target.toFixed(g.unit==='%'?1:0)}${g.unit}`;return`<div class="goal-card"><div class="goal-card-header"><span class="goal-card-icon">${g.icon}</span><div><div class="goal-card-title">${g.title}</div><div class="goal-card-subtitle">${g.sub}</div></div></div><div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%;background:${g.color}"></div></div><div class="goal-numbers"><span class="goal-current" style="color:${g.current>=0?'#22c55e':'#ef4444'}">${cd}</span><span class="goal-target">${td}</span></div><div class="goal-status" style="color:${ach?'#22c55e':'var(--text-muted)'}">${ach?'✅ ACHIEVED!':'🔄 In Progress'}</div></div>`;}).join('')+'</div>';
}

// ===== WEEKLY REVIEW =====
function showWeeklyReviewModal(){
    const now=new Date();
    const ws=new Date(now);ws.setDate(now.getDate()-now.getDay());ws.setHours(0,0,0,0);
    const weekTrades=trades.filter(t=>new Date(t.date)>=ws);
    const wins=weekTrades.filter(t=>t.result==='win'),losses=weekTrades.filter(t=>t.result==='loss');
    const weekPL=weekTrades.reduce((s,t)=>s+t.pl,0);
    const wr=weekTrades.length>0?(wins.length/weekTrades.length*100).toFixed(1):0;
    const bestSetup=()=>{const s={};weekTrades.forEach(t=>{if(!s[t.setup])s[t.setup]={w:0,t:0};s[t.setup].t++;if(t.result==='win')s[t.setup].w++;});let b='-',bw=0;for(const[n,d]of Object.entries(s)){if(d.t>=2&&d.w/d.t>bw){bw=d.w/d.t;b=n;}}return b;};
    const insights=[];
    if(weekTrades.length===0)insights.push({type:'neutral',text:'No trades this week. Start fresh next week!'});
    else{
        if(parseFloat(wr)>=60)insights.push({type:'positive',text:`🎯 Excellent win rate: ${wr}%! Keep this up!`});
        else if(parseFloat(wr)>=50)insights.push({type:'neutral',text:`📊 Decent win rate: ${wr}%. Room to improve!`});
        else insights.push({type:'negative',text:`⚠️ Low win rate: ${wr}%. Review your setups!`});
        if(weekPL>0)insights.push({type:'positive',text:`💰 Profitable week! +$${weekPL.toFixed(2)} earned!`});
        else insights.push({type:'negative',text:`📉 Loss week: $${weekPL.toFixed(2)}. Analyze mistakes!`});
        const bs=bestSetup();if(bs!=='-')insights.push({type:'positive',text:`⭐ Best setup this week: ${setupIcons[bs]||''} ${bs}`});
    }
    const content=document.getElementById('weekly-review-content');
    content.innerHTML=`<div class="weekly-review-modal-stats">
        <div class="wr-modal-stat"><span class="wr-modal-label">Trades</span><span class="wr-modal-value">${weekTrades.length}</span></div>
        <div class="wr-modal-stat"><span class="wr-modal-label">Wins</span><span class="wr-modal-value" style="color:#22c55e">${wins.length}</span></div>
        <div class="wr-modal-stat"><span class="wr-modal-label">Losses</span><span class="wr-modal-value" style="color:#ef4444">${losses.length}</span></div>
        <div class="wr-modal-stat"><span class="wr-modal-label">Win Rate</span><span class="wr-modal-value" style="color:${parseFloat(wr)>=55?'#22c55e':'#ef4444'}">${wr}%</span></div>
        <div class="wr-modal-stat"><span class="wr-modal-label">P&L</span><span class="wr-modal-value" style="color:${weekPL>=0?'#22c55e':'#ef4444'}">${weekPL>=0?'+':''}$${weekPL.toFixed(2)}</span></div>
    </div>
    <div>${insights.map(i=>`<div class="wr-insight ${i.type}">${i.text}</div>`).join('')}</div>`;
    document.getElementById('weekly-focus-input').value='';
    document.getElementById('weekly-review-modal').classList.add('active');
}

function saveWeeklyReview(){
    const now=new Date();
    const ws=new Date(now);ws.setDate(now.getDate()-now.getDay());ws.setHours(0,0,0,0);
    const weekTrades=trades.filter(t=>new Date(t.date)>=ws);
    const wins=weekTrades.filter(t=>t.result==='win');
    const weekPL=weekTrades.reduce((s,t)=>s+t.pl,0);
    const wr=weekTrades.length>0?(wins.length/weekTrades.length*100).toFixed(1):0;
    const focus=document.getElementById('weekly-focus-input').value;
    weeklyReviews.push({id:Date.now(),date:now.toISOString(),weekStart:ws.toISOString(),trades:weekTrades.length,wins:wins.length,losses:weekTrades.length-wins.length,winRate:wr,pl:weekPL,focus});
    weeklyReviews.sort((a,b)=>new Date(b.date)-new Date(a.date));
    saveToLocalStorage();closeWeeklyReview();renderWeeklyReviews();alert('✅ Weekly review saved!');
}

function closeWeeklyReview(){document.getElementById('weekly-review-modal').classList.remove('active');}

function renderWeeklyReviews(){
    const c=document.getElementById('weekly-reviews-list');if(!c)return;
    if(!weeklyReviews.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">📊</div><p class="empty-state-text">No weekly reviews yet. Click "Generate Review" above!</p></div>';return;}
    c.innerHTML=weeklyReviews.map(r=>`
        <div class="weekly-review-card">
            <div class="weekly-review-header">
                <span class="weekly-review-title">Week of ${new Date(r.weekStart).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                <button class="btn-delete-small" onclick="deleteWeeklyReview(${r.id})">🗑️</button>
            </div>
            <div class="weekly-review-stats">
                <div class="wr-stat"><span class="wr-stat-label">Trades</span><span class="wr-stat-value">${r.trades}</span></div>
                <div class="wr-stat"><span class="wr-stat-label">Wins</span><span class="wr-stat-value" style="color:#22c55e">${r.wins}</span></div>
                <div class="wr-stat"><span class="wr-stat-label">Win Rate</span><span class="wr-stat-value" style="color:${parseFloat(r.winRate)>=55?'#22c55e':'#ef4444'}">${r.winRate}%</span></div>
                <div class="wr-stat"><span class="wr-stat-label">P&L</span><span class="wr-stat-value" style="color:${r.pl>=0?'#22c55e':'#ef4444'}">${r.pl>=0?'+':''}$${r.pl.toFixed(2)}</span></div>
            </div>
            ${r.focus?`<div class="weekly-focus-display">🎯 Next Week: ${r.focus}</div>`:''}
        </div>
    `).join('');
}

function deleteWeeklyReview(id){if(confirm('Delete review?')){weeklyReviews=weeklyReviews.filter(r=>r.id!==id);saveToLocalStorage();renderWeeklyReviews();}}

// ===== DIARY =====
function selectMood(type,mood){document.getElementById('mood-before').value=mood;document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.mood-btn[data-mood="${mood}"]`).classList.add('active');}
function selectSleep(val){document.getElementById('sleep-quality').value=val;document.querySelectorAll('.sleep-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.sleep-btn[data-sleep="${val}"]`).classList.add('active');}
function selectStress(val){document.getElementById('stress-level').value=val;document.querySelectorAll('.stress-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.stress-btn[data-stress="${val}"]`).classList.add('active');}
function selectDiscipline(val){document.getElementById('discipline-rating').value=val;document.querySelectorAll('.disc-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.disc-btn[data-disc="${val}"]`).classList.add('active');}

function handleDiarySubmit(e){
    e.preventDefault();
    const entry={id:Date.now(),date:document.getElementById('diary-date').value,mood:document.getElementById('mood-before').value,sleep:document.getElementById('sleep-quality').value,stress:document.getElementById('stress-level').value,positive:document.getElementById('diary-positive').value,mistakes:document.getElementById('diary-mistakes').value,improvement:document.getElementById('diary-improvement').value,discipline:document.getElementById('discipline-rating').value};
    if(!entry.date){alert('⚠️ Select date');return;}
    diaryEntries.push(entry);diaryEntries.sort((a,b)=>new Date(b.date)-new Date(a.date));saveToLocalStorage();
    document.getElementById('diary-form').reset();document.getElementById('diary-date').valueAsDate=new Date();
    document.querySelectorAll('.mood-btn,.sleep-btn,.stress-btn,.disc-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('mood-before').value='';document.getElementById('sleep-quality').value='';
    document.getElementById('stress-level').value='';document.getElementById('discipline-rating').value='';
    alert('✅ Diary entry saved!');renderDiaryHistory();updateAchievements();
}

function renderDiaryHistory(){
    const c=document.getElementById('diary-history');if(!c)return;
    if(!diaryEntries.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">📓</div><p class="empty-state-text">No diary entries yet</p></div>';return;}
    const me={great:'😊',good:'🙂',neutral:'😐',stressed:'😟',angry:'😡'};
    const sc={low:'🟢',medium:'🟡',high:'🔴'};
    c.innerHTML=diaryEntries.map(e=>`
        <div class="diary-entry">
            <div class="diary-entry-header"><span class="diary-entry-date">📅 ${new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span><span class="diary-entry-mood">${me[e.mood]||'😐'}</span><button class="diary-delete-btn" onclick="deleteDiaryEntry(${e.id})">🗑️</button></div>
            <div class="diary-entry-grid"><div class="diary-meta-item"><span class="diary-meta-label">Mood</span><span class="diary-meta-value">${me[e.mood]||''} ${e.mood||'-'}</span></div><div class="diary-meta-item"><span class="diary-meta-label">Sleep</span><span class="diary-meta-value">${e.sleep?'⭐'.repeat(e.sleep):'-'}</span></div><div class="diary-meta-item"><span class="diary-meta-label">Stress</span><span class="diary-meta-value">${sc[e.stress]||''} ${e.stress||'-'}</span></div><div class="diary-meta-item"><span class="diary-meta-label">Discipline</span><span class="diary-meta-value">${e.discipline?'⭐'.repeat(e.discipline):'-'}</span></div></div>
            ${e.positive?`<div class="diary-text-section"><div class="diary-text-label">✅ What went well</div><div class="diary-text-content">${e.positive}</div></div>`:''}
            ${e.mistakes?`<div class="diary-text-section"><div class="diary-text-label">⚠️ Mistakes</div><div class="diary-text-content">${e.mistakes}</div></div>`:''}
            ${e.improvement?`<div class="diary-text-section"><div class="diary-text-label">🎯 Improvement</div><div class="diary-text-content">${e.improvement}</div></div>`:''}
        </div>
    `).join('');
}

function deleteDiaryEntry(id){if(confirm('Delete entry?')){diaryEntries=diaryEntries.filter(e=>e.id!==id);saveToLocalStorage();renderDiaryHistory();}}

// ===== RULES =====
function renderRulesEditor(){
    const c=document.getElementById('rules-list-editor');if(!c)return;
    c.innerHTML=tradingRules.map((r,i)=>`<div class="rule-item-editor"><span class="rule-number">${i+1}</span><span class="rule-text-display">${r}</span><button type="button" class="rule-delete-btn" onclick="deleteRule(${i})">🗑️</button></div>`).join('');
}
function addNewRule(){const i=document.getElementById('new-rule-input');const r=i.value.trim();if(!r){alert('⚠️ Enter rule');return;}tradingRules.push(r);i.value='';renderRulesEditor();saveToLocalStorage();}
function deleteRule(i){tradingRules.splice(i,1);renderRulesEditor();saveToLocalStorage();}
function handleRulesSubmit(e){e.preventDefault();saveToLocalStorage();alert('✅ Rules saved!');renderRulesDisplay();updateRulesTicker();}

function renderRulesDisplay(){
    const c=document.getElementById('rules-display');if(!c)return;
    c.innerHTML=tradingRules.map((r,i)=>`<div class="rule-card"><span class="rule-card-number">${i+1}</span><span class="rule-card-text">${r}</span></div>`).join('');
}

function updateRulesCompliance(){
    const c=document.getElementById('rules-compliance');if(!c)return;
    const tt=getTodayTrades();
    const totalM=trades.filter(t=>t.mistakes&&!t.mistakes.includes('No Mistake')&&t.mistakes.length>0);
    const thisWeekM=totalM.filter(t=>{const d=new Date(t.date);const ws=new Date();ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);return d>=ws;});
    const noM=trades.filter(t=>t.mistakes==='No Mistake'||!t.mistakes);
    const cr=trades.length>0?((noM.length/trades.length)*100).toFixed(1):100;
    c.innerHTML=`<div class="rules-compliance-grid">
        <div class="compliance-card"><div class="compliance-value" style="color:#22c55e">${cr}%</div><div class="compliance-label">Compliance Rate</div></div>
        <div class="compliance-card"><div class="compliance-value" style="color:${thisWeekM.length>0?'#ef4444':'#22c55e'}">${thisWeekM.length}</div><div class="compliance-label">Mistakes This Week</div></div>
        <div class="compliance-card"><div class="compliance-value" style="color:#6366f1">${tradingRules.length}</div><div class="compliance-label">Active Rules</div></div>
        <div class="compliance-card"><div class="compliance-value" style="color:#f59e0b">${tt.length}</div><div class="compliance-label">Today's Trades</div></div>
    </div>`;
}

// ===== TRADING SCHEDULE =====
function renderScheduleEditor(){
    const c=document.getElementById('schedule-grid');if(!c)return;
    c.innerHTML=dayNames.map((name,i)=>`
        <div class="schedule-day">
            <div class="schedule-day-name">${name}</div>
            <div class="schedule-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" id="sched-active-${i}" ${tradingSchedule[i]&&tradingSchedule[i].active?'checked':''} onchange="updateScheduleDay(${i})">
                    <span class="toggle-slider"></span>
                </label>
                <span style="font-size:13px;color:var(--text-secondary)">${tradingSchedule[i]&&tradingSchedule[i].active?'Active':'Rest'}</span>
            </div>
            <div class="schedule-day-times" id="sched-times-${i}" style="${tradingSchedule[i]&&tradingSchedule[i].active?'':'opacity:0.4;pointer-events:none'}">
                <label>From:</label>
                <input type="time" id="sched-start-${i}" value="${tradingSchedule[i]?tradingSchedule[i].start:'09:00'}">
                <label>To:</label>
                <input type="time" id="sched-end-${i}" value="${tradingSchedule[i]?tradingSchedule[i].end:'20:00'}">
            </div>
        </div>
    `).join('');
}

function updateScheduleDay(i){
    const active=document.getElementById(`sched-active-${i}`).checked;
    const times=document.getElementById(`sched-times-${i}`);
    if(times)times.style.cssText=active?'':'opacity:0.4;pointer-events:none';
    const label=document.querySelector(`#sched-active-${i}`).parentElement.nextElementSibling;
    if(label)label.textContent=active?'Active':'Rest';
}

function handleScheduleSubmit(e){
    e.preventDefault();
    for(let i=0;i<7;i++){
        const active=document.getElementById(`sched-active-${i}`)?.checked||false;
        const start=document.getElementById(`sched-start-${i}`)?.value||'09:00';
        const end=document.getElementById(`sched-end-${i}`)?.value||'20:00';
        tradingSchedule[i]={active,start,end};
    }
    saveToLocalStorage();updateScheduleDisplay();alert('✅ Schedule saved!');
}

function updateScheduleDisplay(){
    const c=document.getElementById('schedule-display');if(!c)return;
    const today=new Date().getDay();
    c.innerHTML=`<div class="mm-box"><div class="mm-box-header"><h3>📅 Week Overview</h3></div><div class="mm-box-content"><div class="schedule-week-view">
        ${dayNamesShort.map((d,i)=>`<div class="schedule-day-card ${tradingSchedule[i]&&tradingSchedule[i].active?'active':'rest'} ${i===today?'current':''}">
            <span class="schedule-day-label">${d}${i===today?' 📍':''}</span>
            ${tradingSchedule[i]&&tradingSchedule[i].active?`<span class="schedule-day-time">${tradingSchedule[i].start}-${tradingSchedule[i].end}</span>`:'<span class="schedule-day-time">Rest Day</span>'}
        </div>`).join('')}
    </div></div></div>`;
}

// ===== ACHIEVEMENTS =====
function updateAchievements(){
    const sc=document.getElementById('achievements-stats'),gc=document.getElementById('achievements-grid');if(!sc||!gc)return;
    const unlocked=achievementDefs.filter(a=>a.check()).length,total=achievementDefs.length;
    sc.innerHTML=`<div class="achievement-stat-card"><div class="achievement-stat-value">${unlocked}/${total}</div><div class="achievement-stat-label">Unlocked</div></div><div class="achievement-stat-card"><div class="achievement-stat-value">${((unlocked/total)*100).toFixed(0)}%</div><div class="achievement-stat-label">Completion</div></div><div class="achievement-stat-card"><div class="achievement-stat-value">${total-unlocked}</div><div class="achievement-stat-label">Remaining</div></div>`;
    gc.innerHTML=achievementDefs.map(a=>{const iu=a.check(),cur=a.getCurrent(),pct=Math.min((cur/a.target)*100,100);return`<div class="achievement-card ${iu?'unlocked':'locked'}"><span class="achievement-icon">${a.icon}</span><div class="achievement-info"><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.desc}</div><div class="achievement-progress-bar"><div class="achievement-progress-fill" style="width:${pct}%"></div></div><div class="achievement-status ${iu?'complete':'incomplete'}">${iu?'✅ Unlocked!':typeof cur==='number'?`${typeof cur.toFixed==='function'?cur.toFixed(cur%1?1:0):cur} / ${a.target}`:''}</div></div></div>`;}).join('');
}

// ===== PDF =====
function downloadAllTradesPDF(){
    const sorted=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!sorted.length){alert('⚠️ No trades!');return;}
    const sf=document.getElementById('filter-setup').value,af=document.getElementById('filter-asset').value,rf=document.getElementById('filter-result').value,sv=document.getElementById('search-trades').value;
    let filtered=sorted.filter(t=>(!sv||t.asset.toLowerCase().includes(sv.toLowerCase())||t.setup.toLowerCase().includes(sv.toLowerCase()))&&(!sf||t.setup===sf)&&(!af||t.asset===af)&&(!rf||t.result===rf));
    const balance=calculateCurrentBalance(),dateStr=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Trading Journal</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:13px}.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:25px 35px;display:flex;justify-content:space-between;align-items:center}.header h1{font-size:24px}.summary{display:grid;grid-template-columns:repeat(6,1fr);border-bottom:2px solid #e5e7eb}.summary-card{padding:16px;text-align:center;border-right:1px solid #e5e7eb}.summary-card .label{font-size:10px;color:#6b7280;text-transform:uppercase}.summary-card .value{font-size:18px;font-weight:700}.green{color:#16a34a}.red{color:#dc2626}.blue{color:#6366f1}.trades-container{padding:25px 35px}.trade-card{border:2px solid #e5e7eb;border-radius:10px;margin-bottom:25px;overflow:hidden;page-break-inside:avoid}.trade-card.win{border-left:6px solid #16a34a}.trade-card.loss{border-left:6px solid #dc2626}.trade-top{display:flex;flex-wrap:wrap;background:#f9fafb;border-bottom:1px solid #e5e7eb}.trade-top-item{padding:12px 14px;border-right:1px solid #e5e7eb;flex:1;min-width:80px}.trade-top-item .item-label{font-size:9px;color:#9ca3af;text-transform:uppercase}.trade-top-item .item-value{font-size:13px;font-weight:700}.notes-sec{padding:10px 14px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:12px;color:#92400e}.screenshot-section{padding:14px}.screenshot-section img{width:100%;max-height:450px;object-fit:contain;border-radius:6px;border:1px solid #e5e7eb}.no-screenshot{padding:30px;text-align:center;color:#d1d5db}.footer{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 35px;display:flex;justify-content:space-between;font-size:12px;margin-top:15px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.trade-card{page-break-inside:avoid}}</style></head><body>
    <div class="header"><div><h1>⚡ BinaryJournal Pro Elite</h1><p style="font-size:13px;opacity:.85">Trading Report</p></div><div style="text-align:right;font-size:12px"><div>📅 ${dateStr}</div><div>📊 ${filtered.length} trades</div><div>💵 $${balance.toFixed(2)}</div></div></div>
    <div class="summary"><div class="summary-card"><div class="label">Trades</div><div class="value blue">${filtered.length}</div></div><div class="summary-card"><div class="label">Wins</div><div class="value green">${filtered.filter(t=>t.result==='win').length}</div></div><div class="summary-card"><div class="label">Losses</div><div class="value red">${filtered.filter(t=>t.result==='loss').length}</div></div><div class="summary-card"><div class="label">Win Rate</div><div class="value ${filtered.length>0&&(filtered.filter(t=>t.result==='win').length/filtered.length*100)>=55?'green':'red'}">${filtered.length>0?(filtered.filter(t=>t.result==='win').length/filtered.length*100).toFixed(1):0}%</div></div><div class="summary-card"><div class="label">P&L</div><div class="value ${filtered.reduce((s,t)=>s+t.pl,0)>=0?'green':'red'}">${filtered.reduce((s,t)=>s+t.pl,0)>=0?'+':''}$${filtered.reduce((s,t)=>s+t.pl,0).toFixed(2)}</div></div><div class="summary-card"><div class="label">Balance</div><div class="value blue">$${balance.toFixed(2)}</div></div></div>
    <div class="trades-container">${filtered.map((t,i)=>{const d=new Date(t.date);return`<div class="trade-card ${t.result}"><div class="trade-top"><div class="trade-top-item"><div class="item-label">#</div><div class="item-value">${i+1}</div></div><div class="trade-top-item"><div class="item-label">Date</div><div class="item-value">${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}<br><span style="color:#6b7280;font-weight:400">${d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span></div></div><div class="trade-top-item"><div class="item-label">Asset</div><div class="item-value" style="color:#6366f1">${t.asset}</div></div><div class="trade-top-item"><div class="item-label">Expiry</div><div class="item-value">${expiryLabels[t.expiry]||t.expiry}</div></div><div class="trade-top-item"><div class="item-label">Type</div><div class="item-value">${t.optionType==='call'?'📈 CALL':'📉 PUT'}</div></div><div class="trade-top-item"><div class="item-label">Setup</div><div class="item-value">${t.setup}</div></div><div class="trade-top-item"><div class="item-label">Result</div><div class="item-value"><strong style="color:${t.pl>=0?'#16a34a':'#dc2626'}">${t.result==='win'?'✅ WIN':'❌ LOSS'} ${t.pl>=0?'+':''}$${t.pl.toFixed(2)}</strong></div></div></div>${t.notes?`<div class="notes-sec"><strong>📝</strong> ${t.notes}</div>`:''}${t.grade?`<div style="padding:8px 14px;font-size:12px;background:#f5f3ff;border-bottom:1px solid #e5e7eb"><strong>Grade:</strong> ${t.grade}${t.confidence?' | <strong>Confidence:</strong> '+t.confidence+'/10':''}${t.mistakes?' | <strong>Tags:</strong> '+t.mistakes:''}</div>`:''}<div class="screenshot-section">${t.screenshot?`<img src="${t.screenshot}" alt="Chart">`:'<div class="no-screenshot">📷 No screenshot</div>'}</div></div>`;}).join('')}</div>
    <div class="footer"><div><strong>⚡ BinaryJournal Pro Elite</strong><br>${dateStr}</div><div style="text-align:right">Trades: ${filtered.length} | WR: ${filtered.length>0?(filtered.filter(t=>t.result==='win').length/filtered.length*100).toFixed(1):0}% | P&L: ${filtered.reduce((s,t)=>s+t.pl,0)>=0?'+':''}$${filtered.reduce((s,t)=>s+t.pl,0).toFixed(2)}</div></div></body></html>`;
    const w=window.open('','_blank');if(!w){alert('⚠️ Allow popups!');return;}
    w.document.write(html);w.document.close();
    w.onload=function(){setTimeout(()=>{w.focus();w.print();},1000);};
    setTimeout(()=>{if(w&&!w.closed){w.focus();w.print();}},2000);
}
// ===== EMERGENCY DISPLAY FIX =====
function forceRefreshDisplays(){
    // Force all containers to show content
    const containers = [
        'all-trades-list',
        'setups-list', 
        'calendar-grid',
        'expiry-analysis',
        'asset-analysis',
        'session-analysis',
        'streak-analysis'
    ];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if(el && el.innerHTML.trim() === ''){
            console.warn('Empty container found:', id);
        }
    });
    
    // Re-render critical sections
    try{ renderAllTrades(); }catch(e){}
    try{ updateSetupsAnalysis(); }catch(e){}
    try{ renderCalendar(); }catch(e){}
    try{ updateDashboard(); }catch(e){}
}

// Run after page fully loads
window.addEventListener('load', function(){
    setTimeout(()=>{
        try{ forceRefreshDisplays(); }catch(e){}
    }, 500);
});
// ===== MODAL CLOSE =====
window.onclick=function(e){
    document.querySelectorAll('.modal').forEach(m=>{
        if(e.target===m){m.classList.remove('active');window.speechSynthesis.cancel();}
    });
};
// ===== PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('🔄 New version available! Refresh to update.');
                        }
                    });
                });
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}