/*
  DAYMARK — local-first task management application
  Built with semantic HTML, modern CSS and vanilla JavaScript.
  All task changes persist in browser localStorage. No backend or payment processing.
*/
(() => {
  'use strict';
  const KEY = 'daymark-task-manager-v1';
  const STATUS = [
    { id:'todo', label:'To do', color:'#a4abbd', icon:'fa-list-check' },
    { id:'progress', label:'In progress', color:'#65aaf8', icon:'fa-spinner' },
    { id:'review', label:'In review', color:'#9a8bfd', icon:'fa-eye' },
    { id:'done', label:'Done', color:'#55c99e', icon:'fa-check' }
  ];
  const PALETTE = ['#8375f8','#52bfa4','#ffab66','#ec7994','#65aafb','#b98bdb'];
  const NAV = [
    {id:'overview',label:'Overview',icon:'fa-house'},
    {id:'board',label:'Kanban board',icon:'fa-table-columns'},
    {id:'tasks',label:'My tasks',icon:'fa-list-check'},
    {id:'calendar',label:'Calendar',icon:'fa-calendar-days'},
    {id:'insights',label:'Insights',icon:'fa-chart-simple'},
    {id:'settings',label:'Settings',icon:'fa-gear'}
  ];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const toISO = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = () => toISO(new Date());
  const shift = (amount, origin = today()) => { const d = new Date(origin+'T12:00:00');d.setDate(d.getDate()+amount);return toISO(d); };
  const parseDay = value => new Date((value || today())+'T12:00:00');
  const niceDate = value => value ? parseDay(value).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'No date';
  const longDate = value => parseDay(value).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const isOverdue = task => task.status !== 'done' && !!task.dueDate && task.dueDate < today();
  const dueSoon = task => task.status !== 'done' && !!task.dueDate && task.dueDate >= today() && task.dueDate <= shift(7);
  const prettyView = id => ({overview:'Overview',board:'Kanban board',tasks:'My tasks',calendar:'Calendar',insights:'Insights',settings:'Settings'})[id] || 'Overview';
  const cap = str => String(str).charAt(0).toUpperCase()+String(str).slice(1);
  const round = n => Math.round(n);
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const now = () => new Date().toISOString();
  function demoDatabase(){
    const projects = [
      {id:'personal',name:'Personal',color:'#8375f8'},
      {id:'web',name:'Website redesign',color:'#65aafb'},
      {id:'app',name:'Mobile app',color:'#52bfa4'},
      {id:'brand',name:'Brand identity',color:'#ffab66'},
      {id:'learning',name:'Learning goals',color:'#ec7994'}
    ];
    const data = [
      ['Build responsive navigation','Make the header work smoothly on phones and tablets.','web','progress','high',0,['UI','Responsive'],['Desktop navigation','Mobile menu','Keyboard access']],
      ['Review new landing page','Check spacing, contrast and content before release.','web','review','medium',1,['Review'],['Check desktop','Check mobile']],
      ['Create product card components','Design reusable cards with hover and loading states.','web','todo','high',2,['Components','Design'],['Card layout','Loading state','Responsive grid']],
      ['Optimise image loading','Add lazy loading and suitable image dimensions.','web','todo','low',5,['Performance'],[]],
      ['Design onboarding screens','Map the welcome journey and first-time experience.','app','progress','high',1,['UX','Figma'],['Welcome screen','Profile setup']],
      ['Write API integration notes','Document endpoints and expected data for the prototype.','app','todo','medium',4,['Documentation'],[]],
      ['Test mobile interactions','Check touch target sizes, gestures and keyboard access.','app','todo','medium',7,['QA','Mobile'],[]],
      ['Polish app wireframes','Refine spacing and typography based on feedback.','app','done','medium',-2,['Design'],[]],
      ['Select new colour palette','Choose accessible colours and document tokens.','brand','done','low',-4,['Brand'],[]],
      ['Prepare logo concepts','Build three simple visual directions for review.','brand','review','medium',3,['Brand','Creative'],['Concept one','Concept two','Concept three']],
      ['Publish mini style guide','Compile typography, spacing and brand principles.','brand','todo','low',9,['Guidelines'],[]],
      ['Practice array methods','Solve exercises using map, filter and reduce.','learning','done','medium',-1,['JavaScript'],[]],
      ['Learn JavaScript testing','Write basic unit tests for utility functions.','learning','progress','medium',0,['JavaScript','Testing'],['Choose test runner','Write first test']],
      ['Improve GitHub README','Document screenshots, features and setup instructions.','learning','todo','low',6,['GitHub'],[]],
      ['Plan the coming week','Prioritise deadlines and break down larger goals.','personal','todo','medium',0,['Planning'],[]],
      ['Clean up task backlog','Archive old ideas and clarify next actions.','personal','done','low',-5,['Organisation'],[]],
      ['Fix footer on smaller screens','Investigate overflow at narrow viewport sizes.','web','todo','high',-2,['Bug','CSS'],[]],
      ['Prepare project presentation','Summarise the progress and key decisions.','personal','todo','medium',10,['Presentation'],[]]
    ];
    const tasks = data.map(([title,description,projectId,status,priority,dayOffset,tags,subtasks],i) => ({
      id:'demo-task-'+(i+1),title,description,projectId,status,priority,dueDate:shift(dayOffset),estimate:['30m','1h','2h','4h'][i%4],tags,
      subtasks:subtasks.map((name,j)=>({id:'demo-sub-'+i+'-'+j,title:name,done:j===0 && status!=='todo'})),
      repeat:'none',createdAt:new Date(Date.now()-(i+3)*86400000).toISOString(),updatedAt:now(),completedAt:status==='done'?new Date(Date.now()-([2,4,1,5][i%4])*86400000).toISOString():null
    }));
    return {version:1,projects,tasks,activity:[
      {id:uid(),message:'Workspace ready to explore',date:now(),icon:'fa-wand-magic-sparkles'},
      {id:uid(),message:'Sample tasks and projects added',date:new Date(Date.now()-3600000).toISOString(),icon:'fa-plus'}
    ]};
  }
  function readDatabase(){
    try {
      const value=localStorage.getItem(KEY);
      if(value){const obj=JSON.parse(value);if(obj && Array.isArray(obj.tasks) && Array.isArray(obj.projects) && obj.projects.length)return obj;}
    }catch(e){console.warn('Saved workspace could not be read:',e);}
    return demoDatabase();
  }
  let db=readDatabase();
  let view='overview';
  let search='';
  let projectFilter='all';
  let priorityFilter='all';
  let sortOrder='due';
  let selectedDate=today();
  let calendarMonth=new Date().getMonth();
  let calendarYear=new Date().getFullYear();
  let activeModal=null;
  let priorFocus=null;
  let dragTaskId=null;
  let theme='light';
  try{theme=localStorage.getItem('daymark-theme')||'light';}catch{}
  document.body.dataset.theme=theme;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){console.warn('Saving locally failed:',e);toast('Browser storage is unavailable; changes may not persist.','warning');}};
  function addActivity(message,icon='fa-circle-check'){
    db.activity=[{id:uid(),message,date:now(),icon},...(db.activity||[])].slice(0,50);
  }
  function projectById(id){return db.projects.find(p=>p.id===id) || {id:'missing',name:'Unknown project',color:'#a6acc1'};}
  const statusById = id => STATUS.find(s=>s.id===id)||STATUS[0];
  const countStatus = id => db.tasks.filter(t=>t.status===id).length;
  function projectCount(id){return db.tasks.filter(t=>t.projectId===id&&t.status!=='done').length;}
  function toast(message,type='success'){
    const node=document.createElement('div');node.className='toast';
    const ico=document.createElement('i');ico.className='fa-solid '+(type==='warning'?'fa-triangle-exclamation':'fa-circle-check');node.append(ico,document.createTextNode(message));
    $('#toast-stack').append(node);
    setTimeout(()=>node.remove(),3600);
  }
  function rerender(){renderSidebar();renderHeader();renderMain();}
  function renderSidebar(){
    $('#primary-nav').innerHTML=NAV.map(n=>`<button class="nav-link ${view===n.id?'active':''}" data-action="navigate" data-view="${n.id}" ${view===n.id?'aria-current="page"':''}><i class="fa-solid ${n.icon}" aria-hidden="true"></i>${n.label}${n.id==='tasks'?`<span class="nav-count">${db.tasks.filter(t=>t.status!=='done').length}</span>`:''}</button>`).join('');
    $('#project-nav').innerHTML=db.projects.map(p=>`<button class="project-link ${projectFilter===p.id&&(view==='board'||view==='tasks')?'active':''}" data-action="filter-project" data-project="${esc(p.id)}"><span class="project-dot" style="--dot:${p.color}"></span><span>${esc(p.name)}</span><span class="project-count">${projectCount(p.id)}</span></button>`).join('');
  }
  function renderHeader(){
    $('#breadcrumb').innerHTML=`Workspace <i class="fa-solid fa-chevron-right" aria-hidden="true"></i> <strong>${prettyView(view)}</strong>`;
    $('#global-search').value=search;
    $('.theme-button').innerHTML=`<i class="${theme==='light'?'fa-regular fa-moon':'fa-solid fa-sun'}"></i>`;
    $('#notification-dot').hidden=!db.tasks.some(t=>isOverdue(t)|| (t.dueDate===today()&&t.status!=='done'));
  }
  function navigate(to){
    if(!NAV.some(x=>x.id===to))return;
    view=to;closeSidebar();rerender();window.scrollTo({top:0,behavior:'instant'});
  }
  function renderMain(){
    const main=$('#main-content');
    if(view==='overview')main.innerHTML=overviewHtml();
    else if(view==='board')main.innerHTML=boardHtml();
    else if(view==='tasks')main.innerHTML=tasksHtml();
    else if(view==='calendar')main.innerHTML=calendarHtml();
    else if(view==='insights')main.innerHTML=insightsHtml();
    else main.innerHTML=settingsHtml();
  }
  function pageHeading(title,subtitle,actions=''){
    return `<div class="page-heading"><div><div class="eyebrow">YOUR WORKSPACE</div><h1>${title}</h1><p>${subtitle}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
  }
  function metricHtml(icon,styling,value,label,caption=''){
    return `<section class="panel metric"><div class="metric-top"><span class="metric-icon ${styling}"><i class="fa-solid ${icon}" aria-hidden="true"></i></span></div><div class="metric-number">${value}</div><div class="metric-label">${label}</div>${caption?`<div class="metric-caption">${caption}</div>`:''}</section>`;
  }
  function completionPercent(){return db.tasks.length?round(countStatus('done')/db.tasks.length*100):0;}
  function taskDateInfo(t){
    if(!t.dueDate)return '<span>No deadline</span>';
    const text=t.dueDate===today()?'Today':t.dueDate===shift(1)?'Tomorrow':niceDate(t.dueDate);
    return `<span class="${isOverdue(t)?'date-late':''}"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${esc(text)}</span>`;
  }
  function taskTick(t){return `<button class="task-tick ${t.status==='done'?'checked':''}" data-action="toggle-done" data-id="${esc(t.id)}" title="${t.status==='done'?'Reopen task':'Mark task complete'}" aria-label="${t.status==='done'?'Reopen':'Complete'} ${esc(t.title)}"><i class="fa-solid fa-check" aria-hidden="true"></i></button>`;}
  function taskLine(t){
    const p=projectById(t.projectId);
    return `<div class="task-item ${t.status==='done'?'completed':''}">${taskTick(t)}<div class="task-item-info"><button class="task-title-button" data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button><div class="task-item-meta"><span><i class="fa-solid fa-circle" style="color:${p.color}" aria-hidden="true"></i> ${esc(p.name)}</span>${taskDateInfo(t)}<span class="tag p-${t.priority}">${cap(t.priority)}</span></div></div></div>`;
  }
  function projectBars(){return db.projects.filter(p=>db.tasks.some(t=>t.projectId===p.id)).map(p=>{
    const group=db.tasks.filter(t=>t.projectId===p.id),done=group.filter(t=>t.status==='done').length,pct=round(done/group.length*100);
    return `<div class="mini-bar-row"><span class="mini-bar-label"><span class="color-dot" style="--dot:${p.color}"></span> ${esc(p.name)}</span><div class="mini-bar-track"><div class="mini-bar-fill" style="--fill:${p.color};--pct:${pct}%"></div></div><span class="mini-bar-count">${pct}%</span></div>`;
  }).join('') || '<div class="empty-state">No project tasks yet.</div>';}
  function overviewHtml(){
    const open=db.tasks.filter(t=>t.status!=='done');
    const overdue=open.filter(isOverdue).length;
    const upcoming=open.filter(dueSoon).length;
    const dueToday=db.tasks.filter(t=>t.dueDate===today());
    const dueTodayDone=dueToday.filter(t=>t.status==='done').length;
    const focus=open.filter(t=>t.priority==='high').sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).slice(0,4);
    const recent=(db.activity||[]).slice(0,4);
    return `${pageHeading('Good to see you again 👋',longDate(today()))}
    <div class="dashboard-grid">
      <section class="hero-banner"><div><span class="hero-top"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> YOUR DAILY OVERVIEW</span><h2>Make progress on<br>what matters most.</h2><p>You have ${open.length} active ${open.length===1?'task':'tasks'} across ${db.projects.length} projects. Start with one small win and build momentum.</p><button class="hero-cta" data-action="navigate" data-view="board">Explore your board <i class="fa-solid fa-arrow-right"></i></button></div><div class="hero-ornament" aria-hidden="true"><i class="fa-solid fa-check-double"></i></div></section>
      <section class="panel panel-pad"><div class="panel-heading"><div><h2>Overall progress</h2><small>Every completed task counts</small></div><span class="metric-icon purple"><i class="fa-solid fa-chart-pie"></i></span></div><div class="progress-info"><div class="progress-donut" style="--p:${completionPercent()}%"><span>${completionPercent()}%</span></div><div><h3>Keep moving forward</h3><p>${countStatus('done')} of ${db.tasks.length} tasks completed.</p><div class="small-legend" style="--legend:var(--purple)">Completed ${countStatus('done')}</div><div class="small-legend" style="--legend:#d9dded">Remaining ${open.length}</div></div></div><div class="tip-note"><i class="fa-solid fa-sun"></i> ${dueToday.length?`${dueTodayDone} of ${dueToday.length} tasks due today are complete.`:'You have no tasks due today. A great day to plan ahead!'}</div></section>
    </div>
    <div class="stats-grid">${metricHtml('fa-layer-group','purple',open.length,'Active tasks','Across all your projects')}${metricHtml('fa-circle-check','green',countStatus('done'),'Completed','Keep up the momentum')}${metricHtml('fa-clock','red',overdue,'Overdue','Needs your attention')}${metricHtml('fa-calendar-check','orange',upcoming,'Due in 7 days','Including today')}</div>
    <div class="dashboard-bottom"><section class="panel panel-pad"><div class="panel-heading"><div><h2>Priority focus</h2><small>Your most important outstanding tasks</small></div><button class="text-button" data-action="navigate" data-view="tasks">View all <i class="fa-solid fa-arrow-right"></i></button></div>${focus.length?focus.map(taskLine).join(''):`<div class="empty-state"><i class="fa-regular fa-circle-check"></i><h3>You're all caught up</h3><p>No high-priority work is waiting.</p></div>`}</section><section class="panel panel-pad"><div class="panel-heading"><div><h2>Project progress</h2><small>A quick look at what's moving</small></div><button class="text-button" data-action="new-project">Add project <i class="fa-solid fa-plus"></i></button></div>${projectBars()}</section></div>
    <div class="dashboard-bottom" style="margin-top:20px"><section class="panel panel-pad"><div class="panel-heading"><div><h2>Coming up next</h2><small>Deadlines worth keeping an eye on</small></div><button class="text-button" data-action="navigate" data-view="calendar">Open calendar <i class="fa-solid fa-arrow-right"></i></button></div>${open.filter(t=>t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4).map(taskLine).join('')||'<p class="chart-caption">No upcoming deadlines — enjoy the breathing room.</p>'}</section><section class="panel panel-pad"><div class="panel-heading"><div><h2>Recent activity</h2><small>What changed in your workspace</small></div><button class="text-button" data-action="navigate" data-view="insights">Insights <i class="fa-solid fa-arrow-right"></i></button></div>${activityHtml(recent)}</section></div>`;
  }
  function selectedTasks(){
    let tasks=db.tasks.filter(t=>(projectFilter==='all'||t.projectId===projectFilter)&&(priorityFilter==='all'||t.priority===priorityFilter)&&(!search||[t.title,t.description,t.tags.join(' '),projectById(t.projectId).name].join(' ').toLowerCase().includes(search.trim().toLowerCase())));
    if(sortOrder==='due')tasks.sort((a,b)=>(a.dueDate||'9999-99-99').localeCompare(b.dueDate||'9999-99-99'));
    else if(sortOrder==='priority')tasks.sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority])||((a.dueDate||'9999').localeCompare(b.dueDate||'9999')));
    else if(sortOrder==='newest')tasks.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    else if(sortOrder==='title')tasks.sort((a,b)=>a.title.localeCompare(b.title));
    return tasks;
  }
  function filtersHtml(count){
    return `<div class="panel filter-bar" aria-label="Task filters"><select id="project-filter" aria-label="Filter by project"><option value="all">All projects</option>${db.projects.map(p=>`<option value="${esc(p.id)}" ${projectFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select id="priority-filter" aria-label="Filter by priority"><option value="all">All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${priorityFilter===x?'selected':''}>${cap(x)} priority</option>`).join('')}</select><select id="sort-order" aria-label="Sort tasks"><option value="due" ${sortOrder==='due'?'selected':''}>Due date first</option><option value="priority" ${sortOrder==='priority'?'selected':''}>Priority first</option><option value="newest" ${sortOrder==='newest'?'selected':''}>Newest first</option><option value="title" ${sortOrder==='title'?'selected':''}>Title A–Z</option></select><button class="text-button" data-action="reset-filters">Reset filters</button><span class="result-label">${count} ${count===1?'task':'tasks'} found</span></div>`;
  }
  function kanbanTask(t){
    const p=projectById(t.projectId),sub=t.subtasks||[];
    const completed=sub.filter(s=>s.done).length;
    return `<article class="kanban-card" draggable="true" data-task-id="${esc(t.id)}" aria-label="${esc(t.title)}, ${statusById(t.status).label}"><div class="kanban-top"><span class="tag p-${t.priority}"><i class="fa-solid fa-flag" aria-hidden="true"></i> ${cap(t.priority)}</span><button class="row-action" data-action="edit-task" data-id="${esc(t.id)}" title="Edit task" aria-label="Edit ${esc(t.title)}"><i class="fa-solid fa-ellipsis"></i></button></div><button class="kanban-title" data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button><div class="kanban-desc">${esc(t.description)}</div><div class="kanban-tags"><span class="soft-tag"><span class="color-dot" style="--dot:${p.color}"></span> ${esc(p.name)}</span>${t.tags.slice(0,2).map(g=>`<span class="soft-tag">#${esc(g)}</span>`).join('')}</div><div class="kanban-footer">${taskDateInfo(t)}${sub.length?`<span class="push" title="Completed subtasks"><i class="fa-solid fa-list-check"></i> ${completed}/${sub.length}</span>`:''}</div><div style="margin-top:11px"><select class="card-status-select" data-status-change="${esc(t.id)}" aria-label="Move ${esc(t.title)} to status">${STATUS.map(s=>`<option value="${s.id}" ${s.id===t.status?'selected':''}>${s.label}</option>`).join('')}</select></div></article>`;
  }
  function boardHtml(){const tasks=selectedTasks();return `${pageHeading('The project board','Move work forward, one card at a time.',`<button class="secondary-button" data-action="new-project"><i class="fa-solid fa-folder-plus"></i> New project</button><button class="primary-button" data-action="new-task"><i class="fa-solid fa-plus"></i> Add task</button>`)}${filtersHtml(tasks.length)}<div class="board-scroller" aria-label="Kanban board, scroll horizontally to see all columns"><div class="board-grid">${STATUS.map(s=>{const group=tasks.filter(t=>t.status===s.id);return `<section class="board-column" data-drop-status="${s.id}" aria-label="${s.label} column"><div class="board-column-header"><span class="column-color" style="--color:${s.color}"></span><span class="column-title">${s.label}</span><span class="column-count">${group.length}</span><button class="column-add" data-action="new-task" data-status="${s.id}" title="Add task to ${s.label}" aria-label="Add task to ${s.label}"><i class="fa-solid fa-plus"></i></button></div>${group.map(kanbanTask).join('')||`<div class="board-empty">Drop a task here<br>or create a new one</div>`}</section>`;}).join('')}</div></div><div class="tip-note"><i class="fa-solid fa-hand-pointer"></i> Drag cards to change their status on desktop. On touch devices, use the status dropdown on each card. All updates are saved automatically in this browser.</div>`;}
  function tableTask(t){const p=projectById(t.projectId);return `<tr><td class="task-name-cell"><div class="cell-flex">${taskTick(t)}<button class="task-title-button" data-action="edit-task" data-id="${esc(t.id)}" style="${t.status==='done'?'text-decoration:line-through;opacity:.65':''}">${esc(t.title)}</button></div></td><td><span class="cell-project"><span class="color-dot" style="--dot:${p.color}"></span>${esc(p.name)}</span></td><td><span class="tag status-${t.status}">${statusById(t.status).label}</span></td><td><span class="tag p-${t.priority}">${cap(t.priority)}</span></td><td class="${isOverdue(t)?'date-late':''}">${t.dueDate?niceDate(t.dueDate):'—'}</td><td><button class="row-action" data-action="edit-task" data-id="${esc(t.id)}" aria-label="Edit ${esc(t.title)}"><i class="fa-solid fa-pen"></i></button></td></tr>`;}
  function tasksHtml(){const tasks=selectedTasks();return `${pageHeading('All your tasks','Everything on your plate, neatly organised.',`<button class="primary-button" data-action="new-task"><i class="fa-solid fa-plus"></i> New task</button>`)}${filtersHtml(tasks.length)}<section class="panel list-panel">${tasks.length?`<table class="data-table"><thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due date</th><th></th></tr></thead><tbody>${tasks.map(tableTask).join('')}</tbody></table><div class="mobile-task-list">${tasks.map(taskLine).join('')}</div>`:`<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>No matching tasks</h3><p>Try a different search or filter, or create a fresh task.</p><button class="primary-button" data-action="new-task">Create a task</button></div>`}</section>`;}
  function calendarHtml(){
    const start=new Date(calendarYear,calendarMonth,1),offset=(start.getDay()+6)%7;
    const first=new Date(calendarYear,calendarMonth,1-offset);
    const monthName=start.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
    const cells=Array.from({length:42},(_,i)=>{
      const d=new Date(first);d.setDate(first.getDate()+i);
      const iso=toISO(d),matching=db.tasks.filter(t=>t.dueDate===iso);
      return `<button class="calendar-day ${d.getMonth()!==calendarMonth?'outside':''} ${iso===selectedDate?'selected':''} ${iso===today()?'today':''}" data-action="select-day" data-date="${iso}" aria-label="${esc(longDate(iso))}, ${matching.length} tasks" ${iso===selectedDate?'aria-pressed="true"':''}><span class="calendar-number">${d.getDate()}</span>${matching.slice(0,2).map(t=>{const p=projectById(t.projectId);return `<span class="calendar-task" style="--tint:${p.color}25;--color:${p.color}">${esc(t.title)}</span>`;}).join('')}${matching.length>2?`<span class="calendar-more">+${matching.length-2} more</span>`:''}</button>`;
    }).join('');
    const agenda=db.tasks.filter(t=>t.dueDate===selectedDate).sort((a,b)=>Number(a.status==='done')-Number(b.status==='done'));
    return `${pageHeading('Calendar','See what is due and plan your next move.',`<button class="primary-button" data-action="new-task" data-date="${selectedDate}"><i class="fa-solid fa-plus"></i> Plan a task</button>`)}<div class="calendar-layout"><section class="panel panel-pad"><div class="calendar-top"><h2>${esc(monthName)}</h2><div class="calendar-actions"><button class="secondary-button" data-action="calendar-today">Today</button><button class="mini-arrow" data-action="calendar-prev" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button><button class="mini-arrow" data-action="calendar-next" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button></div></div><div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(s=>`<span>${s}</span>`).join('')}</div><div class="calendar-grid">${cells}</div></section><aside class="panel panel-pad"><div class="eyebrow">DAY AGENDA</div><div class="agenda-day">${parseDay(selectedDate).toLocaleDateString('en-GB',{weekday:'long'})}</div><div class="agenda-date">${longDate(selectedDate)}</div><div class="panel-heading"><h2>${agenda.length} ${agenda.length===1?'task':'tasks'} scheduled</h2><button class="text-button" data-action="new-task" data-date="${selectedDate}"><i class="fa-solid fa-plus"></i> Add</button></div><div class="agenda-list">${agenda.length?agenda.map(t=>`<div class="agenda-entry"><button data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button><span style="display:flex;gap:6px;align-items:center"><span class="tag p-${t.priority}">${cap(t.priority)}</span><span class="tag status-${t.status}">${statusById(t.status).label}</span></span></div>`).join(''):`<div class="empty-state"><i class="fa-regular fa-calendar"></i><h3>No tasks scheduled</h3><p>Enjoy the free space or add something to work on.</p></div>`}</div></aside></div>`;
  }
  function weeklySvg(){
    const dates=Array.from({length:7},(_,i)=>shift(i-6)),counts=dates.map(d=>db.tasks.filter(t=>t.completedAt&&toISO(new Date(t.completedAt))===d).length);
    const max=Math.max(1,...counts), chartHeight=132,baseY=169;
    const bars=counts.map((v,i)=>{
      const h=v/max*chartHeight,x=58+i*67;
      return `<rect x="${x}" y="${baseY-h}" width="34" height="${Math.max(h,3)}" rx="7" fill="${i===6?'#7a6af9':'#dcd8ff'}"><title>${v} tasks completed on ${niceDate(dates[i])}</title></rect><text x="${x+17}" y="195" font-size="11" fill="currentColor" text-anchor="middle">${parseDay(dates[i]).toLocaleDateString('en-GB',{weekday:'short'})}</text>${v?`<text x="${x+17}" y="${baseY-h-8}" font-size="10" font-weight="700" text-anchor="middle" fill="currentColor">${v}</text>`:''}`;
    }).join('');
    return `<svg viewBox="0 0 525 210" class="weekly-chart" role="img" aria-label="Tasks completed each day over the last seven days">${[0,1,2,3].map(i=>`<line x1="40" x2="510" y1="${baseY-i*44}" y2="${baseY-i*44}" stroke="currentColor" opacity=".08" stroke-dasharray="3 5"/>`).join('')}${bars}</svg>`;
  }
  function activityHtml(items){return items?.length?items.map(a=>`<div class="activity-row"><div class="activity-bubble"><i class="fa-solid ${esc(a.icon||'fa-check')}"></i></div><div class="activity-body"><p>${esc(a.message)}</p><span>${new Date(a.date).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div></div>`).join(''):'<p class="chart-caption">No activity yet. Start by creating a task.</p>';}
  function insightsHtml(){
    const all=db.tasks.length;
    const done=countStatus('done'),open=all-done;
    const last7=db.tasks.filter(t=>t.completedAt&&toISO(new Date(t.completedAt))>=shift(-6)&&toISO(new Date(t.completedAt))<=today()).length;
    const overdue=db.tasks.filter(isOverdue).length;
    const counts=STATUS.map(s=>countStatus(s.id));
    let cumulative=0;
    const ring=STATUS.map((s,i)=>{const a=cumulative,c=all?counts[i]/all*100:0;cumulative+=c;return `${s.color} ${a}% ${cumulative}%`;}).join(',');
    const priorities=['high','medium','low'].map(x=>({name:cap(x),count:db.tasks.filter(t=>t.priority===x&&t.status!=='done').length,color:{high:'#eb7582',medium:'#f3b15e',low:'#57c69e'}[x]}));
    const max=Math.max(1,...priorities.map(p=>p.count));
    return `${pageHeading('Your productivity','Understand how your work is progressing.')}
    <div class="stats-grid">${metricHtml('fa-chart-line','purple',completionPercent()+'%','Completion rate')}${metricHtml('fa-check-double','green',last7,'Finished this week')}${metricHtml('fa-list','orange',open,'Still in progress')}${metricHtml('fa-triangle-exclamation','red',overdue,'Past due')}</div>
    <div class="insight-top"><section class="panel panel-pad"><div class="panel-heading"><div><h2>Weekly completions</h2><small>Tasks finished over the past 7 days</small></div><span class="tag status-review"><i class="fa-solid fa-chart-column"></i> Last 7 days</span></div><div class="chart-container">${weeklySvg()}</div><div class="chart-legend"><span>Completed tasks per day</span><span>${last7} total</span></div></section><section class="panel panel-pad"><div class="panel-heading"><div><h2>Task distribution</h2><small>Where everything stands</small></div></div><div class="status-breakdown"><div class="status-donut" style="--ring:conic-gradient(${all?ring:'var(--line) 0% 100%'})"><strong>${all}</strong><small>total tasks</small></div><div class="status-list">${STATUS.map((s,i)=>`<div><span class="color-dot" style="--dot:${s.color}"></span>${s.label}<strong>${counts[i]}</strong></div>`).join('')}</div></div></section></div>
    <div class="insight-lower"><section class="panel panel-pad"><div class="panel-heading"><div><h2>Workload by project</h2><small>Completion progress across your projects</small></div></div>${projectBars()}</section><section class="panel panel-pad"><div class="panel-heading"><div><h2>Outstanding priorities</h2><small>Where to spend your attention next</small></div></div>${priorities.map(p=>`<div class="priority-row"><span>${p.name}</span><div class="mini-bar-track"><div class="mini-bar-fill" style="--fill:${p.color};--pct:${round(p.count/max*100)}%"></div></div><b>${p.count}</b></div>`).join('')}<div class="tip-note"><i class="fa-solid fa-lightbulb"></i> A clear priority list helps you focus on important work without losing track of deadlines.</div></section></div><div class="panel panel-pad" style="margin-top:18px"><div class="panel-heading"><div><h2>Latest activity</h2><small>Changes made to your workspace</small></div></div>${activityHtml((db.activity||[]).slice(0,8))}</div>`;
  }
  function settingsHtml(){
    return `${pageHeading('Workspace settings','Make Daymark work the way you do.')}
    <div class="settings-grid"><section class="panel panel-pad"><div class="panel-heading"><div><h2>Appearance</h2><small>Find a comfortable way to work</small></div><span class="metric-icon purple"><i class="fa-solid fa-palette"></i></span></div><div class="setting-row"><div><h3>Dark mode</h3><p>Switch between light and dark interface themes.</p></div><button class="secondary-button" data-action="toggle-theme"><i class="fa-solid ${theme==='dark'?'fa-sun':'fa-moon'}"></i> ${theme==='dark'?'Use light':'Use dark'}</button></div><div class="setting-row"><div><h3>Keyboard shortcuts</h3><p>Navigate and create tasks faster.</p></div></div><div class="setting-row"><span>Search for tasks</span><kbd class="shortcut">Ctrl / ⌘ + K</kbd></div><div class="setting-row"><span>New task</span><kbd class="shortcut">N</kbd></div><div class="setting-row"><span>Close a window</span><kbd class="shortcut">Esc</kbd></div></section>
    <section class="panel panel-pad"><div class="panel-heading"><div><h2>Data & backups</h2><small>Your work stays in this browser</small></div><span class="metric-icon green"><i class="fa-solid fa-database"></i></span></div><div class="setting-row"><div><h3>Export task data</h3><p>Download all projects, tasks and activity as a JSON file.</p></div></div><div class="setting-row"><div><h3>Import a backup</h3><p>Restore data previously exported from Daymark. This replaces current data.</p></div></div><div class="settings-actions"><button class="secondary-button" data-action="export-data"><i class="fa-solid fa-download"></i> Export JSON</button><button class="secondary-button" data-action="import-data"><i class="fa-solid fa-upload"></i> Import JSON</button></div><div class="tip-note"><i class="fa-solid fa-shield-halved"></i> This is a front-end demo. Your tasks are stored with localStorage on this device and browser. There are no user accounts, cloud sync or team invitations.</div></section>
    <section class="panel panel-pad"><div class="panel-heading"><div><h2>Manage projects</h2><small>Create and organise your areas of work</small></div><button class="text-button" data-action="new-project"><i class="fa-solid fa-plus"></i> Add</button></div>${db.projects.map(p=>`<div class="project-setting"><span class="cell-project"><span class="color-dot" style="--dot:${p.color};width:11px;height:11px"></span><strong style="font-size:12px">${esc(p.name)}</strong></span><span><span style="color:var(--muted);font-size:11px">${db.tasks.filter(t=>t.projectId===p.id).length} tasks</span>${p.id!=='personal'?`<button class="row-action" data-action="delete-project" data-id="${esc(p.id)}" aria-label="Delete project ${esc(p.name)}" title="Delete project"><i class="fa-regular fa-trash-can"></i></button>`:''}</span></div>`).join('')}</section>
    <section class="panel panel-pad"><div class="panel-heading"><div><h2>Fresh start</h2><small>Manage your example workspace</small></div><span class="metric-icon orange"><i class="fa-solid fa-rotate"></i></span></div><div class="setting-row"><div><h3>Restore example tasks</h3><p>Replace current content with a fresh copy of the demo projects and tasks.</p></div></div><div class="setting-row"><div><h3>Start with a blank workspace</h3><p>Remove all tasks and activity, keeping only the Personal project.</p></div></div><div class="settings-actions"><button class="secondary-button" data-action="restore-demo"><i class="fa-solid fa-arrow-rotate-left"></i> Restore demo</button><button class="secondary-button danger-button" data-action="clear-data"><i class="fa-regular fa-trash-can"></i> Clear workspace</button></div></section></div>`;
  }
  function statusOptions(current){return STATUS.map(s=>`<option value="${s.id}" ${s.id===current?'selected':''}>${s.label}</option>`).join('');}
  function taskModalHtml(t,preferredStatus,preferredDate){
    const editing=!!t;
    const item=t||{id:'',title:'',description:'',projectId:db.projects.find(p=>p.id===projectFilter)?.id||'personal',status:preferredStatus||'todo',priority:'medium',dueDate:preferredDate||today(),estimate:'1h',tags:[],subtasks:[],repeat:'none'};
    return `<div class="overlay-backdrop" data-action="overlay-close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">${editing?'TASK DETAILS':'CREATE SOMETHING GREAT'}</div><h2 id="modal-title">${editing?'Edit task':'Create a new task'}</h2><p>${editing?'Update your plan and keep everything moving.':'Turn an idea into your next action.'}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button></div><form id="task-form"><input type="hidden" name="taskId" value="${esc(item.id)}"><div class="field"><label for="task-title">Task title <span>*</span></label><input id="task-title" name="title" value="${esc(item.title)}" maxlength="110" placeholder="e.g. Build responsive homepage" required autofocus></div><div class="field"><label for="task-description">Description</label><textarea id="task-description" name="description" maxlength="1200" placeholder="What needs to be done?">${esc(item.description)}</textarea></div><div class="form-grid"><div class="field"><label for="task-project">Project</label><select id="task-project" name="projectId">${db.projects.map(p=>`<option value="${esc(p.id)}" ${p.id===item.projectId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label for="task-status">Status</label><select id="task-status" name="status">${statusOptions(item.status)}</select></div><div class="field"><label for="task-priority">Priority</label><select id="task-priority" name="priority">${['low','medium','high'].map(p=>`<option value="${p}" ${p===item.priority?'selected':''}>${cap(p)}</option>`).join('')}</select></div><div class="field"><label for="task-due">Due date</label><input id="task-due" name="dueDate" type="date" value="${esc(item.dueDate)}"></div><div class="field"><label for="task-estimate">Time estimate</label><select id="task-estimate" name="estimate">${['15m','30m','1h','2h','4h','8h'].map(x=>`<option value="${x}" ${x===item.estimate?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="task-repeat">Repeat after completion</label><select id="task-repeat" name="repeat">${['none','daily','weekly','monthly'].map(x=>`<option value="${x}" ${x===(item.repeat||'none')?'selected':''}>${x==='none'?'Does not repeat':cap(x)}</option>`).join('')}</select></div></div><div class="field"><label for="task-tags">Tags</label><input id="task-tags" name="tags" value="${esc(item.tags.join(', '))}" placeholder="Design, Bug, Important"><span class="field-help">Separate tags with commas.</span></div><div class="field"><label>Checklist</label><div class="subtask-editor" id="subtask-editor">${(item.subtasks||[]).map(subtaskRow).join('')}<div class="add-subtask-row"><input type="text" id="new-subtask-input" placeholder="Add checklist item" maxlength="120" aria-label="New checklist item"><button type="button" class="secondary-button" data-action="add-subtask"><i class="fa-solid fa-plus"></i> Add</button></div></div></div><div class="modal-actions">${editing?`<button type="button" class="secondary-button danger-button" data-action="delete-task" data-id="${esc(item.id)}"><i class="fa-regular fa-trash-can"></i> Delete</button>`:''}<button type="button" class="secondary-button" data-action="close-modal">Cancel</button><button type="submit" class="primary-button"><i class="fa-solid fa-check"></i> ${editing?'Save changes':'Create task'}</button></div></form></div></div>`;
  }
  function subtaskRow(item){return `<div class="subtask-edit-row" data-subtask-id="${esc(item.id)}"><input type="checkbox" ${item.done?'checked':''} aria-label="Mark checklist item complete"><input type="text" value="${esc(item.title)}" maxlength="120" aria-label="Checklist item"><button type="button" data-action="remove-subtask" title="Remove item" aria-label="Remove checklist item"><i class="fa-solid fa-xmark"></i></button></div>`;}
  function projectModalHtml(){return `<div class="overlay-backdrop" data-action="overlay-close"><div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">WORKSPACE ORGANISATION</div><h2 id="modal-title">Create a project</h2><p>Group related tasks into something meaningful.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button></div><form id="project-form"><div class="field"><label for="project-name">Project name <span>*</span></label><input id="project-name" name="name" maxlength="48" placeholder="e.g. Portfolio website" required></div><div class="field"><label>Choose a colour</label><div class="color-options" role="radiogroup" aria-label="Project colour">${PALETTE.map((c,i)=>`<label class="color-option ${i===0?'selected':''}" style="--color:${c}" title="Colour ${i+1}"><input type="radio" name="color" value="${c}" ${i===0?'checked':''} aria-label="Colour ${i+1}" style="position:absolute;opacity:0;width:1px;height:1px"></label>`).join('')}</div></div><div class="modal-actions"><button type="button" class="secondary-button" data-action="close-modal">Cancel</button><button type="submit" class="primary-button"><i class="fa-solid fa-plus"></i> Create project</button></div></form></div></div>`;}
  function openModal(content,focusSelector){
    closeModal();priorFocus=document.activeElement;$('#overlay-root').innerHTML=content;activeModal=$('#overlay-root .overlay-backdrop');document.body.style.overflow='hidden';
    setTimeout(()=>$(focusSelector||'#overlay-root .modal input:not([type=hidden])')?.focus(),0);
  }
  function closeModal(){if(!activeModal)return;$('#overlay-root').innerHTML='';activeModal=null;document.body.style.overflow='';if(priorFocus&&document.contains(priorFocus))priorFocus.focus();}
  function editTask(id){const t=db.tasks.find(x=>x.id===id);if(!t){toast('Task could not be found.','warning');return;}openModal(taskModalHtml(t),'#task-title');}
  function newTask(status='todo',date=''){openModal(taskModalHtml(null,status,date),'#task-title');}
  function saveTaskForm(form){
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const title=String(data.get('title')||'').trim();if(!title){toast('Enter a task title.','warning');return;}
    const id=String(data.get('taskId')||''),original=db.tasks.find(x=>x.id===id);
    const newStatus=String(data.get('status'));
    const dueDate=String(data.get('dueDate')||'');
    const subtaskNodes=[...form.querySelectorAll('.subtask-edit-row')];
    const subtasks=subtaskNodes.map(el=>({id:el.dataset.subtaskId||uid(),title:el.querySelector('input[type=text]').value.trim(),done:el.querySelector('input[type=checkbox]').checked})).filter(s=>s.title);
    const item={id:original?.id||uid(),title:title.slice(0,110),description:String(data.get('description')||'').trim().slice(0,1200),projectId:db.projects.some(p=>p.id===data.get('projectId'))?String(data.get('projectId')):'personal',status:STATUS.some(s=>s.id===newStatus)?newStatus:'todo',priority:['low','medium','high'].includes(data.get('priority'))?String(data.get('priority')):'medium',dueDate:/^\d{4}-\d{2}-\d{2}$/.test(dueDate)?dueDate:'',estimate:String(data.get('estimate')||'1h'),tags:[...new Set(String(data.get('tags')||'').split(',').map(s=>s.trim().slice(0,22)).filter(Boolean))].slice(0,6),subtasks,repeat:['none','daily','weekly','monthly'].includes(data.get('repeat'))?String(data.get('repeat')):'none',createdAt:original?.createdAt||now(),updatedAt:now(),completedAt:original?.completedAt||null};
    if(item.status==='done'&&original?.status!=='done')item.completedAt=now();
    if(item.status!=='done')item.completedAt=null;
    if(original){db.tasks=db.tasks.map(t=>t.id===item.id?item:t);addActivity(`Updated “${item.title}”`,'fa-pen');}
    else{db.tasks.unshift(item);addActivity(`Created “${item.title}”`,'fa-plus');}
    if(item.status==='done'&&original?.status!=='done')createNextRecurring(item);
    persist();closeModal();rerender();toast(original?'Task updated successfully.':'Task created successfully.');
  }
  function addSubtask(){
    const input=$('#new-subtask-input');if(!input)return;
    const value=input.value.trim();if(!value){input.focus();return;}
    const row=document.createElement('div');row.innerHTML=subtaskRow({id:uid(),title:value.slice(0,120),done:false});
    const child=row.firstElementChild;child.dataset.subtaskId=uid();
    $('#subtask-editor').insertBefore(child,$('#subtask-editor .add-subtask-row'));
    input.value='';input.focus();
  }
  function createNextRecurring(item){
    if(item.repeat==='none'||!item.dueDate)return;
    const d=parseDay(item.dueDate);
    if(item.repeat==='daily')d.setDate(d.getDate()+1);
    if(item.repeat==='weekly')d.setDate(d.getDate()+7);
    if(item.repeat==='monthly'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));}
    let newDate=toISO(d); let retries=0;
    while(newDate<today()&&retries++<370){
      const x=parseDay(newDate);if(item.repeat==='daily')x.setDate(x.getDate()+1);else if(item.repeat==='weekly')x.setDate(x.getDate()+7);else{const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+1);x.setDate(Math.min(day,new Date(x.getFullYear(),x.getMonth()+1,0).getDate()));}newDate=toISO(x);
    }
    db.tasks.unshift({...item,id:uid(),status:'todo',dueDate:newDate,createdAt:now(),updatedAt:now(),completedAt:null,subtasks:item.subtasks.map(s=>({...s,id:uid(),done:false}))});
    addActivity(`Next recurring task scheduled: “${item.title}”`,'fa-repeat');
  }
  function setStatus(id,value){
    const t=db.tasks.find(x=>x.id===id);if(!t||t.status===value||!STATUS.some(s=>s.id===value))return;
    const previous=t.status;t.status=value;t.updatedAt=now();t.completedAt=value==='done'?now():null;
    addActivity(`Moved “${t.title}” to ${statusById(value).label}`,'fa-arrows-left-right');
    if(value==='done'&&previous!=='done')createNextRecurring(t);
    persist();rerender();toast(`Moved to ${statusById(value).label}.`);
  }
  function deleteTask(id){const t=db.tasks.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete “${t.title}”? This cannot be undone.`))return;db.tasks=db.tasks.filter(x=>x.id!==id);addActivity(`Deleted “${t.title}”`,'fa-trash');persist();closeModal();rerender();toast('Task deleted.');}
  function saveProject(form){
    const data=new FormData(form),name=String(data.get('name')||'').trim();if(!name)return;
    if(db.projects.some(p=>p.name.toLowerCase()===name.toLowerCase())){toast('A project with that name already exists.','warning');return;}
    const p={id:uid(),name:name.slice(0,48),color:PALETTE.includes(data.get('color'))?String(data.get('color')):PALETTE[0]};db.projects.push(p);addActivity(`Created project “${p.name}”`,'fa-folder-plus');persist();closeModal();rerender();toast('Project created.');
  }
  function deleteProject(id){
    if(id==='personal')return;const p=db.projects.find(x=>x.id===id);if(!p)return;
    const count=db.tasks.filter(t=>t.projectId===id).length;
    if(!confirm(`Delete project “${p.name}”? ${count} ${count===1?'task':'tasks'} will be moved to Personal.`))return;
    db.tasks.forEach(t=>{if(t.projectId===id)t.projectId='personal';});db.projects=db.projects.filter(x=>x.id!==id);if(projectFilter===id)projectFilter='all';addActivity(`Deleted project “${p.name}”`,'fa-trash');persist();rerender();toast('Project deleted; tasks preserved.');
  }
  function notifications(){
    const tasks=db.tasks.filter(t=>isOverdue(t)||dueSoon(t)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,12);
    const content=`<div class="overlay-backdrop" data-action="overlay-close"><div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">DEADLINE WATCH</div><h2 id="modal-title">Due & overdue tasks</h2><p>Tasks requiring your attention this week.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button></div><div class="notice-list">${tasks.length?tasks.map(t=>`<div class="notice-entry"><span class="metric-icon ${isOverdue(t)?'red':'orange'}"><i class="fa-regular fa-clock"></i></span><button data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}<small>${isOverdue(t)?'Overdue · ':''}${niceDate(t.dueDate)} · ${esc(projectById(t.projectId).name)}</small></button></div>`).join(''):`<div class="empty-state"><i class="fa-solid fa-circle-check"></i><h3>You're up to date</h3><p>No overdue or upcoming deadlines in the next seven days.</p></div>`}</div></div></div>`;
    openModal(content,'#overlay-root .modal [data-action=close-modal]');
  }
  function toggleTheme(){theme=theme==='light'?'dark':'light';document.body.dataset.theme=theme;try{localStorage.setItem('daymark-theme',theme);}catch{}renderHeader();if(view==='settings')renderMain();}
  function exportData(){
    const json=JSON.stringify({...db,exportedAt:now()},null,2),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`daymark-backup-${today()}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Backup downloaded.');
  }
  function importData(file){
    if(!file)return;if(file.size>3000000){toast('Backup is too large (maximum 3 MB).','warning');return;}
    const reader=new FileReader();reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        if(!data||!Array.isArray(data.tasks)||!Array.isArray(data.projects)||data.tasks.length>2000||data.projects.length>100||!data.projects.length)throw Error('Invalid task or project data.');
        const cleanProjects=data.projects.map(p=>({id:String(p.id||uid()).slice(0,120),name:String(p.name||'Project').slice(0,48),color:PALETTE.includes(p.color)?p.color:PALETTE[0]}));
        if(!cleanProjects.some(p=>p.id==='personal'))cleanProjects.unshift({id:'personal',name:'Personal',color:PALETTE[0]});
        const known=new Set(cleanProjects.map(p=>p.id));
        const cleanTasks=data.tasks.map(t=>{
          if(!t||typeof t.title!=='string'||!t.title.trim())throw Error('Invalid task found.');
          return {id:String(t.id||uid()).slice(0,120),title:t.title.slice(0,110),description:String(t.description||'').slice(0,1200),projectId:known.has(t.projectId)?t.projectId:'personal',status:STATUS.some(s=>s.id===t.status)?t.status:'todo',priority:['high','medium','low'].includes(t.priority)?t.priority:'medium',dueDate:typeof t.dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)?t.dueDate:'',estimate:['15m','30m','1h','2h','4h','8h'].includes(t.estimate)?t.estimate:'1h',tags:Array.isArray(t.tags)?t.tags.slice(0,6).map(s=>String(s).slice(0,22)):[],subtasks:Array.isArray(t.subtasks)?t.subtasks.slice(0,50).map(s=>({id:uid(),title:String(s.title||'').slice(0,120),done:!!s.done})):[],repeat:['none','daily','weekly','monthly'].includes(t.repeat)?t.repeat:'none',createdAt:!Number.isNaN(Date.parse(t.createdAt))?t.createdAt:now(),updatedAt:now(),completedAt:t.status==='done'&&t.completedAt&&!Number.isNaN(Date.parse(t.completedAt))?t.completedAt:null};
        });
        if(!confirm(`Import ${cleanTasks.length} tasks and ${cleanProjects.length} projects? Your current workspace will be replaced.`))return;
        db={version:1,projects:cleanProjects,tasks:cleanTasks,activity:[]};addActivity('Workspace restored from backup','fa-upload');projectFilter='all';search='';persist();rerender();toast('Backup imported successfully.');
      }catch(e){console.warn('Backup import rejected:',e);toast('Could not import: please use a Daymark JSON backup.','warning');}
    };reader.onerror=()=>toast('File could not be read.','warning');reader.readAsText(file);
  }
  function resetDemo(){if(!confirm('Replace all current tasks and projects with the original example workspace?'))return;db=demoDatabase();projectFilter='all';priorityFilter='all';search='';persist();rerender();toast('Example workspace restored.');}
  function clearAll(){if(!confirm('Delete ALL tasks, projects and activity from this browser? Export a backup first if needed.'))return;db={version:1,projects:[{id:'personal',name:'Personal',color:'#8375f8'}],tasks:[],activity:[]};projectFilter='all';priorityFilter='all';search='';persist();rerender();toast('Your workspace is now blank.');}
  function closeSidebar(){$('#sidebar').classList.remove('open');$('#mobile-shade').hidden=true;}
  function toggleSidebar(){const opening=!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',opening);$('#mobile-shade').hidden=!opening;}
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action;
    if(action==='overlay-close'){if(e.target===button)closeModal();return;}
    e.preventDefault();
    switch(action){
      case 'navigate':navigate(button.dataset.view);break;
      case 'toggle-sidebar':toggleSidebar();break;
      case 'close-sidebar':closeSidebar();break;
      case 'new-task':newTask(button.dataset.status,button.dataset.date);break;
      case 'edit-task':editTask(button.dataset.id);break;
      case 'delete-task':deleteTask(button.dataset.id);break;
      case 'toggle-done':{const t=db.tasks.find(x=>x.id===button.dataset.id);if(t)setStatus(t.id,t.status==='done'?'todo':'done');break;}
      case 'new-project':openModal(projectModalHtml(),'#project-name');break;
      case 'delete-project':deleteProject(button.dataset.id);break;
      case 'close-modal':closeModal();break;
      case 'add-subtask':addSubtask();break;
      case 'remove-subtask':button.closest('.subtask-edit-row')?.remove();break;
      case 'filter-project':projectFilter=button.dataset.project;priorityFilter='all';navigate('board');break;
      case 'reset-filters':projectFilter='all';priorityFilter='all';sortOrder='due';search='';renderHeader();renderMain();break;
      case 'toggle-theme':toggleTheme();break;
      case 'notifications':notifications();break;
      case 'calendar-prev':changeMonth(-1);break;
      case 'calendar-next':changeMonth(1);break;
      case 'calendar-today':selectedDate=today();calendarYear=new Date().getFullYear();calendarMonth=new Date().getMonth();renderMain();break;
      case 'select-day':selectedDate=button.dataset.date;calendarYear=parseDay(selectedDate).getFullYear();calendarMonth=parseDay(selectedDate).getMonth();renderMain();break;
      case 'export-data':exportData();break;
      case 'import-data':$('#import-input').click();break;
      case 'restore-demo':resetDemo();break;
      case 'clear-data':clearAll();break;
    }
  });
  function changeMonth(num){const date=new Date(calendarYear,calendarMonth+num,1);calendarYear=date.getFullYear();calendarMonth=date.getMonth();selectedDate=toISO(new Date(calendarYear,calendarMonth,1));renderMain();}
  document.addEventListener('submit',e=>{
    if(e.target.id==='task-form'){e.preventDefault();saveTaskForm(e.target);}
    if(e.target.id==='project-form'){e.preventDefault();saveProject(e.target);}
  });
  document.addEventListener('change',e=>{
    const target=e.target;
    if(target.id==='project-filter'){projectFilter=target.value;renderSidebar();renderMain();}
    else if(target.id==='priority-filter'){priorityFilter=target.value;renderMain();}
    else if(target.id==='sort-order'){sortOrder=target.value;renderMain();}
    else if(target.matches('[data-status-change]')){setStatus(target.dataset.statusChange,target.value);}
    else if(target.matches('input[name=color]')){$$('.color-option').forEach(el=>el.classList.toggle('selected',el.querySelector('input')?.checked));}
    else if(target.id==='import-input'){importData(target.files?.[0]);target.value='';}
  });
  $('.global-search').addEventListener('click',e=>{if(e.target!==$('#global-search'))$('#global-search').focus();});
  $('#global-search').addEventListener('input',e=>{
    search=e.target.value;
    if(search.trim()&&!['board','tasks'].includes(view)){view='tasks';renderSidebar();renderHeader();}
    if(view==='board'||view==='tasks')renderMain();
  });
  $('#global-search').addEventListener('focus',()=>$('.global-search').classList.add('search-expanded'));
  $('#global-search').addEventListener('blur',()=>{if(!$('#global-search').value)$('.global-search').classList.remove('search-expanded');});
  $('#mobile-shade').addEventListener('click',closeSidebar);
  document.addEventListener('keydown',e=>{
    const tag=e.target.tagName;
    const editing=['INPUT','TEXTAREA','SELECT'].includes(tag)||e.target.isContentEditable;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search').focus();return;}
    if(e.key==='Escape'){if(activeModal){closeModal();return;}closeSidebar();if(document.activeElement===$('#global-search'))$('#global-search').blur();return;}
    if(activeModal&&e.key==='Tab'){
      const focusable=[...activeModal.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>getComputedStyle(el).display!=='none'&&el.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
    if(!editing&&!activeModal&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='n'){e.preventDefault();newTask();}
    if(e.key==='Enter'&&e.target.id==='new-subtask-input'){e.preventDefault();addSubtask();}
  });
  document.addEventListener('dragstart',e=>{
    const card=e.target.closest('.kanban-card');if(!card)return;dragTaskId=card.dataset.taskId;card.classList.add('dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragTaskId);}
  });
  document.addEventListener('dragover',e=>{const col=e.target.closest('[data-drop-status]');if(!col||!dragTaskId)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';$$('.board-column').forEach(el=>el.classList.toggle('drag-over',el===col));});
  document.addEventListener('drop',e=>{const col=e.target.closest('[data-drop-status]');if(!col||!dragTaskId)return;e.preventDefault();const id=dragTaskId;dragTaskId=null;$$('.board-column').forEach(el=>el.classList.remove('drag-over'));setStatus(id,col.dataset.dropStatus);});
  document.addEventListener('dragend',()=>{dragTaskId=null;$$('.board-column').forEach(el=>el.classList.remove('drag-over'));$$('.kanban-card.dragging').forEach(el=>el.classList.remove('dragging'));});
  persist();rerender();
})();
