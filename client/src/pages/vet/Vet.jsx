import React, { useEffect } from "react";
import Footer from "../../utils/footer.jsx";
import Container from "./container.jsx";
import Image from "./image.jsx";
import Team from "./team.jsx";
import Services from "./services.jsx";
import axios from "axios";
import { Link } from "react-router-dom";

function Vet() {
  const [data, setData] = React.useState([]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/vet");
        const data = response.data;
        setData(data);
      } catch (error) {
        console.error("Error fetching vet data:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <>
      <Container />
      <Image />
      <Services />
      <div className="container mt-5">
        <h2 className="text-center mb-4">Meet Our Team</h2>
        <div className="row">
          {data.map((item, index) => (
            <div className="col-lg-4 col-md-6 col-sm-12 mb-4" key={index}>
              <Link
                to={`/chat/${item._id}`}
                className="text-decoration-none d-block h-100"
              >
                <div className="h-100">
                  <Team name={item.name} image={item.image} post={item.post} _id={item._id} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Vet;
