import React from 'react';

function Card({ title, image, description }) {
  return (
    <div className="card h-100 custom-card">
      <div className="image-container">
        <img src={image} className="card-img-top zoom-image" alt={title} />
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        <span className="text-primary mt-auto">Read More →</span>
      </div>
    </div>
  );
}

export default Card;
