@IsTest
public class ProductControllerTest {

    // Test method for getProducts
    @IsTest
    static void testGetProducts() {
        // Create test data
        List<abhisheksf__Custom_product__c> products = new List<abhisheksf__Custom_product__c>();
        for (Integer i = 0; i < 5; i++) {
            products.add(new abhisheksf__Custom_product__c(
                Name = 'Product ' i,
                abhisheksf__Image__c = 'Image ' i,
                abhisheksf__Image_url__c = 'Image_url_' + i,
                abhisheksf__Price__c = 100.00,
                abhisheksf__Quantity__c = 10,
                abhisheksf__Product_Description__c = 'Description ' i,
                abhisheksf__Active__c = true
            ));
        }
        insert products;

        // Call the method to test
        List<abhisheksf__Custom_product__c> result = ProductController.getProducts();

        // Verify the results
        System.assertEquals(products.size(), result.size());
    }

    // Test method for createOrder
    @IsTest
    static void testCreateOrder() {
        // Create a test user with a Contact
        User testUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        System.runAs(testUser) {
            // Call the method to test
            Id orderId = ProductController.createOrder('Test Notes', '123-456-7890', 100.00, Date.today(), 'City', 'Street', 'PostalCode');

            // Verify the results
            System.assertNotEquals(null, orderId);
        }
    }
}
