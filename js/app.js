// ===== DATA =====
const products = [
  { id:1, cat:'burguer', name:'Smash Burguer', desc:'Hamburguer 150g, cheddar, alface, tomate e molho especial', price:32.90, oldPrice:null, emoji:'&#127828;', image:null, tag:'Mais pedido', tagType:'destaque', ingredients:['Hamburguer 150g','Cheddar','Alface','Tomate','Molho especial','Pão brioche'], addons:[{name:'Bacon extra',price:3},{name:'Cheddar extra',price:2.5},{name:'Ovo',price:4},{name:'Molho barbecue',price:3.5},{name:'Batata palha',price:5},{name:'Pão australiano',price:2}], disponivel:true, destaque:true, vendas:342 },
  { id:2, cat:'burguer', name:'Smash Duplo', desc:'Dois burguers 150g, cheddar duplo, bacon crocante', price:39.90, oldPrice:45.90, emoji:'&#127828;', image:null, tag:'Promoção', tagType:'promo', ingredients:['2x Hamburguer 150g','Cheddar duplo','Bacon','Alface','Molho'], addons:[{name:'Bacon extra',price:3},{name:'Cheddar extra',price:2.5},{name:'Ovo',price:4}], disponivel:true, destaque:true, vendas:134 },
  { id:3, cat:'burguer', name:'Burguer Salada', desc:'Hamburguer 150g, salada fresca, maionese da casa', price:28.90, oldPrice:null, emoji:'&#127828;', image:null, tag:'', tagType:'', ingredients:['Hamburguer 150g','Alface','Tomate','Maionese','Pão'], addons:[{name:'Bacon extra',price:3},{name:'Ovo',price:4}], disponivel:true, destaque:false, vendas:89 },
  { id:4, cat:'batata', name:'Batata Cheddar', desc:'Batata crocante com cheddar cremoso e bacon', price:18.90, oldPrice:null, emoji:'&#127839;', image:null, tag:'', tagType:'', ingredients:['Batata','Cheddar cremoso','Bacon','Cebolinha'], addons:[{name:'Cheddar extra',price:2.5},{name:'Bacon extra',price:3},{name:'Catupiry',price:3}], disponivel:true, destaque:true, vendas:287 },
  { id:5, cat:'batata', name:'Batata Bacon', desc:'Batata com bacon crocante e barbecue', price:20.90, oldPrice:24.90, emoji:'&#127839;', image:null, tag:'Indisponível', tagType:'soldout', ingredients:['Batata','Bacon','Molho barbecue'], addons:[{name:'Cheddar extra',price:2.5},{name:'Bacon extra',price:3}], disponivel:false, destaque:false, vendas:0 },
  { id:6, cat:'batata', name:'Batata Palito', desc:'Batata palito crocante sal grosso', price:12.90, oldPrice:null, emoji:'&#127839;', image:null, tag:'', tagType:'', ingredients:['Batata','Sal grosso'], addons:[], disponivel:true, destaque:false, vendas:56 },
  { id:7, cat:'bebida', name:'Coca-Cola Lata', desc:'Coca-Cola lata 350ml', price:6.90, oldPrice:null, emoji:'&#129346;', image:null, tag:'', tagType:'', ingredients:['Refrigerante'], addons:[], disponivel:true, destaque:false, vendas:198 },
  { id:8, cat:'bebida', name:'Guaraná Lata', desc:'Guaraná Antarctica lata 350ml', price:5.90, oldPrice:null, emoji:'&#129346;', image:null, tag:'', tagType:'', ingredients:['Refrigerante'], addons:[], disponivel:true, destaque:false, vendas:156 },
  { id:9, cat:'bebida', name:'Suco Natural', desc:'Suco de laranja ou limão 500ml', price:9.90, oldPrice:null, emoji:'&#129346;', image:null, tag:'', tagType:'', ingredients:['Fruta natural'], addons:[{name:'Com açúcar',price:0},{name:'Sem açúcar',price:0}], disponivel:true, destaque:false, vendas:87 },
  { id:10, cat:'sobremesa', name:'Milk Shake Ovomaltine', desc:'Milkshake de ovomaltine com chantilly', price:16.90, oldPrice:null, emoji:'&#127852;', image:null, tag:'', tagType:'', ingredients:['Sorvete','Ovomaltine','Chantilly','Leite'], addons:[{name:'Chantilly extra',price:2},{name:'Calda chocolate',price:2.5}], disponivel:true, destaque:true, vendas:156 },
  { id:11, cat:'sobremesa', name:'Milk Shake Chocolate', desc:'Chocolate belga com calda', price:16.90, oldPrice:null, emoji:'&#127852;', image:null, tag:'', tagType:'', ingredients:['Sorvete','Chocolate belga','Calda','Chantilly'], addons:[{name:'Chantilly extra',price:2},{name:'Calda extra',price:2.5}], disponivel:true, destaque:false, vendas:98 },
  { id:12, cat:'sobremesa', name:'Petit Gateau', desc:'Bolo chocolate com sorvete', price:19.90, oldPrice:null, emoji:'&#127849;', image:null, tag:'', tagType:'', ingredients:['Bolo chocolate','Sorvete creme','Calda'], addons:[{name:'Sorvete extra',price:3},{name:'Chantilly',price:2}], disponivel:true, destaque:true, vendas:134 },
];
let cart = [];
let favoritos = [];
let orderHistory = [];
let currentUser = null;
let couponApplied = false, discount = 0;
const deliveryFeeValue = 4.99;

// ===== LOGIN =====
function doLogin(fromCheckout) {
  const name = document.getElementById('loginName').value.trim();
  const phone = document.getElementById('loginPhone').value.trim();
  if (!name || !phone) { alert('Preencha nome e telefone!'); return; }
  currentUser = { name, phone, id: phone.replace(/\D/g,'') };
  localStorage.setItem('burgerUser', JSON.stringify(currentUser));
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('userNameDisplay').textContent = name.split(' ')[0];
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
  loadUserData();
  renderOrderHistory();
  if (fromCheckout) {
    document.getElementById('chkName').value = currentUser.name;
    document.getElementById('chkPhone').value = currentUser.phone;
    document.getElementById('checkoutOverlay').classList.add('open');
  }
}

function logout() {
  if (currentUser) {
    if (confirm('Trocar de usuário?')) {
      localStorage.removeItem('burgerUser');
      localStorage.removeItem('burgerOrders_' + currentUser.id);
      currentUser = null;
      location.reload();
    }
  } else {
    document.getElementById('loginOverlay').classList.remove('hidden');
  }
}

function loadUserData() {
  if (!currentUser) return;
  const key = 'burgerOrders_' + currentUser.id;
  orderHistory = JSON.parse(localStorage.getItem(key) || '[]');
  favoritos = JSON.parse(localStorage.getItem('burgerFavs_' + currentUser.id) || '[]');
  document.getElementById('favCount').textContent = favoritos.length + ' itens';
  document.getElementById('orderCount').textContent = orderHistory.length + ' pedidos';
  document.getElementById('loyaltyCount').textContent = Math.min(orderHistory.length, 10) + '/10';
  renderProducts('all');
  renderOrderHistory();
}

function checkUser() {
  const saved = JSON.parse(localStorage.getItem('burgerUser'));
  if (saved && saved.name && saved.phone) {
    currentUser = saved;
    document.getElementById('userNameDisplay').textContent = saved.name.split(' ')[0];
    document.getElementById('userAvatar').textContent = saved.name.charAt(0).toUpperCase();
    loadUserData();
  } else {
    renderProducts('all');
    renderOrderHistory();
  }
}

// ===== MODE SWITCHER =====
function switchMode(mode, btn) {
  document.querySelectorAll('.mode-switcher button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view' + mode.charAt(0).toUpperCase() + mode.slice(1)).classList.add('active');
  if (mode === 'admin') { drawAdminCharts(); renderSortableProducts(); }
}

// ===== PRODUCTS =====
function getColor(cat) {
  switch(cat) {
    case 'burguer': return 'linear-gradient(135deg,#fef2f2,#fee2e2)';
    case 'batata': return 'linear-gradient(135deg,#fffbeb,#fef3c7)';
    case 'bebida': return 'linear-gradient(135deg,#ecfdf5,#d1fae5)';
    case 'sobremesa': return 'linear-gradient(135deg,#fdf4ff,#fae8ff)';
    default: return '#fff';
  }
}

function renderProducts(filter) {
  const grid = document.getElementById('productsGrid');
  let list = filter === 'all' ? products : filter === 'promocoes' ? products.filter(p => p.oldPrice) : products.filter(p => p.cat === filter);
  if (!list.length) { grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px;">Nenhum produto.</p>'; return; }
  document.getElementById('prodCount').textContent = list.length;
  grid.innerHTML = list.map(p => {
    const isFav = favoritos.includes(p.id);
    return `<div class="product-card" onclick="openProdModal(${p.id})">
      <button class="fav-btn ${isFav?'favorited':''}" onclick="event.stopPropagation();toggleFavorito(${p.id},this)">${isFav?'&#10084;':'&#9825;'}</button>
      <div class="product-image" style="background:${getColor(p.cat)};${!p.disponivel?'opacity:.5':''};${p.image?'background:var(--bg);':''}">
        ${p.tag ? `<span class="tag ${p.tagType}">${p.tag}</span>` : ''}
        ${p.destaque&&p.disponivel ? `<span class="tag destaque" style="left:8px;top:${p.tag?'36px':'8px'};">&#11088; Destaque</span>` : ''}
        ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:12px;">` : p.emoji}
      </div>
      <div class="product-body">
        <h3 style="${!p.disponivel?'color:var(--muted);':''}">${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="price-row">
          <span class="price" style="${!p.disponivel?'color:var(--muted);':''}">R$ ${p.price.toFixed(2)}</span>
          ${p.oldPrice ? `<span class="old-price">R$ ${p.oldPrice.toFixed(2)}</span>` : ''}
          <button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})" ${!p.disponivel?'disabled':''}>${p.disponivel?'+ Add':'&#10060;'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterProducts(cat, el) {
  document.querySelectorAll('.cat-item').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderProducts(cat);
}

// ===== FAVORITOS =====
function toggleFavorito(id, btn) {
  if (!currentUser) return;
  const idx = favoritos.indexOf(id);
  if (idx > -1) { favoritos.splice(idx,1); if(btn) btn.classList.remove('favorited'); }
  else { favoritos.push(id); if(btn) btn.classList.add('favorited'); }
  localStorage.setItem('burgerFavs_' + currentUser.id, JSON.stringify(favoritos));
  document.getElementById('favCount').textContent = favoritos.length + ' itens';
}
function addFavorito(id) {
  toggleFavorito(id, null);
  document.getElementById('modalFavBtn').innerHTML = favoritos.includes(id) ? '&#10084; Favoritado' : '&#9825; Favoritar';
}

// ===== PRODUCT MODAL =====
let prodModalId = null;
function openProdModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  prodModalId = id;
  document.getElementById('modalImg').style.background = getColor(p.cat);
  document.getElementById('modalImg').innerHTML = p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;position:absolute;inset:0;">` : p.emoji;
  document.getElementById('modalName').textContent = p.name + (p.disponivel?'':' (Indisponível)');
  document.getElementById('modalDesc').textContent = p.desc;
  document.getElementById('modalPrice').textContent = 'R$ '+p.price.toFixed(2);
  const oldEl = document.getElementById('modalOldPrice');
  if (p.oldPrice) { oldEl.style.display='inline'; oldEl.textContent='R$ '+p.oldPrice.toFixed(2); } else oldEl.style.display='none';
  document.getElementById('modalIngredients').innerHTML = p.ingredients.map(i => '<span>'+i+'</span>').join('');
  document.getElementById('modalFavBtn').innerHTML = favoritos.includes(id)?'&#10084; Favoritado':'&#9825; Favoritar';
  document.getElementById('modalObs').value = '';
  const addonsEl = document.getElementById('modalAddons');
  if (p.addons && p.addons.length) {
    addonsEl.innerHTML = p.addons.map(a => `<label><input type="checkbox" data-price="${a.price}"><span>${a.name}</span><span class="addon-price">+R$ ${a.price.toFixed(2)}</span></label>`).join('');
  } else { addonsEl.innerHTML = '<p style="font-size:13px;color:var(--muted);">Nenhum adicional</p>'; }
  const related = products.filter(r => r.cat === p.cat && r.id !== p.id && r.disponivel).slice(0,3);
  document.getElementById('relatedGrid').innerHTML = related.length ? related.map(r =>
    `<div class="related-item" onclick="closeProdModal();setTimeout(()=>openProdModal(${r.id}),200)">
      <div class="r-emoji">${r.emoji}</div><div class="r-name">${r.name}</div><div class="r-price">R$ ${r.price.toFixed(2)}</div>
    </div>`
  ).join('') : '<p style="font-size:13px;color:var(--muted);grid-column:1/-1;text-align:center;">Nenhum</p>';
  document.getElementById('prodModal').classList.add('open');
}
function closeProdModal() { document.getElementById('prodModal').classList.remove('open'); }
function addFromModal() {
  if (prodModalId === null) return;
  const p = products.find(x => x.id === prodModalId);
  if (!p || !p.disponivel) { alert('Indisponível!'); return; }
  const addons = [];
  document.querySelectorAll('#modalAddons input:checked').forEach(cb => {
    addons.push({name: cb.parentElement.querySelector('span:first-child').textContent.trim(), price: parseFloat(cb.dataset.price)});
  });
  const obs = document.getElementById('modalObs').value.trim();
  const existing = cart.find(c => c.id === prodModalId && JSON.stringify(c.addons||[]) === JSON.stringify(addons) && (c.obs||'') === obs);
  if (existing) existing.qty++;
  else cart.push({...p, qty:1, addons, obs});
  updateCart(); closeProdModal(); openCart();
}

// ===== CART =====
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || !p.disponivel) { alert('Indisponível!'); return; }
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({...p, qty:1, addons:[], obs:''});
  updateCart();
}
function removeFromCart(id) { cart = cart.filter(c => c.id !== id); updateCart(); }
function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id); else updateCart();
}
function updateCart() {
  const container = document.getElementById('cartItems');
  const badge = document.getElementById('cartBadge');
  document.getElementById('cartCount').textContent = cart.reduce((s,c) => s + c.qty, 0);
  badge.textContent = cart.reduce((s,c) => s + c.qty, 0);
  if (!cart.length) { container.innerHTML = '<p style="text-align:center;color:var(--muted);padding-top:40px;">Vazio</p>'; updateSummary(); return; }
  container.innerHTML = cart.map(c => {
    const addonsStr = c.addons&&c.addons.length ? '+ '+c.addons.map(a=>a.name).join(', ') : '';
    const obsStr = c.obs ? 'Obs: '+c.obs : '';
    const extra = c.addons ? c.addons.reduce((s,a) => s + a.price, 0) : 0;
    return `<div class="cart-item">
      <div class="cart-item-img" style="background:${getColor(c.cat)}">${c.emoji}</div>
      <div class="cart-item-info">
        <h4>${c.name}</h4>${addonsStr?'<div class="obs">'+addonsStr+'</div>':''}${obsStr?'<div class="obs">'+obsStr+'</div>':''}
        <div class="item-qty-price"><div class="cart-item-qty"><button onclick="changeQty(${c.id},-1)">-</button><span>${c.qty}</span><button onclick="changeQty(${c.id},1)">+</button></div><span class="item-price">R$ ${((c.price+extra)*c.qty).toFixed(2)}</span></div>
      </div>
    </div>`;
  }).join('');
  updateSummary();
}
function updateSummary() {
  const subtotal = cart.reduce((s,c) => { const extra = c.addons?c.addons.reduce((a,b)=>a+b.price,0):0; return s+(c.price+extra)*c.qty; }, 0);
  const fee = cart.length > 0 ? deliveryFeeValue : 0;
  const discVal = couponApplied ? subtotal * discount : 0;
  const total = subtotal + fee - discVal;
  document.getElementById('subtotal').textContent = 'R$ '+subtotal.toFixed(2);
  document.getElementById('deliveryFee').textContent = fee > 0 ? 'R$ '+fee.toFixed(2) : 'R$ 0,00';
  const dr = document.getElementById('discountRow');
  if (couponApplied && discVal > 0) { dr.style.display='flex'; document.getElementById('discountValue').textContent = '-R$ '+discVal.toFixed(2); } else dr.style.display='none';
  document.getElementById('totalValue').textContent = 'R$ '+total.toFixed(2);
}
function applyCoupon() {
  const input = document.getElementById('couponInput').value.trim().toUpperCase();
  const valid = {'SMASH10':0.10,'BATATA2':0.15,'FREE60':0.20,'FIDELIDADE':0.20};
  if (valid[input]) { couponApplied=true; discount=valid[input]; alert('Cupom '+input+' aplicado! '+(discount*100)+'% off'); }
  else { alert('Cupom inválido.'); couponApplied=false; discount=0; }
  updateSummary();
}
function openCart() { document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartSidebar').classList.add('open'); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartSidebar').classList.remove('open'); }

// ===== CHECKOUT =====
function openCheckout() {
  if (!cart.length) { alert('Carrinho vazio!'); return; }
  if (currentUser) {
    document.getElementById('chkName').value = currentUser.name;
    document.getElementById('chkPhone').value = currentUser.phone;
    document.getElementById('checkoutOverlay').classList.add('open');
  } else {
    document.getElementById('loginOverlay').classList.remove('hidden');
  }
}
function closeCheckout() { document.getElementById('checkoutOverlay').classList.remove('open'); }
function selectPag(el, type) {
  document.querySelectorAll('#pgOptions .payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('trocoGroup').style.display = type === 'dinheiro' ? 'block' : 'none';
}
function selectEntrega(el) {
  document.querySelectorAll('#deliveryTypeOptions .payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}
function buscarCep() {
  const cep = document.getElementById('chkCep').value.replace(/\D/g,'');
  if (cep.length !== 8) return;
  fetch('https://viacep.com.br/ws/'+cep+'/json/').then(r=>r.json()).then(d => {
    if (!d.erro) {
      document.getElementById('chkAddr').value = d.logradouro||'';
      document.getElementById('chkBairro').value = d.bairro||'';
      document.getElementById('chkCity').value = (d.localidade||'')+' - '+(d.uf||'');
    } else alert('CEP não encontrado.');
  }).catch(()=>{});
}
function calcFrete() {
  const bairro = document.getElementById('chkBairro').value.trim().toLowerCase();
  const taxas = {'centro':4.99,'jardins':6.99,'vila nova':8.99,'morumbi':9.99};
  const taxa = taxas[bairro] || null;
  if (taxa !== null) { document.getElementById('deliveryFee').textContent = 'R$ '+taxa.toFixed(2); updateSummary(); }
}
function calcTroco() {
  const total = cart.reduce((s,c) => { const e=c.addons?c.addons.reduce((a,b)=>a+b.price,0):0; return s+(c.price+e)*c.qty; }, 0) + deliveryFeeValue;
  const pago = parseFloat(document.getElementById('chkTroco').value.replace(',','.')) || 0;
  const t = document.getElementById('trocoAuto');
  if (pago > total) { t.style.display='block'; t.innerHTML = 'Troco: <strong>R$ '+(pago-total).toFixed(2)+'</strong>'; }
  else if (pago > 0 && pago < total) { t.style.display='block'; t.innerHTML = '<span style="color:var(--red);">Faltam R$ '+(total-pago).toFixed(2)+'</span>'; }
  else t.style.display='none';
}
function confirmOrder() {
  if (!currentUser) { alert('Faça login primeiro!'); return; }
  const chkName = document.getElementById('chkName').value.trim();
  const chkPhone = document.getElementById('chkPhone').value.trim();
  if (!chkName || !chkPhone) { alert('Preencha nome e WhatsApp!'); return; }
  const num = Math.floor(Math.random()*9000)+1000;
  document.getElementById('orderNum').textContent = '#'+num;
  const order = {
    id: num, date: new Date().toLocaleString(),
    items: JSON.parse(JSON.stringify(cart)),
    total: parseFloat(document.getElementById('totalValue').textContent.replace('R$','').replace(',','.')),
    status: 'Recebido', statusIdx: 0, avaliado: false,
    cliente: chkName || currentUser.name,
    telefone: chkPhone || currentUser.phone
  };
  orderHistory.unshift(order);
  const key = 'burgerOrders_' + currentUser.id;
  localStorage.setItem(key, JSON.stringify(orderHistory));
  closeCheckout(); closeCart();
  cart = []; couponApplied = false; discount = 0; updateCart();
  document.getElementById('trackingOverlay').classList.add('open');
  renderOrderHistory();
  document.getElementById('orderCount').textContent = orderHistory.length + ' pedidos';
  document.getElementById('loyaltyCount').textContent = Math.min(orderHistory.length,10)+'/10';
  simulateTracking();
}
function closeTracking() { document.getElementById('trackingOverlay').classList.remove('open'); }
function simulateTracking() {
  const steps = document.querySelectorAll('#trackSteps .track-step');
  let i = 1;
  const interval = setInterval(() => {
    if (i >= steps.length) { clearInterval(interval); return; }
    steps[i].classList.add('active');
    if (i-1 >= 0) { steps[i-1].classList.remove('active'); steps[i-1].classList.add('done'); }
    const times = ['','','Preparando...','Saiu para entrega!','Entregue!'];
    const p = steps[i].querySelector('p');
    if (p && times[i]) p.textContent = times[i];
    if (i === steps.length - 1) {
      steps[i].classList.add('done'); steps[i].classList.remove('active');
      setTimeout(() => {
        document.getElementById('ratingOrderRef').textContent = '#'+document.getElementById('orderNum').textContent;
        document.getElementById('ratingOverlay').classList.add('open');
      }, 1500);
    }
    i++;
  }, 2500);
}

// ===== RATING =====
let ratingValue = 0;
document.querySelectorAll('#starsInput span').forEach(s => {
  s.addEventListener('click', function() {
    ratingValue = parseInt(this.dataset.v);
    document.querySelectorAll('#starsInput span').forEach((el,i) => el.classList.toggle('active', i < ratingValue));
  });
  s.addEventListener('mouseenter', function() {
    const v = parseInt(this.dataset.v);
    document.querySelectorAll('#starsInput span').forEach((el,i) => el.style.color = i < v ? '#f59e0b' : '#d6d3d1');
  });
  s.addEventListener('mouseleave', function() {
    document.querySelectorAll('#starsInput span').forEach((el,i) => el.style.color = i < ratingValue ? '#f59e0b' : '#d6d3d1');
  });
});
function submitRating() {
  if (ratingValue === 0) { alert('Selecione uma nota!'); return; }
  const orderNum = document.getElementById('orderNum').textContent;
  const order = orderHistory.find(o => '#'+o.id === orderNum);
  if (order) { order.avaliado=true; order.rating=ratingValue; order.ratingComment=document.getElementById('ratingComment').value.trim();
    const key = 'burgerOrders_'+currentUser.id; localStorage.setItem(key, JSON.stringify(orderHistory)); renderOrderHistory(); }
  document.getElementById('ratingOverlay').classList.remove('open');
  alert('Obrigado!');
  ratingValue=0; document.querySelectorAll('#starsInput span').forEach(el => el.classList.remove('active'));
  document.getElementById('ratingComment').value='';
}
function renderOrderHistory() {
  const el = document.getElementById('orderHistory');
  if (!currentUser || !orderHistory.length) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--muted);">'+(currentUser?'Nenhum pedido ainda.':'Faça login para ver seu histórico.')+'</div>'; return; }
  el.innerHTML = orderHistory.map(o => {
    const sc = {'Recebido':'received','Confirmado':'received','Preparando':'preparing','Saiu':'shipped','Saiu para Entrega':'shipped','Entregue':'delivered'};
    const scls = sc[o.status]||'received';
    const itemsStr = o.items.map(i => i.name+(i.qty>1?' x'+i.qty:'')).join(', ');
    const allValid = o.items.every(oi => { const p = products.find(x => x.id === oi.id); return p && p.disponivel && p.price === oi.price; });
    return `<div class="oh-item">
      <div class="oh-icon" style="background:${getColor(o.items[0]?o.items[0].cat:'burguer')}">&#128230;</div>
      <div class="oh-info"><h4>#${o.id} — ${itemsStr}</h4><p>${o.date}</p></div>
      <div class="oh-status">
        <div class="oh-price">R$ ${o.total.toFixed(2)}</div>
        <div class="oh-date"><span class="status-badge ${scls}"><span class="dot"></span>${o.status||'Entregue'}</span></div>
        <div style="display:flex;gap:4px;margin-top:4px;justify-content:flex-end;flex-wrap:wrap;">
          ${allValid ? `<button class="btn-reorder" onclick="reorderPedido(${o.id})">&#128260; Pedir Novamente</button>` : `<span style="font-size:10px;color:var(--red);display:block;">Produto indisponível ou preço alterado</span>`}
          ${!o.avaliado && (o.status==='Entregue'||o.status==='Saiu'||o.status==='Saiu para Entrega') ? `<button class="action-btn" onclick="avaliarPedido(${o.id})">&#9733; Avaliar</button>` : o.avaliado ? '<span style="font-size:12px;color:var(--yellow);">&#9733; '+o.rating+'/5</span>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}
function reorderPedido(id) {
  const order = orderHistory.find(o => o.id === id);
  if (!order) return;
  const invalidItems = order.items.filter(oi => { const p = products.find(x => x.id === oi.id); return !p || !p.disponivel || p.price !== oi.price; });
  if (invalidItems.length) alert('Alguns itens não estão mais disponíveis ou tiveram o preço alterado.');
  order.items.forEach(oi => {
    const p = products.find(x => x.id === oi.id);
    if (p && p.disponivel && p.price === oi.price) {
      const existing = cart.find(c => c.id === oi.id);
      if (existing) existing.qty += oi.qty;
      else cart.push({...p, qty:oi.qty, addons:oi.addons||[], obs:oi.obs||''});
    }
  });
  updateCart(); openCart();
}
function avaliarPedido(id) {
  document.getElementById('ratingOrderRef').textContent = '#'+id;
  document.getElementById('ratingOverlay').classList.add('open');
}

// ===== ADMIN =====
function switchAdminPage(page, el) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a,.sidebar-nav button').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('apage-'+page).classList.add('active');
  const titles = {dash:'Dashboard',pedidos:'Pedidos',produtos:'Produtos',clientes:'Clientes',bairros:'Bairros Atendidos',cupons:'Cupons',pagamentos:'Formas de Pagamento',financeiro:'Financeiro',config:'Configurações'};
  document.getElementById('adminTitle').textContent = titles[page]||'Dashboard';
  if (page === 'produtos') renderSortableProducts();
  if (page === 'dash') drawAdminCharts();
}
function drawAdminCharts() {
  const sales = [32,45,38,52,41,47,39]; const sLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const sMax = Math.max(...sales);
  document.getElementById('adminSalesChart').innerHTML = sales.map((v,i) =>
    `<div class="bar" style="height:${(v/sMax)*100}%;background:var(--primary);"><span class="bar-label">${sLabels[i]}</span></div>`
  ).join('');
  const months = [42,38,47,45,52,48,55,58,51,62,58,67];
  const mLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mMax = Math.max(...months);
  document.getElementById('adminMonthChart').innerHTML = months.map((v,i) =>
    `<div class="bar" style="height:${(v/mMax)*100}%;background:var(--blue);"><span class="bar-label">${mLabels[i]}</span></div>`
  ).join('');
}
function renderSortableProducts() {
  const el = document.getElementById('sortableProducts');
  const list = products.filter(p => p.disponivel);
  el.innerHTML = list.map((p,i) => `
    <div class="sortable-item" draggable="true" data-id="${p.id}">
      <span class="drag-handle">&#9776;</span><span class="s-icon">${p.emoji}</span>
      <div class="s-info"><h5>${p.name}</h5><p>R$ ${p.price.toFixed(2)} &middot; ${p.vendas} vendas</p></div>
      <span style="font-size:12px;color:var(--muted);">#${i+1}</span>
      <button class="action-btn" onclick="openEditProduto(${p.id})" title="Editar">&#9998;</button>
      <div class="s-toggle ${p.destaque?'active':''}" onclick="event.stopPropagation();this.classList.toggle('active')"><span class="s-knob"></span></div>
    </div>`).join('');
  el.querySelectorAll('.sortable-item').forEach(item => {
    item.addEventListener('dragstart', function(e) { e.dataTransfer.setData('text/plain',this.dataset.id); this.style.opacity='.5'; });
    item.addEventListener('dragend', function() { this.style.opacity='1'; });
    item.addEventListener('dragover', function(e) { e.preventDefault(); });
    item.addEventListener('drop', function(e) {
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      const from = el.querySelector('[data-id="'+fromId+'"]');
      const to = this;
      if (from !== to) { const s=[...el.children]; if(s.indexOf(from)<s.indexOf(to)) el.insertBefore(from,to.nextSibling); else el.insertBefore(from,to); }
    });
  });
}
function epAutoTag() {
  const promo = document.getElementById('epTagPromo');
  const val = document.getElementById('epOldPrice').value.trim();
  const radio = promo.querySelector('input');
  if (val) { radio.disabled = false; radio.checked = true; promo.style.opacity='1'; }
  else { radio.disabled = true; radio.checked = false; promo.style.opacity='.5'; }
}
function openEditProduto(id) {
  const p = id ? products.find(x => x.id === id) : null;
  document.getElementById('editProdTitle').textContent = p ? '&#9998; Editar '+p.name : '&#10010; Novo Produto';
  document.getElementById('epName').value = p ? p.name : '';
  document.getElementById('epPrice').value = p ? p.price.toFixed(2).replace('.',',') : '';
  document.getElementById('epOldPrice').value = p && p.oldPrice ? p.oldPrice.toFixed(2).replace('.',',') : '';
  document.getElementById('epDesc').value = p ? p.desc : '';
  document.getElementById('epCat').value = p ? p.cat : 'burguer';
  document.getElementById('epEmoji').value = p ? p.emoji : '&#127828;';
  document.getElementById('epVendas').value = p ? p.vendas : '0';
  document.getElementById('epIngredients').value = p ? p.ingredients.join(', ') : '';
  document.getElementById('epDestaque').checked = p ? p.destaque : false;
  document.getElementById('epDisponivel').checked = p ? p.disponivel : true;
  document.getElementById('epAddons').value = p && p.addons && p.addons.length ? p.addons.map(a => a.name+','+a.price).join('\n') : '';
  if (p && p.image) {
    document.getElementById('epImagePreviewImg').src = p.image;
    document.getElementById('epImagePreview').style.display = 'block';
    document.getElementById('clearProdImgBtn').style.display = 'inline-block';
  } else { clearProdImage(); }
  document.querySelectorAll('input[name="epTag"]').forEach(r => r.checked = false);
  if (p && p.tag && p.tagType) {
    const found = document.querySelectorAll('input[name="epTag"]');
    found.forEach(r => { if (r.value === p.tagType+'|'+p.tag) r.checked = true; });
  }
  epAutoTag();
  document.getElementById('editProdOverlay').classList.add('open');
  document.getElementById('editProdOverlay').dataset.editId = id || '';
}
function closeEditProd() { document.getElementById('editProdOverlay').classList.remove('open'); }
function previewProdImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('epImagePreviewImg').src = ev.target.result;
    document.getElementById('epImagePreview').style.display = 'block';
    document.getElementById('clearProdImgBtn').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}
function clearProdImage() {
  document.getElementById('epImageInput').value = '';
  document.getElementById('epImagePreview').style.display = 'none';
  document.getElementById('clearProdImgBtn').style.display = 'none';
}
function saveEditProduto() {
  const id = document.getElementById('editProdOverlay').dataset.editId;
  const name = document.getElementById('epName').value.trim();
  const priceStr = document.getElementById('epPrice').value.trim().replace(',','.');
  const oldPriceStr = document.getElementById('epOldPrice').value.trim().replace(',','.');
  const desc = document.getElementById('epDesc').value.trim();
  const cat = document.getElementById('epCat').value;
  const emoji = document.getElementById('epEmoji').value;
  const vendas = parseInt(document.getElementById('epVendas').value.replace(/\D/g,'')) || 0;
  const ingredients = document.getElementById('epIngredients').value.trim().split(',').map(s => s.trim()).filter(Boolean);
  const destaque = document.getElementById('epDestaque').checked;
  const disponivel = document.getElementById('epDisponivel').checked;
  const price = parseFloat(priceStr);
  const oldPrice = oldPriceStr ? parseFloat(oldPriceStr) : null;
  const addonLines = document.getElementById('epAddons').value.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const addons = addonLines.map(l => { const parts = l.split(','); return { name: parts[0].trim(), price: parseFloat((parts[1]||'0').replace(',','.')) || 0 }; }).filter(a => a.name);
  const image = document.getElementById('epImagePreviewImg').src && document.getElementById('epImagePreview').style.display !== 'none' ? document.getElementById('epImagePreviewImg').src : null;
  const tagRadio = document.querySelector('input[name="epTag"]:checked');
  let tag = '', tagType = '';
  if (tagRadio && tagRadio.value) {
    const parts = tagRadio.value.split('|');
    tagType = parts[0]; tag = parts[1];
  }
  if (oldPrice && (!tagRadio || !tagRadio.value)) { tag = 'Promoção'; tagType = 'promo'; }
  if (!name || !price) { alert('Preencha nome e preço!'); return; }
  if (!disponivel) { tag = 'Indisponível'; tagType = 'soldout'; }
  if (id) {
    const idx = products.findIndex(x => x.id == id);
    if (idx > -1) {
      products[idx] = { ...products[idx], name, desc, price, oldPrice, cat, emoji, image, vendas, ingredients, addons, disponivel, destaque, tag, tagType };
    }
  } else {
    const newId = Math.max(...products.map(p => p.id)) + 1;
    products.push({ id: newId, name, desc, price, oldPrice, cat, emoji, image, vendas, ingredients, addons, disponivel, destaque, tag, tagType });
  }
  closeEditProd();
  const activeCat = document.querySelector('.cat-item.active');
  renderProducts(activeCat ? activeCat.dataset.cat : 'all');
  renderSortableProducts();
}
function addPayment() {
  const nome = prompt('Nome da forma de pagamento (ex: PicPay):');
  if (!nome) return;
  const taxa = prompt('Taxa (% ou fixa, ex: 2,99%):') || '0%';
  const tbody = document.getElementById('paymentsTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><strong>${nome}</strong></td><td>&#128179;</td><td>${taxa}</td><td><span class="toggle-switch active" onclick="this.classList.toggle('active')"><span class="knob"></span></span></td><td><button class="action-btn">&#9998;</button></td>`;
  tbody.appendChild(tr);
}
function addBairro() {
  const nome = prompt('Nome do bairro:');
  if (!nome) return;
  const taxa = prompt('Taxa de entrega (R$):');
  const tempo = prompt('Tempo médio (ex: 20-30 min):');
  const tbody = document.getElementById('bairrosTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><strong>${nome}</strong></td><td>R$ ${parseFloat(taxa||0).toFixed(2)}</td><td>${tempo||'30 min'}</td><td>R$ 25,00</td><td><span class="status-badge active"><span class="dot"></span>Ativo</span></td><td><button class="action-btn">&#9998;</button> <button class="action-btn">&#128465;</button></td>`;
  tbody.appendChild(tr);
}
function addCupom() {
  const codigo = prompt('Código do cupom:');
  if (!codigo) return;
  const tipo = prompt('Tipo (Percentual, Valor Fixo, Frete Grátis):');
  const valor = prompt('Valor:');
  const tbody = document.getElementById('cuponsTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><strong style="font-family:monospace;">${codigo.toUpperCase()}</strong></td><td>${tipo||'Percentual'}</td><td>${valor||'10%'}</td><td>R$ 30,00</td><td>0/50</td><td>31/12/26</td><td><span class="status-badge active"><span class="dot"></span>Ativo</span></td><td><button class="action-btn">&#9998;</button> <button class="action-btn">&#128465;</button></td>`;
  tbody.appendChild(tr);
}

// ===== ORDER EDIT (ADMIN) =====
let editingOrderId = null;
function openEditOrder(num, cliente, itens, total) {
  editingOrderId = num;
  document.getElementById('editOrderNum').textContent = '#'+num;
  document.getElementById('editOrderInfo').innerHTML = '<strong>Cliente:</strong> '+cliente+'<br><strong>Itens:</strong> '+itens+'<br><strong>Total:</strong> '+total;
  document.getElementById('editOrderStatus').value = '';
  document.getElementById('editOrderOverlay').classList.add('open');
}
function closeEditOrder() { document.getElementById('editOrderOverlay').classList.remove('open'); }
function saveEditOrder() {
  const status = document.getElementById('editOrderStatus').value;
  if (status) {
    const rows = document.querySelectorAll('#apage-pedidos table tbody tr');
    for (const row of rows) {
      if (row.querySelector('td:first-child').textContent.trim() === '#'+editingOrderId) {
        const badge = row.querySelector('.status-badge');
        if (badge) {
          badge.className = 'status-badge ' + ({'Recebido':'received','Confirmado':'received','Preparando':'preparing','Saiu para Entrega':'shipped','Entregue':'delivered','Cancelado':'inactive'}[status]||'received');
          badge.innerHTML = '<span class="dot"></span>'+status;
        }
        break;
      }
    }
  }
  closeEditOrder();
}

// ===== INIT =====
document.getElementById('chkCep').addEventListener('input', function(e) {
  let v = e.target.value.replace(/\D/g,'');
  if (v.length > 5) v = v.slice(0,5)+'-'+v.slice(5);
  e.target.value = v;
});
document.getElementById('couponInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') applyCoupon();
});
document.getElementById('cartSidebar').addEventListener('click', function(e) { e.stopPropagation(); });

document.querySelector('.sidebar-nav').addEventListener('click', function(e) {
  const btn = e.target.closest('button[data-apage]');
  if (btn) switchAdminPage(btn.dataset.apage, btn);
});

checkUser();
drawAdminCharts();