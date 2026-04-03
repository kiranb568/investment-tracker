// admin.js

class CustomerManager {
    constructor() {
        this.customers = []; // An array to hold customer data
    }

    // Load customers data (replace this with actual data retrieval from a database)
    loadCustomers() {
        // Mock data for the sake of example
        this.customers = [
            { id: 1, name: "John Doe", email: "john@example.com" },
            { id: 2, name: "Jane Smith", email: "jane@example.com" },
            // Add more mock customers as needed
        ];
    }

    // Add a new customer
    addCustomer(name, email) {
        const newId = this.customers.length ? this.customers[this.customers.length - 1].id + 1 : 1;
        this.customers.push({ id: newId, name, email });
        console.log(`Customer ${name} added successfully!`);
    }

    // Delete a customer with confirmation
    deleteCustomer(id) {
        if (confirm("Are you sure you want to delete this customer?")) {
            this.customers = this.customers.filter(customer => customer.id !== id);
            console.log(`Customer with ID ${id} deleted successfully!`);
        }
    }

    // Load customer analytics
    loadAnalytics() {
        const count = this.customers.length;
        console.log(`Total Customers: ${count}`);
        // Further analytics can be implemented here
    }

    // Display all customers
    displayCustomers() {
        console.table(this.customers);
    }
}

// Usage example
const customerManager = new CustomerManager();
customerManager.loadCustomers();
customerManager.displayCustomers();
customerManager.addCustomer("Alice Johnson", "alice@example.com");
customerManager.loadAnalytics();
customerManager.deleteCustomer(1);
customerManager.displayCustomers();
