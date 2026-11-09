(()=>{
const $=id=>document.getElementById(id),P=PL;
const toast=m=>{const t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>t.hidden=true,3200);};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const pad=n=>String(n||0).padStart(4,'0'),hoy=()=>new Date().toISOString().slice(0,10);
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d;}catch(e){return d;}};
const SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
// ---------- entrega de archivos (móvil y web)
async function entregar(blob,name){const C=window.Capacitor;
 if(C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.Filesystem&&C.Plugins.Share){const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(blob);});const w=await C.Plugins.Filesystem.writeFile({path:name,data:b64,directory:'CACHE'});await C.Plugins.Share.share({title:name,url:w.uri,dialogTitle:name});return;}
 const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return;}catch(e){if(e.name==='AbortError')return;}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();}
// ---------- navegación
const TABS=['fichas','fotos','ficha','ajustes'];
function tab(n){TABS.forEach(t=>{$('t-'+t).hidden=t!==n;$('n-'+t).classList.toggle('on',t===n);});if(n==='ficha')setTimeout(()=>P.mapa.refrescar(),60);if(n==='fichas')lista();if(n==='fotos')galeria();window.scrollTo(0,0);}
TABS.forEach(t=>$('n-'+t).onclick=()=>tab(t));
$('go').onclick=()=>{$('cover').classList.add('out');$('app').hidden=false;setTimeout(()=>$('cover').hidden=true,450);};
// ---------- formularios
const CF={proy:['Proyecto'],an:['Analistas','area'],fecha:['Fecha','date'],numero:['Ficha No.','number'],dir:['Localización (nombre o dirección)'],area:['Área de estudio'],elem:['Elementos constructivos'],esp:['Espacio'],tipo:['Tipo',['MECÁNICA','FÍSICA','QUÍMICA']],les:['Lesión'],ori:['Origen',['SECUNDARIA','PRIMARIA','TERCIARIA']],grado:['Grado',['LEVE','MODERADO','SEVERO-MODERADO','SEVERO']],mat:['Materiales afectados'],sint:['Sintomatología','area'],loc:['Localización de la lesión','area']};
function fld(box,keys){$(box).innerHTML=keys.map(k=>{const[l,t]=CF[k];const e=t==='area'?`<textarea id="f_${k}" rows="3"></textarea>`:Array.isArray(t)?`<select id="f_${k}">${t.map(o=>`<option>${o}</option>`).join('')}</select>`:`<input id="f_${k}" type="${t||'text'}">`;return`<div><label>${l}</label>${e}</div>`;}).join('');}
fld('fDatos',['proy','an','fecha','numero']);fld('fUbic',['dir']);fld('fLes',['area','elem','esp','tipo','les','ori','grado','mat','sint','loc']);
let F={ph:[null,null],pl:[null,null]};const PLN=[{},{}];
function coords(){const p=P.mapa.pos();$('coords').textContent=p?p.lat.toFixed(6)+', '+p.lng.toFixed(6):'';$('lnks').hidden=!p;if(p){$('lEarth').href=P.mapa.earth(p.lat,p.lng);$('lMaps').href=P.mapa.gmaps(p.lat,p.lng);}}
P.mapa.cb=(la,ln,a)=>{coords();if(a)$('f_dir').value=a;};
function setForm(f){F=f;Object.keys(CF).forEach(k=>{const e=$('f_'+k);if(e&&f[k]!=null)e.value=f[k];});$('informe').value=f.informe||'';$('iaRes').innerHTML='';
 [0,1].forEach(i=>{const p=(f.ph||[])[i];$('st'+i).hidden=!p;if(p)$('st'+i).src=p.u;$('sc'+i).value=p&&p.c||'';});
 [0,1].forEach(i=>{const p=(f.pl||[])[i];PLN[i]=p?{u:p.u,w:p.w,h:p.h,mx:p.mx,my:p.my}:{};$('pc'+i).hidden=!p;if(p)setPlan(i,p.u);});
 P.mapa.poner(f.lat,f.lng,false);coords();$('tit').textContent=f.id?'Ficha '+pad(f.numero):'Nueva ficha';}
function leer(){const f=Object.assign({},F);Object.keys(CF).forEach(k=>{const e=$('f_'+k);f[k]=e.type==='number'?(+e.value||0):e.value.trim();});f.informe=$('informe').value;const p=P.mapa.pos();f.lat=p?p.lat:null;f.lng=p?p.lng:null;
 f.ph=[0,1].map(i=>F.ph[i]?Object.assign({},F.ph[i],{c:$('sc'+i).value}):null);f.pl=[0,1].map(i=>PLN[i].u?{u:PLN[i].u,w:PLN[i].w,h:PLN[i].h,mx:PLN[i].mx,my:PLN[i].my}:null);F=f;return f;}
async function blank(){const all=await P.db.all('fichas'),d=LS('pl_d',{});setForm({proy:d.proy||'',an:d.an||'',fecha:hoy(),numero:Math.max(0,...all.map(x=>x.numero||0))+1,dir:'',area:'ESTRUCTURA',elem:'',esp:'',tipo:'MECÁNICA',les:'',ori:'SECUNDARIA',grado:'MODERADO',mat:'',sint:'',loc:'',ph:[null,null],pl:[null,null],informe:''});}
async function guardar(q){const f=leer();if(f.id==null)delete f.id;f.id=await P.db.put('fichas',f);F=f;$('tit').textContent='Ficha '+pad(f.numero);if(!q)toast('Ficha guardada');return f;}
// ---------- lista de fichas (base de datos)
async function lista(){const a=(await P.db.all('fichas')).sort((x,y)=>(y.numero||0)-(x.numero||0));$('lista').innerHTML=a.length?a.map(f=>`<div class="it"><div><b>Ficha ${pad(f.numero)}</b> · ${esc(f.les||'—')} <span class="tp ${esc((f.tipo||'')[0])}">${esc(f.tipo||'')}</span><br><small>${esc(f.proy||'')} · ${esc(f.fecha||'')}</small></div><div class="ac"><button data-a="o" data-i="${f.id}">Abrir</button><button data-a="p" data-i="${f.id}">PDF</button><button data-a="d" data-i="${f.id}">✕</button></div></div>`).join(''):'<p class="mut">—</p>';}
$('lista').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const f=await P.db.get('fichas',+b.dataset.i);if(!f)return;if(b.dataset.a==='o'){setForm(f);tab('ficha');}else if(b.dataset.a==='p')pdf(f);else if(confirm('¿Eliminar la ficha '+pad(f.numero)+'?')){await P.db.del('fichas',f.id);lista();}};
$('nueva').onclick=async()=>{await blank();tab('ficha');};
$('bGuardar').onclick=()=>guardar();
// ---------- cámara, medición y galería
const vid=$('vid'),cv=$('cv'),ctx=cv.getContext('2d');let stream=null,img=null,mode=null,pts=[],scale=0,meas=[],calLine=null,grid=false;
$('bCam').onclick=async()=>{$('camMsg').textContent='';try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920}},audio:false});vid.srcObject=stream;vid.hidden=false;cv.hidden=true;$('ph').hidden=true;$('bShot').disabled=false;}catch(e){$('camMsg').textContent='Cámara en vivo no disponible: usa «Tomar foto».';}};
const stopCam=()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}vid.hidden=true;$('bShot').disabled=true;};
$('bShot').onclick=()=>{const c=document.createElement('canvas');c.width=vid.videoWidth;c.height=vid.videoHeight;c.getContext('2d').drawImage(vid,0,0);stopCam();setImg(c);};
$('bPhoto').onclick=()=>$('file').click();$('bFile').onclick=()=>$('fileG').click();
const onFile=e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const k=Math.min(1,2000/im.naturalWidth),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);stopCam();setImg(c);};im.onerror=()=>{$('camMsg').textContent='No se pudo leer la imagen.';};im.src=u;e.target.value='';};
$('file').onchange=onFile;$('fileG').onchange=onFile;
function setImg(c){img=c;scale=0;meas=[];calLine=null;pts=[];mode=null;grid=false;cv.width=c.width;cv.height=c.height;cv.hidden=false;$('ph').hidden=true;$('tools').hidden=false;$('calRow').hidden=true;upd();draw();}
function draw(){if(!img)return;ctx.drawImage(img,0,0);const lw=Math.max(2,cv.width/400),fs=Math.max(14,cv.width/38);
 if(grid&&scale){let st=1;if(scale<4)st=5;if(scale<.8)st=10;ctx.lineWidth=1;for(let i=0,x=0;x<cv.width;i++,x=i*st*scale){ctx.strokeStyle=(i*st)%10===0?'rgba(255,230,0,.75)':'rgba(255,255,255,.3)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cv.height);ctx.stroke();}
  for(let i=0,y=0;y<cv.height;i++,y=i*st*scale){ctx.strokeStyle=(i*st)%10===0?'rgba(255,230,0,.75)':'rgba(255,255,255,.3)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cv.width,y);ctx.stroke();}lab('malla '+st+' mm',8,fs+4,fs*.8,'#ffe600');}
 if(calLine)ln(calLine[0],calLine[1],'#00e5ff',lw,calLine[2]?calLine[2]+' mm':'');meas.forEach(m=>ln(m.a,m.b,'#ff4081',lw,m.mm.toFixed(1)+' mm'));pts.forEach(p=>dot(p,mode==='cal'?'#00e5ff':'#ff4081'));}
const dot=(p,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(5,cv.width/160),0,7);ctx.fill();};
const ln=(a,b,c,lw,t)=>{ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();dot(a,c);dot(b,c);if(t)lab(t,(a.x+b.x)/2+8,(a.y+b.y)/2-8,Math.max(14,cv.width/38),c);};
const lab=(t,x,y,fs,c)=>{ctx.font='bold '+fs+'px system-ui';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(t,x,y);ctx.fillStyle=c;ctx.fillText(t,x,y);};
cv.addEventListener('click',e=>{if(!mode)return;const r=cv.getBoundingClientRect();pts.push({x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height});
 if(pts.length===2){if(mode==='cal'){calLine=[pts[0],pts[1],0];$('calRow').hidden=false;}else if(scale){meas.push({a:pts[0],b:pts[1],mm:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)/scale});pts=[];upd();}else pts=[];}draw();});
function setMode(m){mode=m;pts=[];$('calRow').hidden=true;$('bCal').classList.toggle('on',m==='cal');$('bMed').classList.toggle('on',m==='med');draw();}
$('bCal').onclick=()=>setMode('cal');$('bMed').onclick=()=>setMode(scale?'med':'cal');
$('bApply').onclick=()=>{const mm=parseFloat($('calMM').value);if(!(mm>0)||!calLine)return;scale=Math.hypot(calLine[0].x-calLine[1].x,calLine[0].y-calLine[1].y)/mm;calLine[2]=mm;grid=true;setMode('med');upd();draw();};
$('bGrid').onclick=()=>{if(scale){grid=!grid;draw();}};
$('bClr').onclick=()=>{meas=[];pts=[];calLine=null;scale=0;grid=false;setMode(null);upd();draw();};
const upd=()=>{$('mInfo').textContent=meas.length?meas.map(m=>m.mm.toFixed(1)+' mm').join(' · '):'';};
$('gGuardar').onclick=async()=>{if(!img)return;const w=Math.min(1100,cv.width),c=document.createElement('canvas');c.width=w;c.height=Math.round(cv.height*w/cv.width);c.getContext('2d').drawImage(cv,0,0,w,c.height);
 await P.db.put('fotos',{u:c.toDataURL('image/jpeg',.85),w:c.width,h:c.height,t:Date.now(),nota:meas.length?'Medidas: '+meas.map(m=>m.mm.toFixed(1)+' mm').join(', '):''});toast('Foto guardada');galeria();};
const fotos=async()=>(await P.db.all('fotos')).sort((a,b)=>b.t-a.t);
async function galeria(){const a=await fotos();$('gal').innerHTML=a.map(f=>`<div><img src="${f.u}"><button class="x" data-i="${f.id}">×</button></div>`).join('');}
$('gal').onclick=async e=>{const b=e.target.closest('.x');if(b&&confirm('¿Eliminar la foto?')){await P.db.del('fotos',+b.dataset.i);galeria();}};
async function elegir(cb){const a=await fotos();$('mg').innerHTML=a.map((f,i)=>`<div><img src="${f.u}" data-i="${i}"></div>`).join('')||'<p class="mut">—</p>';$('modal').hidden=false;$('mg').onclick=e=>{const im=e.target.closest('img');if(!im)return;$('modal').hidden=true;cb(a[+im.dataset.i]);};}
$('mc').onclick=()=>$('modal').hidden=true;
// ---------- fotos del registro y planos
$('slots').innerHTML=[0,1].map(i=>`<div style="flex:1;min-width:140px"><button class="p" id="sb${i}" style="width:100%">Foto ${i+1}</button><img id="st${i}" hidden style="width:100%;margin-top:6px;border-radius:8px"><input id="sc${i}" placeholder="Descripción" style="margin-top:6px"></div>`).join('');
[0,1].forEach(i=>$('sb'+i).onclick=()=>elegir(f=>{F.ph[i]={u:f.u,w:f.w,h:f.h,nota:f.nota||''};$('st'+i).src=f.u;$('st'+i).hidden=false;}));
$('plans').innerHTML=['Localización archivo fotográfico','Localización lesiones'].map((t,i)=>`<div style="margin-top:${i?14:0}px"><b style="font-size:13px">${t}</b><div class="row"><button id="pb${i}">📂 Subir plano</button><button id="pd${i}" style="flex:0 0 auto">Quitar marca</button></div><input type="file" id="pf${i}" accept="image/*,application/pdf" hidden><canvas id="pc${i}" hidden style="width:100%;margin-top:6px;border:1px solid var(--br);border-radius:8px"></canvas></div>`).join('');
function drawP(i){const p=PLN[i],c=$('pc'+i);if(!p.im)return;c.width=p.im.width;c.height=p.im.height;c.hidden=false;const x=c.getContext('2d');x.drawImage(p.im,0,0);if(p.mx!=null){const r=c.width/22,mx=p.mx*c.width,my=p.my*c.height;x.lineWidth=Math.max(3,c.width/280);x.strokeStyle='#1e40ff';x.beginPath();x.ellipse(mx,my,r,r*1.4,0,0,7);x.stroke();x.fillStyle='#e00';x.beginPath();x.arc(mx,my,r/5,0,7);x.fill();}}
function setPlan(i,u){const im=new Image();im.onload=()=>{PLN[i].im=im;drawP(i);};im.src=u;}
async function pdfCanvas(f){await P.lib('pdfjs');const s=document.querySelector('script[src*="pdf.min"]');pdfjsLib.GlobalWorkerOptions.workerSrc=s.src.replace('pdf.min.js','pdf.worker.min.js');const pg=await(await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise).getPage(1),v0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:1600/v0.width}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;return c;}
[0,1].forEach(i=>{$('pb'+i).onclick=()=>$('pf'+i).click();$('pd'+i).onclick=()=>{PLN[i].mx=null;PLN[i].my=null;drawP(i);};
 $('pf'+i).onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const s=f.type==='application/pdf'?await pdfCanvas(f):await new Promise((ok,ko)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1600/im.naturalWidth),q=document.createElement('canvas');q.width=Math.round(im.naturalWidth*k);q.height=Math.round(im.naturalHeight*k);q.getContext('2d').drawImage(im,0,0,q.width,q.height);ok(q);};im.onerror=ko;im.src=URL.createObjectURL(f);});
  const u=s.toDataURL('image/jpeg',.85);PLN[i]={u,w:s.width,h:s.height};setPlan(i,u);}catch(er){toast('No se pudo abrir el plano');}e.target.value='';};
 $('pc'+i).onclick=e=>{const c=$('pc'+i);if(!PLN[i].im)return;const r=c.getBoundingClientRect();PLN[i].mx=(e.clientX-r.left)/r.width;PLN[i].my=(e.clientY-r.top)/r.height;drawP(i);};});
// ---------- ubicación
$('bGps').onclick=()=>{if(!navigator.geolocation)return toast('Sin GPS');navigator.geolocation.getCurrentPosition(p=>P.mapa.poner(p.coords.latitude,p.coords.longitude,true),()=>toast('Activa el permiso de ubicación'),{enableHighAccuracy:true,timeout:20000});};
$('bBus').onclick=async()=>{const q=$('f_dir').value.trim();if(!q)return;const r=await P.mapa.buscar(q);if(r)P.mapa.poner(r.lat,r.lng,false);else toast('No encontrado');};
// ---------- IA
$('bIA').onclick=async()=>{const f=leer();if(!f.ph[0])return toast('Elige la Foto 1');if(!P.ai.lista().length)return toast('Configura una clave en Ajustes');const b=$('bIA');b.disabled=true;$('iaRes').innerHTML='<p class="msg">…</p>';
 try{const{res,con}=await P.ai.clasificar(f);let h='';res.forEach(r=>{h+=`<div class="ia"><b>${esc(r.p)}</b> `+(r.d?`<span class="badge ${esc((r.d.tipo||'')[0])}">${esc(r.d.tipo)}</span> ${esc(r.d.lesion)} · ${esc(r.d.severidad)} · ${+r.d.confianza||0}%`:`<span class="err">${esc(r.e)}</span>`)+'</div>';});
  if(con){const d=con.d,k=(d.tipo||'')[0].toLowerCase(),T={f:'FÍSICA',m:'MECÁNICA',q:'QUÍMICA'},g=(d.severidad||'').toLowerCase();h+=`<div class="ia"><b>Consenso:</b> ${esc(con.tipo)} (${con.n}/${con.de})<br>${esc(d.causa_probable||'')}</div>`;
   if(T[k])$('f_tipo').value=T[k];$('f_les').value=String(d.lesion||'').toUpperCase();$('f_grado').value=g.startsWith('leve')?'LEVE':g.startsWith('mod')?'MODERADO':'SEVERO';$('f_sint').value=d.descripcion||'';F.ia={causa:d.causa_probable||'',alt:d.alternativa||''};}
  $('iaRes').innerHTML=h;}catch(e){$('iaRes').innerHTML=`<p class="err">${esc(e.message)}</p>`;}b.disabled=false;};
$('bInf').onclick=async()=>{const f=leer(),b=$('bInf');b.disabled=true;b.textContent='…';try{$('informe').value=await P.ai.informe(f);}catch(e){toast(e.message);}b.disabled=false;b.textContent='📝 Generar informe con IA';};
// ---------- PDF
async function pdf(f){try{if(!f){f=await guardar(true);}toast('Generando PDF…');await P.lib('jspdf');const logo=await P.logo();let mapa=null;if(f.lat!=null)try{mapa=await P.mapa.snap(f.lat,f.lng);}catch(e){}
 const d=P.pdf.build(window.jspdf.jsPDF,f,{logo,mapa,earth:P.mapa.earth,gmaps:P.mapa.gmaps});await entregar(d.output('blob'),'Ficha_'+pad(f.numero)+'.pdf');}catch(e){toast('Error al crear el PDF: '+(e.message||e));}}
$('bPdf').onclick=()=>pdf();
// ---------- ajustes
const PV=P.PROVEEDORES,K=LS('pl_k',{});
$('pv').innerHTML=PV.map(([id,n,m])=>`<details><summary>${n}</summary><div class="f"><input type="password" id="k_${id}" placeholder="Clave API" autocomplete="off"><input id="m_${id}" placeholder="Modelo"></div></details>`).join('');
PV.forEach(([id,n,m])=>{$('k_'+id).value=K['k_'+id]||'';$('m_'+id).value=K['m_'+id]||m;});
$('aIA').innerHTML='<option value="">Automática</option>'+PV.map(([id,n])=>`<option value="${id}">${n}</option>`).join('');$('aIA').value=localStorage.getItem('pl_ia')||'';
$('bK').onclick=()=>{const o={};PV.forEach(([id])=>{o['k_'+id]=$('k_'+id).value.trim();o['m_'+id]=$('m_'+id).value.trim();});SS('pl_k',o);try{localStorage.setItem('pl_ia',$('aIA').value);}catch(e){}toast('Guardado');};
const D0=LS('pl_d',{});$('aProy').value=D0.proy||'';$('aAn').value=D0.an||'';
$('bD').onclick=()=>{SS('pl_d',{proy:$('aProy').value.trim(),an:$('aAn').value.trim()});toast('Guardado');};
$('bExp').onclick=async()=>{await entregar(new Blob([JSON.stringify({fichas:await P.db.all('fichas'),fotos:await P.db.all('fotos')})],{type:'application/json'}),'PatoLens_respaldo.json');};
$('bImp').onclick=()=>$('impF').click();
$('impF').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());for(const x of o.fotos||[])await P.db.put('fotos',x);for(const x of o.fichas||[])await P.db.put('fichas',x);toast('Importado');}catch(er){toast('Archivo inválido');}e.target.value='';};
// ---------- inicio
blank();lista();
if('serviceWorker' in navigator&&!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
