/* SISPPe Security Module v3.0 — COMEP Pereiro/CE · 2026 */
'use strict';
const SEC=(()=>{
function validarCPF(c){if(!c)return false;c=c.replace(/\D/g,'');if(c.length!==11||/^(\d)\1{10}$/.test(c))return false;for(let t=9;t<11;t++){let d=0;for(let i=0;i<t;i++)d+=parseInt(c.charAt(i))*(t+1-i);d=((10*d)%11)%10;if(parseInt(c.charAt(t))!==d)return false;}return true;}
function mascararCPF(c){if(!c)return'***.***.***-**';c=c.replace(/\D/g,'');if(c.length!==11)return'***.***.***-**';return'***.'+c.substring(3,6)+'.***-'+c.substring(9);}
function formatarCPF(c){if(!c)return'';c=c.replace(/\D/g,'');if(c.length!==11)return c;return c.substring(0,3)+'.'+c.substring(3,6)+'.'+c.substring(6,9)+'-'+c.substring(9);}
function validarCNPJ(v){if(!v)return false;v=v.replace(/\D/g,'');if(v.length!==14||/^(\d)\1{13}$/.test(v))return false;let t=v.length-2,n=v.substring(0,t),d=v.substring(t),s=0,p=t-7;for(let i=t;i>=1;i--){s+=n.charAt(t-i)*p--;if(p<2)p=9;}let r=s%11<2?0:11-s%11;if(r!==parseInt(d.charAt(0)))return false;t++;n=v.substring(0,t);s=0;p=t-7;for(let i=t;i>=1;i--){s+=n.charAt(t-i)*p--;if(p<2)p=9;}r=s%11<2?0:11-s%11;return r===parseInt(d.charAt(1));}
function validarINEP(v){return v&&/^\d{8}$/.test(v.replace(/\D/g,''));}
const INEP_FIX={'23238483':'23138483'};
function corrigirINEP(v){if(!v)return v;const c=v.replace(/\D/g,'');return INEP_FIX[c]||c;}
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const MAGIC={'application/pdf':[0x25,0x50,0x44,0x46],'image/jpeg':[0xFF,0xD8,0xFF],'image/png':[0x89,0x50,0x4E,0x47]};
async function validarArquivo(f){const e=[];if(!f)return{ok:false,erros:['Nenhum arquivo.']};if(f.size>5242880)e.push('Excede 5 MB.');if(f.size===0)e.push('Vazio.');const x=f.name.split('.').pop().toLowerCase();if(!['pdf','jpg','jpeg','png'].includes(x))e.push('Use PDF, JPG ou PNG.');try{const b=new Uint8Array(await f.slice(0,8).arrayBuffer());let r=null;for(const[m,mg]of Object.entries(MAGIC))if(mg.every((v,i)=>b[i]===v)){r=m;break;}if(!r)e.push('Conteúdo inválido.');}catch(ex){e.push('Erro ao verificar.');}return{ok:e.length===0,erros:e};}
function protegerConsole(){if(location.hostname!=='localhost'&&location.hostname!=='127.0.0.1')['log','debug','info','table','dir','trace'].forEach(m=>{console[m]=()=>{};});}
function bloquearIframe(){if(window.self!==window.top){document.body.innerHTML='<h1 style="padding:40px;color:red">Bloqueado.</h1>';throw new Error('iframe');}}
return{validarCPF,mascararCPF,formatarCPF,validarCNPJ,validarINEP,corrigirINEP,esc,validarArquivo,protegerConsole,bloquearIframe,INEP_FIX};
})();
if(typeof window!=='undefined'){SEC.bloquearIframe();SEC.protegerConsole();}
