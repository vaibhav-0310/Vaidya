import React from 'react';
import Image from './image'

function Gallery() {
  const images = [
    {
      image: "https://cdn.prod.website-files.com/67607a4da94c236117377bec/677c7c4ed1ede0d10b106a30_Frame%202147226624.webp"
    },
    {
      image: "https://cdn.prod.website-files.com/67607a4da94c236117377bec/677c7c4e9299666fd58ac9ba_Frame%202147226625.webp"
    },
    {
      image: "https://cdn.prod.website-files.com/67607a4da94c236117377bec/677c7c4ea22068717e76f7ea_Frame%202147226626.webp"
    },
    {
      image: "https://cdn.prod.website-files.com/67607a4da94c236117377bec/677c7c4f46b218e13109bf8b_Frame%202147226625-1.webp"
    }
  ];

  return (
    <div className="container mt-5 image-container-home">
      <div className="row">
        {images.map((data, index) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 p-0" key={index}>
  <Image image={data.image} />
</div>

        ))}
      </div>
    </div>
  );
}

export default Gallery;
