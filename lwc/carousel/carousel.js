import { LightningElement, track } from 'lwc';

export default class CarouselComponent extends LightningElement {
    @track images = [
        {
            id: 1,
            url: 'https://i.ibb.co/NtM8bnW/food-4.png',
            caption: 'Abhishek',
            activeClass: 'carousel-item active'
        },
        {
            id: 2,
            url: 'https://i.ibb.co/x1BGzgg/food-18.png',
            caption: 'Second Slide',
            activeClass: 'carousel-item'
        },
        {
            id: 3,
            url: 'https://i.ibb.co/86nyRM4/food-23.png',
            caption: 'Third Slide',
            activeClass: 'carousel-item'
        }
    ];

    connectedCallback() {
        console.log('Images:', this.images); // Debugging to check if data is correct
        this.startCarousel();
    }

    startCarousel() {
        let index = 0;
        setInterval(() => {
            this.images = this.images.map((img, i) => ({
                ...img,
                activeClass: i === index ? 'carousel-item active' : 'carousel-item'
            }));
            index = (index + 1) % this.images.length;
        }, 3000);
    }
}