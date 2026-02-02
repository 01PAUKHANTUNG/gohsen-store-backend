// Test script to verify COD payment status update logic
// Run this to test the logic without needing the full app

const testOrders = [
    { paymentMethod: "COD", status: "Order Placed" },
    { paymentMethod: "COD", status: "Delivered" },
    { paymentMethod: "cod", status: "Delivered" },
    { paymentMethod: "Cash on Delivery", status: "Delivered" },
    { paymentMethod: "Stripe", status: "Delivered" },
    { paymentMethod: "COD", status: "Shipped" },
];

testOrders.forEach((order, index) => {
    const status = order.status;
    const updateData = { status };

    // Same logic as in orderRoute.js
    const isCOD = order.paymentMethod && (
        order.paymentMethod.toUpperCase() === "COD" ||
        order.paymentMethod.toLowerCase().includes("cash on delivery")
    );

    if (isCOD) {
        if (status === "Delivered") {
            updateData.paymentStatus = "paid";
            console.log(`Test ${index + 1}: ✅ COD Order Delivered - Setting payment status to PAID`);
        } else {
            updateData.paymentStatus = "pending";
            console.log(`Test ${index + 1}: ⏳ COD Order status '${status}' - Setting payment status to PENDING`);
        }
    } else {
        console.log(`Test ${index + 1}: ℹ️  Not a COD order (${order.paymentMethod}) - No payment status change`);
    }

    console.log(`   Payment Method: ${order.paymentMethod}, Status: ${status}, Payment Status: ${updateData.paymentStatus || 'unchanged'}`);
    console.log('');
});
