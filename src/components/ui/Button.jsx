import React from 'react';

const ARAD_BLUE = '#02192c';

const Button = ({ children, onClick, variant = 'primary', icon: Icon, className = '', disabled = false, title = '' }) => {
    const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed print:hidden";
    const primaryStyle = { backgroundColor: ARAD_BLUE, color: 'white' };
    const hoverPrimary = "hover:opacity-90 shadow-sm";

    const variants = {
        primary: "",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        icon: "p-2 bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseStyle} ${variant !== 'primary' ? variants[variant] : hoverPrimary} ${className}`}
            style={variant === 'primary' ? primaryStyle : {}}
        >
            {Icon && <Icon size={16} className={children ? "mr-2" : ""} />}
            {children}
        </button>
    );
};

export default Button;
