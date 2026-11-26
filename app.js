// LOVE LAB v1.0 — Firebase modular SDK (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* 1) Firebase Console에서 발급한 설정값으로 교체하세요. */
const firebaseConfig = {
  apiKey: "AIzaSyBqRfF4WIBKIeZ33B_LEm2pS6sW2aWKutw",
  authDomain: "love-lab-c43a9.firebaseapp.com",
  projectId: "love-lab-c43a9",
  storageBucket: "love-lab-c43a9.firebasestorage.app",
  messagingSenderId: "345852927698",
  appId: "1:345852927698:web:8238d6c61d33c0285dd70b",
  measurementId: "G-K4EL0E1LLH"

};
const FIREBASE_READY = !Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"));
let db = null, auth = null, user = null, roomUnsub = null;
let roomId = null, roomData = null, myRole = null, myProfile = null;
let activeLab = null, currentQuestion = 0, selectedAnswer = null;
let localDemo = false;

const $ = id => document.getElementById(id);
const screens = ["hero","setup","join","waiting","dashboard","experiment","result"];
const MBTIS = ["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"];
const LABS = [
 {id:"telepathy",no:"LAB 01",title:"텔레파시 실험",desc:"상대방의 선택을 얼마나 잘 예측할까?",count:10},
 {id:"manual",no:"LAB 02",title:"애인 사용 설명서",desc:"상대방의 취향과 마음을 얼마나 알고 있을까?",count:8},
 {id:"scenario",no:"LAB 03",title:"연애 상황극",desc:"선택에 따라 달라지는 대화 시뮬레이션",count:5},
 {id:"balance",no:"LAB 04",title:"연애 밸런스 게임",desc:"우리의 연애 가치관은 얼마나 비슷할까?",count:15},
 {id:"court",no:"LAB 05",title:"연애 법정",desc:"커플 사이의 사건을 함께 판결하기",count:5},
 {id:"cipher",no:"LAB 06",title:"사랑의 암호 해독",desc:"상대방의 마음속 단서를 찾아라",count:3},
 {id:"report",no:"FINAL",title:"커플 연구 보고서",desc:"모든 실험 데이터를 종합해 결과 확인",count:1}
];
const BANK = {
 telepathy:[
  ["갑자기 주말 하루가 통째로 비었다면 가장 하고 싶은 것은?",["근교 여행 떠나기","집에서 푹 쉬기","새로운 맛집 탐방","전시·공연·액티비티"]],
  ["가장 받고 싶은 깜짝 선물은?",["정성스러운 손편지","평소 갖고 싶던 물건","함께 떠나는 여행","좋아하는 간식과 작은 선물"]],
  ["힘든 하루를 보낸 나에게 애인이 해줬으면 하는 행동은?",["말없이 꼭 안아주기","내 이야기를 충분히 들어주기","문제를 해결할 방법 함께 찾기","혼자 쉴 시간을 존중하기"]],
  ["데이트 약속이 갑자기 취소됐다. 나의 첫 반응은?",["아쉽지만 다른 날을 잡는다","이유를 자세히 물어본다","괜찮다고 하고 내 시간을 즐긴다","서운한 마음을 솔직히 말한다"]],
  ["여행을 준비할 때 나는?",["시간·장소까지 꼼꼼하게 계획","큰 틀만 정하고 현지에서 결정","애인에게 대부분 맡긴다","각자 가고 싶은 곳을 하나씩 고른다"]],
  ["애정 표현 중 가장 설레는 것은?",["다정한 말과 칭찬","스킨십과 포옹","시간을 내 함께하는 것","작은 행동으로 챙겨주는 것"]],
  ["둘이 의견이 다를 때 가장 먼저 필요한 것은?",["차분하게 대화할 시간","각자의 생각을 정리할 시간","가볍게 분위기를 풀기","서로 한 발씩 양보하기"]],
  ["기념일에 가장 중요한 것은?",["날짜를 기억하고 챙기는 것","함께 보내는 시간","진심이 담긴 표현","평소와 다른 특별한 경험"]],
  ["갑자기 100만 원이 생긴다면?",["둘이 여행을 간다","맛있는 것과 쇼핑을 즐긴다","미래를 위해 저축한다","각자 원하는 곳에 쓴다"]],
  ["연인과 가장 자주 나누고 싶은 대화는?",["오늘 있었던 소소한 일","미래의 계획과 꿈","장난과 밈, 재미있는 이야기","서로의 감정과 고민"]]
 ],
 manual:[
  ["내가 기분이 안 좋을 때 가장 원하는 것은?",["먼저 이유를 물어봐 주기","말없이 곁에 있어 주기","혼자 생각할 시간 주기","기분 전환할 일을 제안하기"]],
  ["내가 가장 좋아하는 데이트는?",["맛집·카페 탐방","집에서 편하게 쉬기","여행·드라이브","전시·공연·체험"]],
  ["내가 서운함을 느끼는 순간은?",["연락이나 표현이 줄었을 때","약속이나 말을 잊었을 때","내 의견을 가볍게 넘길 때","함께 있어도 집중하지 않을 때"]],
  ["내가 가장 듣고 싶은 말은?",["오늘도 고생했어","네 편이야","너랑 있으면 행복해","내가 더 잘할게"]],
  ["내가 스트레스를 풀 때 선호하는 방식은?",["대화하며 털어놓기","혼자 조용히 쉬기","운동·산책·외출","맛있는 음식 먹기"]],
  ["내가 애정 표현을 느끼는 방식은?",["말로 표현해 주기","스킨십","시간과 관심","도움과 배려"]],
  ["내가 갑자기 계획이 바뀌면?",["대안을 바로 찾는다","조금 아쉽지만 적응한다","왜 바뀌었는지 먼저 알고 싶다","새로운 기회라고 생각한다"]],
  ["내가 가장 행복했던 데이트에 가까운 것은?",["정성껏 준비한 기념일","별 계획 없이 오래 함께한 날","새로운 곳을 함께 탐험한 날","힘든 날 서로를 챙겨준 날"]]
 ],
 scenario:[
  ["애인의 연락이 평소보다 뜸하다.",["무슨 일 있는지 바로 물어본다","바쁜가 보다 하고 기다린다","나도 연락을 줄이고 반응을 본다","서운하다고 솔직하게 말한다"],"연락의 빈도보다 서로 기대하는 소통 방식을 확인해 보세요."],
  ["기다리던 데이트 당일, 애인이 갑자기 계획을 바꾸자고 한다.",["이유를 듣고 대안을 함께 찾는다","괜찮다고 하고 새로운 계획을 따른다","원래 계획이 좋았다고 분명히 말한다","이번에는 따르고 다음에는 미리 상의해 달라고 한다"],"계획 변경에 대한 유연성과 사전 공유의 중요도를 비교해 보세요."],
  ["사소한 말다툼 후 분위기가 어색해졌다.",["지금 바로 대화해 풀고 싶다","각자 진정할 시간을 갖자고 한다","먼저 가볍게 말을 걸어본다","상대가 먼저 다가오는지 기다린다"],"화해에 필요한 시간과 신호는 사람마다 다를 수 있어요."],
  ["애인이 중요한 기념일을 잊어버렸다.",["서운한 마음을 바로 표현한다","왜 잊었는지 먼저 물어본다","이번에는 넘어가고 다음을 기대한다","기념일이 나에게 어떤 의미인지 설명한다"],"기념일 자체와 이후의 회복 행동 중 무엇이 더 중요한지 이야기해 보세요."],
  ["친구와의 약속과 우리 데이트 시간이 겹쳤다.",["먼저 잡힌 약속을 지킨다","상황을 설명하고 함께 조정한다","이번에는 친구 약속을 우선한다","둘 다 만족할 대안을 찾는다"],"연애와 개인 생활의 균형에 관한 서로의 기준을 살펴보세요."]
 ],
 balance:[
  ["매일 짧게 통화하기","일주일에 한 번 길게 통화하기"],
  ["모든 일상을 공유하는 연애","각자의 시간을 충분히 존중하는 연애"],
  ["깜짝 이벤트가 많은 연애","소소하고 꾸준한 배려가 있는 연애"],
  ["여행은 완벽한 계획형","여행은 무조건 즉흥형"],
  ["싸우면 바로 화해하기","하루 정도 생각할 시간 갖기"],
  ["커플 사진을 자주 올리기","둘만의 추억으로 간직하기"],
  ["데이트 비용은 정확히 반반","상황에 따라 유연하게 부담"],
  ["매일 보고 싶은 연애","각자 할 일을 하다 만나는 연애"],
  ["선물은 실용적인 것이 최고","선물은 의미와 정성이 최고"],
  ["기념일은 꼭 챙기기","평소 잘하는 것이 더 중요"],
  ["고민은 바로 이야기하기","정리한 뒤 차분하게 이야기하기"],
  ["집 데이트가 최고","밖에서 새로운 경험하기"],
  ["애인의 친구들과 자주 어울리기","연인과 친구 관계는 분리하기"],
  ["사진과 기록을 많이 남기기","순간에 집중하고 기록은 적게"],
  ["미래 계획을 미리 세우기","현재의 행복에 집중하기"]
 ],
 court:[
  ["CASE 01 · 기념일을 잊은 애인","한 사람은 몇 주 전부터 준비했지만 다른 한 사람은 1주년을 완전히 잊었다.",["유죄! 기념일은 중요한 약속이다","일부 유죄! 진심 어린 사과와 회복이 필요하다","무죄! 날짜보다 평소 행동이 중요하다"]],
  ["CASE 02 · 이성 친구와 단둘이 식사","애인이 미리 말하지 않고 친한 이성 친구와 저녁을 먹었다.",["유죄! 사전에 이야기했어야 한다","상황에 따라 판단해야 한다","무죄! 서로의 인간관계를 존중해야 한다"]],
  ["CASE 03 · 데이트 비용의 불균형","최근 데이트 비용을 한 사람이 대부분 부담하고 있다.",["유죄! 부담을 공평하게 나눠야 한다","대화로 각자의 상황을 조정해야 한다","무죄! 형편에 따라 유연하게 부담할 수 있다"]],
  ["CASE 04 · 먼저 사과하지 않은 사람","말다툼 이후 서로 자신의 잘못이 아니라고 생각하며 사과를 미루고 있다.",["먼저 사과하지 않은 쪽이 유죄","둘 다 대화할 책임이 있다","누가 먼저인지보다 해결이 중요하다"]],
  ["CASE 05 · 커플 사진을 올리지 않는 애인","한 사람은 SNS에 커플 사진을 올리고 싶지만 다른 사람은 공개를 원하지 않는다.",["유죄! 연애 사실을 숨기는 것 같다","서로의 공개 범위를 합의해야 한다","무죄! SNS 공개는 개인의 선택이다"]]
 ],
 cipher:[
  ["상대방이 가장 좋아하는 데이트 방식은 무엇일까?", "manual",0],
  ["상대방이 기분이 안 좋을 때 가장 원하는 행동은?", "manual",0],
  ["상대방이 가장 듣고 싶은 말은 무엇일까?", "manual",3]
 ]
};
const MBTI_DESC = {
 ISTJ:"차분하고 신뢰를 중요하게 여기는 현실적인 연구원",ISFJ:"작은 배려와 꾸준한 관심을 소중히 여기는 연구원",INFJ:"깊은 대화와 관계의 의미를 중요하게 여기는 연구원",INTJ:"생각을 정리하고 합리적인 해결책을 찾는 연구원",
 ISTP:"상황에 맞게 유연하게 움직이는 실용적인 연구원",ISFP:"현재의 감정과 편안한 분위기를 소중히 여기는 연구원",INFP:"진심과 가치관의 교감을 중요하게 여기는 연구원",INTP:"호기심을 바탕으로 다양한 가능성을 탐색하는 연구원",
 ESTP:"함께 경험하고 행동하며 즐거움을 찾는 연구원",ESFP:"즐거운 순간과 생생한 교류를 좋아하는 연구원",ENFP:"새로운 경험과 풍부한 대화를 즐기는 연구원",ENTP:"재치 있는 질문과 색다른 관점을 즐기는 연구원",
 ESTJ:"명확한 계획과 실행을 중요하게 여기는 연구원",ESFJ:"함께하는 분위기와 서로의 만족을 살피는 연구원",ENFJ:"상대의 감정을 세심하게 살피는 연구원",ENTJ:"목표를 세우고 함께 추진하는 것을 좋아하는 연구원"
};
function showScreen(id){screens.forEach(s=>$(s).classList.toggle("hidden",s!==id));window.scrollTo({top:0,behavior:"smooth"});}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}
function fillMbti(){["hostMbti","guestMbti"].forEach(id=>$(id).innerHTML=MBTIS.map(m=>`<option value="${m}">${m} · ${MBTI_DESC[m]}</option>`).join(""));}
function makeCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s;}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function roomRef(){return doc(db,"rooms",roomId);}
function isConfigured(){return FIREBASE_READY && db && auth && user;}
async function initFirebase(){
 if(!FIREBASE_READY){$("connectionLabel").textContent="CONFIG REQUIRED · DEMO AVAILABLE";return;}
 try{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);const credential=await signInAnonymously(auth);user=credential.user;onAuthStateChanged(auth,u=>{user=u;});$("connectionLabel").textContent="FIREBASE CONNECTED";}
 catch(e){console.error(e);$("connectionLabel").textContent="CONNECTION ERROR";toast("Firebase 연결에 실패했습니다. 설정과 인증을 확인하세요.");}
}
function localRoom(){return {code:"DEMO42",status:"waiting",host:{uid:"localA",name:"나",mbti:"ENFP"},guest:null,answers:{},completed:[],createdAt:Date.now(),duration:"1~3년"};}
function listenRoom(){
 if(roomUnsub)roomUnsub();
 if(localDemo){renderRoom();return;}
 roomUnsub=onSnapshot(roomRef(),snap=>{if(!snap.exists()){toast("연구실을 찾을 수 없습니다.");return;}roomData=snap.data();renderRoom();},err=>{console.error(err);toast("실시간 연결 오류: Firestore 규칙을 확인하세요.");});
}
async function createRoom(){
 const name=$("hostName").value.trim(),mbti=$("hostMbti").value;
 if(!name){toast("닉네임을 입력해 주세요.");return;}
 myProfile={name,mbti};myRole="host";
 if(!isConfigured()){localDemo=true;roomId="DEMO42";roomData=localRoom();roomData.host={uid:"localA",name,mbti};showScreen("waiting");$("inviteCode").textContent=roomData.code;$("waitingText").textContent="데모 모드입니다. 실제 2인 연결은 Firebase 설정 후 이용할 수 있어요.";return;}
 try{
  let code=makeCode(),ref;
  for(let i=0;i<8;i++){ref=doc(db,"rooms",code);const existing=await getDoc(ref);if(!existing.exists())break;code=makeCode();}
  roomId=code;const data={code,status:"waiting",host:{uid:user.uid,...myProfile},guest:null,answers:{},completed:[],currentLab:0,duration:$("duration").value,createdAt:serverTimestamp(),expiresAt:Date.now()+24*60*60*1000};
  await setDoc(ref,data);roomData=data;showScreen("waiting");$("inviteCode").textContent=code;listenRoom();
 }catch(e){console.error(e);toast("연구실 생성 실패: "+e.message);}
}
async function joinRoom(){
 const code=$("joinCode").value.trim().toUpperCase(),name=$("guestName").value.trim(),mbti=$("guestMbti").value;
 if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code)){toast("초대 코드 6자리를 확인해 주세요.");return;}
 if(!name){toast("닉네임을 입력해 주세요.");return;}
 myProfile={name,mbti};myRole="guest";
 if(!isConfigured()){toast("실제 입장에는 Firebase 설정이 필요합니다. 현재는 데모 모드로 실행할 수 있어요.");return;}
 try{
  roomId=code;const ref=roomRef();
  await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error("초대 코드를 찾을 수 없습니다.");const d=snap.data();if(d.guest)throw new Error("이미 두 명이 참여 중인 연구실입니다.");if(d.status!=="waiting")throw new Error("이미 시작된 연구실입니다.");tx.update(ref,{guest:{uid:user.uid,...myProfile},status:"ready"});});
  showScreen("waiting");$("inviteCode").textContent=code;listenRoom();
 }catch(e){console.error(e);toast(e.message||"입장에 실패했습니다.");}
}
function renderRoom(){
 if(!roomData)return;
 $("inviteCode").textContent=roomData.code||roomId;
 const guest=roomData.guest;
 $("waitingText").textContent=guest?`${guest.name} 연구원 접속 완료! 연구를 시작할 수 있습니다.`:"상대방이 입장하면 실험이 시작됩니다.";
 $("startLabBtn").classList.toggle("hidden",!(myRole==="host"&&guest&&roomData.status!=="active"));
 if(roomData.status==="active"||roomData.status==="complete"){showScreen("dashboard");renderDashboard();}
}
async function startLab(){
 if(localDemo){roomData.status="active";roomData.guest={uid:"localB",name:"상대방",mbti:"ISTP"};renderDashboard();showScreen("dashboard");return;}
 await updateDoc(roomRef(),{status:"active"});showScreen("dashboard");
}
function renderDashboard(){
 const p=[roomData.host,roomData.guest].filter(Boolean);
 $("roomTitle").textContent=`${p.map(x=>x.name).join(" & ")}의 연구실`;
 $("roomSub").textContent=`${roomData.duration||"연애 실험"} · 두 사람의 응답을 분석하고 있어요.`;
 $("dashCode").textContent=roomData.code;
 $("researchers").innerHTML=p.map((x,i)=>`<div class="researcher"><div class="avatar">${escapeHtml(x.name.slice(0,1))}</div><div><strong>${escapeHtml(x.name)}</strong><small>${x.mbti} · ${escapeHtml(MBTI_DESC[x.mbti]||"연구원")}</small></div><span class="online">● ONLINE</span></div>`).join("");
 const completed=roomData.completed||[];$("progressText").textContent=`${completed.length} / 7`;$("progressBar").style.width=(completed.length/7*100)+"%";
 $("labGrid").innerHTML=LABS.map((l,i)=>{const done=completed.includes(l.id),unlocked=i===0||completed.includes(LABS[i-1].id);return `<button class="lab-card" data-lab="${l.id}" ${(!unlocked&&!done)?"disabled":""}><span class="state">${done?"✓ COMPLETE":unlocked?"UNLOCKED":"LOCKED"}</span><span class="lab-no">${l.no}</span><strong>${l.title}</strong><small>${l.desc}</small></button>`}).join("");
 document.querySelectorAll("[data-lab]").forEach(b=>b.addEventListener("click",()=>openLab(b.dataset.lab)));
 $("resumeBtn").onclick=()=>{const next=LABS.find(l=>!completed.includes(l.id))||LABS[6];openLab(next.id);};
}
function answersFor(lab,q){return roomData?.answers?.[lab]?.[q]||{};}
function questionFor(lab,index){
 if(lab==="cipher"){const [prompt,source,sourceIndex]=BANK.cipher[index];const peer=roomData?.[source]?.[sourceIndex]||null;return {q:prompt,options:["첫 번째 선택지","두 번째 선택지","세 번째 선택지","네 번째 선택지"],type:"cipher"};}
 if(lab==="court"){const [title,desc,opts]=BANK.court[index];return {q:`${title}\n${desc}`,options:opts,type:"court"};}
 const arr=BANK[lab]||[];return arr[index%arr.length];
}
function getCount(lab){return LABS.find(l=>l.id===lab)?.count||1;}
function openLab(lab){
 activeLab=lab;currentQuestion=0;selectedAnswer=null;
 if(lab==="report"){renderReport();showScreen("result");return;}
 showScreen("experiment");renderQuestion();
}
function renderQuestion(){
 const lab=LABS.find(l=>l.id===activeLab),count=getCount(activeLab);
 $("expEyebrow").textContent=lab.no;$("expTitle").textContent=lab.title;
 $("stepCount").textContent=`${String(currentQuestion+1).padStart(2,"0")} / ${String(count).padStart(2,"0")}`;
 $("expProgress").style.width=((currentQuestion/count)*100)+"%";
 const q=questionFor(activeLab,currentQuestion);const prior=answersFor(activeLab,currentQuestion);
 const mine=prior[myRole];const otherRole=myRole==="host"?"guest":"host";
 const content=$("experimentContent");
 if(activeLab==="telepathy"||activeLab==="manual"||activeLab==="scenario"||activeLab==="balance"||activeLab==="court"){
  const isPredict=activeLab==="telepathy"||activeLab==="manual";
  let prompt=q.q||q[0],opts=q.options||q[1],extra=q[2]||"";
  if(isPredict&&mine?.guess===undefined){
   content.innerHTML=`<div class="question-card"><div class="question-tag">PREDICTION ROUND</div><h3>${escapeHtml(prompt)}</h3><p class="hint">상대방이 선택할 것 같은 답을 먼저 예측하세요.</p><div class="options">${opts.map((o,i)=>`<button class="option" data-choice="${i}"><span class="letter">${String.fromCharCode(65+i)}</span>${escapeHtml(o)}</button>`).join("")}</div></div>`;
   content.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>submitAnswer(Number(b.dataset.choice),"guess"));
  } else if(isPredict&&mine?.actual===undefined){
   content.innerHTML=`<div class="question-card"><div class="question-tag">YOUR REAL ANSWER</div><h3>${escapeHtml(prompt)}</h3><p class="hint">이번에는 본인의 실제 답을 선택하세요.</p><div class="options">${opts.map((o,i)=>`<button class="option" data-choice="${i}"><span class="letter">${String.fromCharCode(65+i)}</span>${escapeHtml(o)}</button>`).join("")}</div></div>`;
   content.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>submitAnswer(Number(b.dataset.choice),"actual"));
  } else if(!isPredict&&!mine){
   content.innerHTML=`<div class="question-card"><div class="question-tag">${lab.no} · QUESTION ${currentQuestion+1}</div><h3>${escapeHtml(prompt).replace("\n","<br>")}</h3>${extra?`<p class="hint">${escapeHtml(extra)}</p>`:""}<div class="options">${opts.map((o,i)=>`<button class="option" data-choice="${i}"><span class="letter">${String.fromCharCode(65+i)}</span>${escapeHtml(o)}</button>`).join("")}</div></div>`;
   content.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>submitAnswer(Number(b.dataset.choice),"answer"));
  } else {
   renderWaitingOrReveal(q,prior,opts);
  }
 } else {
  const source=roomData?.answers?.manual||{};
  const prompt=q.q;
  content.innerHTML=`<div class="question-card"><div class="question-tag">FINAL CIPHER · CLUE ${currentQuestion+1}</div><h3>${escapeHtml(prompt)}</h3><p class="hint">상대방이 앞선 실험에서 입력한 답변을 떠올려 보세요. 정답 선택은 아직 간단한 추리형으로 진행됩니다.</p><div class="options">${["상대방의 첫 번째 선택","상대방의 두 번째 선택","상대방의 세 번째 선택","상대방의 네 번째 선택"].map((o,i)=>`<button class="option" data-choice="${i}"><span class="letter">${String.fromCharCode(65+i)}</span>${o}</button>`).join("")}</div></div>`;
  content.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>submitAnswer(Number(b.dataset.choice),"answer"));
 }
}
function renderWaitingOrReveal(q,prior,opts){
 const content=$("experimentContent"),otherRole=myRole==="host"?"guest":"host",mine=prior[myRole],other=prior[otherRole];
 if(mine&&other){
  const myVal=mine.actual??mine.answer??mine.guess,otherVal=other.actual??other.answer??other.guess;
  content.innerHTML=`<div class="question-card"><div class="question-tag">RESULT REVEALED</div><h3>두 사람의 선택을 공개합니다.</h3><div class="reveal-grid"><div class="reveal"><small>MY ANSWER</small><strong>${escapeHtml(opts?.[myVal]??"응답")}</strong></div><div class="reveal"><small>PARTNER</small><strong>${escapeHtml(opts?.[otherVal]??"응답")}</strong></div></div><p class="hint">${myVal===otherVal?"✨ 같은 선택이에요! 마음이 통했네요.":"서로 다른 선택이에요. 어떤 생각이었는지 이야기해 보세요."}</p><button class="btn primary" id="nextQuestion">다음 질문</button></div>`;
  $("nextQuestion").onclick=nextQuestion;
 }else{
  content.innerHTML=`<div class="waiting-inline"><div class="waiting-orbit"><div>♥</div></div><strong>상대방의 응답을 기다리는 중</strong><p>두 사람 모두 응답을 완료하면 결과가 공개됩니다.</p><p class="hint">이 화면을 닫지 않아도 실시간으로 업데이트됩니다.</p></div>`;
 }
}
async function submitAnswer(value,kind){
 const qkey=String(currentQuestion),path=`answers.${activeLab}.${qkey}.${myRole}`;
 const existing=answersFor(activeLab,currentQuestion);
 let payload={...existing,[myRole]:{...(existing[myRole]||{}),[kind]:value,updatedAt:Date.now()}};
 if(localDemo){
  roomData.answers[activeLab]??={};roomData.answers[activeLab][qkey]=payload;
  // Demo partner response is synthetic and explicitly labelled as a preview.
  if(!roomData.answers[activeLab][qkey].guest&&!roomData.answers[activeLab][qkey].host){
   roomData.answers[activeLab][qkey].guest={guess:(value+1)%4,actual:(value+1)%4,answer:(value+1)%4,preview:true};
  }
  renderQuestion();return;
 }
 try{
  await updateDoc(roomRef(),{[path]:payload[myRole]});
  // A listener refreshes the shared state. Keep the user on the same question.
  toast("응답이 안전하게 저장되었습니다.");
 }catch(e){console.error(e);toast("응답 저장 실패: "+e.message);}
}
function nextQuestion(){
 const count=getCount(activeLab);
 if(currentQuestion<count-1){currentQuestion++;renderQuestion();return;}
 completeLab(activeLab);
}
async function completeLab(lab){
 if(localDemo){roomData.completed=[...new Set([...(roomData.completed||[]),lab])];renderDashboard();showScreen("dashboard");return;}
 try{await runTransaction(db,async tx=>{const snap=await tx.get(roomRef());const d=snap.data();const completed=[...new Set([...(d.completed||[]),lab])];tx.update(roomRef(),{completed});});showScreen("dashboard");}catch(e){console.error(e);toast("실험 완료 처리에 실패했습니다.");}
}
function adaptiveNext(lab,index){
 // v1 adaptive sequencing: use the previous answer to choose the next unused prompt
 // from a topic bucket. The question bank remains deterministic across both clients.
 return Math.min(index+1,getCount(lab)-1);
}
function renderReport(){
 const all=roomData?.answers||{},host=roomData?.host||{},guest=roomData?.guest||{};
 let match=0,total=0,understood=0,underTotal=0,scenarioDiff=0,scenarioTotal=0;
 Object.entries(all.telepathy||{}).forEach(([k,v])=>{if(v.host?.actual!==undefined&&v.guest?.guess!==undefined){total++;if(v.guest.guess===v.host.actual)match++;}if(v.guest?.actual!==undefined&&v.host?.guess!==undefined){total++;if(v.host.guess===v.guest.actual)match++;}});
 Object.entries(all.manual||{}).forEach(([k,v])=>{if(v.host?.actual!==undefined&&v.guest?.guess!==undefined){underTotal++;if(v.guest.guess===v.host.actual)understood++;}if(v.guest?.actual!==undefined&&v.host?.guess!==undefined){underTotal++;if(v.host.guess===v.guest.actual)understood++;}});
 Object.values(all.scenario||{}).forEach(v=>{if(v.host?.answer!==undefined&&v.guest?.answer!==undefined){scenarioTotal++;if(v.host.answer!==v.guest.answer)scenarioDiff++;}});
 Object.values(all.balance||{}).forEach(v=>{if(v.host?.answer!==undefined&&v.guest?.answer!==undefined){total++;if(v.host.answer===v.guest.answer)match++;}});
 const pct=(a,b)=>b?Math.round(a/b*100):0,tele=pct(match,total),know=pct(understood,underTotal),scenario=pct(scenarioDiff,scenarioTotal);
 const avg=Math.round((tele+know+(100-scenario))/3);
 const type=avg>=80?"텔레파시 커플":avg>=60?"성장형 커플":avg>=40?"반전 매력 커플":"서로를 알아가는 탐험가";
 $("reportContent").innerHTML=`<div class="report-hero"><div class="eyebrow">COUPLE TYPE IDENTIFIED</div><div class="report-score">${avg}%</div><div class="report-type">${type}</div><p class="muted">${escapeHtml(host.name||"A")} (${host.mbti||"-"}) × ${escapeHtml(guest.name||"B")} (${guest.mbti||"-"})</p></div>
 <div class="insight"><strong>🧠 텔레파시 정확도 · ${tele}%</strong><p>서로의 선택을 예측한 결과예요. 점수가 높을수록 상대방의 취향을 잘 떠올렸다는 의미입니다.</p></div>
 <div class="insight"><strong>💗 상대방 이해도 · ${know}%</strong><p>상대방이 직접 알려준 취향을 얼마나 정확하게 예상했는지 보여줍니다.</p></div>
 <div class="insight"><strong>⚡ 선택 차이 · ${scenario}%</strong><p>상황극에서 서로 다른 반응을 보인 비율입니다. 차이는 갈등의 증거가 아니라 대화를 시작할 단서예요.</p></div>
 <div class="insight"><strong>💌 LOVE LAB 처방전</strong><p>서로 다른 선택이 나온 질문 하나를 골라, 왜 그렇게 생각했는지 3분 동안 이야기해 보세요. 상대방의 답을 바꾸려 하기보다 그 선택에 담긴 이유를 알아가는 것이 이번 실험의 목표입니다.</p></div>
 <p class="hint">이 결과는 게임 응답을 바탕으로 만든 오락용 분석이며 과학적으로 검증된 심리검사나 MBTI 궁합 진단이 아닙니다. 실험에 응답하지 않은 문항은 점수에서 제외됩니다.</p>`;
}
function getReportText(){const el=$("reportContent");return "LOVE LAB 커플 연구 보고서\n"+el.innerText.replace(/\n{2,}/g,"\n");}
function leaveRoom(){if(roomUnsub)roomUnsub();roomUnsub=null;roomId=null;roomData=null;myRole=null;myProfile=null;localDemo=false;showScreen("hero");}
function setupEvents(){
 $("createRoomBtn").onclick=()=>showScreen("setup");$("joinRoomBtn").onclick=()=>showScreen("join");
 $("confirmCreate").onclick=createRoom;$("confirmJoin").onclick=joinRoom;
 $("startLabBtn").onclick=startLab;$("copyCode").onclick=()=>navigator.clipboard?.writeText(roomData?.code||roomId).then(()=>toast("초대 코드를 복사했습니다.")).catch(()=>toast("코드 복사에 실패했습니다."));
 document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>showScreen("hero"));
 $("dashBack").onclick=()=>{showScreen("dashboard");renderDashboard();};
 $("backDashboard").onclick=()=>{showScreen("dashboard");renderDashboard();};
 $("leaveBtn").onclick=leaveRoom;
 $("shareReport").onclick=()=>{const txt=getReportText();navigator.clipboard?.writeText(txt).then(()=>toast("결과 요약을 복사했습니다.")).catch(()=>toast("복사할 수 없습니다."));};
 $("homeBrand").onclick=e=>{e.preventDefault();if(roomData){showScreen("dashboard");renderDashboard();}else showScreen("hero");};
}
fillMbti();setupEvents();initFirebase();
