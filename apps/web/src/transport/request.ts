// XMLHttpRequest is available on Safari 10; timeout does not depend on AbortSignal.
// Exactly one request per call, including commands. A timeout never triggers a retry.
export function requestJson<T>(path: string,body?: unknown,createRequest:()=>XMLHttpRequest=()=>new XMLHttpRequest()): Promise<T> {
  return new Promise((resolve,reject)=>{
    const request=createRequest();
    request.open(body===undefined?'GET':'POST',path,true);
    request.timeout=2500;
    if(body!==undefined){
      request.setRequestHeader('Content-Type','application/json');
      request.setRequestHeader('X-Cue-Remote','1');
    }
    request.onload=()=>{
      if(request.status<200 || request.status>=300){reject(new Error('Request rejected'));return;}
      try{resolve(JSON.parse(request.responseText) as T);}catch{reject(new Error('Invalid response'));}
    };
    request.onerror=()=>reject(new Error('Network error'));
    request.ontimeout=()=>reject(new Error('Request timed out'));
    request.onabort=()=>reject(new Error('Request aborted'));
    // Same-origin XHR sends the HttpOnly session cookie automatically.
    request.send(body===undefined?null:JSON.stringify(body));
  });
}
