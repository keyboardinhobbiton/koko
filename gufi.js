/* styles.css */

/* Stile generale */
body {
    background-color: #f8f9fa;
}

/* Chat container */
.chat-container {
    height: 400px;
    overflow-y: auto;
    padding: 1rem;
}

/* Stile messaggi */
.message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    max-width: 80%;
    word-wrap: break-word;
}

.user-message {
    background-color: #e9ecef;
    margin-left: auto;
    border-bottom-right-radius: 0;
}

.assistant-message {
    background-color: #d1e7ff;
    margin-right: auto;
    border-bottom-left-radius: 0;
}

/* Loading indicator */
.loading {
    opacity: 0.7;
}

/* Schede prodotto */
.product-card {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Dettagli prodotto */
#productDetailsCard {
    margin-bottom: 1rem;
}

/* Toast notifications */
.toast-container {
    z-index: 9999;
}

/* Stile per input di pagamento */
.payment-form input.form-control {
    font-family: monospace;
}

/* Stile bottoni quantità */
.quantity-btn {
    width: 36px;
}

/* Animazioni */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.3s;
}

/* Responsive adattamenti */
@media (max-width: 768px) {
    .chat-container {
        height: 300px;
    }
    
    .message {
        max-width: 90%;
    }
}
