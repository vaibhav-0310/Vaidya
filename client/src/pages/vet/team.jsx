import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function Team({ name, image, post, _id }) {
  return (
    <div className="w-100">
      <div
        className="card shadow-sm rounded-4 overflow-hidden position-relative h-100"
      >
        <img
          src={image}
          alt={name}
          className="card-img-top"
          style={{ height: '400px', objectFit: 'cover' }}
        />
        <div
          className="position-absolute w-100 d-flex justify-content-between align-items-center px-3 py-2"
          style={{
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div>
            <h5 className="mb-0">{name}</h5>
            <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
              {post}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link
              to={`/chat/${_id}`}
              className="d-flex align-items-center justify-content-center rounded-circle text-decoration-none"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#e6f3ff',
                color: '#0066cc',
              }}
              title="Chat with doctor"
            >
              <MessageCircle size={18} />
            </Link>
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#f0e6fc',
                color: '#7b2cbf',
                cursor: 'pointer',
              }}
            >
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Team;