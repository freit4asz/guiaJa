# Diagrama entidade-relacionamento

```mermaid
erDiagram
    DESTINO ||--o{ GUIA : localiza
    DESTINO ||--o{ HOSPEDAGEM : oferece
    DESTINO ||--o{ PACOTE : recebe
    PACOTE ||--o{ ROTEIRO_PACOTE : organiza
    GUIA ||--o{ GUIA_IDIOMA : fala
    IDIOMA ||--o{ GUIA_IDIOMA : compoe
    USUARIO ||--o{ RESERVA : realiza
    PACOTE o|--o{ RESERVA : inclui
    GUIA o|--o{ RESERVA : acompanha
    HOSPEDAGEM o|--o{ RESERVA : inclui
    PASSAGEM o|--o{ RESERVA : inclui
    RESERVA ||--o{ PAGAMENTO : recebe
    USUARIO ||--o{ AVALIACAO : publica
    GUIA o|--o{ AVALIACAO : recebe
    HOSPEDAGEM o|--o{ AVALIACAO : recebe
    USUARIO ||--o{ NOTIFICACAO : recebe
    USUARIO ||--o{ MENSAGEM_GUIA : envia
    GUIA ||--o{ MENSAGEM_GUIA : recebe

    DESTINO {
        int id_destino PK
        string cidade
        string estado
        string pais
        text descricao
    }
    USUARIO {
        int id_usuario PK
        string nome
        string email UK
        string telefone
        string senha
        enum tipo
        boolean bloqueado
    }
    GUIA {
        int id_guia PK
        string nome
        string email
        decimal valor_hora
        enum status_aprovacao
        int id_destino FK
    }
    IDIOMA {
        int id_idioma PK
        string nome UK
    }
    GUIA_IDIOMA {
        int id_guia PK, FK
        int id_idioma PK, FK
    }
    HOSPEDAGEM {
        int id_hospedagem PK
        string nome
        decimal preco_diaria
        int id_destino FK
    }
    PACOTE {
        int id_pacote PK
        string nome
        int duracao_dias
        decimal preco
        boolean ativo
        int id_destino FK
    }
    ROTEIRO_PACOTE {
        int id_roteiro PK
        int id_pacote FK
        int dia
        string descricao
    }
    PASSAGEM {
        int id_passagem PK
        string origem
        string destino_voo
        date data_voo
        decimal preco
    }
    RESERVA {
        int id_reserva PK
        string codigo_voucher UK
        date data_ida
        decimal valor_total
        string status_reserva
        int id_usuario FK
        int id_pacote FK
        int id_guia FK
        int id_hospedagem FK
        int id_passagem FK
    }
    PAGAMENTO {
        int id_pagamento PK
        decimal valor
        string status_pagamento
        int id_reserva FK
    }
    AVALIACAO {
        int id_avaliacao PK
        int nota
        int id_usuario FK
        int id_guia FK
        int id_hospedagem FK
    }
    NOTIFICACAO {
        int id_notificacao PK
        text mensagem
        int id_usuario FK
    }
    MENSAGEM_GUIA {
        int id_mensagem PK
        text conteudo
        int id_usuario FK
        int id_guia FK
    }
    CONTATO {
        int id_contato PK
        string nome
        string email
        text assunto
        boolean respondido
    }
```

Uma avaliação deve apontar para um guia ou uma hospedagem (o outro relacionamento fica nulo).
Uma reserva de hospedagem avulsa pode ter `id_pacote` e `id_guia` nulos.
