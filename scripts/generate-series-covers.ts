import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { agentSeries } from '../src/utils/agent-series';

const OUT = join(process.cwd(), 'public/images');
mkdirSync(OUT, {recursive:true});

// These are semantic architecture illustrations, not product screenshots.
// Source is procedural vector art; output is optimized editorial WebP.
function art(index: number) {
  const palettes = [
    ['#031522','#0e5965','#f59e0b'],
    ['#150c2e','#7447bc','#2dd4bf'],
    ['#071827','#26a0b4','#f97316'],
    ['#0a1724','#159f8f','#fb923c'],
    ['#0e1730','#21a5b6','#efad43'],
  ];
  const [bg,accent,warm] = palettes[index];
  const stars=Array.from({length:70},(_,i)=>{
    const x=(i*173+53)%1190+5,y=(i*89+31)%610+10,r=(i%7===0?2.1:1.1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#d8f9ff" opacity="${0.12+(i%5)*.065}"/>`;
  }).join('');
  const nodes=[
    [{x:275,y:170},{x:900,y:165},{x:950,y:465},{x:245,y:465}],
    [{x:250,y:315},{x:950,y:315},{x:600,y:110},{x:600,y:530}],
    [{x:250,y:180},{x:935,y:180},{x:600,y:480},{x:210,y:480}],
    [{x:200,y:320},{x:460,y:320},{x:730,y:320},{x:1015,y:320}],
    [{x:250,y:160},{x:930,y:160},{x:250,y:460},{x:930,y:460}]
  ][index];
  const paths=nodes.map((n,i)=>{
    const midX=(600+n.x)/2,midY=(315+n.y)/2;
    return `<path d="M600 315 Q${midX+(i%2?50:-50)} ${midY-55} ${n.x} ${n.y}" fill="none" stroke="url(#wire)" stroke-width="4" stroke-dasharray="${index===2?'12 12':'none'}" opacity=".76"/>`;
  }).join('');
  const discs=nodes.map((n,i)=>`<g transform="translate(${n.x} ${n.y})">
      <circle r="68" fill="#071e32" stroke="${i%2?warm:accent}" stroke-width="3" opacity=".95"/>
      <circle r="48" fill="none" stroke="#99f6e4" opacity=".5" stroke-width="2"/>
      <path d="${i%3===0?'M-22 0 L-3 -20 L20 0 L-3 20 Z':i%3===1?'M-24 -12 H24 M-24 0 H24 M-24 12 H24':'M-20 0 L0 -18 L20 0 L0 18 Z'}" fill="none" stroke="${i%2?warm:'#7deee1'}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle r="74" stroke="#e9fffd" fill="none" opacity=".09"/>
    </g>`).join('');
  const center=index===2
    ? '<path d="M0 -65 L58 43 H-58 Z" fill="none" stroke="#f7bf64" stroke-width="11" stroke-linejoin="round"/><circle r="25" fill="#99fff3"/>'
    :index===3
    ? '<path d="M-60 0 H60 M40 -20 L60 0 L40 20" fill="none" stroke="#d1fff9" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>'
    :index===4
    ? '<path d="M-64 42 A76 76 0 0 1 64 42" fill="none" stroke="#f6af46" stroke-width="14" stroke-linecap="round"/><path d="M0 32 L40 -35" stroke="#a3fff2" stroke-width="12" stroke-linecap="round"/>'
    :'<path d="M-40 -22 L0 -48 L40 -22 L0 5 Z M-40 4 L0 31 L40 4 M-40 27 L0 53 L40 27" fill="none" stroke="#d5fff7" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><radialGradient id="bg"><stop offset="0" stop-color="${accent}" stop-opacity=".52"/><stop offset="1" stop-color="${bg}"/></radialGradient>
    <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5ce9dd"/><stop offset="1" stop-color="${warm}"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="22"/></filter></defs>
    <rect width="1200" height="630" fill="${bg}"/><rect width="1200" height="630" fill="url(#bg)"/>
    <ellipse cx="600" cy="330" rx="460" ry="240" fill="${accent}" opacity=".13" filter="url(#glow)"/>
    ${stars}<circle cx="600" cy="315" r="255" fill="none" stroke="#c3f8ef" stroke-width="2" stroke-dasharray="5 17" opacity=".24"/>
    ${paths}${discs}
    <circle cx="600" cy="315" r="110" fill="#092338" stroke="${warm}" stroke-width="5"/>
    <circle cx="600" cy="315" r="90" fill="none" stroke="#80eadd" stroke-width="2" opacity=".6"/>
    <g transform="translate(600 315)">${center}</g>
    <path d="M40 40 H180 M1020 590 H1160" stroke="${warm}" stroke-width="7" stroke-linecap="round" opacity=".68"/>
  </svg>`;
}
for (const [index, entry] of agentSeries.entries()) {
  if (!existsSync(join(process.cwd(), 'src/content/blog/es', entry.slug + '.md'))) continue;
  await sharp(Buffer.from(art(index))).webp({quality:84,effort:6}).toFile(join(OUT,entry.slug+'.webp'));
  console.log('Generated cover:',entry.slug);
}
