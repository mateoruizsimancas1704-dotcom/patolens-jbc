global.window=global;global.PL={};require('./pdf.js');
let calls=0;const bad=[];
const chk=(n,a)=>a.forEach((v,i)=>{if(typeof v==='number'&&!isFinite(v))bad.push(n+' arg'+i+' NaN');if(v===undefined&&n!=='save')bad.push(n+' arg'+i+' undefined');});
class J{constructor(){this.pages=1;}
 setFont(...a){calls++;chk('setFont',a);return this;} setFontSize(...a){calls++;chk('setFontSize',a);return this;} setLineWidth(...a){chk('setLineWidth',a);return this;}
 rect(...a){chk('rect',a);return this;} line(...a){chk('line',a);return this;} ellipse(...a){chk('ellipse',a);return this;} circle(...a){chk('circle',a);return this;}
 setDrawColor(...a){chk('dc',a);return this;} setFillColor(...a){chk('fc',a);return this;} setTextColor(...a){chk('tc',a);return this;}
 text(t,x,y,o){calls++;if(t===undefined||t===null)bad.push('text undefined');chk('text',[x,y]);return this;}
 textWithLink(t,x,y,o){chk('link',[x,y]);if(!o||!o.url)bad.push('link sin url');return this;}
 addImage(u,f,x,y,w,h){chk('addImage',[x,y,w,h]);if(!(w>0&&h>0))bad.push('imagen tamaño 0');return this;}
 addPage(){this.pages++;return this;} getTextWidth(t){return String(t).length*1.5;}
 splitTextToSize(t,w){t=String(t);const out=[],n=Math.max(10,Math.floor(w/1.6));for(let i=0;i<t.length;i+=n)out.push(t.slice(i,i+n));return out.length?out:[''];}
 output(){return 'blob';}}
const img={u:'data:image/jpeg;base64,xx',w:1000,h:700};
const f={proy:'Estudio',dir:'Calle 36 Sur No. 52A-88, Bogotá',an:'A\nB\nC',fecha:'2026-09-24',numero:1,area:'ESTRUCTURA',elem:'MURO',esp:'ÁREA',tipo:'MECÁNICA',les:'FISURA',ori:'SECUNDARIA',grado:'SEVERO',mat:'PAÑETE',sint:'x'.repeat(300),loc:'y'.repeat(200),lat:4.5,lng:-74.1,ph:[{...img,c:'desc'},null],pl:[{...img,mx:.4,my:.5},null],informe:'## 1. Resumen\n- punto uno\ntexto normal '.repeat(60)};
const o={logo:{u:'data:image/png;base64,xx',w:200,h:200},mapa:{u:'data:image/jpeg;base64,xx',w:768,h:768},earth:(a,b)=>'e'+a,gmaps:(a,b)=>'g'+a};
const d=PL.pdf.build(J,f,o);
const d2=PL.pdf.build(J,{numero:2,ph:[],pl:[],informe:''},{logo:o.logo,mapa:null,earth:o.earth,gmaps:o.gmaps});
console.log('páginas con informe:',d.pages,'| mínima:',d2.pages,'| llamadas:',calls,'| errores:',bad.length?bad:'ninguno');
process.exit(bad.length?1:0);
