/** Exact MA 2.5.1.1 OSC playback messages; never execute received commands. */
export function parsePauseFeedback(packet: Buffer,address: string,prefix: string): 'on' | 'off' | 'unknown' | null {
  if(packet.length>4096 || packet.length%4!==0)return null;
  let offset=0;
  const string=()=>{const end=packet.indexOf(0,offset);if(end<0)throw Error();const value=packet.toString('utf8',offset,end);const next=Math.ceil((end+1)/4)*4;if(next>packet.length || packet.subarray(end,next).some(v=>v!==0))throw Error();offset=next;return value;};
  try{
    if(string()!==`${prefix?`/${prefix}`:''}${address}` || string()!==',sis')return null;
    if(string()!=='Pause' || offset+4>packet.length)return null;
    const state=packet.readInt32BE(offset);offset+=4;string();
    if(offset!==packet.length)return null;
    return state===1?'on':state===0?'off':state===2?'unknown':null;
  }catch{return null;}
}
