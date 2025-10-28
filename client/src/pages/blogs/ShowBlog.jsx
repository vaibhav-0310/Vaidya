import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Footer from "../../utils/footer";

function ShowBlog() {
  const [blog, setBlog] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { blogId } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when this component mounts/updates
  }, []);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`/api/blog/${blogId}`);
        setBlog(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching blog:", error);
        setError("Failed to load blog post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Loading your story...</h4>
          <div
            className="progress mx-auto mt-3"
            style={{ width: "200px", height: "4px" }}
          >
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: "80%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-5 text-center">
                  <div className="text-danger mb-4">
                    <i
                      className="bi bi-exclamation-triangle-fill"
                      style={{ fontSize: "4rem" }}
                    ></i>
                  </div>
                  <h3 className="text-dark mb-3">Oops! Something went wrong</h3>
                  <p className="text-muted mb-4">{error}</p>
                  <button
                    className="btn btn-primary btn-lg px-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const calculateReadTime = (text) => {
    if (!text) return "2 min read";
    const wordsPerMinute = 200;
    const wordCount = text.split(" ").length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  return (
    <>
      <div className="min-vh-100 mt-3">
        {/* Hero Section */}
        <div className="position-relative overflow-hidden">
          {blog.image && (
            <div
              className="hero-image position-relative"
              style={{ height: "60vh" }}
            >
              <img
                src={blog.image}
                alt={blog.title}
                className="w-100 h-100 object-fit-cover"
              />

              {/* Floating Back Button - Now correctly nested */}
              <div className="position-absolute top-0 start-0 p-4">
                <button
                  className="btn btn-light btn-sm rounded-pill shadow-sm"
                  onClick={() => window.history.back()}
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              {/* Article Header */}
              <div
                className="bg-white rounded-4 shadow-lg p-5 mb-4"
                style={{
                  marginTop: blog.image ? "-8rem" : "0",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                {/* Categories/Tags */}
                {blog.category && (
                  <div className="mb-3">
                    <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fs-6">
                      {blog.category}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="display-4 fw-bold text-dark mb-4 lh-1">
                  {blog.title}
                </h1>

                {/* Meta Information */}
                <div className="d-flex flex-wrap align-items-center gap-4 mb-4 pb-4 border-bottom">
                  {blog.author && (
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: "50px", height: "50px" }}
                      >
                        <i className="bi bi-person-fill text-white fs-4"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">{blog.author}</h6>
                        <small className="text-muted">Author</small>
                      </div>
                    </div>
                  )}

                  <div className="d-flex align-items-center text-muted">
                    <i className="bi bi-calendar3 me-2"></i>
                    <span>
                      {formatDate(blog.publishedDate || blog.createdAt)}
                    </span>
                  </div>

                  <div className="d-flex align-items-center text-muted">
                    <i className="bi bi-clock me-2"></i>
                    <span>
                      {calculateReadTime(blog.description || blog.content)}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="article-content">
                  {blog.excerpt && (
                    <p className="lead fs-5 text-muted mb-4 fst-italic">
                      {blog.excerpt}
                    </p>
                  )}

                  <div
                    className="fs-5 lh-lg text-dark"
                    style={{ lineHeight: "1.8" }}
                  >
                    {blog.description &&
                      blog.description.split("\n").map((paragraph, index) => (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              {/* Engagement Section */}
              <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
                <div className="row text-center">
                  <div className="col-4">
                    <button className="btn btn-outline-primary btn-lg w-100 rounded-pill">
                      <i className="bi bi-heart me-2"></i>
                      <span className="d-none d-md-inline">Like</span>
                    </button>
                  </div>
                  <div className="col-4">
                    <button className="btn btn-outline-success btn-lg w-100 rounded-pill">
                      <i className="bi bi-share me-2"></i>
                      <span className="d-none d-md-inline">Share</span>
                    </button>
                  </div>
                  <div className="col-4">
                    <button className="btn btn-outline-warning btn-lg w-100 rounded-pill">
                      <i className="bi bi-bookmark me-2"></i>
                      <span className="d-none d-md-inline">Save</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Related Articles Placeholder */}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ShowBlog;
