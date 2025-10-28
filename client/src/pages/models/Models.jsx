import React from 'react';
import Image from './image';
import Text from './text';
import Predictive from './Predictive';
import Footer from "../../utils/footer";
import { Link } from 'react-router-dom';
import Brain from "../../assests/brain.png";
import Diabetes from '../../assests/diabetes.png';

function Models() {

    const data=[{
        url:"diabetes",
        title: "Diabetes prediction",
        image: Diabetes,
        description: "Predict the risk of diabetes using patient data."
    },{
        url:"brain",
        title: "Brain Tumor prediction",
        image: Brain,
        description: "Assess the likelihood of brain tumor based on health metrics."
    }]

    return ( 
        <>
        <Text/>
        <Image/>
        <div className="container my-5">
        <div className="row justify-content-start">
          {data.map((item, index) => (
            <div className=" col-md-4  mb-4" key={index}>
              <Link
                to={`/ml-models/${item.url}`}
                className="text-decoration-none text-dark d-block h-100"
              >
                <Predictive
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
        <Footer/>
        </>
     );
}

export default Models;