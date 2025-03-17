// components/common/Card.jsx
import React from "react";
import PropTypes from "prop-types";

const Card = ({ 
  children, 
  title,
  className = "",
  headerRight,
  ...props 
}) => {
  return (
    <div 
      className={`bg-slate-900 p-6 rounded-xl shadow-sm ${className}`}
      {...props}
    >
      {(title || headerRight) && (
        <div className="flex justify-between items-center mb-6">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node,
  className: PropTypes.string,
  headerRight: PropTypes.node,
};

export default React.memo(Card);