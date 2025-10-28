import React, { useState,useEffect } from 'react';
import axios from 'axios';
import Footer from '../footer';

function Diabetes() {
   useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  let [essentialsData, setEssentialsData] = React.useState([]);
  const [formData, setFormData] = useState({
    pregnancies: '',
    glucose: '',
    bloodPressure: '',
    skinThickness: '',
    insulin: '',
    bmi: '',
    diabetesPedigreeFunction: '',
    age: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      // Use relative path so the same proxy/setup used by other parts of the app applies
      const response = await axios.post('http://localhost:5000/api/predict', formData,{withCredentials:false});
      // Expecting response.data to include { prediction: 0|1, probability, accuracy, risk_level }
      setPrediction(response.data);
    } catch (err) {
      setError('Prediction failed. Please check your inputs or try again later.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pregnancies: '',
      glucose: '',
      bloodPressure: '',
      skinThickness: '',
      insulin: '',
      bmi: '',
      diabetesPedigreeFunction: '',
      age: ''
    });
    setPrediction(null);
    setError('');
  };

  return (
    <>
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-3">Diabetes Risk Prediction</h2>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Pregnancies</label>
                    <input
                      className="form-control"
                      type="number"
                      name="pregnancies"
                      value={formData.pregnancies}
                      onChange={handleChange}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Glucose (mg/dL) *</label>
                    <input
                      className="form-control"
                      type="number"
                      name="glucose"
                      value={formData.glucose}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Pressure (mmHg)</label>
                    <input
                      className="form-control"
                      type="number"
                      name="bloodPressure"
                      value={formData.bloodPressure}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Skin Thickness (mm)</label>
                    <input
                      className="form-control"
                      type="number"
                      name="skinThickness"
                      value={formData.skinThickness}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Insulin (mu U/ml)</label>
                    <input
                      className="form-control"
                      type="number"
                      name="insulin"
                      value={formData.insulin}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">BMI *</label>
                    <input
                      className="form-control"
                      type="number"
                      name="bmi"
                      value={formData.bmi}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Diabetes Pedigree Function</label>
                    <input
                      className="form-control"
                      type="number"
                      name="diabetesPedigreeFunction"
                      value={formData.diabetesPedigreeFunction}
                      onChange={handleChange}
                      min="0"
                      step="0.001"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age *</label>
                    <input
                      className="form-control"
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      min="1"
                      max="120"
                      step="1"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Predicting...' : 'Predict'}
                  </button>
                  <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                    Reset
                  </button>
                </div>
              </form>

              {error && (
                <div className="alert alert-danger mt-3">{error}</div>
              )}

              {prediction && (
                <div className="mt-4">
                  <h5>Prediction Result</h5>
                  <div className={`card mt-2 ${prediction.prediction === 1 ? 'text-white bg-danger' : 'text-white bg-success'}`}>
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2">
                        {prediction.prediction === 1 ? 'Patient is diabetic' : 'Patient is not diabetic'}
                      </h6>
                      {typeof prediction.probability === 'number' && (
                        <p className="mb-1"><strong>Probability:</strong> {(prediction.probability * 100).toFixed(1)}%</p>
                      )}
                      {prediction.risk_level && (
                        <p className="mb-1"><strong>Risk Level:</strong> {prediction.risk_level}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-muted small mt-2">⚠️ This prediction is for personal use only. Consult a healthcare professional for medical advice.</p>
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

export default Diabetes;