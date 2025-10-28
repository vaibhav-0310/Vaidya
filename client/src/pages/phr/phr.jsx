import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../../utils/footer";
function Phr() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [phrList, setPhrList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); 
    
  
    if (!title && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setTitle(nameWithoutExt);
    }
  };

  const onTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file before uploading.");
      setMessageType("warning");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a title for your file.");
      setMessageType("warning");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());

    try {
      const res = await axios.post("/api/upload", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("File uploaded successfully!");
      setMessageType("success");
      setFile(null);
      setTitle("");
      document.querySelector('input[type="file"]').value = ""; 
      fetchPHRs();
    } catch (err) {
      console.error(err);
      setMessage("File upload failed. Please try again.");
      setMessageType("danger");
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch PHRs on load
  const fetchPHRs = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/user/phrs", {
        withCredentials: true,
      });
      setPhrList(res.data);
    } catch (err) {
      console.error("Failed to fetch PHR files:", err);
      setMessage("Failed to load your files. Please refresh the page.");
      setMessageType("danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Get file type icon
  const getFileIcon = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <i className="fa-solid fa-file-pdf"></i>;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <i className="fa-solid fa-image"></i>;
      case "doc":
      case "docx":
        return <i className="fa-solid fa-file-word"></i>;
      case "xls":
      case "xlsx":
        return <i className="fa-solid fa-file-excel"></i>;
      default:
        return <i className="fa-solid fa-folder"></i>;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    fetchPHRs();
  }, []);

  return (
    <>
      <div className="min-vh-100" style={{ backgroundColor: '#fff0f5' }}>
        <div className="container py-5">
          <div className="row mb-5">
            <div className="col-12">
              <div className="text-center mb-4">
                &#128308; Health Docs
            <br />
            <br></br>
            <span style={{ fontSize: "50px", fontWeight: "bold" }}>
               Personal Health <span className="back">Records</span>
              
            </span><br/><br/>
           Securely upload and manage your medical documents 
               
              </div>
            </div>
          </div>

          <div className="row justify-content-center mb-5">
            <div className="col-lg-8">
              <div className="card shadow-lg border-0 rounded-4" style={{ backgroundColor: '#ffffff' }}>
                <div 
                  className="card-header text-white text-center py-4 rounded-top-4"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b9d, #ff8fab)',
                    border: 'none'
                  }}
                >
                  <h3 className="mb-0 fw-semibold">
                    <i className="fas fa-cloud-upload-alt me-2"></i>
                    Upload New PHR File
                  </h3>
                </div>
                <div className="card-body p-5" style={{ backgroundColor: '#fef7f7' }}>
                  <form onSubmit={onSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark mb-3">
                        Document Title
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg border-2 rounded-3"
                        placeholder="Enter a title for your document (e.g., Lab Report, X-Ray, Prescription)"
                        value={title}
                        onChange={onTitleChange}
                        style={{
                          border: title.trim() ? "2px solid #ff6b9d" : "2px solid #dee2e6",
                          fontSize: "1rem",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark mb-3">
                        Choose File to Upload
                      </label>
                      <div className="position-relative">
                        <input
                          type="file"
                          className="form-control form-control-lg border-2 rounded-3"
                          onChange={onFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                          style={{
                            height: "50px",
                            paddingTop: "10px",
                            fontSize: "1rem",
                            border: file
                              ? "2px solid #ff6b9d"
                              : "2px dashed #dee2e6",
                            backgroundColor: '#ffffff'
                          }}
                        />

                        {file && (
                          <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#ffffff', border: '1px solid #ff6b9d' }}>
                            <small className="fw-semibold" style={{ color: '#ff6b9d' }}>
                              <i className="fas fa-check-circle me-1"></i>
                              Selected: {file.name}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg rounded-3 py-3 fw-semibold"
                        disabled={isUploading || !file || !title.trim()}
                        style={{
                          background:
                            "linear-gradient(135deg, #ff6b9d, #ff8fab)",
                          border: "none",
                          boxShadow: "0 4px 15px rgba(255, 107, 157, 0.2)",
                        }}
                      >
                        {isUploading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload me-2"></i>
                            Upload File
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {message && (
                    <div
                      className={`alert alert-${messageType} mt-4 rounded-3 border-0`}
                      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                    >
                      <div className="d-flex align-items-center">
                        <i
                          className={`fas ${
                            messageType === "success"
                              ? "fa-check-circle"
                              : messageType === "warning"
                              ? "fa-exclamation-triangle"
                              : "fa-times-circle"
                          } me-2`}
                        ></i>
                        {message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card shadow-lg border-0 rounded-4" style={{ backgroundColor: '#ffffff' }}>
                <div
                  className="card-header text-white py-4 rounded-top-4"
                  style={{
                    background: "linear-gradient(135deg, #ff6b9d, #ff8fab)",
                    border: "none"
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0 fw-semibold">
                      <i className="fas fa-folder-open me-2"></i>
                      Your Uploaded Files
                    </h3>
                    <span className="badge text-dark fs-6 px-3 py-2 rounded-pill" style={{ backgroundColor: '#fef7f7', border: '1px solid #ff6b9d' }}>
                      {phrList.length} files
                    </span>
                  </div>
                </div>

                <div className="card-body p-0" style={{ backgroundColor: '#fef7f7' }}>
                  {isLoading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border mb-3"
                        style={{ width: "3rem", height: "3rem", color: "#ff6b9d" }}
                      ></div>
                      <p className="text-muted">Loading your files...</p>
                    </div>
                  ) : phrList.length === 0 ? (
                    <div className="text-center py-5">
                      <div
                        className="mb-4"
                        style={{ fontSize: "4rem", opacity: 0.3 }}
                      >
                        📁
                      </div>
                      <h4 className="text-muted mb-3">No files uploaded yet</h4>
                      <p className="text-muted">
                        Upload your first PHR file to get started
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0" style={{ backgroundColor: '#ffffff' }}>
                        <thead style={{ backgroundColor: '#fef7f7' }}>
                          <tr>
                            <th
                              className="border-0 py-4 ps-4"
                              style={{ fontWeight: "600", color: '#ff6b9d' }}
                            >
                              #
                            </th>
                            <th
                              className="border-0 py-3"
                              style={{ fontWeight: "600", color: '#ff6b9d' }}
                            >
                              Document
                            </th>
                            <th
                              className="border-0 py-4"
                              style={{ fontWeight: "600", color: '#ff6b9d' }}
                            >
                              Uploaded
                            </th>
                            <th
                              className="border-0 py-4 text-center"
                              style={{ fontWeight: "600", color: '#ff6b9d' }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {phrList.map((file, index) => (
                            <tr key={file._id} className="border-bottom" style={{ backgroundColor: '#ffffff' }}>
                              <td className="py-4 ps-4 align-middle">
                                <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#ff6b9d', color: 'white' }}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-4 align-middle">
                                <div className="d-flex align-items-center">
                                  <span
                                    className="me-3"
                                    style={{ fontSize: "1.5rem", color: "#ff6b9d" }}
                                  >
                                    {getFileIcon(file.name)}
                                  </span>
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {file.title}
                                    </div>
                                    <small className="text-muted">
                                      {file.size && formatFileSize(file.size)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 align-middle">
                                <div className="text-muted">
                                  <div>
                                    {new Date(
                                      file.timeStamp || file.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                  <small>
                                    {new Date(
                                      file.timeStamp || file.createdAt
                                    ).toLocaleTimeString()}
                                  </small>
                                </div>
                              </td>
                              <td className="py-4 align-middle text-center">
                                <div className="btn-group" role="group">
                                  <a
                                    href={file.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm rounded-3 me-2 text-white"
                                    style={{ 
                                      minWidth: "80px",
                                      backgroundColor: "#ff6b9d",
                                      border: "none"
                                    }}
                                  >
                                    <i className="fas fa-eye me-1"></i>
                                    View
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </>
  );
}

export default Phr;