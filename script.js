(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("#year").textContent = new Date().getFullYear();

  // Lightweight canvas: capped node count, no external animation library.
  const canvas = $("#ambient-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0, height = 0, nodes = [], raf = 0;
  const pointer = { x: -1000, y: -1000 };
  const setupCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(58, Math.max(22, Math.floor(width * height / 26000)));
    nodes = Array.from({length: count}, () => ({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.4+.5}));
  };
  const drawCanvas = () => {
    ctx.clearRect(0,0,width,height);
    for (let i=0;i<nodes.length;i++) {
      const a=nodes[i];
      if (!reduceMotion) { a.x+=a.vx; a.y+=a.vy; }
      if (a.x<0||a.x>width) a.vx*=-1;
      if (a.y<0||a.y>height) a.vy*=-1;
      const dx=pointer.x-a.x, dy=pointer.y-a.y, dist=Math.hypot(dx,dy);
      if (dist<150 && !reduceMotion) { a.x-=dx*.0008; a.y-=dy*.0008; }
      ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,Math.PI*2); ctx.fillStyle="rgba(201,255,84,.56)"; ctx.fill();
      for (let j=i+1;j<nodes.length;j++) {
        const b=nodes[j], d=Math.hypot(a.x-b.x,a.y-b.y);
        if (d<105) { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=`rgba(160,205,115,${(1-d/105)*.14})`; ctx.lineWidth=.7; ctx.stroke(); }
      }
    }
    if (!reduceMotion) raf=requestAnimationFrame(drawCanvas);
  };
  setupCanvas(); drawCanvas();
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); setupCanvas(); drawCanvas(); }, {passive:true});
  window.addEventListener("pointermove", e => {
    pointer.x=e.clientX; pointer.y=e.clientY;
    document.documentElement.style.setProperty("--glow-x", e.clientX+"px");
    document.documentElement.style.setProperty("--glow-y", e.clientY+"px");
  }, {passive:true});

  // Reveal sections as they enter the viewport.
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:"0px 0px -35px 0px"});
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add("in-view"));

  // Dock navigation appears after the hero and tracks the current section.
  const dock = $("#command-dock");
  const sections = ["work","approach","experience","toolkit","contact"].map(id => $("#"+id)).filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target.id==="top") dock.classList.toggle("visible", !entry.isIntersecting);
      if (entry.isIntersecting) $$(".command-dock a").forEach(a => a.classList.toggle("active", a.dataset.nav===entry.target.id));
    });
  }, {threshold:0.12});
  navObserver.observe($("#top")); sections.forEach(s=>navObserver.observe(s));
  $("#menu-toggle").addEventListener("click", () => {
    const open = dock.classList.toggle("visible");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
    $("#menu-toggle").innerHTML = open ? 'CLOSE <span>×</span>' : 'MENU <span>＋</span>';
  });
  $$(".command-dock a").forEach(a=>a.addEventListener("click",()=>{dock.classList.remove("visible");$("#menu-toggle").setAttribute("aria-expanded","false");$("#menu-toggle").innerHTML='MENU <span>＋</span>';}));

  // Scroll progress and approach connector progress.
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    $("#scroll-progress-bar").style.width = (scrollable>0 ? window.scrollY/scrollable*100 : 0)+"%";
    const track=$("#process-track");
    if (track) {
      const rect=track.getBoundingClientRect(), mobile=window.innerWidth<=700;
      const total=mobile?track.offsetHeight:track.offsetWidth;
      const traveled=mobile?Math.max(0,Math.min(total,window.innerHeight*.72-rect.top)):Math.max(0,Math.min(total,window.innerWidth*.92-rect.left));
      $("#process-progress").style[mobile?"height":"width"]=(total?traveled/total*100:0)+"%";
      $$(".process-step").forEach((step,i)=>step.classList.toggle("is-active",step.getBoundingClientRect().top<window.innerHeight*.72));
    }
  };
  window.addEventListener("scroll",updateProgress,{passive:true});window.addEventListener("resize",updateProgress,{passive:true});updateProgress();

  // Card glow follows the pointer. Filters are accessible and work without a library.
  $$(".project-card").forEach(card=>card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect();card.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");card.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%");}));
  $$(".filter-chip").forEach(chip=>chip.addEventListener("click",()=>{
    const filter=chip.dataset.filter;
    $$(".filter-chip").forEach(c=>{const active=c===chip;c.classList.toggle("active",active);c.setAttribute("aria-pressed",String(active));});
    $$(".project-card").forEach(card=>{const tags=card.dataset.tags.split(" ");const show=filter==="all"||tags.includes(filter);card.classList.toggle("filtered-out",!show);});
  }));

  // Project case studies in a native dialog for keyboard focus and Escape support.
  const projectData = {
    email:{kicker:"CASE STUDY / 01 — DATABASE AUTOMATION",title:"MSSQL Email <em>Automation System</em>",lede:"A database-driven workflow for monthly timesheet reminders, designed around validation, repeatability, and traceability.",role:"Database Developer",problem:"Recurring reminders need a reliable process that checks eligibility, avoids duplicate messages, and leaves a clear record of what happened.",approach:["Model the data and required relationships.","Use T-SQL and stored procedures to coordinate the workflow.","Validate eligibility and prevent duplicate reminders.","Send dynamic HTML emails through Database Mail.","Record email activity for auditing and troubleshooting."],focus:"Database workflow design, validation rules, logging, auditability, and maintainability.",stack:["Microsoft SQL Server","T-SQL","Stored Procedures","Database Mail","HTML","Logging & Auditing"],result:"Implemented workflow capabilities include eligibility checks, duplicate prevention, email logging, and audit tracking. No time-saved or productivity metric is claimed because a measured baseline was not provided.",url:"https://github.com/Parinampraphul/MSSQL-EMAIL-AUTOMATION",link:"View repository"},
    bot:{kicker:"CASE STUDY / 02 — COMMUNICATION AUTOMATION",title:"Data & AI Guild <em>Event Reminder Bot</em>",lede:"A WhatsApp-based reminder utility supporting Data & AI Guild event announcements and follow-up communications.",role:"Software Developer",problem:"Event communication involves attendee lists, scheduled reminders, and follow-up messages that benefit from a repeatable workflow.",approach:["Set up the Node.js utility and Baileys WhatsApp integration.","Manage local multi-device authentication sessions.","Process attendee lists and event schedules.","Support reminder and follow-up messaging workflows."],focus:"Event communications, session management, attendee processing, and workflow automation.",stack:["Node.js","JavaScript","Baileys","WhatsApp Web integration","Git"],result:"Built to support event announcements and follow-up communications. The case study describes implemented capabilities rather than unverified delivery or engagement statistics.",url:"https://github.com/Parinampraphul",link:"Explore GitHub profile"},
    text:{kicker:"CASE STUDY / 03 — APPLICATION + NLP",title:"Text Analysis <em>Using OOP</em>",lede:"A Python desktop application combining authentication and text-processing capabilities with object-oriented programming principles.",role:"Application Developer",problem:"Text analysis tasks can require multiple techniques in one workflow, alongside a desktop interface and authentication capabilities.",approach:["Build the desktop interface using Tkinter.","Apply object-oriented design to organize application behavior.","Integrate SQL Server and Hugging Face APIs.","Support sentiment analysis, named entity recognition, keyword extraction, sarcasm detection, and abuse detection."],focus:"Application structure, API integration, text-processing capabilities, and OOP.",stack:["Python","Tkinter","SQL Server","Hugging Face APIs","OOP","NLP"],result:"The supplied project description includes authentication and the listed text-analysis capabilities. No model accuracy or user-impact metrics are claimed without verified measurements.",url:"https://github.com/Parinampraphul/Text-Analysis-using-OOP",link:"View repository"}
  };
  const dialog=$("#case-dialog"), dialogContent=$("#dialog-content");
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const openCase = id => {
    const p=projectData[id]; if(!p)return;
    $("#dialog-kicker").textContent=p.kicker;
    dialogContent.innerHTML=`<h2 id="dialog-title">${p.title}</h2><p class="dialog-lede">${esc(p.lede)}</p><div class="dialog-columns"><section class="dialog-block"><h3>THE PROBLEM</h3><p>${esc(p.problem)}</p><h3 style="margin-top:1.4rem">MY ROLE</h3><p>${esc(p.role)}</p></section><section class="dialog-block"><h3>APPROACH & IMPLEMENTATION</h3><ul>${p.approach.map(item=>`<li>${esc(item)}</li>`).join("")}</ul></section><section class="dialog-block"><h3>WHAT THIS DEMONSTRATES</h3><p>${esc(p.focus)}</p></section><section class="dialog-block"><h3>OUTCOME / SCOPE</h3><p>${esc(p.result)}</p></section></div><div class="dialog-stack">${p.stack.map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="dialog-footer"><span>PARINAM PRAPHUL BHARADWAJ · CASE STUDY</span><a href="${p.url}" target="_blank" rel="noreferrer">${esc(p.link)} ↗</a></div>`;
    if (typeof dialog.showModal==="function") { dialog.showModal(); document.body.classList.add("dialog-open"); }
  };
  $$(".project-card").forEach(card=>card.addEventListener("click",()=>openCase(card.dataset.project)));
  $("#dialog-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>document.body.classList.remove("dialog-open"));
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});

  // Interactive skill-to-project matrix. Associations are intentionally conservative.
  const skillMap={
    "Python":["text"],"JavaScript":["bot"],"SQL":["email","text"],"T-SQL":["email"],"HTML5":["email"],"CSS3":[],
    "SQL Server":["email","text"],"MongoDB":[],"Node.js":["bot"],"Flask":[],"Tkinter":["text"],"Hugging Face APIs":["text"],"Baileys":["bot"],"REST APIs":["text"],
    "Testing":["email","text"],"OOP":["text"],"Agile Scrum":[],"Power BI":[],"MS Visio":[],"MS Project":[],"Excel":[],"Git":["bot","text","email"]
  };
  const projectNames={email:"MSSQL Email Automation",bot:"Data & AI Guild Reminder Bot",text:"Text Analysis Using OOP"};
  const skillButtons=$$(".skill-chips button");
  const setSkill=skill=>{
    skillButtons.forEach(b=>b.classList.toggle("selected",b.dataset.skill===skill));
    const matched=skill? (skillMap[skill]||[]) : ["email","bot","text"];
    $$(".skill-project-list a").forEach(a=>{const id=a.dataset.projectLink;const on=matched.includes(id);a.classList.toggle("highlighted",!!skill&&on);a.classList.toggle("dimmed",!!skill&&!on);});
    $("#skill-result-count").textContent=skill?(matched.length+" MATCH"+(matched.length===1?"":"ES")):"03 PROJECTS";
    $("#skill-result-message").textContent=skill?(matched.length?skill+" appears in: "+matched.map(id=>projectNames[id]).join(", ")+".": "No direct project association is listed for "+skill+"."):"Choose a skill to see where it connects.";
  };
  skillButtons.forEach(b=>b.addEventListener("click",()=>setSkill(b.classList.contains("selected")?null:b.dataset.skill)));
  $("#clear-skill").addEventListener("click",()=>setSkill(null));
  $$("[data-project-link]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const card=$(`.project-card[data-project="${a.dataset.projectLink}"]`);if(card){card.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"center"});card.focus({preventScroll:true});card.click();}}));

  // Magnetic hover and custom cursor only where a fine pointer is available.
  const finePointer=window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  const dot=$(".cursor-dot"), ring=$(".cursor-ring");
  if(finePointer&&!reduceMotion){
    let mx=-100,my=-100,rx=-100,ry=-100;
    window.addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY;dot.style.opacity=ring.style.opacity="1";dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;},{passive:true});
    const cursorLoop=()=>{rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(cursorLoop);};cursorLoop();
    $$("a,button").forEach(el=>{el.addEventListener("pointerenter",()=>ring.classList.add("hovering"));el.addEventListener("pointerleave",()=>ring.classList.remove("hovering"));});
    $$(".magnetic").forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;el.style.transform=`translate(${x*.09}px,${y*.12}px)`;});el.addEventListener("pointerleave",()=>el.style.transform="translate(0,0)");});
  }
})();
