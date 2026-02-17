import React from 'react';

const ARAD_GOLD = '#bf9000';

const Card = ({ children, className = '', title, icon: Icon, action, noPadding = false }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className} print:shadow-none print:border-gray-300`}>
        {(title || Icon) && (
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {Icon && <Icon size={18} style={{ color: ARAD_GOLD }} />}
                    {title}
                </h3>
                {action}
            </div>
        )}
        <div className={noPadding ? '' : 'p-6'}>
            {children}
        </div>
    </div>
);

export default Card;
