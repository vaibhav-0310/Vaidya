import React from 'react';

function Image({ image }) {
  return (
    <img
      src={image}
      className="img-fluid"
      alt="Blog"
      style={{
        maxHeight: '400px',
        objectFit: 'cover',
        borderRadius: '20px 20px 0px 0px',
        marginLeft: '20px'
      }}
    />
  );
}

export default Image;
