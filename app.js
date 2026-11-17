// =========================================================================
// PLANEJADOR DA LOJA - LÓGICA + BANCO DE DADOS (LOCALSTORAGE & FIREBASE)
// =========================================================================

let items = [];
let currentFilter = 'todos';
let db = null;
let unsubscribeFirestore = null;
let roomCode = 'minha-loja-2026';

// Chaves de armazenamento local
const STORAGE_ITEMS_KEY = 'loja_planejador_items_v1';
const STORAGE_CLOUD_KEY = 'loja_planejador_firebase_cfg_v1';

// Elementos do DOM
const itemForm = document.getElementById('itemForm');
const itemsList = document.getElementById('itemsList');
const statusBadge = document.getElementById('statusBadge');
const cloudModal = document.getElementById('cloudModal');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  checkUrlSharedConfig();
  initDatabase();
  bindEvents();
});

// Verifica se o link aberto já veio com a configuração do banco do amigo (?cfg=...)
function checkUrlSharedConfig() {
  const params = new URLSearchParams(window.location.search);
  const encodedCfg = params.get('cfg');
  if (encodedCfg) {
    try {
      const decodedJson = atob(encodedCfg);
      const parsed = JSON.parse(decodedJson);
      if (parsed.firebaseConfig && parsed.roomCode) {
        localStorage.setItem(STORAGE_CLOUD_KEY, JSON.stringify(parsed));
        // Limpa a URL para ficar bonita
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('✅ Configuração do banco de dados da loja importada com sucesso!');
      }
    } catch (e) {
      console.error('Erro ao ler link compartilhado:', e);
    }
  }
}

// Inicializa Firebase (se configurado) ou fallback para LocalStorage
function initDatabase() {
  const savedCloud = localStorage.getItem(STORAGE_CLOUD_KEY);

  if (savedCloud) {
    try {
      const { firebaseConfig, roomCode: savedRoom } = JSON.parse(savedCloud);
      roomCode = savedRoom || 'minha-loja-2026';

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();

      statusBadge.textContent = `☁️ Online (${roomCode})`;
      statusBadge.className = 'badge badge-cloud';

      // Escuta alterações em tempo real no Firestore
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeFirestore = db
        .collection('lojas')
        .doc(roomCode)
        .collection('itens')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            renderAll();
          },
          (error) => {
            console.error('Erro no Firestore:', error);
            alert('Erro ao conectar no Firebase. Verifique as regras do Firestore ou sua chave.');
          }
        );
      return;
    } catch (err) {
      console.error('Erro ao iniciar Firebase:', err);
    }
  }

  // Modo Local (sem internet/nuvem configurada ainda)
  statusBadge.textContent = '💾 Modo Local (Só neste PC)';
  statusBadge.className = 'badge badge-local';
  const localData = localStorage.getItem(STORAGE_ITEMS_KEY);
  items = localData ? JSON.parse(localData) : getInitialSeedData();
  saveLocal();
  renderAll();
}

// Dados iniciais de exemplo para a loja não começar vazia
function getInitialSeedData() {
  return [
    {
      id: 'seed-1',
      type: 'compra',
      category: 'Equipamentos & Sistema',
      title: 'Leitor de Código de Barras + Impressora Térmica',
      qty: 1,
      price: 450.0,
      priority: 'alta',
      notes: 'Essencial para agilizar o caixa na inauguração',
      bought: false,
      createdAt: Date.now()
    },
    {
      id: 'seed-2',
      type: 'compra',
      category: 'Móveis & Estrutura',
      title: 'Balcão de Atendimento / Caixa',
      qty: 1,
      price: 800.0,
      priority: 'alta',
      notes: 'Ver medidas antes de fechar pedido',
      bought: false,
      createdAt: Date.now() - 1000
    },
    {
      id: 'seed-3',
      type: 'ideia',
      category: 'Marketing & Fachada',
      title: 'Criar perfil no Instagram e fazer promoção de inauguração',
      qty: 1,
      price: 0,
      priority: 'media',
      notes: 'Sortear um kit da loja para quem marcar 2 amigos',
      bought: false,
      createdAt: Date.now() - 2000
    }
  ];
}

function saveLocal() {
  localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
}

// Adicionar novo item
async function addItem(e) {
  e.preventDefault();

  const newItem = {
    type: document.getElementById('itemType').value,
    category: document.getElementById('itemCategory').value,
    title: document.getElementById('itemTitle').value.trim(),
    qty: parseInt(document.getElementById('itemQty').value) || 1,
    price: parseFloat(document.getElementById('itemPrice').value) || 0,
    priority: document.getElementById('itemPriority').value,
    notes: document.getElementById('itemNotes').value.trim(),
    bought: false,
    createdAt: Date.now()
  };

  if (!newItem.title) return;

  if (db) {
    await db.collection('lojas').doc(roomCode).collection('itens').add(newItem);
  } else {
    newItem.id = 'local-' + Date.now();
    items.unshift(newItem);
    saveLocal();
    renderAll();
  }

  itemForm.reset();
  document.getElementById('itemQty').value = 1;
}

// Marcar como comprado / concluído
async function toggleBought(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;

  if (db) {
    await db
      .collection('lojas')
      .doc(roomCode)
      .collection('itens')
      .doc(id)
      .update({ bought: !item.bought });
  } else {
    item.bought = !item.bought;
    saveLocal();
    renderAll();
  }
}

// Deletar item
async function deleteItem(id) {
  if (!confirm('Tem certeza que deseja excluir este item?')) return;

  if (db) {
    await db.collection('lojas').doc(roomCode).collection('itens').doc(id).delete();
  } else {
    items = items.filter((i) => i.id !== id);
    saveLocal();
    renderAll();
  }
}

// Renderização da interface e cálculos
function renderAll() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const catFilter = document.getElementById('categoryFilter').value;

  // Contadores das abas
  document.getElementById('countAll').textContent = items.length;
  document.getElementById('countCompras').textContent = items.filter((i) => i.type === 'compra').length;
  document.getElementById('countIdeias').textContent = items.filter((i) => i.type === 'ideia').length;

  // Estatísticas financeiras
  const compras = items.filter((i) => i.type === 'compra');
  const comprados = compras.filter((i) => i.bought);
  const totalBudget = compras.reduce((acc, i) => acc + i.price * i.qty, 0);
  const remainingBudget = compras
    .filter((i) => !i.bought)
    .reduce((acc, i) => acc + i.price * i.qty, 0);

  document.getElementById('statTotal').textContent = items.length;
  document.getElementById('statBought').textContent = `${comprados.length} / ${compras.length}`;
  document.getElementById('statBudget').textContent = formatBRL(totalBudget);
  document.getElementById('statRemaining').textContent = formatBRL(remainingBudget);

  // Filtragem
  const filtered = items.filter((item) => {
    const matchesTab = currentFilter === 'todos' || item.type === currentFilter;
    const matchesCat = catFilter === 'todas' || item.category === catFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm));
    return matchesTab && matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    itemsList.innerHTML = `<div class="empty-state">Nenhum item encontrado neste filtro. Adicione algo acima!</div>`;
    return;
  }

  itemsList.innerHTML = filtered
    .map((item) => {
      const totalItem = item.price * item.qty;
      const prioLabel =
        item.priority === 'alta'
          ? '🔴 Alta'
          : item.priority === 'media'
          ? '🟡 Média'
          : '🟢 Baixa';

      return `
      <div class="item-card ${item.bought ? 'bought' : ''}">
        <div class="item-left">
          <input type="checkbox" class="item-checkbox" ${item.bought ? 'checked' : ''} onchange="toggleBought('${item.id}')" />
          <div class="item-info">
            <div class="item-meta">
              <span class="tag ${item.type === 'compra' ? 'tag-compra' : 'tag-ideia'}">
                ${item.type === 'compra' ? '🛒 Compra' : '💡 Ideia'}
              </span>
              <span class="tag">${item.category}</span>
              <span class="prio-${item.priority}">${prioLabel}</span>
            </div>
            <span class="item-title">${escapeHTML(item.title)}</span>
            ${item.notes ? `<span class="item-notes">📝 ${escapeHTML(item.notes)}</span>` : ''}
          </div>
        </div>

        <div class="item-right">
          ${
            item.type === 'compra'
              ? `<div class="item-price-box">
                  <span class="item-total">${formatBRL(totalItem)}</span>
                  <span class="item-unit">${item.qty}x ${formatBRL(item.price)}</span>
                </div>`
              : ''
          }
          <button class="btn-delete" onclick="deleteItem('${item.id}')" title="Excluir item">🗑️</button>
        </div>
      </div>
    `;
    })
    .join('');
}

function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}

// Eventos da interface
function bindEvents() {
  itemForm.addEventListener('submit', addItem);

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderAll();
    });
  });

  document.getElementById('searchInput').addEventListener('input', renderAll);
  document.getElementById('categoryFilter').addEventListener('change', renderAll);

  // Modal do Banco na Nuvem
  document.getElementById('btnCloudModal').addEventListener('click', () => {
    const saved = localStorage.getItem(STORAGE_CLOUD_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      document.getElementById('firebaseConfigInput').value = JSON.stringify(parsed.firebaseConfig, null, 2);
      document.getElementById('roomCodeInput').value = parsed.roomCode || 'minha-loja-2026';
    }
    cloudModal.classList.remove('hidden');
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    cloudModal.classList.add('hidden');
  });

  // Salvar configuração Firebase
  document.getElementById('btnSaveCloud').addEventListener('click', () => {
    let raw = document.getElementById('firebaseConfigInput').value.trim();
    const room = document.getElementById('roomCodeInput').value.trim() || 'minha-loja-2026';

    try {
      // Permite colar tanto JSON puro quanto o código JS "const firebaseConfig = { ... };"
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Objeto JSON não encontrado');
      // Converte chaves sem aspas para JSON válido se necessário
      const jsonStr = match[0].replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/'/g, '"');
      const firebaseConfig = JSON.parse(jsonStr);

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('apiKey ou projectId ausentes');
      }

      localStorage.setItem(STORAGE_CLOUD_KEY, JSON.stringify({ firebaseConfig, roomCode: room }));
      cloudModal.classList.add('hidden');
      location.reload();
    } catch (err) {
      alert('Formato inválido! Cole o bloco { apiKey: "...", projectId: "..." } copiado do Firebase.');
    }
  });

  // Desconectar Nuvem
  document.getElementById('btnDisconnectCloud').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_CLOUD_KEY);
    cloudModal.classList.add('hidden');
    location.reload();
  });

  // Copiar Link Compartilhável para o Amigo
  document.getElementById('btnShareLink').addEventListener('click', () => {
    const saved = localStorage.getItem(STORAGE_CLOUD_KEY);
    if (!saved) {
      alert('⚠️ Primeiro configure o "Banco na Nuvem" para gerar um link sincronizado com seu amigo!');
      document.getElementById('btnCloudModal').click();
      return;
    }

    const encoded = btoa(saved);
    const shareUrl = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('🔗 Link copiado! Mande esse link no WhatsApp do seu amigo. Quando ele abrir, já vai entrar direto no mesmo banco de dados da loja!');
    });
  });
}
