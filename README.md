# GuiaJa

Projeto acadêmico de turismo com catálogo de pacotes, guias e hospedagens, cadastro/login e reservas com voucher. O backend usa Node.js, Express e MySQL.

## Integrantes

Preencher com os dados oficiais do grupo antes da entrega:

| Integrante | RA |
|---|---|
| Andrew Mendes | 272551 |
| Luis Fernando Torquato | 272454 |
| Caio Alvim Batista | 272456 |

## Executar localmente

1. Use Node.js 20.19 ou superior e MySQL 5.7/8.
2. Para um banco novo, importe [`banco/guiaja_banco.sql`](./banco/guiaja_banco.sql) no MySQL Workbench. **Esse script remove e recria o banco `guiaja`.** Se já tem dados, não rode esse script: execute as migrações incrementais `001_acessos_historico.sql`, `002_email_notifications.sql`, `003_randomize_guide_destinations.sql`, `004_package_discount.sql`, `005_flight_city_options.sql` e `006_reservation_purchase_time.sql`, cada uma uma única vez.
3. Copie `.env.example` para `.env` e informe a conexão. Não publique o `.env`.
4. Execute `npm install` na raiz e `npm install --prefix client` para instalar as dependências do Angular.
5. Execute `npm test` e `npm start`. O comando inicial compila o front Angular e serve a aplicação em `http://localhost:3000`.
6. Acesse <http://localhost:3000>.

Para desenvolver o front com recarga automática, mantenha o backend ativo (`node server.js`) e, em outro terminal, execute `npm --prefix client start`; a aplicação Angular estará em `http://localhost:4200` e o proxy encaminhará `/api` ao backend local.

## Aplicação Angular

A interface principal está em `client/` e usa Angular com `NgModules` (`standalone: false`), roteamento e Angular Material. O build é client-side, sem SSR/SSG. A navegação disponibiliza pacotes, voos avulsos, hospedagens, guias, cadastro/login e compras. É possível reservar hotel avulso, sem pacote, escolhendo check-in e número de noites. Usuários autenticados podem enviar mensagens aos guias; os avisos por e-mail dependem da configuração SMTP. Após qualquer compra, a tela de compras exibe a confirmação e o voucher. Reservas exigem autenticação e os valores são recalculados pelo servidor.

Clientes podem consultar, alterar a data de pacote e cancelar suas compras em `/minhas-compras`. O perfil administrador acessa `/admin`, com KPIs de compras, faturamento, acessos e clientes; consulta de compradores, acessos, candidaturas e notificações; e CRUD de destinos, pacotes, guias e hospedagens.

Contas de demonstração criadas pelo script SQL:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `ana@email.com` | `Senha@123` |
| Administrador | `admin@guiaja.com` | `Admin@1234` |

Essas credenciais são somente dados locais de demonstração. Altere-as em qualquer ambiente compartilhado.

## Arquitetura

- `controllers/`: adaptação HTTP e respostas.
- `services/`: validações, autorização e regras de negócio.
- `repositories/`: consultas parametrizadas e persistência MySQL.
- `models/`: validação de entrada e definição dos recursos.
- `middleware/`: autenticação HTTP Basic, autorização por perfil e tratamento centralizado de erros.

O preço e o voucher da reserva são calculados no servidor. Pacotes recebem 5% de desconto sobre seu preço-base, com ou sem guia; hospedagem e guia são cobrados integralmente. Voos avulsos usam o preço cadastrado no banco e não recebem o desconto de pacote. A identidade do cliente também é obtida da autenticação; o servidor ignora identificadores de usuário informados no corpo da requisição.

## Autenticação e perfis

`POST /api/login` recebe e-mail/senha e responde com um valor HTTP Basic no campo `authorization`. O cliente o envia no cabeçalho `Authorization` nas rotas protegidas. Reservas e mensagens exigem autenticação; operações em `/api/admin` exigem perfil `admin`. Falta de autenticação retorna `401` e perfil sem permissão retorna `403`.

HTTP Basic apenas codifica as credenciais em Base64, não as cifra. Use HTTPS fora do ambiente local. Novas senhas são armazenadas com scrypt; hashes SHA-256 dos registros de demonstração são atualizados automaticamente para scrypt após um login bem-sucedido.

## Painel, compras e acessos

Entre com a conta de administrador e abra `http://localhost:3000/admin` (também há um link “Admin” no cabeçalho). O painel apresenta:

- total de compras/reservas, confirmadas, pendentes, canceladas, faturamento confirmado e clientes;
- compras por mês e pacotes mais reservados;
- reservas com seleção de guia, incluindo “Sem guia”; mudanças ficam registradas no histórico administrativo;
- acessos recentes ao site/API, com data, usuário conhecido, método, caminho e status HTTP, além do resumo diário.

O preço de uma reserva é o preço registrado na compra e não muda quando o administrador troca/remove o guia depois. Reservas sem guia podem ser criadas desde a página de detalhes do pacote; nesse caso, o cálculo não adiciona valor de guia.

O banco armazena acessos em `acesso_site` e alterações de guia em `historico_reserva`; as views `vw_compras_por_mes` e `vw_acessos_por_dia` permitem consultar os relatórios diretamente no MySQL. Os acessos não guardam IP nem query string. Para limitar retenção ou remover dados, administre essas tabelas de acordo com a política de privacidade do projeto.

As localizações dos guias de demonstração são sorteadas entre destinos cadastrados uma vez e persistidas no banco; elas não mudam a cada acesso ao site.

O painel também lista o nome e e-mail dos compradores, as candidaturas com os dados enviados e o status de cada notificação. As vendas e candidaturas criam mensagens na tabela `email_outbox`; elas são preservadas e processadas pelo servidor quando SMTP estiver configurado. O usuário de demonstração `admin@guiaja.com` é uma conta de login do sistema, não uma caixa de e-mail.

### Configurar e-mail do administrador

Para encaminhar compras e candidaturas a uma caixa real, configure no `.env` o endereço `ADMIN_EMAIL` e as variáveis SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`). `SMTP_FROM` é opcional. Use as credenciais de SMTP/app-password fornecidas pelo seu serviço de e-mail; não compartilhe nem publique o `.env`. Reinicie `npm start` depois da configuração. O worker tenta enviar mensagens pendentes, registra falhas e repete até cinco tentativas. Sem SMTP, as candidaturas e notificações continuam gravadas no banco e aparecem no painel como pendentes.

## Endpoints

Todas as respostas de erro usam JSON no formato `{"erro":"mensagem"}`. IDs são inteiros positivos.

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/cadastro` | Público | Cadastra cliente; senha com pelo menos 8 caracteres. |
| `POST` | `/api/login` | Público | Valida credenciais e retorna autorização Basic. |
| `GET` | `/api/perfil` | Cliente/admin | Consulta os dados da conta autenticada. |
| `PUT` | `/api/perfil` | Cliente/admin | Atualiza nome e telefone; o e-mail de login permanece somente leitura. |
| `GET` | `/api/pacotes` | Público | Lista pacotes ativos. |
| `GET` | `/api/pacotes/:id` | Público | Detalha pacote e roteiro. |
| `GET` | `/api/guias` | Público | Lista guias aprovados. |
| `GET` | `/api/hoteis` | Público | Lista hospedagens. |
| `GET` | `/api/voos` | Público | Lista passagens futuras para compra avulsa. |
| `POST` | `/api/reservas` | Cliente/admin | Cria reserva de pacote, voo ou hospedagem avulsa e calcula valor/voucher no servidor. |
| `GET` | `/api/reservas` | Cliente/admin | Lista as próprias reservas; admin lista todas. |
| `GET` | `/api/reservas/:id` | Dono/admin | Consulta detalhes completos da compra; outro cliente não consegue acessar. |
| `PUT` | `/api/reservas/:id` | Dono/admin | Altera `dataIda` de reserva não cancelada; passagens aéreas mantêm a data do voo selecionado. |
| `DELETE` | `/api/reservas/:id` | Dono/admin | Cancela reserva sem apagar o histórico. |
| `POST` | `/api/mensagens` | Cliente/admin | Registra mensagem para guia aprovado e enfileira aviso por e-mail quando SMTP estiver configurado. |
| `POST` | `/api/contato` | Público | Envia formulário de contato. |
| `POST` | `/api/guias/candidatura` | Público | Envia candidatura de guia. |
| `GET` | `/api/admin/:recurso` | Admin | Lista registros de `pacotes`, `guias`, `hoteis` ou `destinos`. |
| `POST` | `/api/admin/:recurso` | Admin | Cria registro (campos permitidos dependem do recurso). |
| `PUT`, `PATCH` | `/api/admin/:recurso/:id` | Admin | Atualiza os campos enviados. |
| `DELETE` | `/api/admin/:recurso/:id` | Admin | Remove registro; pacotes são desativados e guias rejeitados para preservar histórico. |
| `GET` | `/api/admin/dashboard` | Admin | Indicadores e relatórios mensais de compras, pacotes e acessos diários. |
| `GET` | `/api/admin/accesses?page=1&limit=25` | Admin | Lista acessos registrados (limite máximo 100 por página). |
| `PATCH` | `/api/admin/reservas/:id/guia` | Admin | Associa guia aprovado ou remove a associação com `{"idGuia":null}`. |
| `GET` | `/api/admin/historico-reservas` | Admin | Lista as últimas 50 alterações de guia. |
| `GET` | `/api/admin/candidaturas` | Admin | Lista dados completos de candidatura e status do e-mail. |
| `GET` | `/api/admin/notificacoes-email` | Admin | Consulta fila, destinatário, tentativas e falhas de e-mail. |

Para criar uma reserva de pacote, envie `tipo: "pacote"`, `idPacote`, `dataIda` (`AAAA-MM-DD`), `idGuia` opcional/nulo e `idHospedagem` opcional. O desconto de 5% é aplicado automaticamente somente ao preço do pacote e aparece no recibo. Para comprar voo avulso, envie `tipo: "voo"` e `idPassagem` (a data e o preço são carregados do cadastro do voo). Para hotel avulso, envie `tipo: "hotel"`, `idHospedagem`, `dataIda` e `noites` de 1 a 30. Não envie `idUsuario`: ele é determinado pelo HTTP Basic. A atualização de reserva recebe `{"dataIda":"2030-01-15"}`.

Clientes autenticados acessam `/minhas-compras` pelo link no cabeçalho. A página apresenta voucher, data e hora da compra (horário de Brasília), datas da viagem, valor, pacote, desconto, roteiro, guia, hospedagem ou trecho aéreo. Compras antigas sem horário armazenado são identificadas como tal. A data de uma passagem aérea é fixa; a compra pode ser cancelada. A compra cancelada continua visível para consulta; seu voucher e histórico não são apagados.

`/api/admin/pacotes` aceita `nome`, `tipo`, `descricao`, `duracao_dias`, `preco`, `ativo`, `emoji`, `cor_fundo`, `id_destino`; `/guias` aceita campos de perfil e aprovação; `/hoteis` aceita nome/endereço/preço/avaliação/destino; `/destinos` aceita cidade/estado/país/descrição. Campos desconhecidos são rejeitados.

## Testes Postman

Importe [`postman/GuiaJa.postman_collection.json`](./postman/GuiaJa.postman_collection.json) no Postman. A coleção verifica login, requisições públicas, resposta `401` sem autenticação, `403` para cliente nas rotas de administração e acesso administrativo. Execute o login cliente para as requisições autenticadas de reservas, perfil e mensagens; no grupo “Administração”, execute primeiro o login administrador. O script de cada login guarda o cabeçalho Basic em variável da coleção. A data da reserva é gerada automaticamente. Para o fluxo local, configure `baseUrl` como `http://localhost:3000`; as contas de demonstração estão descritas acima.

## Modelagem

O diagrama entidade-relacionamento está em [`docs/diagrama-er.md`](./docs/diagrama-er.md). O script SQL contém as tabelas, chaves estrangeiras, dados de demonstração e views.
