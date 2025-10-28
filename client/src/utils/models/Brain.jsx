import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../footer"; 

function Brain() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setErr("");
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    if (!file) return;

    setLoading(true);
    setErr("");
    setResult(null);

    try {
      // Optional: quick health ping (remove if you don’t want it each time)
      const formData = new FormData();
      formData.append("file", file);

      // If using Vite proxy: axios.post("/predict", ...) ; if not, use full URL
      const res = await axios.post("http://localhost:5000/predict", formData, {
  withCredentials: false,           // <- important
  // do NOT set Content-Type; browser sets it for FormData
  // headers: { "Content-Type": "multipart/form-data" }
});
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setErr("");
    setHealth("");
  };

  // Choose a contextual card color (purely cosmetic)
  const getResultClasses = () => {
    if (!result) return "text-white bg-info";
    // If you map class names later, adjust this logic
    // e.g., highlight "tumor" classes as danger
    const isAlert = result.class !== "0"; // tweak per your labels
    return `text-white ${isAlert ? "bg-danger" : "bg-success"}`;
  };

  return (
    <>
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h2 className="card-title mb-0">Brain Tumor Prediction</h2>
                </div>
                <p className="text-muted mb-4">
                  Upload a brain MRI image to run inference with the model.
                </p>

                <form onSubmit={handleUpload}>
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Image (JPG/PNG) *</label>
                      <input
                        className="form-control"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                      />
                      <div className="form-text">
                        Ensure the image is a valid MRI scan for best results.
                      </div>
                    </div>

                    <div className="col-md-4 mb-3 d-flex align-items-center justify-content-center">
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className="img-fluid rounded border"
                          style={{ maxHeight: 120, objectFit: "cover" }}
                        />
                      ) : (
                        <div className="text-muted small">No preview</div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-primary" type="submit" disabled={!file || loading}>
                      {loading ? "Predicting..." : "Upload & Predict"}
                    </button>
                    <button className="btn btn-outline-secondary" type="button" onClick={resetForm} disabled={loading}>
                      Reset
                    </button>
                  </div>
                </form>

                {err && <div className="alert alert-danger mt-3">{err}</div>}

                {result && (
                  <div className="mt-4">
                    <h5>Prediction Result</h5>
                    <div className={`card mt-2 ${getResultClasses()}`}>
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2">
                          Class: <span className="badge bg-light text-dark">{result.class}</span>
                        </h6>
                        <p className="mb-0">
                          <strong>Confidence:</strong>{" "}
                          {typeof result.confidence === "number"
                            ? (result.confidence * 100).toFixed(2) + "%"
                            : String(result.confidence)}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted small mt-2">
                      ⚠️ This AI output is for informational purposes only and is not medical advice.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
export default Brain;
