// components/common/Button.jsx
import React from "react";
import PropTypes from "prop-types";

const VARIANT_STYLES = {
  primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
  secondary: "bg-slate-800 hover:bg-slate-700 text-white",
  danger: "bg-red-600 hover:bg-red-500 text-white",
  amber: "bg-amber-600 hover:bg-amber-500 text-white",
  blue: "bg-blue-600 hover:bg-blue-500 text-white",
};

const SIZE_STYLES = {
  sm: "py-1.5 px-3 text-xs",
  md: "py-2 px-4 text-sm",
  lg: "py-2.5 px-5 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  title,
  type = "button",
  ...props
}) => {
  const baseStyles = "rounded-lg font-medium transition-colors flex items-center justify-center";
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const disabledStyle = disabled ? "opacity-60 cursor-not-allowed" : "";
  
  const combinedStyles = `${baseStyles} ${variantStyle} ${sizeStyle} ${disabledStyle} ${className}`;

  return (
    <button
      type={type}
      className={combinedStyles}
      disabled={disabled}
      onClick={onClick}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(Object.keys(VARIANT_STYLES)),
  size: PropTypes.oneOf(Object.keys(SIZE_STYLES)),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  title: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

export default React.memo(Button);