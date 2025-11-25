import { useEffect } from "react"

interface CustomModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  handleClose: () => void;
}

const CustomModal = ({
  children,
  isOpen,
  handleClose
}: CustomModalProps ) => {
  // close modal on escape key
  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) =>
      e.key === 'Escape' ? handleClose(): null;
    document.body.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.removeEventListener('keydown', closeOnEscape)
    };
  }, [handleClose]);

  // disable scroll on modal load 
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return (): void => {
      document.body.style.overflow = 'unset';
    };
  }, [handleClose])


  if (!isOpen) return null;

  return (
    <div>
      <h1>YO</h1>
      <button
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  )
}

export default CustomModal

