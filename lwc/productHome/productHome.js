import { LightningElement, wire, track } from 'lwc';
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import USER_ID from '@salesforce/user/Id';
import CART_MESSAGE_CHANNEL from '@salesforce/messageChannel/cartMessageChannel__c';
import getProducts from '@salesforce/apex/ProductController.getProducts';

export default class ProductHome extends LightningElement {
    @track products;
    @track error;
    @track selectedProduct;
    @track isAddToCartModalOpen = false;
    @track quantity = 1;
    @track isLoggedIn = !!USER_ID;
    @track cartItems = [];
    imagesRendered = false;

    @wire(MessageContext) messageContext;

    @wire(getProducts)
    wiredProducts({ error, data }) {
        if (data) {
            this.products = data;
            this.imagesRendered = false;
        } else if (error) {
            this.error = error;
            this.products = undefined;
        }
    }

    connectedCallback() {
        this.subscribeToCartUpdates();
    }

    subscribeToCartUpdates() {
        subscribe(this.messageContext, CART_MESSAGE_CHANNEL, (message) => {
            this.cartItems = message.cartItems || [];
            console.log('Updated Cart Items in ProductHome:', JSON.parse(JSON.stringify(this.cartItems)));
        });
    }

    renderedCallback() {
        if (!this.imagesRendered && this.products) {
            this.renderRichTextImages();
            this.imagesRendered = true;
        }
    }

    handleAddToCartDirectly(event) {
        if (!this.isLoggedIn) {
            alert('Please log in to add items to your cart.');
            return;
        }

        const productId = event.target.getAttribute('data-id');
        this.selectedProduct = this.products.find(product => product.Id === productId);
        this.isAddToCartModalOpen = true;
        this.quantity = 1;

        setTimeout(() => {
            const modalImageContainer = this.template.querySelector('.modal .rich-text[data-id]');
            if (modalImageContainer && this.selectedProduct) {
                modalImageContainer.innerHTML = this.selectedProduct.abhisheksf__Image__c || '';
            }
        }, 0);
    }

    renderRichTextImages() {
        setTimeout(() => {
            if (this.products) {
                this.products.forEach(product => {
                    const richTextContainer = this.template.querySelector(`div[data-id="${product.Id}"]`);
                    if (richTextContainer) {
                        richTextContainer.innerHTML = product.abhisheksf__Image__c;
                    }
                });
            }
        }, 0);
    }

    handleAddToCart() {
        this.addItemToCart(this.selectedProduct, this.quantity);
        this.closeModal();
    }

    addItemToCart(product, quantity) {
        const totalPrice = product.abhisheksf__Price__c * quantity;
        const existingCartItem = this.cartItems.find(item => item.Id === product.Id);
        let newCartItems;

        if (existingCartItem) {
            newCartItems = this.cartItems.map(item => {
                if (item.Id === product.Id) {
                    return {
                        ...item,
                        quantity: item.quantity + quantity,
                        totalPrice: item.totalPrice + totalPrice
                    };
                }
                return item;
            });
        } else {
            newCartItems = [
                ...this.cartItems,
                {
                    Id: product.Id,
                    Name: product.Name,
                    abhisheksf__Price__c: product.abhisheksf__Price__c,
                    abhisheksf__Image__c: product.abhisheksf__Image__c,
                    quantity: quantity,
                    totalPrice: totalPrice
                }
            ];
        }

        publish(this.messageContext, CART_MESSAGE_CHANNEL, { cartItems: newCartItems });
        this.cartItems = newCartItems;
    }

    closeModal() {
        this.selectedProduct = null;
        this.isAddToCartModalOpen = false;
    }

    handleQuantityChange(event) {
        const newQuantity = parseInt(event.target.value, 10);
        if (newQuantity > this.selectedProduct.abhisheksf__Quantity__c) {
            alert(`The quantity cannot exceed ${this.selectedProduct.abhisheksf__Quantity__c}`);
            this.quantity = this.selectedProduct.abhisheksf__Quantity__c;
        } else {
            this.quantity = newQuantity;
        }
    }
}