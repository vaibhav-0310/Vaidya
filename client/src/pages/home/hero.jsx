import React from "react";
import hero from "../../assests/hero1.png";
import dog from "../../assests/dog.png";
import mark from "../../assests/mark.png";

function Hero() {
  return (
    <>
      <div className="container hero">
        <div className="row">
          <div className="col-12 col-lg-6 hero-left">
            &#128308; Healthcare solutions
            <br />
            <br></br>
            <span style={{ fontSize: "50px", fontWeight: "bold" }}>
              Your reliable
              <br /> partner for your <br />
              <span className="back">wellness</span>
            </span>
            <br />
            <br />
            At our clinic, we prioritize the health and happiness of your
            <br /> and your beloved partners. Our expert doctors are dedicated to
            <br /> providing love.<br></br>
            <br />
            <div className="button-wrapper" style={{ width: "fit-content" }}>
              <button className="btn btn-dark but-2">Contact us</button>
              <button className="btn btn-info but-3">
                <img src={mark} style={{ width: "20px" }} />
              </button>
            </div>
          </div>
          <div className="col-12 col-lg-6 d-none d-sm-block hero-right">
            <div className="row">
              <div className="col-2">
                <img src={dog} className="hero-dog" style={{borderRadius:"30px"}}/>
              </div>
              <div className="col-10">
                <img src={hero} className="hero-img" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Hero;
