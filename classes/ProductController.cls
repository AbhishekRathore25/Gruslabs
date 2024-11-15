public without sharing class ProductController {

    // Method to retrieve all products
    @AuraEnabled(cacheable=true)
    public static List<abhisheksf__Custom_product__c> getProducts() {
        return [SELECT Name, abhisheksf__Image__c, abhisheksf__Image_url__c,
                abhisheksf__Price__c, abhisheksf__Quantity__c, abhisheksf__Product_Description__c, abhisheksf__Active__c
                FROM abhisheksf__Custom_product__c];
    }

    // Method to create an order
    @AuraEnabled
    public static Id createOrder(String notes, String phone, Decimal totalAmount, Date orderDate, 
                                 String city, String street, String postalCode) {
        try {
            // Get the logged-in user's Contact
            User loggedInUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            Id contactId = loggedInUser.ContactId;

            // Instantiate a new order record
            abhisheksf__Custom_Orders__c newOrder = new abhisheksf__Custom_Orders__c(
                abhisheksf__Notes__c = notes,
                abhisheksf__Phone__c = phone,
                abhisheksf__Total_Amount__c = totalAmount,
                abhisheksf__Order_Date__c = orderDate,
                abhisheksf__Order_Status__c = 'Preparing',
                abhisheksf__Shipping_Address__Street__s = street,
                abhisheksf__Shipping_Address__City__s = city,
                abhisheksf__Shipping_Address__PostalCode__s = postalCode,
                abhisheksf__Contact__c = contactId
            );

            // Insert the new order record
            insert newOrder;

            // Return the Id of the newly created order
            return newOrder.Id;

        } catch (DmlException e) {
            throw new AuraHandledException('Error creating order: ' + e.getMessage());
        }
    }

    // Method to create order line items
    @AuraEnabled
    public static void createOrderLineItems(Id orderId, List<Map<String, Object>> cartItems) {
        try {
            User loggedInUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            Id contactId = loggedInUser.ContactId;

            // List to hold the order line items to be inserted
            List<abhisheksf__Custom_Order_Line_Item__c> lineItems = new List<abhisheksf__Custom_Order_Line_Item__c>();
    
            // Loop through cart items and create a line item for each
            for (Map<String, Object> cartItem : cartItems) {
                abhisheksf__Custom_Order_Line_Item__c lineItem = new abhisheksf__Custom_Order_Line_Item__c(
    abhisheksf__Custom_product__c = (Id) cartItem.get('productId'),
    abhisheksf__Order__c = orderId,
    abhisheksf__Unit_Price__c = (Decimal) cartItem.get('unitPrice'),
    abhisheksf__Quantity__c = (Integer) Math.round((Decimal) cartItem.get('quantity')),
    abhisheksf__Contact__c= contactId // Convert Decimal to Integer
);

                // Add the line item to the list
                lineItems.add(lineItem);
            }
    
            // Insert all line items in a single transaction
            insert lineItems;
    
        } catch (DmlException e) {
            throw new AuraHandledException('Error creating order line items: ' + e.getMessage());
        }
    }
//   @AuraEnabled
//     public static String processStripePayment(String stripeToken, Decimal totalAmount) {
//         // Define the Stripe secret key for authentication (store it securely)
//         String secretKey = 'sk_test_yourSecretKeyHere';  // Use your actual Stripe secret key
//         String endpoint = 'https://api.stripe.com/v1/charges';

//         // Create the request body to send to Stripe API
//         String requestBody = 'amount=' + (totalAmount * 100).toString()  // Convert amount to cents
//                              + '&currency=usd'
//                              + '&source=' + stripeToken
//                              + '&description=Order Payment';

//         // Create HTTP request
//         HttpRequest req = new HttpRequest();
//         req.setEndpoint(endpoint);
//         req.setMethod('POST');
//         req.setHeader('Authorization', 'Bearer ' + secretKey);
//         req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
//         req.setBody(requestBody);

//         // Send the request and handle response
//         Http http = new Http();
//         HttpResponse res = http.send(req);

//         if (res.getStatusCode() == 200) {
//             // Success, return the charge ID (you can also return other details)
//             return 'Payment processed successfully! Charge ID: ' + res.getBody();
//         } else {
//             // Handle error, return message to the LWC
//             return 'Payment failed: ' + res.getBody();
//         }
//     }

}