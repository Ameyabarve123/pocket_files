import { X } from "lucide-react";
type AlertType = "Success" | "Error" | "Warning";

type AlertProps = {
  type: AlertType;
  message: string;
  onClose: () => void;
};

const backgroundColors = {
  Success: "#22C55E",
  Error: "#EF4444",
  Warning: "#F97316",
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  return (
    <div
      className="alert-box flex w-full rounded-lg flex-col max-w-[400px] mx-4 sm:mx-0 sm:ml-5 transform items-start justify-start gap-4 bg-black dark:bg-white transition delay-200 duration-500 ease-in-out"
      style={{ zIndex: "100" }}
    >
      <div className="flex w-full items-start justify-between p-3">
        <span className="font-Inter text-[13px] sm:text-sm font-medium leading-tight text-white dark:text-black pr-2">
          {message}
        </span>
        <button
          className="cursor-pointer duration-300 text-white dark:text-black hover:opacity-70 flex-shrink-0"
          onClick={onClose}
          aria-label="Close alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div
        style={{
          backgroundColor: backgroundColors[type],
        }}
        className="flex h-4 w-full items-center justify-center rounded-b-lg"
      ></div>
    </div>
  );
};

export default Alert;