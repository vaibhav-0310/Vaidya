import React, { useState,useEffect } from "react";
import Hero from "./hero";
import HorizontalScrollCategories from "./scroll";
import Services from "./services";
import Footer from "../../utils/footer";


function Home() {
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);
  return (
    <>
      <Hero />
      <HorizontalScrollCategories />
      <Services />
  
      <Footer />
    </>
  );
}

export default Home;
