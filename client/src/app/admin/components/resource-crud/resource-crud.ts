import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../../core/api.service';
import {
  apiErrorMessage,
  Destination,
  FormValue,
  ResourceField,
  ResourceKey,
  ResourceRow,
} from '../../../core/models';

interface ResourceDefinition {
  title: string;
  idField: string;
  fields: ResourceField[];
}

@Component({
  selector: 'app-resource-crud',
  standalone: false,
  styleUrl: './resource-crud.css',
  templateUrl: './resource-crud.html',
})
export class ResourceCrud implements OnInit {
  @Input() resource: ResourceKey = 'destinos';

  readonly definitions: Record<ResourceKey, ResourceDefinition> = {
    destinos: {
      title: 'Destino',
      idField: 'id_destino',
      fields: [
        { key: 'cidade', label: 'Cidade', type: 'text', required: true },
        { key: 'estado', label: 'Estado', type: 'text' },
        { key: 'pais', label: 'País', type: 'text', required: true },
        { key: 'descricao', label: 'Descrição', type: 'textarea' },
      ],
    },
    pacotes: {
      title: 'Pacote',
      idField: 'id_pacote',
      fields: [
        { key: 'nome', label: 'Nome', type: 'text', required: true },
        { key: 'tipo', label: 'Tipo', type: 'text' },
        { key: 'descricao', label: 'Descrição', type: 'textarea' },
        { key: 'duracao_dias', label: 'Duração em dias', type: 'number', required: true },
        { key: 'preco', label: 'Preço integral', type: 'number', required: true },
        { key: 'id_destino', label: 'Destino', type: 'destination', required: true },
        { key: 'emoji', label: 'Emoji', type: 'text' },
        { key: 'cor_fundo', label: 'Cor de fundo', type: 'text' },
        { key: 'ativo', label: 'Ativo', type: 'boolean' },
      ],
    },
    guias: {
      title: 'Guia',
      idField: 'id_guia',
      fields: [
        { key: 'nome', label: 'Nome', type: 'text', required: true },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'telefone', label: 'Telefone', type: 'text' },
        { key: 'especialidade', label: 'Especialidade', type: 'text' },
        { key: 'curriculo', label: 'Currículo', type: 'textarea' },
        { key: 'valor_hora', label: 'Valor por hora', type: 'number' },
        { key: 'anos_experiencia', label: 'Anos de experiência', type: 'number' },
        { key: 'tag_status', label: 'Tag', type: 'text' },
        { key: 'status_aprovacao', label: 'Status', type: 'status' },
        { key: 'id_destino', label: 'Destino de atuação', type: 'destination' },
      ],
    },
    hoteis: {
      title: 'Hospedagem',
      idField: 'id_hospedagem',
      fields: [
        { key: 'nome', label: 'Nome', type: 'text', required: true },
        { key: 'endereco', label: 'Endereço', type: 'text' },
        { key: 'preco_diaria', label: 'Preço por diária', type: 'number', required: true },
        { key: 'avaliacao', label: 'Avaliação (0–5)', type: 'number' },
        { key: 'qtd_avaliacoes', label: 'Quantidade de avaliações', type: 'number' },
        { key: 'id_destino', label: 'Destino', type: 'destination', required: true },
      ],
    },
  };

  rows: ResourceRow[] = [];
  destinations: Destination[] = [];
  form: Record<string, FormValue> = {};
  editingId: number | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly api: ApiService, private readonly changeDetector: ChangeDetectorRef) {}

  get definition(): ResourceDefinition {
    return this.definitions[this.resource];
  }

  ngOnInit(): void {
    this.resetForm();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.resource(this.resource).subscribe({
      next: rows => {
        this.rows = rows;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, `Não foi possível carregar ${this.definition.title.toLowerCase()}s.`);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
    if (this.resource !== 'destinos') {
      this.api.destinations().subscribe({
        next: destinations => {
          this.destinations = destinations;
          this.changeDetector.markForCheck();
        },
        error: error => {
          this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar os destinos.');
          this.changeDetector.markForCheck();
        },
      });
    }
  }

  edit(row: ResourceRow): void {
    this.editingId = Number(row[this.definition.idField]);
    this.form = {};
    for (const field of this.definition.fields) {
      const value = row[field.key];
      this.form[field.key] = field.type === 'boolean'
        ? value === true || value === 1
        : this.toFormValue(value);
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const data: ResourceRow = {};
    for (const field of this.definition.fields) {
      data[field.key] = this.form[field.key] ?? null;
    }
    const request = this.editingId === null
      ? this.api.createResource(this.resource, data)
      : this.api.updateResource(this.resource, this.editingId, data);
    request.subscribe({
      next: () => {
        this.successMessage = `${this.definition.title} salvo com sucesso.`;
        this.resetForm();
        this.load();
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, `Não foi possível salvar ${this.definition.title.toLowerCase()}.`);
        this.changeDetector.markForCheck();
      },
    });
  }

  remove(row: ResourceRow): void {
    const id = Number(row[this.definition.idField]);
    const name = String(row['nome'] || row['cidade'] || this.definition.title);
    if (!window.confirm(`Deseja excluir "${name}"?`)) return;
    this.api.deleteResource(this.resource, id).subscribe({
      next: () => {
        this.successMessage = `${this.definition.title} removido.`;
        this.load();
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, `Não foi possível excluir ${this.definition.title.toLowerCase()}.`);
        this.changeDetector.markForCheck();
      },
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  valueOf(row: ResourceRow, key: string): string {
    const value = row[key];
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return value === null || value === undefined ? '—' : String(value);
  }

  private resetForm(): void {
    this.editingId = null;
    this.form = {};
    for (const field of this.definition.fields) {
      this.form[field.key] = field.type === 'boolean'
        ? true
        : field.type === 'number'
          ? null
          : field.type === 'status'
            ? 'pendente'
            : '';
    }
    this.errorMessage = '';
  }

  private toFormValue(value: unknown): FormValue {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value);
  }
}
