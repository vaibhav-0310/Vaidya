import React from 'react';
import Paw from "../assests/mark.png";
import Gallery from './gallery';

function Footer() {
    return (
        <div className="container-fluid footer-container">
            <div className="row">
                <div className="col-12 col-md-6 col-lg-3 mb-4 mb-lg-0">
                    <div className="d-flex align-items-center mb-3">
                        <img 
                            src={Paw} 
                            className="footer-logo me-2" 
                            alt="Logo" 
                            style={{color:"pink", height:"50px"}} 
                        />
                        <span className="fw-bold fs-5">Vadiya</span>
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-2 mb-4 mb-lg-0">
                    <h5 className="mb-3">About Us</h5>
                    <ul className="list-unstyled">
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">Our Story</a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">Team</a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">Careers</a>
                        </li>
                    </ul>
                </div>

                <div className="col-12 col-md-6 col-lg-2 mb-4 mb-lg-0">
                    <h5 className="mb-3">Services</h5>
                    <ul className="list-unstyled">
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">Online Consultation</a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">Emergency Care</a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="text-decoration-none text-light">24/7 Support</a>
                        </li>
                    </ul>
                </div>
                <div className="col-12 col-md-6 col-lg-3 mb-4 mb-lg-0">
                    <h5 className="mb-3">Contact Us</h5>
                    <ul className="list-unstyled">
                        <li className="mb-2 d-flex align-items-center">
                            <i className="fa-solid fa-envelope me-2"></i>
                            <a href="mailto:grayman011@gmail.com" className="text-decoration-none text-light">
                                grayman011@gmail.com
                            </a>
                        </li>
                        <li className="mb-2 d-flex align-items-center">
                            <i className="fa-solid fa-phone me-2"></i>
                            <a href="tel:+919719323052" className="text-decoration-none text-light">
                                +91 97193 23052
                            </a>
                        </li>
                        <li className="mb-3 d-flex align-items-center">
                            <i className="fa-solid fa-location-dot me-2"></i>
                            <span>Agra, India</span>
                        </li>
                        <li>
                            <div className="d-flex gap-3">
                                <a href="#" className="text-light fs-5">
                                    <i className="fa-brands fa-instagram"></i>
                                </a>
                                <a href="#" className="text-light fs-5">
                                    <i className="fa-brands fa-x-twitter"></i>
                                </a>
                                <a href="#" className="text-light fs-5">
                                    <i className="fa-brands fa-facebook"></i>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="col-lg-2 d-none d-lg-block"></div>
            </div>
            <div className="row mt-4 pt-4 ">
                <div className="col-12 start">
                    <p className="mb-0">&copy; 2025 Vadiya. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

export default Footer;