import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {Button,Slider} from '@mikeyi2a/minikit-ui';
import {Play,Pause} from 'lucide-react';
import {mapThermalPixels,type ThermalSettings} from './thermal';
import {encodeMp4,LOOP_FPS} from './videoExport';
import {drawCanvasGlitch,drawCanvasSignalBreakup} from './glitch';
export interface MediaSource {url:string;name:string;video:boolean;}
export interface ThermalHandle {exportPNG:()=>Promise<Blob>;exportMP4:(onProgress:(p:number)=>void)=>Promise<Blob>;}
interface Props {source:MediaSource;settings:ThermalSettings;width:number;height:number;onReady:(ready:boolean)=>void;}
export const ThermalCanvas=forwardRef<ThermalHandle,Props>(function ThermalCanvas({source,settings,width,height,onReady},ref){
 const canvas=useRef<HTMLCanvasElement>(null);const media=useRef<HTMLImageElement|HTMLVideoElement|null>(null);const options=useRef({settings,width,height});options.current={settings,width,height};
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(0);
 function draw(target:HTMLCanvasElement,full=false){
  const m=media.current;if(!m)return;const o=options.current;const ratio=full?1:Math.min(1,640/o.width,640/o.height);target.width=Math.round(o.width*ratio);target.height=Math.round(o.height*ratio);
  const ctx=target.getContext('2d',{willReadFrequently:true})!;const sw=m instanceof HTMLVideoElement?m.videoWidth:m.naturalWidth,sh=m instanceof HTMLVideoElement?m.videoHeight:m.naturalHeight;
  if(!sw||!sh)return;const scale=Math.max(target.width/sw,target.height/sh);ctx.filter=`blur(${o.settings.blur*ratio}px)`;ctx.drawImage(m,(target.width-sw*scale)/2,(target.height-sh*scale)/2,sw*scale,sh*scale);ctx.filter='none';
  const pixels=ctx.getImageData(0,0,target.width,target.height);mapThermalPixels(pixels.data,o.settings);ctx.putImageData(pixels,0,0);
  if(o.settings.scanlines){ctx.fillStyle='rgba(0,0,0,.22)';for(let y=0;y<target.height;y+=Math.max(3,6*ratio))ctx.fillRect(0,y,target.width,Math.max(1,2*ratio));}
  drawCanvasGlitch(ctx,target.width,target.height,{enabled:o.settings.glitchEnabled,amount:o.settings.glitchAmount,seed:173+(m instanceof HTMLVideoElement?Math.floor(m.currentTime*24):0)});
  drawCanvasSignalBreakup(ctx,target.width,target.height,{enabled:o.settings.signalBreakup,density:o.settings.breakupDensity,seed:401+(m instanceof HTMLVideoElement?Math.floor(m.currentTime*24):0)});
 }
 useImperativeHandle(ref,()=>({exportMP4:async onProgress=>{const m=media.current;if(!ready||!(m instanceof HTMLVideoElement))throw Error('Load a video first');setPlaying(false);m.pause();const resume=m.currentTime;const dur=Math.min(m.duration||1,15);const frames=Math.max(1,Math.round(dur*LOOP_FPS));const {width:w,height:h}=options.current;const scratch=document.createElement('canvas');
  try{return await encodeMp4(w,h,frames,async(i,ctx)=>{await new Promise<void>(r=>{const done=()=>{m.removeEventListener('seeked',done);r()};m.addEventListener('seeked',done);m.currentTime=Math.min(i/LOOP_FPS,m.duration-.001)});draw(scratch,true);ctx.drawImage(scratch,0,0,ctx.canvas.width,ctx.canvas.height)},onProgress)}finally{m.currentTime=resume}},exportPNG:async()=>{if(!ready)throw Error('Media is not ready');const target=document.createElement('canvas');draw(target,true);return new Promise<Blob>((resolve,reject)=>target.toBlob(b=>b?resolve(b):reject(Error('PNG export failed')),'image/png'));}}),[ready]);
 useEffect(()=>{
  setReady(false);onReady(false);setPlaying(false);setError('');setTime(0);setDuration(0);let disposed=false;
  const m=source.video?document.createElement('video'):new Image();media.current=m;
  const loaded=()=>{if(disposed)return;setReady(true);onReady(true);if(m instanceof HTMLVideoElement)setDuration(m.duration);if(canvas.current)draw(canvas.current);};
  const fail=()=>{if(disposed)return;setError('This file could not be decoded. Try a JPEG, PNG, WebP, or H.264 MP4.');setReady(false);onReady(false);setPlaying(false);};
  m.addEventListener(source.video?'loadeddata':'load',loaded);m.addEventListener('error',fail);
  if(m instanceof HTMLVideoElement){m.muted=true;m.playsInline=true;m.loop=true;m.preload='auto';m.addEventListener('seeked',loaded);m.addEventListener('timeupdate',()=>{if(!disposed)setTime(m.currentTime)});}
  m.src=source.url;
  return()=>{disposed=true;m.removeEventListener(source.video?'loadeddata':'load',loaded);m.removeEventListener('error',fail);if(m instanceof HTMLVideoElement){m.pause();m.removeAttribute('src');m.load();}media.current=null;};
 },[source]);
 useEffect(()=>{if(ready&&canvas.current)draw(canvas.current);},[settings,width,height,ready]);
 useEffect(()=>{const m=media.current;if(!(m instanceof HTMLVideoElement))return;let frame=0;let stopped=false;let last=0;
  if(playing){m.play().catch(()=>{if(!stopped){setPlaying(false);setError('Playback could not start. Try another MP4 file.');}});const tick=(now:number)=>{if(now-last>=1000/24&&canvas.current){draw(canvas.current);last=now;}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);}else m.pause();
  return()=>{stopped=true;cancelAnimationFrame(frame);m.pause();};
 },[playing,ready]);
 return <div className="thermal-preview"><canvas ref={canvas} aria-label="Heat map preview" style={{aspectRatio:`${width}/${height}`}}/>{(!ready||error)&&<div className="media-message" role="status">{error||'Loading media…'}</div>}{source.video&&ready&&<div className="video-controls"><Button variant="secondary" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pause video':'Play video'}>{playing?<Pause size={14}/>:<Play size={14}/>}</Button><Slider label="Video position" min={0} max={duration||1} step={0.01} value={time} onValueChange={v=>{const m=media.current;if(m instanceof HTMLVideoElement){m.currentTime=v;setTime(v)}}} showValue={false}/><span>{time.toFixed(1)} / {duration.toFixed(1)}s</span></div>}</div>;
});
