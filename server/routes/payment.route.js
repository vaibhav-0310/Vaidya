import express from "express";
const router = express.Router();
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";
dotenv.config();

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.NODE_ENV === "production") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

router.get("/config", (req, res) => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    if (!clientId) {
      return res
        .status(500)
        .json({ success: false, error: "PayPal Client ID not configured." });
    }
    res.json({ clientId });
  } catch (error) {
    console.error("Error fetching PayPal client ID:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Internal server error fetching PayPal config.",
      });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, items } = req.body;

    if (!amount || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Amount and items are required",
      });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: parseFloat(amount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: parseFloat(amount).toFixed(2),
              },
            },
          },
          items: items.map((item) => ({
            name: item.title,
            unit_amount: {
              currency_code: "USD",
              value: (typeof item.price === "string"
                ? parseFloat(item.price.replace("$", ""))
                : parseFloat(item.price)
              ).toFixed(2),
            },
            quantity: "1",
            category: "PHYSICAL_GOODS",
          })),
          description: `Order with ${items.length} item(s)`,
        },
      ],
      application_context: {
        brand_name: "Your Store Name",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      },
    });

    const order = await client().execute(request);

    res.json({
      success: true,
      orderID: order.result.id,
    });
  } catch (error) {
    console.error("PayPal Create Order Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create PayPal order",
      details: error.message,
    });
  }
});

router.post("/capture-order", async (req, res) => {
  try {
    const { orderID, items } = req.body;

    if (!orderID) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client().execute(request);
    const captureDetails = capture.result;

    if (captureDetails.status === "COMPLETED") {
      // Defensive checks for nested properties
      const purchaseUnit =
        captureDetails.purchase_units &&
        captureDetails.purchase_units.length > 0
          ? captureDetails.purchase_units[0]
          : null;

      const paymentCapture =
        purchaseUnit &&
        purchaseUnit.payments &&
        purchaseUnit.payments.captures &&
        purchaseUnit.payments.captures.length > 0
          ? purchaseUnit.payments.captures[0]
          : null;

      if (!purchaseUnit || !purchaseUnit.amount || !paymentCapture) {
        console.error(
          "PayPal Capture Order Error: Missing expected details in capture response",
          captureDetails
        );
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve complete payment details from PayPal.",
          details: "Missing purchase unit, amount, or capture ID.",
        });
      }

      const orderData = {
        paypalOrderId: orderID,
        paypalPaymentId: paymentCapture.id,
        amount: purchaseUnit.amount.value,
        currency: purchaseUnit.amount.currency_code,
        status: "COMPLETED",
        payerEmail: captureDetails.payer.email_address,
        payerName: `${captureDetails.payer.name.given_name} ${captureDetails.payer.name.surname}`,
        items: items, // Use the items passed from the frontend for order details
        createdAt: new Date(),
        paypalDetails: captureDetails,
      };

      // In a real application, you would save 'orderData' to your database here.

      res.json({
        success: true,
        orderID: orderID,
        captureID: paymentCapture.id,
        amount: purchaseUnit.amount.value,
        status: captureDetails.status,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment was not completed",
        status: captureDetails.status,
      });
    }
  } catch (error) {
    console.error("PayPal Capture Order Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to capture PayPal payment",
      details: error.message,
    });
  }
});

router.get("/order/:orderID", async (req, res) => {
  try {
    const { orderID } = req.params;

    const request = new paypal.orders.OrdersGetRequest(orderID);
    const order = await client().execute(request);

    res.json({
      success: true,
      order: order.result,
    });
  } catch (error) {
    console.error("PayPal Get Order Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get order details",
      details: error.message,
    });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = req.body;

      switch (event.event_type) {
        case "PAYMENT.CAPTURE.COMPLETED":
          console.log("Payment captured:", event.resource);

          break;
        case "PAYMENT.CAPTURE.DENIED":
          console.log("Payment denied:", event.resource);
          break;
        default:
          console.log("Unhandled webhook event:", event.event_type);
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook error");
    }
  }
);

export default router;
