const stocks = {
  AAPL:{name:"Apple Inc.",symbol:"AAPL",exchange:"NASDAQ",price:227.16,change:1.82,percent:.81,logo:"A",data:[52,54,53,58,56,60,59,63,62,67,65,69,68,72,70,75,73,76,74,79,77,81]},
  MSFT:{name:"Microsoft",symbol:"MSFT",exchange:"NASDAQ",price:415.26,change:-2.14,percent:-.51,logo:"M",data:[70,68,71,69,73,72,75,74,76,73,71,74,72,70,69,72,75,73,76,74,72,71]},
  NVDA:{name:"NVIDIA",symbol:"NVDA",exchange:"NASDAQ",price:138.85,change:3.42,percent:2.52,logo:"N",data:[45,48,47,51,55,54,58,61,60,64,67,66,70,73,71,76,79,78,82,85,84,88]},
  TSLA:{name:"Tesla",symbol:"TSLA",exchange:"NASDAQ",price:248.98,change:-4.31,percent:-1.70,logo:"T",data:[80,77,79,74,76,70,72,68,71,67,69,65,63,66,61,64,60,58,62,57,59,56]}
};
const news = [
  {title:"Fed signals patience as investors weigh the next rate move",source:"Bloomberg",time:"18 min ago",category:"Markets",color:"7fa095"},
  {title:"AI spending continues to reshape the technology sector",source:"Yahoo Finance",time:"42 min ago",category:"Technology",color:"c3b59a"},
  {title:"Oil slips as traders monitor global supply outlook",source:"Reuters",time:"1 hr ago",category:"Commodities",color:"8e9fba"},
  {title:"Wall Street opens higher ahead of key earnings reports",source:"CNBC",time:"2 hrs ago",category:"Markets",color:"b09b93"},
  {title:"What the latest consumer data means for retail stocks",source:"Bloomberg",time:"3 hrs ago",category:"Economy",color:"96aeb1"}
];
const terms = [
  ["Bull market","A market experiencing sustained price increases and investor optimism."],
  ["Bear market","A market with sustained price declines, typically 20% or more."],
  ["Dividend","A distribution of a company's earnings paid to shareholders."],
  ["Market cap","The total market value of a company's outstanding shares."],
  ["P/E ratio","Price divided by earnings per share, used to value a stock."],
  ["ETF","A basket of securities that trades on an exchange like a stock."],
  ["Volatility","The degree and speed of price movement in an asset."],
  ["Liquidity","How easily an asset can be bought or sold without affecting its price."],
  ["Bid-ask spread","The difference between the highest bid and lowest asking price."],
  ["Options","Contracts giving the right, not the obligation, to buy or sell an asset."],
  ["Call option","An option that gives the holder the right to buy at a set price."],
  ["Put option","An option that gives the holder the right to sell at a set price."]
];
const strategies = [
  ["↗","Covered Call","Sell call options against shares you own to generate income.","Neutral · income","Low–Moderate"],
  ["→","Long Call","Buy a call to benefit from a rise in a stock's price.","Bullish","Defined"],
  ["←","Long Put","Buy a put to profit from a decline or hedge existing shares.","Bearish · hedge","Defined"],
  ["×","Long Straddle","Buy a call and put at the same strike to prepare for a big move.","High volatility","Defined"],
  ["◇","Iron Condor","Sell a range of options and buy protection around both ends.","Low volatility","Defined"],
  ["÷","Cash-Secured Put","Sell a put while holding cash to buy the shares if assigned.","Bullish · income","Moderate"]
];
let selected = "AAPL";
let currentRange = "1W";
const rangeConfig = {
  "1D": {length:12, labels:["9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM"], wave:.08},
  "1W": {length:22, labels:["Mon","Tue","Wed","Thu","Fri"], wave:.10},
  "1M": {length:30, labels:["Week 1","Week 2","Week 3","Week 4"], wave:.14},
  "3M": {length:36, labels:["Jul","Aug","Sep","Oct","Nov"], wave:.20},
  "1Y": {length:48, labels:["Dec","Feb","Apr","Jun","Aug","Oct","Dec"], wave:.28}
};
const rangeDatasets = {};

function signed(n){ return n >= 0 ? "+" : ""; }
function formatPrice(stock){ return "$" + stock.price.toFixed(2); }
function formatChange(stock){ return `${signed(stock.change)}${stock.change.toFixed(2)} (${signed(stock.percent)}${stock.percent.toFixed(2)}%)`; }

function renderTicker(){
  document.getElementById("tickerStrip").innerHTML = Object.values(stocks).map(s =>
    `<div class="ticker"><strong>${s.symbol}</strong><span>${formatPrice(s)}</span><em class="${s.change<0?'negative':''}">${signed(s.percent)}${s.percent.toFixed(2)}%</em></div>`
  ).join("");
}
function renderWatchlist(){
  const focusedSymbol = document.activeElement && document.activeElement.classList.contains("watch-item")
    ? document.activeElement.dataset.symbol : null;
  document.getElementById("watchlist").innerHTML = Object.values(stocks).map(s =>
    `<button class="watch-item ${s.symbol===selected?'active':''}" data-symbol="${s.symbol}">
      <div class="watch-item-top"><strong>${s.symbol}</strong><span>${s.exchange}</span></div>
      <div class="watch-item-price"><strong>${formatPrice(s)}</strong><span class="${s.change<0?'negative':''}">${signed(s.percent)}${s.percent.toFixed(2)}%</span></div>
    </button>`).join("");
  document.queryEach(".watch-item").forEach(b => b.addEventListener("click",()=>selectStock(b.dataset.symbol)));
  if(focusedSymbol){
    const focused=document.querySelector(`.watch-item[data-symbol="${focusedSymbol}"]`);
    if(focused)focused.focus({preventScroll:true});
  }
}
document.queryEach = function(selector){ return Array.from(document.querySelectorAll(selector)); };

function chartSvg(values, title){
  const w=700,h=210,pad=8,min=Math.min(...values)-3,max=Math.max(...values)+3;
  const pts=values.map((v,i)=>{const x=pad+i*(w-pad*2)/(values.length-1);const y=h-pad-(v-min)*(h-pad*2)/(max-min);return [x,y]});
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(" ");
  const area=`${d} L${w-pad},${h} L${pad},${h} Z`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${title}"><title>${title}</title><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d9b7e" stop-opacity=".18"/><stop offset="1" stop-color="#3d9b7e" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#chartFill)"/><path d="${d}" fill="none" stroke="#248267" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
}
function deterministicSeed(symbol, range){
  let seed=0;
  `${symbol}-${range}`.split("").forEach(c=>seed=((seed*31)+c.charCodeAt(0))>>>0);
  return seed;
}
function generateRangeData(stock, range){
  const config=rangeConfig[range];
  const seed=deterministicSeed(stock.symbol,range);
  const length=config.length;
  const base=stock.data[stock.data.length-1];
  let values=[];
  for(let i=0;i<length;i++){
    const variation=Math.sin((i+seed%13)*.72)*config.wave*4;
    const trend=(i-(length-1)*.5)*config.wave*.18;
    values.push(base+trend+variation+(seed%7-3)*.08);
  }
  values[values.length-1]=base;
  return values;
}
function getRangeData(stock, range){
  const key=`${stock.symbol}-${range}`;
  if(!rangeDatasets[key])rangeDatasets[key]=generateRangeData(stock,range);
  return rangeDatasets[key];
}
function renderChartLabels(range){
  const labels=rangeConfig[range].labels;
  document.querySelector(".chart-times").innerHTML=labels.map(label=>`<span>${label}</span>`).join("");
}
function renderSelectedChart(){
  const stock=stocks[selected];
  const values=getRangeData(stock,currentRange);
  const chart=document.getElementById("chart");
  const title=`${stock.name} (${stock.symbol}) ${currentRange} stock price chart`;
  chart.setAttribute("aria-label",title);
  chart.innerHTML=chartSvg(values,title);
  renderChartLabels(currentRange);
}
function selectStock(symbol){
  selected=symbol; const s=stocks[symbol];
  document.getElementById("selectedLogo").textContent=s.logo;
  document.getElementById("selectedName").textContent=s.name;
  document.getElementById("selectedSymbol").textContent=`${s.symbol} · ${s.exchange}`;
  document.getElementById("selectedPrice").textContent=formatPrice(s);
  document.getElementById("selectedChange").textContent=formatChange(s);
  document.getElementById("selectedChange").className=s.change>=0?"positive":"negative";
  renderSelectedChart();
  renderWatchlist(); updateFollowButton();
}
function renderNews(){
  document.getElementById("newsPreview").innerHTML=news.slice(0,4).map(n=>`
    <article class="news-preview-item"><div class="news-thumb" style="background:#${n.color}"></div><div class="news-item-copy"><p>${n.title}</p><div class="news-meta">${n.source} · ${n.time}</div></div></article>`).join("");
  document.getElementById("fullNews").innerHTML=news.map(n=>`
    <article class="full-news-item"><div class="news-thumb" style="width:140px;height:90px;background:#${n.color}"></div><div><div class="news-meta">${n.category} · ${n.time}</div><h3>${n.title}</h3><p>Latest reporting and market context from ${n.source}.</p></div><span class="source-badge">${n.source}</span></article>`).join("");
}
function renderTerms(){
  document.getElementById("termsGrid").innerHTML=terms.map(t=>`
    <article class="term-card" tabindex="0" role="button" aria-expanded="false" aria-label="${t[0]}: ${t[1]}">
      <h3>${t[0]}</h3><p>${t[1]}</p>
    </article>`).join("");
  document.queryEach(".term-card").forEach(card=>{
    const toggle=()=>{
      const expanded=card.classList.toggle("expanded");
      card.setAttribute("aria-expanded",expanded?"true":"false");
    };
    card.addEventListener("click",toggle);
    card.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle();}
    });
  });
}
function renderStrategies(){
  document.getElementById("strategyGrid").innerHTML=strategies.map(s=>`
    <article class="strategy-card"><div class="strategy-icon">${s[0]}</div><h3>${s[1]}</h3><p>${s[2]}</p><div class="risk-row"><span>Outlook</span><strong>${s[3]}</strong></div><div class="risk-row"><span>Risk profile</span><strong>${s[4]}</strong></div></article>`).join("");
}

function showPage(page){
  document.queryEach(".page").forEach(p=>p.classList.toggle("active",p.id===page));
  document.queryEach(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelector(".brand").addEventListener("click",e=>{
  e.preventDefault();
  showPage("dashboard");
});
document.queryEach(".nav-link").forEach(n=>n.addEventListener("click",()=>showPage(n.dataset.page)));
document.queryEach("[data-page-jump]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.pageJump)));
document.queryEach(".range-buttons button").forEach(b=>{
  b.addEventListener("click",()=>{
    currentRange=b.dataset.range;
    document.queryEach(".range-buttons button").forEach(x=>{
      const selectedRange=x===b;
      x.classList.toggle("active",selectedRange);
      x.setAttribute("aria-pressed",selectedRange?"true":"false");
    });
    renderSelectedChart();
  });
});

document.getElementById("searchToggle").addEventListener("click",()=>{
  showPage("terms");
  document.getElementById("glossarySearch").focus();
});

function getFollows(){ try{return JSON.parse(localStorage.getItem("tradewise-follows")||"[]")}catch{return []} }
function saveFollows(f){localStorage.setItem("tradewise-follows",JSON.stringify(f))}
function updateFollowButton(){
  const f=getFollows(),b=document.getElementById("followButton");const following=f.includes(selected);
  b.textContent=following?"★ Following":"☆ Follow";b.classList.toggle("following",following);
}
document.getElementById("followButton").addEventListener("click",()=>{
  const f=getFollows(),i=f.indexOf(selected);
  if(i>=0)f.splice(i,1);else f.push(selected);saveFollows(f);updateFollowButton();
});

const loginModal=document.getElementById("loginModal");
let loginReturnFocus=null;
function openLoginModal(){
  loginReturnFocus=document.activeElement;
  loginModal.classList.remove("hidden");
  document.body.style.overflow="hidden";
  document.getElementById("email").focus();
}
function closeLoginModal(){
  loginModal.classList.add("hidden");
  document.body.style.overflow="";
  if(loginReturnFocus && typeof loginReturnFocus.focus==="function" && !loginReturnFocus.classList.contains("hidden")){
    loginReturnFocus.focus();
  }else{
    const avatar=document.getElementById("avatarButton");
    if(!avatar.classList.contains("hidden"))avatar.focus();
  }
  loginReturnFocus=null;
}
function setLoginState(){
  const user=localStorage.getItem("tradewise-user");
  document.getElementById("loginButton").classList.toggle("hidden",!!user);
  document.getElementById("avatarButton").classList.toggle("hidden",!user);
  if(user)document.getElementById("avatarButton").textContent=user.charAt(0).toUpperCase();
}
document.getElementById("loginButton").addEventListener("click",openLoginModal);
document.getElementById("closeLogin").addEventListener("click",closeLoginModal);
loginModal.addEventListener("click",e=>{if(e.target===loginModal)closeLoginModal()});
document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();const email=document.getElementById("email").value;const name=email.split("@")[0];
  localStorage.setItem("tradewise-user",name);setLoginState();closeLoginModal();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(!loginModal.classList.contains("hidden"))closeLoginModal();
    closeAccountMenu();
  }
  if(e.key==="Tab" && !loginModal.classList.contains("hidden")){
    const focusable=Array.from(loginModal.querySelectorAll("button,input,[href],[tabindex]:not([tabindex='-1'])"))
      .filter(el=>!el.hasAttribute("disabled")&&!el.closest(".hidden"));
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.getElementById("glossarySearch").addEventListener("input",e=>{
  const q=e.target.value.toLowerCase();
  document.queryEach(".term-card").forEach(c=>c.classList.toggle("hidden",!c.textContent.toLowerCase().includes(q)));
});
const avatarButton=document.getElementById("avatarButton");
const accountMenu=document.getElementById("accountMenu");
function closeAccountMenu(){
  accountMenu.classList.add("hidden");
  avatarButton.setAttribute("aria-expanded","false");
}
avatarButton.addEventListener("click",e=>{
  e.stopPropagation();
  const opening=accountMenu.classList.contains("hidden");
  accountMenu.classList.toggle("hidden",!opening);
  avatarButton.setAttribute("aria-expanded",opening?"true":"false");
  if(opening)document.getElementById("logoutButton").focus();
});
document.getElementById("logoutButton").addEventListener("click",()=>{
  localStorage.removeItem("tradewise-user");
  closeAccountMenu();
  setLoginState();
  document.getElementById("loginButton").focus();
});
document.addEventListener("click",e=>{
  if(!e.target.closest(".account-menu-wrap"))closeAccountMenu();
});
document.getElementById("upgradeButton").addEventListener("click",()=>{
  localStorage.setItem("tradewise-premium","1");document.body.classList.add("ads-hidden");
});
document.getElementById("upgradeClose").addEventListener("click",()=>{
  localStorage.setItem("tradewise-upgrade-dismissed","1");
  document.getElementById("upgradeBar").classList.add("hidden");
});

function updateLivePrices(){
  Object.values(stocks).forEach(s=>{
    const drift=(Math.random()-0.48)*.12;
    s.price=Math.max(1,s.price+drift);
    s.change+=drift;
    s.percent=(s.change/(s.price-s.change))*100;
    const chartPoint=s.data[s.data.length-1]+drift*5;
    s.data.push(chartPoint);
    if(s.data.length>22)s.data.shift();
    Object.keys(rangeConfig).forEach(range=>{
      const key=`${s.symbol}-${range}`;
      if(rangeDatasets[key]){
        const values=rangeDatasets[key];
        values.push(values[values.length-1]+drift*(1+rangeConfig[range].wave*2));
        if(values.length>rangeConfig[range].length)values.shift();
      }
    });
  });
  const active=stocks[selected];renderTicker();renderWatchlist();
  document.getElementById("selectedPrice").textContent=formatPrice(active);
  document.getElementById("selectedChange").textContent=formatChange(active);
  document.getElementById("selectedChange").className=active.change>=0?"positive":"negative";
  renderSelectedChart();
}

renderTicker();renderWatchlist();renderNews();renderTerms();renderStrategies();selectStock("AAPL");setLoginState();
if(localStorage.getItem("tradewise-premium")==="1")document.body.classList.add("ads-hidden");
if(localStorage.getItem("tradewise-upgrade-dismissed")==="1")document.getElementById("upgradeBar").classList.add("hidden");
setInterval(updateLivePrices,4000);
