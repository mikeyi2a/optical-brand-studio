export type ThermalPalette = 'spectrum' | 'iron' | 'acid';
export interface ThermalSettings {palette:ThermalPalette; exposure:number; contrast:number; bands:number; blend:number; blur:number; invert:boolean; scanlines:boolean; glitchEnabled:boolean; glitchAmount:number; signalBreakup:boolean; breakupDensity:number;}
export const thermalDefaults:ThermalSettings={palette:'spectrum',exposure:0,contrast:1.3,bands:32,blend:100,blur:1,invert:false,scanlines:false,glitchEnabled:false,glitchAmount:22,signalBreakup:false,breakupDensity:24};
export const palettes:Record<ThermalPalette,number[][]>={
 spectrum:[[8,3,30],[57,8,138],[25,53,241],[0,207,206],[83,232,70],[255,234,25],[255,80,8],[225,13,69],[255,232,218]],
 iron:[[4,2,8],[39,6,66],[105,12,98],[192,28,57],[245,87,12],[255,183,21],[255,240,119],[255,255,241]],
 acid:[[8,9,5],[45,41,8],[136,74,6],[218,138,9],[237,220,24],[219,250,55],[249,255,209]]
};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function thermalLUT(settings:ThermalSettings):Uint8ClampedArray{
 const stops=palettes[settings.palette];const lut=new Uint8ClampedArray(256*3);
 for(let i=0;i<256;i++){
  let v=clamp((i/255*Math.pow(2,settings.exposure)-.5)*settings.contrast+.5);
  if(settings.invert)v=1-v;
  v=Math.round(v*(settings.bands-1))/(settings.bands-1);
  const pos=v*(stops.length-1),a=Math.floor(pos),b=Math.min(a+1,stops.length-1),f=pos-a;
  for(let c=0;c<3;c++)lut[i*3+c]=stops[a][c]*(1-f)+stops[b][c]*f;
 }
 return lut;
}
export function mapThermalPixels(data:Uint8ClampedArray,settings:ThermalSettings):void{
 const lut=thermalLUT(settings),mix=settings.blend/100;
 for(let i=0;i<data.length;i+=4){const lum=Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);for(let c=0;c<3;c++)data[i+c]=data[i+c]*(1-mix)+lut[lum*3+c]*mix;}
}
