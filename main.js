let menu = [];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

let wallet = localStorage.getItem('wallet') || 200;
if (isNaN(wallet)) {
    wallet = 200;
    localStorage.setItem('wallet', wallet);
}

const main_div = document.getElementById("app");

const walletDivElem = document.createElement('div');
walletDivElem.id = 'wallet-container';
main_div.insertBefore(walletDivElem, main_div.firstChild);

const menuDivElem = document.createElement('div');
menuDivElem.id = 'menu';
main_div.appendChild(menuDivElem);

const cartDivElem = document.createElement('div');
cartDivElem.id = 'cart';
main_div.appendChild(cartDivElem);

const chartDivElem = document.createElement('div');
chartDivElem.id = 'chart';
main_div.appendChild(chartDivElem);

const orderDivElem = document.createElement('div');
orderDivElem.id = 'orders';
main_div.appendChild(orderDivElem);

const menu_div = document.getElementById("menu");
const cart_div = document.getElementById("cart");
const chart_div = document.getElementById("chart");
const order_div = document.getElementById("orders");

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
}
function saveWallet() {
    localStorage.setItem('wallet', wallet);
}

function showWallet() {
    walletDivElem.innerHTML = `<span class="wallet-label">Portefeuille :</span> <span class="wallet-amount">${wallet} €</span>`;
}


async function loadMenu() {
    try {
        const response = await fetch('https://keligmartin.github.io/api/menu.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement du menu');
        }
        menu = await response.json();
        showMenu();
    } catch (error) {
        menu_div.innerHTML = '<p>Impossible de charger le menu.</p>';
        showToast(error.message);
        throw new Error(error.message);
    }
}

function showMenu() {
    menu_div.innerHTML = "";
    for (let i = 0; i < menu.length; i++) {
        menu_div.innerHTML += `
            <div class="menu-card">
                <img src="${menu[i].image}" alt="${menu[i].name}">
                <h3>${menu[i].name}</h3>
                <p>${menu[i].price}€</p>
                <button class="ajouter" id="${menu[i].id}">Ajouter</button>
            </div>
        `;
    }
    const product_buttons = document.querySelectorAll('.ajouter');
    product_buttons.forEach(button => {
        button.addEventListener('click', function() {
            addProductToCart(Number(this.id));
        });
    });
    showCart();
}

async function showCart() {
    cart_div.innerHTML = '<h2>Panier</h2>';
    if (cart.length === 0) {
        cart_div.innerHTML += '<p>Votre panier est vide.</p>';
        return;
    }
    let total = 0;
    cart_div.innerHTML += '<ul class="cart-list">';
    for (let i = 0; i < cart.length; i++) {
        cart_div.innerHTML += `
            <li class="cart-item">
                <span>x<input type="number" min="1" value="${cart[i]['quantity']}" class="cart-qty-input" onchange="updateCartQuantity(${i}, this.value)"></span>
                <span class="cart-product">${cart[i]['product'].name}</span>
                <span class="cart-price">${cart[i]['product'].price}€</span>
            </li>
        `;
        total += cart[i]['product'].price * cart[i]['quantity'];
    }
    cart_div.innerHTML += '</ul>';
    cart_div.innerHTML += `<p class="cart-total">Total: ${total}€</p>`;
    cart_div.innerHTML += `<button id="commander" class="cart-btn">Commander</button>`;

    const order_button = document.getElementById('commander');
    order_button.addEventListener('click', function() {
        commander();
    });

    display_order_chart();
}

function showOrders() {
    order_div.innerHTML = '<h2>Commandes</h2>';
    if (orders.length === 0) {
        order_div.innerHTML += '<p>Aucune commande n\'a été trouvée.</p>';
        return;
    }
    order_div.innerHTML += '<ul class="order-list">';
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].status === "recu" || orders[i].status === "en préparation") {
            order_div.innerHTML += `<li class="order-item">${orders[i].total}€ - ${orders[i].status} <button class="cancel-order" data-index="${i}">Annuler</button></li>`;
        }else{
            order_div.innerHTML += `<li class="order-item">${orders[i].total}€ - ${orders[i].status}</li>`;
        }
    }
    order_div.innerHTML += '</ul>';
    const cancelButtons = document.querySelectorAll('.cancel-order');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.getAttribute('data-index');
            if (idx === null) {
                throw new Error("L'index de la commande n'a pas été trouvée");
            }
            if (isNaN(Number(idx))) {
                throw new Error("L'index de la commande n'est pas un nombre");
            }
            orders.splice(idx, 1);
            saveOrders();
            showOrders();
        });
    });
}

function addProductToCart(id) {
    if (!id){
        showToast("L'id du produit n'a pas été trouvée");
        throw new Error("L'id du produit n'a pas été trouvée");
    }

    const product = menu.find(product => product.id === id);
    if (product) {
        cart.push({"product": product, "quantity": 1});
        saveCart();
        showCart();
    }
}

function commander() {
    if (cart.length === 0) {
        throw new Error("Votre panier est vide");
    }

    if (orders.length > 4) {
        throw new Error("Vous avez atteint le nombre maximum de commandes");
    }

    const modal = document.createElement('div');
    modal.id = 'modal';

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tva = total * 0.2;
    const total_ht = total - tva;

    if (total > wallet) {
        showToast("Vous n'avez pas assez d'argent");
        throw new Error("Vous n'avez pas assez d'argent");
    }

    let modal_html = "<div style='background:#fff;padding:20px;border-radius:8px;text-align:left;'>";
    modal_html += "<h3>Récapitulatif</h3>";
    modal_html += "<ul style='list-style:none;padding:0;'>";
    modal_html += cart.map(item => `<li>${item.product.name} x${item.quantity} - ${item.product.price}€</li>`).join('');
    modal_html += "</ul>";
    modal_html += `<p>Total HT: <b>${total_ht}€</b></p>`;
    modal_html += `<p>TVA: <b>${tva}€</b></p>`;
    modal_html += `<p>Total TTC: <b>${total}€</b></p>`;
    modal_html += "<button id='cancel-order'>Annuler</button> <button id='validate-order'>Valider</button>";
    modal_html += "</div>";

    modal.innerHTML = modal_html;
    document.body.appendChild(modal);

    document.getElementById('cancel-order').onclick = () => modal.remove();
    document.getElementById('validate-order').onclick = () => {
        showToast('Commande validée !');
        orders.push({"products":cart,"total": total,"status": "en préparation"});
        wallet -= total;
        saveWallet();
        showWallet();
        saveOrders();
        cart = [];
        saveCart();
        showCart();
        modal.remove();
        display_order_chart();
        showOrders();
        fakePostCommand();
    };
}

async function fakePostCommand() {
    if (orders.length === 0){
        showToast("Aucune commande n'a été trouvée");
        throw new Error("Aucune commande n'a été trouvée");
    }
    const order = orders[orders.length - 1];
    const statuses = ["en préparation", "livraison en cours", "livrée"];
    for (let i = 1; i < statuses.length; i++) {
        await new Promise(res => setTimeout(res, 5000));
        order.status = statuses[i];
        showOrders();
        saveOrders();
    }
    await new Promise(res => setTimeout(res, 5000));
    orders.pop();
    saveOrders();
    showOrders();
}

function display_order_chart() {
    chart_div.innerHTML = '';
    if (!cart.length) return;

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-card';

    const chartTitle = document.createElement('h2');
    chartTitle.textContent = 'Répartition des produits dans le panier';
    chartContainer.appendChild(chartTitle);

    const productCounts = {};
    cart.forEach(item => {
        const name = item.product.name;
        productCounts[name] = (productCounts[name] || 0) + item.quantity;
    });
    const labels = Object.keys(productCounts);
    const data = Object.values(productCounts);

    const images = labels.map(label => {
        const found = menu.find(item => item.name === label);
        return found ? found.image : null;
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'pie-chart';
    canvas.width = 300;
    canvas.height = 300;
    chartContainer.appendChild(canvas);
    chart_div.appendChild(chartContainer);

    function renderChart() {
        if (window.pieChartInstance) {
            window.pieChartInstance.destroy();
        }
        window.pieChartInstance = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#1a73e8', '#e84545', '#fbbc05', '#34a853', '#5ec6fa', '#a142f4', '#f44292', '#ffa600', '#00bfae', '#ff7043'
                    ],
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 18, padding: 18 }
                    }
                }
            }
        });
    }
    renderChart();
}

window.updateCartQuantity = function(index, value) {
    console.log(index)
    console.log(value)
    if (!value) {
        showToast("La valeur n'a pas été trouvée");
        throw new Error("La valeur n'a pas été trouvée");
    }
    if (isNaN(value) || value < 1) {
        showToast("La valeur n'est pas un nombre ou est inférieur à 1");
        throw new Error("La valeur n'est pas un nombre ou est inférieur à 1");
    }
    value = parseInt(value);
    if (isNaN(value) || value < 1) value = 1;
    cart[index]['quantity'] = value;
    saveCart();
    showCart();
};

function showToast(message) {
    const oldToast = document.getElementById('toast-notif');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-notif';
    toast.textContent = message;
    toast.className = 'toast';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2500);
}


loadMenu();
showCart();
showOrders();
showWallet();
