import { isIP } from 'node:net';
import { parseSequenceNumber } from '../../../packages/shared/sequence.ts';
import type { OscConfig } from '../../../packages/shared/live.js';
export function isOscConfig(value: unknown): value is OscConfig {
  if (!value || typeof value !== 'object') return false;
  const c=value as OscConfig;
  const unicast=(ip: unknown) => typeof ip==='string' && isIP(ip)===4 && !ip.startsWith('0.') && Number(ip.split('.')[0])<224 && !ip.endsWith('.255');
  return unicast(c.host) && unicast(c.replyHost) && Number.isInteger(c.port) && c.port>=1024 && c.port<=65535 && typeof c.prefix==='string' && /^[a-zA-Z0-9_-]{0,32}$/.test(c.prefix) && typeof c.dataPool==='string' && parseSequenceNumber(c.dataPool)===c.dataPool && typeof c.sequenceNumber==='string' && parseSequenceNumber(c.sequenceNumber)===c.sequenceNumber;
}
export function encodeOscCommand(prefix: string, command: string): Buffer {
  const string=(value: string) => {const data=Buffer.from(value,'utf8');const padded=Buffer.alloc(Math.ceil((data.length+1)/4)*4);data.copy(padded);return padded;};
  return Buffer.concat([string(prefix?`/${prefix}/cmd`:'/cmd'),string(',s'),string(command)]);
}
export function playbackCommand(config: OscConfig,action: 'goPlus' | 'goMinus' | 'pause'): string {
  if (!isOscConfig(config) || !['goPlus','goMinus','pause'].includes(action)) throw new Error('Invalid command');
  return `${action==='goPlus'?'Go+':action==='goMinus'?'Go-':'Pause'} DataPool ${config.dataPool} Sequence ${config.sequenceNumber}`;
}
// All interpolated values are validated numbers, hex nonces, or IPv4 literals. Never accept caller Lua.
// socket/json and these object properties were verified against installed MA 2.5.1.1 resources and a read-only round trip.
export function snapshotQuery(config: OscConfig,port: number,nonce: string): string {
  if (!isOscConfig(config) || !Number.isInteger(port) || port<1 || port>65535 || !/^[a-f0-9]{32}$/.test(nonce)) throw new Error('Invalid query');
  const lua=`local u=require('socket').udp();local ok,t=pcall(function() local q=ObjectList('DataPool ${config.dataPool} Sequence ${config.sequenceNumber}')[1];if not q then error('sequence-missing') end;local cs={};for _,c in ipairs(q:Children()) do local n=tostring((c:Get('No',Enums.Roles.Display))):match('^%s*(%d+%.?%d*)%s*$');if n and tonumber(n)>0 then local v={number=n,name=c.name,trigger=tostring((c:Get('TrigType',Enums.Roles.Display))),triggerTime=tonumber(c.TrigTime)};local complete=true;for _,p in ipairs(c:Children()) do for _,k in ipairs({'CueInFade','CueInDelay','IndivFade','IndivDelay','Duration'}) do local key=({CueInFade='fade',CueInDelay='delay',IndivFade='individualFade',IndivDelay='individualDelay',Duration='duration'})[k];local x=tonumber(p[k]);if k=='Duration' and (not x or x<0) then complete=false end;if x and x>=0 then v[key]=math.max(v[key] or 0,x) end end end;if not complete then v.duration=nil end;cs[#cs+1]=v end end;return {nonce='${nonce}',dataPool='${config.dataPool}',number='${config.sequenceNumber}',version=Version(),name=q.name,running=q:IsRunningPlayback(),current=tostring((q:Get('CueNo'))),cues=cs} end);local j=require('json');if not ok then t={nonce='${nonce}',error=tostring(t)} end;u:sendto(j.encode(t),'${config.replyHost}',${port});u:close()`;
  return `Lua "${lua}"`;
}

// Pause gets an execution acknowledgement from MA's documented synchronous Cmd function.
export function pauseRequest(config: OscConfig,port: number,nonce: string,paused=true): string {
  if(!isOscConfig(config) || !Number.isInteger(port) || port<1 || port>65535 || !/^[a-f0-9]{32}$/.test(nonce))throw new Error('Invalid pause request');
  if(typeof paused!=='boolean')throw new Error('Invalid pause state');
  return `Lua "local r=Cmd('Pause ${paused?'On':'Off'} DataPool ${config.dataPool} Sequence ${config.sequenceNumber}');local u=require('socket').udp();u:sendto(require('json').encode({ackNonce='${nonce}',result=tostring(r)}),'${config.replyHost}',${port});u:close()"`;
}
