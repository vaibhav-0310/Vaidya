import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Items({ title, image, price, type }) {
  const cartSubmit = async (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    try {
      const response = await axios.post("/api/cart", {
        title,
        image,
        price,
        type
      });
      if (response.status === 201) {
        toast.success("Item added to cart successfully", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to add item to cart");
    }
  }

  return (
    <div className="card h-100 card-ess" style={{ padding: "20px" }}>
      <img src={image} className="card-img" alt={title} />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">Price: &#x20B9;{price}</p>
        <p className="card-text">Type: {type}</p>
        <button 
          className="btn btn-dark mt-auto" 
          style={{ borderRadius: "50px" }} 
          onClick={cartSubmit}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default Items;