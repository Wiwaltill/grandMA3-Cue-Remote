import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QuitController} from '../apps/desktop/src/quit-controller.ts';
function fixture() {
  const calls:string[]=[];let running=true;let answer=false;
  const controller=new QuitController({needsConfirmation:()=>running,confirm:async()=>{calls.push('confirm');return answer;},shutdown:async()=>{calls.push('disconnect');calls.push('stop');},quit:()=>{calls.push('quit');},onError:async()=>{calls.push('error');}});
  return {controller,calls,setRunning:(value:boolean)=>{running=value;},setAnswer:(value:boolean)=>{answer=value;}};
}
test('Cancel preserves the server and connection; later confirmed quit tears down once',async()=>{
  const f=fixture();await f.controller.request();assert.deepEqual(f.calls,['confirm']);assert.equal(f.controller.closing,false);assert.equal(f.controller.allowExit,false);
  f.setAnswer(true);await f.controller.request();assert.deepEqual(f.calls,['confirm','confirm','disconnect','stop','quit']);assert.equal(f.controller.allowExit,true);
  await f.controller.request();assert.equal(f.calls.length,5,'recursive app.quit must not ask or stop twice');
});
test('stopped server closes without a dialog but still disconnects and waits for shutdown',async()=>{
  const f=fixture();f.setRunning(false);await f.controller.request();assert.deepEqual(f.calls,['disconnect','stop','quit']);
});
test('simultaneous window close and Cmd+Q share one dialog and await completed teardown',async()=>{
  const calls:string[]=[];let answer!:(value:boolean)=>void;let stopped!:()=>void;
  const controller=new QuitController({needsConfirmation:()=>true,confirm:()=>{calls.push('confirm');return new Promise(resolve=>{answer=resolve;});},shutdown:()=>{calls.push('shutdown');return new Promise(resolve=>{stopped=resolve;});},quit:()=>{calls.push('quit');},onError:async()=>{calls.push('error');}});
  const close=controller.request(),quit=controller.request();assert.equal(close,quit);assert.deepEqual(calls,['confirm']);assert.equal(controller.closing,false);
  answer(true);await Promise.resolve();assert.deepEqual(calls,['confirm','shutdown']);assert.equal(controller.closing,true);assert.equal(controller.allowExit,false);
  assert.equal(controller.request(),close);stopped();await close;assert.deepEqual(calls,['confirm','shutdown','quit']);
});
test('failed dialog or shutdown does not exit and permits a new quit attempt',async()=>{
  for(const failure of ['confirm','shutdown']){
    let fail=true;let exits=0;let errors=0;
    const controller=new QuitController({needsConfirmation:()=>true,confirm:async()=>{if(fail && failure==='confirm')throw Error();return true;},shutdown:async()=>{if(fail && failure==='shutdown')throw Error();},quit:()=>{exits++;},onError:async()=>{errors++;}});
    await controller.request();assert.equal(exits,0);assert.equal(errors,1);assert.equal(controller.allowExit,false);assert.equal(controller.closing,false);
    fail=false;await controller.request();assert.equal(exits,1);
  }
});
