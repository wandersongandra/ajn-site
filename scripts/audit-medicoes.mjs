// Regressão da nova frente de medições ambientais ocupacionais.
// Executar após astro build, usando apenas artefatos estáticos publicados.
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
const issues=[];
const check=(ok,message)=>{if(!ok)issues.push(message)};
const read=(path)=>readFile(path,'utf8');
const slug='medicoes-ambientais-ocupacionais';
const [landing,home,services,blog,menu,source]=await Promise.all([
  read('dist/'+slug+'/index.html'),read('dist/index.html'),read('dist/servicos/index.html'),
  read('dist/blog/index.html'),read('src/data/home.ts'),read('src/pages/'+slug+'.astro')
]);
check((landing.match(/<h1\b/g)||[]).length===1,'Medições: precisa ter um H1.');
const origin=process.env.PUBLIC_SITE_ORIGIN?.replace(/\/+$/,'')||'https://ajnengenharia.com.br';
check(landing.includes('rel="canonical" href="'+origin+'/'+slug+'/\"'), 'Medições: canonical incorreta.');
check(landing.includes('name="description"')&&landing.includes('Medições Ambientais Ocupacionais'),'Medições: SEO incompleto.');
for(const word of ['NHO 01','NHO 06','NHO 11','NR-15','NR-17','IBUTG','iluminamento','LTCAT','PGR','relatório'])check(landing.includes(word),'Medições: falta contexto '+word);
check(landing.includes('application/ld+json')&&landing.includes('\"@type\":\"Service\"'),'Medições: Schema Service ausente.');
check(landing.includes('wa.me/5531984734644')&&landing.includes('href="/contato"'),'Medições: falta orçamento/contato.');
check(landing.includes('Imagem ilustrativa criada digitalmente'),'Medições: imagens digitais sem aviso visível.');
check(!/acreditad[ao]|certificad[ao]|garantia de insalubridade/i.test(source),'Medições: alegação técnica não fundamentada.');
check(home.includes('id="ajn-measure-home-title"') && home.includes('href="/'+slug+'"'),'Medições: destaque da Home ausente.');
check(services.includes('href="/'+slug+'"'),'Medições: serviço ausente do catálogo.');
check(menu.includes("href: '/"+slug+"'"),'Medições: serviço ausente do menu.');
check(services.includes('14 serviços'),'Medições: contador do catálogo não foi atualizado.');
const articles=[
 'medicao-de-ruido-ocupacional-dosimetria-e-planejamento',
 'avaliacao-de-calor-ocupacional-ibutg-e-atividade',
 'avaliacao-de-iluminamento-posto-de-trabalho-nho-11'
];
for(const slug of articles){
 const html=await read('dist/blog/'+slug+'/index.html');
 check(blog.includes('href="/blog/'+slug+'"'),'Blog: artigo novo ausente do índice: '+slug);
 check((html.match(/<h1\b/g)||[]).length===1,'Blog: H1 inválido em '+slug);
 check(html.includes('href="/medicoes-ambientais-ocupacionais"'),'Blog: link ao serviço ausente em '+slug);
 check(html.includes('Imagem ilustrativa criada digitalmente'),'Blog: aviso de mídia sintética ausente em '+slug);
}
const files=[
 'hero-medicoes-ocupacionais.webp','medicao-ruido-dosimetria.webp','medicao-calor-ibutg.webp',
 'medicao-iluminamento.webp','avaliacao-agentes-aereos.webp','medicoes-catalogo.webp'
];
let size=0;
for(const file of files){
 const p=join('dist','images','medicoes',file);
 const b=await readFile(p);size+=b.length;
 check(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','Medições: arquivo de mídia inválido '+file);
}
check(size<400*1024,'Medições: orçamento da mídia excedido '+size+' bytes.');
if(issues.length){issues.forEach(m=>console.error('[medicoes][FAIL]',m));process.exitCode=1}
else console.log('[medicoes] PASS: página, 14 serviços, 3 posts, schema, aviso de imagem e '+Math.round(size/1024)+' KiB de mídia.');
