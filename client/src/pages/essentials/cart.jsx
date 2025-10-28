import React from "react";
import axios from "axios";
import Footer from "../../utils/footer";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function Cart() {
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);
  const [cartItems, setCartItems] = useState([]);
  const [showPayPal, setShowPayPal] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await axios.get("/api/cart");
        if (response.status === 200) {
          console.log("Cart items fetched successfully");
          setCartItems(response.data);
          calculateTotal(response.data);
        } else {
          console.error("Failed to fetch cart items");
        }
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    fetchCartItems();
  }, []);

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      const price =
        typeof item.price === "string"
          ? parseFloat(item.price.replace("$", ""))
          : parseFloat(item.price);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    setTotalAmount(total);
  };

  useEffect(() => {
    const loadPayPalScript = async () => {
      if (window.paypal) {
        return Promise.resolve();
      }

      try {
        const configResponse = await axios.get("/api/paypal/config");
        const { clientId } = configResponse.data;

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error("Failed to fetch PayPal config:", error);
        throw error;
      }
    };

    if (showPayPal && cartItems.length > 0) {
      loadPayPalScript()
        .then(() => {
          renderPayPalButton();
        })
        .catch((error) => {
          toast.error("Failed to load PayPal script");
        });
    }
  }, [showPayPal, cartItems, totalAmount]);

  const renderPayPalButton = () => {
    const paypalContainer = document.getElementById("paypal-button-container");
    if (window.paypal && paypalContainer) {
      paypalContainer.innerHTML = "";

      window.paypal
        .Buttons({
          createOrder: async (data, actions) => {
            try {
              // Create order on your server
              const response = await axios.post("/api/paypal/create-order", {
                amount: totalAmount.toFixed(2),
                items: cartItems,
              });

              return response.data.orderID;
            } catch (error) {
              console.error("Error creating order:", error);
              throw error;
            }
          },
          onApprove: async (data, actions) => {
            setLoading(true);
            try {
              const response = await axios.post("/api/paypal/capture-order", {
                orderID: data.orderID,
                items: cartItems,
              });

              if (response.data.success) {
                toast.success("Payment completed successfully!");

                await clearCart();
                setCartItems([]);
                setShowPayPal(false);
                setTotalAmount(0);
              } else {
                throw new Error("Payment capture failed");
              }
            } catch (error) {
              console.error("Payment capture error:", error);
              toast.error("Payment processing failed. Please try again.");
            } finally {
              setLoading(false);
            }
          },
          onError: (err) => {
            console.error("PayPal error:", err);
            toast.error("Payment failed. Please try again.");
            setLoading(false);
          },
          onCancel: (data) => {
            console.log("Payment cancelled:", data);
            toast.info("Payment was cancelled.");
            setLoading(false);
          },
        })
        .render("#paypal-button-container");
    }
  };

  const removeFromCart = async (itemId, index) => {
    try {
      await axios.delete(`/api/cart/${itemId}`);
      const updatedItems = cartItems.filter((_, i) => i !== index);
      setCartItems(updatedItems);
      calculateTotal(updatedItems);
      toast.success("Item removed from cart successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from cart", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete("/api/cart");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    if (totalAmount <= 0) {
      toast.error("Invalid cart total!");
      return;
    }
    setShowPayPal(true);
  };

  return (
    <>
      <div className="container mt-5 text-center">
        &#128308; Your Cart
        <br />
        <br />
        <h3 style={{ fontSize: "50px" }}>
          Quality You Can Count On <span className="back">PawVadiya</span>{" "}
        </h3>
        {loading && (
          <div className="text-center mb-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Processing payment...</span>
            </div>
            <p>Processing your payment...</p>
          </div>
        )}
        <div className="row">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div className="col-md-3 mb-4" key={item.id || index}>
                <div className="card h-100" style={{ padding: "20px" }}>
                  <img
                    src={item.image}
                    className="card-img-top"
                    alt={item.title}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text">
                      Price: &#x20B9;
                      {typeof item.price === "string"
                        ? item.price.replace("$", "")
                        : item.price}
                    </p>
                    <p className="card-text">Type: {item.type}</p>
                    <button
                      className="btn btn-danger mt-auto"
                      style={{ borderRadius: "50px" }}
                      onClick={() => removeFromCart(item._id, index)}
                      disabled={loading}
                    >
                      Remove from Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <p className="text-center">Your cart is empty.</p>
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="row mt-4 mb-4">
            <div className="col-md-6 offset-md-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Order Summary</h5>
                  <div className="d-flex justify-content-between">
                    <span>Items ({cartItems.length}):</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <hr />

                  {!showPayPal ? (
                    <button
                      className="btn btn-success btn-lg w-100"
                      onClick={proceedToCheckout}
                      disabled={loading}
                    >
                      Proceed to Checkout
                    </button>
                  ) : (
                    <div>
                      <h6 className="mb-3">
                        Complete your payment with PayPal:
                      </h6>
                      <div id="paypal-button-container"></div>
                      <button
                        className="btn btn-secondary mt-3 w-100"
                        onClick={() => setShowPayPal(false)}
                        disabled={loading}
                      >
                        Back to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Cart;
