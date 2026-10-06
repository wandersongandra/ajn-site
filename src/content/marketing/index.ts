import { laudosSegurancaDoTrabalho } from './laudos-seguranca-do-trabalho';
import { marketingDetailPage } from './emissao-laudos';
import { projetoSegurancaIncendioPanico } from './projeto-seguranca-incendio-panico';
import { sistemasIncendioBh } from './sistemas-incendio-bh';

export const marketingPages = [
	marketingDetailPage,
	projetoSegurancaIncendioPanico,
	laudosSegurancaDoTrabalho,
	sistemasIncendioBh,
] as const;
