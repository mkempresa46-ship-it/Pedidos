# 🛍️ Planejador da Loja — Compras & Ideias

Aplicação web feita em **HTML, CSS e JavaScript puro** com suporte a **Banco de Dados na Nuvem (Firebase Firestore)** para você e seu sócio/amigo acessarem de casas diferentes em tempo real, hospedado gratuitamente no **GitHub Pages**.

## 📁 Estrutura dos Arquivos

- `index.html` — Estrutura da página e modal de conexão com o banco
- `style.css` — Visual responsivo para computador e celular
- `app.js` — Lógica de adicionar, deletar, filtrar, calcular orçamento e sincronizar com o banco
- `database/banco-inicial.json` — Estrutura modelo dos dados armazenados
- `database/firestore.rules` — Regras para configurar no Firebase Firestore

## 🚀 Como subir no GitHub Pages (Gratuito)

1. Crie um repositório no seu GitHub (ex: `planejador-loja`).
2. Envie os arquivos (`index.html`, `style.css`, `app.js` e a pasta `database`) para o repositório.
3. No GitHub, acesse **Settings** > **Pages**.
4. Em **Source**, selecione **Deploy from a branch**, escolha a branch `main` e clique em **Save**.
5. Em 1 minuto seu site estará online no link `https://seu-usuario.github.io/planejador-loja/`.

## ☁️ Como conectar o Banco de Dados Online (para seu amigo acessar)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) e crie um projeto gratuito.
2. Vá em **Criação > Firestore Database > Criar banco de dados** (escolha **Modo de teste**).
3. Vá em **Configurações do Projeto (⚙️) > Seus aplicativos > Web (`</>`)** e copie o objeto `firebaseConfig`.
4. Abra seu site no GitHub Pages, clique em **☁️ Banco na Nuvem**, cole o `firebaseConfig` e clique em **Conectar Banco Online**.
5. Clique no botão **🔗 Link p/ Amigo** no topo da tela e mande o link no WhatsApp dele. Assim que ele abrir, os dois estarão conectados no mesmo banco ao vivo!
