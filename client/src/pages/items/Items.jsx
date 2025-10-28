import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../../utils/footer";

function Items() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/items/${id}`);
        setItem(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching items:", error);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleQuantityChange = (change) => {
    setQuantity((prev) => {
      const newQuantity = prev + change;
      return newQuantity >= 1 && newQuantity <= 10 ? newQuantity : prev;
    });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await axios.post("/api/cart", {
        title: item.title,
        image: item.image,
        price: item.price,
        type: item.type,
        quantity: quantity,
      });
      if (response.status === 201) {
        toast.success("Item added to cart successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to add item to cart");
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Error!</h4>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="alert alert-warning" role="alert">
              <h4 className="alert-heading">Product Not Found!</h4>
              <p>The product you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 mb-4">
          <img
            src={item.image}
            alt={item.title}
            className="img-fluid product-image w-100"
          />
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <span className="type-badge">{item.type}</span>
          </div>

          <h1 className="h2 mb-3">{item.title}</h1>

          <div className="mb-3">
            <div className="rating-stars">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star-half-alt"></i>
              <span className="text-muted ms-2">(4.5/5 - 127 reviews)</span>
            </div>
          </div>

          <div className="price-tag mb-4">₹{item.price}</div>

          <div className="mb-4">
            <h5>Product Description</h5>
            <p className="text-muted">
              {getProductDescription(item.type, item.title)}
            </p>
          </div>

          <div className="mb-4">
            <h6>Key Benefits:</h6>
            <ul className="list-unstyled">
              {getProductBenefits(item.type).map((benefit, index) => (
                <li key={index}>
                  <i className="fas fa-check text-success me-2"></i>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Quantity:</label>
            <div className="quantity-controls">
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <i className="fas fa-minus"></i>
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                  )
                }
                min="1"
                max="10"
              />
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 10}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <div className="d-grid gap-2 d-md-flex mb-4">
            <button
              className="btn btn-primary btn-lg flex-fill"
              onClick={handleAddToCart}
            >
              <i className="fas fa-shopping-cart me-2"></i>
              Add to Cart
            </button>
          </div>

          <div className="alert alert-info">
            <i className="fas fa-truck me-2"></i>
            <strong>Free Delivery</strong> on orders above ₹799 |
            <strong>Same Day Delivery</strong> available in select cities
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <h3 className="text-center mb-5">
            Why Choose Our {item.type} Products?
          </h3>
        </div>

        {getProductFeatures(item.type).map((feature, index) => (
          <div key={index} className="col-md-3 col-sm-6 mb-4">
            <div className="text-center">
              <div className="feature-icon">
                <i className={feature.icon}></i>
              </div>
              <h5>{feature.title}</h5>
              <p className="text-muted">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer/>
    </>
   
  );
}

function getProductDescription(type, title) {
  const descriptions = {
    Healthcare: `Effective and safe ${title.toLowerCase()} for dogs and cats. Our veterinarian-approved formula provides long-lasting protection. Safe for pets and gentle on sensitive skin.`,
    Supplement: `Premium quality ${title.toLowerCase()} formulated with essential nutrients. Supports your pet's overall health and wellbeing with natural ingredients.`,
    Medicine: `Veterinary-grade ${title.toLowerCase()} for effective treatment. Fast-acting formula that provides relief while being gentle on your pet's system.`,
    Hygiene: `Professional-grade ${title.toLowerCase()} for maintaining your pet's cleanliness and health. Safe, effective, and easy to use.`,
    "First Aid": `Emergency ${title.toLowerCase()} for immediate pet care. Keep your pet safe with our trusted first aid solution.`,
    "Dental Care": `Complete ${title.toLowerCase()} for maintaining your pet's oral health. Prevents dental problems and keeps breath fresh.`,
    Behavioral: `Natural ${title.toLowerCase()} to help manage your pet's behavior. Safe and effective solution for anxious or stressed pets.`,
    Tools: `Professional-grade ${title.toLowerCase()} for pet care. Durable, safe, and designed for ease of use.`,
  };
  return (
    descriptions[type] ||
    `High-quality ${title.toLowerCase()} for your pet's needs.`
  );
}

function getProductBenefits(type) {
  const benefits = {
    Healthcare: [
      "Kills parasites on contact",
      "Long-lasting protection",
      "Safe for dogs and cats",
      "Veterinarian approved",
    ],
    Supplement: [
      "Supports immune system",
      "Improves coat health",
      "Boosts energy levels",
      "Natural ingredients",
    ],
    Medicine: [
      "Fast-acting formula",
      "Effective treatment",
      "Gentle on stomach",
      "Veterinarian recommended",
    ],
    Hygiene: [
      "Deep cleaning action",
      "Gentle on skin",
      "Pleasant scent",
      "Easy application",
    ],
    "First Aid": [
      "Immediate relief",
      "Prevents infection",
      "Promotes healing",
      "Safe for all pets",
    ],
    "Dental Care": [
      "Prevents tartar buildup",
      "Freshens breath",
      "Strengthens teeth",
      "Easy to use",
    ],
    Behavioral: [
      "Reduces anxiety",
      "Natural calming effect",
      "Non-drowsy formula",
      "Safe for daily use",
    ],
    Tools: [
      "Durable construction",
      "Easy to use",
      "Professional grade",
      "Safe design",
    ],
  };
  return (
    benefits[type] || [
      "High quality",
      "Safe for pets",
      "Easy to use",
      "Effective results",
    ]
  );
}

function getProductFeatures(type) {
  const features = {
    Healthcare: [
      {
        icon: "fas fa-shield-alt",
        title: "Veterinarian Approved",
        description:
          "Recommended by veterinarians for safe and effective treatment.",
      },
      {
        icon: "fas fa-clock",
        title: "Long-lasting",
        description: "Provides protection for extended periods.",
      },
      {
        icon: "fas fa-leaf",
        title: "Natural Ingredients",
        description: "Made with natural, pet-safe ingredients.",
      },
      {
        icon: "fas fa-spray-can",
        title: "Easy Application",
        description: "Simple application for quick treatment.",
      },
    ],
    Supplement: [
      {
        icon: "fas fa-heart",
        title: "Health Support",
        description: "Supports overall health and vitality.",
      },
      {
        icon: "fas fa-leaf",
        title: "Natural Formula",
        description: "Made with premium natural ingredients.",
      },
      {
        icon: "fas fa-award",
        title: "Quality Assured",
        description: "Highest quality standards maintained.",
      },
      {
        icon: "fas fa-paw",
        title: "Pet Friendly",
        description: "Tasty and easy for pets to consume.",
      },
    ],
  };
  return features[type] || features["Healthcare"];
}

function getWarningMessage(type) {
  const warnings = {
    Healthcare:
      "Not suitable for pets under 12 weeks old. If irritation occurs, discontinue use.",
    Supplement:
      "Consult your veterinarian before use. Keep out of reach of children.",
    Medicine:
      "Use only as prescribed. Contact veterinarian if symptoms persist.",
    Hygiene: "For external use only. Avoid contact with eyes and mouth.",
    "First Aid":
      "For minor wounds only. Seek veterinary care for serious injuries.",
    "Dental Care":
      "Supervise pet during use. Not suitable for very young pets.",
    Behavioral: "Monitor pet behavior. Consult vet if no improvement seen.",
    Tools: "Use carefully to avoid injury. Keep away from children.",
  };
  return warnings[type] || "Please read all instructions before use.";
}

export default Items;
