import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
export const LOOP_FPS=30;
export const canExportVideo=()=>typeof VideoEncoder!=='undefined';
/** Encodes frames deterministically (not real-time) into an H.264 MP4. */
export async function encodeMp4(width:number,height:number,frames:number,draw:(i:number,ctx:CanvasRenderingContext2D)=>Promise<void>,onProgress?:(p:number)=>void):Promise<Blob>{
 if(!canExportVideo())throw Error('MP4 export needs a recent Chrome, Edge or Safari');
 const w=width&~1,h=height&~1;const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;
 const muxer=new Muxer({target:new ArrayBufferTarget(),video:{codec:'avc',width:w,height:h},fastStart:'in-memory'});
 let failure:unknown;const encoder=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>{failure=e}});
 encoder.configure({codec:'avc1.640033',width:w,height:h,bitrate:w*h>1500000?12_000_000:8_000_000,framerate:LOOP_FPS});
 for(let i=0;i<frames;i++){
  if(failure)throw failure;
  await draw(i,ctx);
  const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/LOOP_FPS),duration:Math.round(1e6/LOOP_FPS)});
  encoder.encode(frame,{keyFrame:i%LOOP_FPS===0});frame.close();
  while(encoder.encodeQueueSize>8)await new Promise(r=>setTimeout(r,4));
  onProgress?.((i+1)/frames);if(i%4===0)await new Promise(r=>setTimeout(r));
 }
 await encoder.flush();if(failure)throw failure;muxer.finalize();
 return new Blob([(muxer.target as ArrayBufferTarget).buffer],{type:'video/mp4'});
}
