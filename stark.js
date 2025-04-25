// public/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const productDetailsCard = document.getElementById('productDetailsCard');
    const productDetails = document.getElementById('productDetails');
    const viewCartBtn = document.getElementById('viewCartBtn');
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const completePaymentBtn = document.getElementById('completePaymentBtn');
    const orderConfirmationDetails = document.getElementById('orderConfirmationDetails');
    
    // Modali Bootstrap
    let cartModal, paymentModal, orderConfirmationModal;

    // Inizializza i modali se gli elementi esistono nel DOM
    if (document.getElementById('cartModal')) {
        cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    }
    if (document.getElementById('paymentModal')) {
        paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    }
    if (document.getElementById('orderConfirmationModal')) {
        orderConfirmationModal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
    }
    
    // Stato dell'applicazione
    let cart = [];
    let currentProductId = null;
    
    // Evento invio messaggio
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Gestione carrello
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', showCart);
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', showPaymentModal);
    }
    if (completePaymentBtn) {
        completePaymentBtn.addEventListener('click', processPayment);
    }
    
    // Funzione per inviare messaggio all'assistente
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Aggiungi messaggio utente alla chat
        appendMessage(message, 'user');
        userInput.value = '';
        
        // Mostra indicatore caricamento
        appendLoadingIndicator();
        
        console.log('Inviando messaggio:', message);
        
        // Invia richiesta all'API
        fetch('/api/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Risposta dal server:', data);
            
            // Rimuovi indicatore caricamento
            removeLoadingIndicator();
            
            // Gestisci risposta in base all'azione
            handleAssistantResponse(data);
        })
        .catch(error => {
            console.error('Errore nella richiesta:', error);
            removeLoadingIndicator();
            appendMessage('Mi dispiace, c\'è stato un errore nella tua richiesta. Riprova.', 'assistant');
            showNotification('Errore di comunicazione con il server', 'danger');
        });
    }
    
    // Gestisce la risposta dell'assistente
    function handleAssistantResponse(data) {
        console.log('Elaborazione risposta:', data);
        
        // Se c'è un errore specifico, mostralo
        if (data.error) {
            appendMessage(`Si è verificato un errore: ${data.error}`, 'assistant');
            return;
        }
        
        let responseMessage = '';
        
        // In base all'azione, formatta una risposta appropriata
        if (data.action && data.result) {
            switch (data.action.action) {
                case 'purchase':
                    if (data.result.success) {
                        const product = data.result.product;
                        const quantity = data.action.quantity || 1;
                        
                        responseMessage = `Ho trovato "${product.title}". Vuoi aggiungere ${quantity} al carrello? Prezzo: €${product.price} + €0.50 di commissione per il servizio.`;
                        
                        // Aggiungi pulsante per aggiungere al carrello
                        setTimeout(() => {
                            const lastMessage = document.querySelector('.assistant-message:last-child');
                            if (lastMessage) {
                                const addCartBtn = document.createElement('button');
                                addCartBtn.className = 'btn btn-primary btn-sm mt-2';
                                addCartBtn.textContent = 'Aggiungi al carrello';
                                addCartBtn.addEventListener('click', () => {
                                    addToCart(product, quantity);
                                    appendMessage('Prodotto aggiunto al carrello!', 'assistant');
                                });
                                
                                lastMessage.appendChild(document.createElement('br'));
                                lastMessage.appendChild(addCartBtn);
                            }
                        }, 500);
                        
                        // Mostra dettagli prodotto
                        displayProductDetails(product);
                    } else {
                        responseMessage = 'Mi dispiace, non sono riuscito a trovare questo prodotto.';
                    }
                    break;
                    
                case 'info':
                    if (data.result.success) {
                        const product = data.result.product;
                        responseMessage = `Ecco le informazioni sul prodotto "${product.title}":\nPrezzo: €${product.price}\nCategoria: ${product.category}\nValutazione: ${product.rating?.rate || 'N/A'}/5 (${product.rating?.count || 0} recensioni)`;
                        
                        // Mostra dettagli prodotto
                        displayProductDetails(product);
                    } else {
                        responseMessage = 'Mi dispiace, non sono riuscito a trovare questo prodotto.';
                    }
                    break;
                    
                case 'search':
                    if (data.result.success && data.result.products) {
                        const products = data.result.products;
                        if (products.length > 0) {
                            responseMessage = `Ho trovato ${products.length} prodotti che potrebbero interessarti. Visualizzali nella sezione dei risultati.`;
                            displaySearchResults(products);
                        } else {
                            responseMessage = 'Mi dispiace, non ho trovato prodotti corrispondenti alla tua ricerca.';
                        }
                    } else {
                        responseMessage = 'Mi dispiace, c\'è stato un problema con la ricerca.';
                    }
                    break;
                    
                default:
                    responseMessage = 'Non ho capito bene la tua richiesta. Puoi chiedere informazioni su un prodotto, cercarne uno specifico o effettuare un acquisto.';
            }
        } else if (data.parseError) {
            // Caso in cui c'è stato un errore di parsing della risposta
            responseMessage = 'Ho avuto difficoltà a interpretare la tua richiesta. Puoi essere più specifico? Puoi cercare prodotti, chiedere informazioni o acquistare un articolo.';
            
            // Se abbiamo comunque dei prodotti da mostrare
            if (data.result && data.result.products && data.result.products.length > 0) {
                responseMessage += ' Nel frattempo, ecco alcuni prodotti che potrebbero interessarti:';
                displaySearchResults(data.result.products);
            }
        } else {
            responseMessage = 'Non ho capito bene la tua richiesta. Puoi chiedere informazioni su un prodotto, cercarne uno specifico o effettuare un acquisto.';
        }
        
        appendMessage(responseMessage, 'assistant');
    }
    
    // Aggiunge un messaggio alla chat
    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Sostituisci \n con <br> per preservare gli a capo
        messageDiv.innerHTML = message.replace(/\n/g, '<br>');
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Mostra indicatore di caricamento
    function appendLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant-message loading';
        loadingDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Elaboro la tua richiesta...';
        loadingDiv.id = 'loadingIndicator';
        chatContainer.appendChild(loadingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Rimuove indicatore di caricamento
    function removeLoadingIndicator() {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    // Mostra risultati di ricerca
    function displaySearchResults(products) {
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        if (products.length === 0) {
            resultsContainer.innerHTML = '<p class="text-center text-muted">Nessun risultato trovato</p>';
            return;
        }
        
        const row = document.createElement('div');
        row.className = 'row g-3';
        
        products.forEach(product => {
            const col = document.createElement('div');
            col.className = 'col-12';
            
            const card = document.createElement('div');
            card.className = 'card product-card';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-text text-truncate">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${product.category}</span>
                        <strong>€${product.price}</strong>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                displayProductDetails(product);
            });
            
            col.appendChild(card);
            row.appendChild(col);
        });
        
        resultsContainer.appendChild(row);
    }
    
    // Mostra dettagli prodotto
    function displayProductDetails(product) {
        if (!productDetailsCard || !productDetails) return;
        
        currentProductId = product.id;
        
        productDetails.innerHTML = `
            <h4>${product.title}</h4>
            <p>${product.description}</p>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge bg-primary">${product.category}</span>
                <strong class="fs-4">€${product.price}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span class="me-2">Valutazione:</span>
                    <span class="text-warning">
                        ${'★'.repeat(Math.round(product.rating?.rate || 0))}${'☆'.repeat(5 - Math.round(product.rating?.rate || 0))}
                    </span>
                    <small>(${product.rating?.count || 0})</small>
                </div>
                <div>
                    <div class="input-group input-group-sm" style="width: 120px;">
                        <button class="btn btn-outline-secondary" type="button" id="decreaseQuantity">-</button>
                        <input type="text" class="form-control text-center" id="productQuantity" value="1">
                        <button class="btn btn-outline-secondary" type="button" id="increaseQuantity">+</button>
                    </div>
                </div>
            </div>
            <button class="btn btn-success w-100" id="addToCartBtn">
                Aggiungi al carrello + €0.50
            </button>
        `;
        
        productDetailsCard.style.display = 'block';
        
        // Event listeners per i pulsanti quantità
        document.getElementById('decreaseQuantity').addEventListener('click', () => {
            const quantityInput = document.getElementById('productQuantity');
            let quantity = parseInt(quantityInput.value);
            if (quantity > 1) {
                quantityInput.value = quantity - 1;
            }
        });
        
        document.getElementById('increaseQuantity').addEventListener('click', () => {
            const quantityInput = document.getElementById('productQuantity');
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = quantity + 1;
        });
        
        // Event listener per aggiungere al carrello
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('productQuantity').value);
            addToCart(product, quantity);
            appendMessage(`Ho aggiunto ${quantity} "${product.title}" al tuo carrello.`, 'assistant');
        });
    }
    
    // Aggiunge prodotto al carrello
    function addToCart(product, quantity) {
        // Cerca se il prodotto è già nel carrello
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product,
                quantity
            });
        }
        
        // Aggiorna contatore carrello
        updateCartCount();
        
        // Mostra una notifica
        showNotification(`${quantity}x ${product.title} aggiunto al carrello!`);
    }
    
    // Aggiorna contatore carrello
    function updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return;
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Rendi più visibile il pulsante del carrello se ci sono elementi
        if (viewCartBtn) {
            if (totalItems > 0) {
                viewCartBtn.classList.add('btn-primary');
                viewCartBtn.classList.remove('btn-outline-primary');
            } else {
                viewCartBtn.classList.remove('btn-primary');
                viewCartBtn.classList.add('btn-outline-primary');
            }
        }
    }
    
    // Mostra contenuto carrello
    function showCart() {
        if (!cartModal || !cartItems) return;
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center">Il tuo carrello è vuoto</p>';
            cartSubtotal.textContent = '€0.00';
            cartTotal.textContent = '€0.50';
            checkoutBtn.disabled = true;
        } else {
            // Calcola subtotale
            const subtotal = cart.reduce((total, item) => 
                total + (item.product.price * item.quantity), 0);
            
            // Mostra elementi nel carrello
            cartItems.innerHTML = '';
            const cartList = document.createElement('ul');
            cartList.className = 'list-group mb-3';
            
            cart.forEach((item, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    <div>
                        <h6 class="my-0">${item.product.title}</h6>
                        <small class="text-muted">€${item.product.price} x ${item.quantity}</small>
                    </div>
                    <span>€${(item.product.price * item.quantity).toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">×</button>
                `;
                cartList.appendChild(listItem);
            });
            
            cartItems.appendChild(cartList);
            
            // Aggiungi listener per rimuovere articoli
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    cart.splice(index, 1);
                    updateCartCount();
                    showCart(); // Aggiorna la visualizzazione del carrello
                });
            });
            
            // Aggiorna totali
            cartSubtotal.textContent = `€${subtotal.toFixed(2)}`;
            
            // Ogni transazione ha una commissione fissa di €0.50
            const serviceFee = 0.50;
            const total = subtotal + serviceFee;
            cartTotal.textContent = `€${total.toFixed(2)}`;
            
            // Abilita pulsante checkout
            checkoutBtn.disabled = false;
        }
        
        cartModal.show();
    }
    
    // Mostra la modale di pagamento
    function showPaymentModal() {
        if (!paymentModal) return;
        
        cartModal.hide();
        
        // Reset form
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.reset();
        }
        
        paymentModal.show();
    }
    
    // Processa il pagamento
    function processPayment() {
        if (!validatePaymentForm()) {
            showNotification('Completa tutti i campi del pagamento', 'danger');
            return;
        }
        
        paymentModal.hide();
        
        // Mostra spinner di caricamento per simulare elaborazione
        appendMessage('Sto elaborando il tuo pagamento...', 'assistant');
        
        // Simula una chiamata API per il checkout
        setTimeout(() => {
            // Calcola totali
            const subtotal = cart.reduce((total, item) => 
                total + (item.product.price * item.quantity), 0);
            const serviceFee = 0.50;
            const total = subtotal + serviceFee;
            
            // Crea un mock dell'ordine completato
            const order = {
                id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                items: cart.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    price: item.product.price,
                    total: item.product.price * item.quantity
                })),
                subtotal: subtotal.toFixed(2),
                serviceFee: serviceFee.toFixed(2),
                total: total.toFixed(2),
                paymentInfo: {
                    cardNumber: maskCar
                  // Mascherare il numero della carta di credito per mostrare solo le ultime 4 cifre
function maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    // Rimuove spazi e trattini
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    // Mostra solo le ultime 4 cifre
    return '*'.repeat(cleanNumber.length - 4) + cleanNumber.slice(-4);
}

// Completa la funzione processPayment che è stata interrotta
function processPayment() {
    if (!validatePaymentForm()) {
        showNotification('Completa tutti i campi del pagamento', 'danger');
        return;
    }
    
    paymentModal.hide();
    
    // Mostra spinner di caricamento per simulare elaborazione
    appendMessage('Sto elaborando il tuo pagamento...', 'assistant');
    
    // Simula una chiamata API per il checkout
    setTimeout(() => {
        // Calcola totali
        const subtotal = cart.reduce((total, item) => 
            total + (item.product.price * item.quantity), 0);
        const serviceFee = 0.50;
        const total = subtotal + serviceFee;
        
        // Crea un mock dell'ordine completato
        const order = {
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            items: cart.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.product.price,
                total: item.product.price * item.quantity
            })),
            subtotal: subtotal.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            total: total.toFixed(2),
            paymentInfo: {
                cardNumber: maskCardNumber(document.getElementById('cardNumber').value),
                cardHolder: document.getElementById('cardHolder').value,
                date: new Date().toISOString()
            }
        };
        
        // Visualizza conferma ordine
        showOrderConfirmation(order);
        
        // Pulisci il carrello
        cart = [];
        updateCartCount();
        
        // Messaggio di conferma nella chat
        appendMessage(`Grazie per il tuo ordine! L'ordine #${order.id} è stato completato con successo.`, 'assistant');
    }, 2000); // Simula 2 secondi di elaborazione
}

// Funzione per validare il form di pagamento
function validatePaymentForm() {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardHolder = document.getElementById('cardHolder').value.trim();
    const expiryDate = document.getElementById('expiryDate').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    
    // Validazione basilare
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
        return false;
    }
    
    // Validazione lunghezza carta
    if (cardNumber.replace(/[\s-]/g, '').length < 15) {
        return false;
    }
    
    // Validazione formato CVV
    if (!/^\d{3,4}$/.test(cvv)) {
        return false;
    }
    
    return true;
}

// Mostra conferma ordine
function showOrderConfirmation(order) {
    if (!orderConfirmationModal || !orderConfirmationDetails) return;
    
    // Crea una lista degli elementi acquistati
    let itemsHtml = '';
    order.items.forEach(item => {
        itemsHtml += `
            <li class="list-group-item d-flex justify-content-between">
                <div>
                    <h6 class="my-0">${item.product.title}</h6>
                    <small class="text-muted">${item.quantity}x €${item.price}</small>
                </div>
                <span>€${item.total.toFixed(2)}</span>
            </li>
        `;
    });
    
    // Aggiunge riga per la commissione di servizio
    itemsHtml += `
        <li class="list-group-item d-flex justify-content-between">
            <div>
                <h6 class="my-0">Commissione di servizio</h6>
                <small class="text-muted">Supporto e gestione ordine</small>
            </div>
            <span>€${order.serviceFee}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between bg-light">
            <div class="text-success">
                <h6 class="my-0">Totale</h6>
            </div>
            <span class="text-success"><strong>€${order.total}</strong></span>
        </li>
    `;
    
    // Informazioni pagamento
    const paymentInfo = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Informazioni pagamento</h5>
                <p class="card-text">Carta: ${order.paymentInfo.cardNumber}</p>
                <p class="card-text">Intestatario: ${order.paymentInfo.cardHolder}</p>
                <p class="card-text">Data: ${new Date(order.paymentInfo.date).toLocaleString()}</p>
            </div>
        </div>
    `;
    
    // Compila dettagli completi
    orderConfirmationDetails.innerHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading">Ordine confermato!</h4>
            <p>Il tuo ordine #${order.id} è stato elaborato con successo.</p>
        </div>
        <h5>Riepilogo ordine</h5>
        <ul class="list-group mb-3">
            ${itemsHtml}
        </ul>
        ${paymentInfo}
    `;
    
    orderConfirmationModal.show();
}

// Mostra notifica
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `toast align-items-center text-white bg-${type} border-0`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Se non esiste un container per i toast, creane uno
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.id = 'toastContainer';
        document.body.appendChild(container);
        container.appendChild(notification);
    } else {
        toastContainer.appendChild(notification);
    }
    
    const toast = new bootstrap.Toast(notification);
    toast.show();
    
    // Rimuovi il toast dopo che è stato nascosto
    notification.addEventListener('hidden.bs.toast', function() {
        notification.remove();
    });
}
