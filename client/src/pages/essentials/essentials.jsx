import React,{useEffect} from "react";
import Hero from "./hero";
import Footer from "../../utils/footer";
import Items from "./items";
import axios from "axios";
import { Link } from "react-router-dom";

function Essentials() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  let [essentialsData, setEssentialsData] = React.useState([]);

  React.useEffect(() => {
    const fetchEssentials = async () => {
      try {
        const response = await axios("/api/essentials");
        const data = response.data;
        setEssentialsData(data);
      } catch (error) {
        console.error("Error fetching essentials:", error);
      }
    };

    fetchEssentials();
  }, []);

  return (
    <>
      <Hero />
      <div className="container my-5">
        <div className="row justify-content-start">
          {essentialsData.map((item, index) => (
            <div className="col-lg-3 col-md-6 col-sm-12 mb-4" key={index}>
              <Link
                to={`/items/${item._id}`}
                className="text-decoration-none d-block h-100"
              >
                <Items
                  key={index}
                  title={item.title}
                  image={item.image}
                  price={item.price}
                  type={item.type}
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

export default Essentials;
