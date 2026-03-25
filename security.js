/* ═══════════════════════════════════════════════════════════
   SISPPe — Módulo de Segurança v3.0
   COMEP Pereiro/CE · 2026
   ═══════════════════════════════════════════════════════════ */
'use strict';
const SEC=(()=>{
function validarCPF(cpf){if(!cpf)return false;cpf=cpf.replace(/\D/g,'');if(cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return false;for(let t=9;t<11;t++){let d=0;for(let c=0;c<t;c++)d+=parseInt(cpf.charAt(c))*(t+1-c);d=((10*d)%11)%10;if(parseInt(cpf.charAt(t))!==d)return false;}return true;}
function mascararCPF(cpf){if(!cpf)return'***.***.***-**';const c=cpf.replace(/\D/g,'');if(c.length!==11)return'***.***.***-**';return'***.'+c.substring(3,6)+'.***-'+c.substring(9);}
function formatarCPF(cpf){if(!cpf)return'';const c=cpf.replace(/\D/g,'');if(c.length!==11)return cpf;return c.substring(0,3)+'.'+c.substring(3,6)+'.'+c.substring(6,9)+'-'+c.substring(9);}
function validarCNPJ(cnpj){if(!cnpj)return false;cnpj=cnpj.replace(/\D/g,'');if(cnpj.length!==14||/^(\d)\1{13}$/.test(cnpj))return false;let t=cnpj.length-2,n=cnpj.substring(0,t),d=cnpj.substring(t),s=0,p=t-7;for(let i=t;i>=1;i--){s+=n.charAt(t-i)*p--;if(p<2)p=9;}let r=s%11<2?0:11-s%11;if(r!==parseInt(d.charAt(0)))return false;t++;n=cnpj.substring(0,t);s=0;p=t-7;for(let i=t;i>=1;i--){s+=n.charAt(t-i)*p--;if(p<2)p=9;}r=s%11<2?0:11-s%11;return r===parseInt(d.charAt(1));}
function validarINEP(inep){return inep&&/^\d{8}$/.test(inep.replace(/\D/g,''));}
const INEP_FIX={'23238483':'23138483'};
function corrigirINEP(inep){if(!inep)return inep;const c=inep.replace(/\D/g,'');return INEP_FIX[c]||c;}
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const MAGIC={'application/pdf':[0x25,0x50,0x44,0x46],'image/jpeg':[0xFF,0xD8,0xFF],'image/png':[0x89,0x50,0x4E,0x47]};
async function validarArquivo(file){const erros=[];if(!file)return{ok:false,erros:['Nenhum arquivo.']};if(file.size>5*1024*1024)erros.push('Excede 5 MB.');if(file.size===0)erros.push('Arquivo vazio.');const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','jpg','jpeg','png'].includes(ext))erros.push('Use PDF, JPG ou PNG.');try{const buf=await file.slice(0,8).arrayBuffer();const bytes=new Uint8Array(buf);let real=null;for(const[mime,magic]of Object.entries(MAGIC)){if(magic.every((b,i)=>bytes[i]===b)){real=mime;break;}}if(!real)erros.push('Conteúdo não é PDF/JPG/PNG válido.');}catch(e){erros.push('Erro ao verificar.');}return{ok:erros.length===0,erros};}
function validarSenha(pw){const e=[];if(pw.length<8)e.push('Mín. 8 chars.');if(!/[A-Z]/.test(pw))e.push('1 maiúscula.');if(!/[0-9]/.test(pw))e.push('1 número.');return{ok:e.length===0,erros:e};}
function protegerConsole(){if(location.hostname!=='localhost'&&location.hostname!=='127.0.0.1'){['log','debug','info','table','dir','trace'].forEach(m=>{console[m]=()=>{};});}}
function bloquearIframe(){if(window.self!==window.top){document.body.innerHTML='<h1 style="padding:40px;color:red">Acesso bloqueado.</h1>';throw new Error('Iframe blocked');}}
return{validarCPF,mascararCPF,formatarCPF,validarCNPJ,validarINEP,corrigirINEP,esc,validarArquivo,validarSenha,protegerConsole,bloquearIframe,INEP_FIX};
})();
if(typeof window!=='undefined'){SEC.bloquearIframe();SEC.protegerConsole();}
