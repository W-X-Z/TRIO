import React, { useEffect } from 'react';
import './Toast.css';
import { ToastState } from '../types/types';

interface ToastProps {
  toast: ToastState;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>;
}

const Toast: React.FC<ToastProps> = ({ toast, setToast }) => {
  useEffect(() => {
    // 토스트 메시지가 보이면 3초 후에 자동으로 사라지게 함
    if (toast.isVisible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.isVisible, setToast]);

  if (!toast.isVisible) return null;

  return (
    <div className={`toast ${toast.type}`}>
      {toast.message}
    </div>
  );
};

export default Toast; 