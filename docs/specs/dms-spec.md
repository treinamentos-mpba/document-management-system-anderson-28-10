# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos documentos do usuário informado na requisição.
- Download de um documento pertencente a esse usuário.
- Persistência dos arquivos em disco local com Multer e `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do servidor.
- Interface web para envio, listagem e download.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência durável dos metadados.
- Autenticação, autorização corporativa ou gestão de contas.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Antivírus, classificação de conteúdo ou processamento dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um arquivo por requisição multipart/form-data. |
| RF-02 | O sistema deve gerar um identificador único para cada documento. |
| RF-03 | O sistema deve armazenar o arquivo no filesystem local usando Multer com `diskStorage`; o nome físico deve ser gerado pelo sistema, não derivado do nome original. |
| RF-04 | O sistema deve registrar em memória o identificador, nome original, tamanho, data de envio, dono e informações necessárias para localizar o arquivo. |
| RF-05 | O sistema deve listar somente documentos associados ao usuário da requisição. |
| RF-06 | O sistema deve permitir o download de um documento pelo identificador somente quando ele pertencer ao usuário da requisição. |
| RF-07 | O sistema deve responder com erro adequado quando o arquivo estiver ausente, for grande demais, o documento não existir ou ocorrer uma falha de armazenamento. |
| RF-08 | A interface deve apresentar os documentos do usuário, permitir o envio de arquivo e iniciar o download de um documento. |
| RF-09 | A interface deve informar estados de carregamento e erros retornados pela API. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem permanecer exclusivamente no filesystem local da aplicação, em `backend/storage` por padrão. |
| RNF-02 | O recebimento dos arquivos deve usar Multer com `diskStorage`; arquivos não devem ser mantidos integralmente em memória pelo middleware. |
| RNF-03 | Os metadados devem permanecer em memória nesta versão e serão perdidos quando o processo reiniciar. |
| RNF-04 | O diretório de armazenamento e o limite de tamanho devem ser configuráveis por variáveis de ambiente. |
| RNF-05 | O limite padrão de upload deve ser 10 MiB e poderá ser substituído por `MAX_FILE_SIZE_BYTES`. |
| RNF-06 | O diretório de armazenamento não deve ser exposto como conteúdo estático. |
| RNF-07 | Erros HTTP não devem revelar caminhos locais, stack traces ou detalhes internos do filesystem. |
| RNF-08 | A API deve usar respostas JSON consistentes para erros. Downloads devem retornar conteúdo binário. |
| RNF-09 | O frontend deve acessar a API pelo prefixo `/api`, usando o proxy de desenvolvimento já configurado no Vite. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único, gerado pelo servidor. |
| `originalName` | string | Público | Nome fornecido pelo usuário no upload. |
| `size` | number | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Público | Data e hora do envio em ISO 8601 UTC. |
| `owner` | string | Público | Identificador do usuário associado à requisição. |
| `storageName` | string | Interno | Nome gerado para o arquivo no diretório local. |
| `mimeType` | string | Interno/opcional | Tipo informado pelo cliente, quando disponível. |

`storageName` e o caminho físico do arquivo nunca devem ser retornados pela API. O nome original é apenas metadado e não deve ser usado para compor o caminho de armazenamento.

Nesta versão, a coleção em memória é a fonte dos metadados. Um arquivo que permaneça no disco após reinicialização não será considerado disponível se seu metadado não estiver em memória.

## 6. Contratos de API

Os caminhos abaixo são os endpoints do Express. No desenvolvimento, o frontend os acessa com o prefixo `/api`, removido pelo proxy do Vite.

### Identidade do usuário

As requisições devem enviar `X-User-Id` com um identificador não vazio. Nesta versão, esse cabeçalho é apenas um contexto de demonstração e não comprova identidade. Ele não deve ser tratado como mecanismo seguro de autenticação; uma implantação real precisa substituí-lo por uma identidade obtida de middleware de autenticação confiável.

Se o cabeçalho estiver ausente ou vazio, a API responde `400 Bad Request`.

### `POST /upload`

Envia um arquivo.

- Cabeçalho: `X-User-Id: <identificador>`
- Corpo: `multipart/form-data`, com campo de arquivo `file`.
- Sucesso: `201 Created`.

Exemplo de resposta:

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-28T12:00:00.000Z",
    "owner": "usuario-1"
  }
}