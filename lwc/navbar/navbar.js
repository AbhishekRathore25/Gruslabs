import { LightningElement, wire, track } from 'lwc';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import CART_MESSAGE_CHANNEL from '@salesforce/messageChannel/cartMessageChannel__c';
import createOrder from '@salesforce/apex/ProductController.createOrder';
import createOrderLineItems from '@salesforce/apex/ProductController.createOrderLineItems';
import LightningAlert from 'lightning/alert';

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
   discountCode = '';
    discountPercentage = 0;
    cartTotal = 100; // Example cart total
    discountedTotal = 0;

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
 applyDiscount() {
        if (this.discountCode === 'GRUS10') {
            this.discountPercentage = 10;
        } else if (this.discountCode === 'GRUS20') {
            this.discountPercentage = 20;
        } else {
            this.discountPercentage = 0;
            
         LightningAlert.open({
                message: 'The discount code you entered is invalid. Please try again.',
                theme: 'error', // Display as an error
                label: 'Invalid Discount Code' // Header for the alert
            });
           
        }

        // Calculate the discounted total
        this.discountedTotal = this.cartTotal * (1 - this.discountPercentage / 100);
    }

    handleDiscountCodeChange(event) {
        this.discountCode = event.target.value;
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

  async handleSubmit() {
    if (this.cartItems.length === 0) {
        await LightningAlert.open({
            message: 'Your cart is empty. Please add items before placing an order.',
            theme: 'error',
            label: 'Empty Cart'
        });
        return;
    }

    if (this.phone && (this.city || this.street) && this.cartTotal > 0) {
        const totalAmount = this.discountPercentage > 0 ? this.discountedTotal : this.cartTotal;

        createOrder({
            notes: this.notes,
            phone: this.phone,
            totalAmount: totalAmount,
            orderDate: this.currentDate,
            city: this.city,
            street: this.street,
            postalCode: this.postalCode
        })
            .then(orderId => {
                return LightningAlert.open({
                    message: 'Order created successfully! Your order ID is ' + orderId,
                    theme: 'success',
                    label: 'Order Created'
                }).then(() => orderId); // Pass orderId for the next chain in promise
            })
            .then(orderId => {
                const cartItemsForLineItems = this.cartItems.map(item => ({
                    productId: item.Id,
                    unitPrice: item.abhisheksf__Price__c,
                    quantity: item.quantity
                }));
                
                console.log('Mapped Cart Items:', cartItemsForLineItems);

                return createOrderLineItems({ orderId: orderId, cartItems: cartItemsForLineItems });
            })
            .then(() => {
                
                      this.clearCart();
                    this.closeCheckoutForm();
                    this.closeCartModal();
                   window.location.reload();
            })
            .catch(error => {
                console.error("Error:", error);  
                LightningAlert.open({
                    message: 'Error creating order: ' + error.body.message,
                    theme: 'error',
                    label: 'Order Creation Error'
                });
            });
    } else {
        LightningAlert.open({
            message: 'Error: Please fill at least the phone number and either the city or street.',
            theme: 'error',
            label: 'Please Fill Required Fields'
        });
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
