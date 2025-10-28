import React, { useState } from 'react';
import axios from 'axios';
import Footer from '../utils/footer';
import { toast } from "react-toastify";

function Parser() {
  const [pdf, setPdf] = useState(null);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);

  const uploadPdf = async () => {
    if (!pdf) {
      toast.error('Please select a PDF file first');
      return;
    }
    
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadInfo(null);
    
    console.log('Selected file:', pdf);
    console.log('File type:', pdf.type);
    console.log('File size:', pdf.size);
    
    const formData = new FormData();
    formData.append('pdf', pdf);
    
    // Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log('FormData entry:', key, value);
    }

    try {
      const response = await axios.post('/api/pdf-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 60 seconds timeout for large files
      });
      
      setUploadSuccess(true);
      setUploadInfo(response.data);
      toast.success('PDF uploaded successfully');
      console.log('Upload response:', response.data);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadSuccess(false);
      
      let errorMessage = 'Upload failed: ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try with a smaller file.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (!uploadSuccess) {
      toast.error('Please upload a PDF file first');
      return;
    }
    
    setIsAsking(true);
    setAnswer('');
    
    try {
      const res = await axios.post('/api/ask', { 
        query: query.trim() 
      }, {
        timeout: 45000, // 45 seconds timeout for AI processing
      });
      
      setAnswer(res.data.answer);
    } catch (error) {
      console.error('Ask error:', error);
      
      let errorMessage = 'Failed to get answer: ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again with a simpler question.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message;
      }
      
      setAnswer(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <>
      <div className="min-vh-100" style={{ backgroundColor: '#fff0f5' }}>
        <div className="container py-5">  
          <div className="row mb-5">
            <div className="col-12">
              <div className="text-center mb-4">
                &#128308; AI Document Analysis
                <br />
                <br />
                <span style={{ fontSize: "50px", fontWeight: "bold" }}>
                  Chat with <span className="back">Vaidya</span>
                </span>
                <br />
                <br />
                Upload your Med documents and get instant answers using AI
                <br />
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
                    <i className="fas fa-file-pdf me-2"></i>
                    Upload PDF Document
                  </h3>
                </div>
                <div className="card-body p-5" style={{ backgroundColor: '#fef7f7' }}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark mb-3">
                      Choose PDF File
                    </label>
                    <div className="position-relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-control form-control-lg border-2 rounded-3"
                        onChange={e => setPdf(e.target.files[0])}
                        style={{
                          height: "50px",
                          paddingTop: "10px",
                          fontSize: "1rem",
                          border: pdf ? "2px solid #ff6b9d" : "2px dashed #dee2e6",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      {pdf && (
                        <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#ffffff', border: '1px solid #ff6b9d' }}>
                          <small className="fw-semibold" style={{ color: '#ff6b9d' }}>
                            <i className="fas fa-check-circle me-1"></i>
                            Selected: {pdf.name} ({(pdf.size / (1024 * 1024)).toFixed(2)} MB)
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      onClick={uploadPdf}
                      className="btn btn-primary btn-lg rounded-3 py-3 fw-semibold"
                      disabled={!pdf || isUploading}
                      style={{
                        background: isUploading 
                          ? "linear-gradient(135deg, #cccccc, #999999)" 
                          : "linear-gradient(135deg, #ff6b9d, #ff8fab)",
                        border: "none",
                        boxShadow: "0 4px 15px rgba(255, 107, 157, 0.2)",
                      }}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing PDF...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload me-2"></i>
                          Upload PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-lg border-0 rounded-4" style={{ backgroundColor: '#ffffff' }}>
                <div
                  className="card-header text-white py-4 rounded-top-4"
                  style={{
                    background: "linear-gradient(135deg, #ff6b9d, #ff8fab)",
                    border: "none"
                  }}
                >
                  <h3 className="mb-0 fw-semibold">
                    <i className="fas fa-question-circle me-2"></i>
                    Ask Questions
                  </h3>
                </div>

                <div className="card-body p-5" style={{ backgroundColor: '#fef7f7' }}>
                  {!uploadSuccess && (
                    <div className="alert alert-warning border-0 rounded-3 mb-4" style={{ 
                      background: 'linear-gradient(45deg, #fff8e1, #ffecb3)',
                      borderLeft: '4px solid #ff9800'
                    }}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle me-2" style={{ color: '#f57c00' }}></i>
                        <small className="mb-0" style={{ color: '#ef6c00' }}>
                          Please upload a PDF document first before asking questions.
                        </small>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark mb-3">
                      Your Question
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ask a question about your PDF..."
                        className="form-control form-control-lg border-2 rounded-start-3"
                        style={{
                          fontSize: "1rem",
                          border: "2px solid #dee2e6",
                          backgroundColor: '#ffffff'
                        }}
                        on KeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            askQuestion();
                          }
                        }}
                      />
                      <button
                        onClick={askQuestion}
                        className="btn btn-lg rounded-end-3"
                        disabled={!query.trim() || !uploadSuccess || isAsking}
                        style={{
                          background: (!query.trim() || !uploadSuccess || isAsking)
                            ? "linear-gradient(135deg, #cccccc, #999999)"
                            : "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                          border: "none",
                          color: "white",
                          paddingLeft: "30px",
                          paddingRight: "30px"
                        }}
                      >
                        {isAsking ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Asking...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Ask
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isAsking && (
                    <div className="mt-4">
                      <div className="alert alert-info border-0 rounded-3" style={{ 
                        background: 'linear-gradient(45deg, #e3f2fd, #bbdefb)',
                        borderLeft: '4px solid #2196f3'
                      }}>
                        <div className="d-flex align-items-center">
                          <div className="spinner-border spinner-border-sm me-3" role="status" style={{ color: '#2196f3' }}>
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div>
                            <h6 className="fw-semibold mb-1" style={{ color: '#1976d2' }}>Processing your question...</h6>
                            <small className="text-muted">This may take a few moments</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {answer && !isAsking && (
                    <div className="mt-4">
                      <div className={`alert border-0 rounded-3 ${answer.startsWith('Error:') ? 'alert-danger' : 'alert-info'}`} style={{ 
                        background: answer.startsWith('Error:') 
                          ? 'linear-gradient(45deg, #ffebee, #ffcdd2)'
                          : 'linear-gradient(45deg, #e3f2fd, #bbdefb)',
                        borderLeft: answer.startsWith('Error:') 
                          ? '4px solid #f44336'
                          : '4px solid #2196f3'
                      }}>
                        <div className="d-flex align-items-start">
                          <i className={`${answer.startsWith('Error:') ? 'fas fa-exclamation-triangle' : 'fas fa-robot'} me-3 mt-1`} 
                             style={{ 
                               color: answer.startsWith('Error:') ? '#d32f2f' : '#2196f3', 
                               fontSize: '1.2rem' 
                             }}>
                          </i>
                          <div>
                            <h6 className="fw-semibold mb-2" style={{ 
                              color: answer.startsWith('Error:') ? '#d32f2f' : '#1976d2' 
                            }}>
                              {answer.startsWith('Error:') ? 'Error:' : 'AI Answer:'}
                            </h6>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                              {answer.startsWith('Error:') ? answer.substring(6) : answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Parser;
