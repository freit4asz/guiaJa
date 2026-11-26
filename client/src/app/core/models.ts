import { HttpErrorResponse } from '@angular/common/http';

export interface AppUser {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'cliente';
  authorization: string;
  telefone?: string | null;
}

export interface AccountProfile {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: 'admin' | 'cliente';
  dataCadastro: string;
}

export interface TravelPackage {
  id: number;
  idDestino?: number;
  nome: string;
  tipo: string;
  desc?: string;
  descricao?: string;
  dias: number;
  preco: number;
  precoOriginal: number;
  desconto: number;
  descontoPercentual: number;
  emoji?: string;
  cor?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  roteiro?: string[];
}

export interface Guide {
  id: number;
  nome: string;
  nota: number;
  avaliacoes: number;
  valorHora: number;
  exp: number;
  tag?: string;
  idiomas: string[];
  local?: string;
}

export interface Hotel {
  id: number;
  idDestino: number;
  nome: string;
  local: string;
  nota: number;
  aval: number;
  diaria: number;
  endereco?: string;
}

export interface Destination {
  id_destino: number;
  cidade: string;
  estado?: string;
  pais: string;
  descricao?: string;
}

export interface Flight {
  id: number;
  origem: string;
  destino: string;
  dataVoo: string;
  preco: number;
}

export interface Reservation {
  id: number;
  codigo: string;
  dataCompra: string;
  dataHoraCompra: string | null;
  dataIda: string;
  total: number;
  valorPacoteOriginal: number;
  valorDesconto: number;
  status: string;
  idPassagem: number | null;
  idGuia?: number | null;
  tipoCompra: 'voo' | 'pacote' | 'hotel';
  pacote: string | null;
  tipoPacote: string | null;
  duracaoDias: number | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  guia: string | null;
  cidadeGuia: string | null;
  estadoGuia: string | null;
  paisGuia: string | null;
  hospedagem: string | null;
  roteiro: string[];
  origemVoo: string | null;
  destinoVoo: string | null;
  cliente?: string;
  emailCliente?: string;
}

export interface SiteAccess {
  id: number;
  metodo: string;
  caminho: string;
  status: number;
  data: string;
  usuario: string | null;
  email: string | null;
}

export interface GuideApplication {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  curriculo: string;
  status: string;
  dataCandidatura: string;
  statusEmail: string;
  tentativasEmail: number;
}

export interface EmailNotification {
  id: number;
  destinatario: string;
  assunto: string;
  status: string;
  tentativas: number;
  erro: string | null;
  data: string;
  dataEnvio: string | null;
  voucher: string | null;
  candidato: string | null;
}

export interface CreatedReservation {
  id: number;
  codigo: string;
  total: number;
  discount: number;
  dataHoraCompra: string;
}

export interface DashboardData {
  totals: {
    compras: number;
    confirmadas: number;
    pendentes: number;
    canceladas: number;
    faturamento: number;
    clientes: number;
    acessos: number;
  };
  purchasesByMonth: Array<Record<string, string | number>>;
  topPackages: Array<{ pacote: string; total_reservas: number; valor_total: number }>;
  accessesByDay: Array<Record<string, string | number>>;
  emailConfigured: boolean;
}

export type ResourceKey = 'destinos' | 'pacotes' | 'guias' | 'hoteis';
export type FormValue = string | number | boolean | null;

export interface ResourceField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'destination' | 'status' | 'boolean';
  required?: boolean;
}

export type ResourceRow = Record<string, unknown>;

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { erro?: unknown; message?: unknown } | null;
    if (typeof body?.erro === 'string') return body.erro;
    if (typeof body?.message === 'string') return body.message;
  }
  return fallback;
}
