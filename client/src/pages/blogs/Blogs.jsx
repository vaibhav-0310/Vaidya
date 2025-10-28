import React, { useState, useEffect } from "react";
import Footer from "../../utils/footer.jsx";
import Container from "./container.jsx";
import Card from "./card.jsx";
import axios from "axios";
import { Link } from "react-router-dom";

function Blogs() {
  let [blogs, setBlogs] = useState([]);
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  useEffect(() => {
    axios
      .get("/api/blog")
      .then((res) => {
        setBlogs(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      <Container />
      <div className="container my-5">
        <div className="row justify-content-start">
          {blogs.map((item) => (
            <div className=" col-md-4  mb-4" key={item._id}>
              <Link
                to={`/blog/${item._id}`}
                className="text-decoration-none text-dark d-block h-100"
              >
                <Card
                  title={item.title}
                  image={item.image}
                  description={
                    item.description.split(" ").slice(0, 10).join(" ") +
                    (item.description.split(" ").length > 50 ? "..." : "")
                  }
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Blogs;
