import {globeGeometry} from './globe.ts';
import {svgGlitchOverlay,svgSignalBreakup} from './glitch.ts';
export type Kind = 'Spiral' | 'Radial' | 'Rings' | 'Hazard' | 'Wave';
export type Mode = 'pattern' | 'signal' | 'poster' | 'globe';
export interface Settings {kind:Kind; density:number; twist:number; weight:number; rotation:number; scale:number; repeat:number; foreground:string; background:string; format:string; headline:string; caption:string; texture:number; scanlines:boolean; chromatic:boolean; seed:number; globeYaw:number; globeTilt:number; globeGrid:number; globeLand:boolean; globeLabel:string; textOverlay:boolean; overlayText:string; textRepeats:number; textGlitch:number; showPattern:boolean; transparent:boolean; annotations:boolean; glitchEnabled:boolean; glitchAmount:number; signalBreakup:boolean; breakupDensity:number;}
export const defaults:Settings = {kind:'Spiral',density:16,twist:105,weight:50,rotation:0,scale:88,repeat:1,foreground:'#171815',background:'#e5f23c',format:'square',headline:'LOOK\nAGAIN.',caption:'PERCEPTION IS A WORK IN PROGRESS',texture:24,scanlines:true,chromatic:false,seed:17,globeYaw:15,globeTilt:-15,globeGrid:12,globeLand:true,globeLabel:'GLOBAL TRANSMISSION',textOverlay:true,overlayText:'SCANNING\nMEMORIES',textRepeats:3,textGlitch:18,showPattern:false,transparent:false,annotations:true,glitchEnabled:false,glitchAmount:22,signalBreakup:false,breakupDensity:24};
export const kinds:Kind[]=['Spiral','Radial','Rings','Hazard','Wave'];
export const sizes:Record<string,[number,number]>={square:[1080,1080],portrait:[1080,1350],wide:[1920,1080]};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function shape(s:Settings,r:number) {
 let out='';const n=s.density;const duty=s.weight/100;
 if(s.kind==='Spiral'||s.kind==='Radial') {
  for(let a=0;a<n;a++) {const points:string[]=[]; for(let side=0;side<2;side++) for(let j=0;j<=80;j++){const f=side===0?j/80:1-j/80;const radius=r*f;const theta=(a+(side===0?0:duty))*Math.PI*2/n+(s.kind==='Spiral'?f*s.twist*Math.PI/180:0);points.push(`${(Math.cos(theta)*radius).toFixed(2)},${(Math.sin(theta)*radius).toFixed(2)}`);}out+=`<polygon points="${points.join(' ')}"/>`;}
 } else if(s.kind==='Rings'){for(let i=1;i<=n;i++)out+=`<circle r="${i*r/n}" fill="none" stroke="currentColor" stroke-width="${r/n*duty}"/>`;}
 else if(s.kind==='Hazard'){for(let i=-n;i<=n;i++)out+=`<rect x="${i*2*r/n}" y="${-r*2}" width="${2*r/n*duty}" height="${r*4}" transform="rotate(35)"/>`;}
 else {for(let i=-n;i<=n;i++){let d='';for(let j=0;j<=100;j++){let x=-r*1.5+j*r*3/100;let y=i*r*2/n+Math.sin(x/r*5+s.twist/40)*r*.14;d+=`${j?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;}out+=`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${r*2/n*duty}"/>`;}}
 return out;
}
export function artwork(s:Settings,mode:Mode='pattern',phase=0,mini=false):string{
 s={...defaults,...s};
 const [w,h]=sizes[s.format]||sizes.square;const fg=esc(s.foreground),bg=esc(s.background);let out='';let seed=s.seed+(mode==='signal'?Math.floor(phase*3):0);
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const columns=s.repeat;const areaH=mode==='poster'?h*.65:h;const cell=Math.min(w/columns,areaH/columns);const r=cell*s.scale/200;
 const motif=shape(s,r);
 if(mode!=='globe'&&(mode!=='signal'||s.showPattern))for(let y=0;y<columns;y++)for(let x=0;x<columns;x++){const cx=w/2+(x-(columns-1)/2)*cell;const cy=areaH/2+(y-(columns-1)/2)*cell+(mode==='poster'?h*.015:0);out+=`<g transform="translate(${cx} ${cy}) rotate(${s.rotation+phase})" fill="${fg}" color="${fg}">${motif}</g>`;}
 if(mode==='globe'){
 const radius=Math.min(w,h)*s.scale/230;
 out+=`<g transform="translate(${w/2} ${h/2})" fill="${fg}" color="${fg}">${globeGeometry({yaw:s.globeYaw+phase,tilt:s.globeTilt,grid:s.globeGrid,land:s.globeLand,radius})}</g>`;
 if(s.annotations)out+=`<g fill="${fg}" font-family="monospace"><text x="${w*.045}" y="${h*.065}" font-size="${w*.018}" letter-spacing="3">${esc(s.globeLabel.toUpperCase())}</text><text x="${w*.045}" y="${h*.094}" font-size="${w*.01}">CHANNEL ${String(s.seed).padStart(3,'0')} / CONNECTED</text><text x="${w*.045}" y="${h*.95}" font-size="${w*.012}">YAW ${Math.round((s.globeYaw+phase)%360)}° / TILT ${s.globeTilt}°</text><text x="${w*.95}" y="${h*.95}" text-anchor="end" font-size="${w*.012}">OPTICAL DEPT.</text></g><g stroke="${fg}" opacity=".5" fill="none" stroke-width="1"><path d="M${w*.045} ${h*.12}H${w*.955}M${w*.045} ${h*.9}H${w*.955}"/><path d="M${w/2-12} ${h*.14}h24m-12 -12v24M${w/2-12} ${h*.86}h24m-12 -12v24"/></g>`;
 }
 if(mode==='signal'&&s.chromatic) out=`<g opacity=".65" transform="translate(9 0)" style="color:#ff3866">${out.replaceAll(fg,'#ff3866')}</g><g opacity=".65" transform="translate(-9 0)">${out.replaceAll(fg,'#15dce5')}</g>${out}`;
 if(mode==='signal'&&s.textOverlay){
 const lines=s.overlayText.split('\n').slice(0,3);const maxLength=Math.max(1,...lines.map(l=>l.length));
 const fontSize=Math.min(w*.115,w*.88/(maxLength*.66),h*.68/(s.textRepeats*lines.length*1.1));
 const block=lines.length*fontSize*1.04;const fullHeight=block*s.textRepeats;let text='';
 for(let repeat=0;repeat<s.textRepeats;repeat++)lines.forEach((line,i)=>{const y=h*.48-fullHeight/2+repeat*block+(i+1)*fontSize;const x=w*.055;const attrs=`font-family="monospace" font-weight="900" font-size="${fontSize}" letter-spacing="${fontSize*.01}"`;
 if(s.textGlitch>0)text+=`<text x="${x+s.textGlitch*.35}" y="${y}" ${attrs} fill="#ff3157" opacity=".55">${esc(line.toUpperCase())}</text><text x="${x-s.textGlitch*.35}" y="${y+fontSize*.02}" ${attrs} fill="#27e0ef" opacity=".55">${esc(line.toUpperCase())}</text>`;
 text+=`<text x="${x}" y="${y}" ${attrs} fill="${fg}" stroke="${bg}" stroke-width="${fontSize*.017}" paint-order="stroke">${esc(line.toUpperCase())}</text>`;});
 if(s.textGlitch>0){const baseText=text;let sliced='';let cursor=0;const bands=Array.from({length:Math.ceil(s.textGlitch/4)},()=>h*.48-fullHeight/2+random()*fullHeight).sort((a,b)=>a-b);const slice=(y:number,height:number,shift:number)=>`<svg x="0" y="${y}" width="${w}" height="${height}" viewBox="0 ${y} ${w} ${height}" overflow="hidden"><g transform="translate(${shift} 0)">${baseText}</g></svg>`;for(const y of bands){if(y<cursor)continue;if(y>cursor)sliced+=slice(cursor,y-cursor,0);const band=Math.max(2,fontSize*(.04+random()*.1));sliced+=slice(y,band,(random()-.5)*s.textGlitch*2);cursor=y+band;}if(cursor<h)sliced+=slice(cursor,h-cursor,0);text=sliced;}

 out+=`<g data-effect="glitch-text">${text}</g>`;
 }
 if(mode==='poster') {const lines=s.headline.split('\n').slice(0,3); const longest=Math.max(...lines.map(l=>l.length),1);const fontSize=Math.min(w*.20,w*.88/(longest*.62),h*.26/lines.length);out+=`<text x="${w*.055}" y="${h*.052}" font-family="monospace" font-size="${w*.013}" letter-spacing="3" fill="${fg}">OPTICAL DEPT. / EXPERIMENT ${String(s.seed).padStart(3,'0')}</text>`; lines.forEach((l,i)=>{out+=`<text x="${w*.05}" y="${h*.69+(i+1)*fontSize*.89}" font-family="Impact, 'Arial Black', sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="-3" fill="${fg}">${esc(l.toUpperCase())}</text>`;});out+=`<path d="M${w*.05} ${h*.945}H${w*.95}" stroke="${fg}" stroke-width="2"/><text x="${w*.05}" y="${h*.97}" fill="${fg}" font-family="monospace" font-size="${w*.012}" textLength="${Math.min(s.caption.length*w*.007,w*.87)}" lengthAdjust="spacingAndGlyphs">${esc(s.caption.toUpperCase())}</text>`;}
 if(mode==='signal') {for(let i=0;i<s.texture*7;i++){let y=random()*h;out+=`<rect x="${random()*w}" y="${y}" width="${random()*w*.16+2}" height="${random()*9+1}" fill="${i%3===0?bg:fg}" opacity="${random()*.65}"/>`;}for(let i=0;i<Math.floor(s.texture/5);i++)out+=`<rect x="0" y="${random()*h}" width="${w}" height="${random()*18+3}" fill="${bg}" opacity=".8"/>`;if(s.annotations)out+=`<rect x="${w*.03}" y="${h*.90}" width="${w*.94}" height="${h*.06}" fill="${bg}"/><text x="${w*.045}" y="${h*.94}" fill="${fg}" font-family="monospace" font-size="${w*.024}" letter-spacing="2">SIGNAL ${String(s.seed).padStart(3,'0')} / PERCEPTION TEST</text>`;}
 if(!mini&&mode==='pattern'&&s.annotations)out+=`<g data-effect="annotations" fill="${fg}" font-family="monospace" font-size="${w*.011}" letter-spacing="2"><text x="${w*.035}" y="${h*.043}">O—D / ${s.kind.toUpperCase()} STUDY</text><text x="${w*.035}" y="${h*.966}">FIG. ${String(s.seed).padStart(3,'0')}</text><text x="${w*.965}" y="${h*.966}" text-anchor="end">OPTICAL DEPT.</text></g>`;
 out += svgGlitchOverlay(w,h,{enabled:s.glitchEnabled,amount:s.glitchAmount,seed:s.seed + Math.floor(phase * 7)});
 out += svgSignalBreakup(w,h,{enabled:s.signalBreakup,density:s.breakupDensity,seed:s.seed + Math.floor(phase * 11),colour:fg});
 if(s.scanlines)out+=`<path data-effect="scanlines" d="${Array.from({length:Math.ceil(h/6)},(_,i)=>`M0 ${i*6}H${w}`).join(' ')}" stroke="${fg}" opacity=".25" stroke-width="2"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${mode==='globe'?'Wireframe globe':esc(s.kind)+' '+mode} artwork">${s.transparent&&(mode==='signal'||mode==='globe')?'':`<rect width="${w}" height="${h}" fill="${bg}"/>`}<svg width="${w}" height="${h}" overflow="hidden">${out}</svg></svg>`;
}
