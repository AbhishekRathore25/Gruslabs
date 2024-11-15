import { LightningElement, wire, track } from 'lwc';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import CART_MESSAGE_CHANNEL from '@salesforce/messageChannel/cartMessageChannel__c';
import createOrder from '@salesforce/apex/ProductController.createOrder';
import createOrderLineItems from '@salesforce/apex/ProductController.createOrderLineItems';

export default class NavbarWithCart extends LightningElement {
    @track cartItems = [];
    @track isCartModalOpen = false;
    @track isCheckoutFormOpen = false;
    @track isLoggedIn = !!USER_ID;
    @track userName;
    @track cartTotal = 0;
    @track isDropdownOpen = false;
  
    @track notes = '';
    @track phone = '';
    @track city = '';
    @track street = '';
    @track postalCode = '';
    @track contactId = USER_ID;
    @track currentDate = new Date().toISOString().split('T')[0];

    @wire(MessageContext) messageContext;

    // Fetching the user info
    @wire(getRecord, { recordId: USER_ID, fields: ['User.Name'] })
    userInfo({ error, data }) {
        if (data) {
            this.userName = data.fields.Name.value;
            this.isLoggedIn = true;
        } else if (error) {
            this.isLoggedIn = false;
        }
    }

    connectedCallback() {
        this.subscribeToCartUpdates();  
    }

    // Subscribing to cart updates via LMS
    subscribeToCartUpdates() {
        subscribe(this.messageContext, CART_MESSAGE_CHANNEL, (message) => {
            this.cartItems = message.cartItems || [];
            this.updateCartTotal();
        });
    }

    updateCartTotal() {
        this.cartTotal = this.cartItems.reduce((total, item) => total + item.totalPrice, 0);
    }

    // Open and close the cart modal
    openCartModal() {
        if (this.isLoggedIn) {
            this.isCartModalOpen = true;
        } else {
            window.location.href = 'https://gruslabs6-dev-ed.develop.my.site.com/grusdelights/login';
        }
    }
    closeCartModal() {
        this.isCartModalOpen = false;
    }

    // Open and close the checkout form
    openCheckoutForm() {
        this.isCheckoutFormOpen = true;
    }
    closeCheckoutForm() {
        this.isCheckoutFormOpen = false;
    }

    // Handle form input changes
    handleInputChange(event) {
        const field = event.target.name;
        if (field === 'notes') {
            this.notes = event.target.value;
        } else if (field === 'phone') {
            this.phone = event.target.value;
        } else if (field === 'city') {
            this.city = event.target.value;
        } else if (field === 'street') {
            this.street = event.target.value;
        } else if (field === 'postalCode') {
            this.postalCode = event.target.value;
        }
    }

    handleSubmit() {
        if (this.cartItems.length === 0) {
            this.handleAlert('Your cart is empty. Please add items before placing an order.');
            return;
        }
    
        if (this.phone && (this.city || this.street) && this.cartTotal > 0) {
            if (window.confirm('Are you sure you want to place this order?')) {
                createOrder({
                    notes: this.notes,
                    phone: this.phone,
                    totalAmount: this.cartTotal,
                    orderDate: this.currentDate,
                    city: this.city,
                    street: this.street,
                    postalCode: this.postalCode
                })
                .then(orderId => {
                    this.handleAlert('Order created successfully! Your order ID is ' + orderId);
                    
                    // Map cart items to line items, ensuring we access properties correctly
                    const cartItemsForLineItems = this.cartItems.map(item => {
                        // Access properties directly without worrying about Proxy
                        return {
                            productId: item.Id,
                            unitPrice: item.abhisheksf__Price__c,
                            quantity: item.quantity
                        };
                    });
    
                    console.log('Mapped Cart Items:', cartItemsForLineItems); // Log for debugging
                    
                    // Proceed with creating order line items
                    return createOrderLineItems({ orderId: orderId, cartItems: cartItemsForLineItems });
                })
                .then(() => {
                    this.handleAlert('Order line items created successfully!');
                    this.clearCart();
                    this.closeCheckoutForm();
                })
                .catch(error => {
                    // Log the error without affecting the flow
                    console.error("Error:", error);  
                    this.handleAlert('Error creating order: ' + error.body.message);
                });
            }
        } else {
            this.handleAlert('Error: Please fill at least the phone number and either the city or street.');
        }
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    // Helper method for alerts
    handleAlert(message) {
        window.alert(message);
    }

    // Clear the cart
    clearCart() {
        this.cartItems = [];
        this.updateCartTotal();
        publish(this.messageContext, CART_MESSAGE_CHANNEL, { cartItems: this.cartItems });
    }

    // Handle cart item removal
    handleRemoveFromCart(event) {
        const itemId = event.target.getAttribute('data-id');
        this.cartItems = this.cartItems.filter(item => item.Id !== itemId);
        this.updateCartTotal();
        publish(this.messageContext, CART_MESSAGE_CHANNEL, { cartItems: this.cartItems });
    }

    // Logout handler
    handleLogout() {
        this.isLoggedIn = false;
        this.userName = '';
        window.location.href = 'https://gruslabs6-dev-ed.develop.my.site.com/grusdelights/#';
    }

    // Render cart images
    renderedCallback() {
        this.cartItems.forEach((item) => {
            const imageContainer = this.template.querySelector(`div[data-id="${item.Id}"]`);
            if (imageContainer) {
                imageContainer.innerHTML = item.abhisheksf__Image__c;
            }
        });
    }
}
