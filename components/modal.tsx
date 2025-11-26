"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";

type ModalProps = {
  onClose: () => void;
  giveVal: (value: boolean) => void;
  children: React.ReactNode;
  title?: string;
};

const Modal: React.FC<ModalProps> = ({ onClose, giveVal, children, title }) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      setMounted(false);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    giveVal(false);
    onClose();
  };

  const handleOkayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    giveVal(true);
    onClose();
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-card border border-border shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={handleCloseClick}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </button>
          {title && (
            <h2 className="text-lg font-semibold text-card-foreground">
              {title}
            </h2>
          )}
          <button
            onClick={handleOkayClick}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Confirm"
          >
            <Check className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Confirm</span>
          </button>
        </div>
        <div className="p-6 text-card-foreground">{children}</div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};

export default Modal;