import React from 'react';
import doctor from "../../assests/doctor.png"

function Image() {
    return ( 
        <>
        <div className="container mt-5">
            <img src={doctor} alt="Doctor" style={{ width: "100%", height: "auto" , borderRadius: "50px" }} />
            </div>
        </>
     );
}

export default Image;