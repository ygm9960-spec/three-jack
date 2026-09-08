(()=>{
  const DATA=window.THREE_JACKS_STORY;
  const ASSETS=window.THREE_JACKS_ASSETS || {};
  const CHARACTER_ALIASES=window.THREE_JACKS_CHARACTER_FILE_ALIASES || {};
  const BACKGROUND_ALIASES=window.THREE_JACKS_BACKGROUND_FILE_ALIASES || {};
  const STAGE=window.THREE_JACKS_STAGE || {characters:{},speakerMap:{},scenes:{},sfxRules:[]};
  const VISUALS=window.THREE_JACKS_VISUALS || {scenes:{}};
  const DIRECTOR=window.THREE_JACKS_DIRECTOR || {defaults:{supportHold:1,closeupScale:1.10,emotionalCloseupScale:1.15,partnerDimScale:.95},sceneTransitions:{},cues:{}};
  const AVAILABLE_CHARACTER_FILES=new Set(window.THREE_JACKS_AVAILABLE_CHARACTER_FILES||[]);
  const AVAILABLE_AUDIO_FILES=new Set(window.THREE_JACKS_AVAILABLE_AUDIO_FILES||[]);
  const AVAILABLE_SFX_FILES=new Set(window.THREE_JACKS_AVAILABLE_SFX_FILES||[]);
  const $=id=>document.getElementById(id);
  const studentScenes=DATA.scenes.filter(s=>!s.teacherOnly);
  const SAVE_VERSION=12;
  const SAVE_KEY='threeJacksProgress';
  const SAVE_BACKUP_KEY='threeJacksProgressBackup';
  const LEGACY_KEY='threeJacksProgressV01';
  const LAYOUT_KEY='threeJacksLayoutOverridesV15';
  const QA_KEY='threeJacksQaBookmarksV15';
  const TYPE_SPEED={dialogue:40,narration:40,stage:40,ui:40,concept:40,default:40}; // v0.18: 기묘사화 앱과 같은 기본 타자 호흡
  const CAMERA_CLASSES=[]; // v0.14: 배경은 항상 고정
  const state={
    sceneIndex:0,lineIndex:0,stageVisible:false,charactersVisible:true,visualsVisible:true,sound:true,
    typing:false,typingTimer:null,fullText:'',inputLockedUntil:0,transitioning:false,
    currentBgm:null,bgmSlot:0,lastSupportId:null,supportStack:[],logOpen:false,log:[],loggedKeys:new Set(),
    playedSfx:new Set(),characterToken:0,autoFace:true,hideUiPreview:false,supportUntilLine:-1,currentCue:null,
    lingerToken:0,pendingStateShift:null,toastTimer:null,hintShows:0,conceptSummaryVisible:false,sceneConceptSummaryShown:false,bookendToken:0,lastMotionScene:null,lastMotionLine:-99,lastMotionStrength:null,advanceGateUntil:0
  };
  const lastGoodCharacterSrc=new Map();
  let titleTaps=[];
  let transitionToken=0;
  const layoutStore=loadStored(LAYOUT_KEY,{scenes:{},prefs:{autoFace:true}});
  const qaStore=loadStored(QA_KEY,{bookmarks:[],notes:{}});
  if(!qaStore.bookmarks)qaStore.bookmarks=[];if(!qaStore.notes)qaStore.notes={};
  state.autoFace=layoutStore?.prefs?.autoFace!==false;
  const totalStoryLines=studentScenes.reduce((sum,s)=>sum+(s.lines?.length||0),0);

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const scene=()=>studentScenes[state.sceneIndex];
  const currentLine=()=>scene()?.lines[state.lineIndex];
  const chapterName=id=>DATA.chapters.find(c=>c.id===id)?.label || (id==='ch1'?'CH.1':id);
  const assetFor=s=>{const a=Object.assign({}, {background:s&&s.background,bgm:s&&s.bgm}, ASSETS[(s&&s.id)||'']||{});if(a.background)a.background=BACKGROUND_ALIASES[a.background]||a.background;return a;};
  const stageFor=s=>STAGE.scenes?.[s?.id]||{};
  const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;


  const CHARACTER_FRAME_PROFILES={
    jack_america:{default:{zoom:1.07,y:1,x:0},alert:{zoom:1.08,y:1},healthy:{zoom:1.07,y:1},shaken:{zoom:1.07,y:1},laboring:{zoom:1.08,y:2},tired:{zoom:1.07,y:1},exhausted:{zoom:1.06,y:1},sick:{zoom:1.05,y:0},weakened:{zoom:1.04,y:0},critical:{zoom:1.03,y:0},focus:{zoom:1.08,y:1}},
    jack_africa:{default:{zoom:1.07,y:1,x:0},warrior:{zoom:1.08,y:1},captured:{zoom:1.07,y:1},bound:{zoom:1.06,y:1},exhausted:{zoom:1.05,y:0},weakened:{zoom:1.05,y:0},gaunt:{zoom:1.04,y:0},gaunt_arrival:{zoom:1.03,y:0},focus:{zoom:1.08,y:1}},
    jack_europe:{default:{zoom:1.07,y:1,x:0},child:{zoom:1.05,y:0},young_hopeful:{zoom:1.07,y:1},shocked:{zoom:1.06,y:1},grieving:{zoom:1.05,y:0},hardened:{zoom:1.07,y:1},merchant:{zoom:1.08,y:1},merchant_cold:{zoom:1.08,y:1},rich:{zoom:1.08,y:1},ruined:{zoom:1.05,y:0},ruined_sick:{zoom:1.03,y:0},focus:{zoom:1.08,y:1}},
    father:{default:{zoom:1.05,y:0}},mother_ch1:{default:{zoom:1.05,y:0}},sister:{default:{zoom:1.05,y:0}},brother1:{default:{zoom:1.04,y:0}},youngest:{default:{zoom:1.03,y:0}},
    lover:{default:{zoom:1.05,y:0}},mother_ch3:{default:{zoom:1.05,y:0}},tom:{default:{zoom:1.04,y:0,x:-1}},recruiter:{default:{zoom:1.04,y:0}},market_merchant:{default:{zoom:1.04,y:0}},
    manager:{default:{zoom:1.03,y:0}},carrier:{default:{zoom:1.02,y:0}},coworker_ch1:{default:{zoom:1.02,y:0}},stranger:{default:{zoom:1.01,y:0}},amada:{default:{zoom:1.03,y:0}},captain:{default:{zoom:1.03,y:0}},supervisor_ch1:{default:{zoom:1.03,y:0}},supervisor_ch2:{default:{zoom:1.02,y:0}},pharmacist:{default:{zoom:1.02,y:0}},mentor:{default:{zoom:1.02,y:0}}
  };

  const MAJOR_SCENE_CARDS=new Set([
    'ch1-s01','ch1-end','ch2-s01','ch2-end','ch3-s01','ch3-end'
  ]);
  const CHAPTER_END_SUMMARY={
    'ch1-end':'아메리카의 잭 — 가족에게 돌아가지 못했다.',
    'ch2-end':'아프리카의 잭 — 고향은 멀어졌지만 이름은 기억했다.',
    'ch3-end':'유럽의 잭 — 돈을 얻었지만 사람을 잃었다.'
  };
  const KEY_TEST_SCENES=['prologue','ch1-s01','ch1-s03','ch1-s07','ch1-s09','ch1-end','ch2-s01','ch2-s03','ch2-s05','ch2-s08','ch2-s09','ch2-end','ch3-s01','ch3-s03','ch3-s04','ch3-s07','ch3-s09','ch3-s10','ch3-end','epilogue'];
  function paceProfile(s=scene()){
    const id=s?.id||'',ch=s?.chapter||'';
    // 타자 속도는 기묘사화 앱처럼 전 장면 동일하게 유지한다. 장면별 차이는 linger/silent만 사용.
    if(id==='prologue'||id==='epilogue')return{typing:1,linger:1,silent:1};
    if(ch==='ch1')return{typing:1,linger:1.08,silent:1.05};
    if(ch==='ch2')return{typing:1,linger:.94,silent:.94};
    if(ch==='ch3'){
      if(['ch3-s09','ch3-s10','ch3-end'].includes(id))return{typing:1,linger:1.14,silent:1.10};
      return{typing:1,linger:1.0,silent:1.0};
    }
    return{typing:1,linger:1,silent:1};
  }
  function sceneConcepts(s=scene()){return (s?.lines||[]).filter(l=>l?.type==='concept').map(l=>l.text).filter(Boolean)}
  const SCENE_TONE_CLASSES=['grade-warm','grade-uneasy','grade-labor','grade-sick','grade-africa-warm','grade-captive','grade-ocean','grade-europe-cold','grade-hardened','grade-gold','grade-collapse'];
  function sceneToneClass(s){
    const id=s?.id||'';
    if(id==='ch1-s01')return 'grade-warm';
    if(['ch1-s02','ch1-s03'].includes(id))return 'grade-uneasy';
    if(['ch1-s04','ch1-s05','ch1-s06'].includes(id))return 'grade-labor';
    if(['ch1-s07','ch1-s08','ch1-s09','ch1-end'].includes(id))return 'grade-sick';
    if(['ch2-s01','ch2-s02'].includes(id))return 'grade-africa-warm';
    if(['ch2-s03','ch2-s04','ch2-s05'].includes(id))return 'grade-captive';
    if(['ch2-s06','ch2-s07','ch2-s08','ch2-s09','ch2-end'].includes(id))return 'grade-ocean';
    if(['ch3-s01','ch3-s02','ch3-s03','ch3-s04'].includes(id))return 'grade-europe-cold';
    if(['ch3-s05','ch3-s06','ch3-s07'].includes(id))return 'grade-hardened';
    if(id==='ch3-s08')return 'grade-gold';
    if(['ch3-s09','ch3-s10','ch3-end'].includes(id))return 'grade-collapse';
    return '';
  }
  function applySceneTone(s){
    const screen=$('storyScreen');if(!screen)return;SCENE_TONE_CLASSES.forEach(c=>screen.classList.remove(c));const cls=sceneToneClass(s);if(cls)screen.classList.add(cls);
  }
  function shouldShowSceneCard(s){return Boolean(s&&MAJOR_SCENE_CARDS.has(s.id));}
  function silentPauseMs(text=''){
    if(reducedMotion())return 80;const t=text.trim();let ms=190;
    if(/문을 닫|방은 조용|눈물이|물건들을 한참|가족의 이름|빈 약병|등을 돌린다|소음 속에 사라진다/.test(t))ms=460;
    else if(/잠시|한참|꼭 쥔다|얼굴을 가린다|대답하지 못한다/.test(t))ms=320;
    return Math.round(ms*paceProfile().silent);
  }

  function sceneTransitionFor(s){
    const raw=Object.assign({style:'dissolve',duration:950},DIRECTOR.sceneTransitions?.[s?.id]||{});
    const hard=new Set(['hard-cut','hard-black','pulse-black']);
    const style=hard.has(raw.style)?'dissolve':raw.style;
    const isBookend=s?.id==='prologue'||s?.id==='epilogue';
    const isChapter=Boolean(s?.id?.endsWith('-end')||['ch1-s01','ch2-s01','ch3-s01'].includes(s?.id));
    const duration=reducedMotion()?100:1250;
    return Object.assign({},raw,{style,duration});
  }
  function manualCueFor(s,index){return DIRECTOR.cues?.[s?.id]?.[index]||{}}
  function inferLineTone(l){
    if(!l)return 'normal';
    if(l.type==='narration')return 'narration';
    if(l.type==='stage')return 'stage';
    if(l.type==='concept')return 'concept';
    if(l.type==='transition')return 'chapter';
    const t=l.text||'';
    if(/어머니|아버지|가족|집에 가|돌아가|이름은 잭|나는 잭|기억/.test(t))return 'memory';
    if(/안 돼|멈춰|살려|제발|왜|어떻게|돈이 있었으면|다시는/.test(t))return 'impact';
    if(/기한은 기한|수량이면|화물|번호|조건을 고를/.test(t))return 'cold';
    return 'normal';
  }
  function inferredCue(s,l,index){
    const out={tone:inferLineTone(l),hold:DIRECTOR.defaults?.supportHold??1,gaze:'auto'};
    if(l?.type==='dialogue'){
      const sid=resolveSpeakerId(l.speaker,s);if(sid)out.focus=sid;
    }
    return out;
  }
  function rawCueFor(s,l,index){return Object.assign({},inferredCue(s,l,index),manualCueFor(s,index))}
  function cueFor(s,l,index){
    const out=rawCueFor(s,l,index);
    if(out.closeup&&!out.forceCloseup&&index>0&&!['identity','confession','silence','epilogue'].includes(out.tone)){
      const prev=rawCueFor(s,s?.lines?.[index-1],index-1);
      if(prev?.closeup&&prev?.focus===out.focus){out.closeup=out.closeup==='emotional'?'soft':null;out.qaAdjusted=true}
      else if(index>1){const prev2=rawCueFor(s,s?.lines?.[index-2],index-2);if(prev?.closeup&&prev2?.closeup&&out.closeup==='soft'){out.closeup=null;out.qaAdjusted=true}}
    }
    return out;
  }
  function motionStrengthFor(cue,l){
    if(cue?.motionStrength)return cue.motionStrength;
    const motion=cue?.motion||'',tone=cue?.tone||inferLineTone(l);
    if(motion==='sway')return 'soft';
    if(motion==='tremble')return tone==='impact'?'medium':'soft';
    if(motion==='stagger')return tone==='impact'?'strong':'medium';
    if(motion==='recoil'&&tone==='impact')return 'strong';
    if(['identity','silence','cold'].includes(tone))return 'medium';
    return 'medium';
  }
  function dampMotionStrength(strength,steps=1){
    const levels=['soft','medium','strong'];let i=levels.indexOf(strength);if(i<0)i=1;i-=steps;return i<0?null:levels[i];
  }
  function effectiveMotionStrength(cue,l){
    let strength=motionStrengthFor(cue,l);if(cue?.forceMotion)return strength;const sid=scene()?.id||'',delta=state.lineIndex-state.lastMotionLine;
    if(state.lastMotionScene===sid&&delta>=0&&delta<=2){const steps=delta<=1?2:1;strength=dampMotionStrength(strength,steps)}
    return strength;
  }
  function isStillMoment(l,cue){
    if(!l)return false;const tone=cue?.tone||inferLineTone(l),text=l.text||'';
    if(['silence','identity','confession'].includes(tone))return true;
    return /누가 한 사람이라도 기억|내 이름은|그게 내 이름|가족에게 돌아|어머니가 사람을|왜 나는 그걸 성공|누구라도/.test(text);
  }
  function closeupMultiplier(kind){return 1} // v0.15: 확대 없이 거리·밝기·정적·캐릭터 반응으로 연출
  function applyDialogueTone(l,cue){const p=$('dialoguePanel');['tone-normal','tone-narration','tone-stage','tone-concept','tone-memory','tone-impact','tone-cold','tone-silence','tone-identity','tone-confession','tone-epilogue','tone-chapter'].forEach(c=>p.classList.remove(c));const tone=cue?.tone||inferLineTone(l);p.classList.add(`tone-${tone||'normal'}`);p.classList.toggle('director-closeup',Boolean(cue?.closeup));}

  function save(){
    const s=scene();if(!s)return;const payload={saveVersion:SAVE_VERSION,sceneId:s.id,lineIndex:state.lineIndex,narrationPage:state.narrationPage||0,updatedAt:Date.now()};
    try{const raw=JSON.stringify(payload);localStorage.setItem(SAVE_KEY,raw);localStorage.setItem(SAVE_BACKUP_KEY,raw)}catch{}
  }
  function load(){
    const normalise=(value)=>{
      if(!value?.sceneId)return null;const i=studentScenes.findIndex(s=>s.id===value.sceneId);if(i<0)return null;
      const maxLine=Math.max(0,(studentScenes[i].lines?.length||1)-1);return{saveVersion:SAVE_VERSION,sceneId:value.sceneId,lineIndex:Math.max(0,Math.min(Number(value.lineIndex)||0,maxLine)),narrationPage:Math.max(0,Number(value.narrationPage)||0)};
    };
    for(const key of [SAVE_KEY,SAVE_BACKUP_KEY]){
      try{const v=normalise(JSON.parse(localStorage.getItem(key)||'null'));if(v){localStorage.setItem(SAVE_KEY,JSON.stringify(v));return v}}catch{}
    }
    try{const legacy=normalise(JSON.parse(localStorage.getItem(LEGACY_KEY)||'null'));if(legacy){localStorage.setItem(SAVE_KEY,JSON.stringify(legacy));localStorage.setItem(SAVE_BACKUP_KEY,JSON.stringify(legacy));localStorage.removeItem(LEGACY_KEY);return legacy}}catch{}
    return null;
  }
  function clearSave(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(SAVE_BACKUP_KEY);localStorage.removeItem(LEGACY_KEY)}catch{}}
  function showScreen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active')}
  function cloneFallback(fallback){try{return typeof structuredClone==='function'?structuredClone(fallback):JSON.parse(JSON.stringify(fallback))}catch{return fallback}}
  function loadStored(key,fallback){try{const raw=localStorage.getItem(key);if(!raw)return cloneFallback(fallback);const parsed=JSON.parse(raw);return parsed&&typeof parsed==='object'?parsed:cloneFallback(fallback)}catch{return cloneFallback(fallback)}}
  function saveStored(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function ensureLayoutScene(sceneId){if(!layoutStore.scenes)layoutStore.scenes={};if(!layoutStore.scenes[sceneId])layoutStore.scenes[sceneId]={slots:{},background:{}};return layoutStore.scenes[sceneId]}
  function cleanupLayoutScene(sceneId){const bucket=layoutStore.scenes?.[sceneId];if(!bucket)return;const emptySlots=!bucket.slots||Object.keys(bucket.slots).length===0;const emptyBg=!bucket.background||Object.keys(bucket.background).length===0;if(emptySlots&&emptyBg)delete layoutStore.scenes[sceneId]}
  function persistLayoutStore(){if(!layoutStore.prefs)layoutStore.prefs={};layoutStore.prefs.autoFace=state.autoFace;saveStored(LAYOUT_KEY,layoutStore);updateLayoutStatus()}
  function defaultBackgroundLayout(s){
    const byChapter={ch1:{x:50,y:44,zoom:110},ch2:{x:50,y:45,zoom:112},ch3:{x:50,y:46,zoom:109}};
    const byScene={
      'prologue':{x:50,y:42,zoom:108},'epilogue':{x:50,y:44,zoom:110},
      'ch1-s01':{x:50,y:42,zoom:108},'ch1-s04':{x:54,y:48,zoom:116},'ch1-s06':{x:52,y:44,zoom:116},'ch1-s07':{x:51,y:45,zoom:118},'ch1-s09':{x:50,y:40,zoom:115},'ch1-end':{x:52,y:42,zoom:111},
      'ch2-s01':{x:50,y:46,zoom:108},'ch2-s03':{x:51,y:45,zoom:114},'ch2-s06':{x:52,y:44,zoom:117},'ch2-s07':{x:53,y:40,zoom:120},'ch2-s08':{x:52,y:42,zoom:118},'ch2-s09':{x:54,y:46,zoom:115},
      'ch3-s01':{x:50,y:44,zoom:111},'ch3-s02':{x:50,y:48,zoom:112},'ch3-s04':{x:49,y:43,zoom:114},'ch3-s08':{x:54,y:48,zoom:112},'ch3-s09':{x:50,y:44,zoom:116},'ch3-s10':{x:48,y:41,zoom:114}
    };
    return Object.assign({x:50,y:45,zoom:110},byChapter[s?.chapter]||{},byScene[s?.id]||{});
  }
  function defaultSlotLayout(s,pos,presence={}){
    const base={left:{x:-4,y:0,scale:0.98,flip:1},center:{x:0,y:0,scale:1,flip:1},right:{x:4,y:0,scale:0.92,flip:-1}};
    const out=Object.assign({},base[pos]||base.center);
    if(s?.chapter==='ch1'){if(pos==='left')Object.assign(out,{x:-5,y:1,scale:0.98});if(pos==='right')Object.assign(out,{x:5,y:2,scale:0.88})}
    if(s?.chapter==='ch2'){if(pos==='left')Object.assign(out,{x:-5,y:1,scale:1.0});if(pos==='right')Object.assign(out,{x:5,y:1,scale:0.9})}
    if(s?.chapter==='ch3'){if(pos==='left')Object.assign(out,{x:-4,y:1,scale:0.98});if(pos==='right')Object.assign(out,{x:5,y:2,scale:0.9})}
    if(presence.left && presence.right){if(pos==='left')Object.assign(out,{x:-5,y:1});if(pos==='right')Object.assign(out,{x:5,y:1})}
    else if(presence.left && !presence.right && pos==='left')Object.assign(out,{x:-9,y:1,scale:1.02});
    else if(!presence.left && presence.right && pos==='right')Object.assign(out,{x:9,y:1,scale:1.0});
    const tweaks={
      'ch1-s01':{left:{x:-8,y:3,scale:0.97},right:{x:8,y:4,scale:0.85}},'ch1-s03':{left:{x:-6,y:1,scale:0.98},right:{x:7,y:3,scale:0.87}},'ch1-s05':{left:{x:-6,y:2,scale:0.97},right:{x:8,y:3,scale:0.86}},'ch1-s07':{left:{x:-6,y:1,scale:0.96},right:{x:7,y:3,scale:0.86}},'ch1-s09':{left:{x:-8,y:0,scale:1.02},right:{x:8,y:2,scale:0.88}},
      'ch2-s01':{left:{x:-7,y:1,scale:1.0},right:{x:8,y:3,scale:0.87}},'ch2-s03':{left:{x:-6,y:1,scale:1.01},right:{x:8,y:3,scale:0.87}},'ch2-s05':{left:{x:-5,y:2,scale:0.98},right:{x:7,y:2,scale:0.9}},'ch2-s07':{left:{x:-7,y:1,scale:0.99},right:{x:9,y:2,scale:0.88}},'ch2-s08':{left:{x:-6,y:2,scale:1.02},right:{x:8,y:2,scale:0.86}},
      'ch3-s01':{left:{x:-5,y:1,scale:0.93},right:{x:8,y:3,scale:0.86}},'ch3-s02':{left:{x:-5,y:1,scale:0.97},right:{x:8,y:3,scale:0.86}},'ch3-s04':{left:{x:-6,y:1,scale:0.95},right:{x:8,y:3,scale:0.86}},'ch3-s06':{left:{x:-4,y:1,scale:0.97},right:{x:8,y:2,scale:0.89}},'ch3-s09':{left:{x:-6,y:1,scale:0.98},right:{x:8,y:2,scale:0.88}}
    };
    return Object.assign(out,tweaks[s?.id]?.[pos]||{});
  }
  function slotOverride(sceneId,pos){return layoutStore.scenes?.[sceneId]?.slots?.[pos]||{}}
  function backgroundOverride(sceneId){return layoutStore.scenes?.[sceneId]?.background||{}}
  function getEffectiveSlotLayout(s,pos,presence={}){return Object.assign({},defaultSlotLayout(s,pos,presence),slotOverride(s.id,pos))}
  function getEffectiveBackgroundLayout(s){return Object.assign({},defaultBackgroundLayout(s),backgroundOverride(s.id))}
  function normalizeNum(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function applyBackgroundLayout(s){const el=$('backdrop');const cfg=getEffectiveBackgroundLayout(s);el.style.backgroundPosition=`${normalizeNum(cfg.x,50)}% ${normalizeNum(cfg.y,45)}%`;el.style.backgroundSize='cover';return cfg} // v0.18: 기묘사화처럼 cover 고정, 배경 줌은 연출에 사용하지 않음
  function scenePresence(){return {left:Boolean($('charLeft').dataset.char),center:Boolean($('charCenter').dataset.char),right:Boolean($('charRight').dataset.char)}}
  function effectiveFlip(pos,presence,manualFlip,gaze='auto',isFocus=false){
    const fallback=(pos==='right'?-1:1),base=normalizeNum(manualFlip,fallback);
    if(gaze==='front')return base;
    if(gaze==='away'&&isFocus){if(pos==='left')return -1;if(pos==='right')return 1;return base}
    if((gaze==='partner'||gaze==='auto')&&state.autoFace&&presence.left&&presence.right){if(pos==='left')return 1;if(pos==='right')return -1}
    return base;
  }
  function applySlotPresentation(slot,{layout={},flip=1}={}){slot.style.setProperty('--slot-x',`${normalizeNum(layout.x,0)}%`);slot.style.setProperty('--slot-y',`${normalizeNum(layout.y,0)}%`);slot.style.setProperty('--pose-scale',String(normalizeNum(layout.scale,1)));slot.style.setProperty('--flip',String(normalizeNum(flip,1)))}
  function characterFrameProfile(id,stateName='neutral',{isFocus=false,pos='left',presence={}}={}){
    const base={zoom:1.08,y:4,x:0};
    const profile=CHARACTER_FRAME_PROFILES[id]||{};
    const out=Object.assign({},base,profile.default||{});
    if(stateName&&profile[stateName])Object.assign(out,profile[stateName]);
    if(isFocus&&profile.focus)Object.assign(out,profile.focus);
    if(pos==='center')out.zoom=Math.max(1.02,Number(out.zoom||1)-0.05);
    if(presence.left&&presence.right&&!isFocus)out.zoom=Math.max(1.01,Number(out.zoom||1)-0.02);
    out.zoom=Math.min(1.10,Math.max(1,Number(out.zoom||1)));
    return out;
  }
  function applyCharacterFrame(slot,frame={}){
    slot.style.setProperty('--img-scale',String(normalizeNum(frame.zoom,1)));
    slot.style.setProperty('--img-shift-y',`${normalizeNum(frame.y,0)}%`);
    slot.style.setProperty('--img-shift-x',`${normalizeNum(frame.x,0)}%`);
  }
  function currentSceneObj(){return studentScenes[state.sceneIndex]||scene()}
  function formatPct(v){return `${Math.round(Number(v)||0)}%`}
  function formatScale(v){return Number(v||1).toFixed(2)}
  function showToast(message,ms=1400){const t=$('appToast');if(!t)return;clearTimeout(state.toastTimer);t.textContent=message;t.classList.add('show');state.toastTimer=setTimeout(()=>t.classList.remove('show'),ms)}
  function applyViewportProfile(){
    const app=$('app');if(!app)return;const vv=window.visualViewport;
    const rawW=Math.round(vv?.width||window.innerWidth||390),rawH=Math.round(vv?.height||window.innerHeight||844);
    const w=Math.min(rawW,430),h=Math.max(560,rawH),ratio=h/Math.max(1,w);
    app.classList.toggle('compact-height',h<760);app.classList.toggle('tiny-width',w<=370);app.classList.toggle('tall-phone',h>=880);
    app.classList.toggle('qa-360',w<=372);app.classList.toggle('qa-390',w>372&&w<=400);app.classList.toggle('qa-412',w>400&&w<=430);
    app.classList.toggle('vv-short',h<700||ratio<1.72);app.classList.toggle('vv-tall',h>=900||ratio>2.18);app.classList.toggle('vv-very-tall',ratio>2.32);
    document.documentElement.style.setProperty('--vh-unit',`${h*.01}px`);
    document.documentElement.style.setProperty('--visual-h',`${h}px`);document.documentElement.style.setProperty('--visual-w',`${w}px`);document.documentElement.style.setProperty('--visual-offset-top',`${Math.max(0,Math.round(vv?.offsetTop||0))}px`);
  }
  function storyLineOrdinal(){let n=0;for(let i=0;i<state.sceneIndex;i++)n+=studentScenes[i]?.lines?.length||0;return n+state.lineIndex+1}
  function updateStoryProgress(){const bar=$('storyProgressBar');if(!bar||!totalStoryLines)return;bar.style.width=`${Math.max(0,Math.min(100,(storyLineOrdinal()/totalStoryLines)*100))}%`}
  function applyFixedDialoguePanel(){
    const p=$('dialoguePanel');if(!p)return;
    // v0.18.1: 대사 길이와 무관하게 항상 같은 높이의 대사창을 사용한다.
    ['density-short','density-medium','density-long','density-xlong','dialogue-lines-1','dialogue-lines-2','dialogue-lines-3','dialogue-lines-4'].forEach(c=>p.classList.remove(c));
    p.style.removeProperty('--dialogue-estimated-lines');
    p.classList.add('dialogue-fixed');
  }
  function nextHintLabel(){return state.hintShows<4?'탭하여 계속 ›':''}
  function setNextHint(value=null){const el=$('nextHint');if(!el)return;el.textContent=value===null?nextHintLabel():value}
  function lineLingerMs(l,cue){
    if(!l||reducedMotion())return 0;if(Number.isFinite(Number(cue?.linger)))return Math.round(Number(cue.linger)*paceProfile().linger);
    const tone=cue?.tone||inferLineTone(l);let ms=0;
    if(tone==='memory')ms=250;if(tone==='impact')ms=310;if(tone==='identity')ms=540;if(tone==='silence')ms=620;if(tone==='confession')ms=580;if(tone==='epilogue')ms=650;
    if(isStillMoment(l,cue))ms=Math.max(ms,620);if(state.lineIndex===scene()?.lines?.length-1)ms=Math.max(ms,350);
    return Math.round(ms*paceProfile().linger);
  }
  function applyLineLinger(){state.lingerToken++;$('dialoguePanel').classList.remove('linger');setNextHint()}
  function positionLearningLayers(l){
    const c=$('conceptCard'),fx=$('storyFxLayer');if(!c||!fx)return;c.classList.remove('concept-top','concept-lower');fx.classList.remove('fx-face-safe');
    if(l?.type!=='concept')return;const pres=scenePresence();const anyCharacter=pres.left||pres.center||pres.right;
    if(currentVisual()){c.classList.add('concept-lower');fx.classList.add('fx-face-safe')}else if(anyCharacter)c.classList.add('concept-top');
  }
  function bookmarkIndex(sceneId){return (qaStore.bookmarks||[]).findIndex(b=>b.sceneId===sceneId)}
  function saveQa(){saveStored(QA_KEY,qaStore)}
  function currentQaNote(){const s=currentSceneObj();return s?(qaStore.notes?.[s.id]?.text||''):''}
  function syncQaNoteInput(){const el=$('qaNoteInput');if(el)el.value=currentQaNote()}
  function saveCurrentQaNote(){
    const s=currentSceneObj(),el=$('qaNoteInput');if(!s||!el)return;const note=el.value.trim();if(!qaStore.notes)qaStore.notes={};
    if(note){qaStore.notes[s.id]={text:note,lineIndex:state.lineIndex,updatedAt:Date.now()};if(bookmarkIndex(s.id)<0)qaStore.bookmarks.push({sceneId:s.id,title:s.title,lineIndex:state.lineIndex,chapter:s.chapter});showToast('현재 장면 메모를 저장했습니다.');}
    else{delete qaStore.notes[s.id];showToast('현재 장면 메모를 비웠습니다.');}
    saveQa();renderBookmarks();buildTeacherNav();updateBookmarkButton();
  }
  function toggleCurrentBookmark(){
    const s=currentSceneObj();if(!s)return;if(!qaStore.bookmarks)qaStore.bookmarks=[];const i=bookmarkIndex(s.id);
    if(i>=0){qaStore.bookmarks.splice(i,1);showToast('문제 장면 표시를 해제했습니다.')}else{qaStore.bookmarks.push({sceneId:s.id,title:s.title,lineIndex:state.lineIndex,chapter:s.chapter});showToast('현재 장면을 ★ 표시했습니다.')}
    saveQa();renderBookmarks();buildTeacherNav();updateBookmarkButton();
  }
  function updateBookmarkButton(){const b=$('bookmarkSceneBtn'),s=currentSceneObj();if(!b||!s)return;b.textContent=bookmarkIndex(s.id)>=0?'★ 현재 장면 표시 해제':'☆ 현재 장면 문제 표시'}
  function renderBookmarks(){
    const list=$('bookmarkList');if(!list)return;list.innerHTML='';const items=qaStore.bookmarks||[];if(!items.length){list.innerHTML='<small>표시된 장면이 없습니다.</small>';return}
    items.forEach(item=>{const row=document.createElement('div');row.className='bookmark-item';const go=document.createElement('button');go.type='button';const note=qaStore.notes?.[item.sceneId]?.text||'';go.innerHTML=`<b>★ ${item.title||item.sceneId}</b><small>${item.sceneId} · 대사 ${(item.lineIndex||0)+1}</small>${note?`<em>${escapeHtml(note)}</em>`:''}`;go.onclick=()=>{const i=studentScenes.findIndex(s=>s.id===item.sceneId);if(i>=0){closeTeacher();enterScene(i,Math.max(0,item.lineIndex||0))}};const rm=document.createElement('button');rm.type='button';rm.className='bookmark-remove';rm.textContent='✕';rm.onclick=()=>{const i=bookmarkIndex(item.sceneId);if(i>=0)qaStore.bookmarks.splice(i,1);if(qaStore.notes)delete qaStore.notes[item.sceneId];saveQa();renderBookmarks();buildTeacherNav();updateBookmarkButton();syncQaNoteInput()};row.append(go,rm);list.append(row)})
  }
  function clearBookmarks(){qaStore.bookmarks=[];qaStore.notes={};saveQa();renderBookmarks();buildTeacherNav();updateBookmarkButton();syncQaNoteInput();showToast('문제 장면 표시와 메모를 모두 지웠습니다.')}

  function haptic(ms=10){try{if('vibrate' in navigator) navigator.vibrate(ms)}catch{}}
  function lockInput(ms=100){state.inputLockedUntil=Math.max(state.inputLockedUntil,Date.now()+ms)}
  function isInputLocked(){return state.transitioning||state.logOpen||Date.now()<state.inputLockedUntil}

  function setBackdrop(s){
    const el=$('backdrop');
    const filename=(s&&s.id==='prologue')?null:assetFor(s).background;
    const fallback=el.querySelector('.backdrop-fallback');
    // v0.14: 배경은 정지 이미지로만 사용한다. 줌/패닝/흔들림 애니메이션 금지.
    [...el.classList].filter(c=>c.startsWith('camera-')).forEach(c=>el.classList.remove(c));
    el.style.animation='none';el.style.transform='none';
    applyBackgroundLayout(s);
    if(filename){
      const url=`./assets/images/backgrounds/${filename}`;
      const test=new Image();
      test.onload=()=>{if(scene()?.id!==s.id)return;el.style.backgroundImage=`url("${url}")`;applyBackgroundLayout(s);fallback.style.opacity='0'};
      test.onerror=()=>{if(scene()?.id!==s.id)return;el.style.backgroundImage='';fallback.style.opacity='1'};
      test.src=url;
    }else{el.style.backgroundImage='';fallback.style.opacity='1'}
  }

  function audioEl(slot){return slot===0?$('bgmA'):$('bgmB')}
  const MUSIC_VOLUMES={"01_three_jacks_theme.mp3":0.282,"02_ch1_home.mp3":0.309,"03_ch1_silver_and_silence.mp3":0.215,"04_ch2_guns_and_march.mp3":0.364,"05_ch2_atlantic.mp3":0.236,"06_ch3_silver_city.mp3":0.269,"07_ch3_price_of_prosperity.mp3":0.309};
  let musicToken=0;
  function cancelRamp(audio){cancelAnimationFrame(audio._volumeFrame);audio._volumeFrame=null}
  function rampVolume(audio,from,to,duration,onDone){
    cancelRamp(audio);const start=performance.now();audio.volume=Math.max(0,Math.min(1,from));
    function tick(now){const p=Math.min(1,(now-start)/duration);audio.volume=Math.max(0,Math.min(1,from+(to-from)*p));if(p<1)audio._volumeFrame=requestAnimationFrame(tick);else{audio._volumeFrame=null;onDone?.()}}audio._volumeFrame=requestAnimationFrame(tick);
  }
  function stopAllAudio(){musicToken++;[audioEl(0),audioEl(1),$('sfxPlayer')].forEach(a=>{cancelRamp(a);a.pause();a.volume=0});state.currentBgm=null}
  function setBgm(s,{immediate=false,force=false}={}){
    const filename=assetFor(s).bgm;if(!state.sound||!filename||!AVAILABLE_AUDIO_FILES.has(filename)){stopAllAudio();return}
    const src='./assets/audio/'+filename;if(!force&&state.currentBgm===src&&!audioEl(state.bgmSlot).paused)return;
    const token=++musicToken,oldAudio=audioEl(state.bgmSlot),newSlot=1-state.bgmSlot,newAudio=audioEl(newSlot),volume=MUSIC_VOLUMES[filename]||.32;
    cancelRamp(newAudio);newAudio.pause();newAudio.src=src;newAudio.currentTime=0;newAudio.volume=0;newAudio.loop=true;
    state.bgmSlot=newSlot;state.currentBgm=src;
    newAudio.play().then(()=>{if(token!==musicToken||!state.sound)return;
      rampVolume(newAudio,0,volume,immediate?450:1400);
      if(!oldAudio.paused)rampVolume(oldAudio,oldAudio.volume,0,1400,()=>{oldAudio.pause()});
    }).catch(()=>{if(token===musicToken)state.currentBgm=null});
  }
  [audioEl(0),audioEl(1)].forEach(audio=>audio.addEventListener('timeupdate',()=>{if(state.sound&&audio===audioEl(state.bgmSlot)&&!audio.paused&&Number.isFinite(audio.duration)&&audio.duration>4&&audio.duration-audio.currentTime<1.5)setBgm(scene(),{force:true})}));
  // Retry a browser-blocked start on the next genuine touch, without restarting a playing track.
  document.addEventListener('pointerdown',()=>{if(state.sound&&$('storyScreen').classList.contains('active')&&(!state.currentBgm||audioEl(state.bgmSlot).paused))setBgm(scene(),{immediate:true})},{passive:true});
  function playSfx(file,{volume=.5}={}){
    if(!state.sound||!file||!AVAILABLE_SFX_FILES.has(file))return;
    const a=$('sfxPlayer');a.pause();a.src=`./assets/sfx/${file}`;a.currentTime=0;a.volume=volume;a.play().catch(()=>{});
  }
  function lineSfx(l){
    if(!l?.text)return null;
    if(l.sfx)return l.sfx;
    const rule=(STAGE.sfxRules||[]).find(r=>{try{return new RegExp(r.re).test(l.text)}catch{return false}});
    return rule?.file||null;
  }
  function triggerLineSfx(l){
    const file=lineSfx(l);if(!file)return;
    const key=`${scene()?.id}:${state.lineIndex}:${file}`;if(state.playedSfx.has(key))return;
    state.playedSfx.add(key);playSfx(file);
  }

  function clearTyping(){if(state.typingTimer){clearTimeout(state.typingTimer);state.typingTimer=null}state.typing=false}
  function completeTyping({vibrate=true}={}){
    if(!state.typing)return false;clearTyping();$('dialogueText').innerHTML=formatStoryText(state.fullText,currentLine());$('dialoguePanel').classList.remove('is-typing');if(vibrate)haptic(8);lockInput(90);applyLineLinger(currentLine(),state.currentCue);return true;
  }

  function narrationChunks(text,max=78){
    const sentences=String(text).match(/[^.!?。]+[.!?。]?[”’]?/g)||[text],chunks=[];
    for(const sentence of sentences){const t=sentence.trim();if(!t)continue;
      if(t.length>max+20){let part='';for(const word of t.split(/\s+/)){if(part&&part.length+word.length+1>max){chunks.push(part);part=word}else part+=(part?' ':'')+word}if(part)chunks.push(part)}
      else if(chunks.length&&chunks[chunks.length-1].length+t.length+1<=max)chunks[chunks.length-1]+=' '+t;else chunks.push(t);
    }return chunks.length?chunks:[''];
  }
  function narrationReady(){if(['narration','stage'].includes(currentLine()?.type)){state.narrationReadyAt=Date.now()+300;setNextHint('터치하여 계속 ›')}}

  function typeText(text,type){
    clearTyping();state.narrationReadyAt=Infinity;state.fullText=text||'';const out=$('dialogueText');
    if(!text||reducedMotion()){out.innerHTML=formatStoryText(text||'',currentLine());$('dialoguePanel').classList.remove('is-typing');setNextHint();if(text)requestAnimationFrame(()=>{applyLineLinger(currentLine(),state.currentCue);narrationReady()});return}
    let i=0;out.innerHTML='';state.typing=true;$('dialoguePanel').classList.add('is-typing');$('dialoguePanel').classList.remove('linger');setNextHint(['narration','stage'].includes(type)?'':state.hintShows<4?'탭하면 전체 문장':'');
    const waitFor=ch=>/[.!?…。？！]/.test(ch)?105:/[,，]/.test(ch)?70:40;
    const step=()=>{if(!state.typing)return;i=Math.min(text.length,i+1);out.innerHTML=formatStoryText(text,currentLine(),i);if(i<text.length){const ch=text[Math.max(0,i-1)]||'';state.typingTimer=setTimeout(step,waitFor(ch))}else{clearTyping();out.innerHTML=formatStoryText(text,currentLine());$('dialoguePanel').classList.remove('is-typing');applyLineLinger(currentLine(),state.currentCue);narrationReady()}};
    state.typingTimer=setTimeout(step,65);
  }

  function jackForChapter(ch){return ch==='ch1'?'jack_america':ch==='ch2'?'jack_africa':ch==='ch3'?'jack_europe':null}
  function resolveSpeakerId(speaker,s){
    if(!speaker)return null;
    if(speaker==='말라이카')return 'lover';
    if(speaker==='잭')return jackForChapter(s.chapter);
    if(speaker.startsWith('여동생'))return 'sister';
    if(speaker.startsWith('첫째 남동생'))return 'brother1';
    const keyed=STAGE.speakerMap?.[`${speaker}@${s.chapter}`];if(keyed)return keyed;
    return STAGE.speakerMap?.[speaker]||null;
  }
  function inferEmotion(text,stateName=''){
    const t=text||'';
    if(/울|눈물|미안|그리워|돌아가|없네|외롭|사라/.test(t))return 'sad';
    if(/안 돼|놔줘|하지 마|분노|화를|끝이야|빼앗/.test(t))return 'angry';
    if(/살려|무서|두려|겁|떨|습격|끌려/.test(t))return 'fear';
    if(/반드시|기억|내 이름|다시는|돌아갈|지켜/.test(t))return 'determined';
    if(/sick|critical|gaunt|weakened|exhausted|ruined_sick/.test(stateName))return 'weak';
    return 'neutral';
  }
  function characterCandidates(id,stateName,emotion){
    const c=STAGE.characters?.[id];if(!c)return[];const base=c.base;
    const arr=[];
    if(stateName&&emotion&&emotion!=='neutral')arr.push(`${base}_${stateName}_${emotion}.webp`);
    if(stateName)arr.push(`${base}_${stateName}.webp`);
    if(emotion&&emotion!=='neutral')arr.push(`${base}_${emotion}.webp`);
    arr.push(`${base}.webp`);const mapped=arr.map(f=>(CHARACTER_ALIASES[f]||f).replace(/^(ch1_manager|ch1_supervisor|ch2_captain|ch2_euro_trader|ch2_lover_panicked)\.webp$/,'$1.png'));const unique=[...new Set(mapped)];return AVAILABLE_CHARACTER_FILES.size?unique.filter(f=>AVAILABLE_CHARACTER_FILES.has(f)):unique;
  }
  const PORTRAIT_BOUNDS={"africa_jack.webp":[900,1300,224,86,527,1211],"africa_jack_bound.webp":[900,1300,157,136,666,1164],"africa_jack_captured.webp":[900,1300,9,126,800,1174],"africa_jack_gaunt.webp":[900,1300,164,134,657,1166],"africa_jack_weakened.webp":[900,1300,163,128,661,1172],"america_jack.webp":[900,1300,144,128,693,1172],"america_jack_critical.webp":[900,1300,203,129,624,1171],"america_jack_sick.webp":[900,1300,221,93,627,1207],"america_jack_tired.webp":[900,1300,245,129,464,1166],"ch1_brother1.webp":[900,1300,165,174,618,1126],"ch1_carrier.webp":[900,1300,141,22,713,1278],"ch1_coworker.webp":[900,1300,141,30,641,1270],"ch1_father.webp":[900,1300,100,126,780,1174],"ch1_mother.webp":[900,1300,137,127,672,1173],"ch1_sister.webp":[900,1300,235,161,578,1139],"ch1_youngest.webp":[900,1300,266,341,418,959],"ch2_lover.webp":[900,1300,205,156,616,1144],"ch2_stranger.webp":[900,1300,188,32,542,1268],"ch2_supervisor.webp":[900,1300,33,22,843,1278],"ch3_mentor.webp":[900,1300,35,43,839,1257],"ch3_mother.webp":[900,1300,82,167,751,1133],"ch3_pharmacist.webp":[900,1300,62,32,774,1268],"ch3_recruiter.webp":[900,1300,19,131,869,1169],"ch3_tom.webp":[900,1300,116,143,643,1157],"europe_jack.webp":[900,1300,244,88,499,1202],"europe_jack_child.webp":[900,1300,74,116,753,1184],"europe_jack_grieving.webp":[900,1300,83,132,749,1168],"europe_jack_hardened.webp":[900,1300,68,70,786,1230],"europe_jack_rich.webp":[900,1300,36,60,828,1240],"europe_jack_ruined.webp":[900,1300,60,118,778,1182],"europe_jack_ruined_sick.webp":[900,1300,67,147,769,1142],"ch1_supervisor.png":[1086,1448,0,0,1086,1448],"ch2_captain.png":[1086,1448,0,0,1086,1448],"ch2_euro_trader.png":[1086,1448,0,0,1086,1448],"ch1_manager.png":[1086,1448,0,0,1086,1448],"ch2_lover_panicked.png":[1086,1448,0,0,1086,1448]};
  const PORTRAIT_HEADS={"africa_jack":[450,121,245],"africa_jack_bound":[454,186,365],"africa_jack_captured":[455,176,355],"africa_jack_gaunt":[455,183,355],"africa_jack_weakened":[455,178,355],"america_jack":[480,186,390],"america_jack_tired":[445,170,315],"america_jack_critical":[450,179,355],"america_jack_sick":[460,146,335],"ch1_brother1":[450,231,435],"ch1_carrier":[430,86,315],"ch1_coworker":[485,98,340],"ch1_father":[470,190,415],"ch1_mother":[470,187,400],"ch1_sister":[465,222,440],"ch1_youngest":[480,420,620],"ch2_lover":[405,218,440],"ch2_stranger":[450,98,330],"ch2_supervisor":[465,92,340],"ch3_mentor":[460,112,355],"ch3_mother":[480,227,440],"ch3_pharmacist":[460,101,345],"ch3_recruiter":[460,192,410],"ch3_tom":[470,198,395],"europe_jack":[480,124,250],"europe_jack_child":[480,173,375],"europe_jack_grieving":[480,187,380],"europe_jack_hardened":[475,131,345],"europe_jack_rich":[475,122,340],"europe_jack_ruined":[475,179,395],"europe_jack_ruined_sick":[485,207,420],"ch1_supervisor":[558,90,330],"ch2_captain":[590,202,480],"ch2_euro_trader":[545,92,377],"ch1_manager":[570,160,425],"ch2_lover_panicked":[578,151,456]};
  function cropPortrait(img){
    const file=decodeURIComponent(img.src.split('/').pop()),bounds=PORTRAIT_BOUNDS[file],head=PORTRAIT_HEADS[file.replace(/\.(webp|png)$/,'')];if(!bounds||!head)return;
    if(!img.isConnected||!img.parentElement?.parentElement)return;
    const figure=img.parentElement,slot=figure.parentElement,screen=$('app'),child=slot.dataset.char==='youngest';
    const headHeight=Math.min(screen.clientWidth*.195,screen.clientHeight*.1014)*(child?.9:slot.dataset.char==='brother1'?.86:1);
    const scale=headHeight/(head[2]-head[1]);
    const headTop=Math.max(18,figure.clientHeight*.16)+Math.min(screen.clientWidth*.25,screen.clientHeight*.13)*.22+(child?headHeight*.48:slot.dataset.char==='brother1'?headHeight*.3:0);
    const styles={width:bounds[0]*scale+'px',height:bounds[1]*scale+'px',left:(figure.clientWidth/2-head[0]*scale)+'px',top:(headTop-head[1]*scale)+'px','max-width':'none','max-height':'none'};
    for(const [key,value]of Object.entries(styles))img.style.setProperty(key,value,'important');
    img.dataset.headHeight=headHeight.toFixed(2);
  }
  window.addEventListener('resize',()=>document.querySelectorAll('.character-img').forEach(cropPortrait));
  const MASKED_PORTRAITS=new Set([]); /* baked PNG alpha */ const UNUSED_MASK_FILES=new Set(["ch1_supervisor.png","ch2_captain.png","ch2_euro_trader.png","ch1_manager.png","ch2_lover_panicked.png"]);
  function applyPortraitMask(img,file){
    const url=MASKED_PORTRAITS.has(file)?'url("'+window.THREE_JACKS_PORTRAIT_MASKS[file]+'")':'none';
    img.style.maskImage=url;img.style.webkitMaskImage=url;img.style.maskMode='luminance';img.style.maskSize='100% 100%';img.style.webkitMaskSize='100% 100%';img.style.maskRepeat='no-repeat';
  }
  function loadCharacterImage(img,fallback,candidates,characterId=''){
    let i=0;img.decoding='async';
    const tryNext=()=>{
      if(i>=candidates.length){
        const last=lastGoodCharacterSrc.get(characterId);
        if(last&&img.src!==last){img.src=last;return}
        img.classList.add('hidden');fallback.classList.remove('hidden');return;
      }
      const filename=candidates[i++];applyPortraitMask(img,filename);img.src=`./assets/images/characters/${filename}`;
    };
    img.onload=()=>{if(!img.isConnected)return;cropPortrait(img);if(characterId)lastGoodCharacterSrc.set(characterId,img.src);img.classList.remove('hidden');fallback.classList.add('hidden');img.decode?.().catch(()=>{})};
    img.onerror=tryNext;tryNext();
  }
  function slotEl(pos){return pos==='left'?$('charLeft'):pos==='right'?$('charRight'):$('charCenter')}
  function fillSlot(pos,id,{active=false,stateName='neutral',emotion='neutral',layout=null,flip=1,frame=null}={}){
    const slot=slotEl(pos),c=STAGE.characters?.[id];
    if(!id||!c){slot.replaceChildren();slot.dataset.char='';slot.dataset.asset='';slot.className='character-slot slot-'+pos;return}
    const asset=characterCandidates(id,stateName,emotion)[0]||'';
    const changed=slot.dataset.char!==id;
    if(changed){
      slot.innerHTML='<div class="character-figure"><img class="character-img" alt=""><div class="character-fallback hidden"><span class="fallback-mark"></span><small></small></div></div>';
      slot.querySelector('.fallback-mark').textContent=(c.label||c.name||'?').slice(0,1);
      slot.querySelector('small').textContent=c.label||c.name||'';
    }
    slot.className='character-slot slot-'+pos;
    slot.dataset.char=id;slot.dataset.state=stateName;slot.dataset.emotion=emotion;
    slot.classList.toggle('active-speaker',active);slot.classList.toggle('inactive-speaker',!active);
    const img=slot.querySelector('img');img.alt=c.label||c.name||'';
    if(changed||slot.dataset.asset!==asset){loadCharacterImage(img,slot.querySelector('.character-fallback'),characterCandidates(id,stateName,emotion),id);slot.dataset.asset=asset}
    applySlotPresentation(slot,{layout:layout||defaultSlotLayout(scene(),pos,scenePresence()),flip});
    applyCharacterFrame(slot,frame||{zoom:1,y:0,x:0});if(img.complete)cropPortrait(img);
  }
  function clearCharacterMotionClasses(slot){
    if(!slot)return;['motion-recoil','motion-jolt','motion-tremble','motion-stagger','motion-sway','motion-stepback','motion-strength-soft','motion-strength-medium','motion-strength-strong'].forEach(c=>slot.classList.remove(c));
    ['--motion-x','--motion-rot','--motion-duration','--jolt-a','--jolt-b','--jolt-c','--tremble-a','--tremble-b','--tremble-c','--sway-a','--sway-b'].forEach(p=>slot.style.removeProperty(p));
  }
  function motionTargetSlots(cue,l){
    const slots=['left','center','right'].map(slotEl).filter(Boolean);
    const target=cue?.motionTarget||cue?.focus||'focus';
    if(target==='all')return slots.filter(s=>s.dataset.char);
    if(target==='focus'){const fid=cue?.focus||(l?.type==='dialogue'?resolveSpeakerId(l.speaker,scene()):stageFor(scene())?.protagonist);return slots.filter(s=>s.dataset.char===fid)}
    return slots.filter(s=>s.dataset.char===target);
  }
  function playCharacterMotion(l,cue,{retry=true}={}){
    if(reducedMotion()||!l.urgent)return;
    const slots=[...document.querySelectorAll('#characterLayer .character-slot[data-char]')].filter(x=>x.dataset.char);
    slots.forEach(slot=>{slot.getAnimations().filter(x=>x.id==='urgent').forEach(x=>x.cancel());const motion=slot.animate([{translate:'0 0'},{translate:'-12px 3px'},{translate:'11px -3px'},{translate:'-9px 2px'},{translate:'8px -2px'},{translate:'-5px 1px'},{translate:'0 0'}],{duration:650,iterations:2,easing:'linear'});motion.id='urgent'});
    haptic([90,45,120,40,90]);state.lastMotionStrength='strong';state.lastMotionScene=scene().id;state.lastMotionLine=state.lineIndex;
  }
  function tuneConversationLayout(layout,pos,presence,cue){
    const out=Object.assign({},layout);if(!(presence.left&&presence.right))return out;const tone=cue?.tone||'normal';let shift=0;
    if(['impact','identity'].includes(tone))shift=1.4;else if(['memory','confession'].includes(tone))shift=.7;else if(['cold','silence'].includes(tone))shift=-1.2;
    if(cue?.gaze==='away')shift=-1.6;if(pos==='left')out.x=Number(out.x||0)+shift;if(pos==='right')out.x=Number(out.x||0)-shift;return out;
  }
  const SCENE_SUPPORT_CAST={
    'ch1-s01':['youngest','brother1'],'ch1-s03':['father','sister'],'ch1-s05':['carrier','sister'],'ch1-s07':['coworker_ch1','supervisor_ch1'],
    'ch2-s01':['lover','child_ch2'],'ch2-s05':['euro_trader','trader'],'ch2-s08':['stranger','captain'],
    'ch3-s01':['mother_ch3','pharmacist'],'ch3-s02':['recruiter','tom'],'ch3-s09':['tom','accountant']
  };
  function preferredSceneSupportCast(s,protagonist,hasRenderableAsset){
    const manual=(SCENE_SUPPORT_CAST[s?.id]||[]).filter(id=>id!==protagonist&&hasRenderableAsset(id));
    if(manual.length)return manual.slice(0,2);
    const count=new Map(),first=new Map();let order=0;
    (s?.lines||[]).forEach(l=>{if(l?.type!=='dialogue')return;const id=resolveSpeakerId(l.speaker,s);if(!id||id===protagonist||!hasRenderableAsset(id))return;if(!first.has(id))first.set(id,order++);count.set(id,(count.get(id)||0)+1)});
    return [...count.keys()].sort((a,b)=>(count.get(b)-count.get(a))||((first.get(a)||0)-(first.get(b)||0))).slice(0,2);
  }

  function renderCharacters(l){
    const layer=$('characterLayer');
    if(!state.charactersVisible){layer.classList.add('characters-hidden');return}else layer.classList.remove('characters-hidden');
    const s=scene(),cfg=stageFor(s),states=cfg.states||{},protagonist=cfg.protagonist||null;
    const cue=state.currentCue||cueFor(s,l,state.lineIndex);state.currentCue=cue;
    const speakerId=l?.type==='dialogue'?resolveSpeakerId(l.speaker,s):null;
    const hasRenderableAsset=id=>{if(!id)return false;const st=states[id]||'neutral';return characterCandidates(id,st,'neutral').length>0};
    const protagonistRenderable=hasRenderableAsset(protagonist),speakerRenderable=hasRenderableAsset(speakerId);

    // Keep the current conversation partner only; reports are shown as memories.
    const prior=s.lines.slice(0,state.lineIndex).reverse().find(x=>x.type==='dialogue'||x.type==='stage'||x.type==='narration');
    let support=speakerId&&speakerId!==protagonist?speakerId:null;
    if(speakerId===protagonist&&prior?.type==='dialogue'&&!/전언|회상|편지/.test(prior.speaker||'')){
      const last=resolveSpeakerId(prior.speaker,s);if(last!==protagonist)support=last;
    }
    let left=protagonistRenderable?protagonist:null,right=hasRenderableAsset(support)?support:null,center=null;
    if(!left&&speakerRenderable){center=speakerId;right=null}
    if(cue.forceSolo)right=null;
    const presence={left:Boolean(left),right:Boolean(right),center:Boolean(center)};
    layer.classList.toggle('triple-cast',Boolean(left&&center&&right));layer.classList.toggle('single-cast',Boolean(left&&!center&&!right));
    const focusId=cue.focus||speakerId||protagonist;
    const setup=(id,active,pos)=>{
      if(!id)return null;
      const st=states[id]||'neutral';
      const layout={x:0,y:0,scale:1,flip:pos==='right'?-1:1};
      const isFocus=id===focusId;
      // 확대 연출은 쓰지 않고, 3인일 때만 화면 겹침 방지를 위해 소폭 축소한다.
      layout.scale=Math.min(1.04,Number(layout.scale||1)*(presence.center?0.90:1));
      if(presence.center){
        if(pos==='left')layout.x=Number(layout.x||0)-1.5;
        if(pos==='center')layout.x=Number(layout.x||0)+1;
        if(pos==='right')layout.x=Number(layout.x||0)+1.5;
      }
      const gaze=cue.gaze||'auto';
      const emotion=isFocus?(cue.emotion||inferEmotion(l?.text,st)):'neutral';
      const resolvedState=cue.stateName&&isFocus?cue.stateName:st;
      const frame=characterFrameProfile(id,resolvedState,{isFocus:false,pos,presence});
      return{id,active:(isFocus&&(Boolean(speakerId)||Boolean(cue.focus)))||active,stateName:resolvedState,emotion,layout,flip:effectiveFlip(pos,presence,layout.flip,gaze,isFocus),isFocus,frame};
    };
    const L=setup(left,speakerId===left,'left'),R=setup(right,speakerId===right,'right'),C=setup(center,speakerId===center,'center');
    fillSlot('left',L?.id,L||{layout:getEffectiveSlotLayout(s,'left',presence),flip:effectiveFlip('left',presence,1,cue.gaze,false),frame:{zoom:1,y:0,x:0}});
    fillSlot('right',R?.id,R||{layout:getEffectiveSlotLayout(s,'right',presence),flip:effectiveFlip('right',presence,-1,cue.gaze,false),frame:{zoom:1,y:0,x:0}});
    fillSlot('center',C?.id,C||{layout:getEffectiveSlotLayout(s,'center',presence),flip:effectiveFlip('center',presence,1,cue.gaze,true),frame:{zoom:1,y:0,x:0}});
    ['left','right','center'].forEach(pos=>slotEl(pos).classList.toggle('memory-portrait',slotEl(pos).dataset.char===speakerId&&/전언|회상|편지/.test(l?.speaker||'')));
    layer.classList.toggle('narration-mode',!speakerId);
    layer.classList.toggle('emotional-focus',false);
    layer.classList.toggle('soft-focus',false);
    layer.classList.toggle('still-moment',isStillMoment(l,cue));
    if(state.pendingStateShift&&[L?.id,R?.id,C?.id].includes(state.pendingStateShift))state.pendingStateShift=null;
    syncLayoutEditor();syncDirectorStatus();
  }


  function h(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
  function fxCard(title,{light=false}={}){const c=h('div',`fx-card${light?' fx-light':''}`);c.appendChild(h('div','fx-title',title||''));return c}
  const HIDDEN_VISUAL_TYPES=new Set(['familyStatus','bodyArc','displacement','nameMemory','darkTurn','dualGauge','betrayal','collapse','lonelyRoom','worldNetwork','epilogueThreads','africaFocus','triangleLedger','shipHold','identity']);
  function currentVisual(){if(currentLine()?.visual==='traffickingGrowth')return{type:'traffickingGrowth',data:{title:'대서양으로 끌려간 아프리카인'}};const s=scene(),cfg=VISUALS.scenes?.[s?.id];if(!cfg)return null;const hits=(cfg.ranges||[]).filter(r=>state.lineIndex>=r.from&&state.lineIndex<=r.to&&!HIDDEN_VISUAL_TYPES.has(r.type));return hits.length?hits[hits.length-1]:null}
  function bar(label,value,{danger=false,safe=false,suffix=''}={}){const row=h('div','gauge-row');row.append(h('b','',label));const track=h('div',`fx-bar${danger?' danger':''}${safe?' safe':''}`);const fill=h('i');fill.style.width=`${Math.max(0,Math.min(100,value))}%`;track.append(fill);row.append(track);row.append(h('em','',suffix||`${Math.round(value)}%`));return row}
  function familyData(phase){
    if(phase==='split')return [['잭','은광으로 분리','warn'],['아버지','은광으로 분리','warn'],['어머니','플랜테이션','warn'],['여동생','플랜테이션','warn'],['첫째','막내를 지키려 함','warn'],['막내','가족과 분리 위기','danger']];
    if(phase==='messages')return [['잭','은광 노동 · 귀향 약속','warn'],['아버지','은광 사고 · 다리 부상','danger'],['어머니','플랜테이션 · 고열','danger'],['여동생','손이 아픈 채 노동','warn'],['첫째','막내와 함께 있음','warn'],['막내','첫째가 돌봄','warn']];
    return [['잭','고열 · 가족에게 돌아가려 함','danger'],['아버지','부상 악화 · 소식 희미','danger'],['어머니','농장 질병 · 중병','danger'],['여동생','어머니 몫까지 노동','danger'],['첫째','다른 농장으로 이동','lost'],['막내','첫째와 이동 · 소식 단절','lost']];
  }
  function renderWorldNetwork(card,epilogue=false){const tr=h('div','world-track');[['아메리카','은·설탕'],['아프리카','사람·총기'],['유럽','자본·상품']].forEach((x,i)=>{const n=h('div',`world-node active`);n.append(h('div','world-dot',x[0].slice(0,2)),h('small','',x[0]));tr.append(n);if(i<2)tr.append(h('div','world-line'))});card.append(tr);if(epilogue){const cards=h('div','epilogue-cards');[['아메리카의 잭','가족에게 돌아가지 못함'],['아프리카의 잭','이름을 끝까지 기억함'],['유럽의 잭','부를 얻고 사람을 잃음']].forEach(x=>{const d=h('div','ep-jack');d.append(h('strong','',x[0]),document.createTextNode(x[1]));cards.append(d)});card.append(cards)}else card.append(h('div','fx-sub','세 사람은 서로를 모르지만 같은 바닷길의 욕망으로 연결된다.'))}
  function renderFamily(card,phase){const b=h('div','family-board');familyData(phase).forEach(([name,st,cls])=>{const d=h('div',`family-person ${cls}`);d.append(h('div','family-icon','●'));const t=h('div');t.append(h('b','',name),h('small','',st));d.append(t);b.append(d)});card.append(b)}
  function renderPopulation(card){
    card.classList.add('population-finale');
    [['자료 A',887,67],['자료 B',2500,107]].forEach(([label,before,after])=>{
      const row=h('div','population-row'),track=h('div','population-track'),fill=h('div','population-after'),number=h('div','population-num');
      row.append(h('strong','',label));track.append(fill);row.append(track,number);card.append(row);
      const start=performance.now(),duration=reducedMotion()?1:4200;
      function frame(now){if(!card.isConnected)return;const p=Math.min(1,(now-start)/duration),e=p*p*(3-2*p),n=Math.round(before+(after-before)*e);
        fill.style.width=(n/before*100)+'%';number.textContent=before+'만 → '+n+'만';if(p<1)requestAnimationFrame(frame)}requestAnimationFrame(frame);
    });
    card.append(h('div','population-drop','가혹한 노동 · 전염병 → 원주민 인구 급감'),h('div','fx-sub','수업 자료의 시작·끝 수치 · 중간 변화는 이해를 돕는 연출'));
  }
  function renderLaborLedger(card){const g=h('div','ledger-grid');[['광산 노동 인원','▼▼▼','ledger-down'],['플랜테이션 노동 인원','▼▼▼','ledger-down'],['은 생산 목표','유지','ledger-hold'],['상품작물 생산 목표','유지','ledger-hold']].forEach(([a,b,c])=>{g.append(h('span','',a),h('b',c,b))});card.append(g,h('div','fx-sub','사람이 줄어도 생산을 줄이지 않으려는 욕망이 노동력 부족을 만든다.'))}
  function renderAfrica(card){const m=h('div','africa-map');m.append(h('div','continent-dot america','아메리카'),h('div','ocean-label','대서양'),h('div','africa-arrow'),h('div','continent-dot africa','아프리카'));card.append(m,h('div','fx-sub','관리인의 시선이 대서양 너머 아프리카로 향한다.'))}
  function renderBodyArc(card,phase){const arc=h('div','body-arc');let weak=phase!=='warrior';const a=h('div','body-state strong');const af=h('div','body-figure');af.append(h('div','body-sil'));a.append(af,h('b','', '마을의 잭'),h('small','','넓은 어깨 · 강한 팔'));const mid=h('div','fx-arrow','→');const b=h('div',`body-state ${weak?'weak':'strong'}`);const bf=h('div','body-figure');bf.append(h('div','body-sil'));b.append(bf,h('b','',weak?'대서양의 잭':'건장한 전사'),h('small','',weak?'야윈 얼굴 · 줄어든 힘':'사람들을 지키는 몸'));arc.append(a,mid,b);card.append(arc);if(weak)card.append(h('div','fx-sub','몸은 약해져도 “나는 누구인가”를 잊지 않으려 한다.'))}
  function renderDisplacement(card){const d=h('div','displace-track');[['마을','●●●●●','home-cluster'],['강제 이동','●●●●','march-cluster'],['해안','●●','coast-cluster']].forEach((x,i)=>{const n=h('div',x[2]);n.append(h('div','people-icons',x[1]),h('div','cluster-label',x[0]));d.append(n);if(i<2)d.append(h('span','fx-arrow','→'))});card.append(d,h('div','fx-sub','행렬이 갈라질 때마다 익숙한 목소리와 관계가 하나씩 끊어진다.'))}
  function renderShip(card,phase){const grid=h('div','ship-grid');const total=48,filled=phase==='packed'?46:34;for(let i=0;i<total;i++)grid.append(h('span',`ship-person${i<filled?' filled':''}`));card.append(grid);const st=h('div','ship-stat');st.append(h('b','',phase==='packed'?'탑승 인원 ▲▲▲':'탑승 인원 ▲▲'),h('b','',phase==='packed'?'개인 공간 ▼▼▼':'개인 공간 ▼▼'));card.append(st,h('div','fx-sub','정확한 인원 수가 아니라 “더 많이 싣기”의 구조를 보여 주는 개념 연출'))}
  function renderNameMemory(card){const w=h('div','name-wall');[['장부','숫자','number'],['기억','아마다 · 잭 · 이름들','name']].forEach(([a,b,c])=>{const d=h('div',`name-box ${c}`);d.append(h('div','label',a),h('div','main',b));w.append(d)});card.append(w,h('div','name-pulse','“누가 한 사람이라도 기억해야 하니까.”'))}
  function renderIdentity(card){const w=h('div','name-wall');const n=h('div','name-box number');n.append(h('div','label','감독의 장부'),h('div','main','번호'));const j=h('div','name-box name');j.append(h('div','label','잭의 기억'),h('div','main','잭'));w.append(n,j);card.append(w,h('div','name-pulse','이름 말고 번호.  ↔  “내 이름은 잭이야.”'))}

  function renderTrafficking(card){
    card.classList.add('trafficking-chart');const rows=h('div','trafficking-bars');
    const series=[['16세기',277505],['17세기',1875634],['18세기',6494619]];
    series.forEach(([label,value],i)=>{const row=h('div','trafficking-column'),track=h('div','trafficking-track'),fill=h('i'),number=h('b');track.append(fill);row.append(number,track,h('small','',label));rows.append(row);
      const start=performance.now(),duration=reducedMotion()?1:4200;function frame(now){if(!card.isConnected)return;const p=Math.min(1,Math.max(0,(now-start-i*300)/duration)),e=p*p*(3-2*p);fill.style.height=(value/6494619*e*100)+'%';number.textContent=(value*e/10000).toFixed(1)+'만';if(p<1)requestAnimationFrame(frame)}requestAnimationFrame(frame)});
    card.append(rows,h('div','fx-sub','세기별 아프리카 출항 인원 추정치 · 누적 인구 아님'));
    const link=h('a','graph-source','자료: SlaveVoyages');link.href='https://legacy.slavevoyages.org/assessment/estimates';link.target='_blank';link.rel='noopener';link.addEventListener('click',e=>e.stopPropagation());card.append(link);
  }

  function renderTriangle(card){const box=h('div','triangle-box');[['유럽','직물·금속·총기','tri-europe'],['아프리카','강제로 끌려간 사람','tri-africa'],['아메리카','은·설탕·담배','tri-america']].forEach(([a,b,c])=>{const n=h('div',`tri-node ${c}`);n.append(h('b','',a),h('small','',b));box.append(n)});box.append(h('div','tri-path path-ea','↙'),h('div','tri-path path-aa','→'),h('div','tri-path path-au','↖'));card.append(box)}
  function renderPrice(card){const row=h('div','price-row');const before=h('div','price-item');before.append(h('b','','예전의 같은 동전'));const pb=h('div','portion big');before.append(pb,h('div','medicine'));const coin=h('div','price-coin','● →');const after=h('div','price-item');after.append(h('b','','오른 물가'));after.append(h('div','portion small'),h('div','medicine small'));row.append(before,coin,after);card.append(row,h('div','price-note','같은 돈 → 살 수 있는 빵·약의 양 감소'),h('div','fx-sub','아메리카산 은의 대량 유입과 유럽의 장기적 물가 상승: 가격혁명'))}
  function renderDarkTurn(card){const t=h('div','turn-chain');['상처','분노','다시는 당하지 않겠다','먼저 빼앗는다'].forEach((x,i)=>{t.append(h('div','turn-step',x));if(i<3)t.append(h('span','fx-arrow','→'))});card.append(t)}
  function renderDual(card,phase){const vals=phase==='rise2'?[94,18]:[63,46];card.append(bar('재산',vals[0],{safe:true,suffix:phase==='rise2'?'▲▲▲':'▲'}),bar('신뢰',vals[1],{danger:true,suffix:phase==='rise2'?'▼▼▼':'▼'}));card.append(h('div','fx-sub',phase==='rise2'?'돈은 늘었지만 사람과의 관계는 거의 남지 않았다.':'어린 시절 자신에게 했던 말을 이제 잭이 약한 상인에게 되풀이한다.'))}
  function renderBetrayal(card){const t=h('div','betrayal-track');const a=h('div','betray-person');a.append(h('b','','과거의 잭'),h('small','','위험을 숨긴 투자에 속음'));const b=h('div','betray-person broken');b.append(h('b','','톰'),h('small','','가족 돈을 잃고 관계 단절'));t.append(a,h('span','fx-arrow','→ 같은 수법 →'),b);card.append(t,h('div','fx-sub','피해자가 된 기억이 다른 사람을 속이는 면죄부로 변한다.'))}
  function renderTriangleLedger(card){renderTriangle(card);card.append(h('div','fx-sub','금빛 장부 한 페이지 안에 상품·사람·은이 같은 숫자로 기록된다.'))}
  function renderCollapse(card,phase){const m=h('div','collapse-metrics');const vals=phase==='credit'?[['재산','▼','zero'],['신용','0','zero'],['위험','▲▲▲','']]:[['재산','▼▼▼','zero'],['신용','0','zero'],['주변 사람','0','zero']];vals.forEach(([a,b,c])=>{const d=h('div',`collapse-metric ${c}`);d.append(h('b','',b),h('small','',a));m.append(d)});card.append(m);if(phase==='people'){const doors=h('div','door-row');for(let i=0;i<3;i++)doors.append(h('div','door closed'));card.append(doors,h('div','fx-sub','작은 상인 · 옛 동업자 · 톰, 차례로 문이 닫힌다.'))}else card.append(h('div','fx-sub','신용이 성장의 지렛대였다면, 위기에는 손실을 증폭시키는 지렛대가 된다.'))}
  function renderLonely(card){const g=h('div','lonely-items');[['●','어린 시절 동전'],['▥','어머니의 빈 약병'],['▤','금빛 장부']].forEach(([o,t])=>{const d=h('div','lonely-item');d.append(h('div','obj',o),h('b','',t));g.append(d)});card.append(g,h('div','fx-sub','많은 것을 소유했지만 마지막 방에는 찾아오는 사람이 없다.'))}
  function renderChain(card){const c=h('div','causal-chain');['은 유입','물가 상승','대서양 무역','상업혁명','주식회사·금융'].forEach((x,i)=>{c.append(h('div','cause',x));if(i<4)c.append(h('span','cause-arrow','›'))});card.append(c)}
  function renderStoryFx(){
    const layer=$('storyFxLayer'),v=currentVisual(),key=scene()?.id+':'+JSON.stringify(v);
    layer.classList.toggle('fx-hidden',!state.visualsVisible);if(!state.visualsVisible)return;
    if(layer.dataset.visualKey===key)return;layer.dataset.visualKey=key;clearTimeout(state.visualTimer);layer.innerHTML='';if(!v)return;
    const card=fxCard(v.data?.title||'',{light:false});
    if(v.type==='priceRevolution'){card.classList.add('price-compact');const owner=key;state.visualTimer=setTimeout(()=>{if(layer.dataset.visualKey!==owner)return;card.animate([{opacity:1},{opacity:0}],{duration:reducedMotion()?1:650,fill:'forwards'}).finished.then(()=>card.remove()).catch(()=>{})},5200)}
    switch(v.type){
      case 'traffickingGrowth':renderTrafficking(card);break;case 'worldNetwork':renderWorldNetwork(card,false);break;case 'familyStatus':renderFamily(card,v.data?.phase);break;case 'populationDecline':renderPopulation(card);break;case 'laborLedger':renderLaborLedger(card);break;case 'africaFocus':renderAfrica(card);break;case 'bodyArc':renderBodyArc(card,v.data?.phase);break;case 'displacement':renderDisplacement(card);break;case 'shipHold':renderShip(card,v.data?.phase);break;case 'nameMemory':renderNameMemory(card);break;case 'identity':renderIdentity(card);break;case 'triangleTrade':renderTriangle(card);break;case 'priceRevolution':renderPrice(card);break;case 'darkTurn':renderDarkTurn(card);break;case 'dualGauge':renderDual(card,v.data?.phase);break;case 'betrayal':renderBetrayal(card);break;case 'triangleLedger':renderTriangleLedger(card);break;case 'collapse':renderCollapse(card,v.data?.phase);break;case 'lonelyRoom':renderLonely(card);break;case 'causalChain':renderChain(card);break;case 'epilogueThreads':renderWorldNetwork(card,true);break;default:return;
    }
    layer.append(card);
  }

  function recordLine(l){
    if(!l||!['dialogue','narration','concept'].includes(l.type))return;
    const s=scene(),key=`${s.id}:${state.lineIndex}`;if(state.loggedKeys.has(key))return;
    state.loggedKeys.add(key);
    state.log.push({key,chapter:chapterName(s.chapter),scene:s.title,speaker:l.type==='dialogue'?(l.speaker||''):(l.type==='concept'?'핵심 개념':'내레이션'),text:l.text||''});
    if(state.log.length>120){const old=state.log.shift();state.loggedKeys.delete(old.key)}
    if(state.logOpen)renderLog();
  }
  function renderLog(){
    const list=$('logList');list.innerHTML='';$('logEmpty').classList.toggle('hidden',state.log.length>0);
    state.log.forEach(item=>{const d=document.createElement('div');d.className='log-item';d.innerHTML=`<div class="log-meta"><span>${item.chapter}</span><small>${item.scene}</small></div><strong>${item.speaker}</strong><p></p>`;d.querySelector('p').innerHTML=formatStoryText(item.text,{type:item.speaker==='핵심 개념'?'concept':'dialogue'});list.appendChild(d)});
    requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight});
  }
  function openLog(){state.logOpen=true;renderLog();$('logPanel').classList.add('open');$('logPanel').setAttribute('aria-hidden','false');haptic(8)}
  function closeLog(){state.logOpen=false;$('logPanel').classList.remove('open');$('logPanel').setAttribute('aria-hidden','true');lockInput(120)}

  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  const STORY_CONCEPT_TERMS=[
    '식민지 지배','강제노동','플랜테이션','상품 작물','노동력 부족','노동력','원주민 인구','인구 급감','전염병','대서양 횡단','중간항로','노예무역','삼각무역','가격혁명','상업혁명','주식회사','금융업','신용 대출','신용','대출','항해 보험','보험금','지분','화폐량 증가','물가 상승','은 대량 유입'
  ].sort((a,b)=>b.length-a.length);
  const STORY_EMPHASIS_PHRASES=[
    '이것은 신항로 개척 시대의 이야기였다','이것은 신항로 개척 시대의 이야기다','내가 다음 가장이잖아','형 다음은 나잖아','내가 지켜야 해','내가 돌아갈게','꼭 돌아와','나 진짜 돌아갈게','집에 가야 해','내가 집으로 갈 거라고','잭은 끝내 가족에게 돌아가지 못했다','누가 한 사람이라도 기억해야 하니까','사람이잖아','인간이 화물이 될 수 있어','이름 말고 번호','내 이름은 잭이야','자신의 이름을 놓지 않았다','오늘은 꼭 약까지 사 올게요','사람을 돈으로만 보지 마','다시는… 당하는 쪽에 서지 않을 거야','먼저 빼앗겠다','돈이 없으면 조건을 고를 수 없죠','나를 믿어','사람을 잃었다','인간의 욕심'
  ].sort((a,b)=>b.length-a.length);
  function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function emphasizeTerms(html,terms,cls){
    if(!html||!terms.length)return html;const re=new RegExp(`(${terms.map(escapeRegExp).join('|')})`,'g');return html.replace(re,`<span class="${cls}">$1</span>`);
  }
  function formatStoryText(value,line={},limit=Infinity){
    const text=String(value??''),classes=Array(text.length).fill('');
    const mark=(terms,cls)=>terms.forEach(term=>{let at=0;while((at=text.indexOf(term,at))!==-1){for(let j=at;j<at+term.length;j++)classes[j]=cls;at+=term.length}});
    mark(STORY_CONCEPT_TERMS,'hl-concept');mark(STORY_EMPHASIS_PHRASES,'hl-emotion');
    mark(['잭은 끝내 가족에게 돌아가지 못했다','사람을 잃었다','죽었다','죽었어','돌아오지 않았다','죽어','살려','숨을 쉬지','보험금','바다에 버','가족에게 돌아가지 못','다리를 다쳤대','돌아갈 수 없었다','바다에 던','숨을 거두','죽음'],'hl-tragedy');
    let out='',i=0,n=Math.min(text.length,limit);while(i<n){let j=i+1;while(j<n&&classes[j]===classes[i])j++;const chunk=escapeHtml(text.slice(i,j));out+=classes[i]?'<span class="'+classes[i]+'">'+chunk+'</span>':chunk;i=j}
    if(line.timeHeading){const cut=Math.min(line.timeHeading.length,n);out='<span class="time-heading">'+escapeHtml(text.slice(0,cut))+'</span>'+(n>line.timeHeading.length?'<span class="time-description">'+formatStoryText(text.slice(line.timeHeading.length).trimStart(),{},Math.max(0,n-line.timeHeading.length-1))+'</span>':'')}
    return out;
  }
  function formatLearningText(value){
    let out=escapeHtml(value);
    out=emphasizeTerms(out,STORY_CONCEPT_TERMS,'concept-term');
    return out.split(' → ').join(' <span class="concept-arrow">→</span> ');
  }
  function renderConceptCard(text,{chapter=false,note=false}={}){
    const card=$('conceptCard');if(!card)return;
    card.classList.remove('chapter-transition','story-note','scene-summary');
    if(chapter){card.classList.add('chapter-transition');card.innerHTML=`<small>CHAPTER</small><b>${escapeHtml(String(text).replace(/^CHAPTER\s*\d+\.?\s*/i,''))}</b>`}
    else{if(note)card.classList.add('story-note');card.innerHTML=`<span class="concept-kicker">${note?'STORY NOTE':'HISTORY NOTE'}</span><div class="concept-body">${formatLearningText(text)}</div>`}
    card.classList.remove('hidden');
  }


  function showHistoryNote(text){
    clearTyping();clearTimeout(state.autoTimer);$('dialoguePanel').classList.remove('is-typing');$('historyBody').innerHTML=formatLearningText(text);
    $('historyDialog').showModal();$('historyClose').focus();
  }
  function dismissHistory(){if(!$('historyDialog').open)return;$('historyDialog').close();advance();save()}
  $('historyClose').onclick=e=>{e.stopPropagation();dismissHistory()};
  $('historyDialog').addEventListener('cancel',e=>{e.preventDefault();dismissHistory()});
  $('historyDialog').addEventListener('click',e=>e.stopPropagation());

  function showSceneConceptSummary(s){
    const concepts=sceneConcepts(s);if(!concepts.length)return false;
    state.sceneConceptSummaryShown=true;state.conceptSummaryVisible=true;clearTyping();
    const panel=$('dialoguePanel'),card=$('conceptCard'),layer=$('characterLayer');panel.classList.add('stage-hidden');
    card.classList.remove('hidden');renderConceptCard(concepts.join('  ·  '));card.classList.add('scene-summary');
    $('storyScreen')?.classList.add('learning-summary-mode');layer?.classList.add('summary-dim');
    state.inputLockedUntil=Math.max(state.inputLockedUntil,Date.now()+(reducedMotion()?80:280));
    return true;
  }
  function hideSceneConceptSummary(){
    state.conceptSummaryVisible=false;$('conceptCard')?.classList.add('hidden');$('conceptCard')?.classList.remove('scene-summary');$('storyScreen')?.classList.remove('learning-summary-mode');$('characterLayer')?.classList.remove('summary-dim');
  }
  function isTimePlaceStage(text=''){
    return /^(며칠 뒤|몇 달 뒤|몇 년 뒤|다음 날|그날|그 날|한밤중|어느 아침|어느 날|새벽|아침|저녁|밤\.|서아프리카의 마을|해안 집결지|아메리카의 항구|시장\.|광장\.|집\.|항해 중|육지가 사라진다)/.test(text.trim());
  }
  function timePlaceLabel(text=''){
    const t=text.trim();
    const tidy=v=>String(v||'').trim().replace(/^[,.·\s]+|[\s]+$/g,'');
    const make=(title,rest='')=>({kicker:'',title,sub:tidy(rest)});
    let m=t.match(/^(며칠 뒤|몇 달 뒤|몇 년 뒤|다음 날 아침|다음 날|그날 밤|그 날 밤|그날 새벽|그 날 새벽|그날 저녁|그 날 저녁|그날 한밤중|그 날 한밤중|한밤중|어느 아침|어느 날|새벽|아침|저녁|밤)[,.]?\s*(.*)$/);
    if(m){
      let title=m[1];
      const natural={'밤':'그날 밤','한밤중':'그날 한밤중','새벽':'그날 새벽','아침':'그날 아침','저녁':'그날 저녁','그 날 밤':'그날 밤','그 날 새벽':'그날 새벽','그 날 저녁':'그날 저녁','그 날 한밤중':'그날 한밤중'};
      title=natural[title]||title;
      return make(title,m[2]);
    }
    m=t.match(/^(서아프리카의 마을|해안 집결지|아메리카의 항구|시장|광장|집)[.]?\s*(.*)$/);
    if(m)return make(m[1],m[2]);
    if(/^항해 중/.test(t))return make('대서양 위',t.replace(/^항해 중[,.]?\s*/,''));
    if(/^육지가 사라진다/.test(t))return make('대서양',t);
    return make('잠시 뒤','');
  }
  function isSilentStage(text=''){
    return /^(웃음이 번진다|잭은 웃으며|잭은 그 한마디|잭은 천 조각|잭은 웃으려다|운반꾼은 잠시|잭은 품에서|잭은 숨을 고르고|동료는 대답하지 못한다|잭은 자기 몫의 물|행렬이 갈라진다|잭은 고개를 들지 않는다|감독이 장부를 두드린다|잭은 장부를 보며|잭은 눈물이 고이지만|잭은 대답하지 못한다|약사는 고개를 젓는다|잭은 빵을 받지만|어린 시절 자신이 들었던 말|톰은 잭에게 등을 돌린다|잭은 다음 문을 두드린다|톰은 잭을 한참 바라본다|톰은 문을 닫는다|문밖에서 발소리가|대답이 없다|방은 조용하다)/.test(text.trim());
  }
  function clearSpecialOverlays(){
    const tpo=$('timePlaceOverlay');if(!state.cinematicExit){tpo?.classList.remove('shown');tpo?.classList.add('hidden');}
    $('epilogueOverlay')?.classList.add('hidden');$('storyScreen')?.classList.remove('prologue-mode','epilogue-mode','intertitle-mode','learning-summary-mode');$('characterLayer')?.classList.remove('summary-dim');
  }
  function showTimePlaceOverlay(label,{sceneTitle=false}={}){
    const o=$('timePlaceOverlay');if(!o)return;clearTimeout(state.curtainHideTimer);o.classList.remove('chapter-end-card','shown','text-out');
    $('timePlaceKicker').textContent=label.kicker||'';$('timePlaceText').textContent=label.title||'';$('timePlaceSub').textContent=label.sub||'';
    o.classList.remove('hidden');$('storyScreen').classList.add('intertitle-mode');requestAnimationFrame(()=>o.classList.add('shown'));
  }
  function showBookendLine(mode,text,index,total){
    const o=$('epilogueOverlay');if(!o)return;const screen=$('storyScreen'),isFinal=index===total-1;screen.classList.add(mode==='prologue'?'prologue-mode':'epilogue-mode');
    o.classList.remove('hidden');o.classList.toggle('final',isFinal);o.classList.toggle('prologue-bookend',mode==='prologue');
    if($('bookendKicker'))$('bookendKicker').textContent=mode==='prologue'?'':'EPILOGUE';$('bookendText').classList.toggle('bookend-red',/이것은 신항로 개척 (시대|시기)의 이야기/.test(text));
    if($('bookendText')){$('bookendText').getAnimations().forEach(x=>x.cancel());$('bookendText').style.removeProperty('opacity');$('bookendText').classList.remove('text-out');$('bookendText').innerHTML=formatStoryText(text||'',{type:'narration'});$('bookendText').classList.remove('bookend-line-in');void $('bookendText').offsetWidth;$('bookendText').classList.add('bookend-line-in')}
    const hint=$('bookendHint');if(hint)hint.textContent='';

  }
  function scheduleAuto(ms){
    clearTimeout(state.autoTimer);const token=state.autoToken,sid=scene()?.id,li=state.lineIndex;
    const valid=()=>token===state.autoToken&&scene()?.id===sid&&state.lineIndex===li&&$('storyScreen').classList.contains('active');
    const tick=async()=>{if(!valid())return;
      if(state.transitioning||state.logOpen||document.hidden||$('teacherPanel').classList.contains('open')||!$('studentMenu').classList.contains('hidden')){state.autoTimer=setTimeout(tick,250);return}
      const isPrologue=sid==='prologue'||sid==='epilogue';
      if(isPrologue){const el=$('bookendText');el.getAnimations().forEach(x=>x.cancel());el.classList.remove('bookend-line-in');el.style.opacity='1';await el.animate([{opacity:1},{opacity:0}],{duration:reducedMotion()?30:1100,easing:'ease',fill:'forwards'}).finished.catch(()=>{});if(!valid())return;advance();return}
      advance();
    };state.autoTimer=setTimeout(tick,ms);
  }
  function updatePopulationHud(){
    const s=scene(),hud=$('populationHud');if(!hud)return;
    hud.hidden=s?.chapter!=='ch1'||s.id==='prologue';if(hud.hidden)return;
    const scenes=studentScenes.filter(x=>x.chapter==='ch1'&&x.id!=='prologue');
    const progress=Math.max(0,scenes.indexOf(s))/(scenes.length-1);
    const remaining=100-95.72*progress;
    $('populationFill').style.width=remaining+'%';
    $('populationHudLabel').textContent='원주민 인구 감소';
  }
  function locationAt(s,index){let place=s.location;for(let i=0;i<=index;i++)if(s.lines[i]?.location)place=s.lines[i].location;return place}
  function renderLine({instant=false,locationReady=false}={}){
    const s=scene(),l=currentLine();if(!l){advance();return}
    const pageKey=s.id+':'+state.lineIndex;if(state.narrationKey!==pageKey){state.narrationKey=pageKey;state.narrationPage=state.restoreNarrationPage||0;state.restoreNarrationPage=0}state.narrationPages=null;
    const place=locationAt(s,state.lineIndex);
    if(!instant&&!locationReady&&state.currentLocation&&state.currentLocation!==place&&!state.transitioning){
      state.currentLocation=place;state.transitioning=true;clearTyping();clearTimeout(state.autoTimer);const token=++transitionToken,fade=$('sceneFade');fade.classList.add('opaque');
      (async()=>{await sleep(reducedMotion()?30:650);if(token!==transitionToken)return;renderLine({locationReady:true});fade.classList.remove('opaque');await sleep(reducedMotion()?30:650);if(token===transitionToken)state.transitioning=false})();return;
    }
    state.currentLocation=place;
    if(l.type==='concept'||(l.type==='ui'&&/^스토리 확인/.test(l.text||''))){recordLine(l);updateStoryProgress();showHistoryNote(l.text.replace(/^스토리 확인\s*\|\s*/,''));return}
    // Invisible direction lines must never clear a readable dialogue frame.
    const invisible=l.type==='silent'||(l.type==='stage'&&!state.stageVisible&&!isTimePlaceStage(l.text||''));
    if(invisible&&state.lineIndex<s.lines.length-1){recordLine(l);state.lineIndex++;renderLine({instant});return}

    clearTimeout(state.autoTimer);state.autoToken=(state.autoToken||0)+1;updatePopulationHud();
    clearTyping();clearSpecialOverlays();$('historyDialog').close();const panel=$('dialoguePanel'),card=$('conceptCard'),layer=$('characterLayer');
    card.classList.add('hidden');card.classList.remove('chapter-transition','story-note','scene-summary','concept-top','concept-lower');
    $('stageCaption').classList.add('hidden');$('speakerName').textContent='';
    panel.classList.remove('no-speaker','mini-only','content-stage','content-narration','content-concept','content-ui','content-transition','stage-hidden','still-dialogue','content-time');
    layer.classList.remove('intertitle-hidden');
    let text=l.text||'';if(l.type==='ui')text=text.replace(/^(화면 UI|스토리 장치|스토리 확인)\s*\|\s*/,'');
    if(l.type==='narration'&&s.id!=='prologue'&&s.id!=='epilogue'){state.narrationPages=narrationChunks(text);state.narrationPage=Math.min(state.narrationPage||0,state.narrationPages.length-1);text=state.narrationPages[state.narrationPage]}
    state.currentCue=cueFor(s,l,state.lineIndex);applyDialogueTone(l,state.currentCue);panel.classList.toggle('still-dialogue',isStillMoment(l,state.currentCue));

    if(s.id==='prologue'||s.id==='epilogue'){
      panel.classList.add('stage-hidden');layer.classList.add('intertitle-hidden');$('storyFxLayer').innerHTML='';card.classList.add('hidden');
      showBookendLine(s.id,text,state.lineIndex,s.lines.length);state.fullText='';$('dialogueText').textContent='';
      updateStoryProgress();recordLine(l);syncDirectorStatus();updateBookmarkButton();lockInput(400);scheduleAuto(Math.max(state.lineIndex===s.lines.length-1?5550:4550,text.length*75+1700));return;
    }

    if(l.type==='silent'){
      panel.classList.add('stage-hidden');state.fullText='';$('dialogueText').textContent='';renderCharacters(l);playCharacterMotion(l,state.currentCue);updateStoryProgress();syncDirectorStatus();updateBookmarkButton();
      const sid=s.id,li=state.lineIndex;setTimeout(()=>{if(scene()?.id===sid&&state.lineIndex===li&&!state.transitioning&&!state.logOpen)advance()},silentPauseMs(l.text));return;
    }
    if(l.type==='dialogue'){
      $('speakerName').textContent=l.speaker||'';const id=resolveSpeakerId(l.speaker,s)||l.speaker;let hash=0;for(const ch of id)hash=(hash*31+ch.charCodeAt(0))>>>0;const colors={jack_america:'#f0cc83',father:'#9dc6ff',mother_ch1:'#f5b4d5',sister:'#c8b3ff',brother1:'#9be0bc',youngest:'#ffbd8a',jack_africa:'#93dcc9',jack_europe:'#a8caff'};$('speakerName').style.setProperty('color',colors[id]||('hsl('+(hash%360)+' 70% 80%)'),'important');
    }else if(l.type==='stage'){
      panel.classList.add('no-speaker','content-narration','content-time');
      const label=timePlaceLabel(text);l.timeHeading=label.title;text=label.title+(label.sub?'\n'+label.sub:'');
      // Time narration advances by touch only after typing finishes.
    }else if(l.type==='narration'){
      panel.classList.add('no-speaker','content-narration');
    }else if(l.type==='concept'){
      recordLine(l);updateStoryProgress();showHistoryNote(text);return;
    }else if(l.type==='transition'){
      panel.classList.add('no-speaker','mini-only','content-transition');renderConceptCard(l.text,{chapter:true});text='';
    }else if(l.type==='ui'){
      panel.classList.add('no-speaker','content-ui');
      if(/^\s*\[/.test(text)){panel.classList.add('stage-hidden');text=''}
      else if(currentVisual()){panel.classList.add('mini-only');text=''}
      else if(/^스토리 확인/.test(l.text||'')){recordLine(l);showHistoryNote(text);return}
    }else{panel.classList.add('no-speaker')}

    $('lineCounter').textContent=`${state.lineIndex+1} / ${s.lines.length}`;
    if(text&&(l.type==='dialogue'||l.type==='narration')&&state.hintShows<3)state.hintShows++;
    applyFixedDialoguePanel();updateStoryProgress();renderCharacters(l);playCharacterMotion(l,state.currentCue);renderStoryFx();positionLearningLayers(l);recordLine(l);triggerLineSfx(l);syncDirectorStatus();updateBookmarkButton();
    if(panel.classList.contains('stage-hidden')){state.fullText='';$('dialogueText').textContent='';if(l.type==='stage'&&!isTimePlaceStage(l.text||''))scheduleAuto(state.stageVisible?2400:40);else if(l.type==='ui')scheduleAuto(100);return}
    if(instant){state.fullText=text;$('dialogueText').innerHTML=formatStoryText(text,l);setNextHint();if(text)requestAnimationFrame(()=>{applyLineLinger(l,state.currentCue);narrationReady()})}
    else typeText(text,l.type);
  }

  function preloadImage(url,{timeout=2200}={}){return new Promise(resolve=>{const i=new Image();let done=false,timer=null;const finish=()=>{if(done)return;done=true;if(timer)clearTimeout(timer);i.onload=null;i.onerror=null;resolve(url)};i.decoding='async';i.onload=()=>{const d=(typeof i.decode==='function')?i.decode():Promise.resolve();d.catch(()=>{}).then(finish)};i.onerror=finish;i.src=url;timer=setTimeout(finish,timeout)})}
  function prioritySceneCharacters(s,limit=2){
    const cfg=stageFor(s),states=cfg.states||{},ids=[];const add=id=>{if(id&&states[id]!==undefined&&!ids.includes(id))ids.push(id)};add(cfg.protagonist);
    (s?.lines||[]).filter(l=>l?.type==='dialogue').slice(0,10).forEach(l=>add(resolveSpeakerId(l.speaker,s)));Object.keys(states).forEach(add);
    return ids.slice(0,limit).map(id=>[id,states[id]]);
  }
  function preloadScene(index,{backgroundOnly=false,characterLimit=2}={}){
    const s=studentScenes[index];if(!s)return Promise.resolve([]);const jobs=[],a=assetFor(s);if(s.id!=='prologue'&&a.background)jobs.push(preloadImage(`./assets/images/backgrounds/${a.background}`));
    if(!backgroundOnly){prioritySceneCharacters(s,characterLimit).forEach(([id,st])=>{const f=characterCandidates(id,st,'neutral')[0];if(f)jobs.push(preloadImage(`./assets/images/characters/${f}`))})}
    return Promise.all(jobs);
  }
  function scheduleBackgroundPreload(index){const run=()=>preloadScene(index,{backgroundOnly:true});if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1200});else setTimeout(run,220)}
  async function bootPreload(){
    const overlay=$('bootOverlay'),bar=$('bootProgress'),label=$('bootText');const jobs=[];
    // 프롤로그는 순수 검은 화면이므로 숨겨진 배경을 받지 않는다. 첫 실제 장면 2개만 준비한다.
    const firstIndex=studentScenes.findIndex(s=>s.id!=='prologue');const candidates=[studentScenes[firstIndex],studentScenes[firstIndex+1]].filter(Boolean);
    const seenUrls=new Set();const addJob=url=>{if(!url||seenUrls.has(url))return;seenUrls.add(url);jobs.push(preloadImage(url,{timeout:1500}))};
    candidates.forEach((s,idx)=>{const a=assetFor(s);if(a.background)addJob(`./assets/images/backgrounds/${a.background}`);prioritySceneCharacters(s,idx===0?2:1).forEach(([id,st])=>{const f=characterCandidates(id,st,'neutral')[0];if(f)addJob(`./assets/images/characters/${f}`)})});
    if(!jobs.length){bar.style.width='100%';overlay.classList.add('ready');return}
    let completed=0;const start=performance.now();await Promise.all(jobs.map(p=>p.finally(()=>{completed++;bar.style.width=`${Math.round((completed/jobs.length)*100)}%`;label.textContent=completed===jobs.length?'준비가 끝났습니다.':'이야기를 준비하고 있습니다…'})));
    const elapsed=performance.now()-start;if(elapsed<420)await sleep(420-elapsed);bar.style.width='100%';await sleep(110);overlay.classList.add('ready');setTimeout(()=>overlay.remove(),520)
  }

  async function enterScene(index,line=0,{first=false}={}){
    closeStudentMenu();
    const fromScene=scene(),fromCfg=stageFor(fromScene),fromPro=fromCfg?.protagonist||null,fromState=fromPro?fromCfg?.states?.[fromPro]:null;
    const targetIndex=Math.max(0,Math.min(index,studentScenes.length-1));
    const targetScene=studentScenes[targetIndex];
    const targetLocation=locationAt(targetScene,line),locationChanged=(state.currentLocation||fromScene?.location)!==targetLocation,token=++transitionToken;
    state.transitioning=true;clearTimeout(state.autoTimer);state.autoToken=(state.autoToken||0)+1;state.cinematicExit=false;clearTyping();$('historyDialog').close();
    const fade=$('sceneFade'),wasStory=$('storyScreen').classList.contains('active');
    fade.className='scene-fade';fade.style.setProperty('--transition-ms','650ms');
    if(!wasStory)showScreen('storyScreen');
    if(locationChanged&&!first&&wasStory){fade.classList.add('opaque');await sleep(reducedMotion()?30:650)}
    if(token!==transitionToken)return;
    state.currentLocation=targetLocation;state.sceneIndex=targetIndex;state.lineIndex=Math.max(0,Math.min(line,targetScene.lines.length-1));state.currentCue=null;state.sceneConceptSummaryShown=true;state.conceptSummaryVisible=false;state.pendingStateShift=null;
    const s=scene();applyViewportProfile();applySceneTone(s);setBackdrop(s);setBgm(s,{immediate:first});
    $('chapterLabel').textContent=s.id==='prologue'?'PROLOGUE':s.id==='epilogue'?'EPILOGUE':chapterName(s.chapter);$('sceneLabel').textContent=s.title;
    if(locationChanged){state.lastSupportId=null;state.supportStack=[];['left','center','right'].forEach(p=>fillSlot(p,null));await preloadScene(targetIndex)}
    if(token!==transitionToken)return;
    clearSpecialOverlays();$('storyFxLayer').dataset.visualKey='';applyStoryPreviewMode();renderLine();save();syncLayoutEditor();syncDirectorStatus();
    fade.classList.remove('opaque');if(locationChanged&&!first)await sleep(reducedMotion()?30:650);
    if(token!==transitionToken)return;state.transitioning=false;state.inputLockedUntil=Date.now()+60;
    preloadScene(state.sceneIndex+1,{characterLimit:2});
  }


  function applyStoryPreviewMode(){ $('storyScreen').classList.toggle('ui-hidden',state.hideUiPreview); }
  function setRangeAndOutput(id,value,formatter){ const el=$(id); if(!el)return; el.value=String(value); const out=$(id.replace('Range','Value')); if(out) out.value = formatter?formatter(value):String(value); }
  function updateLayoutStatus(){
    const s=currentSceneObj(); if(!$('layoutStatus')||!s) return;
    const target=$('layoutTarget')?.value||'left';
    const p=scenePresence();
    const slotCfg=target==='background'?null:getEffectiveSlotLayout(s,target,p);
    const bgCfg=getEffectiveBackgroundLayout(s);
    const overridesCount=Object.keys(layoutStore.scenes||{}).length;
    $('layoutStatus').textContent = target==='background'
      ? `${s.id} · 배경 X ${formatPct(bgCfg.x)} / Y ${formatPct(bgCfg.y)} / 줌 ${formatPct(bgCfg.zoom)} · 저장된 장면 배치 ${overridesCount}개`
      : `${s.id} · ${target} 슬롯 X ${formatPct(slotCfg.x)} / Y ${formatPct(slotCfg.y)} / 크기 ${formatScale(slotCfg.scale)} / 반전 ${effectiveFlip(target,p,slotCfg.flip)===-1?'ON':'OFF'} · 자동 시선 ${state.autoFace?'ON':'OFF'}`;
  }
  function syncLayoutEditor(){
    const s=currentSceneObj(); if(!s||!$('layoutTarget')) return;
    const target=$('layoutTarget').value;
    const bgMode=target==='background';
    $('slotEditor').classList.toggle('hidden',bgMode);
    $('backgroundEditor').classList.toggle('hidden',!bgMode);
    $('autoFaceToggle').checked=state.autoFace;
    $('hideUiPreviewToggle').checked=state.hideUiPreview;
    const presence=scenePresence();
    if(bgMode){ const cfg=getEffectiveBackgroundLayout(s); setRangeAndOutput('bgXRange',cfg.x,formatPct); setRangeAndOutput('bgYRange',cfg.y,formatPct); setRangeAndOutput('bgZoomRange',cfg.zoom,formatPct); }
    else { const cfg=getEffectiveSlotLayout(s,target,presence); setRangeAndOutput('slotXRange',cfg.x,formatPct); setRangeAndOutput('slotYRange',cfg.y,formatPct); setRangeAndOutput('slotScaleRange',cfg.scale,formatScale); $('slotFlipToggle').checked=effectiveFlip(target,presence,cfg.flip)===-1; }
    updateLayoutStatus();
  }
  function writeSlotOverrideFromControls(){
    const s=currentSceneObj(); if(!s) return; const target=$('layoutTarget').value; if(target==='background') return;
    const bucket=ensureLayoutScene(s.id); if(!bucket.slots)bucket.slots={}; bucket.slots[target]={
      x:Number($('slotXRange').value), y:Number($('slotYRange').value), scale:Number($('slotScaleRange').value), flip:$('slotFlipToggle').checked?-1:1
    };
    persistLayoutStore(); renderCharacters(currentLine());
  }
  function writeBackgroundOverrideFromControls(){
    const s=currentSceneObj(); if(!s) return; const bucket=ensureLayoutScene(s.id); bucket.background={
      x:Number($('bgXRange').value), y:Number($('bgYRange').value), zoom:Number($('bgZoomRange').value)
    };
    persistLayoutStore(); applyBackgroundLayout(s); updateLayoutStatus();
  }
  function resetTargetLayout(){
    const s=currentSceneObj(); if(!s) return; const target=$('layoutTarget').value; const bucket=ensureLayoutScene(s.id);
    if(target==='background') delete bucket.background; else if(bucket.slots) delete bucket.slots[target];
    cleanupLayoutScene(s.id); persistLayoutStore(); if(target==='background'){applyBackgroundLayout(s)} else renderCharacters(currentLine()); syncLayoutEditor();
  }
  function resetSceneLayout(){ const s=currentSceneObj(); if(!s) return; if(layoutStore.scenes?.[s.id]) delete layoutStore.scenes[s.id]; persistLayoutStore(); applyBackgroundLayout(s); renderCharacters(currentLine()); syncLayoutEditor(); }
  function syncDirectorStatus(){
    const s=currentSceneObj(),l=currentLine();if(!s||!$('directorStatus'))return;
    const cue=state.currentCue||cueFor(s,l,state.lineIndex);const bits=[];
    if(cue.focus)bits.push(`포커스 ${STAGE.characters?.[cue.focus]?.name||cue.focus}`);
    if(cue.closeup)bits.push(`클로즈업 ${cue.closeup}`);
    if(cue.gaze&&cue.gaze!=='auto')bits.push(`시선 ${cue.gaze}`);
    if(cue.solo)bits.push('단독 프레임');
    if(cue.tone)bits.push(`톤 ${cue.tone}`);
    if(cue.hold!==undefined)bits.push(`상대 유지 ${cue.hold}줄`);if(cue.motion){const shownStrength=(state.lastMotionScene===s.id&&state.lastMotionLine===state.lineIndex)?state.lastMotionStrength:effectiveMotionStrength(cue,l);bits.push(`캐릭터 움직임 ${cue.motion} · ${shownStrength||'cooldown'}`)}if(isStillMoment(l,cue))bits.push('중요 정적');
    const trans=sceneTransitionFor(s);
    $('directorStatus').textContent=`${s.id} · ${state.lineIndex+1}/${s.lines.length} · ${l?.type||'-'}${l?.speaker?` · ${l.speaker}`:''} · ${bits.length?bits.join(' / '):'기본 연출'} · 장면전환 ${trans.style} · 배경 고정 · 템포 ${paceProfile(s).typing.toFixed(2)}`+(cue.note?` · ${cue.note}`:'');
    if($('teacherLineInput')){$('teacherLineInput').max=String(s.lines.length);$('teacherLineInput').value=String(state.lineIndex+1)}
  }
  function teacherGoLine(nextIndex){
    const s=currentSceneObj();if(!s)return;state.lineIndex=Math.max(0,Math.min(Number(nextIndex)||0,s.lines.length-1));state.currentCue=null;renderLine({instant:true});save();syncDirectorStatus();
  }
  function exportLayoutData(){
    const payload={version:'0.19',generatedAt:new Date().toISOString(),sceneId:currentSceneObj()?.id||null,layoutOverrides:layoutStore.scenes||{},preferences:{autoFace:state.autoFace},directorVersion:DIRECTOR.version||'0.19'};
    const json=JSON.stringify(payload,null,2);$('layoutExportBox').value=json;return json;
  }
  async function copyLayoutData(){
    const json=$('layoutExportBox').value||exportLayoutData();try{await navigator.clipboard.writeText(json);$('layoutStatus').textContent='배치값 JSON을 클립보드에 복사했습니다.'}catch{$('layoutExportBox').focus();$('layoutExportBox').select();document.execCommand?.('copy');$('layoutStatus').textContent='배치값 JSON을 선택했습니다. 복사 상태를 확인하세요.'}
  }

  function autoOnlyLine(){return state.transitioning||state.cinematicExit||['prologue','epilogue'].includes(scene()?.id)}
  function requestAdvance(){
    if($('historyDialog').open||autoOnlyLine())return;
    const now=Date.now();if(now<state.advanceGateUntil)return;if(!$('studentMenu')?.classList.contains('hidden')){closeStudentMenu();state.advanceGateUntil=now+160;return}if(isInputLocked())return;
    state.advanceGateUntil=now+165;
    if(state.conceptSummaryVisible){hideSceneConceptSummary();haptic(8);lockInput(100);const s=scene();if(state.sceneIndex<studentScenes.length-1)enterScene(state.sceneIndex+1,0);else{clearSave();stopAllAudio();showScreen('titleScreen')}return;}
    if(['narration','stage'].includes(currentLine()?.type)&&(state.typing||Date.now()<(state.narrationReadyAt||0)))return;
    if(completeTyping())return;haptic(10);lockInput(95);advance()
  }
  function advance(){
    const s=scene();if(!s)return;if(state.narrationPages&&state.narrationPage<state.narrationPages.length-1){state.narrationPage++;renderLine();save();return}if(state.lineIndex<s.lines.length-1){state.lineIndex++;renderLine();save();return}

    if(state.sceneIndex<studentScenes.length-1){enterScene(state.sceneIndex+1,0)}else{clearSave();stopAllAudio();showScreen('titleScreen')}
  }
  function prev(){if($('historyDialog').open||autoOnlyLine()||state.logOpen)return;if(state.typing&&['narration','stage'].includes(currentLine()?.type))return;if(state.typing)completeTyping({vibrate:false});if(state.lineIndex>0){state.lineIndex--;renderLine({instant:true});save()}else if(state.sceneIndex>0)enterScene(state.sceneIndex-1,Math.max(0,studentScenes[state.sceneIndex-1].lines.length-1))}

  function teacherGoSceneById(sceneId,line=0){const i=studentScenes.findIndex(s=>s.id===sceneId);if(i>=0){closeTeacher();enterScene(i,line)}}
  function teacherShiftScene(delta){const i=Math.max(0,Math.min(studentScenes.length-1,state.sceneIndex+delta));closeTeacher();enterScene(i,0)}
  function teacherNextKeyScene(){const current=scene()?.id;let idx=KEY_TEST_SCENES.indexOf(current);if(idx<0){idx=KEY_TEST_SCENES.findIndex(id=>studentScenes.findIndex(s=>s.id===id)>state.sceneIndex)-1}const next=KEY_TEST_SCENES[(idx+1+KEY_TEST_SCENES.length)%KEY_TEST_SCENES.length];teacherGoSceneById(next,0)}
  function buildTeacherNav(){
    const nav=$('sceneNavigator');nav.innerHTML='';const groups={};studentScenes.forEach((s,i)=>{(groups[s.chapter]||(groups[s.chapter]=[])).push([s,i])});
    Object.entries(groups).forEach(([ch,items])=>{const wrap=document.createElement('div');wrap.className='chapter-group';wrap.innerHTML=`<h3>${chapterName(ch)}</h3>`;items.forEach(([s,i])=>{const cfg=stageFor(s),b=document.createElement('button');b.className=`scene-jump${bookmarkIndex(s.id)>=0?' qa-marked':''}`;b.innerHTML=`${s.title}<small>${s.id} · ${s.lines.length} lines · 배경 고정</small>`;b.onclick=()=>{closeTeacher();enterScene(i,bookmarkIndex(s.id)>=0?(qaStore.bookmarks[bookmarkIndex(s.id)]?.lineIndex||0):0)};wrap.appendChild(b)});nav.appendChild(wrap)})
  }
  function openTeacher(){buildTeacherNav();syncLayoutEditor();syncDirectorStatus();renderBookmarks();updateBookmarkButton();syncQaNoteInput();$('teacherPanel').classList.add('open');$('teacherPanel').setAttribute('aria-hidden','false');haptic(18)}
  function closeTeacher(){$('teacherPanel').classList.remove('open');$('teacherPanel').setAttribute('aria-hidden','true')}
  function secretTap(){const now=Date.now();titleTaps=titleTaps.filter(t=>now-t<1800);titleTaps.push(now);if(titleTaps.length>=5){titleTaps=[];openTeacher()}}

  ['secretTitle','chapterLabel','sceneLabel'].forEach(id=>$(id)?.addEventListener('pointerup',secretTap));
  $('startBtn').onclick=()=>{state.hintShows=0;haptic(12);enterScene(0,0,{first:true})};
  const saved=load();if(saved){$('continueBtn').classList.remove('hidden');$('continueBtn').onclick=()=>{const i=studentScenes.findIndex(s=>s.id===saved.sceneId);haptic(12);state.restoreNarrationPage=saved.narrationPage||0;enterScene(i>=0?i:0,saved.lineIndex||0,{first:true})}}
  $('nextBtn').onclick=e=>{e.stopPropagation();requestAdvance()};$('dialoguePanel').onclick=requestAdvance;
  $('storyScreen').addEventListener('click',e=>{if(!e.target.closest('button')&&!e.target.closest('#dialoguePanel'))requestAdvance()});
  function closeStudentMenu(){$('studentMenu')?.classList.add('hidden');$('studentMenu')?.setAttribute('aria-hidden','true')}
  function toggleStudentMenu(e){e?.stopPropagation();const m=$('studentMenu');if(!m)return;const willOpen=m.classList.contains('hidden');m.classList.toggle('hidden',!willOpen);m.setAttribute('aria-hidden',willOpen?'false':'true')}
  $('studentMenuBtn').onclick=toggleStudentMenu;$('studentMenu').onclick=e=>e.stopPropagation();
  $('homeBtn').onclick=()=>{save();closeStudentMenu();clearTyping();clearSpecialOverlays();stopAllAudio();showScreen('titleScreen')};
  $('logBtn').onclick=e=>{e.stopPropagation();closeStudentMenu();openLog()};$('closeLogBtn').onclick=closeLog;
  $('soundBtn').onclick=e=>{e.stopPropagation();state.sound=!state.sound;$('soundBtn').setAttribute('aria-label',state.sound?'소리 끄기':'소리 켜기');if($('soundStateText'))$('soundStateText').textContent=state.sound?'켜짐':'꺼짐';const icon=$('soundBtn')?.querySelector('span');if(icon)icon.textContent=state.sound?'♪':'×';haptic(8);if(state.sound){state.currentBgm=null;setBgm(scene(),{immediate:true})}else stopAllAudio()};
  $('closeTeacherBtn').onclick=closeTeacher;$('restartSceneBtn').onclick=()=>{closeTeacher();enterScene(state.sceneIndex,0)};$('restartAllBtn').onclick=()=>{clearSave();closeTeacher();enterScene(0,0)};$('hapticTestBtn').onclick=()=>haptic(28);
  $('sfxTestBtn').onclick=()=>playSfx('sfx_test.wav',{volume:.55});
  $('showStageToggle').onchange=e=>{state.stageVisible=e.target.checked;renderLine({instant:true})};
  $('showCharacterToggle').onchange=e=>{state.charactersVisible=e.target.checked;renderCharacters(currentLine())};
  $('showVisualToggle').onchange=e=>{state.visualsVisible=e.target.checked;renderStoryFx()};
  $('visualTestBtn').onclick=()=>{const i=studentScenes.findIndex(s=>s.id==='ch1-end');closeTeacher();enterScene(i>=0?i:0,1)};
  $('teacherPrevSceneBtn').onclick=()=>teacherShiftScene(-1);$('teacherNextSceneBtn').onclick=()=>teacherShiftScene(1);$('teacherNextKeyBtn').onclick=teacherNextKeyScene;$('teacherPrologueBtn').onclick=()=>teacherGoSceneById('prologue');$('teacherEpilogueBtn').onclick=()=>teacherGoSceneById('epilogue');
  $('teacherUiOffBtn').onclick=()=>{state.hideUiPreview=!state.hideUiPreview;$('hideUiPreviewToggle').checked=state.hideUiPreview;applyStoryPreviewMode();updateLayoutStatus();showToast(state.hideUiPreview?'학생 UI 숨김':'학생 UI 표시')};
  $('layoutTarget').onchange=syncLayoutEditor;
  $('autoFaceToggle').onchange=e=>{state.autoFace=e.target.checked;persistLayoutStore();renderCharacters(currentLine());syncLayoutEditor()};
  $('hideUiPreviewToggle').onchange=e=>{state.hideUiPreview=e.target.checked;applyStoryPreviewMode();updateLayoutStatus()};
  ['slotXRange','slotYRange','slotScaleRange'].forEach(id=>$(id).addEventListener('input',()=>{const fmt=id==='slotScaleRange'?formatScale:formatPct;$(id.replace('Range','Value')).value=fmt($(id).value);writeSlotOverrideFromControls()}));
  $('slotFlipToggle').onchange=()=>writeSlotOverrideFromControls();
  ['bgXRange','bgYRange','bgZoomRange'].forEach(id=>$(id).addEventListener('input',()=>{const fmt=formatPct;$(id.replace('Range','Value')).value=fmt($(id).value);writeBackgroundOverrideFromControls()}));
  $('resetTargetBtn').onclick=resetTargetLayout; $('resetBgBtn').onclick=resetTargetLayout; $('resetSceneLayoutBtn').onclick=resetSceneLayout;
  $('teacherPrevLineBtn').onclick=()=>teacherGoLine(state.lineIndex-1);
  $('teacherNextLineBtn').onclick=()=>teacherGoLine(state.lineIndex+1);
  $('teacherReplayLineBtn').onclick=()=>{state.currentCue=null;renderLine({instant:false});syncDirectorStatus()};
  $('teacherLineJumpBtn').onclick=()=>teacherGoLine(Number($('teacherLineInput').value)-1);
  $('exportLayoutBtn').onclick=exportLayoutData;$('copyLayoutBtn').onclick=copyLayoutData;
  $('bookmarkSceneBtn').onclick=toggleCurrentBookmark;$('clearBookmarksBtn').onclick=clearBookmarks;$('saveQaNoteBtn').onclick=saveCurrentQaNote;
  let viewportRaf=0;const refreshViewport=()=>{cancelAnimationFrame(viewportRaf);viewportRaf=requestAnimationFrame(()=>{applyViewportProfile();if($('storyScreen').classList.contains('active')){applyFixedDialoguePanel();positionLearningLayers(currentLine())}})};
  window.addEventListener('resize',refreshViewport);window.visualViewport?.addEventListener('resize',refreshViewport);window.visualViewport?.addEventListener('scroll',refreshViewport);
  window.addEventListener('orientationchange',()=>setTimeout(refreshViewport,120));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('storyScreen')?.classList.contains('active'))save()});
  document.addEventListener('keydown',e=>{if($('historyDialog').open)return;if(state.logOpen&&e.key==='Escape'){closeLog();return}if(e.key==='ArrowRight'||e.key===' '||e.key==='Enter'){e.preventDefault();requestAdvance()}if(e.key==='ArrowLeft')prev();if(e.key==='Escape')closeTeacher()});
  applyViewportProfile();syncLayoutEditor();syncDirectorStatus();renderBookmarks();updateBookmarkButton();if(![...AVAILABLE_AUDIO_FILES].some(f=>/\.(mp3|ogg|m4a|wav)$/i.test(f))&&![...AVAILABLE_SFX_FILES].some(f=>/\.(mp3|ogg|m4a|wav)$/i.test(f)&&f!=='sfx_test.wav'))$('soundBtn')?.classList.add('hidden');if($('soundStateText'))$('soundStateText').textContent=state.sound?'켜짐':'꺼짐';bootPreload();
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>{try{navigator.serviceWorker.register('./sw.js').catch(()=>{})}catch{}})}
})();
