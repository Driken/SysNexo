import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { UserForm } from './UserForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: any;
  onDelete: (user: any) => void;
  onInactivate: (user: any) => void;
}

export const UsuariosModal: React.FC<Props> = ({
  isOpen, onClose, userToEdit, onDelete, onInactivate
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        zIndex: 1000
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        style={{
          width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
          position: 'relative', padding: '0', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        <UserForm
          userToEdit={userToEdit}
          onSave={onClose}
          onCancel={onClose}
          onDelete={onDelete}
          onInactivate={onInactivate}
        />
      </div>
    </div>
  );
};
