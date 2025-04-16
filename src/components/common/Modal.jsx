import React from "react";

const Modal = ({ children, onClose, backdropClosable }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
    onClick={backdropClosable ? onClose : undefined}
    style={{ overflowY: 'auto' }}
  >
    <div
      className="bg-white rounded-xl shadow-lg max-w-lg w-full relative"
      onClick={e => e.stopPropagation()}
      style={{ maxHeight: '90vh', overflowY: 'auto' }}
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default Modal;
