export interface GlobeOptions {yaw:number;tilt:number;grid:number;land:boolean;radius:number;}
const rad=Math.PI/180;
const continents:number[][][]=[
 [[-168,69],[-145,71],[-125,60],[-110,69],[-83,72],[-56,51],[-78,44],[-81,25],[-98,18],[-117,30],[-128,50],[-158,58]],
 [[-81,12],[-62,10],[-48,-4],[-35,-8],[-47,-25],[-63,-55],[-74,-45],[-81,-10]],
 [[-17,35],[10,37],[33,30],[50,12],[42,-13],[27,-35],[13,-28],[8,-5],[-15,8]],
 [[-10,36],[-11,58],[15,71],[40,68],[68,74],[120,73],[170,63],[145,46],[132,34],[122,17],[104,2],[89,22],[77,7],[66,25],[43,12],[34,31],[17,39]],
 [[112,-12],[134,-10],[154,-24],[147,-39],[117,-35]],
 [[-53,60],[-43,60],[-20,81],[-47,84],[-65,76]]
];
function inside(x:number,y:number,polygon:number[][]){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}return hit;}
export function projectPoint(lon:number,lat:number,yaw:number,tilt:number):[number,number,number]{const a=(lon+yaw)*rad,b=lat*rad,t=tilt*rad;const x=Math.cos(b)*Math.sin(a),y=-Math.sin(b),z=Math.cos(b)*Math.cos(a);return [x,y*Math.cos(t)-z*Math.sin(t),y*Math.sin(t)+z*Math.cos(t)];}
export function globeGeometry(o:GlobeOptions):string{
 const r=o.radius;let front='',back='';
 const line=(points:[number,number,number][])=>{let wasFront:boolean|undefined;for(const [x,y,z] of points){const isFront=z>=0;const cmd=(wasFront===isFront?'L':'M')+(x*r).toFixed(2)+','+(y*r).toFixed(2);if(isFront)front+=cmd;else back+=cmd;wasFront=isFront;}};
 const step=180/o.grid;
 for(let lat=-90+step;lat<90;lat+=step){const points:[number,number,number][]=[];for(let lon=-180;lon<=180;lon+=3)points.push(projectPoint(lon,lat,o.yaw,o.tilt));line(points);}
 for(let lon=-180;lon<180;lon+=step){const points:[number,number,number][]=[];for(let lat=-90;lat<=90;lat+=3)points.push(projectPoint(lon,lat,o.yaw,o.tilt));line(points);}
 let land='';if(o.land){for(let lat=-57;lat<=81;lat+=3.5)for(let lon=-178;lon<=178;lon+=3.5){if(!continents.some(p=>inside(lon,lat,p)))continue;const [x,y,z]=projectPoint(lon,lat,o.yaw,o.tilt);if(z>.03)land+=`<circle cx="${(x*r).toFixed(2)}" cy="${(y*r).toFixed(2)}" r="${(r*.009*(.4+.6*z)).toFixed(2)}" opacity=".9"/>`;}}
 return `<g data-asset="globe"><circle r="${r}" fill="none" stroke="currentColor" stroke-width="${r*.004}"/><path data-surface="back" d="${back}" fill="none" stroke="currentColor" stroke-width="${r*.003}" opacity=".16"/><path data-surface="front" d="${front}" fill="none" stroke="currentColor" stroke-width="${r*.0035}" opacity=".78"/>${land}</g>`;
}
