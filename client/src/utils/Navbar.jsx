import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import logo from "../assests/logo.png";
import axios from "axios";
import { useCallback } from "react";
import { toast } from "react-toastify";

function Navbar() {
  const [user, setUser] = useState({ username: "" });

const logout = useCallback((e) => {
  e.preventDefault();
  axios.get("/api/logout", { withCredentials: true })
    .then((res) => {
      toast.success("Logged out successfully");
      setUser({ username: "" });
    })
    .catch((err) => {
      console.error("Logout failed:", err);
      toast.error("Logout failed");
    });
}, []);

  useEffect(() => {
    axios
      .get("/api/auth-status",{withCredentials: true})
      .then((res) => {
        if (res.data.isAuthenticated) {
          setUser({ username: res.data.user.username });
        } else {
          console.log("User not logged in");
          setUser({ username: "" });
        }
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setUser({ username: "" });
      });
  }, [user.username]);

  useEffect(() => {
    if (user.username) {
      console.log("User updated:", user);
    }
  }, [user]);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary navbar-all">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img src={logo} className="paw" alt="Logo" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav  nav-underline mx-auto">
              <li className="nav-item">
                <Link className="nav-link" aria-current="page" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/essentials">
                  Essentials
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/vet">
                  Consult
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/blog">
                  Blog
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/phr">
                  Patient PHR
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/ml-models">
                  Predict
                </Link>
              </li>
               <li className="nav-item">
                <Link className="nav-link" to="/parser">
                  Q&A
                </Link>
              </li>
            </ul>
            <div className="navbar-nav">
              {user.username ? (
                <div className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Welcome, {user.username}
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/cart">
                       <i className="fa-solid fa-cart-shopping"></i>&nbsp; Cart
                      </Link>
                    </li>
                     <li>
                      <Link className="dropdown-item" to="/create/blog">
                       <i className="fa-solid fa-plus"></i>&nbsp; Create Blog
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                       <a className="dropdown-item" href="#" onClick={logout}>
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="nav-item">
                  <Link to="/login">
                    <button className="btn btn-dark but-1">Login</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;