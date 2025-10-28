import React from 'react';
import Footer from "../utils/footer";
function Error() {
    return ( 
        <>
        <h1 className='text-center mt-5'>404 - Page Not Found</h1>
        <Footer/>
        <style jsx>{`
            h1 {
                color: red;
                margin-top: 50px;
            }
        `}</style>
        </>
     );
}

export default Error;