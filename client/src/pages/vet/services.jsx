import React from 'react';
import setho from "../../assests/setho.svg";

function Services() {
  return (
    <>
      <div className="container mt-5 service">
        <div className=" text-center mb-5">
          <h2> Discover our simple
three-step process for exceptional pet <span className="back">care</span></h2>
        </div>
        <div className="row ms-lg-5 ">
          <div className="text-start col-lg-3 col-md-3 col-sm-12 appointment p-3 mb-3">
            <div className="cal">
            <i class="fa-solid fa-calendar-days"></i>
            </div><br/>
             <b>Schedule for a comprehensive assessment</b>
           <br />
           <p style={{fontSize:"12px"}}>Book an appointment to discuss your pet's health and wellness.</p>

            </div>

            <div className="offset-lg-1 text-start col-lg-3 col-md-3 col-sm-12 appointment p-3 mb-3">
              <div className="cal" id='laptop'><i class="fa-solid fa-laptop"></i></div><br/>
             <b>Connect through real-time video and audio conferencing.</b>
           <br />
           <p style={{fontSize:"12px"}}>Enable real-time video or audio calls between patients and licensed healthcare professionals.</p>

            </div>

              <div className="offset-lg-1 text-start col-lg-3 col-md-3 col-sm-12 appointment p-3 mb-3">
                <div className="cal" id="ruppee"><i class="fa-solid fa-indian-rupee-sign"></i></div><br/>
             <b>Cancel with our various payment methods.</b>
           <br />
           <p style={{fontSize:"12px"}}> Payment Methods for Pet Health and Wellbeing Consultation..</p>

            </div>
          </div>
        </div>
    </>
  );
}

export default Services;